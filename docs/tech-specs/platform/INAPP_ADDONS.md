# In-App Purchases & Platform Add-Ons — Technical Specification

**Status**: Stub — not yet ready for implementation  
**Last updated**: May 2026  
**Authors**: Engineering  
**Related roadmap phase**: Phase 3–4 (post-SaaS billing)  
**Depends on**: `PROVIDER_SAAS_BILLING.md` (tier model, gateway router)

---

## 1. Problem Statement

Beyond the recurring SaaS subscription, providers and potentially end-users
should be able to purchase discrete platform features à la carte. The planning
doc identifies four initial categories: Verified Badges, advanced analytics
dashboards, auto client-assignment rules, and custom booking/nutrition
automation forms.

None of these are currently purchasable. There is no add-on catalog, no
one-time or recurring add-on billing, and no feature activation on purchase.

---

## 2. Planned Add-On Categories

### 2.1 Verified Badge

- Adds a platform-issued trust badge to the provider's public listing.
- Increases ranking priority in search results.
- One-time fee or annual renewal (to be decided).
- Existing verification workflow (document upload + admin approval) is a
  prerequisite — the badge purchase does not bypass document review.

### 2.2 Advanced Analytics Dashboard

- Unlocks deeper analytics beyond the Pro-tier standard dashboard.
- Could include: cohort retention, revenue forecasting, check-in heatmaps,
  client churn signals.
- Likely a recurring monthly add-on on top of existing Pro/Enterprise plan.
- Mutually exclusive with Enterprise plan if Enterprise already includes it
  (to be resolved in tier comparison).

### 2.3 Auto Client Assignment Rules (AI-based, future)

- Allows providers to define rules that automatically assign incoming clients
  or consultation requests to specific staff members.
- Deferred to a future AI/automation phase.
- Noted here for completeness; not to be built in this spec.

### 2.4 Custom Booking & Nutrition Automation Forms

- Providers can build custom intake forms, booking questionnaires, or nutrition
  assessment flows using a form builder.
- Could be a flat per-form fee or an unlimited-forms add-on subscription.
- The existing `Forms` module (`src/forms/`) is the backend foundation.

---

## 3. Open Questions

> All questions below are **unresolved (🔲)**. They must be answered before
> implementation begins.

### 3.1 Pricing & Billing Model

| # | Question | Options |
|---|---|---|
| Q1 | Are add-ons one-time purchases, recurring subscriptions, or both depending on the add-on? | One-time only / Recurring only / Per-add-on |
| Q2 | Are add-ons additive on top of any tier (Free + Badge), or restricted to paid tiers only? | Any tier / Paid tiers only |
| Q3 | If an add-on is recurring and the provider cancels their plan, does the add-on also cancel? | Yes / No / Configurable |
| Q4 | Are add-ons priced per-market/currency like plan tiers? | Yes (market-specific) / Global flat |
| Q5 | Verified Badge: one-time fee, or annual renewal? | One-time / Annual |
| Q6 | Advanced Analytics: monthly add-on, or included in Enterprise? | Monthly add-on / Enterprise only |
| Q7 | Custom Forms: per-form limit on lower tiers, or unlimited as an add-on? | Per-form limit / Unlimited add-on |

### 3.2 Fulfillment & Activation

| # | Question | Options |
|---|---|---|
| Q8 | Verified Badge purchase — does it auto-activate on payment, or still require admin approval of docs? | Auto-activate / Requires doc approval first |
| Q9 | If a provider's plan downgrades and they lose an add-on feature — is access frozen immediately or at period end? | Immediate / Period end |
| Q10 | Is there an add-on trial period (e.g. 7-day free analytics trial)? | Yes / No |

### 3.3 Admin Configurability

| # | Question | Options |
|---|---|---|
| Q11 | Is the add-on catalog admin-managed in the same admin panel as SaaS tiers? | Yes (same panel) / Separate section |
| Q12 | Can admin grant free add-ons to specific providers (e.g. for beta testing or compensation)? | Yes / No |

---

## 4. Proposed Data Model (Draft — not final)

- **`AddOnDefinition`** — catalog of purchasable add-ons (name, description,
  billing model, feature key, is_active, market prices).
- **`ProviderAddOnSubscription`** — per-org record of an activated add-on
  (add_on_id, organization_id, status, period_end, gateway reference).
- New fields on **`Organization`** — `active_add_ons: string[]` (feature keys)
  for fast guard lookups without joining add-on subscription records.

---

## 5. Proposed API Endpoints (Draft)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/provider-billing/add-ons` | Provider | List available add-ons with pricing for provider's market |
| `POST` | `/provider-billing/add-ons/:addOnId/checkout` | Provider | Purchase or subscribe to an add-on |
| `DELETE` | `/provider-billing/add-ons/:addOnId` | Provider | Cancel recurring add-on |
| `GET` | `/admin/provider-billing/add-ons` | Admin | Manage add-on catalog |
| `POST` | `/admin/provider-billing/add-ons` | Admin | Create add-on |
| `PATCH` | `/admin/provider-billing/add-ons/:id` | Admin | Update add-on (pricing, status) |
| `POST` | `/admin/provider-billing/add-ons/grant` | Admin | Grant a free add-on to a specific org |

---

## 6. Frontend Changes (Draft)

- **Add-ons section** on `/dashboard/[role]/billing` — list of available
  add-ons with price and a "Purchase" or "Active" state per item.
- **Verified Badge add-on card** — shows prerequisite verification status,
  purchase CTA, and badge preview once active.
- **Admin add-on catalog panel** at `/admin/billing/add-ons`.

---

## 7. Dependencies & Risks

- Verified Badge feature key must be respected by the existing verification
  workflow — tight coupling between `VerificationModule` and billing.
- Advanced Analytics add-on may overlap with Enterprise tier features — tier
  comparison table needs updating before launch.
- Custom forms add-on depends on the `Forms` module reaching a stable public API.

---

## 8. Build Plan (Placeholder)

Sprint breakdown and estimates to be defined once open questions §3 are answered.

Rough estimate: **8–12 dev-days** (excludes AI-based client assignment, which is a separate future effort).
