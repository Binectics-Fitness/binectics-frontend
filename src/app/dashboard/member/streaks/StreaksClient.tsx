"use client";

import { useQuery } from "@tanstack/react-query";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { checkinsService } from "@/lib/api/checkins";
import { useLoyaltyBalance } from "@/lib/queries/loyalty";
import { formatDate } from "@/utils/format";
import type { MyCheckInDashboardStats, CheckIn } from "@/lib/types";

/**
 * Milestones computed from real stats. These are client-side milestones
 * (met = earned), not server-awarded badges — labeled accordingly.
 */
const STREAK_MILESTONES = [1, 7, 30, 50, 100, 365];
const SESSION_MILESTONES = [10, 50, 100, 250, 500];

export function StreaksClient() {
  const { data: stats = null, isLoading } = useQuery<MyCheckInDashboardStats | null>({
    queryKey: ["checkins", "myDashboardStats"],
    queryFn: async () => {
      const res = await checkinsService.getMyDashboardStats();
      return res.success && res.data ? res.data : null;
    },
  });
  const { data: history = [] } = useQuery<CheckIn[]>({
    queryKey: ["checkins", "myHistory"],
    queryFn: async () => {
      const res = await checkinsService.getMyHistory();
      return res.success && res.data ? res.data : [];
    },
  });
  const { data: loyalty } = useLoyaltyBalance();

  const streak = stats?.current_streak_days ?? 0;
  const total = stats?.total_check_ins ?? 0;
  const points = loyalty?.balance ?? null;

  const kpis = [
    { label: "Current streak", value: `${streak} day${streak === 1 ? "" : "s"}`, delta: stats?.has_checked_in_today ? "checked in today ✓" : "no check-in yet today" },
    { label: "Total check-ins", value: String(total), delta: stats?.last_check_in_at ? `last ${formatDate(stats.last_check_in_at)}` : "—" },
    ...(points != null ? [{ label: "Loyalty points", value: points.toLocaleString(), delta: "redeemable at your gym" }] : []),
  ];

  const milestones = [
    ...STREAK_MILESTONES.map((d) => ({ name: d === 1 ? "First step" : `${d}-day streak`, sub: `Day ${d}`, earned: streak >= d })),
    ...SESSION_MILESTONES.map((n) => ({ name: `${n} sessions`, sub: "check-ins", earned: total >= n })),
  ];
  const earned = milestones.filter((m) => m.earned);
  const locked = milestones.filter((m) => !m.earned);

  return (
    <MemberDashboardShell activeLabel="Home">
      <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>Streaks</h1>

      {isLoading && <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>Loading your stats…</p>}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-1 rounded-(--r-3) px-4 py-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
            <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Milestones</h3>
        <p className="text-[12.5px] mt-1 mb-4" style={{ color: "var(--fg-3)" }}>Computed from your streak and total check-ins.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {[...earned, ...locked].map((m) => (
            <div key={m.name} className="flex items-center gap-2.5 p-3 rounded-(--r-2)" style={{ border: "1px solid var(--border)", opacity: m.earned ? 1 : 0.45 }}>
              <span className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold" style={{ background: m.earned ? "var(--signal-soft)" : "var(--bg-2)", color: m.earned ? "var(--signal-ink)" : "var(--fg-3)" }}>
                {m.earned ? "✓" : "·"}
              </span>
              <div className="min-w-0">
                <div className="text-[13px] font-medium truncate" style={{ color: "var(--ink)" }}>{m.name}</div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{m.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent check-ins */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="px-5.5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Recent check-ins</h3>
        </div>
        {history.length === 0 ? (
          <p className="px-5.5 py-8 text-center text-[13.5px]" style={{ color: "var(--fg-3)" }}>
            No check-ins yet — scan the QR at your gym to start your streak.
          </p>
        ) : (
          history.slice(0, 10).map((c, i, a) => (
            <div key={c._id} className="flex items-center gap-3 px-5.5 py-3" style={{ borderBottom: i < Math.min(a.length, 10) - 1 ? "1px solid var(--border)" : "none" }}>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--signal)" }} />
              <span className="flex-1 text-[13.5px] truncate" style={{ color: "var(--ink)" }}>
                {c.listing_id && typeof c.listing_id === "object" ? c.listing_id.headline : "Check-in"}
              </span>
              <span className="font-mono text-[11.5px] shrink-0" style={{ color: "var(--fg-3)" }}>
                {formatDate(c.checked_in_at)}{" · "}
                {new Date(c.checked_in_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))
        )}
      </div>
    </MemberDashboardShell>
  );
}
