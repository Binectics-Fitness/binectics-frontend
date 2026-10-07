/**
 * Page scroll lock, reference-counted.
 *
 * Sets `data-scroll-locked` on <html> (globals.css turns that into
 * overflow: hidden !important on html and body) while at least one lock is
 * held. It never reads or writes body.style.overflow, so it can't fight
 * components that still do (UnifiedMobileNav, DocumentPreviewModal, the
 * legacy components/MobileNav): their save/restore of the inline
 * style no longer unlocks the page under us, and ours never restores a
 * stale value over theirs.
 *
 *   const release = lockScroll();
 *   ...
 *   release(); // idempotent
 */
const ATTR = "data-scroll-locked";
let holders = 0;

export function lockScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  holders += 1;
  document.documentElement.setAttribute(ATTR, "");
  let released = false;
  return () => {
    if (released) return;
    released = true;
    holders = Math.max(0, holders - 1);
    if (holders === 0) document.documentElement.removeAttribute(ATTR);
  };
}

export function isScrollLocked(): boolean {
  return typeof document !== "undefined" && document.documentElement.hasAttribute(ATTR);
}
