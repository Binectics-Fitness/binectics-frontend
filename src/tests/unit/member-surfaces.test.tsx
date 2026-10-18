import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MemberHomePage from "@/app/dashboard/member/page";
import { membershipNotice } from "@/app/dashboard/member/memberHome";
import { GymClassesLink, gymClassesHref } from "@/app/dashboard/member/_components/GymClassesLink";
import { MemberDashboardShell, MEMBER_NAV_LINKS, isMemberNavActive } from "@/components/ds/MemberDashboardShell";
import { checkinsService } from "@/lib/api/checkins";
import { classBookingsService } from "@/lib/api/classBookings";
import { consultationsService } from "@/lib/api/consultations";
import { loyaltyService } from "@/lib/api/loyalty";
import { marketplaceService } from "@/lib/api/marketplace";
import { myProgramsService, type MyProgram } from "@/lib/api/myPrograms";
import { progressService } from "@/lib/api/progress";
import { MembershipPlanType, MembershipSubscriptionStatus, type MembershipSubscription } from "@/lib/types";
import { resetClientNowForTests } from "@/lib/ui/useClientNow";
import { isAppRoute } from "./appRoutes";

/**
 * Discoverability W3 on the member's own pages: Billing in the nav, the one
 * membership card on home (F8), the "tasks are in the app" line (F17) and
 * the way from My gym to the gym's classes (F15).
 */

let mockPathname = "/dashboard/member";
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => mockPathname,
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", role: "USER", first_name: "Yemi" }, isLoading: false, logout: vi.fn() }),
}));
vi.mock("@/contexts/OrganizationContext", () => {
  const value = () => ({ organizations: [], currentOrg: null, isLoading: false, setCurrentOrg: vi.fn() });
  return { useOrganization: value, useOptionalOrganization: value };
});
vi.mock("@/hooks/useRequireAuth", () => ({ useRoleGuard: () => ({ isAuthorized: true }) }));
vi.mock("@/components/messaging/queries", () => ({ useMessagingUnread: () => 0 }));
vi.mock("@/components/ds/ShellNotificationBell", () => ({ ShellNotificationBell: () => null }));
vi.mock("@/components/messaging/StartConversationButton", () => ({
  StartConversationButton: ({ label, ariaLabel, organizationId }: { label?: string; ariaLabel?: string; organizationId?: string }) => (
    <button type="button" aria-label={ariaLabel} data-org={organizationId}>
      {label}
    </button>
  ),
}));
vi.mock("@/components/messaging/MyCoachesCard", async (orig) => ({
  ...(await orig<typeof import("@/components/messaging/MyCoachesCard")>()),
  MyCoachesCard: () => null,
}));
vi.mock("@/app/dashboard/member/_components/EnrollmentOffersCard", () => ({ EnrollmentOffersCard: () => null }));

const NOW = new Date(2026, 9, 7, 10, 0, 0); // Wed 7 Oct 2026, local
const DAY = 86_400_000;
const inDays = (n: number) => new Date(NOW.getTime() + n * DAY).toISOString();
const fmt = (iso: string) => iso.slice(0, 10);

const sub = (over: Partial<MembershipSubscription> = {}): MembershipSubscription =>
  ({
    _id: "s1",
    organization_id: { _id: "g1", name: "Iron Temple" },
    listing_id: { _id: "l1", headline: "Iron Temple Ikeja" },
    plan_id: {
      _id: "p1",
      name: "Monthly",
      plan_type: MembershipPlanType.SUBSCRIPTION,
      duration_days: 30,
      price_minor: 2_500_000,
      currency: "NGN",
      features: [],
    },
    status: MembershipSubscriptionStatus.ACTIVE,
    start_date: inDays(-25),
    end_date: inDays(3),
    amount_paid_minor: 2_500_000,
    currency: "NGN",
    auto_renew: false,
    collection_method: "pay_link",
    ...over,
  }) as MembershipSubscription;

const withQuery = (ui: React.ReactElement) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
);

