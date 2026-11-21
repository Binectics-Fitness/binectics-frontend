import type { ClientProgramSummary, ProgramResultItem } from "@/lib/api/programs";
import { COMPONENT_TYPE_LABELS } from "@/components/programs/mapper";
import { RESULTS_COPY as C, RESULT_PILLS } from "./copy";

/** Metrics that tick from the client's own fasting and water logs. */
const OWN_LOG = new Set(["fasting_hours", "water_glasses"]);

export type ResultPill = keyof typeof RESULT_PILLS;

export function resultPill(item: ProgramResultItem): ResultPill {
  if (item.auto_evidence?.withdrawn) return "withdrawn";
  if (item.status === "done") return item.completed_late ? "late" : "done";
  return item.status;
}

/**
 * The one number a coach sees: a fasting or water result, or today's water
 * count while pending. Nothing for a withdrawn result, a health-app task or a
 * task the client ticks.
 */
export function resultValue(item: ProgramResultItem): { text: string; soft: boolean } | null {
  const metric = item.auto?.metric;
  if (!metric || !OWN_LOG.has(metric)) return null;
  const ev = item.auto_evidence;
  if (item.status === "done" && ev && !ev.withdrawn) {
    return { text: metric === "fasting_hours" ? C.hours(ev.value) : C.glasses(ev.value), soft: false };
  }
  if (item.status === "pending" && metric === "water_glasses" && item.auto_progress) {
    return { text: C.soFar(item.auto_progress.value), soft: true };
  }
  return null;
}

export function resultMeta(item: ProgramResultItem): string {
  if (item.auto_evidence?.withdrawn) return C.withdrawnMeta;
  const auto = item.auto;
  if (auto && OWN_LOG.has(auto.metric)) {
    const t = auto.threshold;
    if (t == null) return C.shared;
    return `${C.shared} · ${auto.metric === "fasting_hours" ? C.targetHours(t) : C.targetGlasses(t)}`;
  }
  if (auto) return C.health;
  return COMPONENT_TYPE_LABELS[item.type] ?? "";
}

/** "Day 4 of 28 · 9 of 12 done in the last 7 days", from the overview. */
export function programSubtitle(summary: ClientProgramSummary | undefined): string {
  if (!summary) return "";
  const p = summary.progress;
  const week = p?.last_7_days;
  return [
    summary.status === "paused" ? C.paused : p?.day != null ? C.day(p.day, p.total_days) : null,
    week && week.scheduled > 0 ? C.week(week.done, week.scheduled) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
const DAY_MONTH = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** A YYYY-MM-DD program day: { weekday: "Thu", date: "19 Nov" }. */
export function dayLabel(day: string): { weekday: string; date: string } {
  const d = new Date(`${day}T00:00:00Z`);
  return { weekday: WEEKDAY.format(d), date: DAY_MONTH.format(d) };
}
