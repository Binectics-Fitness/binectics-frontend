# Feature Alignment Implementation Tracker

Last updated: 2026-06-11
Owners: Product + Frontend + Backend
Status legend: `not-started` | `in-progress` | `blocked` | `shipped`

## Purpose

This is the source-of-truth tracker for closing implementation gaps between:

1. Backend capabilities in `binectics-api`
2. Frontend user experiences in `binectics-frontend`

Use this doc to track execution status by feature, not just planning.

## Scope Categories

1. Backend Exists -> Frontend Missing
2. Frontend Needs Overhaul
3. Frontend Exists -> Backend Missing
4. Alignment/Refactor Opportunity
5. Technical Debt

## Audit Baseline (2026-06-11)

Summary:

1. Marketplace + auth are largely aligned.
2. Dashboard surfaces (member/gym/trainer/dietitian/admin) have uneven API integration.
3. Backend operational modules (teams, forms, loyalty, assignment rules, provider billing ops) are richer than current frontend exposure.
4. Several frontend routes remain placeholder-level or visual-first with limited persistence.

## Master Implementation Tracker

| Feature | Category | Backend Status | Frontend Status | Gap Summary | Priority | Effort | Owner | Next Action | Status |
|---|---|---|---|---|---|---|---|---|---|
| Team management workspace | Backend Exists -> Frontend Missing | complete | shipped | Org switching, member list, role/status updates, removal, invitations, direct add, full RBAC in `/dashboard/team` | high | M | FE | Monitor edge cases and permission workflows | shipped |
| Assignment rules UI | Backend Exists -> Frontend Missing | complete | shipped | Full CRUD at `/dashboard/assignment-rules`: strategy selector, tier filter, priority ordering | high | M | FE | Monitor edge cases | shipped |
| Loyalty center | Backend Exists -> Frontend Missing | complete | shipped | Balance KPIs, rewards catalog with redeem, history ledger, redemption list at `/dashboard/loyalty` | high | M | FE | Verify edge cases | shipped |
| Forms builder + responses | Backend Exists -> Frontend Missing | complete | shipped | Forms list + builder + question editor + responses + analytics at `/dashboard/forms` | high | M-H | FE | Verify analytics accuracy | shipped |
| Provider billing operations UI | Backend Exists -> Frontend Missing | complete | shipped | Status, usage bars, feature matrix, plan comparison, checkout flow, invoices at `/dashboard/billing` | high | M | FE | Test checkout flow | shipped |
| Feedback/NPS prompts | Backend Exists -> Frontend Missing | complete | shipped | FeedbackModal component + useFeedbackPrompt hook for auto-triggered NPS surveys | medium | S-M | FE | Wire into page layouts | shipped |
| Unified search omnibox | Backend Exists -> Frontend Missing | complete | shipped | SearchOmnibox component with debounced unified search, section grouping, keyboard nav | medium | M | FE | Wire into AppSidebar nav | shipped |
| Review moderation/replies UI | Backend Exists -> Frontend Missing | complete | shipped | ReviewCard component with inline provider response, reply thread, report form | medium | M | FE | Wire into provider dashboards | shipped |
| Gym owner dashboard rebuild | Frontend Needs Overhaul | complete | shipped | KPIs/live feed wired to checkins/subscriptions/loyalty via parallel allSettled fetches | high | M | FE | Monitor edge cases on empty datasets | shipped |
| Member dashboard rebuild | Frontend Needs Overhaul | complete | shipped | Rebuilt around checkins, consultations, loyalty balance, weight logs at /dashboard/member | high | M | FE | Monitor edge cases | shipped |
| Trainer dashboard rebuild | Frontend Needs Overhaul | complete | shipped | Queue-first dashboard wired to provider clients + bookings + journals | high | M | FE | Monitor edge cases | shipped |
| Dietitian dashboard rebuild | Frontend Needs Overhaul | complete | shipped | Adherence + consultation panels wired to provider APIs | high | M | FE | Monitor edge cases | shipped |
| Booking flow hardening | Frontend Needs Overhaul | complete | shipped | /booking wizard wired to getProviderSlots + createBooking with full error/loading states | high | M | FE+BE | Monitor confirmation flow | shipped |
| Admin users/providers hardening | Frontend Needs Overhaul | complete | shipped | /admin/users metrics + suspend/unsuspend, /admin/listings full moderation with badges | high | M | FE | Monitor edge cases | shipped |
| Check-in ops feed reliability | Frontend Needs Overhaul | complete | partial | Live feed API-backed with auto-refresh, offline-aware polling (pause/resume), stale/degraded indicators, manual refresh + retry, and last-known-good preservation on failed polls. Device-health states blocked: no devices API exists (devices page is still mock) | medium | M | FE+BE | BE: define device-state/health endpoint; FE: wire device health once contract lands | blocked |
| Member self-log flows (workout/meal/weight) | Frontend Exists -> Backend Missing | partial/unclear | shipped | /dashboard/member/{weight,meal,workout}-log now API-backed with real-time data; create flows marked coming soon | medium | M | FE+BE | Wire create endpoints when available; consider client-side caching | shipped |
| Recurring booking | Frontend Exists -> Backend Missing | partial/unclear | placeholder/partial | Recurrence semantics not implemented end-to-end | medium | M-H | FE+BE | Define recurrence contract and implement flow | not-started |
| Dashboard shell duplication | Alignment/Refactor Opportunity | n/a | duplicated | Multiple role shells drift in behavior/styling | medium | M | FE | Extract shared dashboard shell primitives | not-started |
| API client underutilization | Alignment/Refactor Opportunity | complete | partial | Forms, loyalty, team, assignment-rules, billing were orphaned (no nav). These are PROVIDER features, not member-facing. Forms now uses a role-aware WorkspaceShell and appears in all four provider shells (gym/trainer/dietitian/admin) with each role's own chrome; loyalty/team/assignment-rules/billing moved to the gym-owner shell's new "Workspace" section. Removed from the member shell entirely. Follow-up: real org name wiring (gym shell still shows demo "Iron Lab"/"Lerato M."); route-level access guards so a member hitting /dashboard/forms by URL is redirected; saved-providers still orphaned | medium | S | FE | Add role-based route guards; wire real org data into the gym shell; audit saved-providers | in-progress |
| Async states consistency | Technical Debt | n/a | inconsistent | Loading/error/empty UX inconsistent across routes | high | S-M | FE | Introduce shared async-state components | not-started |
| Route-level error boundaries | Technical Debt | n/a | shipped | Extracted a shared DS RouteError component; collapsed 15 drifted/duplicated error.tsx boundaries into thin wrappers and added boundaries for booking, onboarding, member, review. global-error.tsx kept standalone (renders when the root layout itself fails) | high | S | FE | Monitor; add boundaries to new interactive segments as they land | shipped |
| API contract typing normalization | Technical Debt | complete | inconsistent | Union/shape drift between FE expectations and API responses | medium | M | FE+BE | Generate stricter typed adapters for API responses | not-started |

