"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { AsyncSpinner, EmptySlate, FilterPill, StatusPill, DSCard, Eyebrow } from "@/components/ds";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";
import { adminService, type AdminListingDetail } from "@/lib/api/admin";
import { marketplaceService } from "@/lib/api/marketplace";
import { formatMinor } from "@/lib/currencies/helpers";
import { MarketplaceVerificationBadge } from "@/lib/types";

type ModalKind = "suspend" | "unsuspend" | "award" | "revoke" | null;

const TYPE_LABEL: Record<string, string> = {
  gym_owner: "Gym",
  personal_trainer: "Trainer",
  dietitian: "Dietitian",
};

const BADGE_LABEL: Record<MarketplaceVerificationBadge, string> = {
  [MarketplaceVerificationBadge.NONE]: "No badge",
  [MarketplaceVerificationBadge.VERIFIED]: "Verified",
  [MarketplaceVerificationBadge.PREMIUM_VERIFIED]: "Premium verified",
  [MarketplaceVerificationBadge.FEATURED]: "Featured",
};

const AWARDABLE: MarketplaceVerificationBadge[] = [
  MarketplaceVerificationBadge.VERIFIED,
  MarketplaceVerificationBadge.PREMIUM_VERIFIED,
  MarketplaceVerificationBadge.FEATURED,
];

function personName(
  p: { first_name?: string; last_name?: string; email?: string } | string | null | undefined,
): string | null {
  if (!p || typeof p === "string") return null;
  const name = [p.first_name, p.last_name].filter(Boolean).join(" ");
  return name || p.email || null;
}

/** Organization name for a gym, the owner's name otherwise, the headline last. */
export function listingTitle(l: AdminListingDetail): string {
  if (l.organization_id && typeof l.organization_id === "object" && l.organization_id.name) {
    return l.organization_id.name;
  }
  return personName(l.professional_id) ?? l.headline;
}

