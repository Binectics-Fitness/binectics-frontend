import type { AttributedItem, AttributedMoney, TrainerRevenueRow } from "@/lib/api/attributedRevenue";

/**
 * The date window of the attributed-revenue reports (binectics-api
 * AttributedRevenueQueryDto). The API reads `from` (inclusive) and `to`
 * (exclusive) as UTC instants, so the windows are UTC calendar days, never
 * the browser's local days; the page says "Dates are UTC".
 */
export type RangeKey = "7d" | "30d" | "90d" | "month";

export const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
  { key: "month", label: "This month" },
];

export const DEFAULT_RANGE: RangeKey = "30d";

const DAY_MS = 24 * 60 * 60 * 1000;
const startOfUtcDay = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());

/** The window for a preset, ending at the end of today (UTC) so today's payments are in it. */
export function windowFor(key: RangeKey, now: Date = new Date()): { from: string; to: string } {
  const to = startOfUtcDay(now) + DAY_MS;
  const from =
    key === "month"
      ? Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
      : to - (key === "7d" ? 7 : key === "90d" ? 90 : 30) * DAY_MS;
  return { from: new Date(from).toISOString(), to: new Date(to).toISOString() };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function utcDayLabel(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/** "1 Oct to 28 Oct (UTC)": `to` is exclusive, so the last day shown is the day before. */
export function windowLabel(from: string, to: string): string {
  const end = new Date(to).getTime();
  if (Number.isNaN(end)) return "";
  const a = utcDayLabel(from);
  const b = utcDayLabel(new Date(end - 1).toISOString());
  return a && b ? `${a} to ${b} (UTC)` : "";
}

/** Short names for the ledger kinds attribution covers. */
export function attributedTypeLabel(type: string): string {
  switch (type) {
    case "consultation":
      return "Session";
    case "subscription":
      return "Membership";
    case "content_purchase":
      return "Program or meal plan";
    case "refund":
      return "Refund";
    default: {
      const t = type.replace(/_/g, " ").trim();
      return t ? t[0].toUpperCase() + t.slice(1) : "Payment";
    }
  }
}

export const trainerName = (r: Pick<TrainerRevenueRow, "firstName" | "lastName">): string =>
  [r.firstName, r.lastName].filter(Boolean).join(" ").trim() || "Unnamed trainer";

/**
 * Of gross, what is neither a session nor a membership. The API counts
 * program and meal plan purchases in gross and net but sends no field for
 * them, so this is derived (gross - sessions - memberships) and clamped.
 */
export function contentMinorOf(m: Pick<AttributedMoney, "grossMinor" | "consultationsMinor" | "subscriptionsMinor">): number {
  return Math.max(0, m.grossMinor - m.consultationsMinor - m.subscriptionsMinor);
}

/** "20 Oct 2026" in UTC, like the window the report is read in ("Dates are UTC"). */
export function utcShortDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/**
 * Rows for one trainer, grouped by id in the order the API sent them.
 *
 * The API pages rows (one per trainer AND currency), not trainers, so a
 * trainer with two currencies can have one row at the end of a page and the
 * other at the start of the next. This groups the page it is given; the page
 * shows what is on this page and says so (the pager sits right below). It is
 * not merged across pages on purpose: totals are the API's, never recomputed
 * here.
 */
export function groupByTrainer(rows: TrainerRevenueRow[]): { userId: string; name: string; rows: TrainerRevenueRow[] }[] {
  const out: { userId: string; name: string; rows: TrainerRevenueRow[] }[] = [];
  for (const r of rows) {
    const g = out.find((x) => x.userId === r.userId);
    if (g) g.rows.push(r);
    else out.push({ userId: r.userId, name: trainerName(r), rows: [r] });
  }
  return out;
}

export const isRefund = (i: Pick<AttributedItem, "direction">): boolean => i.direction === "debit";
