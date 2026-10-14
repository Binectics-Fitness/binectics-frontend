import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, type ReactNode } from "react";
import GymMembersClient from "@/app/dashboard/gym-owner/members/MembersClient";
import GymSingleMemberPage from "@/app/dashboard/gym-owner/members/[memberId]/page";
import { marketplaceService } from "@/lib/api/marketplace";
import { providerBillingApi } from "@/lib/api/providerBilling";
import {
  MembershipPlanType,
  MembershipSubscriptionStatus as S,
  type MembershipSubscription,
} from "@/lib/types";

vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/gym-owner/members",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/app/dashboard/gym-owner/members/PendingOffers", () => ({ PendingOffers: () => null }));
vi.mock("@/app/dashboard/gym-owner/members/_actions", () => ({ AddMemberButton: () => null }));
vi.mock("@/app/dashboard/gym-owner/members/[memberId]/TrainerCard", () => ({ TrainerCard: () => null }));
vi.mock("@/components/messaging/StartConversationButton", () => ({ StartConversationButton: () => null }));
const authState = { user: { id: "owner1" }, isLoading: false };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState }));
const orgState = { currentOrg: { _id: "o1", name: "Iron Temple", owner_id: "owner1" }, isLoading: false };
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => orgState,
  useOptionalOrganization: () => orgState,
}));

const DAY = 86_400_000;
const end = new Date(Date.now() + 20 * DAY).toISOString();

function sub(over: Partial<MembershipSubscription> = {}): MembershipSubscription {
  return {
    _id: "s1",
    organization_id: "o1",
    plan_id: { _id: "p1", name: "Monthly", plan_type: MembershipPlanType.SUBSCRIPTION, duration_days: 30, price_minor: 2_500_000, currency: "NGN", features: [] },
    member_user_id: { _id: "u1", first_name: "Ngozi", last_name: "Okafor", email: "n@example.com" },
    status: S.ACTIVE,
    start_date: "2026-10-01T00:00:00Z",
    end_date: end,
    amount_paid_minor: 2_500_000,
    currency: "NGN",
    auto_renew: false,
    created_at: "2026-10-01T00:00:00Z",
    updated_at: "",
    ...over,
  };
}

const ngozi = () => sub();
const tunde = () =>
  sub({
    _id: "s2",
    member_user_id: { _id: "u2", first_name: "Tunde", last_name: "Bakare", email: "t@example.com" },
    status: S.PAUSED,
    paused_at: new Date(Date.now() - 4 * DAY - 60_000).toISOString(),
  });
const halima = () =>
  sub({
    _id: "s3",
    member_user_id: { _id: "u3", first_name: "Halima", last_name: "Yusuf", email: "h@example.com" },
    status: S.SUSPENDED,
    suspended_at: "2026-10-10T09:00:00Z",
    suspension_reason: "Outstanding balance from March",
  });

const list = vi.spyOn(marketplaceService, "getOrgMembershipSubscriptions");
const one = vi.spyOn(marketplaceService, "getOrgMembershipSubscriptionById");
const suspend = vi.spyOn(marketplaceService, "suspendOrgSubscription");
const unsuspend = vi.spyOn(marketplaceService, "unsuspendOrgSubscription");
vi.spyOn(marketplaceService, "getOrgMembershipPlans").mockResolvedValue({ success: true, data: [] });
vi.spyOn(providerBillingApi, "getStatus").mockResolvedValue({ success: false } as never);

