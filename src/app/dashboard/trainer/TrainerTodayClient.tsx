"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import OnboardingBanner from "@/components/OnboardingBanner";
import { BookSessionButton } from "./_actions";
import { progressService, type ClientProfile } from "@/lib/api/progress";
import {
  consultationsService,
  ConsultationBookingStatus,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clientName(c: ClientProfile): string {
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

function durationMins(b: ConsultationBooking): number {
  return Math.max(0, Math.round((new Date(b.endsAt).getTime() - new Date(b.startsAt).getTime()) / 60000));
}

function bookingClientName(b: ConsultationBooking): string {
  const name = [b.clientFirstName, b.clientLastName].filter(Boolean).join(" ");
  return name || "Client";
}

const BOOKING_STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  [ConsultationBookingStatus.CONFIRMED]: { color: "var(--signal-ink)", bg: "var(--signal-soft)", label: "Confirmed" },
  [ConsultationBookingStatus.PENDING]: { color: "oklch(0.42 0.13 75)", bg: "var(--trainer-soft)", label: "Pending" },
  [ConsultationBookingStatus.COMPLETED]: { color: "var(--fg-3)", bg: "var(--bg-2)", label: "Completed" },
  [ConsultationBookingStatus.CANCELLED]: { color: "var(--danger)", bg: "var(--danger-soft)", label: "Cancelled" },
  [ConsultationBookingStatus.NO_SHOW]: { color: "var(--danger)", bg: "var(--danger-soft)", label: "No-show" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function TrainerTodayClient() {
  const { user } = useAuth();
  const { fmtDate, fmtTime } = useOrgFormat();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [now, setNow] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      const [clientsRes, bookingsRes] = await Promise.allSettled([
        progressService.getMyClientProfiles(),
        consultationsService.getProviderBookings(),
      ]);
      if (!active) return;

      let anyOk = false;
      if (clientsRes.status === "fulfilled" && clientsRes.value.success && clientsRes.value.data) {
        setClients(clientsRes.value.data);
        anyOk = true;
      }
      if (bookingsRes.status === "fulfilled" && bookingsRes.value.success && bookingsRes.value.data) {
        setBookings(bookingsRes.value.data);
        anyOk = true;
      }
      setNow(Date.now());
      setError(anyOk ? null : "We couldn't load your dashboard. Try again shortly.");
      setLoading(false);
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, []);

  const upcoming = useMemo(() => {
    return bookings
      .filter(
        (b) =>
          (b.status === ConsultationBookingStatus.CONFIRMED || b.status === ConsultationBookingStatus.PENDING) &&
          new Date(b.startsAt).getTime() >= now,
      )
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  }, [bookings, now]);

  const activeClients = useMemo(() => clients.filter((c) => c.is_active), [clients]);

  const sessionsToday = useMemo(
    () => (now ? upcoming.filter((b) => isSameDay(new Date(b.startsAt), new Date(now))).length : 0),
    [upcoming, now],
  );

  const kpis = [
    { label: "Active clients", value: String(activeClients.length), sub: `${clients.length} total` },
    { label: "Sessions · today", value: String(sessionsToday), sub: sessionsToday === 0 ? "Nothing scheduled" : "Confirmed + pending" },
    { label: "Upcoming sessions", value: String(upcoming.length), sub: "Confirmed + pending" },
    {
      label: "Next session",
      value: upcoming[0] ? fmtTime(upcoming[0].startsAt) : "—",
      sub: upcoming[0] ? fmtDate(upcoming[0].startsAt) : "None scheduled",
    },
  ];

  const headline = user?.first_name ? `Welcome back, ${user.first_name}` : "Today";

  return (
    <TrainerDashboardShell
      activeItem="Today"
      crumb="Today"
      actions={<BookSessionButton />}
    >
      <OnboardingBanner />

      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>{headline}</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          {upcoming.length > 0 ? `${upcoming.length} upcoming · ${activeClients.length} active clients` : "Your training overview"}
        </div>
      </div>

      {error ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
          <div className="font-medium">Couldn&apos;t load dashboard</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
        </div>
      ) : null}

      {loading && clients.length === 0 && bookings.length === 0 ? (
        <AsyncSpinner size="page" label="Loading your dashboard" />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="flex flex-col gap-1.5 rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
                <div className="text-[28px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
                <div className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-3 items-start">
            {/* Upcoming schedule */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Upcoming sessions</h3>
                  <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Confirmed and pending bookings</div>
                </div>
              </div>
              {upcoming.length === 0 ? (
                <div className="px-4.5 py-4"><EmptySlate message="No upcoming sessions." hint="New bookings will show up here." mt="mt-0" /></div>
              ) : (
                upcoming.slice(0, 8).map((b, i, arr) => {
                  const st = BOOKING_STATUS_STYLE[b.status];
                  const start = new Date(b.startsAt);
                  return (
                    <div key={b.id} className="grid gap-3 px-4.5 py-3 items-center" style={{ gridTemplateColumns: "auto 1fr auto", borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <div className="text-center" style={{ minWidth: 56 }}>
                        <div className="font-mono text-[14px]" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{fmtTime(start)}</div>
                        <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{fmtDate(start)}</div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{bookingClientName(b)}</div>
                        <div className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>{durationMins(b)} min</div>
                        {b.notes && <div className="text-[12px] truncate mt-0.5" style={{ color: "var(--fg-3)" }}>{b.notes}</div>}
                      </div>
                      <span className="inline-flex items-center gap-1.25 h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium" style={{ color: st?.color, background: st?.bg, border: `1px solid ${st?.color ?? "var(--border)"}` }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "currentColor" }} />{st?.label ?? b.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Active clients */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Active clients</h3>
                  <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>{activeClients.length} active</div>
                </div>
              </div>
              {activeClients.length === 0 ? (
                <div className="px-4.5 py-4"><EmptySlate message="No active clients yet." mt="mt-0" /></div>
              ) : (
                activeClients.slice(0, 6).map((c, i, arr) => {
                  const name = clientName(c);
                  return (
                    <div key={c._id} className="flex items-center gap-3 px-4.5 py-3.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <span className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>{initials(name)}</span>
                      <div className="min-w-0 flex-1">
                        <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{name}</div>
                        <div className="font-mono text-[12px] truncate mt-0.5" style={{ color: "var(--fg-3)" }}>
                          {c.goals.length > 0 ? c.goals.slice(0, 2).join(" · ") : `Since ${format(new Date(c.created_at), "MMM yyyy")}`}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </TrainerDashboardShell>
  );
}
