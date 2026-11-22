import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

let pathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

import CookieConsent from "@/components/CookieConsent";

async function mountAt(path: string) {
  pathname = path;
  window.localStorage.clear();
  render(<CookieConsent />);
  await act(async () => {
    vi.advanceTimersByTime(1000);
  });
}

describe("cookie banner placement", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", "G-TEST123");
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it("shows the banner on an ordinary public page", async () => {
    await mountAt("/pricing");
    expect(screen.getByRole("region", { name: "Cookie consent" })).toBeInTheDocument();
  });

  it.each(["/login", "/forgot-password", "/account-locked", "/account-suspended", "/rate-limit"])(
    "keeps the banner off %s, where it would cover the primary action",
    async (path) => {
      await mountAt(path);
      expect(screen.queryByRole("region", { name: "Cookie consent" })).toBeNull();
      // The small manage-cookies button is still there.
      expect(screen.getByRole("button", { name: "Manage cookies" })).toBeInTheDocument();
    },
  );

  it("renders nothing when no analytics tool is configured (no optional cookies to ask about)", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_ANALYTICS_ID", "");
    await mountAt("/pricing");
    expect(screen.queryByRole("region", { name: "Cookie consent" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Manage cookies" })).toBeNull();
  });

  it("makes rejecting one click, like accepting, and leaves analytics off", async () => {
    await mountAt("/pricing");
    const reject = screen.getByRole("button", { name: "Reject all" });
    expect(screen.getByRole("button", { name: "Accept all" })).toBeInTheDocument();
    act(() => reject.click());
    const saved = JSON.parse(window.localStorage.getItem("binectics-cookies") ?? "{}");
    expect(saved.analytics).toBe(false);
  });

  it("starts with analytics switched off in the preferences dialog", async () => {
    await mountAt("/pricing");
    act(() => screen.getByRole("button", { name: "Customize" }).click());
    const switches = screen.getAllByRole("switch");
    // Essential (locked, on) then Analytics (off).
    expect(switches).toHaveLength(2);
    expect(switches[1]).toHaveAttribute("aria-checked", "false");
  });
});
