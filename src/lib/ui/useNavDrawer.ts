"use client";

/**
 * useNavDrawer — state and modal behaviour for a phone navigation drawer
 * (the dashboard shells' slide-in sidebar).
 *
 * While open:
 *  - focus moves to the element marked `data-autofocus` (the close button
 *    in our drawers; never a link, so a second Enter can't navigate away),
 *    else the first focusable one, and Tab / Shift+Tab wrap inside the
 *    panel (same trap as ds/Drawer);
 *  - Escape closes it, unless it comes from an open menu inside the panel
 *    (e.g. the account menu), which owns that Escape;
 *  - everything outside the panel's overlay is `inert` (the same attribute
 *    SuccessTakeover uses), so the page behind can't be focused, clicked or
 *    read; elements that were already inert are left alone;
 *  - page scroll is locked through the shared counter (scrollLock.ts).
 *  - keys from a layer opened above it (another aria-modal dialog, or any
 *    live element outside the overlay that mounted after the inert pass)
 *    are left to that layer: no focus yanking, no double Escape;
 *  - Cmd/Ctrl+K (the command bar) closes it, so the bar doesn't open over
 *    an inert page with the drawer behind it.
 * It closes when the route changes and when the viewport reaches the
 * desktop breakpoint (Tailwind `lg`, 64rem, by default), where the drawer is hidden;
 * otherwise it would reappear, still open, on the way back to phone width.
 * On close, focus returns to the trigger (or whatever had focus when it
 * opened) if that is still on the page and rendered; otherwise (e.g. it
 * closed because the viewport reached desktop, where the trigger is hidden)
 * it goes to <main> / #main, as SuccessTakeover's fallback does, not <body>.
 *
 *   const nav = useNavDrawer();
 *   <button ref={nav.triggerRef} onClick={nav.show} aria-expanded={nav.open} />
 *   {nav.open && <div ref={nav.overlayRef}>… <div ref={nav.panelRef} role="dialog" aria-modal="true" /></div>}
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { lockScroll } from "./scrollLock";

export const DESKTOP_QUERY = "(min-width: 64rem)";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function focusables(panel: HTMLElement): HTMLElement[] {
  return Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.closest("[inert]") && !el.hasAttribute("hidden"),
  );
}

/** False when the element is detached or under a display:none ancestor. */
function isRendered(el: HTMLElement): boolean {
  if (!el.isConnected) return false;
  if (typeof el.checkVisibility === "function") return el.checkVisibility();
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    if (getComputedStyle(node).display === "none") return false;
  }
  return true;
}

/** Focus the opener if it can take focus, else the page's main landmark. */
function restoreFocus(opener: HTMLElement | null) {
  if (opener && isRendered(opener)) {
    opener.focus();
    return;
  }
  const main = document.querySelector<HTMLElement>("main, #main");
  if (!main) return;
  if (!main.hasAttribute("tabindex")) {
    // A programmatic focus target, not a control: no focus ring around the page.
    main.setAttribute("tabindex", "-1");
    main.style.outline = "none";
  }
  main.focus({ preventScroll: true });
}

/** Mark everything outside `keep` (siblings along its ancestor chain up to <body>) inert; returns an undo. */
function inertOutside(keep: HTMLElement): () => void {
  const marked: HTMLElement[] = [];
  for (let node: HTMLElement = keep; node.parentElement && node !== document.body; node = node.parentElement) {
    for (const sib of Array.from(node.parentElement.children)) {
      if (sib === node || !(sib instanceof HTMLElement)) continue;
      if (sib.hasAttribute("inert") || sib.tagName === "SCRIPT" || sib.tagName === "STYLE") continue;
      sib.setAttribute("inert", "");
      marked.push(sib);
    }
  }
  return () => {
    for (const el of marked) el.removeAttribute("inert");
  };
}

/**
 * @param desktopQuery the media query at which the drawer's trigger is
 *   hidden (default Tailwind `lg`); a shell that switches at `md` passes
 *   "(min-width: 48rem)".
 */
/**
 * True when a key event comes from a layer above the drawer: inside another
 * aria-modal dialog, or a live (non-inert) element outside the overlay.
 * Events from <body> (focus lost) still belong to the drawer.
 */
function fromAnotherLayer(target: EventTarget | null, overlay: HTMLElement | null, panel: HTMLElement): boolean {
  if (!(target instanceof Element) || target === document.body || target === document.documentElement) return false;
  const modal = target.closest('[aria-modal="true"]');
  if (modal && modal !== panel) return true;
  if (overlay && !overlay.contains(target) && !target.closest("[inert]")) return true;
  return false;
}

export function useNavDrawer(desktopQuery: string = DESKTOP_QUERY) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const show = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  // Close on navigation ("adjust state when a value changes" during render,
  // so no effect sets state synchronously).
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  // Close when the viewport reaches desktop, where the drawer is hidden.
  // (It can only be opened below it: the trigger is lg:hidden.)
  useEffect(() => {
    if (!open || typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(desktopQuery);
    const onChange = () => {
      if (mql.matches) setOpen(false);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [open, desktopQuery]);

  // Focus in, inert background, scroll lock; undo all of it and hand focus
  // back on close.
  useEffect(() => {
    if (!open) return;
    const overlay = overlayRef.current;
    const panel = panelRef.current;
    const active = document.activeElement;
    const opener =
      triggerRef.current ?? (active instanceof HTMLElement && active !== document.body ? active : null);

    const releaseScroll = lockScroll();
    const releaseInert = overlay ? inertOutside(overlay) : () => {};
    if (panel && !panel.contains(document.activeElement)) {
      (panel.querySelector<HTMLElement>("[data-autofocus]") ?? focusables(panel)[0] ?? panel).focus();
    }

    return () => {
      releaseInert();
      releaseScroll();
      // Another layer (e.g. the command bar) already took focus: leave it.
      const now = document.activeElement;
      if (now instanceof HTMLElement && now !== document.body && now.isConnected) return;
      restoreFocus(opener);
    };
  }, [open]);

  // Escape + focus trap.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      const panel = panelRef.current;
      if (!panel) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        setOpen(false);
        return;
      }
      if (fromAnotherLayer(e.target, overlayRef.current, panel)) return;
      if (e.key === "Escape") {
        if (e.defaultPrevented) return;
        // A menu open inside the panel (the account menu) takes this Escape.
        if (panel.querySelector('[aria-expanded="true"]')) return;
        setOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables(panel);
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (!(current instanceof HTMLElement) || !panel.contains(current) || current === panel) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && current === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  /** For the panel content wrapper: picking a link closes the drawer (also for the current page, where the route doesn't change). */
  const closeOnLinkClick = useCallback((e: React.MouseEvent) => {
    if (e.target instanceof Element && e.target.closest("a[href]")) setOpen(false);
  }, []);

  return { open, show, close, triggerRef, overlayRef, panelRef, closeOnLinkClick };
}
