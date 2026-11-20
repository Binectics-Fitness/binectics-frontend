import { describe, expect, it } from "vitest";
import type { ProgramTemplateVersion } from "@/lib/api/programs";
import { BUILDER_COPY } from "@/components/programs/builder/copy";
import {
  KIND_DEFAULTS,
  cadenceText,
  count,
  createPayload,
  fromVersion,
  newExercise,
  newProgram,
  newTask,
  setFromWeek,
  setSplit,
  setToWeek,
  snapToWeeks,
  startBlocker,
  startSummary,
  summaryLine,
  taskIssue,
  taskTone,
  toPayload,
  weekPlan,
  type BuilderProgram,
  type BuilderTask,
} from "@/components/programs/builder/model";

/** The walkthrough's "Strength base": 4 weeks, a workout 3×, a daily habit, a weekly weigh-in and check-in. */
function strengthBase(): BuilderProgram {
  const p = newProgram("Strength base", 4);
  const forms = [{ id: "f1", title: "Session readiness" }];
  const w = newTask("workout", { phase: 0, existing: [], forms });
  w.exercises = ["Goblet Squat", "Push Up", "Seated Row Machine"].map((n) => newExercise(n));
  const h = { ...newTask("habit", { phase: 0, existing: [w], forms }), title: "Walk 8,000 steps" };
  const m = { ...newTask("measure", { phase: 0, existing: [w, h], forms }), target: "78" };
  const c = newTask("checkin", { phase: 0, existing: [w, h, m], forms });
  p.tasks = [w, h, m, c];
  return p;
}

describe("new program (name and length first)", () => {
  it("creates one phase that runs for the whole program, with the late window at 1 day", () => {
    expect(createPayload("  Strength base ", 4)).toEqual({
      name: "Strength base",
      duration_days: 28,
      catch_up_days: 1,
      phases: [{ name: "Phase 1", order: 0, duration_days: 28, blocks: [] }],
      goals: [],
    });
  });
});

describe("per-type defaults (P1-4)", () => {
  it("gives each type its cadence and prefills what is known", () => {
    expect(KIND_DEFAULTS.workout).toEqual({ cadence: "n_per_week", n: 3 });
    expect(KIND_DEFAULTS.habit.cadence).toBe("daily");
    expect(KIND_DEFAULTS.checkin.cadence).toBe("weekly");
    expect(KIND_DEFAULTS.measure.cadence).toBe("weekly");
    expect(KIND_DEFAULTS.meal.cadence).toBe("daily");
    expect(KIND_DEFAULTS.note.cadence).toBe("once");
    const a = newTask("workout", { phase: 0, existing: [] });
    const b = newTask("workout", { phase: 0, existing: [a] });
    expect([a.title, b.title]).toEqual(["Workout A", "Workout B"]);
    expect(newTask("measure", { phase: 0, existing: [] })).toMatchObject({ title: "Weigh in", metric: "weight_kg" });
    expect(newTask("checkin", { phase: 0, existing: [], forms: [{ id: "f1", title: "Only form" }] })).toMatchObject({ form_id: "f1", contentTitle: "Only form" });
    expect(newTask("checkin", { phase: 0, existing: [], forms: [{ id: "f1", title: "A" }, { id: "f2", title: "B" }] }).form_id).toBe("");
    expect(newExercise("Push Up")).toMatchObject({ sets: "3", reps: "10" });
  });
});

describe("counts, summary and the client's week", () => {
  it("matches the walkthrough's numbers", () => {
    const p = strengthBase();
    expect(p.tasks.map((t) => count(p, t))).toEqual([12, 28, 4, 4]);
    expect(summaryLine(p)).toBe("4 weeks · 12 workouts · 28 habit days · 4 measurements · 4 check-ins");
    expect(startSummary(p)).toBe("4 weeks: 12 workouts, 28 habits, 4 measurements, 4 check-in forms.");
    // 3 times a week = days 1, 3, 5 (API N_PER_WEEK_DAYS)
    const days = weekPlan(p, 1).map((d) => d.map((t) => t.title || t.contentTitle));
    expect(days[0]).toEqual(["Workout A", "Walk 8,000 steps", "Weigh in", "Session readiness"]);
    expect(days[2]).toEqual(["Workout A", "Walk 8,000 steps"]);
    expect(days[1]).toEqual(["Walk 8,000 steps"]);
  });

  it("says the cadence, and the weeks only when they are not the whole program", () => {
    const p = strengthBase();
    const [w, h] = p.tasks;
    expect(cadenceText(p, w)).toBe("3 times a week");
    expect(cadenceText(p, { ...h, start: 7, days: 14 })).toBe("Daily · weeks 2–3");
    expect(cadenceText(p, { ...h, cadence: "once", start: 0 })).toBe("Once · week 1");
    expect(cadenceText(p, { ...h, cadence: "n_per_week", n: 1 })).toBe("Once a week");
    expect(cadenceText(p, { ...h, start: 9, days: 5 })).toBe("Daily · starts day 10 (set before)");
  });
});