function formatDate(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ListingDetailClient({ listingId }: { listingId: string }) {
  const [listing, setListing] = useState<AdminListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [reason, setReason] = useState("");
  const [badge, setBadge] = useState<MarketplaceVerificationBadge>(
    MarketplaceVerificationBadge.VERIFIED,
  );
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await adminService.getListing(listingId);
    if (res.success && res.data) {
      setListing(res.data);
      setError(null);
    } else {
      setError(res.message || "We couldn't load this listing.");
    }
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    const kick = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(kick);
  }, [load]);

  const runAction = async (
    action: () => Promise<{ success: boolean; message?: string }>,
    done: string,
  ) => {
    setBusy(true);
    try {
      const res = await action();
      if (!res.success) {
        toast.error(res.message || "That didn't work. Try again.");
        return;
      }
      toast.success(done);
      setModal(null);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const title = listing ? listingTitle(listing) : "Listing";
  const typeLabel = listing ? (TYPE_LABEL[listing.account_type] ?? listing.account_type) : "";
  const hasBadge =
    !!listing && listing.verification_badge !== MarketplaceVerificationBadge.NONE;

  const actions = listing ? (
    <div className="flex flex-wrap items-center gap-2">
      {hasBadge ? (
        <button type="button" className="btn-ghost-v2" onClick={() => setModal("revoke")}>
          Revoke badge
        </button>
      ) : null}
      <button
        type="button"
        className="btn-ghost-v2"
        onClick={() => {
          setBadge(
            hasBadge ? listing.verification_badge : MarketplaceVerificationBadge.VERIFIED,
          );
          setModal("award");
        }}
      >
        {hasBadge ? "Change badge" : "Award badge"}
      </button>
      {listing.is_suspended ? (
        <button type="button" className="btn-primary-v2" onClick={() => setModal("unsuspend")}>
          Unsuspend
        </button>
      ) : (
        <button
          type="button"
          className="btn-primary-v2"
          style={{ background: "var(--danger)", borderColor: "var(--danger)", color: "white" }}
          onClick={() => {
            setReason("");
            setModal("suspend");
          }}
        >
          Suspend
        </button>
      )}
    </div>
  ) : undefined;

  return (
    <AdminDashboardShell
      activeItem="Listings"
      crumb={listing ? `Listings · ${title}` : "Listings"}
      actions={actions}
    >
      <div>
        <Link href="/admin/listings" className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
          ← All listings
        </Link>
      </div>

      {loading ? (
        <AsyncSpinner label="Loading listing" />
      ) : error || !listing ? (
        <div
          className="rounded-(--r-3) p-4 text-[13px]"
          style={{
            background: "var(--danger-soft)",
            border: "1px solid oklch(0.92 0.05 25)",
            color: "var(--danger)",
          }}
        >
          <div className="font-medium">Couldn&apos;t load this listing</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>
            {error}
          </div>
        </div>
      ) : (
        <>
          <div>
            <h1
              className="text-[28px] font-medium"
              style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}
            >
              {title} · {typeLabel}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <StatusPill
                tone={listing.is_published ? "success" : "neutral"}
                label={listing.is_published ? "Published" : "Unpublished"}
              />
              {listing.is_suspended ? <StatusPill tone="danger" label="Suspended" /> : null}
              <StatusPill
                tone={hasBadge ? "success" : "warn"}
                label={BADGE_LABEL[listing.verification_badge] ?? listing.verification_badge}
              />
              <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                Created {formatDate(listing.created_at)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3.5">
            <Card title="Profile">
              <div className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>
                {listing.headline}
              </div>
              {listing.bio ? (
                <p
                  className="text-[13.5px] leading-relaxed mt-2 whitespace-pre-line"
                  style={{ color: "var(--fg-2)" }}
                >
                  {listing.bio}
                </p>
              ) : null}
              <Rows
                rows={[
                  {
                    label: "Location",
                    value:
                      [listing.address, listing.city, listing.country_code]
                        .filter(Boolean)
                        .join(" · ") || "-",
                  },
                  {
                    label: "From",
                    value:
                      typeof listing.price_from_minor === "number" && listing.currency
                        ? formatMinor(listing.currency, listing.price_from_minor) +
                          (listing.price_label ? ` · ${listing.price_label}` : "")
                        : "-",
                  },
                  { label: "Specialties", value: listing.specialties?.join(" · ") || "-" },
                  { label: "Languages", value: listing.languages?.join(" · ") || "-" },
                  {
                    label: "Accepting clients",
                    value: listing.accepting_clients ? "Yes" : "No",
                  },
                  {
                    label: "Rating",
                    value: `${(listing.average_rating ?? 0).toFixed(1)} (${listing.review_count ?? 0} reviews)`,
                  },
                ]}
              />
            </Card>

            <div className="flex flex-col gap-3.5">
              <Card title="Owner">
                <Rows
                  rows={[
                    { label: "Name", value: personName(listing.professional_id) ?? "-" },
                    {
                      label: "Email",
                      value:
                        listing.professional_id && typeof listing.professional_id === "object"
                          ? (listing.professional_id.email ?? "-")
                          : "-",
                    },
                    {
                      label: "Organization",
                      value:
                        listing.organization_id && typeof listing.organization_id === "object"
                          ? (listing.organization_id.name ?? "-")
                          : "-",
                    },
                    {
                      label: "Account",
                      value:
                        listing.professional_id &&
                        typeof listing.professional_id === "object" &&
                        listing.professional_id.is_suspended
                          ? "Suspended"
                          : "Active",
                    },
                  ]}
                />
              </Card>

              <Card title="Moderation">
                <Rows
                  rows={[
                    {
                      label: "Published",
                      value: listing.is_published
                        ? `Yes · ${formatDate(listing.published_at)}`
                        : "No",
                    },
                    {
                      label: "Suspended",
                      value: listing.is_suspended
                        ? listing.suspension_reason
                          ? `Yes · ${listing.suspension_reason}`
                          : "Yes"
                        : "No",
                    },
                    {
                      label: "Badge",
                      value: hasBadge
                        ? `${BADGE_LABEL[listing.verification_badge]} · ${formatDate(listing.badge_awarded_at)}${
                            personName(listing.badge_awarded_by)
                              ? ` · by ${personName(listing.badge_awarded_by)}`
                              : ""
                          }`
                        : "None",
                    },
                  ]}
                />
              </Card>

              <Card title={`Documents (${listing.documents.length})`}>
                {listing.documents.length === 0 ? (
                  <EmptySlate
                    message="No supporting documents"
                    hint="The provider hasn't uploaded any."
                    mt="mt-0"
                  />
                ) : (
                  <ul className="flex flex-col gap-2">
                    {listing.documents.map((d) => (
                      <li
                        key={d._id}
                        className="flex justify-between items-center gap-3 p-[10px_12px] rounded-(--r-2)"
                        style={{ background: "var(--bg-2)" }}
                      >
                        <div className="min-w-0">
                          <div
                            className="text-[13px] font-medium truncate"
                            style={{ color: "var(--ink)" }}
                          >
                            {d.file_name}
                          </div>
                          <Eyebrow>
                            {formatBytes(d.file_size)} · {formatDate(d.created_at)}
                          </Eyebrow>
                        </div>
                        <a
                          href={d.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost-v2 sm shrink-0"
                        >
                          View
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          </div>
        </>
      )}

      {listing ? (
        <>
          <ActionModal
            open={modal === "suspend"}
            onClose={() => setModal(null)}
            title="Suspend listing"
            description={`Suspending ${title} hides it from the marketplace and tells the owner.`}
            footer={
              <>
                <button type="button" className="btn-ghost-v2" onClick={() => setModal(null)} disabled={busy}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary-v2 disabled:opacity-40"
                  style={{ background: "var(--danger)", color: "white" }}
                  disabled={busy}
                  onClick={() =>
                    runAction(
                      () =>
                        marketplaceService.suspendGym(
                          listing._id,
                          reason.trim() ? { reason: reason.trim() } : undefined,
                        ),
                      "Listing suspended",
                    )
                  }
                >
                  {busy ? "Suspending..." : "Confirm suspend"}
                </button>
              </>
            }
          >
            <label
              htmlFor="suspend-reason"
              className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3"
            >
              Reason (optional)
            </label>
            <textarea
              id="suspend-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
              placeholder="Sent to the owner in their notification."
            />
          </ActionModal>

          <ActionModal
            open={modal === "unsuspend"}
            onClose={() => setModal(null)}
            title="Unsuspend listing"
            description={`Restoring ${title} makes it visible in the marketplace again.`}
            footer={
              <>
                <button type="button" className="btn-ghost-v2" onClick={() => setModal(null)} disabled={busy}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary-v2 disabled:opacity-40"
                  disabled={busy}
                  onClick={() =>
                    runAction(
                      () => marketplaceService.unsuspendGym(listing._id),
                      "Listing unsuspended",
                    )
                  }
                >
                  {busy ? "Restoring..." : "Confirm unsuspend"}
                </button>
              </>
            }
          >
            <div className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>
              The owner can take new clients as soon as it is restored.
            </div>
          </ActionModal>

          <ActionModal
            open={modal === "award"}
            onClose={() => setModal(null)}
            title={hasBadge ? "Change badge" : "Award badge"}
            description={`Pick the badge ${title} should show. The owner is notified.`}
            footer={
              <>
                <button type="button" className="btn-ghost-v2" onClick={() => setModal(null)} disabled={busy}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary-v2 disabled:opacity-40"
                  disabled={busy}
                  onClick={() =>
                    runAction(
                      () =>
                        marketplaceService.awardGymBadge(listing._id, {
                          verification_badge: badge,
                        }),
                      "Badge awarded",
                    )
                  }
                >
                  {busy ? "Saving..." : `Award ${BADGE_LABEL[badge].toLowerCase()}`}
                </button>
              </>
            }
          >
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Badge">
              {AWARDABLE.map((b) => (
                <FilterPill
                  key={b}
                  label={BADGE_LABEL[b]}
                  active={badge === b}
                  onClick={() => setBadge(b)}
                />
              ))}
            </div>
          </ActionModal>

          <ActionModal
            open={modal === "revoke"}
            onClose={() => setModal(null)}
            title="Revoke badge"
            description={`${title} loses its ${BADGE_LABEL[listing.verification_badge]?.toLowerCase()} badge. The owner is notified.`}
            footer={
              <>
                <button type="button" className="btn-ghost-v2" onClick={() => setModal(null)} disabled={busy}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary-v2 disabled:opacity-40"
                  style={{ background: "var(--danger)", color: "white" }}
                  disabled={busy}
                  onClick={() =>
                    runAction(() => marketplaceService.revokeGymBadge(listing._id), "Badge revoked")
                  }
                >
                  {busy ? "Revoking..." : "Confirm revoke"}
                </button>
              </>
            }
          >
            <div className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>
              You can award a badge again at any time.
            </div>
          </ActionModal>
        </>
      ) : null}
    </AdminDashboardShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <DSCard className="p-[22px]">
      <h3 className="text-[14px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>
        {title}
      </h3>
      {children}
    </DSCard>
  );
}

function Rows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="mt-3 text-[13px]">
      {rows.map((r) => (
        <div
          key={r.label}
          className="grid grid-cols-[minmax(0,140px)_1fr] gap-3 py-2.5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <dt style={{ color: "var(--fg-3)" }}>{r.label}</dt>
          <dd className="min-w-0 break-words" style={{ color: "var(--ink)" }}>
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
