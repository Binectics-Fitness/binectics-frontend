import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

import SuspendedNotice from "@/app/account-suspended/SuspendedNotice";
import LockedNotice from "@/app/account-locked/LockedNotice";
import AccountDeletedPage from "@/app/account-deleted/page";
import SessionExpiredNotice from "@/app/session-expired/SessionExpiredNotice";
import RateLimitNotice from "@/app/rate-limit/RateLimitNotice";
import { saveSuspensionNotice } from "@/lib/routing/accountState";

// Content the old static mockups invented; none of it may come back.
const INVENTED = /chargeback|May 24|Andile|Trust team|30 days remaining|Cape Town|DEL-2026|60 req|South African tax|7 years|within 24 hours|5 business days/i;

describe("/account-suspended", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("shows the reason and date the API gave the account owner, as text", () => {
    saveSuspensionNotice({
      suspension_reason: "<b>Fraudulent</b> bookings",
      suspended_at: "2026-09-14T10:30:00.000Z",
    });
    const { container } = render(<SuspendedNotice />);

    expect(screen.getByText("<b>Fraudulent</b> bookings")).toBeInTheDocument();
    expect(container.querySelector("b")).toBeNull();
    expect(screen.getByText("Suspended")).toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it("shows only the generic copy when it has no details, and nothing invented", () => {
    const { container } = render(<SuspendedNotice />);
    expect(screen.getByRole("heading")).toHaveTextContent("Your account is suspended.");
    expect(screen.queryByText("Reason")).toBeNull();
    expect(container.textContent).not.toMatch(INVENTED);
  });

  it("points appeals at /contact, not an invented address", () => {
    const { container } = render(<SuspendedNotice />);
    expect(screen.getByRole("link", { name: "Contact us" })).toHaveAttribute("href", "/contact");
    expect(container.textContent).not.toMatch(/@binectics\.com/);
  });
});

describe("/account-locked", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("counts down to the deadline the login page passed", () => {
    vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
    searchParams = new URLSearchParams({ until: String(Date.now() + 14 * 60_000 + 5_000) });
    render(<LockedNotice />);

    expect(screen.getByRole("timer")).toHaveTextContent("14:05");
    expect(screen.getByText(/Try again in 15 minutes/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(15 * 60_000);
    });
    expect(screen.queryByRole("timer")).toBeNull();
    expect(screen.getByText(/You can try signing in again/)).toBeInTheDocument();
  });

  it("offers Reset password for an email or account lock", () => {
    for (const scope of ["email", "account"]) {
      searchParams = new URLSearchParams({ until: String(Date.now() + 120_000), scope });
      const { unmount } = render(<LockedNotice />);
      expect(screen.getByRole("link", { name: "Reset password" })).toHaveAttribute(
        "href",
        "/forgot-password",
      );
      expect(screen.getByText(/for this account/)).toBeInTheDocument();
      unmount();
    }
  });

  it("gives a device or network lock a plain wait message, no reset, no 'this account'", () => {
    for (const scope of ["device", "ip"]) {
      searchParams = new URLSearchParams({ until: String(Date.now() + 120_000), scope });
      const { container, unmount } = render(<LockedNotice />);
      expect(screen.queryByRole("link", { name: "Reset password" })).toBeNull();
      expect(screen.getByRole("link", { name: "Back to sign in" })).toBeInTheDocument();
      expect(container.textContent).not.toMatch(/this account/i);
      expect(container.textContent).toMatch(/this device or network/);
      expect(container.textContent).toMatch(/won't end this pause/);
      unmount();
    }
  });

  it("claims nothing about whose lock it is when the API sent no scope", () => {
    searchParams = new URLSearchParams({ until: String(Date.now() + 120_000) });
    const { container } = render(<LockedNotice />);
    expect(screen.getByRole("link", { name: "Reset password" })).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/this account/i);
  });

  it("announces the wait through a polite live region that changes only a few times", () => {
    vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
    searchParams = new URLSearchParams({ until: String(Date.now() + 150_000) });
    render(<LockedNotice />);
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    // The visible timer is not itself a live region.
    expect(screen.getByRole("timer")).not.toHaveAttribute("aria-live", "polite");

    const heard: string[] = [region.textContent ?? ""];
    for (let i = 0; i < 160; i++) {
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      const now = screen.getByRole("status").textContent ?? "";
      if (now !== heard[heard.length - 1]) heard.push(now);
    }
    expect(heard).toEqual([
      "About 3 minutes left.",
      "About 2 minutes left.",
      "Less than a minute left.",
      "A few seconds left.",
      "The wait is over. You can try again now.",
    ]);
  });

  it("shows no timer when opened without one", () => {
    searchParams = new URLSearchParams();
    const { container } = render(<LockedNotice />);
    expect(screen.queryByRole("timer")).toBeNull();
    expect(container.textContent).not.toMatch(INVENTED);
    expect(container.textContent).not.toMatch(/unlock instantly/i);
  });
});

describe("/account-deleted", () => {
  it("states only what the delete endpoint does", () => {
    const { container } = render(<AccountDeletedPage />);
    expect(screen.getByRole("heading")).toHaveTextContent("Your account is deleted.");
    expect(container.textContent).not.toMatch(INVENTED);
    expect(container.textContent).not.toMatch(/Audit ID|blocklist/i);
  });
});

describe("/session-expired", () => {
  it("sends Sign in back to where the user was", () => {
    searchParams = new URLSearchParams({ redirect: "/dashboard/member?tab=plans" });
    render(<SessionExpiredNotice />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login?redirect=%2Fdashboard%2Fmember%3Ftab%3Dplans",
    );
  });

  it("ignores an off-site redirect", () => {
    searchParams = new URLSearchParams({ redirect: "//evil.com" });
    const { container } = render(<SessionExpiredNotice />);
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(container.textContent).not.toMatch(/30 days/);
  });
});

describe("/rate-limit", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("waits out Retry-After, then offers Try again back to the login page", () => {
    vi.setSystemTime(new Date("2026-10-02T12:00:00Z"));
    searchParams = new URLSearchParams({ next: "/login", until: String(Date.now() + 30_000) });
    render(<RateLimitNotice />);

    expect(screen.getByText("Try again in 30s")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Try again" })).toBeNull();

    act(() => {
      vi.advanceTimersByTime(31_000);
    });
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/login");
  });

  it("shows no invented limit or timer without Retry-After", () => {
    searchParams = new URLSearchParams();
    const { container } = render(<RateLimitNotice />);
    expect(screen.queryByRole("timer")).toBeNull();
    expect(screen.getByRole("link", { name: "Try again" })).toHaveAttribute("href", "/");
    expect(container.textContent).not.toMatch(INVENTED);
  });
});
