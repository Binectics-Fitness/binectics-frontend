# Advertising & Sponsored Listings — Technical Specification

**Status**: Stub — not yet ready for implementation  
**Last updated**: May 2026  
**Authors**: Engineering  
**Related roadmap phase**: Phase 4 (post-commission and add-ons)  
**Depends on**: Search/discovery infrastructure, marketplace listing model

---

## 1. Problem Statement

Providers can pay to appear at the top of search results and category pages in
the Binectics marketplace. The planning doc describes two surfaces:

1. **Sponsored listings** — paid placement on search results and location-based
   browse pages (e.g. "Top Trainers in Nairobi").
2. **Promoted profiles** — elevated visibility in category and discovery feeds.

Neither surface currently exists. There is no ad-unit model, no auction or
fixed-CPM pricing, no campaign management tooling, and no sponsored-slot
rendering in the frontend.

---

## 2. Planned Ad Surfaces

### 2.1 Sponsored Search Results

- Up to N sponsored listing cards appear at the top of search result pages
  before organic results, with a "Sponsored" label.
- Targeting: location (city/country), category (gym/trainer/dietitian),
  keyword (if full-text search is added).

### 2.2 Location-Based Promoted Slots

- Dedicated "Featured in [City]" section on city/country browse pages.
- Providers pay to be pinned in this section for a defined period.
- Example: "Top Trainers in Lagos" — 3 sponsored slots above organic list.

### 2.3 Category Page Spotlight

- "Featured Gym" or "Dietitian of the Month" banner slot per category page.
- Single high-visibility placement per category per market.

---

## 3. Open Questions

> All questions below are **unresolved (🔲)**. They must be answered before
> implementation begins.

### 3.1 Pricing Model

| # | Question | Options |
|---|---|---|
| Q1 | Is ad pricing fixed (CPD/CPW — cost per day/week) or auction-based (CPM/CPC)? | Fixed rate / Auction |
| Q2 | Are rates admin-configured per slot type and market, or dynamic? | Admin-configured / Dynamic |
| Q3 | Is there a minimum spend per campaign? | Yes / No |
| Q4 | Are ad budgets pre-paid (credits) or post-billed? | Pre-paid / Post-billed |
| Q5 | Is ad spend charged via the provider's existing billing gateway (reuse SaaS billing) or a separate ad wallet? | Reuse billing / Separate wallet |

### 3.2 Campaign Management

| # | Question | Options |
|---|---|---|
| Q6 | Can a provider run multiple simultaneous campaigns (different locations or categories)? | Yes / No |
| Q7 | Is there an ad scheduler (start date / end date / budget cap)? | Yes / No |
| Q8 | Is campaign management self-serve (provider creates own campaigns) or managed by Binectics ops? | Self-serve / Ops-managed / Both |
| Q9 | Can ads be paused mid-campaign and budget rolled over? | Yes / No |
| Q10 | Is ad eligibility gated by tier (Free providers cannot advertise)? | Yes / No |

### 3.3 Auction / Ranking (if auction model is chosen)

| # | Question | Options |
|---|---|---|
| Q11 | Auction model: second-price (Vickrey) or first-price? | Second-price / First-price |
| Q12 | Is bid floor configurable per slot type and market from admin? | Yes / No |
| Q13 | Does verification status (verified badge) affect Quality Score in ranking? | Yes / No |

### 3.4 Reporting & Analytics

| # | Question | Options |
|---|---|---|
| Q14 | What impression/click metrics are tracked and surfaced to providers? | Impressions only / Impressions + clicks / Full funnel |
| Q15 | Is there a provider-facing ad performance dashboard? | Yes / No |
| Q16 | Are ad clicks tracked through to subscription conversion (attribution)? | Yes / No |

### 3.5 Compliance

| # | Question | Options |
|---|---|---|
| Q17 | Are sponsored results always visually labeled ("Sponsored") to users? | Yes (required) / Optional |
| Q18 | Are there content review/approval requirements before an ad goes live? | Yes / No |
| Q19 | Are competitor-targeting rules needed (e.g. a gym can't target rival gym keywords)? | Yes / No |

---

## 4. Proposed Data Model (Draft — not final)

- **`AdCampaign`** — provider campaign record (organization_id, slot_type,
  target_location, target_category, start_date, end_date, budget, status,
  spend_to_date).
- **`AdSlotDefinition`** — admin-managed catalog of available slot types, max
  concurrent placements, pricing, and market availability.
- **`AdImpression`** — event log of each impression served (campaign_id,
  user_id or anonymous, timestamp, slot, search_query). Used for billing and
  reporting.
- **`AdClick`** — event log of clicks through to provider profile from a
  sponsored slot.

---

## 5. Proposed API Endpoints (Draft)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/ads/slots` | Provider | Available slot types and pricing for provider's market |
| `POST` | `/ads/campaigns` | Provider | Create a new ad campaign |
| `GET` | `/ads/campaigns` | Provider | List own campaigns with performance metrics |
| `PATCH` | `/ads/campaigns/:id` | Provider | Update or pause a campaign |
| `GET` | `/ads/campaigns/:id/stats` | Provider | Impressions, clicks, spend for a campaign |
| `GET` | `/marketplace/search?sponsored=true` | Internal | Search service resolves sponsored slots into results (internal use only) |
| `GET` | `/admin/ads/campaigns` | Admin | Platform-wide campaign audit |
| `GET` | `/admin/ads/slots` | Admin | Manage slot definitions and pricing |
| `POST` | `/admin/ads/slots` | Admin | Create slot type |
| `PATCH` | `/admin/ads/slots/:id` | Admin | Update slot pricing or availability |

---

## 6. Frontend Changes (Draft)

- **"Promote" CTA** on provider listing management page — opens campaign
  creation flow.
- **Campaign dashboard** at `/dashboard/[role]/promotions` — list of active
  and past campaigns with spend/impression summary.
- **Sponsored slot rendering** in `ExploreListingCard` — top-of-results badge
  and "Sponsored" label for winning campaign listings.
- **Admin ad management panel** at `/admin/ads` — slot editor, campaign
  review queue (if approval required), billing reconciliation.

---

## 7. Dependencies & Risks

- Sponsored slot selection logic sits inside the search/discovery service.
  If the search infrastructure is simple (MongoDB text search), slot injection
  is manageable. If search moves to Elasticsearch or Algolia, the injection
  layer needs to be adapted.
- Click/impression tracking can generate very high write volumes at scale —
  may require a separate events pipeline (e.g. write to a queue, batch-flush
  to DB) rather than synchronous API writes.
- "Sponsored" labeling is a regulatory requirement in many markets (ASA, FTC).
  Non-negotiable from a compliance standpoint.

---

## 8. Build Plan (Placeholder)

Sprint breakdown and estimates to be defined once open questions §3 are answered.

Rough estimate: **12–18 dev-days** for fixed-rate self-serve model; significantly
more if auction bidding is chosen.
