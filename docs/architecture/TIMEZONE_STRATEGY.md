# Timezone Strategy — Frontend

**Status**: Approved
**Date**: 2026-03-20
**Applies to**: All pages and components that display, accept, or transmit dates or times.

> **Cross-repo companion**: `binectics-api/docs/TIMEZONE_STRATEGY.md`

---

## 1. Core Rule

> **Receive UTC. Display in the viewer's local timezone. Send UTC. Include your IANA timezone separately.**

The backend stores and returns all timestamps as UTC ISO 8601 strings (e.g., `"2026-03-25T09:00:00Z"`). The frontend is the only place that converts UTC into a human-readable local time.

---

## 2. The Problem With Current Date Utilities

`src/utils/format.ts` currently has:

```ts
export function formatDate(dateStr, options?) {
  return date.toLocaleDateString('en-US', options ?? { ... });
}
```

`toLocaleDateString` with no `timeZone` option uses the **system/browser locale timezone**, which is correct for the current user's own events but wrong when displaying a provider's local time or when showing both timezones side-by-side (e.g., the consultation booking view).

It also has no timezone-aware path for converting a UTC timestamp into a specific IANA zone.

---

## 3. Required Library

No date library is currently installed. Add `date-fns-tz`:

```bash
npm install date-fns-tz
```

It is lightweight, tree-shakeable, and has no global state.

---

## 4. Canonical Utilities to Add

Add the following to `src/utils/format.ts` (alongside existing helpers):

```ts
import { toZonedTime, formatInTimeZone } from "date-fns-tz";

/**
 * Get the browser's current IANA timezone string.
 * Use this to detect the client's timezone at booking time.
 *
 * @example
 * getClientTimezone() // → "America/New_York"
 */
export function getClientTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Format a UTC ISO string for display in a given IANA timezone.
 *
 * @param utcIso - UTC ISO 8601 string from the API (e.g., "2026-03-25T09:00:00Z")
 * @param formatStr - date-fns format string (e.g., "h:mm a", "MMM d, yyyy")
 * @param timezone - IANA timezone (e.g., "America/New_York", "Africa/Lagos")
 *
 * @example
 * formatInTz("2026-03-25T09:00:00Z", "h:mm a", "America/New_York") // → "4:00 AM"
 * formatInTz("2026-03-25T09:00:00Z", "h:mm a", "Africa/Lagos")     // → "10:00 AM"
 */
export function formatInTz(
  utcIso: string | Date,
  formatStr: string,
  timezone: string,
): string {
  const date = typeof utcIso === "string" ? new Date(utcIso) : utcIso;
  return formatInTimeZone(date, timezone, formatStr);
}

/**
 * Format a UTC ISO string in the browser's local timezone.
 * Use for the current user's own events (bookings, subscriptions, etc.).
 *
 * @example
 * formatLocal("2026-03-25T09:00:00Z", "h:mm a") // → "4:00 AM" (in New York)
 */
export function formatLocal(utcIso: string | Date, formatStr: string): string {
  return formatInTz(utcIso, formatStr, getClientTimezone());
}

/**
 * Build a dual-timezone label for scheduling UIs.
 *
 * @example
 * dualTimezoneLabel(
 *   "2026-03-25T09:00:00Z",
 *   "2026-03-25T09:30:00Z",
 *   "Africa/Lagos",
 *   "America/New_York"
 * )
 * // → "4:00 – 4:30 AM (your time) · 10:00 – 10:30 AM (provider time, Lagos)"
 */
export function dualTimezoneLabel(
  startsAt: string,
  endsAt: string,
  providerTimezone: string,
  clientTimezone: string = getClientTimezone(),
): string {
  const clientStart = formatInTz(startsAt, "h:mm", clientTimezone);
  const clientEnd = formatInTz(endsAt, "h:mm a", clientTimezone);
  const providerStart = formatInTz(startsAt, "h:mm", providerTimezone);
  const providerEnd = formatInTz(endsAt, "h:mm a", providerTimezone);
  const providerCity =
    providerTimezone.split("/").pop()?.replace("_", " ") ?? providerTimezone;

  return `${clientStart} – ${clientEnd} (your time) · ${providerStart} – ${providerEnd} (${providerCity})`;
}
```

---

## 5. Display Rules by Context

### Client viewing their own booking or dashboard

