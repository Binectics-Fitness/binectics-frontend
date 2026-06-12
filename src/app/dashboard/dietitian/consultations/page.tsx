"use client";

import { useEffect, useMemo, useState } from "react";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import {
  consultationsService,
  ConsultationBookingStatus,
  type ConsultationBooking,
  type ConsultationType,
} from "@/lib/api/consultations";

/* ─── Data ──────────────────────────────────────────────── */

type Filter = "Upcoming" | "Past" | "Cancelled";

function getClientLabel(booking: ConsultationBooking) {
  return `Client ${booking.clientUserId.slice(-6).toUpperCase()}`;
}

function toFilter(status: ConsultationBookingStatus): Filter {
  if (
    status === ConsultationBookingStatus.PENDING ||
    status === ConsultationBookingStatus.CONFIRMED
  ) {
    return "Upcoming";
  }
  if (status === ConsultationBookingStatus.CANCELLED) {
    return "Cancelled";
  }
  return "Past";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─── Helpers ────────────────────────────────────────────── */

function StatusBadge({ status }: { status: "Upcoming" | "Past" | "Cancelled" }) {
  const map: Record<string, { bg: string; color: string }> = {
    Upcoming: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
    Past: { bg: "var(--bg-3)", color: "var(--fg-2)" },
    Cancelled: { bg: "var(--danger-soft)", color: "var(--danger)" },
  };
  const s = map[status];
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

function TypePill({ type }: { type: "Initial" | "Follow-up" | "Review" }) {
  const map: Record<string, { bg: string; color: string }> = {
    Initial: { bg: "var(--dietitian-soft)", color: "var(--dietitian)" },
    "Follow-up": { bg: "var(--bg-2)", color: "var(--fg-2)" },
    Review: { bg: "var(--trainer-soft)", color: "oklch(0.42 0.13 75)" },
  };
  const s = map[type];
  return (
    <span
      className="font-mono text-[9.5px] px-1.5 py-[2px] rounded-(--r-1) uppercase tracking-[0.04em]"
      style={{ background: s.bg, color: s.color }}
    >
      {type}
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

export default function DietitianConsultationsPage() {
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [typesById, setTypesById] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Filter>("Upcoming");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const [bookingsRes, typesRes] = await Promise.all([
        consultationsService.getProviderBookings(),
        consultationsService.getTypes({ includeInactive: true }),
      ]);

      if (!mounted) return;

      if (bookingsRes.success && bookingsRes.data) {
        setBookings(bookingsRes.data);
      } else {
        setBookings([]);
      }

      if (typesRes.success && typesRes.data) {
        setTypesById(
          typesRes.data.reduce<Record<string, string>>(
            (acc, type: ConsultationType) => {
              acc[type.id] = type.name;
              return acc;
            },
            {},
          ),
        );
      } else {
        setTypesById({});
      }

      setLoading(false);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const counts = useMemo(() => {
    return bookings.reduce<Record<Filter, number>>(
      (acc, booking) => {
        acc[toFilter(booking.status)] += 1;
        return acc;
      },
      { Upcoming: 0, Past: 0, Cancelled: 0 },
    );
  }, [bookings]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter((booking) => {
      const tab = toFilter(booking.status);
      if (tab !== activeFilter) return false;
      if (!q) return true;

      const client = getClientLabel(booking).toLowerCase();
      const type = (typesById[booking.consultationTypeId] ?? "consultation")
        .toLowerCase();
      return client.includes(q) || type.includes(q);
    });
  }, [activeFilter, bookings, query, typesById]);

  const kpis = useMemo(() => {
    const completed = counts.Past;
    const noShow = bookings.filter(
      (b) => b.status === ConsultationBookingStatus.NO_SHOW,
    ).length;
    const today = bookings.filter((b) => {
      const day = new Date(b.startsAt).toDateString();
      return day === new Date().toDateString();
    }).length;

    return [
      { label: "Today's consults", value: String(today), delta: `${counts.Upcoming} upcoming` },
      { label: "Upcoming", value: String(counts.Upcoming), delta: "Scheduled" },
      { label: "Completed", value: String(completed), delta: "All loaded" },
      { label: "No-shows", value: String(noShow), delta: "Requires follow-up", deltaColor: "var(--signal-ink)" },
    ];
  }, [bookings, counts]);

  return (
    <DietitianDashboardShell activeItem="Consultations" crumb="Consultations">
      {/* Heading */}
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Consultations
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Manage your consultation schedule and history
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-(--r-3) p-[14px_16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className="text-[22px] font-medium mt-1" style={{ color: "var(--ink)", letterSpacing: "-0.018em", fontVariantNumeric: "tabular-nums" }}>
              {kpi.value}
            </div>
            <div className="font-mono text-[11px] mt-1" style={{ color: kpi.deltaColor || "var(--signal-ink)" }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="rounded-(--r-3) p-[10px_14px] flex gap-3.5 items-center flex-wrap" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex-1 min-w-[240px] flex items-center gap-2 h-8 px-3 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input className="flex-1 border-0 bg-transparent text-[13px] outline-none" placeholder="Search by client name..." style={{ color: "var(--ink)" }} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(["Upcoming", "Past", "Cancelled"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-[5px] rounded-full cursor-pointer"
              style={{
                background: activeFilter === f ? "var(--ink)" : "var(--bg)",
                color: activeFilter === f ? "var(--bg)" : "var(--fg-3)",
                border: activeFilter === f ? "1px solid var(--ink)" : "1px solid var(--border)",
              }}
            >
              {f} <span style={{ color: activeFilter === f ? "oklch(0.75 0.005 85)" : "var(--fg-4)", marginLeft: 4 }}>{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Client", "Date / time", "Type", "Duration", "Status"].map((h) => (
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
              {filtered.map((c) => {
                const type = typesById[c.consultationTypeId] ?? "Consultation";
                const statusLabel = toFilter(c.status);
                const duration = Math.max(
                  0,
                  Math.round(
                    (new Date(c.endsAt).getTime() - new Date(c.startsAt).getTime()) /
                      60000,
                  ),
                );
                const client = getClientLabel(c);
                const initials = client.replace("Client ", "").slice(0, 2);

                return (
                <tr key={c.id} className="hover:bg-[var(--bg-2)] cursor-pointer">
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex gap-2.5 items-center">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: "var(--dietitian-soft)", color: "var(--dietitian)" }}>
                        {initials}
                      </span>
                      <span className="font-medium" style={{ color: "var(--ink)" }}>{client}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-2)" }}>{formatDate(c.startsAt)}</span>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <TypePill type={type.includes("Initial") ? "Initial" : type.includes("Review") ? "Review" : "Follow-up"} />
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>{duration} min</span>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <StatusBadge status={statusLabel} />
                  </td>
                </tr>
                );
              })}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 px-4.5 text-center text-[13px]" style={{ color: "var(--fg-3)" }}>
                    No consultations match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DietitianDashboardShell>
  );
}
