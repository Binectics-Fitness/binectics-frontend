"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AsyncSpinner, DSCard, PageHeader } from "@/components/ds";
import { toast } from "@/components/Toast";
import {
  HandledRequestRow,
  PendingRequestCard,
  requesterName,
} from "@/components/marketplace/ConnectionRequestCards";
import { useGymViewer } from "@/hooks/useGymViewer";
import { GYM_NAV_ACCESS, TeamPermission, allows, holds } from "@/lib/gymStaffNav";
import { useOrgListing } from "@/lib/queries/marketplace";
import { useOrgListingRequests, useRespondToOrgRequest } from "@/lib/queries/orgRequests";
import type { OrgRequestListStatus } from "@/lib/api/marketplace";
import type { MarketplaceRequest } from "@/lib/types";

/** Where the gym's owner edits and publishes the gym's listing. */
export const GYM_LISTING_HREF = "/dashboard/profile-edit";
const MEMBERS_HREF = "/dashboard/gym-owner/members";

const TABS: { id: OrgRequestListStatus; label: string }[] = [
  { id: "pending", label: "Waiting" },
  { id: "answered", label: "Answered" },
];

/**
 * The gym's connection requests (discoverability F23): members who tapped
 * Request to connect on the gym's marketplace listing. Anyone whose role
 * holds marketplace:view_requests sees them; answering needs
 * marketplace:respond_requests. The owner holds both.
 */
