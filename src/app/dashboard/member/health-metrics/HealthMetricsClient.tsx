"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { progressService, type WeightLog, type ClientProfile } from "@/lib/api/progress";
import { formatDate } from "@/utils/format";

/**
 * Health metrics from real weight logs (progress module). Wearable metrics
 * (HR, sleep, HRV) have no integration yet and show an honest pending state
 * instead of the previous fabricated readings.
 */
export function HealthMetricsClient() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { data: profiles = [] } = useQuery<ClientProfile[]>({
    queryKey: ["progress", "myOwnProfiles"],
    queryFn: async () => {
      const res = await progressService.getMyOwnProfiles();
      return res.success && res.data ? res.data : [];
    },
  });
  const profileId = profiles[0]?._id;

  const { data: logs = [], isLoading } = useQuery<WeightLog[]>({
    queryKey: ["progress", "weightLogs", profileId ?? ""],
    queryFn: async () => {
      if (!profileId) return [];
      const res = await progressService.getWeightLogs(profileId, 60);
      return res.success && res.data ? res.data : [];
    },
    enabled: !!profileId,
  });

  const addWeight = useMutation({
    mutationFn: (weight_kg: number) => {
      if (!profileId) throw new Error("No profile");
      return progressService.createWeightLog(profileId, {
        weight_kg,
        recorded_at: new Date().toISOString(),
      });
    },
    onSuccess: (res) => {
      if (res.success) {
        setDraft("");
        setError(null);
        void queryClient.invalidateQueries({ queryKey: ["progress", "weightLogs", profileId ?? ""] });
      } else {
        setError(res.message || "Couldn't log that weight.");
      }
    },
  });

  const sorted = useMemo(
    () => [...logs].sort((a, b) => a.recorded_at.localeCompare(b.recorded_at)),
    [logs],
  );
  const latest = sorted[sorted.length - 1];
  // 30-day window anchored on the latest entry's own date (pure — no clock
  // reads in render): change vs the earliest log within 30 days of it.
  const { baseline30, change30 } = useMemo(() => {
    const last = sorted[sorted.length - 1];
    if (!last) return { baseline30: undefined, change30: null };
    const windowStart = new Date(
      new Date(last.recorded_at).getTime() - 30 * 86400_000,
    ).toISOString();
    const base = sorted.find((l) => l.recorded_at >= windowStart) ?? sorted[0];
    return {
      baseline30: base,
      change30:
        base && last._id !== base._id ? last.weight_kg - base.weight_kg : null,
    };
  }, [sorted]);

  const kpis = [
    { label: "Latest weight", value: latest ? `${latest.weight_kg.toFixed(1)} kg` : "—", delta: latest ? formatDate(latest.recorded_at) : "no entries yet" },
    { label: "30-day change", value: change30 != null ? `${change30 > 0 ? "+" : ""}${change30.toFixed(1)} kg` : "—", delta: change30 != null ? `since ${formatDate(baseline30.recorded_at)}` : "need two entries" },
    { label: "Entries", value: String(logs.length), delta: "last 60 recorded" },
  ];

  const min = Math.min(...sorted.map((l) => l.weight_kg), Infinity);
  const max = Math.max(...sorted.map((l) => l.weight_kg), -Infinity);
  const span = Math.max(max - min, 0.1);

  const onAdd = () => {
    const v = Number(draft);
    if (!draft || Number.isNaN(v) || v <= 0 || v > 500) {
      setError("Enter a weight in kg (e.g. 82.4).");
      return;
    }
    addWeight.mutate(v);
  };

  return (
    <MemberDashboardShell activeLabel="Home">
      <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>Health metrics</h1>

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

      {/* Weight trend + quick add */}
      <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Weight</h3>
          <div className="flex items-center gap-2">
            <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="kg" inputMode="decimal"
              className="h-8 w-24 rounded-(--r-2) px-3 text-[13px]"
              style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
            <button className="btn-primary-v2 sm" disabled={addWeight.isPending || !profileId} onClick={onAdd}>
              {addWeight.isPending ? "Logging…" : "Log weight"}
            </button>
          </div>
        </div>
        {error && <p className="text-[12px] mt-2" style={{ color: "var(--danger, #b00020)" }}>{error}</p>}
        {!profileId && !isLoading && (
          <p className="text-[13px] mt-4" style={{ color: "var(--fg-3)" }}>
            Weight tracking starts once you have a progress profile (created when you join a gym or connect with a coach).
          </p>
        )}
        {sorted.length > 1 && (
          <div className="flex items-end gap-1 mt-5" style={{ height: 120 }}>
            {sorted.slice(-40).map((l) => (
              <div key={l._id} className="flex-1 rounded-t-[2px]" title={`${l.weight_kg} kg · ${formatDate(l.recorded_at)}`}
                style={{ height: `${20 + ((l.weight_kg - min) / span) * 80}%`, background: "var(--signal)", opacity: 0.85, minWidth: 3 }} />
            ))}
          </div>
        )}
        {sorted.length > 0 && (
          <div className="mt-4 flex flex-col gap-1.5">
            {sorted.slice(-5).reverse().map((l) => (
              <div key={l._id} className="flex items-center gap-3 text-[13px]">
                <span className="font-mono" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{l.weight_kg.toFixed(1)} kg</span>
                <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>{formatDate(l.recorded_at)}</span>
                {l.note && <span className="text-[12px] truncate" style={{ color: "var(--fg-3)" }}>{l.note}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Wearables — honest pending */}
      <div className="rounded-(--r-3) flex flex-col items-center text-center px-6 py-10" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Heart rate, sleep & recovery are coming</h2>
        <p className="text-[13.5px] mt-2 max-w-[440px]" style={{ color: "var(--fg-3)" }}>
          Wearable integrations aren&rsquo;t connected yet, so resting HR, sleep, and HRV can&rsquo;t be shown truthfully. They&rsquo;ll appear here once device sync ships.
        </p>
      </div>
    </MemberDashboardShell>
  );
}
