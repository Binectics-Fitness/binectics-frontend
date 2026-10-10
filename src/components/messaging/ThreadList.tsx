"use client";

import { AsyncSpinner } from "@/components/ds";
import { MessageSide, ThreadKind, type ThreadSummary } from "@/lib/api/messaging";
import { Avatar } from "./Avatar";
import { listTime } from "./format";

export function previewText(t: ThreadSummary): string {
  const last = t.last_message;
  if (!last) return "No messages yet";
  if (last.deleted) return last.side === MessageSide.MINE ? "You: Message deleted" : "Message deleted";
  const text = last.preview ?? "";
  return last.side === MessageSide.MINE ? `You: ${text}` : text;
}

/** One clean accessible name per row: who, how many unread, the latest line, when. */
export function rowLabel(t: ThreadSummary): string {
  const parts = [t.title];
  if (t.as_gym && t.kind !== ThreadKind.BROADCAST) parts.push(`${t.as_gym.name} inbox`);
  if (t.unread_count > 0) parts.push(`${t.unread_count} unread`);
  if (t.muted) parts.push("muted");
  parts.push(previewText(t));
  if (t.last_message) parts.push(listTime(t.last_message.created_at));
  return parts.join(", ");
}

function MutedIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13.7 21a2 2 0 0 1-3.4 0M18.6 13A17.9 17.9 0 0 1 18 8M6.3 6.3A6 6 0 0 0 6 8c0 7-3 9-3 9h14M18 8a6 6 0 0 0-9.3-5M2 2l20 20" />
    </svg>
  );
}

export function ThreadList({
  threads,
  status,
  activeId,
  emptyHint,
  onOpen,
  onRetry,
}: {
  threads: ThreadSummary[];
  status: "loading" | "error" | "ready";
  activeId: string | null;
  emptyHint: string;
  onOpen: (threadId: string) => void;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {status === "loading" ? (
        <div className="flex flex-1 items-center justify-center">
          <AsyncSpinner label="Loading conversations" />
        </div>
      ) : status === "error" && threads.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
          <p className="text-[14px]" style={{ color: "var(--ink)" }}>
            Couldn&rsquo;t load your conversations.
          </p>
          <button type="button" className="btn-ghost-v2 sm" onClick={onRetry}>
            Try again
          </button>
        </div>
      ) : threads.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-1.5 p-6 text-center">
          <p className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
            No conversations yet
          </p>
          <p className="max-w-[32ch] text-[14px] leading-normal md:text-[13px]" style={{ color: "var(--fg-3)" }}>
            {emptyHint}
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto" aria-label="Conversations">
          {threads.map((t) => {
            const active = t._id === activeId;
            const unread = t.unread_count > 0;
            return (
              <li key={t._id} className="relative" style={{ borderBottom: "1px solid var(--border)" }}>
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-2 left-0 top-2 w-0.5 rounded-full"
                    style={{ background: "var(--ink)" }}
                  />
                )}
                <button
                  type="button"
                  data-thread-id={t._id}
                  onClick={() => onOpen(t._id)}
                  aria-current={active ? "true" : undefined}
                  aria-label={rowLabel(t)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-bg-2"
                  // The open row is marked by the ink bar and stays on --bg, so
                  // its secondary text keeps AA contrast (prototype .conv.on).
                >
                  <Avatar name={t.title} url={t.avatar_url} square={t.kind === ThreadKind.BROADCAST} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                        {t.title}
                      </span>
                      <span className="shrink-0 font-mono text-[12px] md:text-[11px]" style={{ color: "var(--fg-2)" }}>
                        {listTime(t.last_message?.created_at)}
                      </span>
                    </span>
                    {t.as_gym && t.kind !== ThreadKind.BROADCAST && (
                      <span className="block truncate text-[12px] font-mono uppercase tracking-[0.04em]" style={{ color: "var(--fg-2)" }}>
                        {t.as_gym.name} inbox
                      </span>
                    )}
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-[14px] md:text-[13px] ${unread ? "font-medium" : ""}`}
                        style={{ color: unread ? "var(--ink)" : "var(--fg-2)" }}
                      >
                        {previewText(t)}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5" style={{ color: "var(--fg-3)" }}>
                        {t.muted && <MutedIcon />}
                        {unread && (
                          <span
                            className="min-w-5 rounded-full px-1.5 text-center font-mono text-[12px] md:text-[11px] tabular-nums"
                            style={{ background: "var(--ink)", color: "var(--bg)" }}
                          >
                            {t.unread_count > 99 ? "99+" : t.unread_count}
                          </span>
                        )}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
