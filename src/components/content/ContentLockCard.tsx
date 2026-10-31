"use client";

import Link from "next/link";
import type { ContentOffer } from "@/lib/api/paidContent";
import { FROZEN_RENEW_LABEL } from "@/lib/frozenContent";
import { kindLabel, offerPath, priceText } from "@/lib/paidContent/helpers";

/**
 * An item that needs payment (or whose access ended), with its way in. Every
 * action opens the offer page, which asks the API where the member stands and
 * handles buying, joining a plan and renewing. Prices are shown per currency,
 * never added up. Nothing here decides access.
 *
 * - `frozen`: the member had it and access ended. Read-only copy stays; the
 *   action is "See how to renew".
 * - otherwise: "Buy" when the item has its own price, else "Join plan" when
 *   only a plan includes it.
 */
export function ContentLockCard({
  offer,
  frozen = false,
  subtitle,
}: {
  offer: ContentOffer;
  frozen?: boolean;
  /** Who it is from, when known. */
  subtitle?: string | null;
}) {
  const href = offerPath(offer.itemKind, offer.itemId);
  const buyable = offer.prices.length > 0;
  const planNames = offer.plans.map((p) => p.name).filter(Boolean);
  const action = frozen ? FROZEN_RENEW_LABEL : buyable ? "Buy" : planNames.length > 0 ? "Join plan" : "See details";

  return (
    <div
      className="rounded-(--r-3) px-5 py-4 flex flex-col gap-2"
      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      data-testid="content-lock-card"
    >
      <span
        className="self-start font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full"
        style={{ background: "var(--bg-3)", color: "var(--fg-3)" }}
      >
        {frozen ? "Access ended" : kindLabel(offer.itemKind)}
      </span>
      <div className="text-[16px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
        {offer.title || kindLabel(offer.itemKind)}
      </div>
      {subtitle && (
        <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
          {subtitle}
        </div>
      )}
      {frozen ? (
        <p className="text-[13px]" style={{ color: "var(--fg-2)", lineHeight: 1.5 }}>
          You can still read everything you have done. Renew to pick up where you left off.
        </p>
      ) : (
        <div className="flex flex-col gap-0.5 text-[13px]" style={{ color: "var(--fg-2)" }}>
          {offer.prices.map((p) => (
            <span key={p.currency} className="font-mono" style={{ fontVariantNumeric: "tabular-nums" }}>
              {priceText(p)} once
            </span>
          ))}
          {planNames.length > 0 && <span>Included in {planNames.join(", ")}</span>}
        </div>
      )}
      <div className="mt-1">
        <Link href={href} className={frozen || !buyable ? "btn-ghost-v2" : "btn-signal-v2"}>
          {action}
        </Link>
      </div>
    </div>
  );
}
