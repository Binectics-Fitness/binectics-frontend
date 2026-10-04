"use client";

import Link from "next/link";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { AsyncSpinner, IconTile } from "@/components/ds";
import { providerTone, toneColors } from "@/lib/ui/tones";
import { toast } from "@/components/Toast";
import { useSavedListings, useToggleSavedListing } from "@/lib/queries/savedListings";
import { useCurrencyList } from "@/lib/queries/currencies";
import { listingDisplayName, listingPriceFrom } from "@/lib/marketplace/listingDisplay";
import type { SavedListingCard } from "@/lib/api/marketplace";

const TYPE_LABEL: Record<string, string> = {
  gym_owner: "Gym",
  personal_trainer: "Trainer",
  dietitian: "Dietitian",
};

function HeartIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 21-1.5-1.4C5 14.7 2 12 2 8.5 2 6 4 4 6.5 4c1.5 0 3 .7 3.9 2A5 5 0 0 1 17.5 4C20 4 22 6 22 8.5c0 3.5-3 6.2-8.5 11.1L12 21z" />
    </svg>
  );
}

/**
 * Saved providers: the listings the signed-in user saved from the
 * marketplace (GET /marketplace/saved), newest first. Listings that have
 * since been unpublished or suspended don't come back from the API.
 */
export function SavedProvidersClient() {
  const { data, isPending, isError, refetch } = useSavedListings();
  const { data: currencies } = useCurrencyList();
  const toggle = useToggleSavedListing();
  const saved = data ?? [];

  const unsave = (l: SavedListingCard) => {
    toggle.mutate(
      { listingId: l._id, save: false },
      {
        onSuccess: () => toast.success(`Removed ${listingDisplayName(l)} from saved.`),
        onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't remove it. Try again."),
      },
    );
  };

  return (
    <MemberDashboardShell activeLabel="Saved">
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Saved providers</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          {saved.length > 0
            ? `${saved.length} saved provider${saved.length === 1 ? "" : "s"}`
            : "Your bookmarked gyms, trainers, and dietitians"}
        </div>
      </div>

      {isPending ? (
        <div className="mt-6"><AsyncSpinner label="Loading saved providers" /></div>
      ) : isError ? (
        <div className="rounded-(--r-3) px-5 py-6 mt-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <p className="text-[14px]" style={{ color: "var(--ink)" }}>Couldn&apos;t load your saved providers.</p>
          <button type="button" onClick={() => void refetch()} className="btn-ghost-v2 sm mt-3">Try again</button>
        </div>
      ) : saved.length === 0 ? (
        <div className="rounded-(--r-3) flex flex-col items-center text-center px-6 py-14 mt-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <IconTile size="lg" className="mb-4">
            <HeartIcon />
          </IconTile>
          <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>Nothing saved yet</h2>
          <p className="text-[13.5px] mt-2 max-w-[420px]" style={{ color: "var(--fg-3)" }}>
            Tap the heart on a gym, trainer, or dietitian in the marketplace and they&apos;ll show up here so you can come back to them.
          </p>
          <Link href="/marketplace" className="btn-primary-v2 sm mt-5">Browse marketplace</Link>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-4" aria-label="Saved providers">
          {saved.map((l) => {
            const name = listingDisplayName(l);
            const price = listingPriceFrom(l, currencies);
            const type = TYPE_LABEL[l.account_type] ?? "Provider";
            const where = [l.city, l.country_code].filter(Boolean).join(", ");
            const href = `/marketplace/${l._id}`;
            return (
              <li key={l._id} className="rounded-(--r-3) p-4 flex flex-col gap-2" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  {/* Which kind of provider, in its role accent; "verified" is
                      plain information beside it, so the card keeps one tone. */}
                  <span className="font-mono text-[10px] px-1.75 py-0.5 rounded-(--r-1) uppercase tracking-[0.04em]" style={{ background: toneColors(providerTone(l.account_type)).fill, color: toneColors(providerTone(l.account_type)).ink }}>{type}</span>
                  {l.verification_badge && l.verification_badge !== "none" && (
                    <span className="font-mono text-[10px] px-1.75 py-0.5 rounded-(--r-1) uppercase tracking-[0.04em]" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>verified</span>
                  )}
                </div>
                <Link href={href} className="text-[16px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.014em", textDecoration: "none" }}>
                  {name}
                </Link>
                <div className="text-[13px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>
                  {[l.headline !== name ? l.headline : null, where].filter(Boolean).join(" · ")}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                  {l.review_count > 0 && <span>&#9733; {l.average_rating.toFixed(1)} · {l.review_count} review{l.review_count === 1 ? "" : "s"}</span>}
                  {price && <span className="font-mono" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{price}</span>}
                </div>
                <div className="flex gap-2 mt-auto pt-2">
                  <Link href={href} className="btn-primary-v2 sm">View profile</Link>
                  <button
                    type="button"
                    className="btn-ghost-v2 sm"
                    onClick={() => unsave(l)}
                    disabled={toggle.isPending && toggle.variables?.listingId === l._id}
                    aria-label={`Remove ${name} from saved`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </MemberDashboardShell>
  );
}
