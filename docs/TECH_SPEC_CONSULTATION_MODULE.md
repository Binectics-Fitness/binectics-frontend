# Tech Spec: Consultation Booking Module

**Status**: Proposed (MVP)
**Author**: Copilot
**Date**: 2026-03-20
**Source**: WhatsApp planning conversation (Daniel A. A. ↔ Feranmi Adunni Mi, 2026-03-19)

---

## 1) Context

The team needs a **separate consultation module** (not part of consultation question/forms).

Core request from discussion:

- Clients should be able to book consultation sessions.
- Booking should use a calendar with available date/time.
- Providers should configure available times on their end.
- Scope should support dieticians first, but be extensible to trainers (and future provider types).
- Admin should be able to define/list consultation types that can be offered.

---

## 2) Problem Statement

There is currently no dedicated module for consultation session booking. This creates friction for clients who want to schedule sessions and for providers who need to control their availability.

A structured scheduling module is required to:

- expose provider availability to clients,
- prevent manual scheduling conflicts,
- standardize consultation offerings,
- and prepare the platform for multi-role consultations.

---

## 3) Goals and Non-Goals

### Goals (MVP)

1. Enable clients to discover and book consultation slots.
2. Allow providers to set and manage calendar availability.
3. Allow admin to configure available consultation types.
4. Support dietician consultations first, with architecture ready for trainers.
5. Keep module independent from consultation intake/forms module.

### Non-Goals (MVP)

- Video call infrastructure (Zoom/Meet integration).
- Advanced recurring schedule rules (complex RRULE patterns).
- Group consultations/classes.
- Waitlists and overbooking logic.
- Multi-provider shared team calendars.

---

## 4) Personas and Roles

### Client

- Views consultation offerings.
- Filters/selects provider and slot.
- Books, reschedules, or cancels a consultation (within policy).

### Provider (Dietician/Trainer)

- Configures availability windows.
- Sets exceptions (unavailable dates, breaks).
- Views and manages booked sessions.

### Admin

- Manages consultation type catalog (e.g., diet consultation, trainer consultation).
- Defines global defaults/policies (duration options, cancellation windows if needed).

---

## 5) Functional Requirements

### 5.1 Consultation Type Management (Admin)

- Create, edit, archive consultation types.
- Fields:
  - `name`
  - `description`
  - `providerRole` (DIETICIAN | PERSONAL_TRAINER | OTHER)
  - `defaultDurationMinutes`
  - `isActive`
- Archived types are unavailable for new bookings but remain on historical sessions.

### 5.2 Provider Availability Setup

- Provider can define availability by day/time blocks.
- Provider can add date-specific overrides:
  - unavailable date
  - custom hours for a specific date
- Provider timezone is required and used for slot generation.
- Minimum lead time and booking horizon should be configurable per provider or via platform defaults.

### 5.3 Slot Discovery and Booking (Client)

- Client selects consultation type and provider.
- Calendar displays available dates and slots only.
- **All slot times are UTC from the API. The frontend converts them to the client's browser timezone for display.**
- Each slot label shows both timezones: `"4:00 AM – 4:30 AM (your time) · 9:00 AM – 9:30 AM (provider time)"`
- Client books one slot with confirmation.
- Slot locking/validation prevents double booking at confirmation time.

### 5.4 Booking Lifecycle

