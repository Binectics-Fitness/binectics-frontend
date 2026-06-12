"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Toast — ink bg for success, danger for error, warn for warning.
 * r-2 radius, 13.5px text, no icons that brag. Plain and fast.
 */

export type ToastType = "success" | "error" | "warning" | "info";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  action?: ToastAction;
}

interface ToastProps {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}

const STYLES: Record<ToastType, string> = {
  success: "bg-ink text-bg",
  error: "bg-danger text-white",
  warning: "bg-[oklch(0.72_0.14_75)] text-ink",
  info: "bg-ink text-bg",
};

function ToastEntry({ toast, onDismiss }: ToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const enterTimer = setTimeout(() => setVisible(true), 10);
    const dismissTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDismiss(toast.id), 220);
    }, 3500);
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(dismissTimer);
    };
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`flex items-center gap-3 rounded-(--r-2) px-3.5 py-2.5 text-[13.5px] font-medium max-w-sm w-full pointer-events-auto border border-transparent ${STYLES[toast.type]}`}
      style={{
        boxShadow: "var(--shadow-2)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(6px)",
        transition: "opacity var(--motion-base), transform var(--motion-base)",
        transitionTimingFunction: "var(--ease-out)",
        letterSpacing: "-0.005em",
      }}
    >
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          onClick={() => {
            toast.action!.onClick();
            setVisible(false);
            setTimeout(() => onDismiss(toast.id), 220);
          }}
          className="shrink-0 font-semibold underline underline-offset-2 opacity-80 hover:opacity-100"
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={() => {
          setVisible(false);
          setTimeout(() => onDismiss(toast.id), 220);
        }}
        className="opacity-60 hover:opacity-100 ml-1 shrink-0"
        aria-label="Dismiss"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Global toast state (module-level singleton) ──────────────────────────────

type ToastListener = (toasts: ToastItem[]) => void;
let _toasts: ToastItem[] = [];
const _listeners: Set<ToastListener> = new Set();

function notify() {
  _listeners.forEach((fn) => fn([..._toasts]));
}

export function toast(message: string, type: ToastType = "success", action?: ToastAction) {
  const id = `${Date.now()}-${Math.random()}`;
  _toasts = [..._toasts, { id, message, type, action }];
  notify();
}

toast.success = (msg: string, action?: ToastAction) => toast(msg, "success", action);
toast.error = (msg: string, action?: ToastAction) => toast(msg, "error", action);
toast.warning = (msg: string, action?: ToastAction) => toast(msg, "warning", action);
toast.info = (msg: string, action?: ToastAction) => toast(msg, "info", action);

// ── ToastContainer: mount once in root layout ────────────────────────────────

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const listener: ToastListener = (t) => setToasts(t);
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    _toasts = _toasts.filter((t) => t.id !== id);
    notify();
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-6 right-4 sm:right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastEntry key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>,
    document.body,
  );
}