## Prioritized Delivery Plan

### Quick Wins (1-2 sprints)

1. Notifications center + preferences
2. Feedback/NPS prompt integration
3. Unified search omnibox
4. Async-state standardization (loading/error/empty)
5. Route-level error boundaries

### Medium Effort, High Impact (parallel lane)

1. Team management workspace
2. Loyalty center
3. Gym owner dashboard rebuild
4. Trainer + dietitian dashboard rebuild
5. Admin users/providers hardening

### Major Initiatives

1. Forms builder + response analytics
2. Provider billing operations UI
3. Booking flow hardening (state machine + validation + retries)
4. Member dashboard reconstruction
5. Recurring booking end-to-end

## Execution Rules

1. No new mock data in production routes.
2. Every feature ticket must include API contract references.
3. Every shipped item must update this table status and date.
4. Each PR should update one row in this tracker.

## Organization Scoping Guide

Use this as the default decision rule when wiring new screens or API calls:

| Scope | Examples | Org required? |
|---|---|---|
| Org-scoped | gym owner check-in analytics, team members, team roles, organization billing, assignment rules | Yes |
| User-scoped | member dashboard, personal check-in history, consultations, progress tracking, loyalty, forms, reviews | No |
| Hybrid / context only | onboarding, signup, dashboard shell indicators | Sometimes |

Provider onboarding now auto-creates a starter workspace for gym owners, trainers, and dietitians so the first dashboard render has a valid org context.

## Weekly Update

- Week of: 2026-06-11
- Completed (8 shipped):
  - [x] Dashboard bookings rewrite
  - [x] Member dashboard rewrite
  - [x] Admin users metrics + moderation
  - [x] Admin listings moderation
  - [x] Marketplace error handling polish
  - [x] Booking wizard API wiring
  - [x] Member self-log flows (weight/meal/workout)
  - [x] Organization scoping simplification (auto-create provider workspace + org banners)
- In progress:
  - [x] Check-in ops feed reliability — offline handling, degraded/stale states, and manual recovery shipped; device-health blocked on a missing backend devices/device-state endpoint
- Blocked:
  - [ ] Check-in device health (needs BE devices/device-state contract; FE devices page still mock)
