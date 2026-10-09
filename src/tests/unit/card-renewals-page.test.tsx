import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import CardRenewalsClient from "@/app/dashboard/gym-owner/card-renewals/CardRenewalsClient";
import { memberBillingService, type OrgChargeView } from "@/lib/api/memberBilling";
import { marketplaceService } from "@/lib/api/marketplace";
import { MembershipPlanType, MembershipSubscriptionStatus, type MembershipSubscription } from "@/lib/types";

vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
const authState = { user: { id: "owner1" }, isLoading: false };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState }));
const orgState = { currentOrg: { _id: "o1", name: "Iron Temple", owner_id: "owner1" } as { _id: string; name: string; owner_id: string | null }, isLoading: false };
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => orgState,
  useOptionalOrganization: () => orgState,
}));

const charge = (over: Partial<OrgChargeView> = {}): OrgChargeView => ({
  id: "c1",
  subscription_id: "s1",
  organization_id: "o1",
  member_user_id: "u1",
  plan_id: "p1",
  cycle_seq: 2,
  period_start: "2026-10-14T00:00:00Z",
  period_end: "2026-11-13T00:00:00Z",
  amount_minor: 2_500_000,
  currency: "NGN",
  status: "failed_final",
  closed_reason: "card_rejected",
  reconcile_reason: null,
  late_payment: null,
  next_attempt_at: null,
  settled_at: null,
  transaction_id: null,
  attempts: [{ n: 1, started_at: "2026-10-13T09:00:00Z", finished_at: "2026-10-13T09:00:05Z", outcome: "failed", failure_class: "hard", gateway_status: "failed" }],
  created_at: "2026-10-13T08:00:00Z",
  ...over,
});
const sub = {
  _id: "s1",
  organization_id: "o1",
  plan_id: { _id: "p1", name: "Monthly Unlimited", plan_type: MembershipPlanType.SUBSCRIPTION, duration_days: 30, price_minor: 2_500_000, currency: "NGN", features: [] },
  member_user_id: { _id: "u1", first_name: "Ngozi", last_name: "Okafor", email: "n@example.com" },
  status: MembershipSubscriptionStatus.ACTIVE,
  start_date: "",
  amount_paid_minor: 0,
  currency: "NGN",
  auto_renew: true,
  created_at: "",
  updated_at: "",
} as MembershipSubscription;

const list = vi.spyOn(memberBillingService, "listOrgCharges");
const subs = vi.spyOn(marketplaceService, "getOrgMembershipSubscriptions");

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CardRenewalsClient />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  authState.user.id = "owner1";
  orgState.currentOrg.owner_id = "owner1";
  list.mockResolvedValue({ success: true, data: [charge(), charge({ id: "c2", status: "retry_scheduled", closed_reason: null, next_attempt_at: "2026-10-15T09:00:00Z", attempts: [{ n: 1, started_at: "2026-10-13T09:00:00Z", finished_at: null, outcome: "failed", failure_class: "soft", gateway_status: "failed" }] })] });
  subs.mockResolvedValue({ success: true, data: [sub] });
});

describe("Card renewals (gym owner)", () => {
  it("lists status, member, plan, amount, attempt and reason, read-only", async () => {
    renderPage();
    const table = await screen.findByRole("table", { name: "Card renewals" });
    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent("Failed");
    expect(rows[1]).toHaveTextContent("Ngozi Okafor");
    expect(rows[1]).toHaveTextContent("Monthly Unlimited");
    expect(rows[1]).toHaveTextContent("₦25,000");
    expect(rows[1]).toHaveTextContent(/Last tried/);
    expect(rows[1]).toHaveTextContent("The bank declined the card");
    expect(rows[2]).toHaveTextContent("Retrying");
    expect(rows[2]).toHaveTextContent(/Next try/);
    expect(within(table).queryByRole("button")).toBeNull();
    expect(list).toHaveBeenCalledWith("o1", undefined);
  });

  it("filters by one status through the API", async () => {
    renderPage();
    await screen.findByRole("table");
    await userEvent.click(screen.getByRole("button", { name: "Failed" }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith("o1", "failed_final"));
    expect(screen.getByRole("button", { name: "Failed" })).toHaveAttribute("aria-pressed", "true");
  });

  it("never asks the API when the user doesn't own the workspace", async () => {
    authState.user.id = "staff1";
    renderPage();
    expect(await screen.findByText("Only the owner of this workspace can see card renewals.")).toBeInTheDocument();
    expect(list).not.toHaveBeenCalled();
  });

  it("fails closed when the workspace has no owner id", async () => {
    orgState.currentOrg.owner_id = null;
    renderPage();
    expect(await screen.findByText(/Only the owner/)).toBeInTheDocument();
    expect(list).not.toHaveBeenCalled();
  });

  it("says so when the API refuses with 403", async () => {
    list.mockResolvedValue({ success: false, status: 403, message: "Forbidden" });
    renderPage();
    expect(await screen.findByText(/Only the owner/)).toBeInTheDocument();
  });

  it("has an empty state", async () => {
    list.mockResolvedValue({ success: true, data: [] });
    renderPage();
    expect(await screen.findByText(/Nothing here/)).toBeInTheDocument();
  });
});
