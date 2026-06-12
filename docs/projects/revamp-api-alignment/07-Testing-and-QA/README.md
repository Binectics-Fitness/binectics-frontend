# 07 — Testing & QA

## Overview

Testing strategy that validates the new contracts, services, and UI wiring, and prevents the documented drift from happening again.

## Scope

- Unit tests for new services (§04) — table-stakes.
- **Contract tests** between API responses and frontend types.
- **E2E** for the high-impact flows (auth, onboarding, member home, dashboards, messaging, search, payments).
- **Performance budgets** for aggregate endpoints.
- **Visual regression** for the DS-driven surfaces.
- **Authorization tests** for multi-tenant isolation (messaging, search, provider dashboard).

## Detailed task breakdown

### EPIC VV — Contract tests (consumes §01 E)
| ID | Task | Complexity |
|---|---|---|
| VV1 | Decide: Pact vs schema-driven (recommend schema-driven via `zod` validators generated from OpenAPI, or Ajv) | M |
| VV2 | Frontend: for each generated type, snapshot the JSON schema; CI fails when the recorded response differs from the schema | M |
| VV3 | API: every controller method has at least one integration test that validates its actual response against the documented OpenAPI schema | L |
| VV4 | One contract test per modified endpoint in §02 EPIC H to prove additive fields are present | M |

### EPIC WW — Unit tests for new services (§04)
| ID | Task | Complexity |
|---|---|---|
| WW1 | Messaging service: conversation find-or-create, send, read, authz | M |
| WW2 | Search service: filtering by scope, authz fan-out, ranking | M |
| WW3 | Geo service: cache hit/miss, fallback chain | M |
| WW4 | Member home aggregate: composes correctly, cache invalidation on events | M |
| WW5 | Provider dashboard aggregate: org permission gating | M |
| WW6 | Notification category derivation (Y1) | S |
| WW7 | Check-in week grid + streak math across timezones and DST boundaries | M |
| WW8 | Coverage target: ≥80% on new code | — |

### EPIC XX — Authorization tests
| ID | Task | Complexity |
|---|---|---|
| XX1 | Messaging: User A cannot read User B↔C conversation | M |
| XX2 | Search: results filtered to user's permitted scopes | M |
| XX3 | Provider dashboard: non-member of org receives 403 | M |
| XX4 | Aggregate endpoints: regression test against the existing per-resource guards | M |
| XX5 | Onboarding `is_onboarding_complete` cannot be toggled by another user | S |

### EPIC YY — Frontend integration tests (Vitest + RTL)
| ID | Task | Complexity |
|---|---|---|
| YY1 | NotificationsDrawer renders categories + unread counts from mocked API responses (schema-validated) | M |
| YY2 | Member home renders week grid + subscriptions + upcoming bookings | M |
| YY3 | CommandBar debounces, navigates result groups, handles empty/error | M |
| YY4 | Messaging conversation list + thread with optimistic send | M |
| YY5 | Onboarding flow respects `is_onboarding_complete` from auth payload (no longer reads localStorage) | M |
| YY6 | Region pricing renders from `/geo/resolve` + `/utility/platform-config` | M |

### EPIC ZZ — E2E (Playwright, existing config under `binectics-frontend/e2e/`)
| ID | Task | Complexity |
|---|---|---|
| ZZ1 | Auth: register → OTP → login → must-change-password (admin reset path) | M |
| ZZ2 | Onboarding: complete wizard → server records completion → returning login skips wizard | M |
| ZZ3 | Member home: login as fitness member → see real data → check in → grid updates | M |
| ZZ4 | Marketplace browse → subscribe → see in `/member/my-subscriptions` | L |
| ZZ5 | Booking: create → reschedule → cancel → complete | L |
| ZZ6 | Messaging (if shipped): send message → second user receives via realtime | M |
| ZZ7 | CommandBar (if shipped): type → see grouped results → navigate | M |
| ZZ8 | Provider dashboards: login as trainer / gym-owner / dietitian → see summary with real data | M |
| ZZ9 | Region detection: from two IPs (US, NG) → currency differs | M |
| ZZ10 | Payments (test mode): subscription checkout for each enabled gateway | L |

### EPIC AAA — Performance budgets
| ID | Task | Complexity |
|---|---|---|
| AAA1 | Add `k6` or `artillery` script for new aggregate endpoints | M |
| AAA2 | Budget: see §04 acceptance criteria; alert on regression | S |
| AAA3 | Frontend: Lighthouse on member home + landing — TBT < 200ms, LCP < 2.5s on 4G | M |

### EPIC BBB — Visual regression
| ID | Task | Complexity |
|---|---|---|
| BBB1 | Snapshot key DS surfaces (NotificationsDrawer states, CommandBar, member home, all three provider dashboards) | M |
| BBB2 | Tool: Playwright `toHaveScreenshot()` or Chromatic | M |
| BBB3 | Cover mobile + tablet + desktop breakpoints | M |
| BBB4 | Snapshot baseline frozen on `revamp` HEAD before rewiring; diffs reviewed in PRs | S |

### EPIC CCC — Migration tests
| ID | Task | Complexity |
|---|---|---|
| CCC1 | Each backfill script (§03 R1–R4) has a dry-run mode + a unit test against a sample dataset | M |
| CCC2 | E2E for the onboarding-flag backfill: pre-cutoff users land directly on home, not on wizard | M |

### EPIC DDD — Accessibility regression
| ID | Task | Complexity |
|---|---|---|
| DDD1 | axe-core run on each E2E target page; PR fails on new violations | M |
| DDD2 | Keyboard-only nav on CommandBar, NotificationsDrawer, messaging, modals | M |

## Dependencies

- **Blocks:** §08 (no rollout without green tests).
- **Blocked by:** §02 (contracts exist), §04 (services to test), §05 (frontend to test).

## Impacted components

- `binectics-api/test/**` (unit + e2e)
- `binectics-frontend/vitest.config.ts`, `vitest.setup.ts`, new test files alongside components
- `binectics-frontend/e2e/**` (existing Playwright suite)
- CI configuration in both repos
- Chromatic / Sentry / Datadog dashboards

## Assumptions

- Staging environment exists with realistic seed data (verify; if not, add seeding to §08).
- Playwright already wired in frontend (it is — `e2e/playwright.config.ts`).
- CI parallelism budget allows the new e2e jobs (~+10 min walltime).

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Flaky e2e on SSE/socket | H | M | Retry once, then quarantine; isolate networking tests |
| Visual regression noise from font loading / animations | H | M | Disable animations + wait for fonts before snapshot |
| Contract tests too strict — every additive field breaks tests | M | M | Schema validation in "additive-OK" mode (extra fields allowed) |
| E2E payment tests cost real money | L | H | Use sandbox keys only; CI guard on env |
| Auth tests leak real user data | M | H | Dedicated test users per CI run; cleanup hook |

## Migration & rollout

- All test suites run on every PR to `main` (api) and `revamp` (frontend).
- Visual regression baselines updated only by explicit PR review.
- Performance suite runs nightly on staging.
- Synthetic monitors stay on in prod after rollout.

## Acceptance criteria

- [ ] Every new endpoint in §02 has at least one contract test and one integration test.
- [ ] Every new service in §04 has unit tests ≥80% line coverage.
- [ ] E2E suite is green against staging before any production rollout step.
- [ ] Performance budget tests are checked in and pass on staging seed data.
- [ ] Visual regression baselines exist for the 8 highest-traffic revamp surfaces.
- [ ] axe-core passes on every E2E target page (or violations explicitly waivered with justification).
