"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { AsyncSpinner, BookingStatusBadge, Drawer } from "@/components/ds";
import { BookingActionsPanel } from "@/components/BookingActionsPanel";
import SearchableSelect from "@/components/SearchableSelect";
import { toast } from "@/components/Toast";
import {
  consultationsService,
  ConsultationBookingStatus,
  type ConsultationBooking,
  type ConsultationType,
} from "@/lib/api/consultations";
import {
  clientDisplayName,
  clientInitials,
  durationMins,
} from "@/lib/consultations/bookingActions";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { buildSessionsCsv } from "./sessions-csv";

const TIME_RANGE_OPTIONS = [
  { label: "This month", value: "This month" },
  { label: "Last 3 months", value: "Last 3 months" },
  { label: "All time", value: "All time" },
];

/**
 * Status buckets for the log. There is no "Pending" bucket: bookings are
 * created CONFIRMED, so PENDING is unreachable today — it is folded into
 * "Upcoming" rather than given a tab of its own.
 */
type StatusFilter = "All" | "Upcoming" | "Completed" | "No-show" | "Cancelled";

const STATUS_FILTERS: StatusFilter[] = ["All", "Upcoming", "Completed", "No-show", "Cancelled"];

function bucketOf(status: ConsultationBookingStatus): Exclude<StatusFilter, "All"> {
  switch (status) {
    case ConsultationBookingStatus.COMPLETED:
      return "Completed";
    case ConsultationBookingStatus.NO_SHOW:
      return "No-show";
    case ConsultationBookingStatus.CANCELLED:
      return "Cancelled";
    default:
      return "Upcoming";
  }
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{label}</div>
      <div className="text-[13.5px]" style={{ color: "var(--ink)" }}>{children}</div>
    </div>
  );
}

