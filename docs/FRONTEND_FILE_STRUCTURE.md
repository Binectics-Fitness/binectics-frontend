# Binectics Frontend — File Structure Guide

> **Last Updated**: 2025-01-27
> **Stack**: Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · TypeScript 5

---

## Table of Contents

- [Overview](#overview)
- [Root Configuration](#root-configuration)
- [Source Directory (`src/`)](#source-directory-src)
  - [App Router (`src/app/`)](#app-router-srcapp)
  - [Components (`src/components/`)](#components-srccomponents)
  - [Contexts (`src/contexts/`)](#contexts-srccontexts)
  - [Hooks (`src/hooks/`)](#hooks-srchooks)
  - [Library (`src/lib/`)](#library-srclib)
- [Public Assets (`public/`)](#public-assets-public)
- [Architecture Patterns](#architecture-patterns)
- [Key Conventions](#key-conventions)

---

## Overview

```
binectics-frontend/
├── docs/                  # Project documentation (you are here)
├── public/                # Static assets & fonts
├── src/
│   ├── app/               # Next.js App Router — all pages & layouts
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React Context providers
│   ├── hooks/             # Custom React hooks
│   └── lib/               # API clients, types, utilities, constants
├── middleware.ts           # Next.js Edge middleware (auth guards)
├── next.config.ts          # Next.js configuration
├── tailwind / postcss      # Styling config
└── package.json            # Dependencies & scripts
```

**Key facts:**

- ~112 pages across 39 route groups
- 34 shared components
- 8 API service modules
- Role-based dashboards for 5 user roles (User, Gym Owner, Trainer, Dietician, Admin)
- Deploys to **Netlify** (`netlify.toml`)
- Calls an external **Azure-hosted NestJS API** — no backend code lives here

---

## Root Configuration

| File                    | Purpose                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `middleware.ts`         | Edge middleware — redirects unauthenticated users from `/dashboard` and `/admin` to `/login`, and redirects authenticated users away from `/login` and `/register` |
| `next.config.ts`        | Image remote patterns (AWS S3, Unsplash), strict mode, package import optimizations                                                                                |
| `eslint.config.mjs`     | ESLint 9 flat config with `eslint-config-next`                                                                                                                     |
| `postcss.config.mjs`    | PostCSS with Tailwind CSS 4 plugin                                                                                                                                 |
| `tsconfig.json`         | TypeScript config — `@/*` path alias maps to `./src/*`                                                                                                             |
| `netlify.toml`          | Netlify deployment settings                                                                                                                                        |
| `.env` / `.env.example` | Environment variables (`NEXT_PUBLIC_API_URL`, etc.)                                                                                                                |

### Scripts

```bash
npm run dev      # Start dev server on port 3001
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Dependencies (notable)

| Package        | Version | Usage                              |
| -------------- | ------- | ---------------------------------- |
| `next`         | 16.1.x  | Framework                          |
| `react`        | 19.x    | UI library                         |
| `tailwindcss`  | 4.x     | Utility-first CSS                  |
| `lucide-react` | 0.575.x | Icon library                       |
| `qrcode`       | 1.5.x   | QR code generation (gym check-ins) |
| `@dnd-kit/*`   | latest  | Drag-and-drop (form builder)       |

---

## Source Directory (`src/`)

### App Router (`src/app/`)

Next.js App Router uses the file system for routing. Each folder with a `page.tsx` maps to a URL path.

#### Global Files

| File            | Purpose                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| `layout.tsx`    | Root layout — wraps app in `AuthProvider` → `OrganizationProvider` → `ConditionalLayout` + `CookieConsent` |
| `globals.css`   | Global styles, Cera Pro `@font-face` declarations, CSS custom properties                                   |
| `page.tsx`      | Landing page (`/`)                                                                                         |
| `error.tsx`     | Global error boundary                                                                                      |
| `not-found.tsx` | Custom 404 page                                                                                            |

#### Route Groups

##### Public Pages

| Route           | Description                                               |
| --------------- | --------------------------------------------------------- |
| `/`             | Landing page — hero, features, pricing, testimonials, FAQ |
| `/about`        | About page                                                |
| `/how-it-works` | Step-by-step platform guide                               |
| `/pricing`      | Pricing plans                                             |
| `/faq`          | Frequently asked questions                                |
| `/contact`      | Contact form                                              |
| `/blog`         | Blog listing                                              |
| `/careers`      | Careers page                                              |
| `/partners`     | Partners information                                      |
| `/press`        | Press/media page                                          |
| `/countries`    | Available countries listing                               |
| `/help`         | Help center                                               |

##### Legal & Policy

| Route       | Description       |
| ----------- | ----------------- |
| `/privacy`  | Privacy policy    |
| `/terms`    | Terms of service  |
| `/cookies`  | Cookie policy     |
| `/security` | Security overview |

##### Authentication (`/login`, `/register`, etc.)

| Route                     | Description                     |
| ------------------------- | ------------------------------- |
| `/login`                  | Login page                      |
| `/register`               | Role selection for registration |
| `/register/user`          | Fitness Enthusiast signup form  |
| `/register/gym-owner`     | Gym Owner signup form           |
| `/register/trainer`       | Trainer signup form             |
| `/register/dietician`     | Dietician signup form           |
| `/register/invite`        | Accept team invitation signup   |
| `/forgot-password`        | Request password reset          |
| `/reset-password/[token]` | Reset password with token       |
| `/verify-email/[token]`   | Email verification              |
| `/unsubscribe/[token]`    | Email unsubscribe               |

##### Discovery (Browse)

| Route                           | Description                   |
| ------------------------------- | ----------------------------- |
| `/search`                       | Global search with filters    |
| `/gyms`                         | Browse all gyms               |
| `/gyms/[gymId]`                 | Gym detail/profile page       |
| `/trainers`                     | Browse all trainers           |
| `/trainers/[trainerId]`         | Trainer detail/profile page   |
| `/dieticians`                   | Browse all dieticians         |
| `/dieticians/[dieticianId]`     | Dietician detail/profile page |
| `/marketplace`                  | Browse marketplace listings   |
| `/marketplace/[listingId]`      | Marketplace listing detail    |
| `/categories/gyms`              | Category — gyms               |
| `/categories/personal-training` | Category — personal training  |
| `/categories/nutrition`         | Category — nutrition          |
| `/categories/strength-training` | Category — strength training  |
| `/categories/yoga-pilates`      | Category — yoga & pilates     |
| `/check-in/[gymId]`             | QR check-in page for a gym    |

##### Forms System

| Route                   | Description                             |
| ----------------------- | --------------------------------------- |
| `/forms`                | Form listing / management               |
| `/forms/create`         | Create new form (drag-and-drop builder) |
| `/forms/[id]/edit`      | Edit existing form                      |
| `/forms/[id]/submit`    | Submit/fill a form                      |
| `/forms/[id]/responses` | View form responses                     |
| `/forms/[id]/analytics` | Form analytics                          |

##### User Dashboard (`/dashboard`)

| Route                               | Description                         |
| ----------------------------------- | ----------------------------------- |
| `/dashboard`                        | Main user dashboard                 |
| `/dashboard/subscriptions`          | Active subscriptions                |
| `/dashboard/progress`               | Progress tracking                   |
| `/dashboard/workouts`               | Workout history                     |
| `/dashboard/nutrition`              | Nutrition tracking                  |
| `/dashboard/schedule`               | Schedule / calendar                 |
| `/dashboard/goals`                  | Fitness goals                       |
| `/dashboard/bookings`               | Booking history                     |
| `/dashboard/explore`                | Discover providers                  |
| `/dashboard/marketplace`            | Solo pro — manage listings          |
| `/dashboard/marketplace/requests`   | Solo pro — manage incoming requests |
| `/dashboard/team`                   | Team listing                        |
| `/dashboard/team/[orgId]`           | Team detail                         |
| `/dashboard/help`                   | Dashboard help                      |
| `/dashboard/settings`               | Settings hub (has sub-layout)       |
| `/dashboard/settings/profile`       | Edit profile                        |
| `/dashboard/settings/account`       | Account settings                    |
| `/dashboard/settings/billing`       | Billing & payment                   |
| `/dashboard/settings/notifications` | Notification preferences            |
| `/dashboard/settings/privacy`       | Privacy settings                    |

##### Gym Owner Dashboard (`/dashboard/gym-owner`)

| Route                                              | Description              |
| -------------------------------------------------- | ------------------------ |
| `/dashboard/gym-owner`                             | Gym owner home           |
| `/dashboard/gym-owner/analytics`                   | Gym analytics            |
| `/dashboard/gym-owner/check-ins`                   | Check-in management      |
| `/dashboard/gym-owner/classes`                     | Class management         |
| `/dashboard/gym-owner/classes/new`                 | Create new class         |
| `/dashboard/gym-owner/facility`                    | Facility management      |
| `/dashboard/gym-owner/marketing`                   | Marketing tools          |
| `/dashboard/gym-owner/marketplace`                 | Org marketplace listings |
| `/dashboard/gym-owner/members`                     | Member management        |
| `/dashboard/gym-owner/members/[memberId]`          | Member detail            |
| `/dashboard/gym-owner/members/[memberId]/activity` | Member activity          |
| `/dashboard/gym-owner/plans`                       | Plan management          |
| `/dashboard/gym-owner/plans/create`                | Create new plan          |
| `/dashboard/gym-owner/plans/[planId]`              | Plan detail              |
| `/dashboard/gym-owner/revenue`                     | Revenue overview         |
| `/dashboard/gym-owner/reviews`                     | Review management        |
| `/dashboard/gym-owner/settings`                    | Gym settings             |
| `/dashboard/gym-owner/staff`                       | Staff management         |
| `/dashboard/gym-owner/staff/invite`                | Invite staff member      |
| `/dashboard/gym-owner/staff/[trainerId]`           | Staff detail             |
| `/dashboard/gym-owner/staff/[trainerId]/revenue`   | Staff revenue            |
| `/dashboard/gym-owner/staff/[trainerId]/schedule`  | Staff schedule           |

##### Trainer Dashboard (`/dashboard/trainer`)

| Route                          | Description        |
| ------------------------------ | ------------------ |
| `/dashboard/trainer`           | Trainer home       |
| `/dashboard/trainer/analytics` | Trainer analytics  |
| `/dashboard/trainer/clients`   | Client management  |
| `/dashboard/trainer/earnings`  | Earnings overview  |
| `/dashboard/trainer/plans`     | Plan management    |
| `/dashboard/trainer/reviews`   | Review management  |
| `/dashboard/trainer/sessions`  | Session management |
| `/dashboard/trainer/settings`  | Trainer settings   |

##### Dietician Dashboard (`/dashboard/dietician`)

| Route                                  | Description             |
| -------------------------------------- | ----------------------- |
| `/dashboard/dietician`                 | Dietician home          |
| `/dashboard/dietician/analytics`       | Dietician analytics     |
| `/dashboard/dietician/clients`         | Client management       |
| `/dashboard/dietician/consultations`   | Consultation management |
| `/dashboard/dietician/earnings`        | Earnings overview       |
| `/dashboard/dietician/nutrition-plans` | Nutrition plan builder  |
| `/dashboard/dietician/plans`           | Plan management         |
| `/dashboard/dietician/reviews`         | Review management       |
| `/dashboard/dietician/settings`        | Dietician settings      |

##### Admin Panel (`/admin`)

| Route                           | Description             |
| ------------------------------- | ----------------------- |
| `/admin`                        | Admin login / entry     |
| `/admin/dashboard`              | Admin main dashboard    |
| `/admin/analytics`              | Platform analytics      |
| `/admin/create-super-admin`     | Create super admin user |
| `/admin/providers`              | Provider management     |
| `/admin/providers/[providerId]` | Provider detail         |
| `/admin/revenue`                | Revenue analytics       |
| `/admin/reviews`                | Review moderation       |
| `/admin/subscriptions`          | Subscription management |
| `/admin/users`                  | User management         |
| `/admin/users/[userId]`         | User detail             |
| `/admin/verification`           | Verification queue      |

##### Utility

| Route                  | Description           |
| ---------------------- | --------------------- |
| `/maintenance`         | Maintenance mode page |
| `/status`              | System status page    |
| `/qr-help`             | QR code help          |
| `/teams`               | Teams listing         |
| `/teams/invite/accept` | Accept team invite    |

---

### Components (`src/components/`)

All shared components live here. They are re-exported via `index.ts` for clean imports:

```ts
import { Button, Card, Input, Badge } from "@/components";
```

#### UI Primitives

| Component              | Export | Description                                                                |
| ---------------------- | ------ | -------------------------------------------------------------------------- |
| `Button.tsx`           | Named  | Button with variants: `primary`, `secondary`, `outline`, `ghost`, `danger` |
| `Input.tsx`            | Named  | Text input with label, error state, helper text                            |
| `PasswordInput.tsx`    | Named  | Input with show/hide toggle for passwords                                  |
| `Card.tsx`             | Named  | Card container with padding and shadow                                     |
| `Container.tsx`        | Named  | Max-width centered container with responsive padding                       |
| `Badge.tsx`            | Named  | Status/label badge with color variants                                     |
| `Accordion.tsx`        | Named  | Expandable FAQ-style accordion                                             |
| `SearchableSelect.tsx` | —      | Dropdown select with search filtering                                      |
| `TagInput.tsx`         | —      | Multi-tag input field                                                      |
| `Breadcrumb.tsx`       | —      | Breadcrumb navigation                                                      |

#### Layout Components

| Component               | Export  | Description                                              |
| ----------------------- | ------- | -------------------------------------------------------- |
| `Navbar.tsx`            | Default | Top navigation bar — links, auth state, mobile toggle    |
| `Footer.tsx`            | Default | Site footer with link columns                            |
| `MobileNav.tsx`         | Default | Mobile slide-out navigation menu                         |
| `ConditionalLayout.tsx` | Default | Wraps children — hides Navbar/Footer on dashboard routes |
| `ComingSoonPage.tsx`    | —       | Placeholder page for unfinished routes                   |

#### Dashboard Components

| Component                  | Export  | Description                                             |
| -------------------------- | ------- | ------------------------------------------------------- |
| `AppSidebar.tsx`           | —       | Base sidebar component (used by role-specific sidebars) |
| `DashboardSidebar.tsx`     | Default | User role sidebar (`/dashboard` routes)                 |
| `GymOwnerSidebar.tsx`      | Default | Gym Owner sidebar (`/dashboard/gym-owner`)              |
| `TrainerSidebar.tsx`       | Default | Trainer sidebar (`/dashboard/trainer`)                  |
| `DieticianSidebar.tsx`     | Default | Dietician sidebar (`/dashboard/dietician`)              |
| `AdminSidebar.tsx`         | Default | Admin sidebar (`/admin` routes)                         |
| `DashboardLoading.tsx`     | Default | Skeleton loader for dashboard pages                     |
| `OnboardingBanner.tsx`     | Default | Banner prompting users to complete profile setup        |
| `OrganizationSelector.tsx` | —       | Dropdown to switch between organizations                |

#### Feature Components

| Component                    | Export  | Description                                        |
| ---------------------------- | ------- | -------------------------------------------------- |
| `PricingSection.tsx`         | Default | Pricing cards with plan details                    |
| `PricingToggle.tsx`          | Default | Monthly/Annual pricing switch                      |
| `ProfessionalsTab.tsx`       | Default | Tabbed interface (Gym Owners/Trainers/Dieticians)  |
| `ContactForm.tsx`            | Named   | Contact form component                             |
| `CookieConsent.tsx`          | Default | GDPR cookie consent banner                         |
| `CookieSettings.tsx`         | Default | Detailed cookie preference management              |
| `SessionModal.tsx`           | Default | Session expiration warning modal                   |
| `InactivityNotification.tsx` | Named   | Inactivity timeout warning                         |
| `PublishSuccessModal.tsx`    | —       | Success modal after publishing marketplace listing |

---

### Contexts (`src/contexts/`)

| File                      | Provider                 | Hook                | Purpose                                                                                                                                                                  |
| ------------------------- | ------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `AuthContext.tsx`         | `<AuthProvider>`         | `useAuth()`         | Authentication state — `user`, `login()`, `register()`, `logout()`, `isAuthenticated`, `isLoading`, `updateUser()`. Also handles JWT expiry detection and session modal. |
| `OrganizationContext.tsx` | `<OrganizationProvider>` | `useOrganization()` | Multi-org state — `organizations[]`, `currentOrg`, `setCurrentOrg()`, `refreshOrganizations()`. Persists selection in `localStorage`.                                    |

**Provider hierarchy** (in `layout.tsx`):

```
<AuthProvider>
  <OrganizationProvider>
    <ConditionalLayout>
      {children}
    </ConditionalLayout>
    <CookieConsent />
  </OrganizationProvider>
</AuthProvider>
```

---

### Hooks (`src/hooks/`)

| Hook                     | Description                                                          |
| ------------------------ | -------------------------------------------------------------------- |
| `useAutoLogout.ts`       | Auto-logout after N minutes of inactivity — used in dashboard layout |
| `useRequireAuth.ts`      | Redirects unauthenticated users to login (client-side guard)         |
| `useCookieConsent.ts`    | Manages cookie consent state via `localStorage`                      |
| `useAutoAcceptInvite.ts` | Automatically accepts team invitations from URL parameters           |

---

### Library (`src/lib/`)

#### API Services (`src/lib/api/`)

All API modules return `Promise<ApiResponse<T>>` and use the shared `ApiClient`.

| File             | Service Object       | Endpoints Covered                                                                                                              |
| ---------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `client.ts`      | `apiClient`          | Base HTTP client — `get()`, `post()`, `patch()`, `delete()`. Handles Bearer token injection, 401 refresh, error normalization. |
| `index.ts`       | —                    | Re-exports all services                                                                                                        |
| `auth.ts`        | `authService`        | Login, register, forgot/reset password, email verification, profile update, change password                                    |
| `marketplace.ts` | `marketplaceService` | Public search, listing CRUD (solo & org), reviews, connection requests                                                         |
| `teams.ts`       | `teamsService`       | Organization CRUD, member management, invitations                                                                              |
| `forms.ts`       | `formsService`       | Form builder CRUD, submissions, responses, analytics                                                                           |
| `progress.ts`    | `progressService`    | Progress tracking, workout logs, metrics                                                                                       |
| `utility.ts`     | `utilityService`     | Countries, states, currencies, search                                                                                          |

#### Types (`src/lib/types/index.ts`)

Central type definitions for the entire app, including:

- **Auth**: `User`, `UserRole`, `LoginRequest`, `RegisterRequest`, `ApiResponse<T>`
- **Providers**: `Gym`, `Trainer`, `Dietician`, `Plan`, `Subscription`
- **Marketplace**: `MarketplaceListing`, `MarketplaceRequest`, `MarketplaceReview`, `MarketplaceSearchParams`
- **Teams**: Types imported from `teams.ts` service
- **Shared**: `VerificationStatus`, `SubscriptionStatus`, pagination types

#### Constants (`src/lib/constants/`)

| File        | Exports                                                                                         |
| ----------- | ----------------------------------------------------------------------------------------------- |
| `routes.ts` | `AUTH_ROUTES`, `DASHBOARD_ROUTES`, `getDashboardRoute()`, `isAuthRoute()`, `isDashboardRoute()` |
| `index.ts`  | Re-exports                                                                                      |

#### Utilities

| File               | Purpose                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `utils.ts`         | General utility functions                                                                                                      |
| `design-tokens.ts` | Blinkist-inspired color palette, spacing, typography tokens — used by Tailwind config and can be imported for programmatic use |
| `utils/storage.ts` | `tokenStorage`, `refreshTokenStorage`, `clearAuthStorage` — thin wrappers around `localStorage` / cookies                      |

---

## Public Assets (`public/`)

```
public/
├── fonts/
│   ├── Cera-Pro-Regular.otf       # Body text
│   ├── Cera-Pro-Medium.otf        # Emphasis
│   ├── Cera-Pro-Bold.otf          # Subheadings
│   ├── Cera-Pro-Black.otf         # Headings
│   ├── (+ italic & light/thin variants)
│   └── svgexport-4.svg            # Blinkist-style login icon
├── file.svg, globe.svg, next.svg, vercel.svg, window.svg  # Default Next.js SVGs
```

---

## Architecture Patterns

### 1. API Service Layer

All API calls go through a centralized client with automatic auth token injection:

```
Component → service.method() → apiClient.get/post() → fetch(API_URL + path)
```

The `ApiClient` class in `client.ts` handles:

- Bearer token from `tokenStorage`
- 401 responses → token refresh attempt → retry or logout
- Consistent `ApiResponse<T>` return shape: `{ success, data?, error?, errors? }`

### 2. Role-Based Routing

Each role gets its own dashboard section with a dedicated sidebar:

| Role      | Dashboard Root         | Sidebar Component  |
| --------- | ---------------------- | ------------------ |
| User      | `/dashboard`           | `DashboardSidebar` |
| Gym Owner | `/dashboard/gym-owner` | `GymOwnerSidebar`  |
| Trainer   | `/dashboard/trainer`   | `TrainerSidebar`   |
| Dietician | `/dashboard/dietician` | `DieticianSidebar` |
| Admin     | `/admin`               | `AdminSidebar`     |

### 3. Auth Protection (Two Layers)

1. **Middleware** (`middleware.ts`): Edge-level — checks `access_token` cookie, redirects before page loads
2. **Client-side** (`useRequireAuth` hook / `useAuth`): Component-level guards with role checking

### 4. Conditional Layout

`ConditionalLayout` hides the Navbar and Footer when the URL starts with `/dashboard` or `/admin` (those routes use sidebars instead).

### 5. Organization Context

Gym Owners and staff work within organizations. The `OrganizationContext` provides the currently selected org, with a selector component for switching. Org-specific API calls pass the `currentOrg._id`.

---

## Key Conventions

- **Path alias**: `@/` → `src/` (e.g., `import { Button } from "@/components"`)
- **Server vs Client**: Pages are server components by default; `"use client"` at top of file when using hooks, state, or browser APIs
- **Suspense boundary**: Any component using `useSearchParams()` must be wrapped in `<Suspense>`
- **Image handling**: Use `<img>` tags (not `next/image`) for external URLs not in `next.config.ts` remote patterns
- **Icons**: All icons from `lucide-react`
- **Styling**: Tailwind utility classes — no CSS modules, no styled-components
- **Colors**: Use design token CSS variables (`--foreground`, `--primary-500`, etc.) or Tailwind classes like `text-foreground`, `bg-primary-500`
- **No backend code**: This repo is strictly frontend. All data comes from the external API via `NEXT_PUBLIC_API_URL`
