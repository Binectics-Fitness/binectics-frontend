import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";

let mockGym: { _id: string; name: string } | null = null;
let mockRefundCount = 0;
const refundCountCalls: boolean[] = [];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/trainer",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/hooks/useTrainerAccess", () => ({
  useProviderAccess: () => ({ user: { id: "u1", role: "TRAINER" }, isAuthorized: true, isLoading: false }),
  useCoachingGym: () => mockGym,
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", role: "TRAINER", first_name: "Kemi", last_name: "A" }, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/contexts/OrganizationContext", () => {
  const value = { currentOrg: { _id: "o1", name: "Kemi Coaching", owner_id: "u1" }, organizations: [] };
  return { useOrganization: () => value, useOptionalOrganization: () => value };
});
vi.mock("@/lib/queries/marketplace", () => ({ usePendingListingRequestCount: () => 0 }));
vi.mock("@/lib/queries/orgRequests", () => ({ useOrgPendingRequestCount: () => 0 }));
vi.mock("@/components/messaging/queries", () => ({ useMessagingUnread: () => 0 }));
vi.mock("@/lib/queries/refunds", () => ({
  useRefundsAttentionCount: (enabled = true) => {
    refundCountCalls.push(enabled);
    return enabled ? mockRefundCount : 0;
  },
}));
vi.mock("@/components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));

/** The desktop sidebar (the phone drawer holds a second copy, closed). */
function sidebar() {
  return within(screen.getByRole("complementary", { name: "Sidebar navigation" }));
}

beforeEach(() => {
  mockGym = null;
  mockRefundCount = 0;
  refundCountCalls.length = 0;
});

describe("TrainerDashboardShell wayfinding", () => {
  it("links Billing and Refunds for a trainer with their own practice", () => {
    render(<TrainerDashboardShell activeItem="Today" crumb="Today"><p>page</p></TrainerDashboardShell>);
    expect(sidebar().getByRole("link", { name: "Billing" })).toHaveAttribute("href", "/dashboard/billing");
    expect(sidebar().getByRole("link", { name: "Refunds" })).toHaveAttribute("href", "/dashboard/refunds");
    expect(sidebar().getByRole("link", { name: "Plans" })).toHaveAttribute("href", "/dashboard/trainer/plans");
    expect(sidebar().queryByText(/manages your listing/)).not.toBeInTheDocument();
  });

  it("counts refunds waiting on them on the Refunds item, and shows nothing at zero", () => {
    mockRefundCount = 2;
    const { unmount } = render(<TrainerDashboardShell activeItem="Today" crumb="Today"><p>page</p></TrainerDashboardShell>);
    expect(sidebar().getByRole("link", { name: "Refunds 2" })).toBeInTheDocument();
    unmount();
    mockRefundCount = 0;
    render(<TrainerDashboardShell activeItem="Today" crumb="Today"><p>page</p></TrainerDashboardShell>);
    expect(sidebar().getByRole("link", { name: "Refunds" })).toBeInTheDocument();
  });

  it("shows a gym's staff trainer neither Billing nor Refunds, says why in one line, and doesn't ask for the count", () => {
    mockGym = { _id: "g1", name: "Iron Temple" };
    mockRefundCount = 5;
    render(<TrainerDashboardShell activeItem="Today" crumb="Today"><p>page</p></TrainerDashboardShell>);
    expect(sidebar().queryByRole("link", { name: /Billing/ })).not.toBeInTheDocument();
    expect(sidebar().queryByRole("link", { name: /Refunds/ })).not.toBeInTheDocument();
    expect(sidebar().getByText("Coaching at Iron Temple")).toBeInTheDocument();
    expect(sidebar().getByText("Iron Temple manages your listing, plans, forms and billing.")).toBeInTheDocument();
    expect(refundCountCalls.every((enabled) => enabled === false)).toBe(true);
  });
});

describe("DietitianDashboardShell and GymDashboardShell wayfinding", () => {
  it("links Billing and Refunds for a dietitian", () => {
    mockRefundCount = 1;
    render(<DietitianDashboardShell activeItem="Today" crumb="Today"><p>page</p></DietitianDashboardShell>);
    expect(sidebar().getByRole("link", { name: "Billing" })).toHaveAttribute("href", "/dashboard/billing");
    expect(sidebar().getByRole("link", { name: "Refunds 1" })).toHaveAttribute("href", "/dashboard/refunds");
  });

  it("links Refunds for a gym owner and highlights it on the refunds page", () => {
    render(<GymDashboardShell activeItem="Refunds" crumb="Refunds"><p>page</p></GymDashboardShell>);
    const link = sidebar().getByRole("link", { name: "Refunds" });
    expect(link).toHaveAttribute("href", "/dashboard/refunds");
    expect(link.className).toMatch(/font-medium/);
  });
});
