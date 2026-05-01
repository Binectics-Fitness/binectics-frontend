# Provider SaaS Billing — Technical Specification

**Status**: Draft for review  
**Last updated**: May 2026  
**Authors**: Engineering  
**Related roadmap phase**: Phase 2 (Q3–Q4 2026)

---

## 1. Problem Statement

Every provider (Gym Owner, Trainer, Dietitian) currently has access to all
platform features for free and with no usage limits. There is no infrastructure
for providers to pay Binectics a monthly/annual SaaS fee, no tier-based
feature gating, and the public pricing page shows tiers that are not yet
enforced.

This spec covers everything needed to ship a three-tier provider billing model
(Free / Pro / Enterprise) backed by Stripe Billing.

---

## 2. Open Questions

> **These must be answered before backend implementation begins. Decisions
> are marked with 🔲 (unresolved) or ✅ (resolved).**

### 2.1 Tier Limits

| # | Question | Options | Decision |
|---|---|---|---|
| Q1 | Free tier max active **members** per org | 5 / 10 / 25 / unlimited | 🔲 |
| Q2 | Free tier max active **membership plans** per org | 1 / 2 / 3 | 🔲 |
| Q3 | Free tier max **staff** members (team invites) | 0 (none) / 1 / 2 | 🔲 |
| Q4 | Free tier: access to **analytics** dashboard? | Yes (read-only) / No | 🔲 |
| Q5 | Free tier: access to **consultations** (availability + bookings)? | Yes / No | 🔲 |
| Q6 | Free tier: access to **journals** (client progress)? | Yes / No | 🔲 |
| Q7 | Free tier: access to **QR check-in**? | Yes / No | 🔲 |
| Q8 | Pro tier max active members per org | 100 / 500 / unlimited | 🔲 |
| Q9 | Pro tier max **listings** (locations) per org | 1 / 3 / 5 | 🔲 |
| Q10 | Pro tier max staff members | 10 / 25 / unlimited | 🔲 |
| Q11 | Enterprise tier: is listing count truly unlimited or capped (e.g. 50)? | Unlimited / 50 | 🔲 |
| Q12 | Enterprise tier: API key access (provider webhook/API integrations)? | Yes / No (defer) | 🔲 |

### 2.2 Pricing

| # | Question | Options | Decision |
|---|---|---|---|
| Q13 | Gym Owner Pro price | $49 / $99 / $149 /month | 🔲 |
| Q14 | Gym Owner Enterprise price | $199 / $299 /month | 🔲 |
| Q15 | Trainer Pro price | $29 / $49 /month | 🔲 |
| Q16 | Dietitian Pro price | $29 / $49 /month | 🔲 |
| Q17 | Annual discount percentage | 15% / 20% / 25% | 🔲 |
| Q18 | Regional pricing (e.g. Africa price-point, INR tier)? | Yes / No | 🔲 |
| Q19 | 14-day Pro trial on signup? | Yes / No | 🔲 |
| Q20 | Free-forever free tier, or time-limited trial only? | Free-forever / Trial only | 🔲 |

### 2.3 Behaviour

| # | Question | Options | Decision |
|---|---|---|---|
| Q21 | When a Pro org exceeds the free limit on members (e.g. 10→11), do we **hard-block** new enrollments or **soft-warn**? | Block API / Warn + Allow | 🔲 |
| Q22 | Downgrade scenario: if a Pro org has 15 staff and downgrades to Free (max 2), existing staff: **freeze** (read-only) or **delete**? | Freeze access / Keep active until billing period end / Delete | 🔲 |
| Q23 | Grace period after subscription expiry before features are locked? | 0 days / 3 days / 7 days | 🔲 |
| Q24 | Who manages provider subscription? Owner only, or any `MANAGE_ORGANIZATION` team member? | Owner only / Any admin | 🔲 |
| Q25 | Stripe is for global; use Paystack/Flutterwave for provider-to-Binectics billing in Africa, or Stripe-only? | Stripe only / All gateways | 🔲 |

