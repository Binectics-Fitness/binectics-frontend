"use client";

import { useId, useState, type ReactNode } from "react";
import { StatusPill } from "@/components/ds/StatusPill";
import { requestStatusTone } from "@/lib/ui/statusTones";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import {
  MarketplaceRequestStatus,
  MarketplaceRequestType,
  type MarketplaceRequest,
} from "@/lib/types";

/**
 * The pieces of a provider's connection-request inbox, shared by the solo
 * provider's page (/dashboard/marketplace/requests) and the gym's
 * (/dashboard/gym-owner/requests). Each page brings its own data and the
 * call that answers; these only show a request and collect the answer.
 */

const fieldStyle: React.CSSProperties = {
  background: "var(--bg-2)",
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
};

export function requesterName(r: MarketplaceRequest): string {
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

export interface PendingRequestCardProps {
  r: MarketplaceRequest;
  highlighted: boolean;
  /** Which answer is in flight for this card, if any. */
  busy: "accept" | "decline" | null;
  /**
   * Sends the answer. Rejects with an Error whose message is shown on the
   * card; the page handles success (toast, refetch).
   */
  onRespond: (accept: boolean, note?: string) => Promise<unknown>;
  /** False for someone who may see requests but not answer them. */
  canRespond?: boolean;
  /** Under the buttons of a connection request: what accepting does. */
  footnote?: (firstName: string) => ReactNode;
  /** Shown instead of the buttons when `canRespond` is false. */
  readOnlyNote?: string;
}

export function PendingRequestCard({
  r,
  highlighted,
  busy,
  onRespond,
  canRespond = true,
  footnote,
  readOnlyNote,
}: PendingRequestCardProps) {
  const { fmtDate } = useOrgFormat();
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const name = requesterName(r);
  const firstName = name.split(" ")[0];
  const email = requesterEmail(r);
  const isInquiry = r.type === MarketplaceRequestType.INQUIRY;
  // A generated id, so a note field's label can't collide with another card's.
  const noteId = useId();

  const submit = (accept: boolean) => {
    setError(null);
    onRespond(accept, note.trim() || undefined).catch((err: unknown) =>
      setError(err instanceof Error ? err.message : "Couldn't update this request."),
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
          {isInquiry && canRespond && (
            <p className="text-[12.5px] mt-2" style={{ color: "var(--fg-3)" }}>
              A question rather than a request to connect, so it can only be declined here.
            </p>
          )}
          <RequestDetails r={r} />

          {!canRespond ? (
            readOnlyNote && (
              <p className="text-[12.5px] mt-4" style={{ color: "var(--fg-3)" }}>
                {readOnlyNote}
              </p>
            )
          ) : (
            <>
              {noteOpen && (
                <div className="flex flex-col gap-1.5 mt-4">
                  <label
                    htmlFor={noteId}
                    className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                    style={{ color: "var(--fg-3)" }}
                  >
                    Note to {firstName}
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
                    disabled={busy !== null}
                    onClick={() => submit(true)}
                  >
                    {busy === "accept" ? "Accepting…" : "Accept"}
                  </button>
                )}
                <button
                  type="button"
                  className="btn-ghost-v2 md"
                  disabled={busy !== null}
                  onClick={() => submit(false)}
                >
                  {busy === "decline" ? "Declining…" : "Decline"}
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
              {!isInquiry && footnote && (
                <p className="text-[12px] mt-2.5" style={{ color: "var(--fg-4)" }}>
                  {footnote(firstName)}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
}

export function HandledRequestRow({
  r,
  highlighted,
  noteLabel = "Your note",
}: {
  r: MarketplaceRequest;
  highlighted: boolean;
  /** How the provider's answer note is introduced. */
  noteLabel?: string;
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
            {noteLabel}: {r.response_note}
          </p>
        )}
      </div>
    </li>
  );
}