- States: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`, `NO_SHOW`.
- **Auto-confirm**: A booking is immediately set to `CONFIRMED` upon creation if the requested slot is free and the consultation type is admin-active. `PENDING` state is reserved for future manual-approval flows only.
- **Cancellation window**: Clients and providers may cancel up to **24 hours before** `startsAt`. Cancellations within 24h are blocked for clients; admin can override.
- **No-show automation**: A scheduled job fires **30 minutes after `endsAt`**. If the booking is still `CONFIRMED` (provider has not marked it `COMPLETED`), it is automatically transitioned to `NO_SHOW`. Providers can manually mark `COMPLETED` at any point before or after the trigger fires. Admin can override a `NO_SHOW` back to `COMPLETED`.
- Reschedule flow creates a new slot assignment and retains audit history.

### 5.5 Separation from Forms Module

- Consultation booking is standalone.
- If intake forms are needed, they are linked as a separate post-booking step (future integration), not bundled into this module’s core logic.

---

## 6) Frontend Information Architecture

## Client Surfaces

- `Consultation Catalog` (types + provider entry)
- `Book Consultation` (calendar + slot picker + confirmation)
- `My Consultations` (upcoming/past, cancel/reschedule)

## Provider Surfaces

- `Consultation Availability` (weekly schedule + date overrides)
- `Consultation Bookings` (upcoming/past sessions)

## Admin Surfaces

- `Consultation Types` (CRUD/archival)
- `Consultation Policies` (optional MVP-lite settings)

---

## 7) Core User Flows

### Flow A: Provider Configures Availability

1. Provider opens availability settings.
2. Sets timezone and weekly time blocks.
3. Adds exceptions (e.g., unavailable Friday, custom hours for a date).
4. Saves schedule.
5. System generates/updates bookable slots within booking horizon.

### Flow B: Client Books a Consultation

1. Client selects consultation type.
2. Chooses provider.
3. Views calendar with available slots in client-local display.
4. Selects slot and confirms booking.
5. System validates slot still free and creates booking.
6. Client and provider receive confirmation.

### Flow C: Admin Manages Consultation Types

1. Admin creates/updates consultation type.
2. Type is enabled for specific provider role(s).
3. Active types become available in booking flow.

---

## 8) Data Model (Contract-Level)

> Frontend repository is frontend-only. These are contract entities expected from external API.

### ConsultationType

- `id: string`
- `name: string`
- `description?: string`
- `providerRole: 'DIETICIAN' | 'PERSONAL_TRAINER' | 'OTHER'`
- `defaultDurationMinutes: number`
- `isActive: boolean`
- `createdAt: string`
- `updatedAt: string`

### ProviderAvailabilityRule

- `id: string`
- `providerId: string`
- `dayOfWeek: 0-6`
- `startTime: string` (HH:mm)
- `endTime: string` (HH:mm)
- `timezone: string` (IANA)
- `isActive: boolean`

### AvailabilityException

- `id: string`
- `providerId: string`
- `date: string` (YYYY-MM-DD)
- `type: 'UNAVAILABLE' | 'CUSTOM_HOURS'`
- `startTime?: string`
- `endTime?: string`

### ConsultationBooking

- `id: string`
- `clientUserId: string`
- `providerId: string`
- `consultationTypeId: string`
- `startsAt: string` (UTC ISO)
- `endsAt: string` (UTC ISO)
- `providerTimezone: string` (IANA — provider's timezone, for display)
- `clientTimezone: string` (IANA — client's timezone at booking time, for display)
- `status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW'`
- `notes?: string`
- `cancelledBy?: 'CLIENT' | 'PROVIDER' | 'ADMIN'`
- `cancelReason?: string`
- `createdAt: string`
- `updatedAt: string`

---

## 9) Shared API Contract (Canonical v1)

This section is the shared frontend/backend contract shape for transport payloads.

### Naming Convention

- API payloads use **camelCase**.
- Backend persistence can use snake_case internally, but DTO responses must map to this contract.

### Role Enum

- `DIETICIAN`
- `PERSONAL_TRAINER`
- `OTHER`

### Booking Status Enum

- `PENDING`
- `CONFIRMED`
- `CANCELLED`
- `COMPLETED`
- `NO_SHOW`

### Cancellation Actor Enum

- `CLIENT`
- `PROVIDER`
- `ADMIN`

### Slot DTO

- `startsAt: string` (ISO)
- `endsAt: string` (ISO)
- `providerTimezone: string` (IANA — include so frontend can render the dual-timezone label)
- `isAvailable: boolean`

### API Endpoints

#### Admin

- `GET /consultations/types`
- `POST /consultations/types`
- `PATCH /consultations/types/:id`
- `POST /consultations/types/:id/archive`

#### Provider

- `GET /consultations/provider/availability`
- `PUT /consultations/provider/availability`
- `GET /consultations/provider/exceptions`
- `POST /consultations/provider/exceptions`
- `DELETE /consultations/provider/exceptions/:id`
- `GET /consultations/provider/bookings?status=&from=&to=`

#### Client

- `GET /consultations/catalog?providerRole=&country=&city=`
- `GET /consultations/providers/:providerId/slots?consultationTypeId=&dateFrom=&dateTo=`
- `POST /consultations/bookings`
- `GET /consultations/my-bookings?status=upcoming|past`
- `PATCH /consultations/bookings/:id/cancel`
- `PATCH /consultations/bookings/:id/reschedule`

### Create Booking Request DTO

> `clientTimezone` is the **client's** IANA timezone — stored for display/audit, never used for time math.

```json
{
  "providerId": "user_123",
  "consultationTypeId": "type_456",
  "startsAt": "2026-03-25T09:00:00Z",
  "clientTimezone": "America/New_York",
  "notes": "Initial nutrition consultation"
}
```

### Booking Response DTO