---

## 3. Proposed Tier Model

_Subject to open questions above. Below is the recommended default if all
questions were answered today._

| Feature | Free | Pro | Enterprise |
|---|---|---|---|
| Marketplace listing | 1 | 1 | Up to 5 |
| Active members | Up to 10 | Up to 200 | Unlimited |
| Active membership plans | 2 | Unlimited | Unlimited |
| Staff team members | 0 | 10 | Unlimited |
| Analytics dashboard | ❌ | ✅ | ✅ |
| QR check-in | ✅ | ✅ | ✅ |
| Consultations & bookings | ✅ | ✅ | ✅ |
| Client journals | ✅ | ✅ | ✅ |
| Custom payment gateway keys | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ✅ |
| API key access | ❌ | ❌ | ✅ (defer) |
| White-label | ❌ | ❌ | ❌ (defer) |

---

## 4. Architecture Overview

### 4.1 New Backend Entities / Fields

#### 4.1.1 New enum: `ProviderPlanTier`
```typescript
// src/core/enums/provider-plan-tier.enum.ts
export enum ProviderPlanTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}
```

#### 4.1.2 New enum: `ProviderSubscriptionStatus`
```typescript
// src/core/enums/provider-subscription-status.enum.ts
export enum ProviderSubscriptionStatus {
  TRIALING = 'trialing',        // within free trial window
  ACTIVE = 'active',            // payment up to date
  PAST_DUE = 'past_due',        // payment failed, grace period
  CANCELLED = 'cancelled',      // voluntarily cancelled
  EXPIRED = 'expired',          // grace period elapsed
}
```

#### 4.1.3 New fields on `Organization`
```typescript
// Added to src/core/entities/organization.entity.ts
@Prop({ enum: Object.values(ProviderPlanTier), default: ProviderPlanTier.FREE })
plan_tier: ProviderPlanTier;

@Prop({ enum: Object.values(ProviderSubscriptionStatus),
  default: ProviderSubscriptionStatus.ACTIVE })
subscription_status: ProviderSubscriptionStatus;

@Prop({ default: null })
subscription_current_period_end: Date | null;  // null = never expires (free tier)

@Prop({ default: null })
subscription_trial_end: Date | null;

@Prop({ default: null })
stripe_customer_id: string | null;

@Prop({ default: null })
stripe_subscription_id: string | null;

@Prop({ default: null })
subscription_cancelled_at: Date | null;
```

**No migration needed.** Mongoose adds new optional fields transparently;
existing orgs get `plan_tier: 'free'` on first read.

#### 4.1.4 New collection: `ProviderInvoice`
```typescript
// src/core/entities/provider-invoice.entity.ts
@Schema({ collection: 'provider_invoices' })
export class ProviderInvoice extends BaseEntity {
  organization_id: Types.ObjectId   // ref Organization
  stripe_invoice_id: string         // Stripe's inv_ ID
  stripe_payment_intent_id?: string
  amount_due: number                // in cents
  amount_paid: number
  currency: string                  // 'usd'
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  period_start: Date
  period_end: Date
  hosted_invoice_url?: string
  pdf_url?: string
  created_at: Date
}
```

---

### 4.2 New Backend Module: `ProviderBilling`

Location: `src/provider-billing/`

```
provider-billing/
  provider-billing.module.ts
  provider-billing.controller.ts     # REST endpoints (see §4.3)
  provider-billing.service.ts        # core logic
  provider-billing.webhook.ts        # Stripe webhook handler (separate controller)
  dto/
    create-checkout-session.dto.ts
    update-subscription.dto.ts
  guards/
    billing-tier.guard.ts            # checks plan_tier + status on route
  decorators/
    require-tier.decorator.ts        # @RequireTier(ProviderPlanTier.PRO)
```

