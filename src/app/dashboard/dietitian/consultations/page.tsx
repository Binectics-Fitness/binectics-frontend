"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { AsyncSpinner, EmptySlate, Drawer } from "@/components/ds";
import { toast } from "@/components/Toast";
import {
  consultationsService,
  ConsultationBookingStatus,
  type ConsultationBooking,
  type ConsultationType,
} from "@/lib/api/consultations";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

/* ─── Data ──────────────────────────────────────────────── */

type Filter = "Upcoming" | "Past" | "Cancelled";

function clientName(booking: ConsultationBooking): string {
  const name = [booking.clientFirstName, booking.clientLastName].filter(Boolean).join(" ");
  return name || "Client";
}

function clientInitials(booking: ConsultationBooking): string {
  const parts = clientName(booking).trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (parts[0] ?? "?").slice(0, 2).toUpperCase();
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

function durationMins(b: ConsultationBooking): number {
  return Math.max(0, Math.round((new Date(b.endsAt).getTime() - new Date(b.startsAt).getTime()) / 60000));
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  [ConsultationBookingStatus.PENDING]: { bg: "var(--trainer-soft)", color: "oklch(0.42 0.13 75)", label: "Pending" },
  [ConsultationBookingStatus.CONFIRMED]: { bg: "var(--signal-soft)", color: "var(--signal-ink)", label: "Confirmed" },
  [ConsultationBookingStatus.COMPLETED]: { bg: "var(--bg-3)", color: "var(--fg-2)", label: "Completed" },
  [ConsultationBookingStatus.CANCELLED]: { bg: "var(--danger-soft)", color: "var(--danger)", label: "Cancelled" },
  [ConsultationBookingStatus.NO_SHOW]: { bg: "var(--danger-soft)", color: "var(--danger)", label: "No-show" },
};

/* ─── Helpers ────────────────────────────────────────────── */

function StatusBadge({ status }: { status: ConsultationBookingStatus }) {
  const s = STATUS_STYLE[status] ?? { bg: "var(--bg-3)", color: "var(--fg-2)", label: status };
  return (
    <span
      className="font-mono text-[10.5px] px-[7px] py-[2px] rounded-full uppercase tracking-[0.04em] inline-flex items-center gap-[5px]"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="w-[5px] h-[5px] rounded-full" style={{ background: "currentColor" }} />
      {s.label}
    </span>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{label}</div>
      <div className="text-[13.5px]" style={{ color: "var(--ink)" }}>{children}</div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

export default function DietitianConsultationsPage() {
  const { fmtDateTime, fmtTime } = useOrgFormat();
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [typesById, setTypesById] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<Filter>("Upcoming");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [acting, setActing] = useState<"complete" | "no-show" | "cancel" | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  // Wall-clock snapshot for past/future checks — refreshed on load and on row
  // click, never read via Date.now() during render.
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    const [bookingsRes, typesRes] = await Promise.allSettled([
      consultationsService.getProviderBookings(),
      consultationsService.getTypes({ includeInactive: true }),
    ]);

    let bookingsOk = false;
    if (bookingsRes.status === "fulfilled" && bookingsRes.value.success && bookingsRes.value.data) {
      setBookings(bookingsRes.value.data);
      bookingsOk = true;
    }
    if (typesRes.status === "fulfilled" && typesRes.value.success && typesRes.value.data) {
      setTypesById(
        typesRes.value.data.reduce<Record<string, string>>((acc, type: ConsultationType) => {
          acc[type.id] = type.name;
          return acc;
        }, {}),
      );
    }
    // The list is only trustworthy when the bookings call itself succeeded —
    // a failure must never render as "no consultations".
    setNow(Date.now());
    setError(bookingsOk ? null : "We couldn't load your consultations. Try again shortly.");
  }, []);

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

  const selected = useMemo(
    () => bookings.find((b) => b.id === selectedId) ?? null,
    [bookings, selectedId],
  );

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

      const client = clientName(booking).toLowerCase();
      const type = (typesById[booking.consultationTypeId] ?? "consultation").toLowerCase();
      return client.includes(q) || type.includes(q);
    });
  }, [activeFilter, bookings, query, typesById]);

  const kpis = useMemo(() => {
    const completed = bookings.filter(
      (b) => b.status === ConsultationBookingStatus.COMPLETED,
    ).length;
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

  // ── Actions ────────────────────────────────────────────────
  const runAction = async (
    kind: "complete" | "no-show" | "cancel",
    booking: ConsultationBooking,
  ) => {
    setActing(kind);
    try {
      const res =
        kind === "complete"
          ? await consultationsService.completeBooking(booking.id)
          : kind === "no-show"
            ? await consultationsService.markNoShow(booking.id)
            : await consultationsService.cancelBooking(
                booking.id,
                cancelReason.trim() ? { reason: cancelReason.trim() } : {},
              );
      if (res.success) {
        toast.success(
          kind === "complete"
            ? "Session marked as completed."
            : kind === "no-show"
              ? "Session marked as a no-show."
              : "Session cancelled.",
        );
        setCancelReason("");
        setSelectedId(null);
        await load();
      } else {
        toast.error(res.message ?? "That didn't work — try again.");
      }
    } catch {
      toast.error("That didn't work — try again.");
    }
    setActing(null);
  };

  // ── Drawer action availability ─────────────────────────────
  const actionable =
    selected != null &&
    (selected.status === ConsultationBookingStatus.PENDING ||
      selected.status === ConsultationBookingStatus.CONFIRMED);
  const isPast = selected != null && now > 0 && new Date(selected.startsAt).getTime() < now;

  return (
    <DietitianDashboardShell activeItem="Consultations" crumb="Consultations">
      {/* Heading */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
            Consultations
          </h1>
          <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
            Manage your consultation schedule and history
          </p>
        </div>
        <Link
          href="/dashboard/dietitian/calendar"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-(--r-2) text-[13px] no-underline"
          style={{ border: "1px solid var(--border)", color: "var(--ink)", background: "var(--bg)" }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>
          Calendar
        </Link>
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

      {/* Error state — never render an API failure as an empty list */}
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
              {loading ? (
                <tr><td colSpan={5} className="px-4.5 py-6"><AsyncSpinner label="Loading consultations" /></td></tr>
              ) : (
                filtered.map((c) => {
                  const type = typesById[c.consultationTypeId] ?? "Consultation";
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[var(--bg-2)] cursor-pointer"
                      onClick={() => {
                        setNow(Date.now());
                        setSelectedId(c.id);
                      }}
                    >
                      <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                        <div className="flex gap-2.5 items-center">
                          <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: "var(--dietitian-soft)", color: "var(--dietitian)" }}>
                            {clientInitials(c)}
                          </span>
                          <span className="font-medium" style={{ color: "var(--ink)" }}>{clientName(c)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                        <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-2)" }}>{fmtDateTime(c.startsAt)}</span>
                      </td>
                      <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                        <span className="font-mono text-[9.5px] px-1.5 py-[2px] rounded-(--r-1) uppercase tracking-[0.04em]" style={{ background: "var(--dietitian-soft)", color: "var(--dietitian)" }}>
                          {type}
                        </span>
                      </td>
                      <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                        <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>{durationMins(c)} min</span>
                      </td>
                      <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                        <StatusBadge status={c.status} />
                      </td>
                    </tr>
                  );
                })
              )}
              {!loading && !error && filtered.length === 0 && (
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

      {/* Detail drawer */}
      <Drawer open={selected != null} onClose={() => setSelectedId(null)} title="Consultation" width={420}>
        {selected && (
          <div className="flex flex-col gap-4 p-1">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0" style={{ background: "var(--dietitian-soft)", color: "var(--dietitian)" }}>
                {clientInitials(selected)}
              </span>
              <div>
                <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>{clientName(selected)}</div>
                <div className="mt-1"><StatusBadge status={selected.status} /></div>
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

            {actionable ? (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 flex-wrap">
                  <button
                    className="btn-primary-v2 sm"
                    disabled={acting !== null}
                    onClick={() => void runAction("complete", selected)}
                  >
                    {acting === "complete" ? "Completing…" : "Complete"}
                  </button>
                  <button
                    className="btn-ghost-v2 sm"
                    disabled={acting !== null || !isPast}
                    onClick={() => void runAction("no-show", selected)}
                  >
                    {acting === "no-show" ? "Marking…" : "Mark no-show"}
                  </button>
                </div>
                {!isPast && (
                  <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
                    No-show becomes available once the session start time has passed.
                  </div>
                )}

                {!isPast && (
                  <div className="flex flex-col gap-2 mt-1">
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Cancel this session</div>
                    <textarea
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      maxLength={500}
                      placeholder="Reason (optional — shared with the client)"
                      className="rounded-(--r-2) px-3 py-2.5 text-[13px] resize-y"
                      style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", minHeight: 60 }}
                    />
                    <button
                      className="btn-ghost-v2 sm self-start"
                      disabled={acting !== null}
                      style={{ color: "var(--danger)" }}
                      onClick={() => void runAction("cancel", selected)}
                    >
                      {acting === "cancel" ? "Cancelling…" : "Cancel session"}
                    </button>
                  </div>
                )}
                {isPast && (
                  <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
                    Cancelling is only available before the session starts.
                  </div>
                )}
              </div>
            ) : (
              <EmptySlate
                message={`No actions available for ${STATUS_STYLE[selected.status]?.label.toLowerCase() ?? selected.status.toLowerCase()} sessions.`}
                mt="mt-0"
              />
            )}
          </div>
        )}
      </Drawer>
    </DietitianDashboardShell>
  );
}
