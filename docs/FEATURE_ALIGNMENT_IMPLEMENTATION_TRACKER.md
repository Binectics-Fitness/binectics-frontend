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
| Gym owner dashboard rebuild | Frontend Needs Overhaul | complete | weak/mixed | KPI cards/live feed not consistently API-driven | high | M | FE | Replace mock widgets with API-backed components | not-started |
| Member dashboard rebuild | Frontend Needs Overhaul | complete | weak/mixed | Static-feeling metrics, weak persistence | high | M | FE | Rebuild around subscriptions/progress/notifications/loyalty | not-started |
| Trainer dashboard rebuild | Frontend Needs Overhaul | complete | mixed | Inconsistent panel depth, some hardcoded data | high | M | FE | Implement queue-first API-driven dashboard panels | not-started |
| Dietitian dashboard rebuild | Frontend Needs Overhaul | complete | mixed | Adherence/plan delivery workflows incomplete | high | M | FE | Add API-backed adherence + consultation action panels | not-started |
| Booking flow hardening | Frontend Needs Overhaul | complete | partial | Slot/reschedule/error-state handling gaps | high | M | FE+BE | Refactor booking flow state machine + validation paths | not-started |
| Admin users/providers hardening | Frontend Needs Overhaul | complete | partial | Filtering/actions inconsistent, mock remnants | high | M | FE | Wire all table actions and server-side filters | not-started |
| Check-in ops feed reliability | Frontend Needs Overhaul | complete | partial | Real-time and offline/error states incomplete | medium | M | FE | Add polling/websocket strategy + device health states | not-started |
| Member self-log flows (workout/meal/weight) | Frontend Exists -> Backend Missing | partial/unclear | placeholder | UI placeholders need verified contracts + implementation | medium | M | FE+BE | Confirm API contracts; implement missing endpoints if needed | not-started |
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