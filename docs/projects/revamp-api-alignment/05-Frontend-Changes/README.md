# 05 — Frontend Changes

## Overview

Wire the revamp UI to the real API surface defined in §02 and the services in §04. Delete mocks, regenerate types, and converge enums.

## Scope

- Replace all hardcoded demo data with API calls.
- Generate types from the API schema and gradually retire hand-maintained DTOs.
- Refactor the region/pricing layer to consume server data.
- Net-new UI work: search wiring, onboarding-flag refactor, and messaging Coming Soon UX.

## Detailed task breakdown

### EPIC CC — Codegen + enum convergence (consumes §01 EPIC A & B)
| ID | Task | Complexity |
|---|---|---|
| CC1 | Install `openapi-typescript`; add `npm run api:sync` script that fetches `openapi.json` from API artifact | S |
| CC2 | Generate `src/lib/api/generated/schema.ts`; commit | S |
| CC3 | Replace `src/lib/enums/index.ts` exports with re-exports from generated schema | M |
| CC4 | Migrate one domain at a time (start with notifications, then auth, then marketplace…) | L |
| CC5 | Delete `src/lib/api/*/types.ts` once parity proven | M |
| CC6 | Add CI check that fails if `schema.ts` drifts from upstream | S |

### EPIC DD — Notifications drawer wiring (consumes G3, H3, H4, Y5)
| ID | Task | Complexity | File |
|---|---|---|---|
| DD1 | Replace `DEMO_NOTIFICATIONS[]` with `notificationsService.getNotifications({category})` calls | S | `src/lib/constants/notifications.ts`, `src/components/ds/NotificationsDrawer.tsx` |
| DD2 | Render unread badge per category from `/notifications/unread-count` | S | `src/components/ds/NotificationsDrawer.tsx` |
| DD3 | Subscribe to SSE stream for live updates | M | new `src/hooks/useNotificationStream.ts` |
| DD4 | Wire mark-as-read / mark-all-read actions | S | |
| DD5 | Wire notification preferences page to `/notifications/preferences` | M | `src/app/member/settings/notifications/page.tsx` (verify route exists) |
| DD6 | Delete `DEMO_NOTIFICATIONS` export entirely; add ESLint forbid-import rule | S | |

### EPIC EE — Member home rebuild (consumes G1, H5)
| ID | Task | Complexity | File |
|---|---|---|---|
| EE1 | Replace 4 separate service calls + hardcoded `WEEK[]` with one call to `/member/home` (or compose `/checkins/dashboard-stats` + `/marketplace/my-subscriptions?active_only=true` + `/consultations/my-bookings?upcoming_limit=2`) | M | `src/app/member/page.tsx` |
| EE2 | Render `current_week_grid` from response; remove static Mon-Sun array | S | |
| EE3 | Show real subscription cards (active only); link to detail | S | |
| EE4 | Show next 1-2 upcoming bookings; empty state | S | |
| EE5 | Loading + error states using existing DS skeleton patterns | S | |

### EPIC FF — Messaging UI wiring (consumes G4–G7, S7)
| ID | Task | Complexity | File |
|---|---|---|---|
| FF1 | Replace dashboard messages screen with explicit Coming Soon state | S | `src/app/dashboard/messages/page.tsx` |
| FF2 | Keep messaging menu entry, but route all entry points to the same Coming Soon page | S | nav + command targets |
| FF3 | Remove prototype/mock conversation logic and dead message hooks | S | messaging-related files |
| FF4 | Add product copy clarifying planned phase 2 scope | S | Coming Soon page |

### EPIC GG — CommandBar global search (consumes G2)
| ID | Task | Complexity | File |
|---|---|---|---|
| GG1 | Add `searchService.global({q, scope, limit})` | S | new `src/lib/api/search.ts` |
| GG2 | Wire CommandBar input → debounced search (300ms) | M | `src/components/ds/CommandBar.tsx` |
| GG3 | Render result groups with existing DS row components | M | |
| GG4 | Keyboard nav across groups | M | |
| GG5 | Recents (localStorage); clear-recents action | S | |
| GG6 | Constrain v1 scopes to listings, bookings, clients, and plans | S | service + UI filtering |

### EPIC HH — Onboarding flag cleanup (consumes H1, X3)
| ID | Task | Complexity | File |
|---|---|---|---|
| HH1 | Replace `localStorage` onboarding flag with `user.is_onboarding_complete` from auth payload | M | `src/app/onboarding/page.tsx`, `src/middleware.ts` (if applicable) |
| HH2 | Remove the "triple-layer completion guard" added in commits `72f8cd3`, `1e6b207`, `2df43ac`, `fdbffac` | M | revert workaround logic |
| HH3 | Re-enable onboarding gate in login flow (was removed in `cc04541`) — now safe because API tracks completion | M | login redirect logic |
| HH4 | Add `must_change_password` redirect handler (sends user to `/change-password` before any other route) | M | `src/middleware.ts` |
| HH5 | Remove `onboarding_complete` cookie set/clear logic | S | |

### EPIC II — Geo / region refactor (consumes G8, H6, H7)
| ID | Task | Complexity | File |
|---|---|---|---|
| II1 | Replace `useRegionPrice` reliance on Netlify `x-country` header with `/geo/resolve` call | M | `src/hooks/useRegionPrice.ts` |
| II2 | Delete `MARKET_PRICES` and `COUNTRY_TO_REGION` from `src/lib/constants/regions.ts` (data now comes from `/utility/platform-config` + `/utility/countries`) | M | |
| II3 | Keep `DEFAULT_REGION` constant only as a last-resort fallback | S | |
| II4 | Update `src/components/PricingSection.tsx` to consume server-resolved currency | S | |

