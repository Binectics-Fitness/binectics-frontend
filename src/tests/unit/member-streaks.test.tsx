import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StreaksClient, type StreakStats } from "@/app/dashboard/member/streaks/StreaksClient";
import { checkinsService } from "@/lib/api/checkins";

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
vi.mock("@/lib/queries/loyalty", () => ({ useLoyaltyBalance: () => ({ data: undefined }) }));

const ok = <T,>(data: T) => ({ success: true, data });

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <StreaksClient />
    </QueryClientProvider>,
  );
}

describe("streaks page", () => {
  const stats = vi.spyOn(checkinsService, "getMyDashboardStats");
  const history = vi.spyOn(checkinsService, "getMyHistory");

  beforeEach(() => {
    stats.mockReset();
    history.mockReset();
    history.mockResolvedValue(ok([]) as never);
  });

  it("highlights Activity in the nav, not Home", async () => {
    stats.mockResolvedValue(ok({ has_checked_in_today: false, current_streak_days: 0, total_check_ins: 0 }) as never);
    renderPage();
    expect(screen.getByTestId("shell").dataset.active).toBe("Activity");
  });

  it("earns milestones from the longest streak and shows it", async () => {
    const s: StreakStats = {
      has_checked_in_today: false,
      current_streak_days: 3,
      total_check_ins: 40,
      longest_streak_days: 31,
      streak_at_risk: true,
    };
    stats.mockResolvedValue(ok(s) as never);
    renderPage();
    expect(await screen.findByText("Longest · 31 days · Check in today to keep it going")).toBeInTheDocument();
    const thirty = screen.getAllByRole("listitem").find((li) => within(li).queryByText("30-day streak"))!;
    expect(within(thirty).getByText(", earned")).toBeInTheDocument();
    expect(screen.getByText("Longest streak")).toBeInTheDocument();
    expect(screen.getByText("4 days to the 7-day milestone")).toBeInTheDocument();
  });

  it("falls back to the current streak and shows no longest line when the API omits it", async () => {
    stats.mockResolvedValue(ok({ has_checked_in_today: true, current_streak_days: 8, total_check_ins: 12 }) as never);
    renderPage();
    expect(await screen.findByText("Checked in today")).toBeInTheDocument();
    expect(screen.queryByText("Longest streak")).not.toBeInTheDocument();
    expect(screen.queryByText(/Longest ·/)).not.toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    const seven = items.find((li) => within(li).queryByText("7-day streak"))!;
    const thirty = items.find((li) => within(li).queryByText("30-day streak"))!;
    expect(within(seven).getByText(", earned")).toBeInTheDocument();
    expect(within(thirty).getByText(", not yet earned")).toBeInTheDocument();
  });
});
