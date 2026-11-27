import { describe, expect, it } from "vitest";
import { normalizeLibrary } from "@/lib/exercises/library";
import { DEFAULT_REPS, DEFAULT_SETS, DEFAULT_TIMED_SECONDS, isTimedRow, newExercise } from "@/components/programs/builder/model";
import { exerciseRowsToPayload } from "@/components/programs/mapper";

const lib = normalizeLibrary({
  available: true,
  exercises: [
    { id: "plank", name: "Plank", category: "Core", equipment: "none", variants: [], timed: true },
    { id: "squat", name: "Squat", category: "Squat", equipment: "none", variants: [] },
    { id: "odd", name: "Odd", category: "Core", equipment: "none", variants: [], timed: "yes" },
  ],
});

describe("library timed marker", () => {
  it("reads timed only when it is exactly true, and copes with an older API", () => {
    const by = Object.fromEntries(lib.exercises.map((e) => [e.id, e]));
    expect(by.plank.timed).toBe(true);
    expect(by.squat.timed).toBeUndefined();
    expect(by.odd.timed).toBeUndefined();
  });
});

describe("newExercise", () => {
  it("starts a normal exercise at 3 x 10, unchanged", () => {
    expect(newExercise("Squat")).toMatchObject({ sets: DEFAULT_SETS, reps: DEFAULT_REPS, seconds: "" });
  });
  it("starts a timed exercise at 3 x 30 s with no reps", () => {
    expect(newExercise("Plank", { library_exercise_id: "plank" }, true)).toMatchObject({
      sets: "3",
      reps: "",
      seconds: DEFAULT_TIMED_SECONDS,
    });
    expect(DEFAULT_TIMED_SECONDS).toBe("30");
  });
  it("sends seconds and no reps for a timed pick", () => {
    expect(exerciseRowsToPayload([newExercise("Plank", { library_exercise_id: "plank" }, true)])).toEqual([
      expect.objectContaining({ name: "Plank", sets: 3, seconds: 30, library_exercise_id: "plank" }),
    ]);
    expect(exerciseRowsToPayload([newExercise("Plank", { library_exercise_id: "plank" }, true)])[0]).not.toHaveProperty("reps");
  });
});

describe("isTimedRow", () => {
  const ids = new Set(["plank"]);
  it("shows seconds for a row with seconds and no reps", () => {
    expect(isTimedRow({ reps: "", seconds: "30", library_exercise_id: "plank" }, ids)).toBe(true);
    expect(isTimedRow({ reps: "", seconds: "40" }, ids)).toBe(true);
  });
  it("keeps a timed library row in seconds when the seconds box is cleared", () => {
    expect(isTimedRow({ reps: "", seconds: "", library_exercise_id: "plank" }, ids)).toBe(true);
  });
  it("leaves existing programs alone: a plank saved with reps keeps showing reps", () => {
    expect(isTimedRow({ reps: "10", seconds: "", library_exercise_id: "plank" }, ids)).toBe(false);
    expect(isTimedRow({ reps: "10", seconds: "30", library_exercise_id: "plank" }, ids)).toBe(false);
  });
  it("leaves a non-timed exercise in reps", () => {
    expect(isTimedRow({ reps: "", seconds: "", library_exercise_id: "squat" }, ids)).toBe(false);
    expect(isTimedRow({ reps: "", seconds: "" }, ids)).toBe(false);
  });
});
