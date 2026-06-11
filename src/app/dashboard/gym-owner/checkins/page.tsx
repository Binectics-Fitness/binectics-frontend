"use client";

import { useEffect, useMemo, useState } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { checkinsService } from "@/lib/api/checkins";
import { useOrganization } from "@/contexts/OrganizationContext";
import { CheckInHistoryPeriod, type OrgCheckInDashboardStats, type CheckIn } from "@/lib/types";

const TIME_FILTERS = [
  { label: "Today", value: CheckInHistoryPeriod.TODAY },
  { label: "Week", value: CheckInHistoryPeriod.WEEK },
  { label: "Month", value: CheckInHistoryPeriod.MONTH },
] as const;

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
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    if (orgLoading || !currentOrg) return;

    let isMounted = true;
    const load = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          checkinsService.getOrgDashboardStats(currentOrg._id),
          checkinsService.getOrgCheckIns(currentOrg._id, activeFilter),
        ]);

        if (!isMounted) return;
        setStats(statsRes.success && statsRes.data ? statsRes.data : null);
        setHistory(historyRes.success && historyRes.data ? historyRes.data : []);
        setError(
          statsRes.success && historyRes.success
            ? null
            : statsRes.message || historyRes.message || "Failed to load check-ins",
        );
        setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Failed to load check-ins");
        setStats(null);
        setHistory([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 30_000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, [activeFilter, currentOrg, orgLoading]);

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
    { label: "Revenue today", value: `R ${(stats?.revenue_today ?? 0).toLocaleString()}`, delta: lastUpdated ? `Updated ${lastUpdated}` : "Waiting for refresh" },
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
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.04em] px-2.5 py-1 rounded-full" style={{ color: "var(--signal-ink)", background: "var(--signal-soft)", border: "1px solid oklch(0.88 0.05 148)" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--signal)" }} />
            Live · {currentOrg ? currentOrg.name : "no org selected"}
          </span>
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
      ) : error ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
          <div className="font-medium">Couldn&apos;t load check-ins</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
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
            <span className="inline-block w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--signal)" }} />
          </h3>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Auto-refreshing</span>
        </div>
        <div className="max-h-[460px] overflow-y-auto">
          {(loading && stream.length === 0) ? (
            <div className="px-4.5 py-10 text-[13px]" style={{ color: "var(--fg-3)" }}>Loading live check-ins...</div>
          ) : stream.length === 0 ? (
            <div className="px-4.5 py-10 text-[13px]" style={{ color: "var(--fg-3)" }}>No check-ins found for this period.</div>
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
