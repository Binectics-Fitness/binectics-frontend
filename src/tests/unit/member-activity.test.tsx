import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ActivityClient } from "@/app/dashboard/member/activity/ActivityClient";
import { checkinsService } from "@/lib/api/checkins";
import { loyaltyService } from "@/lib/api/loyalty";
import { memberGoalsService } from "@/lib/api/memberGoals";
import { resetClientNowForTests } from "@/lib/ui/useClientNow";
import {
  ACTIVITY_SUBTITLE,
  CHECKED_IN_TODAY,
  CHECK_INS_30D,
  HISTORY_LOAD_ERROR,
  LAST_30_DAYS,
  NO_CHECK_INS_HINT,
  RECENT_CHECK_INS,
  STATS_LOAD_ERROR,
  THIS_WEEK,
  allTime,
  lastVisit,
  visitsThisWeek,
} from "@/lib/checkins/visitsCopy";
import { contrast, tokenOf } from "@/test/contrast";

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string } & Record<string, unknown>) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));
vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ activeLabel, children }: { activeLabel: string; children: React.ReactNode }) => (
    <div data-testid="shell" data-active={activeLabel}>{children}</div>
  ),
}));

const ok = <T,>(data: T) => ({ success: true, data });
const fail = { success: false, message: "Internal server error" };

const NOW = new Date(2026, 10, 19, 17, 0); // Thu 19 Nov 2026
const at = (d: number, m = 10) => new Date(2026, m, d, 7, 30).toISOString();
const rows = (dates: string[]) =>
  dates.map((t, i) => ({ _id: `c${i}`, organization_id: "g1", member_user_id: "u", checked_in_at: t, created_at: t, updated_at: t }));

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <ActivityClient />
    </QueryClientProvider>,
  );
}

