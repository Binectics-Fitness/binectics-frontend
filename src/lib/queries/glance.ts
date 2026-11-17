import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  memberSeriesService,
  type ComparePeriod,
  type SeriesBucket,
  type SeriesMetric,
  type SeriesResult,
  type WeightCompare,
} from "@/lib/api/memberSeries";
import {
  memberTargetsService,
  type MemberTargets,
  type UpdateTargetsInput,
} from "@/lib/api/memberTargets";
import { SoloApiError } from "./solo";
import type { ApiResponse } from "@/lib/types";

/*
 * The glance reads (series, weight compare) and targets. Same rules as the
 * rest of solo web: nothing queued, failures plain, no cached numbers shown
 * as if fresh (the pages say when they are showing something loaded earlier).
 */

function unwrap<T>(res: ApiResponse<T>, fallback: string): T {
  if (!res.success || res.data === undefined) throw new SoloApiError(res.message || fallback, res.status, res.code);
  return res.data;
}

export function useSeries(opts: {
  metric: SeriesMetric;
  from: string;
  to: string;
  tz: string;
  bucket?: SeriesBucket;
  enabled: boolean;
}) {
  const bucket = opts.bucket ?? "day";
  return useQuery<SeriesResult>({
    queryKey: queryKeys.solo.series(opts.metric, opts.from, opts.to, opts.tz, bucket),
    enabled: opts.enabled,
    networkMode: "always",
    queryFn: async () =>
      unwrap(
        await memberSeriesService.read({ metric: opts.metric, from: opts.from, to: opts.to, tz: opts.tz, bucket }),
        "We could not load this.",
      ),
    staleTime: 30_000,
  });
}

export function useWeightCompare(period: ComparePeriod, tz: string, enabled: boolean) {
  return useQuery<WeightCompare>({
    queryKey: queryKeys.solo.weightCompare(period, tz),
    enabled,
    networkMode: "always",
    queryFn: async () => unwrap(await memberSeriesService.compareWeight(period, tz), "We could not load your weight."),
    staleTime: 30_000,
  });
}

export function useTargets(enabled: boolean) {
  return useQuery<MemberTargets>({
    queryKey: queryKeys.solo.targets(),
    enabled,
    networkMode: "always",
    queryFn: async () => unwrap(await memberTargetsService.get(), "We could not load your targets."),
  });
}

/** PATCH one or more targets (null clears one). Never calls the clear-everything DELETE. */
export function useUpdateTargets() {
  const qc = useQueryClient();
  return useMutation<MemberTargets, SoloApiError, UpdateTargetsInput>({
    networkMode: "always",
    mutationFn: async (input) => unwrap(await memberTargetsService.update(input), "That could not be saved. Try again."),
    onSuccess: (targets) => {
      qc.setQueryData(queryKeys.solo.targets(), targets);
      // The water aim is the same value as the water setting.
      void qc.invalidateQueries({ queryKey: queryKeys.solo.waterSettings() });
      void qc.invalidateQueries({ queryKey: queryKeys.solo.waterToday() });
    },
  });
}