describe("weeks from/to (P1-3)", () => {
  it("maps weeks to the API's day offsets and back", () => {
    const p = strengthBase();
    const h = p.tasks[1];
    const later = { ...h, ...setFromWeek(p, h, 2) };
    expect(later).toMatchObject({ start: 7, days: null });
    const shorter = { ...later, ...setToWeek(p, later, 3) };
    expect(shorter).toMatchObject({ start: 7, days: 14 });
    expect({ ...shorter, ...setToWeek(p, shorter, 4) }.days).toBeNull();
    const block = toPayload({ ...p, tasks: [shorter] }).phases![0].blocks[0];
    expect(block).toMatchObject({ start_offset_days: 7, duration_days: 14 });
  });

  it("keeps day offsets set on the old builder until the coach changes them", () => {
    const p = strengthBase();
    const h = { ...p.tasks[1], start: 9, days: 5 };
    expect(toPayload({ ...p, tasks: [h] }).phases![0].blocks[0]).toMatchObject({ start_offset_days: 9, duration_days: 5 });
    expect({ ...h, ...snapToWeeks(p, h) }).toMatchObject({ start: 7, days: 7 });
  });
});

describe("inline validation (P1-5)", () => {
  it("says what each unfinished task needs, and why Start a client can't run", () => {
    const p = strengthBase();
    const untitled = newTask("habit", { phase: 0, existing: [] });
    const unlinked = newTask("checkin", { phase: 0, existing: [] });
    const empty = newTask("workout", { phase: 0, existing: [] });
    expect(taskIssue(untitled)?.row).toBe(BUILDER_COPY.issue.title);
    expect(taskIssue(untitled)?.field).toBe(BUILDER_COPY.inspector.titleError);
    expect(taskIssue(unlinked)?.row).toBe(BUILDER_COPY.issue.form);
    expect(taskIssue(empty)?.row).toBe(BUILDER_COPY.issue.workout);
    expect(taskIssue({ ...untitled, title: "Water", auto: "water", autoN: "31" })?.field).toBe("Set the glasses, 1 to 30.");
    expect(taskIssue({ ...untitled, title: "Steps", auto: "health", hm: "steps", autoN: "50" })?.row).toBe("Set the steps, 100 to 60,000");
    expect(startBlocker(p)).toBeNull();
    expect(startBlocker({ ...p, tasks: [] })).toBe("Add a task to start a client");
    expect(startBlocker({ ...p, tasks: [...p.tasks, untitled] })).toBe("Fix 1 task to start a client");
    expect(startBlocker({ ...p, tasks: [...p.tasks, untitled, unlinked] })).toBe("Fix 2 tasks to start a client");
    expect(startBlocker({ ...p, name: " " })).toBe("Name the program to start a client");
  });
});

describe("ticks itself", () => {
  const habit = (o: Partial<BuilderTask>): BuilderTask => ({ ...newTask("habit", { phase: 0, existing: [] }), title: "x", ...o });
  const rule = (t: BuilderTask) => toPayload({ ...newProgram("P", 4), tasks: [t] }).phases![0].blocks[0].auto_rule;

  it("sends the own-log and health-app rules the API evaluates (sleep in minutes)", () => {
    expect(rule(habit({ auto: "water", autoN: "8" }))).toEqual({ metric: "water_glasses", comparator: "gte", threshold: 8, window: "scheduled_day" });
    expect(rule(habit({ auto: "fast", autoN: "16" }))).toEqual({ metric: "fasting_hours", comparator: "gte", threshold: 16, window: "scheduled_day" });
    expect(rule(habit({ auto: "health", hm: "steps", autoN: "8000" }))).toEqual({ metric: "steps", comparator: "gte", threshold: 8000 });
    expect(rule(habit({ auto: "health", hm: "exmin", autoN: "30" }))).toMatchObject({ metric: "exercise_minutes", threshold: 30 });
    expect(rule(habit({ auto: "health", hm: "session", autoN: "20" }))).toMatchObject({ metric: "exercise_session", threshold: 20 });
    expect(rule(habit({ auto: "health", hm: "sleep", autoN: "7" }))).toMatchObject({ metric: "sleep_minutes", threshold: 420 });
    expect(rule(habit({ auto: "water", autoN: "" }))).toBeUndefined();
  });

  it("takes its source's colour", () => {
    expect(taskTone(habit({}))).toBe("habit");
    expect(taskTone(habit({ auto: "water" }))).toBe("water");
    expect(taskTone(habit({ auto: "fast" }))).toBe("fast");
    expect(taskTone(habit({ auto: "health" }))).toBe("move");
    expect(taskTone(newTask("workout", { phase: 0, existing: [] }))).toBe("move");
    expect(taskTone(newTask("checkin", { phase: 0, existing: [] }))).toBe("checkin");
    expect(taskTone(newTask("measure", { phase: 0, existing: [] }))).toBe("measure");
    expect(taskTone(newTask("note", { phase: 0, existing: [] }))).toBe("note");
    expect(taskTone(newTask("meal", { phase: 0, existing: [] }))).toBe("meal");
  });
});

