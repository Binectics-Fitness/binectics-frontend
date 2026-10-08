"use client";

import { useState } from "react";
import { DSCard } from "@/components/ds/DSCard";
import { Eyebrow } from "@/components/ds/Eyebrow";
import { toast } from "@/components/Toast";
import {
  useMyEnrollmentOffers,
  useRespondToEnrollmentOffer,
} from "@/lib/queries/marketplace";
import type { EnrollmentOffer, EnrollTransferAccount } from "@/lib/api/marketplace";
import { minorToMajor } from "@/lib/money/minorMoney";
import { formatCurrency } from "@/utils/format";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

function money(minor: number, currency: string): string {
  return formatCurrency(minorToMajor(minor, currency), currency);
}

/**
 * Membership offers a gym sent this member. A gym can no longer enrol anyone
 * on its own: the membership only starts when the member accepts here.
 * Renders nothing when there are no pending offers (or the read failed; the
 * offers are also in the email the gym's offer sent).
 */
export function EnrollmentOffersCard({ onAccepted }: { onAccepted?: () => void }) {
  const { data: offers = [] } = useMyEnrollmentOffers();
  const respond = useRespondToEnrollmentOffer();
  const { fmtDate, fmtDateTime } = useOrgFormat();
  const [busyId, setBusyId] = useState<string | null>(null);
  // Shown after accepting a transfer offer: the one-time account to pay into.
  const [transfer, setTransfer] = useState<{ gym: string; account: EnrollTransferAccount } | null>(null);

  // An offer whose plan or gym has since been deleted has nothing left to
  // accept (the API cancels and filters them; this guards older responses).
  const pending = offers.filter(
    (o): o is EnrollmentOffer & {
      plan_id: NonNullable<EnrollmentOffer["plan_id"]>;
      organization_id: NonNullable<EnrollmentOffer["organization_id"]>;
    } => o.status === "pending" && !!o.plan_id && !!o.organization_id,
  );
  if (pending.length === 0 && !transfer) return null;

  const handle = async (offer: EnrollmentOffer, accept: boolean) => {
    setBusyId(offer._id);
    try {
      const result = await respond.mutateAsync({ offerId: offer._id, accept });
      const gym = offer.organization_id?.name ?? "the gym";
      if (accept) onAccepted?.();
      if (!accept) {
        toast.success(`Declined the offer from ${gym}`);
      } else if (result?.transfer_account) {
        setTransfer({ gym, account: result.transfer_account });
        toast.success(`Accepted. Transfer to activate your ${gym} membership.`);
      } else {
        toast.success(`You're now a member of ${gym}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <DSCard className="p-5.5">
      <div className="mb-3">
        <Eyebrow as="h2">Membership offers</Eyebrow>
      </div>

      {transfer && (
        <div
          className="mb-3 rounded-(--r-2) p-4"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>
            Transfer{" "}
            <span style={{ color: "var(--ink)", fontWeight: 500 }}>
              {money(transfer.account.amount_minor, transfer.account.currency)}
            </span>{" "}
            to this account. Your {transfer.gym} membership activates once the payment arrives.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-[13px]">
            <div className="col-span-2">
              <dt className="font-mono text-[10.5px] uppercase tracking-wide" style={{ color: "var(--fg-3)" }}>
                Account number
              </dt>
              <dd className="mt-1 font-mono text-[20px] tracking-wider" style={{ color: "var(--ink)" }}>
                {transfer.account.account_number}
              </dd>
            </div>
            {transfer.account.bank_name && (
              <div>
                <dt className="font-mono text-[10.5px] uppercase tracking-wide" style={{ color: "var(--fg-3)" }}>
                  Bank
                </dt>
                <dd className="mt-1" style={{ color: "var(--fg-2)" }}>{transfer.account.bank_name}</dd>
              </div>
            )}
            {transfer.account.account_name && (
              <div>
                <dt className="font-mono text-[10.5px] uppercase tracking-wide" style={{ color: "var(--fg-3)" }}>
                  Account name
                </dt>
                <dd className="mt-1" style={{ color: "var(--fg-2)" }}>{transfer.account.account_name}</dd>
              </div>
            )}
            {transfer.account.expires_at && (
              <div className="col-span-2">
                <dt className="font-mono text-[10.5px] uppercase tracking-wide" style={{ color: "var(--fg-3)" }}>
                  Pay before
                </dt>
                <dd className="mt-1" style={{ color: "var(--fg-2)" }}>
                  {fmtDateTime(transfer.account.expires_at)}
                </dd>
              </div>
            )}
          </dl>
          <button type="button" className="btn-ghost-v2 sm mt-3" onClick={() => setTransfer(null)}>
            Done
          </button>
        </div>
      )}

      {pending.length > 0 && (
        <ul className="flex flex-col gap-2">
          {pending.map((offer) => {
            const plan = offer.plan_id;
            const busy = busyId === offer._id;
            const isTransfer = offer.payment_mode === "paystack_transfer";
            return (
              <li
                key={offer._id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-(--r-2) p-4"
                style={{ background: "var(--bg-2)" }}
              >
                <div className="min-w-0 flex-1 basis-48">
                  <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                    {offer.organization_id.name}
                  </div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                    {plan.name} · {money(plan.price_minor, plan.currency)}
                    {isTransfer ? " · pay by bank transfer" : ""} · expires {fmtDate(offer.expires_at)}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    className="btn-ghost-v2 sm"
                    disabled={busyId !== null}
                    onClick={() => void handle(offer, false)}
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    className="btn-primary-v2 sm disabled:opacity-40"
                    disabled={busyId !== null}
                    onClick={() => void handle(offer, true)}
                  >
                    {busy ? "Working…" : "Accept"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </DSCard>
  );
}