#### 4.2.1 Tier limits config
```typescript
// src/provider-billing/tier-limits.config.ts
export const TIER_LIMITS = {
  [ProviderPlanTier.FREE]: {
    maxActiveMembers: 10,          // Q1 🔲
    maxMembershipPlans: 2,         // Q2 🔲
    maxStaffMembers: 0,            // Q3 🔲
    maxListings: 1,
    analyticsEnabled: false,       // Q4 🔲
    customPaymentGateway: false,
  },
  [ProviderPlanTier.PRO]: {
    maxActiveMembers: 200,         // Q8 🔲
    maxMembershipPlans: Infinity,
    maxStaffMembers: 10,           // Q10 🔲
    maxListings: 1,                // Q9 🔲
    analyticsEnabled: true,
    customPaymentGateway: true,
  },
  [ProviderPlanTier.ENTERPRISE]: {
    maxActiveMembers: Infinity,
    maxMembershipPlans: Infinity,
    maxStaffMembers: Infinity,
    maxListings: 5,                // Q11 🔲
    analyticsEnabled: true,
    customPaymentGateway: true,
  },
} as const;
```

---

### 4.3 New API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/provider-billing/checkout` | Provider | Create Stripe Checkout Session for new/upgrade |
| `POST` | `/provider-billing/portal` | Provider | Stripe Customer Portal (manage/cancel) |
| `GET` | `/provider-billing/status` | Provider | Current tier, status, period end, next invoice |
| `GET` | `/provider-billing/invoices` | Provider | List past ProviderInvoice records |
| `POST` | `/provider-billing/webhook` | Stripe signature | Stripe webhook (unauthed, signature-verified) |

#### `POST /provider-billing/checkout` request
```typescript
{
  tier: 'pro' | 'enterprise';
  interval: 'month' | 'year';
  organizationId: string;  // validated: caller must be owner
  successUrl: string;
  cancelUrl: string;
}
```

#### `GET /provider-billing/status` response
```typescript
{
  organizationId: string;
  tier: ProviderPlanTier;
  status: ProviderSubscriptionStatus;
  currentPeriodEnd: string | null;  // ISO 8601
  trialEnd: string | null;
  stripePortalUrl: string | null;   // only when active subscription exists
  limits: typeof TIER_LIMITS[tier];
  usage: {
    activeMembers: number;
    membershipPlans: number;
    staffMembers: number;
    listings: number;
  };
}
```

---

### 4.4 Stripe Integration Details

#### 4.4.1 Stripe Products & Prices (setup once in Stripe Dashboard)

| Product | Price ID env var | Amount | Interval |
|---|---|---|---|
| Binectics Pro (Gym Owner) | `STRIPE_PRICE_GYM_PRO_MONTHLY` | Q13 🔲 | Monthly |
| Binectics Pro (Gym Owner) | `STRIPE_PRICE_GYM_PRO_ANNUAL` | Q13×12×(1-discount) | Annual |
| Binectics Enterprise | `STRIPE_PRICE_GYM_ENT_MONTHLY` | Q14 🔲 | Monthly |
| Binectics Pro (Trainer) | `STRIPE_PRICE_TRAINER_PRO_MONTHLY` | Q15 🔲 | Monthly |
| Binectics Pro (Dietitian) | `STRIPE_PRICE_DIETITIAN_PRO_MONTHLY` | Q16 🔲 | Monthly |

#### 4.4.2 Checkout flow
1. Frontend calls `POST /provider-billing/checkout` with `tier`, `interval`, `organizationId`.
2. Backend creates a `stripe.customers.create` (or retrieves existing by `stripe_customer_id`) with `metadata: { organizationId }`.
3. Backend creates `stripe.checkout.sessions.create` with `mode: 'subscription'`, correct `price`, and `allow_promotion_codes: true` (for regional pricing, Q18 🔲).
4. Frontend redirects to `session.url`.
5. On `successUrl` return, frontend queries `GET /provider-billing/status` to confirm tier change.

#### 4.4.3 Webhook events handled

