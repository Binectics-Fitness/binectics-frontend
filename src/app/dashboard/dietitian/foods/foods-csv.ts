import type { FoodItem } from "@/lib/api/nutrition";

/**
 * CSV export for the provider food library. Kept as a pure function (no
 * DOM, no fetch) so it can be unit-tested — the page wires it to a Blob
 * download.
 */

export type FoodCsvRow = Pick<
  FoodItem,
  | "name"
  | "category"
  | "serving_label"
  | "calories_kcal"
  | "protein_g"
  | "carbs_g"
  | "fat_g"
  | "fiber_g"
  | "sugar_g"
  | "sodium_mg"
>;

export const FOODS_CSV_HEADERS = [
  "Name",
  "Category",
  "Serving",
  "Calories (kcal)",
  "Protein (g)",
  "Carbs (g)",
  "Fat (g)",
  "Fiber (g)",
  "Sugar (g)",
  "Sodium (mg)",
] as const;

/** RFC 4180 escaping: quote fields containing commas, quotes, or newlines. */
function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function num(value: number | undefined | null): string {
  return value === undefined || value === null ? "" : String(value);
}

export function buildFoodsCsv(items: FoodCsvRow[]): string {
  const rows = items.map((f) =>
    [
      f.name,
      f.category ?? "",
      f.serving_label,
      num(f.calories_kcal),
      num(f.protein_g),
      num(f.carbs_g),
      num(f.fat_g),
      num(f.fiber_g),
      num(f.sugar_g),
      num(f.sodium_mg),
    ]
      .map(escapeCsvField)
      .join(","),
  );
  return [FOODS_CSV_HEADERS.join(","), ...rows].join("\n");
}
