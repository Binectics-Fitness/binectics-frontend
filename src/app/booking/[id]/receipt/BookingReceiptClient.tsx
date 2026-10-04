"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { MarketplaceAuthCluster } from "@/components/MarketplaceAuthCluster";
import { AsyncSpinner, BookingStatusBadge } from "@/components/ds";
import { bookingPaymentState } from "@/lib/bookings/paymentState";
import { useAuth } from "@/contexts/AuthContext";
import {
  ConsultationBookingStatus,
  consultationsService,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import { clientDisplayName, durationMins } from "@/lib/consultations/bookingActions";
import {
  bookingAmountLabel,
  bookingMoneyState,
  formatViewerDateTime,
  providerDisplayName,
  type BookingMoneyState,
} from "@/lib/bookings/receipt";
import { UserRole } from "@/lib/types";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; booking: ConsultationBooking }
  | { kind: "missing" }
  | { kind: "error"; message: string };

const EYEBROW: Record<BookingMoneyState, string> = {
  paid: "Receipt · paid",
  free: "Receipt · free session",
  awaiting_payment: "Booking summary · awaiting payment",
  unpaid: "Booking summary · not paid",
};

const TOTAL_LABEL: Record<BookingMoneyState, string> = {
  paid: "Total paid",
  free: "Total",
  awaiting_payment: "Total due",
  unpaid: "Total (not paid)",
};

/** Where "Back" goes: the viewer's own list of this booking. */
function backLink(booking: ConsultationBooking, viewerId?: string, role?: UserRole): { href: string; label: string } {
  if (viewerId && viewerId === booking.clientUserId) {
    return { href: "/dashboard/bookings", label: "Back to bookings" };
  }
  if (role === UserRole.TRAINER) {
    return { href: `/dashboard/trainer/sessions/${encodeURIComponent(booking.id)}`, label: "Back to session" };
  }
  if (role === UserRole.DIETITIAN) {
    return { href: "/dashboard/dietitian/consultations", label: "Back to consultations" };
  }
  return { href: "/dashboard", label: "Back to dashboard" };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span style={{ color: "var(--fg-3)" }}>{label}</span>
      <span className="text-right font-mono break-all" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
        {children}
      </span>
    </div>
  );
}

/**
 * A booking's receipt, read from GET /consultations/bookings/:id. The API
 * answers only the booking's client and its provider (anyone else gets a
 * 404), so this page never decides access itself.
 *
 * A booking that was not paid is shown as what it is, a summary with its
 * real status, never as a receipt. There is no PDF: printing the page is
 * the download.
 */
export function BookingReceiptClient({ bookingId }: { bookingId: string }) {
  const { user } = useAuth();
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    try {
      const res = await consultationsService.getBooking(bookingId);
      if (res.success && res.data) {
        setState({ kind: "ready", booking: res.data });
      } else if (res.status === 404 || res.status === 403 || res.status === 400) {
        setState({ kind: "missing" });
      } else {
        setState({ kind: "error", message: res.message ?? "We couldn't load this receipt. Try again shortly." });
      }
    } catch {
      setState({ kind: "error", message: "We couldn't load this receipt. Try again shortly." });
    }
  }, [bookingId]);

  useEffect(() => {
    const kick = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(kick);
  }, [load]);

  return (
    <div style={{ background: "var(--bg-2)", minHeight: "100vh" }} className="print:bg-white">
      <header className="border-b border-border print:hidden" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-320 flex items-center justify-between h-14 px-5 sm:px-8">
          <Link href="/"><BinecticsLockup /></Link>
          <nav className="flex items-center gap-4 text-[13.5px]">
            <Link href="/marketplace" style={{ color: "var(--fg-2)", textDecoration: "none" }}>Marketplace</Link>
            <MarketplaceAuthCluster compact />
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-160 px-4 sm:px-6 py-8 print:p-0">
        {state.kind === "loading" && (
          <div className="rounded-(--r-3) p-8" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <AsyncSpinner label="Loading receipt" />
          </div>
        )}

        {state.kind === "missing" && (
          <div className="rounded-(--r-3) p-8" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} role="alert">
            <h1 className="text-[20px] font-medium" style={{ color: "var(--ink)" }}>Receipt not found</h1>
            <p className="text-[13.5px] mt-2 leading-relaxed" style={{ color: "var(--fg-2)" }}>
              We couldn&apos;t find this booking. A receipt is only visible to the person who booked the session and the provider it&apos;s with, so check you&apos;re signed in to the right account.
            </p>
            <Link href="/dashboard/bookings" className="btn-ghost-v2 sm mt-4 inline-flex">Go to your bookings</Link>
          </div>
        )}

        {state.kind === "error" && (
          <div className="rounded-(--r-3) p-6" style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }} role="alert">
            <div className="text-[14px] font-medium">Couldn&apos;t load the receipt</div>
            <div className="text-[13px] mt-1" style={{ color: "var(--ink)" }}>{state.message}</div>
            <button type="button" className="btn-ghost-v2 sm mt-3" onClick={() => void load()}>Try again</button>
          </div>
        )}

        {state.kind === "ready" && (
          <ReceiptCard booking={state.booking} back={backLink(state.booking, user?.id, user?.role)} />
        )}
      </div>
    </div>
  );
}

