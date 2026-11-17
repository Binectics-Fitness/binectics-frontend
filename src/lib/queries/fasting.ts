import { useCallback, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  fastingService,
  fastingMessage,
  type EditFastInput,
  type FastHistoryPage,
  type FastSession,
  type FastSummary,
  type FastingFeelingValue,
  type FastingSettings,
  type ScreeningAnswers,
  type ScreeningOutcome,
  type StartFastInput,
} from "@/lib/api/fasting";
import { SoloApiError } from "./solo";
import type { ApiResponse } from "@/lib/types";

/*
 * Fasting reads and writes. As with the rest of solo web, nothing is queued:
 * a write goes out now or fails plainly (networkMode "always" so react-query
 * never silently pauses a call while the browser says it is offline).
 * Failures carry OUR plain sentence for the API's error code, never the
 * server's wording.
 */

function unwrap<T>(res: ApiResponse<T>, fallback: string): T {
  if (!res.success || res.data === undefined) {
    throw new SoloApiError(fastingMessage(res, fallback), res.status, res.code);
  }
  return res.data;
}

export function useFastingSettings(enabled: boolean) {
  return useQuery<FastingSettings>({
    queryKey: queryKeys.solo.fastingSettings(),
    enabled,
    networkMode: "always",
    queryFn: async () => unwrap(await fastingService.settings(), "We could not load your fasting settings."),
    staleTime: 60_000,
  });
}

/** The running fast, or null. The server's answer; the clock is computed from its start. */
export function useCurrentFast(enabled: boolean) {
  return useQuery<FastSession | null>({
    queryKey: queryKeys.solo.fastingCurrent(),
    enabled,
    networkMode: "always",
    queryFn: async () => {
      const res = await fastingService.current();
      if (!res.success) throw new SoloApiError(fastingMessage(res, "We could not load your fast."), res.status, res.code);
      return res.data ?? null;
    },
    staleTime: 15_000,
    // A fast started or ended on the phone shows up when the tab is looked at again.
    refetchOnWindowFocus: true,
  });
}

/** The one-time safety check. The answers are sent and dropped: only the outcome is returned. */
export function useScreening() {
  const qc = useQueryClient();
  return useMutation<ScreeningOutcome, SoloApiError, ScreeningAnswers>({
    networkMode: "always",
    // The answers are the mutation's variables: drop them from the cache the
    // moment the call settles instead of keeping them for the default 5 minutes.
    gcTime: 0,
    mutationFn: async (answers) => unwrap(await fastingService.screen(answers), "We could not save your check. Try again."),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.solo.fastingSettings() });
    },
  });
}

function afterFastChange(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: queryKeys.solo.fastingHistory() });
  void qc.invalidateQueries({ queryKey: [...queryKeys.solo.all, "fasting", "summary"] });
  void qc.invalidateQueries({ queryKey: [...queryKeys.solo.all, "series"] });
  // Finishing a fast ticks the daily list's fasting line.
  void qc.invalidateQueries({ queryKey: queryKeys.solo.checklistToday() });
}

export function useStartFast() {
  const qc = useQueryClient();
  return useMutation<FastSession, SoloApiError, StartFastInput>({
    networkMode: "always",
    mutationFn: async (input) => unwrap(await fastingService.start(input), "We could not start your fast. Try again."),
    onSuccess: (fast) => {
      qc.setQueryData(queryKeys.solo.fastingCurrent(), fast);
      afterFastChange(qc);
    },
  });
}

export function useEndFast() {
  const qc = useQueryClient();
  return useMutation<FastSession, SoloApiError, { id: string; endedAt?: string }>({
    networkMode: "always",
    mutationFn: async ({ id, endedAt }) => unwrap(await fastingService.end(id, endedAt), "We could not end your fast. Try again."),
    onSuccess: () => {
      qc.setQueryData(queryKeys.solo.fastingCurrent(), null);
      afterFastChange(qc);
    },
    onError: (e) => {
      // The fast may have changed elsewhere: look again.
      if (e.code === "FASTING_BAD_STATE" || e.code === "FASTING_SESSION_NOT_FOUND") {
        void qc.invalidateQueries({ queryKey: queryKeys.solo.fastingCurrent() });
      }
    },
  });
}

