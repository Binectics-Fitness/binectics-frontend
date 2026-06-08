# Revamp ↔ API Alignment

> Source of truth for the API surface changes required to fully back the `revamp` branch design system.
> Compares **binectics-frontend@revamp** against **binectics-api@main**.
>
> Last reviewed: 2026-06-07

---

## 1. TL;DR

The revamp is **~85% UI/UX** — the API already covers most domains. The remaining 15% of work falls into four buckets:

| # | Bucket | Effort | Blocking |
|---|--------|--------|----------|
| 1 | **Aggregate endpoints** (member-home, dashboard summaries) — currently require 3-5 round trips or are mocked | M | Member experience |
| 2 | **Global search / command bar** — no API exists | M | Power-user nav |
| 3 | **Messaging** — full UI exists, zero API | L | Provider ↔ client comms |
| 4 | **Enum + DTO drift** — frontend invented role / status names that don't match API | S | Type safety, runtime bugs |

Everything else is **wiring work**: replace hardcoded constants with existing API calls.

---

## 2. What the design system changed (and why the API has to respond)

The revamp introduced surfaces that don't map 1:1 onto the old "page = one resource" pattern:

| New surface | New data shape it assumes |
|---|---|
| **Member home** (`src/app/member/page.tsx`) | Single "dashboard payload": greeting, today's check-in, weekly streak grid, top 1-2 upcoming bookings, active subscriptions, quick actions |
| **CommandBar global search** (`src/components/ds/CommandBar.tsx`) | One endpoint returning mixed results (listings + bookings + clients + messages) |
| **NotificationsDrawer** (`src/components/ds/NotificationsDrawer.tsx`) | Grouped/categorised feed (bookings, payments, mentions, system) + unread badges per category |
| **Onboarding 4-step wizard** (`src/app/onboarding/page.tsx`) | Per-user `is_onboarding_complete` flag readable on every auth response (currently must call `/onboarding/status` separately) |
| **Region-based pricing** (`src/hooks/useRegionPrice.ts`) | Currency + locale resolved server-side from IP / country |
| **Bento landing rows** (`src/app/page.tsx`) | `/marketplace/featured` shaped per role with cheapest plan inline (already exists, verify shape) |
| **Dashboard prototypes** (trainer / gym-owner / dietitian) | Real bindings for what is currently HTML-prototype-matched static data |
| **Health metrics charts** (`src/app/dashboard/member/health-metrics/page.tsx`) | Time-series weight + activity from `/progress` (already there — needs wiring) |
| **Messaging** (`src/app/dashboard/messages/page.tsx`) | New conversations + messages API (no equivalent on backend) |

---

## 3. API surface areas that need to change

### 3.1 NEW endpoints required

| Endpoint | Why | Consumed by |
|---|---|---|
| `GET /member/home` | Single aggregate payload to replace 4-5 separate calls + hardcoded `WEEK[]` grid | [src/app/member/page.tsx](../../src/app/member/page.tsx) |
| `GET /search?q=...&scope=all` | Mixed-result global search across listings, bookings, clients, plans, help docs | [src/components/ds/CommandBar.tsx](../../src/components/ds/CommandBar.tsx) |
| `GET /notifications/grouped` (or query param `group_by=category`) | Returns `{bookings:[], payments:[], mentions:[], system:[], unread_by_category:{...}}` | [src/components/ds/NotificationsDrawer.tsx](../../src/components/ds/NotificationsDrawer.tsx) |
| `GET /messages/conversations`, `GET /messages/conversations/:id/messages`, `POST /messages/conversations/:id/messages`, `PATCH /messages/conversations/:id/read` | Provider ↔ client direct messaging — **entire module missing** | [src/app/dashboard/messages/page.tsx](../../src/app/dashboard/messages/page.tsx) |
| `GET /geo/resolve` (or include in `/auth/me`) | Server-side country/currency resolution; today the frontend depends on a Netlify `x-country` header which doesn't exist outside Netlify | [src/hooks/useRegionPrice.ts](../../src/hooks/useRegionPrice.ts) |
| `GET /checkins/weekly-grid?week_of=YYYY-MM-DD` | 7-element boolean array shape the member-home tracker actually renders. Today only `/checkins/my-history?period=week` exists (flat list — frontend has to bucket) | [src/app/member/page.tsx](../../src/app/member/page.tsx) |
| `GET /provider/dashboard-summary?org_id=...` | Single payload for trainer/gym-owner/dietitian dashboards: today's revenue, active members, upcoming sessions, recent journal entries | [src/app/dashboard/trainer/page.tsx](../../src/app/dashboard/trainer/page.tsx), [.../gym-owner/page.tsx](../../src/app/dashboard/gym-owner/page.tsx), [.../dietitian/page.tsx](../../src/app/dashboard/dietitian/page.tsx) |

