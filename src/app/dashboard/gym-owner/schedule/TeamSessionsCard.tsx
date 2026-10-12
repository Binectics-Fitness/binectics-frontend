"use client";

import { useCallback, useEffect, useState } from "react";
import { AsyncSpinner, BookingStatusBadge, DSCard, Eyebrow } from "@/components/ds";
import { RescheduleBookingButton } from "@/components/bookings/RescheduleBookingButton";
import { bookingPaymentState } from "@/lib/bookings/paymentState";
import {
  bookingTypeName,
  consultationsService,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import { clientDisplayName, isActionable } from "@/lib/consultations/bookingActions";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

/** How far ahead the card looks. */
export const TEAM_SESSIONS_WINDOW_DAYS = 14;

type State =
  | { kind: "loading" }
  | { kind: "hidden" }
  | { kind: "error"; message: string }
  | { kind: "ready"; sessions: ConsultationBooking[] };

/**
 * The team's upcoming 1:1 sessions (every trainer's bookings made under this
 * gym), with "Move session" for each. The API decides who may see and move
 * them: the owner and staff whose role holds bookings:manage. For anyone
 * else it answers 404, and the card stays out of the way. A move is held to
 * the trainer's own working hours, days off and custom hours.
 */
export function TeamSessionsCard({ orgId }: { orgId: string | undefined }) {
  const { fmtDateTime } = useOrgFormat();
  const [state, setState] = useState<State>({ kind: "loading" });

  const load = useCallback(async () => {
    if (!orgId) return;
    const from = new Date();
    const to = new Date(from.getTime() + TEAM_SESSIONS_WINDOW_DAYS * 86_400_000);
    const res = await consultationsService.getOrganizationBookings(orgId, {
      from: from.toISOString(),
      to: to.toISOString(),
    });
    if (!res.success) {
      if (res.status === 404 || res.status === 403) {
        setState({ kind: "hidden" });
        return;
      }
      setState({
        kind: "error",
        message: res.message || "We couldn't load your team's sessions. Try again shortly.",
      });
      return;
    }
    const sessions = (res.data ?? [])
      .filter((b) => isActionable(b.status))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    setState({ kind: "ready", sessions });
  }, [orgId]);

  useEffect(() => {
    const kick = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(kick);
  }, [load]);

  if (!orgId || state.kind === "hidden") return null;

  return (
    <section data-testid="team-sessions" aria-label="1:1 sessions">
      <DSCard className="p-5.5">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>
            1:1 sessions
          </h2>
          <Eyebrow>Next {TEAM_SESSIONS_WINDOW_DAYS} days</Eyebrow>
        </div>
        {state.kind === "loading" && <AsyncSpinner label="Loading sessions" />}
        {state.kind === "error" && (
          <p role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>
            {state.message}
          </p>
        )}
        {state.kind === "ready" && state.sessions.length === 0 && (
          <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
            No 1:1 sessions booked with your trainers in the next {TEAM_SESSIONS_WINDOW_DAYS} days.
          </p>
        )}
        {state.kind === "ready" && state.sessions.length > 0 && (
          <ul className="flex flex-col">
            {state.sessions.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                    {clientDisplayName(s)}
                    <span style={{ color: "var(--fg-3)", fontWeight: 400 }}>
                      {" "}with {s.providerName || "a trainer"}
                    </span>
                  </div>
                  <div className="font-mono text-[11.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                    {fmtDateTime(s.startsAt)} · {bookingTypeName(s, {}) ?? "Session"}
                  </div>
                </div>
                <BookingStatusBadge
                  status={s.status}
                  awaitingPayment={bookingPaymentState(s) === "awaiting_payment"}
                />
                <RescheduleBookingButton
                  key={`${s.id}-${s.startsAt}`}
                  booking={s}
                  audience="staff"
                  onRescheduled={load}
                />
              </li>
            ))}
          </ul>
        )}
      </DSCard>
    </section>
  );
}
