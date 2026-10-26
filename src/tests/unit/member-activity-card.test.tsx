import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemberActivityCard } from "@/app/dashboard/gym-owner/members/[memberId]/MemberActivityCard";
import { checkinsService, type MemberActivity } from "@/lib/api/checkins";

vi.mock("@/lib/format/useOrgFormat", () => ({
  useOrgFormat: () => ({
    fmtDate: (d: string) => `date:${d.slice(0, 10)}`,
    fmtDateTime: (d: string) => `at:${d.slice(0, 16)}`,
    fmtNumber: (n: number) => String(n),
  }),
}));

function renderCard(memberUserId: string | null = "u1") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemberActivityCard orgId="o1" memberUserId={memberUserId} />
    </QueryClientProvider>,
  );
}

const activity = (over: Partial<MemberActivity> = {}): MemberActivity => ({
  total_visits: 42,
  visits_last_30_days: 9,
  last_visit_at: "2026-10-25T07:30:00.000Z",
  recent: [
    { _id: "c2", checked_in_at: "2026-10-25T07:30:00.000Z", listing_headline: "Lekki branch" },
    { _id: "c1", checked_in_at: "2026-10-23T18:05:00.000Z", listing_headline: null },
  ],
  ...over,
});

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("MemberActivityCard", () => {
  it("shows the real counts, the last visit and the recent visits", async () => {
    const spy = vi.spyOn(checkinsService, "getMemberActivity").mockResolvedValue({ success: true, data: activity() } as never);
    renderCard();
    expect(await screen.findByText("Visits, last 30 days")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("date:2026-10-25")).toBeInTheDocument();
    expect(screen.getByText("at:2026-10-25T07:30")).toBeInTheDocument();
    expect(screen.getByText("Lekki branch")).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith("o1", "u1");
    expect(screen.getByText(/Showing the latest 2 of 42 visits/)).toBeInTheDocument();
  });

  it("says so, with no numbers, when the member has never checked in", async () => {
    vi.spyOn(checkinsService, "getMemberActivity").mockResolvedValue({
      success: true,
      data: activity({ total_visits: 0, visits_last_30_days: 0, last_visit_at: null, recent: [] }),
    } as never);
    renderCard();
    expect(await screen.findByText("No check-ins yet.")).toBeInTheDocument();
    expect(screen.queryByText("Visits, all time")).not.toBeInTheDocument();
  });

  it("shows an error, not zeros, when the request fails", async () => {
    vi.spyOn(checkinsService, "getMemberActivity").mockResolvedValue({ success: false, message: "boom" } as never);
    renderCard();
    expect(await screen.findByText(/couldn.t load this member.s activity/i)).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("does not call the API when the membership has no member user", () => {
    const spy = vi.spyOn(checkinsService, "getMemberActivity");
    renderCard(null);
    expect(spy).not.toHaveBeenCalled();
    expect(screen.getByText(/isn.t available for this membership/i)).toBeInTheDocument();
  });
});
