import { useEffect, useState } from "react";
import { secondsUntil } from "./accountState";

/**
 * Whole seconds left until `until` (epoch ms), ticking once a second and
 * stopping at 0. Counts against an absolute deadline, so a reload or a
 * backgrounded tab never drifts.
 */
export function useSecondsLeft(until: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (until === null) return;
    const id = window.setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (secondsUntil(until, t) <= 0) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [until]);

  return secondsUntil(until, now);
}
