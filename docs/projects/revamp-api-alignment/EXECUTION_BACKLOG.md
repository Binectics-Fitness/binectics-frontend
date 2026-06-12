# Revamp API Alignment — Ticket Backlog

Source: [README](./README.md) execution checklist and locked D1-D7 decisions.

## How to use

- Create one tracker issue per ticket.
- Keep IDs stable (`RA-001` etc.) for cross-linking PRs.
- Each ticket includes dependencies; do not start blocked work early.

## Priority lanes

- `P0` foundation and contract blockers
- `P1` core API and frontend value delivery
- `P2` quality, rollout, and hardening

---

## P0 — Foundations

### RA-001 — Export OpenAPI schema in API CI
- Area: Architecture (01)
- Repo: `binectics-api`
- Estimate: M
- Owner role: Backend platform
- Dependencies: none
- Tasks:
  - Add `schema:export` script to produce versioned `openapi.json`.
  - Add CI drift check to fail when controllers change without schema update.
- Acceptance criteria:
  - CI fails on schema drift.
  - `openapi.json` is reproducible across runs.

### RA-002 — Generate frontend API types from schema
- Area: Architecture (01)
- Repo: `binectics-frontend`
- Estimate: M
- Owner role: Frontend platform
- Dependencies: RA-001
- Tasks:
  - Add `openapi-typescript` generation to `src/lib/api/generated/schema.ts`.
  - Add `api:sync` script and CI check.
- Acceptance criteria:
  - Generated types compile with app typecheck.
  - CI fails when generated file is stale.

### RA-003 — Enum convergence policy and lint guard
- Area: Architecture (01)
- Repo: both
- Estimate: M
- Owner role: FE+BE platform
- Dependencies: RA-002
- Tasks:
  - Publish enum usage rules in project docs.
  - Add frontend lint guard to discourage string-literal domain constants.
- Acceptance criteria:
  - Enum policy documented and linked from planning docs.
  - Lint rule active with no blocking false positives.

### RA-004 — User schema additions for onboarding/password flags
- Area: DB/Migrations (03)
- Repo: `binectics-api`
- Estimate: M
- Owner role: Backend
- Dependencies: none
- Tasks:
  - Add `is_onboarding_complete`, `must_change_password`, split name fields, verify profile fields.
  - Add idempotent backfill scripts.
- Acceptance criteria:
  - New fields present and served by API serializers.
  - Backfills run safely in dry-run and apply modes.

### RA-005 — Notification category schema + index + backfill
- Area: DB/Migrations (03)
- Repo: `binectics-api`
- Estimate: M
- Owner role: Backend
- Dependencies: none
- Tasks:
  - Add `category` on notification records.
  - Create read indexes and execute batched backfill.
- Acceptance criteria:
  - Existing notifications categorized.
  - Unread-by-category query uses index (no collection scan).

### RA-006 — Search indexes for listings and aggregate read paths
- Area: DB/Migrations (03)
- Repo: `binectics-api`
- Estimate: M
- Owner role: Backend/Infra
- Dependencies: none
- Tasks:
  - Add Mongo `$text` index on listing search fields.
  - Add required aggregate endpoint read indexes.
- Acceptance criteria:
  - Search endpoint p95 meets target under staging load.
  - Explain plans show index usage.

---

## P1 — API contracts and services

### RA-007 — Auth payload additive fields
- Area: API Changes (02)
- Repo: `binectics-api`
- Estimate: M
- Owner role: Backend auth
- Dependencies: RA-004
- Tasks:
  - Extend auth response user shape with onboarding/password/name/profile fields.
- Acceptance criteria:
  - Login/register/refresh/profile return additive fields with no regressions.

### RA-008 — `/geo/resolve` contract + implementation
- Area: API + Integrations (02,04,06)
- Repo: `binectics-api`
- Estimate: M
- Owner role: Backend + Infra
- Dependencies: RA-006
- Tasks:
  - Implement MaxMind lookup.
  - Enforce fallback chain: `Accept-Language` then `US/USD/en-US`.
- Acceptance criteria:
  - Endpoint returns deterministic source metadata.
  - Fallback behavior covered in tests.

### RA-009 — Global search endpoint v1 scopes
- Area: API + Services (02,04)
- Repo: `binectics-api`
- Estimate: M
- Owner role: Backend
- Dependencies: RA-006
- Tasks:
  - Implement `/search` with scopes: listings, bookings, clients, plans.
  - Implement ranking and auth filtering.
