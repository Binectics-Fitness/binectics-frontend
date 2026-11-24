import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render as rtlRender, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { mockCoachedTodayReads } from "./coachedTodayMocks";
import MemberHomePage from "@/app/dashboard/member/page";
import { activeGyms, lastCheckInLabel, nextUp, weightSummary } from "@/app/dashboard/member/memberHome";
import { currentProgramDay, myProgramsService, type MyProgram } from "@/lib/api/myPrograms";
import { memberGoalsService } from "@/lib/api/memberGoals";
import { CHECKED_IN_TODAY, lastVisit, visitsThisWeek } from "@/lib/checkins/visitsCopy";
import { checkinsService } from "@/lib/api/checkins";
import { classBookingsService, type ClassBooking } from "@/lib/api/classBookings";
import { consultationsService, ConsultationBookingStatus, type ConsultationBooking } from "@/lib/api/consultations";
import { loyaltyService } from "@/lib/api/loyalty";
import { marketplaceService } from "@/lib/api/marketplace";
import { progressService, type WeightLog } from "@/lib/api/progress";
import { MembershipSubscriptionStatus, type MembershipSubscription } from "@/lib/types";
import { resetClientNowForTests } from "@/lib/ui/useClientNow";
import { PROGRAM_ABOUT_COPY } from "@/lib/programs/aboutCopy";

// These tests are about the non-solo shell; the solo answer is a separate read.
vi.mock("@/hooks/useIsSoloMember", () => ({ useIsSoloMember: () => ({ solo: false, isLoading: false }) }));
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { first_name: "Yemi", country_code: "NG" } }) }));
vi.mock("@/hooks/useRequireAuth", () => ({ useRoleGuard: () => ({ isAuthorized: true }) }));
vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/messaging/StartConversationButton", () => ({ StartConversationButton: () => null }));
// Covered in its own test (it needs a QueryClient); not part of this page's layout checks.
vi.mock("@/app/dashboard/member/_components/EnrollmentOffersCard", () => ({ EnrollmentOffersCard: () => null }));
// Needs a QueryClient too; covered in member-surfaces.test.tsx.
vi.mock("@/app/dashboard/member/_components/GymClassesLink", () => ({ GymClassesLink: () => null }));

const NOW = new Date(2026, 9, 7, 10, 0, 0); // Wed 7 Oct 2026, local
const at = (daysAgo: number, h = 8) =>
  new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - daysAgo, h).toISOString();

const program = (over: Partial<MyProgram> = {}): MyProgram => ({
  _id: "p1",
  kind: "program",
  name: "Strength foundations",
  status: "active",
  progress: {
    day: 7,
    total_days: 28,
    last_7_days: { scheduled: 12, done: 9, done_late: 1, skipped: 0, missed: 2, open: 1 },
  },
  ...over,
});

const booking = (over: Partial<ConsultationBooking> = {}): ConsultationBooking => ({
  id: "b1",
  clientUserId: "c",
  providerId: "p",
  consultationTypeId: "t",
  consultationTypeName: "Strength session",
  startsAt: new Date(NOW.getTime() + 86_400_000).toISOString(),
  endsAt: new Date(NOW.getTime() + 86_400_000 + 45 * 60_000).toISOString(),
  providerTimezone: "Africa/Lagos",
  clientTimezone: "Africa/Lagos",
  status: ConsultationBookingStatus.CONFIRMED,
  createdAt: "",
  updatedAt: "",
  ...over,
});

const weightLog = (kg: number, recorded_at: string): WeightLog => ({
  _id: recorded_at,
  client_profile_id: "cp",
  client_id: "c",
  weight_kg: kg,
  recorded_at,
  logged_by: "c",
  created_at: recorded_at,
  updated_at: recorded_at,
});

