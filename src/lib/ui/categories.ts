import { Clock, Droplet, Dumbbell, FileText, Footprints, Scale, Utensils, type LucideIcon } from "lucide-react";

/**
 * Category colour: what a member tool is about (colour by meaning, owner
 * approval 19 Nov 2026; binectics-plans/design/colour-motion). Fasting is
 * amber, water blue, movement green-teal, meals violet. Weight, notes, the
 * daily list and goals have no category and stay neutral, so no colour ever
 * judges a body number.
 *
 * Where the colour goes, and only there:
 *  - an icon tile (IconTile tone = the category): soft fill, ink icon
 *  - the SELECTED chip of a category (Chip / ChipGroup `category`): the
 *    accent fill, an ink label and a check, so selection never rests on
 *    colour alone
 * Never on buttons, surfaces, text or success states. Ink stays the primary
 * action, and a selected chip without a category stays ink (Sep 29 ruling).
 *
 * This is the one map pages read. Mobile has the same one in
 * binectics-mobile src/theme/tones.ts; keep the two in step.
 */
export type Category = "fast" | "water" | "move" | "meal";

export const CATEGORIES: readonly Category[] = ["fast", "water", "move", "meal"];

/** accent = selected fill; soft = tile fill; ink = icon on soft. CSS variables from globals.css. */
export const CATEGORY_COLORS: Record<Category, { accent: string; soft: string; ink: string }> = {
  fast: { accent: "var(--fast)", soft: "var(--fast-soft)", ink: "var(--fast-ink)" },
  water: { accent: "var(--water)", soft: "var(--water-soft)", ink: "var(--water-ink)" },
  move: { accent: "var(--move)", soft: "var(--move-soft)", ink: "var(--move-ink)" },
  meal: { accent: "var(--meal)", soft: "var(--meal-soft)", ink: "var(--meal-ink)" },
};

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

/** The fill of a selected control: the category's accent, else ink. */
export function selectedFill(category: Category | null | undefined): string {
  return category ? CATEGORY_COLORS[category].accent : "var(--ink)";
}

/** The label on a selected control: ink on a category accent (7.8-9.7:1), paper on ink. */
export function selectedLabel(category: Category | null | undefined): string {
  return category ? "var(--ink)" : "var(--bg)";
}

/** The icon colour on an unselected chip: the category's ink, else fg-2. */
export function restingIcon(category: Category | null | undefined): string {
  return category ? CATEGORY_COLORS[category].ink : "var(--fg-2)";
}

// ─── What each member tool is about ─────────────────────────────────────

/** Log kinds (the Log hub and the log pages). `null` = no category: neutral. */
export type LogKind = "fast" | "water" | "activity" | "session" | "meal" | "weight" | "note";

export const LOG_CATEGORY: Record<LogKind, Category | null> = {
  fast: "fast",
  water: "water",
  activity: "move",
  session: "move",
  meal: "meal",
  weight: null,
  note: null,
};

/** One icon per meaning, as on mobile (clock = fasting, drop = water). */
export const LOG_ICON: Record<LogKind, LucideIcon> = {
  fast: Clock,
  water: Droplet,
  activity: Footprints,
  session: Dumbbell,
  meal: Utensils,
  weight: Scale,
  note: FileText,
};

/** The targets page tabs (src/lib/solo/glanceCopy.ts TargetTab). */
export const TARGET_CATEGORY: Record<"weight" | "fasting" | "water", Category | null> = {
  weight: null,
  fasting: "fast",
  water: "water",
};

export const TARGET_ICON: Record<"weight" | "fasting" | "water", LucideIcon> = {
  weight: Scale,
  fasting: Clock,
  water: Droplet,
};