describe("membershipNotice (F8)", () => {
  it("offers Renew for a term ending this week that nothing renews", () => {
    expect(membershipNotice([sub()], NOW, fmt)).toEqual({
      subscriptionId: "s1",
      kind: "ending",
      title: `Your Iron Temple Ikeja membership ends ${inDays(3).slice(0, 10)}`,
      body: "It won't renew on its own. Renew now to keep your access.",
      renewHref: "/checkout?listing=l1&plan=p1",
      ask: null,
      billingHref: "/dashboard/member/billing?subscriptionId=s1",
    });
  });

  it("says nothing about a term weeks away, one a saved card renews, one cancelled, or a one-time plan", () => {
    expect(membershipNotice([sub({ end_date: inDays(20) })], NOW, fmt)).toBeNull();
    expect(membershipNotice([sub({ auto_renew: true, collection_method: "card_auto" })], NOW, fmt)).toBeNull();
    expect(membershipNotice([sub({ cancel_requested_at: inDays(-2) })], NOW, fmt)).toBeNull();
    const oneTime = sub();
    (oneTime.plan_id as { plan_type: MembershipPlanType }).plan_type = MembershipPlanType.ONE_TIME;
    expect(membershipNotice([oneTime], NOW, fmt)).toBeNull();
    expect(membershipNotice([], NOW, fmt)).toBeNull();
  });

  it("says nothing about a paused or suspended membership", () => {
    for (const status of [MembershipSubscriptionStatus.PAUSED, MembershipSubscriptionStatus.SUSPENDED]) {
      expect(membershipNotice([sub({ status })], NOW, fmt)).toBeNull();
    }
  });

  it("puts an overdue payment first, with Renew and the grace date", () => {
    const due = sub({ _id: "s2", status: MembershipSubscriptionStatus.PAST_DUE, end_date: inDays(-1), grace_expires_at: inDays(5) });
    const n = membershipNotice([sub(), due], NOW, fmt);
    expect(n).toMatchObject({
      subscriptionId: "s2",
      kind: "past_due",
      title: "Your Iron Temple Ikeja payment is overdue",
      body: `Pay by ${inDays(5).slice(0, 10)} to keep your access.`,
      renewHref: "/checkout?listing=l1&plan=p1",
      billingHref: "/dashboard/member/billing?subscriptionId=s2",
    });
  });

  it("never asks to pay again while the saved card will be retried", () => {
    const retrying = sub({
      status: MembershipSubscriptionStatus.PAST_DUE,
      auto_renew: true,
      collection_method: "card_auto",
      renewal_retry: { pending: true, next_attempt_at: inDays(1) },
    });
    const n = membershipNotice([retrying], NOW, fmt);
    expect(n?.renewHref).toBeNull();
    expect(n?.body).toBe(`We'll try your card again on ${inDays(1).slice(0, 10)}. You don't need to do anything yet.`);
  });

  it("points to Billing, not Renew, when the overdue membership is still on the saved card and no retry is left", () => {
    const onCard = sub({
      _id: "s3",
      status: MembershipSubscriptionStatus.PAST_DUE,
      auto_renew: true,
      collection_method: "card_auto",
      renewal_retry: { pending: false, next_attempt_at: null },
      grace_expires_at: inDays(5),
    });
    const n = membershipNotice([onCard], NOW, fmt);
    expect(n).toMatchObject({
      kind: "past_due",
      renewHref: null,
      billingHref: "/dashboard/member/billing?subscriptionId=s3",
      body: "Your saved card is still set to pay for it. Open Billing to see your options.",
    });
  });

  it("names the gym when the membership has no listing (enrolled by the gym)", () => {
    const n = membershipNotice([sub({ listing_id: undefined, status: MembershipSubscriptionStatus.PAST_DUE })], NOW, fmt);
    expect(n?.title).toBe("Your Iron Temple payment is overdue");
    // No listing, no checkout: Billing is the way.
    expect(n?.renewHref).toBeNull();
    // An API that sends no renewal_listing_id: whether the gym has a listing
    // isn't known, so nobody is told to ask the gym.
    expect(n?.ask).toBeNull();
  });

  it("renews a gym-enrolled membership through the listing the API names", () => {
    const enrolled = sub({ listing_id: undefined, renewal_listing_id: "gl1" });
    expect(membershipNotice([enrolled], NOW, fmt)).toMatchObject({
      kind: "ending",
      renewHref: "/checkout?listing=gl1&plan=p1",
      ask: null,
    });
    const due = sub({ listing_id: undefined, renewal_listing_id: "gl1", status: MembershipSubscriptionStatus.PAST_DUE });
    expect(membershipNotice([due], NOW, fmt)?.renewHref).toBe("/checkout?listing=gl1&plan=p1");
  });

  it("prefers renewal_listing_id (the listing that sells the plan) over the membership's own", () => {
    expect(membershipNotice([sub({ renewal_listing_id: "l2" })], NOW, fmt)?.renewHref).toBe("/checkout?listing=l2&plan=p1");
    // Explicit null with an own listing: the API found it can't be opened,
    // so no Renew (its checkout would 404); the member asks the gym.
    expect(membershipNotice([sub({ renewal_listing_id: null })], NOW, fmt)).toMatchObject({
      renewHref: null,
      ask: { gymName: "Iron Temple", organizationId: "g1", canMessage: true },
      body: "It won't renew on its own. Ask Iron Temple to renew it.",
    });
  });

  it("prompts a member on a free plan whose gym moved them to a paid next plan (renewal_plan_id)", () => {
    const plan = sub().plan_id as Exclude<MembershipSubscription["plan_id"], string>;
    const free = { ...plan, price_minor: 0 };
    // Judged by the free current plan alone: no card.
    expect(membershipNotice([sub({ plan_id: free })], NOW, fmt)).toBeNull();
    expect(
      membershipNotice([sub({ plan_id: free, renewal_listing_id: "l2", renewal_plan_id: "p-next" })], NOW, fmt),
    ).toMatchObject({ kind: "ending", renewHref: "/checkout?listing=l2&plan=p-next", ask: null });
    // A paid current plan whose listing sells no renewal plan: ask the gym.
    expect(membershipNotice([sub({ renewal_listing_id: "l2", renewal_plan_id: null })], NOW, fmt)).toMatchObject({
      renewHref: null,
      ask: { gymName: "Iron Temple" },
    });
  });

  it("asks the gym to renew when the API says it has no listing", () => {
    const due = sub({
      listing_id: undefined,
      renewal_listing_id: null,
      status: MembershipSubscriptionStatus.PAST_DUE,
      grace_expires_at: inDays(5),
    });
    expect(membershipNotice([due], NOW, fmt)).toMatchObject({
      kind: "past_due",
      renewHref: null,
      ask: { gymName: "Iron Temple", organizationId: "g1", canMessage: true },
      body: `You keep access until ${inDays(5).slice(0, 10)}. Ask Iron Temple to renew it.`,
    });
    const ending = sub({ listing_id: undefined, renewal_listing_id: null });
    expect(membershipNotice([ending], NOW, fmt)).toMatchObject({
      kind: "ending",
      renewHref: null,
      ask: { gymName: "Iron Temple", organizationId: "g1", canMessage: true },
      body: "It won't renew on its own. Ask Iron Temple to renew it.",
    });
  });

  it("never offers Renew or ask for a past-due membership whose card will be retried, even with a listing named", () => {
    const retrying = sub({
      status: MembershipSubscriptionStatus.PAST_DUE,
      collection_method: "card_auto",
      auto_renew: false,
      renewal_listing_id: null,
      listing_id: undefined,
    });
    // No renewal_retry from the API: card_auto + past due is still retried.
    const n = membershipNotice([retrying], NOW, fmt);
    expect(n).toMatchObject({ renewHref: null, ask: null, body: "We'll try your card again soon. You don't need to do anything yet." });
  });
});

