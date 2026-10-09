"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AnnouncePanel } from "./AnnouncePanel";
import { useInbox, useThreadSummary, type MessagingRequestError } from "./queries";
import { ThreadList } from "./ThreadList";
import { PaneMessage, THREAD_ID_PATTERN, ThreadPane } from "./ThreadPane";

const WIDE = "(min-width: 48rem)";

function isWide(): boolean {
  return typeof window === "undefined" || typeof window.matchMedia !== "function" || window.matchMedia(WIDE).matches;
}

export interface MessagingCenterProps {
  /** Who this inbox is for, in the empty state. */
  emptyHint: string;
  /** When set, the owner can post an announcement to this gym. */
  broadcastOrg?: { id: string; name: string } | null;
}

/**
 * The messaging surface shared by every role: the inbox, the open
 * conversation and the composer. The open thread lives in the URL
 * (`?thread=<id>`, plus `&seq=<n>` to open at a message), so refresh, Back,
 * deep links and notification links all land on the same conversation.
 * Under the md breakpoint one pane shows at a time.
 */
export function MessagingCenter({ emptyHint, broadcastOrg }: MessagingCenterProps) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawThread = searchParams.get("thread");
  const activeId = rawThread && rawThread.length > 0 ? rawThread : null;
  const validId = activeId && THREAD_ID_PATTERN.test(activeId) ? activeId : null;
  const seqParam = Number(searchParams.get("seq"));
  const anchorSeq = validId && Number.isInteger(seqParam) && seqParam > 0 ? seqParam : null;

  const [announcing, setAnnouncing] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const lastOpened = useRef<string | null>(null);

  const inbox = useInbox();
  const summary = useThreadSummary(validId);
  const summaryError = summary.error as MessagingRequestError | null;
  const summaryMissing = summaryError ? [400, 403, 404].includes(summaryError.status ?? 0) : false;

  const threads = inbox.data?.threads ?? [];
  const listStatus = inbox.isLoading ? "loading" : inbox.isError ? "error" : "ready";

  const open = useCallback(
    (threadId: string, seq?: number) => {
      setAnnouncing(false);
      const query = `?thread=${encodeURIComponent(threadId)}${seq ? `&seq=${seq}` : ""}`;
      // From the list into a thread is a step Back should undo; thread to
      // thread is a switch that shouldn't pile up history.
      if (activeId) router.replace(`${pathname}${query}`, { scroll: false });
      else router.push(`${pathname}${query}`, { scroll: false });
    },
    [activeId, pathname, router],
  );

  const back = useCallback(() => {
    lastOpened.current = activeId;
    setAnnouncing(false);
    router.replace(pathname, { scroll: false });
  }, [activeId, pathname, router]);

  // Focus: on narrow screens the list disappears when a thread opens, so
  // move focus to the conversation heading; on Back, return it to the row.
  useEffect(() => {
    if (activeId && !isWide()) {
      requestAnimationFrame(() => heading.current?.focus());
    }
    if (!activeId && lastOpened.current && !isWide()) {
      const id = lastOpened.current;
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>(`[data-thread-id="${id}"]`)?.focus(),
      );
    }
  }, [activeId]);

  const showConversation = Boolean(activeId) || announcing;

  return (
    <div className="grid h-[calc(100dvh-10rem)] min-h-[440px] grid-cols-1 gap-3 md:h-[calc(100dvh-11rem)] md:min-h-[520px] md:grid-cols-[minmax(260px,320px)_minmax(0,1fr)]">
      <div
        className={`min-h-0 min-w-0 flex-col overflow-hidden rounded-(--r-3) ${showConversation ? "hidden md:flex" : "flex"}`}
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        <ThreadList
          threads={threads}
          status={listStatus}
          activeId={activeId}
          emptyHint={emptyHint}
          onOpen={(id) => open(id)}
          onRetry={() => void inbox.refetch()}
          header={
            <div className="shrink-0 px-4 pb-3 pt-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                  Conversations
                </h2>
                {broadcastOrg && (
                  <button
                    type="button"
                    className="btn-ghost-v2 sm"
                    aria-pressed={announcing}
                    onClick={() => {
                      if (activeId) router.replace(pathname, { scroll: false });
                      setAnnouncing(true);
                    }}
                  >
                    Announce
                  </button>
                )}
              </div>
            </div>
          }
        />
      </div>

      <div
        className={`min-h-0 min-w-0 flex-col overflow-hidden rounded-(--r-3) ${showConversation ? "flex" : "hidden md:flex"}`}
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        {announcing && broadcastOrg ? (
          <AnnouncePanel
            userId={userId}
            organizationId={broadcastOrg.id}
            gymName={broadcastOrg.name}
            onBack={back}
            onSent={(threadId) => {
              setAnnouncing(false);
              void inbox.refetch();
              router.replace(`${pathname}?thread=${encodeURIComponent(threadId)}`, { scroll: false });
            }}
          />
        ) : activeId && !validId ? (
          <PaneMessage
            title="This conversation isn't available"
            body="The link may be incomplete. Choose a conversation from your list."
            action={
              <button type="button" className="btn-ghost-v2 sm mt-2" onClick={back}>
                Back to conversations
              </button>
            }
          />
        ) : validId && userId ? (
          <ThreadPane
            key={`${validId}:${anchorSeq ?? ""}`}
            ref={heading}
            threadId={validId}
            userId={userId}
            summary={summary.data}
            summaryMissing={summaryMissing}
            anchorSeq={anchorSeq}
            onBack={back}
          />
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
            <p className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
              No conversation selected
            </p>
            <p className="max-w-[34ch] text-[14px] leading-relaxed" style={{ color: "var(--fg-3)" }}>
              {threads.length > 0 ? "Choose a conversation to read and reply." : emptyHint}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
