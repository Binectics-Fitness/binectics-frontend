import { useEffect } from 'react';

/**
 * Keeps the screen on while `active` (the web's useKeepAwakeWhile, mobile
 * src/guided/useKeepAwakeWhile.ts), with the Screen Wake Lock API. The browser
 * drops the lock whenever the tab is hidden, so it is taken again when the tab
 * comes back. Where the API is missing or refused (older Safari, low battery,
 * an iframe without permission) nothing happens: the timer still works.
 */
interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
}
type WakeLockNav = Navigator & { wakeLock?: { request: (type: 'screen') => Promise<WakeLockSentinelLike> } };

export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || typeof navigator === 'undefined') return;
    const nav = navigator as WakeLockNav;
    if (!nav.wakeLock) return;
    let lock: WakeLockSentinelLike | null = null;
    let cancelled = false;
    const acquire = async () => {
      if (cancelled || document.visibilityState !== 'visible' || (lock && !lock.released)) return;
      try {
        const l = await nav.wakeLock!.request('screen');
        if (cancelled) void l.release().catch(() => undefined);
        else lock = l;
      } catch {
        /* refused: carry on without it */
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void acquire();
    };
    void acquire();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      if (lock && !lock.released) void lock.release().catch(() => undefined);
      lock = null;
    };
  }, [active]);
}
