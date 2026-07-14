"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import {
  messagingService,
  type ChatMessage,
  type MessageThreadSummary,
} from "@/lib/api/messaging";

const LIST_POLL_MS = 15_000;
const THREAD_POLL_MS = 6_000;

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function timeLabel(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

/**
 * The full messaging surface, shared by every role. Thread list + open
 * conversation + composer, with light polling. A `broadcastOrgId` turns
 * the composer into a gym-wide announcement box for that org's owner.
 */
export function MessagingCenter({
  broadcastOrgId,
}: {
  /** When set, the owner can also post an announcement to this org. */
  broadcastOrgId?: string | null;
}) {
  const { user } = useAuth();
  const myId = user?.id ?? "";
  const searchParams = useSearchParams();

  const [threads, setThreads] = useState<MessageThreadSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [broadcastMode, setBroadcastMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const refreshList = useCallback(async () => {
    const res = await messagingService.listThreads();
    if (res.success && res.data) setThreads(res.data);
    setLoadingList(false);
  }, []);

  const openThread = useCallback(
    async (threadId: string) => {
      setActiveId(threadId);
      setBroadcastMode(false);
      setLoadingThread(true);
      const res = await messagingService.getMessages(threadId);
      if (res.success && res.data) setMessages(res.data.messages);
      setLoadingThread(false);
      // Opening clears the unread badge locally; the server marked it read.
      setThreads((prev) =>
        prev.map((t) =>
          t._id === threadId ? { ...t, unread_count: 0 } : t,
        ),
      );
    },
    [],
  );

  // Initial load + deep link (?thread=…) + list polling.
  useEffect(() => {
    let alive = true;
    const kick = window.setTimeout(() => {
      void refreshList().then(() => {
        if (!alive) return;
        const deep = searchParams.get("thread");
        if (deep) void openThread(deep);
      });
    }, 0);
    const interval = window.setInterval(() => void refreshList(), LIST_POLL_MS);
    return () => {
      alive = false;
      window.clearTimeout(kick);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll the open thread for new messages.
  useEffect(() => {
    if (!activeId) return;
    const interval = window.setInterval(() => {
      void messagingService.getMessages(activeId).then((res) => {
        if (res.success && res.data) setMessages(res.data.messages);
      });
    }, THREAD_POLL_MS);
    return () => window.clearInterval(interval);
  }, [activeId]);

  // Keep the transcript pinned to the latest message.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const activeThread = threads.find((t) => t._id === activeId) ?? null;
  const canPost =
    broadcastMode ||
    (activeThread ? activeThread.kind === "direct" : false) ||
    // Owner replying inside their own broadcast thread is allowed server-side.
    (activeThread?.kind === "broadcast" &&
      activeThread.organization_id === broadcastOrgId);

  async function send() {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      if (broadcastMode && broadcastOrgId) {
        const res = await messagingService.broadcast(broadcastOrgId, text);
        if (res.success) {
          setDraft("");
          await refreshList();
        }
      } else if (activeId) {
        const res = await messagingService.sendMessage(activeId, text);
        if (res.success && res.data) {
          setMessages((prev) => [...prev, res.data as ChatMessage]);
          setDraft("");
          void refreshList();
        }
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: "minmax(0, 300px) 1fr", minHeight: 520 }}
    >
      {/* ── Thread list ── */}
      <div
        className={`rounded-(--r-3) overflow-hidden ${activeId ? "hidden md:block" : ""}`}
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
            Conversations
          </span>
          {broadcastOrgId && (
            <button
              type="button"
              className="btn-ghost-v2 sm"
              onClick={() => {
                setActiveId(null);
                setMessages([]);
                setBroadcastMode(true);
              }}
            >
              Announce
            </button>
          )}
        </div>
        {loadingList ? (
          <AsyncSpinner />
        ) : threads.length === 0 ? (
          <EmptySlate
            message="No conversations yet"
            hint="Messages with your gym, trainer or clients appear here."
          />
        ) : (
          <div className="flex flex-col">
            {threads.map((t) => (
              <button
                key={t._id}
                type="button"
                onClick={() => void openThread(t._id)}
                className="flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{
                  borderBottom: "1px solid var(--border)",
                  background:
                    t._id === activeId ? "var(--bg-2)" : "transparent",
                }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold"
                  style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}
                >
                  {initials(t.counterparty?.name ?? "?")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span
                      className="truncate text-[13.5px] font-medium"
                      style={{ color: "var(--ink)" }}
                    >
                      {t.counterparty?.name ?? "Conversation"}
                    </span>
                    <span
                      className="shrink-0 font-mono text-[10.5px]"
                      style={{ color: "var(--fg-3)" }}
                    >
                      {timeLabel(t.last_message_at)}
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span
                      className="truncate text-[12.5px]"
                      style={{ color: "var(--fg-3)" }}
                    >
                      {t.last_message_preview || "No messages yet"}
                    </span>
                    {t.unread_count > 0 && (
                      <span
                        className="shrink-0 rounded-full px-1.5 text-[10.5px] font-semibold"
                        style={{ background: "var(--ink)", color: "var(--bg)" }}
                      >
                        {t.unread_count}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Conversation ── */}
      <div
        className={`flex flex-col rounded-(--r-3) overflow-hidden ${activeId || broadcastMode ? "" : "hidden md:flex"}`}
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        {!activeId && !broadcastMode ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <span className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>
              Select a conversation.
            </span>
          </div>
        ) : (
          <>
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <button
                type="button"
                className="md:hidden text-[13px]"
                style={{ color: "var(--fg-2)" }}
                onClick={() => {
                  setActiveId(null);
                  setBroadcastMode(false);
                }}
              >
                ← Back
              </button>
              <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                {broadcastMode
                  ? "New announcement"
                  : (activeThread?.counterparty?.name ?? "Conversation")}
              </span>
            </div>

            {!broadcastMode && (
              <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto px-4 py-4"
                style={{ minHeight: 320, maxHeight: 460 }}
              >
                {loadingThread ? (
                  <AsyncSpinner />
                ) : messages.length === 0 ? (
                  <div
                    className="flex h-full items-center justify-center text-[13px]"
                    style={{ color: "var(--fg-3)" }}
                  >
                    Say hello.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {messages.map((m) => {
                      const mine = m.sender_id === myId;
                      return (
                        <div
                          key={m._id}
                          className="flex"
                          style={{
                            justifyContent: mine ? "flex-end" : "flex-start",
                          }}
                        >
                          <div
                            className="max-w-[76%] rounded-(--r-2) px-3 py-2 text-[13.5px]"
                            style={{
                              background: mine ? "var(--ink)" : "var(--bg-2)",
                              color: mine ? "var(--bg)" : "var(--ink)",
                            }}
                          >
                            <div style={{ whiteSpace: "pre-wrap" }}>{m.body}</div>
                            <div
                              className="mt-1 font-mono text-[10px]"
                              style={{
                                color: mine ? "var(--bg-2)" : "var(--fg-3)",
                                textAlign: "right",
                              }}
                            >
                              {timeLabel(m.created_at)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {broadcastMode && (
              <div className="flex-1 px-4 py-4 text-[13px]" style={{ color: "var(--fg-3)" }}>
                This message is sent to every active member of your gym. They
                can&rsquo;t reply to announcements.
              </div>
            )}

            {(canPost || broadcastMode) && (
              <div
                className="flex items-end gap-2 px-3 py-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  rows={1}
                  placeholder={
                    broadcastMode ? "Announcement to all members…" : "Message…"
                  }
                  className="flex-1 resize-none rounded-(--r-2) px-3 py-2 text-[13.5px]"
                  style={{
                    border: "1px solid var(--border-2)",
                    color: "var(--ink)",
                    background: "var(--bg)",
                    maxHeight: 120,
                  }}
                />
                <button
                  type="button"
                  className="btn-primary-v2 sm"
                  disabled={!draft.trim() || sending}
                  onClick={() => void send()}
                >
                  {broadcastMode ? "Send to all" : "Send"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
