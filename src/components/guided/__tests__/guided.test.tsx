import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GuidedStartBlock } from "../GuidedStartBlock";
import { GuidedSession } from "../GuidedSession";
import { DEFAULT_GUIDED_PREFS, useGuidedPrefs } from "@/lib/guided/prefs";
import { buildPlan, initialState, reduce } from "@/lib/guided/engine";
import { loadActive, saveActive } from "@/lib/guided/persistence";
import { StarterTaskStatus, type StarterTask } from "@/lib/starter/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace: vi.fn() }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1" } }) }));

const api = vi.hoisted(() => ({ listMine: vi.fn(), getProgram: vi.fn(), completeTask: vi.fn() }));
vi.mock("@/lib/api/starter", async (orig) => ({ ...(await orig<typeof import("@/lib/api/starter")>()), starterService: api }));

const program = { id: "p1", name: "Home Start", status: "active", startedAt: "2020-01-01T00:00:00.000Z", endsAt: null, remindersEnabled: false, sharedWithProviderIds: [], progress: null };
const task = (exercises: StarterTask["exercises"]): StarterTask => ({
  id: "o1",
  title: "Day 1: Legs",
  scheduledFor: new Date().toISOString(),
  status: StarterTaskStatus.Pending,
  completedLate: false,
  exercises,
});
const SQUAT = [{ name: "Squat", sets: 1, reps: 10, cues: ["Chest tall"], mediaId: "squat" }];

const wrap = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

const setPrefs = (patch: Partial<typeof DEFAULT_GUIDED_PREFS>) =>
  useGuidedPrefs.setState({ userId: "u1", hydrated: true, prefs: { ...DEFAULT_GUIDED_PREFS, ...patch } });

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useGuidedPrefs.setState({ userId: null, hydrated: false, prefs: DEFAULT_GUIDED_PREFS });
  api.listMine.mockResolvedValue({ success: true, data: [program] });
  api.getProgram.mockResolvedValue({ success: true, data: { program, tasks: [task(SQUAT)] } });
});
afterEach(() => {
  vi.useRealTimers();
});

describe("GuidedStartBlock", () => {
  it("is one Start with a caption and the current choices, settings behind Change", async () => {
    const onStart = vi.fn();
    render(<GuidedStartBlock onStart={onStart} />);
    expect(screen.getByText(/counts you in, times each exercise and rest/)).toBeInTheDocument();
    expect(screen.getByTestId("guided-settings-line")).toHaveTextContent("Voice coach on · 5 sec get-ready");
    expect(screen.queryByRole("dialog")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: "Change voice and timing" }));
    const dialog = await screen.findByRole("dialog", { name: "Voice and timing" });
    // The same choices as mobile.
    for (const name of ["Voice coaching", "Sounds (short beeps)", "Countdown calls", "Spoken form tips", "Coach lines", "Local flavour"]) {
      expect(within(dialog).getByRole("switch", { name })).toBeInTheDocument();
    }
    for (const name of ["Speaking speed", "Voice volume", "Get-ready countdown", "Rest when the plan has none"]) {
      expect(within(dialog).getByRole("radiogroup", { name })).toBeInTheDocument();
    }
    await userEvent.click(within(dialog).getByRole("radio", { name: "10 sec" }));
    await userEvent.click(within(dialog).getByRole("switch", { name: "Voice coaching" }));
    // Voice off hides the voice-only choices.
    expect(within(dialog).queryByRole("switch", { name: "Coach lines" })).toBeNull();
    expect(screen.getByTestId("guided-settings-line")).toHaveTextContent("Beeps only · 10 sec get-ready");
    await userEvent.click(within(dialog).getByRole("button", { name: "Done" }));

    await userEvent.click(screen.getByRole("button", { name: "Start guided session" }));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});

