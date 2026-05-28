"use client";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ background: "oklch(0.14 0.008 80 / 0.3)" }}
        onClick={isConfirming ? undefined : onCancel}
      />

      <div
        className="relative w-full max-w-md rounded-(--r-3) border border-border bg-bg p-6"
        style={{ boxShadow: "var(--shadow-2)" }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft text-danger">
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

        <h3 className="mb-2 text-xl font-black text-ink">{title}</h3>
        <p className="mb-6 text-sm leading-6 text-fg-2">
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
