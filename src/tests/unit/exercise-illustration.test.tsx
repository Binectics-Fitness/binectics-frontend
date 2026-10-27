import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import ExerciseIllustration, { hasExerciseIllustration } from "@/components/ExerciseIllustration";
import { EXERCISE_ILLUSTRATION_LABELS } from "@/lib/exercises/illustrations";
import fs from "node:fs";
import path from "node:path";

const WITHHELD = ["towel-row--setup", "plank--front", "knee-plank--front", "glute-bridge--top", "bird-dog--top"];

describe("ExerciseIllustration", () => {
  it("renders the loop with a still for reduced motion, and alt text", () => {
    const { container } = render(<ExerciseIllustration mediaId="chair-squat" />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("/exercises/chair-squat.svg");
    expect(container.querySelector("source")?.getAttribute("srcset")).toBe("/exercises/chair-squat-end.svg");
    expect(container.querySelector("img")?.getAttribute("alt")).toMatch(/squat/i);
  });

  it("renders nothing for an id without art", () => {
    const { container } = render(<ExerciseIllustration mediaId="plank" />);
    expect(container.innerHTML).toBe("");
    expect(hasExerciseIllustration(null)).toBe(false);
  });

  it("ships every listed file and no withheld entry", () => {
    for (const id of Object.keys(EXERCISE_ILLUSTRATION_LABELS)) {
      expect(fs.existsSync(path.join(process.cwd(), "public/exercises", `${id}.svg`))).toBe(true);
      expect(fs.existsSync(path.join(process.cwd(), "public/exercises", `${id}-end.svg`))).toBe(true);
    }
    for (const id of WITHHELD) expect(id in EXERCISE_ILLUSTRATION_LABELS).toBe(false);
    const files = fs.readdirSync(path.join(process.cwd(), "public/exercises"));
    for (const id of WITHHELD) expect(files.some((f) => f.startsWith(`${id}.`) || f.startsWith(`${id}-`))).toBe(false);
  });
});
