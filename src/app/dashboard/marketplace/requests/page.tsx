"use client";

import { Suspense, useEffect, useId, useMemo, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WorkspaceShell } from "@/components/ds/WorkspaceShell";
import { AsyncSpinner, PageHeader, DSCard, Eyebrow } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMyListing,
  useMyListingRequests,
  useRespondToListingRequest,
} from "@/lib/queries/marketplace";
import {
  MarketplaceRequestStatus,
  UserRole,
  type MarketplaceRequest,
} from "@/lib/types";
import {
  HandledRequestRow,
  PendingRequestCard,
  requesterName,
} from "@/components/marketplace/ConnectionRequestCards";

/** Handled requests shown under the pending ones. */
const RECENT_HANDLED_LIMIT = 20;

/** Where a provider edits and publishes their marketplace listing. */
function listingHref(role?: UserRole): string {
  if (role === UserRole.TRAINER) return "/dashboard/trainer/profile";
  if (role === UserRole.DIETITIAN) return "/dashboard/dietitian/profile";
  return "/dashboard/profile-edit";
}

function clientsHref(role?: UserRole): string {
  if (role === UserRole.DIETITIAN) return "/dashboard/dietitian/clients";
  // Gym requests have their own page (/dashboard/gym-owner/requests).
  if (role === UserRole.GYM_OWNER) return "/dashboard/gym-owner/members";
  return "/dashboard/trainer/clients";
}

/** A pending request on the provider's own listing, answered for themselves. */
function SoloPendingRequestCard({
  r,
  highlighted,
  role,
}: {
  r: MarketplaceRequest;
  highlighted: boolean;
  role?: UserRole;
}) {
  const respond = useRespondToListingRequest();
  const name = requesterName(r);
  return (
    <PendingRequestCard
      r={r}
      highlighted={highlighted}
      busy={respond.isPending ? (respond.variables?.accept ? "accept" : "decline") : null}
      onRespond={async (accept, note) => {
        await respond.mutateAsync({ requestId: r._id, accept, note });
        toast.success(accept ? `${name} is now your client.` : `Request from ${name} declined.`);
      }}
      footnote={(first) => (
        <>
          Accepting adds {first} to your{" "}
          <Link href={clientsHref(role)} className="underline" style={{ color: "var(--fg-3)" }}>
            clients
          </Link>
          .
        </>
      )}
    />
  );
}

function RequestsInner() {
  const { user } = useAuth();
  const role = user?.role;
  const searchParams = useSearchParams();
  const focusId = searchParams.get("requestId");

  const requestsQuery = useMyListingRequests();
  const listingQuery = useMyListing();
  const scrolledFor = useRef<string | null>(null);
  const pendingHeadingId = useId();
  const handledHeadingId = useId();

  const { pending, handled } = useMemo(() => {
    const all = requestsQuery.data?.requests ?? [];
    return {
      pending: all.filter((r) => r.status === MarketplaceRequestStatus.PENDING),
      handled: all
        .filter((r) => r.status !== MarketplaceRequestStatus.PENDING)
        .slice(0, RECENT_HANDLED_LIMIT),
    };
  }, [requestsQuery.data]);

  const focusFound =
    !!focusId && [...pending, ...handled].some((r) => r._id === focusId);

  // Bring the request from the notification into view, once per id.
  useEffect(() => {
    if (!focusId || !focusFound || scrolledFor.current === focusId) return;
    const el = document.querySelector<HTMLElement>(`[data-request-id="${CSS.escape(focusId)}"]`);
    if (!el) return;
    scrolledFor.current = focusId;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId, focusFound]);

  const loading = requestsQuery.isLoading;
  const hasListing = requestsQuery.data?.hasListing ?? true;
  const listing = listingQuery.data;
  const unpublished = hasListing && listing != null && !listing.is_published;
  const notAccepting = hasListing && listing?.is_published && listing.accepting_clients === false;

  return (
    <>
      <PageHeader
        className="mb-0!"
        title="Connection requests"
        subtitle="Members who asked to work with you from your marketplace listing."
      />

      {requestsQuery.isError && (
        <div
          role="alert"
          className="rounded-(--r-2) px-4 py-3 text-[13px] flex flex-wrap items-center justify-between gap-2"
          style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}
        >
          <span>We couldn&apos;t load your requests. Try again shortly.</span>
          <button type="button" className="underline" onClick={() => requestsQuery.refetch()}>
            Retry
          </button>
        </div>
      )}

      {(unpublished || notAccepting) && (
        <DSCard
          className="px-4 py-3 text-[13px] flex flex-wrap items-center justify-between gap-2"
          style={{ color: "var(--fg-2)" }}
        >
          <span>
            {unpublished
              ? "Your listing is not published, so members can't find you or send new requests."
              : "Your listing says you're not taking new clients, so members can't send new requests."}
          </span>
          <Link href={listingHref(role)} className="btn-ghost-v2 sm">
            Open my listing
          </Link>
        </DSCard>
      )}

      {focusId && !loading && !requestsQuery.isError && !focusFound && hasListing && (
        <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
          That request is no longer in your list. It may have been withdrawn.
        </p>
      )}

      {loading ? (
        <AsyncSpinner label="Loading requests" />
      ) : requestsQuery.isError ? null : !hasListing ? (
        <section
          className="rounded-(--r-3) p-6 sm:p-8"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
            No listing yet, so no requests
          </h2>
          <p className="text-[13.5px] mt-2 max-w-prose" style={{ color: "var(--fg-2)" }}>
            Members find you on the marketplace and tap Request to connect on your listing. Set up and publish
            your listing, and their requests will show up here and in your notifications.
          </p>
          <Link href={listingHref(role)} className="btn-primary-v2 md mt-5">
            Set up my listing
          </Link>
        </section>
      ) : (
        <>
          <section aria-labelledby={pendingHeadingId} className="flex flex-col gap-3">
            <Eyebrow as="h2" id={pendingHeadingId}>
              Waiting for you · {pending.length}
            </Eyebrow>
            {pending.length === 0 ? (
              <DSCard className="p-5">
                <p className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>
                  No requests waiting.
                </p>
                <p className="text-[13px] mt-1" style={{ color: "var(--fg-3)" }}>
                  When a member taps Request to connect on your listing, it shows up here and in your
                  notifications. A complete, published listing gets more of them.
                </p>
                <Link href={listingHref(role)} className="btn-ghost-v2 sm mt-3">
                  Review my listing
                </Link>
              </DSCard>
            ) : (
              pending.map((r) => (
                <SoloPendingRequestCard
                  key={r._id}
                  r={r}
                  role={role}
                  highlighted={r._id === focusId}
                />
              ))
            )}
          </section>

          {handled.length > 0 && (
            <section
              aria-labelledby={handledHeadingId}
              className="rounded-(--r-3) overflow-hidden"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <h2
                id={handledHeadingId}
                className="font-mono text-[10.5px] uppercase tracking-[0.06em] px-4 sm:px-5 py-3"
                style={{ color: "var(--fg-3)", background: "var(--bg-2)" }}
              >
                Recently handled
              </h2>
              <ul>
                {handled.map((r) => (
                  <HandledRequestRow key={r._id} r={r} highlighted={r._id === focusId} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </>
  );
}

export default function MarketplaceRequestsPage() {
  return (
    <WorkspaceShell activeItem="Requests" crumb="Requests">
      <Suspense fallback={<AsyncSpinner label="Loading requests" />}>
        <RequestsInner />
      </Suspense>
    </WorkspaceShell>
  );
}