describe("GuidedSession", () => {
  it("starts the get-ready countdown at once, with no second Start", async () => {
    setPrefs({});
    wrap(<GuidedSession occurrenceId="o1" />);
    const view = await screen.findByTestId("guided-countdown");
    expect(within(view).getByTestId("guided-phase")).toHaveTextContent("GET READY");
    expect(within(view).getByRole("heading", { name: "Squat" })).toBeInTheDocument();
    expect(within(view).getByTestId("guided-timer")).toHaveTextContent("5");
    expect(within(view).getByText("Chest tall")).toBeInTheDocument();
    expect(within(view).getByRole("img", { name: /^Squat/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Start/ })).toBeNull();
  });

  it("pauses and resumes from the buttons and the Space key", async () => {
    setPrefs({});
    wrap(<GuidedSession occurrenceId="o1" />);
    await screen.findByTestId("guided-countdown");
    await userEvent.click(screen.getByRole("button", { name: "Pause" }));
    expect(screen.getByTestId("guided-phase")).toHaveTextContent("PAUSED");
    expect(screen.getByRole("button", { name: "Skip exercise" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Resume" }));
    expect(screen.getByTestId("guided-phase")).toHaveTextContent("GET READY");
    fireEvent.keyDown(document.body, { key: " " });
    expect(screen.getByTestId("guided-phase")).toHaveTextContent("PAUSED");
    fireEvent.keyDown(document.body, { key: " " });
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("records nothing until the summary's Mark session done, which completes the task", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    setPrefs({ prepSeconds: 0 });
    api.completeTask.mockResolvedValue({ success: true, data: { ...task(SQUAT), status: StarterTaskStatus.Done } });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    wrap(<GuidedSession occurrenceId="o1" />);
    await screen.findByTestId("guided-exercise");
    await act(async () => {
      vi.advanceTimersByTime(1000); // past the double-tap guard
    });
    await user.click(screen.getByRole("button", { name: "Set done" }));
    expect(await screen.findByRole("heading", { name: "Workout complete" })).toBeInTheDocument();
    expect(api.completeTask).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Mark session done" }));
    expect(api.completeTask).toHaveBeenCalledWith("o1");
    expect(await screen.findByText("Session finished.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to your program" }));
    expect(push).toHaveBeenCalledWith("/dashboard/member/starter");
  });

  it("ending early asks first, then offers Mark done anyway, Start over and Leave", async () => {
    setPrefs({});
    wrap(<GuidedSession occurrenceId="o1" />);
    await screen.findByTestId("guided-countdown");
    await userEvent.click(screen.getByRole("button", { name: "End workout" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(within(dialog).getByRole("button", { name: "End workout" }));
    expect(await screen.findByRole("heading", { name: "You ended early" })).toBeInTheDocument();
    // Nothing was done, so there is nothing to mark.
    expect(screen.queryByRole("button", { name: /Mark/ })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Start over" }));
    expect(await screen.findByTestId("guided-countdown")).toBeInTheDocument();
    expect(api.completeTask).not.toHaveBeenCalled();
  });

  it("reopening a saved run resumes it PAUSED where it was", async () => {
    setPrefs({});
    const plan = buildPlan(SQUAT, DEFAULT_GUIDED_PREFS.defaultRestSeconds);
    const running = reduce(initialState(plan, 0), { type: "start", now: Date.now() - 4000 });
    await saveActive("u1", "o1", running, Date.now() - 2000);
    wrap(<GuidedSession occurrenceId="o1" />);
    const view = await screen.findByTestId("guided-exercise");
    expect(within(view).getByTestId("guided-phase")).toHaveTextContent("PAUSED");
    expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument();
  });

  it("leaving mid-run pauses and saves it", async () => {
    setPrefs({});
    const { unmount } = wrap(<GuidedSession occurrenceId="o1" />);
    await screen.findByTestId("guided-countdown");
    unmount();
    const saved = await loadActive("u1", "o1");
    expect(saved?.state.phase).toBe("countdown");
    expect(saved?.state.pausedAt).not.toBeNull();
  });
});
