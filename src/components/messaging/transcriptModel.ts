/**
 * The transcript of one open thread: one contiguous window of server
 * messages ordered by `seq`, plus the cursors needed to stay current.
 * Pure functions only, so the merge rules (CONTRACT §6.3) are testable
 * without React.
 */

import type { ChatMessage, MessagesPage, ThreadState } from "@/lib/api/messaging";

export interface Transcript {
  /** Server messages in the window, ascending `seq`. */
  messages: ChatMessage[];
  /** True when the window ends at the newest message in the thread. */
  atTip: boolean;
  /** True when older history exists before the window. */
  hasOlder: boolean;
  /** Cursor for the next `since_rev` poll, passed back verbatim. */
  nextRev: number;
  /** Newer messages exist past a window that isn't at the tip. */
  newerAvailable: boolean;
  thread: ThreadState;
}

const loSeq = (t: Transcript) => (t.messages.length ? t.messages[0].seq : null);
const hiSeq = (t: Transcript) => (t.messages.length ? t.messages[t.messages.length - 1].seq : null);

/** Insert or replace by `_id`, keeping the copy with the higher `rev`, then re-sort by `seq`. */
export function upsertMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  if (incoming.length === 0) return existing;
  const byId = new Map(existing.map((m) => [m._id, m]));
  for (const m of incoming) {
    const current = byId.get(m._id);
    if (!current || m.rev >= current.rev) byId.set(m._id, m);
  }
  return [...byId.values()].sort((a, b) => a.seq - b.seq);
}

/** A fresh window from a latest-page load (no cursor). */
export function fromLatest(page: MessagesPage): Transcript {
  return {
    messages: upsertMessages([], page.messages),
    atTip: true,
    hasOlder: page.has_more,
    nextRev: page.next_rev,
    newerAvailable: false,
    thread: page.thread,
  };
}

/** A window that starts at a search hit (`before_seq = hit.seq + 1`): not at the tip. */
export function fromAnchor(page: MessagesPage, latestSeq: number): Transcript {
  const messages = upsertMessages([], page.messages);
  const hi = messages.length ? messages[messages.length - 1].seq : 0;
  return {
    messages,
    atTip: hi >= latestSeq,
    hasOlder: page.has_more,
    nextRev: page.next_rev,
    newerAvailable: false,
    thread: page.thread,
  };
}

/** Older history (`before_seq = lo`), prepended. */
export function prependOlder(t: Transcript, page: MessagesPage): Transcript {
  return {
    ...t,
    messages: upsertMessages(t.messages, page.messages),
    hasOlder: page.has_more,
    thread: page.thread,
  };
}

/** Newer history (`after_seq = hi`) while walking down from a search hit. */
export function appendNewer(t: Transcript, page: MessagesPage): Transcript {
  return {
    ...t,
    messages: upsertMessages(t.messages, page.messages),
    atTip: !page.has_more,
    newerAvailable: page.has_more ? t.newerAvailable : false,
    thread: page.thread,
  };
}

export interface MergeResult {
  transcript: Transcript;
  /** Messages appended at the tip by this merge (new arrivals). */
  appended: ChatMessage[];
}

/**
 * Merge a `since_rev` page (CONTRACT §6.3):
 * - inside the window: update in place (higher `rev` wins);
 * - past the window at the tip: append;
 * - past a window that isn't at the tip: don't append, flag "newer available";
 * - before the window: ignore (it arrives with that history page).
 * Duplicates from the 5 s settle window are absorbed by the `rev` rule.
 */
export function mergeChanges(t: Transcript, page: MessagesPage): MergeResult {
  const lo = loSeq(t);
  const hi = hiSeq(t);
  const known = new Map(t.messages.map((m) => [m._id, m]));
  const inWindow: ChatMessage[] = [];
  const appended: ChatMessage[] = [];
  let newerAvailable = t.newerAvailable;

  for (const m of page.messages) {
    if (known.has(m._id)) {
      inWindow.push(m);
    } else if (hi === null || m.seq > hi) {
      if (t.atTip) appended.push(m);
      else newerAvailable = true;
    } else if (lo !== null && m.seq >= lo) {
      // Inside the window but unseen (a gap filled late): keep it.
      inWindow.push(m);
    }
    // seq < lo: ignored.
  }

  const messages = upsertMessages(t.messages, [...inWindow, ...appended]);
  return {
    transcript: {
      ...t,
      messages,
      nextRev: Math.max(t.nextRev, page.next_rev),
      newerAvailable,
      thread: page.thread,
    },
    appended: appended.filter((m) => !known.has(m._id)),
  };
}

/** Apply one message the server returned for an action (send, edit, delete, react). */
export function applyServerMessage(t: Transcript, m: ChatMessage): Transcript {
  const hi = hiSeq(t);
  const known = t.messages.some((x) => x._id === m._id);
  if (!known && hi !== null && m.seq > hi && !t.atTip) {
    return { ...t, newerAvailable: true };
  }
  return { ...t, messages: upsertMessages(t.messages, [m]) };
}

/** Highest server `seq` in the window, or 0. */
export function highestSeq(t: Transcript | null): number {
  if (!t || t.messages.length === 0) return 0;
  return t.messages[t.messages.length - 1].seq;
}
