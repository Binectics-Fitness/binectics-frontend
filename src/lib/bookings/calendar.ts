/**
 * "Add to calendar" on web: a booking becomes a small .ics file the browser
 * downloads, and the member opens it in whichever calendar they use. The
 * web form of mobile #182 (`utils/addToCalendar.ts`), with one difference:
 * every time is written as an exact UTC instant (`...Z`), never as a
 * floating wall-clock time, so a calendar in another zone still shows the
 * right moment.
 *
 * What goes in the file is only what the member already sees on the
 * bookings page: the class or session name, the instructor or provider, the
 * gym. Never the member's own name, email, notes or a booking reference.
 */

import type { ClassBooking } from "@/lib/api/classBookings";
import type { ConsultationBooking } from "@/lib/api/consultations";
import { getClientTimezone } from "@/utils/format";

export interface CalendarEvent {
  /** Stable per booking, so importing it twice updates rather than duplicates. */
  uid: string;
  title: string;
  description?: string;
  location?: string;
  /** Exact instants, ISO 8601. */
  startIso: string;
  endIso: string;
}

/** A class with no duration on record is assumed to run this long. */
export const DEFAULT_CLASS_MINUTES = 60;

const pad = (n: number) => String(n).padStart(2, "0");

/** 2026-10-28T17:30:00.000Z → "20261028T173000Z". */
export function utcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** The zone's offset from UTC at an instant, in minutes (Lagos: +60). */
function zoneOffsetMinutes(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return Math.round((asUtc - Math.floor(instant / 1000) * 1000) / 60000);
}

/**
 * A wall-clock time in a zone ("2026-10-28", "18:30", "Africa/Lagos") as
 * the exact instant, DST included. A time that does not exist (the hour
 * skipped when clocks go forward) lands just after the gap, as calendars
 * do. Null when the date, time or zone cannot be read.
 */
export function zonedWallClockToUtc(ymd: string, hhmm: string, timeZone: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  const t = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!d || !t) return null;
  const [y, m, day] = [Number(d[1]), Number(d[2]), Number(d[3])];
  const [h, min] = [Number(t[1]), Number(t[2])];
  if (m < 1 || m > 12 || day < 1 || day > 31 || h > 23 || min > 59) return null;
  const naive = Date.UTC(y, m - 1, day, h, min);
  try {
    // Two passes: the offset at the first guess can differ from the offset
    // at the answer when the time sits next to a DST change.
    const first = naive - zoneOffsetMinutes(naive, timeZone) * 60000;
    const second = naive - zoneOffsetMinutes(first, timeZone) * 60000;
    return new Date(second);
  } catch {
    return null;
  }
}

/** RFC 5545 TEXT: backslash, semicolon, comma and newlines escaped. */
export function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

const encoder = new TextEncoder();

/**
 * RFC 5545 line folding: no line longer than 75 octets (UTF-8), each
 * continuation starting with one space. Splits between characters, never
 * inside one.
 */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const size = encoder.encode(ch).length;
    // The first line holds 75 octets; continuations 74 plus the leading space.
    const limit = out.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

/** The .ics text for one event; null when its times cannot be read. */
export function buildIcs(event: CalendarEvent, now: Date = new Date()): string | null {
  const start = new Date(event.startIso);
  const end = new Date(event.endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Binectics//Bookings//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}@binectics.com`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${utcStamp(start)}`,
    `DTEND:${utcStamp(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    ...(event.description ? [`DESCRIPTION:${escapeText(event.description)}`] : []),
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText(event.title)}`,
    "TRIGGER:-PT1H",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

type ClassOf = Exclude<ClassBooking["class_id"], string>;

/**
 * The zone a class's wall-clock start is read in: the gym's, when the API
 * sends it on the booking, else the member's own. The member list
 * (GET /classes/my-bookings) does not carry the gym's zone yet, and the web
 * shows the class's clock time as it is, so the member's zone keeps the
 * calendar on the time they read on the page. An API field for the gym's
 * zone (the API already resolves it, orgTimeZone) would make this exact for
 * a member who is away from their gym's zone.
 */
export function classTimeZone(booking: Pick<ClassBooking, "time_zone">): string {
  const tz = booking.time_zone;
  if (tz) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return tz;
    } catch {
      // Not a zone this browser knows: fall through.
    }
  }
  return getClientTimezone();
}

/** A class booking as a calendar event; null when it has no start time. */
export function classBookingEvent(
  booking: ClassBooking,
  opts: { gymName?: string; timeZone?: string } = {},
): CalendarEvent | null {
  const c: ClassOf | null = typeof booking.class_id === "object" ? booking.class_id : null;
  if (!c?.start_time) return null;
  const tz = opts.timeZone ?? classTimeZone(booking);
  const start = zonedWallClockToUtc(booking.booking_date, c.start_time, tz);
  if (!start) return null;
  const minutes = c.duration_minutes && c.duration_minutes > 0 ? c.duration_minutes : DEFAULT_CLASS_MINUTES;
  const end = new Date(start.getTime() + minutes * 60000);
  const bits = [c.instructor_name ? `With ${c.instructor_name}` : null, opts.gymName ? `At ${opts.gymName}` : null];
  return {
    uid: `class-${booking._id}`,
    title: c.name || "Class",
    description: bits.filter(Boolean).join(". ") || undefined,
    location: opts.gymName || undefined,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  };
}

/** The provider's name, where the booking read carries it. */
function providerName(b: ConsultationBooking): string | null {
  if (b.providerName) return b.providerName;
  const full = [b.providerFirstName, b.providerLastName].filter(Boolean).join(" ").trim();
  return full || null;
}

/** A 1:1 session booking as a calendar event (its times are already exact). */
export function sessionBookingEvent(booking: ConsultationBooking): CalendarEvent {
  const who = providerName(booking);
  return {
    uid: `session-${booking.id}`,
    title: booking.consultationTypeName || "Session",
    description: who ? `With ${who}` : undefined,
    startIso: booking.startsAt,
    endIso: booking.endsAt,
  };
}

/** The file name the download is saved under. */
export function icsFileName(event: CalendarEvent): string {
  return `binectics-${event.uid.replace(/[^A-Za-z0-9-]/g, "")}.ics`;
}

/**
 * Downloads the event as an .ics file. Throws a message the page can show
 * when the booking's time cannot be read.
 */
export function downloadIcs(event: CalendarEvent | null): void {
  const ics = event ? buildIcs(event) : null;
  if (!event || !ics) throw new Error("This booking's time could not be read.");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = icsFileName(event);
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before the URL goes.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