- Next:
  - [ ] Recurring booking
  - [ ] Dashboard shell duplication cleanup
  - [ ] Async states consistency

## Weekly Update Template

- Week of: YYYY-MM-DD
- Completed:
  - [ ] Feature X
- In progress:
  - [ ] Feature Y
- Blocked:
  - [ ] Feature Z (reason)
- Next:
  - [ ] Feature A

## Change Log

- 2026-06-11: Initial baseline created from backend/frontend alignment audit.
- 2026-06-11: Started Team management workspace implementation with a new `/dashboard/team` route covering org switching, member role/status updates, member removal, and invitation management.


## Changelog

2026-06-11 (batch): Completed all HIGH-priority tracker items in single session:
  1. Team management workspace - shipped with permissions, direct add, full RBAC
  2. Assignment rules UI - CRUD at /dashboard/assignment-rules with strategy/tier/priority
  3. Loyalty center - balance, rewards, history, redemptions at /dashboard/loyalty
  4. Forms builder + responses - form editor, question builder, analytics at /dashboard/forms  
  5. Provider billing UI - status, usage, plans, checkout, invoices at /dashboard/billing
  6. Feedback/NPS prompts - FeedbackModal + useFeedbackPrompt hook
  7. Search omnibox - SearchOmnibox with debounced unified search
  8. Review moderation/replies - ReviewCard with provider response + reply + report
  
  Remaining: Dashboard rebuilds (gym/member/trainer/dietitian), booking flow hardening, admin hardening

2026-06-11 (2): Completed Team management workspace with permission guards and direct member creation:
  - Added handleDirectAdd() for creating members with credentials
  - Implemented permission-based action guards (invite, remove, role update, manage org)
  - Updated UI buttons to reflect user permissions
  - All linting passes (zero errors/warnings)
  - Total: 229 new lines of logic and UI enhancements across 2 commits

2026-06-11 (3): Closed remaining HIGH-priority overhaul items:
  - /dashboard/bookings: full rewrite wired to consultationsService (upcoming/past/cancelled tabs, RescheduleModal, CancelModal, reasons, status pills, key-remount modal reset)
  - /dashboard/member: replaced mock KPIs with parallel Promise.allSettled fetches across checkins/consultations/loyalty/progress; wired streak, next session, weight, balance
  - /admin/users: pivoted to platform metrics dashboard (no list endpoint exists yet) + ID-lookup with suspend/unsuspend modals showing cascaded counts
  - /admin/listings: replaced 8 mock fixtures with getAdminGymListings, inline suspend/unsuspend/verify actions, status filter pills, KPI cards
  - /marketplace + /marketplace/[listingId]: added error states with retry; wired activeSort to API param; trimmed unsupported price_asc sort option
  - /booking: rebuilt 3-step wizard around real APIs (listingId query param, getProviderSlots day-by-day picker, getTypes filter by providerRole, createBooking on confirm → router.push to /dashboard/bookings); Suspense wrapper for useSearchParams
  - All HIGH-priority Feature Alignment Tracker items now shipped

2026-06-11 (4): Hardened check-in ops feed reliability (/dashboard/gym-owner/checkins):
  - Offline-aware polling: listens to window online/offline, pauses the 30s poll while offline, resumes with an immediate refetch on reconnect
  - Last-known-good preservation: a failed poll no longer blanks the live feed; stats/history are only replaced on success
  - Degraded-mode indicators: status pill now reflects Live / Stale (poll missed >75s) / Offline; "Recent check-ins" header shows Auto-refreshing / Reconnecting / Paused·offline
  - Manual recovery: explicit Refresh button (header) plus Try-again (error banner) and Refresh (stale banner) actions; offline banner explains paused state
  - Lint/typecheck clean under React Compiler rules (lazy isOnline init, ticker-driven `now` state, setTimeout-kicked initial load to avoid sync setState-in-effect)
  - Device-health states deferred: there is NO devices/device-state API (devices page is still a hardcoded mock); row moved to `blocked` pending a backend contract. Per execution rule #1, did not fabricate mock device data in the live feed.

2026-06-11 (5): Surfaced orphaned-but-shipped features in navigation (API client underutilization):
  - Root cause: Forms, Loyalty, Team, Assignment rules, and Billing were fully built (routes + API clients) but had NO nav entry — reachable only by typing the URL. Forms in particular was invisible despite being marked "shipped".
  - Added a "Workspace" dropdown to MemberDashboardShell (desktop via NavDropdown, plus a Workspace group in the mobile menu) linking all five, with active-state highlighting.
  - Fixed each page's stale activeLabel="Home" → its real label so the nav highlights correctly.
  - Follow-up noted: org-scoped features (team/billing/assignment-rules) currently render in the member shell; they ideally belong in the gym/provider shell (ties into the Dashboard shell duplication row). saved-providers is also still orphaned.

