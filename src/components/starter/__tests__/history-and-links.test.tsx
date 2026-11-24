import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ExerciseCard } from "../ExerciseCard";
import { StarterHistory } from "../StarterHistory";
import { StarterHome } from "../StarterHome";
import { localToday } from "@/lib/starter/model";
import { StarterTaskStatus, type StarterTask } from "@/lib/starter/types";

vi.mock("@/components/Toast", () => ({ toast: vi.fn() }));
vi.mock("@/components/messaging/MyCoachesCard", () => ({ useMyProviders: () => ({ data: [], isLoading: false }) }));

const api = vi.hoisted(() => ({ listMine: vi.fn(), getProgram: vi.fn() }));
vi.mock("@/lib/api/starter", async (orig) => ({ ...(await orig<typeof import("@/lib/api/starter")>()), starterService: api }));
const hist = vi.hoisted(() => ({ getHistory: vi.fn(), getMyActivities: vi.fn() }));
vi.mock("@/lib/api/starterHistory", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/starterHistory")>()),
  starterHistoryService: hist,
}));

const program = {
  id: "p1",
  name: "Get moving",
  status: "active",
  startedAt: "2026-11-02T00:00:00.000Z",
  remindersEnabled: false,
  sharedWithProviderIds: [],
  progress: null,
};
const task = (id: string, day: string, status: StarterTaskStatus, late = false): StarterTask => ({
  id,
  title: `Session ${id}`,
  scheduledFor: `${day}T00:00:00.000Z`,
  status,
  completedLate: late,
  exercises: [
    { name: "Squat", sets: 3, reps: 10, cues: [], mediaId: "squat" },
    { name: "Plank", seconds: 30, cues: [], mediaId: "plank" },
    { name: "Mystery move", reps: 5, cues: [] },
  ],
});

const wrap = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

beforeEach(() => {
  vi.clearAllMocks();
  api.listMine.mockResolvedValue({ success: true, data: [program] });
  api.getProgram.mockResolvedValue({ success: true, data: { program, tasks: [] } });
  hist.getHistory.mockResolvedValue({ success: true, data: [] });
  hist.getMyActivities.mockResolvedValue({ success: true, data: [] });
});

