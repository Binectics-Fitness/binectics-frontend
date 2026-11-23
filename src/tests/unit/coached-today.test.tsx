import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

vi.mock("@/hooks/useIsSoloMember", () => ({ useIsSoloMember: () => ({ solo: false, isLoading: false }) }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/member",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1", first_name: "Chidi", country_code: "NG" } }) }));
vi.mock("@/hooks/useRequireAuth", () => ({ useRoleGuard: () => ({ isAuthorized: true }) }));
vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));
vi.mock("@/components/messaging/StartConversationButton", () => ({
  StartConversationButton: ({ label = "Message", ariaLabel }: { label?: string; ariaLabel?: string }) => (
    <button type="button" aria-label={ariaLabel}>
      {label}
    </button>
  ),
}));
vi.mock("@/app/dashboard/member/_components/EnrollmentOffersCard", () => ({ EnrollmentOffersCard: () => null }));
vi.mock("@/app/dashboard/member/_components/GymClassesLink", () => ({ GymClassesLink: () => null }));

import MemberHomePage from "@/app/dashboard/member/page";
import { checkinsService } from "@/lib/api/checkins";
import { classBookingsService } from "@/lib/api/classBookings";
import { consultationsService } from "@/lib/api/consultations";
import { loyaltyService } from "@/lib/api/loyalty";
import { marketplaceService, type MyProviders } from "@/lib/api/marketplace";
import { memberGoalsService } from "@/lib/api/memberGoals";
import { agendaTasksFrom, myProgramsService, type MyProgram } from "@/lib/api/myPrograms";
import { resetClientNowForTests } from "@/lib/ui/useClientNow";
import {
  audienceOf,
  coachOf,
  darkCard,
  hasCoachPlan,
  linkedKindsToday,
  planAsksWeightToday,
  providersOf,
  sheetSections,
  showCoachList,
  startsLater,
} from "@/lib/today/oneToday";
import { pendingSummary, privacyLine } from "@/lib/today/todayCopy";
import { mockCoachedTodayReads } from "./coachedTodayMocks";

const NOW = new Date(2026, 10, 19, 10, 0, 0); // Thu 19 Nov 2026, local
const ok = <T,>(data: T) => Promise.resolve({ success: true, data } as never);
const TODAY = "2026-11-19T00:00:00.000Z";

const TUNDE: MyProviders = {
  professionals: [
    {
      professional_id: "t1",
      first_name: "Tunde",
      last_name: "Okafor",
      profile_picture: null,
      role: "Personal Trainer",
      since: null,
      listing: { _id: "L1" },
    },
  ],
  gyms: [],
};

