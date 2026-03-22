# Tech Spec: Binectics Frontend MVP Platform

**Status**: Draft
**Author**: Copilot
**Date**: 2026-03-20
**Source**: Converted from `Claude.MD` development log and PRD summary

---

## 1) Overview

Binectics is a global fitness marketplace frontend connecting gyms, trainers, dietitians, and fitness enthusiasts across 50+ countries.

This spec defines the frontend MVP architecture, scope, UX constraints, delivery phases, and implementation standards for the Next.js application.

---

## 2) Product Goals

- Deliver a production-ready frontend MVP for discovery, subscriptions, and role-based dashboards.
- Standardize UI/UX with a Blinkist-inspired design system.
- Integrate reliably with the external Azure API using public client configuration.
- Ship progressively by milestone (landing, responsive optimization, auth, core features, provider/admin dashboards).

---

## 3) Scope and Constraints

### In Scope (Frontend)

- Next.js 16 App Router frontend pages/components.
- Client-side API integration via external backend (`NEXT_PUBLIC_API_URL`).
- Role-based UI flows for users, gym owners, trainers, dietitians, and admins.
- Responsive design for mobile, tablet, and desktop.

### Out of Scope (This Repository)

- Backend services, APIs, database schema/migrations, or server-side auth logic.
- Next.js API routes (`app/api` or `pages/api`).
- Secret management for payment/auth providers.

### Hard Constraint

This repository is frontend-only. Any backend implementation is explicitly prohibited.

---

## 4) Technical Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS 4
- **Architecture**: Frontend-only client application
- **Backend dependency**: External Azure API
- **Typography**: Cera Pro (Regular, Medium, Bold, Black)

---

## 5) Design System Requirements

### Color Tokens

- `--foreground: #03314b`
- `--background: #f7f4ef`
- `--primary-500: #00d991`
- `--accent-blue-500: #0267f2`
- `--accent-yellow-500: #fdb90e`
- `--accent-purple-500: #8b5cf6`

### UI Principles

- Dark text on colored surfaces (including green and yellow).
- Minimal card-based layouts with generous spacing.
- No button animations; only hover/active color transitions.
- Role-aware accenting:
  - Gym Owner: Blue
  - Trainer: Yellow
  - Dietitian: Purple

### Spacing/Patterns

- Section spacing: `py-20 sm:py-28`
- Container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- Card spacing: `p-6` / `p-8`
- Grid gaps: `gap-4`, `gap-6`, `gap-8`, `gap-12`

---

## 6) Current Implementation Baseline (Completed)

### Landing Page

Implemented and production-styled with:

- Hero
- How It Works
- Use Cases
- Features and platform capabilities
- Global Reach
- QR Check-in highlight
- Pricing with monthly/annual toggle
- Testimonials
- Trust & Verification
- Professionals tabs
- FAQ accordion
- CTA and footer

### Reusable Components Delivered

- `Accordion.tsx`
- `PricingSection.tsx`
- `PricingToggle.tsx`
- `ProfessionalsTab.tsx`

---

## 7) MVP Functional Requirements

### 7.1 Authentication & Roles

- Register/login/forgot/reset flows.
- Role-based onboarding pages:
  - User
  - Gym Owner
  - Trainer
  - Dietitian
- Email verification UX.

### 7.2 Discovery Marketplace

- Search and filtering by location, type, price range, verification status.
- List/detail experiences for gyms, trainers, and dietitians.
- Country and category entry points.

### 7.3 Subscriptions & Payments (Frontend)

- Checkout/payment state pages (processing/success/cancelled).
- Multi-currency display UX.
- Subscription status and lifecycle visibility in dashboard.

### 7.4 Provider Experiences

- Gym owner dashboard: plans, members, check-ins, analytics.
- Trainer dashboard: clients, journals, plans, analytics.
- Dietitian dashboard: clients, journals, plans, analytics.

### 7.5 Verification & Trust UX

- Verification apply/upload/status/rejected flows.
- Verified badge rendering across marketplace profiles.

### 7.6 QR Check-in UX

- QR help and check-in interaction pages.
- Gym attendance visibility pages.

### 7.7 Admin Frontend

- Admin pages for users, providers, verification queue, plans, subscriptions, metrics, settings.