describe("Activity page (board web-visits A1)", () => {
  const stats = vi.spyOn(checkinsService, "getMyDashboardStats");
  const history = vi.spyOn(checkinsService, "getMyHistory");
  const balance = vi.spyOn(loyaltyService, "getPrograms");
  const goals = vi.spyOn(memberGoalsService, "getSettings");

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
    resetClientNowForTests();
    stats.mockReset();
    history.mockReset();
    balance.mockReset();
    goals.mockReset();
    // Mon 16 to Thu 19 this week, 9 more in the last 30 days, one older.
    history.mockResolvedValue(
      ok(rows([at(19), at(18), at(17), at(16), at(14), at(13), at(11), at(10), at(7), at(6), at(3), at(2), at(1), at(12, 9)])) as never,
    );
    goals.mockResolvedValue(ok({ week_start: "monday" }) as never);
    balance.mockResolvedValue(
      ok([{ organization_id: "g1", organization_name: "Iron Lab", account_type: "gym", balance: 120, is_member: true }]) as never,
    );
  });
  afterEach(() => vi.useRealTimers());

  it("shows visits this week, the last 30 days and all time, and no streak anywhere", async () => {
    // The API still sends its streak fields; the page reads none of them.
    stats.mockResolvedValue(
      ok({ has_checked_in_today: true, current_streak_days: 6, longest_streak_days: 9, streak_at_risk: false, total_check_ins: 14 }) as never,
    );
    renderPage();
    const row = await screen.findByTestId("visits-row");
    expect(within(row).getByText(CHECKED_IN_TODAY)).toBeInTheDocument();
    expect(await within(row).findByText(visitsThisWeek(4))).toBeInTheDocument();
    // This is the page the row opens: no link to itself.
    expect(within(row).queryByRole("link")).toBeNull();
    expect(screen.getByText(ACTIVITY_SUBTITLE)).toBeInTheDocument();
    expect(screen.getByText(THIS_WEEK)).toBeInTheDocument();
    expect(screen.getByText(CHECK_INS_30D)).toBeInTheDocument();
    expect(screen.getByText(allTime(14))).toBeInTheDocument();
    const values = Array.from(document.querySelectorAll("[data-stat-value]")).map((el) => el.textContent);
    expect(values).toEqual(["13", "120"]); // 30 days, Iron Lab points
    expect(screen.getByText(LAST_30_DAYS)).toBeInTheDocument();
    expect(screen.getByText(RECENT_CHECK_INS)).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/streak|milestone|personal best|longest|keep it going/i);
    expect(screen.queryByRole("progressbar")).toBeNull();
  });

  it("names the last visit when today has none, counted in the member's week", async () => {
    goals.mockResolvedValue(ok({ week_start: "sunday" }) as never);
    history.mockResolvedValue(ok(rows([at(17), at(16), at(15), at(14)])) as never);
    stats.mockResolvedValue(ok({ has_checked_in_today: false, last_check_in_at: at(17), total_check_ins: 4 }) as never);
    renderPage();
    const row = await screen.findByTestId("visits-row");
    expect(within(row).getByText(lastVisit("Tue 17 Nov"))).toBeInTheDocument();
    // Sunday week: Sun 15, Mon 16, Tue 17.
    expect(await within(row).findByText(visitsThisWeek(3))).toBeInTheDocument();
  });

  it("shows loyalty points only when a provider runs a program, one card each, never a sum", async () => {
    balance.mockResolvedValue(
      ok([
        { organization_id: "g1", organization_name: "Iron Lab", account_type: "gym", balance: 120, is_member: true },
        { organization_id: "t1", organization_name: "Coach Ada", account_type: "personal_trainer", balance: 30, is_member: true },
      ]) as never,
    );
    stats.mockResolvedValue(ok({ has_checked_in_today: false, total_check_ins: 4 }) as never);
    renderPage();
    expect(await screen.findByText("With Iron Lab")).toBeInTheDocument();
    expect(screen.getByText("With Coach Ada")).toBeInTheDocument();
    expect(screen.getAllByText("Loyalty points")).toHaveLength(2);
    expect(screen.queryByText("150")).not.toBeInTheDocument();
  });

  it("shows no loyalty card when none of the member's providers runs a program", async () => {
    balance.mockResolvedValue(ok([]) as never);
    stats.mockResolvedValue(ok({ has_checked_in_today: false, total_check_ins: 4 }) as never);
    renderPage();
    await screen.findByText(CHECK_INS_30D);
    expect(screen.queryByText("Loyalty points")).not.toBeInTheDocument();
  });

  it("highlights Activity in the nav", async () => {
    stats.mockResolvedValue(ok({ has_checked_in_today: false, total_check_ins: 0 }) as never);
    renderPage();
    expect(screen.getByTestId("shell").dataset.active).toBe("Activity");
  });

  it("has no visits row and a plain hint before the first check-in", async () => {
    history.mockResolvedValue(ok([]) as never);
    stats.mockResolvedValue(ok({ has_checked_in_today: false, total_check_ins: 0 }) as never);
    renderPage();
    expect(await screen.findByText(NO_CHECK_INS_HINT)).toBeInTheDocument();
    expect(screen.queryByTestId("visits-row")).toBeNull();
  });

  it("shows errors, not zeros, when every endpoint fails", async () => {
    stats.mockResolvedValue(fail as never);
    history.mockResolvedValue(fail as never);
    balance.mockResolvedValue(fail as never);
    renderPage();
    const alerts = await screen.findAllByRole("alert");
    expect(alerts.map((a) => a.textContent)).toEqual([STATS_LOAD_ERROR, HISTORY_LOAD_ERROR]);
    expect(contrast(tokenOf(alerts[0].style.color), tokenOf(alerts[0].style.background))).toBeGreaterThanOrEqual(4.5);
    expect(screen.queryByTestId("visits-row")).toBeNull();
    expect(screen.queryByText(CHECK_INS_30D)).not.toBeInTheDocument();
    expect(screen.queryByText("Loyalty points")).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Check-ins this week" })).not.toBeInTheDocument();
    expect(screen.queryByText(/No check-ins yet/)).not.toBeInTheDocument();
  });
});
