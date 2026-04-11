# Full-Stack Performance & Architecture Audit

**Date:** 2026-04-11
**Scope:** `binectics-api` (NestJS/Mongoose) + `binectics-frontend` (Next.js/React)
**Status:** Findings documented — implementation tracked below
**Last updated:** 2026-04-11 (expanded with security, reliability, and contract audit)

---

## Executive Summary

Infrastructure is solid — 89 declared indexes, clean module boundaries, proper separation of concerns. The main problems are **client-side data fetching patterns**, **a handful of backend N+1 queries**, and **a critical security gap in admin authorization**.

**Top 5 highest-impact issues:**

1. **SECURITY** — Admin endpoints have no role guard enforcement (any authed user can call them)
2. **SECURITY** — File upload endpoints have no size/type limits (memory exhaustion risk)
3. **PERF** — Trainer/Dietitian Clients page: 1 + N×4 DB queries per page load
4. **PERF** — Forms N+1: 1 + N API calls from the frontend
5. **RELIABILITY** — AuthContext cascading re-renders from `[user]` dependency

---

## Issue Tracker

| #   | Issue                                                                                                    | Priority | Status         | Notes    |
| --- | -------------------------------------------------------------------------------------------------------- | -------- | -------------- | -------- |
| 1   | [Trainer clients N+1 amplifier](#1-trainer-clients-n1-amplifier)                                         | P0       | ✅ Done        | PERF     |
| 2   | [Forms N+1 fan-out](#2-forms-n1-frontend-fan-out)                                                        | P0       | ✅ Done        | PERF     |
| 3   | [AuthContext cascading effect](#3-authcontext-cascading-effect)                                          | P0       | ✅ Done        | RELIABILITY |
| 4   | [No client-side request cache](#4-no-client-side-request-cache)                                          | P1       | ⬜ Not started |          |
| 5   | [Response over-fetching](#5-response-over-fetching-no-select)                                            | P1       | ✅ Done        | PERF     |
| 6   | [Frontend waterfall chains](#6-frontend-waterfall-chains)                                                | P1       | ✅ Done        | PERF     |
| 7   | [`$nearSphere` + `$text` mutual exclusion](#7-nearsphere--text-mutual-exclusion)                         | P2       | ✅ Done        | PERF     |
| 8   | [Notification polling](#8-notification-polling-60s-interval)                                             | P2       | ⬜ Not started |          |
| 9   | [Admin listings sequential queries](#9-admin-listings-2-sequential-queries)                              | P2       | ✅ Done        | PERF     |
| 10  | [Admin endpoints missing RolesGuard](#10-admin-endpoints-missing-rolesguard)                             | P0       | ✅ Done        | SECURITY |
| 11  | [File uploads missing size/type limits](#11-file-uploads-missing-sizetype-limits)                        | P0       | ✅ Done        | SECURITY |
| 12  | [Unbounded queries missing `.limit()`](#12-unbounded-queries-missing-limit)                              | P1       | ✅ Done        | RELIABILITY |
| 13  | [Race condition in subscription cancellation](#13-race-condition-in-subscription-cancellation)           | P1       | ✅ Done        | RELIABILITY |
| 14  | [Hardcoded API URL in file upload](#14-hardcoded-api-url-in-file-upload)                                 | P1       | ✅ Done        |          |
| 15  | [XHR upload missing abort/cleanup](#15-xhr-upload-missing-abortcleanup)                                  | P2       | ✅ Done        |          |
| 16  | [Rate limiting too lenient on sensitive endpoints](#16-rate-limiting-too-lenient-on-sensitive-endpoints) | P2       | ✅ Done        | SECURITY |

---

## CRITICAL — Fix Immediately

### 1. Trainer Clients N+1 Amplifier

**Severity:** P0 — CRITICAL
**Type:** Backend + Frontend
**Status:** ⬜ Not started

**Where:**

- Backend: `src/progress/progress.service.ts` → `getClientProfiles()`
- Frontend: `src/app/dashboard/trainer/clients/page.tsx`

**Problem:**

The frontend fetches the client list, then for each client fires 4 separate API calls (latest journal, latest workout plan, latest diet plan, latest weight log). For N clients:

| Clients | API Calls | DB Queries |
| ------- | --------- | ---------- |
| 10      | 11        | 41         |
| 25      | 26        | 101        |
| 50      | 51        | 201        |

**Fix (backend):** Create a batch endpoint `GET /progress/clients/summary` that returns all clients with their latest journal/workout/diet/weight pre-aggregated via a single MongoDB aggregation pipeline:

```typescript
this.clientProfileModel.aggregate([
  { $match: filter },
  {
    $lookup: {
      from: "journalentries",
      localField: "_id",
      foreignField: "client_profile_id",
      pipeline: [{ $sort: { entry_date: -1 } }, { $limit: 1 }],
      as: "latest_journal",
    },
  },
  {
    $lookup: {
      from: "workoutplans",
      localField: "_id",
      foreignField: "client_profile_id",
      pipeline: [{ $sort: { assigned_at: -1 } }, { $limit: 1 }],
      as: "latest_workout",
    },
  },
  // ... diet plan, weight log lookups similarly
  { $unwind: { path: "$latest_journal", preserveNullAndEmptyArrays: true } },
  // ...
]);
```

**Fix (frontend):** Replace N individual `useEffect` fetches with a single call to the new summary endpoint.

**Impact:** Reduces 41+ queries → 1 aggregation. Eliminates the worst performance cliff in the app.

---

### 2. Forms N+1 Frontend Fan-Out

**Severity:** P0 — CRITICAL
**Type:** Backend + Frontend
**Status:** ⬜ Not started

**Where:**

- Frontend: `src/hooks/useForms.ts`
- Frontend: `src/app/forms/page.tsx`

**Problem:**

After fetching all forms, the hook fires `getFormResponses(form._id)` for **every form** (concurrency-limited to 5 via `pMap`). For 50 forms = 51 HTTP requests, 10 serial batches.

```typescript
// Current code in useForms.ts
const RESPONSE_COUNT_CONCURRENCY = 5;

await pMap(
  response.data,
  async (form) => {
    const responsesResponse = await formsService.getFormResponses(form._id);
    counts[form._id] = responsesResponse.data?.length ?? 0;
  },
  RESPONSE_COUNT_CONCURRENCY,
);
```

**Fix (backend):** Add a `GET /forms/response-counts` endpoint that accepts form IDs and returns `{ [formId]: count }` in a single aggregation:

```typescript
this.formResponseModel.aggregate([
  { $match: { form_id: { $in: formIds } } },
  { $group: { _id: "$form_id", count: { $sum: 1 } } },
]);
```

**Fix (frontend):** Replace the `pMap` loop in `useForms()` with a single call to the new batch endpoint.

**Impact:** 51 API calls → 2 (one for forms, one for counts).

---

### 3. AuthContext Cascading Effect

**Severity:** P0 — CRITICAL
**Type:** Frontend
**Status:** ⬜ Not started

**Where:**

- `src/contexts/AuthContext.tsx`

**Problem:**

The session-monitoring `useEffect` has `[user]` as a dependency. When it calls `setUser(currentUser)` after a token refresh, it triggers itself again, creating a re-render cascade and potentially duplicate refresh calls.

```typescript
// Current code
useEffect(() => {
  if (!user) return;
  const payload = parseJWT(token);
  const attemptAutoRefresh = async () => {
    const response = await authService.refreshToken();
    apiClient.storeTokens(...);
    const currentUser = authService.getCurrentUser();
    if (currentUser) setUser(currentUser); // ← triggers this effect again
  };
}, [user]); // ← re-runs on every user state change
```

**Fix options:**

```typescript
// Option A: Stable dependency
}, [user?.id]);

// Option B: useRef for timer (preferred)
const refreshTimerRef = useRef<NodeJS.Timeout>();
useEffect(() => {
  if (!user) return;
  // Set up refresh timer once, read user from ref
  return () => clearTimeout(refreshTimerRef.current);
}, []); // Empty deps — timer set once on mount
```

**Impact:** Eliminates unnecessary re-renders and duplicate API calls on every navigation.

---

## HIGH — Fix This Sprint

### 4. No Client-Side Request Cache

**Severity:** P1 — HIGH
**Type:** Frontend (architectural)
**Status:** ⬜ Not started

**Where:** Entire frontend — no React Query, SWR, or any caching layer.

**Problem:**

Every route navigation triggers fresh API calls. Countries, platform config, user profile — all re-fetched on every page.

| Data                  | Pages That Fetch It       | Calls Per Session     |
| --------------------- | ------------------------- | --------------------- |
| `getCountries()`      | 3 pages                   | Re-fetched each visit |
| `getPlatformConfig()` | 7 pages                   | Re-fetched each visit |
| Organizations         | Multiple dashboard routes | Re-fetched per page   |

**Specific pages calling `getCountries()`:**

- `src/app/dashboard/marketplace/page.tsx`
- `src/app/dashboard/settings/profile/page.tsx`
- `src/app/dashboard/gym-owner/marketplace/page.tsx`

**Specific pages calling `getPlatformConfig()`:**

- `src/app/dashboard/dietitian/plans/[planId]/edit/page.tsx`
- `src/app/dashboard/dietitian/plans/create/page.tsx`
- `src/app/dashboard/trainer/plans/create/page.tsx`
- `src/app/dashboard/trainer/plans/[planId]/edit/page.tsx`
- `src/app/dashboard/gym-owner/marketplace/page.tsx`
- `src/app/dashboard/gym-owner/plans/[planId]/edit/page.tsx`
- `src/app/dashboard/gym-owner/plans/create/page.tsx`

**Fix:** Introduce React Query (TanStack Query) with sensible `staleTime` values:

| Data            | staleTime   | Reasoning            |
| --------------- | ----------- | -------------------- |
| Countries       | `Infinity`  | Never changes        |
| Platform config | 5 min       | Rarely changes       |
| User profile    | 30s         | Updates occasionally |
| Listings/search | 0 (default) | Needs freshness      |

**Impact:** Eliminates ~60-70% of redundant API calls. Enables optimistic updates, background refetching, and stale-while-revalidate.

---

### 5. Response Over-Fetching (No `.select()`)

**Severity:** P1 — HIGH
**Type:** Backend
**Status:** ⬜ Not started

**Where:** Multiple high-traffic backend services.

**Problem:**

Several queries return full documents without field selection:

| Service                    | Method                  | Doc Size   | Fields Needed by Client                  |
| -------------------------- | ----------------------- | ---------- | ---------------------------------------- |
| `progress.service.ts`      | `getClientProfiles()`   | ~20 fields | name, email, photo, created_at           |
| `marketplace.service.ts`   | `searchListings()`      | ~30 fields | headline, location, price, rating, photo |
| `consultations.service.ts` | `getMyBookings()`       | ~25 fields | provider, time, status, type             |
| `consultations.service.ts` | `getProviderBookings()` | ~25 fields | client, time, status, type               |

**Fix:** Add `.select()` to each query:

```typescript
// Before
this.clientProfileModel.find(filter).populate(...).lean().exec();

// After
this.clientProfileModel.find(filter)
  .select('client_id professional_id organization_id goals status created_at')
  .populate('client_id', 'first_name last_name email profile_picture')
  .lean().exec();
```

**Impact:** 30-60% payload size reduction on list endpoints. Direct bandwidth savings, faster JSON parse on client.

---

### 6. Frontend Waterfall Chains

**Severity:** P1 — HIGH
**Type:** Frontend
**Status:** ⬜ Not started

**Where:** Multiple dashboard pages.

**Problem:**

Three sequential fetch patterns where calls could be parallel:

| Waterfall                       | Flow                                       | Wasted Time            |
| ------------------------------- | ------------------------------------------ | ---------------------- |
| Trainer/Dietitian profile pages | Fetch profile → then fetch summary stats   | ~200-400ms             |
| Forms page                      | Fetch forms → then fetch response counts   | Combines with issue #2 |
| Org check → redirect            | Check org membership → then load dashboard | ~150-300ms             |

**Fix per case:**

- **Profile + Stats:** Use `Promise.all()` — both requests are independent
- **Forms:** Solved by fix #2 (batch endpoint)
- **Org check:** Move org membership data into the auth token claims or initial user load so it's available immediately without a round trip

**Impact:** 200-400ms saved per page on affected routes.

---

## MEDIUM — Plan for Next Sprint

### 7. `$nearSphere` + `$text` Mutual Exclusion

**Severity:** P2 — MEDIUM
**Type:** Backend
**Status:** ⬜ Not started

**Where:** `src/marketplace/marketplace.service.ts` → `searchListings()`

**Problem:**

MongoDB doesn't allow `$nearSphere` and `$text` in the same query. When both geo and text search are active, text search is silently dropped when geo is present.

**Fix options:**

1. **Atlas Search** — Use `$search` with `geoWithin` + fulltext in one pipeline (best if on Atlas)
2. **Two-phase search** — Geo-filter first (get IDs), then text-filter within results
3. **Client-side filter** — For small result sets, apply text filter after geo query (simplest but doesn't scale)

**Impact:** Affects users searching by both name and location simultaneously. Edge case now but will affect marketplace usability as it grows.

---

### 8. Notification Polling (60s Interval)

**Severity:** P2 — MEDIUM
**Type:** Frontend + Backend
**Status:** ⬜ Not started

**Where:** `src/hooks/useNotificationCount.ts`

**Problem:**

`setInterval(poll, 60_000)` creates one HTTP request per minute per active browser tab. At scale:

| Concurrent Users | Requests/Minute |
| ---------------- | --------------- |
| 100              | 100             |
| 1,000            | 1,000           |
| 10,000           | 10,000          |

**Fix:** Replace with Server-Sent Events (SSE). NestJS supports SSE natively:

```typescript
// Backend
@Sse('stream')
notificationStream(@CurrentUser() user): Observable<MessageEvent> {
  return this.notificationService.getStream(user.id);
}
```

```typescript
// Frontend
const eventSource = new EventSource("/api/notifications/stream");
eventSource.onmessage = (event) => setCount(JSON.parse(event.data).count);
```

**Impact:** Eliminates polling entirely. Notifications delivered in real-time instead of up-to-60s delay.

---

### 9. Admin Listings: 2 Sequential Queries

**Severity:** P2 — LOW
**Type:** Backend
**Status:** ⬜ Not started

**Where:** Admin service — gym listings fetch.

**Problem:** Fetches listings then counts separately in two queries. Could be a single aggregation with `$facet`.

**Fix:**

```typescript
this.listingModel.aggregate([
  { $match: filter },
  {
    $facet: {
      data: [{ $sort: sort }, { $skip: skip }, { $limit: limit }],
      total: [{ $count: "count" }],
    },
  },
]);
```

**Impact:** Minor — only affects admin panel. 2 queries → 1.

---

---

## CRITICAL — Security

### 10. Admin Endpoints Missing RolesGuard

**Severity:** P0 — CRITICAL SECURITY
**Type:** Backend
**Status:** ✅ Done (2026-04-11)

**Fix applied:** Added `@UseGuards(RolesGuard)` at class level on `AdminController`. Registered `RolesGuard` as a provider in `AdminModule`. All 10+ admin endpoints now enforce role-based authorization via the existing `@SetMetadata('roles', ['Level 1 Admin'])` decorators. 28 tests pass.

---

### 11. File Uploads Missing Size/Type Limits

**Severity:** P0 — CRITICAL SECURITY
**Type:** Backend
**Status:** ✅ Done (2026-04-11)

**Fix applied:** Created `src/common/upload/file-upload.config.ts` with two reusable Multer configs:
- `imageUploadOptions` — JPEG/PNG/WEBP/GIF only, 10 MB max
- `documentUploadOptions` — images + PDF, 10 MB max

Applied across all 4 controllers (14 upload endpoints total):
- `auth.controller.ts` — profile picture → `imageUploadOptions`
- `cloudinary-upload.controller.ts` — single + batch image → `imageUploadOptions`
- `marketplace-org.controller.ts` — profile/gallery images → `imageUploadOptions`, documents → `documentUploadOptions`
- `progress.controller.ts` — 7 diet plan document endpoints → `documentUploadOptions`

All 215 tests across affected suites pass (28 admin + 187 marketplace/progress/cloudinary).

---

## HIGH — Reliability & Correctness

### 12. Unbounded Queries Missing `.limit()`

**Severity:** P1 — HIGH
**Type:** Backend
**Status:** ⬜ Not started

**Where:** Multiple services with `.find()` calls that return all matching documents.

**Specific instances:**

| Service                    | Method                                        | Risk                                  |
| -------------------------- | --------------------------------------------- | ------------------------------------- |
| `admin.service.ts`         | `getPermissions()`                            | Returns all permissions — unbounded   |
| `admin.service.ts`         | `broadcastAnnouncement()`                     | Loads ALL user IDs into memory        |
| `marketplace.service.ts`   | Org plans, listing documents, client requests | Multiple `.find()` without `.limit()` |
| `consultations.service.ts` | Provider availability rules                   | All rules for a provider              |

**Fix:** Add `.limit()` with sensible defaults (100-500) to all list queries, or enforce pagination at the controller level. For `broadcastAnnouncement()`, use cursor-based iteration instead of loading all users:

```typescript
// Instead of:
const users = await this.userModel.find({}, { _id: 1 }).lean().exec();

// Use cursor:
const cursor = this.userModel.find({}, { _id: 1 }).lean().cursor();
for await (const user of cursor) {
  await this.notificationsService.createNotification({ user_id: user._id, ... });
}
```

**Impact:** Prevents memory exhaustion as data grows. The broadcast function is especially dangerous at scale.

---

### 13. Race Condition in Subscription Cancellation

**Severity:** P1 — HIGH
**Type:** Backend
**Status:** ⬜ Not started

**Where:** `src/marketplace/marketplace.service.ts` (~line 1677)

**Problem:**

Subscription cancellation uses a read-then-write pattern:

```typescript
if (subscription.status === MembershipSubscriptionStatus.CANCELLED) {
  throw new ConflictException("Already cancelled");
}
const wasActive = subscription.status === MembershipSubscriptionStatus.ACTIVE;
subscription.status = MembershipSubscriptionStatus.CANCELLED;
await subscription.save();
```

Between the read and the save, another request can modify the same subscription, leading to:

- Duplicate decrement of `active_client_count`
- Inconsistent state

**Fix:** Use atomic `findOneAndUpdate` with a status precondition:

```typescript
const result = await this.subscriptionModel.findOneAndUpdate(
  {
    _id: subscriptionId,
    status: { $ne: MembershipSubscriptionStatus.CANCELLED },
  },
  {
    $set: {
      status: MembershipSubscriptionStatus.CANCELLED,
      cancelled_at: new Date(),
    },
  },
  { new: true },
);
if (!result) throw new ConflictException("Already cancelled or not found");
```

**Impact:** Prevents double-cancellation and counter drift. Important for financial accuracy.

---

### 14. Hardcoded API URL in File Upload

**Severity:** P1 — HIGH
**Type:** Frontend
**Status:** ⬜ Not started

**Where:** `src/app/dashboard/dietitian/meal-plans/create/page.tsx` (line 19)

**Problem:**

The `uploadWithProgress()` function uses a hardcoded API URL instead of the configured `NEXT_PUBLIC_API_URL`:

```typescript
const API_BASE_URL =
  "https://binectics-gym-dev-api-dwbaeufeafgqd6db.canadacentral-01.azurewebsites.net/api/v1";
```

If the API URL changes (staging, production), this upload will silently fail.

**Fix:** Import from the API client config:

```typescript
import { API_BASE_URL } from "@/lib/api/client";
```

**Impact:** Prevents silent upload failures in non-dev environments.

---

## MEDIUM — Polish

### 15. XHR Upload Missing Abort/Cleanup

**Severity:** P2 — MEDIUM
**Type:** Frontend
**Status:** ⬜ Not started

**Where:** `src/app/dashboard/dietitian/meal-plans/create/page.tsx` (lines 25-54)

**Problem:**

The `uploadWithProgress()` function creates an `XMLHttpRequest` with event listeners that are never removed. If the component unmounts mid-upload, the listeners remain attached.

**Fix:** Return an abort controller or use `fetch` with `AbortSignal`:

```typescript
// In component cleanup:
useEffect(() => {
  return () => {
    if (xhrRef.current) xhrRef.current.abort();
  };
}, []);
```

**Impact:** Prevents memory leaks during navigation away from upload pages.

---

### 16. Rate Limiting Too Lenient on Sensitive Endpoints

**Severity:** P2 — MEDIUM
**Type:** Backend
**Status:** ⬜ Not started

**Where:** `src/app.module.ts` (global throttler: 100 req/60s)

**Problem:**

The global rate limit of 100 requests per minute is the only protection on most endpoints. Only the mailer controller has per-endpoint throttling (3 req/60s). Sensitive operations like login, password reset, file upload, and search have no tighter limits.

**Fix:** Add `@Throttle()` decorators on sensitive endpoints:

```typescript
// Auth endpoints
@Throttle({ default: { limit: 5, ttl: 60000 } })
async login() { ... }

// File uploads
@Throttle({ default: { limit: 10, ttl: 60000 } })
async uploadFile() { ... }

// Search (prevent scraping)
@Throttle({ default: { limit: 30, ttl: 60000 } })
async searchListings() { ... }
```

**Impact:** Reduces brute-force and scraping risk on sensitive operations.

---

## What's Working Well

| Area                        | Assessment                                                                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Index coverage**          | 89 declared indexes across 36 entities — thorough                                                                                   |
| **Marketplace search**      | Denormalized `average_rating`/`review_count` avoids real-time aggregation. 2dsphere + text + compound indexes are correct           |
| **Main user dashboard**     | 3 parallel API calls — efficient                                                                                                    |
| **Consultation booking**    | 3 parallel queries + in-memory slot generation — clean                                                                              |
| **Module boundaries**       | Clean NestJS module separation, proper DI                                                                                           |
| **Auth flow**               | JWT + refresh token with mutex pattern preventing concurrent refreshes. Token refresh race condition properly handled in API client |
| **Rate limiting**           | 100 req/min global throttle via ThrottlerModule (adequate baseline)                                                                 |
| **Notification system**     | 33 types, fire-and-forget, role-aware routing — well designed                                                                       |
| **Input validation**        | Global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, `forbidUnknownValues` — solid                                     |
| **CORS**                    | Environment-controlled `allowedOrigins` — not using wildcard `*`                                                                    |
| **Date handling**           | Backend returns ISO 8601 UTC via `DateTransformInterceptor`, frontend parses correctly with timezone support                        |
| **MongoDB connection**      | Pool configured (min 5, max 20), timeouts set, retryWrites/retryReads enabled                                                       |
| **Bundle size**             | Lean deps — `date-fns` (not moment), no lodash, no heavy UI lib. `optimizePackageImports` enabled in Next.js                        |
| **Memory leaks**            | All `setInterval`/`setTimeout`/`addEventListener` patterns have proper cleanup (except one XHR edge case)                           |
| **Enum alignment**          | Backend and frontend enums match for all 15+ shared types (roles, statuses, booking states, etc.)                                   |
| **Error boundaries**        | Root `error.tsx` exists + 4 route-level boundaries                                                                                  |
| **Global exception filter** | `@Catch()` filter with Sentry integration, sanitized production errors                                                              |

---

## Prioritized Action Plan

| #   | Issue                          | Type         | Effort Est. | Impact                              | ROI         |
| --- | ------------------------------ | ------------ | ----------- | ----------------------------------- | ----------- |
| 10  | Admin RolesGuard               | Backend      | 15min       | Closes privilege escalation         | **Highest** |
| 11  | File upload limits             | Backend      | 1h          | Prevents memory exhaustion DoS      | **Highest** |
| 1   | Trainer clients batch endpoint | Backend + FE | 4h          | Eliminates 40+ queries/load         | Very High   |
| 2   | Forms response count batch     | Backend + FE | 2h          | Eliminates 50+ API calls            | Very High   |
| 3   | AuthContext effect fix         | Frontend     | 30min       | Stops cascading re-renders          | Very High   |
| 13  | Subscription race condition    | Backend      | 1h          | Prevents counter drift              | High        |
| 14  | Hardcoded API URL              | Frontend     | 10min       | Prevents silent upload failures     | High        |
| 12  | Unbounded query limits         | Backend      | 2h          | Prevents memory exhaustion at scale | High        |
| 4   | Add React Query                | Frontend     | 1-2 days    | Eliminates all redundant fetches    | High        |
| 5   | `.select()` on list queries    | Backend      | 2h          | 30-60% payload reduction            | High        |
| 6   | Parallelize waterfalls         | Frontend     | 1h          | 200-400ms per page saved            | Medium      |
| 16  | Per-endpoint rate limiting     | Backend      | 1h          | Reduces brute-force risk            | Medium      |
| 15  | XHR abort cleanup              | Frontend     | 30min       | Prevents memory leak edge case      | Medium      |
| 7   | Atlas Search for geo+text      | Backend      | 4h          | Correct combined search             | Medium      |
| 8   | SSE for notifications          | Both         | 4h          | Eliminates polling                  | Medium      |
| 9   | Admin facet aggregation        | Backend      | 1h          | Minor DB optimization               | Low         |

Items 10-11 are **security issues** — fix before anything else. Items 1-3 are the biggest performance wins.

---

## Index Inventory (Reference)

**Total declared indexes: 89** across 36 entity schemas.

Key entities by index count:

| Entity                  | Indexes | Notes                                                 |
| ----------------------- | ------- | ----------------------------------------------------- |
| marketplace-listing     | 7       | 2dsphere, text, compound — well covered               |
| form                    | 6       | Multiple access patterns indexed                      |
| consultation-booking    | 5       | Multi-field composites for provider + client queries  |
| workout-plan            | 4       | client, professional, organization, client_profile    |
| diet-plan               | 4       | Same pattern as workout-plan                          |
| review                  | 4       | target, reviewer, booking source, subscription source |
| form-answer             | 3       | response, question, unique compound                   |
| form-response           | 3       | form+submitter, form+date, submitter+date             |
| form-access             | 3       | unique form+user, user active, form active            |
| check-in                | 3       | member+listing, org, listing                          |
| marketplace-request     | 3       | composite, org+status, professional+status            |
| notification            | 3       | user+date, user+read, composite                       |
| membership-subscription | 3       | 2 composite, plan+status                              |
| recommendation          | 3       | client+active, client_profile+plan, professional      |

---

## Audit Coverage Checklist

Areas verified during this audit:

- [x] N+1 query patterns (backend + frontend)
- [x] MongoDB index coverage (89 indexes across 36 entities)
- [x] Frontend data fetching redundancy
- [x] Response payload over-fetching
- [x] Waterfall / sequential fetch chains
- [x] Client-side caching strategy
- [x] Polling patterns
- [x] AuthContext re-render behavior
- [x] **Security: CORS configuration** — ✅ properly restricted
- [x] **Security: Admin authorization** — ❌ missing guard
- [x] **Security: File upload limits** — ❌ no limits
- [x] **Security: Input validation** — ✅ global ValidationPipe
- [x] **Security: Rate limiting** — ⚠️ global only, no per-endpoint
- [x] **Security: Text search sanitization** — ✅ sanitizeTextSearch() present
- [x] **Reliability: Unbounded queries** — ❌ multiple instances
- [x] **Reliability: Race conditions** — ❌ subscription cancellation
- [x] **Reliability: Error boundaries** — ✅ root + 4 route-level
- [x] **Reliability: Global exception filter** — ✅ with Sentry
- [x] **Reliability: Memory leaks** — ✅ mostly clean (1 XHR edge case)
- [x] **Reliability: Token refresh race** — ✅ mutex pattern in apiClient
- [x] **Contract: Enum alignment** — ✅ 15+ types match
- [x] **Contract: API URL/versioning** — ⚠️ 1 hardcoded URL
- [x] **Contract: Auth token format** — ✅ Bearer token aligned
- [x] **Contract: Date/time handling** — ✅ ISO 8601 UTC everywhere
- [x] **Performance: MongoDB connection pool** — ✅ configured
- [x] **Performance: Bundle size** — ✅ lean dependencies
- [x] **Performance: Code splitting** — ✅ Next.js App Router defaults

---

_Last updated: 2026-04-11_