- Acceptance criteria:
  - Scope filtering works and returns only authorized records.
  - p95 within agreed budget.

### RA-010 — Notifications grouped feed and unread-by-category
- Area: API + Services (02,04)
- Repo: `binectics-api`
- Estimate: M
- Owner role: Backend
- Dependencies: RA-005
- Tasks:
  - Expose grouped/filtered notifications.
  - Return unread-by-category payload.
- Acceptance criteria:
  - Drawer can render groups without local reclassification.

### RA-011 — Member home aggregate endpoint
- Area: API + Services (02,04)
- Repo: `binectics-api`
- Estimate: M
- Owner role: Backend
- Dependencies: RA-004, RA-006
- Tasks:
  - Compose check-in grid, streaks, active subscriptions, upcoming bookings.
  - Add cache and invalidation hooks.
- Acceptance criteria:
  - Endpoint powers member home without hardcoded data.

### RA-012 — Provider dashboard aggregate endpoint
- Area: API + Services (02,04)
- Repo: `binectics-api`
- Estimate: M
- Owner role: Backend
- Dependencies: RA-006
- Tasks:
  - Implement org-aware summary endpoint with role-safe access.
- Acceptance criteria:
  - Trainer/gym/dietitian dashboards consume one aggregate payload.

### RA-013 — Marketplace listing detail aggregate endpoint
- Area: API + Services (02,04)
- Repo: `binectics-api`
- Estimate: M
- Owner role: Backend
- Dependencies: RA-006
- Tasks:
  - Introduce listing detail aggregate suited for revamp detail pages.
- Acceptance criteria:
  - Listing detail screen can render from aggregate payload only.

### RA-014 — Bookings dashboard aggregate endpoint
- Area: API + Services (02,04)
- Repo: `binectics-api`
- Estimate: M
- Owner role: Backend
- Dependencies: RA-006
- Tasks:
  - Add booking timeline + counters aggregate.
- Acceptance criteria:
  - Bookings dashboard calls one endpoint for summary + timeline.

### RA-015 — Admin overview aggregate endpoint
- Area: API + Services (02,04)
- Repo: `binectics-api`
- Estimate: M
- Owner role: Backend
- Dependencies: RA-006
- Tasks:
  - Add consolidated admin summary metrics endpoint.
- Acceptance criteria:
  - Admin overview page removes multi-call summary loading.

### RA-016 — Explicitly defer messaging API to phase 2
- Area: API Changes (02)
- Repo: `binectics-api`
- Estimate: S
- Owner role: Backend lead
- Dependencies: none
- Tasks:
  - Keep messaging endpoints out of v1 contract.
  - Record phase-2 placeholder in docs.
- Acceptance criteria:
  - No messaging endpoint appears in v1 schema.

---

## P1 — Frontend wiring

### RA-017 — Notifications drawer API wiring
- Area: Frontend (05)
- Repo: `binectics-frontend`
- Estimate: M
- Owner role: Frontend
- Dependencies: RA-002, RA-010
- Tasks:
  - Remove demo notifications data path.
  - Render grouped feed + unread-by-category + mark-read actions.
- Acceptance criteria:
  - Drawer fully API-driven in staging.

### RA-018 — Member home API migration
- Area: Frontend (05)
- Repo: `binectics-frontend`
- Estimate: M
- Owner role: Frontend
- Dependencies: RA-011
- Tasks:
  - Replace hardcoded week grid and stitched calls with aggregate payload.
- Acceptance criteria:
  - No static tracker data remains on member home.

### RA-019 — Provider dashboards API migration
- Area: Frontend (05)
- Repo: `binectics-frontend`
- Estimate: M
- Owner role: Frontend
- Dependencies: RA-012
- Tasks:
  - Wire trainer/gym/dietitian dashboards to provider aggregate.
- Acceptance criteria:
  - Dashboard prototype placeholders removed from shipped surfaces.

### RA-020 — CommandBar global search wiring
- Area: Frontend (05)
- Repo: `binectics-frontend`
- Estimate: M
- Owner role: Frontend
- Dependencies: RA-009
- Tasks:
  - Hook search UI with debounce and grouped results.
  - Enforce v1 scope set.
- Acceptance criteria:
  - CommandBar returns results for listings/bookings/clients/plans.

