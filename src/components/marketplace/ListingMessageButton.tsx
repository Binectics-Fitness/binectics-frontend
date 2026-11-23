"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProviders } from "@/components/messaging/MyCoachesCard";
import { messagingService } from "@/lib/api/messaging";
import type { MyProviders } from "@/lib/api/marketplace";
import { UserRole } from "@/lib/types";
import { toast } from "@/components/Toast";

export type MessageGate =
  | { kind: "hidden" }
  | { kind: "checking" }
  | { kind: "signin" }
  | { kind: "open"; payload: { recipient_user_id: string } | { organization_id: string } }
  | { kind: "blocked"; reason: string };

/** The API's refusal for a member who isn't connected (mobile getMessagingErrorMessage). */
export const NOT_CONNECTED_MESSAGE = "You can only message providers you are connected to. Send a connection request first.";

/**
 * Who may message this listing, read off what the API already says
 * (messaging is relationship-gated: a client of the professional, or an
 * active member of the gym; the API is still the judge on send).
 * - signed out: Message goes through sign-in;
 * - a provider or admin viewing a listing: no Message here;
 * - a member already connected: Message opens the thread;
 * - a member not connected: disabled, with the reason, beside the action
 *   that connects them (Request to connect, or a gym plan);
 * - my-providers unreadable: offered, and a refusal is explained.
 */
export function resolveMessageGate(input: {
  signedIn: boolean;
  authLoading: boolean;
  isMember: boolean;
  accountType: string;
  professionalId: string | null;
  organizationId: string | null;
  providers: MyProviders | null | undefined;
  providersLoading: boolean;
  providersError: boolean;
}): MessageGate {
  const isGym = input.accountType === "gym_owner";
  const payload = isGym
    ? input.organizationId
      ? { organization_id: input.organizationId }
      : null
    : input.professionalId
      ? { recipient_user_id: input.professionalId }
      : null;
  if (!payload) return { kind: "hidden" };
  if (input.authLoading) return { kind: "checking" };
  if (!input.signedIn) return { kind: "signin" };
  if (!input.isMember) return { kind: "hidden" };
  if (input.providersLoading) return { kind: "checking" };
  if (input.providersError || !input.providers) return { kind: "open", payload };
  const connected = isGym
    ? input.providers.gyms.some((g) => g.organization_id === input.organizationId)
    : input.providers.professionals.some((p) => p.professional_id === input.professionalId);
  if (connected) return { kind: "open", payload };
  return { kind: "blocked", reason: isGym ? "Members can message this gym" : "Connect first to message" };
}

function ChatIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-1 4 8.5 8.5 0 0 1-7.5 4.5 8.5 8.5 0 0 1-4-1L3 21l2-5.5a8.5 8.5 0 1 1 16-4z" />
    </svg>
  );
}

/**
 * Message on a listing. `variant="icon"` is the owner card's small button;
 * it only shows where it can act (the header button carries the reason).
 */
export function ListingMessageButton({
  listingId,
  accountType,
  professionalId,
  organizationId,
  providerName,
  variant = "button",
}: {
  listingId: string;
  accountType: string;
  professionalId: string | null;
  organizationId: string | null;
  providerName: string;
  variant?: "button" | "icon";
}) {
  const router = useRouter();
  const reasonId = useId();
  const { user, isLoading: authLoading } = useAuth();
  const isMember = !!user && user.role === UserRole.USER;
  const providers = useMyProviders(isMember);
  const [busy, setBusy] = useState(false);

  const gate = resolveMessageGate({
    signedIn: !!user,
    authLoading,
    isMember,
    accountType,
    professionalId,
    organizationId,
    providers: providers.data,
    providersLoading: isMember && providers.isLoading,
    providersError: providers.isError,
  });

  if (gate.kind === "hidden") return null;
  if (variant === "icon" && gate.kind !== "open" && gate.kind !== "signin") return null;

  const onClick = async () => {
    if (gate.kind === "signin") {
      router.push(`/login?redirect=${encodeURIComponent(`/marketplace/${listingId}`)}`);
      return;
    }
    if (gate.kind !== "open" || busy) return;
    setBusy(true);
    try {
      const res = await messagingService.startThread(gate.payload);
      if (res.success && res.data?.thread_id) {
        router.push(`/dashboard/messages?thread=${encodeURIComponent(res.data.thread_id)}`);
      } else {
        toast.error(res.status === 403 ? NOT_CONNECTED_MESSAGE : res.message || "Couldn't open the conversation.");
      }
    } catch {
      toast.error("Couldn't open the conversation.");
    } finally {
      setBusy(false);
    }
  };

  const label = `Message ${providerName}`;
  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={busy}
        aria-label={label}
        className="w-11 h-11 border border-border rounded-(--r-2) flex items-center justify-center bg-bg hover:bg-bg-2"
        style={{ color: "var(--fg-2)" }}
      >
        <ChatIcon />
      </button>
    );
  }

  const blocked = gate.kind === "blocked";
  return (
    <span className="inline-flex items-center gap-2 flex-wrap">
      <button
        type="button"
        className="btn-ghost-v2 disabled:cursor-not-allowed disabled:opacity-60"
        style={{ height: 44 }}
        onClick={() => void onClick()}
        disabled={blocked || gate.kind === "checking" || busy}
        aria-busy={gate.kind === "checking" || busy || undefined}
        aria-label={label}
        aria-describedby={blocked ? reasonId : undefined}
      >
        <ChatIcon />
        {busy ? "Opening…" : "Message"}
      </button>
      {blocked && (
        <span id={reasonId} className="text-[13px]" style={{ color: "var(--fg-3)" }}>
          {gate.reason}
        </span>
      )}
    </span>
  );
}
