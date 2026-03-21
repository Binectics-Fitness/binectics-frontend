# Tech Spec: Reviews & Rating Feature

**Status**: Proposed (MVP)
**Author**: Copilot
**Date**: 2026-03-21
**Source**: Product planning request

---

## 1) Context

Binectics needs a trusted reviews and ratings system so users can evaluate gyms, trainers, and dieticians before purchasing plans or booking sessions.

The feature should:

- increase confidence in provider quality,
- improve discovery sorting relevance,
- and provide clear feedback loops for providers.

---

## 2) Problem Statement

Current discovery and profile pages show static/mock reputation values in multiple places. There is no end-to-end, user-generated review lifecycle connected to real subscriptions/bookings.

Without a real reviews system:

- users cannot reliably compare providers,
- providers cannot build reputation through verified outcomes,
- the marketplace lacks transparent trust signals.

---

## 3) Goals and Non-Goals

### Goals (MVP)

1. Allow eligible users to submit a 1–5 star rating with optional written feedback.
2. Display aggregate rating and recent reviews on provider pages.
3. Restrict review eligibility to users with real engagement (booking/subscription).
4. Enable provider/admin moderation controls for abuse/inappropriate content.
5. Support discovery sorting/filtering by rating and review volume.
6. Allow providers to publish one response per visible review.
7. Support public threaded discussions under reviews.

### Non-Goals (MVP)

- Sentiment analysis / AI scoring.
- Media attachments (photo/video review evidence).
- Multi-dimension rubric scoring (e.g., punctuality, communication) beyond overall star rating.
- Incentive/referral reward mechanics tied to review submission.

---

## 4) Personas and Roles

### Reviewer (Client/User)

- Submits ratings for providers after eligible engagement.
- Edits/deletes own review within a defined window (optional policy).

### Provider (Gym Owner / Trainer / Dietician)

- Views ratings and review feed for own profile.
- Flags abusive reviews for moderation.
- Posts one provider response per review.

### Admin

- Reviews flagged content.
- Hides/restores/removes reviews based on policy.
- Monitors abuse patterns and review quality metrics.

---

## 5) Functional Requirements

### 5.1 Eligibility and Verification

- A user can only review a provider if they meet engagement rules, e.g.:
  - completed consultation booking with that provider, or
  - active/completed subscription/plan purchase.
- Reviews from ineligible users are rejected by API.
- UI should surface eligibility state:
  - "You can review this provider"
  - or "Complete a session to leave a review"

### 5.2 Review Submission

- Inputs:
  - `rating` (required, integer 1–5)
  - `comment` (optional, max length configurable)
  - `bookingId` or `subscriptionId` when required for verification traceability
- UI validation:
  - rating required
  - comment length constraints
- API returns canonical review object and updated aggregates where available.

### 5.3 Review Management (User)

- User can:
  - view own submitted reviews,
  - edit review text/rating within configured window (optional, e.g. 24h),
  - soft-delete own review.
- API should preserve audit history internally even if review is hidden/deleted.

### 5.4 Review Display (Provider/Discovery)

- Provider profile pages display:
  - average rating,
  - total review count,
  - distribution summary (optional MVP-lite),
  - paginated recent reviews.
- Discovery cards display:
  - average rating and review count.
- Sorting/filter options:
  - highest rated,
  - most reviewed,
  - minimum rating threshold.

### 5.5 Moderation and Safety

- Users/providers can flag a review with reason.
- Admin can set review status:
  - `VISIBLE`, `HIDDEN`, `REMOVED`.
- Removed/hidden reviews are excluded from public aggregates.
- Basic anti-spam constraints:
  - one review per user per provider per booking/subscription (MVP default),
  - rate-limiting of submission attempts.

### 5.6 Provider Responses

- Provider can post one response to a visible review.
- Response is shown beneath review and follows moderation rules.

### 5.7 Public Threaded Discussions (MVP Scope)

- MVP thread depth is **one level** only:
  - top-level review comment,
  - direct replies to that review.
- Nested reply chains (reply-to-reply depth > 1) are out of scope for MVP.

---

## 6) Frontend Information Architecture

## User Surfaces

- Provider profile: review summary + list + "Write review" CTA
- Review submit modal/page
- "My Reviews" section (dashboard/settings)

## Provider Surfaces

- Provider dashboard: reputation summary card + recent reviews + flagged status

## Admin Surfaces

- Review moderation queue
- Review detail panel (context + decision actions)

---

## 7) Core User Flows

### Flow A: Eligible User Submits Review

1. User opens provider profile.
2. UI checks eligibility.
3. User selects star rating and adds optional comment.
4. User submits review.
5. API validates eligibility and creates review.
6. Profile aggregates and review feed refresh.

### Flow B: Provider Flags Review

