import { describe, expect, it } from "vitest";
import {
  displaySummary,
  exerciseBackLink,
  exerciseDetailHref,
  parseRowIndex,
  resolveExercisePlanContext,
} from "../exerciseDetail";
import { StarterTaskStatus, type StarterTask } from "@/lib/starter/types";

const task: StarterTask = {
  id: "occ1",
  title: "Session 2",
  scheduledFor: "2026-11-23T00:00:00.000Z",
  status: StarterTaskStatus.Pending,
  completedLate: false,
  exercises: [
    { name: "March in place", seconds: 60, cues: [], mediaId: "march-in-place" },
    { name: "Squat", sets: 3, reps: 10, restSeconds: 45, cues: ["Sit back"], mediaId: "squat" },
  ],
};

describe("exerciseDetailHref", () => {
  it("links the bare page", () => {
    expect(exerciseDetailHref("squat")).toBe("/dashboard/member/exercises/squat");
  });
  it("carries the session and row", () => {
    expect(exerciseDetailHref("squat", { session: "occ1", index: 1 })).toBe(
      "/dashboard/member/exercises/squat?session=occ1&i=1",
    );
  });
  it("marks the guided session's form-tips link", () => {
    expect(exerciseDetailHref("squat", { session: "occ1", index: 0, back: "guided" })).toBe(
      "/dashboard/member/exercises/squat?session=occ1&i=0&back=guided",
    );
  });
  it("drops a row with no session", () => {
    expect(exerciseDetailHref("squat", { index: 2 })).toBe("/dashboard/member/exercises/squat");
  });
});

describe("exerciseBackLink", () => {
  it("goes back to the session, the guided run or the program", () => {
    expect(exerciseBackLink("occ1", null)).toEqual({ href: "/dashboard/member/starter/session/occ1", label: "Back to session" });
    expect(exerciseBackLink("occ1", "guided")).toEqual({
      href: "/dashboard/member/starter/session/occ1/guided",
      label: "Back to guided session",
    });
    expect(exerciseBackLink(null, "guided")).toEqual({ href: "/dashboard/member/starter", label: "Back to your program" });
  });
});

describe("parseRowIndex", () => {
  it("reads whole numbers only", () => {
    expect(parseRowIndex("2")).toBe(2);
    expect(parseRowIndex("-1")).toBeNull();
    expect(parseRowIndex("x")).toBeNull();
    expect(parseRowIndex(null)).toBeNull();
  });
});

describe("resolveExercisePlanContext", () => {
  it("returns the row's prescription and position", () => {
    const c = resolveExercisePlanContext([task], "squat", "occ1", 1)!;
    expect(c.workoutTitle).toBe("Session 2");
    expect(c.position).toEqual({ index: 2, total: 2 });
    expect(c.exercise?.reps).toBe(10);
  });
  it("finds the exercise when the row is stale", () => {
    expect(resolveExercisePlanContext([task], "squat", "occ1", 0)?.position).toEqual({ index: 2, total: 2 });
  });
  it("keeps only the workout when the exercise is not in it", () => {
    const c = resolveExercisePlanContext([task], "plank", "occ1", 0)!;
    expect(c.exercise).toBeNull();
    expect(c.position).toBeNull();
  });
  it("is null without a known session", () => {
    expect(resolveExercisePlanContext([task], "squat", "other", 1)).toBeNull();
    expect(resolveExercisePlanContext(undefined, "squat", "occ1", 1)).toBeNull();
    expect(resolveExercisePlanContext([task], "squat", null, 1)).toBeNull();
  });
});

describe("displaySummary", () => {
  const s = "Hold a straight body line. It trains the core. The picture is a still of the hold.";
  it("keeps the picture sentence when web has the art", () => {
    expect(displaySummary(s, true)).toBe(s);
  });
  it("drops it when web has no art", () => {
    expect(displaySummary(s, false)).toBe("Hold a straight body line. It trains the core.");
    expect(displaySummary("A push-up at a wall. The picture shows the setup position, not the movement.", false)).toBe(
      "A push-up at a wall.",
    );
  });
});
