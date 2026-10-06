"use client";

/**
 * Drawer — a side panel dialog.
 *
 * Focus: on open, focus moves into the panel (the close button when there
 * is a title, else the panel itself); Tab and Shift+Tab stay inside it; on
 * close, focus returns to the element that had it when the drawer opened
 * (usually the row or button that opened it), if that is still on the page.
 *
 * A copy that isn't rendered (inside a display:none ancestor, e.g. a shell
 * that mounts its children twice for desktop and mobile) does none of this:
 * it must not trap Tab, steal focus or remember an opener.
 */
import { useEffect, useState, useRef, useCallback } from "react";

/** False when the panel sits under a display:none ancestor. */
function isRendered(el: HTMLElement): boolean {
  if (typeof el.checkVisibility === "function") return el.checkVisibility();
  for (let node: HTMLElement | null = el; node; node = node.parentElement) {
    if (getComputedStyle(node).display === "none") return false;
  }
  return true;
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: "left" | "right";
  width?: number;
  title?: string;
  children: React.ReactNode;
}

export function Drawer({
  open,
  onClose,
  side = "right",
  width = 400,
  title,
  children,
}: DrawerProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // Remember the opener as the drawer opens; give focus back when it closes.
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    const active = document.activeElement;
    openerRef.current =
      panel && isRendered(panel) && active instanceof HTMLElement && active !== document.body ? active : null;
    return () => {
      const opener = openerRef.current;
      openerRef.current = null;
      if (opener && opener.isConnected) opener.focus();
    };
  }, [open]);

  // Move focus in once the panel is mounted.
  useEffect(() => {
    if (!open || !shouldRender) return;
    const panel = panelRef.current;
    if (!panel || !isRendered(panel)) return;
    const target = closeRef.current ?? panel;
    if (!panel.contains(document.activeElement)) target.focus();
  }, [open, shouldRender]);

  // Mount on open and start the slide-out on close during render (React's
  // "adjust state when a prop changes" pattern), so no effect sets state
  // synchronously. The slide-in waits a frame; the unmount waits for the
  // slide-out.
  if (open && !shouldRender) setShouldRender(true);
  if (!open && isAnimating) setIsAnimating(false);

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => setIsAnimating(true));
      return () => cancelAnimationFrame(frame);
    }
    const timer = setTimeout(() => setShouldRender(false), 220);
    return () => clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const handleFocusTrap = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab" || !panelRef.current || !isRendered(panelRef.current)) return;

    const focusable = panelRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    // Focus on the panel itself, or somewhere outside it: pull it back in.
    if (!(active instanceof HTMLElement) || active === panelRef.current || !panelRef.current.contains(active)) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
      return;
    }

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleFocusTrap);
    return () => document.removeEventListener("keydown", handleFocusTrap);
  }, [open, handleFocusTrap]);

  if (!shouldRender) return null;

  const translateValue = side === "right" ? "100%" : "-100%";

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 transition-opacity"
        style={{
          background: "oklch(0.14 0.008 80 / 0.3)",
          opacity: isAnimating ? 1 : 0,
          transitionDuration: "var(--motion-base)",
        }}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute top-0 bottom-0 flex flex-col bg-bg focus:outline-none"
        style={{
          [side]: 0,
          width,
          maxWidth: "100vw",
          borderLeft: side === "right" ? "1px solid var(--border)" : undefined,
          borderRight: side === "left" ? "1px solid var(--border)" : undefined,
          transform: isAnimating ? "translateX(0)" : `translateX(${translateValue})`,
          transitionProperty: "transform",
          transitionDuration: "var(--motion-base)",
          transitionTimingFunction: "var(--ease-out)",
        }}
      >
        {title && (
          <div
            className="flex shrink-0 items-center justify-between px-6 py-5"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <h3
              className="text-[17px] font-medium text-ink"
              style={{ letterSpacing: "-0.015em" }}
            >
              {title}
            </h3>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-(--r-2) text-fg-3 hover:bg-bg-2 hover:text-ink"
              aria-label="Close"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}
