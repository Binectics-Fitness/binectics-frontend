"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { AsyncSpinner, EmptySlate, IconTile, StatusPill } from "@/components/ds";
import { providerTone, toneColors } from "@/lib/ui/tones";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";
import { marketplaceService } from "@/lib/api/marketplace";
import { adminService } from "@/lib/api/admin";
import {
  MarketplaceVerificationBadge,
  type MarketplaceListing,
} from "@/lib/types";

type Filter = "All" | "Verified" | "Pending" | "Suspended";

function listingTypeLabel(type: string): "Gym" | "Trainer" | "Dietitian" {
  if (type === "personal_trainer") return "Trainer";
  if (type === "dietitian") return "Dietitian";
  return "Gym";
}

function listingProviderName(listing: MarketplaceListing): string {
  if (typeof listing.organization_id === "object" && listing.organization_id?.name) {
    return listing.organization_id.name;
  }
  if (typeof listing.professional_id === "object") {
    return `${listing.professional_id.first_name} ${listing.professional_id.last_name}`;
  }
  return listing.headline;
}

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

/**
 * A listing's moderation state: suspended is blocked (danger), awaiting
 * verification is waiting on an admin (warn), any badge is success.
 */
function StatusBadge({ listing }: { listing: MarketplaceListing }) {
  if (listing.is_suspended) return <StatusPill tone="danger" label="Suspended" />;
  switch (listing.verification_badge) {
    case MarketplaceVerificationBadge.NONE:
      return <StatusPill tone="warn" label="Pending" />;
    case MarketplaceVerificationBadge.FEATURED:
      return <StatusPill tone="success" label="Featured" />;
    case MarketplaceVerificationBadge.PREMIUM_VERIFIED:
      return <StatusPill tone="success" label="Premium" />;
    default:
      return <StatusPill tone="success" label="Verified" />;
  }
}

