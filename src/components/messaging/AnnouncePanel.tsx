"use client";

import { useRef, useState } from "react";
import { toast } from "@/components/Toast";
import { messagingService } from "@/lib/api/messaging";
import { Composer, type ComposerHandle } from "./Composer";
import { newClientMessageId } from "./messagingStorage";
import { BackButton } from "./ThreadPane";

/**
 * Gym owner: write an announcement to every active member and staff member
 * of the gym (the API's audience). On success the announcements thread
 * opens; on failure the text stays put. A retry of the same text reuses the
 * same client id, so a lost response can't post it twice.
 */
export function AnnouncePanel({
  userId,
  organizationId,
  gymName,
  onSent,
  onBack,
}: {
  userId: string;
  organizationId: string;
  gymName: string | null;
  onSent: (threadId: string) => void;
  onBack: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const attempt = useRef<{ body: string; id: string } | null>(null);
  const [failed, setFailed] = useState(false);
  const composer = useRef<ComposerHandle>(null);

  const send = async (body: string) => {
    if (busy) return;
    if (attempt.current?.body !== body) attempt.current = { body, id: newClientMessageId() };
    setBusy(true);
    setFailed(false);
    const res = await messagingService.broadcast({
      organization_id: organizationId,
      body,
      client_message_id: attempt.current.id,
    });
    setBusy(false);
    if (res.success && res.data) {
      attempt.current = null;
      composer.current?.clear();
      toast.success("Announcement sent.");
      onSent(res.data.thread_id);
    } else {
      setFailed(true);
      toast.error(res.message || "Couldn't send the announcement. Try again.");
    }
  };

  return (
    <section className="flex min-h-0 flex-1 flex-col" aria-labelledby="announce-title">
      <header className="flex min-h-[57px] shrink-0 items-center gap-3 px-3 py-2.5 md:px-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <BackButton onBack={onBack} />
        <h2 id="announce-title" tabIndex={-1} className="truncate text-[15px] font-medium outline-none" style={{ color: "var(--ink)" }}>
          New announcement
        </h2>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-4 text-[14px] leading-relaxed md:px-5" style={{ color: "var(--fg-2)" }}>
        <p className="max-w-[56ch]">
          Sent to every active member and staff member of {gymName ?? "your gym"}. They&rsquo;ll get a notification and can
          read it in their messages, but they can&rsquo;t reply to announcements.
        </p>
        {failed && (
          <p className="mt-3" role="alert" style={{ color: "var(--danger-ink)" }}>
            Not sent. Your announcement is still in the box below; send it again when you&rsquo;re ready.
          </p>
        )}
      </div>
      <Composer
        ref={composer}
        userId={userId}
        draftKey={`announce-${organizationId}`}
        label="Announcement to all members and staff"
        placeholder="Write an announcement…"
        sendLabel="Send to all"
        busy={busy}
        onSend={(text) => void send(text)}
        clearOnSend={false}
      />
    </section>
  );
}
