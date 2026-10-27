import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import ProviderBillingPage from "@/app/dashboard/billing/page";
import { WorkspaceShell } from "@/components/ds/WorkspaceShell";

type Org = { _id: string; name: string; owner_id: string; is_owner?: boolean; account_type: string };

let mockUser = { id: "u1", role: "TRAINER" };
let mockOrgs: Org[] = [];
let mockCurrent: Org | null = null;
const getStatus = vi.fn();
const listPlansForOrganization = vi.fn();
const listInvoices = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/ds/WorkspaceShell", () => ({
  WorkspaceShell: vi.fn(({ children }: { children: ReactNode }) => <div data-testid="workspace-shell">{children}</div>),
}));
vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: () => {
    throw new Error("billing must not hard-wire the gym shell");
  },
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: mockUser }) }));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ organizations: mockOrgs, currentOrg: mockCurrent, setCurrentOrg: vi.fn() }),
  useOptionalOrganization: () => ({ organizations: mockOrgs, currentOrg: mockCurrent }),
}));
vi.mock("@/lib/format/useOrgFormat", () => ({
  useOrgFormat: () => ({
    fmtDate: (d: string | null) => (d ? d.slice(0, 10) : "-"),
    fmtMoney: (n: number, c: string) => `${c} ${n}`,
    fmtNumber: (n: number) => String(n),
  }),
}));
vi.mock("@/lib/api/providerBilling", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/providerBilling")>()),
  providerBillingApi: {
    getStatus: (...a: unknown[]) => getStatus(...a),
    listPlansForOrganization: (...a: unknown[]) => listPlansForOrganization(...a),
    listInvoices: (...a: unknown[]) => listInvoices(...a),
    createCheckout: vi.fn(),
  },
}));

const trainerOrg: Org = { _id: "o1", name: "Kemi Coaching", owner_id: "u1", is_owner: true, account_type: "personal_trainer" };

function status(overrides: Partial<{ near_limit: boolean; over_limit: boolean }> = {}) {
  return {
    organization_id: "o1",
    plan_tier: "free",
    subscription_status: "active",
    subscription_current_period_end: null,
    market_code: "NG",
    limits: { max_active_members: 10, max_membership_plans: 3, max_staff_members: 1, max_listings: 1 },
    features: { analytics_enabled: false, consultations_enabled: true },
    usage: { active_members: 9, membership_plans: 1, staff_members: 0, listings: 1 },
    seats: { used: 9, limit: 10, remaining: 1, near_limit: false, over_limit: false, ...overrides },
  };
}

const proPlan = {
  code: "pro",
  name: "Pro",
  description: "For a growing practice",
  sort_order: 2,
  limits: { max_active_members: 50, max_membership_plans: 10, max_staff_members: 3, max_listings: 1 },
  features: { analytics_enabled: true },
  prices: { month: { amount_minor: 1_500_000, currency: "NGN" }, year: null },
  is_self_serve: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockUser = { id: "u1", role: "TRAINER" };
  mockOrgs = [trainerOrg];
  mockCurrent = trainerOrg;
  getStatus.mockResolvedValue({ success: true, data: status() });
  listPlansForOrganization.mockResolvedValue({ success: true, data: [proPlan] });
  listInvoices.mockResolvedValue({ success: true, data: { invoices: [], total: 0 } });
});

