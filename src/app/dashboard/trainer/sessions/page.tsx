"use client";

import { useState } from "react";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import SearchableSelect from "@/components/SearchableSelect";

const TIME_RANGE_OPTIONS = [
  { label: "This month", value: "This month" },
  { label: "Last 3 months", value: "Last 3 months" },
  { label: "All time", value: "All time" },
];

const CLIENT_FILTER_OPTIONS = [
  { label: "All clients", value: "All clients" },
  { label: "Linda Mokoena", value: "Linda Mokoena" },
  { label: "Wei Chen", value: "Wei Chen" },
];

const SESSIONS = [
  { date: "Wed 21 May 18:00", client: "Linda Mokoena", type: "1-on-1 strength", duration: "62 min", topSet: "92.5 × 3 squat · PR", status: "completed" as const },
  { date: "Wed 21 May 06:00", client: "Wei Chen", type: "1-on-1 olympic", duration: "55 min", topSet: "75 × 1 snatch", status: "completed" as const },
  { date: "Tue 20 May 17:30", client: "Camilla Lapwing", type: "1-on-1 postnatal", duration: "45 min", topSet: "24 × 10 DB row", status: "completed" as const },
  { date: "Mon 19 May 18:30", client: "Mike Khumalo", type: "1-on-1 strength", duration: "60 min", topSet: "120 × 5 deadlift", status: "no-show" as const },
  { date: "Mon 19 May 06:00", client: "Linda Mokoena", type: "1-on-1 strength", duration: "60 min", topSet: "90 × 5 squat", status: "completed" as const },
  { date: "Sat 17 May 09:00", client: "Folake Adebayo", type: "1-on-1 hybrid", duration: "45 min", topSet: "BW × 8 chin-up", status: "completed" as const },
  { date: "Fri 16 May 17:00", client: "Wei Chen", type: "1-on-1 olympic", duration: "60 min", topSet: "60 × 1 clean", status: "completed" as const },
  { date: "Thu 15 May 18:00", client: "Linda Mokoena", type: "1-on-1 strength", duration: "60 min", topSet: "85 × 5 squat", status: "completed" as const },
];

export default function TrainerSessionsListPage() {
  const [timeRange, setTimeRange] = useState("This month");
  const [clientFilter, setClientFilter] = useState("All clients");

  return (
    <TrainerDashboardShell
      activeItem="Calendar"
      crumb="Sessions log"
      actions={<button className="btn-ghost-v2 sm">Export CSV</button>}
    >
      {/* Page header */}
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>Sessions log</h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>1,284 sessions all-time · searchable · sortable · exportable</p>
      </div>

      {/* Card with filters + table */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-2 p-5 pb-3.5">
          <input
            placeholder="Search by client name or note…"
            className="flex-1 h-9 px-3.5 rounded-(--r-2) text-[13.5px]"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)", fontFamily: "inherit", outline: "none" }}
          />
          <div className="w-full sm:w-40">
            <SearchableSelect value={timeRange} onChange={setTimeRange} options={TIME_RANGE_OPTIONS} placeholder="Time range" />
          </div>
          <div className="w-full sm:w-40">
            <SearchableSelect value={clientFilter} onChange={setClientFilter} options={CLIENT_FILTER_OPTIONS} placeholder="Filter client" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                {["Date", "Client", "Type", "Duration", "Top set", "Status"].map((h) => (
                  <th key={h} className="px-3.5 py-2.5 text-left font-medium font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SESSIONS.map((s, i) => (
                <tr key={i} className="cursor-pointer" style={{ borderBottom: i < SESSIONS.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td className="px-3.5 py-3 font-mono" style={{ color: "var(--fg-2)" }}>{s.date}</td>
                  <td className="px-3.5 py-3 font-medium" style={{ color: "var(--ink)" }}>{s.client}</td>
                  <td className="px-3.5 py-3" style={{ color: "var(--ink)" }}>{s.type}</td>
                  <td className="px-3.5 py-3 font-mono" style={{ color: "var(--ink)" }}>{s.duration}</td>
                  <td className="px-3.5 py-3 font-mono text-[12.5px]" style={{ color: "var(--ink)" }}>{s.topSet}</td>
                  <td className="px-3.5 py-3">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-full"
                      style={
                        s.status === "completed"
                          ? { background: "var(--signal-soft)", color: "var(--signal-ink)" }
                          : { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" }
                      }
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TrainerDashboardShell>
  );
}