const program = (over: Partial<MyProgram> = {}): MyProgram => ({
  _id: "p1",
  kind: "program",
  name: "Strength base",
  status: "active",
  progress: { day: 4, total_days: 28, last_7_days: { scheduled: 12, done: 9, done_late: 0, skipped: 0, missed: 2, open: 1 } },
  ...over,
});

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemberHomePage />
    </QueryClientProvider>,
  );

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
  vi.spyOn(marketplaceService, "getMyMembershipSubscriptions").mockReturnValue(ok([]));
  vi.spyOn(myProgramsService, "listMine").mockReturnValue(ok([]));
  vi.spyOn(myProgramsService, "about").mockReturnValue(ok({ description: null, cautions: null }));
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("coached Today: rules (port of mobile oneToday)", () => {
  it("names the newest coach, never a gym, and reads dietitians by role", () => {
    const ps = providersOf({
      professionals: [{ ...TUNDE.professionals[0], professional_id: "d1", first_name: "Ngozi", last_name: "Bello", role: "Dietitian" }],
      gyms: [{ organization_id: "g1", name: "Harbour Street Gym" }],
    });
    expect(coachOf(ps)).toMatchObject({ kind: "dietitian", name: "Ngozi Bello", userId: "d1" });
    expect(coachOf(providersOf({ professionals: [], gyms: [{ organization_id: "g1", name: "Gym" }] }))).toBeNull();
    expect(audienceOf(ps)).toEqual({ kind: "many" });
    expect(audienceOf(providersOf(TUNDE))).toEqual({ kind: "one", name: "Tunde" });
    expect(audienceOf([])).toEqual({ kind: "none" });
  });

  it("gives the one dark card to the program, then a running fast", () => {
    expect(darkCard({ program: true, fastRunning: true })).toBe("program");
    expect(darkCard({ program: false, fastRunning: true })).toBe("fast");
    expect(darkCard({ program: false, fastRunning: false })).toBeNull();
  });

  it("reads the agenda's day, metric and auto rule, dropping undated rows", () => {
    const tasks = agendaTasksFrom({
      items: [
        { scheduled_for: TODAY, component_type: "measurement", metric: "weight_kg" },
        { scheduled_for: TODAY, component_type: "habit", auto: { metric: "water_glasses" } },
        { component_type: "habit" },
      ],
    });
    expect(tasks).toHaveLength(2);
    expect(planAsksWeightToday(tasks, NOW)).toBe(true);
    expect(linkedKindsToday(tasks, NOW)).toEqual({ fast: false, water: true });
    expect(planAsksWeightToday([{ ...tasks[0], scheduled_for: "2026-11-20T00:00:00.000Z" }], NOW)).toBe(false);
  });

  it("counts a coach's plan, not the member's own Starter", () => {
    expect(hasCoachPlan([program({ source: "starter" })], [])).toBe(false);
    expect(hasCoachPlan([program()], [])).toBe(true);
    expect(hasCoachPlan([], [{ scheduled_for: TODAY }])).toBe(true);
  });

  it("finds a plan assigned to start on a later day", () => {
    const later = startsLater([program({ status: "assigned", started_at: "2026-11-23T08:00:00.000Z" })], NOW);
    expect(later?.name).toBe("Strength base");
    expect(startsLater([program({ status: "assigned" })], NOW)).toBeNull();
  });

  it("lists one coach only when neither the coach card nor their plan leads to them", () => {
    expect(showCoachList({ coaches: 1, coachCard: true, hasPlan: false })).toBe(false);
    expect(showCoachList({ coaches: 1, coachCard: false, hasPlan: true })).toBe(false);
    expect(showCoachList({ coaches: 1, coachCard: false, hasPlan: false })).toBe(true);
    expect(showCoachList({ coaches: 2, coachCard: true, hasPlan: true })).toBe(true);
  });

  it("words the privacy line as mobile does", () => {
    expect(privacyLine({ kind: "one", name: "Tunde" })).toBe("Only you see these. Tunde doesn't.");
    expect(privacyLine({ kind: "one", name: "Tunde" }, { weight: true })).toBe("Only you see these, except your weight.");
    expect(privacyLine({ kind: "many" }, { weight: true, linked: true })).toBe(
      "Only you see these, except your weight and what your coaches' tasks ask for.",
    );
    expect(privacyLine({ kind: "none" })).toBe("Only you see these.");
  });

  it("builds the sheet's lists by who the providers are", () => {
    const one = sheetSections({ kind: "one", name: "Tunde" }, providersOf(TUNDE), { linked: false, healthTask: false, shareProgress: false });
    expect(one.sees[0].heading).toBe("Tunde sees");
    expect(one.sees[0].items).toContain("Tasks you tick on Tunde's plan");
    expect(one.only).toEqual(["Your fasts", "Your water", "Your daily list", "Weight you log on your own card"]);
    const gym = sheetSections({ kind: "one", name: "Harbour" }, providersOf({ professionals: [], gyms: [{ organization_id: "g", name: "Harbour" }] }));
    expect(gym.sees[0].items).toEqual(["Your check-ins", "Classes you book", "Your membership"]);
    expect(gym.foot).toBe("It is the same for every gym, and a gym can't change it.");
  });

  it("sums pending requests in one line", () => {
    expect(pendingSummary([])).toBeNull();
    expect(pendingSummary(["Tunde Okafor"])?.title).toBe("Tunde Okafor wants to coach you");
    expect(pendingSummary(["A", "B", "C"])?.body).toBe("A and 2 others are waiting on your answer.");
  });
});

