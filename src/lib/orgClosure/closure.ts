/**
 * Closing a gym: the shapes, the confirmation rule, the days-left maths and
 * the words for each refusal. Pure, so every state is unit-testable.
 *
 * Contract: binectics-api PR #336 (schema/openapi.json). Closing deletes
 * nothing, moves no money and cancels nothing; the owner keeps read access to
 * the money records and can export them.
 */

/** How the API describes one closure (dates are ISO 8601 UTC). */
export interface ClosedOrganization {
  id: string;
  name: string;
  closedAt: string | null;
  closedReason: string | null;
  reopenedAt: string | null;
  /** Last instant the owner can reopen. */
  reopenUntil: string | null;
  /** The server's answer at the time it was asked. */
  canReopen: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function str(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

/** One closure row from the API, or null when it has no id. */
export function parseClosure(raw: unknown): ClosedOrganization | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = str(r.id) ?? str(r._id);
  if (!id) return null;
  return {
    id,
    name: str(r.name) ?? "Your gym",
    closedAt: str(r.closed_at),
    closedReason: str(r.closed_reason),
    reopenedAt: str(r.reopened_at),
    reopenUntil: str(r.reopen_until),
    canReopen: r.can_reopen === true,
  };
}

/** GET /teams/closed-organizations: an array (or `{ items }`) of closures. */
export function parseClosures(data: unknown): ClosedOrganization[] {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { items?: unknown }).items)
      ? (data as { items: unknown[] }).items
      : [];
  return list.map(parseClosure).filter((c): c is ClosedOrganization => c !== null);
}

/**
 * Whole days left to reopen, rounded up (a deadline 3 hours away is "1 day"),
 * or 0 once it has passed. null when the API gave no deadline.
 */
export function daysLeftToReopen(c: Pick<ClosedOrganization, "reopenUntil">, now: Date = new Date()): number | null {
  if (!c.reopenUntil) return null;
  const left = new Date(c.reopenUntil).getTime() - now.getTime();
  if (Number.isNaN(left)) return null;
  return left <= 0 ? 0 : Math.ceil(left / DAY_MS);
}

/** Reopening is offered only while the window is open (server flag AND clock). */
export function canReopenNow(c: ClosedOrganization, now: Date = new Date()): boolean {
  if (!c.canReopen) return false;
  const days = daysLeftToReopen(c, now);
  return days === null ? true : days > 0;
}

export function daysLeftLabel(days: number | null): string {
  if (days === null) return "";
  if (days <= 0) return "The reopen window has ended";
  return days === 1 ? "1 day left to reopen" : `${days} days left to reopen`;
}

/** The API accepts the gym's name (any case) or the word CLOSE. */
export function confirmationMatches(typed: string, gymName: string): boolean {
  const t = typed.trim().toLowerCase();
  if (!t) return false;
  return t === "close" || t === gymName.trim().toLowerCase();
}

export const ORG_CLOSED_MESSAGE =
  "This gym has closed and is not taking new bookings, memberships, purchases or invitations.";

/** The plain-words message for each refusal the close/reopen/export calls give. */
export function closureErrorMessage(
  code: string | undefined,
  status: number | undefined,
  fallback?: string,
): string {
  switch (code) {
    case "ORG_CLOSE_CONFIRMATION_MISMATCH":
      return "That does not match. Type the gym's exact name, or the word CLOSE.";
    case "ORG_CLOSE_NOT_SUPPORTED":
      return "Only a gym workspace can be closed here. Trainer and dietitian workspaces are not supported.";
    case "ORG_ALREADY_CLOSED":
      return "This gym is already closed.";
    case "ORG_NOT_CLOSED":
      return "This gym is not closed, so there is nothing to reopen.";
    case "ORG_REOPEN_WINDOW_EXPIRED":
      return "The 30-day reopen window has ended, so this gym cannot be reopened from here. Your records stay available to export. Contact support if you need it reopened.";
    case "ORG_CLOSED":
      return ORG_CLOSED_MESSAGE;
    default:
      break;
  }
  if (status === 404) return "Only the gym's owner can do this.";
  if (status === 429) return "Too many attempts. Wait a minute and try again.";
  return fallback || "Something went wrong. Please try again.";
}

export type ExportKind = "revenue" | "sales" | "ledger";
export type ExportFormat = "csv" | "json";

export const EXPORTS: ReadonlyArray<{
  kind: ExportKind;
  title: string;
  desc: string;
  slug: string;
}> = [
  {
    kind: "revenue",
    title: "Revenue by trainer",
    desc: "One row per trainer and currency, all time.",
    slug: "revenue-by-trainer",
  },
  {
    kind: "sales",
    title: "Paid-content sales",
    desc: "Every paid or refunded sale of your meal plans and programs.",
    slug: "content-sales",
  },
  {
    kind: "ledger",
    title: "Transaction ledger",
    desc: "The raw ledger, every status. Includes payer ids and gateway references, so only you can download it.",
    slug: "ledger",
  },
];

/** The API path for one export. Whole history: no from/to. */
export function exportPath(kind: ExportKind, orgId: string, format: ExportFormat): string {
  const id = encodeURIComponent(orgId);
  const q = `?format=${format}`;
  switch (kind) {
    case "revenue":
      return `/transactions/organizations/${id}/export/revenue-by-trainer${q}`;
    case "sales":
      return `/content/organizations/${id}/export/sales${q}`;
    case "ledger":
      return `/transactions/organizations/${id}/export/ledger${q}`;
  }
}

/** A safe file name: gym-name-revenue-by-trainer.csv */
export function exportFileName(gymName: string, slug: string, format: ExportFormat): string {
  const base =
    gymName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "gym";
  return `${base}-${slug}.${format}`;
}