### 3.2 MODIFIED responses required

| Endpoint | Change | Reason |
|---|---|---|
| `POST /auth/login`, `POST /auth/refresh`, `PATCH /auth/profile` | Include `is_onboarding_complete: boolean`, `must_change_password: boolean`, `profile_picture: string \| null`, `first_name`, `last_name` on the embedded `user` object | Onboarding gate ([src/app/onboarding/page.tsx](../../src/app/onboarding/page.tsx)) currently relies on a `localStorage` flag because the API doesn't expose this; recent commits (`cc04541`, `5f46745`) had to **strip the onboarding gate from login** because "API cannot track completion" |
| `GET /marketplace/featured` | Confirm each `FeaturedListingItem` includes `profile_image`, `headline`, `top_plan: {name, price, currency, interval}`, `rating`, `review_count`, `city`, `country_code` | Bento grid + landing testimonials assume this shape |
| `GET /notifications` | Add `category: 'booking'|'payment'|'mention'|'system'` (derived from `type`) on every item to avoid per-type switch in the drawer | NotificationsDrawer groups by category |
| `GET /checkins/dashboard-stats` | Include `current_week_grid: boolean[7]` (Mon-Sun) and `current_streak: number` | Removes hardcoded `WEEK[]` in member home |
| `GET /utility/countries` | Include `currency` and `default_locale` per country so frontend stops shipping its own `COUNTRY_TO_REGION` map | [src/lib/constants/regions.ts](../../src/lib/constants/regions.ts) duplicates this data |
| `GET /marketplace/listings` | Add `q` full-text param (currently filters only by `country/city/specialties/verified`) | CommandBar search of listings |

### 3.3 ENUM / DTO alignment (drift between repos)

The frontend invented values that don't match the API. Pick one source of truth (recommend: API, then mirror in `src/lib/enums/*`).

| Concept | Frontend (`src/lib/enums`) | API (`src/core/enums`) | Recommendation |
|---|---|---|---|
| User role | `USER, GYM_OWNER, TRAINER, DIETITIAN, ADMIN` | `FITNESS_MEMBER, GYM_OWNER, DIETITIAN, PERSONAL_TRAINER` (+ `ADMIN` separately) | **Align on API.** Rename `USER→FITNESS_MEMBER`, `TRAINER→PERSONAL_TRAINER` on the frontend, or expose a frontend-friendly alias via `FrontendRole` (already exists in API: `USER, GYM_OWNER, TRAINER, DIETITIAN`). Currently every login response has to be re-mapped. |
| Verification | `PENDING, VERIFIED, REJECTED` | `VerificationBadge: NONE, VERIFIED, PREMIUM_VERIFIED, FEATURED` | Two different concepts collided — one is workflow status, one is badge tier. Frontend needs both. **Add `VerificationStatus` enum to API**; keep `VerificationBadge` separate. |
| Notification type | Missing on frontend: `STAFF_CLIENT_ASSIGNED, LOYALTY_POINTS_EARNED, LOYALTY_REWARD_REDEEMED` | API has all three | Add to frontend enum + add icons/labels in [src/lib/constants/notifications.ts](../../src/lib/constants/notifications.ts) |
| Payment method | Frontend `PaymentGateway: STRIPE, FLUTTERWAVE, PAYSTACK` only | API `PaymentMethod: CASH, BANK_TRANSFER, CARD, PAYSTACK, STRIPE, FLUTTERWAVE, WALLET, FREE, OTHER` | Frontend needs the broader set for the "mark paid" admin flow (`/marketplace/organizations/:orgId/subscriptions/:subId/mark-paid`) |
| Account type casing | Frontend lowercase: `gym_owner, personal_trainer, dietitian, fitness_member` | API uppercase: `GYM_OWNER, PERSONAL_TRAINER, DIETITIAN, FITNESS_MEMBER` | Standardise on API uppercase, accept either on input |
| `MembershipSubscriptionStatus` | Frontend lowercase strings (`"pending_payment"`) | API uppercase enum (`PENDING_PAYMENT`) | Same casing fix |

---

## 4. Per-screen map: what the design needs vs. what exists

