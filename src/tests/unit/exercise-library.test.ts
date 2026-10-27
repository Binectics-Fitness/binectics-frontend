import { describe, expect, it } from "vitest";
import {
  filterLibrary,
  libraryErrorMessage,
  libraryRef,
  mediaKey,
  normalizeLibrary,
  artKey,
  truncateName,
  distinctValues,
  PROGRAM_EXERCISE_NAME_MAX,
} from "@/lib/exercises/library";

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
  it("falls back to the base art for a variant with none bundled", () => {
    const has = (id: string) => id === "goblet-squat";
    expect(artKey("goblet-squat--front", has)).toBe("goblet-squat");
    expect(artKey("goblet-squat", has)).toBe("goblet-squat");
    expect(artKey("plank", has)).toBeUndefined();
    expect(artKey(undefined, has)).toBeUndefined();
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
