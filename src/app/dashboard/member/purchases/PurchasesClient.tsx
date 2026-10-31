"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { AsyncSpinner, DSCard, EmptySlate, PageHeader, StatusPill } from "@/components/ds";
import { StartProgramControl } from "@/components/content/StartProgramControl";
import { formatMinor } from "@/lib/currencies/helpers";
import {
  paidContentService,
  type ContentPurchase,
  type Entitlement,
} from "@/lib/api/paidContent";
import {
  ENTITLEMENT_TONE,
  PURCHASE_TONE,
  entitlementSourceLabel,
  entitlementStateLabel,
  kindLabel,
  offerPath,
  purchaseIsDead,
  purchaseStatusLabel,
  purchaseView,
  shortDate,
} from "@/lib/paidContent/helpers";

/**
 * Everything the member has: programs and meal plans they bought, were given,
 * get through a plan, or keep after a plan ended (GET /content/entitlements/mine,
 * paged), with payments still in flight or returned listed above as records.
 * The status is always the API's.
 */
export default function PurchasesClient() {
  const [purchases, setPurchases] = useState<ContentPurchase[] | null>(null);
  const [owned, setOwned] = useState<Entitlement[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  const [moreError, setMoreError] = useState(false);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [p, e] = await Promise.all([paidContentService.myPurchases(), paidContentService.myEntitlements()]);
      if (!active) return;
      // Either list failing is an error with a retry: an empty "Nothing here
      // yet" would tell a member who owns things that they own nothing.
      if (!p.success || !p.data || !e.success || !e.data) {
        setError(p.message || e.message || "Check your connection and try again.");
        return;
      }
      setPurchases(p.data);
      setOwned(e.data.items);
      setCursor(e.data.nextCursor);
      setError(null);
    })();
    return () => {
      active = false;
    };
  }, [attempt]);

  const showMore = async () => {
    if (!cursor || more) return;
    setMore(true);
    setMoreError(false);
    const res = await paidContentService.myEntitlements(20, cursor);
    setMore(false);
    if (!res.success || !res.data) return setMoreError(true);
    setOwned((cur) => [...cur, ...res.data!.items]);
    setCursor(res.data.nextCursor);
  };

  // A paid purchase is listed as an entitlement; these are the ones still
  // settling or returned. Holds that died (expired, failed, cancelled) charged
  // nothing and cannot be finished, so they are left out: buying again starts
  // a new one from the item.
  const records = (purchases ?? []).filter((p) => purchaseView(p) !== "unlocked" && !purchaseIsDead(p));

  return (
    <MemberDashboardShell activeLabel="Purchases">
      <PageHeader
        title="My purchases"
        subtitle="Programs and meal plans you bought, were given, or get through a plan."
      />
      {error ? (
        <EmptySlate
          message="We couldn't load your purchases."
          hint={error}
          action={
            <button type="button" className="btn-ghost-v2" onClick={() => {
                setError(null);
                setPurchases(null);
                setAttempt((n) => n + 1);
              }}>
              Try again
            </button>
          }
        />
      ) : purchases === null ? (
        <AsyncSpinner />
      ) : records.length === 0 && owned.length === 0 ? (
        <EmptySlate
          message="Nothing here yet."
          hint="Programs and meal plans you buy, are given, or get through a plan show up here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {records.map((p) => {
            const view = purchaseView(p);
            return (
              <DSCard key={p.id}>
                <div className="flex items-start gap-3 justify-between">
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium truncate" style={{ color: "var(--ink)" }}>
                      {p.itemName || kindLabel(p.itemKind)}
                    </div>
                    <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>
                      {[kindLabel(p.itemKind), shortDate(p.paidAt), formatMinor(p.currency, p.amountMinor)]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <StatusPill label={purchaseStatusLabel(p)} tone={PURCHASE_TONE[view]} />
                </div>
                {view === "settling" && (
                  <Link
                    href={offerPath(p.itemKind, p.itemId)}
                    className="btn-signal-v2 mt-3 inline-flex"
                    aria-label={`Finish paying for ${p.itemName}`}
                  >
                    Finish paying
                  </Link>
                )}
                {view === "refunded" && (
                  <p className="text-[12.5px] mt-3" style={{ color: "var(--fg-3)" }}>
                    Refunded by your provider. What you did stays readable, and it is paused.
                  </p>
                )}
                {view === "unmatched" && (
                  <p className="text-[12.5px] mt-3" style={{ color: "var(--fg-3)" }}>
                    The amount paid did not match. Contact support and we will sort it out.
                  </p>
                )}
              </DSCard>
            );
          })}
          {owned.map((e) => (
            <DSCard key={e.id}>
              <div className="flex items-start gap-3 justify-between">
                <div className="min-w-0">
                  <div className="text-[15px] font-medium truncate" style={{ color: "var(--ink)" }}>
                    {e.title || kindLabel(e.itemKind)}
                  </div>
                  <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>
                    {[kindLabel(e.itemKind), entitlementSourceLabel(e)].join(" · ")}
                  </div>
                </div>
                <StatusPill label={entitlementStateLabel(e.state)} tone={ENTITLEMENT_TONE[e.state]} />
              </div>
              {e.state === "open" && e.itemKind === "program" && (
                <div className="mt-3">
                  <StartProgramControl programId={e.itemId} title={e.title} />
                </div>
              )}
              {e.state === "open" && e.itemKind === "meal_plan" && (
                <Link href="/dashboard/member/meal-plans" className="btn-ghost-v2 mt-3 inline-flex">
                  See my meal plans
                </Link>
              )}
              {e.state === "frozen" && (
                <Link
                  href={offerPath(e.itemKind, e.itemId)}
                  className="btn-ghost-v2 mt-3 inline-flex"
                  aria-label={`See how to renew ${e.title}`}
                >
                  See how to renew
                </Link>
              )}
            </DSCard>
          ))}
          {cursor && (
            <div className="flex flex-col items-start gap-2">
              {moreError && (
                <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                  Couldn&apos;t load more. Try again.
                </p>
              )}
              <button type="button" className="btn-ghost-v2" disabled={more} onClick={() => void showMore()}>
                {more ? "Loading..." : "Show more"}
              </button>
            </div>
          )}
        </div>
      )}
    </MemberDashboardShell>
  );
}
