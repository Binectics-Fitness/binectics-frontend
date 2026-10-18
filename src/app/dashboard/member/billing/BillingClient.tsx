"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import Modal from "@/components/Modal";
import { toast } from "@/components/Toast";
import { StatusPill } from "@/components/ds/StatusPill";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import {
  useMySubscriptions,
  useCancelSubscription,
  useMembershipHold,
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
import { cardLabel, cardRetryFor, renewActionFor, renewHrefForMembership } from "@/lib/billing/autoRenew";
import { StartConversationButton } from "@/components/messaging/StartConversationButton";
import { MembershipPlanType } from "@/lib/types";
import {
  canPause,
  canResume,
  endIfResumedAt,
  pauseEffectLines,
  pausedLine,
  suspendedLine,
} from "@/lib/billing/membershipHolds";
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

/**
 * What cancelling does, as the API decides it (cancelMembershipSubscription):
 * an ACTIVE membership whose paid term hasn't ended runs to its end date and
 * then ends; anything else (past due, paused, suspended) ends straight away.
 * Either way nothing renews and the card consent is revoked.
 */
function runsToTermEnd(s: MembershipSubscription): boolean {
  return (
    s.status === MembershipSubscriptionStatus.ACTIVE &&
    !!s.end_date &&
    new Date(s.end_date).getTime() > Date.now()
  );
}

/** "Your Monthly membership with Iron Temple", or as much of it as is known. */
function membershipPhrase(s: MembershipSubscription): string {
  const name = planOf(s)?.name;
  const gym = gymNameOf(s);
  // A plan already called "Gold Membership" doesn't get a second "membership".
  const what = name ? `Your ${name}${/membership$/i.test(name.trim()) ? "" : " membership"}` : "This membership";
  return `${what}${gym ? ` with ${gym}` : ""}`;
}

const paysByCard = (s: MembershipSubscription) =>
  s.collection_method === "card_auto" || !!s.payment_method_id;

/**
 * The fields the auto-renew PATCH changes; the rest stay as populated.
 * Turning renewal back on also takes back a mid-term cancellation.
 */
const BILLING_FIELDS = [
  "auto_renew",
  "cancel_requested_at",
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
  const [cancelling, setCancelling] = useState<MembershipSubscription | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const hold = useMembershipHold();
  const [holding, setHolding] = useState<{ sub: MembershipSubscription; action: "pause" | "resume" } | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);
  // A pause refused because a card renewal is with Paystack right now
  // (409 RENEWAL_CHARGE_IN_PROGRESS): nothing is wrong, it has to wait.
  const [holdWait, setHoldWait] = useState(false);

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

  const closeCancel = () => {
    if (cancel.isPending) return;
    setCancelling(null);
    setCancelError(null);
  };

  const onConfirmCancel = async () => {
    if (!cancelling || cancel.isPending) return;
    setCancelError(null);
    const target = cancelling;
    try {
      const res = await cancel.mutateAsync(target._id);
      if (res.success) {
        toast.success(
          runsToTermEnd(target) && target.end_date
            ? `Membership cancelled. You keep access until ${formatDate(target.end_date)}.`
            : "Membership cancelled.",
        );
        setCancelling(null);
      } else {
        setCancelError(res.message ?? "We couldn't cancel this membership. Please try again.");
      }
    } catch {
      setCancelError("We couldn't cancel this membership. Please try again.");
    }
  };

  const closeHold = () => {
    if (hold.isPending) return;
    setHolding(null);
    setHoldError(null);
    setHoldWait(false);
  };

  const onConfirmHold = async () => {
    if (!holding || hold.isPending) return;
    setHoldError(null);
    setHoldWait(false);
    const { sub: target, action } = holding;
    try {
      const res = await hold.mutateAsync({ subscriptionId: target._id, action });
      if (res.success) {
        toast.success(
          action === "pause"
            ? "Membership paused. Resume it here when you're back."
            : res.data?.end_date
              ? `Welcome back. Your membership now runs to ${formatDate(res.data.end_date)}.`
              : "Welcome back. Your membership is active again.",
        );
        setHolding(null);
      } else if (res.code === "RENEWAL_CHARGE_IN_PROGRESS") {
        setHoldWait(true);
        setHoldError(res.message || "A renewal payment is being processed. Try again in a few minutes.");
      } else {
        setHoldError(
          res.message ??
            (action === "pause"
              ? "We couldn't pause this membership. Please try again."
              : "We couldn't resume this membership. Please try again."),
        );
      }
    } catch {
      setHoldError(
        action === "pause"
          ? "We couldn't pause this membership. Please try again."
          : "We couldn't resume this membership. Please try again.",
      );
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
        // Null while the card will be tried again: no second payment.
        const action = renewActionFor(s, undefined, subs);
        const href = action?.kind === "checkout" ? action.href : null;
        const ask = action?.kind === "ask_gym" ? action : null;
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
                  : s.auto_renew && s.collection_method === "card_auto"
                    ? // No Renew here (renewDue): auto-renew goes off first.
                      "Your saved card is still set to pay for it. To pay another way, turn auto-renew off on the membership below first."
                    : ask
                      ? // The gym has no listing to pay through: the gym renews it.
                        `${s.grace_expires_at ? `You keep access until ${formatDate(s.grace_expires_at)}. ` : ""}Ask ${ask.gymName} to renew it.`
                      : s.grace_expires_at
                        ? `Pay by ${formatDate(s.grace_expires_at)} to keep your access.`
                        : "Pay now to keep your access."}
              </p>
            </div>
            {href && (
              <Link href={href} className="btn-primary-v2 md shrink-0" aria-label={`Renew ${name} now`}>
                Renew now
              </Link>
            )}
            {ask?.canMessage && (
              <StartConversationButton
                organizationId={ask.organizationId}
                messagesHref="/dashboard/messages"
                label="Message"
                ariaLabel={`Message ${ask.gymName} about renewing`}
                className="btn-primary-v2 md shrink-0"
              />
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
          const renewAction = renewActionFor(s, undefined, subs);
          const renewHref = renewAction?.kind === "checkout" ? renewAction.href : null;
          const ask = renewAction?.kind === "ask_gym" ? renewAction : null;
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
                {s.status === MembershipSubscriptionStatus.PAUSED ? (
                  <div className="text-[11.5px] mt-1" style={{ color: "var(--fg-2)" }} data-testid="paused-line">
                    {pausedLine(s, formatDate)} You can&apos;t check in or book classes until you resume.
                  </div>
                ) : s.status === MembershipSubscriptionStatus.SUSPENDED ? (
                  <div className="text-[11.5px] mt-1" style={{ color: "var(--danger-ink)" }} data-testid="suspended-line">
                    {suspendedLine(s, formatDate)}
                  </div>
                ) : (
                  !meta.hasAccess &&
                  !TERMINAL_MEMBERSHIP_STATUSES.includes(s.status) && (
                    <div className="text-[11.5px] mt-1" style={{ color: "var(--fg-3)" }}>{meta.hint}</div>
                  )
                )}
                {s.cancel_requested_at && s.status === MembershipSubscriptionStatus.ACTIVE && (
                  <div className="text-[11.5px] mt-1" style={{ color: "var(--fg-3)" }} data-testid="membership-ends">
                    Cancelled, access ends {s.end_date ? formatDate(s.end_date) : "at the end of the term"}. It won&rsquo;t renew.
                  </div>
                )}
                {s.status === MembershipSubscriptionStatus.PAST_DUE && s.grace_expires_at && (
                  <div className="text-[11.5px] mt-1" style={{ color: "var(--danger)" }}>
                    Access continues until {formatDate(s.grace_expires_at)}, settle the renewal to keep it.
                  </div>
                )}
                {ask && (
                  // The gym publishes no listing to pay through: the gym renews it.
                  <div className="text-[11.5px] mt-1" style={{ color: "var(--fg-2)" }} data-testid="ask-gym-line">
                    Ask {ask.gymName} to renew this membership.
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
              {ask?.canMessage && (
                <StartConversationButton
                  organizationId={ask.organizationId}
                  messagesHref="/dashboard/messages"
                  label="Message"
                  ariaLabel={`Message ${ask.gymName} about renewing`}
                  className="btn-ghost-v2 md shrink-0"
                />
              )}
              {canResume(s) && (
                <button
                  type="button"
                  className="btn-primary-v2 md shrink-0"
                  disabled={hold.isPending}
                  aria-label={`Resume ${plan?.name ?? "membership"}`}
                  onClick={() => {
                    setHoldError(null);
                    setHolding({ sub: s, action: "resume" });
                  }}
                >
                  Resume
                </button>
              )}
              {canPause(s) && (
                <button
                  type="button"
                  className="btn-ghost-v2 md shrink-0"
                  disabled={hold.isPending}
                  aria-label={`Pause ${plan?.name ?? "membership"}`}
                  onClick={() => {
                    setHoldError(null);
                    setHolding({ sub: s, action: "pause" });
                  }}
                >
                  Pause
                </button>
              )}
              {live && !s.cancel_requested_at && (
                <button
                  type="button"
                  className="btn-ghost-v2 md shrink-0"
                  disabled={cancel.isPending}
                  onClick={() => {
                    setCancelError(null);
                    setCancelling(s);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
            {/* Not while suspended: the API takes no auto-renew change then
                (on or off), so the switch would only ever refuse. */}
            {live && recurring && s.status !== MembershipSubscriptionStatus.SUSPENDED && (
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:gap-6">
                {s.enrolled_by ? (
                  <p className="text-[12.5px] text-fg-2">Your gym manages renewals for this membership. Pay your gym to renew it.</p>
                ) : s.status === MembershipSubscriptionStatus.PAST_DUE ? (
                  // Past due: only OFF (the API turns it on for active or
                  // paused memberships only), behind a confirmation. Once
                  // it's off the row offers Renew instead, when there is a
                  // Renew to press (not while the card is still retried, nor
                  // when the gym has to be asked).
                  s.auto_renew ? (
                    <AutoRenewControl sub={s} renewHref={null} onChanged={onAutoRenewChanged} offOnly />
                  ) : (
                    <p className="text-[12.5px] text-fg-2">
                      {renewHref ? "Auto-renew is off. Renew to keep your access." : "Auto-renew is off."}
                    </p>
                  )
                ) : (
                  <AutoRenewControl sub={s} renewHref={renewHref ?? renewHrefForMembership(s, dayBeforeTermEnd(s))} onChanged={onAutoRenewChanged} />
                )}
                {s.status !== MembershipSubscriptionStatus.PAST_DUE && cardRetryFor(s).pending && (
                  <p className="text-[12.5px] text-fg-2 sm:pt-3">
                    {cardRetryFor(s).nextAttemptAt
                      ? `We'll try your card again on ${formatDate(cardRetryFor(s).nextAttemptAt)}.`
                      : "We'll try your card again soon."}
                  </p>
                )}
                {byCard && s.status === MembershipSubscriptionStatus.PAUSED && (
                  <p className="text-[12.5px] text-fg-2 sm:pt-3">Auto-renew won&apos;t charge your card while paused.</p>
                )}
                {byCard &&
                  s.status !== MembershipSubscriptionStatus.PAST_DUE &&
                  s.status !== MembershipSubscriptionStatus.PAUSED &&
                  !cardRetryFor(s).pending && (
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

      <Modal
        open={!!cancelling}
        onClose={closeCancel}
        title="Cancel this membership?"
        size="sm"
        disableCloseGuard
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost-v2 md" onClick={closeCancel} disabled={cancel.isPending}>
              Keep membership
            </button>
            <button
              type="button"
              className="btn-primary-v2 md"
              // Destructive: the danger ink, with the page colour for text
              // (inline, because button text classes don't apply here).
              style={{ background: "var(--danger-ink)", borderColor: "var(--danger-ink)", color: "var(--bg)" }}
              onClick={() => void onConfirmCancel()}
              disabled={cancel.isPending}
            >
              {cancel.isPending ? "Cancelling…" : "Cancel membership"}
            </button>
          </div>
        }
      >
        {cancelling && (
          <div className="flex flex-col gap-3 text-[13.5px] text-fg-2" data-testid="cancel-membership-copy">
            <p>
              {membershipPhrase(cancelling)}{" "}
              {runsToTermEnd(cancelling) && cancelling.end_date
                ? `stays active until ${formatDate(cancelling.end_date)}, the end of the period you've paid for. Then it ends.`
                : "ends now, and you lose access straight away."}
            </p>
            <p>It won&rsquo;t renew, and you won&rsquo;t be charged for it again.</p>
            {paysByCard(cancelling) && (
              <p>Your card stays saved. A payment already being processed may still go through.</p>
            )}
            {cancelError && (
              <p role="alert" className="text-danger-ink">
                {cancelError}
              </p>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!holding}
        onClose={closeHold}
        title={holding?.action === "resume" ? "Resume this membership?" : "Pause this membership?"}
        size="sm"
        disableCloseGuard
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost-v2 md" onClick={closeHold} disabled={hold.isPending}>
              {holding?.action === "resume" ? "Stay paused" : "Keep it active"}
            </button>
            <button
              type="button"
              className="btn-primary-v2 md"
              onClick={() => void onConfirmHold()}
              disabled={hold.isPending}
            >
              {holding?.action === "resume"
                ? hold.isPending
                  ? "Resuming…"
                  : "Resume membership"
                : hold.isPending
                  ? "Pausing…"
                  : "Pause membership"}
            </button>
          </div>
        }
      >
        {holding && (
          <div className="flex flex-col gap-3 text-[13.5px] text-fg-2" data-testid="hold-copy">
            <p className="text-ink">{membershipPhrase(holding.sub)}.</p>
            {holding.action === "pause" ? (
              pauseEffectLines(holding.sub, formatDate).map((line) => <p key={line}>{line}</p>)
            ) : (
              <>
                <p>You can check in and book again straight away.</p>
                {endIfResumedAt(holding.sub) && (
                  <p>
                    The days you were paused are added back, so it now runs to{" "}
                    {formatDate(endIfResumedAt(holding.sub)!)}.
                  </p>
                )}
              </>
            )}
            {holdError && (
              <p
                role="alert"
                className={holdWait ? "rounded-(--r-2) p-2.5" : "text-danger-ink"}
                style={holdWait ? { background: "var(--warn-soft)", color: "var(--warn-ink)" } : undefined}
              >
                {holdError}
              </p>
            )}
          </div>
        )}
      </Modal>

      <p className="text-[12px] text-fg-2">
        A full payment history is coming. For now this shows your memberships, your saved cards and what you&rsquo;ve paid.
      </p>
    </MemberDashboardShell>
  );
}
