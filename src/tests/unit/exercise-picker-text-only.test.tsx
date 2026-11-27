import { describe, it, expect } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import ExercisePicker from "@/components/programs/ExercisePicker";

/**
 * The library lists exercises that have no illustration yet. Such a row is
 * still pickable, but it must not carry the "Demo" tag or a Preview button:
 * there is no art to label. Where the library has written steps and cues,
 * the row opens to show them, with or without art.
 */
const TEXT = {
  primaryMuscles: ["Buttocks (glutes)"],
  secondaryMuscles: ["Forearms and grip"],
  steps: ["Stand with the bar over the middle of your feet.", "Push the floor away and stand up."],
  cues: ["Keep the bar close to your body."],
};
const exercises = [
  { id: "squat", name: "Squat", category: "Squat", equipment: "none", variants: ["front"] },
  { id: "barbell-deadlift", name: "Barbell Deadlift", category: "Hinge", equipment: "barbell", variants: [] },
];
const withText = [
  { ...exercises[0], steps: ["Stand tall.", "Sit your hips back and down."], cues: ["Keep your heels on the floor."] },
  { ...exercises[1], ...TEXT },
];

describe("exercise picker: rows without an illustration", () => {
  it("tags and previews only the row that has art, and lets both be added", () => {
    render(<ExercisePicker exercises={exercises} onPick={() => {}} onClose={() => {}} />);
    const withArt = screen.getByText("Squat", { selector: "div" }).closest("li")!;
    const textOnly = screen.getByText("Barbell Deadlift").closest("li")!;

    expect(within(withArt).getByText("Illustrated demo")).toBeTruthy();
    expect(within(withArt).getByRole("button", { name: "Preview Squat" })).toBeTruthy();

    expect(within(textOnly).queryByText("Illustrated demo")).toBeNull();
    expect(within(textOnly).queryByRole("button", { name: /Preview/ })).toBeNull();
    expect(within(textOnly).getByRole("button", { name: "Add Barbell Deadlift" })).toBeTruthy();
    expect(within(textOnly).queryByRole("img")).toBeNull();
    // no text from the API (an older deploy): nothing to open on that row
    expect(within(textOnly).queryByRole("button", { name: /Details/ })).toBeNull();
    expect(within(withArt).getByText("Squat · no equipment")).toBeTruthy();
  });

  it("opens a text-only row to its muscles, steps and cues, with no picture", () => {
    render(<ExercisePicker exercises={withText} onPick={() => {}} onClose={() => {}} />);
    const row = screen.getByText("Barbell Deadlift").closest("li")!;
    expect(within(row).queryByTestId("exercise-guide")).toBeNull();

    const toggle = within(row).getByRole("button", { name: "Details for Barbell Deadlift" });
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(toggle);

    const guide = within(row).getByTestId("exercise-guide");
    expect(guide.textContent).toContain("Buttocks (glutes). Also: Forearms and grip");
    expect(within(guide).getAllByRole("listitem").map((li) => li.textContent)).toEqual([...TEXT.steps, ...TEXT.cues]);
    expect(within(guide).getByText("General guidance, not medical advice.")).toBeTruthy();
    expect(within(row).queryByRole("img")).toBeNull();
    expect(within(row).queryByText("Illustrated demo")).toBeNull();

    fireEvent.click(within(row).getByRole("button", { name: "Hide Barbell Deadlift" }));
    expect(within(row).queryByTestId("exercise-guide")).toBeNull();
  });

  it("shows the text beside the picture on a row that has both, one row open at a time", () => {
    render(<ExercisePicker exercises={withText} onPick={() => {}} onClose={() => {}} />);
    const art = screen.getByText("Squat", { selector: "div" }).closest("li")!;
    const text = screen.getByText("Barbell Deadlift").closest("li")!;
    fireEvent.click(within(text).getByRole("button", { name: "Details for Barbell Deadlift" }));
    fireEvent.click(within(art).getByRole("button", { name: "Preview Squat" }));

    expect(within(art).getByRole("img")).toBeTruthy();
    expect(within(art).getByTestId("exercise-guide").textContent).toContain("Sit your hips back and down.");
    expect(within(text).queryByTestId("exercise-guide")).toBeNull();
  });
});
