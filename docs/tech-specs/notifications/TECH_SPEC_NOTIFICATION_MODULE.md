# Tech Spec: Notification Module — Frontend

**Status**: Proposed (MVP)
**Date**: 2026-04-11
**Source**: Internal planning, backend spec `docs/notifications/NOTIFICATION_MODULE_TECH_SPEC.md`

---

## 1) Context

The platform currently sends email notifications for key events (bookings, invitations, reviews) but has no in-app notification system. Users have no way to see a history of activities without checking email.

A frontend notification module is required to surface activities in-app, provide an unread count badge, and allow users to browse and manage their notification inbox.

---

## 2) Problem Statement

- Users miss important updates (booking confirmations, plan assignments, review responses) because they rely entirely on email.
- There is no persistent activity feed within the application.
- The notification preferences page exists in settings but currently saves only to local state.

---

## 3) Goals and Non-Goals

### Goals (MVP)

1. Display unread notification count badge in the navbar across all dashboard routes.
2. Provide a full notification inbox page with pagination and filtering.
3. Allow marking notifications as read (individually and bulk).
4. Deep-link from notifications to the relevant detail page.
5. Connect notification preferences UI to the backend API.
6. Support all user roles (User, Gym Owner, Trainer, Dietitian, Admin).
7. Real-time notification delivery via WebSocket/SSE (instant badge updates, no polling delay).

### Non-Goals (MVP)

- Toast/popup notifications on arrival.
- Push notification permission prompts.
- SMS preference wiring (no backend SMS yet).
- Notification grouping/collapsing.

---

## 4) User Flows

### 4.1 Navbar Badge

1. User loads any dashboard page.
2. App fetches `GET /notifications/unread-count`.
3. If count > 0, a red badge with the number appears on the bell icon in the navbar.
4. Badge shows "9+" for counts above 9.
5. Clicking the bell navigates to `/dashboard/notifications`.
6. Polls every 60 seconds while the dashboard is active.

### 4.2 Notification Inbox

1. User navigates to `/dashboard/notifications`.
2. Page loads first page of notifications (`GET /notifications?page=1&limit=20`).
3. Each notification shows: icon (by type), title, message preview, time ago, read/unread indicator.
4. Clicking a notification marks it as read (`PATCH /notifications/:id/read`) and navigates to the deep-link target.
5. "Mark all as read" button calls `PATCH /notifications/read-all`.
6. Filter tabs: All, Unread.
7. Pagination at the bottom (load more or page numbers).

### 4.3 Notification Preferences

1. User navigates to `/dashboard/settings/notifications`.
2. Page fetches current preferences from `GET /notifications/preferences`.
3. User toggles preferences.
4. On save, sends `PATCH /notifications/preferences` with changed fields.
5. Success/error feedback via toast or inline message.

---

## 5) Pages and Routes

| Route                               | Description                                         | Auth      |
| ----------------------------------- | --------------------------------------------------- | --------- |
| `/dashboard/notifications`          | Notification inbox                                  | All roles |
| `/dashboard/settings/notifications` | Notification preferences (exists, needs API wiring) | All roles |

---

## 6) Components

### 6.1 New Components

#### `NotificationBell` (`src/components/NotificationBell.tsx`)

Navbar bell icon with unread count badge.

```tsx
interface NotificationBellProps {
  className?: string;
}
```

- Fetches unread count on mount and polls every 60s.
- Displays red circular badge with count (or "9+").
- Links to `/dashboard/notifications`.
- Uses the `useNotificationCount` hook.

#### `NotificationList` (`src/components/NotificationList.tsx`)

Renders a list of notification items.

```tsx
interface NotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  loading?: boolean;
}
```

#### `NotificationItem` (`src/components/NotificationItem.tsx`)

Single notification row with icon, title, message, timestamp, and read status.

```tsx
interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}
```

