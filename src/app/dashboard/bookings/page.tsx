"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { StatusPill } from "@/components/ds/StatusPill";
import { AsyncSpinner, Eyebrow, IconTile, ListRow, PageHeader, RoleShell } from "@/components/ds";
import { CalendarClock } from "lucide-react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";
import {
  consultationsService,
  ConsultationBookingStatus,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import { formatCurrency, getClientTimezone } from "@/utils/format";
import { minorToMajor } from "@/lib/money/minorMoney";
import { bookingLabel, formatClock } from "@/lib/bookings/labels";
import { MyClassBookingsCard } from "@/components/classes/MyClassBookingsCard";
import { PayBookingButton } from "@/components/bookings/PayBookingButton";
import { RescheduleBookingModal } from "@/components/bookings/RescheduleBookingModal";
import { bookingPaymentState, isPayable } from "@/lib/bookings/paymentState";
import { bookingPaymentStateTone } from "@/lib/ui/statusTones";
import { hasPaidReceipt, receiptHref } from "@/lib/bookings/receipt";

type TabKey = "upcoming" | "past" | "cancelled";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

/** Awaiting payment / no-show are warn, confirmed / completed success, the rest neutral. */
function statusTone(booking: ConsultationBooking) {
  return bookingPaymentStateTone(bookingPaymentState(booking));
}

function formatDateBlock(iso: string) {
  const d = new Date(iso);
  return {
    month: d.toLocaleString(undefined, { month: "short" }),
    day: d.getDate().toString().padStart(2, "0"),
    dow: d.toLocaleString(undefined, { weekday: "short" }),
    time: d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit" }),
    full: d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }),
    monthYear: d.toLocaleString(undefined, { month: "long", year: "numeric" }),
  };
}

function groupByMonth(bookings: ConsultationBooking[]) {
  const groups = new Map<string, ConsultationBooking[]>();
  bookings.forEach((b) => {
    const key = formatDateBlock(b.startsAt).monthYear;
    const list = groups.get(key) ?? [];
    list.push(b);
    groups.set(key, list);
  });
  return Array.from(groups.entries());
}

