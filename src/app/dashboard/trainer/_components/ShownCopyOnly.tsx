"use client";

/**
 * ShownCopyOnly — renders its children in only ONE of the two copies a
 * provider dashboard shell makes.
 *
 * ProviderDashboardShell mounts the page twice, a desktop copy inside
 * `hidden lg:grid` and a mobile copy inside `lg:hidden`, and CSS hides one.
 * The hidden copy is still mounted: its effects run, its dialogs and
 * unsaved-changes guards exist, and the page has two h1s. Wrapped in this,
 * the content mounts only in the copy the current breakpoint shows. In a
 * shell that renders once (the member shell) it always renders.
 *
 * Keep data loading OUTSIDE the shell anyway: crossing the breakpoint
 * remounts the content in the other copy.
 *
 * Follow-up: the real fix is in the shared shell (render children once,
 * choosing the layout by breakpoint); this is the page-level stopgap.
 */
import { useState, useSyncExternalStore, type ReactNode } from "react";

/** Tailwind's `lg` breakpoint, the one ProviderDashboardShell switches at. */
const LG = "(min-width: 64rem)";

function subscribe(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const mq = window.matchMedia(LG);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
const isDesktop = () => typeof window.matchMedia === "function" && window.matchMedia(LG).matches;

export type ShellCopy = "desktop" | "mobile" | "only";

/** Which shell copy a node sits in, from the shell's own wrapper classes. */
export function shellCopyOf(node: Element): ShellCopy {
  if (node.closest(".lg\\:hidden")) return "mobile";
  if (node.closest(".hidden.lg\\:grid")) return "desktop";
  return "only";
}

export function ShownCopyOnly({ children }: { children: ReactNode }) {
  const [marker, setMarker] = useState<HTMLSpanElement | null>(null);
  const desktop = useSyncExternalStore(subscribe, isDesktop, () => null);
  const copy = marker ? shellCopyOf(marker) : null;
  const shown =
    copy === "only" || (copy === "desktop" && desktop === true) || (copy === "mobile" && desktop === false);
  return (
    <>
      <span ref={setMarker} hidden />
      {shown && children}
    </>
  );
}