### EPIC JJ — Dashboard prototype wiring (consumes G10, W)
| ID | Task | Complexity | File |
|---|---|---|---|
| JJ1 | Replace hardcoded trainer dashboard with `/provider/dashboard-summary?org_id=` data | M | `src/app/dashboard/trainer/page.tsx` |
| JJ2 | Same for gym-owner dashboard | M | `src/app/dashboard/gym-owner/page.tsx` |
| JJ3 | Same for dietitian dashboard | M | `src/app/dashboard/dietitian/page.tsx` |
| JJ4 | Remove `// Hardcoded to match …-prototype.html` comments | S | |
| JJ5 | Add `// PROTOTYPE: not wired` tag (per §01 F4) on anything still stubbed | S | |

### EPIC KK — Other mock cleanup & scope decisions
| ID | Task | Complexity | File |
|---|---|---|---|
| KK1 | Trainer tax / payouts page — **decision (§09)**: delete page + remove from nav, OR scope a separate module | M | `src/app/dashboard/trainer/tax/page.tsx` |
| KK2 | Health-metrics HR scatter — **decision (§09)**: drop HR, keep only weight + activity from real `/progress` data | M | `src/app/dashboard/member/health-metrics/page.tsx` |
| KK3 | Trainer single-session detail wiring to `/consultations/bookings/:id` | S | `src/app/dashboard/trainer/sessions/[sessionId]/page.tsx` |
| KK4 | Gym-owner members page to `/marketplace/organizations/:id/members` + `/checkins/organizations/:id` | S | `src/app/dashboard/gym-owner/members/page.tsx` |
| KK5 | Audit grep for `// Hardcoded`, `// TODO`, `// PROTOTYPE`, `/* Hardcoded` and tag every result | S | repo-wide |

### EPIC LL — Account-type / role rename
| ID | Task | Complexity |
|---|---|---|
| LL1 | Replace all `UserRole.USER` → `UserRole.FITNESS_MEMBER` (or alias `USER` to it) | M |
| LL2 | Replace `TRAINER` → `PERSONAL_TRAINER` similarly | M |
| LL3 | Update SearchableSelect role options + form value mappings | M |
| LL4 | Verify routing: members still land at `/member/*`; providers at `/dashboard/<role>/*` | M |

## Dependencies

- **Blocks:** §07 (E2E once wired), §08 (rollout once tests pass).
- **Blocked by:** §02 (endpoints exist), §04 (services return real data), §09 (scope: tax / HR scatter).

## Impacted components

- `binectics-frontend/src/components/ds/{NotificationsDrawer,CommandBar}.tsx`
- `binectics-frontend/src/app/member/page.tsx`, `src/app/onboarding/page.tsx`
- `binectics-frontend/src/app/dashboard/{trainer,gym-owner,dietitian,messages,member}/**`
- `binectics-frontend/src/lib/api/**` (new services + generated types)
- `binectics-frontend/src/lib/constants/{notifications,regions}.ts` (largely deleted)
- `binectics-frontend/src/middleware.ts`
- `binectics-frontend/src/hooks/{useRegionPrice,useNotificationStream}.ts`
- `binectics-frontend/eslint.config.mjs`

## Assumptions

- Existing `apiClient` (`src/lib/api/client.ts`) refresh / 401 retry behaviour stays — just types around it become generated.
- The DS primitive set (cards, lists, skeletons) is sufficient for new states; no DS additions required.
- Members tolerate a 30s cache window on `/member/home` (invalidated on writes — see §04 V4).

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Removing onboarding workarounds re-breaks if API rollout slips | H | H | Gate behind feature flag on the frontend (`NEXT_PUBLIC_USE_API_ONBOARDING_FLAG`); fall back to old localStorage path when off |
| Regen replaces hand-typed DTOs and surfaces dormant bugs | H | M | Domain-by-domain rollout; keep type aliases for one release |
| Removing region constants breaks SSR pricing during the rollout window | M | M | Ship `/geo/resolve` first; keep `DEFAULT_REGION` fallback |
| Enum rename (USER → FITNESS_MEMBER) cascades through 100s of files | H | M | Single mass codemod commit; back-compat alias for one sprint |

## Migration & rollout

- Land §02 / §04 first; the frontend changes here ship behind `NEXT_PUBLIC_USE_REVAMP_API_*` flags toggled per-domain.
- Domain-by-domain (notifications → onboarding → member home → dashboards → search → messaging-coming-soon) so a regression is bounded.
- Visual regression run on each merge (see [07](../07-Testing-and-QA/README.md)).

## Acceptance criteria

- [ ] `grep -rE "DEMO_|// Hardcoded|/\\* Hardcoded" src/` returns zero hits in shipped code (allowed only in `src/__fixtures__/`).
- [ ] `localStorage` is no longer used for onboarding completion state.
- [ ] `src/lib/constants/regions.ts` exports only `DEFAULT_REGION` (and types) — no data tables.
- [ ] Every domain that has a generated schema entry imports its types from `src/lib/api/generated/schema.ts`.
- [ ] Notifications drawer, member home, all three provider dashboards, and the onboarding flow pass E2E with the real API in staging.
- [ ] Messaging is replaced with an explicit Coming Soon page while preserving menu visibility.
- [ ] CommandBar global search works against `/search` for listings, bookings, clients, and plans.
