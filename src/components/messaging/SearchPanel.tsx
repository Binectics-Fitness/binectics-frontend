"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { AsyncSpinner } from "@/components/ds";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSide, MessagingErrorCode, messagingService, type SearchResult } from "@/lib/api/messaging";
import { Avatar } from "./Avatar";
import { listTime } from "./format";
import { MessagingRequestError } from "./queries";
import { previewText, rowLabel } from "./ThreadList";

export const SEARCH_MIN = 2;
const SEARCH_MAX = 100;

/** The search box at the top of the inbox. Escape clears it. */
export function SearchBox({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  return (
    <div
      className="mt-3 flex h-9 items-center gap-2 rounded-(--r-2) px-2.5 focus-within:border-(--ink)"
      style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true" style={{ color: "var(--fg-3)" }}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={value}
        maxLength={SEARCH_MAX}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            onChange("");
          }
        }}
        placeholder="Search messages"
        aria-label="Search conversations and messages"
        className="min-w-0 flex-1 bg-transparent text-[14px] outline-none md:text-[13px]"
        style={{ color: "var(--ink)" }}
      />
    </div>
  );
}

/** The excerpt with each occurrence of the query marked (plain text, no HTML). */
export function highlight(text: string, q: string): ReactNode[] {
  const needle = q.trim().toLowerCase();
  if (!needle) return [text];
  const out: ReactNode[] = [];
  const hay = text.toLowerCase();
  let from = 0;
  let at = hay.indexOf(needle, from);
  while (at !== -1) {
    if (at > from) out.push(text.slice(from, at));
    out.push(
      <mark key={at} className="rounded-(--r-1) px-px" style={{ background: "var(--bg-3)", color: "var(--ink)" }}>
        {text.slice(at, at + needle.length)}
      </mark>,
    );
    from = at + needle.length;
    at = hay.indexOf(needle, from);
  }
  if (from < text.length) out.push(text.slice(from));
  return out;
}

function useDebounced(value: string, ms: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/**
 * Results for a search over every conversation the person can read now
 * (the server scopes it). Conversations whose name matches come first, then
 * message hits; opening a hit loads the thread around that message.
 */
export function SearchPanel({
  query,
  onOpen,
}: {
  query: string;
  onOpen: (threadId: string, seq?: number) => void;
}) {
  const { user } = useAuth();
  const q = useDebounced(query.trim(), 300);
  const enabled = q.length >= SEARCH_MIN && Boolean(user?.id);

  const search = useInfiniteQuery<SearchResult, MessagingRequestError>({
    queryKey: ["messaging", user?.id ?? "", "search", q],
    enabled,
    initialPageParam: undefined as string | undefined,
    queryFn: async ({ pageParam }) => {
      const res = await messagingService.search({ q, limit: 20, cursor: pageParam as string | undefined });
      if (!res.success || !res.data) {
        throw new MessagingRequestError(res.message ?? "Search failed", res.status, res.code);
      }
      return res.data;
    },
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    staleTime: 30_000,
    retry: false,
  });

  if (query.trim().length < SEARCH_MIN) {
    return (
      <p className="p-6 text-center text-[14px]" style={{ color: "var(--fg-3)" }}>
        Type at least {SEARCH_MIN} characters to search.
      </p>
    );
  }
  if (search.isPending || q !== query.trim()) {
    return (
      <div className="flex justify-center p-6">
        <AsyncSpinner label="Searching" />
      </div>
    );
  }
  if (search.isError) {
    const timeout = search.error.code === MessagingErrorCode.SEARCH_TIMEOUT;
    return (
      <div className="flex flex-col items-center gap-3 p-6 text-center" role="alert">
        <p className="text-[14px]" style={{ color: "var(--ink)" }}>
          {timeout ? "Search took too long, try a longer phrase." : "Couldn't search right now."}
        </p>
        {!timeout && (
          <button type="button" className="btn-ghost-v2 sm" onClick={() => void search.refetch()}>
            Try again
          </button>
        )}
      </div>
    );
  }

  const pages = search.data?.pages ?? [];
  const conversations = pages[0]?.conversations ?? [];
  const hits = pages.flatMap((p) => p.messages);
  const limited = pages.some((p) => p.scope_limited);

  if (conversations.length === 0 && hits.length === 0) {
    return (
      <p className="p-6 text-center text-[14px]" style={{ color: "var(--fg-3)" }} role="status">
        No results for &ldquo;{q}&rdquo;.
      </p>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto" role="region" aria-label={`Search results for ${q}`}>
      <p className="sr-only" role="status">
        {`${conversations.length} conversations and ${hits.length}${search.hasNextPage ? " or more" : ""} messages found`}
      </p>
      {conversations.length > 0 && (
        <section aria-label="Conversations">
          <h3 className="px-4 pb-1 pt-3 font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
            Conversations
          </h3>
          <ul>
            {conversations.map((t) => (
              <li key={t._id} style={{ borderBottom: "1px solid var(--border)" }}>
                <button
                  type="button"
                  onClick={() => onOpen(t._id)}
                  aria-label={rowLabel(t)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-bg-2"
                >
                  <Avatar name={t.title} url={t.avatar_url} size={32} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                      {highlight(t.title, q)}
                    </span>
                    <span className="block truncate text-[13px]" style={{ color: "var(--fg-3)" }}>
                      {previewText(t)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {hits.length > 0 && (
        <section aria-label="Messages">
          <h3 className="px-4 pb-1 pt-3 font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
            Messages
          </h3>
          <ul>
            {hits.map((h) => {
              const author = h.side === MessageSide.MINE ? "You" : h.author_name;
              return (
                <li key={h.message_id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <button
                    type="button"
                    onClick={() => onOpen(h.thread_id, h.seq)}
                    aria-label={`${h.thread_title}, ${author}: ${h.excerpt}, ${listTime(h.created_at)}`}
                    className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left hover:bg-bg-2"
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                        {h.thread_title}
                      </span>
                      <span className="shrink-0 font-mono text-[12px] md:text-[11px]" style={{ color: "var(--fg-3)" }}>
                        {listTime(h.created_at)}
                      </span>
                    </span>
                    <span className="line-clamp-2 text-[14px] md:text-[13px]" style={{ color: "var(--fg-2)" }}>
                      <span className="font-medium">{author}: </span>
                      {highlight(h.excerpt, q)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {search.hasNextPage && (
        <div className="flex justify-center p-3">
          <button
            type="button"
            className="btn-ghost-v2 sm"
            disabled={search.isFetchingNextPage}
            onClick={() => void search.fetchNextPage()}
          >
            {search.isFetchingNextPage ? "Loading…" : "More results"}
          </button>
        </div>
      )}
      {limited && (
        <p className="px-4 pb-4 text-[13px]" style={{ color: "var(--fg-3)" }}>
          Searched your 1,000 most recently active conversations.
        </p>
      )}
    </div>
  );
}
