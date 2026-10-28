import { Suspense } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import MemberWorkoutPlanPage from "@/app/dashboard/member/workouts/[planId]/page";
import MemberWorkoutsPage from "@/app/dashboard/member/workouts/page";
import { progressService, type WorkoutPlan } from "@/lib/api/progress";
import { myProgramsService, inlineWorkoutSessions } from "@/lib/api/myPrograms";
import { resolveClientArt } from "@/lib/exercises/clientArt";
import { hasExerciseIllustration } from "@/components/ExerciseIllustration";
import { planExerciseRows } from "@/lib/workouts/clientRows";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const ok = <T,>(data: T) => Promise.resolve({ success: true as const, data });

const PLAN = {
  _id: "p1",
  created_by: { _id: "u", first_name: "Ada", last_name: "Okafor" },
  title: "Strength block",
  exercises: [
    { name: "Goblet squat", sets: 3, reps: 10, order: 2, media_id: "goblet-squat--front", library_exercise_id: "goblet-squat", library_variant: "front" },
    { name: "Plank", duration_minutes: 1, order: 1, media_id: "plank", library_exercise_id: "plank" },
    { name: "Farmer walk", order: 3, notes: "Heavy" },
  ],
} as unknown as WorkoutPlan;

describe("resolveClientArt", () => {
  it("uses bundled ids, falls back from a variant to the default art, and is null otherwise", () => {
    expect(resolveClientArt({ mediaId: "goblet-squat" })).toBe("goblet-squat");
    expect(resolveClientArt({ mediaId: "goblet-squat--front", libraryExerciseId: "goblet-squat", libraryVariant: "front" })).toBe("goblet-squat");
    for (const id of ["plank", "knee-plank", "bird-dog", "not-in-the-library"]) {
      expect(resolveClientArt({ mediaId: id, libraryExerciseId: id })).toBeNull();
    }
    expect(resolveClientArt({})).toBeNull();
    expect(hasExerciseIllustration("constructor")).toBe(false);
    expect(resolveClientArt({ mediaId: "__proto__" })).toBeNull();
  });
});

describe("planExerciseRows", () => {
  it("orders by the provider's order and carries the library fields", () => {
    const rows = planExerciseRows(PLAN.exercises);
    expect(rows.map((r) => r.name)).toEqual(["Plank", "Goblet squat", "Farmer walk"]);
    expect(rows[1]).toMatchObject({ dose: "3 x 10", mediaId: "goblet-squat--front", libraryExerciseId: "goblet-squat", libraryVariant: "front" });
  });
});

describe("inlineWorkoutSessions", () => {
  const t = (over: Record<string, unknown> = {}) => ({
    _id: "o1",
    component_type: "workout_plan",
    scheduled_for: "2026-10-29",
    status: "pending",
    title: "Leg day",
    exercises: [{ name: "Goblet squat", sets: 3, reps: 10, media_id: "goblet-squat", library_exercise_id: "goblet-squat" }],
    ...over,
  });
  it("keeps provider workouts with inline exercises and drops the rest", () => {
    const out = inlineWorkoutSessions("Spring", [
      t(),
      t({ _id: "o2", workout_plan_id: "wp" }),
      t({ _id: "o3", source: "starter" }),
      t({ _id: "o4", exercises: [] }),
      t({ _id: "o5", component_type: "meal_plan" }),
      "junk",
    ]);
    expect(out.map((s) => s.id)).toEqual(["o1"]);
    expect(out[0].exercises[0]).toMatchObject({ mediaId: "goblet-squat", libraryExerciseId: "goblet-squat" });
    expect(inlineWorkoutSessions("x", null)).toEqual([]);
  });
});

describe("member workout plan page", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("shows art with a neutral Demo tag only where art exists; other rows stay text", async () => {
    vi.spyOn(progressService, "getMyWorkoutPlanById").mockReturnValue(ok(PLAN) as never);
    const params = Promise.resolve({ planId: "p1" });
    await act(async () => {
      render(
        <Suspense fallback={null}>
          <MemberWorkoutPlanPage params={params} />
        </Suspense>,
      );
    });
    expect(await screen.findByText("Goblet squat")).toBeTruthy();
    expect(screen.getAllByTestId("exercise-art")).toHaveLength(1);
    expect(screen.getByText("Illustrated demo")).toBeTruthy(); // sr-only accessible name of the tag
    expect(screen.queryByText(/Guide:/)).toBeNull();
    expect(screen.getByText("Plank")).toBeTruthy();
    expect(screen.getByText("Heavy")).toBeTruthy();
    expect(screen.getByText("Illustrated demo art, not professionally reviewed.")).toBeTruthy();
    const img = document.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/exercises/goblet-squat.svg");
  });

  it("an old plan with no media fields renders exactly as text", async () => {
    vi.spyOn(progressService, "getMyWorkoutPlanById").mockReturnValue(
      ok({ ...PLAN, exercises: [{ name: "Row", sets: 3, reps: 8, order: 1 }] }) as never,
    );
    const params = Promise.resolve({ planId: "p1" });
    await act(async () => {
      render(
        <Suspense fallback={null}>
          <MemberWorkoutPlanPage params={params} />
        </Suspense>,
      );
    });
    expect(await screen.findByText("Row")).toBeTruthy();
    expect(screen.queryByTestId("exercise-art")).toBeNull();
    expect(document.querySelector("img")).toBeNull();
    expect(screen.queryByText(/Illustrated demo art/)).toBeNull();
  });
});

describe("member workouts list", () => {
  it("lists plans and program sessions with inline exercises", async () => {
    vi.spyOn(progressService, "getMyWorkoutPlans").mockReturnValue(ok([PLAN]) as never);
    vi.spyOn(myProgramsService, "listMine").mockReturnValue(
      ok([{ _id: "i1", name: "Spring block", status: "active" }]) as never,
    );
    vi.spyOn(myProgramsService, "inlineWorkouts").mockReturnValue(
      ok(
        inlineWorkoutSessions("Spring block", [
          {
            _id: "o1",
            component_type: "workout_plan",
            scheduled_for: "2026-10-29",
            status: "pending",
            title: "Leg day",
            exercises: [{ name: "Lunge", media_id: "reverse-lunge", library_exercise_id: "reverse-lunge" }],
          },
        ]),
      ) as never,
    );
    await act(async () => {
      render(<MemberWorkoutsPage />);
    });
    expect(await screen.findByText("Strength block")).toBeTruthy();
    expect(screen.getByText("Leg day")).toBeTruthy();
    expect(screen.getByText("Lunge")).toBeTruthy();
    expect(screen.getAllByTestId("exercise-art")).toHaveLength(1);
  });
});
