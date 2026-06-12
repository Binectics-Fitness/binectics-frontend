# 02 — API Changes

## Overview

The concrete endpoint and DTO deltas needed to back the revamp design system. This folder is the API repo's contract list. Implementation lives in §04 (services) and §03 (database). Wiring lives in §05.

## Scope

1. New endpoints (§3.1 of the alignment doc).
2. Modified response shapes on existing endpoints (§3.2).
3. Enum and DTO drift resolution (§3.3).

## Decision lock-in (from §09)

- Messaging endpoints are deferred this phase.
- Global search ships in v1 for listings, bookings, clients, and plans.
- Search implementation is Mongo `$text` only (English-first weighting).
- Geo provider is MaxMind local DB with fallback `Accept-Language` then `US/USD/en-US`.
- Contract alignment uses OpenAPI-generated frontend types.

## Detailed task breakdown

### EPIC G — New endpoints
| ID | Endpoint | Method | Complexity | Consumer |
|---|---|---|---|---|
| G1 | `/member/home` | GET | M | Member home page aggregate |
| G2 | `/search?q=&scope=&limit=` | GET | M | CommandBar global search |
| G3 | `/notifications` with `group_by=category` (or new `/notifications/grouped`) | GET | S | NotificationsDrawer |
| G4 | `/messages/conversations` | GET, POST | L | Deferred to phase 2 |
| G5 | `/messages/conversations/:id/messages` | GET, POST | L | Deferred to phase 2 |
| G6 | `/messages/conversations/:id/read` | PATCH | S | Deferred to phase 2 |
| G7 | `/messages/stream` (SSE) or `/ws/messages` (gateway) | GET | M | Deferred to phase 2 |
| G8 | `/geo/resolve` | GET | M | Region pricing, country detection |
| G9 | `/checkins/weekly-grid?week_of=` | GET | S | Member home week tracker (alternative: enrich G11) |
| G10 | `/provider/dashboard-summary?org_id=` | GET | M | Trainer/gym/dietitian dashboards |

Each endpoint deliverable includes: NestJS controller method, DTOs (request + response), Swagger decorators, unit test, Postman/Bruno example, doc update under `binectics-api/docs/<domain>/`.

### EPIC H — Modified responses on existing endpoints
| ID | Endpoint | Change | Complexity |
|---|---|---|---|
| H1 | `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh`, `POST /auth/verify-otp`, `PATCH /auth/profile` | Embedded `user` object gains `is_onboarding_complete`, `must_change_password`, `first_name`, `last_name`, `profile_picture`, `country_code` | M |
| H2 | `GET /marketplace/featured` | Each `FeaturedListingItem` gains `profile_image`, `headline`, `top_plan {name, price, currency, interval}`, `rating`, `review_count`, `city`, `country_code` (verify all already present; backfill any missing) | S |
| H3 | `GET /notifications` (list + stream) | Every `NotificationItem` gains `category: 'booking' \| 'payment' \| 'mention' \| 'system'` derived from `type` | S |
| H4 | `GET /notifications/unread-count` | Returns `{count, by_category: {booking, payment, mention, system}}` | S |
| H5 | `GET /checkins/dashboard-stats` | Adds `current_week_grid: boolean[7]` (Mon-Sun, member tz) and `current_streak: number`, `longest_streak: number` | S |
| H6 | `GET /utility/countries` | Each country gains `currency: string`, `default_locale: string`, `dial_code: string` (some already there — verify) | S |
| H7 | `GET /utility/platform-config` | `supported_regions` exposes payment methods + VAT applicability (verify already done; deprecate frontend `MARKET_PRICES` static map) | S |
| H8 | `GET /marketplace/listings` | New `q` full-text query param (Mongo `$text`, English-first weighting) | M |
| H9 | `GET /consultations/my-bookings` | Add `?upcoming_limit=N` for member-home use | S |
| H10 | `GET /marketplace/my-subscriptions` | Add `?active_only=true` | S |

