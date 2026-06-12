# 04 — Backend Services

## Overview

Service implementation for the endpoints declared in §02, on top of the schema in §03. Net-new modules go here (messaging, search, geo, aggregates) and the existing modules get extended.

## Scope

- New NestJS modules this phase: **Search**, **Geo**, **MemberHome**, **ProviderDashboard**.
- Extensions to existing modules: **Auth**, **Notifications**, **Checkins**, **Marketplace**, **Utility**.

Messaging and realtime are deferred to phase 2. This phase only preserves a frontend-safe Coming Soon behavior.

## Detailed task breakdown

### EPIC S — Messaging module (G4–G7)
| ID | Task | Complexity |
|---|---|---|
| S1 | Mark messaging backend endpoints (G4–G7) as phase 2 backlog items | S |
| S2 | Ensure no active backend route advertises messaging APIs in this phase | S |
| S3 | Keep room in schema plan for future conversations/messages collections without implementing services | S |

### EPIC T — Search module (G2)
| ID | Task | Complexity |
|---|---|---|
| T1 | Create `src/search/` module: controller, service, aggregator | M |
| T2 | Implement `GET /search?q=&scope=&limit=` where scope ∈ `all\|listings\|bookings\|clients\|plans` | M |
| T3 | Fan out (parallel) to: `MarketplaceService.searchListings(q)`, `ConsultationsService.searchBookings(q, userId)`, `ProgressService.searchClients(q, providerId)`, plan search sources | M |
| T4 | Merge + rank: prioritise exact matches, then by domain weighting (listings > bookings > clients) | M |
| T5 | Response: `{ groups: [{type, items: [{id, label, sublabel, url, icon}], more_url?}] }` — already what `CommandBar` expects | S |
| T6 | Cache per `(user_id, q)` for 30s in Redis | S |
| T7 | Throttle 60/min/user | S |
| T8 | Authorisation: filter results to what the user can see (role-aware) | M |

### EPIC U — Geo module (G8)
| ID | Task | Complexity |
|---|---|---|
| U1 | Create `src/geo/` module | S |
| U2 | Implement `GET /geo/resolve` — extract IP from `X-Forwarded-For` (trust Netlify/Cloudflare); look up against external provider; cache (EPIC Q) | M |
| U3 | Response: `{ip_country, ip_region, ip_city, suggested_currency, suggested_locale, source: 'cache'\|'maxmind'\|'cloudflare'\|'fallback'}` | S |
| U4 | Fallback chain: cache → MaxMind → `Accept-Language` → `US/USD/en-US` | S |
| U5 | Plug into `/auth/me` (optional convenience): if user has no `country_code`, return suggested values | S |
| U6 | Privacy: hash IPs in cache key; never log raw IP | M — security |

### EPIC V — Member Home aggregate (G1, H5)
| ID | Task | Complexity |
|---|---|---|
| V1 | Create `src/member-home/` module composing `AuthService`, `CheckinsService`, `MarketplaceService`, `ConsultationsService` | M |
| V2 | Implement `GET /member/home`: returns `{user, todays_checkin, week_grid, current_streak, active_subscriptions[], upcoming_bookings[limit=2], quick_actions[]}` | M |
| V3 | Add `getCurrentWeekGrid(userId, tz)` to CheckinsService (used by both /member/home and H5) | M |
| V4 | Cache per user for 30s with key invalidation on new check-in / new subscription / new booking | M |
| V5 | Verify p95 < 300ms with realistic data | M |

### EPIC W — Provider Dashboard aggregate (G10)
| ID | Task | Complexity |
|---|---|---|
| W1 | Create `src/provider-dashboard/` module | M |
| W2 | Implement `GET /provider/dashboard-summary?org_id=` returning `{todays_revenue, active_members_count, upcoming_sessions[limit=3], recent_journal_entries[limit=5], pending_requests_count, alerts[]}` | M |
| W3 | Permission: caller must be staff of the org with `VIEW_MEMBERS` permission (or be the solo provider) | M |
| W4 | Reuse existing services — do not query DB directly from the new module | S |
| W5 | Cache per org for 60s | S |

### EPIC X — Auth & user flag tracking (H1)
| ID | Task | Complexity |
|---|---|---|
| X1 | Extend `User` entity with K1–K5 fields | S |
| X2 | Update `AuthService.sanitizeUser()` (or equivalent serializer) to include the new fields in every `/auth/*` response | M |
| X3 | Add `POST /onboarding/complete` (or update `/onboarding/dismiss`) to flip `is_onboarding_complete` on the User document, not just the checklist | M |
| X4 | When admin issues a password reset, set `must_change_password=true`; clear it on next successful password change | S |
| X5 | Update `JwtStrategy.validate` to refresh the flag values into the request user so middleware can read them without a DB round-trip | M |