describe("currentProgramDay", () => {
  it("headlines the newest active program that is under way", () => {
    expect(currentProgramDay([program()])).toEqual({
      id: "p1",
      name: "Strength foundations",
      day: 7,
      totalDays: 28,
      week: { done: 9, scheduled: 12 },
    });
  });

  it("skips one-off task holders, paused, unstarted and finished programs", () => {
    const skip = [
      program({ kind: "one_off", name: "From Ada" }),
      program({ status: "paused" }),
      program({ progress: { day: null, total_days: 28, last_7_days: program().progress!.last_7_days } }),
      program({ progress: { day: 30, total_days: 28, last_7_days: program().progress!.last_7_days } }),
    ];
    expect(currentProgramDay(skip)).toBeNull();
    expect(currentProgramDay([...skip, program({ name: "Mobility" })])?.name).toBe("Mobility");
  });

  it("has no total for an open-ended program and no week line when nothing was due", () => {
    const open = program({
      progress: {
        day: 3,
        total_days: null,
        last_7_days: { scheduled: 0, done: 0, done_late: 0, skipped: 0, missed: 0, open: 0 },
      },
    });
    expect(currentProgramDay([open])).toMatchObject({ day: 3, totalDays: null, week: null });
  });
});

describe("member home helpers", () => {
  it("picks the soonest confirmed booking or class, skipping waitlists and the past", () => {
    const later = booking({ id: "later", startsAt: new Date(NOW.getTime() + 3 * 86_400_000).toISOString() });
    const past = booking({ id: "past", startsAt: new Date(NOW.getTime() - 3_600_000).toISOString() });
    const cancelled = booking({ id: "x", status: ConsultationBookingStatus.CANCELLED });
    const tomorrow = new Date(NOW.getTime() + 86_400_000);
    const ymd = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
    const cls = (status: ClassBooking["status"], time: string): ClassBooking => ({
      _id: `c-${status}-${time}`,
      class_id: { _id: "k", name: "Spin", start_time: time, duration_minutes: 45, instructor_name: "Kemi", day_of_week: 4 },
      organization_id: "o",
      member_user_id: "u",
      booking_date: ymd,
      status,
      cancelled_at: null,
      cancellation_fee_applied: false,
      created_at: "",
      updated_at: "",
    });

    // The waitlisted 06:00 class doesn't count; the confirmed 07:00 one beats tomorrow's 10:00 consultation.
    const item = nextUp([later, past, cancelled, booking()], [cls("waitlisted", "06:00"), cls("confirmed", "07:00")], NOW.getTime());
    expect(item?.kind).toBe("class");
    expect(item?.title).toBe("Spin");
    expect(item?.meta).toContain("07:00 · 45 min · Kemi");

    const consult = nextUp([later, booking()], [], NOW.getTime());
    expect(consult?.id).toBe("b1");
    expect(consult?.meta).toMatch(/45 min$/);
    expect(nextUp([past, cancelled], [], NOW.getTime())).toBeNull();
  });

  it("shows a weight change only with two logs in 30 days, dated from the older one", () => {
    expect(weightSummary([], NOW.getTime())).toBeNull();
    expect(weightSummary([weightLog(73.4, at(2))], NOW.getTime())?.delta).toMatch(/^Logged /);
    // The 45-day-old log is outside the window, so there is still only one.
    expect(weightSummary([weightLog(73.4, at(2)), weightLog(80, at(45))], NOW.getTime())?.delta).toMatch(/^Logged /);
    const s = weightSummary([weightLog(75.2, at(20)), weightLog(73.4, at(2)), weightLog(74, at(10))], NOW.getTime());
    expect(s?.kg).toBe(73.4);
    expect(s?.delta).toMatch(/^↓ 1\.8 kg since /);
    expect(weightSummary([weightLog(70, at(9)), weightLog(70, at(1))], NOW.getTime())?.delta).toMatch(/^No change since /);
  });

  it("labels the last check-in by calendar day", () => {
    expect(lastCheckInLabel(undefined, NOW)).toBe("No check-ins yet");
    expect(lastCheckInLabel(at(0), NOW)).toBe("Today");
    expect(lastCheckInLabel(new Date(NOW.getFullYear(), NOW.getMonth(), NOW.getDate() - 1, 23, 50).toISOString(), NOW)).toBe("Yesterday");
    expect(lastCheckInLabel(at(3), NOW)).toBe("3 days ago");
  });

  it("lists active, unexpired gyms once each", () => {
    const sub = (over: Partial<MembershipSubscription>): MembershipSubscription =>
      ({ status: MembershipSubscriptionStatus.ACTIVE, organization_id: { _id: "g1", name: "Dapo" }, ...over }) as MembershipSubscription;
    expect(
      activeGyms(
        [
          sub({}),
          sub({}),
          sub({ status: MembershipSubscriptionStatus.PAUSED, organization_id: { _id: "g2", name: "B" } } as Partial<MembershipSubscription>),
          sub({ end_date: at(1), organization_id: { _id: "g3", name: "C" } } as Partial<MembershipSubscription>),
        ],
        NOW.getTime(),
      ),
    ).toEqual([{ orgId: "g1", name: "Dapo" }]);
  });
});