- Use the **browser's local timezone**.
- Use `formatLocal(utcIso, formatStr)`.

### Client viewing a provider's availability calendar

- Primary display: client's local timezone.
- Secondary display: provider's timezone alongside.
- Use `dualTimezoneLabel()` on each slot.

### Provider viewing their own dashboard

- Display times in **the provider's own stored timezone** (`providerTimezone` from profile/booking).
- Use `formatInTz(utcIso, formatStr, providerTimezone)`.

### Booking confirmation page (client-facing)

Show both:

```
Thursday, 25 March 2026
4:00 AM – 4:30 AM  (your time, New York)
10:00 AM – 10:30 AM  (provider time, Lagos)
```

### Email / notification templates (backend-rendered)

Handled by the backend. See `binectics-api/docs/TIMEZONE_STRATEGY.md` §10.

---

## 6. Sending Dates to the API

### Rule: always send UTC ISO 8601

When POSTing or PATCHing a date picked by the user in a form, convert it to UTC before sending:

```ts
// User picks "2026-03-25 09:00 AM" in their local timezone
// Send as UTC to the API:
const utcIso = new Date(localDateString).toISOString();
// → "2026-03-25T14:00:00.000Z" (for UTC-5)
```

### Rule: always send `clientTimezone`

Every request involving scheduling must include the client's IANA timezone string as a separate field:

```ts
{
  startsAt: "2026-03-25T09:00:00Z",   // UTC
  clientTimezone: getClientTimezone(), // "America/New_York"
}
```

The backend uses `clientTimezone` for display/audit only — never for time math.

---

## 7. Never Do These

```ts
// ❌ Local time as UTC — wrong offset sent to API
new Date(2026, 2, 25, 9, 0, 0).toISOString();

// ❌ Display without timezone context — unpredictable across locales
new Date(utcIso).toLocaleTimeString();

// ❌ Hardcoding UTC offset instead of IANA name
const tz = "+01:00";

// ❌ Using .getHours() / .getDate() — returns local system time, not UTC
date.getHours();
```

---

## 8. Worked Example — Nigeria Provider, US Client

| What                           | Value                                            |
| ------------------------------ | ------------------------------------------------ |
| Provider timezone              | `Africa/Lagos` (UTC+1, no DST)                   |
| Client timezone                | `America/New_York` (UTC-5 winter / UTC-4 summer) |
| Provider's availability        | Mondays 10:00–17:00 Lagos                        |
| Slot UTC (stored)              | `2026-03-23T09:00:00Z`                           |
| Client display (March, winter) | 4:00 AM New York                                 |
| Client display (July, summer)  | 5:00 AM New York                                 |
| Provider display               | 10:00 AM Lagos (always)                          |

The UTC value (`09:00Z`) never changes. The client display changes because **their** timezone observes DST — and IANA-aware formatting handles this automatically.

---

## 9. Existing `formatDate` — What to Keep

The existing `formatDate` in `src/utils/format.ts` is fine for **non-time displays** (e.g., showing `"Mar 15, 2024"` for a subscription start date where the time-of-day does not matter). Keep it, but add a deprecation note in its JSDoc:

```ts
/**
 * @deprecated For any UI where timezone accuracy matters (scheduling, bookings),
 * use `formatLocal` or `formatInTz` from this file instead.
 */
export function formatDate(...) { ... }
```

---

## 10. Module Responsibility Summary

| Concern                            | Utility                                       |
| ---------------------------------- | --------------------------------------------- |
| Detect client's timezone           | `getClientTimezone()`                         |
| Display UTC in client's timezone   | `formatLocal(utcIso, fmt)`                    |
| Display UTC in a specific timezone | `formatInTz(utcIso, fmt, tz)`                 |
| Dual-timezone slot label           | `dualTimezoneLabel(starts, ends, providerTz)` |
| Send timezone in request body      | `clientTimezone: getClientTimezone()`         |

---

## 11. Checklist for New Pages/Components

- [ ] All UTC strings from API displayed via `formatLocal` or `formatInTz` — never raw ISO.
- [ ] Booking/scheduling forms: `clientTimezone` included in request body.
- [ ] Slot pickers show dual-timezone labels (`dualTimezoneLabel()`).
- [ ] Provider dashboard displays times in `providerTimezone`.
- [ ] No `date.getHours()`, `toLocaleDateString()` (without `timeZone` option), or hardcoded offsets.
