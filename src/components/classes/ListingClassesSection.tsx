"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  classBookingsService,
  nextOccurrences,
} from "@/lib/api/classBookings";
import { classTime, type GymClass } from "@/lib/api/classes";
import SearchableSelect from "@/components/SearchableSelect";

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
 */
export function ListingClassesSection({ listingId }: { listingId: string }) {
  const { data: classes = [], isLoading } = useQuery<GymClass[]>({
    queryKey: ["listingClasses", listingId],
    queryFn: async () => {
      const res = await classBookingsService.getListingClasses(listingId);
      return res.success && res.data ? res.data : [];
    },
    enabled: !!listingId,
  });

  if (!isLoading && classes.length === 0) return null; // gyms without classes skip the section

  const byDay = new Map<number, GymClass[]>();
  classes.forEach((c) => byDay.set(c.day_of_week, [...(byDay.get(c.day_of_week) ?? []), c]));

  return (
    <section id="schedule" className="py-8 border-b border-border">
      <h2 className="text-[22px] font-medium mb-1.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Class schedule</h2>
      <p className="text-[13.5px] mb-5" style={{ color: "var(--fg-3)" }}>
        Weekly timetable · times in the gym&rsquo;s local time · booking requires an active membership.
      </p>
      {isLoading ? (
        <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>Loading timetable…</p>
      ) : (
        <div className="flex flex-col gap-4 max-w-[780px]">
          {[...byDay.entries()].sort((a, b) => a[0] - b[0]).map(([day, dayClasses]) => (
            <div key={day}>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>{WEEKDAYS[day]}</div>
              <div className="flex flex-col gap-2">
                {dayClasses.map((c) => (
                  <BookableClassRow key={c._id} listingId={listingId} gymClass={c} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function BookableClassRow({ listingId, gymClass: c }: { listingId: string; gymClass: GymClass }) {
  const queryClient = useQueryClient();
  const dates = nextOccurrences(c.day_of_week, 4);
  const [date, setDate] = useState(dates[0]);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const book = useMutation({
    mutationFn: () => classBookingsService.bookClass(listingId, c._id, date),
    onSuccess: (res) => {
      if (res.success && res.data) {
        setMessage({
          text:
            res.data.status === "waitlisted"
              ? `Class full — you're on the waitlist for ${occurrenceLabel(date)}.`
              : `Booked for ${occurrenceLabel(date)} ✓`,
          ok: true,
        });
        void queryClient.invalidateQueries({ queryKey: ["myClassBookings"] });
      } else {
        setMessage({ text: res.message || "Couldn't book — log in and check your membership.", ok: false });
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
            {c.instructor_name ? ` · ${c.instructor_name}` : ""} · cap {c.capacity}
            {c.waitlist_enabled ? " · waitlist" : ""}
          </div>
        </div>
        <SearchableSelect
          value={date}
          onChange={(v) => { setDate(v); setMessage(null); }}
          options={dates.map((d) => ({ label: occurrenceLabel(d), value: d }))}
        />
        <button className="btn-primary-v2 sm shrink-0" disabled={book.isPending} onClick={() => book.mutate()}>
          {book.isPending ? "Booking…" : "Book"}
        </button>
      </div>
      {message && (
        <p className="text-[12px] mt-2" style={{ color: message.ok ? "var(--signal-ink)" : "var(--danger, #b00020)" }}>{message.text}</p>
      )}
    </div>
  );
}
