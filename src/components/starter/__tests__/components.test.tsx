import { describe, expect, it, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ChoiceGroup } from "../ChoiceGroup";
import { ExerciseCard } from "../ExerciseCard";
import { StarterSession } from "../StarterSession";
import { StartFlow } from "../StartFlow";
import { StarterTaskStatus, StarterGoal, StarterEquipment } from "@/lib/starter/types";

const push = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
  useSearchParams: () => searchParams,
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { fitness_goals: ["Build Muscle"] } }) }));
vi.mock("@/components/Toast", () => ({ toast: vi.fn() }));

const api = vi.hoisted(() => ({
  getOptions: vi.fn(),
  getPreview: vi.fn(),
  start: vi.fn(),
  swap: vi.fn(),
  listMine: vi.fn(),
  getProgram: vi.fn(),
  completeTask: vi.fn(),
  skipTask: vi.fn(),
}));
vi.mock("@/lib/api/starter", async (orig) => ({ ...(await orig<typeof import("@/lib/api/starter")>()), starterService: api }));
vi.mock("@/lib/api/progress", async (orig) => ({
  ...(await orig<typeof import("@/lib/api/progress")>()),
  progressService: { getOrCreateMyProfile: vi.fn().mockResolvedValue({ success: true, data: { _id: "prof" } }), createActivityReport: vi.fn().mockResolvedValue({ success: true }) },
}));

const wrap = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

beforeEach(() => {
  vi.clearAllMocks();
  searchParams = new URLSearchParams();
});

describe("ChoiceGroup", () => {
  function Harness() {
    const [v, setV] = useState<string | null>(null);
    return <ChoiceGroup label="Goal" options={[{ value: "a", label: "A" }, { value: "b", label: "B" }, { value: "c", label: "C" }]} value={v} onChange={setV} />;
  }
  it("is a radio group with one tab stop and arrow-key selection", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const group = screen.getByRole("radiogroup", { name: "Goal" });
    expect(group).toBeInTheDocument();
    const radios = screen.getAllByRole("radio");
    expect(radios.map((r) => r.getAttribute("tabindex"))).toEqual(["0", "-1", "-1"]);
    await user.tab();
    expect(radios[0]).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(radios[1]).toHaveFocus();
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(radios[2]).toHaveAttribute("aria-checked", "true");
  });
});

describe("ExerciseCard", () => {
  const base = { index: 0, ticked: false, onTick: vi.fn(), numbers: null, onNumber: vi.fn() };
  it("shows dose, rest, cues and the illustration with its alt text", () => {
    render(<ExerciseCard {...base} exercise={{ name: "Squat", sets: 2, reps: 10, restSeconds: 45, cues: ["Chest tall"], mediaId: "squat" }} />);
    expect(screen.getByText("2 x 10 · Rest 45 sec")).toBeInTheDocument();
    expect(screen.getByText("Chest tall")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /^Squat, side view/ })).toHaveAttribute("src", "/exercises/squat.svg");
    // A still for reduced motion is offered through <picture>.
    expect(document.querySelector('source[media="(prefers-reduced-motion: reduce)"]')).toHaveAttribute("srcset", "/exercises/squat-end.svg");
  });
  it("renders without a picture when the id has no art", () => {
    render(<ExerciseCard {...base} exercise={{ name: "Plank", seconds: 30, cues: [], mediaId: "plank" }} />);
    expect(screen.queryByRole("img")).toBeNull();
  });
  it("ticks through a labelled checkbox", async () => {
    const onTick = vi.fn();
    render(<ExerciseCard {...base} onTick={onTick} exercise={{ name: "Squat", cues: [] }} />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Squat, done" }));
    expect(onTick).toHaveBeenCalledWith(true);
  });
  it("shows number inputs for non-timed exercises only", () => {
    const rows = [{ weight: "", reps: "" }];
    const { rerender } = render(<ExerciseCard {...base} numbers={rows} exercise={{ name: "Squat", sets: 1, reps: 10, cues: [] }} />);
    expect(screen.getByLabelText("Squat, set 1, weight in kilograms")).toBeInTheDocument();
    rerender(<ExerciseCard {...base} numbers={rows} exercise={{ name: "Plank", seconds: 30, cues: [] }} />);
    expect(screen.queryByLabelText(/weight in kilograms/)).toBeNull();
  });
});