describe("membership card on home: ask the gym", () => {
  it("shows Message (not Renew) when the gym has no listing and its inbox takes the member", async () => {
    const { MembershipNoticeCard } = await import("@/app/dashboard/member/_components/MembershipNoticeCard");
    const due = sub({ listing_id: undefined, renewal_listing_id: null, status: MembershipSubscriptionStatus.PAST_DUE });
    render(<MembershipNoticeCard notice={membershipNotice([due], NOW, fmt)!} />);
    const card = screen.getByTestId("membership-notice");
    expect(within(card).queryByRole("link", { name: "Renew" })).toBeNull();
    const message = within(card).getByRole("button", { name: "Message Iron Temple about renewing" });
    expect(message).toHaveAttribute("data-org", "g1");
    expect(within(card).getByRole("link", { name: "Billing" })).toBeInTheDocument();
  });

  it("shows no Message when the member can't message the gym", async () => {
    const { MembershipNoticeCard } = await import("@/app/dashboard/member/_components/MembershipNoticeCard");
    render(
      <MembershipNoticeCard
        notice={{
          subscriptionId: "s1",
          kind: "ending",
          title: "t",
          body: "It won't renew on its own. Ask Iron Temple to renew it.",
          renewHref: null,
          ask: { gymName: "Iron Temple", organizationId: "g1", canMessage: false },
          billingHref: "/dashboard/member/billing?subscriptionId=s1",
        }}
      />,
    );
    const card = screen.getByTestId("membership-notice");
    expect(within(card).queryByRole("button")).toBeNull();
    expect(within(card).getByRole("link", { name: "Billing" })).toHaveClass("btn-primary-v2");
  });
});

