"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import { AsyncSpinner, BookingStatusBadge, DSCard, Eyebrow } from "@/components/ds";
import { bookingPaymentState } from "@/lib/bookings/paymentState";
import { BookingActionsPanel } from "@/components/BookingActionsPanel";
import { RescheduleBookingModal } from "@/components/bookings/RescheduleBookingModal";
import { toast } from "@/components/Toast";
import { consultationsService, type ConsultationBooking } from "@/lib/api/consultations";
import {
  clientDisplayName,
  clientInitials,
  durationMins,
  isActionable,
} from "@/lib/consultations/bookingActions";
import { bookingAmountLabel, bookingMoneyState, receiptHref } from "@/lib/bookings/receipt";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; booking: ConsultationBooking }
  | { kind: "missing" }
  | { kind: "error"; message: string };

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <DSCard className="p-5.5">
      <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>{title}</h3>
      {children}
    </DSCard>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <Eyebrow>{label}</Eyebrow>
      <div className="text-[13.5px] leading-relaxed" style={{ color: "var(--ink)" }}>{children}</div>
    </div>
  );
}

/**
 * One session, for the trainer it is with, from GET
 * /consultations/bookings/:id (a 404 for anyone but its client and its
 * provider). Actions are the provider endpoints the sessions list already
 * used: complete, no-show and cancel through BookingActionsPanel, and
 * reschedule through the slot picker clients use, so a new time is always
 * one the trainer offers.
 *
 * Workout logs, PRs and sets have no backend for a booking, so they are not
 * shown.
 */
export default function TrainerSessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = React.use(params);
  const { fmtDateTime, fmtTime } = useOrgFormat();
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  // Wall-clock snapshot for the actions' past/future checks, taken on load.
  const [now, setNow] = useState(0);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await consultationsService.getBooking(sessionId);
      setNow(Date.now());
      if (res.success && res.data) {
        setState({ kind: "ready", booking: res.data });
      } else if (res.status === 404 || res.status === 403 || res.status === 400) {
        setState({ kind: "missing" });
      } else {
        setState({ kind: "error", message: res.message ?? "We couldn't load this session. Try again shortly." });
      }
    } catch {
      setState({ kind: "error", message: "We couldn't load this session. Try again shortly." });
    }
  }, [sessionId]);

  useEffect(() => {
    const kick = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(kick);
  }, [load]);

  const booking = state.kind === "ready" ? state.booking : null;
  const name = booking ? clientDisplayName(booking) : "Session";

  return (
    <TrainerDashboardShell
      activeItem="Calendar"
      crumb="Session"
      actions={
        booking && isActionable(booking.status) ? (
          <button type="button" className="btn-ghost-v2 sm" onClick={() => setRescheduleOpen(true)}>
            Reschedule
          </button>
        ) : undefined
      }
    >
      <div className="text-[13px] -mt-2 mb-1" style={{ color: "var(--fg-3)" }}>
        <Link href="/dashboard/trainer/sessions" className="hover:underline" style={{ color: "var(--fg-3)", textDecoration: "none" }}>
          Sessions log
        </Link>
        <span className="mx-1.5" style={{ color: "var(--fg-4)" }}>/</span>
        <span className="font-medium" style={{ color: "var(--ink)" }}>{name}</span>
      </div>

      {state.kind === "loading" && (
        <DSCard className="p-8">
          <AsyncSpinner label="Loading session" />
        </DSCard>
      )}

      {state.kind === "missing" && (
        <div className="rounded-(--r-3) p-6" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} role="alert">
          <h1 className="text-[20px] font-medium" style={{ color: "var(--ink)" }}>Session not found</h1>
          <p className="text-[13.5px] mt-2" style={{ color: "var(--fg-2)" }}>
            This session doesn&apos;t exist or isn&apos;t one of yours.
          </p>
          <Link href="/dashboard/trainer/sessions" className="btn-ghost-v2 sm mt-4 inline-flex">Back to sessions</Link>
        </div>
      )}

      {state.kind === "error" && (
        <div className="rounded-(--r-2) px-4 py-3 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }} role="alert">
          {state.message}
          <button type="button" className="btn-ghost-v2 sm ml-3" onClick={() => void load()}>Try again</button>
        </div>
      )}

      {booking && (
        <>
          <div className="flex items-center gap-3.5">
            <span className="w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
              {clientInitials(booking)}
            </span>
            <div className="min-w-0">
              <h1 className="text-[26px] sm:text-[30px] font-medium" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
                {name}
              </h1>
              <p className="text-[13.5px] mt-1 flex flex-wrap items-center gap-2" style={{ color: "var(--fg-3)" }}>
                <span>{booking.consultationTypeName || "Consultation"}</span>
                <span>&middot;</span>
                <span>{fmtDateTime(booking.startsAt)} – {fmtTime(booking.endsAt)}</span>
                <span>&middot;</span>
                <span>{durationMins(booking)} min</span>
                <BookingStatusBadge status={booking.status} awaitingPayment={bookingPaymentState(booking) === "awaiting_payment"} />
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3.5">
            <div className="flex flex-col gap-3.5">
              <Card title="Details">
                <div className="flex flex-col gap-4">
                  <DetailRow label="Client notes">{booking.notes?.trim() || "No notes from the client."}</DetailRow>
                  {booking.completionNote && <DetailRow label="Completion note">{booking.completionNote}</DetailRow>}
                  {booking.cancelReason && (
                    <DetailRow label={`Cancelled${booking.cancelledBy ? ` by ${booking.cancelledBy.toLowerCase()}` : ""}`}>
                      {booking.cancelReason}
                    </DetailRow>
                  )}
                  <DetailRow label="Time zones">
                    Yours {booking.providerTimezone}
                    {booking.clientTimezone && booking.clientTimezone !== booking.providerTimezone
                      ? ` · client ${booking.clientTimezone}`
                      : ""}
                  </DetailRow>
                </div>
              </Card>

              <Card title="Actions">
                {/* Remounted per load so a draft cancel reason can't outlive an action. */}
                <BookingActionsPanel key={`${booking.id}-${booking.status}`} booking={booking} now={now} onActionComplete={load} />
              </Card>
            </div>

            <Card title="Payment">
              <PaymentSummary booking={booking} fmtDateTime={fmtDateTime} />
            </Card>
          </div>

          <RescheduleBookingModal
            key={`reschedule-${booking.id}-${booking.startsAt}-${rescheduleOpen}`}
            open={rescheduleOpen}
            booking={booking}
            audience="provider"
            onClose={() => setRescheduleOpen(false)}
            onConfirm={async (startsAt, reason) => {
              const res = await consultationsService.rescheduleBooking(booking.id, { startsAt, reason });
              if (res.success) {
                toast.success("Session rescheduled.");
                setRescheduleOpen(false);
                await load();
              }
              return res;
            }}
          />
        </>
      )}
    </TrainerDashboardShell>
  );
}

