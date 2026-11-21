"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * The walkthrough's centred dialog: 460px, 22px padding, no header bar.
 * Escape and a click on the scrim call `onDismiss` (the caller decides
 * whether that needs a confirmation). Focus moves in on open, stays in while
 * tabbing, and returns to the opener on close.
 */
export function BuilderDialog({
  label,
  onDismiss,
  children,
  width = 460,
  panelProps,
}: {
  label: string;
  onDismiss: () => void;
  children: ReactNode;
  width?: number;
  panelProps?: React.HTMLAttributes<HTMLDivElement>;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const dismiss = useRef(onDismiss);
  useEffect(() => {
    dismiss.current = onDismiss;
  });

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const el = panel.current;
    const first = el?.querySelector<HTMLElement>("input, textarea, button:not([disabled])");
    (first ?? el)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) {
        e.preventDefault();
        dismiss.current();
      }
      if (e.key === "Tab" && el) {
        const items = el.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), textarea, [tabindex]:not([tabindex="-1"])');
        if (!items.length) return;
        const a = items[0];
        const z = items[items.length - 1];
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex p-4 overflow-y-auto"
      style={{ background: "rgba(11,9,6,0.42)" }}
      onMouseDown={(e) => e.target === e.currentTarget && dismiss.current()}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className="m-auto flex flex-col gap-4 outline-none"
        style={{
          background: "var(--bg)",
          borderRadius: 12,
          padding: 22,
          width,
          maxWidth: "100%",
          boxShadow: "0 24px 64px rgba(3,20,30,0.2)",
        }}
        {...panelProps}
      >
        {children}
      </div>
    </div>
  );
}
