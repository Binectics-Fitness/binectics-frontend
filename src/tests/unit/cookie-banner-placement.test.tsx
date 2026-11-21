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
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

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
});
