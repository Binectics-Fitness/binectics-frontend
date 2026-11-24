"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CLASS_REMOVED_MESSAGE,
  bookableOccurrences,
  classBookingsService,
  classWasRemoved,
  keepsWaitlistPlace,
  type ClassBooking,
} from "@/lib/api/classBookings";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { confirmedCancelCopy } from "@/lib/classes/cancellationPolicy";
import { useAuth } from "@/contexts/AuthContext";
import { classTime, type GymClass } from "@/lib/api/classes";
import SearchableSelect from "@/components/SearchableSelect";
import { marketplaceService } from "@/lib/api/marketplace";
import { holdAtGym, holdRefusalCopy } from "@/lib/billing/membershipHolds";
import { formatDate } from "@/utils/format";
import { NO_TIMETABLE, useListingTimetable } from "@/lib/queries/classes";
import { ClassCancellationPolicyNotice } from "./ClassCancellationPolicyNotice";

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function occurrenceLabel(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Public weekly class timetable on a gym's listing page, with booking.
 * Booking requires login + an active membership — the API's error messages
 * (lead time, class full, no membership) surface inline per class.
 *
 * Each row names its club and instructor, and offers only dates that can
 * still be booked: today's class drops off once it starts (in the gym's
 * zone, inside its lead time), as the API would refuse it.
 *
 * A member already booked on the chosen date sees "Booked · Cancel". One
 * waitlisted on it sees that, and "Take the spot" when one is open: booking
 * again fills open spots in waitlist order.
 * "Someone ahead of you got it" and "no spot yet" leave their place as it
 * was, so they read as information, not as errors.
 */
