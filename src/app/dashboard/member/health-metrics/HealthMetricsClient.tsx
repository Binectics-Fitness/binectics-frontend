"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { DSStatCard, PageHeader } from "@/components/ds";
import { progressService, type WeightLog, type ClientProfile } from "@/lib/api/progress";
import { formatDate } from "@/utils/format";
import { useClientNow } from "@/lib/ui/useClientNow";
import { signedKg, weightChange30d } from "../_lib/logStats";

/**
 * Health metrics from real weight logs (progress module). Wearable metrics
 * (HR, sleep, HRV) have no integration yet and show an honest pending state
 * instead of the previous fabricated readings.
 */
export function HealthMetricsClient() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  // apiClient reports failures as success:false rather than throwing; both
  // queries throw on it so a failed load shows an error, not "no entries".
  // The profiles key differs from the shared one in src/lib/queries, which
  // turns a failure into [].
  const profilesQuery = useQuery<ClientProfile[]>({
    queryKey: ["progress", "myOwnProfiles", "strict"],
    queryFn: async () => {
      const res = await progressService.getMyOwnProfiles();
      if (!res.success) throw new Error(res.message || "Couldn't load your profile.");
      return res.data ?? [];
    },
    retry: 1,
  });
  const profileId = profilesQuery.data?.[0]?._id;

  const logsQuery = useQuery<WeightLog[]>({
    queryKey: ["progress", "weightLogs", profileId ?? ""],
    queryFn: async () => {
      if (!profileId) return [];
      const res = await progressService.getWeightLogs(profileId, 60);
      if (!res.success) throw new Error(res.message || "Couldn't load your weight.");
      return res.data ?? [];
    },
    enabled: !!profileId,
    retry: 1,
  });
  const logs = useMemo(() => logsQuery.data ?? [], [logsQuery.data]);
  const loadFailed = profilesQuery.isError || logsQuery.isError;

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
  // Same 30-day change as the weight log: latest minus the earliest log in
  // the 30 days ending today, by the viewer's clock (null until mount).
  const now = useClientNow();
  const change30 = useMemo(() => (now ? weightChange30d(logs, now) : null), [logs, now]);

  const kpis = [
    { label: "Latest weight", value: latest ? latest.weight_kg.toFixed(1) : "-", unit: latest ? "kg" : undefined, delta: latest ? formatDate(latest.recorded_at) : "No entries yet" },
    { label: "30-day change", value: change30 ? signedKg(change30.kg) : "-", unit: change30 ? "kg" : undefined, delta: change30 ? `since ${formatDate(change30.since)}` : now ? "Needs two entries in 30 days" : undefined },
    { label: "Entries", value: String(logs.length), unit: undefined, delta: "Last 60 recorded" },
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
    <MemberDashboardShell activeLabel="Activity">
      <PageHeader title={{ before: "Health ", emphasis: "metrics" }} />

      <div className="flex flex-col gap-3.5">
        {loadFailed && (
          <p
            role="alert"
            className="rounded-[var(--r-3)] px-4 py-3.5 text-[13px]"
            style={{ background: "var(--danger-soft)", border: "1px solid var(--border)", color: "var(--danger-ink)" }}
          >
            We couldn&rsquo;t load your weight entries. Please refresh to try again.
          </p>
        )}

        {/* KPIs. The change is neutral in tone: down is not "good" for everyone. */}
        {/* Tiles wait for the entries (or a confirmed "no profile yet"). */}
        {!loadFailed && (logsQuery.isSuccess || (profilesQuery.isSuccess && !profileId)) && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {kpis.map((k) => (
              <DSStatCard key={k.label} size="sm" label={k.label} value={k.value} unit={k.unit} delta={k.delta} />
            ))}
          </div>
        )}

        {/* Weight trend + quick add */}
        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h2 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Weight</h2>
            <div className="flex items-center gap-2">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="kg" inputMode="decimal" aria-label="Weight in kg"
                className="h-8 w-24 rounded-(--r-2) px-3 text-[13px]"
                style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
              <button className="btn-primary-v2 sm" disabled={addWeight.isPending || !profileId} onClick={onAdd}>
                {addWeight.isPending ? "Logging…" : "Log weight"}
              </button>
            </div>
          </div>
          {error && <p className="text-[12px] mt-2" style={{ color: "var(--danger, #b00020)" }}>{error}</p>}
          {!loadFailed && profilesQuery.isSuccess && !profileId && (
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
      </div>
    </MemberDashboardShell>
  );
}
