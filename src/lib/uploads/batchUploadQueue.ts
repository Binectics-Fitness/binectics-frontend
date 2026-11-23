import type { ApiResponse } from "@/lib/types";

/**
 * Uploads a pile of files to an endpoint that takes several files per request
 * but only a few requests a minute (the listing gallery: 10 files a request,
 * `@Throttle` 5 a minute). Dropping 11 photos used to lose the ones a 429
 * refused; here every file is sent, in batches, paced to the limit, and a
 * refused batch waits for the window and is sent again.
 *
 * Pacing is a sliding window shared by everything using the same `key`, so
 * two drops in quick succession still respect one limit. The API's 429 also
 * says how long to wait (Retry-After), which wins over our own count: it
 * knows about requests from other tabs.
 */

export type FileUploadStatus = "queued" | "uploading" | "waiting" | "done" | "failed";

export interface FileProgress {
  status: FileUploadStatus;
  /** Why it failed, or when the wait ends (epoch ms) while waiting. */
  message?: string;
  resumeAt?: number;
}

export interface BatchUploadOptions {
  /** Pacing window shared by every queue with this key (e.g. one per gallery). */
  key: string;
  /** Most files one request takes. */
  batchSize: number;
  /** Requests allowed per window. */
  limit: number;
  windowMs: number;
  /** How often one batch is retried after a 429 before it is given up. */
  maxRetries?: number;
  /** Fired whenever a file's status changes, by its index in `files`. */
  onProgress?: (index: number, progress: FileProgress) => void;
  /** Fired after each batch the API accepted. */
  onBatchDone?: () => void;
  /** Test seams. */
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

export interface BatchUploadResult {
  uploaded: number;
  /** Indexes into `files` that never made it, with the reason. */
  failed: { index: number; message: string }[];
}

const windows = new Map<string, number[]>();

/** Clears every pacing window. Tests only. */
export function resetUploadWindows() {
  windows.clear();
}

function stampsFor(key: string, now: number, windowMs: number): number[] {
  const live = (windows.get(key) ?? []).filter((t) => now - t < windowMs);
  windows.set(key, live);
  return live;
}

/** How long until another request fits in the window (0 = now). */
export function waitForSlot(key: string, limit: number, windowMs: number, now: number): number {
  const stamps = stampsFor(key, now, windowMs);
  if (stamps.length < limit) return 0;
  return Math.max(0, stamps[stamps.length - limit] + windowMs - now);
}

function record(key: string, now: number) {
  const stamps = windows.get(key) ?? [];
  stamps.push(now);
  windows.set(key, stamps);
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function uploadInBatches<T>(
  files: File[],
  send: (batch: File[]) => Promise<ApiResponse<T>>,
  opts: BatchUploadOptions,
): Promise<BatchUploadResult> {
  const now = opts.now ?? Date.now;
  const sleep = opts.sleep ?? defaultSleep;
  const maxRetries = opts.maxRetries ?? 3;
  const report = (indexes: number[], p: FileProgress) =>
    indexes.forEach((i) => opts.onProgress?.(i, p));

  const batches: number[][] = [];
  for (let i = 0; i < files.length; i += opts.batchSize) {
    batches.push(files.slice(i, i + opts.batchSize).map((_, j) => i + j));
  }
  report(files.map((_, i) => i), { status: "queued" });

  let uploaded = 0;
  const failed: BatchUploadResult["failed"] = [];

  for (const indexes of batches) {
    let attempts = 0;
    for (;;) {
      const wait = waitForSlot(opts.key, opts.limit, opts.windowMs, now());
      if (wait > 0) {
        report(indexes, { status: "waiting", resumeAt: now() + wait });
        await sleep(wait);
      }
      report(indexes, { status: "uploading" });
      record(opts.key, now());
      let res: ApiResponse<T>;
      try {
        res = await send(indexes.map((i) => files[i]));
      } catch {
        res = { success: false, message: "Upload failed. Check your connection." };
      }
      if (res.success) {
        uploaded += indexes.length;
        report(indexes, { status: "done" });
        opts.onBatchDone?.();
        break;
      }
      if (res.status === 429 && attempts < maxRetries) {
        attempts += 1;
        // The API's own count wins: it sees other tabs and devices too.
        const retryAfter = Number(res.details?.retry_after_seconds);
        const ms =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1000
            : Math.max(waitForSlot(opts.key, opts.limit, opts.windowMs, now()), opts.windowMs / opts.limit);
        report(indexes, { status: "waiting", resumeAt: now() + ms });
        await sleep(ms);
        continue;
      }
      const message = res.message || "Upload failed.";
      report(indexes, { status: "failed", message });
      indexes.forEach((index) => failed.push({ index, message }));
      break;
    }
  }

  return { uploaded, failed };
}
