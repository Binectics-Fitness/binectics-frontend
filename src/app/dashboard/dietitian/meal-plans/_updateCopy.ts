/**
 * Words for "Update clients" on meal plans (roadmap R2). DRAFT client-facing
 * and dietitian-facing wording: it needs dietitian review and counsel before
 * release. It makes no health claim; it only says what the app does.
 */
import { MEAL_SLOT_LABELS, DAY_LABELS } from "./_lib";
import type { DayOfWeek, MealPlanDiffItem } from "@/lib/api/progress";
import type { MealSlot } from "@/lib/types";

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

export const MEAL_UPDATE_COPY = {
  button: "Update clients",
  title: (name: string) => `Update clients on ${name}`,
  /** Toast after saving a template that clients already have a copy of. */
  savedNote: "Saved. Clients keep their current plan until you update them.",
  whoChanges: "Clients and what changes",
  futureOnly: (day: string) => `Changes start ${day}. The day your client is on now stays as it is.`,
  untouched: "Meals your client already logged, and their feedback, are not touched.",
  notified: "Clients get a notification.",
  skippedNote: "Plans a client bought are never changed.",
  mealsLine: (m: { added: number; changed: number; removed: number }) => {
    const parts: string[] = [];
    if (m.changed) parts.push(`${m.changed} changed`);
    if (m.added) parts.push(`${m.added} added`);
    if (m.removed) parts.push(`${m.removed} removed`);
    return parts.length ? `${parts.join(", ")} meal${m.added + m.changed + m.removed === 1 ? "" : "s"}` : "Plan details change";
  },
  showChanges: "What changes",
  hideChanges: "Hide changes",
  moreItems: (n: number) => `and ${n} more`,
  upToDate: (n: number) => `${plural(n, "other client")} already ${n === 1 ? "has" : "have"} this version.`,
  handEdited: "Edited by you",
  handEditedBody: "You changed this plan for them. Updating replaces your edits.",
  bought: "Bought by the client",
  kind: { added: "Added", removed: "Removed", changed: "Changed", plan: "Plan" },
  apply: (n: number) => `Update ${plural(n, "client")}`,
  applyOne: (first: string) => `Update ${first}`,
  pickOne: "Pick at least one client",
  applying: "Updating…",
  cancel: "Cancel",
  loading: "Checking your clients…",
  loadFailed: "We couldn't check your clients. Try again.",
  nobody: "No client has an older copy of this plan.",
  failed: "We couldn't update. Nothing changed. Try again.",
  resultTitle: (done: number, total: number) => `Updated ${done} of ${total}`,
  resultDone: (n: number) => `${plural(n, "change")} from tomorrow.`,
  resultNothing: "Nothing left to change.",
  resultEdited: "Left as it is: you edited this plan for them.",
  resultBought: "Left as it is: they bought this plan.",
  resultFailed: (first: string) => `Didn't update. Nothing changed for ${first}.`,
  tryAgain: "Try again",
  done: "Done",
  toastUpdated: (n: number) => `${plural(n, "client")} updated.`,
  undo: "Undo",
  toastReverted: (n: number) => (n === 1 ? "Update taken back." : `${n} updates taken back.`),
  toastRevertFailed: "We couldn't take that back. It may be past 24 hours, or the plan was edited since.",
} as const;

/** "Monday dinner: Grilled fish" / "Every day lunch: ..." for a diff line. */
export function diffWhere(it: MealPlanDiffItem): string {
  if (!it.day_of_week) return "Plan";
  const day = DAY_LABELS[it.day_of_week as DayOfWeek] ?? it.day_of_week;
  const slot = it.meal_type ? (MEAL_SLOT_LABELS[it.meal_type as MealSlot] ?? it.meal_type) : "";
  return slot ? `${day} · ${slot}` : day;
}

/** What differs, in plain words ("calories, foods"; "was Oats" for a rename). */
export function diffDetail(it: MealPlanDiffItem): string | null {
  if (it.kind === "added" || it.kind === "removed") return null;
  const parts: string[] = [];
  if (it.was_title) parts.push(`was "${it.was_title}"`);
  const rest = it.fields.filter((f) => f !== "title");
  if (rest.length) parts.push(`${rest.join(", ")} changed`);
  return parts.length ? parts.join("; ") : null;
}