describe("member home: one membership card and the app line", () => {
  const ok = <T,>(data: T) => Promise.resolve({ success: true, data });
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    resetClientNowForTests();
    vi.spyOn(checkinsService, "getMyDashboardStats").mockReturnValue(ok({ has_checked_in_today: false, current_streak_days: 0, total_check_ins: 0 }));
    vi.spyOn(checkinsService, "getMyHistory").mockReturnValue(ok([]));
    vi.spyOn(consultationsService, "getMyBookings").mockReturnValue(ok([]));
    vi.spyOn(classBookingsService, "getMyClassBookings").mockReturnValue(ok([]));
    vi.spyOn(loyaltyService, "getPrograms").mockReturnValue(ok([]));
    vi.spyOn(progressService, "getMyOwnProfiles").mockReturnValue(ok([]));
    vi.spyOn(marketplaceService, "getMyMembershipSubscriptions").mockReturnValue(ok([]));
    vi.spyOn(marketplaceService, "getMyProviders").mockReturnValue(ok({ professionals: [], gyms: [] }));
    vi.spyOn(myProgramsService, "listMine").mockReturnValue(ok([]));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows an ending membership with Renew and Billing, both real pages", async () => {
    vi.spyOn(marketplaceService, "getMyMembershipSubscriptions").mockReturnValue(ok([sub()]));
    render(withQuery(<MemberHomePage />));
    const card = await screen.findByTestId("membership-notice");
    expect(within(card).getByRole("heading", { name: /Your Iron Temple Ikeja membership ends/ })).toBeInTheDocument();
    const renew = within(card).getByRole("link", { name: "Renew" });
    const billing = within(card).getByRole("link", { name: "Billing" });
    expect(renew).toHaveAttribute("href", "/checkout?listing=l1&plan=p1");
    expect(billing).toHaveAttribute("href", "/dashboard/member/billing?subscriptionId=s1");
    expect(isAppRoute(renew.getAttribute("href")!)).toBe(true);
    expect(isAppRoute(billing.getAttribute("href")!)).toBe(true);
    expect(screen.getAllByTestId("membership-notice")).toHaveLength(1);
  });

  it("shows no membership card when nothing needs the member", async () => {
    vi.spyOn(marketplaceService, "getMyMembershipSubscriptions").mockReturnValue(ok([sub({ end_date: inDays(25) })]));
    render(withQuery(<MemberHomePage />));
    await waitFor(() => expect(screen.getByText("Nothing booked")).toBeInTheDocument());
    expect(screen.queryByTestId("membership-notice")).toBeNull();
  });

  it("tells a program client their tasks are in the app, and nobody else", async () => {
    const program: MyProgram = {
      _id: "p1",
      kind: "program",
      name: "Strength foundations",
      status: "active",
      progress: { day: 7, total_days: 28, last_7_days: { scheduled: 12, done: 9, done_late: 1, skipped: 0, missed: 2, open: 1 } },
    };
    vi.spyOn(myProgramsService, "listMine").mockReturnValue(ok([program]));
    const { unmount } = render(withQuery(<MemberHomePage />));
    expect(await screen.findByTestId("tasks-in-app")).toHaveTextContent("Your daily tasks are in the Binectics app on your phone.");
    unmount();

    vi.spyOn(myProgramsService, "listMine").mockReturnValue(ok([]));
    render(withQuery(<MemberHomePage />));
    await waitFor(() => expect(screen.getByText("Nothing booked")).toBeInTheDocument());
    expect(screen.queryByTestId("tasks-in-app")).toBeNull();
  });
});

