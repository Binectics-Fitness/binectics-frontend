"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";
import { adminService, type PlatformMetricsOverview, type AdminUserSuspensionResult } from "@/lib/api/admin";

interface SuspendActionState {
  userId: string;
  reason: string;
}

export default function AdminUsersPage() {
  const [metrics, setMetrics] = useState<PlatformMetricsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lookupUserId, setLookupUserId] = useState("");
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [unsuspendOpen, setUnsuspendOpen] = useState(false);
  const [suspendState, setSuspendState] = useState<SuspendActionState>({ userId: "", reason: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [lastResult, setLastResult] = useState<AdminUserSuspensionResult | null>(null);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      try {
        const res = await adminService.getPlatformMetrics();
        if (!isMounted) return;
        setMetrics(res.data ?? null);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load metrics");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const reloadMetrics = async () => {
    setLoading(true);
    try {
      const res = await adminService.getPlatformMetrics();
      setMetrics(res.data ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!suspendState.userId.trim()) return;
    setActionLoading(true);
    try {
      const res = await adminService.suspendUser(
        suspendState.userId.trim(),
        suspendState.reason.trim() || undefined,
      );
      toast.success(`Suspended ${res.data?.user.email ?? suspendState.userId}`);
      setLastResult(res.data ?? null);
      setSuspendOpen(false);
      setSuspendState({ userId: "", reason: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to suspend user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!lookupUserId.trim()) return;
    setActionLoading(true);
    try {
      await adminService.unsuspendUser(lookupUserId.trim());
      toast.success(`Reinstated ${lookupUserId}`);
      setUnsuspendOpen(false);
      setLookupUserId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to unsuspend user");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminDashboardShell
      activeItem="Users"
      crumb="Users"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setSuspendState({ userId: lookupUserId, reason: "" });
              setSuspendOpen(true);
            }}
            className="btn-ghost-v2"
          >
            Suspend user
          </button>
          <button
            type="button"
            onClick={() => setUnsuspendOpen(true)}
            className="btn-primary-v2"
            disabled={!lookupUserId.trim()}
          >
            Unsuspend user
          </button>
        </div>
      }
    >
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Users
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Lookup, suspend, and reinstate user accounts. Metrics from /admin/metrics/overview.
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
          <div className="font-medium">Couldn&apos;t load metrics</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
          <button type="button" onClick={reloadMetrics} className="btn-ghost-v2 sm mt-2">
            Try again
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total users",
            value: loading ? "—" : (metrics?.conversion.totalUsers.toLocaleString() ?? "0"),
            delta: "all platform members",
          },
          {
            label: "Paying users",
            value: loading ? "—" : (metrics?.conversion.payingUsers.toLocaleString() ?? "0"),
            delta:
              metrics?.conversion.conversionRate != null
                ? `${(metrics.conversion.conversionRate * 100).toFixed(1)}% conversion`
                : "—",
          },
          {
            label: "Verified providers",
            value: loading ? "—" : (metrics?.verifiedProviders.total.toLocaleString() ?? "0"),
            delta: `${metrics?.verifiedProviders.distinctCountries ?? 0} countries`,
          },
          {
            label: "Active subscriptions",
            value: loading ? "—" : (metrics?.subscriptions.activeCount.toLocaleString() ?? "0"),
            delta:
              metrics?.subscriptions.totalRevenueUsd != null
                ? `$${metrics.subscriptions.totalRevenueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} total`
                : "—",
          },
        ].map((kpi) => (
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
                color: "var(--ink)",
                letterSpacing: "-0.018em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {kpi.value}
            </div>
            <div className="font-mono text-[11px] mt-1" style={{ color: "var(--fg-3)" }}>
              {kpi.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Lookup */}
      <div
        className="rounded-(--r-3) p-5"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      >
        <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
          User lookup
        </div>
        <div className="text-[14px] mt-1 mb-3.5" style={{ color: "var(--ink)" }}>
          Enter a user ID to suspend or reinstate. Open the user&apos;s profile to view their full record.
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={lookupUserId}
            onChange={(e) => setLookupUserId(e.target.value)}
            placeholder="USR_xxxxxxx"
            className="h-10 px-3 rounded-(--r-2) text-[13.5px] flex-1 min-w-[260px]"
            style={{
              border: "1px solid var(--border)",
              background: "var(--bg-2)",
              color: "var(--ink)",
              fontVariantNumeric: "tabular-nums",
            }}
          />
          <Link
            href={lookupUserId.trim() ? `/admin/users/${lookupUserId.trim()}` : "#"}
            className="btn-ghost-v2 sm"
            aria-disabled={!lookupUserId.trim()}
            style={{ opacity: lookupUserId.trim() ? 1 : 0.4, pointerEvents: lookupUserId.trim() ? "auto" : "none" }}
          >
            Open profile
          </Link>
          <button
            type="button"
            onClick={() => {
              setSuspendState({ userId: lookupUserId, reason: "" });
              setSuspendOpen(true);
            }}
            disabled={!lookupUserId.trim()}
            className="btn-ghost-v2 sm"
            style={{ color: "var(--danger)", opacity: lookupUserId.trim() ? 1 : 0.4 }}
          >
            Suspend
          </button>
          <button
            type="button"
            onClick={() => setUnsuspendOpen(true)}
            disabled={!lookupUserId.trim()}
            className="btn-ghost-v2 sm"
            style={{ opacity: lookupUserId.trim() ? 1 : 0.4 }}
          >
            Unsuspend
          </button>
        </div>
      </div>

      {/* Last action */}
      {lastResult && (
        <div
          className="rounded-(--r-3) p-5"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
            Last suspension
          </div>
          <div className="text-[14px] mt-1" style={{ color: "var(--ink)" }}>
            <span className="font-medium">
              {lastResult.user.first_name} {lastResult.user.last_name}
            </span>
            <span className="font-mono text-[12px] ml-2" style={{ color: "var(--fg-3)" }}>
              {lastResult.user.email}
            </span>
          </div>
          {lastResult.user.suspension_reason && (
            <div className="text-[13px] mt-2" style={{ color: "var(--fg-2)" }}>
              Reason: {lastResult.user.suspension_reason}
            </div>
          )}
          <div className="mt-3 grid grid-cols-3 gap-3">
            {[
              { label: "Listings suspended", value: lastResult.cascaded.listingsSuspended },
              { label: "Subscriptions cancelled", value: lastResult.cascaded.subscriptionsCancelled },
              { label: "Bookings cancelled", value: lastResult.cascaded.bookingsCancelled },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-(--r-2) p-3"
                style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
              >
                <div
                  className="font-mono text-[10px] uppercase tracking-[0.04em]"
                  style={{ color: "var(--fg-3)" }}
                >
                  {c.label}
                </div>
                <div
                  className="text-[18px] font-medium mt-0.5"
                  style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
                >
                  {c.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Country breakdown */}
      {metrics?.verifiedProviders.byCountry && metrics.verifiedProviders.byCountry.length > 0 && (
        <div
          className="rounded-(--r-3) overflow-hidden"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
              Verified providers by country
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Country", "Verified providers"].map((h, i) => (
                    <th
                      key={h}
                      className={`font-mono text-[10.5px] uppercase tracking-[0.04em] py-2.5 px-4.5 ${i === 1 ? "text-right" : "text-left"}`}
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
                {metrics.verifiedProviders.byCountry.map((row) => (
                  <tr key={row.country_code}>
                    <td className="py-2.5 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                      <span
                        className="font-mono text-[11.5px] uppercase tracking-[0.04em]"
                        style={{ color: "var(--ink)" }}
                      >
                        {row.country_code}
                      </span>
                    </td>
                    <td
                      className="py-2.5 px-4.5 text-right font-mono"
                      style={{
                        borderBottom: "1px solid var(--border)",
                        color: "var(--ink)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Revenue by currency */}
      {metrics?.subscriptions.byCurrency && metrics.subscriptions.byCurrency.length > 0 && (
        <div
          className="rounded-(--r-3) overflow-hidden"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
              Subscription revenue by currency
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Currency", "Count", "Total", "Average"].map((h, i) => (
                    <th
                      key={h}
                      className={`font-mono text-[10.5px] uppercase tracking-[0.04em] py-2.5 px-4.5 ${i === 0 ? "text-left" : "text-right"}`}
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
                {metrics.subscriptions.byCurrency.map((row) => (
                  <tr key={row.currency}>
                    <td className="py-2.5 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                      <span
                        className="font-mono text-[11.5px] uppercase tracking-[0.04em]"
                        style={{ color: "var(--ink)" }}
                      >
                        {row.currency}
                      </span>
                    </td>
                    {[row.count, row.total, row.average].map((v, i) => (
                      <td
                        key={i}
                        className="py-2.5 px-4.5 text-right font-mono"
                        style={{
                          borderBottom: "1px solid var(--border)",
                          color: "var(--ink)",
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {typeof v === "number" ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ActionModal
        key={`suspend-${suspendOpen}`}
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        title="Suspend user"
        description="Suspending cascades to listings, subscriptions, and bookings."
        footer={
          <>
            <button type="button" onClick={() => setSuspendOpen(false)} className="btn-ghost-v2" disabled={actionLoading}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSuspend}
              disabled={actionLoading || !suspendState.userId.trim()}
              className="btn-primary-v2 disabled:opacity-40"
              style={{ background: "var(--danger)", color: "white" }}
            >
              {actionLoading ? "Suspending..." : "Confirm suspension"}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
              User ID
            </label>
            <input
              type="text"
              value={suspendState.userId}
              onChange={(e) => setSuspendState((s) => ({ ...s, userId: e.target.value }))}
              className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
              placeholder="USR_xxxxxxx"
              style={{ fontVariantNumeric: "tabular-nums" }}
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
              Reason (optional)
            </label>
            <textarea
              value={suspendState.reason}
              onChange={(e) => setSuspendState((s) => ({ ...s, reason: e.target.value }))}
              rows={3}
              className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
              placeholder="Logged for the user record."
            />
          </div>
        </div>
      </ActionModal>

      <ActionModal
        key={`unsuspend-${unsuspendOpen}`}
        open={unsuspendOpen}
        onClose={() => setUnsuspendOpen(false)}
        title="Reinstate user"
        description={`This will lift the suspension on ${lookupUserId || "the selected user"}.`}
        footer={
          <>
            <button type="button" onClick={() => setUnsuspendOpen(false)} className="btn-ghost-v2" disabled={actionLoading}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUnsuspend}
              disabled={actionLoading || !lookupUserId.trim()}
              className="btn-primary-v2 disabled:opacity-40"
            >
              {actionLoading ? "Reinstating..." : "Confirm reinstate"}
            </button>
          </>
        }
      >
        <div className="text-[13.5px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
          Reinstating restores the user&apos;s account but does not automatically restore their listings or subscriptions.
        </div>
      </ActionModal>
    </AdminDashboardShell>
  );
}
