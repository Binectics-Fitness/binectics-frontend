"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { checkinsService } from "@/lib/api/checkins";
import { useOrganization } from "@/contexts/OrganizationContext";
import { CheckInHistoryPeriod, type OrgCheckInDashboardStats, type CheckIn } from "@/lib/types";

const TIME_FILTERS = [
  { label: "Today", value: CheckInHistoryPeriod.TODAY },
  { label: "Week", value: CheckInHistoryPeriod.WEEK },
  { label: "Month", value: CheckInHistoryPeriod.MONTH },
] as const;

// A successful poll older than this (slightly above the 30s interval) means a
// refresh was missed, so we surface a degraded "stale" state.
const STALE_AFTER_SECONDS = 75;

type Freshness = "live" | "stale" | "offline";

const STATUS_PILL: Record<Freshness, { color: string; bg: string; border: string; pulse: boolean }> = {
  live: { color: "var(--signal-ink)", bg: "var(--signal-soft)", border: "oklch(0.88 0.05 148)", pulse: true },
  stale: { color: "oklch(0.45 0.16 75)", bg: "oklch(0.96 0.06 75)", border: "oklch(0.85 0.08 75)", pulse: true },
  offline: { color: "var(--danger)", bg: "var(--danger-soft)", border: "oklch(0.92 0.05 25)", pulse: false },
};

function personName(checkIn: CheckIn): string {
  if (typeof checkIn.member_user_id === "string") return checkIn.member_user_id.slice(-8);
  return `${checkIn.member_user_id.first_name} ${checkIn.member_user_id.last_name}`;
}