describe("Classes on My gym (F15)", () => {
  const ok = <T,>(data: T) => Promise.resolve({ success: true, data });
  afterEach(() => vi.restoreAllMocks());
  const gymClass = { _id: "c1", name: "Spin", day_of_week: 2, start_time: "07:00", duration_minutes: 45, capacity: 12 };

  it("links to the gym listing's schedule when it has classes", async () => {
    vi.spyOn(marketplaceService, "getMyProviders").mockReturnValue(
      ok({ professionals: [], gyms: [{ organization_id: "g1", name: "Iron Temple", listing: { _id: "l9" } }] }),
    );
    const classes = vi.spyOn(classBookingsService, "getListingClasses").mockReturnValue(ok([gymClass]) as never);
    render(withQuery(<GymClassesLink organizationId="g1" gymName="Iron Temple" />));
    const link = await screen.findByRole("link", { name: "Book a class at Iron Temple" });
    expect(link).toHaveTextContent("Classes");
    expect(link).toHaveAttribute("href", "/marketplace/l9#schedule");
    expect(isAppRoute(link.getAttribute("href")!)).toBe(true);
    expect(classes).toHaveBeenCalledWith("l9");
  });

  it("shows nothing for a gym without classes, or without a listing that opens", async () => {
    vi.spyOn(marketplaceService, "getMyProviders").mockReturnValue(
      ok({
        professionals: [],
        gyms: [
          { organization_id: "g1", name: "Iron Temple", listing: { _id: "l9" } },
          { organization_id: "g2", name: "No Listing Gym", listing: null },
        ],
      }),
    );
    const classes = vi.spyOn(classBookingsService, "getListingClasses").mockReturnValue(ok([]) as never);
    const { container } = render(
      withQuery(
        <>
          <GymClassesLink organizationId="g1" gymName="Iron Temple" />
          <GymClassesLink organizationId="g2" gymName="No Listing Gym" />
        </>,
      ),
    );
    await waitFor(() => expect(classes).toHaveBeenCalledTimes(1));
    expect(classes).toHaveBeenCalledWith("l9");
    expect(container.querySelector("a")).toBeNull();
  });

  it("builds a real route", () => {
    expect(isAppRoute(gymClassesHref("abc123"))).toBe(true);
  });
});

describe("member nav (F8)", () => {
  it("has Billing, and every link is a real page", () => {
    expect(MEMBER_NAV_LINKS.map((l) => l.label)).toContain("Billing");
    expect(MEMBER_NAV_LINKS.find((l) => l.label === "Billing")?.href).toBe("/dashboard/member/billing");
    for (const link of MEMBER_NAV_LINKS) expect(isAppRoute(link.href)).toBe(true);
  });

  it("marks the page by its label, or by its address when it names none", () => {
    const billing = { label: "Billing", href: "/dashboard/member/billing" };
    const home = { label: "Home", href: "/dashboard/member" };
    expect(isMemberNavActive(billing, "", "/dashboard/member/billing")).toBe(true);
    expect(isMemberNavActive(home, "", "/dashboard/member/billing")).toBe(false);
    expect(isMemberNavActive(home, "Home", "/dashboard/member/billing")).toBe(true);
    expect(isMemberNavActive(billing, "Home", "/dashboard/member/billing")).toBe(false);
  });

  it("shows Billing as the current page on the billing page", () => {
    mockPathname = "/dashboard/member/billing";
    render(withQuery(<MemberDashboardShell activeLabel=""><p>billing</p></MemberDashboardShell>));
    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    const billing = within(nav).getByRole("link", { name: "Billing" });
    expect(billing).toHaveAttribute("href", "/dashboard/member/billing");
    expect(billing).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    mockPathname = "/dashboard/member";
  });
});