describe("coached Today: the page", () => {
  it("C1: a coach and no plan yet: the coach card with Message and Book, then the full own tracking", async () => {
    mockCoachedTodayReads({ providers: TUNDE });
    renderPage();
    const card = await screen.findByTestId("today-coach-card");
    expect(within(card).getByText("Your trainer")).toBeInTheDocument();
    expect(within(card).getByRole("heading", { name: "Tunde Okafor" })).toBeInTheDocument();
    expect(within(card).getByText("No plan from Tunde yet.")).toBeInTheDocument();
    expect(within(card).getByRole("button", { name: "Message Tunde Okafor" })).toBeInTheDocument();
    const book = await within(card).findByRole("link", { name: "Book a session with Tunde Okafor" });
    expect(book).toHaveAttribute("href", "/booking?listingId=L1");
    expect(await screen.findByTestId("own-tracking-full")).toBeInTheDocument();
    // The coach card already names the only coach: no second list of them.
    expect(screen.queryByTestId("my-coaches")).toBeNull();
  });

  it("hides Book when the coach has no session to book, and when they have no listing", async () => {
    mockCoachedTodayReads({ providers: TUNDE, sessionTypes: [] });
    const { unmount } = renderPage();
    const card = await screen.findByTestId("today-coach-card");
    await waitFor(() => expect(consultationsService.getTypes).toHaveBeenCalledWith({ providerId: "t1" }));
    await waitFor(() => expect(within(card).queryByRole("link", { name: /Book a session/ })).toBeNull());
    unmount();

    mockCoachedTodayReads({ providers: { ...TUNDE, professionals: [{ ...TUNDE.professionals[0], listing: null }] } });
    renderPage();
    const again = await screen.findByTestId("today-coach-card");
    expect(within(again).queryByRole("link", { name: /Book a session/ })).toBeNull();
  });

  it("never says 'No plan' when the plan could not be read", async () => {
    mockCoachedTodayReads({ providers: TUNDE });
    vi.spyOn(myProgramsService, "listMine").mockResolvedValue({ success: false, message: "down" } as never);
    renderPage();
    await screen.findByTestId("own-tracking-full");
    expect(screen.queryByTestId("today-coach-card")).toBeNull();
  });

  it("S2: a plan that starts later says so on the coach card", async () => {
    mockCoachedTodayReads({ providers: TUNDE });
    vi.spyOn(myProgramsService, "listMine").mockReturnValue(
      ok([program({ status: "assigned", started_at: new Date(2026, 10, 23, 8).toISOString(), progress: undefined })]),
    );
    renderPage();
    const card = await screen.findByTestId("today-coach-card");
    expect(within(card).getByText("Strength base starts Mon 23 Nov.")).toBeInTheDocument();
    expect(within(card).getByText("Your first tasks show here that day.")).toBeInTheDocument();
  });

  it("S1: someone waiting on the member's answer gets one card with Review", async () => {
    mockCoachedTodayReads({ requests: [{ _id: "r1", professional_id: { first_name: "Tunde", last_name: "Okafor" } }] });
    renderPage();
    const card = await screen.findByTestId("pending-requests-card");
    expect(within(card).getByRole("heading", { name: "Tunde Okafor wants to coach you" })).toBeInTheDocument();
    expect(within(card).getByText("1")).toBeInTheDocument();
    expect(within(card).getByRole("link", { name: /Review/ })).toHaveAttribute("href", "/dashboard/member/requests");
  });

  it("R5: with a plan, the program is the dark card and own tracking is one compact card", async () => {
    mockCoachedTodayReads({
      providers: TUNDE,
      water: { glasses: 3, target_glasses: 8 },
      list: [{ id: "a", done: false }],
      weightProfiles: [],
    });
    vi.spyOn(myProgramsService, "listMine").mockReturnValue(ok([program()]));
    renderPage();
    const hero = await screen.findByTestId("today-program");
    expect(within(hero).getByText("Day 4")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "From Tunde today" })).toBeInTheDocument();
    expect(screen.getByTestId("tasks-in-app")).toHaveTextContent("Tick today's tasks in the Binectics app.");
    // A plan is running: the coach card steps aside.
    expect(screen.queryByTestId("today-coach-card")).toBeNull();
    const grid = await screen.findByTestId("own-tracking-grid");
    await waitFor(() => expect(within(grid).getByTestId("own-cell-weight")).toBeInTheDocument());
    expect(within(grid).getByTestId("own-cell-fast")).toHaveTextContent("FastNone");
    expect(within(grid).getByTestId("own-cell-water")).toHaveTextContent("Water3 of 8");
    expect(within(grid).getByTestId("own-cell-weight")).toHaveTextContent("WeightNot yet");
    expect(within(grid).getByTestId("own-cell-list")).toHaveTextContent("Daily list0 of 1");
    expect(within(grid).getByRole("link", { name: "Start a fast" })).toHaveAttribute("href", "/dashboard/member/fasting");
    expect(within(grid).getByRole("button", { name: "Add one glass" })).toBeInTheDocument();
    // The program already leads to Tunde: no separate coach list (mobile showPeople).
    expect(screen.queryByTestId("my-coaches")).toBeNull();
  });

  it("R6: a running fast under a program is a light row, not a second dark card", async () => {
    mockCoachedTodayReads({
      providers: TUNDE,
      fast: {
        id: "f1",
        status: "running",
        started_at: new Date(NOW.getTime() - 2 * 3_600_000).toISOString(),
        target_hours: 16,
        preset: "16_8",
        target_end_at: new Date(NOW.getTime() + 14 * 3_600_000).toISOString(),
        ended_at: null,
        end_reason: null,
        note: null,
        feelings: [],
        undo_until: null,
      },
    });
    vi.spyOn(myProgramsService, "listMine").mockReturnValue(ok([program()]));
    renderPage();
    const row = await screen.findByTestId("today-fast-row");
    expect(within(row).getByRole("link")).toHaveAttribute("href", "/dashboard/member/fasting");
    await waitFor(() => expect(row).toHaveTextContent("14 h 00 min to go"));
    expect(row).toHaveTextContent("Fasting · 16 hours");
    expect(screen.queryByTestId("fast-today-card")).toBeNull();
    // The fast is above; the compact card has no Fast cell.
    const grid = await screen.findByTestId("own-tracking-grid");
    expect(within(grid).queryByTestId("own-cell-fast")).toBeNull();
  });

  it("L1, R5: a coach's water task and weight task take those cells off the card, and the line says so", async () => {
    mockCoachedTodayReads({
      providers: TUNDE,
      shareProgress: false,
      agenda: [
        { scheduled_for: TODAY, component_type: "habit", auto_metric: "water_glasses" },
        { scheduled_for: TODAY, component_type: "measurement", metric: "weight_kg" },
      ],
    });
    vi.spyOn(myProgramsService, "listMine").mockReturnValue(ok([program()]));
    renderPage();
    const grid = await screen.findByTestId("own-tracking-grid");
    expect(within(grid).queryByTestId("own-cell-water")).toBeNull();
    expect(within(grid).queryByTestId("own-cell-weight")).toBeNull();
    await waitFor(() =>
      expect(screen.getByTestId("own-tracking-privacy")).toHaveTextContent("Only you see these, except what Tunde's tasks ask for."),
    );
  });

  it("R3, R4: the privacy line opens 'What Tunde sees', and Escape closes it", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    mockCoachedTodayReads({ providers: TUNDE, shareProgress: false });
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("own-tracking-privacy")).toHaveTextContent("Only you see these. Tunde doesn't."),
    );
    const open = screen.getByRole("button", { name: "What Tunde sees" });
    await user.click(open);
    const dialog = await screen.findByRole("dialog", { name: "What Tunde sees" });
    expect(within(dialog).getByRole("heading", { name: "Tunde sees" })).toBeInTheDocument();
    expect(within(dialog).getByText("Tasks you tick on Tunde's plan")).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "Only you see" })).toBeInTheDocument();
    expect(within(dialog).getByText("Your fasts")).toBeInTheDocument();
    expect(within(dialog).getByText("It is the same for every coach, and a coach can't change it.")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(open).toHaveAttribute("aria-haspopup", "dialog"));
  });

  it("says weight is shared while 'Share progress with providers' is on (the default)", async () => {
    mockCoachedTodayReads({ providers: TUNDE });
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("own-tracking-privacy")).toHaveTextContent("Only you see these, except your weight."),
    );
  });

  it("lists two coaches with Message and Book on each", async () => {
    mockCoachedTodayReads({
      providers: {
        professionals: [
          TUNDE.professionals[0],
          { ...TUNDE.professionals[0], professional_id: "d1", first_name: "Ngozi", last_name: "Bello", role: "Dietitian", listing: { _id: "L2" } },
        ],
        gyms: [],
      },
    });
    vi.spyOn(myProgramsService, "listMine").mockReturnValue(ok([program()]));
    renderPage();
    const list = await screen.findByTestId("my-coaches");
    expect(within(list).getByRole("button", { name: "Message Ngozi Bello" })).toBeInTheDocument();
    expect(await within(list).findByRole("link", { name: "Book a session with Ngozi Bello" })).toHaveAttribute(
      "href",
      "/booking?listingId=L2",
    );
  });
});
