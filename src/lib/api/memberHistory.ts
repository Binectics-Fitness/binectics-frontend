import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/*
 * One timeline of everything the member logged. Contract: binectics-api
 * src/member-history, the same route mobile calls (src/api/memberHistory.ts).
 *   GET /member-history ?tz&types&from&to&limit&cursor
 * Read-only, newest first, paged by an opaque cursor. `types` is a comma
 * list; none means every kind.
 */

export type HistoryKind = "fast" | "water" | "weight" | "meal" | "activity" | "note" | "session";
export const HISTORY_KINDS: readonly HistoryKind[] = ["fast", "water", "weight", "meal", "activity", "note", "session"];
export const HISTORY_PAGE = 30;

interface RowBase {
  id: string;
  /** When it happened (ISO). */
  at: string;
  /** The member's local day, "YYYY-MM-DD". */
  local_day: string;
  title: string;
}

export type HistoryItem =
  | (RowBase & {
      kind: "fast";
      status: string;
      preset: string;
      target_hours: number;
      ended_at: string | null;
      end_reason: string | null;
      duration_minutes: number | null;
    })
  | (RowBase & { kind: "water"; glasses: number })
  | (RowBase & { kind: "weight"; weight_kg: number; source: string })
  | (RowBase & { kind: "meal"; meal_type: string; description: string | null; rating: string | null })
  | (RowBase & {
      kind: "activity";
      activity_type: string;
      name: string | null;
      duration_minutes: number;
      intensity: number | null;
      source: string;
    })
  | (RowBase & { kind: "note"; preview: string | null; mood: string | null; linked_kind: string | null })
  | (RowBase & { kind: "session"; name: string; completed_late: boolean });

export interface HistoryPage {
  tz: string;
  items: HistoryItem[];
  next_cursor: string | null;
}

export interface HistoryQuery {
  tz: string;
  types?: readonly HistoryKind[] | null;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

/** The query string for one page. Exposed for tests. */
export function historyQueryString(q: HistoryQuery): string {
  const qs = new URLSearchParams({ tz: q.tz, limit: String(q.limit ?? HISTORY_PAGE) });
  if (q.types && q.types.length) qs.set("types", q.types.join(","));
  if (q.from) qs.set("from", q.from);
  if (q.to) qs.set("to", q.to);
  if (q.cursor) qs.set("cursor", q.cursor);
  return qs.toString();
}

export const memberHistoryService = {
  read: (q: HistoryQuery): Promise<ApiResponse<HistoryPage>> =>
    apiClient.get<HistoryPage>(`/member-history?${historyQueryString(q)}`),
};
