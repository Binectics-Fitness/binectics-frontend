"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { AsyncSpinner, BookingStatusBadge, DSCard, PageHeader } from "@/components/ds";
import { bookingPaymentState } from "@/lib/bookings/paymentState";
import SearchableSelect from "@/components/SearchableSelect";
import { toast } from "@/components/Toast";
import {
  bookingTypeName,
  consultationsService,
  ConsultationBookingStatus,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import { clientDisplayName, durationMins } from "@/lib/consultations/bookingActions";
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

function sessionHref(id: string): string {
  return `/dashboard/trainer/sessions/${encodeURIComponent(id)}`;
}

export default function TrainerSessionsListPage() {
  const router = useRouter();
  const { fmtDateTime } = useOrgFormat();
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [typesById, setTypesById] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [timeRange, setTimeRange] = useState("This month");
  const [clientFilter, setClientFilter] = useState("All clients");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      // Own sessions + platform defaults: bookings may point at either.
      consultationsService.getProviderTypeNames(),
    ]);

    let bookingsOk = false;
    if (bookingRes.status === "fulfilled" && bookingRes.value.success && bookingRes.value.data) {
      setBookings(bookingRes.value.data);
      bookingsOk = true;
    }
    if (typesRes.status === "fulfilled" && typesRes.value.success && typesRes.value.data) {
      setTypesById(typesRes.value.data);
    }
    // A failed request must never render as "no sessions".
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
      const type = bookingTypeName(b, typesById) ?? "Consultation";

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
      <PageHeader
        className="mb-0!"
        title={{ before: "Sessions ", emphasis: "log" }}
        subtitle={loading ? "Loading sessions…" : `${filtered.length} session${filtered.length === 1 ? "" : "s"} found`}
      />

      {/* Error state — never render an API failure as an empty list */}
      {error && (
        <div className="rounded-(--r-2) px-4 py-3 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
          {error}
        </div>
      )}

      {/* Card with filters + table */}
      <DSCard>
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
                  const typeLabel = bookingTypeName(s, typesById) ?? "Consultation";
                  const note = s.notes?.trim() || "No notes";

                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-[var(--bg-2)] cursor-pointer"
                      onClick={() => router.push(sessionHref(s.id))}
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}
                    >
                      <td className="px-3.5 py-3 font-mono" style={{ color: "var(--fg-2)" }}>{fmtDateTime(s.startsAt)}</td>
                      <td className="px-3.5 py-3 font-medium" style={{ color: "var(--ink)" }}>
                        {/* The row is clickable; the link is the keyboard and middle-click route. */}
                        <Link
                          href={sessionHref(s.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                          style={{ color: "var(--ink)", textDecoration: "none" }}
                        >
                          {label}
                        </Link>
                      </td>
                      <td className="px-3.5 py-3" style={{ color: "var(--ink)" }}>{typeLabel}</td>
                      <td className="px-3.5 py-3 font-mono" style={{ color: "var(--ink)" }}>{durationMins(s)} min</td>
                      <td className="px-3.5 py-3 font-mono text-[12.5px]" style={{ color: "var(--ink)" }}>{note}</td>
                      <td className="px-3.5 py-3"><BookingStatusBadge status={s.status} awaitingPayment={bookingPaymentState(s) === "awaiting_payment"} /></td>
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
      </DSCard>
    </TrainerDashboardShell>
  );
}