describe("Binectics billing page", () => {
  it("renders in the signed-in role's own dashboard, so a trainer isn't bounced", async () => {
    render(<ProviderBillingPage />);
    expect(screen.getByTestId("workspace-shell")).toBeInTheDocument();
    expect(vi.mocked(WorkspaceShell).mock.calls[0][0]).toMatchObject({ activeItem: "Billing" });
    await screen.findByText("Free");
  });

  it("prices plans for this workspace (its market and provider type), not the public catalogue", async () => {
    render(<ProviderBillingPage />);
    await waitFor(() => expect(listPlansForOrganization).toHaveBeenCalledWith("o1"));
    fireEvent.click(await screen.findByRole("button", { name: "plans" }));
    expect(screen.getByText("NGN 15000")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upgrade to Pro" })).toBeInTheDocument();
  });

  it("labels annual billing with the admin's discount, and no saving when none is set", async () => {
    const { unmount } = render(<ProviderBillingPage />);
    fireEvent.click(await screen.findByRole("button", { name: "plans" }));
    // No yearly discount set: no invented "save 20%".
    expect(screen.getByRole("button", { name: "Annual" })).toBeInTheDocument();
    expect(screen.queryByText(/save/i)).not.toBeInTheDocument();
    unmount();

    listPlansForOrganization.mockResolvedValue({
      success: true,
      data: [
        {
          ...proPlan,
          prices: {
            month: { amount_minor: 1_500_000, currency: "NGN" },
            year: { amount_minor: 15_300_000, currency: "NGN", discount_percent: 15 },
          },
        },
      ],
    });
    render(<ProviderBillingPage />);
    fireEvent.click(await screen.findByRole("button", { name: "plans" }));
    fireEvent.click(await screen.findByRole("button", { name: "Annual (save 15%)" }));
    expect(screen.getByText("NGN 153000")).toBeInTheDocument();
    expect(screen.getByText("Save 15% with yearly billing")).toBeInTheDocument();
  });

  it("shows the empty invoice state, then a populated one", async () => {
    const { unmount } = render(<ProviderBillingPage />);
    fireEvent.click(await screen.findByRole("button", { name: "invoices" }));
    expect(screen.getByText("No invoices yet.")).toBeInTheDocument();
    unmount();

    listInvoices.mockResolvedValue({
      success: true,
      data: {
        invoices: [
          {
            _id: "i1",
            amount_due_minor: 1_500_000,
            currency: "NGN",
            status: "paid",
            period_start: "2026-09-01T00:00:00Z",
            period_end: "2026-10-01T00:00:00Z",
            pdf_url: "https://example.test/i1.pdf",
            hosted_invoice_url: null,
          },
        ],
        total: 1,
      },
    });
    render(<ProviderBillingPage />);
    fireEvent.click(await screen.findByRole("button", { name: "invoices" }));
    expect(await screen.findByRole("link", { name: "PDF" })).toHaveAttribute("href", "https://example.test/i1.pdf");
  });

  it("sends a trainer near their seat limit to their clients, not the gym members page", async () => {
    getStatus.mockResolvedValue({ success: true, data: status({ near_limit: true }) });
    render(<ProviderBillingPage />);
    const link = await screen.findByRole("link", { name: "Review clients" });
    expect(link).toHaveAttribute("href", "/dashboard/trainer/clients");
    expect(screen.queryByText(/Archiving a member/)).not.toBeInTheDocument();
  });

  it("tells someone in a workspace they don't own who pays, and asks the API nothing", () => {
    mockOrgs = [{ _id: "g1", name: "Iron Temple", owner_id: "boss", is_owner: false, account_type: "gym_owner" }];
    mockCurrent = mockOrgs[0];
    render(<ProviderBillingPage />);
    expect(screen.getByText(/Iron Temple pays for Binectics/)).toBeInTheDocument();
    expect(getStatus).not.toHaveBeenCalled();
    expect(listPlansForOrganization).not.toHaveBeenCalled();
  });

  it("only offers workspaces the person owns, and only when there is a choice", async () => {
    const second: Org = { _id: "o2", name: "Second Studio", owner_id: "u1", is_owner: true, account_type: "personal_trainer" };
    const staffAt: Org = { _id: "g1", name: "Iron Temple", owner_id: "boss", is_owner: false, account_type: "gym_owner" };
    mockOrgs = [trainerOrg, staffAt];
    const { unmount } = render(<ProviderBillingPage />);
    expect(screen.queryByText("Billing organization")).not.toBeInTheDocument();
    unmount();

    mockOrgs = [trainerOrg, second, staffAt];
    render(<ProviderBillingPage />);
    expect(screen.getByText("Billing organization")).toBeInTheDocument();
    await screen.findByText("Free");
  });
});