export function GymRequestsClient() {
  const viewer = useGymViewer();
  const orgId = viewer.orgId ?? undefined;
  const gymName = viewer.orgName ?? "the gym";
  const canRespond = holds(viewer, TeamPermission.MARKETPLACE_RESPOND_REQUESTS);
  // The listing route needs manage_listing; others can't read it, so they
  // get no listing banners rather than a false "no listing".
  const canReadListing = holds(viewer, TeamPermission.MARKETPLACE_MANAGE_LISTING);
  const canOpenMembers = allows(viewer, GYM_NAV_ACCESS.Members);

  const searchParams = useSearchParams();
  const focusId = searchParams.get("requestId");
  const [tab, setTab] = useState<OrgRequestListStatus>(
    searchParams.get("tab") === "answered" ? "answered" : "pending",
  );

  const pendingQuery = useOrgListingRequests(orgId, "pending");
  const answeredQuery = useOrgListingRequests(orgId, "answered", tab === "answered");
  const listingQuery = useOrgListing(orgId, canReadListing);
  const listing = listingQuery.data;

  const pending = useMemo(() => pendingQuery.data?.pages.flatMap((p) => p.requests) ?? [], [pendingQuery.data]);
  const answered = useMemo(() => answeredQuery.data?.pages.flatMap((p) => p.requests) ?? [], [answeredQuery.data]);

  const tabsId = useId();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = TABS[(TABS.findIndex((t) => t.id === tab) + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length].id;
    setTab(next);
    tabRefs.current[next]?.focus();
  };

  // Bring the request from the notification into view, once per id.
  const scrolledFor = useRef<string | null>(null);
  const focusInPending = !!focusId && pending.some((r) => r._id === focusId);
  useEffect(() => {
    if (!focusId || !focusInPending || scrolledFor.current === focusId) return;
    const el = document.querySelector<HTMLElement>(`[data-request-id="${CSS.escape(focusId)}"]`);
    if (!el) return;
    scrolledFor.current = focusId;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focusId, focusInPending]);

  const noListing = canReadListing && listingQuery.isSuccess && listing == null;
  const unpublished = listing != null && !listing.is_published;
  const notAccepting = listing != null && listing.is_published && listing.accepting_clients === false;
  const active = tab === "pending" ? pendingQuery : answeredQuery;
  const activeRows = tab === "pending" ? pending : answered;

  return (
    <GymDashboardShell activeItem="Requests" crumb="Requests">
      <PageHeader
        className="mb-0!"
        title="Connection requests"
        subtitle={`Members who asked to join ${gymName} from its marketplace listing.`}
      />

      {(unpublished || notAccepting) && (
        <DSCard
          className="px-4 py-3 text-[13px] flex flex-wrap items-center justify-between gap-2"
          style={{ color: "var(--fg-2)" }}
        >
          <span>
            {unpublished
              ? "The gym's listing is not published, so members can't find it or send new requests."
              : "The gym's listing says it isn't taking new members, so members can't send new requests."}
          </span>
          {viewer.isOwner && (
            <Link href={GYM_LISTING_HREF} className="btn-ghost-v2 sm">
              Open the listing
            </Link>
          )}
        </DSCard>
      )}

      {noListing ? (
        <section
          className="rounded-(--r-3) p-6 sm:p-8"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
            No listing yet, so no requests
          </h2>
          <p className="text-[13.5px] mt-2 max-w-prose" style={{ color: "var(--fg-2)" }}>
            Members find gyms on the marketplace and tap Request to connect on the listing. Once {gymName}&apos;s
            listing is published, their requests show up here.
          </p>
          {viewer.isOwner && (
            <Link href={GYM_LISTING_HREF} className="btn-primary-v2 md mt-5">
              Set up the listing
            </Link>
          )}
        </section>
      ) : (
        <>
          <div role="tablist" aria-label="Requests" className="flex flex-wrap gap-1">
            {TABS.map((t) => {
              const selected = tab === t.id;
              const count = t.id === "pending" && pendingQuery.isSuccess && !pendingQuery.hasNextPage ? ` · ${pending.length}` : "";
              return (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[t.id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`${tabsId}-${t.id}`}
                  aria-selected={selected}
                  aria-controls={`${tabsId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setTab(t.id)}
                  onKeyDown={onTabKey}
                  className="font-mono text-[11px] uppercase tracking-[0.04em] px-3 py-1.5 rounded-full"
                  style={{
                    background: selected ? "var(--ink)" : "var(--bg)",
                    color: selected ? "var(--bg)" : "var(--fg-3)",
                    border: selected ? "1px solid var(--ink)" : "1px solid var(--border)",
                  }}
                >
                  {t.label}
                  {count}
                </button>
              );
            })}
          </div>

          <section
            id={`${tabsId}-panel`}
            role="tabpanel"
            aria-labelledby={`${tabsId}-${tab}`}
            className="flex flex-col gap-3"
          >
            {tab === "pending" && !canRespond && pending.length > 0 && (
              <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                Your role can see requests but not answer them. Ask the gym&apos;s owner or an admin if you need to.
              </p>
            )}

            {tab === "pending" && focusId && pendingQuery.isSuccess && !focusInPending && !pendingQuery.hasNextPage && (
              <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                That request is no longer waiting. It may have been answered or withdrawn: see Answered.
              </p>
            )}

            {active.isLoading ? (
              <AsyncSpinner label="Loading requests" />
            ) : active.isError ? (
              <div
                role="alert"
                className="rounded-(--r-2) px-4 py-3 text-[13px] flex flex-wrap items-center justify-between gap-2"
                style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}
              >
                <span>We couldn&apos;t load the gym&apos;s requests. Try again shortly.</span>
                <button type="button" className="underline" onClick={() => active.refetch()}>
                  Retry
                </button>
              </div>
            ) : activeRows.length === 0 ? (
              <DSCard className="p-5">
                <p className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>
                  {tab === "pending" ? "No requests waiting." : "No answered requests yet."}
                </p>
                {tab === "pending" && (
                  <p className="text-[13px] mt-1" style={{ color: "var(--fg-3)" }}>
                    When a member taps Request to connect on {gymName}&apos;s listing, it shows up here and in the
                    owner&apos;s notifications.
                  </p>
                )}
              </DSCard>
            ) : tab === "pending" ? (
              pending.map((r) => (
                <GymPendingRequestCard
                  key={r._id}
                  r={r}
                  orgId={orgId}
                  gymName={gymName}
                  highlighted={r._id === focusId}
                  canRespond={canRespond}
                  canOpenMembers={canOpenMembers}
                />
              ))
            ) : (
              <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <ul>
                  {answered.map((r) => (
                    <HandledRequestRow key={r._id} r={r} highlighted={r._id === focusId} noteLabel="Note sent" />
                  ))}
                </ul>
              </div>
            )}

            {active.hasNextPage && (
              <button
                type="button"
                className="btn-ghost-v2 md self-start"
                disabled={active.isFetchingNextPage}
                onClick={() => active.fetchNextPage()}
              >
                {active.isFetchingNextPage ? "Loading…" : "Show more"}
              </button>
            )}
          </section>
        </>
      )}
    </GymDashboardShell>
  );
}

function GymPendingRequestCard({
  r,
  orgId,
  gymName,
  highlighted,
  canRespond,
  canOpenMembers,
}: {
  r: MarketplaceRequest;
  orgId: string | undefined;
  gymName: string;
  highlighted: boolean;
  canRespond: boolean;
  canOpenMembers: boolean;
}) {
  const respond = useRespondToOrgRequest(orgId);
  const name = requesterName(r);
  return (
    <PendingRequestCard
      r={r}
      highlighted={highlighted}
      canRespond={canRespond}
      busy={respond.isPending ? (respond.variables?.accept ? "accept" : "decline") : null}
      onRespond={async (accept, note) => {
        await respond.mutateAsync({ requestId: r._id, accept, note });
        toast.success(accept ? `${name} is now connected with ${gymName}.` : `Request from ${name} declined.`);
      }}
      footnote={(first) => (
        <>
          Accepting connects {first} with {gymName}. A membership is separate
          {canOpenMembers ? (
            <>
              : enrol them from{" "}
              <Link href={MEMBERS_HREF} className="underline" style={{ color: "var(--fg-3)" }}>
                Members
              </Link>
              .
            </>
          ) : (
            "."
          )}
        </>
      )}
    />
  );
}
