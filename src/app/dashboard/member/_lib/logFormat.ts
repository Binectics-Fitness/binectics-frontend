/**
 * Display helpers shared by the member log pages (workouts, weight, meals).
 */
import { ActivityType, type ActivityReport } from "@/lib/api/progress";
import { dayKey, toDate } from "@/lib/ui/activity";

/**
 * A log's date: "Today" when it falls on the viewer's day, else
 * "Mon, Oct 5". `now` comes from useClientNow(); with null (server, first
 * render) there is no "today", so the plain date is shown.
 */
export function logDate(iso: string, now: Date | null): string {
  const d = toDate(iso);
  if (!d) return "-";
  if (now && dayKey(d) === dayKey(now)) return "Today";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  [ActivityType.CARDIO]: "Cardio",
  [ActivityType.STRENGTH]: "Strength",
  [ActivityType.FLEXIBILITY]: "Flexibility",
  [ActivityType.HIIT]: "HIIT",
  [ActivityType.YOGA]: "Yoga",
  [ActivityType.SWIMMING]: "Swimming",
  [ActivityType.CYCLING]: "Cycling",
  [ActivityType.RUNNING]: "Running",
  [ActivityType.WALKING]: "Walking",
  [ActivityType.OTHER]: "Other",
};

/** "hiit" → "HIIT"; a type this build doesn't know is shown as stored. */
export const activityTypeLabel = (type: string) => ACTIVITY_TYPE_LABELS[type as ActivityType] ?? type;

/**
 * A workout row's title and meta line, each fact said once (as on mobile).
 * The title is the entry's own, else its type. When the title IS the type
 * ("Walking", what the API gives an import with no title), the meta leaves
 * the type out. The app an import came from is never in either: it is the
 * row's source badge (ImportSourceBadges).
 */
export function activityRowText(
  activity: Pick<ActivityReport, "title" | "activity_type" | "performed_at" | "duration_minutes" | "calories_burned">,
  now: Date | null,
): { title: string; meta: string } {
  const typeLabel = activityTypeLabel(activity.activity_type);
  const title = activity.title?.trim() || typeLabel;
  const sameAsType = title.toLowerCase() === typeLabel.toLowerCase();
  const meta = [
    logDate(activity.performed_at, now),
    sameAsType ? null : typeLabel,
    `${activity.duration_minutes} min`,
    activity.calories_burned ? `${activity.calories_burned} kcal` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return { title, meta };
}

/**
 * How many records the log pages ask for. The API caps weight at 100 and
 * applies no cap to meals and activities; 100 covers 30 days for anyone
 * logging fewer than three sessions a day. When a full page still reaches
 * into the window, the window's totals are a lower bound (see
 * mayBeTruncated).
 */
export const LOG_LIMIT = 100;
