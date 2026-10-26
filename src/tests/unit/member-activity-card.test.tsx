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
  classes_booked: { last_30_days: 5, next_upcoming: { at: "2026-10-28T09:00:00.000Z", name: "Spin" } },
  classes_attended: { last_30_days: 0 },
  latest: [
    { _id: "c2", kind: "check_in", at: "2026-10-25T07:30:00.000Z", label: "Lekki branch", attendance: null },
    { _id: "b1", kind: "class_booked", at: "2026-10-24T09:00:00.000Z", label: "Yoga", attendance: null },
    { _id: "c1", kind: "check_in", at: "2026-10-23T18:05:00.000Z", label: null, attendance: null },
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
    expect(await screen.findByText("Check-ins, last 30 days")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Classes booked, last 30 days")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText(/Next class booked: Spin, at:2026-10-28T09:00/)).toBeInTheDocument();
    expect(screen.getByText("date:2026-10-25")).toBeInTheDocument();
    expect(screen.getByText("at:2026-10-25T07:30")).toBeInTheDocument();
    expect(screen.getByText("Lekki branch")).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith("o1", "u1");
    // Every row says what it is, check-ins and bookings never mixed up.
    expect(screen.getAllByText("Check-in")).toHaveLength(2);
    const booked = screen.getByText("Class booked");
    expect(booked.closest("li")).toHaveTextContent("Yoga");
    expect(screen.getByText(/does not\b|not that they came/)).toBeInTheDocument();
  });

  it("shows no attended count, and no marks, where staff recorded none", async () => {
    vi.spyOn(checkinsService, "getMemberActivity").mockResolvedValue({ success: true, data: activity() } as never);
    renderCard();
    await screen.findByText("Classes booked, last 30 days");
    expect(screen.queryByText("Classes attended, last 30 days")).not.toBeInTheDocument();
    expect(screen.queryByText(/Marked (attended|no-show)/)).not.toBeInTheDocument();
  });

  it("shows classes attended apart from booked, and each row's mark, where staff recorded them", async () => {
    vi.spyOn(checkinsService, "getMemberActivity").mockResolvedValue({
      success: true,
      data: activity({
        classes_attended: { last_30_days: 2 },
        latest: [
          { _id: "b2", kind: "class_booked", at: "2026-10-25T09:00:00.000Z", label: "Spin", attendance: "attended" },
          { _id: "b1", kind: "class_booked", at: "2026-10-24T09:00:00.000Z", label: "Yoga", attendance: "no_show" },
          { _id: "b0", kind: "class_booked", at: "2026-10-23T09:00:00.000Z", label: "Box", attendance: null },
        ],
      }),
    } as never);
    renderCard();
    expect(await screen.findByText("Classes attended, last 30 days")).toBeInTheDocument();
    expect(screen.getByText("Classes booked, last 30 days")).toBeInTheDocument();
    expect(screen.getByText("Marked attended").closest("li")).toHaveTextContent("Spin");
    expect(screen.getByText("Marked no-show").closest("li")).toHaveTextContent("Yoga");
    // The unmarked booking says nothing about attendance.
    expect(screen.getByText("Box").closest("li")).not.toHaveTextContent(/attended|no-show/i);
  });

  it("says so, with no numbers, when there is no activity at all", async () => {
    vi.spyOn(checkinsService, "getMemberActivity").mockResolvedValue({
      success: true,
      data: activity({ total_visits: 0, visits_last_30_days: 0, last_visit_at: null, classes_booked: { last_30_days: 0, next_upcoming: null }, classes_attended: { last_30_days: 0 }, latest: [] }),
    } as never);
    renderCard();
    expect(await screen.findByText("No activity yet.")).toBeInTheDocument();
    expect(screen.queryByText("Check-ins, all time")).not.toBeInTheDocument();
  });

  it("shows a booking-only member's classes without inventing check-ins", async () => {
    vi.spyOn(checkinsService, "getMemberActivity").mockResolvedValue({
      success: true,
      data: activity({ total_visits: 0, visits_last_30_days: 0, last_visit_at: null, latest: [{ _id: "b1", kind: "class_booked", at: "2026-10-24T09:00:00.000Z", label: "Yoga", attendance: null }] }),
    } as never);
    renderCard();
    expect(await screen.findByText("Class booked")).toBeInTheDocument();
    expect(screen.queryByText("Check-in")).not.toBeInTheDocument();
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
