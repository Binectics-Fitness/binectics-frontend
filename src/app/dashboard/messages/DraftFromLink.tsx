"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { loadDraft, saveDraft } from "@/components/messaging/messagingStorage";
import { THREAD_ID_PATTERN } from "@/components/messaging/ThreadPane";
import { FAST_DRAFT_NOTE } from "@/lib/solo/fastingCopy";

/** Longer than any draft the app builds; a pasted link cannot stuff the composer. */
export const MAX_LINK_DRAFT = 500;
/** The app's own drafts start like this, so a newer one may replace an older one left unsent. */
const APP_DRAFT_PREFIX = "I'm planning a";

/**
 * `?thread=<id>&draft=<text>`: open that conversation with the text waiting
 * in its composer (the fasting page's "Tell <coach>", mobile #251). It is
 * NEVER sent: it is only put where the composer keeps its unsent draft, and
 * the member presses Send or edits or clears it. Text the member already
 * typed there is kept, unless it is an earlier draft of the same kind. The
 * draft is then taken out of the address so a reload or Back does not put
 * it in again, and a short note says nothing has been sent.
 */
export function DraftFromLink({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const thread = params.get("thread");
  const draft = params.get("draft");
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [handled, setHandled] = useState<string | null>(null);
  const validThread = thread && THREAD_ID_PATTERN.test(thread) ? thread : null;
  const key = draft !== null && userId ? `${thread ?? ""}\n${draft}` : null;

  // Put the draft where the composer keeps its unsent text, once per link,
  // before the composer opens (it reads its draft once, when it opens).
  // Idempotent: writing the same text twice changes nothing.
  if (key !== null && handled !== key) {
    const text = (draft ?? "").trim().slice(0, MAX_LINK_DRAFT);
    let placed = false;
    if (validThread && text) {
      const existing = loadDraft(userId, validThread).trim();
      if (!existing || existing === text || existing.startsWith(APP_DRAFT_PREFIX)) {
        saveDraft(userId, validThread, text);
        placed = true;
      }
    }
    setHandled(key);
    // The note shows only over a draft this link put there.
    setNoteFor(placed ? validThread : "");
  }
  const pending = draft !== null && (key === null || handled !== key);

  // Then take the draft out of the address.
  useEffect(() => {
    if (draft === null || key === null || handled !== key) return;
    router.replace(validThread ? `${pathname}?thread=${encodeURIComponent(validThread)}` : pathname, { scroll: false });
  }, [draft, key, handled, validThread, pathname, router]);

  // Hold the inbox for the moment it takes to put the draft in place, so the
  // composer opens with it (it reads its draft once, when it opens).
  if (pending) return null;
  return (
    <>
      {noteFor && noteFor === thread && (
        <p role="status" className="mb-2 text-[13px]" style={{ color: "var(--fg-2)" }} data-testid="draft-note">
          {FAST_DRAFT_NOTE}
        </p>
      )}
      {children}
    </>
  );
}
