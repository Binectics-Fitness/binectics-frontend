import { useCallback, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { waterService, type WaterAdjusted, type WaterToday, type UpdateWaterSettingsInput } from "@/lib/api/water";
import {
  checklistService,
  type ChecklistItem,
  type ChecklistItems,
  type ChecklistSystemKey,
  type ChecklistToday,
  type CreateChecklistItemInput,
  type UpdateChecklistItemInput,
} from "@/lib/api/checklist";
import { progressService, type WeightLog } from "@/lib/api/progress";
import { applyDelta, inverse } from "@/lib/solo/waterModel";
import { withTick } from "@/lib/solo/checklistModel";
import { deviceTimeZone, newOpId } from "@/lib/solo/time";
import type { ApiResponse } from "@/lib/types";

/*
 * networkMode "always": react-query would otherwise PAUSE a read or write while
 * the browser says it is offline, leaving a page that neither loads nor errors.
 * These calls run and fail plainly instead, and the pages say what happened.
 */

/** A failed read throws, so the page shows its error state, never an empty one. */
export class SoloApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

function unwrap<T>(res: ApiResponse<T>, fallback: string): T {
  if (!res.success || res.data === undefined) throw new SoloApiError(res.message || fallback, res.status, res.code);
  return res.data;
}

// ─── Water ──────────────────────────────────────────────────────────────

export function useWaterToday(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.solo.waterToday(),
    enabled,
    networkMode: "always",
    queryFn: async () => unwrap(await waterService.today(deviceTimeZone()), "Could not load your water."),
    staleTime: 30_000,
  });
}

export interface PendingTap {
  delta: 1 | -1;
  opId: string;
}

/**
 * The water counter: optimistic taps with rollback. Each tap carries its own
 * client_op_id; a failed tap is rolled back by its inverse (so a later tap that
 * did succeed is untouched) and kept as `failed`, so "Try again" resends the
 * SAME op id: a glass is never counted twice, and the page never says it
 * saved when it did not.
 */
export function useWaterCounter(enabled: boolean) {
  const qc = useQueryClient();
  const key = queryKeys.solo.waterToday();
  const query = useWaterToday(enabled);
  const [failed, setFailed] = useState<PendingTap | null>(null);
  const inFlight = useRef(0);

  const mutation = useMutation<WaterAdjusted, SoloApiError, PendingTap, { rolledBack: boolean }>({
    mutationKey: ["solo", "water", "adjust"],
    networkMode: "always",
    mutationFn: async (tap) =>
      unwrap(
        await waterService.adjust({ delta: tap.delta, tz: deviceTimeZone(), client_op_id: tap.opId }),
        "We could not save that glass.",
      ),
    onMutate: async (tap) => {
      inFlight.current += 1;
      setFailed(null);
      await qc.cancelQueries({ queryKey: key });
      qc.setQueryData<WaterToday>(key, (cur) => (cur ? applyDelta(cur, tap.delta) : cur));
      return { rolledBack: false };
    },
    onError: (_err, tap) => {
      qc.setQueryData<WaterToday>(key, (cur) => (cur ? applyDelta(cur, inverse(tap.delta)) : cur));
      setFailed(tap);
    },
    onSuccess: (data) => {
      // With more taps in flight the server value is not the final one yet.
      if (inFlight.current <= 1) {
        const { applied: _applied, ...today } = data;
        void _applied;
        qc.setQueryData<WaterToday>(key, today);
      }
    },
    onSettled: () => {
      inFlight.current = Math.max(0, inFlight.current - 1);
      // Water ticks the daily list's tool line; keep it honest.
      void qc.invalidateQueries({ queryKey: queryKeys.solo.checklistToday() });
    },
  });

  const tap = useCallback(
    (delta: 1 | -1) => mutation.mutate({ delta, opId: newOpId() }),
    [mutation],
  );
  const retry = useCallback(() => {
    if (failed) mutation.mutate(failed);
  }, [failed, mutation]);
  const dismiss = useCallback(() => setFailed(null), []);

  return { query, tap, retry, dismiss, failed, failedMessage: failed ? mutation.error?.message : undefined };
}

export function useWaterSettings(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.solo.waterSettings(),
    enabled,
    networkMode: "always",
    queryFn: async () => unwrap(await waterService.getSettings(), "Could not load your water aim."),
  });
}

