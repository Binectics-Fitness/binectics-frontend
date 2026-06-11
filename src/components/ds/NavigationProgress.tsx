"use client";

/**
 * NavigationProgress — a thin top-of-viewport progress bar that gives instant
 * visual feedback when navigating between pages.
 *
 * Why this exists alongside route-segment `loading.tsx` skeletons:
 *  - `loading.tsx` only appears once the destination segment starts loading.
 *  - This bar appears the moment a link is clicked, so even a fast-but-not-
 *    instant navigation feels responsive.
 *
 * It intercepts internal anchor clicks (every Next.js <Link> renders an <a>) to
 * start, and completes when the URL (pathname or query) actually changes.
 * Programmatic navigations (router.push) can opt in via startNavigationProgress().
 *
 * Styling is design-system native: the bar uses the --signal accent (the same
 * colour used for "live"/active affordances across the app).
 */

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const START_EVENT = "binectics:nav-progress-start";

/**
 * Imperatively show the navigation progress bar. Call this right before a
 * programmatic navigation (e.g. router.push after a form submit) so the bar
 * isn't limited to plain link clicks.
 */
export function startNavigationProgress(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(START_EVENT));
  }
}

function NavigationProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  const activeRef = useRef(false);
  const trickleRef = useRef<number | null>(null);
  const safetyRef = useRef<number | null>(null);

  // Changes whenever the route (path or query) changes — drives completion.
  const urlKey = `${pathname}?${searchParams.toString()}`;

  // Set up navigation-start detection: internal anchor clicks + the imperative
  // event. Listeners only; all setState happens inside the callbacks.
  useEffect(() => {
    const stopTrickle = () => {
      if (trickleRef.current != null) {
        window.clearInterval(trickleRef.current);
        trickleRef.current = null;
      }
    };

    const start = () => {
      if (activeRef.current) return; // already running
      activeRef.current = true;
      setVisible(true);
      setProgress(8);
      stopTrickle();
      // Ease toward 90% and hold there until the route actually resolves.
      trickleRef.current = window.setInterval(() => {
        setProgress((p) => (p >= 90 ? p : p + Math.max((90 - p) * 0.1, 0.4)));
      }, 180);
      // Safety net: never let the bar hang if a navigation is cancelled.
      if (safetyRef.current != null) window.clearTimeout(safetyRef.current);
      safetyRef.current = window.setTimeout(() => {
        stopTrickle();
        activeRef.current = false;
        setVisible(false);
        setProgress(0);
      }, 10_000);
    };

    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as HTMLElement | null)?.closest?.("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || anchor.hasAttribute("download")) return;
      const target = anchor.getAttribute("target");
      if (target && target !== "_self") return;

      let dest: URL;
      try {
        dest = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (dest.origin !== window.location.origin) return; // external link

      const current = window.location.pathname + window.location.search;
      const next = dest.pathname + dest.search;
      // Same route, or a pure in-page hash jump — no transition to show.
      if (next === current) return;
      if (dest.hash && dest.pathname === window.location.pathname && dest.search === window.location.search) {
        return;
      }

      start();
    };

    // Catch programmatic navigations (router.push / router.replace) too, so the
    // bar shows up regardless of how the navigation was triggered. We only start
    // when the URL genuinely changes, which filters out Next's frequent same-URL
    // replaceState calls (scroll restoration, search-param syncs, etc.).
    const startIfUrlChanges = (url: string | URL | null | undefined) => {
      if (url == null) return;
      try {
        const dest = new URL(String(url), window.location.href);
        const current = window.location.pathname + window.location.search;
        if (dest.pathname + dest.search !== current) start();
      } catch {
        /* ignore malformed URLs */
      }
    };

    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;
    window.history.pushState = function (data, unused, url) {
      startIfUrlChanges(url);
      return origPush.call(this, data, unused, url);
    };
    window.history.replaceState = function (data, unused, url) {
      startIfUrlChanges(url);
      return origReplace.call(this, data, unused, url);
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener(START_EVENT, start);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(START_EVENT, start);
      window.history.pushState = origPush;
      window.history.replaceState = origReplace;
      stopTrickle();
      if (safetyRef.current != null) window.clearTimeout(safetyRef.current);
    };
  }, []);

  // Complete the bar whenever the route resolves to a new URL. setState is
  // deferred to a callback to satisfy the no-setState-in-effect rule.
  useEffect(() => {
    if (!activeRef.current) return;

    const finish = window.setTimeout(() => {
      if (trickleRef.current != null) {
        window.clearInterval(trickleRef.current);
        trickleRef.current = null;
      }
      if (safetyRef.current != null) {
        window.clearTimeout(safetyRef.current);
        safetyRef.current = null;
      }
      activeRef.current = false;
      setProgress(100);
      // Fade out, then reset width once it's no longer visible.
      window.setTimeout(() => {
        setVisible(false);
        window.setTimeout(() => setProgress(0), 240);
      }, 200);
    }, 0);

    return () => window.clearTimeout(finish);
  }, [urlKey]);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: 2.5,
        width: `${progress}%`,
        background: "var(--signal)",
        boxShadow: "0 0 8px var(--signal), 0 0 3px var(--signal)",
        borderTopRightRadius: 2,
        borderBottomRightRadius: 2,
        zIndex: 2147483647,
        opacity: visible ? 1 : 0,
        transition: "width 180ms ease, opacity 240ms ease 120ms",
        pointerEvents: "none",
      }}
    />
  );
}

/**
 * Mount once near the root of the app (inside <body>). Wrapped in Suspense
 * because it reads useSearchParams, which would otherwise opt routes into
 * dynamic rendering.
 */
export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <NavigationProgressBar />
    </Suspense>
  );
}
