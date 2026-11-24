import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

let pathname = "/dashboard/member";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", role: "USER", first_name: "Chidi", last_name: "O" }, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));
vi.mock("@/components/messaging/queries", () => ({ useMessagingUnread: () => 0 }));
vi.mock("@/hooks/useCommandBar", () => ({ openCommandBar: vi.fn() }));
vi.mock("@/hooks/useWorkspaceSwitch", () => ({ useWorkspaceSwitch: () => null }));
vi.mock("@/lib/api/paidContent", () => ({
  paidContentService: { myEntitlements: vi.fn().mockResolvedValue({ success: true, data: { items: [] } }) },
}));
vi.mock("@/hooks/useFeatureFlags", () => ({ useFeatureFlags: () => ({ isEnabled: () => false, data: undefined, isLoading: false }) }));
const solo = vi.hoisted(() => ({ answer: false as boolean | null }));
vi.mock("@/hooks/useIsSoloMember", () => ({ useIsSoloMember: () => ({ solo: solo.answer, isLoading: false }) }));

import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { isTrackingPage, trackingNavLinks } from "@/lib/solo/nav";

function stubViewport(desktop: boolean) {
  const mql = {
    matches: desktop,
    media: "(min-width: 64rem)",
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => true,
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mql));
}
const renderShell = (activeLabel = "Home") =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemberDashboardShell activeLabel={activeLabel}>
        <p>content</p>
      </MemberDashboardShell>
    </QueryClientProvider>,
  );
const mainNav = () => screen.getByRole("navigation", { name: "Main navigation" });

const TRACKING = [
  ["Fasting", "/dashboard/member/fasting"],
  ["Water", "/dashboard/member/water"],
  ["Progress", "/dashboard/member/progress"],
  ["Daily list", "/dashboard/member/today-list"],
  ["Log", "/dashboard/member/log"],
];

beforeEach(() => {
  stubViewport(true);
  pathname = "/dashboard/member";
  solo.answer = false;
  window.sessionStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("coached member nav: own tools are reachable (parity gap 2)", () => {
  it("adds one Tracking menu right after Home, not five more links", () => {
    renderShell();
    const nav = mainNav();
    const button = within(nav).getByRole("button", { name: /Tracking/ });
    // Home, then Tracking: the order in the DOM.
    const home = within(nav).getByRole("link", { name: "Home" });
    expect(home.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // Closed: none of its links are in the bar yet.
    expect(within(nav).queryByRole("link", { name: "Fasting" })).toBeNull();
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("opens with the keyboard, lists Fasting, Water, Progress, Daily list and Log, and closes on Escape", async () => {
    const user = userEvent.setup();
    renderShell();
    const button = within(mainNav()).getByRole("button", { name: /Tracking/ });
    button.focus();
    await user.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    for (const [label, href] of TRACKING) {
      expect(within(mainNav()).getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
    await user.keyboard("{Escape}");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();
  });

  it("marks Tracking current on a tracking page, and the page inside it", async () => {
    const user = userEvent.setup();
    pathname = "/dashboard/member/water";
    renderShell("Water");
    const button = within(mainNav()).getByRole("button", { name: /Tracking/ });
    expect(button.className).toContain("font-medium");
    await user.click(button);
    expect(within(mainNav()).getByRole("link", { name: "Water" })).toHaveAttribute("aria-current", "page");
  });

  it("lists the same tools under Tracking in the phone menu", async () => {
    stubViewport(false);
    const user = userEvent.setup();
    renderShell();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    const group = screen.getByRole("group", { name: "Tracking" });
    for (const [label, href] of TRACKING) {
      expect(within(group).getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("leaves the solo bar as it was: its own links, no Tracking menu", () => {
    solo.answer = true;
    renderShell();
    const nav = mainNav();
    expect(within(nav).queryByRole("button", { name: /Tracking/ })).toBeNull();
    expect(within(nav).getAllByRole("link").map((a) => a.textContent)).toEqual([
      "Today",
      "Fasting",
      "Water",
      "Progress",
      "Log",
      "Explore",
    ]);
  });

  it("knows the tracking pages by label or address", () => {
    expect(trackingNavLinks().map((l) => l.label)).toEqual(TRACKING.map(([l]) => l));
    expect(isTrackingPage("Fasting", null)).toBe(true);
    expect(isTrackingPage("Today", null)).toBe(true);
    expect(isTrackingPage("", "/dashboard/member/weight-log")).toBe(true);
    expect(isTrackingPage("Billing", "/dashboard/member/billing")).toBe(false);
    expect(isTrackingPage("Home", "/dashboard/member")).toBe(false);
  });
});