function listingLabel(checkIn: CheckIn): string {
  if (typeof checkIn.listing_id === "string") return checkIn.listing_id.slice(-8);
  return checkIn.listing_id.headline;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function hourLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function dayLabel(iso: string): string {
  return new Date(iso).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export default function GymCheckinsPage() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const [activeFilter, setActiveFilter] = useState<CheckInHistoryPeriod>(CheckInHistoryPeriod.TODAY);
  const [stats, setStats] = useState<OrgCheckInDashboardStats | null>(null);
  const [history, setHistory] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState<boolean>(() => true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  // Ticks forward on an interval so freshness labels recompute without a poll.
  const [now, setNow] = useState<number>(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Track browser connectivity so we can pause polling and surface a degraded state.
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Re-evaluate the freshness label even when no successful poll has landed.
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(t);
  }, []);

  const load = useCallback(
    async () => {
      if (!currentOrg) return;
      try {
        const [statsRes, historyRes] = await Promise.all([
          checkinsService.getOrgDashboardStats(currentOrg._id),
          checkinsService.getOrgCheckIns(currentOrg._id, activeFilter),
        ]);

        if (!mountedRef.current) return;
        const ok = statsRes.success && historyRes.success;
        // Keep the last-known-good data on a failed refresh; only replace on
        // success so a single dropped poll doesn't blank the live feed.
        if (statsRes.success && statsRes.data) setStats(statsRes.data);
        if (historyRes.success && historyRes.data) setHistory(historyRes.data);
        setError(
          ok ? null : statsRes.message || historyRes.message || "Failed to load check-ins",
        );
        if (ok) setLastUpdatedAt(Date.now());
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : "Failed to load check-ins");
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [currentOrg, activeFilter],
  );

  // Manual refresh: surface immediate spinner feedback, then reuse the poll.
  const refresh = useCallback(() => {
    setIsRefreshing(true);
    void load();
  }, [load]);

  // Poll every 30s while online; pause entirely when the browser goes offline
  // and resume with an immediate refetch when connectivity returns.
  useEffect(() => {
    if (orgLoading || !currentOrg) return;
    if (!isOnline) return; // paused while offline; resumes on reconnect
    const kick = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => {
      void load();
    }, 30_000);
    return () => {
      window.clearTimeout(kick);
      window.clearInterval(timer);
    };
  }, [load, orgLoading, currentOrg, isOnline]);

  const freshness = useMemo<{ kind: Freshness; label: string }>(() => {
    if (!isOnline) return { kind: "offline", label: "Offline" };
    if (lastUpdatedAt == null) return { kind: "stale", label: "Connecting…" };
    const secs = Math.floor((now - lastUpdatedAt) / 1000);
    if (secs > STALE_AFTER_SECONDS) {
      const mins = Math.floor(secs / 60);
      return { kind: "stale", label: mins >= 1 ? `Stale · ${mins}m old` : `Stale · ${secs}s old` };
    }
    return { kind: "live", label: "Live" };
  }, [isOnline, lastUpdatedAt, now]);

  const lastUpdatedLabel = lastUpdatedAt
    ? new Date(lastUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;
  const pill = STATUS_PILL[freshness.kind];

  const hourlyBars = useMemo(() => {
    const buckets = new Map<number, number>();
    for (const item of history) {
      const hour = new Date(item.checked_in_at).getHours();
      buckets.set(hour, (buckets.get(hour) ?? 0) + 1);
    }
    const maxCount = Math.max(...Array.from(buckets.values()), 1);
    return Array.from({ length: 24 }, (_, hour) => ({ hour, count: buckets.get(hour) ?? 0, pct: ((buckets.get(hour) ?? 0) / maxCount) * 100 }));
  }, [history]);

  const topRow = [
    { label: "Check-ins today", value: stats?.today_check_ins ?? 0, delta: `${stats?.week_check_ins ?? 0} this week` },
    { label: "Active members", value: stats?.active_members ?? 0, delta: `${stats?.month_check_ins ?? 0} this month` },
    { label: "Avg rating", value: (stats?.average_rating ?? 0).toFixed(1), delta: `${stats?.review_count ?? 0} reviews` },
    { label: "Revenue today", value: `R ${(stats?.revenue_today ?? 0).toLocaleString()}`, delta: lastUpdatedLabel ? `Updated ${lastUpdatedLabel}` : "Waiting for refresh" },
  ];

  const stream = stats?.recent_check_ins ?? history;
  const headline = currentOrg ? `${currentOrg.name} check-ins` : "Check-ins";

  return (
    <GymDashboardShell
      activeItem="Check‑ins"
      crumb="Check-ins"
      organizationName={currentOrg?.name}
      organizationInitials={currentOrg ? initials(currentOrg.name) : "IL"}
      actions={
        <div className="flex gap-2.5 items-center">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.04em] px-2.5 py-1 rounded-full" style={{ color: pill.color, background: pill.bg, border: `1px solid ${pill.border}` }}>
            <span className={`w-1.5 h-1.5 rounded-full ${pill.pulse ? "animate-pulse" : ""}`} style={{ background: pill.color }} />
            {freshness.label} · {currentOrg ? currentOrg.name : "no org selected"}
          </span>
          <button
            onClick={refresh}
            disabled={isRefreshing || !isOnline || !currentOrg}
            title={isOnline ? "Refresh now" : "Offline — reconnect to refresh"}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-(--r-2) font-mono text-[11px] uppercase tracking-[0.04em] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}
          >
            <span className={isRefreshing ? "inline-block animate-spin" : "inline-block"}>↻</span>
            {isRefreshing ? "Refreshing" : "Refresh"}
          </button>
          <div className="inline-flex rounded-(--r-2)" style={{ border: "1px solid var(--border)" }}>
            {TIME_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className="px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.04em] cursor-pointer"
                style={{
                  background: activeFilter === f.value ? "var(--ink)" : "var(--bg)",
                  color: activeFilter === f.value ? "var(--bg)" : "var(--fg-2)",
                  border: "none",
                  borderRight: f.value === TIME_FILTERS[TIME_FILTERS.length - 1].value ? "none" : "1px solid var(--border)",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div>
        <h1 className="text-[30px] font-medium tracking-[-0.022em]" style={{ color: "var(--ink)" }}>{headline}</h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          {stats ? `${stats.today_check_ins} today · ${stats.week_check_ins} this week · ${stats.month_check_ins} this month` : "Live feed and occupancy metrics refresh every 30 seconds."}
        </p>
      </div>

      {!currentOrg && !orgLoading ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg-2)" }}>
          Select an organization to view its check-ins.
        </div>
      ) : !isOnline ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
          <div className="font-medium">You&apos;re offline</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>
            Auto-refresh is paused. Showing the last data loaded{lastUpdatedLabel ? ` at ${lastUpdatedLabel}` : ""}. It will refresh automatically when your connection returns.
          </div>
        </div>
      ) : error ? (
        <div className="rounded-(--r-3) p-4 text-[13px] flex items-start justify-between gap-3" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
          <div>
            <div className="font-medium">Couldn&apos;t refresh check-ins</div>
            <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
          </div>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="shrink-0 px-3 py-1.5 rounded-(--r-2) font-mono text-[11px] uppercase tracking-[0.04em] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ border: "1px solid var(--danger)", background: "var(--bg)", color: "var(--danger)" }}
          >
            {isRefreshing ? "Retrying…" : "Try again"}
          </button>
        </div>
      ) : freshness.kind === "stale" && lastUpdatedAt ? (
        <div className="rounded-(--r-3) p-3 text-[12.5px] flex items-center justify-between gap-3" style={{ background: "oklch(0.96 0.06 75)", border: "1px solid oklch(0.85 0.08 75)", color: "oklch(0.40 0.14 75)" }}>
          <span>Live feed may be out of date — last updated {lastUpdatedLabel}.</span>
          <button
            onClick={refresh}
            disabled={isRefreshing}
            className="shrink-0 px-3 py-1.5 rounded-(--r-2) font-mono text-[11px] uppercase tracking-[0.04em] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ border: "1px solid oklch(0.80 0.10 75)", background: "var(--bg)", color: "oklch(0.40 0.14 75)" }}
          >
            {isRefreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {topRow.map((k) => (
          <div key={k.label} className="rounded-(--r-3) p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className="text-[26px] font-medium tracking-[-0.02em] tabular-nums leading-none mt-1.5" style={{ color: "var(--ink)" }}>{k.value}</div>
            <div className="font-mono text-[11.5px] mt-1" style={{ color: "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-3.5">
        <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="flex justify-between items-center px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
              Check-ins by hour <span className="font-mono text-[11px] font-normal uppercase tracking-[0.04em] ml-2" style={{ color: "var(--fg-3)" }}>{activeFilter}</span>
            </h3>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Real data</span>
          </div>
          <div className="flex items-end gap-1 px-5.5 h-[200px] pt-4.5">
            {hourlyBars.map((h) => (
              <div key={h.hour} className="flex-1 rounded-t-[3px] relative group cursor-pointer" style={{ height: `${Math.max(h.pct, 2)}%`, background: "var(--ink)", minHeight: h.count > 0 ? 4 : 0 }}>
                <span className="absolute -top-[18px] left-1/2 -translate-x-1/2 font-mono text-[9.5px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--ink)" }}>
                  {String(h.hour).padStart(2, "0")} :00 · {h.count}
                </span>
              </div>
            ))}
          </div>
          <div className="flex px-5.5 py-1.5 pb-4 font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
            <span className="flex-1 text-center">00</span>
            <span className="flex-1 text-center">06</span>
            <span className="flex-1 text-center">12</span>
            <span className="flex-1 text-center">18</span>
            <span className="flex-1 text-center">23</span>
          </div>
        </div>

        <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="flex justify-between items-center px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Summary</h3>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Live</span>
          </div>
          <div>
            <SummaryRow label="Tracked check-ins" value={String(stream.length)} />
            <SummaryRow label="Location" value={stats?.city && stats?.country_code ? `${stats.city}, ${stats.country_code}` : "Current org"} />
            <SummaryRow label="Reviews" value={String(stats?.review_count ?? 0)} />
            <SummaryRow label="Revenue week" value={`R ${(stats?.revenue_week ?? 0).toLocaleString()}`} />
          </div>
        </div>
      </div>

      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex justify-between items-center px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-[14px] font-medium flex items-center gap-2.5" style={{ color: "var(--ink)" }}>
            Recent check-ins
            <span className={`inline-block w-1.5 h-1.5 rounded-full ${pill.pulse ? "animate-pulse" : ""}`} style={{ background: pill.color }} />
          </h3>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
            {!isOnline ? "Paused · offline" : freshness.kind === "stale" ? "Reconnecting…" : "Auto-refreshing"}
          </span>
        </div>
        <div className="max-h-[460px] overflow-y-auto">
          {(loading && isOnline && stream.length === 0) ? (
            <div className="px-4.5 py-4"><AsyncSpinner label="Loading live check-ins" /></div>
          ) : stream.length === 0 ? (
            <div className="px-4.5 py-4"><EmptySlate message="No check-ins found for this period." mt="mt-0" /></div>
          ) : (
            stream.map((checkIn) => {
              const member = personName(checkIn);
              const listing = listingLabel(checkIn);
              return (
                <div key={checkIn._id} className="grid items-center gap-3 px-4.5 py-3" style={{ gridTemplateColumns: "72px 30px 1fr", borderBottom: "1px solid var(--border)" }}>
                  <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{hourLabel(checkIn.checked_in_at)}</span>
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>{initials(member)}</span>
                  <div>
                    <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{member}</div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>
                      {listing} · {dayLabel(checkIn.checked_in_at)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </GymDashboardShell>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
      <span className="text-[13px]" style={{ color: "var(--fg-2)" }}>{label}</span>
      <span className="font-mono text-[13px]" style={{ color: "var(--ink)" }}>{value}</span>
    </div>
  );
}
