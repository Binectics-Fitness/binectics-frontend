import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import GymMembersClient from "@/app/dashboard/gym-owner/members/MembersClient";
import { marketplaceService } from "@/lib/api/marketplace";
import { providerBillingApi } from "@/lib/api/providerBilling";
import {
  MembershipPlanType,
  MembershipSubscriptionStatus as S,
  type MembershipSubscription,
} from "@/lib/types";
import { confirmInDialog, findConfirmDialog } from "@/test/confirmDialog";

vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/gym-owner/members",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/app/dashboard/gym-owner/members/PendingOffers", () => ({ PendingOffers: () => null }));
vi.mock("@/app/dashboard/gym-owner/members/ConnectedClients", () => ({ ConnectedClients: () => null }));
vi.mock("@/app/dashboard/gym-owner/members/_actions", () => ({ AddMemberButton: () => null, ImportMembersButton: () => null }));
vi.mock("@/app/dashboard/gym-owner/members/import/RecentImports", () => ({ RecentImports: () => null }));
vi.mock("@/components/messaging/StartConversationButton", () => ({ StartConversationButton: () => null }));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "owner1" }, isLoading: false }) }));
const orgState = { currentOrg: { _id: "o1", name: "Iron Temple", owner_id: "owner1" }, isLoading: false };
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => orgState,
  useOptionalOrganization: () => orgState,
}));

const DAY = 86_400_000;

function sub(over: Partial<MembershipSubscription> = {}): MembershipSubscription {
  return {
    _id: "s1",
    organization_id: "o1",
    plan_id: { _id: "p1", name: "Monthly", plan_type: MembershipPlanType.SUBSCRIPTION, duration_days: 30, price_minor: 2_500_000, currency: "NGN", features: [] },
    member_user_id: { _id: "u1", first_name: "Ngozi", last_name: "Okafor", email: "n@example.com" },
    status: S.ACTIVE,
    start_date: "2026-10-01T00:00:00Z",
    end_date: new Date(Date.now() + 20 * DAY).toISOString(),
    amount_paid_minor: 2_500_000,
    currency: "NGN",
    auto_renew: false,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "",
    ...over,
  };
}

const active = () => sub();
const pastDue = () =>
  sub({ _id: "s2", member_user_id: { _id: "u2", first_name: "Tunde", last_name: "Bakare", email: "t@example.com" }, status: S.PAST_DUE });
const lapsed = () =>
  sub({ _id: "s3", member_user_id: { _id: "u3", first_name: "Halima", last_name: "Yusuf", email: "h@example.com" }, status: S.EXPIRED });

const list = vi.spyOn(marketplaceService, "getOrgMembershipSubscriptions");
const cancel = vi.spyOn(marketplaceService, "cancelOrgSubscription");
const archive = vi.spyOn(marketplaceService, "archiveMember");
vi.spyOn(marketplaceService, "getOrgMembershipPlans").mockResolvedValue({ success: true, data: [] });
vi.spyOn(providerBillingApi, "getStatus").mockResolvedValue({ success: false } as never);

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

const openMenu = async (name: string) => {
  const row = (await screen.findByText(name)).closest("tr") as HTMLElement;
  await userEvent.click(within(row).getByRole("button", { name: "Member actions" }));
};

let nativeConfirm: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  vi.clearAllMocks();
  nativeConfirm = vi.spyOn(window, "confirm");
  list.mockResolvedValue({ success: true, data: [active(), pastDue(), lapsed()] });
});

describe("gym members: destructive actions confirm in the app's dialog", () => {
  it("cancels a running membership only after the dialog, saying a card payment is refunded and the seat stays taken", async () => {
    let resolve!: (v: unknown) => void;
    cancel.mockReturnValue(new Promise((r) => { resolve = r; }) as never);
    wrap(<GymMembersClient />);
    await openMenu("Ngozi Okafor");
    await userEvent.click(screen.getByRole("button", { name: "Cancel membership" }));
    const dialog = await findConfirmDialog("Cancel Ngozi Okafor's membership?");
    expect(dialog).toHaveTextContent("the unused part of their term is refunded");
    expect(dialog).toHaveTextContent("Their seat stays taken until you archive them.");
    expect(cancel).not.toHaveBeenCalled();

    const confirm = within(dialog).getByRole("button", { name: "Cancel membership" });
    await userEvent.click(confirm);
    // Pending: no second send, no way out.
    expect(confirm).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Keep membership" })).toBeDisabled();
    await userEvent.click(confirm);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(cancel).toHaveBeenCalledWith("o1", "s1");

    resolve({ success: true, data: { ...active(), status: S.CANCELLED } });
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(nativeConfirm).not.toHaveBeenCalled();
  });

  it("promises no refund to a past-due member", async () => {
    wrap(<GymMembersClient />);
    await openMenu("Tunde Bakare");
    await userEvent.click(screen.getByRole("button", { name: "Cancel membership" }));
    const dialog = await findConfirmDialog("Cancel Tunde Bakare's membership?");
    expect(dialog).toHaveTextContent("nothing is refunded");
    await userEvent.click(within(dialog).getByRole("button", { name: "Keep membership" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(cancel).not.toHaveBeenCalled();
  });

  it("archives a lapsed member only after the dialog", async () => {
    archive.mockResolvedValue({ success: true } as never);
    wrap(<GymMembersClient />);
    await openMenu("Halima Yusuf");
    await userEvent.click(screen.getByRole("button", { name: "Archive member (free seat)" }));
    expect(archive).not.toHaveBeenCalled();
    await confirmInDialog(userEvent, "Archive Halima Yusuf?", "Archive member");
    expect(archive).toHaveBeenCalledWith("o1", "u3");
    expect(nativeConfirm).not.toHaveBeenCalled();
  });
});
