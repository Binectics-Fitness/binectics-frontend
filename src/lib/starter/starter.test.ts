import { afterEach, describe, expect, it, vi } from "vitest";
import {
  STARTER_NOT_MEDICAL_ADVICE,
  STARTER_STOP_NOTE,
  laterWeekParts,
  safetyParagraphs,
  starterFactsLine,
} from "./copy";
import { isStarterProgramEnabled } from "./flag";
import { suggestStarterGoal } from "./goals";
import {
  addDaysLocal,
  exerciseDose,
  formatTaskDay,
  isTimedExercise,
  numbersNotes,
  parseMinutes,
  programDayLabel,
  restLine,
  starterProgressLine,
  starterStartDate,
  starterTodayModel,
} from "./model";
import {
  StarterGoal,
  StarterStartOn,
  StarterTaskStatus,
  type StarterExercise,
  type StarterProgram,
  type StarterTask,
} from "./types";
import { starterErrorMessage } from "./errors";

const ex = (o: Partial<StarterExercise> = {}): StarterExercise => ({ name: "Squat", cues: [], ...o });
const task = (o: Partial<StarterTask> & { id: string; scheduledFor: string }): StarterTask => ({
  title: "Day",
  status: StarterTaskStatus.Pending,
  completedLate: false,
  exercises: [],
  ...o,
});
const program = (o: Partial<StarterProgram> = {}): StarterProgram => ({
  id: "p1",
  name: "Home Start",
  status: "active",
  startedAt: "2026-11-02T00:00:00.000Z",
  endsAt: "2026-11-30T00:00:00.000Z",
  catchUpDays: 2,
  remindersEnabled: false,
  sharedWithProviderIds: [],
  progress: null,
  ...o,
});

describe("feature flag", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("is on outside production by default", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_FEATURE_STARTER_PROGRAM", "");
    expect(isStarterProgramEnabled()).toBe(true);
  });
  it("is off in production until set", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_FEATURE_STARTER_PROGRAM", "");
    expect(isStarterProgramEnabled()).toBe(false);
    vi.stubEnv("NEXT_PUBLIC_FEATURE_STARTER_PROGRAM", "true");
    expect(isStarterProgramEnabled()).toBe(true);
  });
  it("false turns it off everywhere", () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXT_PUBLIC_FEATURE_STARTER_PROGRAM", "false");
    expect(isStarterProgramEnabled()).toBe(false);
  });
});

describe("goals", () => {
  it("pre-selects the first mapped saved goal, in the member's order", () => {
    expect(suggestStarterGoal(["Yoga", "Build Muscle", "Weight Loss"])).toBe(StarterGoal.BuildStrength);
    expect(suggestStarterGoal(["better"])).toBe(StarterGoal.GetActive);
    expect(suggestStarterGoal(["Yoga"])).toBeNull();
    expect(suggestStarterGoal(undefined)).toBeNull();
  });
});

describe("copy", () => {
  it("builds the facts line from only what the API sent", () => {
    expect(starterFactsLine({ durationWeeks: 4, daysPerWeek: 3, sessionMinutes: 25 })).toBe(
      "4 weeks, 3 days a week, about 25 minutes a session",
    );
    expect(starterFactsLine({ durationWeeks: 1, daysPerWeek: 0, sessionMinutes: 0 })).toBe("1 week");
  });
  it("shows the fixed notes when no cautions come from the template", () => {
    expect(safetyParagraphs(null)).toEqual([STARTER_NOT_MEDICAL_ADVICE, STARTER_STOP_NOTE]);
  });
  it("does not repeat the stop note when the cautions already cover it", () => {
    const cautions = "Stop if you feel sharp pain or dizziness. Rest and get help if it does not settle.";
    expect(safetyParagraphs(cautions)).toEqual([STARTER_NOT_MEDICAL_ADVICE, cautions]);
  });
  it("drops a leading repeat of the not-medical-advice note", () => {
    expect(safetyParagraphs(`${STARTER_NOT_MEDICAL_ADVICE} Warm up first.`)[1]).toBe("Warm up first.");
  });
  it("strips a repeated week label", () => {
    expect(laterWeekParts({ week: 2, name: "Week 2: more rounds" })).toEqual({ label: "Week 2", name: "more rounds" });
  });
  it("never claims the art or programs are reviewed or approved", async () => {
    const copy = await import("./copy");
    const all = Object.values(copy).filter((v): v is string => typeof v === "string").join(" ");
    expect(all).not.toMatch(/\b(approved|cleared|certified)\b/i);
    expect(copy.STARTER_ART_NOTE).toMatch(/not been professionally reviewed/);
  });
});

