/**
 * Small display helpers for the messaging surface: initials, times, day
 * separators, safe links and the shared copy (CONTRACT §11).
 */

import type { ReactNode } from "react";
import { ReadOnlyReason } from "@/lib/api/messaging";

export function initials(name: string | null | undefined): string {
  return (
    (name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function timeOf(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Local calendar day, for grouping messages under a separator. */
export function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** "Today", "Yesterday", "Mon 6 Oct", or "Mon 6 Oct 2025" outside this year. */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const diff = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(d.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
}

/** Inbox row time: the time today, the weekday this week, else the date. */
export function listTime(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
  if (diff === 0) return timeOf(iso);
  if (diff === 1) return "Yesterday";
  if (diff < 7) return d.toLocaleDateString(undefined, { weekday: "short" });
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(d.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
}

/** Full date and time for a `title` / accessible name. */
export function fullTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const URL_PATTERN = /\bhttps?:\/\/[^\s<>"']+/gi;
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/;

/** An http(s) URL, or null for anything else (javascript:, data:, malformed). */
export function safeHref(candidate: string): string | null {
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * Message text with http and https URLs turned into links that open in a
 * new tab. Everything else stays plain text: no HTML is ever interpreted
 * and no preview is fetched (CONTRACT §0 Text).
 */
export function linkify(text: string, linkClassName?: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(URL_PATTERN)) {
    const start = match.index ?? 0;
    let raw = match[0];
    const trailing = raw.match(TRAILING_PUNCTUATION)?.[0] ?? "";
    if (trailing) raw = raw.slice(0, raw.length - trailing.length);
    const href = safeHref(raw);
    if (!href) continue;
    if (start > last) out.push(text.slice(last, start));
    out.push(
      <a
        key={`${start}-${raw}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className={linkClassName ?? "underline underline-offset-2"}
      >
        {raw}
      </a>,
    );
    last = start + raw.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Gym name from an announcement thread title ("<Gym> · announcements"). */
export function gymNameFromTitle(title: string): string {
  return title.replace(/\s*·\s*announcements$/i, "").trim() || "the gym";
}

/** Composer replacement copy for a read-only thread (CONTRACT §11). */
export function readOnlyCopy(reason: ReadOnlyReason, threadTitle: string, gymName?: string | null): string {
  switch (reason) {
    case ReadOnlyReason.MOVED_TO_GYM_INBOX:
      return gymName
        ? `This conversation has moved to ${gymName}'s inbox. You can still read it here.`
        : "This conversation has moved to the gym's inbox. You can still read it here.";
    case ReadOnlyReason.RELATIONSHIP_ENDED:
      return "This conversation has ended. You can still read it, but not send new messages.";
    case ReadOnlyReason.BLOCKED:
      return "You can't send messages in this conversation.";
    case ReadOnlyReason.ANNOUNCEMENTS_ONLY:
      return `Only ${gymNameFromTitle(threadTitle)} can post announcements.`;
    case ReadOnlyReason.UNAVAILABLE:
    default:
      return "This conversation is no longer available for new messages.";
  }
}
