import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";
import { FASTING_ERROR_MESSAGES } from "@/lib/solo/fastingCopy";

/*
 * Fasting client. Contract: binectics-api #340 (src/fasting) and #344. Behind
 * the `solo_fasting` flag: while it is off every route answers 404.
 *   POST   /fasting/screening            { under_18, eating_disorder_history, pregnant_or_breastfeeding, diabetes_or_medication, acknowledged }
 *   GET    /fasting/settings
 *   POST   /fasting/sessions             { started_at, target_hours (1..24), preset, note? }
 *   GET    /fasting/sessions/current     the running fast, or null
 *   GET    /fasting/sessions?limit&cursor   finished fasts, newest first
 *   GET    /fasting/sessions/summary?from&to&tz
 *   PATCH  /fasting/sessions/:id         { started_at?, ended_at?, target_hours?, preset?, note? }
 *   POST   /fasting/sessions/:id/end     { ended_at? }
 *   POST   /fasting/sessions/:id/undo-end
 *   POST   /fasting/sessions/:id/feelings  { value, at? }
 *   DELETE /fasting/sessions/:id
 *
 * The screening answers are sent once and never kept here (not in a cache, a
 * store or a log): only the API's pass/fail answer is.
 */

export type FastingPresetKey = "12_12" | "14_10" | "16_8" | "18_6" | "20_4" | "one_meal" | "custom";
export type FastStatus = "running" | "expired_unclosed" | "ended";
export type FastEndReason = "completed" | "ended_early" | "edited";
export type FastingFeelingValue = "fine" | "hungry" | "low_energy" | "unwell";

export interface FastFeeling {
  at: string;
  value: FastingFeelingValue;
}

export interface FastSession {
  id: string;
  status: FastStatus;
  started_at: string;
  target_hours: number;
  preset: FastingPresetKey | string;
  target_end_at: string;
  ended_at: string | null;
  end_reason: FastEndReason | null;
  note: string | null;
  feelings: FastFeeling[];
  /** While a just-ended fast can still be reopened: until when. */
  undo_until: string | null;
}

export interface ScreeningAnswers {
  under_18: boolean;
  eating_disorder_history: boolean;
  pregnant_or_breastfeeding: boolean;
  diabetes_or_medication: boolean;
}

export type ScreeningOutcome =
  | { passed: false; reason: "UNDER_18" | "EATING_DISORDER_HISTORY" }
  | { passed: true; advice?: "talk_to_doctor" };

export interface FastingSettings {
  fasting_screening: { passed: boolean; at: string; version: number } | null;
}

/** The screening version the API accepts today (FASTING_SCREENING_VERSION). */
export const SCREENING_VERSION = 1;

export interface StartFastInput {
  started_at: string;
  target_hours: number;
  preset: FastingPresetKey;
  note?: string;
}

export interface EditFastInput {
  started_at?: string;
  ended_at?: string;
  target_hours?: number;
  preset?: FastingPresetKey;
  /** An empty string clears the note. */
  note?: string;
}

export interface FastHistoryPage {
  items: FastSession[];
  next_cursor: string | null;
}

export interface FastSummaryDay {
  date: string;
  sessions: number;
  completed: number;
  hours: number;
}

export interface FastSummary {
  tz: string;
  days: FastSummaryDay[];
  totals: { sessions: number; completed: number; hours: number };
}

export const fastingService = {
  /** Sends the answers once. The caller must not keep them. */
  screen: (answers: ScreeningAnswers): Promise<ApiResponse<ScreeningOutcome>> =>
    apiClient.post<ScreeningOutcome>("/fasting/screening", { ...answers, acknowledged: true }),

  settings: (): Promise<ApiResponse<FastingSettings>> => apiClient.get<FastingSettings>("/fasting/settings"),

  start: (input: StartFastInput): Promise<ApiResponse<FastSession>> =>
    apiClient.post<FastSession>("/fasting/sessions", input),

  /** `data` is null when no fast is running. */
  current: (): Promise<ApiResponse<FastSession | null>> => apiClient.get<FastSession | null>("/fasting/sessions/current"),

  history: (limit: number, cursor?: string | null): Promise<ApiResponse<FastHistoryPage>> => {
    const qs = new URLSearchParams({ limit: String(limit) });
    if (cursor) qs.set("cursor", cursor);
    return apiClient.get<FastHistoryPage>(`/fasting/sessions?${qs.toString()}`);
  },

  summary: (from: string, to: string, tz: string): Promise<ApiResponse<FastSummary>> => {
    const qs = new URLSearchParams({ from, to, tz });
    return apiClient.get<FastSummary>(`/fasting/sessions/summary?${qs.toString()}`);
  },

  edit: (id: string, input: EditFastInput): Promise<ApiResponse<FastSession>> =>
    apiClient.patch<FastSession>(`/fasting/sessions/${encodeURIComponent(id)}`, input),

  end: (id: string, endedAt?: string): Promise<ApiResponse<FastSession>> =>
    apiClient.post<FastSession>(`/fasting/sessions/${encodeURIComponent(id)}/end`, endedAt ? { ended_at: endedAt } : {}),

  undoEnd: (id: string): Promise<ApiResponse<FastSession>> =>
    apiClient.post<FastSession>(`/fasting/sessions/${encodeURIComponent(id)}/undo-end`, {}),

  addFeeling: (id: string, value: FastingFeelingValue, at?: string): Promise<ApiResponse<FastSession>> =>
    apiClient.post<FastSession>(`/fasting/sessions/${encodeURIComponent(id)}/feelings`, at ? { value, at } : { value }),

  remove: (id: string): Promise<ApiResponse<{ deleted: boolean }>> =>
    apiClient.delete<{ deleted: boolean }>(`/fasting/sessions/${encodeURIComponent(id)}`),
};

/**
 * The plain sentence for a failed fasting call. Wording is ours (written in
 * fastingCopy.ts), never the server's, so a changed server message cannot
 * change what a member reads.
 */
export function fastingMessage(res: { code?: string; status?: number; message?: string }, fallback: string): string {
  if (res.code && FASTING_ERROR_MESSAGES[res.code]) return FASTING_ERROR_MESSAGES[res.code];
  if (res.status === 429) return "Too many requests. Please wait a moment and try again.";
  if (res.status === undefined || res.status === 0) return "Could not reach Binectics. Check your connection and try again.";
  return fallback;
}
