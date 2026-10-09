"use client";

import type { ReactNode } from "react";
import { MessageSide, type ChatMessage } from "@/lib/api/messaging";
import type { OutboxEntry } from "./messagingStorage";
import { fullTime, linkify, readOnlyCopy, timeOf } from "./format";

/**
 * One message. Mine sit right on ink, theirs left on bg-2 (prototype
 * `.msg` / `.msg.out`). The accessible text always starts with the author
 * and time ("You, 10:21: …"), so a screen reader never has to infer the
 * sender from alignment.
 */

const BUBBLE =
  "max-w-full rounded-(--r-3) px-3.5 py-2.5 text-[14px] leading-normal whitespace-pre-wrap break-words [overflow-wrap:anywhere]";

function ReplyQuote({
  author,
  excerpt,
  deleted,
  mine,
  onOpen,
}: {
  author: string;
  excerpt: string | null;
  deleted: boolean;
  mine: boolean;
  onOpen?: () => void;
}) {
  const text = deleted ? "Original message deleted" : (excerpt ?? "");
  const body = (
    <>
      <span className="block text-[12.5px] font-medium">{author}</span>
      <span className="block truncate text-[13px]">{text}</span>
    </>
  );
  const style = {
    borderLeft: `2px solid ${mine ? "var(--on-ink-3)" : "var(--border-2)"}`,
    color: mine ? "var(--on-ink-2)" : "var(--fg-2)",
  };
  return onOpen && !deleted ? (
    <button
      type="button"
      onClick={onOpen}
      className="mb-1.5 block w-full min-w-0 pl-2 text-left"
      style={style}
      aria-label={`Replying to ${author}: ${text}. Show original`}
    >
      {body}
    </button>
  ) : (
    <span className="mb-1.5 block min-w-0 pl-2" style={style} aria-label={`Replying to ${author}: ${text}`}>
      {body}
    </span>
  );
}

export function MessageBubble({
  message,
  showAuthor,
  showStaffSender,
  isRead,
  highlighted,
  actions,
  reactions,
  onOpenReply,
  bubbleProps,
}: {
  message: ChatMessage;
  /** Name above theirs-side bubbles in group-like threads (broadcast, gym side). */
  showAuthor: boolean;
  /** Gym-side viewers see who on the team sent an as-gym message. */
  showStaffSender: boolean;
  /** "Read" under my latest message the counterpart has read. */
  isRead: boolean;
  highlighted?: boolean;
  /** Action trigger (hover button), rendered beside the bubble. */
  actions?: ReactNode;
  /** Reaction chips under the bubble. */
  reactions?: ReactNode;
  onOpenReply?: (seq: number) => void;
  /** Focus and keyboard props for the bubble (action menu). */
  bubbleProps?: React.HTMLAttributes<HTMLDivElement> & { "data-message-id"?: string };
}) {
  const mine = message.side === MessageSide.MINE;
  const deleted = Boolean(message.deleted_at);
  const author = mine ? "You" : message.author.name;
  const time = timeOf(message.created_at);

  return (
    <div
      className={`group flex flex-col ${mine ? "items-end" : "items-start"}`}
      data-seq={message.seq}
    >
      {showAuthor && !mine && (
        <span className="mb-1 px-1 text-[12.5px] font-medium" style={{ color: "var(--fg-2)" }}>
          {message.author.name}
        </span>
      )}
      <div className={`flex max-w-[85%] items-center gap-1 md:max-w-[76%] ${mine ? "flex-row-reverse" : ""}`}>
        <div
          {...bubbleProps}
          className={`${BUBBLE} min-w-0 outline-offset-2`}
          style={{
            background: deleted ? "transparent" : mine ? "var(--ink)" : "var(--bg-2)",
            color: deleted ? "var(--fg-3)" : mine ? "var(--bg)" : "var(--ink)",
            border: deleted ? "1px dashed var(--border-2)" : `1px solid ${mine ? "var(--ink)" : "var(--border)"}`,
            outline: highlighted ? "2px solid var(--fg-2)" : undefined,
          }}
        >
          <span className="sr-only">{`${author}, ${time}: `}</span>
          {!deleted && message.reply_to && (
            <ReplyQuote
              author={message.reply_to.author_name}
              excerpt={message.reply_to.excerpt}
              deleted={message.reply_to.deleted}
              mine={mine}
              onOpen={onOpenReply ? () => onOpenReply(message.reply_to!.seq) : undefined}
            />
          )}
          {deleted ? "Message deleted" : linkify(message.body)}
        </div>
        {actions}
      </div>
      {reactions}
      <span
        className="mt-1 flex items-center gap-1.5 px-1 font-mono text-[11px]"
        style={{ color: "var(--fg-3)" }}
      >
        <time dateTime={message.created_at} title={fullTime(message.created_at)}>
          {time}
        </time>
        {message.edited_at && !deleted && <span>· Edited</span>}
        {showStaffSender && message.staff_sender && <span>· Sent by {message.staff_sender.name}</span>}
        {isRead && <span>· Read</span>}
      </span>
    </div>
  );
}

/** A message still in the outbox: sending, or failed with Retry / Discard. */
export function PendingBubble({
  entry,
  threadTitle,
  onRetry,
  onDiscard,
}: {
  entry: OutboxEntry;
  threadTitle: string;
  onRetry: () => void;
  onDiscard: () => void;
}) {
  const failed = entry.status === "failed";
  const failure = entry.failure;
  const canRetry = failed && (failure?.kind === "retryable" || failure?.kind === "reused");
  const reason =
    failure?.kind === "read_only"
      ? readOnlyCopy(failure.reason, threadTitle)
      : failure?.kind === "refused"
        ? failure.message
        : null;

  return (
    <div className="flex flex-col items-end" aria-live={failed ? "polite" : undefined}>
      <div className="flex max-w-[85%] md:max-w-[76%]">
        <div
          className={BUBBLE}
          style={{
            background: failed ? "var(--danger-soft)" : "var(--ink)",
            color: failed ? "var(--ink)" : "var(--bg)",
            border: `1px solid ${failed ? "var(--danger)" : "var(--ink)"}`,
            opacity: failed ? 1 : 0.6,
          }}
        >
          <span className="sr-only">{failed ? "You, not sent: " : "You, sending: "}</span>
          {entry.reply_to && (
            <ReplyQuote
              author={entry.reply_to.author_name}
              excerpt={entry.reply_to.excerpt}
              deleted={false}
              mine={!failed}
            />
          )}
          {entry.body}
        </div>
      </div>
      {failed ? (
        <div className="mt-1 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 px-1 text-[13px]">
          <span style={{ color: "var(--danger-ink)" }}>
            {reason ? `Not sent: ${reason}` : "Not sent"}
          </span>
          {canRetry && (
            <button type="button" className="font-medium underline underline-offset-2" style={{ color: "var(--ink)" }} onClick={onRetry}>
              Retry
            </button>
          )}
          <button type="button" className="underline underline-offset-2" style={{ color: "var(--fg-2)" }} onClick={onDiscard}>
            Discard
          </button>
        </div>
      ) : (
        <span className="mt-1 px-1 font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
          Sending…
        </span>
      )}
    </div>
  );
}
