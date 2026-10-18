"use client";

import { useEffect, useId, useRef } from "react";
import { Button } from "./Button";

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  isConfirming?: boolean;
  confirmVariant?: "primary" | "danger";
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input:not([disabled]), select, [tabindex]:not([tabindex="-1"])';

/**
 * Confirm / cancel dialog. Behaves like the shared Modal: role="dialog" with
 * aria-modal and labels, Escape to cancel, a focus trap, and focus handed back
 * to whatever opened it. It is not built on Modal because Modal renders this
 * component for its own "Discard changes?" guard.
 *
 * While a confirm is pending (`isConfirming`) nothing dismisses it: Escape and
 * the backdrop are ignored and Cancel is disabled.
 */
export default function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isConfirming = false,
  confirmVariant = "danger",
}: ConfirmationModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Read the latest values from the document listener without re-binding it.
  const onCancelRef = useRef(onCancel);
  const isConfirmingRef = useRef(isConfirming);
  useEffect(() => {
    onCancelRef.current = onCancel;
    isConfirmingRef.current = isConfirming;
  });

  // On open: remember the trigger and move focus inside. On close: give focus
  // back to the trigger if it is still on the page.
  useEffect(() => {
    if (!isOpen) return;
    const trigger =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus();

    return () => {
      if (trigger && trigger.isConnected) trigger.focus();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      const panel = panelRef.current;
      if (!panel) return;

      if (e.key === "Escape") {
        // Claim the key so a Modal underneath (this dialog is its discard
        // guard) does not treat the same press as its own close request.
        e.preventDefault();
        e.stopPropagation();
        if (!isConfirmingRef.current) onCancelRef.current();
        return;
      }

      if (e.key !== "Tab") return;
      const focusable = panel.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (focusable.length === 0) {
        // Both buttons are disabled while pending; keep focus on the panel.
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const outside = !panel.contains(active);
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault();
        first.focus();
      }
    };
    // Capture phase so this runs before a parent Modal's bubbling listeners.
    document.addEventListener("keydown", handleKey, true);
    return () => document.removeEventListener("keydown", handleKey, true);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: "oklch(0.14 0.008 80 / 0.3)" }}
        onClick={isConfirming ? undefined : onCancel}
        data-testid="confirmation-backdrop"
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        aria-busy={isConfirming || undefined}
        tabIndex={-1}
        className="relative w-full max-w-md rounded-(--r-3) border border-border bg-bg p-6 outline-none"
        style={{ boxShadow: "var(--shadow-2)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div
          className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger"
          aria-hidden="true"
        >
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zM12 16.5h.008v.008H12V16.5z"
            />
          </svg>
        </div>

        <h3 id={titleId} className="mb-2 text-xl font-black text-ink">
          {title}
        </h3>
        <p id={descriptionId} className="mb-6 text-sm leading-6 text-fg-2">
          {description}
        </p>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isConfirming}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={() => void onConfirm()}
            isLoading={isConfirming}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
