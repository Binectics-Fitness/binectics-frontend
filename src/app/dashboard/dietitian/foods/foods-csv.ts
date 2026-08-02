import type { FoodItem } from "@/lib/api/nutrition";
import { buildCsv, csvNumber } from "@/lib/csv/csv";

/**
 * CSV export for the provider food library. Kept as a pure function (no
 * DOM, no fetch) so it can be unit-tested — the page wires it to a Blob
 * download. RFC 4180 escaping lives in @/lib/csv/csv.
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

export function buildFoodsCsv(items: FoodCsvRow[]): string {
  return buildCsv(
    FOODS_CSV_HEADERS,
    items.map((f) => [
      f.name,
      f.category ?? "",
      f.serving_label,
      csvNumber(f.calories_kcal),
      csvNumber(f.protein_g),
      csvNumber(f.carbs_g),
      csvNumber(f.fat_g),
      csvNumber(f.fiber_g),
      csvNumber(f.sugar_g),
      csvNumber(f.sodium_mg),
    ]),
  );
}