### EPIC Y — Notifications enhancements (G3, H3, H4)
| ID | Task | Complexity |
|---|---|---|
| Y1 | Add `NOTIFICATION_TYPE_TO_CATEGORY` map; populate `category` on write | S |
| Y2 | Modify `GET /notifications` to accept `?category=` filter and return `category` on every item | S |
| Y3 | Modify `GET /notifications/unread-count` to return `{count, by_category}` | S |
| Y4 | Add `POST /notifications/preferences` schema for per-category toggles (email/push/in-app per category) | M |
| Y5 | Extend SSE stream event payload with `category` field | S |

### EPIC Z — Marketplace search param (H8)
| ID | Task | Complexity |
|---|---|---|
| Z1 | Implement `q` query param on `GET /marketplace/listings` calling Atlas Search or `$text` | M |
| Z2 | Combine `q` with existing filters (country/city/specialties/verified) | M |
| Z3 | Sort: relevance when `q` present, existing sort otherwise | S |
| Z4 | Update cache key to include `q` | S |

### EPIC AA — Check-ins enhancements (H5, G9)
| ID | Task | Complexity |
|---|---|---|
| AA1 | Implement `getCurrentWeekGrid(userId, tz)` — Mon-Sun boolean array in user's timezone | M |
| AA2 | Implement `current_streak` and `longest_streak` calculations | M |
| AA3 | Extend `/checkins/dashboard-stats` response with the new fields | S |
| AA4 | (Optional) Expose `/checkins/weekly-grid?week_of=YYYY-MM-DD` if member-home aggregate isn't built | S |

### EPIC BB — Utility enrichment (H6, H7)
| ID | Task | Complexity |
|---|---|---|
| BB1 | Update `UtilityService.getCountries()` to include `currency`, `default_locale`, `dial_code` | S |
| BB2 | Update `getPlatformConfig()` to include full `supported_regions` per H7 | S |
| BB3 | Add `Cache-Control: public, max-age=86400` (countries change rarely) | S |

## Dependencies

- **Blocks:** §05 (frontend wiring), §07 (e2e tests).
- **Blocked by:** §03 (schemas + indexes), §06 (geo provider + search infra).

## Impacted components

- `binectics-api/src/search/**` (new)
- `binectics-api/src/geo/**` (new)
- `binectics-api/src/member-home/**` (new)
- `binectics-api/src/provider-dashboard/**` (new)
- `binectics-api/src/auth/**` (X1–X5)
- `binectics-api/src/notifications/**` (Y1–Y5)
- `binectics-api/src/marketplace/**` (Z1–Z4)
- `binectics-api/src/checkins/**` (AA1–AA4)
- `binectics-api/src/utility/**` (BB1–BB3)
- `binectics-api/src/app.module.ts` (register new modules)
- Redis (caching for V4, W5, T6)

## Assumptions

- Existing services can be composed without circular imports (verify by sketching imports for V and W early).
- Aggregate endpoints don't need to be transactional — eventual consistency on cached components is acceptable.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Search authz filtering is leaky | M | H | Test each scope with multi-tenant fixtures; default-deny |
| Aggregate endpoints become god-services | M | M | Strict rule: compose existing services, never reach into repos |
| Caching staleness on member home (e.g., just did a check-in but card still shows ✗) | M | M | Invalidate cache on relevant write events via internal event bus |
| Geo lookup latency on cold cache | M | M | Provider call timeout 250ms; fall back to defaults |
| Adding `category` derivation regresses notification write throughput | L | L | Map lookup is O(1) |

## Migration & rollout

- Ship every new module disabled behind a feature flag.
- For modified existing endpoints (X, Y, Z, AA, BB): additive only; gate any *behavior* change on a flag.
- Roll out: internal dogfood → 10% members → 100% (see [08](../08-Deployment-and-Rollout/README.md)).

## Acceptance criteria

- [ ] Every controller method in §02 is implemented with unit tests (≥80% line coverage on new code).
- [ ] Composition rule honored: new aggregate modules import existing services, never repositories directly (verified by lint or dep-graph audit).
- [ ] P95 latency budget held: `/member/home` < 300ms, `/provider/dashboard-summary` < 400ms, `/search` < 500ms, `/geo/resolve` < 100ms (cache hit) / 350ms (miss).
- [ ] Authz tests demonstrate multi-tenant isolation for search and aggregate endpoints.
- [ ] Feature flags wired and toggleable without redeploy.