| Event | Action |
|---|---|
| `checkout.session.completed` | Set `plan_tier`, `subscription_status: ACTIVE`, `stripe_subscription_id`, `current_period_end` on org |
| `invoice.paid` | Create `ProviderInvoice` record with `status: paid`; set `subscription_status: ACTIVE` |
| `invoice.payment_failed` | Set `subscription_status: PAST_DUE`; trigger email to provider |
| `customer.subscription.updated` | Sync tier on plan change (upgrade/downgrade via portal) |
| `customer.subscription.deleted` | Set `subscription_status: CANCELLED`; start grace-period clock |
| `customer.subscription.trial_will_end` | Send 3-day warning email |

All webhook events are idempotent (lookup by `stripe_subscription_id` before writing).

#### 4.4.4 New environment variables (backend)
```env
STRIPE_SECRET_KEY=sk_live_...         # already used
STRIPE_WEBHOOK_SECRET=whsec_...       # new: for provider billing webhook
STRIPE_PRICE_GYM_PRO_MONTHLY=price_...
STRIPE_PRICE_GYM_PRO_ANNUAL=price_...
STRIPE_PRICE_GYM_ENT_MONTHLY=price_...
STRIPE_PRICE_GYM_ENT_ANNUAL=price_...
STRIPE_PRICE_TRAINER_PRO_MONTHLY=price_...
STRIPE_PRICE_TRAINER_PRO_ANNUAL=price_...
STRIPE_PRICE_DIETITIAN_PRO_MONTHLY=price_...
STRIPE_PRICE_DIETITIAN_PRO_ANNUAL=price_...
```

---

### 4.5 Feature Gating (Enforcement)

#### 4.5.1 BillingTierGuard

```typescript
// guards/billing-tier.guard.ts
// Usage: @RequireTier(ProviderPlanTier.PRO)
// Applied at controller method level; reads org.plan_tier from DB (1 query, cached 60s)
// Throws 402 PaymentRequired with body: { code: 'UPGRADE_REQUIRED', requiredTier: 'pro' }
```

#### 4.5.2 Quota enforcement (inline service checks)

Applied inside service methods that create resources:

| Service | Method | Check |
|---|---|---|
| `MarketplaceService` | `manuallyEnrollMember` | Active member count < `TIER_LIMITS[tier].maxActiveMembers` |
| `MarketplaceService` | `createMembershipPlan` | Plan count < `TIER_LIMITS[tier].maxMembershipPlans` |
| `TeamsService` | `inviteMember` | Staff count < `TIER_LIMITS[tier].maxStaffMembers` |
| `MarketplaceService` | `createOrgListing` | Listing count < `TIER_LIMITS[tier].maxListings` (replaces unique index) |

Error response when quota exceeded:
```json
{
  "statusCode": 402,
  "code": "QUOTA_EXCEEDED",
  "resource": "active_members",
  "limit": 10,
  "current": 10,
  "requiredTier": "pro"
}
```

#### 4.5.3 Analytics gating

`GET /marketplace/organizations/:id/analytics` → if `analyticsEnabled === false` for org's tier, return `402` with `code: UPGRADE_REQUIRED`.

---

### 4.6 Multi-listing change

Currently a Mongoose unique index on `{ organization_id: 1 }` prevents more than one listing per org. For Pro/Enterprise multi-location support:

1. **Drop** the unique index on `marketplace_listings.organization_id`.
2. Replace it with a **runtime quota check** in `createOrgListing` using `TIER_LIMITS[tier].maxListings`.
3. Add a **compound index** on `{ organization_id: 1, is_active: 1 }` for the count query.

This is the only schema migration needed for multi-listing (no data loss; existing orgs still have 1 listing each).

---

## 5. Frontend Changes

### 5.1 New API service: `providerBillingService`

```typescript
// src/lib/api/provider-billing.ts
export const providerBillingService = {
  getStatus(organizationId: string): Promise<ApiResponse<ProviderBillingStatus>>,
  createCheckoutSession(params: CreateCheckoutParams): Promise<ApiResponse<{ checkoutUrl: string }>>,
  createPortalSession(organizationId: string): Promise<ApiResponse<{ portalUrl: string }>>,
  getInvoices(organizationId: string): Promise<ApiResponse<ProviderInvoice[]>>,
}
```

