"use client";

import type { ClassAttendance, ClassBooking } from "@/lib/api/classBookings";

const OPTIONS: { value: ClassAttendance; label: string }[] = [
  { value: "attended", label: "Attended" },
  { value: "no_show", label: "No-show" },
];

/**
 * One roster row's attendance: its state in words, and, for staff who may
 * record it (bookings:manage) once the class has started, a one-tap choice.
 * Tapping the chosen option again clears it. "Not recorded" is not a
 * no-show. Nothing here charges or notifies the member.
 */
export function AttendanceControl({
  booking,
  canMark,
  busy,
  onChange,
}: {
  booking: Pick<ClassBooking, "attendance" | "attendance_open">;
  canMark: boolean;
  busy: boolean;
  onChange: (next: ClassAttendance | null) => void;
}) {
  const current = booking.attendance ?? null;

  if (!canMark || !booking.attendance_open) {
    const text = current === "attended" ? "Attended" : current === "no_show" ? "No-show" : booking.attendance_open ? "Not recorded" : "Not started";
    return (
      <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
        {text}
      </span>
    );
  }

  return (
    <div role="group" aria-label="Attendance" className="flex items-center gap-1.5">
      {OPTIONS.map((o) => {
        const on = current === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            disabled={busy}
            onClick={() => onChange(on ? null : o.value)}
            className="h-8 min-h-8 px-2.5 rounded-(--r-2) text-[12.5px] font-medium whitespace-nowrap disabled:opacity-60"
            style={{
              background: on ? "var(--ink)" : "transparent",
              color: on ? "var(--bg)" : "var(--fg-2)",
              border: on ? "1px solid var(--ink)" : "1px solid var(--border)",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
