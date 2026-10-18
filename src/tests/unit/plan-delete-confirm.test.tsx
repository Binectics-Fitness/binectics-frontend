import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TrainerPlansClient from "@/app/dashboard/trainer/plans/PlansClient";
import DietitianPlansClient from "@/app/dashboard/dietitian/plans/PlansClient";
import { GymPlansClient } from "@/app/dashboard/gym-owner/plans/GymPlansClient";
import { marketplaceService } from "@/lib/api/marketplace";
import { toast } from "@/components/Toast";
import { MembershipPlanType, MembershipSubscriptionStatus as S } from "@/lib/types";
import { confirmInDialog, findConfirmDialog } from "@/test/confirmDialog";

/**
 * Deleting a membership plan asks in the app's own dialog (never
 * window.confirm), says what the API does — a hard delete, refused while
 * anyone is still on the plan — and only then calls it.
 */

vi.mock("@/lib/queries/currencies", () => ({
  useOrgPriceCurrencies: () => ({ data: [], isLoading: false, isError: false, providerHint: null }),
}));
const org = vi.hoisted(() => ({ currentOrg: { _id: "org-1", currency: "NGN" }, isLoading: false }));
vi.mock("@/contexts/OrganizationContext", () => ({ useOrganization: () => org, useOptionalOrganization: () => org }));
vi.mock("@/components/ds/TrainerDashboardShell", () => ({
  TrainerDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/ds/DietitianDashboardShell", () => ({
  DietitianDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));

const plan = (over: Record<string, unknown> = {}) =>
  ({
    _id: "p1",
    organization_id: "org-1",
    name: "Monthly",
    description: "",
    plan_type: MembershipPlanType.SUBSCRIPTION,
    duration_days: 30,
    price_minor: 2_500_000,
    currency: "NGN",
    features: [],
    is_active: true,
    is_public: true,
    created_at: "",
    updated_at: "",
    ...over,
  }) as never;

const member = (planId: string) =>
  ({
    _id: "s1",
    organization_id: "org-1",
    plan_id: planId,
    member_user_id: "u1",
    status: S.ACTIVE,
    start_date: "",
    end_date: "",
    amount_paid_minor: 0,
    currency: "NGN",
    auto_renew: false,
    created_at: "",
    updated_at: "",
  }) as never;

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

let del: ReturnType<typeof vi.spyOn>;
let nativeConfirm: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.clearAllMocks();
  nativeConfirm = vi.spyOn(window, "confirm");
  vi.spyOn(marketplaceService, "getOrgMembershipPlans").mockResolvedValue({ success: true, data: [plan()] });
  vi.spyOn(marketplaceService, "getOrgMembershipSubscriptions").mockResolvedValue({ success: true, data: [] });
  del = vi.spyOn(marketplaceService, "deleteOrgMembershipPlan").mockResolvedValue({ success: true } as never);
});

describe.each([
  ["trainer", TrainerPlansClient],
  ["dietitian", DietitianPlansClient],
])("%s plans: delete", (_role, Client) => {
  it("deletes only after the dialog, and never calls window.confirm", async () => {
    const user = userEvent.setup();
    wrap(<Client />);
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    const dialog = await findConfirmDialog('Delete "Monthly"?');
    expect(dialog).toHaveTextContent("comes off your listing");
    expect(del).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Delete plan" }));
    await waitFor(() => expect(del).toHaveBeenCalledWith("org-1", "p1"));
    expect(toast.success).toHaveBeenCalledWith("Plan deleted.");
    await waitFor(() => expect(screen.queryByText("Monthly")).toBeNull());
    expect(nativeConfirm).not.toHaveBeenCalled();
  });

  it("says a plan people are on can't be deleted, and Cancel leaves it", async () => {
    vi.spyOn(marketplaceService, "getOrgMembershipSubscriptions").mockResolvedValue({ success: true, data: [member("p1")] });
    const user = userEvent.setup();
    wrap(<Client />);
    // Plans and the roster load together, so the card carries the count.
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    const dialog = await findConfirmDialog('Delete "Monthly"?');
    expect(dialog).toHaveTextContent("1 person is still on this plan, so it can't be deleted yet.");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(del).not.toHaveBeenCalled();
  });

  it("keeps the plan and shows the API's reason when the delete is refused", async () => {
    del.mockResolvedValue({ success: false, message: "Deactivate the plan instead." } as never);
    const user = userEvent.setup();
    wrap(<Client />);
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await confirmInDialog(user, 'Delete "Monthly"?', "Delete plan");
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Deactivate the plan instead."));
    expect(screen.getByText("Monthly")).toBeInTheDocument();
  });
});

describe("gym plans: delete", () => {
  it("deletes an empty plan only after the dialog", async () => {
    const user = userEvent.setup();
    wrap(<GymPlansClient />);
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    const dialog = await findConfirmDialog('Delete "Monthly"?');
    expect(dialog).toHaveTextContent("This can't be undone.");
    expect(del).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "Delete plan" }));
    await waitFor(() => expect(del).toHaveBeenCalledWith("org-1", "p1"));
    expect(toast.success).toHaveBeenCalledWith('"Monthly" deleted');
    expect(nativeConfirm).not.toHaveBeenCalled();
  });

  it("shows the API's reason when the delete is refused", async () => {
    del.mockResolvedValue({ success: false, message: "Deactivate the plan instead." } as never);
    const user = userEvent.setup();
    wrap(<GymPlansClient />);
    await user.click(await screen.findByRole("button", { name: "Delete" }));
    await confirmInDialog(user, 'Delete "Monthly"?', "Delete plan");
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Deactivate the plan instead."));
  });
});