export default function TrainerSessionsListPage() {
  const { fmtDateTime, fmtTime } = useOrgFormat();
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [typesById, setTypesById] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [timeRange, setTimeRange] = useState("This month");
  const [clientFilter, setClientFilter] = useState("All clients");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Wall-clock snapshot for past/future checks — refreshed on load and on row
  // click, never read via Date.now() during render.
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    const nowDate = new Date();
    const params: { from?: string } = {};

    if (timeRange === "This month") {
      params.from = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
    } else if (timeRange === "Last 3 months") {
      params.from = new Date(nowDate.getFullYear(), nowDate.getMonth() - 2, 1)
        .toISOString()
        .slice(0, 10);
    }

    const [bookingRes, typesRes] = await Promise.allSettled([
      consultationsService.getProviderBookings(params),
      consultationsService.getTypes({ includeInactive: true }),
    ]);

    let bookingsOk = false;
    if (bookingRes.status === "fulfilled" && bookingRes.value.success && bookingRes.value.data) {
      setBookings(bookingRes.value.data);
      bookingsOk = true;
    }
    if (typesRes.status === "fulfilled" && typesRes.value.success && typesRes.value.data) {
      setTypesById(
        typesRes.value.data.reduce<Record<string, string>>((acc, item: ConsultationType) => {
          acc[item.id] = item.name;
          return acc;
        }, {}),
      );
    }
    // A failed request must never render as "no sessions".
    setNow(Date.now());
    setError(bookingsOk ? null : "We couldn't load your sessions. Try again shortly.");
  }, [timeRange]);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setLoading(true);
      await load();
      if (mounted) setLoading(false);
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      mounted = false;
      window.clearTimeout(kick);
    };
  }, [load]);

  const clientOptions = useMemo(() => {
    const unique = new Set(bookings.map((b) => clientDisplayName(b)));
    return [
      { label: "All clients", value: "All clients" },
      ...Array.from(unique).map((label) => ({ label, value: label })),
    ];
  }, [bookings]);

  const statusCounts = useMemo(() => {
    return bookings.reduce<Record<StatusFilter, number>>(
      (acc, b) => {
        acc.All += 1;
        acc[bucketOf(b.status)] += 1;
        return acc;
      },
      { All: 0, Upcoming: 0, Completed: 0, "No-show": 0, Cancelled: 0 },
    );
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((b) => {
      const label = clientDisplayName(b);
      const type = typesById[b.consultationTypeId] ?? "Consultation";

      if (statusFilter !== "All" && bucketOf(b.status) !== statusFilter) {
        return false;
      }
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
  }, [bookings, clientFilter, query, statusFilter, typesById]);

  const selected = useMemo(
    () => bookings.find((b) => b.id === selectedId) ?? null,
    [bookings, selectedId],
  );

  const afterAction = async () => {
    setSelectedId(null);
    await load();
  };

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const csv = buildSessionsCsv(filtered, { typesById, fmtDateTime });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sessions-log.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} session${filtered.length === 1 ? "" : "s"}.`);
  };

  return (
    <TrainerDashboardShell
      activeItem="Calendar"
      crumb="Sessions log"
      actions={
        <button className="btn-ghost-v2 sm" disabled={loading || filtered.length === 0} onClick={exportCsv}>
          Export CSV
        </button>
      }
    >
      {/* Page header */}
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>Sessions log</h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          {loading ? "Loading sessions…" : `${filtered.length} session${filtered.length === 1 ? "" : "s"} found`}
        </p>
      </div>

      {/* Error state — never render an API failure as an empty list */}
      {error && (
        <div className="rounded-(--r-2) px-4 py-3 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
          {error}
        </div>
      )}

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

        {/* Status buckets */}
        <div className="flex gap-1 flex-wrap px-5 pb-3.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-[5px] rounded-full cursor-pointer"
              style={{
                background: statusFilter === f ? "var(--ink)" : "var(--bg)",
                color: statusFilter === f ? "var(--bg)" : "var(--fg-3)",
                border: statusFilter === f ? "1px solid var(--ink)" : "1px solid var(--border)",
              }}
            >
              {f}{" "}
              <span style={{ color: statusFilter === f ? "oklch(0.75 0.005 85)" : "var(--fg-4)", marginLeft: 4 }}>
                {statusCounts[f]}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                {["Date", "Client", "Type", "Duration", "Notes", "Status"].map((h) => (
                  <th key={h} className="px-3.5 py-2.5 text-left font-medium font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="px-3.5 py-6"><AsyncSpinner label="Loading sessions" /></td></tr>
              ) : (
                filtered.map((s, i) => {
                  const label = clientDisplayName(s);
                  const typeLabel = typesById[s.consultationTypeId] ?? "Consultation";
                  const note = s.notes?.trim() || "No notes";

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-[var(--bg-2)] cursor-pointer"
                      onClick={() => {
                        setNow(Date.now());
                        setSelectedId(s.id);
                      }}
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}
                    >
                      <td className="px-3.5 py-3 font-mono" style={{ color: "var(--fg-2)" }}>{fmtDateTime(s.startsAt)}</td>
                      <td className="px-3.5 py-3 font-medium" style={{ color: "var(--ink)" }}>{label}</td>
                      <td className="px-3.5 py-3" style={{ color: "var(--ink)" }}>{typeLabel}</td>
                      <td className="px-3.5 py-3 font-mono" style={{ color: "var(--ink)" }}>{durationMins(s)} min</td>
                      <td className="px-3.5 py-3 font-mono text-[12.5px]" style={{ color: "var(--ink)" }}>{note}</td>
                      <td className="px-3.5 py-3"><BookingStatusBadge status={s.status} /></td>
                    </tr>
                  );
                })
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 px-3.5 text-center text-[13px]" style={{ color: "var(--fg-3)" }}>
                    {bookings.length === 0
                      ? "No sessions in this time range yet."
                      : "No sessions match these filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      <Drawer open={selected != null} onClose={() => setSelectedId(null)} title="Session" width={420}>
        {selected && (
          <div className="flex flex-col gap-4 p-1">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0" style={{ background: "var(--trainer-soft)", color: "var(--trainer)" }}>
                {clientInitials(selected)}
              </span>
              <div>
                <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>{clientDisplayName(selected)}</div>
                <div className="mt-1"><BookingStatusBadge status={selected.status} /></div>
              </div>
            </div>

            <DetailRow label="Type">{typesById[selected.consultationTypeId] ?? "Consultation"}</DetailRow>
            <DetailRow label="When">
              {fmtDateTime(selected.startsAt)} – {fmtTime(selected.endsAt)}
              <span className="font-mono text-[11.5px] ml-2" style={{ color: "var(--fg-3)" }}>({durationMins(selected)} min)</span>
            </DetailRow>
            {selected.notes && <DetailRow label="Client notes">{selected.notes}</DetailRow>}
            {selected.completionNote && <DetailRow label="Completion note">{selected.completionNote}</DetailRow>}
            {selected.cancelReason && (
              <DetailRow label={`Cancelled${selected.cancelledBy ? ` by ${selected.cancelledBy.toLowerCase()}` : ""}`}>
                {selected.cancelReason}
              </DetailRow>
            )}

            <div style={{ borderTop: "1px solid var(--border)" }} />

            {/* Remounted per booking so a draft cancel reason can't leak. */}
            <BookingActionsPanel
              key={selected.id}
              booking={selected}
              now={now}
              onActionComplete={afterAction}
            />
          </div>
        )}
      </Drawer>
    </TrainerDashboardShell>
  );
}