---

## 8) Routing/Page Scope

Total targeted page inventory: **112 pages**.

- Auth: 8
- User dashboard: 12
- Discovery: 13
- Gym owner dashboard: 10
- Trainer dashboard: 10
- Dietitian dashboard: 10
- Verification: 5
- Payment: 6
- Admin: 12
- Static/info: 15
- Location: 3
- Utility: 5
- Additional: 4

Current status from project log: landing complete, remaining pages in progressive implementation.

---

## 9) Architecture and Frontend Conventions

### App Architecture

- App Router with server components by default.
- Client components only when interactivity/state is required.
- Shared UI and domain helpers under `src/components`, `src/lib`, `src/services`, `src/utils`.

### URL Query Handling (Build Constraint)

Any usage of `useSearchParams()` must be wrapped with a `Suspense` boundary to avoid static build failures.

Required pattern:

1. Inner component uses `useSearchParams()`.
2. Outer page wraps inner component with `<Suspense fallback={...}>`.

---

## 10) API Integration Specification

### Base URL

- `NEXT_PUBLIC_API_URL`

### Client-Side Responsibilities

- Read public configuration from environment variables.
- Handle loading/error/empty states at page/component level.
- Enforce role-aware UI routing/guard behavior.

### Backend Responsibilities (Referenced Only)

- Auth token signing/verification
- Database operations
- Payment secret handling
- Email/notifications infrastructure
- File storage and provider secrets

---

## 11) Environment Variables (Frontend)

Required runtime keys:

- `NODE_ENV`
- `NEXT_PUBLIC_APP_URL`
- `PORT`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SESSION_TIMEOUT`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID`
- `NEXT_PUBLIC_SENTRY_DSN`
- `NEXT_PUBLIC_ENABLE_ANALYTICS`
- `NEXT_PUBLIC_ENABLE_COOKIE_CONSENT`
- `NEXT_PUBLIC_MAINTENANCE_MODE`

---

## 12) Delivery Plan and Milestones

### Phase 1 (Completed)

- Landing page and core marketing sections/components.

### Phase 2 (In Progress)

- Mobile/tablet optimization:
  - responsive navbar/mobile menu
  - mobile-first stacking
  - touch target refinement
  - tablet breakpoint tuning

### Phase 3 (Next)

- Authentication flow pages and role-specific registration.

### Phase 4

- Core user features: dashboard, search/discovery, profiles, subscription flow.

### Phase 5

- Provider dashboards and plan/client/journal management surfaces.

### Phase 6

- Verification flow + QR UX implementation.

### Phase 7

- Admin panel frontend.

---

## 13) Quality, Testing, and Observability

### Current Gaps

- Loading states not fully implemented.
- Error boundaries missing for critical routes.
- Form validation library not standardized.
- Testing framework and coverage strategy not fully established.
- CI/CD and monitoring integration pending.

### MVP Quality Requirements

- Add route-level error boundaries for high-traffic pages.
- Add loading states/skeletons for async API pages.
- Introduce consistent form validation and error messaging.
- Establish at least baseline unit/integration coverage for auth, dashboard, and payment flows.

---

## 14) Risks and Mitigations

- **Risk**: API contract drift between frontend and Azure backend.
  - **Mitigation**: typed service layer + response schema guards.
- **Risk**: Responsive regressions during rapid page rollout.
  - **Mitigation**: breakpoint checklist and shared layout primitives.
- **Risk**: Build failures from App Router query param misuse.
  - **Mitigation**: enforced `Suspense` pattern for `useSearchParams` usage.

---

## 15) Acceptance Criteria (MVP)

- Frontend-only architecture is preserved with no backend code additions.
- Landing + responsive optimization meet design token and accessibility standards.
- Auth and role-based onboarding flows are functional against external API.
- Discovery, subscriptions, and core role dashboards are navigable and API-connected.
- Verification and QR user journeys are implemented for intended roles.
- Admin frontend pages are delivered for core operational workflows.

---

## 16) References

- `Claude.MD`
- `docs/architecture/FRONTEND_FILE_STRUCTURE.md`
- `docs/tech-specs/progress/TECH_SPEC_CLIENT_WEIGHT_PROGRESS.md`
- Next.js documentation: https://nextjs.org/docs
- Tailwind CSS documentation: https://tailwindcss.com

