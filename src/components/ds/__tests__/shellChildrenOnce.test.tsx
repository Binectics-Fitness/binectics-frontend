import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { ProviderDashboardShell } from "../ProviderDashboardShell";
import { AdminDashboardShell } from "../AdminDashboardShell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/trainer",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/hooks/useRequireAuth", () => ({
  useAdminGuard: () => ({ isAuthorized: true, isLoading: false }),
  useRoleGuard: () => ({ isAuthorized: true, isLoading: false }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "a-1", role: "ADMIN", first_name: "Ada" }, isLoading: false, logout: vi.fn() }),
}));
vi.mock("../ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));

/**
 * The shells used to mount the page twice (a desktop and a phone copy, one
 * hidden by CSS). The page must mount ONCE whatever the viewport, and stay
 * mounted when the viewport crosses the lg breakpoint.
 */
function stubViewport(desktop: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    matches: desktop,
    media: "(min-width: 64rem)",
    addEventListener: (_: string, l: () => void) => listeners.add(l),
    removeEventListener: (_: string, l: () => void) => listeners.delete(l),
    addListener: (l: () => void) => listeners.add(l),
    removeListener: (l: () => void) => listeners.delete(l),
    onchange: null,
    dispatchEvent: () => true,
  };
  vi.stubGlobal("matchMedia", vi.fn(() => mql));
  window.innerWidth = desktop ? 1280 : 390;
}

const mounts = vi.fn();
const unmounts = vi.fn();
function Page() {
  useEffect(() => {
    mounts();
    return () => unmounts();
  }, []);
  return <h1>Page</h1>;
}
const Action = () => <button type="button">Action</button>;

beforeEach(() => {
  // Here, not in afterEach: the previous test's cleanup unmounts after it.
  mounts.mockReset();
  unmounts.mockReset();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe.each([
  ["ProviderDashboardShell", () => (
    <ProviderDashboardShell key="p" sidebarSlot={<nav>Side</nav>} crumb="Today" actions={<Action />}>
      <Page />
    </ProviderDashboardShell>
  )],
  ["AdminDashboardShell", () => (
    <AdminDashboardShell key="a" activeItem="Dashboard" crumb="Dashboard" actions={<Action />}>
      <Page />
    </AdminDashboardShell>
  )],
])("%s", (_name, shell) => {
  it.each([["phone", false], ["desktop", true]])("renders the page and its actions once on a %s viewport", (_v, desktop) => {
    stubViewport(desktop);
    render(shell());
    expect(screen.getAllByRole("heading", { level: 1, name: "Page" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Action" })).toHaveLength(1);
    expect(mounts).toHaveBeenCalledTimes(1);
  });

  it("keeps the page mounted across the lg breakpoint", () => {
    stubViewport(true);
    const { rerender } = render(shell());
    stubViewport(false);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    rerender(shell());
    expect(mounts).toHaveBeenCalledTimes(1);
    expect(unmounts).not.toHaveBeenCalled();
  });
});