| Revamp screen | Data needs | API status | Action |
|---|---|---|---|
| `app/page.tsx` (landing, bento grid) | featured listings per role, region price detection | `/marketplace/featured` ✅, region detection ❌ | Add server-side geo resolution |
| `app/onboarding/page.tsx` (4-step wizard) | role-specific fields, completion flag on user | `/onboarding/status` ✅, completion flag on User ❌ | Add `is_onboarding_complete` to User entity & all `/auth/*` responses |
| `app/(auth)/login`, `/register` | rememberMe, first-login redirect, OTP, must-change-password | All exist ✅ except `must_change_password` flag | Add field; remove client-only workaround in commit `28f7d41` |
| `app/member/page.tsx` (member home) | greeting, week grid, subscriptions, upcoming bookings | 4 separate endpoints, week grid hardcoded | Build `/member/home` aggregate OR add `current_week_grid` to `/checkins/dashboard-stats` |
| `app/member/settings/*` | profile, notif prefs, orgs, billing | All exist ✅ | **Wire only** |
| `components/ds/CommandBar.tsx` | global search, recents | Navigation/action commands are local constants ✅ (fine); **search ❌** | Add `/search` endpoint OR document that search is per-section |
| `components/ds/NotificationsDrawer.tsx` | grouped feed, unread counts, prefs | `/notifications` ✅ flat, grouping ❌ | Add `category` field; drop `DEMO_NOTIFICATIONS` from [src/lib/constants/notifications.ts](../../src/lib/constants/notifications.ts) |
| `app/dashboard/messages/page.tsx` | conversations, threads, send, read receipts | **Nothing** ❌ | Net-new module: `messages.controller.ts` in API |
| `app/dashboard/trainer/page.tsx` and gym-owner / dietitian dashboards | revenue today, sessions today, active clients, journal feed | Composable from `/progress` + `/consultations` + `/checkins` ✅ but slow | Add `/provider/dashboard-summary?org_id=` aggregate |
| `app/dashboard/trainer/sessions/[sessionId]/page.tsx` | session detail | `/consultations/bookings/:id` ✅ | **Wire only** |
| `app/dashboard/trainer/tax/page.tsx` | payouts, tax forms | **Nothing** ❌ | Either delete the page or scope a tax/payouts module |
| `app/dashboard/member/health-metrics/page.tsx` | HR + weight time series | Weight ✅ via `/progress/clients/:id/weight-log`; HR ❌ | Either drop HR scatter or add `vitals` to progress module |
| `app/dashboard/gym-owner/members/page.tsx` | members list + check-in status | `/marketplace/organizations/:id/members` ✅ + `/checkins/organizations/:id` ✅ | **Wire only** |
| `app/dashboard/help/*` | FAQ content | Static is fine | No API needed |
| Provider availability calendar | rules + exceptions + slots | All exist ✅ | **Wire only** |
| Marketplace listing detail page | listing + plans + reviews + eligibility | All exist ✅ | **Wire only** |

---

## 5. Mock / hardcoded data still in the frontend (revamp branch)

Every entry below is a wiring task — the API already supports it unless flagged.

| File | What's mocked | Backed by |
|---|---|---|
| [src/lib/constants/notifications.ts](../../src/lib/constants/notifications.ts) | `DEMO_NOTIFICATIONS[]` (7 items) | `notificationsService.getNotifications()` ✅ |
| [src/app/member/page.tsx](../../src/app/member/page.tsx) | `WEEK[]` 7-day check-in grid | needs API enhancement (§3.2) |
| [src/app/dashboard/messages/page.tsx](../../src/app/dashboard/messages/page.tsx) | Entire conversation tree | **API does not exist** (§3.1) |
| [src/app/dashboard/member/health-metrics/page.tsx](../../src/app/dashboard/member/health-metrics/page.tsx) | 30-point HR scatter | **API does not exist** for HR (§4) |
| [src/app/dashboard/trainer/page.tsx](../../src/app/dashboard/trainer/page.tsx) | Whole dashboard ("Hardcoded to match prototype") | aggregate endpoint recommended (§3.1) |
| [src/app/dashboard/gym-owner/page.tsx](../../src/app/dashboard/gym-owner/page.tsx) | Whole dashboard | same |
| [src/app/dashboard/trainer/sessions/[sessionId]/page.tsx](../../src/app/dashboard/trainer/sessions/[sessionId]/page.tsx) | Session detail | `/consultations/bookings/:id` ✅ |
| [src/app/dashboard/trainer/tax/page.tsx](../../src/app/dashboard/trainer/tax/page.tsx) | Tax/payout dashboard | **API does not exist** |
| [src/lib/constants/regions.ts](../../src/lib/constants/regions.ts) | `MARKET_PRICES`, `COUNTRY_TO_REGION` | should come from `/utility/platform-config` (§3.2) |

---

## 6. Prioritised roadmap

