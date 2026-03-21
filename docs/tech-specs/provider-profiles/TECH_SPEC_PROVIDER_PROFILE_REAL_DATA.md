# Tech Spec: Provider Profile Pages — Real Data Migration

**Status**: Proposed
**Author**: Copilot
**Date**: 2026-03-21
**Target App**: `binectics-frontend`

---

## 1) Summary

The public provider profile pages are currently mock-driven for core data (identity, bio, plans, metadata), while reviews are already API-backed.

Affected routes:

- `src/app/dieticians/[dieticianId]/page.tsx`
- `src/app/trainers/[trainerId]/page.tsx`
- `src/app/gyms/[gymId]/page.tsx`

This spec defines a phased migration to real listing/profile data with minimal UX disruption and clear backend contract requirements.

---

## 2) Why this is non-trivial

This is not a simple data swap because each page currently mixes:

1. Shared listing-like fields (headline, bio, location, rating)
2. Role-specific metadata (experience, achievements, facilities, modes)
3. Plan catalog + rich plan features
4. Profile-specific CTAs and booking/checkout routes

Current APIs provide only part of this shape, so migration requires:

- Frontend data model normalization
- Explicit fallback behavior for missing fields
- Backend contract extension for plans + role-specific details
- Cross-page componentization to reduce duplication

---

## 3) Current state

### 3.1 Data source reality

- Public listing endpoint exists and is already used elsewhere:
  - `GET /marketplace/listings/:id`
- Existing frontend service:
  - `marketplaceService.getListingById(id)` in `src/lib/api/marketplace.ts`

### 3.2 What is currently mock-only on provider pages

- Name/title composition
- Bio/description blocks
- Role-specific detail sections:
  - Dietician: education, approach, consultation modes
  - Trainer: achievements, availability details
  - Gym: facilities, hours, gallery placeholders
- Plan arrays with features and pricing labels
- Stats values (clients/reviews/rating counts) in some sections

### 3.3 What is already API-backed

- Reviews section wiring (`ProviderReviewsSection`)
- Listing owner resolution used for provider response authorization visibility

---

## 4) Goals & non-goals

### Goals

1. Replace mock provider identity + summary data with API data.
2. Replace mock plan blocks with API-backed plans.
3. Keep route-level UX and visual structure intact (no redesign).
4. Ensure robust loading/error/empty states.
5. Remove duplicated mapping logic across the 3 pages.

### Non-goals

- Redesigning provider pages.
- Adding new user-facing features unrelated to data sourcing.
- Replacing the reviews feature (already integrated).

---

## 5) Proposed architecture

## 5.1 Shared page data hook

Create `src/hooks/useProviderProfileData.ts`:

Inputs:

- `listingId: string`
- `targetType: 'GYM' | 'TRAINER' | 'DIETICIAN'`

Returns:

- `isLoading`, `error`
- normalized `providerProfile` view model
- `plans` list (normalized)
- optional `details` object (role-specific)

The hook becomes the single place for:

- API calls
- response normalization
- fallback defaults
- data compatibility guards

## 5.2 Frontend view model

Define a unified provider VM in `src/lib/types/provider-profile.ts`:

- `id`
- `displayName`
- `headline`
- `bio`
- `avatarOrHero`
- `locationLabel`
- `ratingAverage`
- `reviewCount`
- `activeClientCount`
- `specialties[]`
- `certifications[]`
- `languages[]`
- `roleDetails` (typed union by provider type)

Plan VM:

- `id`
- `name`
- `type` (`ONE_TIME` | `SUBSCRIPTION`)
- `price`
- `currency`
- `durationLabel`
- `description`
- `features[]`

---

## 6) Required API contracts

## 6.1 Already available

- `GET /marketplace/listings/:id`
  - Used for base listing/public profile metadata.

## 6.2 Required additions (backend)

1. `GET /marketplace/listings/:id/plans`

Returns active plans linked to listing provider (or organization listing context), normalized for public display.

2. `GET /marketplace/listings/:id/profile-details`

Returns role-specific optional details not in base listing:

- Trainer: achievements, experience summary, availability text
- Dietician: education, approach bullets, consultation modes
- Gym: facilities list, opening hours, gallery assets

If backend chooses to keep one endpoint, this data can be embedded in `GET /marketplace/listings/:id` under explicit optional fields. The important requirement is contract stability and explicit typing.

## 6.3 API response constraints

- Public-safe only (no private provider data)
- Missing optional fields must be omitted or null, not malformed
- Stable ids for plans and listing references

---

## 7) Frontend implementation plan

### Phase 1 — Base listing migration (low risk)

- Replace mock top-level profile blocks with `getListingById` data:
  - name/display
  - bio/description
  - location
  - specialties/certifications/languages
  - rating/review count/client count
- Add proper `loading` and `not found` states to all 3 pages.

### Phase 2 — Plans migration (medium risk)

- Add plans API client (`marketplaceService.getListingPlans`)
- Replace static plan arrays with fetched plans.
- Update CTA handlers to use real plan ids.

### Phase 3 — Role details migration (medium/high risk)

- Integrate profile-details endpoint (or expanded listing contract).
- Replace all role-specific mock sections.
- Keep section-level fallbacks for sparse providers.

### Phase 4 — Refactor and harden

- Extract reusable shared sections/components:
  - profile hero
  - plan cards
  - metadata chips
- Remove dead mock data/constants from pages.

---

## 8) UX behavior requirements

- Keep existing page layout hierarchy and visual identity.
- Show skeleton loaders for hero + plans.
- If plans endpoint fails, show empty-state card instead of breaking page.
- If role details are missing, hide that section cleanly.
- Preserve reviews section placement and behavior.

---

## 9) Error handling & observability

### Error handling

- Distinguish:
  - listing not found (404 state)
  - transient API failure (retry action)
  - partial data failure (render available sections)

### Observability (frontend)

Track events:

- `provider_profile_loaded`
- `provider_profile_load_failed`
- `provider_plans_loaded`
- `provider_plans_empty`
- `provider_plans_load_failed`

---

## 10) Testing strategy

### Unit tests

- Hook normalization logic for each target type.
- VM mapping defaults when optional fields are absent.
- Section rendering gates for missing role details.

### Integration tests

- Each route loads real listing data and renders core fields.
- Plans render from API payload and preserve CTA flows.
- Error + empty states render correctly.

### E2E (smoke)

- Navigate to one gym, one trainer, one dietician profile.
- Verify no mock fallback text appears when API data exists.
- Verify plan selection and booking/checkout link composition.

---

## 11) Rollout & backward compatibility

- Use feature flag: `NEXT_PUBLIC_ENABLE_REAL_PROVIDER_PROFILES=true`.
- Keep current mock path as temporary fallback during rollout window.
- Remove fallback after backend contracts are stable and QA passes.

---

## 12) Acceptance criteria

1. All three provider profile pages fetch and render real base listing data.
2. Plans are API-backed with real ids and pricing.
3. Role-specific sections come from API (or are gracefully omitted).
4. No hardcoded mock objects remain in the three page files.
5. Loading/error/empty states pass QA for each route.

---

## 13) Open questions

1. Should profile plans come from marketplace module or existing plans module (single source of truth)?
2. Should gym hours/facilities be modeled directly on listing or via a dedicated profile-details resource?
3. Do we need per-locale formatting for price and duration labels from backend vs frontend?
4. Should anonymous users see full plan feature lists or summary-only until login?