function wrap(node: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

const rowOf = async (name: string) => (await screen.findByText(name)).closest("tr") as HTMLElement;
const openMenu = async (name: string) => {
  const row = await rowOf(name);
  await userEvent.click(within(row).getByRole("button", { name: "Member actions" }));
};

beforeEach(() => {
  vi.clearAllMocks();
  list.mockResolvedValue({ success: true, data: [ngozi(), tunde(), halima()] });
});

describe("gym members list: holds", () => {
  it("shows Paused and Suspended with since when, the end if resumed, and the reason", async () => {
    wrap(<GymMembersClient />);
    const paused = await rowOf("Tunde Bakare");
    expect(within(paused).getByText("Paused")).toBeInTheDocument();
    expect(within(paused).getByTestId("hold-line")).toHaveTextContent(/^Paused since .+ \(4 days\)\. Ends .+ if they resume today\.$/);
    const suspended = await rowOf("Halima Yusuf");
    expect(within(suspended).getByText("Suspended")).toBeInTheDocument();
    expect(within(suspended).getByTestId("hold-line")).toHaveTextContent(/Suspended since .+: “Outstanding balance from March”/);
    expect(within(await rowOf("Ngozi Okafor")).queryByTestId("hold-line")).toBeNull();
  });

  it("filters to each hold state", async () => {
    wrap(<GymMembersClient />);
    await rowOf("Ngozi Okafor");
    await userEvent.click(screen.getByRole("button", { name: /^Suspended 1$/ }));
    expect(screen.getByText("Halima Yusuf")).toBeInTheDocument();
    expect(screen.queryByText("Ngozi Okafor")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^Paused 1$/ }));
    expect(screen.getByText("Tunde Bakare")).toBeInTheDocument();
    expect(screen.queryByText("Halima Yusuf")).not.toBeInTheDocument();
  });

  it("offers Suspend on an active member, Lift on a suspended one, and neither (nor pause) on a paused one", async () => {
    wrap(<GymMembersClient />);
    await openMenu("Ngozi Okafor");
    expect(screen.getByRole("button", { name: "Suspend…" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lift suspension…" })).toBeNull();
    await openMenu("Halima Yusuf");
    expect(screen.getByRole("button", { name: "Lift suspension…" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspend…" })).toBeNull();
    await openMenu("Tunde Bakare");
    expect(screen.queryByRole("button", { name: "Suspend…" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Lift suspension…" })).toBeNull();
    expect(screen.queryByRole("button", { name: /^(Pause|Resume)\b/ })).toBeNull();
  });

  it("suspends with a reason after saying what it does, buttons disabled while sending", async () => {
    let finish!: (v: unknown) => void;
    suspend.mockReturnValue(new Promise((r) => (finish = r)) as never);
    wrap(<GymMembersClient />);
    await openMenu("Ngozi Okafor");
    await userEvent.click(screen.getByRole("button", { name: "Suspend…" }));
    const dialog = await screen.findByRole("dialog", { name: "Suspend Ngozi Okafor?" });
    const copy = within(dialog).getByTestId("suspend-copy");
    expect(copy).toHaveTextContent("They lose access now: no check-ins and no class bookings until you lift the suspension.");
    expect(copy).toHaveTextContent("The days they're suspended aren't given back. Their membership still ends on");
    expect(copy).toHaveTextContent("They keep their seat, so it still counts towards your plan.");
    expect(copy).not.toHaveTextContent(/Card auto-renew/);
    await userEvent.type(within(dialog).getByLabelText("Reason (optional, the member sees this)"), "Unpaid dues");
    await userEvent.click(within(dialog).getByRole("button", { name: "Suspend membership" }));
    expect(suspend).toHaveBeenCalledWith("o1", "s1", "Unpaid dues");
    expect(within(dialog).getByRole("button", { name: "Suspending…" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Keep active" })).toBeDisabled();
    finish({
      success: true,
      data: { ...sub({ status: S.SUSPENDED, suspension_reason: "Unpaid dues", suspended_at: new Date().toISOString() }), member_user_id: "u1", plan_id: "p1" },
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const row = await rowOf("Ngozi Okafor");
    expect(within(row).getByText("Suspended")).toBeInTheDocument();
    expect(within(row).getByTestId("hold-line")).toHaveTextContent("“Unpaid dues”");
  });

  it("says card auto-renew is switched off when the member renews by card", async () => {
    list.mockResolvedValue({ success: true, data: [sub({ auto_renew: true, collection_method: "card_auto", payment_method_id: "pm1" })] });
    wrap(<GymMembersClient />);
    await openMenu("Ngozi Okafor");
    await userEvent.click(screen.getByRole("button", { name: "Suspend…" }));
    const dialog = await screen.findByRole("dialog", { name: "Suspend Ngozi Okafor?" });
    expect(dialog).toHaveTextContent("Card auto-renew is switched off. They'd turn it back on themselves after you lift the suspension.");
  });

  it("a refused suspend shows in the dialog: no permission, or a status that moved", async () => {
    suspend.mockResolvedValueOnce({ success: false, status: 403, message: "Forbidden" });
    wrap(<GymMembersClient />);
    await openMenu("Ngozi Okafor");
    await userEvent.click(screen.getByRole("button", { name: "Suspend…" }));
    const dialog = await screen.findByRole("dialog", { name: "Suspend Ngozi Okafor?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Suspend membership" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("You don't have permission to manage members for this gym.");
    suspend.mockResolvedValueOnce({ success: false, status: 400, message: "Only an active or past-due membership can be suspended." });
    await userEvent.click(within(dialog).getByRole("button", { name: "Suspend membership" }));
    await waitFor(() =>
      expect(within(dialog).getByRole("alert")).toHaveTextContent(
        "Only an active or past-due membership can be suspended. Refresh the page to see where it stands.",
      ),
    );
    expect(within(await rowOf("Ngozi Okafor")).getByText("Active")).toBeInTheDocument();
  });

  it("lifts a suspension, saying the end date stays where it is", async () => {
    unsuspend.mockResolvedValue({ success: true, data: { ...sub({ _id: "s3", status: S.ACTIVE }), member_user_id: "u3", plan_id: "p1" } });
    wrap(<GymMembersClient />);
    await openMenu("Halima Yusuf");
    await userEvent.click(screen.getByRole("button", { name: "Lift suspension…" }));
    const dialog = await screen.findByRole("dialog", { name: "Lift Halima Yusuf's suspension?" });
    expect(within(dialog).getByTestId("lift-copy")).toHaveTextContent(
      "They can check in and book again straight away. Their membership still ends on",
    );
    await userEvent.click(within(dialog).getByRole("button", { name: "Lift suspension" }));
    expect(unsuspend).toHaveBeenCalledWith("o1", "s3");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const row = await rowOf("Halima Yusuf");
    expect(within(row).getByText("Active")).toBeInTheDocument();
    expect(within(row).queryByTestId("hold-line")).toBeNull();
  });

  it("a role without member permission gets no list, so no actions at all", async () => {
    list.mockResolvedValue({ success: false, status: 403, message: "Insufficient permissions" });
    wrap(<GymMembersClient />);
    expect(await screen.findByText(/Couldn't load members/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Member actions" })).toBeNull();
    expect(suspend).not.toHaveBeenCalled();
  });
});

describe("single member page: holds", () => {
  const renderDetail = async (s: MembershipSubscription) => {
    one.mockResolvedValue({ success: true, data: s });
    const params = Promise.resolve({ memberId: s._id });
    await act(async () => {
      wrap(
        <Suspense fallback={null}>
          <GymSingleMemberPage params={params} />
        </Suspense>,
      );
    });
    await screen.findByRole("heading", { level: 1 });
  };

  it("an active member: Suspend", async () => {
    await renderDetail(ngozi());
    expect(screen.getByRole("button", { name: "Suspend" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lift suspension" })).toBeNull();
  });

  it("a suspended member: Lift suspension, and the reason in the details", async () => {
    await renderDetail(halima());
    expect(screen.getByRole("button", { name: "Lift suspension" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspend" })).toBeNull();
    expect(screen.getByText(/Suspended since .+: “Outstanding balance from March”/)).toBeInTheDocument();
  });

  it("a paused member: no hold action for the gym, and the pause in the details", async () => {
    await renderDetail(tunde());
    expect(screen.queryByRole("button", { name: "Suspend" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Lift suspension" })).toBeNull();
    expect(screen.getByText(/Paused since .+ \(4 days\)\. Ends .+ if they resume today\./)).toBeInTheDocument();
  });

  it("suspends from the page and shows the new state", async () => {
    suspend.mockResolvedValue({ success: true, data: { ...sub({ status: S.SUSPENDED, suspension_reason: null, suspended_at: new Date().toISOString() }), member_user_id: "u1", plan_id: "p1" } });
    await renderDetail(ngozi());
    await userEvent.click(screen.getByRole("button", { name: "Suspend" }));
    const dialog = await screen.findByRole("dialog", { name: "Suspend Ngozi Okafor?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Suspend membership" }));
    expect(suspend).toHaveBeenCalledWith("o1", "s1", "");
    await waitFor(() => expect(screen.getByRole("button", { name: "Lift suspension" })).toBeInTheDocument());
  });
});
