"use client";

import { useEffect, useMemo, useState } from "react";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import SearchableSelect from "@/components/SearchableSelect";
import {
  consultationsService,
  ConsultationBookingStatus,
  type ConsultationBooking,
  type ConsultationType,
} from "@/lib/api/consultations";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

const TIME_RANGE_OPTIONS = [
  { label: "This month", value: "This month" },
  { label: "Last 3 months", value: "Last 3 months" },
  { label: "All time", value: "All time" },
];

function clientLabel(booking: ConsultationBooking) {
  return `Client ${booking.clientUserId.slice(-6).toUpperCase()}`;
}

export default function TrainerSessionsListPage() {
  const { fmtDateTime } = useOrgFormat();
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [typesById, setTypesById] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [timeRange, setTimeRange] = useState("This month");
  const [clientFilter, setClientFilter] = useState("All clients");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const now = new Date();
      const params: { from?: string } = {};

      if (timeRange === "This month") {
        params.from = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .slice(0, 10);
      } else if (timeRange === "Last 3 months") {
        params.from = new Date(now.getFullYear(), now.getMonth() - 2, 1)
          .toISOString()
          .slice(0, 10);
      }

      const [bookingRes, typesRes] = await Promise.all([
        consultationsService.getProviderBookings(params),
        consultationsService.getTypes({ includeInactive: true }),
      ]);

      if (!mounted) return;

      if (bookingRes.success && bookingRes.data) {
        setBookings(
          bookingRes.data.filter(
            (b) =>
              b.status === ConsultationBookingStatus.COMPLETED ||
              b.status === ConsultationBookingStatus.NO_SHOW,
          ),
        );
      } else {
        setBookings([]);
      }

      if (typesRes.success && typesRes.data) {
        const map = typesRes.data.reduce<Record<string, string>>(
          (acc, item: ConsultationType) => {
            acc[item.id] = item.name;
            return acc;
          },
          {},
        );
        setTypesById(map);
      } else {
        setTypesById({});
      }

      setLoading(false);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [timeRange]);

  const clientOptions = useMemo(() => {
    const unique = new Set(bookings.map((b) => clientLabel(b)));
    return [
      { label: "All clients", value: "All clients" },
      ...Array.from(unique).map((label) => ({ label, value: label })),
    ];
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      const label = clientLabel(b);
      const type = typesById[b.consultationTypeId] ?? "Consultation";

      if (clientFilter !== "All clients" && label !== clientFilter) {
        return false;
      }

      if (!q) return true;
      return (
        label.toLowerCase().includes(q) ||
        type.toLowerCase().includes(q) ||
        (b.notes ?? "").toLowerCase().includes(q)
      );
    });
  }, [bookings, clientFilter, query, typesById]);

  return (
    <TrainerDashboardShell
      activeItem="Calendar"
      crumb="Sessions log"
      actions={<button className="btn-ghost-v2 sm">Export CSV</button>}
    >
      {/* Page header */}
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>Sessions log</h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>{loading ? "Loading sessions..." : `${filtered.length} sessions found`}</p>
      </div>

      {/* Card with filters + table */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-2 p-5 pb-3.5">
          <input
            placeholder="Search by client name or note…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-9 px-3.5 rounded-(--r-2) text-[13.5px]"
            style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)", fontFamily: "inherit", outline: "none" }}
          />
          <div className="w-full sm:w-40">
            <SearchableSelect value={timeRange} onChange={setTimeRange} options={TIME_RANGE_OPTIONS} placeholder="Time range" />
          </div>
          <div className="w-full sm:w-40">
            <SearchableSelect value={clientFilter} onChange={setClientFilter} options={clientOptions} placeholder="Filter client" />
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
              {filtered.map((s, i) => {
                const duration = Math.max(
                  0,
                  Math.round(
                    (new Date(s.endsAt).getTime() -
                      new Date(s.startsAt).getTime()) /
                      60000,
                  ),
                );
                const label = clientLabel(s);
                const typeLabel =
                  typesById[s.consultationTypeId] ?? "Consultation";
                const topSet = s.notes?.trim() || "No notes";

                return (
                <tr key={s.id} className="cursor-pointer" style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <td className="px-3.5 py-3 font-mono" style={{ color: "var(--fg-2)" }}>{fmtDateTime(s.startsAt)}</td>
                  <td className="px-3.5 py-3 font-medium" style={{ color: "var(--ink)" }}>{label}</td>
                  <td className="px-3.5 py-3" style={{ color: "var(--ink)" }}>{typeLabel}</td>
                  <td className="px-3.5 py-3 font-mono" style={{ color: "var(--ink)" }}>{duration} min</td>
                  <td className="px-3.5 py-3 font-mono text-[12.5px]" style={{ color: "var(--ink)" }}>{topSet}</td>
                  <td className="px-3.5 py-3">
                    <span
                      className="font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-full"
                      style={
                        s.status === ConsultationBookingStatus.COMPLETED
                          ? { background: "var(--signal-soft)", color: "var(--signal-ink)" }
                          : { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" }
                      }
                    >
                      {s.status.toLowerCase().replace("_", " ")}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </TrainerDashboardShell>
  );
}
