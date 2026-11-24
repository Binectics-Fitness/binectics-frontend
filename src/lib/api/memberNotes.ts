import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/*
 * The member's own private notes (the journal). Contract: binectics-api
 * src/member-journal, the same routes mobile calls (src/api/memberNotes.ts).
 *   POST   /member-notes        { body, mood?, tz, client_op_id? }   5 a day, 1000 in all
 *   GET    /member-notes        ?limit&cursor   newest first, { items, next_cursor }
 *   PATCH  /member-notes/:id    { body?, mood? (null clears) }
 *   DELETE /member-notes/:id
 * There is no route that shares a note: it is never visible to anyone else.
 * A note's text is free text from a person: it is never logged here.
 */

export const NOTE_MAX_CHARS = 2000;
export const NOTES_PER_DAY = 5;
export const NOTES_TOTAL = 1000;
export const NOTES_PAGE = 20;

export type NoteMood = "good" | "okay" | "tired" | "low";
export const NOTE_MOODS: readonly NoteMood[] = ["good", "okay", "tired", "low"];

export interface MemberNote {
  id: string;
  /** The member's local calendar day, "YYYY-MM-DD". */
  local_day: string;
  body: string;
  mood: NoteMood | null;
  linked_kind: "fast" | "starter_session" | "activity" | "other" | null;
  linked_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface NotesPage {
  items: MemberNote[];
  next_cursor: string | null;
}

export interface CreateNoteInput {
  body: string;
  mood?: NoteMood;
  tz: string;
  /** A unique id per create: a retry of the same save adds nothing. */
  client_op_id?: string;
}

export interface UpdateNoteInput {
  body?: string;
  /** null clears the mood. */
  mood?: NoteMood | null;
}

export const memberNotesService = {
  create: (input: CreateNoteInput): Promise<ApiResponse<MemberNote>> =>
    apiClient.post<MemberNote>("/member-notes", input),

  list: (params: { limit?: number; cursor?: string } = {}): Promise<ApiResponse<NotesPage>> => {
    const qs = new URLSearchParams({ limit: String(params.limit ?? NOTES_PAGE) });
    if (params.cursor) qs.set("cursor", params.cursor);
    return apiClient.get<NotesPage>(`/member-notes?${qs.toString()}`);
  },

  update: (id: string, input: UpdateNoteInput): Promise<ApiResponse<MemberNote>> =>
    apiClient.patch<MemberNote>(`/member-notes/${encodeURIComponent(id)}`, input),

  remove: (id: string): Promise<ApiResponse<unknown>> =>
    apiClient.delete<unknown>(`/member-notes/${encodeURIComponent(id)}`),
};

/** A plain sentence for a failed notes call, independent of the server's wording. */
export function noteErrorMessage(
  res: Pick<ApiResponse, "code" | "status" | "message">,
  fallback = "Something went wrong. Try again.",
): string {
  if (res.code === "JOURNAL_LIMIT_REACHED") {
    return /1000/.test(String(res.message ?? ""))
      ? "You have 1000 notes, the most we can keep. Delete one to write another."
      : "You have written 5 notes today, the most for one day. You can write more tomorrow.";
  }
  if (res.code === "JOURNAL_NOTE_NOT_FOUND") return "That note is no longer there.";
  if (res.status === undefined || res.status === 0) return "Could not reach Binectics. Check your connection and try again.";
  if (res.status === 429) return "Too many changes. Wait a moment and try again.";
  return fallback;
}
