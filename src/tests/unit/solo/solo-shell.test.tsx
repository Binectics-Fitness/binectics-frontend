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
  default: ({ children, href, ...rest }: { children: ReactNode; href: string } & Record<string, unknown>) => <a href={href} {...rest}>{children}</a>,
}));
const auth = vi.hoisted(() => ({ role: "USER" }));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", role: auth.role, first_name: "Ada", last_name: "A" }, isLoading: false, logout: vi.fn() }),
}));
vi.mock("../../../components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));
vi.mock("@/components/messaging/queries", () => ({ useMessagingUnread: () => 0 }));
vi.mock("@/hooks/useCommandBar", () => ({ openCommandBar: vi.fn() }));
vi.mock("@/hooks/useWorkspaceSwitch", () => ({ useWorkspaceSwitch: () => null }));
vi.mock("@/lib/api/paidContent", () => ({ paidContentService: { myEntitlements: vi.fn().mockResolvedValue({ success: true, data: { items: [] } }) } }));

const flags = vi.hoisted(() => ({ on: new Set<string>() }));
vi.mock("@/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({ isEnabled: (k: string) => flags.on.has(k), data: undefined, isLoading: false }),
}));
const solo = vi.hoisted(() => ({ answer: null as boolean | null }));
vi.mock("@/hooks/useIsSoloMember", () => ({
  useIsSoloMember: () => ({ solo: solo.answer, isLoading: false }),
}));

import { MEMBER_NAV_LINKS, MemberDashboardShell } from "@/components/ds/MemberDashboardShell";

function stubViewport() {
  const mql = {
    matches: true, media: "(min-width: 64rem)", addEventListener: () => {}, removeEventListener: () => {},
    addListener: () => {}, removeListener: () => {}, onchange: null, dispatchEvent: () => true,
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mql));
}
const renderShell = (activeLabel = "Home") =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemberDashboardShell activeLabel={activeLabel}><p>content</p></MemberDashboardShell>
    </QueryClientProvider>,
  );
const labels = () => within(screen.getByRole("navigation", { name: "Main navigation" })).getAllByRole("link").map((a) => a.textContent);

beforeEach(() => {
  stubViewport();
  pathname = "/dashboard/member";
  auth.role = "USER";
  flags.on = new Set();
  solo.answer = null;
  window.sessionStorage.clear();
  vi.stubEnv("NEXT_PUBLIC_FEATURE_STARTER_PROGRAM", "false");
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("member shell, solo switch OFF", () => {
  it("is exactly the full member bar, whatever the solo answer would be", () => {
    solo.answer = true; // would be solo, but the build switch is off
    renderShell();
    expect(labels()).toEqual(MEMBER_NAV_LINKS.map((l) => l.label));
    expect(labels()).toContain("Billing");
    expect(labels()).not.toContain("Explore");
  });
});

describe("member shell, solo switch ON", () => {
  beforeEach(() => vi.stubEnv("NEXT_PUBLIC_FEATURE_SOLO_MEMBER", "true"));

  it("keeps the full bar while the answer is unknown (no flicker)", () => {
    solo.answer = null;
    renderShell();
    expect(labels()).toContain("Marketplace");
    expect(labels()).not.toContain("Explore");
  });

  it("keeps the full bar for a member who is not solo", () => {
    solo.answer = false;
    renderShell();
    expect(labels()).toContain("Billing");
  });

  it("shows only Today, Log and Explore while no solo flag is on, with no dead Fasting or Progress link", () => {
    solo.answer = true;
    renderShell();
    expect(labels()).toEqual(["Today", "Log", "Explore"]);
  });

  it("adds Water only when solo_water is on", () => {
    solo.answer = true;
    flags.on = new Set(["solo_water"]);
    renderShell();
    expect(labels()).toEqual(["Today", "Water", "Log", "Explore"]);
    expect(screen.getByRole("link", { name: "Water" })).toHaveAttribute("href", "/dashboard/member/water");
    expect(screen.getByRole("link", { name: "Explore" })).toHaveAttribute("href", "/marketplace");
  });

  it("adds Fasting only when solo_fasting is on and Progress only when solo_history is on (W2)", () => {
    solo.answer = true;
    flags.on = new Set(["solo_fasting"]);
    const { unmount } = renderShell();
    expect(labels()).toEqual(["Today", "Fasting", "Log", "Explore"]);
    expect(screen.getByRole("link", { name: "Fasting" })).toHaveAttribute("href", "/dashboard/member/fasting");
    unmount();
    flags.on = new Set(["solo_history"]);
    renderShell();
    expect(labels()).toEqual(["Today", "Progress", "Log", "Explore"]);
    expect(screen.getByRole("link", { name: "Progress" })).toHaveAttribute("href", "/dashboard/member/progress");
  });

  it("orders the whole bar Today, Fasting, Water, Progress, Log, Explore with every flag on, and a targets flag alone adds nothing", () => {
    solo.answer = true;
    flags.on = new Set(["solo_water", "solo_fasting", "solo_history", "solo_targets"]);
    const { unmount } = renderShell();
    expect(labels()).toEqual(["Today", "Fasting", "Water", "Progress", "Log", "Explore"]);
    unmount();
    flags.on = new Set(["solo_targets"]);
    renderShell();
    expect(labels()).toEqual(["Today", "Log", "Explore"]);
  });

  it("marks Today current on the home page and Log current on the weight log", () => {
    solo.answer = true;
    renderShell("Home");
    expect(screen.getByRole("link", { name: "Today" })).toHaveAttribute("aria-current", "page");
  });
  it("marks Log current on an existing log page", () => {
    solo.answer = true;
    pathname = "/dashboard/member/weight-log";
    renderShell("");
    expect(screen.getByRole("link", { name: "Log" })).toHaveAttribute("aria-current", "page");
  });

  it("puts Privacy and sharing and Help in the account menu", async () => {
    solo.answer = true;
    renderShell();
    await userEvent.click(screen.getAllByRole("button", { name: "Account menu" })[0]);
    expect(screen.getByRole("menuitem", { name: "Privacy and sharing" })).toHaveAttribute("href", "/dashboard/settings/privacy");
    expect(screen.getByRole("menuitem", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(screen.getByRole("menuitem", { name: "Settings" })).toBeInTheDocument();
  });

  it("does not add those items for a member who is not solo", async () => {
    solo.answer = false;
    renderShell();
    await userEvent.click(screen.getAllByRole("button", { name: "Account menu" })[0]);
    expect(screen.queryByRole("menuitem", { name: "Privacy and sharing" })).toBeNull();
  });
});