> All timestamps are UTC. Frontend converts to the viewer's local timezone for display.

```json
{
  "success": true,
  "data": {
    "id": "booking_123",
    "clientUserId": "client_abc",
    "providerId": "provider_xyz",
    "consultationTypeId": "type_456",
    "startsAt": "2026-03-25T09:00:00Z",
    "endsAt": "2026-03-25T09:30:00Z",
    "providerTimezone": "Africa/Lagos",
    "clientTimezone": "America/New_York",
    "status": "CONFIRMED",
    "notes": "Initial nutrition consultation",
    "createdAt": "2026-03-20T08:00:00Z",
    "updatedAt": "2026-03-20T08:00:00Z"
  }
}
```

## 10) Timezone Handling

See **[`docs/TIMEZONE_STRATEGY.md`](./TIMEZONE_STRATEGY.md)** for the full codebase-wide strategy.

**Consultation-specific rules:**

- All slot times returned from `/providers/:id/slots` are UTC. Display with `dualTimezoneLabel(startsAt, endsAt, providerTimezone)` on the booking calendar.
- The booking request must include `clientTimezone: getClientTimezone()` — the backend stores it for display/audit.
- Booking confirmation and detail pages must show both timezones (client + provider).
- The provider availability dashboard displays times using `formatInTz(utcIso, fmt, providerTimezone)`.

---

## 11) UX and Validation Rules (MVP)

- Calendar only shows slots generated from provider availability.
- Slot selection must be revalidated on submit (stale slot prevention).
- Prevent booking in the past.
- Enforce lead time (e.g., cannot book within next X minutes).
- Enforce booking horizon (e.g., max N days ahead).
- Prevent overlap with already confirmed slots.
- Show clear empty states:
  - no providers
  - no active consultation types
  - provider has no available slots

---

## 11) Notifications (MVP)

- Booking confirmation (client + provider).
- Booking cancellation (opposite party notified).
- Reschedule confirmation.

Delivery channels in MVP:

- In-app notification (required)
- Email notification (recommended if available)

---

## 12) Permissions and Access Control

- Client endpoints accessible to authenticated users.
- Provider availability endpoints restricted to provider roles.
- Admin consultation type management restricted to admin role.
- Users cannot edit/read bookings outside their ownership or role scope.

---

## 13) Telemetry and Metrics

Track:

- consultation booking conversion rate
- slot fill rate by provider role
- cancellation/reschedule rate
- no-show rate
- median booking lead time

These metrics support optimization of availability settings and future module expansion.

---

## 14) Delivery Plan

### Phase 1 (Dietician MVP)

- Admin consultation type setup (dietician types).
- Provider availability setup for dieticians.
- Client booking flow for dietician consultations.
- Basic booking list + cancel/reschedule.

### Phase 2 (Trainer Expansion)

- Enable trainer consultation types.
- Reuse same scheduling and booking engine.
- Add trainer-specific copy/content where needed.

### Phase 3 (Enhancements)

- richer policy controls
- optional payments/deposits for consultation sessions
- integrations (calendar sync, reminders)

---

## 15) Acceptance Criteria

1. Consultation module is clearly independent from consultation forms.
2. Admin can create and manage consultation types by provider role.
3. Provider can configure availability and exceptions.
4. Client can see real-time available slots and complete booking.
5. Double-booking is prevented at confirmation.
6. Booking lifecycle (confirm/cancel/reschedule) works with role permissions.
7. Dietician support ships first; trainer can be enabled without redesign.

---

## 16) Resolved Decisions

| Question                          | Decision                                                                                                                                                                                          |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auto-confirm vs manual `PENDING`? | **Auto-confirm** if slot is free and type is admin-active. `PENDING` reserved for future use.                                                                                                     |
| Cancellation window?              | **24 hours** before `startsAt`. Admin can override hard blocks.                                                                                                                                   |
| No-show: manual or automated?     | **Both.** Automated trigger fires 30 min after `endsAt` and sets `NO_SHOW` if status is still `CONFIRMED`. Provider can manually mark `COMPLETED` before trigger fires. Admin can override after. |

## 17) Open Questions

1. Should consultation booking be free in MVP, or tied to payment/subscription checks?
2. What is the default consultation duration (e.g., 30 min, 45 min, 60 min)?
3. Do we need client notes/question prompts at booking time, or keep that strictly in forms module?

---

## 17) Frontend-Only Constraint Note

This specification is implemented in a frontend-only repository. Any backend/API behavior defined above is treated as an external contract for the Azure API and should not be implemented as local backend code in this codebase.
