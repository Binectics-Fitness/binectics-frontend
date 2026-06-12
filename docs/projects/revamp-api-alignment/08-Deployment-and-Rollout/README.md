# 08 — Deployment & Rollout

## Overview

How we ship the alignment work safely. The default posture is **additive, flag-gated, staged**.

## Scope

- Feature flag conventions (both repos).
- Backward-compatibility rules.
- Staged rollout cohorts and ramp.
- Cache invalidation and warmup.
- Rollback plan per workstream.
- Communication plan.

## Detailed task breakdown

### EPIC EEE — Feature flag platform
| ID | Task | Complexity |
|---|---|---|
| EEE1 | Pick approach: env-var flags (cheapest), Unleash, LaunchDarkly, or DB-backed `platform_config.feature_flags` (already partially exists) | M |
| EEE2 | Recommend: extend `admin/currencies` pattern to a `/admin/feature-flags` collection so flags can be toggled per env + per cohort without redeploy | M |
| EEE3 | Add `@FeatureFlag('flag.name')` decorator (NestJS) that 404s the route if disabled | M |
| EEE4 | Frontend: `useFeatureFlag('flag.name')` hook reading from `/utility/platform-config.feature_flags` | M |
| EEE5 | Document required flags: `messaging.coming_soon`, `search.v1`, `member_home.aggregate`, `provider_dashboard.aggregate`, `notifications.grouped`, `marketplace_detail.aggregate`, `bookings_dashboard.aggregate`, `admin_overview.aggregate`, `onboarding.api_flag`, `regions.server_resolved` | S |

### EPIC FFF — Backward-compatibility checklist
| ID | Rule |
|---|---|
| FFF1 | Every API change is additive — no field removed, no enum value removed, no type widened in a breaking way for 1 release minimum. |
| FFF2 | Deprecations get a `Deprecation: true` + `Sunset: <date>` header for 30 days before removal. |
| FFF3 | Frontend renames (USER → FITNESS_MEMBER) ship with one-release aliases. |
| FFF4 | DB backfills run before code that depends on the new field is enabled. |
| FFF5 | When in doubt, ship a new endpoint at a sibling path rather than mutate semantics of an existing one. |

### EPIC GGG — Cohorts & ramp
| ID | Cohort | Notes |
|---|---|---|
| GGG1 | **Internal** — staff accounts only (`is_internal=true` flag on User, or @binectics.* email match) | Day 0 |
| GGG2 | **Beta** — 5% of fitness members + 10% of providers, opted in via setting | +3 days if green |
| GGG3 | **GA** — 100% | +7 days if green |
| GGG4 | Rollback path: flip flag off — no redeploy required | |

### EPIC HHH — Cache invalidation
| ID | Surface | Trigger |
|---|---|---|
| HHH1 | Member home cache | invalidate on check-in scan, subscription create/cancel, booking create/cancel |
| HHH2 | Provider dashboard cache | invalidate on new request, new check-in, new journal entry |
| HHH3 | Search cache | TTL only (30s), no event invalidation |
| HHH4 | Featured listings cache | TTL 300s + manual purge on admin badge change |
| HHH5 | Countries cache | TTL 86400s; admin currency update purges via existing pattern |

### EPIC III — Deployment order
| Step | Action | Workstream |
|---|---|---|
| 1 | Provision infra (Redis if new, geo provider, search index) | §06 |
| 2 | Ship DB schema additions + run backfills (off-peak) | §03 |
| 3 | Ship API code (services + endpoints) — **all flags OFF** | §04 |
| 4 | Smoke test endpoints in staging via Postman + synthetic monitors | §07 |
| 5 | Enable flags internally; run E2E suite against staging | §07 |
| 6 | Ship frontend with `NEXT_PUBLIC_USE_REVAMP_API_*` flags wired to platform config | §05 |
| 7 | Enable flags for internal cohort in prod | §08 |
| 8 | Beta cohort → monitor 72h → GA | §08 |
| 9 | Clean up: delete dead code paths behind retired flags after 30 days | §08 |

### EPIC JJJ — Observability gates
| ID | Gate |
|---|---|
| JJJ1 | Per-step rollout gate: error rate < 1% over last 1h |
| JJJ2 | p95 within budget for 4h |
| JJJ3 | No new Sentry issues with rate > 0.5/min |
| JJJ4 | Cache hit rate > 70% on aggregate endpoints |

### EPIC KKK — Rollback playbook
| Failure | Action |
|---|---|
| New endpoint 5xx spike | Flip feature flag OFF; route 404s |
| Modified response missing field on legacy client | Disable the modified-response flag (response reverts to original shape) |
| Backfill corrupts data | Restore from latest backup; replay scripts in dry-run mode |
| Onboarding flag mismatch causes login redirects loop | Disable `onboarding.api_flag`; frontend reverts to legacy localStorage gate (kept for one release) |

### EPIC LLL — Communication
| Audience | Channel | When |
|---|---|---|
| Engineering | Slack `#binectics-eng` + ADR PR | Per workstream |
| Support / Ops | Runbook update under `binectics-api/docs/platform/runbooks/` | Before GA |
| Members | In-app announcement (use existing `/admin/announcements/broadcast`) | After GA for search + aggregate improvements |
| Providers | Email via mailer module | After GA |

## Dependencies

- **Blocks:** nothing — this is the last workstream.
- **Blocked by:** all others — esp. §07 (must be green) and §06 (infra must be ready).

## Impacted components

- `binectics-api/src/admin/feature-flags/**` (new) or env-var infra
- `binectics-api/infra/main.tf` (any new infra resources)
- Netlify deploy config
- CI pipelines in both repos
- On-call rota documentation
- `binectics-api/docs/platform/runbooks/` (rollback + verification)

## Assumptions

- Staging and prod environments are functionally equivalent.
- CI has the credentials to publish OpenAPI artifacts consumed by the frontend build.
- Synthetic monitors can be added without licensing constraints.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Feature flag service becomes a single point of failure | L | H | Fail-open or fail-closed deliberately per flag; cache flag values in-process for 60s |
| Flag sprawl — flags never removed | H | M | 30-day cleanup task on each flag's introduction PR |
| Backfill runs in prod with wrong env var | M | H | Scripts require `--env=prod` and `--confirm` flags |
| Customer-visible churn between cohorts (some users see new UI, some don't) | M | M | Frontend flag-driven, deterministic per user-id hash |
| Rollback restores old shape but frontend has already cached new shape in service worker | L | M | Cache-bust on deploy + version key in API response |

## Migration & rollout

The entire content of EPIC III is the migration plan. Key rule: **DB → API → Frontend**, never reverse.

## Acceptance criteria

- [ ] Every new endpoint and modified response is gated behind a feature flag at first prod ship.
- [ ] Runbook exists for each failure mode in EPIC KKK and is linked from the on-call doc.
- [ ] Synthetic monitors green for 72h before GA.
- [ ] Post-GA cleanup ticket exists for each flag with a 30-day due date.
- [ ] Rollback verified end-to-end at least once in staging before each GA step.