function BookingRow({
  booking,
  isSelected,
  onSelect,
  onPay,
  children,
}: {
  booking: ConsultationBooking;
  isSelected: boolean;
  onSelect: () => void;
  /** Selects the booking and opens its payment, for a held session. */
  onPay?: () => void;
  /** Rendered under the row: the payment panel, where there is no detail column. */
  children?: React.ReactNode;
}) {
  const date = formatDateBlock(booking.startsAt);
  const durationMin = Math.round(
    (new Date(booking.endsAt).getTime() - new Date(booking.startsAt).getTime()) / 60000,
  );

  const holdUntil = isPayable(booking) && booking.payment?.expiresAt ? booking.payment.expiresAt : null;
  const cancelReason = booking.status === ConsultationBookingStatus.CANCELLED ? booking.cancelReason : undefined;
  const hasFooter = Boolean(holdUntil || cancelReason || booking.notes || hasPaidReceipt(booking) || onPay || children);

  return (
    <div className="mb-2 flex flex-col">
      {/* The row selects the booking for the detail column. A ring, not the
          border, marks the selection: ListRow owns its border. */}
      <ListRow
        onClick={onSelect}
        className={isSelected ? "ring-1 ring-(--ink)" : ""}
        leading={
          <span
            aria-hidden="true"
            className="flex w-11 flex-col items-center leading-none"
            style={{ color: "var(--ink)" }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>
              {date.month}
            </span>
            <span className="mt-1 text-[20px] font-medium" style={{ letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
              {date.day}
            </span>
          </span>
        }
        title={
          <>
            {booking.consultationTypeName ?? "Consultation"} &middot; {durationMin} min
          </>
        }
        meta={`${date.dow} · ${date.time} · ${booking.clientTimezone || getClientTimezone()}`}
        trailing={<StatusPill tone={statusTone(booking)} label={bookingLabel(booking)} />}
      />

      {hasFooter && (
        <div className="flex flex-col gap-2 px-3.5 pt-2 pb-1">
          {holdUntil && (
            <div className="text-[12.5px]" style={{ color: "var(--fg-2)" }}>
              Slot held until {formatClock(holdUntil)}
            </div>
          )}
          {cancelReason && (
            <div className="text-[12.5px] truncate" style={{ color: "var(--fg-2)" }}>
              {cancelReason}
            </div>
          )}
          {booking.notes && (
            <div className="text-[12.5px] truncate" style={{ color: "var(--fg-2)" }}>
              {booking.notes}
            </div>
          )}
          {/* Siblings of the row, not children: a button cannot contain a
              link or another button. Pay now is hidden where the panel
              below already offers the payment. */}
          {(hasPaidReceipt(booking) || onPay) && (
            <div className="flex justify-end gap-2">
              {hasPaidReceipt(booking) && (
                <Link href={receiptHref(booking.id)} className="btn-ghost-v2 sm" data-testid="booking-receipt-link">
                  Receipt
                </Link>
              )}
              {onPay && (
                <button
                  type="button"
                  onClick={onPay}
                  className={`btn-primary-v2 sm ${isSelected ? "hidden lg:inline-flex" : ""}`}
                  data-testid="pay-now"
                >
                  Pay now
                </button>
              )}
            </div>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * The hold and how to pay it, for the selected booking. Rendered in the
 * detail column where there is one and under the row where there is not.
 */
function BookingPaymentPanel({
  booking,
  onBooking,
  onError,
}: {
  booking: ConsultationBooking;
  onBooking: (booking: ConsultationBooking) => void;
  onError: (message: string) => void;
}) {
  if (!isPayable(booking) || !booking.payment?.expiresAt) return null;
  return (
    <div className="flex flex-col gap-3" data-testid="payment-panel">
      <div className="rounded-(--r-2) p-3.5 flex flex-col gap-1.5" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
        <div className="flex justify-between items-baseline">
          <span className="text-[13px]" style={{ color: "var(--fg-2)" }}>
            {booking.consultationTypeName ?? "Session"}
          </span>
          <span className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.012em", fontVariantNumeric: "tabular-nums" }}>
            {booking.payment.amountMinor != null && booking.payment.currency
              ? formatCurrency(minorToMajor(booking.payment.amountMinor, booking.payment.currency), booking.payment.currency)
              : ""}
          </span>
        </div>
        <div className="text-[12.5px] leading-relaxed" style={{ color: "var(--fg-3)" }}>
          This slot is held for you until {formatClock(booking.payment.expiresAt)}. Pay by then and the session is confirmed; if it isn&apos;t paid, the hold is released and the time goes back on offer.
        </div>
      </div>
      <PayBookingButton booking={booking} onBooking={onBooking} onError={onError} />
      <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
        You can leave and come back to pay any time before the deadline.
      </div>
    </div>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  const copy = {
    upcoming: { title: "No upcoming sessions", sub: "Book a new session from the marketplace." },
    past: { title: "No past sessions yet", sub: "Once you complete a booking it appears here." },
    cancelled: { title: "No cancelled sessions", sub: "Your cancellation history will appear here." },
  };
  const c = copy[tab];
  return (
    <div
      className="rounded-(--r-3) p-10 text-center"
      style={{ border: "1px dashed var(--border-2)", background: "var(--bg)" }}
    >
      <IconTile icon={CalendarClock} size="lg" className="mb-4" />
      <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
        {c.title}
      </div>
      <div className="text-[13px] mt-1.5" style={{ color: "var(--fg-3)" }}>
        {c.sub}
      </div>
      {tab === "upcoming" && (
        <Link href="/marketplace" className="btn-primary-v2 sm mt-4 inline-flex">
          Browse marketplace
        </Link>
      )}
    </div>
  );
}

/**
 * The booking the URL asks for: the booking page hands over with
 * ?booking=<id>. Read once and removed from the URL, so a later tab
 * change or reload shows the list as it is instead of pulling the same
 * booking back to the top.
 */
function takeWantedBookingId(): string | null {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const id = url.searchParams.get("booking");
  if (id) {
    url.searchParams.delete("booking");
    window.history.replaceState(window.history.state, "", url.toString());
  }
  return id;
}

/**
 * The list to show and, when a booking was asked for, that booking's id.
 * A hold just created is in the upcoming list already; one the sweep has
 * since cancelled is fetched on its own so the page still lands on it with
 * the state the API has for it.
 */
async function withWantedBooking(
  list: ConsultationBooking[],
  wanted: string | null,
): Promise<{ list: ConsultationBooking[]; wanted: string | null }> {
  if (!wanted) return { list, wanted: null };
  if (list.some((b) => b.id === wanted)) return { list, wanted };
  try {
    const res = await consultationsService.getBooking(wanted);
    if (res.success && res.data) return { list: [res.data, ...list], wanted };
  } catch {
    // fall through: the list is shown without it
  }
  return { list, wanted: null };
}

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  // undefined: not read yet; a string: read but not yet shown (a fetch the
  // effect abandoned keeps it); null: consumed.
  const wantedRef = useRef<string | null | undefined>(undefined);

  const loadBookings = async (tab: TabKey) => {
    setLoading(true);
    setError(null);
    try {
      const apiStatus = tab === "past" ? "past" : tab === "upcoming" ? "upcoming" : undefined;
      const response = await consultationsService.getMyBookings(apiStatus);
      const all = response.data ?? [];
      const filtered = tab === "cancelled"
        ? all.filter((b) => b.status === ConsultationBookingStatus.CANCELLED || b.status === ConsultationBookingStatus.NO_SHOW)
        : all;
      setBookings(filtered);
      setSelectedId((prev) => (prev && filtered.some((b) => b.id === prev) ? prev : filtered[0]?.id ?? null));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load bookings";
      setError(message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const apiStatus = activeTab === "past" ? "past" : activeTab === "upcoming" ? "upcoming" : undefined;
        const response = await consultationsService.getMyBookings(apiStatus);
        if (!isMounted) return;
        const all = response.data ?? [];
        const filtered = activeTab === "cancelled"
          ? all.filter((b) => b.status === ConsultationBookingStatus.CANCELLED || b.status === ConsultationBookingStatus.NO_SHOW)
          : all;
        if (wantedRef.current === undefined) wantedRef.current = takeWantedBookingId();
        const shown = await withWantedBooking(filtered, wantedRef.current);
        if (!isMounted) return;
        wantedRef.current = null;
        setBookings(shown.list);
        setSelectedId(shown.wanted ?? shown.list[0]?.id ?? null);
      } catch (err) {
        if (!isMounted) return;
        const message = err instanceof Error ? err.message : "Failed to load bookings";
        setError(message);
        setBookings([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  const selected = useMemo(() => bookings.find((b) => b.id === selectedId) ?? null, [bookings, selectedId]);

  /** An authoritative booking from the API replaces the one we hold. */
  const replaceBooking = (fresh: ConsultationBooking) => {
    setBookings((prev) => prev.map((b) => (b.id === fresh.id ? fresh : b)));
    if (fresh.status === ConsultationBookingStatus.CONFIRMED) toast.success("Payment received. Your session is confirmed.");
  };

  const payFor = (id: string) => {
    setSelectedId(id);
    // The panel is in the detail column or, without one, under the row;
    // scroll to whichever of the two is laid out.
    setTimeout(() => {
      const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-testid="payment-panel"]'));
      panels.find((el) => el.offsetParent !== null)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };
  const grouped = useMemo(() => groupByMonth(bookings), [bookings]);
  const counts = useMemo(() => bookings.length, [bookings]);

  return (
    <RoleShell activeItem="Bookings" memberActiveLabel="Bookings" crumb="My bookings">
      <div>
        <PageHeader
          title={{ before: "Your ", emphasis: "bookings" }}
          subtitle="All your sessions across trainers and dietitians, in one place."
          actions={
            <Link href="/marketplace" className="btn-primary-v2 sm">
              + Book new session
            </Link>
          }
        />

        {/* Gym class bookings — renders only when the member has some */}
        <MyClassBookingsCard />

        <div className="flex gap-0 mb-6" style={{ borderBottom: "1px solid var(--border)" }}>
          {TABS.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4.5 py-3 text-[14px] -mb-px cursor-pointer inline-flex items-center gap-2 ${isActive ? "border-b-2 border-ink font-medium" : ""}`}
                style={{ color: isActive ? "var(--ink)" : "var(--fg-3)" }}
              >
                {t.label}
                {isActive && (
                  <span
                    className="font-mono text-[11px] px-1.5 py-px"
                    style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
                  >
                    {counts}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] items-start gap-6 lg:gap-8">
          <div>
            {loading && (
              <div className="rounded-(--r-3) px-4.5 py-8" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <AsyncSpinner label="Loading bookings" />
              </div>
            )}
            {!loading && error && (
              <div
                className="rounded-(--r-3) p-5"
                style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}
              >
                <div className="text-[14px] font-medium">Couldn&apos;t load bookings</div>
                <div className="text-[13px] mt-1" style={{ color: "var(--ink)" }}>
                  {error}
                </div>
                <button
                  type="button"
                  onClick={() => loadBookings(activeTab)}
                  className="btn-ghost-v2 sm mt-3"
                >
                  Try again
                </button>
              </div>
            )}
            {!loading && !error && bookings.length === 0 && <EmptyState tab={activeTab} />}
            {!loading && !error && bookings.length > 0 && (
              <>
                {grouped.map(([monthLabel, items]) => (
                  <div key={monthLabel} className="mb-1">
                    <div className="flex justify-between pb-1.5">
                      <Eyebrow as="h2">{monthLabel}</Eyebrow>
                      <Eyebrow as="span">
                        {items.length} {items.length === 1 ? "session" : "sessions"}
                      </Eyebrow>
                    </div>
                    {items.map((b) => (
                      <BookingRow
                        key={b.id}
                        booking={b}
                        isSelected={b.id === selectedId}
                        onSelect={() => setSelectedId(b.id)}
                        onPay={isPayable(b) ? () => payFor(b.id) : undefined}
                      >
                        {b.id === selectedId && isPayable(b) && (
                          <div className="lg:hidden pt-1 pb-3">
                            <BookingPaymentPanel booking={b} onBooking={replaceBooking} onError={(m) => toast.error(m)} />
                          </div>
                        )}
                      </BookingRow>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>

          <div
            className="hidden lg:block sticky top-20 rounded-(--r-3) overflow-hidden"
            style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
          >
            {!selected && (
              <div className="p-6 text-[13px] text-center" style={{ color: "var(--fg-3)" }}>
                Select a booking to see details.
              </div>
            )}
            {selected && (
              <>
                <div className="px-5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                    Booking {selected.id.slice(-8)}
                  </div>
                  <div className="text-[18px] font-medium mt-1.5" style={{ letterSpacing: "-0.012em", color: "var(--ink)" }}>
                    {formatDateBlock(selected.startsAt).full}
                  </div>
                </div>

                <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                  <StatusPill tone={statusTone(selected)} label={bookingLabel(selected)} />
                  {isPayable(selected) && (
                    <div className="mt-3">
                      <BookingPaymentPanel booking={selected} onBooking={replaceBooking} onError={(m) => toast.error(m)} />
                    </div>
                  )}
                  {bookingPaymentState(selected) === "expired" && (
                    <div className="text-[12.5px] mt-2 leading-relaxed" style={{ color: "var(--fg-3)" }}>
                      The hold on this slot ran out before payment, so it was released.{" "}
                      <Link href="/marketplace" className="underline" style={{ color: "var(--ink)" }}>Choose another time</Link>.
                    </div>
                  )}
                  {selected.cancelReason && bookingPaymentState(selected) !== "expired" && (
                    <div className="text-[12.5px] mt-2" style={{ color: "var(--fg-3)" }}>
                      {selected.cancelReason}
                    </div>
                  )}
                </div>

                <div className="px-5 py-4 flex flex-col gap-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>
                    When &amp; where
                  </div>
                  {[
                    { k: "Date", v: formatDateBlock(selected.startsAt).full },
                    { k: "Time", v: formatDateBlock(selected.startsAt).time },
                    {
                      k: "Duration",
                      v: `${Math.round((new Date(selected.endsAt).getTime() - new Date(selected.startsAt).getTime()) / 60000)} min`,
                    },
                    { k: "Timezone", v: selected.providerTimezone || getClientTimezone() },
                  ].map((r) => (
                    <div key={r.k} className="flex justify-between text-[13px] py-1.5 gap-3">
                      <span style={{ color: "var(--fg-3)" }}>{r.k}</span>
                      <span className="font-mono text-right" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                        {r.v}
                      </span>
                    </div>
                  ))}
                </div>

                {selected.notes && (
                  <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>
                      Notes
                    </div>
                    <div className="text-[13px] leading-relaxed" style={{ color: "var(--ink)" }}>
                      {selected.notes}
                    </div>
                  </div>
                )}

                {(selected.status === ConsultationBookingStatus.PENDING ||
                  selected.status === ConsultationBookingStatus.CONFIRMED) && (
                  <div className="px-5 py-4 flex flex-col gap-2" style={{ background: "var(--bg-2)" }}>
                    <button
                      type="button"
                      onClick={() => setRescheduleOpen(true)}
                      className="btn-ghost-v2 sm w-full justify-center"
                      disabled={actionLoading}
                    >
                      Reschedule
                    </button>
                    <button
                      type="button"
                      onClick={() => setCancelOpen(true)}
                      className="btn-ghost-v2 sm w-full justify-center"
                      style={{ color: "var(--danger)" }}
                      disabled={actionLoading}
                    >
                      Cancel booking
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {selected && (
        <>
          <RescheduleBookingModal
            key={`reschedule-${selected.id}-${rescheduleOpen}`}
            open={rescheduleOpen}
            booking={selected}
            onClose={() => setRescheduleOpen(false)}
            onConfirm={async (startsAt, reason) => {
              setActionLoading(true);
              try {
                const res = await consultationsService.rescheduleBooking(selected.id, { startsAt, reason });
                if (res.success) {
                  toast.success("Booking rescheduled");
                  setRescheduleOpen(false);
                  await loadBookings(activeTab);
                }
                return res;
              } finally {
                setActionLoading(false);
              }
            }}
          />
          <CancelModal
            key={`cancel-${selected.id}-${cancelOpen}`}
            open={cancelOpen}
            booking={selected}
            loading={actionLoading}
            onClose={() => setCancelOpen(false)}
            onConfirm={async (reason) => {
              setActionLoading(true);
              try {
                // apiClient reports a refusal as success: false, not a throw.
                const res = await consultationsService.cancelBooking(selected.id, { reason });
                if (!res.success) {
                  toast.error(res.message ?? "Failed to cancel");
                  return;
                }
                toast.success("Booking cancelled");
                setCancelOpen(false);
                await loadBookings(activeTab);
              } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to cancel";
                toast.error(message);
              } finally {
                setActionLoading(false);
              }
            }}
          />
        </>
      )}
    </RoleShell>
  );
}

function CancelModal({
  open,
  booking,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  booking: ConsultationBooking;
  loading: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}) {
  const [reason, setReason] = useState("");

  const when = formatDateBlock(booking.startsAt);

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="Cancel booking"
      description={`This will cancel your session on ${when.full} at ${when.time}.`}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost-v2" disabled={loading}>
            Keep booking
          </button>
          <button
            type="button"
            onClick={() => onConfirm(reason || undefined)}
            disabled={loading}
            className="btn-primary-v2 disabled:opacity-40"
            style={{ background: "var(--danger)", color: "white" }}
          >
            {loading ? "Cancelling..." : "Cancel booking"}
          </button>
        </>
      }
    >
      <div>
        <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
          Reason (optional)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
          placeholder="Helps your provider improve."
        />
      </div>
    </ActionModal>
  );
}