describe("StarterHistory", () => {
  it("lists past sessions by week with done, done late, skipped and missed", async () => {
    hist.getHistory.mockResolvedValue({
      success: true,
      data: [
        { day: "2026-11-11", items: [task("d", "2026-11-11", StarterTaskStatus.Missed)] },
        { day: "2026-11-10", items: [task("c", "2026-11-10", StarterTaskStatus.Done, true)] },
        { day: "2026-11-04", items: [task("b", "2026-11-04", StarterTaskStatus.Skipped)] },
        { day: "2026-11-02", items: [task("a", "2026-11-02", StarterTaskStatus.Done)] },
      ],
    });
    hist.getMyActivities.mockResolvedValue({
      success: true,
      data: [{ _id: "x", title: "Session a", duration_minutes: 25, performed_at: "2026-11-02T18:00:00.000Z", notes: "Squat: 3 x 10" }],
    });
    wrap(<StarterHistory />);
    const week2 = (await screen.findByRole("list", { name: "Week 2 sessions" })) as HTMLElement;
    expect(within(week2).getAllByRole("listitem").map((li) => li.textContent)).toEqual([
      expect.stringMatching(/Session d.*Missed/),
      expect.stringMatching(/Session c.*Done late/),
    ]);
    const week1 = screen.getByRole("list", { name: "Week 1 sessions" });
    expect(within(week1).getByText("Skipped")).toBeInTheDocument();
    expect(within(week1).getByText("Done")).toBeInTheDocument();
    expect(screen.getByText("1 session done, 1 of them late · 1 missed")).toBeInTheDocument();
    expect(hist.getHistory).toHaveBeenCalledWith("p1", 60);
    expect(await screen.findByText("Squat: 3 x 10")).toBeInTheDocument();
    expect(screen.getByText(/25 minutes/)).toBeInTheDocument();
  });

  it("includes today's finished session from the agenda", async () => {
    api.getProgram.mockResolvedValue({
      success: true,
      data: { program, tasks: [task("t", localToday(), StarterTaskStatus.Done)] },
    });
    wrap(<StarterHistory />);
    expect(await screen.findByText("Session t")).toBeInTheDocument();
  });

  it("has an empty state with nothing recorded yet", async () => {
    wrap(<StarterHistory />);
    expect(await screen.findByText(/Nothing to show yet/)).toBeInTheDocument();
    expect(await screen.findByText(/Numbers you add when you finish a session/)).toBeInTheDocument();
  });

  it("offers to start a program when none is running", async () => {
    api.listMine.mockResolvedValue({ success: true, data: [] });
    wrap(<StarterHistory />);
    expect(await screen.findByRole("heading", { name: "No program running" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start a free program" })).toHaveAttribute("href", "/dashboard/member/starter/start");
    expect(hist.getHistory).not.toHaveBeenCalled();
  });

  it("still shows the sessions when the numbers cannot be read", async () => {
    hist.getHistory.mockResolvedValue({ success: true, data: [{ day: "2026-11-02", items: [task("a", "2026-11-02", StarterTaskStatus.Done)] }] });
    hist.getMyActivities.mockResolvedValue({ success: false, message: "nope" });
    wrap(<StarterHistory />);
    expect(await screen.findByText("Your numbers could not be loaded just now.")).toBeInTheDocument();
    expect(screen.getByText("Session a")).toBeInTheDocument();
  });

  it("shows an error with a retry when the history cannot be read", async () => {
    hist.getHistory.mockResolvedValue({ success: false, message: "Server down" });
    wrap(<StarterHistory />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Server down");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

describe("links to the exercise page", () => {
  it("ExerciseCard links to the exercise page with the session and row", () => {
    render(
      <ul>
        <ExerciseCard exercise={task("a", "2026-11-02", StarterTaskStatus.Pending).exercises[0]} index={0} ticked={false} onTick={() => {}} numbers={null} onNumber={() => {}} sessionId="occ9" />
      </ul>,
    );
    expect(screen.getByRole("link", { name: "How to do it: Squat" })).toHaveAttribute(
      "href",
      "/dashboard/member/exercises/squat?session=occ9&i=0",
    );
  });

  it("ExerciseCard reads the session from the URL when not given", () => {
    window.history.pushState({}, "", "/dashboard/member/starter/session/occ7");
    render(
      <ul>
        <ExerciseCard exercise={task("a", "2026-11-02", StarterTaskStatus.Pending).exercises[1]} index={1} ticked={false} onTick={() => {}} numbers={null} onNumber={() => {}} />
      </ul>,
    );
    expect(screen.getByRole("link", { name: "How to do it: Plank" })).toHaveAttribute(
      "href",
      "/dashboard/member/exercises/plank?session=occ7&i=1",
    );
    window.history.pushState({}, "", "/");
  });

  it("ExerciseCard has no link for an exercise with no guide", () => {
    render(
      <ul>
        <ExerciseCard exercise={task("a", "2026-11-02", StarterTaskStatus.Pending).exercises[2]} index={2} ticked={false} onTick={() => {}} numbers={null} onNumber={() => {}} />
      </ul>,
    );
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("StarterHome links today's exercises and the history page", async () => {
    api.getProgram.mockResolvedValue({
      success: true,
      data: { program, tasks: [task("today1", localToday(), StarterTaskStatus.Pending)] },
    });
    wrap(<StarterHome />);
    const list = await screen.findByRole("list", { name: "Today's exercises" });
    expect(within(list).getByRole("link", { name: "Squat, how to do it" })).toHaveAttribute(
      "href",
      "/dashboard/member/exercises/squat?session=today1&i=0",
    );
    expect(within(list).getByRole("link", { name: "Plank, how to do it" })).toHaveAttribute(
      "href",
      "/dashboard/member/exercises/plank?session=today1&i=1",
    );
    expect(within(list).queryByRole("link", { name: /Mystery move/ })).toBeNull();
    expect(screen.getByRole("link", { name: "Your history" })).toHaveAttribute("href", "/dashboard/member/starter/history");
  });
});
