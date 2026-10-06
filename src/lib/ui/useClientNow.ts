"use client";

/**
 * useClientNow — the viewer's clock for day-level UI, hydration-safe.
 *
 * Returns null on the server and during hydration, then a Date on the
 * client. The Date is cached (one shared value for every caller) and
 * replaced at the viewer's local midnight, and when the tab becomes visible
 * on a new day (timers are throttled in background tabs). It does NOT tick
 * within a day: use it for "which day is today", not for a clock.
 *
 * This is the way to call the activity helpers, which require `now`:
 *
 *   const now = useClientNow();
 *   const days = useMemo(() => (now ? weekStrip(checkIns, now) : null), [checkIns, now]);
 *   return days ? <WeekStrip days={days} label="Check-ins this week" /> : <Skeleton />;
 *
 * Built on useSyncExternalStore, so there is no setState in an effect.
 */
import { useSyncExternalStore } from "react";
import { dayKey } from "./activity";

let current: Date | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setTimeout> | null = null;

function msToNextMidnight(from: Date): number {
  const next = new Date(from);
  next.setHours(24, 0, 0, 0);
  return Math.max(1, next.getTime() - from.getTime());
}

function refresh() {
  current = new Date();
  listeners.forEach((l) => l());
}

function schedule() {
  if (timer) clearTimeout(timer);
  // A few ms past midnight so the new Date is safely on the new day.
  timer = setTimeout(() => {
    refresh();
    schedule();
  }, msToNextMidnight(new Date()) + 50);
}

function onVisible() {
  if (document.visibilityState !== "visible" || !current) return;
  if (dayKey(new Date()) !== dayKey(current)) {
    refresh();
    schedule();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    // A Date cached by an earlier mount may be from another day; React reads
    // the snapshot again right after subscribing, so no notify is needed.
    if (current && dayKey(new Date()) !== dayKey(current)) current = new Date();
    schedule();
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      if (timer) clearTimeout(timer);
      timer = null;
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

function getSnapshot(): Date {
  if (!current) current = new Date();
  return current;
}

function getServerSnapshot(): null {
  return null;
}

export function useClientNow(): Date | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Test-only: forget the cached Date. */
export function resetClientNowForTests() {
  current = null;
}
