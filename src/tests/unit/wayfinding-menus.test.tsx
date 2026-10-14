import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import OnboardingBanner from "@/components/OnboardingBanner";
import { UnifiedMobileNav } from "@/components/ds/UnifiedMobileNav";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";

let mockUser: Record<string, unknown> = {};
let mockGym: { _id: string; name: string } | null = null;

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/hooks/useTrainerAccess", () => ({ useCoachingGym: () => mockGym }));
vi.mock("@/hooks/useRequireAuth", () => ({ useAdminGuard: () => ({ isAuthorized: true, isLoading: false }) }));
vi.mock("@/components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));
vi.mock("@/lib/queries/onboarding", () => ({
  useOnboardingStatus: () => ({ data: { is_dismissed: false }, isLoading: false }),
}));
vi.mock("@/lib/api/onboarding", () => ({ onboardingService: {} }));
vi.mock("@tanstack/react-query", async (orig) => ({
  ...(await orig<typeof import("@tanstack/react-query")>()),
  useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

beforeEach(() => {
  mockGym = null;
});

describe("OnboardingBanner plan link", () => {
  it("offers a trainer with their own practice their Binectics plan", () => {
    mockUser = { id: "t1", role: "TRAINER", first_name: "Kemi", is_onboarding_complete: false };
    render(<OnboardingBanner />);
    expect(screen.getByRole("link", { name: "Choose your plan" })).toHaveAttribute("href", "/dashboard/billing");
  });

  it("doesn't offer a gym's staff trainer a plan: the gym pays", () => {
    mockUser = { id: "t1", role: "TRAINER", first_name: "Kemi", is_onboarding_complete: false };
    mockGym = { _id: "g1", name: "Iron Temple" };
    render(<OnboardingBanner />);
    expect(screen.queryByRole("link", { name: "Choose your plan" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Complete setup/ })).toBeInTheDocument();
  });
});

describe("marketing phone nav account links", () => {
  it.each(["USER", "GYM_OWNER", "TRAINER", "ADMIN"])("go to real account pages for a %s", (role) => {
    mockUser = { id: "u1", role, first_name: "Ada", last_name: "B", email: "ada@x.test" };
    render(<UnifiedMobileNav />);
    fireEvent.click(screen.getByRole("button", { name: /open (menu|navigation)/i }));
    const dialog = screen.getByRole("dialog", { name: "Navigation" });
    expect(within(dialog).getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/dashboard/settings");
    expect(within(dialog).getByRole("link", { name: "Profile" })).toHaveAttribute("href", "/dashboard/settings/profile");
  });
});

describe("admin sidebar", () => {
  it("links the refund queue and marks it current on that page", () => {
    mockUser = { id: "a1", role: "ADMIN", first_name: "Ada" };
    render(<AdminDashboardShell activeItem="Refunds" crumb="Refunds"><p>page</p></AdminDashboardShell>);
    const aside = within(screen.getByRole("complementary", { name: "Sidebar navigation" }));
    const link = aside.getByRole("link", { name: "Refunds" });
    expect(link).toHaveAttribute("href", "/admin/refunds");
    expect(link).toHaveStyle({ fontWeight: "500" });
    expect(aside.queryByRole("link", { name: "Fraud" })).not.toBeInTheDocument();
  });
});
