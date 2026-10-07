import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardMobileNav, MarketingMobileNav } from "../MobileNav";
import { AdminDashboardShell } from "../AdminDashboardShell";
import { ShellAccountMenu } from "../ShellAccountMenu";
import { isScrollLocked } from "@/lib/ui/scrollLock";

let pathname = "/dashboard/trainer";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/hooks/useRequireAuth", () => ({
  useAdminGuard: () => ({ isAuthorized: true, isLoading: false }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "a-1", role: "ADMIN", first_name: "Ada" }, isLoading: false, logout: vi.fn() }),
}));
vi.mock("../ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));

/** A controllable (min-width: 64rem) media query. */
let mqlListeners: Set<() => void>;
let mql: { matches: boolean };
function stubViewport(desktop: boolean) {
  mqlListeners = new Set();
  mql = {
    matches: desktop,
    media: "(min-width: 64rem)",
    addEventListener: (_: string, l: () => void) => mqlListeners.add(l),
    removeEventListener: (_: string, l: () => void) => mqlListeners.delete(l),
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => true,
  } as unknown as { matches: boolean };
  vi.stubGlobal("matchMedia", vi.fn(() => mql));
}
function resizeTo(desktop: boolean) {
  act(() => {
    mql.matches = desktop;
    mqlListeners.forEach((l) => l());
  });
}

function ProviderPage() {
  return (
    <div>
      <DashboardMobileNav>
        <a href="#overview">Overview</a>
        <a href="#clients">Clients</a>
        <ShellAccountMenu direction="up" trigger={<span>Ada</span>} />
      </DashboardMobileNav>
      <main>
        <button type="button">Page action</button>
      </main>
    </div>
  );
}

beforeEach(() => {
  pathname = "/dashboard/trainer";
  stubViewport(false);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const openButton = () => screen.getByRole("button", { name: "Open navigation" });

describe.each([
  ["provider drawer", () => render(<ProviderPage />), "Navigation"],
  [
    "admin drawer",
    () =>
      render(
        <AdminDashboardShell activeItem="Overview" crumb="Overview">
          <button type="button">Page action</button>
        </AdminDashboardShell>,
      ),
    "Admin navigation",
  ],
] as const)("%s", (_name, mount, label) => {
  it("is a labelled modal dialog, and the trigger reports its state", async () => {
    const user = userEvent.setup();
    mount();
    expect(openButton()).toHaveAttribute("aria-expanded", "false");
    await user.click(openButton());
    const dialog = screen.getByRole("dialog", { name: label });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(openButton()).toHaveAttribute("aria-expanded", "true");
  });

  it("moves focus to the close button on open", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(openButton());
    expect(screen.getByRole("button", { name: "Close navigation" })).toHaveFocus();
  });

  it("traps Tab and Shift+Tab inside the panel", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(openButton());
    const dialog = screen.getByRole("dialog");
    for (let i = 0; i < 40; i++) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    for (let i = 0; i < 40; i++) {
      await user.tab({ shift: true });
      expect(dialog.contains(document.activeElement)).toBe(true);
    }
    // Wraps: Shift+Tab from the first item (close button) lands on the last.
    screen.getByRole("button", { name: "Close navigation" }).focus();
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(within(screen.getByRole("dialog")).getByRole("button", { name: "Account menu" }));
    await user.tab();
    expect(screen.getByRole("button", { name: "Close navigation" })).toHaveFocus();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(openButton());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(openButton()).toHaveFocus();
  });

  it("leaves the first Escape to an open account menu inside the panel", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(openButton());
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Account menu" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument(); // opening the menu no longer closes the drawer
    expect(within(screen.getByRole("dialog")).getByRole("menu")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("makes the page behind inert and locks scroll while open, and undoes both on close", async () => {
    const user = userEvent.setup();
    mount();
    const pageAction = screen.getByRole("button", { name: "Page action" });
    await user.click(openButton());
    expect(pageAction.closest("[inert]")).not.toBeNull();
    expect(screen.getByRole("dialog").closest("[inert]")).toBeNull();
    expect(isScrollLocked()).toBe(true);
    await user.click(screen.getByRole("button", { name: "Close navigation" }));
    expect(pageAction.closest("[inert]")).toBeNull();
    expect(document.querySelector("[inert]")).toBeNull();
    expect(isScrollLocked()).toBe(false);
  });

  it("closes when the route changes", async () => {
    const user = userEvent.setup();
    const { rerender } = mount();
    await user.click(openButton());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    pathname = "/somewhere/else";
    rerender(
      _name === "provider drawer" ? (
        <ProviderPage />
      ) : (
        <AdminDashboardShell activeItem="Overview" crumb="Overview">
          <button type="button">Page action</button>
        </AdminDashboardShell>
      ),
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(isScrollLocked()).toBe(false);
  });

  it("closes when a link is picked, even for the current page", async () => {
    mount();
    fireEvent.click(openButton());
    const dialog = screen.getByRole("dialog");
    const link = dialog.querySelector("a[href]") as HTMLAnchorElement;
    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("closes when the viewport reaches desktop, and stays closed on the way back", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(openButton());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    resizeTo(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(isScrollLocked()).toBe(false);
    expect(document.querySelector("[inert]")).toBeNull();
    resizeTo(false);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("MarketingMobileNav", () => {
  it("is a modal dialog with focus, Escape and focus return", async () => {
    const user = userEvent.setup();
    render(<MarketingMobileNav links={[{ href: "/pricing", label: "Pricing" }]} />);
    const trigger = screen.getByRole("button", { name: "Open menu" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Menu" })).toHaveAttribute("aria-modal", "true");
    expect(document.activeElement?.closest('[role="dialog"]')).not.toBeNull();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(trigger).toHaveFocus();
  });
});
