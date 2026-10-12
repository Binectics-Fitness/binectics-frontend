"use client";

import { Fragment, useCallback, useId, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { MessageSide, ThreadKind, type ChatMessage } from "@/lib/api/messaging";
import { MessageBubble, PendingBubble } from "./MessageBubble";
import { dayKey, dayLabel } from "./format";
import type { ThreadSync } from "./useThreadSync";

/** Within this many pixels of the end counts as "at the bottom" (about one bubble). */
const BOTTOM_SLACK_PX = 80;
/** Start loading older history this close to the top. */
const TOP_TRIGGER_PX = 160;

export interface MessageDecorations {
  actions?: ReactNode;
  reactions?: ReactNode;
  /** Replaces the text while the message is being edited. */
  editor?: ReactNode;
  bubbleProps?: React.HTMLAttributes<HTMLDivElement> & { "data-message-id"?: string };
}

/** Each message with the day separator before it and whether to name its author. */
export function buildRows(messages: ChatMessage[], kind: ThreadKind, now: Date) {
  let previousDay = "";
  let previousAuthor = "";
  return messages.map((message) => {
    const day = dayKey(message.created_at);
    const separator = day !== previousDay ? dayLabel(message.created_at, now) : null;
    const authorKey = `${message.side}:${message.author.name}`;
    // Announcements name their author; one-to-one threads don't need to.
    const showAuthor =
      kind === ThreadKind.BROADCAST &&
      message.side !== MessageSide.MINE &&
      (separator !== null || authorKey !== previousAuthor);
    previousDay = day;
    previousAuthor = authorKey;
    return { message, separator, showAuthor };
  });
}

function DaySeparator({ label }: { label: string }) {
  return (
    <div className="my-2 flex items-center gap-3" role="separator" aria-label={label}>
      <span className="h-px flex-1" style={{ background: "var(--border)" }} />
      <span className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }} aria-hidden="true">
        {label}
      </span>
      <span className="h-px flex-1" style={{ background: "var(--border)" }} />
    </div>
  );
}

/**
 * The scrolling message list (CONTRACT §6.3):
 * - sticks to the bottom only when the reader is already there; otherwise a
 *   "New messages" pill appears (web B1);
 * - older history is prepended with the reading position anchored;
 * - new incoming messages are announced through a polite live region.
 */
