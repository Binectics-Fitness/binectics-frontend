"use client";

import { ContentLockCard } from "@/components/content/ContentLockCard";
import type { ContentOffer } from "@/lib/api/paidContent";

/**
 * "Programs & meal plans": the paid items a provider shows on their listing
 * (`content_offers` from GET /marketplace/listings/:id). Renders nothing when
 * there are none, so a provider who sells nothing looks as before.
 */
export function ContentOffersStrip({
  offers,
  title = "Programs & meal plans",
  className = "py-8 border-b border-border",
}: {
  offers: ContentOffer[];
  title?: string;
  className?: string;
}) {
  if (offers.length === 0) return null;
  return (
    <section className={className} aria-label={title}>
      <h2 className="text-[22px] font-medium mb-3.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {offers.map((o) => (
          <ContentLockCard key={`${o.itemKind}:${o.itemId}`} offer={o} />
        ))}
      </div>
    </section>
  );
}
