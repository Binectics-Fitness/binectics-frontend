"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Keyboard behaviour for a hand-rolled modal dialog, for panels that can't
 * use the shared `Modal` (which has the same behaviour built in):
 *
 * - on mount, focus moves into the panel (`initialFocusRef`, else the first
 *   focusable element, else the panel itself; give it tabIndex={-1});
 * - Tab and Shift+Tab cycle inside the panel, and focus that has fallen to
 *   <body> is pulled back in;
 * - Escape calls `onEscape` (route it through an unsaved-changes guard);
 * - on unmount, focus returns to the element that had it on open.
 *
 * Keys aimed at another layer (focus outside the panel and not on <body>,
 * e.g. a confirmation on top) are left alone, as are keys a nested widget
 * already handled (`defaultPrevented`, e.g. Escape closing a picker list).
 */
export function useDialogFocus(
  panelRef: RefObject<HTMLElement | null>,
  {
    onEscape,
    initialFocusRef,
  }: {
    onEscape: () => void;
    initialFocusRef?: RefObject<HTMLElement | null>;
  },
): void {
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);
  const initialRef = useRef(initialFocusRef);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const active = document.activeElement;
    const opener =
      active instanceof HTMLElement && active !== document.body && !panel.contains(active)
        ? active
        : null;

    if (!panel.contains(document.activeElement)) {
      const target =
        initialRef.current?.current ??
        panel.querySelector<HTMLElement>(FOCUSABLE) ??
        panel;
      target.focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target as Node | null;
      const inside = !!target && panel.contains(target);
      const loose =
        !target || target === document.body || target === document.documentElement;
      if (!inside && !loose) return;

      if (e.key === "Escape") {
        e.preventDefault();
        onEscapeRef.current();
        return;
      }
      if (e.key !== "Tab") return;

      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (!inside || current === panel) {
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

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (opener && opener.isConnected) opener.focus();
    };
  }, [panelRef]);
}
