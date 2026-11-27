import { describe, expect, it } from "vitest";
import {
  filterLibrary,
  libraryErrorMessage,
  libraryRef,
  mediaKey,
  normalizeLibrary,
  truncateName,
  distinctValues,
  PROGRAM_EXERCISE_NAME_MAX,
  equipmentLabel,
  hasGuidance,
} from "@/lib/exercises/library";
import { guideLookup, libraryIdOf, memberMaySeeGuidance } from "@/lib/exercises/clientGuides";

const lib = normalizeLibrary({
  available: true,
  exercises: [
    { id: "goblet-squat", name: "Goblet Squat", category: "Squat", equipment: "dumbbells", variants: ["front", "hold"] },
    { id: "push-up", name: "Push Up", category: "Push", equipment: "none", variants: ["front"] },
    { id: "squat", name: "Squat", category: "Squat / knee-dominant", equipment: "none", variants: [] },
    { id: "", name: "no id" },
    null,
  ],
});

describe("normalizeLibrary", () => {
  it("keeps readable rows and drops the rest", () => {
    expect(lib.available).toBe(true);
    expect(lib.exercises.map((e) => e.id)).toEqual(["goblet-squat", "push-up", "squat"]);
  });
  it("treats available:false, an empty list or junk as unavailable", () => {
    expect(normalizeLibrary({ available: false, exercises: [] }).available).toBe(false);
    expect(normalizeLibrary({ available: true, exercises: [] }).available).toBe(false);
    expect(normalizeLibrary(undefined).available).toBe(false);
    expect(normalizeLibrary("x").exercises).toEqual([]);
  });
});

describe("normalizeLibrary: written guidance", () => {
  it("reads muscles, steps and cues when the API sends them, and copes when it does not", () => {
    const out = normalizeLibrary({
      available: true,
      exercises: [
        {
          id: "pull-up",
          name: "Pull-Up",
          category: "Pull",
          equipment: "pull-up bar",
          variants: [],
          primary_muscles: ["Sides of the back (lats)", 7, "  "],
          secondary_muscles: [],
          steps: ["Hang with straight arms.", " Pull your chest toward the bar. "],
          cues: "not a list",
        },
        { id: "squat", name: "Squat", category: "Squat", equipment: "none", variants: [] },
      ],
    }).exercises;
    expect(out[0]).toMatchObject({
      primaryMuscles: ["Sides of the back (lats)"],
      steps: ["Hang with straight arms.", "Pull your chest toward the bar."],
    });
    expect(out[0].secondaryMuscles).toBeUndefined();
    expect(out[0].cues).toBeUndefined();
    expect(hasGuidance(out[0])).toBe(true);
    expect(hasGuidance(out[1])).toBe(false);
    expect(hasGuidance(null)).toBe(false);
    expect(equipmentLabel("none")).toBe("no equipment");
    expect(equipmentLabel("barbell")).toBe("barbell");
  });
});

describe("guideLookup: what a member may read", () => {
  const exercises = normalizeLibrary({
    available: true,
    exercises: [
      { id: "plank", name: "Plank", category: "Core", equipment: "none", variants: [], steps: ["Hold."] },
      { id: "pull-up", name: "Pull-Up", category: "Pull", equipment: "pull-up bar", variants: [], steps: ["Hang."] },
      { id: "squat", name: "Squat", category: "Squat", equipment: "none", variants: [] },
    ],
  }).exercises;
  it("switch off: only the exercises the Starter program already explains", () => {
    const find = guideLookup(exercises, false);
    expect(find({ libraryExerciseId: "plank" })?.id).toBe("plank");
    expect(find({ mediaId: "plank--front" })?.id).toBe("plank");
    expect(find({ libraryExerciseId: "pull-up" })).toBeNull();
    expect(memberMaySeeGuidance("pull-up", false)).toBe(false);
  });
  it("switch on: every library exercise that has text; never a custom or text-less row", () => {
    const find = guideLookup(exercises, true);
    expect(find({ libraryExerciseId: "pull-up" })?.id).toBe("pull-up");
    expect(find({ libraryExerciseId: "squat" })).toBeNull();
    expect(find({ libraryExerciseId: "not-in-the-library" })).toBeNull();
    expect(find({})).toBeNull();
    expect(libraryIdOf({ mediaId: "goblet-squat--front" })).toBe("goblet-squat");
  });
});

describe("filterLibrary", () => {
  const all = lib.exercises;
  it("matches every word of the query against the name", () => {
    expect(filterLibrary(all, { query: "goblet sq", category: "", equipment: "" }).map((e) => e.id)).toEqual(["goblet-squat"]);
    expect(filterLibrary(all, { query: "SQUAT", category: "", equipment: "" })).toHaveLength(2);
  });
  it("narrows by category and equipment", () => {
    expect(filterLibrary(all, { query: "", category: "Push", equipment: "" })).toHaveLength(1);
    expect(filterLibrary(all, { query: "squat", category: "", equipment: "none" }).map((e) => e.id)).toEqual(["squat"]);
  });
  it("lists distinct sorted filter values", () => {
    expect(distinctValues(all, "equipment")).toEqual(["dumbbells", "none"]);
  });
});

describe("library fields", () => {
  it("sends id and media_id for a pick, plus the variant when chosen", () => {
    expect(libraryRef("goblet-squat")).toEqual({ library_exercise_id: "goblet-squat", media_id: "goblet-squat" });
    expect(libraryRef("goblet-squat", "front")).toEqual({
      library_exercise_id: "goblet-squat",
      library_variant: "front",
      media_id: "goblet-squat--front",
    });
    expect(mediaKey("squat")).toBe("squat");
  });
  it("truncates a snapshot name to the cap", () => {
    const long = "x".repeat(120);
    const t = truncateName(long, PROGRAM_EXERCISE_NAME_MAX);
    expect(t.length).toBe(PROGRAM_EXERCISE_NAME_MAX);
    expect(truncateName("  Squat ", 80)).toBe("Squat");
  });
});

describe("libraryErrorMessage", () => {
  it("explains the library codes in plain words", () => {
    expect(libraryErrorMessage({ code: "EXERCISE_LIBRARY_UNKNOWN_EXERCISE" })).toMatch(/no longer in the library/);
    expect(libraryErrorMessage({ code: "EXERCISE_LIBRARY_UNKNOWN_VARIANT" })).toMatch(/view/);
    expect(libraryErrorMessage({ code: "PROGRAM_TASK_TOO_MANY_EXERCISES" })).toMatch(/30/);
  });
  it("returns null for any other code (billing goes through PlanGate)", () => {
    expect(libraryErrorMessage({ code: "BILLING_FEATURE_DISABLED" })).toBeNull();
    expect(libraryErrorMessage({})).toBeNull();
  });
});