1. Provider views own reviews.
2. Clicks "Report" on abusive review.
3. Submits flag reason.
4. Admin queue receives moderation task.

### Flow C: Admin Moderates Flagged Review

1. Admin opens moderation queue.
2. Reviews context and report metadata.
3. Sets status (`VISIBLE`/`HIDDEN`/`REMOVED`).
4. Public UI and aggregate metrics update accordingly.

---

## 8) Data Model (Contract-Level)

> Frontend repository is frontend-only. These are contract entities expected from external API.

### ReviewTargetType

- `GYM`
- `TRAINER`
- `DIETICIAN`

### ReviewStatus

- `VISIBLE`
- `HIDDEN`
- `REMOVED`

### Review

- `id: string`
- `targetType: 'GYM' | 'TRAINER' | 'DIETICIAN'`
- `targetId: string`
- `reviewerUserId: string`
- `reviewerName: string`
- `reviewerAvatarUrl?: string`
- `rating: number` (1–5)
- `comment?: string`
- `status: 'VISIBLE' | 'HIDDEN' | 'REMOVED'`
- `sourceBookingId?: string`
- `sourceSubscriptionId?: string`
- `providerResponse?: { message: string; createdAt: string }`
- `createdAt: string`
- `updatedAt: string`

### ReviewAggregate

- `targetType: 'GYM' | 'TRAINER' | 'DIETICIAN'`
- `targetId: string`
- `averageRating: number`
- `totalReviews: number`
- `ratingBreakdown?: { [star: string]: number }` (keys `1`..`5`)

### ReviewEligibility

- `canReview: boolean`
- `reason?: string`
- `sourceBookingId?: string`
- `sourceSubscriptionId?: string`

---

## 9) Shared API Contract (Canonical v1)

### Public/Authenticated Endpoints

1. `GET /reviews/targets/:targetType/:targetId/aggregate`
   - returns `ReviewAggregate`

2. `GET /reviews/targets/:targetType/:targetId`
   - query: `page`, `limit`, `sort`
   - returns paginated `Review[]` (public-visible only)

3. `GET /reviews/targets/:targetType/:targetId/eligibility`
   - auth required
   - returns `ReviewEligibility`

4. `POST /reviews`
   - auth required
   - body: `{ targetType, targetId, rating, comment?, sourceBookingId?, sourceSubscriptionId? }`

5. `PATCH /reviews/:id`
   - auth required (review owner/admin)
   - body: `{ rating?, comment? }`

6. `DELETE /reviews/:id`
   - auth required (review owner/admin)

7. `POST /reviews/:id/report`
   - auth required
   - body: `{ reason, details? }`

8. `POST /reviews/:id/provider-response`
   - auth required (provider owner/admin)

9. `GET /admin/reviews/moderation-queue`
   - admin

10. `PATCH /admin/reviews/:id/status`

- admin
- body: `{ status: 'VISIBLE' | 'HIDDEN' | 'REMOVED', reason? }`

---

## 10) UX and Content Rules

- Star rating UI must be keyboard accessible.
- Empty states:
  - "No reviews yet" with neutral guidance.
- Display reviewer identity safely (name/avatar) according to privacy rules.
- Do not show hidden/removed reviews publicly.
- Provider responses should be visually distinct from user reviews.

---

## 11) Analytics and Observability

Track:

- review submission attempts/success/failure,
- eligibility denial reasons,
- report/flag volume,
- moderation actions by status and reason,
- rating distribution by provider type.

---

## 12) Security and Abuse Controls

- Server-side eligibility enforcement (never trust frontend).
- Rate limiting on submission/report endpoints.
- Optional profanity or banned-term checks.
- Audit logs for moderation actions.
- Prevent duplicate spam submissions per source engagement.

---

## 13) Testing Strategy

### Frontend

- Unit tests:
  - rating input validation,
  - aggregate rendering,
  - empty state rendering,
  - review list pagination/sort interactions.
- Integration tests:
  - eligibility gating,
  - submit/edit/delete happy and error paths.

### Backend (for contract consumers)

- Eligibility enforcement tests.
- Aggregate recalculation tests on create/edit/delete/moderation.
- Moderation authorization and status transition tests.
- Duplicate/spam prevention tests.

---

## 14) Rollout Plan

1. Ship read-only aggregate + list on profiles.
2. Enable review submission for eligible users.
3. Enable provider report + admin moderation.
4. Enable provider response.
5. Add advanced sorting as follow-up.

---

## 15) Open Questions

1. Should one user have multiple reviews for same provider over time or exactly one active review?
2. What edit window policy should apply (none, 24h, 7d)?
3. Should `NO_SHOW` sessions be eligible for review?
4. Should rating affect search rank linearly or via weighted confidence by review count?
5. Should admins be able to override eligibility for support cases?
