# Binectics Mobile App — Product Requirements Document (PRD)

**Version:** 1.2
**Date:** 2026-05-09
**Status:** Draft
**Timeline:** 12-Week Accelerated MVP

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Target Platforms & Tech Stack](#2-target-platforms--tech-stack)
3. [MVP Scope — In vs Out](#3-mvp-scope--in-vs-out)
4. [User Roles & Access](#4-user-roles--access)
5. [Feature Specifications](#5-feature-specifications)
6. [Mobile-Specific Features](#6-mobile-specific-features)
7. [Navigation Architecture](#7-navigation-architecture)
8. [Screen Inventory](#8-screen-inventory)
9. [API Integration Strategy](#9-api-integration-strategy)
10. [Design System Adaptation](#10-design-system-adaptation)
11. [Release Strategy & Phasing](#11-release-strategy--phasing)
12. [Testing Strategy](#12-testing-strategy)
13. [App Store Requirements](#13-app-store-requirements)
14. [Appendices](#14-appendices)

---

## 1. Executive Summary

### Vision

Binectics Mobile brings the global fitness marketplace to iOS and Android, enabling fitness enthusiasts, gym owners, trainers, and dietitians to connect, transact, and track progress from their phones. The mobile app leverages native device capabilities — camera-based QR check-in, biometric authentication, push notifications, GPS-based discovery, and offline access — to deliver experiences that the web app cannot match.

### Why Mobile

- **QR Check-in**: Native camera scanning is dramatically faster and more reliable than browser-based scanning. This is the single biggest UX improvement mobile delivers.
- **Push Notifications**: Real-time alerts for subscription events, check-in reminders, and new reviews — not possible with email-only notifications on web.
- **Location Discovery**: Native GPS for "near me" gym and trainer discovery with map view.
- **Biometric Auth**: Face ID and fingerprint unlock for frictionless daily use.
- **Offline Access**: Cached subscriptions, plans, and journal entries for use without connectivity.
- **Always Available**: Providers can manage clients, write journal entries, and monitor dashboards on the go.

### Scope

- Same Azure backend API — **no new backend required** (one new endpoint pair for FCM token registration; all other endpoints shared with web)
- **50+ countries**, multi-currency (USD, EUR, GBP, NGN, KES, ZAR, AED, INR)
- **5 user roles** on mobile (admin panel remains web-only)
- **~65-70 screens** for MVP
- **12-week accelerated timeline** to App Store and Play Store submission

---

## 2. Target Platforms & Tech Stack

### Platforms

| Platform | Minimum Version | Rationale |
|----------|----------------|-----------|
| iOS | 16.0+ | Covers ~95% of active iOS devices; required for latest Expo SDK |
| Android | 10 (API 29)+ | Covers ~90% of active Android devices; required for scoped storage |

### Tech Stack: React Native + Expo

| Layer | Technology | Justification |
|-------|-----------|---------------|
| Framework | React Native + Expo SDK 52+ | Shared TypeScript/React expertise with web team; maximizes code and type sharing |
| Language | TypeScript 5.x | Same as web codebase; shared types from `src/lib/types/index.ts` |
| Navigation | React Navigation v7 | Industry standard for React Native; supports tabs, stacks, modals, bottom sheets |
| State Management | Zustand | Lightweight, TypeScript-first; matches web's context-based patterns without boilerplate |
| API Client | Axios or fetch (adapted from web `ApiClient`) | Reuse same API contract; swap `localStorage` for `AsyncStorage`/`SecureStore` |
| Forms | React Hook Form + Zod | Same as web; shared validation schemas from `src/lib/schemas/` |
| Payments | Stripe React Native SDK, Paystack Inline (WebView), Flutterwave RN SDK | Multi-gateway support matching web implementation |
| QR Scanning | `expo-camera` or `react-native-vision-camera` | Native camera access with barcode detection |
| Maps | `react-native-maps` (MapView) | Google Maps on Android, Apple Maps on iOS |
| Push Notifications | Expo Notifications + FCM/APNs | Cross-platform push with deep linking |
| Secure Storage | `expo-secure-store` | Encrypted token storage (Keychain on iOS, Keystore on Android) |
| Offline | `@react-native-async-storage/async-storage` + custom cache layer | Cached API responses for offline viewing |
| Image Handling | `expo-image-picker` + `expo-file-system` | Profile photos, gym images, document uploads |
| Animations | `react-native-reanimated` | Smooth transitions, bottom sheet gestures |

### Alternatives Considered

| Option | Rejected Because |
|--------|-----------------|
| Flutter | Dart language — no code sharing with TypeScript web codebase; different ecosystem |
| Native (Swift + Kotlin) | Double development cost; no code sharing; team expertise is React/TypeScript |
| PWA | No native camera access quality, no push on iOS (limited), no App Store presence |

---

## 3. MVP Scope — In vs Out

### In for v1

#### Consumer Features
- Authentication (email/password, biometric unlock, 30-day remember me)
- Marketplace discovery (search with debounce, category tabs with live counts, sort by rating/newest, native GPS location, map view)
- Provider profiles (gym/trainer/dietitian) with plan details, amenities, specialties, acceptance status
- Plan purchase and subscription management (including auto-renew toggle)
- QR check-in via native camera
- User dashboard (active subscriptions, check-in history, streaks, featured listings, recommended providers, category browsing)
- Push notifications via FCM (38 notification types — see Section 5.11)
- Multi-currency payments (Stripe, Paystack, Flutterwave) with provider-level gateway customization
- Reviews and ratings (submit, read, provider responses)
- Health tracking (weight logs, meal feedback with meal type/rating, activity reports with type/duration/intensity/calories)
- Client journals (read-only for fitness enthusiasts)
- Gamification dashboard (points, badges, streaks — read-only display)
- Rich text content rendering (provider bios, announcements, recommendations)
- Profile settings and account management
- Notification preferences (13 toggles across email + in-app channels)
- Offline mode (read-only cache of subscriptions, plans, journals)
- Client invitation acceptance flow (accept/decline provider connection requests)

#### Full Provider Dashboards
- **Gym Owner**: Dashboard stats, profile management (rich text bio), plan CRUD, member management, multi-location listing management, QR code display, check-in analytics (today/week/month breakdowns, revenue bars), revenue dashboard with recent check-in feed, attendance history
- **Trainer**: Dashboard stats, profile management (rich text bio), plan CRUD, client management, client invitation flow, journal writing (notes, weight, mood, adherence), workout plan CRUD (structured exercises with sets/reps/duration/rest), analytics
- **Dietitian**: Dashboard stats, profile management (rich text bio), plan CRUD, client management, client invitation flow, journal writing, meal plan creation and assignment, diet plan CRUD (structured meals with document/PDF support), analytics

### Out for v1 (Deferred)

| Feature | Deferred To | Reason |
|---------|-------------|--------|
| Admin panel | Web-only | Complex workflows (verification queue, user suspension, metrics) need desktop screen real estate |
| Verification document upload | Web-only | Multi-file upload with document type selection is complex on mobile; providers do this once |
| Consultation booking calendar | v2 | Complex calendar UI with timezone handling; needs dedicated design phase |
| Health API integrations | v1.1 | Samsung Health, Google Fit, Apple Health, Strava OAuth — valuable but not MVP-critical |
| Team/organization management | v1.1 | Staff roles, invitations, permissions — complex admin workflow |
| In-app messaging/chat | v2 | Requires WebSocket infrastructure and chat UI |
| Dark mode | v1.1 | Design system adaptation needed; not launch-blocking |
| iOS widgets | v1.1 | Check-in streak widget, today summary — nice-to-have |
| Wearable companion apps | v2+ | watchOS/Wear OS apps |

---

## 4. User Roles & Access

### Role-Based Navigation

| Role | Tab Bar | Dashboard Access | Special Features |
|------|---------|-----------------|-----------------|
| `USER` (Fitness Enthusiast) | Explore, Check-in, Activity, Notifications, Profile | User dashboard | QR scanning, review writing, journal reading |
| `GYM_OWNER` | Explore, Check-in, Activity, Notifications, Profile | Gym Owner dashboard (in Profile tab) | QR code display, member management, plan CRUD |
| `TRAINER` | Explore, Check-in, Activity, Notifications, Profile | Trainer dashboard (in Profile tab) | Client journals (write), plan CRUD |
| `DIETITIAN` | Explore, Check-in, Activity, Notifications, Profile | Dietitian dashboard (in Profile tab) | Client journals (write), meal plans, plan CRUD |
| `ADMIN` | N/A | N/A | Redirect to web app with message "Admin features are available on the web dashboard" |

### Enum Reference

```typescript
// From src/lib/types/index.ts — shared with mobile
enum UserRole {
  USER = "USER",
  GYM_OWNER = "GYM_OWNER",
  TRAINER = "TRAINER",
  DIETITIAN = "DIETITIAN",
  ADMIN = "ADMIN",
}

enum AccountType {
  GYM_OWNER = "gym_owner",
  PERSONAL_TRAINER = "personal_trainer",
  DIETITIAN = "dietitian",
  FITNESS_MEMBER = "fitness_member",
}

enum VerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

enum SubscriptionStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}
```

---

## 5. Feature Specifications

### 5.1 Authentication

**Screen Flow:**
```
Splash → Onboarding (3 slides, first-launch only) → Login
                                                    ↓
                                              Register → Role Selection → Role-Specific Form → Email Verification
                                                    ↓
                                              Forgot Password → Check Email → Reset Password (deep link)
```

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/login` | Email/password login; includes `rememberMe` boolean |
| POST | `/auth/register` | Create account with role |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/forgot-password` | Request password reset email |
| POST | `/auth/reset-password` | Reset password with token |
| GET | `/auth/verify-email/:token` | Verify email address |
| GET | `/auth/me` | Get current user profile |

**Mobile-Specific Behavior:**
- **Biometric unlock**: After first successful login, prompt "Enable Face ID / Fingerprint?" → store refresh token in `expo-secure-store` (encrypted Keychain/Keystore) → on subsequent launches, biometric challenge → auto-login
- **Secure token storage**: Access token in memory, refresh token in `expo-secure-store` (NOT `AsyncStorage`)
- **Deep link from email**: Verification and reset emails include `binectics://verify-email/{token}` and `binectics://reset-password/{token}` universal links
- **Onboarding slides** (first launch only):
  1. "Find Gyms & Trainers Near You" — map illustration
  2. "Check In with QR" — phone scanning illustration
  3. "Track Your Progress" — dashboard illustration

**Registration Fields by Role:**
- All roles: email, password, first_name, last_name, phone_number, country_code, accept_tos
- Gym Owner: + company_name
- Trainer: + specializations (multi-select)
- Dietitian: + specializations (multi-select)

### 5.2 Marketplace Discovery

**Screen Flow:**
```
Home (List View) ↔ Map View
       ↓
  Filter Sheet (bottom sheet)
       ↓
  Search Results (infinite scroll)
       ↓
  Provider Detail → Plans Tab → Plan Detail → Checkout
```

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/marketplace/listings` | Search with filters, pagination |
| GET | `/marketplace/listings/:id` | Provider detail |
| GET | `/marketplace/listings/:id/plans` | Provider's active plans |
| GET | `/marketplace/listings/:id/reviews` | Provider reviews |

**Search Parameters** (from `SearchFilters` type):
- `query` — free text search (debounced 400ms on mobile, same as web)
- `city`, `country` — location filter
- `location` (lat/lng) + `radius` — GPS-based "near me"
- `min_rating` — minimum star rating
- `max_price` — price ceiling
- `facilities[]` — gym facility filter
- `specializations[]` — trainer/dietitian specialty filter
- `type` — `gym_owner` | `personal_trainer` | `dietitian`
- `sort` — `rating` | `newest`
- `page`, `limit` — pagination

**Mobile-Specific Behavior:**
- **Category tabs**: Horizontal scroll tabs (All / Gyms / Trainers / Dietitians) with live result counts per category
- **Sort toggle**: Rating (default) or Newest
- **Map View**: Full-screen map with provider markers (colored by type: blue=gym, yellow=trainer, purple=dietitian); tap marker → preview card → tap card → detail screen
- **"Near Me" toggle**: Requests location permission on first use; sorts results by distance; shows distance badge on cards
- **Listing cards**: Show type badge, headline, specialties/amenities (first 3), location, star rating with count, price label, acceptance status
- **Pull-to-refresh**: On list view
- **Infinite scroll**: Load next page when 80% scrolled
- **Filter bottom sheet**: Slides up from bottom with sections for type, price range, rating, facilities, specializations; "Apply" button with result count preview

### 5.3 Provider Profiles & Plan Purchase

**Screen Flow:**
```
Provider Detail
  ├── About tab (rich text bio, specialties, certifications, amenities, photos gallery)
  ├── Plans tab (list of active plans with price/currency/duration/features)
  │     └── Plan Detail → "Subscribe" → Checkout (auto-renew toggle for subscriptions)
  └── Reviews tab (star summary + review list + provider responses)
        └── "Write Review" (if eligible — requires active/completed subscription)
```

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/marketplace/listings/:id` | Full provider profile |
| GET | `/marketplace/listings/:id/plans` | Active plans |
| POST | `/marketplace/listings/:id/subscribe` | Create subscription |
| POST | `/marketplace/listings/:id/reviews` | Submit review |

**Mobile-Specific Behavior:**
- **Share button**: Native share sheet to share provider profile URL
- **Photo gallery**: Swipeable full-screen image viewer for gym/portfolio photos
- **Plan comparison**: Side-by-side scroll if multiple plans
- **Haptic feedback**: On successful subscription purchase

### 5.4 QR Check-in

> **This is the marquee mobile feature — the single biggest UX improvement over web.**

**Screen Flow:**
```
Check-in Tab → Camera Scanner → Scanning...
                                    ↓ (success)
                              Check-in Confirmed (animated ✓, streak count, haptic)
                                    ↓ (failure)
                              Error Screen (no subscription, already checked in, invalid QR)
```

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/checkins/scan` | Submit QR check-in (body: `{ qr_code: string }`) |
| GET | `/checkins/my-status` | Current check-in status for today |
| GET | `/checkins/dashboard-stats` | Check-in streak and stats |
| GET | `/checkins/history` | Check-in history list |

**Mobile-Specific Behavior:**
- **Full-screen camera**: Camera viewfinder fills screen with translucent overlay and scan guide rectangle
- **Flashlight toggle**: Button to toggle phone flashlight for dark gyms
- **Auto-detect**: Automatically detects QR code and submits — no "scan" button needed
- **Success state**: Haptic feedback (medium impact) + animated green checkmark + streak counter update + confetti for milestones (10th, 50th, 100th check-in)
- **Error handling**:
  - No active subscription → "Subscribe to this gym first" with link to gym profile
  - Already checked in today → "You've already checked in today! 💪" with check-in time
  - Invalid QR → "This QR code isn't recognized. Please try again."
- **Permission handling**: Graceful camera permission request with explanation; fallback to settings link if denied

### 5.5 User Dashboard

**Screen Flow:**
```
Activity Tab (Home)
  ├── Onboarding Banner (dismissible, for new users)
  ├── Check-in Status Widget (has_checked_in_today, current streak, last check-in)
  ├── Active Subscriptions (horizontal scroll cards)
  ├── Featured Provider (top-rated listing with rating, location, specialties, acceptance status)
  ├── Recommended For You (4 listing cards, sorted by rating)
  ├── Browse by Category (Gyms / Trainers / Dietitians / All — with real counts)
  ├── Journal Entries Summary (count badge, recent entries)
  ├── Gamification Summary (points, level, badges preview)
  └── Quick Actions ("Check In", "Find Gym", "My Reviews")
        ↓
  Subscriptions List → Subscription Detail (provider info, plan, dates, status, cancel, auto-renew toggle)
  Check-in History → Filterable list by date/gym
  Gamification → Badges gallery, points history
  Health Tracking → Weight Log, Meal Feedback, Activity Reports
```

**API:** Same backend endpoints as web (`/marketplace/*`, `/checkins/*`, `/progress/*`). Featured listings via `/marketplace/featured`.

### 5.6 Payments

**Screen Flow:**
```
Plan Detail → Checkout (plan summary, payment method selection)
                ↓
          Payment Processing (loading state)
                ↓ (success)           ↓ (failure)
          Payment Success          Payment Failed (retry option)
```

**Payment Gateway Selection:**
```typescript
// Currency-based routing (same logic as web)
function getPaymentGateway(currency: string): "stripe" | "paystack" | "flutterwave" {
  if (["NGN", "GHS", "KES", "ZAR"].includes(currency)) return "paystack";
  if (["NGN", "GHS", "KES", "TZS", "UGX"].includes(currency)) return "flutterwave";
  return "stripe"; // Default for USD, EUR, GBP, etc.
}
```

**Mobile SDK Integration:**
| Gateway | SDK | Integration Method |
|---------|-----|-------------------|
| Stripe | `@stripe/stripe-react-native` | Native payment sheet (Apple Pay, Google Pay, cards) |
| Paystack | Paystack inline script | WebView-based payment modal |
| Flutterwave | `flutterwave-react-native` | Native SDK or WebView fallback |

**Mobile-Specific Behavior:**
- **Apple Pay / Google Pay**: Enabled via Stripe payment sheet where available
- **Saved cards**: Display previously used payment methods (via Stripe customer)
- **Processing state**: Full-screen loading with animated spinner, no back navigation allowed
- **Success**: Haptic feedback + animated success illustration + "View Subscription" CTA
- **Receipt**: Option to share receipt via native share sheet

### 5.7 Reviews & Ratings

**Screen Flow:**
```
Provider Detail → Reviews Tab → "Write a Review"
                                      ↓
                                Star Rating (1-5, tap or swipe)
                                      ↓
                                Comment (optional text)
                                      ↓
                                Submit → Success
```

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/marketplace/listings/:id/reviews` | List reviews with pagination |
| POST | `/marketplace/listings/:id/reviews` | Submit review (requires active/completed subscription) |
| PATCH | `/reviews/:id` | Edit own review (within 24h window) |
| DELETE | `/reviews/:id` | Delete own review |

**Eligibility:**
- User must have an active or completed subscription/booking with the provider
- One review per provider per user
- Edit/delete window: 24 hours after submission

**Mobile-Specific Behavior:**
- **Star input**: Large tap targets (44pt minimum); supports half-star via horizontal swipe gesture
- **Haptic**: Light haptic on each star selection
- **Confirmation**: "Review submitted!" toast notification

### 5.8 Gym Owner Dashboard (Full)

**Screen Flow:**
```
Profile Tab → "My Dashboard" → Gym Owner Home
  ├── Stats Cards (active members, avg rating + review count, monthly revenue)
  ├── Check-in Activity (today / this week / this month with bar chart)
  ├── Revenue Overview (today / week / month with currency formatting)
  ├── Recent Check-ins (live feed with member names + timestamps)
  ├── Quick Actions
  │
  ├── Profile Management → Edit Gym Profile (rich text bio, address, facilities, amenities, photos, hours)
  ├── Listings → Multi-Location Manager (if multiple locations)
  │     └── Per-Location: facility items CRUD, gallery management, amenities, documents
  ├── Plans → Plan List → Create/Edit Plan (name, price, currency, duration, features, active toggle)
  ├── Members → Member List (search, filter by status) → Member Detail (subscription info, check-in history)
  ├── QR Code → Full-Screen QR Display (for posting at gym entrance)
  ├── Check-ins → Check-in Log (filterable by date, searchable by member)
  ├── Revenue → Revenue Dashboard (today/week/month cards, breakdown bars, recent check-ins table)
  ├── Analytics → Charts (check-ins today/week/month, revenue breakdowns, member count)
  └── Payment Config → Gateway Settings (web-only — display "Configure on web" message)
```

**API:** Same backend endpoints as web (`/checkins/*`, `/marketplace/*`). Multi-location via `/marketplace/my-listings`.

**Mobile-Specific Behavior:**
- **QR Display Mode**: Full-screen, maximum brightness, no auto-lock — designed to be displayed at gym entrance on a mounted tablet/phone
- **Revenue cards**: Multi-currency formatting with native currency symbols (₦, KSh, R, etc.)
- **Payment gateway config**: Not available on mobile — show "Configure payment gateways on the web dashboard" message with link
- **Multi-location**: If gym has multiple listings, show location picker at top of dashboard
- **Pull-to-refresh**: On all list screens
- **Quick actions**: Floating action button for "Create Plan"

### 5.9 Trainer Dashboard (Full)

**Screen Flow:**
```
Profile Tab → "My Dashboard" → Trainer Home
  ├── Stats Cards (total clients, active plans, this week's sessions)
  ├── Today's Clients (list of today's sessions/subscribers)
  ├── Pending Requests & Invitations
  ├── Quick Actions
  │
  ├── Profile Management → Edit Trainer Profile (rich text bio, specializations, certifications, portfolio photos)
  ├── Plans → Plan List → Create/Edit Plan
  ├── Clients → Client List (search, quick stats cards) → Client Detail
  │     ├── Client Summary (current weight, weight change, activities 30d, meals 30d)
  │     ├── Write Journal Entry (notes, weight, mood dropdown, adherence slider 0-100)
  │     ├── Journal History (cursor-based pagination)
  │     ├── Weight Log History (last 5 entries, sparkline chart)
  │     ├── Recent Activities (last 5, with type badges)
  │     └── Recent Meals (last 5, with meal type badges)
  ├── Invite Client → Email invite with message
  ├── Workout Plans → Plan Library → Create/Edit Workout Plan (exercises with sets/reps/duration/rest)
  └── Analytics → Charts (client growth, plan performance)
```

**API:** Same backend endpoints as web (`/marketplace/*`, `/progress/*`). See Section 9 for full API surface.

**New Enums (from backend — shared with web):**
```typescript
enum MealType { BREAKFAST = "breakfast", LUNCH = "lunch", DINNER = "dinner", SNACK = "snack" }
enum MealRating { GREAT = "great", GOOD = "good", OKAY = "okay", POOR = "poor" }
enum ActivityType { CARDIO = "cardio", STRENGTH = "strength", FLEXIBILITY = "flexibility", HIIT = "hiit", YOGA = "yoga", SWIMMING = "swimming", CYCLING = "cycling", RUNNING = "running", WALKING = "walking", OTHER = "other" }
enum ClientJournalMood { EXCELLENT = "excellent", GOOD = "good", OKAY = "okay", LOW = "low", STRESSED = "stressed" }
```

**Mobile-Specific Behavior:**
- **Client detail**: 4-stat summary cards at top, tabbed sections below (Journals, Weight, Activities, Meals)
- **Workout plan creation**: Step-by-step wizard (Plan info → Add exercises → Review → Save)
- **Invite client**: Bottom sheet with email + optional message, sends `CLIENT_INVITATION` notification

### 5.10 Dietitian Dashboard (Full)

**Screen Flow:**
```
Profile Tab → "My Dashboard" → Dietitian Home
  ├── Stats Cards (total clients, active meal plans, this week's consultations)
  ├── Recent Client Activity
  ├── Pending Requests & Invitations
  ├── Quick Actions
  │
  ├── Profile Management → Edit Dietitian Profile (rich text bio, specializations, certifications, company)
  ├── Plans → Plan List → Create/Edit Plan
  ├── Clients → Client List (quick stats cards: Weight, Activities, Meals) → Client Detail
  │     ├── Client Summary (current weight, weight change, activities 30d, meals 30d)
  │     ├── Write Journal Entry (notes, weight, mood, adherence)
  │     ├── Journal History (cursor-based pagination)
  │     ├── Weight Log History (sparkline chart)
  │     ├── Recent Activities & Meals (with type badges)
  │     └── Assigned Diet Plans
  ├── Invite Client → Email invite with message
  ├── Diet Plans → Plan Library → Create/Edit Diet Plan (structured meals, PDF document support)
  ├── Meal Plans → Meal Plan Library → Create/Edit Meal Plan → Assign to Clients
  └── Analytics → Charts (client progress, weight trends, plan performance)
```

**API:** Same backend endpoints as web (`/marketplace/*`, `/progress/*`). Diet plans support document upload and access URLs for PDF viewing.

**Mobile-Specific Behavior:**
- **Meal plan creation**: Step-by-step wizard (Title → Meals → Review → Save)
- **Diet plan PDF viewing**: Open document URLs in native PDF viewer or in-app WebView
- **Assign to clients**: Multi-select client picker bottom sheet
- **Invite client**: Bottom sheet with email + optional message
- **Weight trend**: Inline sparkline chart on client detail showing weight over time

### 5.11 Notifications (Mobile vs Web — Separate Architectures)

> **Important:** Mobile and web notifications are fundamentally different systems. The web app uses SSE (Server-Sent Events) for real-time streaming and an in-app notification inbox. The mobile app uses **Firebase Cloud Messaging (FCM)** for native push delivery and the OS notification center. These are two separate approaches that share the same backend notification data but differ in delivery, display, and interaction.

#### 5.11.1 Mobile Push Notifications via FCM

**Architecture:**
```
Backend Event (e.g., new subscription)
    ↓
Backend Notification Service
    ↓
Firebase Cloud Messaging (FCM)
    ├── APNs (iOS) → iOS Notification Center → Lock screen / Banner / Badge
    └── FCM (Android) → Android Notification Tray → Heads-up / Badge
    ↓ (user taps notification)
Deep Link → App opens to target screen
```

**Why FCM (not SSE like web):**
- Native push works when the app is **closed or backgrounded** — SSE requires an active connection
- OS-level notification tray is the expected mobile UX — users don't check an "inbox page" on mobile
- FCM handles device-level concerns (battery optimization, Doze mode, APNs bridging) that a custom SSE solution cannot
- Badge counts on the app icon are managed via FCM payload, not client-side polling

**Notification Types (38 — matching backend `NotificationType` enum):**

| Type | Trigger | Deep Link Target | Priority | Channel (Android) |
|------|---------|-----------------|----------|-------------------|
| **Booking Lifecycle** | | | | |
| `BOOKING_CREATED` | New booking created | Booking detail | High | Bookings |
| `BOOKING_CONFIRMED` | Provider confirms booking | Booking detail | High | Bookings |
| `BOOKING_CANCELLED` | Booking cancelled by either party | Booking detail | Medium | Bookings |
| `BOOKING_RESCHEDULED` | Booking time changed | Booking detail | High | Bookings |
| `BOOKING_COMPLETED` | Session completed | Booking detail | Low | Bookings |
| `BOOKING_REMINDER` | Upcoming session reminder | Booking detail | High | Reminders |
| **Client Management** | | | | |
| `CLIENT_INVITATION` | Provider invites client | Client invitation | High | Activity |
| `CLIENT_REQUEST` | Client requests to connect | Client requests | High | Activity |
| `CLIENT_ACCEPTED` | Connection request accepted | Client detail | Medium | Activity |
| `CLIENT_DEPARTED` | Client leaves provider | Client list | Medium | Activity |
| **Marketplace** | | | | |
| `MARKETPLACE_REQUEST_RECEIVED` | New marketplace request | Marketplace requests | High | Activity |
| `MARKETPLACE_REQUEST_ACCEPTED` | Request accepted by provider | Listing detail | Medium | Activity |
| `MARKETPLACE_REQUEST_REJECTED` | Request rejected by provider | Marketplace | Medium | Activity |
| `MARKETPLACE_TRANSFER_REQUEST` | Transfer request between providers | Marketplace requests | High | Activity |
| **Reviews** | | | | |
| `REVIEW_RECEIVED` | Client submits review | Review detail | Medium | Activity |
| `REVIEW_RESPONSE` | Provider responds to review | Review detail | Medium | Activity |
| **Plans & Progress** | | | | |
| `DIET_PLAN_ASSIGNED` | Dietitian assigns diet plan | Diet plan detail | High | Activity |
| `WORKOUT_PLAN_ASSIGNED` | Trainer assigns workout plan | Workout plan detail | High | Activity |
| `JOURNAL_ENTRY_ADDED` | Provider writes journal entry | Journal entry | Medium | Activity |
| `MEAL_LOGGED` | Client logs a meal | Client detail | Low | Activity |
| **Team** | | | | |
| `TEAM_INVITATION` | Invited to join team/org | Team invitation | High | Teams |
| `TEAM_MEMBER_JOINED` | New member joined team | Team members | Medium | Teams |
| `TEAM_MEMBER_REMOVED` | Member removed from team | Team | Medium | Teams |
| **Subscriptions & Payments** | | | | |
| `SUBSCRIPTION_CREATED` | New subscription purchased | Subscription detail | High | Transactions |
| `SUBSCRIPTION_EXPIRING` | 3 days before end date | Subscription detail | High | Transactions |
| `SUBSCRIPTION_EXPIRED` | Subscription end date passed | Subscription detail | Medium | Transactions |
| `PAYMENT_RECEIVED` | Payment processed successfully | Payment receipt | High | Transactions |
| **Verification** | | | | |
| `VERIFICATION_APPROVED` | Provider verification approved | Provider dashboard | High | Activity |
| `VERIFICATION_REJECTED` | Provider verification rejected | Verification status | High | Activity |
| **System** | | | | |
| `SYSTEM_ANNOUNCEMENT` | Admin broadcasts announcement | Announcement detail | High | Announcements |
| `ACCOUNT_SUSPENDED` | Admin suspends account | Profile | Critical | System |
| **Check-in** | | | | |
| `CHECKIN_REMINDER` | Daily at user's preferred time | QR scanner | Medium | Reminders |

**FCM Token Lifecycle:**
1. **On app launch**: Request notification permission (iOS requires explicit prompt)
2. **On permission granted**: Get FCM token via `expo-notifications` → `getDevicePushTokenAsync()`
3. **On login**: Register token with backend via `POST /users/device-token`
4. **On token refresh**: FCM may rotate tokens — listen for `onTokenRefresh` and re-register
5. **On logout**: Unregister token via `DELETE /users/device-token`
6. **On permission revoked**: Gracefully handle — no push, show in-app fallback

**FCM Payload Format:**
```json
{
  "notification": {
    "title": "Check-in Reminder",
    "body": "Don't forget to check in at FitZone Gym today!"
  },
  "data": {
    "type": "checkin_reminder",
    "deepLink": "binectics://checkin",
    "entityId": "gym-123",
    "notificationId": "notif-456"
  },
  "android": {
    "notification": {
      "channel_id": "reminders",
      "priority": "high"
    }
  },
  "apns": {
    "payload": {
      "aps": {
        "badge": 3,
        "sound": "default",
        "content-available": 1
      }
    }
  }
}
```

**Android Notification Channels:**
| Channel ID | Name | Importance | Description |
|------------|------|-----------|-------------|
| `transactions` | Transactions | High | Subscription purchases, payments, expirations |
| `bookings` | Bookings | High | Booking lifecycle (created, confirmed, cancelled, rescheduled) |
| `reminders` | Reminders | Medium | Check-in reminders, booking reminders |
| `activity` | Activity | Medium | Reviews, journal entries, meal logs, client connections, marketplace requests |
| `teams` | Teams | Medium | Team invitations, member join/leave |
| `announcements` | Announcements | High | Platform-wide admin announcements |
| `system` | System | Critical | Account suspension, security alerts |

#### 5.11.2 Notification Linking — Universal Links vs In-App

When a user taps a push notification, the behavior depends on the app state:

**App State Handling:**

| App State | Behavior | Implementation |
|-----------|----------|----------------|
| **Killed / Not running** | OS launches app → deep link parsed on cold start → navigate to target screen | `expo-notifications` `getLastNotificationResponseAsync()` on app init |
| **Backgrounded** | OS brings app to foreground → deep link parsed → navigate to target screen | `expo-notifications` `addNotificationResponseReceivedListener()` |
| **Foregrounded** | In-app toast/banner shown (NOT system notification) → tap navigates to target | Custom in-app notification banner component |

**Universal Links (external → app):**

These are used when notifications arrive via channels outside FCM (e.g., email, SMS, web share):

| Source | URL Format | App Handling |
|--------|-----------|-------------|
| Email (verification) | `https://binectics.com/verify-email/{token}` | Universal link → app intercepts → verification screen |
| Email (password reset) | `https://binectics.com/reset-password/{token}` | Universal link → app intercepts → reset screen |
| Shared profile link | `https://binectics.com/gyms/{id}` | Universal link → app intercepts → gym detail |
| Web notification link | `https://binectics.com/dashboard/subscriptions/{id}` | Universal link → app intercepts → subscription detail |

**In-App Deep Links (FCM → app navigation):**

These use the custom scheme and are resolved entirely within the app:

| Deep Link | Target Screen | Resolution |
|-----------|--------------|------------|
| `binectics://checkin` | QR Scanner | Direct tab switch |
| `binectics://subscriptions/:id` | Subscription Detail | Activity tab → push to detail |
| `binectics://reviews/:id` | Review on provider profile | Provider detail → reviews tab |
| `binectics://journals/:id` | Journal entry | Activity tab → progress → journal |
| `binectics://clients/:id` | Client detail (provider) | Profile → dashboard → client |
| `binectics://announcements/:id` | Announcement detail | Notifications tab → detail |

**Link Resolution Logic:**
```typescript
// Mobile-specific — NOT shared with web's resolveNotificationLink.ts
function resolveDeepLink(data: NotificationData): string {
  switch (data.type) {
    case "subscription_created":
    case "subscription_expiring":
    case "subscription_expired":
      return `binectics://subscriptions/${data.entityId}`;
    case "checkin_reminder":
      return "binectics://checkin";
    case "new_review":
      return `binectics://reviews/${data.entityId}`;
    case "journal_entry":
      return `binectics://journals/${data.entityId}`;
    case "new_subscriber":
      return `binectics://clients/${data.entityId}`;
    case "meal_logged":
      return `binectics://clients/${data.entityId}`;
    case "announcement":
      return `binectics://announcements/${data.entityId}`;
    default:
      return "binectics://activity";
  }
}
```

#### 5.11.3 Admin Announcements on Mobile

Admin announcements are delivered differently on mobile than on web:

| Aspect | Web | Mobile |
|--------|-----|--------|
| **Delivery** | SSE real-time stream + in-app inbox | FCM push notification |
| **Display** | Appears in notification inbox page | Appears in OS notification tray + in-app banner |
| **Persistence** | Stored in notification list, paginated | Stored in OS notification history + fetched via API for in-app history |
| **Admin creation** | Web-only admin panel (`/admin/announcements`) | N/A — admin panel is web-only |
| **Backend flow** | `POST /notifications/broadcast` → creates notification records → SSE push | `POST /notifications/broadcast` → creates notification records → triggers FCM to all registered device tokens |

**Mobile announcement flow:**
1. Admin creates announcement on web → `POST /notifications/broadcast`
2. Backend creates notification records for all users
3. Backend sends FCM message to all registered device tokens with `channel_id: "announcements"`
4. Users receive native push notification
5. Tapping opens announcement detail screen (fetched via `GET /notifications/:id`)

#### 5.11.4 In-App Notification History

While the primary notification channel is FCM push, the mobile app also provides a lightweight notification history screen:

**Screen:** Notifications tab → Notification List (reverse-chronological)

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/notifications?page=1&limit=20` | Fetch notification history |
| POST | `/notifications/:id/read` | Mark single as read |
| POST | `/notifications/read-all` | Mark all as read |

**Key Differences from Web Inbox:**
- **No SSE connection** — new notifications arrive via FCM push, not streaming
- **No real-time update** — list refreshes on pull-to-refresh or screen focus, not live
- **Simpler UI** — flat list with read/unread styling, no category tabs or filters
- **Badge sync** — unread count synced from `GET /notifications?is_read=false&limit=1` (count from response metadata), displayed on tab bar icon

#### 5.11.5 Notification Preferences

**Screen:** Profile → Settings → Notification Preferences

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/notifications/preferences` | Load current preferences |
| PUT | `/notifications/preferences` | Update preferences |

**Per-type toggles (13 toggles across 2 channels — matching web):**

Email Notifications:
- Subscription updates
- Payment receipts
- Booking confirmations
- Cancellation alerts
- Reminders
- Newsletter
- Promotions

In-App Notifications:
- Bookings
- Payments
- Messages
- Reminders
- Promotions

System-critical notifications (verification, account suspension) are always on and cannot be disabled.

**Mobile-specific behavior:**
- Toggle "All Notifications" master switch — disables FCM entirely (unregisters token)
- Link to OS notification settings if system-level permissions are denied
- Quiet hours setting (v1.1): suppress push between user-defined hours

**Backend Endpoints Required for Mobile:**
| Method | Endpoint | Body | Purpose |
|--------|----------|------|---------|
| POST | `/users/device-token` | `{ token: string, platform: "ios" \| "android" }` | Register FCM token |
| DELETE | `/users/device-token` | `{ token: string }` | Unregister on logout |
| GET | `/notifications` | Query params: `page`, `limit`, `is_read` | Notification history |
| POST | `/notifications/:id/read` | — | Mark as read |
| POST | `/notifications/read-all` | — | Mark all as read |
| GET | `/notifications/preferences` | — | Load preferences |
| PUT | `/notifications/preferences` | `{ [type]: boolean }` | Update preferences |

### 5.12 Gamification Dashboard (Read-Only Display)

**Screen Flow:**
```
Activity Tab → Gamification Section
  ├── Points & Level (total points, current level, progress to next)
  ├── Streaks (current check-in streak, longest streak)
  ├── Badges Gallery (earned + locked badges with progress)
  └── Leaderboard Preview (top 5 + user's rank)
```

**API Endpoints:**
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/gamification/profile` | User's gamification profile |
| GET | `/gamification/badges` | Available and earned badges |
| GET | `/gamification/leaderboard` | Leaderboard data |

**Note:** All point calculations, badge awards, streak tracking, and leaderboard ranking are computed server-side. The mobile app only displays the results.

### 5.13 Rich Text Content

The web app uses a TipTap-based rich text editor for provider bios, announcements, and recommendations. Content is stored as sanitized HTML.

**Mobile Approach:**
- **Rendering (v1):** Use a lightweight HTML renderer (`react-native-render-html`) to display rich text content (bold, italic, headings, lists, links). Strip unsupported tags gracefully.
- **Editing (v1.1):** Rich text editing on mobile is deferred to v1.1. For v1, provider profile bio editing uses a plain text input. The web remains the primary editing surface for rich content.
- **Fallback:** Legacy plain-text bios are auto-wrapped in `<p>` tags (same as web).
- **Security:** All HTML is pre-sanitized server-side. Mobile renderer should also strip `<script>`, `<iframe>`, and event handler attributes as a defense-in-depth measure.

### 5.14 Health Tracking (Consumer)

Fitness enthusiasts can log their own health data. This is **read-write for consumers** (not just provider journals).

**Screen Flow:**
```
Activity Tab → Health Tracking
  ├── Weight Log → Log Weight (kg input) → Weight History (list + sparkline chart)
  ├── Meal Feedback → Log Meal (meal type, rating, calories, feedback text) → Meal History
  └── Activity Report → Log Activity (type, duration, intensity, calories) → Activity History
```

**API:** Same backend endpoints as web (`/progress/weight-logs`, `/progress/meal-feedback`, `/progress/activity-reports`).

**Mobile-Specific Behavior:**
- **Quick log**: Floating action button on Activity tab for rapid weight/meal/activity entry
- **Meal type picker**: Bottom sheet with breakfast/lunch/dinner/snack options
- **Activity type picker**: Grid of activity icons (running, cycling, yoga, etc.)
- **Haptic feedback**: On successful log submission

---

## 6. Mobile-Specific Features

### 6.1 Biometric Authentication

**Flow:**
1. User logs in with email/password for the first time
2. App prompts: "Enable Face ID / Fingerprint for quick access?"
3. If accepted: store refresh token in `expo-secure-store` (OS-level encryption)
4. On subsequent app opens: biometric challenge → retrieve stored token → auto-login via `/auth/refresh`
5. If biometric fails 3 times: fall back to email/password login
6. Biometric can be toggled on/off in Settings

**Security:**
- Access tokens are NEVER stored persistently — only kept in memory
- Refresh tokens stored in `expo-secure-store` (Keychain on iOS, Keystore on Android)
- Biometric re-prompt after 24 hours of inactivity even with remember-me enabled

### 6.2 Offline Mode

**Cached Data (read-only when offline):**
- Active subscriptions and plan details
- Recent journal entries (last 50)
- Check-in history (last 30 days)
- User profile
- Saved/favorited provider profiles

**Queued Actions (synced when back online):**
- QR check-in attempts (queued with timestamp, submitted on reconnect)

**Offline Indicators:**
- Banner at top of screen: "You're offline. Some features may be limited."
- Cached data shows "Last updated: [timestamp]"
- Action buttons that require connectivity are disabled with tooltip

**Cache Strategy:**
- `AsyncStorage` for JSON data with TTL (time-to-live)
- Cache invalidation on successful API response
- Maximum cache age: 24 hours for subscriptions, 1 hour for dashboard stats

### 6.3 Deep Linking

**URL Scheme:** `binectics://`
**Universal Links:** `https://binectics.com/...` and `https://www.binectics.com/...`

| URL Pattern | Target Screen | Context |
|-------------|--------------|---------|
| `binectics://gyms/:id` | Gym detail | Shared gym profile |
| `binectics://trainers/:id` | Trainer detail | Shared trainer profile |
| `binectics://dietitians/:id` | Dietitian detail | Shared dietitian profile |
| `binectics://checkin` | QR scanner | Check-in reminder notification |
| `binectics://subscriptions/:id` | Subscription detail | Subscription notification |
| `binectics://verify-email/:token` | Email verification | Verification email |
| `binectics://reset-password/:token` | Reset password | Password reset email |

**Implementation:**
- iOS: Associated Domains + Universal Links in `apple-app-site-association`
- Android: App Links with `assetlinks.json` + intent filters
- Expo: `expo-linking` for URL handling + React Navigation deep link config

### 6.4 Location Services

- **Permission**: Request `whenInUse` location (foreground only) — no background location needed
- **Usage**: "Near me" sort in marketplace discovery, map view centering
- **Fallback**: If permission denied, allow manual city/country search (same as web)
- **Geocoding**: Reverse geocode user location to auto-fill city/country filter
- **Privacy**: Location is never sent to backend for storage — only used client-side for distance calculation and map rendering

---

## 7. Navigation Architecture

### Tab Bar Structure (5 Tabs)

```
┌──────────────────────────────────────────┐
│                                          │
│            Screen Content                │
│                                          │
├──────┬──────┬──────┬──────┬──────────────┤
│      │      │      │      │              │
│Explore│Check │Activ-│Notif-│   Profile   │
│  🔍  │ -in  │ ity  │icat- │     👤      │
│      │  📷  │  📊  │ions 🔔│             │
└──────┴──────┴──────┴──────┴──────────────┘
```

| Tab | Icon | Stack Screens | Notes |
|-----|------|--------------|-------|
| **Explore** | Search icon | Home, Map View, Filter, Search Results, Provider Detail, Plan Detail | Default landing tab |
| **Check-in** | Camera/QR icon | QR Scanner, Success, Error, History | Center tab with accent color highlight; primary action |
| **Activity** | Chart icon | Dashboard, Subscriptions, Subscription Detail, Gamification, Badges | User's activity hub |
| **Notifications** | Bell icon (with badge) | Notification List | Unread count badge on icon |
| **Profile** | User icon | Profile View, Edit Profile, Settings, Change Password, Provider Dashboard (if provider role) | Provider dashboard nested here |

### Modal Presentations

These screens present as modals (slide up from bottom, can be dismissed):
- Payment flow (Checkout → Processing → Success/Failed)
- Write Review
- Write Journal Entry
- Filter Sheet (bottom sheet, partial height)
- Plan Selection (bottom sheet)

### Provider Dashboard Navigation

For users with provider roles (`GYM_OWNER`, `TRAINER`, `DIETITIAN`), the Profile tab includes a "My Dashboard" entry point that opens a nested stack:

```
Profile → My Dashboard → [Provider-specific screens]
                           ├── Dashboard Home (stats)
                           ├── Profile Management
                           ├── Plans (CRUD)
                           ├── Members/Clients
                           ├── Journals
                           ├── Analytics
                           └── (Gym Owner only) QR Code Display
                           └── (Dietitian only) Meal Plans
```

---

## 8. Screen Inventory

### Total: ~68 screens

#### Authentication (6 screens)
| # | Screen | Auth Required |
|---|--------|--------------|
| 1 | Splash | No |
| 2 | Onboarding (3 slides) | No |
| 3 | Login | No |
| 4 | Register (Role Selection → Role Form) | No |
| 5 | Forgot Password | No |
| 6 | Email Verification Confirmation | No |

#### Explore / Marketplace (7 screens)
| # | Screen | Auth Required |
|---|--------|--------------|
| 7 | Home / Search (List View) | No |
| 8 | Map View | No |
| 9 | Filter Sheet (Bottom Sheet) | No |
| 10 | Gym Detail | No |
| 11 | Trainer Detail | No |
| 12 | Dietitian Detail | No |
| 13 | Plan Detail | No |

#### Check-in (3 screens)
| # | Screen | Auth Required |
|---|--------|--------------|
| 14 | QR Scanner | Yes |
| 15 | Check-in Success/Error | Yes |
| 16 | Check-in History | Yes |

#### Activity (5 screens)
| # | Screen | Auth Required |
|---|--------|--------------|
| 17 | Activity Home (Dashboard) | Yes |
| 18 | Subscriptions List | Yes |
| 19 | Subscription Detail | Yes |
| 20 | Gamification Summary | Yes |
| 21 | Badges Gallery | Yes |

#### Notifications (2 screens)
| # | Screen | Auth Required |
|---|--------|--------------|
| 22 | Notification List | Yes |
| 23 | Notification Detail | Yes |

#### Profile & Settings (6 screens)
| # | Screen | Auth Required |
|---|--------|--------------|
| 24 | Profile View | Yes |
| 25 | Edit Profile | Yes |
| 26 | Change Password | Yes |
| 27 | Notification Preferences | Yes |
| 28 | Privacy Policy (static) | No |
| 29 | About / Help | No |

#### Payment (4 screens)
| # | Screen | Auth Required |
|---|--------|--------------|
| 30 | Checkout | Yes |
| 31 | Payment Processing | Yes |
| 32 | Payment Success | Yes |
| 33 | Payment Failed | Yes |

#### Reviews (2 screens)
| # | Screen | Auth Required |
|---|--------|--------------|
| 34 | Write Review (Modal) | Yes |
| 35 | Reviews List (part of Provider Detail) | No |

#### Gym Owner Dashboard (12 screens)
| # | Screen | Role Required |
|---|--------|--------------|
| 36 | Dashboard Home (Stats) | GYM_OWNER |
| 37 | Edit Gym Profile | GYM_OWNER |
| 38 | Plans List | GYM_OWNER |
| 39 | Create Plan | GYM_OWNER |
| 40 | Edit Plan | GYM_OWNER |
| 41 | Members List | GYM_OWNER |
| 42 | Member Detail | GYM_OWNER |
| 43 | QR Code Display (Full-screen) | GYM_OWNER |
| 44 | Check-in Log | GYM_OWNER |
| 45 | Analytics | GYM_OWNER |
| 46 | Gym Settings | GYM_OWNER |
| 47 | Attendance History | GYM_OWNER |

#### Trainer Dashboard (10 screens)
| # | Screen | Role Required |
|---|--------|--------------|
| 48 | Dashboard Home (Stats) | TRAINER |
| 49 | Edit Trainer Profile | TRAINER |
| 50 | Plans List | TRAINER |
| 51 | Create/Edit Plan | TRAINER |
| 52 | Clients List | TRAINER |
| 53 | Client Detail | TRAINER |
| 54 | Write Journal Entry (Modal) | TRAINER |
| 55 | Journal History | TRAINER |
| 56 | Analytics | TRAINER |
| 57 | Trainer Settings | TRAINER |

#### Dietitian Dashboard (11 screens)
| # | Screen | Role Required |
|---|--------|--------------|
| 58 | Dashboard Home (Stats) | DIETITIAN |
| 59 | Edit Dietitian Profile | DIETITIAN |
| 60 | Plans List | DIETITIAN |
| 61 | Create/Edit Plan | DIETITIAN |
| 62 | Clients List | DIETITIAN |
| 63 | Client Detail | DIETITIAN |
| 64 | Write Journal Entry (Modal) | DIETITIAN |
| 65 | Journal History | DIETITIAN |
| 66 | Meal Plan Library | DIETITIAN |
| 67 | Create/Edit Meal Plan | DIETITIAN |
| 68 | Analytics | DIETITIAN |

---

## 9. API Integration Strategy

### Backend

The mobile app consumes the **same Azure backend API** as the web app:

```
Production: https://binectics-gym-dev-api-dwbaeufeafgqd6db.canadacentral-01.azurewebsites.net/api/v1
```

No Backend-for-Frontend (BFF) layer needed — the API is already designed for client consumption.

### API Client Adaptation

The web app's `ApiClient` class (`src/lib/api/client.ts`) provides the pattern to adapt:

| Web Implementation | Mobile Adaptation |
|-------------------|-------------------|
| `localStorage` for tokens | `expo-secure-store` for refresh token; in-memory for access token |
| `document.cookie` for middleware | Not needed — no server-side middleware |
| `window.location.href` for redirects | React Navigation `navigate()` |
| `fetch()` API | Same `fetch()` (React Native supports it natively) |

**Token Refresh Flow** (same as web):
1. API call returns 401
2. Check if refresh is already in progress (de-duplicate)
3. Call `POST /auth/refresh` with refresh token
4. On success: update tokens, retry original request
5. On failure: clear auth state, navigate to Login screen

### Shared Code Strategy

Extract shared code into `packages/shared/`:

```
packages/
  shared/
    src/
      types/       ← from src/lib/types/index.ts
      constants/   ← from src/lib/constants/index.ts
      schemas/     ← from src/lib/schemas/*.ts (Zod validation)
      design-tokens.ts  ← from src/lib/design-tokens.ts
```

Both web and mobile apps import from `@binectics/shared`.

### API Service Modules

The following service modules from the web app define the complete API surface the mobile app will consume:

| Module | File | Key Endpoints |
|--------|------|--------------|
| Auth | `src/lib/api/auth.ts` | Login, register, refresh, verify, reset password |
| Marketplace | `src/lib/api/marketplace.ts` | Listings, plans, subscriptions, profiles |
| Check-ins | `src/lib/api/checkins.ts` | QR scan, history, dashboard stats, org stats |
| Reviews | `src/lib/api/reviews.ts` | CRUD reviews, eligibility check |
| Progress | `src/lib/api/progress.ts` | Journals, weight logs, client progress |
| Payments | `src/lib/api/payment.ts` | Payment initialization, gateway selection |
| Notifications | `src/lib/api/notifications.ts` | History, mark read, preferences (NOT SSE — see Section 5.11) |
| Consultations | `src/lib/api/consultations.ts` | (v2) Booking, availability |
| Teams | `src/lib/api/teams.ts` | (v1.1) Organization management |
| Forms | `src/lib/api/forms.ts` | Form CRUD, responses |
| Onboarding | `src/lib/api/onboarding.ts` | Onboarding flow completion |

**Web-only modules (NOT consumed by mobile):**

| Module | File | Reason |
|--------|------|--------|
| Admin | `src/lib/api/admin.ts` | Admin panel is web-only (announcements broadcast, user management) |

### Web vs Mobile — Architecture Boundaries

> **The React Query layer (`src/lib/queries/`) is web-specific and has no bearing on the mobile app.**

The web app wraps API calls in React Query hooks (`useQuery`, `useMutation`) for caching, deduplication, and background refetching. The mobile app will use its own state management approach:

| Concern | Web Approach | Mobile Approach |
|---------|-------------|-----------------|
| Server state caching | React Query (`@tanstack/react-query`) | Zustand stores + manual cache with `AsyncStorage` |
| Real-time updates | SSE (`EventSource`) for notifications | FCM push notifications |
| Background refetch | React Query `refetchOnWindowFocus` | App state listener (`AppState` API) — refetch on foreground |
| Optimistic updates | React Query `onMutate` | Zustand store updates with rollback on error |
| Offline cache | Not implemented on web | `AsyncStorage` with TTL, read-only when offline |

**What IS shared between web and mobile:**
- TypeScript types and interfaces (`src/lib/types/index.ts`)
- Constants and enums (`src/lib/constants/index.ts`)
- Zod validation schemas (`src/lib/schemas/*.ts`)
- Design tokens (`src/lib/design-tokens.ts`)
- API endpoint paths and contracts (same backend, same routes)
- Payment gateway selection logic (currency → gateway mapping)

**What is NOT shared:**
- React Query hooks (`src/lib/queries/`) — web-only
- SSE/streaming notification transport — web-only
- `resolveNotificationLink.ts` — web uses `router.push()`, mobile uses React Navigation deep links (see Section 5.11.2)
- `ApiClient` class — adapted for mobile (different token storage, no cookies, no `window`)

### New Backend Endpoints Required for Mobile

| Method | Endpoint | Body | Purpose |
|--------|----------|------|---------|
| POST | `/users/device-token` | `{ token: string, platform: "ios" \| "android" }` | Register FCM push token |
| DELETE | `/users/device-token` | `{ token: string }` | Unregister on logout |

All other endpoints already exist — the notification history, mark-as-read, and preferences endpoints are shared with the web app (see Section 5.11.4 and 5.11.5).

---

## 10. Design System Adaptation

### Colors

Direct reuse from the web design system (`src/lib/design-tokens.ts`):

| Token | Hex | Usage |
|-------|-----|-------|
| `foreground` | `#03314b` | Primary text (dark blue) |
| `background` | `#f7f4ef` | Screen backgrounds (cream) |
| `primary-500` | `#00d991` | Primary CTA buttons, success states, check-in |
| `accent-blue-500` | `#0267f2` | Gym Owner accent, links, interactive elements |
| `accent-yellow-500` | `#fdb90e` | Trainer accent |
| `accent-purple-500` | `#8b5cf6` | Dietitian accent |
| `neutral-100` | `#f5f5f5` | Card backgrounds, dividers |
| `error` | `#ef4444` | Error states, destructive actions |

### Typography

**Font:** Cera Pro — bundle `.otf` files from `public/fonts/` into app assets.

| Style | Size (pt) | Weight | Line Height | Usage |
|-------|----------|--------|-------------|-------|
| Display | 32 | Black (900) | 1.1 | Hero text, onboarding |
| H1 | 28 | Bold (700) | 1.2 | Screen titles |
| H2 | 24 | Bold (700) | 1.25 | Section headers |
| H3 | 20 | SemiBold (600) | 1.3 | Card titles |
| Body | 16 | Regular (400) | 1.5 | Body text |
| Body Small | 14 | Regular (400) | 1.4 | Secondary text, captions |
| Caption | 12 | Medium (500) | 1.3 | Labels, badges, metadata |
| Button | 16 | SemiBold (600) | 1.0 | Button text |

### Component Specifications

| Component | Height | Border Radius | Notes |
|-----------|--------|--------------|-------|
| Button (Primary) | 48pt | 8pt | Green bg, dark text, full-width on mobile |
| Button (Secondary) | 48pt | 8pt | Outlined, dark border |
| Button (Large) | 56pt | 12pt | For primary CTAs |
| Card | Auto | 16pt | Shadow: `0 2px 8px rgba(0,0,0,0.08)` |
| Input | 48pt | 8pt | Border: 1px neutral-300 |
| Bottom Sheet | Auto | 16pt (top only) | Drag handle indicator |
| Tab Bar | 56pt + safe area | 0 | Cream background, green active indicator |
| Avatar | 40pt / 56pt / 80pt | Full circle | Profile images |
| Badge | 24pt | Full circle | Notification count, verification |

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4pt | Tight inline spacing |
| `sm` | 8pt | Component internal padding |
| `md` | 12pt | Between related elements |
| `lg` | 16pt | Section padding, card padding |
| `xl` | 24pt | Between sections |
| `2xl` | 32pt | Major section gaps |
| `3xl` | 48pt | Screen-level spacing |

### Platform Adaptations

| Feature | iOS | Android |
|---------|-----|---------|
| Navigation | Large titles, swipe-back gesture | Material top bar, system back button |
| Tab Bar | iOS tab bar styling, safe area bottom | Material bottom navigation |
| Haptics | `UIImpactFeedbackGenerator` | `Vibration` API |
| Status Bar | Light content on colored headers | Material status bar styling |
| Modals | iOS page sheet presentation | Bottom-up slide |
| Lists | iOS-style grouped inset lists | Material card lists |
| Pull-to-refresh | Native `UIRefreshControl` | Material swipe refresh |

---

## 11. Release Strategy & Phasing

### 12-Week Accelerated Timeline

```
Week  1  2  3  4  5  6  7  8  9  10  11  12
      ├─────────┤  ├─────────┤  ├─────────┤  ├──────────┤
      Phase 1       Phase 2       Phase 3       Phase 4
      Foundation    Marketplace   Core +        Engagement
      + Auth        + Payments    Provider      + Launch
                                  Dashboards
```

### Phase 1 — Foundation + Auth (Weeks 1-3)

**Deliverables:**
- [ ] Expo project setup with TypeScript, React Navigation, design system
- [ ] Shared packages extraction (`@binectics/shared`)
- [ ] API client adapted from web (`ApiClient` → React Native)
- [ ] Auth flow: Login, Register (all roles), Forgot Password
- [ ] Biometric authentication (Face ID / Fingerprint)
- [ ] Secure token storage (`expo-secure-store`)
- [ ] Push notification infrastructure (FCM/APNs registration)
- [ ] Tab bar navigation skeleton
- [ ] Splash screen and onboarding slides

**Exit Criteria:** User can register, log in, enable biometric, see tab bar with placeholder screens.

### Phase 2 — Marketplace + Payments (Weeks 4-6)

**Deliverables:**
- [ ] Marketplace search with filters
- [ ] Map view with provider markers
- [ ] Location-based "near me" discovery
- [ ] Provider detail pages (gym, trainer, dietitian)
- [ ] Plan detail and comparison
- [ ] Checkout flow (Stripe integration)
- [ ] Paystack integration (WebView)
- [ ] Flutterwave integration
- [ ] Subscription management (view, cancel)
- [ ] Payment success/failure screens

**Exit Criteria:** User can search providers, view profiles, purchase plans, and manage subscriptions.

### Phase 3 — Core Features + Provider Dashboards (Weeks 7-9)

**Deliverables:**
- [ ] QR check-in (native camera scanner)
- [ ] Check-in history and streak tracking
- [ ] Gym Owner dashboard (full: stats, profile, plans CRUD, members, QR display, check-ins, analytics)
- [ ] Trainer dashboard (full: stats, profile, plans CRUD, clients, journal writing, analytics)
- [ ] Dietitian dashboard (full: stats, profile, plans CRUD, clients, journals, meal plans, analytics)
- [ ] Client journal reading (fitness enthusiast)

**Exit Criteria:** All provider roles can fully manage their business on mobile. Users can check in via QR and view journals.

### Phase 4 — Engagement + Launch (Weeks 10-12)

**Deliverables:**
- [ ] Reviews and ratings (submit, read, provider responses)
- [ ] Gamification dashboard (read-only: points, badges, streaks, leaderboard)
- [ ] Offline caching (read-only)
- [ ] Deep linking (universal links + custom scheme)
- [ ] Push notification handling (all types + deep links)
- [ ] Notification preferences screen
- [ ] Profile settings (edit profile, change password)
- [ ] Beta testing via TestFlight (iOS) and Play Console Internal Testing (Android)
- [ ] App Store and Google Play submission

**Exit Criteria:** App submitted to both stores. Beta testers have validated all core flows.

### Post-Launch v1.1 (Week 13+)

- [ ] Health API integrations (Apple Health, Google Fit, Samsung Health, Strava)
- [ ] Consultation booking with calendar
- [ ] Dark mode
- [ ] Team/organization management
- [ ] iOS widgets (check-in streak, today summary)
- [ ] Enhanced offline mode (queued mutations, conflict resolution)
- [ ] Performance optimization based on analytics
- [ ] Accessibility audit and improvements

### Accelerated Timeline Trade-offs

| What | Impact | Mitigation |
|------|--------|-----------|
| Full provider dashboards in 12 weeks | +20 screens, tight schedule | Reuse component patterns across all 3 provider roles |
| Reviews/gamification in Phase 4 | Compressed timeline | Read-only gamification simplifies scope |
| Offline mode is basic (read-only cache) | No queued mutations in v1 | Enhanced offline in v1.1 |
| No visual regression testing | Higher risk of UI bugs | Manual QA checklist per phase |
| No dark mode | Users may request it | v1.1 priority |

---

## 12. Testing Strategy

### Unit Tests
- **Framework:** Jest + React Native Testing Library
- **Coverage target:** 70% for business logic (API client, auth flow, payment gateway selection)
- **Shared test utilities:** Reuse mock data builders from web (`src/tests/setup/test-utils.tsx`)

### Integration Tests
- **API mocking:** MSW (Mock Service Worker) for intercepting API calls
- **Key flows:** Login → Dashboard, Search → Checkout → Payment, QR Scan → Check-in

### E2E Tests
- **Framework:** Detox (iOS + Android) or Maestro
- **Critical paths:**
  1. Register → Login → Biometric setup
  2. Search → Provider detail → Subscribe → Payment
  3. QR check-in (simulated camera input)
  4. Provider: Create plan → View in marketplace
  5. Write review → View on provider profile

### Manual QA Checklist (Per Phase)
- [ ] All screens render correctly on iPhone SE (smallest) and iPhone 16 Pro Max (largest)
- [ ] All screens render correctly on Android small (360dp) and large (412dp) screens
- [ ] Navigation works correctly (tab switching, stack push/pop, modal present/dismiss)
- [ ] Offline indicator appears when connectivity lost
- [ ] All loading states display correctly
- [ ] All error states display correctly
- [ ] Biometric auth works on both platforms
- [ ] Push notifications received and deep link to correct screen
- [ ] Payment flow completes on all 3 gateways

---

## 13. App Store Requirements

### iOS (App Store)

| Requirement | Details |
|-------------|---------|
| App Name | Binectics |
| Bundle ID | `com.binectics.app` |
| Category | Health & Fitness |
| Age Rating | 4+ |
| Privacy Policy URL | `https://binectics.com/privacy` |
| Screenshots | 6.7" (iPhone 16 Pro Max), 6.1" (iPhone 16), 5.5" (iPhone 8 Plus) — 5-10 per size |
| App Preview Video | Optional but recommended (30 seconds showing QR check-in + marketplace) |
| Privacy Nutrition Labels | Location (when in use), Health (v1.1), Purchases, Identifiers, Usage Data |
| Sign in with Apple | Required if any social login is offered |
| In-App Purchases | None (payments are for external services, not digital goods — exempt from IAP) |

### Android (Google Play)

| Requirement | Details |
|-------------|---------|
| App Name | Binectics |
| Package Name | `com.binectics.app` |
| Category | Health & Fitness |
| Content Rating | Everyone |
| Privacy Policy URL | `https://binectics.com/privacy` |
| Screenshots | Phone (16:9), 7" tablet, 10" tablet — 4-8 per form factor |
| Feature Graphic | 1024x500px |
| Data Safety | Location (approximate, foreground only), Personal info, Financial info, App activity |
| Target API Level | 34+ (Android 14) |

### App Store Review Considerations

- **Payment exemption**: Binectics processes payments for physical fitness services (gym memberships, trainer sessions), NOT digital goods. This qualifies for the "reader app" / physical goods exemption from Apple's 30% IAP commission.
- **Location permission**: "Binectics uses your location to find gyms and trainers near you." (purpose string)
- **Camera permission**: "Binectics uses your camera to scan gym QR codes for check-in." (purpose string)
- **Notification permission**: "Binectics sends notifications about your subscriptions and check-in reminders." (purpose string)

---

## 14. Appendices

### A. Enum Reference

All enums are defined in `src/lib/types/index.ts` and `src/lib/constants/index.ts`:

- `UserRole`: USER, GYM_OWNER, TRAINER, DIETITIAN, ADMIN
- `AccountType`: gym_owner, personal_trainer, dietitian, fitness_member
- `VerificationStatus`: PENDING, VERIFIED, REJECTED
- `SubscriptionStatus`: ACTIVE, INACTIVE, CANCELLED, EXPIRED
- `DurationType`: daily, weekly, monthly, quarterly, yearly

### B. API Service Modules

13 service modules in `src/lib/api/`:
`auth.ts`, `checkins.ts`, `client.ts`, `consultations.ts`, `forms.ts`, `marketplace.ts`, `onboarding.ts`, `payment.ts`, `progress.ts`, `reviews.ts`, `teams.ts`, `utility.ts`, `index.ts`

### C. Supported Currencies

| Code | Symbol | Name | Payment Gateway |
|------|--------|------|----------------|
| USD | $ | US Dollar | Stripe |
| EUR | € | Euro | Stripe |
| GBP | £ | British Pound | Stripe |
| NGN | ₦ | Nigerian Naira | Paystack / Flutterwave |
| KES | KSh | Kenyan Shilling | Paystack |
| ZAR | R | South African Rand | Paystack |
| AED | د.إ | UAE Dirham | Stripe |
| INR | ₹ | Indian Rupee | Stripe |

### D. Supported Countries

50+ countries across Africa, Asia, Europe, North America, South America, and the Middle East. Full list maintained in `src/lib/constants/index.ts`.

### E. Design Token File

`src/lib/design-tokens.ts` — already annotated with `// Used across web (Tailwind) and mobile (React Native)` comment. This file is the single source of truth for the color palette and should be extracted into `packages/shared/` for the mobile app.

---

**Last Updated:** 2026-05-09
**Author:** Engineering Team
**Approvals:** Pending