### 5.2 New pages

| Route | Purpose |
|---|---|
| `/dashboard/[role]/billing` | Provider billing overview (current tier, usage meters, upgrade CTA, invoices) |

#### Billing page sections:
1. **Current plan card** — tier badge, status pill, renewal date or "Free forever", "Manage subscription" button (→ Stripe portal) or "Upgrade" CTA.
2. **Usage meters** — 4 progress bars: Active members `n/10`, Plans `n/2`, Staff `n/0`, Listings `n/1`. Shows "Upgrade to increase limits" when ≥80% used.
3. **Invoices table** — date, amount, status (`paid` green / `open` yellow), PDF link.
4. **Plan comparison** — same table as §3 above, with current plan highlighted.

### 5.3 Pricing page wiring

Current state: CTAs link to `/register/gym` etc. with no tier selection.

Required changes:
1. Add tier selection state (`free` / `pro` / `enterprise`) to each card CTA.
2. For unauthenticated visitors: CTAs go to `/register/[role]?tier=pro` (stored in query param, passed through registration flow, applied on first org creation).
3. For authenticated providers already on free: CTA calls `POST /provider-billing/checkout` directly and redirects to Stripe.

### 5.4 "Upgrade required" empty states

When a gated action returns `402 QUOTA_EXCEEDED` or `402 UPGRADE_REQUIRED`, all relevant pages show an inline upgrade prompt instead of a form error:

```
┌─────────────────────────────────────────────────────────┐
│  🔒  You've reached the Free plan limit                 │
│  Upgrade to Pro to add unlimited members.               │
│                                                         │
│  [View plans]   [Upgrade now →]                         │
└─────────────────────────────────────────────────────────┘
```

Pages requiring upgrade-state handling:
- `/dashboard/[role]/members` — member cap
- `/dashboard/[role]/plans` — plan cap
- `/dashboard/[role]/staff` — staff cap
- `/dashboard/[role]/analytics` — analytics gated
- `/dashboard/[role]/consultations` — consultations (if gated, Q5 🔲)

### 5.5 Sidebar billing link

Add "Billing" nav item to all three provider sidebars (`TrainerSidebar`, `DietitianSidebar`, `GymOwnerSidebar`) with a `CreditCard` Lucide icon. Show a "PRO" or "FREE" badge next to it so tier is always visible.

---

## 6. Email Notifications

New transactional emails required (via existing Mailer module):

| Trigger | Subject | To |
|---|---|---|
| Checkout completed (first time) | "Welcome to Binectics Pro 🎉" | Provider |
| Trial ending in 3 days | "Your Pro trial ends in 3 days" | Provider |
| Invoice paid | "Payment confirmed – [month] invoice" | Provider |
| Payment failed (first attempt) | "Action required: payment failed" | Provider |
| Subscription cancelled | "Your Pro plan has been cancelled" | Provider |
| Grace period end (features locked) | "Your Pro features have been paused" | Provider |
| Upgrade from portal (plan changed) | "You've upgraded to Enterprise ✓" | Provider |

---

## 7. Build Plan

Assuming open questions in §2 are answered, suggested sequence:

### Sprint 1 — Backend foundations (4–5 days)
- [ ] New enums: `ProviderPlanTier`, `ProviderSubscriptionStatus`
- [ ] Add fields to `Organization` entity
- [ ] `ProviderInvoice` entity
- [ ] `TIER_LIMITS` config
- [ ] `ProviderBillingModule` scaffold (service, controller, DTOs)
- [ ] `GET /provider-billing/status` endpoint (returns free tier for all; no Stripe yet)
- [ ] Unit tests for tier-limits config and status endpoint

### Sprint 2 — Stripe Billing integration (4–5 days)
- [ ] Create Stripe Products + Prices in dashboard; add env vars
- [ ] `POST /provider-billing/checkout` → Stripe Checkout Session
- [ ] `POST /provider-billing/portal` → Stripe Customer Portal
- [ ] Stripe webhook handler for all events in §4.4.3
- [ ] `ProviderInvoice` write on `invoice.paid`
- [ ] Unit tests for webhook handler (mocked Stripe events)