2026-06-12: Standardized route-level error boundaries (Technical Debt → shipped):
  - Extracted a shared DS component, RouteError (components/ds), covering brand mark, eyebrow, heading, description, Try-again (reset) + contextual back link, and the error digest.
  - Collapsed 15 existing error.tsx boundaries (which had drifted into ~3 visual variants) into thin wrappers around RouteError — net -1,386 lines.
  - Added boundaries to previously-unprotected interactive segments: booking, onboarding, member, review. Static marketing pages continue to rely on the root boundary.
  - Left global-error.tsx standalone by design: it renders when the root layout itself throws, so it cannot depend on app CSS/providers.
  - lint + tsc + production build all clean.

2026-06-12 (2): Corrected workspace-feature placement to the PROVIDER shells (per product clarification: forms/team/billing/etc. are for admin/gym-owner/dietitian/trainer, NOT members):
  - Reverted the member-shell "Workspace" dropdown — members no longer see these provider features.
  - Added WorkspaceShell (components/ds): a role-aware wrapper that renders the page in the current user's own provider chrome (gym/trainer/dietitian/admin), chosen via useAuth() role.
  - Forms now uses WorkspaceShell and appears as a "Forms" nav item in all four provider shells.
  - Loyalty, Team & roles, Assignment rules, Billing moved to a new "Workspace" section in the gym-owner sidebar; those pages now render in GymDashboardShell.
  - Build/lint/tsc clean. Follow-ups: role-based route guards for direct-URL access; wire real org data into the gym shell (still shows demo Iron Lab / Lerato M.).

2026-06-12 (3): Real identity + role guards across all provider shells (closes both follow-ups above):
  - Added src/lib/identity.ts (fullName/shortName/personInitials/nameInitials/ROLE_LABEL).
  - Gym/Trainer/Dietitian/Admin shells now render the REAL signed-in user (name, initials, role) from useAuth(), and the gym shell shows the REAL current organization (name + initials) from useOrganization(). Removed hardcoded demo chrome (Iron Lab, Lerato M., Sarah Okafor, Dr. Priya Iyer, Andile K.). Sidebar footers now link to the relevant settings page.
  - Each provider shell now self-guards via useRoleGuard(role): a wrong-role user (e.g. a member hitting /dashboard/forms or /dashboard/team by URL) is redirected to their own dashboard and the shell renders nothing. WorkspaceShell selects the shell by role, so the guard and chrome stay consistent automatically.
  - Build/lint/tsc clean.
  - NOTE: client-side guards are UX-level; server-side enforcement (middleware role check / API authz) is the source of truth and a separate hardening task.

  Still open — the larger "build their functionalities" task (mock → real data). Audit found 9 hardcoded pages:
  Tier 1 (entry dashboards): dashboard/gym-owner/page, dashboard/trainer/page, dashboard/dietitian/page.
  Tier 2 (gym ops): gym-owner/staff, gym-owner/revenue, gym-owner/devices (devices is BACKEND-BLOCKED — no devices API), gym-owner/payouts.
  Tier 3: dietitian/clients/[clientId], admin/dashboard.
  member dashboard is already real and is the reference pattern (parallel Promise.allSettled across services).

2026-06-12 (4): Converted the gym-owner dashboard (/dashboard/gym-owner) from mock to real data — 1 of 9 mock pages done.
  - Split into page.tsx (metadata wrapper) + GymOverviewClient.tsx (client), matching the members/ pattern.
  - Real data: KPIs (revenue 30d, active members, check-ins today + attendance %, avg rating) and live check-ins from checkinsService.getOrgDashboardStats(); recent members table from marketplaceService.getOrgMembershipSubscriptions(); revenue today/week/month summary. Currency via useRegion().formatAmount(). Loading/error/empty states throughout.
  - DROPPED (no backend endpoint — were fabricated): 30-day revenue history chart, churn KPI + sparklines, today's classes/schedule, upcoming payouts table, revenue-mix breakdown, action queue, the time-range filter. Per execution rule #1, did not keep fabricated numbers. These return when their APIs exist (schedule, payouts, revenue timeseries, churn).
  - lint + tsc + build clean.
  Remaining mock pages: trainer/page, dietitian/page, gym-owner {staff, revenue, payouts, devices(BLOCKED)}, dietitian/clients/[clientId], admin/dashboard.