import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CheckInScanPage from "@/app/check-in/[gymId]/page";
import { checkinsService } from "@/lib/api/checkins";
import { memberGoalsService } from "@/lib/api/memberGoals";
import { ALREADY_AFTER, ALREADY_BEFORE, ALREADY_TITLE, SUCCESS_THIS_WEEK, visitUnit } from "@/lib/checkins/visitsCopy";
import { loyaltyService } from "@/lib/api/loyalty";
import { checkInPoints } from "@/lib/loyalty/checkInPoints";
import { LoyaltyEventType, type LoyaltyPointsTransaction } from "@/lib/types";

const push = vi.fn();
let token: string | null = "fresh";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));
vi.mock("next/navigation", () => ({
  useParams: () => ({ gymId: "g1" }),
  useSearchParams: () => ({ get: () => token }),
  useRouter: () => ({ push }),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { first_name: "Yemi" } }) }));
vi.mock("@/components/BinecticsLogo", () => ({ BinecticsLockup: () => <span>Binectics</span> }));

const CHECKED_IN_AT = new Date(2026, 9, 7, 14, 42).toISOString();
const clock = new Date(CHECKED_IN_AT).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

const day = (d: number, h = 7) => new Date(2026, 9, d, h, 30).toISOString();
const history = (days: number[]) =>
  days.map((d, i) => ({ _id: `c${i}`, organization_id: "g1", member_user_id: "u", checked_in_at: day(d), created_at: "", updated_at: "" }));

describe("check-in success takeover (board web-visits C1, C2)", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 7, 15, 0)); // Wed 7 Oct 2026
    token = "fresh";
    push.mockReset();
    vi.spyOn(checkinsService, "getGymInfo").mockResolvedValue({ success: true, data: { name: "Dapo Fitness Hub", listing_id: null } });
    vi.spyOn(checkinsService, "scan").mockResolvedValue({
      success: true,
      data: { _id: "x", organization_id: "g1", member_user_id: "u", checked_in_at: CHECKED_IN_AT, created_at: "", updated_at: "" },
    });
    // Mon 5, Tue 6 and today: three visits this (Monday) week; Sun 4 is last week.
    vi.spyOn(checkinsService, "getMyHistory").mockResolvedValue({ success: true, data: history([7, 6, 5, 4]) });
    vi.spyOn(memberGoalsService, "getSettings").mockResolvedValue({ success: true, data: { week_start: "monday" } });
    // No loyalty program at this gym unless a test says so.
    vi.spyOn(loyaltyService, "getPrograms").mockResolvedValue({ success: true, data: [] });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("is the dark takeover with the API's time, the member's name, the gym and this week's visits", async () => {
    vi.spyOn(checkinsService, "getMyDashboardStats").mockResolvedValue({
      success: true,
      // The API still sends its streak fields; the page reads none of them.
      data: { has_checked_in_today: true, current_streak_days: 6, total_check_ins: 15, longest_streak_days: 6 } as never,
    });
    render(<CheckInScanPage />);
    const dialog = await screen.findByRole("dialog", { name: "You’re in, Yemi." });
    // The takeover IS the screen (the page behind is inert): its title is the h1.
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("You’re in, Yemi.");
    expect(dialog.style.background).toBe("var(--ink)");
    expect(dialog).toHaveAccessibleDescription(`Checked in · ${clock}`);
    expect(dialog.querySelector("em")).toBeNull();
    expect(screen.getByText("Dapo Fitness Hub · welcome back")).toBeInTheDocument();
    const card = (await waitFor(() => {
      const el = dialog.querySelector("[data-surface='raised']");
      if (!el) throw new Error("no card yet");
      return el;
    })) as HTMLElement;
    expect(card).toHaveAttribute("data-align", "center");
    expect(card.textContent).toBe(`${SUCCESS_THIS_WEEK}3${visitUnit(3)}`);
    expect(dialog.textContent).not.toMatch(/streak|Personal best|Longest|days/i);

    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(push).toHaveBeenCalledWith("/dashboard/member");
  });

  it("counts in the member's week (Sunday start)", async () => {
    vi.spyOn(memberGoalsService, "getSettings").mockResolvedValue({ success: true, data: { week_start: "sunday" } });
    vi.spyOn(checkinsService, "getMyDashboardStats").mockResolvedValue({
      success: true,
      data: { has_checked_in_today: true, total_check_ins: 15 },
    });
    render(<CheckInScanPage />);
    const dialog = await screen.findByRole("dialog");
    expect(dialog.querySelector("[data-surface='raised']")?.textContent).toBe(`${SUCCESS_THIS_WEEK}4${visitUnit(4)}`);
  });

  it("counts this check-in even when the history read lags it", async () => {
    vi.spyOn(checkinsService, "getMyHistory").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(checkinsService, "getMyDashboardStats").mockResolvedValue({
      success: true,
      data: { has_checked_in_today: true, total_check_ins: 1 },
    });
    render(<CheckInScanPage />);
    const dialog = await screen.findByRole("dialog");
    expect(dialog.querySelector("[data-surface='raised']")?.textContent).toBe(`${SUCCESS_THIS_WEEK}1${visitUnit(1)}`);
    expect(screen.getByText("Dapo Fitness Hub · your first check-in")).toBeInTheDocument();
  });

  it("still celebrates, without a card, if the reads fail", async () => {
    vi.spyOn(checkinsService, "getMyDashboardStats").mockRejectedValue(new Error("offline"));
    vi.spyOn(checkinsService, "getMyHistory").mockRejectedValue(new Error("offline"));
    render(<CheckInScanPage />);
    const dialog = await screen.findByRole("dialog");
    expect(dialog.querySelector("[data-surface='raised']")).toBeNull();
    expect(screen.getByRole("button", { name: "Done" })).toBeInTheDocument();
    // Unknown history: neither "welcome back" nor "first check-in", just the gym.
    expect(screen.getByText("Dapo Fitness Hub")).toBeInTheDocument();
    expect(dialog.textContent).not.toMatch(/welcome back|first check-in/);
  });

  it("says a second scan today already counted, with no streak talk", async () => {
    vi.spyOn(checkinsService, "scan").mockResolvedValue({ success: false, message: "Already checked in today" } as never);
    render(<CheckInScanPage />);
    expect(await screen.findByRole("heading", { name: ALREADY_TITLE })).toBeInTheDocument();
    const body = screen.getByText((_, el) => el?.tagName === "P" && el.textContent === `${ALREADY_BEFORE}Dapo Fitness Hub${ALREADY_AFTER}`);
    expect(body).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/streak/i);
  });
});