- Unread notifications have a left blue border or dot indicator.
- Icon varies by `NotificationType` category (calendar for bookings, user for client events, star for reviews, etc.).
- Relative timestamp ("2 hours ago", "Yesterday").
- Click handler: mark as read + navigate to deep-link.

### 6.2 Modified Components

#### `DashboardSidebar` / `DashboardNavbar`

- Add `NotificationBell` to the header/navbar area.
- Bell should appear on both mobile and desktop layouts.

#### `NotificationPreferencesPage` (existing)

- Replace local state save with API calls (`GET` + `PATCH /notifications/preferences`).
- Remove push and SMS toggles that have no backend support yet, or disable them with "(Coming soon)" labels.

---

## 7) API Client

### `src/lib/api/notifications.ts`

```ts
import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

export enum NotificationType {
  BOOKING_CREATED = "BOOKING_CREATED",
  BOOKING_CONFIRMED = "BOOKING_CONFIRMED",
  BOOKING_CANCELLED = "BOOKING_CANCELLED",
  BOOKING_RESCHEDULED = "BOOKING_RESCHEDULED",
  BOOKING_COMPLETED = "BOOKING_COMPLETED",
  BOOKING_REMINDER = "BOOKING_REMINDER",
  CLIENT_INVITATION = "CLIENT_INVITATION",
  CLIENT_REQUEST = "CLIENT_REQUEST",
  CLIENT_ACCEPTED = "CLIENT_ACCEPTED",
  CLIENT_DEPARTED = "CLIENT_DEPARTED",
  MARKETPLACE_REQUEST_RECEIVED = "MARKETPLACE_REQUEST_RECEIVED",
  MARKETPLACE_REQUEST_ACCEPTED = "MARKETPLACE_REQUEST_ACCEPTED",
  MARKETPLACE_REQUEST_REJECTED = "MARKETPLACE_REQUEST_REJECTED",
  MARKETPLACE_TRANSFER_REQUEST = "MARKETPLACE_TRANSFER_REQUEST",
  REVIEW_RECEIVED = "REVIEW_RECEIVED",
  REVIEW_RESPONSE = "REVIEW_RESPONSE",
  DIET_PLAN_ASSIGNED = "DIET_PLAN_ASSIGNED",
  WORKOUT_PLAN_ASSIGNED = "WORKOUT_PLAN_ASSIGNED",
  JOURNAL_ENTRY_ADDED = "JOURNAL_ENTRY_ADDED",
  TEAM_INVITATION = "TEAM_INVITATION",
  TEAM_MEMBER_JOINED = "TEAM_MEMBER_JOINED",
  TEAM_MEMBER_REMOVED = "TEAM_MEMBER_REMOVED",
  SUBSCRIPTION_CREATED = "SUBSCRIPTION_CREATED",
  SUBSCRIPTION_EXPIRING = "SUBSCRIPTION_EXPIRING",
  SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  VERIFICATION_APPROVED = "VERIFICATION_APPROVED",
  VERIFICATION_REJECTED = "VERIFICATION_REJECTED",
  SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT",
  ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED",
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  actionUrl: string | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationPreferences {
  emailSubscriptionUpdates: boolean;
  emailPaymentReceipts: boolean;
  emailBookingConfirmations: boolean;
  emailCancellations: boolean;
  emailReminders: boolean;
  emailNewsletter: boolean;
  emailPromotions: boolean;
  inAppBookings: boolean;
  inAppPayments: boolean;
  inAppMessages: boolean;
  inAppReminders: boolean;
  inAppPromotions: boolean;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const notificationsService = {
  getNotifications(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    type?: NotificationType;
  }): Promise<ApiResponse<PaginatedNotifications>> {
    const search = new URLSearchParams();
    if (params?.page) search.set("page", String(params.page));
    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.isRead !== undefined)
      search.set("is_read", String(params.isRead));
    if (params?.type) search.set("type", params.type);
    const query = search.toString();
    return apiClient.get(`/notifications${query ? `?${query}` : ""}`);
  },

  getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return apiClient.get("/notifications/unread-count");
  },

  markAsRead(
    id: string,
  ): Promise<ApiResponse<{ id: string; isRead: boolean; readAt: string }>> {
    return apiClient.patch(`/notifications/${id}/read`, {});
  },

  markAllAsRead(): Promise<ApiResponse<{ modifiedCount: number }>> {
    return apiClient.patch("/notifications/read-all", {});
  },

  getPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    return apiClient.get("/notifications/preferences");
  },

  updatePreferences(
    prefs: Partial<NotificationPreferences>,
  ): Promise<ApiResponse<NotificationPreferences>> {
    return apiClient.patch("/notifications/preferences", prefs);
  },
};
```

