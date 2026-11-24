import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  uploadInBatches,
  resetUploadWindows,
  waitForSlot,
  type FileProgress,
} from "./batchUploadQueue";

const file = (n: number) => new File(["x"], `p${n}.jpg`, { type: "image/jpeg" });
const files = (count: number) => Array.from({ length: count }, (_, i) => file(i));

/** A fake clock: sleep advances time instead of waiting. */
function clock() {
  let t = 1_000_000;
  const slept: number[] = [];
  return {
    now: () => t,
    sleep: async (ms: number) => {
      slept.push(ms);
      t += ms;
    },
    slept,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

const pacing = { batchSize: 10, limit: 5, windowMs: 60_000 };

describe("uploadInBatches", () => {
  beforeEach(() => resetUploadWindows());

  it("sends 11 files as two requests of at most 10, with no waiting", async () => {
    const c = clock();
    const send = vi.fn().mockResolvedValue({ success: true });
    const res = await uploadInBatches(files(11), send, { key: "g", ...pacing, now: c.now, sleep: c.sleep });
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][0]).toHaveLength(10);
    expect(send.mock.calls[1][0]).toHaveLength(1);
    expect(res).toEqual({ uploaded: 11, failed: [] });
    expect(c.slept).toEqual([]);
  });

  it("paces requests to the limit instead of firing a sixth one into a 429", async () => {
    const c = clock();
    const sentAt: number[] = [];
    const send = vi.fn(async () => {
      sentAt.push(c.now());
      return { success: true };
    });
    // One file per request (batchSize 1) makes 11 requests against 5 a minute.
    await uploadInBatches(files(11), send, { key: "g", ...pacing, batchSize: 1, now: c.now, sleep: c.sleep });
    expect(send).toHaveBeenCalledTimes(11);
    // No 60-second window ever holds more than 5 requests.
    for (const t of sentAt) {
      expect(sentAt.filter((s) => s >= t && s < t + 60_000).length).toBeLessThanOrEqual(5);
    }
    expect(c.slept.length).toBeGreaterThan(0);
  });

  it("shares one window between uploads with the same key", async () => {
    const c = clock();
    const send = vi.fn().mockResolvedValue({ success: true });
    await uploadInBatches(files(5), send, { key: "g", ...pacing, batchSize: 1, now: c.now, sleep: c.sleep });
    expect(waitForSlot("g", 5, 60_000, c.now())).toBeGreaterThan(0);
    expect(waitForSlot("other", 5, 60_000, c.now())).toBe(0);
  });

  it("waits Retry-After on a 429 and sends the same files again", async () => {
    const c = clock();
    const send = vi
      .fn()
      .mockResolvedValueOnce({ success: false, status: 429, message: "Too many requests", details: { retry_after_seconds: 42 } })
      .mockResolvedValue({ success: true });
    const progress: FileProgress[] = [];
    const res = await uploadInBatches(files(3), send, {
      key: "g",
      ...pacing,
      now: c.now,
      sleep: c.sleep,
      onProgress: (i, p) => i === 0 && progress.push(p),
    });
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0]).toEqual(send.mock.calls[0][0]);
    expect(c.slept).toContain(42_000);
    expect(progress.map((p) => p.status)).toEqual(["queued", "uploading", "waiting", "uploading", "done"]);
    expect(res.failed).toEqual([]);
  });

  it("marks a batch failed after repeated 429s and carries on with the next", async () => {
    const c = clock();
    const send = vi.fn(async (batch: File[]) =>
      batch.length === 10
        ? { success: false, status: 429, message: "Too many requests" }
        : { success: true },
    );
    const res = await uploadInBatches(files(11), send, { key: "g", ...pacing, maxRetries: 2, now: c.now, sleep: c.sleep });
    // 1 try + 2 retries for the first batch, then the second batch.
    expect(send).toHaveBeenCalledTimes(4);
    expect(res.uploaded).toBe(1);
    expect(res.failed.map((f) => f.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("does not retry other errors, and reports their message", async () => {
    const c = clock();
    const send = vi.fn().mockResolvedValue({ success: false, status: 400, message: "Only images are allowed" });
    const res = await uploadInBatches(files(2), send, { key: "g", ...pacing, now: c.now, sleep: c.sleep });
    expect(send).toHaveBeenCalledTimes(1);
    expect(res.failed).toEqual([
      { index: 0, message: "Only images are allowed" },
      { index: 1, message: "Only images are allowed" },
    ]);
  });

  it("treats a thrown request as a failed batch", async () => {
    const c = clock();
    const send = vi.fn().mockRejectedValue(new Error("offline"));
    const res = await uploadInBatches(files(1), send, { key: "g", ...pacing, now: c.now, sleep: c.sleep });
    expect(res.failed[0].message).toMatch(/connection/);
  });
});
