"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { AsyncSpinner, DSCard, EmptySlate, PageHeader } from "@/components/ds";
import { ContentBuyPanel } from "@/components/content/ContentBuyPanel";
import { StartProgramControl } from "@/components/content/StartProgramControl";
import { formatMinor } from "@/lib/currencies/helpers";
import { paidContentService, pathToKind, type ContentOfferRead } from "@/lib/api/paidContent";
import { kindLabel, pricesText } from "@/lib/paidContent/helpers";
import { FROZEN_BODY, FROZEN_TITLE } from "@/lib/frozenContent";

/**
 * One paid item's offer, opened from a provider's "shared something with you"
 * notice. The API says where the member stands: already open (start it),
 * paused until they renew, or needing payment (buy it / join a plan).
 * Nothing here decides access; it only shows the API's answer.
 */
export default function ContentOfferClient({ kindSegment, itemId }: { kindSegment: string; itemId: string }) {
  const kind = pathToKind(kindSegment);
  // undefined: loading. null: not offered (404).
  const [offer, setOffer] = useState<ContentOfferRead | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  // True while a (re)load is in flight, so "Try again" shows it is working.
  const [loading, setLoading] = useState(true);
  // Read out by the polite live region after a purchase unlocks the item.
  const [announce, setAnnounce] = useState("");

  const [attempt, setAttempt] = useState(0);
  const reload = () => {
    setLoading(true);
    setAttempt((n) => n + 1);
  };
  const onUnlocked = () => {
    setAnnounce("Payment confirmed. This is now unlocked.");
    reload();
  };

  useEffect(() => {
    if (!kind) return;
    let active = true;
    void (async () => {
      const res = await paidContentService.getOffer(kind, itemId);
      if (!active) return;
      setLoading(false);
      if (res.success) {
        setOffer(res.data ?? null);
        setError(null);
      } else if (res.status === 404) {
        setOffer(null);
        setError(null);
      } else {
        setError(res.message || "Check your connection and try again.");
      }
    })();
    return () => {
      active = false;
    };
  }, [kind, itemId, attempt]);

  const body = () => {
    if (!kind) {
      return <EmptySlate message="No longer available." hint="This link isn't for a program or meal plan." />;
    }
    if (error && offer === undefined) {
      return (
        <EmptySlate
          message="We couldn't load this."
          hint={error}
          action={
            <TryAgain loading={loading} onClick={reload} />
          }
        />
      );
    }
    if (offer === undefined) return <AsyncSpinner />;
    if (error) {
      // A reload failed while an earlier answer is on screen: say so, keep
      // the earlier answer below it (it may be out of date).
      return (
        <div className="flex flex-col gap-3">
          <div role="alert" className="flex flex-wrap items-center gap-3 text-[13px]" style={{ color: "var(--fg-2)" }}>
            <span>We couldn&apos;t refresh this. {error}</span>
            <TryAgain loading={loading} onClick={reload} />
          </div>
          {offerBody(offer)}
        </div>
      );
    }
    return offerBody(offer);
  };

  const offerBody = (offer: ContentOfferRead | null) => {
    if (offer === null) {
      return (
        <EmptySlate
          message="No longer available."
          hint="This isn't offered any more. Ask your provider if you were expecting it."
        />
      );
    }
    const what = kindLabel(offer.itemKind).toLowerCase();
    const title = offer.title || `This ${what}`;

    if (offer.access.state === "open") {
      return (
        <DSCard>
          <div className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>{title}</div>
          <p className="text-[13.5px] mt-1.5 mb-3" style={{ color: "var(--fg-2)" }}>You already have this.</p>
          {offer.itemKind === "program" ? (
            <StartProgramControl programId={offer.itemId} title={offer.title} />
          ) : (
            <Link href="/dashboard/member/meal-plans" className="btn-signal-v2 inline-flex">
              Open my meal plans
            </Link>
          )}
        </DSCard>
      );
    }

    if (offer.access.state === "frozen") {
      return (
        <DSCard>
          <div className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>{FROZEN_TITLE}</div>
          <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-2)" }}>{FROZEN_BODY}</p>
          <Offered offer={offer} />
          {offer.forSale && offer.prices.length > 0 && (
            <div className="mt-4">
              <ContentBuyPanel kind={offer.itemKind} itemId={offer.itemId} prices={offer.prices} onUnlocked={onUnlocked} />
            </div>
          )}
        </DSCard>
      );
    }

    if (!offer.forSale) {
      return (
        <DSCard>
          <div className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>{title}</div>
          <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-2)" }}>
            This isn&apos;t for sale right now. Ask your provider how to get it.
          </p>
        </DSCard>
      );
    }

    return (
      <DSCard>
        <div className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>
          {kindLabel(offer.itemKind)}
        </div>
        <div className="text-[18px] font-medium mt-1" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
          {title}
        </div>
        {offer.prices.length > 0 && (
          <div className="text-[22px] font-medium mt-2" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
            {pricesText(offer.prices)}
          </div>
        )}
        <Offered offer={offer} />
        {offer.prices.length > 0 && (
          <div className="mt-4">
            <ContentBuyPanel kind={offer.itemKind} itemId={offer.itemId} prices={offer.prices} onUnlocked={onUnlocked} />
          </div>
        )}
      </DSCard>
    );
  };

  return (
    <MemberDashboardShell activeLabel="Purchases">
      <PageHeader title="Shared with you" />
      <div className="max-w-xl">{body()}</div>
      <div role="status" aria-live="polite" className="sr-only">
        {announce}
      </div>
    </MemberDashboardShell>
  );
}

function TryAgain({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <button type="button" className="btn-ghost-v2 inline-flex items-center gap-2" disabled={loading} onClick={onClick}>
      {loading && <AsyncSpinner />}
      {loading ? "Trying again..." : "Try again"}
    </button>
  );
}

/** The plans that include the item, each with where to join. */
function Offered({ offer }: { offer: ContentOfferRead }) {
  if (offer.plans.length === 0) return null;
  return (
    <div className="mt-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.05em] mb-2" style={{ color: "var(--fg-3)" }}>
        Included in
      </div>
      <ul className="flex flex-col gap-2">
        {offer.plans.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between gap-3 rounded-(--r-2) px-3 py-2"
            style={{ border: "1px solid var(--border)" }}
          >
            <span className="text-[13.5px]" style={{ color: "var(--ink)" }}>
              {p.name}
              <span className="ml-2" style={{ color: "var(--fg-3)" }}>
                {formatMinor(p.currency, p.priceMinor)}
              </span>
            </span>
            {p.listingId && (
              <Link href={`/marketplace/${encodeURIComponent(p.listingId)}`} className="btn-ghost-v2">
                See plan
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