function PaymentSummary({
  booking,
  fmtDateTime,
}: {
  booking: ConsultationBooking;
  fmtDateTime: (d: string | Date | null | undefined) => string;
}) {
  const money = bookingMoneyState(booking);
  const amount = bookingAmountLabel(booking);

  if (money === "free") {
    return <p className="text-[13.5px]" style={{ color: "var(--fg-2)" }} data-testid="payment-state">Free session. Nothing to pay.</p>;
  }

  return (
    <div className="flex flex-col gap-3 text-[13.5px]" data-testid="payment-state">
      <div className="flex justify-between items-baseline gap-3">
        <span style={{ color: "var(--fg-2)" }}>
          {money === "paid" ? "Paid" : money === "awaiting_payment" ? "Awaiting payment" : "Not paid"}
        </span>
        <span className="font-mono text-[17px] font-medium" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{amount}</span>
      </div>
      {money === "paid" && (
        <>
          <div style={{ color: "var(--fg-3)" }}>
            {booking.receipt?.paidAt ? `Paid ${fmtDateTime(booking.receipt.paidAt)}` : "Payment date not recorded."}
          </div>
          {booking.receipt?.reference && (
            <div className="font-mono text-[12px] break-all" style={{ color: "var(--fg-3)" }}>Ref {booking.receipt.reference}</div>
          )}
          <Link href={receiptHref(booking.id)} className="btn-ghost-v2 sm self-start">Receipt</Link>
        </>
      )}
      {money === "awaiting_payment" && (
        <div style={{ color: "var(--fg-3)" }}>
          The client hasn&apos;t paid yet.
          {booking.payment?.expiresAt ? ` The slot is held until ${fmtDateTime(booking.payment.expiresAt)}, then released.` : ""}
        </div>
      )}
      {money === "unpaid" && (
        <div style={{ color: "var(--fg-3)" }}>No payment was recorded for this session.</div>
      )}
    </div>
  );
}
