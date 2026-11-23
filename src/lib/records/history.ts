import type { HistoryItem, HistoryKind } from "@/lib/api/memberHistory";
import { durationText, timeOfDay, toMs } from "@/lib/solo/fastingRules";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { dayHeading } from "./journal";

/*
 * History's rows, the same as mobile (src/utils/history.ts). Each fact once;
 * nothing is invented. Weight and notes stay neutral (the row icon has no
 * category colour), and no colour ever judges a number.
 */

export const NOTHING_LOGGED_YET = "Nothing logged yet";
export const NOTHING_HERE_YET = "Nothing here yet";

/** The filter chips. "All" is no filter. */
export interface HistoryFilter {
  key: "all" | HistoryKind;
  label: string;
  kinds: HistoryKind[] | null;
}

export const HISTORY_FILTERS: readonly HistoryFilter[] = [
  { key: "all", label: "All", kinds: null },
  { key: "fast", label: "Fasts", kinds: ["fast"] },
  { key: "water", label: "Water", kinds: ["water"] },
  { key: "weight", label: "Weight", kinds: ["weight"] },
  { key: "meal", label: "Meals", kinds: ["meal"] },
  { key: "activity", label: "Activity", kinds: ["activity"] },
  { key: "session", label: "Workouts", kinds: ["session"] },
  { key: "note", label: "Notes", kinds: ["note"] },
];

const kg = (n: number) => `${Math.round(n * 10) / 10}`.replace(/\.0$/, "");
const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const clock = (iso: string) => timeOfDay(toMs(iso));
const INTENSITY = ["", "light", "light", "moderate", "hard", "hard"];

export interface RowText {
  title: string;
  meta: string;
}

/** The two lines of a history row. */
export function rowText(item: HistoryItem): RowText {
  switch (item.kind) {
    case "fast": {
      const start = clock(item.at);
      if (!item.ended_at) return { title: "Fast, running", meta: `Fasting · started ${start}` };
      const mins = item.duration_minutes ?? Math.round((toMs(item.ended_at) - toMs(item.at)) / 60_000);
      return { title: `Fast, ${durationText(mins * 60_000)}`, meta: `Fasting · ${start} to ${clock(item.ended_at)}` };
    }
    case "water":
      return { title: `${item.glasses} ${item.glasses === 1 ? "glass" : "glasses"}`, meta: "Water · whole day" };
    case "weight":
      return { title: `${kg(item.weight_kg)} kg`, meta: `Weight · ${clock(item.at)}` };
    case "meal":
      return { title: cap(item.meal_type || "Meal"), meta: ["Meal", clock(item.at), item.description].filter(Boolean).join(" · ") };
    case "activity": {
      const name = item.name?.trim() || cap(item.activity_type || "Activity");
      const intensity = item.intensity ? INTENSITY[Math.min(5, Math.max(1, Math.round(item.intensity)))] : "";
      return {
        title: item.duration_minutes ? `${name}, ${item.duration_minutes} min` : name,
        meta: ["Activity", clock(item.at), intensity].filter(Boolean).join(" · "),
      };
    }
    case "note":
      return {
        title: item.preview?.trim() || "Note",
        meta: ["Note", clock(item.at), item.mood ? cap(item.mood) : null].filter(Boolean).join(" · "),
      };
    case "session":
      return { title: item.name, meta: `Workout · ${clock(item.at)}${item.completed_late ? " · finished late" : ""}` };
  }
}

export interface HistorySection {
  day: string;
  heading: string;
  items: HistoryItem[];
}

/** Items (already newest first) grouped under their local day. Order is kept. */
export function groupByDay(items: readonly HistoryItem[], now: Date): HistorySection[] {
  const out: HistorySection[] = [];
  for (const item of items) {
    const last = out[out.length - 1];
    if (last && last.day === item.local_day) last.items.push(item);
    else out.push({ day: item.local_day, heading: dayHeading(item.local_day, now), items: [item] });
  }
  return out;
}

/**
 * Where a row opens on web, or null when it has no page of its own (it is
 * then read only). Water opens only for today: the water page shows today.
 */
export function historyHref(item: HistoryItem, today: string): string | null {
  switch (item.kind) {
    case "fast":
      return item.ended_at ? SOLO_HREFS.fastingHistory : SOLO_HREFS.fasting;
    case "water":
      return item.local_day === today ? SOLO_HREFS.water : null;
    case "weight":
      return "/dashboard/member/weight-log";
    case "meal":
      return "/dashboard/member/meal-log";
    case "activity":
      return "/dashboard/member/workout-log";
    case "note":
      return "/dashboard/member/journal";
    case "session":
      return "/dashboard/member/starter";
  }
}