---

## 8) Hooks

### `useNotificationCount` (`src/hooks/useNotificationCount.ts`)

```ts
// Polls GET /notifications/unread-count every 60 seconds
// Returns: { count: number, loading: boolean, refresh: () => void }
```

- Used by `NotificationBell`.
- Starts polling on mount, stops on unmount.
- Exposes `refresh()` for manual re-fetch (e.g. after marking all as read).

---

## 9) Universal Deep Linking

The backend generates an `action_url` for every notification — a canonical relative path (e.g. `/dashboard/consultations?bookingId=abc`). The API returns this as `actionUrl` in every notification object.

The web client uses the `actionUrl` directly since it already matches Next.js routes. The mobile client maps it to Expo Router paths. This eliminates the need for the frontend to maintain its own type-to-route mapping.

### 9.1 Resolution Logic

```ts
// src/utils/resolveNotificationLink.ts

import { Notification } from "@/lib/api/notifications";

/**
 * Returns the navigation target for a notification.
 * Uses the backend-provided actionUrl, with a fallback to the inbox.
 */
export function resolveNotificationLink(notification: Notification): string {
  return notification.actionUrl ?? "/dashboard/notifications";
}
```

The `NotificationItem` click handler calls this helper:

```ts
const handleClick = async (notification: Notification) => {
  await notificationsService.markAsRead(notification.id);
  router.push(resolveNotificationLink(notification));
};
```

### 9.2 Route Mapping Reference

The backend generates these `actionUrl` values. The web client uses them as-is:

| NotificationType               | `actionUrl` Pattern                                         |
| ------------------------------ | ----------------------------------------------------------- |
| `BOOKING_CREATED`              | `/dashboard/consultations?bookingId={bookingId}`            |
| `BOOKING_CONFIRMED`            | `/dashboard/consultations?bookingId={bookingId}`            |
| `BOOKING_CANCELLED`            | `/dashboard/consultations?bookingId={bookingId}`            |
| `BOOKING_RESCHEDULED`          | `/dashboard/consultations?bookingId={bookingId}`            |
| `BOOKING_COMPLETED`            | `/dashboard/consultations?bookingId={bookingId}`            |
| `BOOKING_REMINDER`             | `/dashboard/consultations?bookingId={bookingId}`            |
| `CLIENT_INVITATION`            | `/dashboard/professionals?invitationId={invitationId}`      |
| `CLIENT_REQUEST`               | `/dashboard/clients?requestId={requestId}`                  |
| `CLIENT_ACCEPTED`              | `/dashboard/clients?clientId={clientId}`                    |
| `CLIENT_DEPARTED`              | `/dashboard/clients?clientId={clientId}`                    |
| `MARKETPLACE_REQUEST_RECEIVED` | `/dashboard/marketplace/requests?requestId={requestId}`     |
| `MARKETPLACE_REQUEST_ACCEPTED` | `/dashboard/marketplace?requestId={requestId}`              |
| `MARKETPLACE_REQUEST_REJECTED` | `/dashboard/marketplace?requestId={requestId}`              |
| `MARKETPLACE_TRANSFER_REQUEST` | `/dashboard/marketplace/requests?requestId={requestId}`     |
| `REVIEW_RECEIVED`              | `/dashboard/reviews?reviewId={reviewId}`                    |
| `REVIEW_RESPONSE`              | `/dashboard/reviews?reviewId={reviewId}`                    |
| `DIET_PLAN_ASSIGNED`           | `/dashboard/nutrition/{planId}`                             |
| `WORKOUT_PLAN_ASSIGNED`        | `/dashboard/workout/{planId}`                               |
| `JOURNAL_ENTRY_ADDED`          | `/dashboard/progress?journalId={journalId}`                 |
| `TEAM_INVITATION`              | `/dashboard/teams?teamId={teamId}`                          |
| `TEAM_MEMBER_JOINED`           | `/dashboard/teams/{teamId}`                                 |
| `TEAM_MEMBER_REMOVED`          | `/dashboard/teams`                                          |
| `SUBSCRIPTION_CREATED`         | `/dashboard/subscriptions?id={subscriptionId}`              |
| `SUBSCRIPTION_EXPIRING`        | `/dashboard/subscriptions?id={subscriptionId}`              |
| `SUBSCRIPTION_EXPIRED`         | `/dashboard/subscriptions?id={subscriptionId}`              |
| `PAYMENT_RECEIVED`             | `/dashboard/billing?paymentId={paymentId}`                  |
| `VERIFICATION_APPROVED`        | `/dashboard/settings`                                       |
| `VERIFICATION_REJECTED`        | `/dashboard/verification`                                   |
| `SYSTEM_ANNOUNCEMENT`          | `/dashboard/notifications`                                  |
| `ACCOUNT_SUSPENDED`            | `/dashboard/settings`                                       |

### 9.3 Email Links

Email templates use full URLs: `FRONTEND_URL` + `actionUrl`. On mobile devices, iOS Universal Links and Android App Links intercept the domain and open the native app directly. If the app is not installed, the link opens in the browser.

### 9.4 Mobile App Route Resolution

The mobile app (`binectics-mobile`) receives the same `actionUrl` from the API and maps it to Expo Router paths:

```ts
// binectics-mobile/src/utils/resolveNotificationRoute.ts

export function resolveNotificationRoute(actionUrl: string): string {
  // "/dashboard/consultations?bookingId=x" → "/(tabs)/consultations?bookingId=x"
  // "/dashboard/nutrition/abc123"           → "/(tabs)/nutrition/abc123"
  // "/dashboard/settings"                   → "/(tabs)/profile/settings"
  return actionUrl.replace(/^\/dashboard/, "/(tabs)");
}
```

The mobile app must configure deep linking in `app.json`:

```json
{
  "expo": {
    "scheme": "binecticsmobile",
    "ios": {
      "associatedDomains": ["applinks:binectics.netlify.app"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [{ "scheme": "https", "host": "binectics.netlify.app", "pathPrefix": "/dashboard" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

The web domain must serve:
- `/.well-known/apple-app-site-association` (iOS)
- `/.well-known/assetlinks.json` (Android)

---

## 10) Notification Type Icons

Visual mapping for the notification list:

| Category     | Types                                        | Icon        | Color                       |
| ------------ | -------------------------------------------- | ----------- | --------------------------- |
| Booking      | `BOOKING_*`                                  | Calendar    | `text-accent-blue-600`      |
| Client       | `CLIENT_*`                                   | User        | `text-primary-500`          |
| Marketplace  | `MARKETPLACE_*`                              | Store       | `text-accent-yellow-600`    |
| Review       | `REVIEW_*`                                   | Star        | `text-accent-yellow-500`    |
| Plan         | `DIET_PLAN_*`, `WORKOUT_PLAN_*`, `JOURNAL_*` | Clipboard   | `text-accent-purple-600`    |
| Team         | `TEAM_*`                                     | Users       | `text-accent-blue-500`      |
| Payment      | `SUBSCRIPTION_*`, `PAYMENT_*`                | CreditCard  | `text-primary-500`          |
| Verification | `VERIFICATION_*`                             | ShieldCheck | `text-primary-500`          |
| System       | `SYSTEM_*`, `ACCOUNT_*`                      | Bell        | `text-foreground-secondary` |

---

## 11) UI Design

### Notification Inbox Page

```
┌──────────────────────────────────────────────┐
│  Notifications                [Mark all read] │
│  ─────────────────────────────────────────── │
│  [All] [Unread]                              │
│                                              │
│  🔵 📅 Booking Confirmed                    │
│     Your consultation with Dr. Patel on...   │
│     2 hours ago                              │
│  ─────────────────────────────────────────── │
│     📅 Booking Completed                     │
│     Your session with Coach Martinez...      │
│     Yesterday                                │
│  ─────────────────────────────────────────── │
│  🔵 ⭐ New Review                           │
│     A client left a 5-star review on...      │
│     2 days ago                               │
│  ─────────────────────────────────────────── │
│                                              │
│  [Load more]                                 │
└──────────────────────────────────────────────┘
```

- 🔵 = unread indicator (blue dot on the left)
- Read notifications have no dot and slightly muted text
- Cards use `rounded-xl border border-neutral-200` styling
- Page follows existing dashboard card patterns

### Navbar Bell

```
┌───────────────────────────────┐
│  Logo    Dashboard  ...  🔔⁵  │
└───────────────────────────────┘
```

- Red circular badge, `bg-red-500 text-white`, positioned top-right of bell icon
- "5" or "9+" text

---

## 12) Mobile Responsiveness

- Notification inbox: single-column, full-width cards.
- Notification items: title and timestamp on one line, message below.
- Bell icon in mobile navbar/hamburger header.
- Filter tabs scroll horizontally if needed.
- Touch targets ≥ 44px.

---

## 13) State Management

No global store needed. Page-level state with the `useNotificationCount` hook for the badge.

- Inbox page manages its own `notifications[]`, `page`, `filter` state.
- After marking as read, update local state optimistically and call `refresh()` on the count hook.
- Preferences page fetches on mount, saves on submit.

---

## 14) Existing File Changes

| File                                                | Change                                                      |
| --------------------------------------------------- | ----------------------------------------------------------- |
| `src/components/DashboardSidebar.tsx`               | Add notification bell to header area                        |
| `src/components/DietitianSidebar.tsx`               | Add notification bell to header area                        |
| `src/components/TrainerSidebar.tsx`                 | Add notification bell to header area                        |
| `src/components/GymOwnerSidebar.tsx`                | Add notification bell to header area                        |
| `src/components/AdminSidebar.tsx`                   | Add notification bell to header area                        |
| `src/app/dashboard/settings/notifications/page.tsx` | Wire to backend API instead of local state                  |
| `src/lib/schemas/settings.ts`                       | Update schema to match API fields (remove push/sms for now) |

---

## 15) Implementation Order

1. **API client**: `src/lib/api/notifications.ts` — types, enums, service methods.
2. **Hook**: `useNotificationCount` — polling logic.
3. **NotificationBell**: Bell icon component with badge.
4. **Sidebar integration**: Add bell to all dashboard sidebars.
5. **Notification inbox page**: `/dashboard/notifications` — list, filter, mark read, pagination.
6. **Deep-link helper**: `resolveNotificationLink()` using backend-provided `actionUrl`.
7. **Preferences wiring**: Connect settings page to API.

---

## 16) Future Considerations

- **Toast notifications**: Show a brief popup when a new notification arrives.
- **Push notifications**: FCM/APN integration with device token registration flow.
- **Notification center dropdown**: Bell click opens a dropdown panel instead of navigating to full page.
- **Notification sounds**: Optional audio cue for high-priority notifications.
