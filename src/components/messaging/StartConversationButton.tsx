"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toast";
import { messagingService } from "@/lib/api/messaging";

/**
 * Starts (or resumes) a relationship-scoped conversation and jumps to the
 * inbox with it open. The server enforces the relationship; a refusal
 * surfaces as a toast rather than a dead click.
 */
export function StartConversationButton({
  recipientUserId,
  organizationId,
  messagesHref,
  label = "Message",
  ariaLabel,
  className = "btn-ghost-v2 sm",
}: {
  recipientUserId?: string;
  organizationId?: string;
  /** The current role's messages route, e.g. /dashboard/dietitian/messages. */
  messagesHref: string;
  label?: string;
  /** Names who the button messages when several sit side by side. */
  ariaLabel?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function start() {
    if (busy) return;
    setBusy(true);
    try {
      const payload = recipientUserId
        ? { recipient_user_id: recipientUserId }
        : organizationId
          ? { organization_id: organizationId }
          : null;
      if (!payload) return;
      const res = await messagingService.startThread(payload);
      if (res.success && res.data) {
        router.push(`${messagesHref}?thread=${encodeURIComponent(res.data.thread_id)}`);
      } else {
        toast.error(res.message || "Couldn't open the conversation.");
      }
    } catch {
      toast.error("Couldn't open the conversation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className={className}
      disabled={busy}
      aria-label={ariaLabel}
      onClick={() => void start()}
    >
      {busy ? "Opening…" : label}
    </button>
  );
}