const program = { id: "p1", name: "Home Start", status: "active", startedAt: "2020-01-01T00:00:00.000Z", endsAt: null, remindersEnabled: false, sharedWithProviderIds: [], progress: null };
const sessionTask = {
  id: "o1",
  title: "Day 1: Legs",
  scheduledFor: new Date().toISOString(),
  status: StarterTaskStatus.Pending,
  completedLate: false,
  sessionMinutes: 25,
  exercises: [{ name: "Squat", sets: 2, reps: 10, cues: ["Chest tall"], mediaId: "squat" }],
};

describe("StarterSession", () => {
  beforeEach(() => {
    api.listMine.mockResolvedValue({ success: true, data: [program] });
    api.getProgram.mockResolvedValue({ success: true, data: { program, tasks: [sessionTask] } });
  });
  it("finishes a session and says so", async () => {
    api.completeTask.mockResolvedValue({ success: true, data: { ...sessionTask, status: StarterTaskStatus.Done } });
    wrap(<StarterSession occurrenceId="o1" />);
    await userEvent.click(await screen.findByRole("button", { name: "Finish session" }));
    expect(await screen.findByText("Session finished.")).toBeInTheDocument();
    expect(api.completeTask).toHaveBeenCalledWith("o1");
  });
  it("asks before skipping", async () => {
    api.skipTask.mockResolvedValue({ success: true, data: { ...sessionTask, status: StarterTaskStatus.Skipped } });
    wrap(<StarterSession occurrenceId="o1" />);
    await userEvent.click(await screen.findByRole("button", { name: "Skip session" }));
    expect(api.skipTask).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Yes, skip it" }));
    expect(await screen.findByText("Session skipped.")).toBeInTheDocument();
  });
  it("shows an error and keeps the buttons when saving fails", async () => {
    api.completeTask.mockResolvedValue({ success: false, message: "Server down" });
    wrap(<StarterSession occurrenceId="o1" />);
    await userEvent.click(await screen.findByRole("button", { name: "Finish session" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Server down");
    expect(screen.getByRole("button", { name: "Finish session" })).toBeEnabled();
  });
  it.each(["CONTENT_ACCESS_FROZEN", "PROGRAM_FROZEN_LAPSED"])(
    "says %s the same way and offers to renew",
    async (code) => {
      api.completeTask.mockResolvedValue({ success: false, code, status: 409, message: "API sentence" });
      wrap(<StarterSession occurrenceId="o1" />);
      await userEvent.click(await screen.findByRole("button", { name: "Finish session" }));
      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent(/Access has ended/);
      expect(alert).not.toHaveTextContent("API sentence");
      expect(screen.getByRole("link", { name: "See how to renew" })).toHaveAttribute(
        "href",
        "/dashboard/member/billing",
      );
    },
  );
  it("says the session is not available for an unknown id", async () => {
    wrap(<StarterSession occurrenceId="nope" />);
    expect(await screen.findByText("This session is not available.")).toBeInTheDocument();
  });
  it("shows a retry when the program cannot be loaded", async () => {
    api.listMine.mockResolvedValue({ success: false, message: "Down" });
    wrap(<StarterSession occurrenceId="o1" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Down");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

describe("StartFlow", () => {
  const option = { templateId: "t1", name: "Home Start", goalTags: [StarterGoal.GetActive], equipment: StarterEquipment.None, daysPerWeek: 3, sessionMinutes: 25, durationWeeks: 4 };
  const preview = { ...option, cautions: undefined, weekOne: [{ title: "Day 1", exercises: [{ name: "Squat", sets: 2, reps: 10, cues: [] }] }], laterWeeks: [{ week: 2, name: "Week 2" }] };
  beforeEach(() => {
    api.getOptions.mockResolvedValue({ success: true, data: { exact: true, options: [option] } });
    api.getPreview.mockResolvedValue({ success: true, data: preview });
  });

  async function toReview() {
    await userEvent.click(screen.getByRole("radio", { name: "None" }));
    await userEvent.click(screen.getByRole("radio", { name: "3 days" }));
    await userEvent.click(screen.getByRole("button", { name: "See the program" }));
    await screen.findByRole("heading", { name: "Home Start" });
  }

  it("pre-selects the goal from the profile and gates the first step", async () => {
    wrap(<StartFlow />);
    expect(screen.getByRole("radio", { name: "Build strength" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("button", { name: "See the program" })).toBeDisabled();
  });

  it("does not start until the health question and 18+ are answered, then sends only the flag", async () => {
    api.start.mockResolvedValue({ success: true, data: { instanceId: "i1" } });
    wrap(<StartFlow />);
    await toReview();
    const startBtn = screen.getByRole("button", { name: "Start this program" });
    expect(startBtn).toBeDisabled();
    await userEvent.click(screen.getByRole("radio", { name: "Yes" }));
    expect(screen.getByRole("alert")).toHaveTextContent("talk to a doctor");
    await userEvent.click(screen.getByRole("checkbox", { name: "I am 18 or older." }));
    expect(startBtn).toBeEnabled(); // a "yes" warns but does not block
    await userEvent.click(startBtn);
    await waitFor(() => expect(api.start).toHaveBeenCalled());
    expect(api.start.mock.calls[0][0]).toMatchObject({ templateId: "t1", adultConfirmed: true, safetyAck: true, screeningFlagged: true });
    expect(api.start.mock.calls[0][0].startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(api.start.mock.calls[0][0].timezone).toBeTruthy();
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/member/starter"));
  });

  it("goes to the program when the API says one is already running", async () => {
    api.start.mockResolvedValue({ success: false, code: "STARTER_ALREADY_ACTIVE", message: "x" });
    wrap(<StartFlow />);
    await toReview();
    await userEvent.click(screen.getByRole("radio", { name: "No" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "I am 18 or older." }));
    await userEvent.click(screen.getByRole("button", { name: "Start this program" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/member/starter"));
  });

  it("shows the API's error and stays put on another failure", async () => {
    api.start.mockResolvedValue({ success: false, code: "STARTER_BAD_START_DATE", message: "x" });
    wrap(<StartFlow />);
    await toReview();
    await userEvent.click(screen.getByRole("radio", { name: "No" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "I am 18 or older." }));
    await userEvent.click(screen.getByRole("button", { name: "Start this program" }));
    expect(await screen.findByText(/start date is not allowed/)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("swaps through the swap endpoint when opened with ?swap=", async () => {
    searchParams = new URLSearchParams("swap=i9");
    api.swap.mockResolvedValue({ success: true, data: { instanceId: "i2" } });
    wrap(<StartFlow />);
    await toReview();
    await userEvent.click(screen.getByRole("radio", { name: "Too hard" }));
    await userEvent.click(screen.getByRole("radio", { name: "No" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "I am 18 or older." }));
    await userEvent.click(screen.getByRole("button", { name: "Swap to this program" }));
    await waitFor(() => expect(api.swap).toHaveBeenCalled());
    expect(api.swap.mock.calls[0][0]).toBe("i9");
    expect(api.swap.mock.calls[0][1]).toMatchObject({ templateId: "t1", reason: "too_hard" });
    expect(api.start).not.toHaveBeenCalled();
  });

  it("says when no program fits", async () => {
    api.getOptions.mockResolvedValue({ success: true, data: { exact: false, options: [] } });
    wrap(<StartFlow />);
    await userEvent.click(screen.getByRole("radio", { name: "None" }));
    await userEvent.click(screen.getByRole("radio", { name: "3 days" }));
    await userEvent.click(screen.getByRole("button", { name: "See the program" }));
    expect(await screen.findByText("No program fits yet.")).toBeInTheDocument();
  });

  it("offers a retry when the programs cannot be loaded", async () => {
    api.getOptions.mockResolvedValue({ success: false, message: "Offline" });
    wrap(<StartFlow />);
    await userEvent.click(screen.getByRole("radio", { name: "None" }));
    await userEvent.click(screen.getByRole("radio", { name: "3 days" }));
    await userEvent.click(screen.getByRole("button", { name: "See the program" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Offline");
  });
});
