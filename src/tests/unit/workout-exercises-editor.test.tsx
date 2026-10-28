import { beforeEach, describe, expect, it, vi } from "vitest";
import { useEffect, useState } from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

const getLibrary = vi.fn();
vi.mock("@/lib/api/exerciseLibrary", () => ({
  exerciseLibraryService: { getLibrary: (...a: unknown[]) => getLibrary(...a) },
}));
vi.mock("@/components/SearchableSelect", () => ({
  default: ({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; placeholder?: string }) => (
    <select aria-label={placeholder ?? "select"} value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}));

import WorkoutExercisesEditor, { resetExerciseLibraryCache } from "@/components/programs/WorkoutExercisesEditor";
import { exerciseRowsToPayload, type ExerciseFormRow } from "@/components/programs/mapper";

const LIB = {
  available: true,
  exercises: [
    { id: "goblet-squat", name: "Goblet Squat", category: "Squat", equipment: "dumbbells", variants: ["front"] },
    { id: "push-up", name: "Push Up", category: "Push", equipment: "none", variants: [] },
  ],
};

let latest: ExerciseFormRow[] = [];
function Harness({ initial = [] as ExerciseFormRow[] }) {
  const [rows, setRows] = useState(initial);
  useEffect(() => {
    latest = rows;
  });
  return <WorkoutExercisesEditor exercises={rows} onChange={setRows} />;
}

describe("WorkoutExercisesEditor", () => {
  beforeEach(() => {
    getLibrary.mockReset();
    resetExerciseLibraryCache();
    latest = [];
  });

  it("searches the library, adds a pick with its library fields and shows the Demo tag", async () => {
    getLibrary.mockResolvedValue({ success: true, data: { available: true, exercises: LIB.exercises } });
    render(<Harness />);
    fireEvent.click(await screen.findByRole("button", { name: "+ From library" }));
    expect(screen.getByText(/Illustrated demo art, not professionally reviewed/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Search exercises by name"), { target: { value: "goblet" } });
    expect(screen.queryByText("Push Up")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add Goblet Squat" }));

    expect(latest).toHaveLength(1);
    expect(latest[0]).toMatchObject({ name: "Goblet Squat", library_exercise_id: "goblet-squat", media_id: "goblet-squat" });
    expect(screen.getByText("Demo")).toBeTruthy();
    // Picker closes after a pick.
    expect(screen.queryByRole("dialog", { name: "Exercise library" })).toBeNull();
  });

  it("chooses a variant, which changes media_id and library_variant", async () => {
    getLibrary.mockResolvedValue({ success: true, data: { available: true, exercises: LIB.exercises } });
    render(
      <Harness initial={[{ name: "Goblet Squat", sets: "", reps: "", seconds: "", rest_seconds: "", cues: "", library_exercise_id: "goblet-squat", media_id: "goblet-squat" }]} />,
    );
    const view = await screen.findByRole("combobox");
    fireEvent.change(view, { target: { value: "front" } });
    expect(latest[0]).toMatchObject({ library_variant: "front", media_id: "goblet-squat--front" });
    fireEvent.change(view, { target: { value: "" } });
    expect(latest[0].library_variant).toBeUndefined();
    expect(latest[0].media_id).toBe("goblet-squat");
  });

  it("custom exercises send no library fields", async () => {
    getLibrary.mockResolvedValue({ success: true, data: { available: true, exercises: LIB.exercises } });
    render(<Harness />);
    fireEvent.click(await screen.findByRole("button", { name: "+ Custom exercise" }));
    fireEvent.change(screen.getByLabelText("Exercise 1 name"), { target: { value: "Farmer walk" } });
    const payload = exerciseRowsToPayload(latest);
    expect(payload).toEqual([{ name: "Farmer walk" }]);
  });

  it("hides the picker when the library is unavailable but custom entry still works", async () => {
    getLibrary.mockResolvedValue({ success: true, data: { available: false, exercises: [] } });
    render(<Harness />);
    await waitFor(() => expect(getLibrary).toHaveBeenCalled());
    expect(screen.queryByRole("button", { name: "+ From library" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "+ Custom exercise" }));
    expect(latest).toHaveLength(1);
  });

  it("says so when the library fails to load, and keeps custom entry", async () => {
    getLibrary.mockResolvedValue({ success: false, status: 500 });
    render(<Harness />);
    expect(await screen.findByText(/library didn.t load/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "+ From library" })).toBeNull();
    expect(screen.getByRole("button", { name: "+ Custom exercise" })).toBeTruthy();
  });

  it("reorders and removes rows", async () => {
    getLibrary.mockResolvedValue({ success: true, data: { available: false, exercises: [] } });
    const a = { name: "A", sets: "", reps: "", seconds: "", rest_seconds: "", cues: "" };
    render(<Harness initial={[a, { ...a, name: "B" }]} />);
    const second = screen.getByLabelText("Exercise 2 name").closest("div")!.parentElement!;
    fireEvent.click(within(second).getByRole("button", { name: "Move exercise up" }));
    expect(latest.map((r) => r.name)).toEqual(["B", "A"]);
    fireEvent.click(screen.getAllByRole("button", { name: "Remove exercise" })[0]);
    expect(latest.map((r) => r.name)).toEqual(["A"]);
  });
});

describe("phone layout classes", () => {
  beforeEach(() => {
    getLibrary.mockReset();
    resetExerciseLibraryCache();
  });

  it("lets the name take its own line and keeps 44px targets on phones", async () => {
    getLibrary.mockResolvedValue({ success: true, data: { available: true, exercises: LIB.exercises } });
    render(<Harness initial={[{ name: "Goblet Squat", sets: "", reps: "", seconds: "", rest_seconds: "", cues: "", library_exercise_id: "goblet-squat", media_id: "goblet-squat" }]} />);
    const name = screen.getByLabelText("Exercise 1 name");
    expect(name.className).toMatch(/basis-full/);
    expect(name.className).toMatch(/min-w-0/);
    expect(name.className).toMatch(/h-\[44px\]/);
    expect(name.parentElement!.className).toMatch(/flex-wrap/);
    expect(screen.getByRole("button", { name: "Remove exercise" }).className).toMatch(/w-\[44px\] h-\[44px\]/);
    fireEvent.click(await screen.findByRole("button", { name: "+ From library" }));
    const add = screen.getByRole("button", { name: "Add Goblet Squat" });
    expect(add.className).toMatch(/min-h-\[44px\]/);
    const row = add.parentElement!.parentElement!;
    expect(row.className).toMatch(/flex-wrap/);
    expect(row.querySelector(".break-words")?.className).not.toMatch(/truncate/);
  });
});