/** The coached Today reads through react-query: each render gets a fresh client. */
const render = (ui: React.ReactElement) =>
  rtlRender(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

describe("member home page", () => {
  const ok = <T,>(data: T) => Promise.resolve({ success: true, data });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    resetClientNowForTests();
    vi.spyOn(checkinsService, "getMyDashboardStats").mockReturnValue(ok({ has_checked_in_today: false, total_check_ins: 0 }));
    vi.spyOn(checkinsService, "getMyHistory").mockReturnValue(ok([]));
    vi.spyOn(memberGoalsService, "getSettings").mockReturnValue(ok({ week_start: "monday" }));
    vi.spyOn(consultationsService, "getMyBookings").mockReturnValue(ok([]));
    vi.spyOn(classBookingsService, "getMyClassBookings").mockReturnValue(ok([]));
    vi.spyOn(loyaltyService, "getPrograms").mockReturnValue(ok([]));
    vi.spyOn(progressService, "getMyOwnProfiles").mockReturnValue(ok([]));
    vi.spyOn(marketplaceService, "getMyMembershipSubscriptions").mockReturnValue(ok([]));
    vi.spyOn(myProgramsService, "listMine").mockReturnValue(ok([]));
    vi.spyOn(myProgramsService, "about").mockReturnValue(ok({ description: null, cautions: null }));
    mockCoachedTodayReads();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("greets by first name in one plain title (no serif italic)", async () => {
    render(<MemberHomePage />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Hey, Yemi.");
    expect(h1.querySelector("em")).toBeNull();
    expect(await screen.findByTestId("own-tracking-full")).toBeInTheDocument();
  });

  it("shows a program client 'Day N of M' with a real bar", async () => {
    vi.spyOn(myProgramsService, "listMine").mockReturnValue(ok([program()]));
    render(<MemberHomePage />);
    const bar = await screen.findByRole("progressbar", { name: "Progress through Strength foundations" });
    expect(bar).toHaveAttribute("aria-valuenow", "7");
    expect(bar).toHaveAttribute("aria-valuemax", "28");
    expect(screen.getByText("Day 7")).toBeInTheDocument();
    expect(screen.getByText("of 28")).toBeInTheDocument();
    // One line under the number, as on the phone (board R5).
    expect(screen.getByText("Strength foundations · 9 of 12 done in the last 7 days")).toBeInTheDocument();
    // Not a gym member and never checked in: no check-in widgets at all.
    expect(screen.queryByTestId("visits-row")).toBeNull();
    expect(screen.queryByRole("list", { name: "Check-ins this week" })).toBeNull();
  });

  it("shows the program's description and cautions under the hero (D4, board web-cautions W3)", async () => {
    vi.spyOn(myProgramsService, "listMine").mockReturnValue(ok([program()]));
    const about = vi
      .spyOn(myProgramsService, "about")
      .mockReturnValue(ok({ description: "Four weeks to build the habit.", cautions: "Not during pregnancy." }));
    render(<MemberHomePage />);
    const card = await screen.findByTestId("program-about-card");
    expect(about).toHaveBeenCalledWith("p1");
    expect(within(card).getByRole("heading", { name: PROGRAM_ABOUT_COPY.heading })).toBeInTheDocument();
    expect(within(card).getByText("Four weeks to build the habit.")).toBeInTheDocument();
    expect(within(card).getByText(PROGRAM_ABOUT_COPY.cautionsTitle)).toBeInTheDocument();
    expect(within(card).getByText("Not during pregnancy.")).toBeInTheDocument();
  });

  it("adds no About card when the program has neither field", async () => {
    vi.spyOn(myProgramsService, "listMine").mockReturnValue(ok([program()]));
    const about = vi.spyOn(myProgramsService, "about").mockReturnValue(ok({ description: null, cautions: null }));
    render(<MemberHomePage />);
    await screen.findByText("Day 7");
    await waitFor(() => expect(about).toHaveBeenCalled());
    expect(screen.queryByTestId("program-about-card")).toBeNull();
    expect(screen.queryByText(PROGRAM_ABOUT_COPY.heading)).toBeNull();
  });

  it("shows a gym member their visits this week, never a streak (board web-visits H3)", async () => {
    vi.spyOn(marketplaceService, "getMyMembershipSubscriptions").mockReturnValue(
      ok([{ status: MembershipSubscriptionStatus.ACTIVE, organization_id: { _id: "g1", name: "Dapo Fitness Hub" } } as MembershipSubscription]),
    );
    vi.spyOn(checkinsService, "getMyDashboardStats").mockReturnValue(
      ok({ has_checked_in_today: false, current_streak_days: 2, total_check_ins: 14, last_check_in_at: at(1), streak_at_risk: true, longest_streak_days: 9 } as never),
    );
    vi.spyOn(checkinsService, "getMyHistory").mockReturnValue(
      ok([at(1), at(2)].map((t, i) => ({ _id: `c${i}`, organization_id: "g1", member_user_id: "u", checked_in_at: t, created_at: t, updated_at: t }))),
    );
    render(<MemberHomePage />);
    // The API still sends its streak fields; the page reads none of them.
    const row = await screen.findByTestId("visits-row");
    expect(within(row).getByText(lastVisit("Tue 6 Oct"))).toBeInTheDocument();
    expect(within(row).getByText(visitsThisWeek(2))).toBeInTheDocument();
    expect(within(row).getByRole("link")).toHaveAttribute("href", "/dashboard/member/activity");
    expect(screen.queryByText(/streak|keep it going|Longest|Personal best/i)).toBeNull();
    // The visits row is the one check-in line (Direction C): no week strip, no stat pair.
    expect(screen.queryByRole("list", { name: "Check-ins this week" })).toBeNull();
    expect(screen.getByText("Dapo Fitness Hub")).toBeInTheDocument();
  });

  it("says checked in today, counting today, in the member's week (Sunday start)", async () => {
    vi.spyOn(marketplaceService, "getMyMembershipSubscriptions").mockReturnValue(
      ok([{ status: MembershipSubscriptionStatus.ACTIVE, organization_id: { _id: "g1", name: "Dapo Fitness Hub" } } as MembershipSubscription]),
    );
    vi.spyOn(memberGoalsService, "getSettings").mockReturnValue(ok({ week_start: "sunday" }));
    vi.spyOn(checkinsService, "getMyDashboardStats").mockReturnValue(
      ok({ has_checked_in_today: true, total_check_ins: 14, last_check_in_at: at(0) }),
    );
    // Sun 4, Mon 5 and today count in a Sunday week; Sat 3 does not.
    vi.spyOn(checkinsService, "getMyHistory").mockReturnValue(
      ok([at(0), at(2), at(3), at(4)].map((t, i) => ({ _id: `c${i}`, organization_id: "g1", member_user_id: "u", checked_in_at: t, created_at: t, updated_at: t }))),
    );
    render(<MemberHomePage />);
    const row = await screen.findByTestId("visits-row");
    expect(within(row).getByText(CHECKED_IN_TODAY)).toBeInTheDocument();
    expect(within(row).getByText(visitsThisWeek(3))).toBeInTheDocument();
  });

  it("shows no hero and no visits row for a member with neither", async () => {
    render(<MemberHomePage />);
    await screen.findByTestId("own-tracking-full");
    expect(screen.queryByTestId("visits-row")).toBeNull();
    expect(screen.queryByText("Your program")).toBeNull();
    expect(screen.queryByText(/Personal best|Longest/)).toBeNull();
    expect(await screen.findByRole("link", { name: "Log your weight" })).toHaveAttribute("href", "/dashboard/member/weight-log");
  });

  it("hides what it could not read rather than inventing it", async () => {
    vi.spyOn(marketplaceService, "getMyMembershipSubscriptions").mockReturnValue(
      ok([{ status: MembershipSubscriptionStatus.ACTIVE, organization_id: { _id: "g1", name: "Dapo" } } as MembershipSubscription]),
    );
    vi.spyOn(checkinsService, "getMyHistory").mockRejectedValue(new Error("offline"));
    vi.spyOn(loyaltyService, "getPrograms").mockResolvedValue({ success: false, message: "boom" } as never);
    render(<MemberHomePage />);
    await screen.findByTestId("own-tracking-full");
    // No week count is known, so none is shown; there is no "0 visits".
    expect(screen.queryByText(/visits? this week/)).toBeNull();
    // Loyalty is optional per provider: a failed read hides the card.
    expect(screen.queryByText("Loyalty points")).toBeNull();
  });

  it("shows no loyalty card when none of the member's providers runs a program", async () => {
    render(<MemberHomePage />);
    await screen.findByTestId("own-tracking-full");
    expect(screen.queryByText("Loyalty points")).toBeNull();
    expect(screen.queryByRole("link", { name: /Rewards/ })).toBeNull();
  });

  it("shows each provider program that is on, with its own balance", async () => {
    vi.spyOn(loyaltyService, "getPrograms").mockReturnValue(
      ok([
        { organization_id: "g1", organization_name: "Iron Lab", account_type: "gym", balance: 1200, is_member: true },
        { organization_id: "t1", organization_name: "Coach Ada", account_type: "personal_trainer", balance: 40, is_member: true },
      ]),
    );
    render(<MemberHomePage />);
    expect(await screen.findByText("Loyalty points")).toBeInTheDocument();
    expect(screen.getByText("Iron Lab")).toBeInTheDocument();
    expect(screen.getByText("Coach Ada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Rewards/ })).toHaveAttribute("href", "/dashboard/loyalty");
  });

  it("has no Quick log card and no 'Nothing booked' row (own tracking and the nav cover them)", async () => {
    render(<MemberHomePage />);
    await screen.findByTestId("own-tracking-full");
    expect(screen.queryByText("Quick log")).toBeNull();
    expect(screen.queryByText("Nothing booked")).toBeNull();
    expect(screen.queryByRole("heading", { name: "Next up" })).toBeNull();
  });

  it("puts the next booking in a row that opens bookings", async () => {
    vi.spyOn(consultationsService, "getMyBookings").mockReturnValue(ok([booking()]));
    render(<MemberHomePage />);
    const row = await screen.findByRole("link", { name: /Strength session/ });
    expect(row).toHaveAttribute("href", "/dashboard/bookings");
    expect(within(row).getByText("Confirmed")).toBeInTheDocument();
  });
});