describe("measurement target (api #361)", () => {
  it("sends the target on the measurement task and leaves the goal to the API", () => {
    const out = toPayload(strengthBase());
    expect(out.phases![0].blocks[2]).toMatchObject({ type: "measurement", metric: "weight_kg", target: 78 });
    expect(out.phases![0].blocks.filter((b) => "target" in b)).toHaveLength(1);
    expect(out.goals).toEqual([]);
  });
});

describe("round trip (version → page → payload)", () => {
  const version: ProgramTemplateVersion = {
    _id: "v",
    template_id: "t",
    version_no: 2,
    published_at: null,
    name: "12-week gut reset",
    category: "Gut health",
    goal_statement: "Calm the gut first.",
    intensity: "gentle",
    indications: "IBS",
    cautions: "Not in pregnancy.",
    catch_up_days: 2,
    phases: [
      { name: "Remove", order: 0, duration_days: 28, blocks: [
        { type: "habit", order: 0, cadence: "daily", title: "Water", auto_rule: { metric: "water_glasses", comparator: "gte", threshold: 8, window: "scheduled_day" } },
        { type: "habit", order: 1, cadence: "daily", title: "Steps", auto_rule: { metric: "steps", comparator: "gte", threshold: 8000, sources: ["com.sec.android.app.shealth"] } },
        { type: "habit", order: 2, cadence: "daily", title: "HR", auto_rule: { metric: "resting_hr_bpm", comparator: "lte", threshold: 70 } },
      ] },
      { name: "Maintain", order: 1, duration_days: 14, blocks: [
        { type: "measurement", order: 0, cadence: "weekly", title: "Weigh in", metric: "weight_kg", target: 70 },
      ] },
    ],
    goals: [
      { _id: "g1", label: "Lose to 70", metric: "weight_kg", direction: "reduce", target: 70, target_offset_days: 40 },
      { _id: "g2", label: "Waist 80 cm", metric: "waist_cm", direction: "reach", target: 80, from_block: true },
    ],
  };

  it("loads phases, rules and goals, and saves them back without loss", () => {
    const p = fromVersion(version);
    expect(p.split).toBe(true);
    expect(p.tasks.map((t) => t.auto)).toEqual(["water", "health", "", ""]);
    expect(p.tasks[2].kept_auto_rule).toMatchObject({ metric: "resting_hr_bpm" });
    expect(p.tasks[3].target).toBe("70");
    const out = toPayload(p);
    expect(out).toMatchObject({ name: "12-week gut reset", category: "Gut health", goal_statement: "Calm the gut first.", intensity: "gentle", indications: "IBS", cautions: "Not in pregnancy.", catch_up_days: 2, duration_days: 42 });
    expect(out.phases!.map((ph) => [ph.name, ph.duration_days, ph.blocks.length])).toEqual([["Remove", 28, 3], ["Maintain", 14, 1]]);
    expect(out.phases![0].blocks[1].auto_rule).toEqual({ metric: "steps", comparator: "gte", threshold: 8000, sources: ["com.sec.android.app.shealth"] });
    expect(out.phases![0].blocks[2].auto_rule).toEqual({ metric: "resting_hr_bpm", comparator: "lte", threshold: 70 });
    expect(out.phases![1].blocks[0].target).toBe(70);
    // Goals go back as they came (without ids); the API syncs from_block ones.
    expect(out.goals).toEqual([
      { label: "Lose to 70", metric: "weight_kg", direction: "reduce", target: 70, target_offset_days: 40 },
      { label: "Waist 80 cm", metric: "waist_cm", direction: "reach", target: 80, from_block: true },
    ]);
  });

  it("folds phases into one block without moving any task in time", () => {
    const p = setSplit(fromVersion(version), false);
    expect(p.phases).toEqual([{ name: "Remove", days: 42 }]);
    const weigh = p.tasks[3];
    expect(weigh).toMatchObject({ phase: 0, start: 28, days: null });
    const water = p.tasks[0];
    expect(water).toMatchObject({ start: 0, days: 28 });
  });

  it("gives a lone phase saved without a length the program's length", () => {
    const p = fromVersion({ ...version, duration_days: 56, phases: [{ name: "Phase 1", order: 0, blocks: [] }], goals: [] });
    expect(p.phases[0].days).toBe(56);
  });
});
