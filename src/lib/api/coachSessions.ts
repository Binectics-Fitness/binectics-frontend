/**
 * Coach Session Mode, read side (API module `coach-sessions`, spec
 * COACH-SESSION-MODE-SPEC section 11). Every field is snake_case. The live
 * logger is phone-only, so the web only reads logs.
 *
 * Two shapes, on purpose: the PROVIDER log carries the private note and
 * readiness; the CLIENT summary never does (the API strips them). The client
 * types here have no field for either, so a page built from them cannot show
 * what the API did not send.
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

export type PainArea =
  | "neck"
  | "shoulder_l"
  | "shoulder_r"
  | "back"
  | "hip"
  | "knee_l"
  | "knee_r"
  | "ankle"
  | "wrist"
  | "other";

export interface LoggedSet {
  index: number;
  reps: number | null;
  load_kg: number | null;
  seconds: number | null;
  distance_m: number | null;
  rpe: number | null;
  done: boolean;
  logged_at: string | null;
}

export interface LoggedExercise {
  order: number;
  name: string;
  key: string;
  swapped_from: string | null;
  skipped: boolean;
  skip_reason: string | null;
  note: string | null;
  sets: LoggedSet[];
}

export interface PainFlag {
  area: PainArea;
  exercise_key: string | null;
  note: string | null;
}

export interface WeighIn {
  weight_kg: number;
  recorded_at: string | null;
}

export interface SuggestedNext {
  starts_at: string | null;
  consultation_type_id: string | null;
}

/** A session log as its trainer reads it (GET /coach-sessions). */
export interface CoachSessionLog {
  id: string;
  local_id: string;
  status: "in_progress" | "completed" | "discarded";
  client_id: string | null;
  client_profile_id: string | null;
  booking_id: string | null;
  started_at: string;
  ended_at: string | null;
  completed_at: string | null;
  readiness: { energy: "low" | "ok" | "good" | null; pain_today: boolean | null } | null;
  exercises: LoggedExercise[];
  pain_flags: PainFlag[];
  shared_note: string | null;
  /** Trainer only. Never in the client read. */
  private_note: string | null;
  weigh_in: WeighIn | null;
  suggested_next: SuggestedNext | null;
}

export interface ClientSessionExercise extends LoggedExercise {
  /** Beats every earlier session of this exercise. A plain fact, no badge. */
  best_so_far: boolean;
}

/** A session as its client reads it (GET /me/coach-sessions). */
export interface ClientSessionSummary {
  id: string;
  status: string;
  provider: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    profile_picture: string | null;
  } | null;
  booking_id: string | null;
  started_at: string;
  ended_at: string | null;
  completed_at: string | null;
  exercises: ClientSessionExercise[];
  pain_flags: PainFlag[];
  shared_note: string | null;
  weigh_in: WeighIn | null;
  suggested_next: SuggestedNext | null;
}

export const coachSessionsService = {
  /** One client's logs, newest first. Trainer only. */
  listForClient(clientProfileId: string, limit = 20): Promise<ApiResponse<{ items: CoachSessionLog[] }>> {
    const q = new URLSearchParams({ clientProfileId, limit: String(limit) });
    return apiClient.get<{ items: CoachSessionLog[] }>(`/coach-sessions?${q.toString()}`);
  },

  /** One of the trainer's own logs, by id. */
  get(id: string): Promise<ApiResponse<CoachSessionLog>> {
    return apiClient.get<CoachSessionLog>(`/coach-sessions/${encodeURIComponent(id)}`);
  },

  /** The signed-in member's completed sessions, newest first. */
  listMine(limit = 20): Promise<ApiResponse<{ items: ClientSessionSummary[] }>> {
    return apiClient.get<{ items: ClientSessionSummary[] }>(`/me/coach-sessions?limit=${limit}`);
  },

  /** One of the member's own summaries. */
  getMine(id: string): Promise<ApiResponse<ClientSessionSummary>> {
    return apiClient.get<ClientSessionSummary>(`/me/coach-sessions/${encodeURIComponent(id)}`);
  },
};
