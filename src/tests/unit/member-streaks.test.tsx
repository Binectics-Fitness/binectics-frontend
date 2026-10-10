import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  StreaksClient,
  type DashboardStatsWithStreakFields199,
} from "@/app/dashboard/member/streaks/StreaksClient";
import { checkinsService } from "@/lib/api/checkins";
import { loyaltyService } from "@/lib/api/loyalty";
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

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, retryDelay: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <StreaksClient />
    </QueryClientProvider>,
  );
}

const badge = (name: string) =>
  screen.getAllByRole("listitem").find((li) => within(li).queryByText(name))!;

describe("streaks page", () => {
  const stats = vi.spyOn(checkinsService, "getMyDashboardStats");
  const history = vi.spyOn(checkinsService, "getMyHistory");
  const balance = vi.spyOn(loyaltyService, "getPrograms");

  beforeEach(() => {
    stats.mockReset();
    history.mockReset();
    balance.mockReset();
    history.mockResolvedValue(ok([]) as never);
    balance.mockResolvedValue(
      ok([{ organization_id: "g1", organization_name: "Iron Lab", account_type: "gym", balance: 120, is_member: true }]) as never,
    );
  });

  it("shows loyalty points only when a provider runs a program, named for that provider", async () => {
    stats.mockResolvedValue(ok({ has_checked_in_today: false, current_streak_days: 0, total_check_ins: 4 }) as never);
    renderPage();
    expect(await screen.findByText("Loyalty points")).toBeInTheDocument();
    expect(screen.getByText("With Iron Lab")).toBeInTheDocument();
    expect(screen.queryByText(/Redeemable at your gym/)).not.toBeInTheDocument();
  });

  it("shows each provider's points separately, never a sum across them", async () => {
    balance.mockResolvedValue(
      ok([
        { organization_id: "g1", organization_name: "Iron Lab", account_type: "gym", balance: 120, is_member: true },
        { organization_id: "t1", organization_name: "Coach Ada", account_type: "personal_trainer", balance: 30, is_member: true },
      ]) as never,
    );
    stats.mockResolvedValue(ok({ has_checked_in_today: false, current_streak_days: 0, total_check_ins: 4 }) as never);
    renderPage();
    expect(await screen.findByText("With Iron Lab")).toBeInTheDocument();
    expect(screen.getByText("With Coach Ada")).toBeInTheDocument();
    expect(screen.getAllByText("Loyalty points")).toHaveLength(2);
    expect(screen.queryByText("150")).not.toBeInTheDocument();
  });

  it("shows no loyalty card when none of the member's providers runs a program", async () => {
    balance.mockResolvedValue(ok([]) as never);
    stats.mockResolvedValue(ok({ has_checked_in_today: false, current_streak_days: 0, total_check_ins: 4 }) as never);
    renderPage();
    await screen.findByText("Total check-ins");
    expect(screen.queryByText("Loyalty points")).not.toBeInTheDocument();
  });

  it("highlights Activity in the nav, not Home", async () => {
    stats.mockResolvedValue(ok({ has_checked_in_today: false, current_streak_days: 0, total_check_ins: 0 }) as never);
    renderPage();
    expect(screen.getByTestId("shell").dataset.active).toBe("Activity");
  });

  it("earns milestones from the longest streak and shows it, with milestone progress", async () => {
    const s: DashboardStatsWithStreakFields199 = {
      has_checked_in_today: false,
      current_streak_days: 3,
      total_check_ins: 40,
      longest_streak_days: 31,
      streak_at_risk: true,
    };
    stats.mockResolvedValue(ok(s) as never);
    renderPage();
    expect(await screen.findByText("Longest · 31 days · Check in today to keep it going")).toBeInTheDocument();
    expect(within(badge("30-day streak")).getByText(", earned")).toBeInTheDocument();
    expect(screen.getByText("Longest streak")).toBeInTheDocument();
    expect(screen.getByText("4 days to the 7-day milestone")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("without the API's longest streak: no longest line, no milestone progress, badges from the current streak", async () => {
    stats.mockResolvedValue(ok({ has_checked_in_today: true, current_streak_days: 8, total_check_ins: 12 }) as never);
    renderPage();
    expect(await screen.findByText("Checked in today")).toBeInTheDocument();
    expect(screen.queryByText("Longest streak")).not.toBeInTheDocument();
    expect(screen.queryByText(/Longest ·/)).not.toBeInTheDocument();
    expect(screen.queryByText(/to the \d+-day milestone/)).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(within(badge("7-day streak")).getByText(", earned")).toBeInTheDocument();
    expect(within(badge("30-day streak")).getByText(", not yet earned")).toBeInTheDocument();
  });

  it("earns First step from any check-in, so it never reads locked beside 10 sessions", async () => {
    stats.mockResolvedValue(ok({ has_checked_in_today: false, current_streak_days: 0, total_check_ins: 12 }) as never);
    renderPage();
    await screen.findByText("Milestones");
    expect(within(badge("First step")).getByText(", earned")).toBeInTheDocument();
    expect(within(badge("10 sessions")).getByText(", earned")).toBeInTheDocument();
  });

  it("shows no at-risk hint when there is no streak to lose", async () => {
    stats.mockResolvedValue(
      ok({ has_checked_in_today: false, current_streak_days: 0, total_check_ins: 5, longest_streak_days: 4, streak_at_risk: true }) as never,
    );
    renderPage();
    expect(await screen.findByText("Longest · 4 days")).toBeInTheDocument();
    expect(screen.queryByText(/keep it going/)).not.toBeInTheDocument();
  });

  it("shows errors, not zeros, when every endpoint fails", async () => {
    stats.mockResolvedValue(fail as never);
    history.mockResolvedValue(fail as never);
    balance.mockResolvedValue(fail as never);
    renderPage();
    const alerts = await screen.findAllByRole("alert");
    expect(alerts.map((a) => a.textContent)).toEqual([
      expect.stringMatching(/couldn't load your streak/),
      expect.stringMatching(/couldn't load your check-ins/),
    ]);
    expect(contrast(tokenOf(alerts[0].style.color), tokenOf(alerts[0].style.background))).toBeGreaterThanOrEqual(4.5);
    expect(screen.queryByText("Current streak")).not.toBeInTheDocument();
    expect(screen.queryByText("Total check-ins")).not.toBeInTheDocument();
    expect(screen.queryByText("Loyalty points")).not.toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Check-ins this week" })).not.toBeInTheDocument();
    expect(screen.queryByText("Milestones")).not.toBeInTheDocument();
    expect(screen.queryByText(/No check-ins yet/)).not.toBeInTheDocument();
  });

  it("draws locked badges at full strength: text clears 4.5:1 without opacity", async () => {
    stats.mockResolvedValue(ok({ has_checked_in_today: false, current_streak_days: 2, total_check_ins: 3 }) as never);
    renderPage();
    await screen.findByText("Milestones");
    const locked = badge("365-day streak");
    expect(locked.dataset.earned).toBe("false");
    expect(locked.style.opacity).toBe("");
    const name = locked.querySelector<HTMLElement>("[data-milestone-name]")!;
    expect(contrast(tokenOf(name.style.color), "bg")).toBeGreaterThanOrEqual(4.5);
    expect(locked.style.border).toContain("dashed");
  });
});
