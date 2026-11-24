import { addDaysTo } from "@/lib/solo/glance";

/*
 * What the member's export holds (binectics-api programs-export, GET
 * /my-programs/export), the same list mobile shows (src/utils/exportData.ts).
 * The API returns no counts, so none are claimed. Meals are not part of the
 * file, and the card says so.
 */
export const EXPORT_INCLUDED: readonly string[] = [
  "Fasts",
  "Water and your daily list",
  "Weight",
  "Activity",
  "Program sessions and tasks",
  "Journal notes and goals",
];

export const EXPORT_NOT_INCLUDED = "Meals are not in the file yet.";

export type ExportRange = "all" | "year" | "quarter";

export const EXPORT_RANGE_LABELS: Record<ExportRange, string> = {
  all: "All of it",
  year: "Last 12 months",
  quarter: "Last 3 months",
};

/** ISO `from` for a range, from the member's local day; `all` sends no window. */
export function exportWindow(range: ExportRange, today: string): { from?: string } {
  if (range === "all") return {};
  const days = range === "year" ? 365 : 91;
  return { from: `${addDaysTo(today, -days)}T00:00:00.000Z` };
}

/** Saves a downloaded file in the browser. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
