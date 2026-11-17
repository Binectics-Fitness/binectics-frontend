"use client";

import { useEffect, useState } from "react";

/**
 * The browser's clock as epoch milliseconds, for a timer. NEVER accumulated:
 * each tick re-reads `Date.now()`, so a tab that slept for an hour, a
 * throttled timer, or a clock the member changed simply shows the true value
 * on the next read. It re-reads at once when the tab becomes visible again, on
 * focus and on pageshow, ticks at the next whole minute of `alignTo` (the
 * fast's start, so the numerals change exactly when the minute does), and at
 * least every `maxGapMs` so a changed system clock is noticed soon.
 *
 * Returns null on the server and for the first client render (hydration safe).
 */
export function nextTickDelay(nowMs: number, alignTo: number | null, maxGapMs: number): number {
  if (alignTo === null) return maxGapMs;
  const sinceStart = Math.max(0, nowMs - alignTo);
  const toNextMinute = 60_000 - (sinceStart % 60_000);
  // A few ms past the boundary so the minute has definitely turned.
  return Math.max(250, Math.min(maxGapMs, toNextMinute + 50));
}

export function useNowMs(alignTo: number | null = null, maxGapMs = 30_000): number | null {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const read = () => setNow(Date.now());
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        read();
        schedule();
      }, nextTickDelay(Date.now(), alignTo, maxGapMs));
    };
    const onWake = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      read();
      schedule();
    };
    read();
    schedule();
    document.addEventListener("visibilitychange", onWake);
    window.addEventListener("focus", onWake);
    window.addEventListener("pageshow", onWake);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onWake);
      window.removeEventListener("focus", onWake);
      window.removeEventListener("pageshow", onWake);
    };
  }, [alignTo, maxGapMs]);

  return now;
}
