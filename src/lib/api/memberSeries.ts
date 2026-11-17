import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/*
 * Member series client. Contract: binectics-api #343 (src/member-series).
 * Read-only chart data over the member's own logs, behind `solo_history`
 * (404 while off). A bucket with nothing logged is simply absent: a gap,
 * never a zero.
 *   GET /member-series?metric&from&to&tz&bucket
 *   GET /member-series/weight/compare?tz&period
 */

export type SeriesMetric = "weight" | "fasting_hours" | "water_glasses" | "activity_minutes" | "steps";
export type SeriesBucket = "day" | "week" | "month";
export type ComparePeriod = "4w" | "3m" | "1y";

export interface SeriesPoint {
  start_day: string;
  /** Average for weight and steps, total for the rest. */
  value: number;
  min: number;
  max: number;
  /** How many entries went into the bucket. */
  n: number;
}

export interface SeriesResult {
  metric: SeriesMetric;
  bucket: SeriesBucket;
  tz: string;
  from: string;
  to: string;
  points: SeriesPoint[];
}

export interface WeightCompare {
  tz: string;
  period: ComparePeriod;
  windows: { now: { from: string; to: string }; then: { from: string; to: string } };
  then: { label_days_ago: number; average: number; n: number } | null;
  now: { average: number; n: number } | null;
  /** now minus then, rounded to 0.1 by the API. */
  delta: number | null;
  enough: boolean;
}

export interface SeriesQuery {
  metric: SeriesMetric;
  from: string;
  to: string;
  tz: string;
  bucket?: SeriesBucket;
}

export const memberSeriesService = {
  read: (q: SeriesQuery): Promise<ApiResponse<SeriesResult>> => {
    const qs = new URLSearchParams({ metric: q.metric, from: q.from, to: q.to, tz: q.tz });
    if (q.bucket) qs.set("bucket", q.bucket);
    return apiClient.get<SeriesResult>(`/member-series?${qs.toString()}`);
  },

  compareWeight: (period: ComparePeriod, tz: string): Promise<ApiResponse<WeightCompare>> => {
    const qs = new URLSearchParams({ tz, period });
    return apiClient.get<WeightCompare>(`/member-series/weight/compare?${qs.toString()}`);
  },
};
