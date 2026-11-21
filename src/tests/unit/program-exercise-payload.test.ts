import { beforeEach, describe, expect, it, vi } from "vitest";

const getLibrary = vi.fn();
vi.mock("@/lib/api/exerciseLibrary", () => ({
  exerciseLibraryService: { getLibrary: (...a: unknown[]) => getLibrary(...a) },
}));

import { exerciseRowsToPayload, type ExerciseFormRow } from "@/components/programs/mapper";
import { loadLibrary, resetExerciseLibraryCache } from "@/components/programs/exerciseLibraryCache";

const ex = (name: string, extra: Partial<ExerciseFormRow> = {}): ExerciseFormRow => ({
  name,
  sets: "",
  reps: "",
  seconds: "",
  rest_seconds: "",
  cues: "",
  ...extra,
});

describe("exerciseRowsToPayload", () => {
  it("sends library fields for a pick and none for a custom exercise, and drops unnamed rows", () => {
    expect(
      exerciseRowsToPayload([
        ex("Goblet Squat", {
          sets: "3",
          reps: "10",
          rest_seconds: "45",
          cues: "Chest tall\n\n Heels down ",
          library_exercise_id: "goblet-squat",
          library_variant: "front",
          media_id: "goblet-squat--front",
        }),
        ex("Farmer walk", { seconds: "40" }),
        ex("   "),
      ]),
    ).toEqual([
      {
        name: "Goblet Squat",
        sets: 3,
        reps: 10,
        rest_seconds: 45,
        cues: ["Chest tall", "Heels down"],
        library_exercise_id: "goblet-squat",
        library_variant: "front",
        media_id: "goblet-squat--front",
      },
      { name: "Farmer walk", seconds: 40 },
    ]);
  });

  it("truncates a long name to the 80 character program cap", () => {
    const [out] = exerciseRowsToPayload([ex("L".repeat(120), { library_exercise_id: "squat", media_id: "squat" })]);
    expect(out.name).toHaveLength(80);
  });

  it("caps at 30 exercises", () => {
    expect(exerciseRowsToPayload(Array.from({ length: 35 }, (_, i) => ex(`E${i}`)))).toHaveLength(30);
  });
});

describe("loadLibrary", () => {
  beforeEach(() => {
    getLibrary.mockReset();
    resetExerciseLibraryCache();
  });

  it("fetches once and shares the answer", async () => {
    getLibrary.mockResolvedValue({ success: true, data: { available: true, exercises: [] } });
    const [a, b] = await Promise.all([loadLibrary(), loadLibrary()]);
    expect(a).toEqual({ status: "ready", library: { available: true, exercises: [] } });
    expect(b).toBe(a);
    expect(getLibrary).toHaveBeenCalledTimes(1);
  });

  it("retries after a failure", async () => {
    getLibrary.mockRejectedValueOnce(new Error("down"));
    expect(await loadLibrary()).toEqual({ status: "failed" });
    await Promise.resolve();
    getLibrary.mockResolvedValue({ success: true, data: { available: true, exercises: [] } });
    expect((await loadLibrary()).status).toBe("ready");
    expect(getLibrary).toHaveBeenCalledTimes(2);
  });
});
