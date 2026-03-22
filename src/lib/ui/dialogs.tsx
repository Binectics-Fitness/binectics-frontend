"use client";

import { useState } from "react";
import { createRoot } from "react-dom/client";

type AlertOptions = {
  title?: string;
  message: string;
  buttonLabel?: string;
};

type PromptOptions = {
  title?: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

function mountDialog<T>(
  render: (close: (value: T) => void) => React.ReactElement,
): Promise<T> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return Promise.resolve(null as T);
  }

  return new Promise<T>((resolve) => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    const close = (value: T) => {
      root.unmount();
      container.remove();
      resolve(value);
    };

    root.render(render(close));
  });
}

function AlertDialog({
  title,
  message,
  buttonLabel,
  onClose,
}: {
  title: string;
  message: string;
  buttonLabel: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="mb-2 text-xl font-black text-foreground">{title}</h3>
        <p className="mb-6 text-sm leading-6 text-foreground-secondary">
          {message}
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function PromptDialog({
  title,
  message,
  placeholder,
  defaultValue,
  confirmLabel,
  cancelLabel,
  onSubmit,
  onCancel,
}: {
  title: string;
  message: string;
  placeholder: string;
  defaultValue: string;
  confirmLabel: string;
  cancelLabel: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(defaultValue);

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="mb-2 text-xl font-black text-foreground">{title}</h3>
        <p className="mb-4 text-sm leading-6 text-foreground-secondary">
          {message}
        </p>
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className="mb-6 w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none"
        />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-neutral-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => onSubmit(value)}
            className="rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export async function showAlert(options: string | AlertOptions): Promise<void> {
  const parsed =
    typeof options === "string" ? { message: options } : { ...options };

  await mountDialog<void>((close) => (
    <AlertDialog
      title={parsed.title ?? "Notice"}
      message={parsed.message}
      buttonLabel={parsed.buttonLabel ?? "OK"}
      onClose={() => close(undefined)}
    />
  ));
}

export async function showPrompt(
  options: string | PromptOptions,
): Promise<string | null> {
  const parsed =
    typeof options === "string" ? { message: options } : { ...options };

  return mountDialog<string | null>((close) => (
    <PromptDialog
      title={parsed.title ?? "Input Required"}
      message={parsed.message}
      placeholder={parsed.placeholder ?? "Type here"}
      defaultValue={parsed.defaultValue ?? ""}
      confirmLabel={parsed.confirmLabel ?? "Confirm"}
      cancelLabel={parsed.cancelLabel ?? "Cancel"}
      onSubmit={(value) => close(value)}
      onCancel={() => close(null)}
    />
  ));
}