export function useUpdateWaterSettings() {
  const qc = useQueryClient();
  return useMutation({
    networkMode: "always",
    mutationFn: async (input: UpdateWaterSettingsInput) =>
      unwrap(await waterService.updateSettings(input), "Could not save your aim."),
    onSuccess: (settings) => {
      qc.setQueryData(queryKeys.solo.waterSettings(), settings);
      qc.setQueryData<WaterToday>(queryKeys.solo.waterToday(), (cur) =>
        cur ? { ...cur, target_glasses: settings.target_glasses, glass_ml: settings.glass_ml } : cur,
      );
      void qc.invalidateQueries({ queryKey: queryKeys.solo.checklistToday() });
    },
  });
}

// ─── Daily list ─────────────────────────────────────────────────────────

export function useChecklistToday(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.solo.checklistToday(),
    enabled,
    networkMode: "always",
    queryFn: async () => unwrap(await checklistService.today(deviceTimeZone()), "Could not load your list."),
    staleTime: 30_000,
  });
}

export function useChecklistItems(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.solo.checklistItems(),
    enabled,
    networkMode: "always",
    queryFn: async () => unwrap(await checklistService.list(), "Could not load your lines."),
  });
}

/** Tick or untick one custom line, optimistic, rolled back when the write fails. */
export function useTickItem() {
  const qc = useQueryClient();
  const key = queryKeys.solo.checklistToday();
  return useMutation<unknown, SoloApiError, { id: string; done: boolean }>({
    mutationKey: ["solo", "checklist", "tick"],
    networkMode: "always",
    mutationFn: async ({ id, done }) => {
      const tz = deviceTimeZone();
      return unwrap(
        done ? await checklistService.complete(id, tz) : await checklistService.uncomplete(id, tz),
        "We could not save that tick.",
      );
    },
    onMutate: async ({ id, done }) => {
      await qc.cancelQueries({ queryKey: key });
      qc.setQueryData<ChecklistToday>(key, (cur) => (cur ? withTick(cur, id, done) : cur));
    },
    onError: (_e, { id, done }) => {
      qc.setQueryData<ChecklistToday>(key, (cur) => (cur ? withTick(cur, id, !done) : cur));
    },
    onSettled: () => {
      if (qc.isMutating({ mutationKey: ["solo", "checklist", "tick"] }) <= 1) {
        void qc.invalidateQueries({ queryKey: key });
      }
    },
  });
}

function useListWrite<V, R>(fn: (v: V) => Promise<ApiResponse<R>>, fallback: string) {
  const qc = useQueryClient();
  return useMutation<R, SoloApiError, V>({
    networkMode: "always",
    mutationFn: async (v) => unwrap(await fn(v), fallback),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.solo.checklistItems() });
      void qc.invalidateQueries({ queryKey: queryKeys.solo.checklistToday() });
    },
  });
}

export const useCreateItem = () =>
  useListWrite<CreateChecklistItemInput, ChecklistItem>((v) => checklistService.create(v), "Could not add that line.");

export const useUpdateItem = () =>
  useListWrite<{ id: string; input: UpdateChecklistItemInput }, ChecklistItem>(
    ({ id, input }) => checklistService.update(id, input),
    "Could not change that line.",
  );

export const useRemoveItem = () =>
  useListWrite<string, { removed: boolean }>((id) => checklistService.remove(id), "Could not remove that line.");

export const useAddSystemLine = () =>
  useListWrite<ChecklistSystemKey, ChecklistItem>((k) => checklistService.addSystem(k), "Could not turn that line on.");

export const useRemoveSystemLine = () =>
  useListWrite<ChecklistSystemKey, { removed: boolean }>(
    (k) => checklistService.removeSystem(k),
    "Could not turn that line off.",
  );

export type { ChecklistItems, ChecklistToday };

// ─── Weight (existing reader) ───────────────────────────────────────────

/**
 * The latest weight from the existing weight log: the member's own client
 * profile, newest entry. Null when there is no profile or no entry yet (a
 * member who never logged has no profile, and none is created by reading).
 */
export function useLatestWeight(enabled: boolean) {
  return useQuery<WeightLog | null>({
    queryKey: queryKeys.solo.latestWeight(),
    enabled,
    networkMode: "always",
    queryFn: async () => {
      const profiles = unwrap(await progressService.getMyOwnProfiles(), "Could not load your weight.");
      const id = profiles[0]?._id;
      if (!id) return null;
      const logs = unwrap(await progressService.getWeightLogs(id, 1), "Could not load your weight.");
      return logs[0] ?? null;
    },
    staleTime: 60_000,
  });
}
