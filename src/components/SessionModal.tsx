"use client";

import { useEffect } from "react";
import { Button } from "./Button";

interface SessionModalProps {
  isOpen: boolean;
  sessionEnded: boolean;
  onContinue?: () => void;
  onLogout: () => void;
  /** Dismiss the modal without logging in / out — stay on the current page. */
  onClose: () => void;
}

export default function SessionModal({
  isOpen,
  sessionEnded,
  onContinue,
  onLogout,
  onClose,
}: SessionModalProps) {
  // Escape always dismisses.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop — click to dismiss */}
      <div
        className="absolute inset-0"
        style={{ background: "oklch(0.14 0.008 80 / 0.3)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg rounded-(--r-3) max-w-md w-full mx-4 p-8" style={{ boxShadow: "var(--shadow-2)" }}>
        {/* Close (X) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3.5 right-3.5 flex h-8 w-8 items-center justify-center rounded-(--r-2) text-fg-3 hover:bg-bg-2 hover:text-ink"
          style={{ transition: "background var(--motion-fast), color var(--motion-fast)" }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
            <svg
              className="h-8 w-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          {/* Content */}
          <h3 className="font-display text-2xl font-bold text-ink mb-2">
            {sessionEnded ? "Session Expired" : "Session Ending Soon"}
          </h3>
          <p className="text-fg-2 mb-6">
            {sessionEnded
              ? "Your session has expired due to inactivity. Log in again to continue, or dismiss this to stay on the page."
              : "Your session is about to expire due to inactivity. Would you like to continue?"}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            {sessionEnded ? (
              <>
                <Button onClick={onClose} variant="ghost" className="flex-1">
                  Dismiss
                </Button>
                <Button onClick={onLogout} className="flex-1">
                  Log In Again
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={onLogout}
                  variant="ghost"
                  className="flex-1"
                >
                  Log Out
                </Button>
                <Button onClick={onContinue} className="flex-1">
                  Continue Session
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