describe("dates", () => {
  it("adds days across a month end", () => {
    expect(addDaysLocal("2026-10-30", 3)).toBe("2026-11-02");
  });
  it("formats a day without drifting by time zone", () => {
    expect(formatTaskDay("2026-11-02T23:00:00.000Z")).toBe("Mon, Nov 2");
  });
  it("starts today or on a later Monday (a Monday member waits a week)", () => {
    const wed = new Date(2026, 9, 28, 10); // Wed 28 Oct 2026
    expect(starterStartDate(StarterStartOn.Today, wed)).toBe("2026-10-28");
    expect(starterStartDate(StarterStartOn.NextMonday, wed)).toBe("2026-11-02");
    const mon = new Date(2026, 10, 2, 10);
    expect(starterStartDate(StarterStartOn.NextMonday, mon)).toBe("2026-11-09");
    const sun = new Date(2026, 10, 1, 10);
    expect(starterStartDate(StarterStartOn.NextMonday, sun)).toBe("2026-11-02");
  });
  it("labels the program day", () => {
    const s = "2026-11-02T00:00:00.000Z";
    const e = "2026-11-30T00:00:00.000Z";
    expect(programDayLabel(s, e, "2026-10-31")).toBe("Starts Mon, Nov 2");
    expect(programDayLabel(s, e, "2026-11-10")).toBe("Day 9 of 28");
    expect(programDayLabel(s, e, "2026-12-05")).toBe("Finished · 28 days");
    expect(programDayLabel(s, null, "2026-11-03")).toBe("Day 2");
  });
});

describe("exercises", () => {
  it("states the dose the template gave", () => {
    expect(exerciseDose(ex({ sets: 3, reps: 10 }))).toBe("3 x 10");
    expect(exerciseDose(ex({ sets: 2, seconds: 30 }))).toBe("2 x 30 sec");
    expect(exerciseDose(ex({ sets: 2 }))).toBe("2 sets");
    expect(exerciseDose(ex())).toBe("");
    expect(restLine(ex({ restSeconds: 45 }))).toBe("Rest 45 sec");
    expect(restLine(ex())).toBeNull();
  });
  it("treats seconds-only exercises as timed", () => {
    expect(isTimedExercise(ex({ seconds: 30 }))).toBe(true);
    expect(isTimedExercise(ex({ seconds: 30, reps: 5 }))).toBe(false);
  });
  it("writes notes only from typed numbers and skips timed moves", () => {
    const list = [ex({ name: "Squat", sets: 2, reps: 10 }), ex({ name: "Plank", seconds: 30 }), ex({ name: "Row", sets: 1, reps: 8 })];
    expect(
      numbersNotes(list, {
        0: [{ weight: "8", reps: "10" }, { weight: "", reps: "" }],
        1: [{ weight: "5", reps: "5" }],
        2: [{ weight: "", reps: "8" }],
      }),
    ).toBe("Squat: 8 kg x 10\nRow: 8 reps");
    expect(numbersNotes(list, {})).toBeNull();
  });
  it("accepts a comma decimal and rejects negatives", () => {
    expect(numbersNotes([ex({ sets: 1, reps: 5 })], { 0: [{ weight: "7,5", reps: "5" }] })).toBe("Squat: 7.5 kg x 5");
    expect(numbersNotes([ex({ sets: 1, reps: 5 })], { 0: [{ weight: "-3", reps: "" }] })).toBeNull();
  });
  it("parses whole minutes only", () => {
    expect(parseMinutes("25")).toBe(25);
    expect(parseMinutes("0")).toBeNull();
    expect(parseMinutes("2.5")).toBeNull();
    expect(parseMinutes("")).toBeNull();
  });
});