### RA-021 — Messaging coming-soon UX
- Area: Frontend (05)
- Repo: `binectics-frontend`
- Estimate: S
- Owner role: Frontend
- Dependencies: RA-016
- Tasks:
  - Keep nav entry.
  - Route to explicit coming-soon page with product copy.
  - Remove mock chat behavior.
- Acceptance criteria:
  - No broken messaging route.
  - No mock chat interactions in production paths.

### RA-022 — Onboarding gate cleanup to API flag
- Area: Frontend (05)
- Repo: `binectics-frontend`
- Estimate: M
- Owner role: Frontend
- Dependencies: RA-007
- Tasks:
  - Remove localStorage/cookie completion workarounds.
  - Use auth payload flags.
- Acceptance criteria:
  - Login/onboarding redirects are stable and deterministic.

### RA-023 — Region pricing refactor
- Area: Frontend (05)
- Repo: `binectics-frontend`
- Estimate: M
- Owner role: Frontend
- Dependencies: RA-008
- Tasks:
  - Use `/geo/resolve` output + utility config.
  - Remove static region lookup maps from runtime path.
- Acceptance criteria:
  - Pricing reflects geo output or configured fallback chain.

---

## P2 — Integrations, QA, and rollout

### RA-024 — MaxMind operationalization
- Area: Integrations (06)
- Repo: `binectics-api`
- Estimate: S
- Owner role: Infra
- Dependencies: RA-008
- Tasks:
  - Add DB update schedule and health checks.
- Acceptance criteria:
  - Geo resolver health is visible in readiness checks.

### RA-025 — Aggregate/search observability and alerts
- Area: Integrations (06)
- Repo: both
- Estimate: M
- Owner role: Infra + Backend
- Dependencies: RA-009..RA-015
- Tasks:
  - Add endpoint p95 dashboards and alert thresholds.
- Acceptance criteria:
  - Alerts fire correctly on synthetic threshold breach.

### RA-026 — Contract test suite for v1 endpoints
- Area: Testing (07)
- Repo: both
- Estimate: M
- Owner role: QA + Platform
- Dependencies: RA-002, RA-007..RA-015
- Tasks:
  - Validate API responses against generated schema in CI.
- Acceptance criteria:
  - Contract tests block incompatible response changes.

### RA-027 — E2E coverage for revamp critical flows
- Area: Testing (07)
- Repo: `binectics-frontend`
- Estimate: M
- Owner role: QA + Frontend
- Dependencies: RA-017..RA-023
- Tasks:
  - Cover onboarding, member home, provider dashboards, search, notifications, geo behavior.
- Acceptance criteria:
  - Staging E2E suite passes on all critical paths.

### RA-028 — Performance validation against budgets
- Area: Testing (07)
- Repo: both
- Estimate: S
- Owner role: QA + Backend
- Dependencies: RA-009..RA-015
- Tasks:
  - Run load/perf checks and capture p95 against agreed targets.
- Acceptance criteria:
  - All in-scope endpoints meet budget or have documented remediation.

### RA-029 — Feature flag wiring and staged rollout
- Area: Rollout (08)
- Repo: both
- Estimate: M
- Owner role: DevOps + Platform
- Dependencies: RA-017..RA-028
- Tasks:
  - Enable per-domain flags.
  - Execute internal → beta → GA progression.
- Acceptance criteria:
  - Rollout completed with monitored gates and no critical regressions.

### RA-030 — Rollback drill and runbook signoff
- Area: Rollout (08)
- Repo: both
- Estimate: S
- Owner role: DevOps + QA
- Dependencies: RA-029
- Tasks:
  - Perform staging rollback simulation for one API and one frontend flag domain.
- Acceptance criteria:
  - Rollback checklist validated and linked in runbooks.

---

## Parallel execution map

- Parallel lane A: RA-001, RA-004, RA-005, RA-006
- Parallel lane B (after RA-001): RA-002, RA-003
- Parallel lane C (after RA-006): RA-008, RA-009, RA-011, RA-012, RA-013, RA-014, RA-015
- Parallel lane D (after API contracts): RA-017 through RA-023
- Parallel lane E (quality + rollout): RA-024 through RA-030

## Minimum launch slice (if you need to reduce scope quickly)

- Required: RA-001..RA-012, RA-017..RA-023, RA-026..RA-029
- Defer-able while preserving strategy: RA-013, RA-014, RA-015 (secondary aggregates)
