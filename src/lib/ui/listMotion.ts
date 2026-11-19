"use client";

import { useState, type CSSProperties } from "react";

/**
 * Rows arriving in a list (10-System "List change"): after the list is on
 * screen, a new row fades in and rises 8px (180ms out-expo, 20ms apart),
 * at most the first 5 of a change. Never on page open (owner, 20 Nov 2026):
 * the rows present when the list is first shown stay still. Reduced motion:
 * a 200ms fade (globals.css `.bx-row-enter`). Mirrors binectics-mobile
 * src/components/ui/listMotion.ts.
 */
export const ROW_MS = 180;
export const ROW_STAGGER_MS = 20;
export const ANIMATED_ROWS = 5;

type Enter = { className?: string; style?: CSSProperties };
const NONE: Enter = {};

/**
 * `keys`: the rows' ids in order. `ready`: the list is showing real data (not
 * a skeleton), so the first ready render is the baseline that never moves.
 * Returns a function giving a row its entering class and delay.
 */
export function useRowEnter(keys: readonly string[], ready: boolean): (key: string) => Enter {
  const sig = keys.join("\u0000");
  const [seen, setSeen] = useState<{ sig: string; keys: ReadonlySet<string> } | null>(null);
  const [arriving, setArriving] = useState<ReadonlyMap<string, number>>(() => new Map());

  // Derived during render (React's "storing information from previous
  // renders"), so a new row gets its class before it is ever painted.
  if (ready && seen?.sig !== sig) {
    if (seen) {
      const fresh = keys.filter((k) => !seen.keys.has(k)).slice(0, ANIMATED_ROWS);
      setArriving(new Map(fresh.map((k, i) => [k, i])));
    }
    setSeen({ sig, keys: new Set(keys) });
  }

  return (key: string) => {
    const i = arriving.get(key);
    if (i === undefined) return NONE;
    return { className: "bx-row-enter", style: { animationDelay: `${i * ROW_STAGGER_MS}ms` } };
  };
}
