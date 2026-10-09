"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { StatusPill } from "@/components/ds/StatusPill";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import {
  useMySubscriptions,
  useCancelSubscription,
} from "@/lib/queries/marketplace";
import { formatCurrency } from "@/utils/format";
import { formatDate } from "@/utils/format";
import {
  MembershipSubscriptionStatus,
  isEntitlingMembershipStatus,
  TERMINAL_MEMBERSHIP_STATUSES,
  type MembershipSubscription,
} from "@/lib/types";
import { membershipStatusMeta } from "@/lib/constants/membershipStatus";
import { minorToMajor } from "@/lib/money/minorMoney";
import { formatMinor } from "@/lib/currencies/helpers";
import { queryKeys } from "@/lib/queries/keys";
import { useMyPaymentMethods } from "@/lib/queries/memberBilling";
import { cardLabel, cardRetryFor, renewHrefForMembership } from "@/lib/billing/autoRenew";
import { MembershipPlanType } from "@/lib/types";
import { AutoRenewControl } from "./AutoRenewControl";
import { SavedCards } from "./SavedCards";

const planOf = (s: MembershipSubscription) =>
  typeof s.plan_id === "object" ? s.plan_id : null;
const listingOf = (s: MembershipSubscription) =>
  typeof s.listing_id === "object" ? s.listing_id : null;
// Enrolled memberships have no listing — the populated org is the gym.
const gymNameOf = (s: MembershipSubscription) => {
  const listing = listingOf(s);
  if (listing?.headline) return listing.headline;
  return typeof s.organization_id === "object"
    ? (s.organization_id.name ?? "")
    : "";
};

/**
 * The "pay next term by card" checkout for a membership that isn't due yet:
 * renewHrefForMembership only offers Renew close to the end of a term, but
 * saving a card for auto-renew means paying the next term now (renew in
 * place adds it after the current one).
 */
function dayBeforeTermEnd(s: MembershipSubscription): Date {
  return s.end_date ? new Date(new Date(s.end_date).getTime() - 86_400_000) : new Date();
}

/** The fields the auto-renew PATCH changes; the rest stay as populated. */
const BILLING_FIELDS = [
  "auto_renew",
  "collection_method",
  "payment_method_id",
  "renewal_price_minor",
  "next_charge_at",
] as const;

/**
 * Member billing: memberships (plans, amounts, renewal dates, cancel),
 * card auto-renew per membership, saved cards, and "Renew" wherever a term
 * can be paid for. A full transaction ledger has no member endpoint yet, so
 * it is left out rather than invented.
 */
