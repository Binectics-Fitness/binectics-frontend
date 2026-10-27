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
vi.mock("@/app/dashboard/gym-owner/members/ConnectedClients", () => ({ ConnectedClients: () => null }));
vi.mock("@/app/dashboard/gym-owner/members/_actions", () => ({ AddMemberButton: () => null, ImportMembersButton: () => null }));
vi.mock("@/app/dashboard/gym-owner/members/import/RecentImports", () => ({ RecentImports: () => null }));
vi.mock("@/app/dashboard/gym-owner/members/[memberId]/TrainerCard", () => ({ TrainerCard: () => null }));
vi.mock("@/components/messaging/StartConversationButton", () => ({
  StartConversationButton: ({ label }: { label?: string }) => <span data-testid="message-member">{label}</span>,
}));
const authState = { user: { id: "owner1" }, isLoading: false };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState }));
const orgState: { currentOrg: Record<string, unknown>; isLoading: boolean } = {
  currentOrg: { _id: "o1", name: "Iron Temple", owner_id: "owner1" },
  isLoading: false,
};
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
const pause = vi.spyOn(marketplaceService, "pauseOrgSubscription");
const resume = vi.spyOn(marketplaceService, "resumeOrgSubscription");
vi.spyOn(marketplaceService, "getOrgMembershipPlans").mockResolvedValue({ success: true, data: [] });
const billingStatus = vi.spyOn(providerBillingApi, "getStatus").mockResolvedValue({ success: false } as never);

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
    expect(within(paused).getByTestId("hold-line")).toHaveTextContent(
      /^Paused by the member since .+ \(4 days\)\. Ends .+ if it resumes today\. Only they can resume it\.$/,
    );
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

  it("offers Pause and Suspend on an active member, Lift on a suspended one, and no Resume on the member's own pause", async () => {
    wrap(<GymMembersClient />);
    await openMenu("Ngozi Okafor");
    expect(screen.getByRole("button", { name: "Suspend…" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pause…" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lift suspension…" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Resume…" })).toBeNull();
    await openMenu("Halima Yusuf");
    expect(screen.getByRole("button", { name: "Lift suspension…" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspend…" })).toBeNull();
    expect(screen.queryByRole("button", { name: /^(Pause|Resume)…$/ })).toBeNull();
    await openMenu("Tunde Bakare");
    expect(screen.queryByRole("button", { name: "Suspend…" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Lift suspension…" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Pause…" })).toBeNull();
    // The member paused it themselves: theirs to end (owner ruling, Oct 20 2026).
    expect(screen.queryByRole("button", { name: "Resume…" })).toBeNull();
    const off = screen.getByTestId("resume-member-pause-disabled");
    expect(off).toBeDisabled();
    expect(off).toHaveTextContent("Tunde Bakare paused this themselves. Only they can resume it.");
  });

  it("offers Resume on a pause the gym started", async () => {
    list.mockResolvedValue({ success: true, data: [{ ...tunde(), paused_by: "gym" }] });
    wrap(<GymMembersClient />);
    await openMenu("Tunde Bakare");
    expect(screen.getByRole("button", { name: "Resume…" })).toBeEnabled();
    expect(screen.queryByTestId("resume-member-pause-disabled")).toBeNull();
  });

  it("doesn't offer Pause on a term that has already ended", async () => {
    list.mockResolvedValue({ success: true, data: [sub({ end_date: new Date(Date.now() - DAY).toISOString() })] });
    wrap(<GymMembersClient />);
    await openMenu("Ngozi Okafor");
    expect(screen.queryByRole("button", { name: "Pause…" })).toBeNull();
  });

  it("pauses after saying the days are given back, buttons disabled while sending", async () => {
    let finish!: (v: unknown) => void;
    pause.mockReturnValue(new Promise((r) => (finish = r)) as never);
    wrap(<GymMembersClient />);
    await openMenu("Ngozi Okafor");
    await userEvent.click(screen.getByRole("button", { name: "Pause…" }));
    const dialog = await screen.findByRole("dialog", { name: "Pause Ngozi Okafor's membership?" });
    const copy = within(dialog).getByTestId("pause-copy");
    expect(copy).toHaveTextContent("They can't check in or book classes while it's paused.");
    expect(copy).toHaveTextContent("The days it's paused are given back: it's due to end on");
    expect(copy).toHaveTextContent("You or they can resume it any time. We'll let them know it's paused.");
    await userEvent.click(within(dialog).getByRole("button", { name: "Pause membership" }));
    expect(pause).toHaveBeenCalledWith("o1", "s1");
    expect(within(dialog).getByRole("button", { name: "Pausing…" })).toBeDisabled();
    expect(within(dialog).getByRole("button", { name: "Keep active" })).toBeDisabled();
    finish({
      success: true,
      data: { ...sub({ status: S.PAUSED, paused_at: new Date().toISOString(), paused_by: "gym" }), member_user_id: "u1", plan_id: "p1" },
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const row = await rowOf("Ngozi Okafor");
    expect(within(row).getByText("Paused")).toBeInTheDocument();
    expect(within(row).getByTestId("hold-line")).toHaveTextContent(/^Paused by the gym since .+ \(0 days\)\. Ends .+ if it resumes today\.$/);
  });

  it("a pause refused while a card renewal is processing says to wait", async () => {
    pause.mockResolvedValue({ success: false, status: 409, code: "RENEWAL_CHARGE_IN_PROGRESS", message: "A renewal payment is being processed." });
    wrap(<GymMembersClient />);
    await openMenu("Ngozi Okafor");
    await userEvent.click(screen.getByRole("button", { name: "Pause…" }));
    const dialog = await screen.findByRole("dialog", { name: "Pause Ngozi Okafor's membership?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Pause membership" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "A card renewal for this membership is being processed. Try again in a few minutes.",
    );
    expect(within(await rowOf("Ngozi Okafor")).getByText("Active")).toBeInTheDocument();
  });

  it("resumes the gym's own pause, naming the new end date", async () => {
    const later = new Date(Date.parse(end) + 4 * DAY).toISOString();
    list.mockResolvedValue({ success: true, data: [ngozi(), { ...tunde(), paused_by: "gym" }, halima()] });
    resume.mockResolvedValue({ success: true, data: { ...sub({ _id: "s2", status: S.ACTIVE, end_date: later, paused_at: null }), member_user_id: "u2", plan_id: "p1" } });
    wrap(<GymMembersClient />);
    await openMenu("Tunde Bakare");
    await userEvent.click(screen.getByRole("button", { name: "Resume…" }));
    const dialog = await screen.findByRole("dialog", { name: "Resume Tunde Bakare's membership?" });
    expect(within(dialog).getByTestId("resume-copy")).toHaveTextContent(
      /^They can check in and book again straight away\. The paused days are added back, so it now runs to .+\. We'll let them know\.$/,
    );
    await userEvent.click(within(dialog).getByRole("button", { name: "Resume membership" }));
    expect(resume).toHaveBeenCalledWith("o1", "s2");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const row = await rowOf("Tunde Bakare");
    expect(within(row).getByText("Active")).toBeInTheDocument();
    expect(within(row).queryByTestId("hold-line")).toBeNull();
  });

  it("staff without member management get no Pause or Resume", async () => {
    authState.user = { id: "staff1" };
    const owned = orgState.currentOrg;
    orgState.currentOrg = { ...owned, is_owner: false, my_permissions: ["team:view_members"] };
    try {
      wrap(<GymMembersClient />);
      await openMenu("Ngozi Okafor");
      expect(screen.getByRole("button", { name: "View details" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Pause…" })).toBeNull();
      await openMenu("Tunde Bakare");
      expect(screen.queryByRole("button", { name: "Resume…" })).toBeNull();
    } finally {
      authState.user = { id: "owner1" };
      orgState.currentOrg = owned;
    }
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

  it("an active member: Pause and Suspend", async () => {
    await renderDetail(ngozi());
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resume" })).toBeNull();
    expect(screen.getByRole("button", { name: "Suspend" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Lift suspension" })).toBeNull();
  });

  it("a suspended member: Lift suspension, and the reason in the details", async () => {
    await renderDetail(halima());
    expect(screen.getByRole("button", { name: "Lift suspension" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspend" })).toBeNull();
    expect(screen.getByText(/Suspended since .+: “Outstanding balance from March”/)).toBeInTheDocument();
  });

  it("a member's own pause: Resume disabled with why, and the pause in the details", async () => {
    await renderDetail(tunde());
    const resumeBtn = screen.getByRole("button", { name: "Resume" });
    expect(resumeBtn).toBeDisabled();
    expect(resumeBtn).toHaveAccessibleDescription("Tunde Bakare paused this themselves. Only they can resume it.");
    // Said once, next to the button, not again in the details.
    expect(screen.getAllByText(/Only they can resume it\./)).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "Pause" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Suspend" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Lift suspension" })).toBeNull();
    expect(screen.getByText(/Paused by the member since .+ \(4 days\)\. Ends .+ if it resumes today\./)).toBeInTheDocument();
  });

  it("a pause the gym started: Resume", async () => {
    await renderDetail({ ...tunde(), paused_by: "gym" });
    expect(screen.getByRole("button", { name: "Resume" })).toBeEnabled();
    expect(screen.queryByText(/paused this themselves/)).toBeNull();
  });

  it("pauses from the page and shows the new state", async () => {
    pause.mockResolvedValue({ success: true, data: { ...sub({ status: S.PAUSED, paused_at: new Date().toISOString(), paused_by: "gym" }), member_user_id: "u1", plan_id: "p1" } });
    await renderDetail(ngozi());
    await userEvent.click(screen.getByRole("button", { name: "Pause" }));
    const dialog = await screen.findByRole("dialog", { name: "Pause Ngozi Okafor's membership?" });
    await userEvent.click(within(dialog).getByRole("button", { name: "Pause membership" }));
    expect(pause).toHaveBeenCalledWith("o1", "s1");
    await waitFor(() => expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument());
    expect(screen.getByText(/^Paused by the gym since/)).toBeInTheDocument();
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

describe("the members list for a gym's staff", () => {
  it("doesn't ask for the owner's billing status, and still lists the members", async () => {
    list.mockResolvedValue({ success: true, data: [ngozi()] });
    billingStatus.mockClear();
    authState.user = { id: "staff1" };
    try {
      wrap(<GymMembersClient />);
      expect(await screen.findByText("Ngozi Okafor")).toBeInTheDocument();
      expect(billingStatus).not.toHaveBeenCalled();
    } finally {
      authState.user = { id: "owner1" };
    }
  });

  it("asks for it for the owner (the seat line)", async () => {
    list.mockResolvedValue({ success: true, data: [ngozi()] });
    billingStatus.mockClear();
    wrap(<GymMembersClient />);
    await screen.findByText("Ngozi Okafor");
    expect(billingStatus).toHaveBeenCalledWith("o1");
  });

  // The owner rule is the gym dashboard's one (useGymViewer), not a string
  // compare of owner_id: a populated owner_id, or the API's is_owner flag.
  it.each([
    ["owner_id arrives populated", { owner_id: { _id: "owner1" } }],
    ["the API says is_owner", { owner_id: undefined, is_owner: true }],
  ])("knows the owner when %s: billing status and Card renewals", async (_label, over) => {
    const owned = orgState.currentOrg;
    orgState.currentOrg = { ...owned, ...over };
    try {
      list.mockResolvedValue({ success: true, data: [ngozi()] });
      billingStatus.mockClear();
      wrap(<GymMembersClient />);
      await screen.findByText("Ngozi Okafor");
      expect(billingStatus).toHaveBeenCalledWith("o1");
      expect(screen.getByRole("link", { name: "Card renewals" })).toHaveAttribute("href", "/dashboard/gym-owner/card-renewals");
    } finally {
      orgState.currentOrg = owned;
    }
  });

  it("a member of staff the API says isn't the owner gets neither, even with a matching owner_id", async () => {
    const owned = orgState.currentOrg;
    orgState.currentOrg = { ...owned, is_owner: false, my_permissions: ["marketplace:manage_listing"] };
    try {
      list.mockResolvedValue({ success: true, data: [ngozi()] });
      billingStatus.mockClear();
      wrap(<GymMembersClient />);
      await screen.findByText("Ngozi Okafor");
      expect(billingStatus).not.toHaveBeenCalled();
      expect(screen.queryByRole("link", { name: "Card renewals" })).toBeNull();
    } finally {
      orgState.currentOrg = owned;
    }
  });
});

describe("messaging a member from the list", () => {
  const owned = orgState.currentOrg;
  const asStaff = (permissions: string[]) => {
    authState.user = { id: "staff1" };
    orgState.currentOrg = { ...owned, my_permissions: permissions };
  };
  const restore = () => {
    authState.user = { id: "owner1" };
    orgState.currentOrg = owned;
  };

  it("is offered to the owner and to staff who answer the gym's inbox", async () => {
    list.mockResolvedValue({ success: true, data: [ngozi()] });
    for (const setup of [() => undefined, () => asStaff(["marketplace:manage_listing", "messaging:answer_members"])]) {
      setup();
      try {
        const { unmount } = wrap(<GymMembersClient />);
        await openMenu("Ngozi Okafor");
        expect(screen.getByTestId("message-member")).toBeInTheDocument();
        unmount();
      } finally {
        restore();
      }
    }
  });

  it("is not offered to staff whose role can't answer members (the API would refuse)", async () => {
    list.mockResolvedValue({ success: true, data: [ngozi()] });
    asStaff(["marketplace:manage_listing"]);
    try {
      wrap(<GymMembersClient />);
      await openMenu("Ngozi Okafor");
      expect(screen.getByRole("button", { name: "View details" })).toBeInTheDocument();
      expect(screen.queryByTestId("message-member")).toBeNull();
    } finally {
      restore();
    }
  });
});
