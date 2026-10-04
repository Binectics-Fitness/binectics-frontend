"use client";

import { Suspense, useEffect, useId, useMemo, useRef, useState } from "react";
import { StatusPill } from "@/components/ds/StatusPill";
import { requestStatusTone } from "@/lib/ui/statusTones";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WorkspaceShell } from "@/components/ds/WorkspaceShell";
import { AsyncSpinner } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import {
  useMyListing,
  useMyListingRequests,
  useRespondToListingRequest,
} from "@/lib/queries/marketplace";
import {
  MarketplaceRequestStatus,
  MarketplaceRequestType,
  UserRole,
  type MarketplaceRequest,
} from "@/lib/types";

/** Handled requests shown under the pending ones. */
const RECENT_HANDLED_LIMIT = 20;

const fieldStyle: React.CSSProperties = {
  background: "var(--bg-2)",
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
};

function requesterName(r: MarketplaceRequest): string {
  if (r.client_id && typeof r.client_id === "object") {
    const name = `${r.client_id.first_name ?? ""} ${r.client_id.last_name ?? ""}`.trim();
    return name || r.client_id.email || "A member";
  }
  return "A member";
}

function requesterEmail(r: MarketplaceRequest): string | undefined {
  return r.client_id && typeof r.client_id === "object" ? r.client_id.email : undefined;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/** Where a provider edits and publishes their marketplace listing. */
function listingHref(role?: UserRole): string {
  if (role === UserRole.TRAINER) return "/dashboard/trainer/profile";
  if (role === UserRole.DIETITIAN) return "/dashboard/dietitian/profile";
  return "/dashboard/profile-edit";
}

function clientsHref(role?: UserRole): string {
  if (role === UserRole.DIETITIAN) return "/dashboard/dietitian/clients";
  // Gym listings take requests too (the notification links here).
  if (role === UserRole.GYM_OWNER) return "/dashboard/gym-owner/members";
  return "/dashboard/trainer/clients";
}

const STATUS_LABEL: Record<MarketplaceRequestStatus, string> = {
  [MarketplaceRequestStatus.PENDING]: "Waiting",
  [MarketplaceRequestStatus.ACCEPTED]: "Accepted",
  [MarketplaceRequestStatus.DECLINED]: "Declined",
  [MarketplaceRequestStatus.EXPIRED]: "Expired",
  // A member withdrawing. Requests declined before the API started
  // recording DECLINED are also stored this way, so "Closed", not
  // "Withdrawn".
  [MarketplaceRequestStatus.CANCELLED]: "Closed",
};

/**
 * A handled request's state. Accepted is success and one still waiting on
 * the provider is warn. Declined is neutral here, unlike on the member's
 * side: the provider made that call, nothing failed for them.
 */
function RequestStatusPill({ status }: { status: MarketplaceRequestStatus }) {
  const tone = status === MarketplaceRequestStatus.DECLINED ? "neutral" : requestStatusTone(status);
  return <StatusPill tone={tone} label={STATUS_LABEL[status] ?? status} className="shrink-0" />;
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0"
      style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

/** What the member told the provider when they asked. */
function RequestDetails({ r }: { r: MarketplaceRequest }) {
  const facts = [
    r.starting_weight_kg != null ? `Now ${r.starting_weight_kg} kg` : null,
    r.target_weight_kg != null ? `Target ${r.target_weight_kg} kg` : null,
    r.height_cm != null ? `${r.height_cm} cm tall` : null,
  ].filter(Boolean) as string[];

  return (
    <>
      {r.message && (
        <p
          className="text-[13.5px] mt-3 whitespace-pre-line break-words"
          style={{ color: "var(--fg-2)" }}
        >
          {r.message}
        </p>
      )}
      {(r.goals?.length > 0 || facts.length > 0) && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {r.goals?.map((g) => (
            <span
              key={g}
              className="text-[12px] px-2 py-0.5 rounded-full"
              style={{ background: "var(--bg-2)", color: "var(--fg-2)", border: "1px solid var(--border)" }}
            >
              {g}
            </span>
          ))}
          {facts.map((f) => (
            <span
              key={f}
              className="font-mono text-[11.5px] px-2 py-0.5 rounded-full"
              style={{ background: "var(--bg)", color: "var(--fg-3)", border: "1px solid var(--border)", fontVariantNumeric: "tabular-nums" }}
            >
              {f}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function PendingRequestCard({
  r,
  highlighted,
  role,
}: {
  r: MarketplaceRequest;
  highlighted: boolean;
  role?: UserRole;
}) {
  const { fmtDate } = useOrgFormat();
  const respond = useRespondToListingRequest();
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const name = requesterName(r);
  const email = requesterEmail(r);
  const isInquiry = r.type === MarketplaceRequestType.INQUIRY;
  // The shell renders the page twice (desktop + mobile), so ids come from
  // useId rather than the request id.
  const noteId = useId();
  const busy = respond.isPending;

  const submit = (accept: boolean) => {
    setError(null);
    respond.mutate(
      { requestId: r._id, accept, note: note.trim() || undefined },
      {
        onSuccess: () => {
          if (accept) {
            toast.success(`${name} is now your client.`);
          } else {
            toast.success(`Request from ${name} declined.`);
          }
        },
        onError: (err) => setError(err instanceof Error ? err.message : "Couldn't update this request."),
      },
    );
  };

  return (
    <article
      data-request-id={r._id}
      aria-label={`Request from ${name}`}
      className="rounded-(--r-3) p-4 sm:p-5 scroll-mt-28"
      style={{
        background: "var(--bg)",
        border: highlighted ? "1px solid var(--ink)" : "1px solid var(--border)",
        outline: highlighted ? "3px solid var(--signal-soft)" : "none",
      }}
    >
      <div className="flex items-start gap-3">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[14.5px] font-medium truncate" style={{ color: "var(--ink)" }}>
                {name}
              </div>
              {email && (
                <div className="text-[12.5px] truncate" style={{ color: "var(--fg-3)" }}>
                  {email}
                </div>
              )}
            </div>
            <span className="font-mono text-[11px] shrink-0 pt-0.5" style={{ color: "var(--fg-3)" }}>
              {fmtDate(r.created_at)}
            </span>
          </div>
          {isInquiry && (
            <p className="text-[12.5px] mt-2" style={{ color: "var(--fg-3)" }}>
              A question rather than a request to connect, so it can only be declined here.
            </p>
          )}
          <RequestDetails r={r} />

          {noteOpen && (
            <div className="flex flex-col gap-1.5 mt-4">
              <label
                htmlFor={noteId}
                className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                style={{ color: "var(--fg-3)" }}
              >
                Note to {name.split(" ")[0]}
              </label>
              <textarea
                id={noteId}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                maxLength={1000}
                placeholder="Optional. Sent with your answer, e.g. when you can start."
                className="rounded-(--r-2) px-3 py-2.5 text-[13.5px] resize-none"
                style={fieldStyle}
              />
            </div>
          )}

          {error && (
            <p role="alert" className="text-[12.5px] mt-3" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-4">
            {!isInquiry && (
              <button
                type="button"
                className="btn-primary-v2 md"
                disabled={busy}
                onClick={() => submit(true)}
              >
                {busy && respond.variables?.accept ? "Accepting…" : "Accept"}
              </button>
            )}
            <button
              type="button"
              className="btn-ghost-v2 md"
              disabled={busy}
              onClick={() => submit(false)}
            >
              {busy && respond.variables && !respond.variables.accept ? "Declining…" : "Decline"}
            </button>
            {!noteOpen && (
              <button
                type="button"
                className="text-[13px] px-2 h-[34px] rounded-(--r-2) hover:bg-bg-2"
                style={{ color: "var(--fg-2)" }}
                onClick={() => setNoteOpen(true)}
              >
                Add a note
              </button>
            )}
          </div>
          {!isInquiry && (
            <p className="text-[12px] mt-2.5" style={{ color: "var(--fg-4)" }}>
              Accepting adds {name.split(" ")[0]} to your{" "}
              <Link href={clientsHref(role)} className="underline" style={{ color: "var(--fg-3)" }}>
                clients
              </Link>
              .
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function HandledRequestRow({
  r,
  highlighted,
}: {
  r: MarketplaceRequest;
  highlighted: boolean;
}) {
  const { fmtDate } = useOrgFormat();
  const name = requesterName(r);
  return (
    <li
      data-request-id={r._id}
      className="flex items-start gap-3 px-4 sm:px-5 py-3.5 scroll-mt-28"
      style={{
        borderTop: "1px solid var(--border)",
        background: highlighted ? "var(--bg-2)" : undefined,
      }}
    >
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13.5px] font-medium truncate" style={{ color: "var(--ink)" }}>
            {name}
          </span>
          <RequestStatusPill status={r.status} />
        </div>
        <div className="font-mono text-[11px] mt-0.5" style={{ color: "var(--fg-3)" }}>
          Asked {fmtDate(r.created_at)} · updated {fmtDate(r.updated_at)}
        </div>
        {r.response_note && (
          <p className="text-[12.5px] mt-1.5 break-words" style={{ color: "var(--fg-2)" }}>
            Your note: {r.response_note}
          </p>
        )}
      </div>
    </li>
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
    // Two copies exist (desktop + mobile layouts); scroll the visible one.
    const el = Array.from(
      document.querySelectorAll<HTMLElement>(`[data-request-id="${CSS.escape(focusId)}"]`),
    ).find((node) => node.getClientRects().length > 0);
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
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Connection requests
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Members who asked to work with you from your marketplace listing.
        </p>
      </div>

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
        <div
          className="rounded-(--r-3) px-4 py-3 text-[13px] flex flex-wrap items-center justify-between gap-2"
          style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg-2)" }}
        >
          <span>
            {unpublished
              ? "Your listing is not published, so members can't find you or send new requests."
              : "Your listing says you're not taking new clients, so members can't send new requests."}
          </span>
          <Link href={listingHref(role)} className="btn-ghost-v2 sm">
            Open my listing
          </Link>
        </div>
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
            <h2
              id={pendingHeadingId}
              className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
              style={{ color: "var(--fg-3)" }}
            >
              Waiting for you · {pending.length}
            </h2>
            {pending.length === 0 ? (
              <div
                className="rounded-(--r-3) p-5"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              >
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
              </div>
            ) : (
              pending.map((r) => (
                <PendingRequestCard
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
