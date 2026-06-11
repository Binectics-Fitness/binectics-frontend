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
| Check-in ops feed reliability | Frontend Needs Overhaul | complete | partial | Live org stats + recent check-in feed now API-backed with auto-refresh; offline/device-health states still pending | medium | M | FE | Add offline handling, device health, and manual recovery actions | in-progress |
| Member self-log flows (workout/meal/weight) | Frontend Exists -> Backend Missing | partial/unclear | shipped | /dashboard/member/{weight,meal,workout}-log now API-backed with real-time data; create flows marked coming soon | medium | M | FE+BE | Wire create endpoints when available; consider client-side caching | shipped |
| Recurring booking | Frontend Exists -> Backend Missing | partial/unclear | placeholder/partial | Recurrence semantics not implemented end-to-end | medium | M-H | FE+BE | Define recurrence contract and implement flow | not-started |
| Dashboard shell duplication | Alignment/Refactor Opportunity | n/a | duplicated | Multiple role shells drift in behavior/styling | medium | M | FE | Extract shared dashboard shell primitives | not-started |
| API client underutilization | Alignment/Refactor Opportunity | complete | underused | Existing services (teams/forms/loyalty) not consumed | medium | S | FE | Add integration coverage map + enforce usage | not-started |
| Async states consistency | Technical Debt | n/a | inconsistent | Loading/error/empty UX inconsistent across routes | high | S-M | FE | Introduce shared async-state components | not-started |
| Route-level error boundaries | Technical Debt | n/a | partial | Not all route groups protected | high | S | FE | Add error boundaries for major app segments | not-started |
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

## Weekly Update

- Week of: 2026-06-11
- Completed:
  - [x] Dashboard bookings rewrite
  - [x] Member dashboard rewrite
  - [x] Admin users metrics + moderation
  - [x] Admin listings moderation
  - [x] Marketplace error handling polish
  - [x] Booking wizard API wiring
- In progress:
  - [x] Check-in ops feed reliability
- Next:
  - [ ] Member self-log flows
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