function ReceiptCard({ booking, back }: { booking: ConsultationBooking; back: { href: string; label: string } }) {
  const money = bookingMoneyState(booking);
  const amount = bookingAmountLabel(booking);
  const provider = providerDisplayName(booking) ?? "Your provider";
  const client = clientDisplayName(booking);
  const typeName = booking.consultationTypeName || "Consultation";
  const paidAt = booking.receipt?.paidAt ?? null;

  return (
    <div
      className="rounded-(--r-3) p-6 sm:p-10 print:border-0 print:p-0"
      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
      data-testid="booking-receipt"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
            {EYEBROW[money]}
          </div>
          <h1 className="text-[24px] sm:text-[26px] font-medium mt-1.5" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
            Booking {booking.id.slice(-8).toUpperCase()}
          </h1>
        </div>
        <div className="flex flex-col sm:items-end gap-1.5">
          <BookingStatusBadge status={booking.status} awaitingPayment={bookingPaymentState(booking) === "awaiting_payment"} />
          {paidAt && (
            <div className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>
              Paid {formatViewerDateTime(paidAt)}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4.5 mb-5.5" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-1.5" style={{ color: "var(--fg-3)" }}>Provider</div>
          <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{provider}</div>
        </div>
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-1.5" style={{ color: "var(--fg-3)" }}>Client</div>
          <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{client}</div>
        </div>
      </div>

      <table className="w-full mb-5.5 text-[13.5px]" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr className="text-left">
            <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] font-medium pb-2.5" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}>Session</th>
            <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] font-medium pb-2.5 text-right" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="py-3 pr-3" style={{ borderBottom: "1px solid var(--border)", color: "var(--ink)" }}>
              {typeName} &middot; {durationMins(booking)} min
              <br />
              <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>{formatViewerDateTime(booking.startsAt)}</span>
            </td>
            <td className="py-3 text-right font-mono" style={{ borderBottom: "1px solid var(--border)", fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>
              {amount}
            </td>
          </tr>
          <tr>
            <td className="py-3.5 font-medium" style={{ color: "var(--ink)" }}>{TOTAL_LABEL[money]}</td>
            <td className="py-3.5 text-right font-mono text-[18px] font-medium" style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)" }} data-testid="receipt-total">
              {amount}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="rounded-(--r-3) px-4.5 py-4 text-[13px] leading-[1.6]" style={{ background: "var(--bg-2)", color: "var(--fg-2)" }}>
        {money === "paid" && booking.receipt?.reference && <Row label="Payment reference">{booking.receipt.reference}</Row>}
        {money === "paid" && <Row label="Paid on">{paidAt ? formatViewerDateTime(paidAt) : "Date not recorded"}</Row>}
        <Row label="Booking ID">{booking.id}</Row>
        {money === "awaiting_payment" && (
          <p className="mt-2" data-testid="receipt-unpaid-note">
            This booking isn&apos;t paid yet, so this is not a receipt.
            {booking.payment?.expiresAt ? ` The slot is held until ${formatViewerDateTime(booking.payment.expiresAt)}.` : ""}
          </p>
        )}
        {money === "unpaid" && (
          <p className="mt-2" data-testid="receipt-unpaid-note">
            No payment was recorded for this booking, so this is not a receipt.
          </p>
        )}
        {booking.status === ConsultationBookingStatus.CANCELLED && booking.cancelReason && (
          <p className="mt-2">Cancelled: {booking.cancelReason}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-6 print:hidden">
        <button type="button" className="btn-primary-v2 sm" onClick={() => window.print()}>Print</button>
        <Link href={back.href} className="btn-ghost-v2 sm">{back.label}</Link>
      </div>
    </div>
  );
}
