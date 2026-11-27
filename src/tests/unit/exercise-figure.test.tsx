import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseFigureCard } from "@/components/ExerciseFigureCard";
import { ExerciseFigurePicker } from "@/components/ExerciseFigurePicker";
import {
  DEFAULT_FIGURE,
  figureImageCandidates,
  figureKey,
  figureOrDefault,
  figurePreviewCandidates,
  parseFigure,
} from "@/lib/exerciseFigure";

const h = vi.hoisted(() => ({
  flag: false,
  user: null as Record<string, unknown> | null,
  updateUser: vi.fn(),
  updateProfile: vi.fn(),
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

vi.mock("@/hooks/useFeatureFlags", () => ({ useFeatureFlag: () => h.flag }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: h.user, updateUser: h.updateUser }) }));
vi.mock("@/lib/api/auth", () => ({ authService: { updateProfile: h.updateProfile } }));
vi.mock("@/components/Toast", () => ({ toast: { error: h.toastError, success: h.toastSuccess } }));

// The art base is an env var read at load; the picker is tested with a fixed one.
vi.mock("@/lib/exerciseFigure", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/exerciseFigure")>();
  return {
    ...actual,
    figurePreviewCandidates: (f: { body: string; tone: number }, base?: string) =>
      base !== undefined
        ? actual.figurePreviewCandidates(f as never, base)
        : [`https://art.example.test/preview/stand/${f.body}-t${f.tone}/600-light.webp`, "https://art.example.test/preview/stand/600-light.webp"],
  };
});

const BASE = "https://art.example.test";

describe("figure key and resolver", () => {
  it("names the variant like the API does", () => {
    expect(figureKey({ body: "b", tone: 3 })).toBe("b-t3");
    expect(figureKey(DEFAULT_FIGURE)).toBe("a-t5");
  });

  it("tries the variant, then the unkeyed default; default and no base are single or empty", () => {
    expect(figureImageCandidates("squat/end", "600-light.webp", { body: "b", tone: 3 }, BASE)).toEqual([
      `${BASE}/squat/end/b-t3/600-light.webp`,
      `${BASE}/squat/end/600-light.webp`,
    ]);
    expect(figureImageCandidates("squat/end", "600-light.webp", DEFAULT_FIGURE, BASE)).toEqual([`${BASE}/squat/end/600-light.webp`]);
    expect(figureImageCandidates("squat/end", "600-light.webp", { body: "b", tone: 1 }, "")).toEqual([]);
    expect(figurePreviewCandidates({ body: "a", tone: 1 }, BASE)[0]).toBe(`${BASE}/preview/stand/a-t1/600-light.webp`);
  });

  it("reads only a valid figure from the API", () => {
    expect(parseFigure({ body: "b", tone: 2 })).toEqual({ body: "b", tone: 2 });
    for (const bad of [null, "a-t3", {}, { body: "c", tone: 2 }, { body: "a", tone: 0 }, { body: "a", tone: 6 }, { body: "a", tone: 2.5 }]) {
      expect(parseFigure(bad)).toBeNull();
    }
    expect(figureOrDefault(undefined)).toEqual(DEFAULT_FIGURE);
  });
});

describe("ExerciseFigurePicker", () => {
  it("has named radios, no gender words, and changes body and tone independently", async () => {
    const onChange = vi.fn();
    render(<ExerciseFigurePicker value={DEFAULT_FIGURE} onChange={onChange} />);
    expect(screen.getByRole("radio", { name: "Figure A" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: "Deep skin tone" })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByText(/male|female|gender|woman/i)).toBeNull();
    await userEvent.click(screen.getByRole("radio", { name: "Figure B" }));
    expect(onChange).toHaveBeenLastCalledWith({ body: "b", tone: 5 });
    await userEvent.click(screen.getByRole("radio", { name: "Medium skin tone" }));
    expect(onChange).toHaveBeenLastCalledWith({ body: "a", tone: 3 });
  });

  it("draws each figure in the chosen tone; a missing variant falls back to the default image, then to a plain tile", () => {
    const { container } = render(<ExerciseFigurePicker value={{ body: "a", tone: 3 }} onChange={() => undefined} />);
    const imgs = () => Array.from(container.querySelectorAll("img"));
    expect(imgs()).toHaveLength(2);
    expect(imgs()[1].getAttribute("src")).toContain("/b-t3/");
    fireEvent.error(imgs()[1]);
    expect(imgs()[1].getAttribute("src")).toBe("https://art.example.test/preview/stand/600-light.webp");
    fireEvent.error(imgs()[1]);
    expect(imgs()).toHaveLength(1);
  });
});

describe("ExerciseFigureCard", () => {
  beforeEach(() => {
    h.flag = false;
    h.user = { id: "u1" };
    h.updateUser.mockReset();
    h.updateProfile.mockReset().mockImplementation(async (p: { exercise_figure: unknown }) => ({
      success: true,
      data: { id: "u1", exercise_figure: p.exercise_figure },
    }));
    h.toastError.mockReset();
    h.toastSuccess.mockReset();
  });

  it("is not shown while the flag is off", () => {
    const { container } = render(<ExerciseFigureCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the default, saves only a change, and updates the user", async () => {
    h.flag = true;
    render(<ExerciseFigureCard />);
    expect(screen.getByRole("radio", { name: "Figure A" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    await userEvent.click(screen.getByRole("radio", { name: "Figure B" }));
    await userEvent.click(screen.getByRole("radio", { name: "Fair skin tone" }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(h.updateUser).toHaveBeenCalled());
    expect(h.updateProfile).toHaveBeenCalledWith({ exercise_figure: { body: "b", tone: 1 } });
    expect(h.toastSuccess).toHaveBeenCalledWith("Saved");
  });

  it("says so when the save fails", async () => {
    h.flag = true;
    h.updateProfile.mockResolvedValue({ success: false, message: "Nope" });
    render(<ExerciseFigureCard />);
    fireEvent.click(screen.getByRole("radio", { name: "Figure B" }));
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(h.toastError).toHaveBeenCalledWith("Nope"));
    expect(h.updateUser).not.toHaveBeenCalled();
  });
});