const award = (over: Partial<LoyaltyPointsTransaction> = {}): LoyaltyPointsTransaction => ({
  _id: "t1",
  user_id: "u",
  organization_id: "g1",
  points: 10,
  balance_after: 130,
  event_type: LoyaltyEventType.GYM_CHECK_IN,
  created_at: new Date(new Date(CHECKED_IN_AT).getTime() + 2_000).toISOString(),
  updated_at: "",
  ...over,
});

describe("points on check-in (F14)", () => {
  beforeEach(() => {
    token = "fresh";
    vi.spyOn(checkinsService, "getGymInfo").mockResolvedValue({ success: true, data: { name: "Dapo Fitness Hub", listing_id: null } });
    vi.spyOn(checkinsService, "scan").mockResolvedValue({
      success: true,
      data: { _id: "x", organization_id: "g1", member_user_id: "u", checked_in_at: CHECKED_IN_AT, created_at: "", updated_at: "" },
    });
    vi.spyOn(checkinsService, "getMyDashboardStats").mockResolvedValue({
      success: true,
      data: { has_checked_in_today: true, total_check_ins: 15 },
    });
    vi.spyOn(checkinsService, "getMyHistory").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(memberGoalsService, "getSettings").mockResolvedValue({ success: true, data: { week_start: "monday" } });
  });
  afterEach(() => vi.restoreAllMocks());

  it("takes this visit's check-in award from the ledger, nothing older or of another kind", () => {
    const since = new Date(CHECKED_IN_AT).getTime();
    expect(checkInPoints([award()], since)).toBe(10);
    expect(checkInPoints([award({ created_at: new Date(since - 3_600_000).toISOString() })], since)).toBeNull();
    expect(checkInPoints([award({ event_type: LoyaltyEventType.JOURNAL_LOGGED })], since)).toBeNull();
    expect(checkInPoints([], since)).toBeNull();
  });

  it("says what this check-in earned where the gym runs its own program", async () => {
    vi.spyOn(loyaltyService, "getPrograms").mockResolvedValue({
      success: true,
      data: [{ organization_id: "g1", organization_name: "Dapo Fitness Hub", account_type: "gym_owner", balance: 130, is_member: true }],
    });
    const history = vi.spyOn(loyaltyService, "getHistory").mockResolvedValue({ success: true, data: [award()] });
    render(<CheckInScanPage />);
    expect(await screen.findByTestId("checkin-points")).toHaveTextContent("+10 points at Dapo Fitness Hub");
    expect(history).toHaveBeenCalledWith(10, 0, "g1");
  });

  it("says nothing about points at a gym without a program", async () => {
    // The member's programs are elsewhere; none at this gym.
    vi.spyOn(loyaltyService, "getPrograms").mockResolvedValue({
      success: true,
      data: [{ organization_id: "other", organization_name: "Coach Ada", account_type: "personal_trainer", balance: 40, is_member: true }],
    });
    const history = vi.spyOn(loyaltyService, "getHistory");
    render(<CheckInScanPage />);
    await screen.findByRole("dialog");
    await waitFor(() => expect(loyaltyService.getPrograms).toHaveBeenCalled());
    expect(history).not.toHaveBeenCalled();
    expect(screen.queryByTestId("checkin-points")).toBeNull();
  });
});
