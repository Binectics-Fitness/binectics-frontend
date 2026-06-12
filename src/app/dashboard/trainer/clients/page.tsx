"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { progressService } from "@/lib/api/progress";
import type { ClientProfile } from "@/lib/api/progress";

type Filter = "All" | "Active" | "Paused";

/* ─── Helpers ────────────────────────────────────────────── */

function clientName(c: ClientProfile): string {
  if (typeof c.client_id === "object") {
    return `${c.client_id.first_name} ${c.client_id.last_name}`;
  }
  return c.client_id;
}

function clientInitials(c: ClientProfile): string {
  const name = clientName(c);
  const parts = name.trim().split(" ");
  return parts.length >= 2 ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();
}

function StatusBadge({ status }: { status: "Active" | "Paused" }) {
  const map: Record<string, { bg: string; color: string }> = {
    Active: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
    Paused: { bg: "var(--bg-2)", color: "var(--fg-3)" },
  };
  const s = map[status] ?? map["Paused"];
  return (
    <span
      className="font-mono text-[10.5px] px-[7px] py-[2px] rounded-full uppercase tracking-[0.04em] inline-flex items-center gap-[5px]"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="w-[5px] h-[5px] rounded-full" style={{ background: "currentColor" }} />
      {status}
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

export default function TrainerClientsPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    progressService
      .getMyClientProfiles()
      .then((res) => {
        if (res.success && res.data) setClients(res.data);
        else setError("Failed to load clients");
      })
      .catch(() => setError("Failed to load clients"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      const name = clientName(c).toLowerCase();
      const matchesSearch = search === "" || name.includes(search.toLowerCase());
      const matchesFilter =
        activeFilter === "All" ||
        (activeFilter === "Active" && c.is_active) ||
        (activeFilter === "Paused" && !c.is_active);
      return matchesSearch && matchesFilter;
    });
  }, [clients, search, activeFilter]);

  const counts = useMemo(() => ({
    All: clients.length,
    Active: clients.filter((c) => c.is_active).length,
    Paused: clients.filter((c) => !c.is_active).length,
  }), [clients]);

  const FILTERS: { label: Filter }[] = [
    { label: "All" },
    { label: "Active" },
    { label: "Paused" },
  ];

  return (
    <TrainerDashboardShell activeItem="Clients" crumb="Clients">
      {/* Heading */}
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Clients
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          {loading ? "Loading…" : `${clients.length} total clients`}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total clients", value: loading ? "—" : String(clients.length), delta: "All time" },
          { label: "Active", value: loading ? "—" : String(counts.Active), delta: "Currently active" },
          { label: "Paused", value: loading ? "—" : String(counts.Paused), delta: "Inactive / paused" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-(--r-3) p-[14px_16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className="text-[22px] font-medium mt-1" style={{ color: "var(--ink)", letterSpacing: "-0.018em", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: "var(--signal-ink)" }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="rounded-(--r-3) p-[10px_14px] flex gap-3.5 items-center flex-wrap" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex-1 min-w-[240px] flex items-center gap-2 h-8 px-3 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            className="flex-1 border-0 bg-transparent text-[13px] outline-none"
            placeholder="Search clients…"
            style={{ color: "var(--ink)" }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setActiveFilter(f.label)}
              className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-[5px] rounded-full cursor-pointer"
              style={{
                background: activeFilter === f.label ? "var(--ink)" : "var(--bg)",
                color: activeFilter === f.label ? "var(--bg)" : "var(--fg-3)",
                border: activeFilter === f.label ? "1px solid var(--ink)" : "1px solid var(--border)",
              }}
            >
              {f.label} <span style={{ color: activeFilter === f.label ? "oklch(0.75 0.005 85)" : "var(--fg-4)", marginLeft: 4 }}>{counts[f.label]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-(--r-2) px-4 py-3 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Name", "Goals", "Status", "Since"].map((h) => (
                  <th
                    key={h}
                    className="font-mono text-[10.5px] uppercase tracking-[0.04em] py-2.5 px-4.5 text-left"
                    style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)", fontWeight: 500 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4.5 py-6"><AsyncSpinner label="Loading clients" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4.5 py-6"><EmptySlate message="No clients found." mt="mt-0" /></td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c._id} className="hover:bg-[var(--bg-2)] cursor-pointer">
                    <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                      <Link href={`/dashboard/trainer/clients/${c._id}`} className="flex gap-2.5 items-center no-underline" style={{ color: "inherit" }}>
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
                          {clientInitials(c)}
                        </span>
                        <span className="font-medium" style={{ color: "var(--ink)" }}>{clientName(c)}</span>
                      </Link>
                    </td>
                    <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                      <span className="text-[13px]" style={{ color: "var(--fg-2)" }}>
                        {c.goals.length > 0 ? c.goals.slice(0, 2).join(" · ") : "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                      <StatusBadge status={c.is_active ? "Active" : "Paused"} />
                    </td>
                    <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                      <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>
                        {new Date(c.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </TrainerDashboardShell>
  );
}
