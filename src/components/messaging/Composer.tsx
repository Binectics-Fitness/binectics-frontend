"use client";

import { forwardRef, useCallback, useImperativeHandle, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { MESSAGE_MAX_LENGTH } from "@/lib/api/messaging";
import { loadDraft, saveDraft } from "./messagingStorage";

const COUNTER_FROM = MESSAGE_MAX_LENGTH - 500;
const MAX_HEIGHT_PX = 160;

export interface ComposerHandle {
  focus: () => void;
  /** Empty the box and its draft (when the parent keeps the text until a send succeeds). */
  clear: () => void;
}

/**
 * Message box. Enter sends, Shift+Enter makes a new line, and nothing sends
 * mid-IME composition. The text clears the moment a message is handed to
 * the outbox, so anything typed while it sends is kept (web B4). One draft
 * per thread, kept across thread switches and reloads (web B5).
 */
export const Composer = forwardRef<
  ComposerHandle,
  {
    userId: string;
    /** Draft key; the composer is remounted per thread. */
    draftKey: string;
    label: string;
    placeholder?: string;
    sendLabel?: string;
    /** Above the box: the reply being written, or who you're replying as. */
    context?: ReactNode;
    onSend: (text: string) => void;
    onEscape?: () => void;
    busy?: boolean;
    /** False keeps the text after Send until the parent calls `clear()`. */
    clearOnSend?: boolean;
  }
>(function Composer(
  {
    userId,
    draftKey,
    label,
    placeholder = "Message…",
    sendLabel = "Send",
    context,
    onSend,
    onEscape,
    busy = false,
    clearOnSend = true,
  },
  ref,
) {
  const [text, setText] = useState(() => loadDraft(userId, draftKey));
  const area = useRef<HTMLTextAreaElement>(null);


  // Grow with the text up to a cap, then scroll inside.
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [text]);

  const update = useCallback(
    (next: string) => {
      setText(next);
      saveDraft(userId, draftKey, next);
    },
    [draftKey, userId],
  );

  useImperativeHandle(ref, () => ({ focus: () => area.current?.focus(), clear: () => update("") }), [update]);

  const length = text.trim().length;
  const tooLong = text.length > MESSAGE_MAX_LENGTH;
  const canSend = length > 0 && !tooLong && !busy;

  const submit = () => {
    if (!canSend) return;
    const body = text.trim();
    if (clearOnSend) update("");
    onSend(body);
    area.current?.focus();
  };

  const counterId = `${draftKey}-counter`;

  return (
    <div className="shrink-0 px-3 pb-3 pt-2 md:px-5" style={{ borderTop: "1px solid var(--border)" }}>
      {context}
      <div className="flex items-end gap-2">
        <textarea
          ref={area}
          value={text}
          onChange={(e) => update(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && onEscape) {
              onEscape();
              return;
            }
            // keyCode 229 = an IME is still composing (Safari reports it there).
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          aria-label={label}
          aria-describedby={text.length > COUNTER_FROM ? counterId : undefined}
          placeholder={placeholder}
          className="min-h-[42px] flex-1 resize-none rounded-(--r-3) px-3 py-2.5 text-[14px] leading-normal outline-none focus:border-(--ink)"
          style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)" }}
        />
        <button type="button" className="btn-primary-v2 sm h-[42px] shrink-0" disabled={!canSend} onClick={submit}>
          {busy ? "Sending…" : sendLabel}
        </button>
      </div>
      <div className="mt-1 flex justify-between gap-3 px-1 font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
        <span className="hidden md:inline">Enter to send · Shift+Enter for a new line</span>
        {text.length > COUNTER_FROM && (
          <span
            id={counterId}
            className="ml-auto tabular-nums"
            style={{ color: tooLong ? "var(--danger-ink)" : "var(--fg-3)" }}
          >
            {tooLong
              ? `${text.length - MESSAGE_MAX_LENGTH} characters over the ${MESSAGE_MAX_LENGTH} limit`
              : `${text.length} / ${MESSAGE_MAX_LENGTH}`}
          </span>
        )}
      </div>
    </div>
  );
});
