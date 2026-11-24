import { apiClient } from "./client";

/**
 * "Needs you" on the coach Today (GET /programs/provider/attention): forms
 * the provider's clients submitted and tasks they missed, newest first.
 * Trainers and dietitians both call it (ProviderGuard). Mirrors the mobile
 * app's coachApi.getAttention and utils/coachDay.ts#attentionLine.
 */

export interface AttentionClient {
  /** The provider's client profile id: what the client page is keyed by. */
  profileId: string;
  name: string;
}

export type AttentionItem =
  | {
      kind: "form_submitted";
      at: string;
      client: AttentionClient;
      title: string;
      late: boolean;
      /** The form the task sent, to open its answers. Absent on older API responses. */
      formId?: string;
      /** The response that completed the task. Absent when the API kept none. */
      responseId?: string;
    }
  | {
      kind: "tasks_missed";
      at: string;
      client: AttentionClient;
      /** The day the tasks were due, YYYY-MM-DD. */
      day: string;
      count: number;
      /** Up to three of the missed tasks' titles. */
      titles: string[];
    };

/** How many rows Today shows, like mobile. */
export const ATTENTION_LIMIT = 6;

type RawItem = Record<string, unknown> & {
  kind?: unknown;
  at?: unknown;
  client?: { profile_id?: unknown; name?: unknown } | null;
  form_id?: unknown;
  form_response_id?: unknown;
};

/** The API's snake_case item in the app's shape; null for a kind this build doesn't know. */
export function normalizeAttentionItem(raw: RawItem): AttentionItem | null {
  const client: AttentionClient = {
    profileId: String(raw.client?.profile_id ?? ""),
    name: String(raw.client?.name ?? "Client"),
  };
  const at = String(raw.at ?? "");
  if (raw.kind === "form_submitted") {
    return {
      kind: "form_submitted",
      at,
      client,
      title: String(raw.title ?? "Form"),
      late: Boolean(raw.late),
      ...(raw.form_id ? { formId: String(raw.form_id) } : {}),
      ...(raw.form_response_id ? { responseId: String(raw.form_response_id) } : {}),
    };
  }
  if (raw.kind === "tasks_missed") {
    return {
      kind: "tasks_missed",
      at,
      client,
      day: String(raw.day ?? ""),
      count: Number(raw.count ?? 0),
      titles: Array.isArray(raw.titles) ? raw.titles.map(String) : [],
    };
  }
  return null;
}

export const coachAttentionService = {
  /** The last `days` days of signals across my clients (API caps the span). */
  async getAttention(days = 2): Promise<AttentionItem[]> {
    const res = await apiClient.get<{ items?: RawItem[] }>(`/programs/provider/attention?days=${days}`);
    if (!res.success || !res.data) throw new Error(res.message ?? "Couldn't load who needs you");
    return (res.data.items ?? []).map(normalizeAttentionItem).filter((i): i is AttentionItem => i !== null);
  },
};

/** One line for a "Needs you" row: "Missed 3 tasks yesterday", `Submitted "Weekly check-in" late`. */
export function attentionLine(item: AttentionItem, today: string): string {
  if (item.kind === "form_submitted") {
    return item.late ? `Submitted "${item.title}" late` : `Submitted "${item.title}"`;
  }
  const when = item.day === today ? "today" : isYesterday(item.day, today) ? "yesterday" : `on ${shortDay(item.day)}`;
  const what = item.count === 1 ? `"${item.titles[0] ?? "a task"}"` : `${item.count} tasks`;
  return `Missed ${what} ${when}`;
}

/**
 * Where a row opens: a submitted form opens its answers (on this client's
 * response when the API named it); anything else, or a form from an older
 * API without a form id, opens the client.
 */
export function attentionHref(item: AttentionItem, clientHref: (profileId: string) => string): string {
  if (item.kind === "form_submitted" && item.formId) {
    const q = item.responseId ? `?response=${encodeURIComponent(item.responseId)}` : "";
    return `/dashboard/forms/${encodeURIComponent(item.formId)}/responses${q}`;
  }
  return clientHref(item.client.profileId);
}

function isYesterday(day: string, today: string): boolean {
  const d = new Date(`${today}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10) === day;
}

function shortDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}