export function BillingClient() {
  const { data: subs = [], isLoading } = useMySubscriptions();
  const { data: cards = [] } = useMyPaymentMethods();
  const cancel = useCancelSubscription();
  const queryClient = useQueryClient();

  // A notification can open this page at one membership (?subscriptionId=).
  // Read once from the address bar; no Suspense boundary needed.
  useEffect(() => {
    if (isLoading) return;
    let id: string | null = null;
    try {
      id = new URLSearchParams(window.location.search).get("subscriptionId");
    } catch {
      id = null;
    }
    if (!id || !/^[A-Za-z0-9_-]{1,64}$/.test(id)) return;
    const row = document.getElementById(`membership-${id}`);
    if (row) {
      row.scrollIntoView({ block: "center" });
      row.focus({ preventScroll: true });
    }
  }, [isLoading]);

  /** Render the server's answer, then re-read both lists from the API. */
  const onAutoRenewChanged = (updated: MembershipSubscription) => {
    queryClient.setQueryData<MembershipSubscription[]>(
      queryKeys.marketplace.subscriptions(),
      (old) =>
        old?.map((s) => {
          if (s._id !== updated._id) return s;
          const next = { ...s };
          for (const key of BILLING_FIELDS) {
            if (key in updated) (next as Record<string, unknown>)[key] = updated[key];
          }
          return next;
        }),
    );
    void queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.subscriptions() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.paymentMethods() });
  };

  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);
  const pastDue = subs.filter((s) => s.status === MembershipSubscriptionStatus.PAST_DUE);

  /**
   * Memberships the member can actually use — `active` AND `past_due`. A
   * past-due member is in a grace window with access intact, so counting only
   * ACTIVE told them they had no active plan while they were still getting into
   * the gym.
   */
  const usable = subs.filter((s) => isEntitlingMembershipStatus(s.status));

  // Sum lifetime spend per currency (subscriptions can span currencies).
  const totalsByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    // Summed in MINOR units and converted once per currency at the end, so the
    // total is an exact integer count of kobo rather than a float accumulation.
    subs.forEach((s) => map.set(s.currency, (map.get(s.currency) ?? 0) + s.amount_paid_minor));
    return [...map.entries()].map(([cur, minor]) => formatCurrency(minorToMajor(minor, cur), cur)).join(" + ") || "-";
  }, [subs]);

  const nextRenewal = useMemo(() => {
    const upcoming = usable
      .map((s) => s.end_date)
      .filter((d): d is string => !!d && new Date(d) > new Date())
      .sort();
    return upcoming[0] ? formatDate(upcoming[0]) : "-";
  }, [usable]);

  const onHold = subs.filter(
    (s) =>
      s.status === MembershipSubscriptionStatus.PAUSED ||
      s.status === MembershipSubscriptionStatus.SUSPENDED,
  );

  const kpis = [
    {
      label: "Active plans",
      value: String(usable.length),
      delta: onHold.length > 0 ? `${onHold.length} on hold · ${subs.length} total` : `${subs.length} total`,
    },
    { label: "Total paid", value: totalsByCurrency, delta: "across all plans", small: totalsByCurrency.length > 10 },
    { label: "Next renewal", value: nextRenewal, delta: usable.find((s) => s.auto_renew && s.collection_method === "card_auto") ? "auto-renews by card" : "you renew it", small: true },
  ];

  const onCancel = (s: MembershipSubscription) => {
    const plan = planOf(s);
    if (window.confirm(`Cancel your ${plan?.name ?? "membership"} subscription? You keep access until ${s.end_date ? formatDate(s.end_date) : "the end of the period"}.`)) {
      void cancel.mutateAsync(s._id);
    }
  };

  // Billing has no main-nav entry, so nothing is highlighted (it was "Home").
  return (
    <MemberDashboardShell activeLabel="">
      <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>Billing</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-1 rounded-(--r-3) px-4 py-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className={`font-medium ${k.small ? "text-[18px]" : "text-[24px]"}`} style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
            <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Payment problems first: a past-due membership loses access when its
          grace runs out, so the way to pay sits at the top. */}
      {pastDue.map((s) => {
        const href = renewHrefForMembership(s);
        // While the card will be tried again, don't invite a second payment.
        const retry = cardRetryFor(s);
        const name = planOf(s)?.name ?? "membership";
        return (
          <div
            key={`due-${s._id}`}
            role="alert"
            className="flex flex-col gap-3 rounded-(--r-3) border border-danger bg-danger-soft px-5 py-4 sm:flex-row sm:items-center"
          >
            <div className="min-w-0 flex-1 text-[13.5px] text-ink">
              <p className="font-medium">Your {planOf(s)?.name ?? "membership"} payment didn&apos;t go through.</p>
              <p className="mt-0.5 text-fg-2">
                {retry.pending
                  ? retry.nextAttemptAt
                    ? `We'll try your card again on ${formatDate(retry.nextAttemptAt)}. You don't need to do anything yet.`
                    : "We'll try your card again soon. You don't need to do anything yet."
                  : s.grace_expires_at
                    ? `Pay by ${formatDate(s.grace_expires_at)} to keep your access.`
                    : "Pay now to keep your access."}
              </p>
            </div>
            {href && !retry.pending && (
              <Link href={href} className="btn-primary-v2 md shrink-0" aria-label={`Renew ${name} now`}>
                Renew now
              </Link>
            )}
          </div>
        );
      })}

      {/* Subscriptions */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="px-5.5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Memberships</h3>
        </div>
        {isLoading && <div className="px-5.5 py-6 text-[13px]" style={{ color: "var(--fg-3)" }}>Loading your memberships…</div>}
        {!isLoading && subs.length === 0 && (
          <div className="px-5.5 py-10 text-center text-[13.5px]" style={{ color: "var(--fg-3)" }}>
            No memberships yet, join a gym from the marketplace and it will appear here.
          </div>
        )}
        {subs.map((s, i) => {
          const plan = planOf(s);
          const listing = listingOf(s);
          const meta = membershipStatusMeta(s.status);
          const live =
            !TERMINAL_MEMBERSHIP_STATUSES.includes(s.status) &&
            s.status !== MembershipSubscriptionStatus.PENDING_PAYMENT;
          const recurring = plan?.plan_type === MembershipPlanType.SUBSCRIPTION;
          const renewHref = renewHrefForMembership(s);
          const card = s.payment_method_id ? cardById.get(String(s.payment_method_id)) : undefined;
          const byCard = s.auto_renew && s.collection_method === "card_auto";
          return (
            <div
              key={s._id}
              id={`membership-${s._id}`}
              tabIndex={-1}
              className="flex flex-col gap-3 px-5.5 py-4"
              style={{ borderBottom: i < subs.length - 1 ? "1px solid var(--border)" : "none" }}
            >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{plan?.name ?? "Membership"}</span>
                  <StatusPill tone={meta.tone} label={meta.label} title={meta.hint} />
                </div>
                <div className="font-mono text-[11px] mt-1" style={{ color: "var(--fg-3)" }}>
                  {gymNameOf(s)}
                  {listing?.city ? ` · ${listing.city}` : ""}
                  {` · started ${formatDate(s.start_date)}`}
                  {/* "ended" only when the term really is over. A paused or
                      suspended membership has a future end_date it has not
                      reached, and a past_due one is still inside its grace
                      window — calling either "ended" is simply wrong. */}
                  {s.end_date ? ` · ${TERMINAL_MEMBERSHIP_STATUSES.includes(s.status) ? "ended" : "renews/ends"} ${formatDate(s.end_date)}` : ""}
                </div>
                {!meta.hasAccess && !TERMINAL_MEMBERSHIP_STATUSES.includes(s.status) && (
                  <div className="text-[11.5px] mt-1" style={{ color: "var(--fg-3)" }}>{meta.hint}</div>
                )}
                {s.status === MembershipSubscriptionStatus.PAST_DUE && s.grace_expires_at && (
                  <div className="text-[11.5px] mt-1" style={{ color: "var(--danger)" }}>
                    Access continues until {formatDate(s.grace_expires_at)}, settle the renewal to keep it.
                  </div>
                )}
              </div>
              <span className="font-mono text-[13.5px] shrink-0" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {formatCurrency(minorToMajor(s.amount_paid_minor, s.currency), s.currency)}
              </span>
              {/* Cancelling is offered wherever the membership is still live —
                  a past_due member can still choose to stop, and a paused one
                  should not have to resume first. */}
              {renewHref && (
                <Link
                  href={renewHref}
                  className="btn-primary-v2 md shrink-0"
                  aria-label={`Renew ${plan?.name ?? "membership"}`}
                >
                  Renew
                </Link>
              )}
              {live && (
                <button className="btn-ghost-v2 md shrink-0" disabled={cancel.isPending} onClick={() => onCancel(s)}>
                  Cancel
                </button>
              )}
            </div>
            {live && recurring && (
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-6">
                {s.enrolled_by ? (
                  <p className="text-[12.5px] text-fg-2">Your gym manages renewals for this membership. Pay your gym to renew it.</p>
                ) : s.status === MembershipSubscriptionStatus.PAST_DUE ? (
                  // No toggle while a payment is due: turning it on can't
                  // pay this term, and the way to stop is Cancel or
                  // removing the card.
                  <p className="text-[12.5px] text-fg-2">
                    Auto-renew can&apos;t be changed while a payment is due. To stop it, cancel the membership or remove the card under Saved cards.
                  </p>
                ) : (
                  <AutoRenewControl sub={s} renewHref={renewHref ?? renewHrefForMembership(s, dayBeforeTermEnd(s))} onChanged={onAutoRenewChanged} />
                )}
                {byCard && s.status !== MembershipSubscriptionStatus.PAST_DUE && (
                  <p className="text-[12.5px] text-fg-2 sm:pt-3">
                    {s.next_charge_at ? `Next charge ${formatDate(s.next_charge_at)}` : "Renews automatically"}
                    {s.renewal_price_minor != null ? ` · ${formatMinor(s.currency, s.renewal_price_minor)}` : ""}
                    {card ? ` · ${cardLabel(card)}` : ""}
                  </p>
                )}
              </div>
            )}
            </div>
          );
        })}
      </div>

      <SavedCards />

      <p className="text-[12px] text-fg-2">
        A full payment history is coming. For now this shows your memberships, your saved cards and what you&rsquo;ve paid.
      </p>
    </MemberDashboardShell>
  );
}
