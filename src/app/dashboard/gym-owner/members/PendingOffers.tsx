"use client";

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

/**
 * Offers the gym sent that the member has not answered yet. Adding a member
 * only sends an offer now, so without this list the person would vanish
 * between "Send offer" and their acceptance. Renders nothing when there are
 * none (or the read failed: the members table above is the real roster).
 */
export function PendingOffers({ orgId }: { orgId: string | undefined }) {
  const { data: offers = [] } = useOrgEnrollmentOffers(orgId);
  const cancel = useCancelOrgEnrollmentOffer(orgId);
  const { fmtDate } = useOrgFormat();

  const pending = offers.filter((o) => o.status === "pending");
  if (pending.length === 0) return null;

  const withdraw = async (offer: OrgEnrollmentOffer) => {
    try {
      await cancel.mutateAsync(offer._id);
      toast.success(`Offer to ${offer.email} withdrawn`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't withdraw this offer");
    }
  };

  return (
    <DSCard>
      <DSCardHead
        title="Waiting to accept"
        subtitle="They join once they accept the offer we emailed them."
      />
      <ul>
        {pending.map((offer, i) => (
          <li
            key={offer._id}
            className="flex flex-wrap items-center justify-between gap-3 px-4.5 py-3"
            style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
          >
            <div className="min-w-0">
              <div className="text-[13.5px]" style={{ color: "var(--ink)" }}>
                {offer.email}
              </div>
              <div
                className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.5"
                style={{ color: "var(--fg-3)" }}
              >
                {planName(offer)} · expires {fmtDate(offer.expires_at)}
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
        ))}
      </ul>
    </DSCard>
  );
}
