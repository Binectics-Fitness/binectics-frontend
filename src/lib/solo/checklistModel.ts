import {
  CHECKLIST_MAX_ACTIVE,
  ChecklistItemKind,
  ChecklistSystemKey,
  type ChecklistItem,
  type ChecklistToday,
} from "@/lib/api/checklist";

/** Optimistic tick of one custom line; tool lines are never changed here. */
export function withTick(today: ChecklistToday, id: string, done: boolean): ChecklistToday {
  return {
    ...today,
    items: today.items.map((i) =>
      i.id === id && i.kind === ChecklistItemKind.CUSTOM ? { ...i, done } : i,
    ),
  };
}

export const WEEKDAYS = [
  { day: 1, short: "Mon", long: "Monday" },
  { day: 2, short: "Tue", long: "Tuesday" },
  { day: 3, short: "Wed", long: "Wednesday" },
  { day: 4, short: "Thu", long: "Thursday" },
  { day: 5, short: "Fri", long: "Friday" },
  { day: 6, short: "Sat", long: "Saturday" },
  { day: 0, short: "Sun", long: "Sunday" },
] as const;

/** Toggle a weekday; a line always keeps at least one day (the API requires it). */
export function toggleDay(days: readonly number[], day: number): number[] {
  const has = days.includes(day);
  if (has && days.length === 1) return [...days];
  const next = has ? days.filter((d) => d !== day) : [...days, day];
  return next.sort((a, b) => a - b);
}

export const activeCount = (items: readonly ChecklistItem[]): number =>
  items.filter((i) => i.active).length;

export const atCap = (items: readonly ChecklistItem[]): boolean =>
  activeCount(items) >= CHECKLIST_MAX_ACTIVE;

/** "Every day", "Weekdays", "Mon, Wed, Fri". */
export function daysLabel(days: readonly number[]): string {
  const set = new Set(days);
  if (set.size === 7) return "Every day";
  if (set.size === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d))) return "Weekdays";
  if (set.size === 2 && set.has(0) && set.has(6)) return "Weekends";
  return WEEKDAYS.filter((w) => set.has(w.day))
    .map((w) => w.short)
    .join(", ");
}

/** Meta line under a tool line, as in the design board. */
export function toolMeta(key: string, on: boolean, waterTarget: number | null): string {
  if (!on) return "Off";
  switch (key) {
    case "fasting":
      return "Ticks itself when a fast ends today";
    case "water":
      return waterTarget ? `Ticks itself at ${waterTarget} glasses` : "Ticks itself at 1 glass";
    case "weight":
      return "Ticks itself when you log weight today";
    case "starter_session":
      return "Ticks itself when the day's session is done";
    default:
      return "Ticks itself";
  }
}

export const TOOL_ORDER: readonly ChecklistSystemKey[] = [
  ChecklistSystemKey.FASTING,
  ChecklistSystemKey.WATER,
  ChecklistSystemKey.WEIGHT,
  ChecklistSystemKey.STARTER_SESSION,
];
export const TOOL_TITLES: Record<string, string> = {
  fasting: "Finish a fast",
  water: "Drink water",
  weight: "Log my weight",
  starter_session: "Do today's session",
};