export function Transcript({
  sync,
  kind,
  title,
  canSend,
  highlightSeq,
  onAtBottomChange,
  onOpenReply,
  decorate,
}: {
  sync: ThreadSync;
  kind: ThreadKind;
  title: string;
  canSend: boolean;
  highlightSeq?: number | null;
  onAtBottomChange: (atBottom: boolean) => void;
  onOpenReply?: (seq: number) => void;
  decorate?: (message: ChatMessage) => MessageDecorations;
}) {
  const { transcript, outbox } = sync;
  const messages = useMemo(() => transcript?.messages ?? [], [transcript]);
  const ref = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);
  const snapshot = useRef({ scrollTop: 0, scrollHeight: 0, firstId: "", lastKey: "", ready: false });
  const [pill, setPill] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const hintId = useId();
  const [announcement, setAnnouncement] = useState("");

  const lastKey = `${messages.at(-1)?._id ?? ""}|${outbox.length}`;
  const firstId = messages[0]?._id ?? "";

  const setAtBottom = useCallback(
    (value: boolean) => {
      if (atBottom.current === value) return;
      atBottom.current = value;
      setIsAtBottom(value);
      onAtBottomChange(value);
      if (value) setPill(0);
    },
    [onAtBottomChange],
  );

  const scrollToBottom = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    snapshot.current.scrollTop = el.scrollTop;
    setAtBottom(true);
  }, [setAtBottom]);

  // Keep the reading position stable across every content change.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const prev = snapshot.current;

    if (!prev.ready && messages.length + outbox.length > 0) {
      // First paint: the latest message, or the search hit.
      const hit = highlightSeq ? el.querySelector<HTMLElement>(`[data-seq="${highlightSeq}"]`) : null;
      if (hit) {
        el.scrollTop = Math.max(0, hit.offsetTop - el.clientHeight / 3);
        setAtBottom(false);
      } else {
        el.scrollTop = el.scrollHeight;
        // A window that isn't at the tip can't be "at the bottom" for read marks.
        setAtBottom(Boolean(transcript?.atTip));
      }
    } else if (prev.ready && firstId !== prev.firstId && lastKey === prev.lastKey) {
      // Older history prepended: keep the same message under the reader's eyes.
      el.scrollTop = prev.scrollTop + (el.scrollHeight - prev.scrollHeight);
    } else if (prev.ready && lastKey !== prev.lastKey) {
      const lastPrevIndex = messages.findIndex((m) => `${m._id}` === prev.lastKey.split("|")[0]);
      const arrived = lastPrevIndex >= 0 ? messages.slice(lastPrevIndex + 1) : [];
      const theirs = arrived.filter((m) => m.side !== MessageSide.MINE);
      const sentByMe = outbox.length > Number(prev.lastKey.split("|")[1] ?? 0);
      if (atBottom.current || sentByMe) {
        el.scrollTop = el.scrollHeight;
      } else if (theirs.length > 0) {
        setPill((n) => n + theirs.length);
      }
      if (theirs.length > 0) {
        const last = theirs[theirs.length - 1];
        setAnnouncement(
          last.deleted_at
            ? ""
            : `New message from ${last.author.name}: ${last.body.slice(0, 140)}`,
        );
      }
    }

    snapshot.current = {
      scrollTop: el.scrollTop,
      scrollHeight: el.scrollHeight,
      firstId,
      lastKey,
      ready: prev.ready || messages.length + outbox.length > 0,
    };
  }, [firstId, highlightSeq, lastKey, messages, outbox.length, setAtBottom, transcript?.atTip]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    snapshot.current.scrollTop = el.scrollTop;
    const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < BOTTOM_SLACK_PX;
    setAtBottom(bottom && Boolean(transcript?.atTip));
    if (el.scrollTop < TOP_TRIGGER_PX && transcript?.hasOlder && !sync.loadingOlder) void sync.loadOlder();
    if (bottom && transcript && !transcript.atTip && !sync.loadingNewer) void sync.loadNewer();
  };

  // Arrow keys move between messages (one tab stop for the whole list);
  // Enter or Shift+F10 on a message opens its actions.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowUp" && e.key !== "ArrowDown" && e.key !== "Home" && e.key !== "End") return;
    const target = e.target as HTMLElement;
    if (target !== e.currentTarget && !target.hasAttribute("data-message-id")) return;
    const bubbles = [...e.currentTarget.querySelectorAll<HTMLElement>("[data-message-id]")];
    if (bubbles.length === 0) return;
    const i = bubbles.indexOf(target);
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? bubbles.length - 1
          : i === -1
            ? bubbles.length - 1
            : Math.min(bubbles.length - 1, Math.max(0, i + (e.key === "ArrowDown" ? 1 : -1)));
    e.preventDefault();
    bubbles[next].focus();
    bubbles[next].scrollIntoView?.({ block: "nearest" });
  };

  const showPill = (pill > 0 && !isAtBottom) || Boolean(transcript?.newerAvailable);

  const jump = async () => {
    if (transcript && (!transcript.atTip || transcript.newerAvailable)) await sync.jumpToLatest();
    requestAnimationFrame(scrollToBottom);
  };

  // "Read" goes under my latest message the counterpart has read (direct and gym only).
  const readSeq = useMemo(() => {
    const cursor = transcript?.thread.counterpart_last_read_seq;
    if (kind === ThreadKind.BROADCAST || cursor === null || cursor === undefined) return null;
    let best: number | null = null;
    for (const m of messages) {
      if (m.side === MessageSide.MINE && !m.deleted_at && m.seq <= cursor) best = m.seq;
    }
    return best;
  }, [kind, messages, transcript?.thread.counterpart_last_read_seq]);

  const rows = useMemo(() => buildRows(messages, kind, new Date()), [messages, kind]);
  const lastDay = messages.length ? dayKey(messages[messages.length - 1].created_at) : "";
  const todayKey = dayKey(new Date().toISOString());

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={ref}
        onScroll={onScroll}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4 md:px-5"
        role="log"
        aria-live="off"
        aria-label={`Messages with ${title}`}
        aria-describedby={decorate ? hintId : undefined}
        tabIndex={0}
        onKeyDown={decorate ? onKeyDown : undefined}
      >
        {transcript?.hasOlder && (
          <div className="mb-3 flex justify-center">
            <button
              type="button"
              className="btn-ghost-v2 sm"
              disabled={sync.loadingOlder}
              onClick={() => void sync.loadOlder()}
            >
              {sync.loadingOlder ? "Loading earlier messages…" : "Load earlier messages"}
            </button>
          </div>
        )}

        {messages.length === 0 && outbox.length === 0 ? (
          <p className="flex h-full items-center justify-center text-center text-[14px]" style={{ color: "var(--fg-3)" }}>
            {canSend ? "No messages yet. Write the first one below." : "No messages yet."}
          </p>
        ) : (
          <ol className="flex flex-col gap-3" aria-label={`Conversation with ${title}`}>
            {rows.map(({ message: m, separator, showAuthor }) => {
              const deco = decorate?.(m);
              return (
                <Fragment key={m._id}>
                  {separator && (
                    <li>
                      <DaySeparator label={separator} />
                    </li>
                  )}
                  <li>
                    <MessageBubble
                      message={m}
                      showAuthor={showAuthor}
                      showStaffSender
                      isRead={readSeq === m.seq}
                      highlighted={highlightSeq === m.seq}
                      actions={deco?.actions}
                      reactions={deco?.reactions}
                      editor={deco?.editor}
                      bubbleProps={deco?.bubbleProps}
                      onOpenReply={onOpenReply}
                    />
                  </li>
                </Fragment>
              );
            })}
            {outbox.length > 0 && lastDay !== todayKey && (
              <li>
                <DaySeparator label="Today" />
              </li>
            )}
            {outbox.map((entry) => (
              <li key={entry.client_message_id}>
                <PendingBubble
                  entry={entry}
                  threadTitle={title}
                  onRetry={() => sync.retry(entry.client_message_id)}
                  onDiscard={() => sync.discard(entry.client_message_id)}
                />
              </li>
            ))}
          </ol>
        )}

        {transcript && !transcript.atTip && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              className="btn-ghost-v2 sm"
              disabled={sync.loadingNewer}
              onClick={() => void sync.loadNewer()}
            >
              {sync.loadingNewer ? "Loading newer messages…" : "Load newer messages"}
            </button>
          </div>
        )}
      </div>

      {showPill && (
        <button
          type="button"
          onClick={() => void jump()}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full px-3.5 py-1.5 text-[13px] font-medium"
          style={{ background: "var(--ink)", color: "var(--bg)" }}
          aria-label="New messages. Jump to the latest"
        >
          New messages <span aria-hidden="true">↓</span>
        </button>
      )}

      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      {decorate && (
        <p id={hintId} className="sr-only">
          Use the up and down arrow keys to move between messages, then Enter for message actions.
        </p>
      )}
    </div>
  );
}