export function ListingClassesSection({
  listingId,
  organizationId = null,
}: {
  listingId: string;
  /** The gym's id. A membership the gym enrolled directly has no listing, so a hold on it is found by the gym. */
  organizationId?: string | null;
}) {
  const { user } = useAuth();
  // The member's own live bookings, to say "Booked" or "you're on the
  // waitlist" and offer an open spot. Shared with MyClassBookingsCard's cache.
  const { data: mine = [] } = useQuery<ClassBooking[]>({
    queryKey: ["myClassBookings"],
    queryFn: async () => {
      const res = await classBookingsService.getMyClassBookings();
      return res.success && res.data ? res.data : [];
    },
    enabled: !!user,
  });
  // The cache key isn't per user (MyClassBookingsCard shares it): after a
  // sign-out the last member's entries could still be cached, so nothing
  // is read from it without a signed-in user.
  const myBookings = user ? mine : [];
  const { data: { classes, policy, timeZone, leadHours } = NO_TIMETABLE, isLoading } = useListingTimetable(listingId);

  if (!isLoading && classes.length === 0) return null; // gyms without classes skip the section

  const byDay = new Map<number, GymClass[]>();
  classes.forEach((c) => byDay.set(c.day_of_week, [...(byDay.get(c.day_of_week) ?? []), c]));

  return (
    <section id="schedule" className="py-8 border-b border-border">
      <h2 className="text-[22px] font-medium mb-1.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Class schedule</h2>
      <p className="text-[13.5px] mb-5" style={{ color: "var(--fg-3)" }}>
        Weekly timetable · times in the gym&rsquo;s local time · booking requires an active membership.
      </p>
      {/* Before booking: the gym's late-cancellation terms. Nothing at all
          when it has none. */}
      <ClassCancellationPolicyNotice policy={policy} className="mb-5 max-w-[780px]" />
      {isLoading ? (
        <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>Loading timetable…</p>
      ) : (
        <div className="flex flex-col gap-4 max-w-[780px]">
          {[...byDay.entries()].sort((a, b) => a[0] - b[0]).map(([day, dayClasses]) => (
            <div key={day}>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>{WEEKDAYS[day]}</div>
              <div className="flex flex-col gap-2">
                {dayClasses.map((c) => (
                  <BookableClassRow
                    key={c._id}
                    listingId={listingId}
                    organizationId={organizationId}
                    gymClass={c}
                    timeZone={timeZone}
                    leadHours={leadHours}
                    mine={myBookings.filter(
                      (b) =>
                        (b.status === "waitlisted" || b.status === "confirmed") &&
                        (typeof b.class_id === "object" ? b.class_id._id : b.class_id) === c._id,
                    )}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

type RowMessage = { text: string; tone: "ok" | "info" | "error" };
const MESSAGE_COLOR: Record<RowMessage["tone"], string> = {
  ok: "var(--signal-ink)",
  info: "var(--fg-2)",
  error: "var(--danger-ink)",
};

function BookableClassRow({
  listingId,
  organizationId,
  gymClass: c,
  timeZone,
  leadHours,
  mine,
}: {
  listingId: string;
  organizationId: string | null;
  gymClass: GymClass;
  /** The gym's zone; null from an older API (the device's zone is used). */
  timeZone: string | null;
  leadHours: number;
  /** The member's confirmed and waitlisted bookings for this class, any date. */
  mine: ClassBooking[];
}) {
  const queryClient = useQueryClient();
  const dates = bookableOccurrences(c, { timeZone, leadHours, count: 4 });
  const [picked, setPicked] = useState<string | null>(null);
  // The first bookable date until the member picks one; a picked date that
  // has since closed falls back to it.
  const date = picked && dates.includes(picked) ? picked : dates[0];
  const [message, setMessage] = useState<RowMessage | null>(null);
  const onWaitlist = mine.find((b) => b.status === "waitlisted" && b.booking_date === date);
  const booked = mine.find((b) => b.status === "confirmed" && b.booking_date === date);
  const spotOpen = onWaitlist?.spot_open === true;
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  const cancel = useMutation({
    mutationFn: (bookingId: string) => classBookingsService.cancelClassBooking(bookingId),
    onSuccess: (res) => {
      if (res.success) {
        setMessage({ text: `Cancelled your booking for ${occurrenceLabel(date)}.`, tone: "info" });
      } else {
        setMessage({ text: res.message || "Couldn't cancel this booking. Try again.", tone: "error" });
      }
      void queryClient.invalidateQueries({ queryKey: ["myClassBookings"] });
    },
  });

  const askCancel = (b: ClassBooking) =>
    requestConfirmation({
      title: `Cancel ${c.name} on ${occurrenceLabel(b.booking_date)}?`,
      description: confirmedCancelCopy(b.cancellation_policy),
      confirmLabel: "Cancel booking",
      cancelLabel: "Keep booking",
      confirmVariant: "danger",
      onConfirm: async () => {
        await cancel.mutateAsync(b._id);
      },
    });

  const book = useMutation({
    mutationFn: async () => {
      const res = await classBookingsService.bookClass(listingId, c._id, date);
      // Refused for want of an active membership: if it's because this
      // member's membership here is paused or suspended, say so instead.
      if (!res.success && res.status === 403 && /active membership/i.test(res.message ?? "")) {
        const mine = await marketplaceService.getMyMembershipSubscriptions().catch(() => null);
        const hold = mine?.success && mine.data ? holdAtGym(mine.data, { listingId, organizationId }) : null;
        if (hold) {
          const copy = holdRefusalCopy(hold, formatDate, "book classes");
          return { ...res, message: `${copy.title} ${copy.body}` };
        }
      }
      return res;
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        setMessage({
          text:
            res.data.status === "waitlisted"
              ? `Class full, you're on the waitlist for ${occurrenceLabel(date)}.`
              : `Booked for ${occurrenceLabel(date)} ✓`,
          tone: "ok",
        });
        void queryClient.invalidateQueries({ queryKey: ["myClassBookings"] });
      } else if (keepsWaitlistPlace(res)) {
        setMessage({ text: res.message || "You keep your place on the waitlist.", tone: "info" });
        void queryClient.invalidateQueries({ queryKey: ["myClassBookings"] });
      } else if (classWasRemoved(res)) {
        // The gym deleted the class as this was booked: nothing is held.
        // The timetable is left as it is so this message stays on screen;
        // the next visit no longer lists the class.
        setMessage({ text: CLASS_REMOVED_MESSAGE, tone: "error" });
        void queryClient.invalidateQueries({ queryKey: ["myClassBookings"] });
      } else {
        setMessage({ text: res.message || "Couldn't book. Check you're signed in and your membership is active.", tone: "error" });
      }
    },
  });

  return (
    <div className="rounded-(--r-2) p-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{c.name}</div>
          <div className="font-mono text-[11px] mt-0.5" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
            {classTime(c.start_time, false)} · {c.duration_minutes}m
            {c.location?.name ? ` · ${c.location.name}` : ""}
            {c.instructor_name ? ` · ${c.instructor_name}` : ""} · cap {c.capacity}
            {c.waitlist_enabled ? " · waitlist" : ""}
          </div>
          {onWaitlist && !message && (
            <div className="text-[12px] mt-1" style={{ color: spotOpen ? "var(--signal-ink)" : "var(--fg-2)" }}>
              {spotOpen
                ? `You're on the waitlist for ${occurrenceLabel(date)}, and a spot is open.`
                : `You're on the waitlist for ${occurrenceLabel(date)}.`}
            </div>
          )}
        </div>
        <SearchableSelect
          value={date ?? ""}
          onChange={(v) => { setPicked(v); setMessage(null); }}
          options={dates.map((d) => ({ label: occurrenceLabel(d), value: d }))}
        />
        {booked ? (
          <button className="btn-ghost-v2 sm shrink-0" disabled={cancel.isPending} onClick={() => askCancel(booked)}>
            {cancel.isPending ? "Cancelling…" : "Booked · Cancel"}
          </button>
        ) : (
          <button className="btn-primary-v2 sm shrink-0" disabled={book.isPending || !date} onClick={() => book.mutate()}>
            {book.isPending ? (spotOpen ? "Taking…" : "Booking…") : spotOpen ? "Take the spot" : "Book"}
          </button>
        )}
      </div>
      {message && (
        <p role="status" className="text-[12px] mt-2" style={{ color: MESSAGE_COLOR[message.tone] }}>{message.text}</p>
      )}
      {confirmationModal}
    </div>
  );
}