### EPIC I — Enum and DTO alignment
| ID | Drift | Fix | Complexity |
|---|---|---|---|
| I1 | Frontend `UserRole {USER, TRAINER}` vs API `UserRoleEnum {FITNESS_MEMBER, PERSONAL_TRAINER}` | Adopt API names on frontend (regenerate from schema), keep `FrontendRole` alias in API for display strings only | M |
| I2 | Frontend `VerificationStatus {PENDING, VERIFIED, REJECTED}` vs API `VerificationBadge {NONE, VERIFIED, PREMIUM_VERIFIED, FEATURED}` | Add `VerificationStatus` enum to API as separate concept; keep `VerificationBadge` for the visual badge | S |
| I3 | Frontend missing `STAFF_CLIENT_ASSIGNED, LOYALTY_POINTS_EARNED, LOYALTY_REWARD_REDEEMED` in `NotificationType` | Codegen will pull them once F1 lands; add icons + labels in `src/lib/constants/notifications.ts` | S |
| I4 | Frontend `PaymentGateway {STRIPE, FLUTTERWAVE, PAYSTACK}` vs API `PaymentMethod` (9 values) | Adopt API `PaymentMethod` everywhere admin "mark paid" surfaces are used | S |
| I5 | Account-type casing (frontend lowercase, API uppercase) | API accepts both on input via `@Transform`; output always uppercase | S |
| I6 | `MembershipSubscriptionStatus` casing | Same as I5 | S |
| I7 | `AccountType` enum used in DTOs vs `UserRoleEnum` in entity | Pick one, alias the other; document in ADR | M |

### EPIC J — Endpoints to deprecate or remove (housekeeping)
| ID | Endpoint | Action |
|---|---|---|
| J1 | Any duplicated review endpoints under `/marketplace/:id/replies` and `/reviews/:id/replies` | Pick one; deprecate the other with `Sunset` header |
| J2 | `GET /debug-sentry` | Restrict to non-prod or behind a feature flag |

## Dependencies

- **Blocks:** §04 (services that implement these endpoints), §05 (frontend wiring), §07 (contract tests).
- **Blocked by:** §01 (Swagger conventions, error envelope), §03 (schema fields for H1/H3/H5).

## Impacted components

- `binectics-api/src/**/*.controller.ts` and matching DTOs.
- `binectics-api/src/main.ts` (no global change expected).
- `binectics-api/docs/<domain>/` (every new endpoint needs a doc page).
- `binectics-frontend/src/lib/api/**` (regenerated types + service wrappers).

## Assumptions

- Mongo `$text` index will be used on listing fields (`name`, `description`, `specialties`, `city`).
- MaxMind GeoLite2 is the selected geo provider for `/geo/resolve` (see [06](../06-Integrations/README.md)).
- Aggregate endpoints can tolerate ≤300ms p95 (otherwise we move to per-resource caching).

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Modifying `/auth/*` user payload breaks legacy mobile clients | M | H | Additive fields only; never remove. Document in changelog |
| Adding `category` field to notifications requires backfill on millions of rows | L | M | Compute on read or backfill in batches (see [03](../03-Database-and-Migrations/README.md)) |
| `/search` becomes a hotspot | M | M | Cache + rate-limit; default to a low result limit |
| Aggregate endpoints duplicate logic across services | H | M | Build a `MemberHomeService`/`ProviderDashboardService` that composes existing services rather than reaching into repos directly |

## Migration & rollout

- Every new endpoint ships behind a feature flag at the controller level (`@FeatureFlag('messaging.v1')`).
- Every modified response is **strictly additive** — no field removed, no type change.
- See [08](../08-Deployment-and-Rollout/README.md) for staged rollout plan.

## Acceptance criteria

- [ ] Every endpoint in EPIC G returns a 200 with realistic data in staging, with Swagger docs and at least one unit + one e2e test.
- [ ] Every endpoint in EPIC H continues to return its original fields plus the new ones (regression test confirms).
- [ ] All enum drift in EPIC I is resolved either by frontend regeneration or by an explicit ADR documenting the deliberate divergence.
- [ ] `openapi.json` diff cleanly reflects all of EPIC G + H + I changes.
- [ ] No endpoint added without its `binectics-api/docs/<domain>/<endpoint>.md` page.
