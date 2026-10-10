/**
 * Which thread is open on screen right now, so a foreground push for it can
 * sync the transcript instead of raising a toast (CONTRACT §5 "Clients").
 * One open thread per tab; the thread pane registers itself while mounted.
 */

type OpenThread = { threadId: string; syncNow: () => void };

let current: OpenThread | null = null;

export function registerOpenThread(threadId: string, syncNow: () => void): () => void {
  const entry = { threadId, syncNow };
  current = entry;
  return () => {
    if (current === entry) current = null;
  };
}

/** True when this thread is open in a visible tab (and has been told to sync). */
export function syncIfOpen(threadId: string): boolean {
  if (!current || current.threadId !== threadId) return false;
  if (typeof document !== "undefined" && document.visibilityState !== "visible") return false;
  current.syncNow();
  return true;
}

/** The `thread` id in a message push link (`…/messages?thread=<id>`), or null. */
export function threadIdFromLink(link: string | undefined | null): string | null {
  if (!link) return null;
  try {
    const url = new URL(link, "http://local");
    if (!/\/messages$/.test(url.pathname)) return null;
    const id = url.searchParams.get("thread");
    return id && /^[a-f0-9]{24}$/i.test(id) ? id : null;
  } catch {
    return null;
  }
}
