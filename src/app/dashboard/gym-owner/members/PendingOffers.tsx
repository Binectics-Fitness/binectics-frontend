"use client";

import { useEffect, useState } from "react";
import { DSCard, DSCardHead } from "@/components/ds/DSCard";
import { toast } from "@/components/Toast";
import {
  useCancelOrgEnrollmentOffer,
  useOrgEnrollmentOffers,
} from "@/lib/queries/marketplace";
import type { OrgEnrollmentOffer } from "@/lib/api/marketplace";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

function planName(offer: OrgEnrollmentOffer): string {
  return offer.plan_id && typeof offer.plan_id === "object" ? offer.plan_id.name : "Membership";
}

/** Imported members shown before "Show all": an import can be thousands. */
const IMPORTED_SHOWN = 10;

/**
 * Offers the gym sent that the member has not answered yet. Adding a member
 * only sends an offer now, so without this list the person would vanish
 * between "Send offer" and their acceptance. Imported members (member
 * import) wait here too, until they claim their membership; there can be
 * many, so they are listed apart and folded. Renders nothing when there
 * are none (or the read failed: the members table above is the real roster).
 */
export function PendingOffers({ orgId, refreshKey }: { orgId: string | undefined; refreshKey?: number }) {
  const { data: offers = [], refetch } = useOrgEnrollmentOffers(orgId);
  const cancel = useCancelOrgEnrollmentOffer(orgId);
  const { fmtDate, fmtNumber } = useOrgFormat();
  const [showAllImported, setShowAllImported] = useState(false);

  useEffect(() => {
    if (refreshKey) void refetch();
  }, [refreshKey, refetch]);

  const pending = offers.filter((o) => o.status === "pending");
  if (pending.length === 0) return null;
  const oneOff = pending.filter((o) => o.source !== "import");
  const imported = pending.filter((o) => o.source === "import");
  const importedShown = showAllImported ? imported : imported.slice(0, IMPORTED_SHOWN);

  const withdraw = async (offer: OrgEnrollmentOffer) => {
    try {
      await cancel.mutateAsync(offer._id);
      toast.success(`Offer to ${offer.email} withdrawn`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't withdraw this offer");
    }
  };

  const row = (offer: OrgEnrollmentOffer, i: number, detail: string) => (
    <li
      key={offer._id}
      className="flex flex-wrap items-center justify-between gap-3 px-4.5 py-3"
      style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
    >
      <div className="min-w-0">
        <div className="text-[13.5px] break-all" style={{ color: "var(--ink)" }}>
          {offer.email}
        </div>
        <div
          className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.5"
          style={{ color: "var(--fg-3)" }}
        >
          {detail}
        </div>
      </div>
      <button
        type="button"
        className="btn-ghost-v2 sm"
        disabled={cancel.isPending}
        onClick={() => void withdraw(offer)}
      >
        Withdraw
      </button>
    </li>
  );

  return (
    <DSCard>
      <DSCardHead
        title="Waiting to accept"
        subtitle={
          imported.length > 0
            ? "They join once they accept. Imported members keep their end date when they do."
            : "They join once they accept the offer we emailed them."
        }
      />
      {oneOff.length > 0 && (
        <ul aria-label="Membership offers">
          {oneOff.map((offer, i) => row(offer, i, `${planName(offer)} · expires ${fmtDate(offer.expires_at)}`))}
        </ul>
      )}
      {imported.length > 0 && (
        <>
          <div
            className="px-4.5 pt-3 pb-1 font-mono text-[11px] uppercase tracking-[0.04em]"
            style={{ color: "var(--fg-3)", borderTop: oneOff.length > 0 ? "1px solid var(--border)" : undefined }}
          >
            Imported, not claimed yet · {fmtNumber(imported.length)}
          </div>
          <ul aria-label="Imported members waiting to claim">
            {importedShown.map((offer, i) =>
              row(
                offer,
                i,
                `${planName(offer)} · ends ${fmtDate(offer.term_end ?? offer.expires_at)} · ${
                  offer.invite_status === "sent"
                    ? `invited ${fmtDate(offer.invite_sent_at)}`
                    : offer.invite_status === "held"
                      ? "not invited yet"
                      : "invite on its way"
                }`,
              ),
            )}
          </ul>
          {imported.length > IMPORTED_SHOWN && (
            <div className="px-4.5 pb-3">
              <button
                type="button"
                className="btn-ghost-v2 sm"
                aria-expanded={showAllImported}
                onClick={() => setShowAllImported((v) => !v)}
              >
                {showAllImported ? "Show fewer" : `Show all ${fmtNumber(imported.length)}`}
              </button>
            </div>
          )}
        </>
      )}
    </DSCard>
  );
}
