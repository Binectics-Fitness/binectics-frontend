"use client";

import { forwardRef, useState, type ReactNode } from "react";
import { AsyncSpinner } from "@/components/ds";
import { ReadOnlyReason, ThreadKind, ThreadRole, type ThreadState, type ThreadSummary } from "@/lib/api/messaging";
import { Avatar } from "./Avatar";
import { Composer } from "./Composer";
import { MovedToGymNotice } from "./MovedToGymNotice";
import { readOnlyCopy } from "./format";
import { Transcript } from "./Transcript";
import { highestSeq } from "./transcriptModel";
import { useDocumentVisible, useMarkRead, useThreadSync } from "./useThreadSync";

export const THREAD_ID_PATTERN = /^[a-f0-9]{24}$/i;

export function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="-ml-1 flex shrink-0 items-center gap-1 rounded-(--r-2) px-1.5 py-1 text-[14px] md:hidden"
      style={{ color: "var(--fg-2)" }}
      aria-label="Back to conversations"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span className="whitespace-nowrap">Back</span>
    </button>
  );
}

export function PaneMessage({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
        {title}
      </p>
      {body && (
        <p className="max-w-[40ch] text-[14px] leading-relaxed" style={{ color: "var(--fg-3)" }}>
          {body}
        </p>
      )}
      {action}
    </div>
  );
}

function subtitleFor(summary: ThreadSummary | undefined): string | null {
  if (!summary) return null;
  if (summary.kind === ThreadKind.BROADCAST) {
    return summary.my_role === ThreadRole.GYM_OWNER ? "Announcements to members and staff" : "Announcements";
  }
  if (summary.as_gym) return `${summary.as_gym.name} inbox`;
  return null;
}

/**
 * The open conversation: header, transcript, and either the composer or a
 * plain explanation of why this side can't write (no dead composer, web W11).
 * Keyed by thread id by its parent, so nothing from one thread can leak into
 * another.
 */
export const ThreadPane = forwardRef<
  HTMLHeadingElement,
  {
    threadId: string;
    userId: string;
    summary: ThreadSummary | undefined;
    summaryMissing: boolean;
    anchorSeq?: number | null;
    onBack: () => void;
  }
>(function ThreadPane({ threadId, userId, summary, summaryMissing, anchorSeq, onBack }, headingRef) {
  const sync = useThreadSync({ threadId, userId, anchorSeq });
  const visible = useDocumentVisible();
  const [atBottom, setAtBottom] = useState(true);
  
  const transcript = sync.transcript;
  const state: ThreadState | null = transcript?.thread ?? summary ?? null;
  const title = summary?.title ?? "Conversation";
  const kind = summary?.kind ?? ThreadKind.DIRECT;

  useMarkRead({
    threadId,
    userId,
    upToSeq: highestSeq(transcript),
    initialReadSeq: state?.my_last_read_seq ?? 0,
    active: visible && atBottom && sync.status === "ready" && Boolean(transcript?.atTip),
  });

  const gone = sync.status === "gone" || (summaryMissing && !transcript);
  const sending = sync.outbox.some((e) => e.status === "sending");
  const subtitle = subtitleFor(summary);

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-labelledby={`thread-title-${threadId}`}>
      <header className="flex min-h-[57px] shrink-0 items-center gap-3 px-3 py-2.5 md:px-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <BackButton onBack={onBack} />
        <Avatar name={title} url={summary?.avatar_url} size={32} square={kind === ThreadKind.BROADCAST} />
        <div className="min-w-0 flex-1">
          <h2
            id={`thread-title-${threadId}`}
            ref={headingRef}
            tabIndex={-1}
            className="truncate text-[15px] font-medium outline-none"
            style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}
          >
            {title}
          </h2>
          {subtitle && (
            <p className="truncate font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
              {subtitle}
            </p>
          )}
        </div>
      </header>

      {!sync.online && (
        <div className="shrink-0 px-4 py-2 text-[14px] md:text-[13px]" role="status" style={{ background: "var(--bg-2)", color: "var(--fg-2)", borderBottom: "1px solid var(--border)" }}>
          {sending ? "You're offline. Messages will send when you reconnect." : "You're offline"}
        </div>
      )}

      {gone ? (
        <PaneMessage
          title="This conversation isn't available"
          body="It may have been removed, or you no longer have access to it."
          action={
            <button type="button" className="btn-ghost-v2 sm mt-2" onClick={onBack}>
              Back to conversations
            </button>
          }
        />
      ) : sync.status === "error" && !transcript ? (
        <PaneMessage
          title="Couldn't load this conversation"
          body="Check your connection and try again."
          action={
            <button type="button" className="btn-ghost-v2 sm mt-2" onClick={() => void sync.reload()}>
              Try again
            </button>
          }
        />
      ) : sync.status === "loading" || !transcript || !state ? (
        <div className="flex flex-1 items-center justify-center">
          <AsyncSpinner label="Loading messages" />
        </div>
      ) : (
        <>
          <Transcript
            sync={sync}
            kind={kind}
            title={title}
            canSend={state.can_send}
            highlightSeq={anchorSeq}
            onAtBottomChange={setAtBottom}
          />
          {state.can_send ? (
            <Composer
              userId={userId}
              draftKey={threadId}
              label={kind === ThreadKind.BROADCAST ? `Announcement to ${title}` : `Message ${title}`}
              placeholder={kind === ThreadKind.BROADCAST ? "Write an announcement…" : "Message…"}
              context={
                summary?.as_gym && (
                  <p className="mb-1.5 px-1 font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
                    Replying as {summary.as_gym.name}
                  </p>
                )
              }
              onSend={(text) => sync.send(text)}
            />
          ) : state.read_only_reason === ReadOnlyReason.MOVED_TO_GYM_INBOX ? (
            <MovedToGymNotice organizationId={summary?.moved_to_organization_id ?? null} title={title} />
          ) : (
            <p
              className="shrink-0 px-4 py-4 text-center text-[14px] leading-normal md:px-5"
              role="note"
              style={{ borderTop: "1px solid var(--border)", color: "var(--fg-2)", background: "var(--bg-2)" }}
            >
              {readOnlyCopy(state.read_only_reason ?? ReadOnlyReason.UNAVAILABLE, title)}
            </p>
          )}
        </>
      )}
    </section>
  );
});
