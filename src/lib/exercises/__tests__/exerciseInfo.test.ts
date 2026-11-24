import { describe, expect, it } from "vitest";
import { EXERCISE_GUIDANCE_DISCLAIMER, EXERCISE_INFO_IDS, getExerciseInfo } from "../exerciseInfo";
import { EXERCISE_ILLUSTRATION_LABELS } from "../illustrations";

/** binectics-mobile src/assets/exercises/index.ts on origin/main (23 Nov 2026): every id with guidance there. */
const MOBILE_IDS = [
  "arm-circles", "bird-dog", "calf-raise", "cat-cow", "chair-squat", "chest-press-machine", "dead-bug",
  "dumbbell-romanian-deadlift", "dumbbell-shoulder-press", "glute-bridge", "goblet-squat", "good-morning",
  "hip-circles", "incline-push-up", "knee-plank", "knee-push-up", "lat-pulldown", "leg-press", "march-in-place",
  "plank", "push-up", "reverse-lunge", "seated-row-machine", "side-plank", "single-leg-reach", "squat",
  "standing-knee-raise", "towel-row", "wall-push-up",
];

/** Mobile has art for these; web does not yet (new art needs the IP gates review first). */
const NO_WEB_ART_YET = ["bird-dog", "knee-plank", "plank", "side-plank", "wall-push-up"];

describe("exercise info (port of mobile data/exerciseInfo.ts)", () => {
  it("has an entry for every mobile exercise id, and no others", () => {
    for (const id of MOBILE_IDS) expect(getExerciseInfo(id), id).not.toBeNull();
    expect([...EXERCISE_INFO_IDS].sort()).toEqual([...MOBILE_IDS].sort());
  });

  it("has guidance for every web illustration", () => {
    for (const id of Object.keys(EXERCISE_ILLUSTRATION_LABELS)) expect(getExerciseInfo(id), id).not.toBeNull();
  });

  it("knows exactly which exercises still have no web art", () => {
    const missing = EXERCISE_INFO_IDS.filter((id) => !(id in EXERCISE_ILLUSTRATION_LABELS));
    expect(missing.sort()).toEqual(NO_WEB_ART_YET);
  });

  it("returns null for unknown or empty ids", () => {
    expect(getExerciseInfo("nope")).toBeNull();
    expect(getExerciseInfo("")).toBeNull();
    expect(getExerciseInfo(undefined)).toBeNull();
    expect(getExerciseInfo(null)).toBeNull();
  });

  it("keeps the disclaimer honest", () => {
    expect(EXERCISE_GUIDANCE_DISCLAIMER).toMatch(/not medical advice/);
    expect(EXERCISE_GUIDANCE_DISCLAIMER).toBe("General guidance for beginners, not medical advice. Illustrated demo.");
  });

  it.each(MOBILE_IDS.map((id) => [id]))("%s is complete and makes no review claims", (id) => {
    const x = getExerciseInfo(id)!;
    expect(x.mediaId).toBe(id);
    expect(x.summary.length).toBeGreaterThan(20);
    expect(x.primaryMuscles.length).toBeGreaterThan(0);
    expect(x.steps.length).toBeGreaterThanOrEqual(3);
    expect(x.formCues.length).toBeGreaterThan(0);
    expect(x.commonMistakes.length).toBeGreaterThan(0);
    expect(x.safetyNotes.length).toBeGreaterThan(0);
    expect(x.easierVariation.name && x.easierVariation.how).toBeTruthy();
    expect(x.tempo.length).toBeGreaterThan(5);
    expect(JSON.stringify(x).toLowerCase()).not.toMatch(/lorem|todo|placeholder|reviewed by|approved by|certified|clinically/);
  });

  it("links variations only to exercises that exist", () => {
    for (const id of EXERCISE_INFO_IDS) {
      const x = getExerciseInfo(id)!;
      for (const v of [x.easierVariation, x.withoutEquipment]) {
        if (v?.mediaId) expect(getExerciseInfo(v.mediaId), `${id} -> ${v.mediaId}`).not.toBeNull();
      }
    }
  });
});
