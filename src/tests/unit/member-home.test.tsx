import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import MemberHomePage from "@/app/dashboard/member/page";
import { activeGyms, lastCheckInLabel, nextUp, weightSummary } from "@/app/dashboard/member/memberHome";
import { currentProgramDay, myProgramsService, type MyProgram } from "@/lib/api/myPrograms";
import { isPersonalBest, longestStreakLine } from "@/lib/checkins/streak";
import { checkinsService } from "@/lib/api/checkins";
import { classBookingsService, type ClassBooking } from "@/lib/api/classBookings";
import { consultationsService, ConsultationBookingStatus, type ConsultationBooking } from "@/lib/api/consultations";
import { loyaltyService } from "@/lib/api/loyalty";
import { marketplaceService } from "@/lib/api/marketplace";
import { progressService, type WeightLog } from "@/lib/api/progress";
import { MembershipSubscriptionStatus, type MembershipSubscription } from "@/lib/types";
import { resetClientNowForTests } from "@/lib/ui/useClientNow";

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

describe("streak lines", () => {
  it("only claims a best or a longest streak when the API sends one", () => {
    expect(longestStreakLine({ current_streak_days: 4 })).toBeNull();
    expect(isPersonalBest({ current_streak_days: 4 })).toBe(false);
    expect(longestStreakLine({ current_streak_days: 4, longest_streak_days: 9 })).toBe("Longest · 9 days");
    expect(longestStreakLine({ current_streak_days: 9, longest_streak_days: 9 })).toBe("Personal best");
    // A 1-day streak is a start, not a record.
    expect(isPersonalBest({ current_streak_days: 1, longest_streak_days: 1 })).toBe(false);
    expect(longestStreakLine({ current_streak_days: 0, longest_streak_days: 1 })).toBe("Longest · 1 day");
  });

  it("doesn't repeat the streak back when it equals the longest but isn't a best", () => {
    // A first check-in: 1 day, longest 1. "Longest · 1 day" would just echo the number.
    expect(longestStreakLine({ current_streak_days: 1, longest_streak_days: 1 })).toBeNull();
    // Current above a stale longest (the API's longest lags a read): still no echo.
    expect(longestStreakLine({ current_streak_days: 1, longest_streak_days: 0 })).toBeNull();
    expect(longestStreakLine({ current_streak_days: 3, longest_streak_days: 2 })).toBe("Personal best");
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

describe("member home page", () => {
  const ok = <T,>(data: T) => Promise.resolve({ success: true, data });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    resetClientNowForTests();
    vi.spyOn(checkinsService, "getMyDashboardStats").mockReturnValue(ok({ has_checked_in_today: false, current_streak_days: 0, total_check_ins: 0 }));
    vi.spyOn(checkinsService, "getMyHistory").mockReturnValue(ok([]));
    vi.spyOn(consultationsService, "getMyBookings").mockReturnValue(ok([]));
    vi.spyOn(classBookingsService, "getMyClassBookings").mockReturnValue(ok([]));
    vi.spyOn(loyaltyService, "getBalance").mockReturnValue(ok(null as never));
    vi.spyOn(progressService, "getMyOwnProfiles").mockReturnValue(ok([]));
    vi.spyOn(marketplaceService, "getMyMembershipSubscriptions").mockReturnValue(ok([]));
    vi.spyOn(myProgramsService, "listMine").mockReturnValue(ok([]));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("greets with one serif-italic word: the member's first name", async () => {
    render(<MemberHomePage />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Hey, Yemi.");
    expect(h1.querySelectorAll("em")).toHaveLength(1);
    expect(h1.querySelector("em")?.textContent).toBe("Yemi");
    await waitFor(() => expect(screen.getByText("Nothing booked")).toBeInTheDocument());
  });

  it("shows a program client 'Day N of M' with a real bar", async () => {
    vi.spyOn(myProgramsService, "listMine").mockReturnValue(ok([program()]));
    render(<MemberHomePage />);
    const bar = await screen.findByRole("progressbar", { name: "Progress through Strength foundations" });
    expect(bar).toHaveAttribute("aria-valuenow", "7");
    expect(bar).toHaveAttribute("aria-valuemax", "28");
    expect(screen.getByText("Day 7")).toBeInTheDocument();
    expect(screen.getByText("of 28")).toBeInTheDocument();
    expect(screen.getByText("9 of 12 tasks done · last 7 days")).toBeInTheDocument();
    // Not a gym member and never checked in: no check-in widgets at all.
    expect(screen.queryByText("Check-in streak")).toBeNull();
    expect(screen.queryByRole("list", { name: "Check-ins this week" })).toBeNull();
  });

  it("shows a gym member their streak, the at-risk hint and this week's check-ins", async () => {
    vi.spyOn(marketplaceService, "getMyMembershipSubscriptions").mockReturnValue(
      ok([{ status: MembershipSubscriptionStatus.ACTIVE, organization_id: { _id: "g1", name: "Dapo Fitness Hub" } } as MembershipSubscription]),
    );
    vi.spyOn(checkinsService, "getMyDashboardStats").mockReturnValue(
      ok({ has_checked_in_today: false, current_streak_days: 2, total_check_ins: 14, last_check_in_at: at(1), streak_at_risk: true, longest_streak_days: 9 }),
    );
    vi.spyOn(checkinsService, "getMyHistory").mockReturnValue(
      ok([at(1), at(2)].map((t, i) => ({ _id: `c${i}`, organization_id: "g1", member_user_id: "u", checked_in_at: t, created_at: t, updated_at: t }))),
    );
    render(<MemberHomePage />);
    expect(await screen.findByText("Check-in streak")).toBeInTheDocument();
    expect(screen.getByText("Check in today to keep it going")).toBeInTheDocument();
    expect(screen.getByText("Longest · 9 days")).toBeInTheDocument();
    const strip = screen.getByRole("list", { name: "Check-ins this week" });
    // Wed 7 Oct: Mon 5 and Tue 6 are done, today is still open.
    expect(within(strip).getByText("Mon 5 Oct, checked in")).toBeInTheDocument();
    expect(within(strip).getByText("Tue 6 Oct, checked in")).toBeInTheDocument();
    expect(within(strip).getByText("Wed 7 Oct, today")).toBeInTheDocument();
    expect(screen.getByText("Last: Yesterday")).toBeInTheDocument();
    expect(screen.getByText("Dapo Fitness Hub")).toBeInTheDocument();
  });

  it("shows no hero, and no personal-best line, for a member with neither", async () => {
    render(<MemberHomePage />);
    await waitFor(() => expect(screen.getByText("Nothing booked")).toBeInTheDocument());
    expect(screen.queryByText("Check-in streak")).toBeNull();
    expect(screen.queryByText("Your program")).toBeNull();
    expect(screen.queryByText(/Personal best|Longest/)).toBeNull();
    expect(screen.getByRole("link", { name: "Log your weight" })).toHaveAttribute("href", "/dashboard/member/weight-log");
  });

  it("shows a dash, not invented zeros, when reads fail", async () => {
    vi.spyOn(marketplaceService, "getMyMembershipSubscriptions").mockReturnValue(
      ok([{ status: MembershipSubscriptionStatus.ACTIVE, organization_id: { _id: "g1", name: "Dapo" } } as MembershipSubscription]),
    );
    vi.spyOn(checkinsService, "getMyHistory").mockRejectedValue(new Error("offline"));
    vi.spyOn(loyaltyService, "getBalance").mockResolvedValue({ success: false, message: "boom" } as never);
    vi.spyOn(progressService, "getMyOwnProfiles").mockReturnValue(ok([{ _id: "cp" }] as never));
    vi.spyOn(progressService, "getWeightLogs").mockRejectedValue(new Error("offline"));
    render(<MemberHomePage />);
    expect(await screen.findByText(/Couldn.t load this week.s check-ins/)).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Check-ins this week" })).toBeNull();
    const values = Array.from(document.querySelectorAll("[data-stat-value]")).map((el) => el.textContent);
    expect(values).toEqual(["–", "–"]); // check-ins this week, weight
    expect(screen.queryByText("Log your weight")).toBeNull();
    expect(screen.getByText(/Couldn.t load your balance/)).toBeInTheDocument();
    expect(screen.queryByText(/No loyalty activity yet/)).toBeNull();
  });

  it("lets Weight take the row when there are no check-in widgets", async () => {
    render(<MemberHomePage />);
    await waitFor(() => expect(screen.getByText("Nothing booked")).toBeInTheDocument());
    const weightCard = screen.getByText("Weight").closest("[data-size]")!;
    expect(weightCard.parentElement?.className).toContain("grid-cols-1");
  });

  it("puts the next booking in a row that opens bookings", async () => {
    vi.spyOn(consultationsService, "getMyBookings").mockReturnValue(ok([booking()]));
    render(<MemberHomePage />);
    const row = await screen.findByRole("link", { name: /Strength session/ });
    expect(row).toHaveAttribute("href", "/dashboard/bookings");
    expect(within(row).getByText("Confirmed")).toBeInTheDocument();
  });
});
