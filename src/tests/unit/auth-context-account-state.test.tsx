import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { useEffect } from "react";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("@/components/SessionModal", () => ({ default: () => null }));
vi.mock("@/lib/push/push", () => ({ teardownPush: vi.fn() }));

const authService = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
  getCurrentUser: vi.fn().mockReturnValue(null),
  refreshUserFromApi: vi.fn().mockResolvedValue(null),
  refreshToken: vi.fn(),
  register: vi.fn(),
  updateUser: vi.fn(),
}));
vi.mock("@/lib/api/auth", () => ({ authService }));

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { readSuspensionNotice } from "@/lib/routing/accountState";

const holder: { current: ReturnType<typeof useAuth> | null } = { current: null };
function Probe() {
  const value = useAuth();
  useEffect(() => {
    holder.current = value;
  });
  return null;
}

let auth: ReturnType<typeof useAuth>;
function mount() {
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
  auth = holder.current!;
}

describe("AuthContext routes refused sign-ins to their pages", () => {
  beforeEach(() => {
    push.mockClear();
    window.sessionStorage.clear();
  });

  it("suspended → /account-suspended with the reason in session storage", async () => {
    authService.login.mockResolvedValue({
      success: false,
      status: 403,
      code: "AUTH_ACCOUNT_SUSPENDED",
      message: "Your account has been suspended",
      details: { suspension_reason: "Fraudulent bookings", suspended_at: null },
    });
    mount();

    let result: Awaited<ReturnType<typeof auth.login>> | undefined;
    await act(async () => {
      result = await auth.login({ email: "a@b.co", password: "pw" });
    });

    expect(result?.success).toBe(false);
    expect(push).toHaveBeenCalledWith("/account-suspended");
    expect(readSuspensionNotice()).toEqual({ reason: "Fraudulent bookings", suspendedAt: null });
  });

  it("locked → /account-locked with the deadline", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_790_000_000_000);
    authService.login.mockResolvedValue({
      success: false,
      status: 401,
      code: "AUTH_ACCOUNT_LOCKED",
      message: "Account is locked. Try again in 14 minutes",
      details: { retry_after_seconds: 840 },
    });
    mount();

    await act(async () => {
      await auth.login({ email: "a@b.co", password: "pw" });
    });

    expect(push).toHaveBeenCalledWith(`/account-locked?until=${1_790_000_000_000 + 840_000}`);
    vi.restoreAllMocks();
  });

  it("a wrong password stays on the form", async () => {
    authService.login.mockResolvedValue({
      success: false,
      status: 401,
      code: "AUTH_INVALID_CREDENTIALS",
      message: "Authentication failed",
    });
    mount();

    let result: Awaited<ReturnType<typeof auth.login>> | undefined;
    await act(async () => {
      result = await auth.login({ email: "a@b.co", password: "pw" });
    });

    expect(push).not.toHaveBeenCalled();
    expect(result?.error).toBe("Authentication failed");
  });
});

describe("AuthContext logout destination", () => {
  let assign: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    assign = vi.fn();
    vi.stubGlobal("location", { pathname: "/dashboard/settings/account", search: "", assign });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("goes to the page asked for (e.g. /account-deleted)", async () => {
    mount();
    await act(async () => {
      await auth.logout({ to: "/account-deleted" });
    });
    expect(assign).toHaveBeenCalledWith("/account-deleted");
  });

  it("falls back to the login page for an off-site destination or an event object", async () => {
    mount();
    await act(async () => {
      await auth.logout({ to: "//evil.com" });
    });
    expect(assign).toHaveBeenLastCalledWith("/login");

    await act(async () => {
      await auth.logout({ type: "click" } as unknown as { to?: string });
    });
    expect(assign).toHaveBeenLastCalledWith("/login");
  });
});

describe("AuthContext register", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("a normal sign-up goes to the OTP screen", async () => {
    authService.register.mockResolvedValue({ success: true, data: { id: "u1", email: "a@b.co" } });
    mount();
    let result: Awaited<ReturnType<typeof auth.register>> | undefined;
    await act(async () => {
      result = await auth.register({ first_name: "A", last_name: "B", email: "a@b.co", password: "pw", accept_tos: true });
    });
    expect(result).toEqual({ success: true });
    expect(push).toHaveBeenCalledWith("/verification?email=a%40b.co");
  });

  it("an unclaimed placeholder gets a set-password link, never the OTP screen", async () => {
    authService.register.mockResolvedValue({
      success: true,
      message: "We emailed you a link to set your password. Use it to finish creating your account.",
      data: { claim_link_sent: true, email: "a@b.co" },
    });
    mount();
    let result: Awaited<ReturnType<typeof auth.register>> | undefined;
    await act(async () => {
      result = await auth.register({ first_name: "A", last_name: "B", email: "a@b.co", password: "pw", accept_tos: true });
    });
    expect(result).toEqual({ success: true, claimLinkSent: true });
    expect(push).not.toHaveBeenCalled();
  });
});
