"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useMyProviders } from "@/components/messaging/MyCoachesCard";
import { marketplaceService } from "@/lib/api/marketplace";
import {
  MarketplaceRequestStatus,
  MarketplaceRequestType,
  UserRole,
  type MarketplaceRequest,
} from "@/lib/types";
import { toast } from "@/components/Toast";

/** Where the member stands with this professional. */
export type ConnectionState = "unknown" | "none" | "pending" | "connected";

const idOf = (v: unknown): string | null =>
  typeof v === "string" ? v : v && typeof v === "object" && "_id" in v ? String((v as { _id: unknown })._id) : null;

/**
 * Read off what the API already knows: an active client profile with the
 * professional (my-providers), or a pending request for this listing.
 * The same rules as mobile's ConnectRequestButton.
 */
export function resolveConnectionState(input: {
  professionalId: string | null;
  listingId: string;
  providerIds: string[] | null;
  requests: Pick<MarketplaceRequest, "listing_id" | "status">[] | null;
}): ConnectionState {
  if (input.providerIds === null && input.requests === null) return "unknown";
  if (input.professionalId && input.providerIds?.includes(input.professionalId)) return "connected";
  const pending = (input.requests ?? []).some(
    (r) => idOf(r.listing_id) === input.listingId && r.status === MarketplaceRequestStatus.PENDING,
  );
  return pending ? "pending" : "none";
}

/**
 * The API's own 409, when the member got ahead of what we read: a pending
 * request already out, or already a client. Anything else is a real error.
 */
export function connectionStateFromRefusal(res: { status?: number; message?: string }): ConnectionState | null {
  if (res.status !== 409) return null;
  return /pending/i.test(res.message ?? "") ? "pending" : "connected";
}

/**
 * "Request to connect" on a trainer's or dietitian's listing (F17): the
 * member asks to become their client, as on mobile. Offered only where it
 * can work: not to a provider viewing a listing, not to someone already the
 * professional's client (hidden), not twice (shown as pending), and not to a
 * professional who has paused new clients (shown, disabled). Signed out, it
 * goes through login and comes back here.
 */
export function ConnectRequestButton({
  listingId,
  professionalId,
  providerName,
  acceptingClients,
}: {
  listingId: string;
  /** The listing's professional (user id). */
  professionalId: string | null;
  /** First name for the confirmation, e.g. "Kemi". */
  providerName: string;
  /** False hides the action behind "Not accepting clients". */
  acceptingClients?: boolean;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const isMember = !!user && user.role === UserRole.USER;

  const providers = useMyProviders(isMember);
  const requestsKey = ["marketplace", user?.id ?? "", "my-requests"] as const;
  const requests = useQuery({
    queryKey: requestsKey,
    enabled: isMember,
    queryFn: async () => {
      const res = await marketplaceService.getMyRequests();
      if (!res.success) throw new Error(res.message ?? "Couldn't load your requests");
      return res.data ?? [];
    },
  });
  const [override, setOverride] = useState<ConnectionState | null>(null);
  const [sending, setSending] = useState(false);

  // Providers don't send requests (the API refuses them).
  if (authLoading || (user && !isMember)) return null;

  const reading = isMember && (providers.isLoading || requests.isLoading);
  const derived: ConnectionState = !user
    ? "none"
    : reading
      ? "unknown"
      : resolveConnectionState({
          professionalId,
          listingId,
          providerIds: providers.isError ? null : (providers.data?.professionals.map((p) => p.professional_id) ?? []),
          requests: requests.isError ? null : (requests.data ?? []),
        });
  // Both reads failing is "we don't know": offer it, and let the API decide.
  const state = override ?? (derived === "unknown" && !reading ? "none" : derived);
  if (state === "connected") return null;

  const paused = acceptingClients === false;
  const onClick = async () => {
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(pathname || `/marketplace/${listingId}`)}`);
      return;
    }
    setSending(true);
    try {
      const res = await marketplaceService.sendRequest(listingId, { type: MarketplaceRequestType.CONNECTION });
      if (res.success) {
        setOverride("pending");
        toast.success(`Request sent. You'll be notified when ${providerName} answers.`);
        void queryClient.invalidateQueries({ queryKey: requestsKey });
        return;
      }
      const known = connectionStateFromRefusal(res);
      if (known) setOverride(known);
      else toast.error(res.message || "Couldn't send your request. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const label = paused ? "Not accepting clients" : state === "pending" ? "Request pending" : "Request to connect";
  return (
    <button
      type="button"
      className="btn-ghost-v2 sm disabled:cursor-not-allowed disabled:opacity-60"
      onClick={() => void onClick()}
      disabled={paused || state === "pending" || state === "unknown" || sending}
      aria-busy={state === "unknown" || sending || undefined}
    >
      {label}
    </button>
  );
}