/** Which kind of provider the listing is: identity, in its role accent. */
function TypePill({ type }: { type: "Gym" | "Trainer" | "Dietitian" }) {
  const { fill, ink } = toneColors(providerTone(type));
  return (
    <span
      className="font-mono text-[9.5px] px-1.5 py-[2px] rounded-(--r-1) uppercase tracking-[0.04em]"
      style={{ background: fill, color: ink }}
    >
      {type}
    </span>
  );
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [query, setQuery] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<MarketplaceListing | null>(null);
  const [unsuspendTarget, setUnsuspendTarget] = useState<MarketplaceListing | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    const res = await adminService.listListings();
    if (res.success) {
      setListings(res.data ?? []);
    } else {
      setError(res.message || "Failed to load listings");
      setListings([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const res = await adminService.listListings();
      if (!isMounted) return;
      if (res.success) {
        setListings(res.data ?? []);
      } else {
        setError(res.message || "Failed to load listings");
      }
      setLoading(false);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    const all = listings.length;
    const verified = listings.filter(
      (l) => !l.is_suspended && l.verification_badge !== MarketplaceVerificationBadge.NONE,
    ).length;
    const pending = listings.filter(
      (l) => !l.is_suspended && l.verification_badge === MarketplaceVerificationBadge.NONE,
    ).length;
    const suspended = listings.filter((l) => l.is_suspended).length;
    return { all, verified, pending, suspended };
  }, [listings]);

  const filtered = useMemo(() => {
    const base = listings.filter((l) => {
      if (activeFilter === "Verified") {
        return !l.is_suspended && l.verification_badge !== MarketplaceVerificationBadge.NONE;
      }
      if (activeFilter === "Pending") {
        return !l.is_suspended && l.verification_badge === MarketplaceVerificationBadge.NONE;
      }
      if (activeFilter === "Suspended") return l.is_suspended;
      return true;
    });
    if (!query.trim()) return base;
    const q = query.toLowerCase();
    return base.filter(
      (l) =>
        l.headline.toLowerCase().includes(q) ||
        listingProviderName(l).toLowerCase().includes(q) ||
        l._id.toLowerCase().includes(q),
    );
  }, [listings, activeFilter, query]);

  const kpis = [
    {
      label: "Total listings",
      value: loading ? "-" : counts.all.toString(),
      delta: `${counts.verified} verified`,
    },
    {
      label: "Pending review",
      value: loading ? "-" : counts.pending.toString(),
      delta: "no badge yet",
      valueColor: counts.pending > 0 ? "var(--danger)" : "var(--ink)",
    },
    {
      label: "Suspended",
      value: loading ? "-" : counts.suspended.toString(),
      delta: "needs review",
      deltaColor: "var(--fg-3)",
    },
    {
      label: "Avg rating",
      value:
        loading || listings.length === 0
          ? "-"
          : (
              listings.reduce((acc, l) => acc + (l.average_rating ?? 0), 0) / listings.length
            ).toFixed(2),
      delta: `${listings.reduce((acc, l) => acc + (l.review_count ?? 0), 0)} reviews`,
    },
  ];

  const filters: { label: Filter; count: number }[] = [
    { label: "All", count: counts.all },
    { label: "Verified", count: counts.verified },
    { label: "Pending", count: counts.pending },
    { label: "Suspended", count: counts.suspended },
  ];

  return (
    <AdminDashboardShell
      activeItem="Listings"
      crumb="Listings"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadListings}
            disabled={loading}
            className="btn-ghost-v2"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      }
    >
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Listings
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Every gym, trainer and dietitian listing. Open one to see its owner
          and documents.
        </p>
      </div>

      {error && (
        <div
          className="rounded-(--r-3) p-4 text-[13px]"
          style={{
            background: "var(--danger-soft)",
            border: "1px solid oklch(0.92 0.05 25)",
            color: "var(--danger)",
          }}
        >
          <div className="font-medium">Couldn&apos;t load listings</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
          <button type="button" onClick={loadListings} className="btn-ghost-v2 sm mt-2">
            Try again
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-(--r-3) p-[14px_16px]"
            style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          >
            <div
              className="font-mono text-[10.5px] uppercase tracking-[0.04em]"
              style={{ color: "var(--fg-3)" }}
            >
              {kpi.label}
            </div>
            <div
              className="text-[22px] font-medium mt-1"
              style={{
                color: kpi.valueColor || "var(--ink)",
                letterSpacing: "-0.018em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {kpi.value}
            </div>
            <div
              className="font-mono text-[11px] mt-1"
              style={{ color: kpi.deltaColor || "var(--fg-3)" }}
            >
              {kpi.delta}
            </div>
          </div>
        ))}
      </div>

      <div
        className="rounded-(--r-3) p-[10px_14px] flex gap-3.5 items-center flex-wrap"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        <div
          className="flex-1 min-w-[280px] flex items-center gap-2 h-8 px-3 rounded-(--r-2)"
          style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.5">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            className="flex-1 border-0 bg-transparent text-[13px] outline-none"
            placeholder="Search headline, provider, or listing ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ color: "var(--ink)" }}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {filters.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setActiveFilter(f.label)}
              className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-[5px] rounded-full cursor-pointer"
              style={{
                background: activeFilter === f.label ? "var(--ink)" : "var(--bg)",
                color: activeFilter === f.label ? "var(--bg)" : "var(--fg-3)",
                border: activeFilter === f.label ? "1px solid var(--ink)" : "1px solid var(--border)",
              }}
            >
              {f.label}{" "}
              <span
                style={{
                  color: activeFilter === f.label ? "oklch(0.75 0.005 85)" : "var(--fg-4)",
                  marginLeft: 4,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-(--r-3) overflow-hidden"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Provider", "Type", "Country", "Rating", "Status", "Actions"].map((h) => (
                  <th
                    key={h}
                    className="font-mono text-[10.5px] uppercase tracking-[0.04em] py-2.5 px-4.5 text-left"
                    style={{
                      color: "var(--fg-3)",
                      borderBottom: "1px solid var(--border)",
                      background: "var(--bg-2)",
                      fontWeight: 500,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4.5 py-6"><AsyncSpinner label="Loading listings" /></td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4.5 py-6"><EmptySlate message="No listings match this view." mt="mt-0" /></td>
                </tr>
              )}
              {!loading &&
                filtered.map((l) => {
                  const provider = listingProviderName(l);
                  return (
                    <tr key={l._id} className="hover:bg-[var(--bg-2)]">
                      <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                        <div className="flex gap-2.5 items-center">
                          <IconTile
                            size="sm"
                            initials={initialsFor(provider)}
                            tone={providerTone(listingTypeLabel(l.account_type))}
                          />
                          <div>
                            <Link
                              href={`/admin/listings/${l._id}`}
                              className="font-medium hover:underline"
                              style={{ color: "var(--ink)" }}
                            >
                              {provider}
                            </Link>
                            <div
                              className="font-mono text-[10.5px]"
                              style={{ color: "var(--fg-3)" }}
                            >
                              {l._id.slice(-12)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                        <TypePill type={listingTypeLabel(l.account_type)} />
                      </td>
                      <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                        <span
                          className="font-mono text-[11.5px] uppercase tracking-[0.04em]"
                          style={{ color: "var(--fg-3)" }}
                        >
                          {l.country_code ?? "-"}
                        </span>
                      </td>
                      <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                        <span
                          className="font-mono"
                          style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
                        >
                          {l.average_rating?.toFixed(1) ?? "-"}
                          <span
                            className="ml-1.5 text-[11px]"
                            style={{ color: "var(--fg-3)" }}
                          >
                            ({l.review_count ?? 0})
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                        <StatusBadge listing={l} />
                      </td>
                      <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                        <div className="flex gap-1.5">
                          {l.is_suspended ? (
                            <button
                              type="button"
                              onClick={() => setUnsuspendTarget(l)}
                              className="font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-1 rounded-(--r-1) cursor-pointer"
                              style={{
                                background: "var(--signal-soft)",
                                color: "var(--signal-ink)",
                                border: "none",
                              }}
                            >
                              Unsuspend
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setSuspendReason("");
                                setSuspendTarget(l);
                              }}
                              className="font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-1 rounded-(--r-1) cursor-pointer"
                              style={{
                                background: "var(--danger-soft)",
                                color: "var(--danger)",
                                border: "none",
                              }}
                            >
                              Suspend
                            </button>
                          )}
                          {!l.is_suspended &&
                            l.verification_badge === MarketplaceVerificationBadge.NONE && (
                              <button
                                type="button"
                                onClick={async () => {
                                  setActionLoading(true);
                                  try {
                                    const res = await marketplaceService.awardGymBadge(l._id, {
                                      verification_badge:
                                        MarketplaceVerificationBadge.VERIFIED,
                                    });
                                    if (!res.success) {
                                      toast.error(res.message || "Failed to award badge");
                                      return;
                                    }
                                    toast.success("Verification badge awarded");
                                    await loadListings();
                                  } catch (err) {
                                    toast.error(
                                      err instanceof Error ? err.message : "Failed to award badge",
                                    );
                                  } finally {
                                    setActionLoading(false);
                                  }
                                }}
                                disabled={actionLoading}
                                className="font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-1 rounded-(--r-1) cursor-pointer"
                                style={{
                                  background: "var(--signal-soft)",
                                  color: "var(--signal-ink)",
                                  border: "none",
                                }}
                              >
                                Verify
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      <ActionModal
        key={`suspend-${suspendTarget?._id ?? "none"}`}
        open={suspendTarget !== null}
        onClose={() => setSuspendTarget(null)}
        title="Suspend listing"
        description={
          suspendTarget
            ? `Suspending ${listingProviderName(suspendTarget)} hides it from the marketplace.`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setSuspendTarget(null)}
              className="btn-ghost-v2"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!suspendTarget) return;
                setActionLoading(true);
                try {
                  const res = await marketplaceService.suspendGym(
                    suspendTarget._id,
                    suspendReason.trim() ? { reason: suspendReason.trim() } : undefined,
                  );
                  if (!res.success) {
                    toast.error(res.message || "Failed to suspend");
                    return;
                  }
                  toast.success("Listing suspended");
                  setSuspendTarget(null);
                  await loadListings();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed to suspend");
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={actionLoading}
              className="btn-primary-v2 disabled:opacity-40"
              style={{ background: "var(--danger)", color: "white" }}
            >
              {actionLoading ? "Suspending..." : "Confirm suspend"}
            </button>
          </>
        }
      >
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
            Reason (optional)
          </label>
          <textarea
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            rows={3}
            className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
            placeholder="Visible in the provider's record."
          />
        </div>
      </ActionModal>

      <ActionModal
        key={`unsuspend-${unsuspendTarget?._id ?? "none"}`}
        open={unsuspendTarget !== null}
        onClose={() => setUnsuspendTarget(null)}
        title="Unsuspend listing"
        description={
          unsuspendTarget
            ? `Restoring ${listingProviderName(unsuspendTarget)} makes it visible again.`
            : undefined
        }
        footer={
          <>
            <button
              type="button"
              onClick={() => setUnsuspendTarget(null)}
              className="btn-ghost-v2"
              disabled={actionLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={async () => {
                if (!unsuspendTarget) return;
                setActionLoading(true);
                try {
                  const res = await marketplaceService.unsuspendGym(unsuspendTarget._id);
                  if (!res.success) {
                    toast.error(res.message || "Failed to unsuspend");
                    return;
                  }
                  toast.success("Listing unsuspended");
                  setUnsuspendTarget(null);
                  await loadListings();
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Failed to unsuspend");
                } finally {
                  setActionLoading(false);
                }
              }}
              disabled={actionLoading}
              className="btn-primary-v2 disabled:opacity-40"
            >
              {actionLoading ? "Restoring..." : "Confirm unsuspend"}
            </button>
          </>
        }
      >
        <div className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>
          The provider will be able to receive new clients immediately.
        </div>
      </ActionModal>
    </AdminDashboardShell>
  );
}
