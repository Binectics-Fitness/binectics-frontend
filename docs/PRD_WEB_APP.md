# Binectics Web Application — Product Requirements Document (PRD)

**Version:** 1.0
**Date:** 2026-05-09
**Status:** Living Document
**Platform:** Web (Next.js 16, App Router)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Tech Stack & Architecture](#2-tech-stack--architecture)
3. [User Roles & Access Control](#3-user-roles--access-control)
4. [Route Inventory](#4-route-inventory)
5. [Feature Specifications](#5-feature-specifications)
6. [API Integration](#6-api-integration)
7. [Design System](#7-design-system)
8. [Component Library](#8-component-library)
9. [State Management & Data Fetching](#9-state-management--data-fetching)
10. [Security](#10-security)
11. [SEO & Performance](#11-seo--performance)
12. [Testing Strategy](#12-testing-strategy)
13. [Environment & Deployment](#13-environment--deployment)
14. [Known Issues & Tech Debt](#14-known-issues--tech-debt)
15. [Roadmap](#15-roadmap)
16. [Appendices](#16-appendices)

---

## 1. Executive Summary

### Vision

Binectics is a global fitness ecosystem connecting gyms, personal trainers, dietitians, and fitness enthusiasts in one unified marketplace. Available in 50+ countries with multi-currency support.

### What This App Does

- **Marketplace**: Discover gyms, trainers, and dietitians by location, category, rating, and price
- **Subscriptions & Payments**: Subscribe to provider plans via Stripe, Paystack, or Flutterwave
- **QR Check-in**: Gym members check in via QR codes; gym owners track attendance
- **Client Management**: Trainers and dietitians manage client progress, write journals, create workout/diet plans
- **Health Tracking**: Users log weight, meals, and activities; providers track client progress
- **Reviews & Ratings**: Users rate providers; providers can respond
- **Notifications**: Real-time SSE notifications with email + in-app preference toggles
- **Admin Panel**: User management, verification queue, announcements, platform metrics
- **Teams & Organizations**: Multi-location gym management, staff roles, invitations

### Current State

- **162 routes** implemented
- **56 reusable components**
- **19 API service modules**
- **10 Zod validation schemas**
- Build passes with zero TypeScript errors
- SSE notification system with 38 notification types
- React Query caching layer

---

## 2. Tech Stack & Architecture

### Frontend Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.5 |
| Language | TypeScript | 5.x |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS | 4.x |
| Forms | React Hook Form + Zod | 7.72 / 4.3 |
| Data Fetching | React Query (@tanstack/react-query) | via QueryProvider |
| Payments | Stripe React, Paystack, Flutterwave | Stripe 6.0, Flutter 1.3 |
| Rich Text | TipTap + DOMPurify | — |
| QR Codes | qrcode | 1.5.4 |
| Date/Time | date-fns + date-fns-tz | 4.1 / 3.2 |
| Icons | Lucide React | 0.575 |
| Drag & Drop | @dnd-kit | 6.3 |
| Testing | Vitest + Playwright + Testing Library | — |

### Architecture Principles

- **Frontend-only repository** — no backend code, no database connections, no API routes
- **External API** — all data from Azure backend at `NEXT_PUBLIC_API_URL`
- **Server Components** by default; `"use client"` only when interactivity is needed
- **JWT auth** — access token in memory, refresh token in httpOnly cookie
- **Role-based routing** — middleware redirects based on user role

### File Structure

```
src/
├── app/                    # Next.js App Router pages (162 routes)
│   ├── admin/              # Admin panel (17 routes)
│   ├── dashboard/          # Authenticated dashboards
│   │   ├── dietitian/      # Dietitian-specific (15 routes)
│   │   ├── gym-owner/      # Gym owner-specific (21 routes)
│   │   ├── trainer/        # Trainer-specific (17 routes)
│   │   └── ...             # Shared dashboard routes
│   ├── marketplace/        # Public marketplace
│   ├── forms/              # Form builder & submissions
│   └── ...                 # Auth, static, public pages
├── components/             # 56 reusable components
├── contexts/               # AuthContext
├── hooks/                  # Custom hooks (useForms, useNotificationCount, etc.)
├── lib/
│   ├── api/                # 19 API service modules
│   ├── queries/            # React Query hooks (8 modules)
│   ├── schemas/            # 10 Zod validation schemas
│   ├── types/              # TypeScript types & enums
│   ├── constants/          # App constants
│   └── ui/                 # UI utilities (dialogs)
├── services/               # Service barrel exports
├── store/                  # Zustand store
├── tests/                  # Unit tests
└── utils/                  # Utility functions (format, jwt, async, resolveNotificationLink)
```

---

## 3. User Roles & Access Control

### Roles

| Role | Enum Value | Access |
|------|-----------|--------|
| Fitness Enthusiast | `USER` / `fitness_member` | User dashboard, marketplace, subscriptions, check-in, health tracking, reviews |
| Gym Owner | `GYM_OWNER` / `gym_owner` | Gym dashboard, plans CRUD, members, QR codes, staff management, analytics, revenue |
| Personal Trainer | `TRAINER` / `personal_trainer` | Trainer dashboard, plans CRUD, clients, journals, workout plans, analytics |
| Dietitian | `DIETITIAN` / `dietitian` | Dietitian dashboard, plans CRUD, clients, journals, meal plans, diet plans, analytics |
| Admin | `ADMIN` | Admin panel (users, providers, verification, announcements, metrics, subscriptions) |

### Middleware Routing

- Unauthenticated users → redirected to `/login` for protected routes
- Admin users accessing `/dashboard` → redirected to `/admin`
- Non-admin users accessing `/admin` → redirected to `/dashboard`
- Role-specific dashboards: `/dashboard/gym-owner`, `/dashboard/trainer`, `/dashboard/dietitian`
- First-login admin → forced to `/admin/change-password`

### Verification Status

Providers (GYM_OWNER, TRAINER, DIETITIAN) must be verified before appearing in the marketplace:

| Status | Meaning |
|--------|---------|
| `PENDING` | Documents uploaded, awaiting admin review |
| `VERIFIED` | Approved — shows "Verified" badge, appears in marketplace |
| `REJECTED` | Rejected with admin comment — can resubmit |

---

## 4. Route Inventory

### 162 Total Routes

#### Public Pages (20 routes)

| Route | Description |
|-------|------------|
| `/` | Landing page (hero, features, pricing, testimonials, FAQ, CTA) |
| `/about` | About Binectics |
| `/how-it-works` | 3-step process explanation |
| `/pricing` | Live marketplace showcase of top providers |
| `/faq` | Frequently asked questions (accordion) |
| `/contact` | Contact form |
| `/blog` | Blog listing |
| `/careers` | Careers page |
| `/partners` | Partnership information |
| `/press` | Press & media |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/cookies` | Cookie policy |
| `/security` | Security practices |
| `/help` | Help center |
| `/qr-help` | QR check-in instructions |
| `/countries` | Country listing |
| `/status` | System status |
| `/maintenance` | Maintenance page |
| `/categories/*` | 5 category pages (gyms, nutrition, personal-training, strength-training, yoga-pilates) |

#### Authentication (8 routes)

| Route | Description |
|-------|------------|
| `/login` | Email/password login with remember me |
| `/register` | Role selection |
| `/register/user` | Fitness enthusiast signup |
| `/register/gym-owner` | Gym owner signup |
| `/register/trainer` | Trainer signup |
| `/register/dietitian` | Dietitian signup |
| `/register/invite` | Accept team invitation registration |
| `/forgot-password` | Request password reset |
| `/reset-password/[token]` | Reset password form |
| `/verify-email/[token]` | Email verification |
| `/unsubscribe/[token]` | Email unsubscribe |

#### Discovery & Marketplace (10 routes)

| Route | Description |
|-------|------------|
| `/search` | Global search (debounced, category tabs, sort by rating/newest) |
| `/marketplace` | Marketplace browse |
| `/marketplace/[listingId]` | Listing detail (provider profile, plans, reviews) |
| `/marketplace/consultations` | Browse consultations |
| `/gyms` | Browse gyms |
| `/gyms/[gymId]` | Gym detail page |
| `/trainers` | Browse trainers |
| `/trainers/[trainerId]` | Trainer detail page |
| `/dietitians` | Browse dietitians |
| `/dietitians/[dietitianId]` | Dietitian detail page |

#### Payment & Checkout (3 routes)

| Route | Description |
|-------|------------|
| `/checkout` | Checkout with gateway selection (Stripe/Paystack/Flutterwave) |
| `/checkout/success` | Payment success confirmation |
| `/checkout/cancelled` | Payment cancelled |

#### Check-in (1 route)

| Route | Description |
|-------|------------|
| `/check-in/[gymId]` | QR check-in processing |

#### Verification (1 route)

| Route | Description |
|-------|------------|
| `/verification` | Provider verification application |

#### Team Invitations (1 route)

| Route | Description |
|-------|------------|
| `/teams/invite/accept` | Accept team/org invitation |

#### Forms System (6 routes)

| Route | Description |
|-------|------------|
| `/forms` | Form listing |
| `/forms/create` | Create new form (drag-and-drop builder) |
| `/forms/[id]/edit` | Edit form |
| `/forms/[id]/submit` | Submit form response |
| `/forms/[id]/responses` | View form responses |
| `/forms/[id]/analytics` | Form analytics |

#### User Dashboard (19 routes)

| Route | Description |
|-------|------------|
| `/dashboard` | Main dashboard (subscriptions, check-in status, featured listings, recommended, categories) |
| `/dashboard/explore` | Marketplace explore (search, category tabs, sort, pagination) |
| `/dashboard/marketplace` | User marketplace view |
| `/dashboard/marketplace/requests` | Marketplace requests |
| `/dashboard/subscriptions` | Manage subscriptions (auto-renew toggle, cancel) |
| `/dashboard/checkins` | Check-in history |
| `/dashboard/bookings` | Booking management |
| `/dashboard/bookings/consultations` | Consultation bookings |
| `/dashboard/schedule` | Schedule view |
| `/dashboard/progress` | Progress tracking |
| `/dashboard/goals` | Goals management |
| `/dashboard/journals` | Journal entries (read-only for users) |
| `/dashboard/journals/recommendations/[id]` | View recommendation |
| `/dashboard/nutrition` | Nutrition overview |
| `/dashboard/nutrition/[planId]` | Nutrition plan detail |
| `/dashboard/workouts` | Workout plans |
| `/dashboard/workouts/[planId]` | Workout plan detail |
| `/dashboard/loyalty` | Loyalty/gamification dashboard |
| `/dashboard/notifications` | Notification inbox (all/unread filter, mark read, color-coded types) |
| `/dashboard/help` | Help center |
| `/dashboard/team` | Team/org overview |
| `/dashboard/team/[orgId]` | Organization detail |

#### User Settings (7 routes)

| Route | Description |
|-------|------------|
| `/dashboard/settings` | Settings overview |
| `/dashboard/settings/profile` | Edit profile |
| `/dashboard/settings/account` | Account settings |
| `/dashboard/settings/billing` | Personal billing |
| `/dashboard/settings/organization-billing` | Organization billing |
| `/dashboard/settings/payment` | Payment gateway configuration (provider-level Stripe/Paystack/Flutterwave keys) |
| `/dashboard/settings/notifications` | Notification preferences (13 toggles across email + in-app) |
| `/dashboard/settings/privacy` | Privacy settings |

#### Gym Owner Dashboard (21 routes)

| Route | Description |
|-------|------------|
| `/dashboard/gym-owner` | Dashboard home (stats, check-in activity, revenue overview, recent check-ins) |
| `/dashboard/gym-owner/analytics` | Analytics (active members, avg rating, monthly revenue, check-in charts) |
| `/dashboard/gym-owner/revenue` | Revenue dashboard (today/week/month, breakdown bars, recent check-ins table) |
| `/dashboard/gym-owner/plans` | Plans list |
| `/dashboard/gym-owner/plans/create` | Create plan |
| `/dashboard/gym-owner/plans/[planId]` | Plan detail |
| `/dashboard/gym-owner/plans/[planId]/edit` | Edit plan |
| `/dashboard/gym-owner/members` | Members list (search, filter) |
| `/dashboard/gym-owner/members/[memberId]` | Member detail (subscription, billing, check-in history) |
| `/dashboard/gym-owner/marketplace` | Gym marketplace listing management |
| `/dashboard/gym-owner/facility` | Multi-location facility management |
| `/dashboard/gym-owner/facility/[listingId]` | Per-location facility detail (amenities, gallery, documents) |
| `/dashboard/gym-owner/checkins` | Check-in log |
| `/dashboard/gym-owner/reviews` | Reviews management (with provider responses) |
| `/dashboard/gym-owner/bookings` | Gym bookings |
| `/dashboard/gym-owner/consultations` | Gym consultations |
| `/dashboard/gym-owner/classes` | Class management |
| `/dashboard/gym-owner/classes/new` | Create class |
| `/dashboard/gym-owner/staff` | Staff management (list, search, status toggle) |
| `/dashboard/gym-owner/staff/invite` | Invite staff member |
| `/dashboard/gym-owner/staff/[trainerId]` | Staff member detail |
| `/dashboard/gym-owner/staff/[trainerId]/revenue` | Staff revenue |
| `/dashboard/gym-owner/staff/[trainerId]/schedule` | Staff schedule/availability |
| `/dashboard/gym-owner/assignment-rules` | Assignment rules configuration |
| `/dashboard/gym-owner/settings` | Gym settings |

#### Trainer Dashboard (17 routes)

| Route | Description |
|-------|------------|
| `/dashboard/trainer` | Dashboard home (stats, today's clients) |
| `/dashboard/trainer/analytics` | Trainer analytics |
| `/dashboard/trainer/earnings` | Earnings overview |
| `/dashboard/trainer/plans` | Plans list |
| `/dashboard/trainer/plans/create` | Create plan |
| `/dashboard/trainer/plans/[planId]` | Plan detail |
| `/dashboard/trainer/plans/[planId]/edit` | Edit plan |
| `/dashboard/trainer/clients` | Client management (quick stats, add client, invite, journal writing) |
| `/dashboard/trainer/sessions` | Sessions management |
| `/dashboard/trainer/bookings` | Trainer bookings |
| `/dashboard/trainer/consultations` | Trainer consultations |
| `/dashboard/trainer/reviews` | Reviews (with provider responses) |
| `/dashboard/trainer/workouts` | Workout plan library |
| `/dashboard/trainer/workouts/create` | Create workout plan (exercises with sets/reps/duration/rest) |
| `/dashboard/trainer/workouts/[planId]` | Workout plan detail |
| `/dashboard/trainer/workouts/[planId]/edit` | Edit workout plan |
| `/dashboard/trainer/settings` | Trainer settings |

#### Dietitian Dashboard (15 routes)

| Route | Description |
|-------|------------|
| `/dashboard/dietitian` | Dashboard home (stats, recent activity) |
| `/dashboard/dietitian/analytics` | Dietitian analytics |
| `/dashboard/dietitian/earnings` | Earnings overview |
| `/dashboard/dietitian/plans` | Plans list |
| `/dashboard/dietitian/plans/create` | Create plan |
| `/dashboard/dietitian/plans/[planId]` | Plan detail |
| `/dashboard/dietitian/plans/[planId]/edit` | Edit plan |
| `/dashboard/dietitian/clients` | Client management (quick stats, add client, invite, journal writing) |
| `/dashboard/dietitian/bookings` | Dietitian bookings |
| `/dashboard/dietitian/consultations` | Dietitian consultations |
| `/dashboard/dietitian/reviews` | Reviews (with provider responses) |
| `/dashboard/dietitian/meal-plans` | Meal plan library |
| `/dashboard/dietitian/meal-plans/create` | Create meal plan |
| `/dashboard/dietitian/meal-plans/[planId]` | Meal plan detail |
| `/dashboard/dietitian/meal-plans/[planId]/edit` | Edit meal plan |
| `/dashboard/dietitian/nutrition-plans` | Nutrition/diet plans |
| `/dashboard/dietitian/settings` | Dietitian settings |

#### Admin Panel (17 routes)

| Route | Description |
|-------|------------|
| `/admin` | Admin login/landing |
| `/admin/dashboard` | Admin dashboard (platform metrics) |
| `/admin/users` | User management (list, search, suspend) |
| `/admin/users/[userId]` | User detail |
| `/admin/providers` | Provider management |
| `/admin/providers/[providerId]` | Provider detail |
| `/admin/verification` | Verification queue (approve/reject with comments) |
| `/admin/subscriptions` | Subscription management |
| `/admin/reviews` | Review moderation |
| `/admin/revenue` | Platform revenue |
| `/admin/analytics` | Platform analytics |
| `/admin/announcements` | Broadcast announcements (title + message to all users) |
| `/admin/currencies` | Currency management |
| `/admin/loyalty` | Loyalty/gamification settings |
| `/admin/change-password` | Force password change (first login) |
| `/admin/create-super-admin` | Create super admin account |

---

## 5. Feature Specifications

### 5.1 Authentication

- Email/password login with "Remember Me" (30-day JWT refresh)
- Role-specific registration forms (different fields per role)
- Password reset via email deep link
- Email verification via token
- Session timeout with inactivity modal (`NEXT_PUBLIC_SESSION_TIMEOUT`)
- JWT: access token in memory, refresh token in httpOnly cookie
- Auto-refresh on 401 with request retry and de-duplication
- Force password change on first admin login

### 5.2 Marketplace Discovery

- **Search**: Debounced (400ms) free-text search across all provider types
- **Category tabs**: All / Gyms / Trainers / Dietitians with live result counts
- **Sort**: By rating (default) or newest
- **Pagination**: Page-based with Previous/Next
- **Listing cards**: Type badge, headline, specialties/amenities (first 3), location, star rating, price label, acceptance status
- **Featured listings**: `/marketplace/featured` endpoint, country-filtered
- **Provider detail**: Rich text bio, photo gallery, plans with pricing, reviews with provider responses
- **API**: `GET /marketplace/listings` with query params: `q`, `sort`, `page`, `limit`, `account_type`, `city`, `country`, `min_rating`, `max_price`, `facilities[]`, `specializations[]`

### 5.3 Subscriptions & Payments

- **Plan types**: `ONE_TIME` or `SUBSCRIPTION` with duration in days
- **Auto-renew**: Toggle for subscription plans
- **Multi-currency**: USD, EUR, GBP, NGN, KES, ZAR, AED, INR (8 currencies)
- **Gateway selection**: Currency-based routing
  - Stripe: USD, EUR, GBP, AED, INR (default)
  - Paystack: NGN, GHS, KES, ZAR
  - Flutterwave: NGN, GHS, KES, TZS, UGX
- **Provider gateway config**: Organizations can configure their own Paystack/Stripe/Flutterwave keys via `/dashboard/settings/payment`
- **Free plans**: Supported — no payment required, just confirmation
- **Checkout flow**: Plan summary → gateway selection → payment → success/cancelled
- **Apple Pay / Google Pay**: Available via Stripe payment sheet

### 5.4 QR Check-in

- Gym owners generate QR codes displayed on gym dashboard
- Users scan QR at gym → `POST /checkins/scan` → check-in recorded
- Check-in stats: `has_checked_in_today`, `current_streak_days`, `total_check_ins`, `last_check_in_at`
- Gym owner dashboard shows: today/week/month check-in counts, recent check-in feed with member names

### 5.5 Client Management & Health Tracking

#### Provider Side (Trainers & Dietitians)

- **Client list**: Quick stats cards (weight, activities, meals), search
- **Add client**: Modal with email, first name, starting/target weight, height, goals, notes
- **Client invitation**: Email invite with acceptance workflow, expiration
- **Client detail**: 4-stat summary (current weight, weight change, activities 30d, meals 30d)
- **Journals**: Write entries with notes, weight, mood (enum: excellent/good/okay/low/stressed), adherence score (0-100). Cursor-based pagination.
- **Pending requests**: Accept/reject connection requests

#### Consumer Side (Fitness Enthusiasts)

- **Weight logs**: Log weight, view history
- **Meal feedback**: Log meals with type (breakfast/lunch/dinner/snack), rating (great/good/okay/poor), calories, feedback text
- **Activity reports**: Log activities with type (cardio/strength/flexibility/hiit/yoga/swimming/cycling/running/walking/other), duration, intensity, calories
- **Journal reading**: Read-only access to provider journal entries

### 5.6 Workout & Diet Plans

- **Trainer**: Workout plan CRUD with structured exercises (sets, reps, duration, rest periods, difficulty, frequency)
- **Dietitian**: Meal plan CRUD (title, meals, assign to clients); Diet plan CRUD with meals and PDF document support
- **User**: View assigned workout/diet plans; access document URLs for PDFs

### 5.7 Rich Text Content

- **TipTap editor**: Bold, italic, underline, H2, H3, bullet lists, numbered lists, links
- **3000 character limit** with counter
- **HTML sanitization**: DOMPurify with whitelist (allowed tags: p, strong, em, u, h2, h3, ul, ol, li, a)
- **Used for**: Provider bios, admin announcements, recommendations
- **Display component**: `RichTextDisplay` renders sanitized HTML; auto-wraps legacy plain-text in `<p>` tags

### 5.8 Notifications

- **Transport**: Server-Sent Events (SSE) via `GET /notifications/stream?token=` with 60-second polling fallback
- **38 notification types** organized by category:
  - Booking lifecycle (6): created, confirmed, cancelled, rescheduled, completed, reminder
  - Client management (4): invitation, request, accepted, departed
  - Marketplace (4): request received/accepted/rejected, transfer request
  - Reviews (2): received, response
  - Plans & progress (4): diet plan assigned, workout plan assigned, journal entry, meal logged
  - Team (3): invitation, member joined, member removed
  - Subscriptions & payments (4): created, expiring, expired, payment received
  - Verification (2): approved, rejected
  - System (2): announcement, account suspended
  - Check-in (1): reminder
- **Notification inbox**: `/dashboard/notifications` with all/unread tabs, mark read (individual + bulk), color-coded type badges (blue=booking, yellow=payments, green=verification, purple=team)
- **Notification bell**: Unread count badge in sidebar (shows "99+" for 99+)
- **Link resolution**: `resolveNotificationLink.ts` maps backend URLs to role-specific frontend routes
- **Preferences**: 13 toggles across 2 channels (7 email + 6 in-app). System-critical notifications always on.

### 5.9 Admin Panel

- **User management**: List, search, view detail, suspend/unsuspend accounts
- **Provider management**: List providers, view detail, verification status
- **Verification queue**: Review uploaded documents, approve/reject with admin comments
- **Announcements**: Broadcast title + message to all users via `POST /admin/announcements/broadcast` (returns recipient count)
- **Platform metrics**: Revenue, subscriptions, user counts
- **Currency management**: Configure supported currencies
- **Loyalty/gamification**: Configure points, badges, streaks
- **Create super admin**: `/admin/create-super-admin`

### 5.10 Teams & Organizations

- **Organization management**: Create/manage organizations with multiple members
- **Staff roles**: Invite staff via email with role selection and permissions preview
- **Staff detail**: View member info, status toggle (pause/restore), remove with confirmation
- **Staff revenue & schedule**: Per-staff revenue tracking and availability rules
- **Assignment rules**: Configure how clients are assigned to staff
- **Multi-location**: Gyms can manage multiple listings with separate facilities, amenities, galleries, and documents per location

### 5.11 Reviews & Ratings

- **Submit reviews**: Star rating (1-5) + optional comment; requires active/completed subscription
- **One review per provider per user**
- **Edit/delete window**: 24 hours after submission
- **Provider responses**: Providers can respond to reviews
- **Review moderation**: Admin can view all reviews

### 5.12 Forms System

- **Form builder**: Drag-and-drop question creation with `@dnd-kit`
- **Question types**: Text, multiple choice, checkboxes, etc.
- **Form submission**: Public submit URL
- **Response viewing**: List all responses
- **Analytics**: Aggregated form analytics

### 5.13 Consultation Booking

- **Availability management**: Providers set available time slots per day
- **Booking flow**: Users browse available slots → book → confirmation
- **Timezone handling**: Dual-timezone display (provider + client) via `dualTimezoneLabel()` utility

---

## 6. API Integration

### Backend

```
Production: https://binectics-gym-dev-api-dwbaeufeafgqd6db.canadacentral-01.azurewebsites.net/api/v1
```

### API Service Modules (19)

| Module | File | Purpose |
|--------|------|---------|
| `auth` | `auth.ts` | Login, register, refresh, verify, reset password, me |
| `marketplace` | `marketplace.ts` | Listings, plans, subscriptions, profiles, facility management, payment config, featured |
| `checkins` | `checkins.ts` | QR scan, history, dashboard stats, org stats |
| `reviews` | `reviews.ts` | CRUD reviews, eligibility |
| `progress` | `progress.ts` | Client profiles, journals, weight logs, meal feedback, activity reports, workout plans, diet plans, recommendations, invitations |
| `notifications` | `notifications.ts` | History, unread count, mark read, preferences, SSE stream |
| `admin` | `admin.ts` | User suspension, announcements broadcast |
| `payment` | `payment.ts` | Payment initialization, gateway selection |
| `consultations` | `consultations.ts` | Booking, availability, slots |
| `teams` | `teams.ts` | Organization CRUD, members, invitations |
| `forms` | `forms.ts` | Form CRUD, questions, responses |
| `onboarding` | `onboarding.ts` | Onboarding flow completion |
| `loyalty` | `loyalty.ts` | Gamification profile, badges, leaderboard |
| `feedback` | `feedback.ts` | User feedback submission |
| `providerBilling` | `providerBilling.ts` | Provider billing configuration |
| `assignmentRules` | `assignmentRules.ts` | Client assignment configuration |
| `utility` | `utility.ts` | Utility endpoints |
| `client` | `client.ts` | Base API client (fetch wrapper, token management, refresh flow) |
| `index` | `index.ts` | Barrel exports |

### React Query Layer (8 modules)

Located in `src/lib/queries/`:

| Module | Purpose |
|--------|---------|
| `keys.ts` | Centralized query key factory |
| `marketplace.ts` | Listings search, featured, plans, subscriptions |
| `checkins.ts` | Check-in stats, history |
| `progress.ts` | Client profiles, journals, weight logs, meals, activities, workout/diet plans |
| `reviews.ts` | Provider reviews |
| `notifications.ts` | Notification list, unread count |
| `consultations.ts` | Consultation slots, bookings |
| `teams.ts` | Organization data |
| `utility.ts` | Countries, currencies |

**Cache Configuration:**
- Stale time: 60 seconds
- Garbage collection: 5 minutes
- Single retry on failure
- No refetch on window focus

### Validation Schemas (Zod)

Located in `src/lib/schemas/`:

| Schema | Validates |
|--------|----------|
| `auth.ts` | Login, registration, password reset forms |
| `plans.ts` | Plan creation/editing |
| `marketplace.ts` | Marketplace listing forms |
| `progress.ts` | Client profiles, journal entries, weight logs, meal feedback, activity reports |
| `settings.ts` | Profile settings, notification preferences |
| `teams.ts` | Organization creation, member invitations |
| `forms.ts` | Form creation, question types |
| `admin.ts` | Admin operations |
| `contact.ts` | Contact form |
| `shared.ts` | Shared validation rules |

---

## 7. Design System

### Blinkist-Inspired Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `foreground` | `#03314b` | Primary text (dark blue) |
| `background` | `#f7f4ef` | Page backgrounds (cream) |
| `primary-500` | `#00d991` | Primary CTA buttons, success states, check-in, verification badges |
| `accent-blue-500` | `#0267f2` | Gym Owner accent, links, interactive elements |
| `accent-yellow-500` | `#fdb90e` | Trainer accent |
| `accent-purple-500` | `#8b5cf6` | Dietitian accent |
| `neutral-100` | `#f5f5f5` | Card backgrounds, dividers |
| `error` | `#ef4444` | Error states, destructive actions |

### Typography

- **Font**: Cera Pro (Regular, Medium, Bold, Black) — bundled as `.otf` in `public/fonts/`
- **Dark text on colored backgrounds** (including green, yellow)
- **No button animations** — only hover/active color states

### Role-Specific Accent Colors

- Gym Owner: Blue (`#0267f2`)
- Trainer: Yellow (`#fdb90e`)
- Dietitian: Purple (`#8b5cf6`)

---

## 8. Component Library

### 56 Components in `src/components/`

**Layout & Navigation:**
- `Navbar`, `Footer`, `MobileNav`, `ConditionalLayout`
- `AppSidebar`, `DashboardSidebar`, `AdminSidebar`, `GymOwnerSidebar`, `TrainerSidebar`, `DietitianSidebar`
- `DashboardClientShell`, `AdminClientShell`
- `Container`, `SectionWrapper`, `PageHeader`, `Breadcrumb`

**Form & Input:**
- `Input`, `PasswordInput`, `SearchableSelect`, `TagInput`, `LocationFilter`
- `Button` (with variant system), `Badge`
- `RichTextEditor`, `RichTextDisplay`

**Data Display:**
- `Card`, `CardSkeleton`, `StatCard`
- `PhotoGallery`, `DocumentPreviewModal`
- `DashboardLoading`, `LoadingSpinner`, `EmptyState`

**Feedback & Modals:**
- `Modal`, `ConfirmationModal`, `SessionModal`, `PublishSuccessModal`, `FacilityItemFormModal`
- `Toast`, `InactivityNotification`, `CookieConsent`, `CookieSettings`
- `FeedbackPrompt`

**Feature-Specific:**
- `Accordion` (FAQ), `PricingSection`, `ProfessionalsTab`
- `OnboardingBanner`, `ProviderOnboardingChecklist`
- `NotificationBell`, `TimezoneHelpBadge`
- `ConsultationAvailabilityManager`, `ConsultationBookingsManager`
- `ProviderReviewsSection`, `ContactForm`, `ContactProvider`

**Infrastructure:**
- `QueryProvider` (React Query wrapper)

### Component Rules

- **Never use native `<select>`** — always use `SearchableSelect`
- All dropdowns must be searchable
- Country field always appears before City in forms

---

## 9. State Management & Data Fetching

### Layers

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Server state | React Query | API data caching, background refetch, optimistic updates |
| Auth state | React Context (`AuthContext`) | Current user, tokens, login/logout |
| Client state | Zustand (minimal) | Lightweight UI state |
| Form state | React Hook Form | Form field management, validation |
| URL state | `useSearchParams()` | Search filters, pagination (wrapped in Suspense) |

### Key Patterns

- **`useSearchParams()` requires `<Suspense>`** boundary (Next.js App Router requirement)
- **Token refresh**: 401 → check if refresh in progress → call `/auth/refresh` → retry original request → on failure, clear auth and redirect to login
- **SSE for notifications**: `EventSource` connection with JWT token; falls back to 60-second polling on error

---

## 10. Security

### Headers (via `next.config.ts`)

- `X-DNS-Prefetch-Control: on`
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Powered-By` header removed

### Auth Security

- Access tokens in memory only (never persisted)
- Refresh tokens in httpOnly cookies
- Session timeout with inactivity detection
- Force password change on first admin login
- JWT decode utility for token inspection

### Content Security

- HTML sanitization via DOMPurify (rich text)
- Link sanitization with `rel="noopener noreferrer nofollow"` and `target="_blank"`

---

## 11. SEO & Performance

### SEO

- **Sitemap**: Dynamic `sitemap.ts` covering core, discovery, auth, info, company, and legal routes
- **Robots.txt**: Generated
- **Meta tags**: Per-page (landing page has full Open Graph)
- **Semantic HTML**: Used throughout

### Performance

- **React Server Components**: Default rendering mode
- **Image optimization**: `next/image` with `avif` and `webp` formats; remote patterns for AWS S3, Unsplash, Cloudinary
- **Code splitting**: Automatic per-route
- **Package optimization**: `optimizePackageImports` for `@/components` and `@/lib`
- **Compression**: Enabled in production
- **Font loading**: `font-display: swap` for Cera Pro

---

## 12. Testing Strategy

### Current Setup

| Type | Framework | Status |
|------|----------|--------|
| Unit tests | Vitest + Testing Library | 8 test files, 63 tests passing |
| E2E tests | Playwright | 13 spec files across auth, dashboard, admin, marketplace |
| Manual tests | Staff flow checklist | 160+ manual test cases documented |

### Vitest Configuration

- Environment: jsdom
- Path alias: `@/` → `./src/`
- **Known issue**: `include` pattern missing — Vitest picks up Playwright `.spec.ts` files, causing 17 false failures. Needs `include: ["src/**/*.test.ts"]` fix.

### Playwright Configuration

- Base URL: `http://localhost:3001`
- 7 projects: setup, unauthenticated, user, gym-owner, trainer, dietitian, admin, marketplace
- Auth state stored in `e2e/.auth/*.json`
- Screenshots on failure, trace on first retry
- Web server auto-starts with `npm run dev`

### Test Commands

```bash
npm test              # Vitest unit tests
npm run test:e2e      # Playwright E2E tests
npm run test:e2e:ui   # Playwright with UI
npm run test:e2e:headed  # Playwright headed mode
```

---

## 13. Environment & Deployment

### Environment Variables

```env
# Application
NEXT_PUBLIC_APP_URL=http://localhost:3001
PORT=3001

# API
NEXT_PUBLIC_API_URL=https://binectics-gym-dev-api-dwbaeufeafgqd6db.canadacentral-01.azurewebsites.net/api/v1

# Auth
NEXT_PUBLIC_SESSION_TIMEOUT=3600000

# Payment (public keys only)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=

# External Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=

# Monitoring
NEXT_PUBLIC_SENTRY_DSN=

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_COOKIE_CONSENT=true
NEXT_PUBLIC_MAINTENANCE_MODE=false
```

### CI/CD

- **Platform**: Azure App Service
- **Workflow**: `.github/workflows/main_binectics-frontend-app.yml`
- **Build**: `npm run build` (Next.js production build)
- **Node**: >=22.0.0

---

## 14. Known Issues & Tech Debt

| Issue | Severity | Status |
|-------|----------|--------|
| Vitest picks up Playwright specs (missing `include` pattern) | High | Open |
| `.env` file missing (only `.env.example` with placeholder keys) | High | Open |
| Payment gateway keys are placeholders | Critical | Open (pre-launch blocker) |
| Loading states inconsistent across routes | Medium | Open |
| No form validation library standardized (mix of inline + Zod) | Medium | Partial |
| Some dashboard pages still placeholders | Low | ~15 routes |
| No analytics integration | Medium | Open |
| `text-size-adjust: 100%` needed for Samsung/Android | Low | Fixed |

---

## 15. Roadmap

### Completed

- Landing page with full Blinkist design system
- 162 routes implemented
- Authentication flow (login, register, reset, verify, remember me)
- All provider dashboards (gym owner, trainer, dietitian)
- Admin panel with verification, announcements, user management
- Marketplace with search, filters, provider profiles
- Payment integration (Stripe, Paystack, Flutterwave)
- QR check-in system
- SSE notification system (38 types)
- React Query caching layer
- Rich text editor (TipTap)
- Client management with health tracking
- Workout and diet plan CRUD
- Reviews with provider responses
- Form builder with drag-and-drop
- Consultation booking
- Team/organization management
- Mobile responsive design (ongoing)

### In Progress

- Full mobile QA pass on all dashboard/admin/detail routes
- E2E test coverage expansion
- SEO optimization (meta tags, Open Graph per route)

### Planned

- Real payment gateway key configuration (pre-launch)
- Error boundary coverage on all routes
- Analytics integration (Google Analytics, Sentry)
- CI/CD pipeline hardening
- Performance profiling and optimization
- Accessibility audit (WCAG 2.1 AA)

---

## 16. Appendices

### A. Enums

All enums defined in `src/lib/types/index.ts` and `src/lib/constants/index.ts`:

- `UserRole`: USER, GYM_OWNER, TRAINER, DIETITIAN, ADMIN
- `AccountType`: gym_owner, personal_trainer, dietitian, fitness_member
- `VerificationStatus`: PENDING, VERIFIED, REJECTED
- `SubscriptionStatus`: ACTIVE, INACTIVE, CANCELLED, EXPIRED
- `DurationType`: daily, weekly, monthly, quarterly, yearly
- `MealType`: breakfast, lunch, dinner, snack
- `MealRating`: great, good, okay, poor
- `ActivityType`: cardio, strength, flexibility, hiit, yoga, swimming, cycling, running, walking, other
- `ClientJournalMood`: excellent, good, okay, low, stressed
- `NotificationType`: 38 types (see Section 5.8)

### B. Supported Currencies

| Code | Symbol | Gateway |
|------|--------|---------|
| USD | $ | Stripe |
| EUR | € | Stripe |
| GBP | £ | Stripe |
| NGN | ₦ | Paystack / Flutterwave |
| KES | KSh | Paystack |
| ZAR | R | Paystack |
| AED | د.إ | Stripe |
| INR | ₹ | Stripe |

### C. Utility Functions

| Function | File | Purpose |
|----------|------|---------|
| `formatCurrency(amount, currency)` | `format.ts` | Multi-currency formatting with narrow symbols |
| `formatLocal(utcIso, format)` | `format.ts` | Format UTC in user's local timezone |
| `formatInTz(utcIso, format, tz)` | `format.ts` | Format UTC in specific timezone |
| `dualTimezoneLabel(start, end, provTz, clientTz)` | `format.ts` | Dual-timezone consultation display |
| `signedChange(value)` | `format.ts` | Returns "+3.5" or "−2.1" |
| `stripHtml(html)` | `format.ts` | Strip HTML tags for previews |
| `getClientTimezone()` | `format.ts` | Browser IANA timezone detection |
| `resolveNotificationLink(link, role)` | `resolveNotificationLink.ts` | Map backend URLs to role-specific routes |
| `pMap(items, fn, concurrency)` | `async.ts` | Concurrency-limited parallel map |

### D. Related Documents

- [Mobile App PRD](tech-specs/mobile/PRD_MOBILE_APP.md) — React Native mobile app specification
- [Notification Module Tech Spec](tech-specs/notifications/TECH_SPEC_NOTIFICATION_MODULE.md)
- [Consultation Module Tech Spec](tech-specs/consultations/TECH_SPEC_CONSULTATION_MODULE.md)
- [Frontend File Structure](architecture/FRONTEND_FILE_STRUCTURE.md)
- [Full Stack Audit](architecture/FULL_STACK_AUDIT.md)
- [UI Standards](UI_STANDARDS.md)
- [Staff Flow Testing Checklist](STAFF_FLOW_TESTING_CHECKLIST.md)
- [Timezone Strategy](architecture/TIMEZONE_STRATEGY.md)

---

**Last Updated:** 2026-05-09
**Author:** Engineering Team
**Status:** Living Document — updated as features ship