describe("progress line", () => {
  it("says so far in the first week and last 7 days after", () => {
    const base = { totalDays: 28, last7: { scheduled: 1, done: 1 } };
    expect(starterProgressLine({ progress: { day: 3, ...base } })).toBe("Week 1 of 4 · 1 of 1 session done so far");
    expect(starterProgressLine({ progress: { day: 10, totalDays: 28, last7: { scheduled: 3, done: 2 } } })).toBe(
      "Week 2 of 4 · 2 of 3 sessions done in the last 7 days",
    );
    expect(starterProgressLine({ progress: null })).toBeNull();
  });
});

describe("today model", () => {
  const p = program();
  const tasks = [
    task({ id: "a", scheduledFor: "2026-11-02T00:00:00.000Z", title: "Day 1" }),
    task({ id: "b", scheduledFor: "2026-11-04T00:00:00.000Z", title: "Day 2" }),
    task({ id: "c", scheduledFor: "2026-11-06T00:00:00.000Z", title: "Day 3" }),
  ];
  it("waits before the start date", () => {
    expect(starterTodayModel({ tasks, program: p, today: "2026-10-31" }).state).toBe("waiting");
  });
  it("shows today's pending session", () => {
    const m = starterTodayModel({ tasks, program: p, today: "2026-11-04" });
    expect(m.state).toBe("pending");
    expect(m.task?.id).toBe("b");
    expect(m.upcoming.map((t) => t.id)).toEqual(["c"]);
    expect(m.catchUp.map((r) => r.task.id)).toEqual(["a"]);
    expect(m.catchUp[0].state).toBe("open");
  });
  it("drops a catch-up session past its window", () => {
    const m = starterTodayModel({ tasks, program: p, today: "2026-11-05" });
    expect(m.catchUp.map((r) => r.task.id)).toEqual(["b"]);
  });
  it("names the next session on a rest day and after finishing", () => {
    const rest = starterTodayModel({ tasks, program: p, today: "2026-11-03" });
    expect(rest.state).toBe("rest");
    expect(rest.restNote).toBe("Rest day. Next session Wed, Nov 4.");
    const done = starterTodayModel({
      tasks: [{ ...tasks[1], status: StarterTaskStatus.Done }, tasks[2]],
      program: p,
      today: "2026-11-04",
    });
    expect(done.state).toBe("done");
    expect(done.restNote).toBe("Next session Fri, Nov 6.");
  });
  it("shows missed and late sessions plainly and hides skipped ones", () => {
    const m = starterTodayModel({
      tasks: [
        task({ id: "x", scheduledFor: "2026-11-02T00:00:00.000Z", status: StarterTaskStatus.Missed }),
        task({ id: "y", scheduledFor: "2026-11-03T00:00:00.000Z", status: StarterTaskStatus.Done, completedLate: true }),
        task({ id: "z", scheduledFor: "2026-11-01T00:00:00.000Z", status: StarterTaskStatus.Skipped }),
      ],
      program: p,
      today: "2026-11-04",
    });
    expect(m.catchUp.map((r) => [r.task.id, r.state])).toEqual([["y", "done_late"], ["x", "missed"]]);
  });
});

describe("error messages", () => {
  it("maps the machine code to a plain sentence", () => {
    expect(starterErrorMessage({ code: "STARTER_ALREADY_ACTIVE" }, "x")).toMatch(/already have a starter program/);
    expect(starterErrorMessage({ status: 429 }, "x")).toMatch(/too many/);
    expect(starterErrorMessage({ message: "Boom" }, "x")).toBe("Boom");
    expect(starterErrorMessage({}, "fallback")).toBe("fallback");
  });
});