/**
 * Undo an end. OPTIMISTIC: the reopened fast shows at once as the running one
 * and, if the server refuses (window over, another fast started), the cache is
 * put back exactly as it was and the page says why.
 */
export function useUndoEnd() {
  const qc = useQueryClient();
  const key = queryKeys.solo.fastingCurrent();
  return useMutation<FastSession, SoloApiError, FastSession, { previous: FastSession | null | undefined }>({
    networkMode: "always",
    mutationFn: async (ended) => unwrap(await fastingService.undoEnd(ended.id), "We could not undo that. Try again."),
    onMutate: async (ended) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<FastSession | null>(key);
      qc.setQueryData<FastSession | null>(key, { ...ended, ended_at: null, end_reason: null, status: "running", undo_until: null });
      return { previous };
    },
    onError: (_e, _ended, ctx) => {
      qc.setQueryData(key, ctx?.previous ?? null);
    },
    onSuccess: (fast) => {
      qc.setQueryData(key, fast);
      afterFastChange(qc);
    },
  });
}

export function useAddFeeling() {
  const qc = useQueryClient();
  return useMutation<FastSession, SoloApiError, { id: string; value: FastingFeelingValue }>({
    networkMode: "always",
    mutationFn: async ({ id, value }) => unwrap(await fastingService.addFeeling(id, value), "We could not save that. Try again."),
    onSuccess: (fast) => {
      qc.setQueryData(queryKeys.solo.fastingCurrent(), fast);
    },
  });
}

export function useEditFast() {
  const qc = useQueryClient();
  return useMutation<FastSession, SoloApiError, { id: string; input: EditFastInput }>({
    networkMode: "always",
    mutationFn: async ({ id, input }) => unwrap(await fastingService.edit(id, input), "We could not save your changes. Try again."),
    onSuccess: (fast) => {
      qc.setQueryData<FastSession | null>(queryKeys.solo.fastingCurrent(), (cur) => (cur && cur.id === fast.id ? fast : cur));
      afterFastChange(qc);
    },
  });
}

export function useDeleteFast() {
  const qc = useQueryClient();
  return useMutation<{ deleted: boolean }, SoloApiError, string>({
    networkMode: "always",
    mutationFn: async (id) => unwrap(await fastingService.remove(id), "We could not delete this fast. Try again."),
    onSuccess: () => afterFastChange(qc),
  });
}

export const HISTORY_PAGE_SIZE = 10;

/** Finished fasts, newest first, one cursor page at a time ("Show more"). */
export function useFastHistory(enabled: boolean) {
  return useInfiniteQuery<FastHistoryPage, SoloApiError, { pages: FastHistoryPage[] }, readonly unknown[], string | null>({
    queryKey: queryKeys.solo.fastingHistory(),
    enabled,
    networkMode: "always",
    initialPageParam: null,
    queryFn: async ({ pageParam }) => unwrap(await fastingService.history(HISTORY_PAGE_SIZE, pageParam), "We could not load your fasts."),
    getNextPageParam: (last) => last.next_cursor,
  });
}

export function useFastSummary(from: string, to: string, tz: string, enabled: boolean) {
  return useQuery<FastSummary>({
    queryKey: queryKeys.solo.fastingSummary(from, to, tz),
    enabled,
    networkMode: "always",
    queryFn: async () => unwrap(await fastingService.summary(from, to, tz), "We could not load your week."),
    staleTime: 30_000,
  });
}

/** A tiny helper the pages share: a message that can be shown, dismissed and replaced. */
export function useMessage() {
  const [message, setMessage] = useState<string | null>(null);
  const clear = useCallback(() => setMessage(null), []);
  return { message, setMessage, clear };
}
