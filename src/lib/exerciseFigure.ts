/**
 * The exercise figure a member chooses (body and skin tone), and how it turns
 * into an image path. Same contract as the mobile app (utils/exerciseFigure.ts)
 * and the API (User.exercise_figure). Spec:
 * binectics-plans/exercise-illustrations/FIGURE-CHOICE-SPEC.md. A private
 * display preference.
 *
 * The path carries a variant key (`a-t3`). The default figure lives at the
 * unkeyed path, so a variant whose file is missing falls back to it:
 * `figureImageCandidates` returns the variant first and the default second.
 */
export type FigureBody = "a" | "b";

export interface ExerciseFigure {
  body: FigureBody;
  /** 1 (fair) to 5 (deep). */
  tone: number;
}

export const FIGURE_BODIES: readonly FigureBody[] = ["a", "b"];

/** Which tones have production images. Grows as variants are rendered; the API accepts 1 to 5. */
export const AVAILABLE_FIGURE_TONES: readonly number[] = [1, 3, 5];

/** The figure the unkeyed path shows: today's illustration set. */
export const DEFAULT_FIGURE: ExerciseFigure = { body: "a", tone: 5 };

/** Where the figure images are served from. Unset: no images, the picker shows plain tiles. */
export const EXERCISE_ART_BASE = (process.env.NEXT_PUBLIC_EXERCISE_ART_URL || "").replace(/\/+$/, "");

/**
 * Swatch colours: the colour of the thing being chosen, not interface colour.
 * Approximate mid-skin values read from the figure renders; to be re-sampled
 * from the production skin maps.
 */
export const SKIN_TONES: Record<number, { name: string; swatch: string }> = {
  1: { name: "Fair", swatch: "#F0D2BC" },
  2: { name: "Light", swatch: "#E3B592" },
  3: { name: "Medium", swatch: "#C58F6A" },
  4: { name: "Brown", swatch: "#8E5B3E" },
  5: { name: "Deep", swatch: "#5B3A2B" },
};

export function figureKey(figure: ExerciseFigure): string {
  return `${figure.body}-t${figure.tone}`;
}

export function figureName(body: FigureBody): string {
  return `Figure ${body.toUpperCase()}`;
}

/** What the API sent, or null when it is absent or not a figure this build knows. */
export function parseFigure(value: unknown): ExerciseFigure | null {
  if (!value || typeof value !== "object") return null;
  const { body, tone } = value as { body?: unknown; tone?: unknown };
  if (body !== "a" && body !== "b") return null;
  if (typeof tone !== "number" || !Number.isInteger(tone) || tone < 1 || tone > 5) return null;
  return { body, tone };
}

/** The saved figure, or the default when none was chosen. */
export function figureOrDefault(value: unknown): ExerciseFigure {
  return parseFigure(value) ?? DEFAULT_FIGURE;
}

/**
 * Image URLs to try, in order: the chosen variant, then the default figure.
 * `art` is the exercise's folder (`<exercise>/<stage>`) and `file` the size
 * and theme (`600-light.webp`). An empty list when no art base is set.
 */
export function figureImageCandidates(art: string, file: string, figure: ExerciseFigure | null, base = EXERCISE_ART_BASE): string[] {
  if (!base) return [];
  const folder = `${base}/${art.replace(/^\/+|\/+$/g, "")}`;
  const defaultUrl = `${folder}/${file}`;
  if (!figure || (figure.body === DEFAULT_FIGURE.body && figure.tone === DEFAULT_FIGURE.tone)) return [defaultUrl];
  return [`${folder}/${figureKey(figure)}/${file}`, defaultUrl];
}

/** The neutral-pose preview the picker shows for a body and tone. */
export const FIGURE_PREVIEW_ART = "preview/stand";
export const FIGURE_PREVIEW_FILE = "600-light.webp";

export function figurePreviewCandidates(figure: ExerciseFigure, base = EXERCISE_ART_BASE): string[] {
  return figureImageCandidates(FIGURE_PREVIEW_ART, FIGURE_PREVIEW_FILE, figure, base);
}
