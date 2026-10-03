import { describe, it, expect, beforeEach } from "vitest";
import {
  deadlineFromSeconds,
  formatCountdown,
  isAccountStateRoute,
  parseDeadline,
  readSuspensionNotice,
  routeForLoginFailure,
  safeRedirectPath,
  saveSuspensionNotice,
  secondsUntil,
} from "@/lib/routing/accountState";

const NOW = 1_790_000_000_000;

describe("routeForLoginFailure", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("sends a suspended account to /account-suspended and keeps the reason out of the URL", () => {
    const to = routeForLoginFailure(
      {
        code: "AUTH_ACCOUNT_SUSPENDED",
        status: 403,
        details: {
          suspension_reason: "Fraudulent bookings",
          suspended_at: "2026-09-14T10:30:00.000Z",
        },
      },
      NOW,
    );
    expect(to).toBe("/account-suspended");
    expect(readSuspensionNotice()).toEqual({
      reason: "Fraudulent bookings",
      suspendedAt: "2026-09-14T10:30:00.000Z",
    });
  });

  it("sends a lockout to /account-locked with an absolute deadline", () => {
    const to = routeForLoginFailure(
      { code: "AUTH_ACCOUNT_LOCKED", status: 401, details: { retry_after_seconds: 840 } },
      NOW,
    );
    expect(to).toBe(`/account-locked?until=${NOW + 840_000}`);
  });

  it("still routes a lockout without a usable time, but invents none", () => {
    expect(routeForLoginFailure({ code: "AUTH_ACCOUNT_LOCKED", status: 401 }, NOW)).toBe(
      "/account-locked",
    );
  });

  it("sends a 429 to /rate-limit, back to /login, with Retry-After when known", () => {
    expect(
      routeForLoginFailure({ status: 429, details: { retry_after_seconds: 42 } }, NOW),
    ).toBe(`/rate-limit?next=%2Flogin&until=${NOW + 42_000}`);
    expect(routeForLoginFailure({ status: 429 }, NOW)).toBe("/rate-limit?next=%2Flogin");
  });

  it("leaves wrong passwords and unknown failures on the login form", () => {
    expect(routeForLoginFailure({ code: "AUTH_INVALID_CREDENTIALS", status: 401 }, NOW)).toBeNull();
    expect(routeForLoginFailure({ status: 500 }, NOW)).toBeNull();
  });
});

describe("suspension notice storage", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("normalises a blank reason and a bad date to null", () => {
    saveSuspensionNotice({ suspension_reason: "   ", suspended_at: "not a date" });
    expect(readSuspensionNotice()).toEqual({ reason: null, suspendedAt: null });
  });

  it("caps an over-long reason at the API's 500 characters", () => {
    saveSuspensionNotice({ suspension_reason: "x".repeat(900) });
    expect(readSuspensionNotice()?.reason).toHaveLength(500);
  });

  it("returns null when nothing was saved or storage holds junk", () => {
    expect(readSuspensionNotice()).toBeNull();
    window.sessionStorage.setItem("binectics:suspension-notice", "{not json");
    expect(readSuspensionNotice()).toBeNull();
  });
});

describe("deadlines", () => {
  it("rejects non-positive or non-numeric seconds", () => {
    expect(deadlineFromSeconds(0, NOW)).toBeNull();
    expect(deadlineFromSeconds(-5, NOW)).toBeNull();
    expect(deadlineFromSeconds("soon", NOW)).toBeNull();
    expect(deadlineFromSeconds(undefined, NOW)).toBeNull();
  });

  it("parses an until value and refuses junk or a far-future one", () => {
    expect(parseDeadline(String(NOW + 60_000), NOW)).toBe(NOW + 60_000);
    expect(parseDeadline("abc", NOW)).toBeNull();
    expect(parseDeadline(null, NOW)).toBeNull();
    expect(parseDeadline(String(NOW + 2 * 24 * 3600_000), NOW)).toBeNull();
  });

  it("counts down in whole seconds and formats mm:ss / h:mm:ss", () => {
    expect(secondsUntil(NOW + 1_500, NOW)).toBe(2);
    expect(secondsUntil(NOW - 1, NOW)).toBe(0);
    expect(secondsUntil(null, NOW)).toBe(0);
    expect(formatCountdown(14 * 60 + 5)).toBe("14:05");
    expect(formatCountdown(3600 + 61)).toBe("1:01:01");
  });
});

describe("safeRedirectPath / isAccountStateRoute", () => {
  it("accepts same-origin paths only", () => {
    expect(safeRedirectPath("/dashboard/member?tab=1")).toBe("/dashboard/member?tab=1");
    expect(safeRedirectPath("https://evil.com")).toBeNull();
    expect(safeRedirectPath("//evil.com")).toBeNull();
    expect(safeRedirectPath("/\\evil.com")).toBeNull();
    expect(safeRedirectPath(null)).toBeNull();
  });

  it("knows the account-state pages", () => {
    expect(isAccountStateRoute("/session-expired")).toBe(true);
    expect(isAccountStateRoute("/account-locked")).toBe(true);
    expect(isAccountStateRoute("/account-lockedx")).toBe(false);
    expect(isAccountStateRoute("/dashboard")).toBe(false);
  });
});
