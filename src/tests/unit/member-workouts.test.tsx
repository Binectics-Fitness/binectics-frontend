import { Suspense } from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
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


// The member guidance switch and the library the guidance is read from.
const guidance = vi.hoisted(() => ({ flagOn: false, library: [] as unknown[] }));
vi.mock("@/hooks/useFeatureFlags", () => ({
  useFeatureFlag: (key: string) => key === "exercise_guidance_for_members" && guidance.flagOn,
}));
vi.mock("@/components/programs/exerciseLibraryCache", () => ({
  loadLibrary: () =>
    Promise.resolve(
      guidance.library.length
        ? { status: "ready", library: { available: true, exercises: guidance.library } }
        : { status: "failed" },
    ),
}));
const lib = (id: string, name: string, steps: string[], memberTextApproved = true) => ({
  id,
  name,
  category: "Core",
  equipment: "none",
  variants: [],
  primaryMuscles: ["Core"],
  steps,
  cues: ["Keep breathing."],
  memberTextApproved,
});

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
  beforeEach(() => {
    vi.restoreAllMocks();
    guidance.flagOn = false;
    guidance.library = [];
  });

  const GUIDED = {
    ...PLAN,
    exercises: [
      { name: "Plank", duration_minutes: 1, order: 1, media_id: "plank", library_exercise_id: "plank" },
      { name: "Barbell Deadlift", sets: 3, reps: 5, order: 2, media_id: "barbell-deadlift", library_exercise_id: "barbell-deadlift" },
      { name: "Farmer walk", order: 3, notes: "Heavy" },
    ],
  } as unknown as WorkoutPlan;
  // The deadlift is in the coach-review scope: withheld unless a test says it is approved.
  const renderGuided = async (deadliftApproved = false) => {
    guidance.library = [
      lib("plank", "Plank", ["Lie face down and place your forearms on the floor."]),
      lib("barbell-deadlift", "Barbell Deadlift", ["Stand with the bar over the middle of your feet."], deadliftApproved),
    ];
    vi.spyOn(progressService, "getMyWorkoutPlanById").mockReturnValue(ok(GUIDED) as never);
    const params = Promise.resolve({ planId: "p1" });
    await act(async () => {
      render(
        <Suspense fallback={null}>
          <MemberWorkoutPlanPage params={params} />
        </Suspense>,
      );
    });
    await screen.findByText("Barbell Deadlift");
  };

  it("switch off: a member reads the steps only for an exercise Starter already explains", async () => {
    await renderGuided();
    // Plank has no picture on web, and is no longer a bare name
    const toggle = await screen.findByRole("button", { name: "How to do Plank" });
    expect(screen.queryByRole("button", { name: "How to do Barbell Deadlift" })).toBeNull();
    expect(screen.queryByRole("button", { name: "How to do Farmer walk" })).toBeNull();
    expect(screen.queryByTestId("exercise-guide")).toBeNull();

    fireEvent.click(toggle);
    const guide = screen.getByTestId("exercise-guide");
    expect(within(guide).getByText("Lie face down and place your forearms on the floor.")).toBeTruthy();
    expect(within(guide).getByText("General guidance, not medical advice.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Hide how to do Plank" }));
    expect(screen.queryByTestId("exercise-guide")).toBeNull();
  });

  it("switch on: an exercise whose text is withheld from members still does not open", async () => {
    guidance.flagOn = true;
    await renderGuided(false);
    expect(await screen.findByRole("button", { name: "How to do Plank" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "How to do Barbell Deadlift" })).toBeNull();
    expect(screen.queryByText(/Stand with the bar/)).toBeNull();
  });

  it("switch on: approved text-only exercises open too, and a custom exercise never does", async () => {
    guidance.flagOn = true;
    await renderGuided(true);
    fireEvent.click(await screen.findByRole("button", { name: "How to do Barbell Deadlift" }));
    expect(screen.getByTestId("exercise-guide").textContent).toContain("Stand with the bar over the middle of your feet.");
    expect(screen.getByRole("button", { name: "How to do Plank" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "How to do Farmer walk" })).toBeNull();
    expect(screen.queryByTestId("exercise-art")).toBeNull();
  });

  it("no library (an older API or a failed load): the rows are exactly as before", async () => {
    guidance.flagOn = true;
    vi.spyOn(progressService, "getMyWorkoutPlanById").mockReturnValue(ok(GUIDED) as never);
    const params = Promise.resolve({ planId: "p1" });
    await act(async () => {
      render(
        <Suspense fallback={null}>
          <MemberWorkoutPlanPage params={params} />
        </Suspense>,
      );
    });
    await screen.findByText("Barbell Deadlift");
    expect(screen.queryByRole("button", { name: /How to do/ })).toBeNull();
  });

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
    expect(screen.getByText("Illustrated demo", { selector: "span" })).toBeTruthy(); // sr-only accessible name of the tag
    expect(screen.queryByText(/Guide:/)).toBeNull();
    expect(screen.getByText("Plank")).toBeTruthy();
    expect(screen.getByText("Heavy")).toBeTruthy();
    expect(screen.getByText("Illustrated demo", { selector: "p" })).toBeTruthy();
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
