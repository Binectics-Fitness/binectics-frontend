"use client";

import React, { useEffect, useState } from "react";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { progressService, type ClientProfileWithSummary } from "@/lib/api/progress";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

function clientName(c: ClientProfileWithSummary): string {
  if (typeof c.client_id === "object" && c.client_id !== null) {
    return `${c.client_id.first_name} ${c.client_id.last_name}`.trim();
  }
  return "Client";
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export default function DietitianSingleClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = React.use(params);
  const { fmtDate } = useOrgFormat();
  const [client, setClient] = useState<ClientProfileWithSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const res = await progressService.getMyClientSummaries();
        if (!active) return;
        if (res.success && res.data) {
          const found = res.data.find((c) => c._id === clientId) ?? null;
          setClient(found);
          setError(found ? null : "This client could not be found.");
        } else {
          setError(res.message || "We couldn't load this client.");
        }
      } catch {
        if (active) setError("We couldn't load this client. Try again shortly.");
      } finally {
        if (active) setLoading(false);
      }
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [clientId]);

  const name = client ? clientName(client) : "Client";
  const summary = client?.summary;
  const latestWeight = summary?.latest_weight?.weight_kg ?? null;
  const startWeight = client?.starting_weight_kg ?? null;
  const weightDelta = latestWeight != null && startWeight != null ? latestWeight - startWeight : null;

  const kpis = client
    ? [
        { label: "Current weight", value: latestWeight != null ? `${latestWeight} kg` : "—", delta: startWeight != null ? `from ${startWeight} kg` : "No baseline" },
        { label: "Weight change", value: weightDelta != null ? `${weightDelta > 0 ? "+" : ""}${weightDelta.toFixed(1)} kg` : "—", delta: client.target_weight_kg != null ? `target ${client.target_weight_kg} kg` : "No target set" },
        { label: "Journal entries", value: String(summary?.journal_count ?? 0), delta: `${summary?.meal_count ?? 0} meals logged` },
        { label: "Diet plans", value: String(summary?.diet_plan_count ?? 0), delta: `${summary?.workout_plan_count ?? 0} workout plans` },
      ]
    : [];

  return (
    <DietitianDashboardShell activeItem="Clients" crumb={client ? name : "Client"}>
      {loading && !client ? (
        <AsyncSpinner size="page" label="Loading client" />
      ) : error || !client ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
          <div className="font-medium">Couldn&apos;t load client</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error ?? "Client not found."}</div>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row gap-4.5 items-start sm:items-center">
            <span className="w-[64px] h-[64px] rounded-(--r-3) flex-shrink-0 flex items-center justify-center text-[20px] font-semibold" style={{ background: "var(--dietitian-soft)", color: "var(--dietitian)" }}>{initials(name)}</span>
            <div className="flex-1">
              <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>{name}</h1>
              <p className="text-[13.5px] mt-1" style={{ color: "var(--fg-3)" }}>
                {client.is_active ? "Active client" : "Paused"} &middot; joined {fmtDate(client.created_at)}
              </p>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-(--r-3) p-3.5 px-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
                <div className="text-[24px] font-medium tracking-[-0.02em] tabular-nums mt-1" style={{ color: "var(--ink)" }}>{k.value}</div>
                <div className="font-mono text-[11px] mt-1" style={{ color: "var(--fg-3)" }}>{k.delta}</div>
              </div>
            ))}
          </div>

          {/* Goals + Notes */}
          <div className="grid lg:grid-cols-[1fr_1fr] gap-3.5">
            <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Goals</h3>
              {client.goals.length === 0 ? (
                <EmptySlate message="No goals recorded." mt="mt-0" />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {client.goals.map((g) => (
                    <span key={g} className="inline-flex items-center px-2.5 py-1 rounded-(--r-1) text-[12.5px]" style={{ background: "var(--bg-2)", color: "var(--ink)", border: "1px solid var(--border)" }}>{g}</span>
                  ))}
                </div>
              )}
              {client.height_cm != null && (
                <div className="mt-4 font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>Height · {client.height_cm} cm</div>
              )}
            </div>

            <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Notes</h3>
              {client.notes ? (
                <div className="text-[13px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>{client.notes}</div>
              ) : (
                <EmptySlate message="No notes yet." mt="mt-0" />
              )}
            </div>
          </div>
        </>
      )}
    </DietitianDashboardShell>
  );
}