### Sprint 3 — Feature gating (3–4 days)
- [ ] `BillingTierGuard` + `@RequireTier` decorator
- [ ] Quota checks in `MarketplaceService.manuallyEnrollMember`
- [ ] Quota checks in `MarketplaceService.createMembershipPlan`
- [ ] Quota checks in `TeamsService.inviteMember`
- [ ] Drop unique listing index; add runtime quota check in `createOrgListing`
- [ ] Analytics endpoint gating
- [ ] Integration tests for quota boundary behaviour

### Sprint 4 — Frontend (4–5 days)
- [ ] `providerBillingService` API client
- [ ] `/dashboard/[role]/billing` page (all three role variants share same component)
- [ ] Pricing page: wire CTAs to checkout or register-with-tier
- [ ] "Upgrade required" empty state component (reused across all gated pages)
- [ ] Sidebar billing links + tier badge

### Sprint 5 — Email + QA (2–3 days)
- [ ] Billing email templates in Mailer module
- [ ] End-to-end test: free → Stripe Checkout → Pro → quota enforced → portal → cancel → grace period
- [ ] Manual QA on all three account types (Gym Owner, Trainer, Dietitian)

**Total estimate: ~18–22 dev-days.** Can compress to ~3 weeks with one focused engineer.

---

## 8. Testing Strategy

| Layer | What to test |
|---|---|
| Unit | `TIER_LIMITS` config, `ProviderBillingService` methods, `BillingTierGuard` logic |
| Unit | Webhook handler: each event type in isolation, idempotency re-runs |
| Integration | Checkout → webhook → org tier update flow (mocked Stripe) |
| Integration | Quota enforcement at boundary (n-1, n, n+1 resources) |
| E2E | Free → Pro upgrade via Stripe test-mode; downgrade via portal; expiry locking |

---

## 9. Not In Scope (This Spec)

- Paystack/Flutterwave for provider-to-Binectics payments (Q25 🔲; Stripe-only for SaaS billing simplicity)
- White-label features
- API key issuance for Enterprise tier
- e-Commerce / store setup
- Regional pricing tiers (Q18 🔲; Stripe coupon codes can bridge this without code changes)
- Metered billing (per-check-in or per-booking pricing models)

---

## 10. Appendix: Affected Files

### Backend — new files
- `src/core/enums/provider-plan-tier.enum.ts`
- `src/core/enums/provider-subscription-status.enum.ts`
- `src/core/entities/provider-invoice.entity.ts`
- `src/provider-billing/` (entire module)

### Backend — modified files
- `src/core/entities/organization.entity.ts` — new fields
- `src/marketplace/marketplace.service.ts` — quota checks, drop unique listing constraint
- `src/teams/teams.service.ts` — staff quota check
- `src/mailer/` — new email templates

### Frontend — new files
- `src/lib/api/provider-billing.ts`
- `src/app/dashboard/gym-owner/billing/page.tsx`
- `src/app/dashboard/trainer/billing/page.tsx`
- `src/app/dashboard/dietitian/billing/page.tsx`
- `src/components/ProviderBillingManager.tsx` (shared by all 3 billing pages)
- `src/components/UpgradeRequired.tsx`

### Frontend — modified files
- `src/app/pricing/page.tsx` — wire CTAs
- `src/components/GymOwnerSidebar.tsx` — billing link
- `src/components/TrainerSidebar.tsx` — billing link
- `src/components/DietitianSidebar.tsx` — billing link
- `src/app/dashboard/[role]/members/page.tsx` — upgrade state
- `src/app/dashboard/[role]/plans/page.tsx` — upgrade state
- `src/app/dashboard/[role]/staff/page.tsx` — upgrade state
- `src/app/dashboard/[role]/analytics/page.tsx` — upgrade state
