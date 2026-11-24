import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { SoloApiError } from "./solo";
import {
  memberNotesService,
  noteErrorMessage,
  NOTES_PAGE,
  type CreateNoteInput,
  type MemberNote,
  type NotesPage,
  type UpdateNoteInput,
} from "@/lib/api/memberNotes";
import {
  goalErrorMessage,
  memberGoalsService,
  type CreateGoalInput,
  type GoalProgress,
  type MemberGoal,
  type UpdateGoalInput,
  type WeekStart,
} from "@/lib/api/memberGoals";
import { HISTORY_PAGE, memberHistoryService, type HistoryKind, type HistoryPage } from "@/lib/api/memberHistory";
import { deviceTimeZone } from "@/lib/solo/time";
import type { ApiResponse } from "@/lib/types";

/*
 * The member's own records: journal notes, goals and the combined history.
 * Same rules as the other solo pages: nothing is queued, a write goes out now
 * or fails plainly (networkMode "always"), and failures carry OUR sentence for
 * the API's code, never the server's wording. Keys live here, not in keys.ts.
 */

export const recordKeys = {
  all: ["own-records"] as const,
  notes: () => [...recordKeys.all, "notes"] as const,
  goals: () => [...recordKeys.all, "goals"] as const,
  goalProgress: (tz: string) => [...recordKeys.all, "goals", "progress", tz] as const,
  history: (kinds: readonly HistoryKind[] | null, tz: string) =>
    [...recordKeys.all, "history", kinds ? kinds.join(",") : "all", tz] as const,
};

function unwrapWith<T>(res: ApiResponse<T>, message: (r: ApiResponse<T>) => string): T {
  if (!res.success || res.data === undefined) throw new SoloApiError(message(res), res.status, res.code);
  return res.data;
}

// ─── Journal ────────────────────────────────────────────────────────────

export function useNotes(enabled = true) {
  return useInfiniteQuery<NotesPage, SoloApiError>({
    queryKey: recordKeys.notes(),
    enabled,
    networkMode: "always",
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      unwrapWith(await memberNotesService.list({ limit: NOTES_PAGE, cursor: pageParam as string | undefined }), (r) =>
        noteErrorMessage(r, "We could not load your notes."),
      ),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    staleTime: 30_000,
  });
}

/** A note change also changes the history timeline. */
function afterNoteChange(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: recordKeys.notes() });
  void qc.invalidateQueries({ queryKey: [...recordKeys.all, "history"] });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation<MemberNote, SoloApiError, Omit<CreateNoteInput, "tz">>({
    networkMode: "always",
    mutationFn: async (input) =>
      unwrapWith(await memberNotesService.create({ ...input, tz: deviceTimeZone() }), (r) =>
        noteErrorMessage(r, "The note could not be saved. Try again."),
      ),
    onSuccess: () => afterNoteChange(qc),
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation<MemberNote, SoloApiError, { id: string; input: UpdateNoteInput }>({
    networkMode: "always",
    mutationFn: async ({ id, input }) =>
      unwrapWith(await memberNotesService.update(id, input), (r) => noteErrorMessage(r, "The note could not be changed. Try again.")),
    onSuccess: () => afterNoteChange(qc),
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation<void, SoloApiError, string>({
    networkMode: "always",
    mutationFn: async (id) => {
      const res = await memberNotesService.remove(id);
      if (!res.success) throw new SoloApiError(noteErrorMessage(res, "The note could not be deleted. Try again."), res.status, res.code);
    },
    onSuccess: () => afterNoteChange(qc),
  });
}

// ─── Goals ──────────────────────────────────────────────────────────────

/** Every goal, archived included; the page splits them on `active`. */
export function useGoals(enabled = true) {
  return useQuery<MemberGoal[], SoloApiError>({
    queryKey: recordKeys.goals(),
    enabled,
    networkMode: "always",
    queryFn: async () => unwrapWith(await memberGoalsService.list(true), (r) => goalErrorMessage(r, "We could not load your goals.")),
    staleTime: 30_000,
  });
}

/** This week's counts, from the member's real logs. */
export function useGoalProgress(enabled = true) {
  const tz = deviceTimeZone();
  return useQuery<GoalProgress, SoloApiError>({
    queryKey: recordKeys.goalProgress(tz),
    enabled,
    networkMode: "always",
    queryFn: async () => unwrapWith(await memberGoalsService.progress(tz), (r) => goalErrorMessage(r, "We could not load this week.")),
    staleTime: 30_000,
  });
}

function afterGoalChange(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: recordKeys.goals() });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation<MemberGoal, SoloApiError, CreateGoalInput>({
    networkMode: "always",
    mutationFn: async (input) =>
      unwrapWith(await memberGoalsService.create(input), (r) => goalErrorMessage(r, "The goal could not be added. Try again.")),
    onSuccess: () => afterGoalChange(qc),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation<MemberGoal, SoloApiError, { id: string; input: UpdateGoalInput; failed?: string }>({
    networkMode: "always",
    mutationFn: async ({ id, input, failed }) =>
      unwrapWith(await memberGoalsService.update(id, input), (r) =>
        goalErrorMessage(r, failed ?? "The goal could not be changed. Try again."),
      ),
    onSuccess: () => afterGoalChange(qc),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation<void, SoloApiError, string>({
    networkMode: "always",
    mutationFn: async (id) => {
      const res = await memberGoalsService.remove(id);
      if (!res.success) throw new SoloApiError(goalErrorMessage(res, "The goal could not be deleted. Try again."), res.status, res.code);
    },
    onSuccess: () => afterGoalChange(qc),
  });
}

/** The member's week start. The same setting the visits strip and home read. */
export function useSetWeekStart() {
  const qc = useQueryClient();
  return useMutation<unknown, SoloApiError, WeekStart>({
    networkMode: "always",
    mutationFn: async (week_start) =>
      unwrapWith(await memberGoalsService.updateSettings({ week_start }), (r) =>
        goalErrorMessage(r, "That could not be saved. Try again."),
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [...recordKeys.all, "goals", "progress"] });
      void qc.invalidateQueries({ queryKey: queryKeys.solo.settings() });
    },
  });
}

// ─── History ────────────────────────────────────────────────────────────

/** One page per read, newest first; `kinds` null is every kind. */
export function useHistory(kinds: readonly HistoryKind[] | null, enabled = true) {
  const tz = deviceTimeZone();
  return useInfiniteQuery<HistoryPage, SoloApiError>({
    queryKey: recordKeys.history(kinds, tz),
    enabled,
    networkMode: "always",
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) =>
      unwrapWith(
        await memberHistoryService.read({ tz, types: kinds, limit: HISTORY_PAGE, cursor: pageParam as string | undefined }),
        (r) => (r.status === undefined || r.status === 0 ? "Could not reach Binectics. Check your connection and try again." : "We could not load your history."),
      ),
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    staleTime: 30_000,
  });
}