---

## Appendix A) Dashboard Mobile Responsive Navigation (Merged)

This appendix merges and supersedes the standalone mobile navigation spec for dashboards.

### A.1 Context

Dashboard pages historically rendered desktop-style sidebar behavior on smaller screens, reducing usable content width and making key actions harder to access on phones.

### A.2 Goals / Non-Goals

#### Goals

1. Remove persistent desktop sidebar from phone-sized viewports.
2. Introduce mobile-first dashboard navigation that is easy to access/dismiss.
3. Keep role-based navigation items consistent across desktop and mobile.
4. Improve usability and accessibility without backend/API changes.

#### Non-Goals

- Redesign dashboard content modules/cards.
- Add backend endpoints or change API contracts.
- Change role permissions/information architecture.

### A.3 Roles Affected

- Fitness Enthusiast (user)
- Gym Owner
- Trainer
- Dietitian
- Admin

### A.4 Breakpoint Behavior

- **Desktop (`lg` and above)**: keep existing left sidebar behavior.
- **Tablet (`md` to `<lg`)**: compact/overlay sidebar pattern based on available width.
- **Mobile (`<md`)**:
  - Hide persistent sidebar.
  - Use top app bar + menu trigger.
  - Open navigation as slide-over drawer.
  - Optionally add bottom nav for high-frequency quick actions when needed.

### A.5 Mobile Navigation Pattern (Primary)

1. **Top App Bar**

- Left: menu button (opens drawer)
- Center: current section title
- Right: optional notification/profile action

2. **Slide-Over Drawer**

- Contains full role-based nav list.
- Uses backdrop and closes on backdrop click, Escape, and route selection.

3. **Content Area**

- Full width on mobile.
- Safe bottom padding if bottom actions are present.

### A.6 Information Architecture Rules

- Use one shared navigation config as source of truth for desktop and mobile.
- Do not duplicate nav definitions in separate files.
- Share role filtering logic and active-route highlighting behavior.
- If constrained constants are needed for nav mode/type, prefer enums over raw strings.

### A.7 Accessibility Requirements

1. Menu trigger must expose `aria-label` and `aria-expanded`.
2. Drawer must use dialog/sheet semantics with focus trapping.
3. Keyboard support:

- Open via Enter/Space on trigger
- Close via Escape
- Keep tab sequence constrained while drawer is open

4. Touch target minimum: 44x44 logical pixels.
5. Prevent background scroll while drawer is open.

### A.8 Technical Implementation Guidance

- Introduce/extend a responsive dashboard shell component.
- Keep desktop sidebar for larger viewports.
- Add mobile drawer navigation component.
- Close drawer on route change.
- Keep role guards and route permission checks unchanged.
- Use existing Tailwind tokens and design primitives only.

### A.9 Performance Considerations

1. Avoid rendering heavy desktop/mobile nav trees simultaneously when possible.
2. Prefer lightweight transform/opacity transitions.
3. Reserve top app bar height to minimize layout shift.

### A.10 Acceptance Criteria

1. On screens `<md`, persistent sidebar is hidden for all dashboard roles.
2. Mobile drawer exposes all role-allowed routes.
3. Active route indication is correct in drawer.
4. Drawer closes automatically after route selection.
5. Desktop navigation behavior remains unchanged.
6. Keyboard and screen-reader behavior pass baseline accessibility checks.
7. No backend/API changes are required.

### A.11 QA Checklist

Manual viewport checks: 360px, 390px, 430px, 768px, 1024px, 1280px.

- Validate all role dashboards (user, gym owner, trainer, dietitian, admin).
- Validate drawer open/close, backdrop click, Escape close, route transition close.
- Validate no horizontal overflow in key dashboard pages.
- Validate desktop regression behavior for sidebar and active states.

### A.12 Open Questions

1. Tablet (`md`) strategy: drawer-only vs compact collapsible sidebar?
2. MVP quick access: include bottom nav for 3–5 frequent routes, or app-bar + drawer only?
3. Keep notification/profile actions in app bar for all roles, or user role only?
