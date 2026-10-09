"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { StatusPill } from "@/components/ds/StatusPill";
import { toast } from "@/components/Toast";
import { formatMinor } from "@/lib/currencies/helpers";
import { formatDate } from "@/utils/format";
import type { PaymentMethodView } from "@/lib/api/memberBilling";
import {
  cardExpiry,
  cardLabel,
  cardStatusCopy,
  groupCardsByProvider,
} from "@/lib/billing/autoRenew";
import { useMyPaymentMethods, useRemovePaymentMethod } from "@/lib/queries/memberBilling";

/** Memberships a card still renews: an ended one isn't counted or listed. */
const ENDED = new Set(["expired", "cancelled"]);
function liveSubs(card: PaymentMethodView) {
  return card.subscriptions.filter((s) => !ENDED.has(s.status));
}

function chargeLine(s: PaymentMethodView["subscriptions"][number]): string {
  const name = s.plan_name ?? "Membership";
  if (!s.next_charge_at) return `${name}: auto-renew off`;
  const price =
    s.renewal_price_minor != null && s.currency
      ? ` · ${formatMinor(s.currency, s.renewal_price_minor)}`
      : "";
  return `${name}: next charge ${formatDate(s.next_charge_at)}${price}`;
}

/**
 * The member's saved cards, grouped by provider (each provider charges its
 * own cards on its own Paystack account). Each card lists the memberships
 * it renews. Removing one stops auto-renew on all of them, so it asks first
 * and says which.
 */
export function SavedCards() {
  const { data: cards = [], isLoading, isError, refetch } = useMyPaymentMethods();
  const remove = useRemovePaymentMethod();
  const [confirming, setConfirming] = useState<PaymentMethodView | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setConfirming(null);
    setError(null);
  };

  const onRemove = async () => {
    if (!confirming) return;
    setError(null);
    const res = await remove.mutateAsync(confirming.id);
    if (res.success) {
      const n = liveSubs(confirming).length;
      toast.success(
        n > 0
          ? `Card removed. Auto-renew is off on ${n === 1 ? "1 membership" : `${n} memberships`}.`
          : "Card removed.",
      );
      close();
    } else {
      setError(res.message ?? "We couldn't remove this card. Please try again.");
    }
  };

  const groups = groupCardsByProvider(cards);

  return (
    <section
      aria-labelledby="saved-cards-heading"
      className="rounded-(--r-3) border border-border bg-bg overflow-hidden"
    >
      <div className="border-b border-border px-5.5 py-4">
        <h2 id="saved-cards-heading" className="text-[15px] font-medium text-ink">
          Saved cards
        </h2>
        <p className="mt-0.5 text-[12.5px] text-fg-2">
          Cards you chose to save for auto-renew. Each provider can only charge the cards saved with them.
        </p>
      </div>

      {isLoading && <p className="px-5.5 py-6 text-[13px] text-fg-2">Loading your cards…</p>}

      {isError && (
        <div className="flex flex-wrap items-center gap-3 px-5.5 py-6">
          <p className="text-[13px] text-fg-2">We couldn&apos;t load your saved cards.</p>
          <button type="button" className="btn-ghost-v2 sm" onClick={() => void refetch()}>
            Try again
          </button>
        </div>
      )}

      {!isLoading && !isError && cards.length === 0 && (
        <p className="px-5.5 py-8 text-center text-[13.5px] text-fg-2">
          No saved cards. A card is saved when you tick &ldquo;Renew automatically&rdquo; while paying for a membership.
        </p>
      )}

      {groups.map((group) => (
        <div key={group.provider} className="border-b border-border last:border-b-0">
          <h3 className="px-5.5 pt-4 font-mono text-[11px] uppercase tracking-[0.04em] text-fg-2">
            {group.provider}
          </h3>
          <ul>
            {group.cards.map((card) => {
              const st = cardStatusCopy(card);
              return (
                <li key={card.id} className="flex flex-col gap-2 px-5.5 py-3.5 sm:flex-row sm:items-start">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-[14px] font-medium text-ink">{cardLabel(card)}</span>
                      <StatusPill tone={st.tone} label={st.label} />
                    </div>
                    <p className="mt-1 font-mono text-[11.5px] text-fg-2">
                      Expires {cardExpiry(card)}
                      {card.bank ? ` · ${card.bank}` : ""}
                    </p>
                    {st.hint && <p className="mt-1 text-[12.5px] text-fg-2">{st.hint}</p>}
                    {liveSubs(card).length > 0 ? (
                      <ul className="mt-1.5 flex flex-col gap-0.5" aria-label={`Memberships on ${cardLabel(card)}`}>
                        {liveSubs(card).map((s) => (
                          <li key={s.id} className="text-[12.5px] text-fg-2">
                            {chargeLine(s)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1.5 text-[12.5px] text-fg-2">No memberships renew on this card.</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="btn-ghost-v2 md shrink-0 self-start"
                    onClick={() => setConfirming(card)}
                    aria-label={`Remove ${cardLabel(card)}`}
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      <Modal
        open={!!confirming}
        onClose={close}
        title="Remove this card?"
        size="sm"
        disableCloseGuard
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost-v2 md" onClick={close} disabled={remove.isPending}>
              Keep card
            </button>
            <button
              type="button"
              className="btn-primary-v2 md"
              // Destructive: the danger ink, with the page colour for text
              // (inline, because button text classes don't apply here).
              style={{ background: "var(--danger-ink)", borderColor: "var(--danger-ink)", color: "var(--bg)" }}
              onClick={() => void onRemove()}
              disabled={remove.isPending}
            >
              {remove.isPending ? "Removing…" : "Remove card"}
            </button>
          </div>
        }
      >
        {confirming && (
          <div className="flex flex-col gap-3 text-[13.5px] text-fg-2">
            <p>
              <strong className="text-ink">{cardLabel(confirming)}</strong>
              {confirming.provider_name ? ` saved with ${confirming.provider_name}` : ""} will be removed.
            </p>
            {liveSubs(confirming).length > 0 ? (
              <>
                <p>Auto-renew stops on these memberships:</p>
                <ul className="list-disc pl-5">
                  {liveSubs(confirming).map((s) => (
                    <li key={s.id}>{s.plan_name ?? "Membership"}</li>
                  ))}
                </ul>
                <p>
                  Each keeps its access for the time already paid for. One with a payment due keeps it only until its grace period ends. After that, renew it yourself from Billing.
                </p>
              </>
            ) : (
              <p>No memberships renew on this card, so nothing else changes.</p>
            )}
            {error && (
              <p role="alert" className="text-danger-ink">
                {error}
              </p>
            )}
          </div>
        )}
      </Modal>
    </section>
  );
}
