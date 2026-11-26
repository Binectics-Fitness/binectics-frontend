import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import ExercisePicker from "@/components/programs/ExercisePicker";

/**
 * The library lists exercises that have no illustration yet. Such a row is
 * still pickable, but it must not carry the "Demo" tag or a Preview button:
 * there is no art to label.
 */
const exercises = [
  { id: "squat", name: "Squat", category: "Squat", equipment: "none", variants: ["front"] },
  { id: "barbell-deadlift", name: "Barbell Deadlift", category: "Hinge", equipment: "barbell", variants: [] },
];

describe("exercise picker: rows without an illustration", () => {
  it("tags and previews only the row that has art, and lets both be added", () => {
    render(<ExercisePicker exercises={exercises} onPick={() => {}} onClose={() => {}} />);
    const withArt = screen.getByText("Squat", { selector: "div" }).closest("li")!;
    const textOnly = screen.getByText("Barbell Deadlift").closest("li")!;

    expect(within(withArt).getByText("Illustrated demo")).toBeTruthy();
    expect(within(withArt).getByRole("button", { name: "Preview" })).toBeTruthy();

    expect(within(textOnly).queryByText("Illustrated demo")).toBeNull();
    expect(within(textOnly).queryByRole("button", { name: "Preview" })).toBeNull();
    expect(within(textOnly).getByRole("button", { name: "Add Barbell Deadlift" })).toBeTruthy();
    expect(within(textOnly).queryByRole("img")).toBeNull();
  });
});
