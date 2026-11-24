"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ProviderListingProfile } from "@/components/provider/ProviderListingProfile";
import { DSCard } from "@/components/ds";
import { ProviderReviews } from "@/components/reviews/ProviderReviews";
import { ReviewTargetType } from "@/lib/api/reviews";
import { CredentialsTab } from "./CredentialsTab";

const TABS = ["Listing", "Credentials", "Reviews"] as const;
type Tab = (typeof TABS)[number];

/** `?tab=Reviews` (a review notification) opens that tab; anything else opens Listing. */
export function initialProfileTab(param: string | null): Tab {
  return TABS.find((t) => t.toLowerCase() === param?.toLowerCase()) ?? "Listing";
}

/**
 * Two-tab wrapper for the dietitian profile page: the existing marketplace
 * listing editor, plus reviews of that listing with inline provider responses.
 */
export function ProfileTabs() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => initialProfileTab(searchParams.get("tab")));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-3 py-[6px] rounded-full cursor-pointer"
            style={{
              background: tab === t ? "var(--ink)" : "var(--bg)",
              color: tab === t ? "var(--bg)" : "var(--fg-3)",
              border: tab === t ? "1px solid var(--ink)" : "1px solid var(--border)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Keep the listing editor mounted so tab switches don't drop unsaved edits. */}
      <div style={{ display: tab === "Listing" ? undefined : "none" }}>
        <ProviderListingProfile />
      </div>
      {/* Mounted once opened, kept while switching, like the listing editor. */}
      <CredentialsPane open={tab === "Credentials"} />
      {tab === "Reviews" && <ReviewsTab />}
    </div>
  );
}

/** Mounts the credentials editor on first open and keeps unsaved edits across tabs. */
function CredentialsPane({ open }: { open: boolean }) {
  const [opened, setOpened] = useState(open);
  if (open && !opened) setOpened(true);
  if (!opened) return null;
  return (
    <div style={{ display: open ? undefined : "none" }}>
      <CredentialsTab />
    </div>
  );
}

/* ─── Reviews ────────────────────────────────────────────── */

export function ReviewsTab() {
  return (
    <ProviderReviews
      targetType={ReviewTargetType.DIETITIAN}
      sessionNoun="consultation"
      noListing={
        <DSCard className="px-6 py-10 text-center">
          <p className="text-[14px]" style={{ color: "var(--fg-3)" }}>
            Publish your profile on the Listing tab to get reviews.
          </p>
        </DSCard>
      }
    />
  );
}
