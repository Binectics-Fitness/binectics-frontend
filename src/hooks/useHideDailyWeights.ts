"use client";

import { useCallback, useSyncExternalStore } from "react";
import { readHideDailyWeights, writeHideDailyWeights } from "@/lib/solo/hideWeights";

const EVENT = "solo:hide-daily-weights";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

/**
 * "Hide daily weights for good" for this account: kept in this browser only
 * (see lib/solo/hideWeights.ts) and read back on every visit. Another tab's
 * change arrives through the storage event.
 */
export function useHideDailyWeights(userId: string | null | undefined): [boolean, (hide: boolean) => void] {
  const hidden = useSyncExternalStore(
    subscribe,
    () => readHideDailyWeights(userId),
    () => false,
  );
  const set = useCallback(
    (hide: boolean) => {
      writeHideDailyWeights(userId, hide);
      window.dispatchEvent(new Event(EVENT));
    },
    [userId],
  );
  return [hidden, set];
}
