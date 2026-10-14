"use client";

import {
  forwardRef,
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MESSAGE_MAX_LENGTH } from "@/lib/api/messaging";
import { messageLength } from "@/lib/text/graphemes";
import { loadDraft, saveDraft } from "./messagingStorage";

const COUNTER_FROM = MESSAGE_MAX_LENGTH - 500;
const MAX_HEIGHT_PX = 160;
/** Picker height when there's room; it shrinks to fit a short pane (phone + keyboard). */
const PICKER_HEIGHT_PX = 360;
const PICKER_MIN_HEIGHT_PX = 220;

// A separate chunk: the emoji data loads the first time someone opens the
// picker (or hovers the button), never with the chat itself.
const loadPicker = () => import("./EmojiPickerPanel");
const EmojiPickerPanel = lazy(loadPicker);

/** Space above `el` inside the nearest ancestor that clips (the chat pane). */
function roomAbove(el: HTMLElement): number {
  let clip: HTMLElement | null = el.parentElement;
  while (clip && getComputedStyle(clip).overflowY === "visible") clip = clip.parentElement;
  const top = clip ? clip.getBoundingClientRect().top : 0;
  return el.getBoundingClientRect().top - top;
}

function SmileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M8.5 14.5a4.5 4.5 0 0 0 7 0M9 9.5h.01M15 9.5h.01" />
    </svg>
  );
}

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
 *
 * The emoji button opens a searchable picker above the box. A pick replaces
 * the selection (or goes in at the caret) and puts the caret after it, back
 * in the box; Escape closes the picker and returns focus to the box.
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
  const wrap = useRef<HTMLDivElement>(null);
  const picker = useRef<HTMLDivElement>(null);
  const emojiButton = useRef<HTMLButtonElement>(null);
  const [pickerHeight, setPickerHeight] = useState<number | null>(null);
  const pickerOpen = pickerHeight !== null;
  /** Where the caret goes once the text with a new emoji has rendered. */
  const pendingCaret = useRef<number | null>(null);

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

  useLayoutEffect(() => {
    const at = pendingCaret.current;
    const el = area.current;
    if (at === null || !el) return;
    pendingCaret.current = null;
    el.focus();
    el.setSelectionRange(at, at);
  }, [text]);

  const openPicker = () => {
    const room = wrap.current ? roomAbove(wrap.current) - 8 : PICKER_HEIGHT_PX;
    setPickerHeight(Math.max(PICKER_MIN_HEIGHT_PX, Math.min(PICKER_HEIGHT_PX, room)));
  };
  const closePicker = useCallback((refocus: boolean) => {
    setPickerHeight(null);
    if (refocus) area.current?.focus();
  }, []);

  // A press anywhere else closes it (the button toggles it itself).
  useEffect(() => {
    if (!pickerOpen) return;
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node;
      if (picker.current?.contains(target) || emojiButton.current?.contains(target)) return;
      closePicker(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [pickerOpen, closePicker]);

  /** Insert at the box's caret, replacing any selection (the box keeps both while the picker has focus). */
  const insertEmoji = (emoji: string) => {
    const el = area.current;
    const current = el?.value ?? text;
    const start = Math.min(el?.selectionStart ?? current.length, current.length);
    const end = Math.max(start, Math.min(el?.selectionEnd ?? start, current.length));
    pendingCaret.current = start + emoji.length;
    setPickerHeight(null);
    update(current.slice(0, start) + emoji + current.slice(end));
  };

  const length = text.trim().length;
  const tooLong = messageLength(text) > MESSAGE_MAX_LENGTH;
  const canSend = length > 0 && !tooLong && !busy;

  const submit = () => {
    if (!canSend) return;
    const body = text.trim();
    if (clearOnSend) update("");
    onSend(body);
    area.current?.focus();
  };

  const counterId = `${draftKey}-counter`;
  const pickerId = `${draftKey}-emoji`;
  const count = messageLength(text);

  return (
    <div ref={wrap} className="relative shrink-0 px-3 pb-3 pt-2 md:px-5" style={{ borderTop: "1px solid var(--border)" }}>
      {pickerHeight !== null && (
        <div
          ref={picker}
          id={pickerId}
          role="dialog"
          aria-label="Emoji picker"
          onKeyDown={(e) => {
            if (e.key !== "Escape") return;
            e.preventDefault();
            e.stopPropagation();
            closePicker(true);
          }}
          className="absolute bottom-full right-3 z-50 mb-2 w-[min(352px,calc(100%-24px))] md:right-5"
          style={{ boxShadow: "var(--shadow-2)", borderRadius: "var(--r-3)" }}
        >
          <Suspense
            fallback={
              <div
                className="flex items-center justify-center rounded-(--r-3) text-[13px]"
                style={{ height: pickerHeight, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-3)" }}
              >
                Loading emoji…
              </div>
            }
          >
            <EmojiPickerPanel height={pickerHeight} onPick={insertEmoji} />
          </Suspense>
        </div>
      )}
      {context}
      <div className="flex items-end gap-2">
        <textarea
          ref={area}
          value={text}
          onChange={(e) => update(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && pickerOpen) {
              e.preventDefault();
              closePicker(true);
              return;
            }
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
          aria-describedby={count > COUNTER_FROM ? counterId : undefined}
          placeholder={placeholder}
          className="min-h-[42px] flex-1 resize-none rounded-(--r-3) px-3 py-2.5 text-[14px] leading-normal outline-none focus:border-(--ink)"
          style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)" }}
        />
        <button
          ref={emojiButton}
          type="button"
          aria-label="Add emoji"
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          aria-controls={pickerOpen ? pickerId : undefined}
          className="btn-ghost-v2 lg w-[42px] shrink-0 px-0!"
          onPointerEnter={() => void loadPicker()}
          onFocus={() => void loadPicker()}
          onClick={() => (pickerOpen ? closePicker(true) : openPicker())}
        >
          <SmileIcon />
        </button>
        <button type="button" className="btn-primary-v2 sm h-[42px] shrink-0" disabled={!canSend} onClick={submit}>
          {busy ? "Sending…" : sendLabel}
        </button>
      </div>
      <div className="mt-1 flex justify-between gap-3 px-1 font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
        <span className="hidden md:inline">Enter to send · Shift+Enter for a new line</span>
        {count > COUNTER_FROM && (
          <span
            id={counterId}
            className="ml-auto tabular-nums"
            style={{ color: tooLong ? "var(--danger-ink)" : "var(--fg-3)" }}
          >
            {tooLong
              ? `${count - MESSAGE_MAX_LENGTH} characters over the ${MESSAGE_MAX_LENGTH} limit`
              : `${count} / ${MESSAGE_MAX_LENGTH}`}
          </span>
        )}
      </div>
    </div>
  );
});