### P0 — unblocks core revamp flows
1. Add `is_onboarding_complete` + `must_change_password` + `first_name` / `last_name` / `profile_picture` to all `/auth/*` user payloads (removes 3 recent revert commits worth of workarounds).
2. Add `current_week_grid` + `current_streak` to `/checkins/dashboard-stats` (kills `WEEK[]` in member home).
3. Wire NotificationsDrawer to real `/notifications` (delete `DEMO_NOTIFICATIONS`).

### P1 — closes the design ↔ data gap
4. Add `category` field on every `NotificationItem` so the drawer doesn't need a 30-case switch.
5. Add `q` full-text param to `/marketplace/listings`.
6. Server-side geo resolution endpoint (`/geo/resolve` or pin onto `/auth/me`).
7. Enrich `/utility/countries` with `currency` + `default_locale` and delete the duplicated maps in `src/lib/constants/regions.ts`.
8. Align the role / status / payment-method enums (§3.3) — generate the frontend types from the API to prevent further drift.

### P2 — net-new modules
9. `/messages/*` module (or replace the messages screen with a "coming soon" until scoped).
10. `/search` global endpoint (or split CommandBar into per-section searches).
11. `/provider/dashboard-summary` aggregate for the 3 provider dashboards.
12. `/member/home` aggregate (optional once §3.2 changes land — at that point 2 calls is acceptable).

### P3 — decide scope
13. Trainer tax / payouts module — keep or remove the page.
14. Health metrics: drop HR scatter or extend `/progress` with vitals.

---

## 7. Process recommendation

To keep this from re-drifting:

1. **Generate frontend types from the API** — add an OpenAPI export step in `binectics-api` (NestJS Swagger is already on); consume with `openapi-typescript` in `binectics-frontend`. Delete hand-maintained DTOs in `src/lib/api/*/types.ts`.
2. **Move shared enums to a published package** (or vendor as a single source file copied from API → frontend in CI).
3. **Forbid demo constants in `src/app/**` and `src/components/**`** via an ESLint rule (`no-restricted-imports` on `*/constants/*demo*`).
4. **Tag prototype-only pages** with `// PROTOTYPE: not wired` so they show up in a single grep and don't get shipped as "done".

---

## Appendix A — Module coverage matrix

| Domain | API exists | Frontend wired on revamp | Notes |
|---|:-:|:-:|---|
| Auth | ✅ | ⚠️ | Missing user-level onboarding/profile flags |
| Onboarding | ✅ | ✅ | Recently de-gated due to API/UI flag mismatch |
| Marketplace listings | ✅ | ✅ | Add `q` param for CommandBar |
| Marketplace plans | ✅ | ✅ | |
| Marketplace subscriptions | ✅ | ✅ | |
| Marketplace requests | ✅ | ✅ | |
| Teams / orgs | ✅ | ✅ | |
| Progress (clients, journals, plans) | ✅ | ⚠️ | Health-metrics page mocks HR |
| Consultations | ✅ | ⚠️ | Trainer session detail page still prototype |
| Check-ins | ✅ | ⚠️ | Week grid shape mismatch |
| Reviews | ✅ | ✅ | |
| Notifications | ✅ | ❌ | Drawer uses `DEMO_NOTIFICATIONS` |
| Loyalty | ✅ | ⚠️ | Types in place; UI partial |
| Forms | ✅ | ✅ | |
| Admin | ✅ | ✅ | |
| Provider billing | ✅ | ⚠️ | Trainer tax page is mock |
| Assignment rules | ✅ | ✅ | |
| Feedback (CSAT) | ✅ | ✅ | |
| Utility (countries/config) | ✅ | ⚠️ | Frontend duplicates region map |
| Upload | ✅ | ✅ | |
| **Messaging** | ❌ | ❌ | Full UI, no API |
| **Global search** | ❌ | ❌ | CommandBar has nowhere to call |
| **Geo resolution** | ❌ | ⚠️ | Netlify header only |
| **Provider dashboard aggregate** | ❌ | ❌ | Prototype-only |
| **Member home aggregate** | ❌ | ❌ | Multi-call + mock |

---

## Appendix B — Files & commits to cite

- Recent onboarding/auth churn caused by missing user flags: commits `cc04541`, `5f46745`, `378c25d`, `69acce0`, `72f8cd3`, `1e6b207`, `2df43ac`, `fdbffac`, `82f0316`, `28f7d41`.
- Member-home + drawer prototype landings: `28aa56c`, `2938b8c`, `3349ae9`, `a200620`.
- Design-system primitives (button base classes): `e2442c1`.
- Frontend API client entry: [src/lib/api/client.ts](../../src/lib/api/client.ts), [src/lib/api/index.ts](../../src/lib/api/index.ts).
- API entry: [src/main.ts in binectics-api](../../../binectics-api/src/main.ts) (global prefix `/api/v1`).
