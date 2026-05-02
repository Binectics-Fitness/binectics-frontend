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

This spec covers everything needed to ship a provider SaaS billing system that is:

1. Plug-and-play across gateways (Paystack primary, with fallback routing).
2. Admin-configurable for tier definitions and limits (no hardcoded pricing rules).
3. Market-aware so pricing and gateway preference can vary by provider location.
4. White-label capable for eligible tiers.

---

## 2. Open Questions

> **These must be answered before backend implementation begins. Decisions
> are marked with 🔲 (unresolved) or ✅ (resolved).**

### 2.1 Tier Limits (Non-Blocking)

Tier limits are now database/admin-driven via `ProviderPlanDefinition`, so they
are not a hard pre-implementation blocker. Initial values should be seeded from
the current proposed tier model in Section 3 and then tuned via admin.

### 2.2 Pricing

Pricing, currency, country/market mapping, discounts, and trial lengths are
admin-configured and stored in `ProviderPlanMarketPrice` and
`BillingMarketRule`. No fixed prices or discounts are hardcoded in backend
services.

| # | Question | Options | Decision |
|---|---|---|---|
| Q13 | Gym Owner Pro price | $49 / $99 / $149 /month | ✅ Admin-configured per market/country and currency |
| Q14 | Gym Owner Enterprise price | $199 / $299 /month | ✅ Admin-configured per market/country and currency |
| Q15 | Trainer Pro price | $29 / $49 /month | ✅ Admin-configured per market/country and currency |
| Q16 | Dietitian Pro price | $29 / $49 /month | ✅ Admin-configured per market/country and currency |
| Q17 | Annual discount percentage | 15% / 20% / 25% | ✅ Admin-configured per plan, interval, and market |
| Q18 | Regional pricing (e.g. Africa price-point, INR tier)? | Yes / No | ✅ Yes; market-specific pricing is required |
| Q19 | 14-day Pro trial on signup? | Yes / No | ✅ Trial supported; duration is admin-configured per plan/market |
| Q20 | Free-forever free tier, or time-limited trial only? | Free-forever / Trial only | ✅ Time-limited trial; duration configurable from admin |

### 2.3 Behaviour

| # | Question | Options | Decision |
|---|---|---|---|
| Q21 | When a Pro org exceeds the free limit on members (e.g. 10→11), do we **hard-block** new enrollments or **soft-warn**? | Block API / Warn + Allow | ✅ Warn + Allow; show a prominent persistent warning banner |
| Q22 | Downgrade scenario: if a Pro org has 15 staff and downgrades to Free (max 2), existing staff: **freeze** (read-only) or **delete**? | Freeze access / Keep active until billing period end / Delete | ✅ Keep active until current billing period ends, then freeze (never delete) |
| Q23 | Grace period after subscription expiry before features are locked? | 0 days / 3 days / 7 days | ✅ 3 days; configurable via `BillingMarketRule` |
| Q24 | Who manages provider subscription? Owner only, or any `MANAGE_ORGANIZATION` team member? | Owner only / Any admin | ✅ Owner only in v1; can be relaxed via team permissions later |
| Q25 | For provider SaaS billing gateway policy, should default priority be Paystack -> Flutterwave -> Stripe? | Yes / No | ✅ Yes |

### 2.4 Admin Configurability and Market Rules

| # | Question | Options | Decision |
|---|---|---|---|
| Q26 | Who can create/update provider tiers? | Super Admin only / Finance Admin + Super Admin | ✅ Extend admin model with RBAC permissions; tier/price management requires `billing:write` permission |
| Q27 | Can prices be changed for existing subscriptions immediately? | Immediate / Next renewal only / Per-plan flag | ✅ Next renewal only; existing subscriptions are never repriced mid-cycle |
| Q28 | Market resolution source for pricing | Business registration country / User profile country / Billing address country | ✅ Organization country (business); not all users have an org — fall back to user profile country |
| Q29 | If user country and business country differ, which wins? | Business country / User country / Explicit market override | ✅ Business (Organization) country wins; fall back to user profile country if org country absent; admin can pin market override on org |
| Q30 | Market-scoped gateway priority configurable from admin? | Yes / No | ✅ Yes; `BillingMarketRule.gateway_priority[]` is editable from the admin billing panel |
| Q31 | If primary gateway is down, auto-fallback to next gateway? | Yes (automatic) / No (manual failover) | ✅ Yes; `GatewayRouterService` auto-falls back to next in priority list |
| Q32 | Do we allow market-specific currency overrides per tier? | Yes / No | ✅ Yes; already supported by `ProviderPlanMarketPrice.currency` per market row |

### 2.5 White-Label Decisions

| # | Question | Options | Decision |
|---|---|---|---|
| Q33 | Which tier includes white-label? | Enterprise only / Pro + Enterprise | ✅ Enterprise only |
| Q34 | Include custom domain support? | Yes / No | ✅ Yes |
| Q35 | Include branded email sender support? | Yes / No | ✅ Yes |
| Q36 | Include branded mobile app scope in this phase? | Web only / Web + Mobile | ✅ Web only |
| Q37 | Is white-label self-serve or admin-approved? | Self-serve / Admin-approved | ✅ Admin-approved |

### 2.6 Decision Log (Recommended Defaults)

These defaults are recommended for implementation kickoff and can be changed
before build starts.

| Decision | Recommendation | Rationale |
|---|---|---|
| Q33 | Enterprise only | Keeps premium differentiation and support load manageable in v1. |
| Q34 | Yes | Custom domain is the core enterprise white-label expectation. |
| Q35 | Yes | Branded sender identity is high-value with low implementation risk. |
| Q36 | Web only | Mobile rebranding introduces app-store and release complexity; defer to Phase 2. |
| Q37 | Admin-approved | Reduces abuse and protects DNS/email reputation during launch. |
| Q25 | Yes | Establishes deterministic fallback order and aligns with Paystack-first strategy. |
| Q13-Q16 | Prices are admin-defined per plan, market, and currency | Supports localized price points and avoids code deploys for pricing updates. |
| Q17 | Discount is admin-defined per plan/market/interval | Supports market campaigns and controlled annual incentives. |
| Q18 | Yes (regional pricing enabled) | Required for cross-market affordability and FX reality. |
| Q19 | Trial enabled, duration admin-defined | Supports controlled promotions and market-level trial tuning. |
| Q20 | Time-limited trial, admin-configurable duration | No free-forever tier; all providers start on a trial. Trial length is stored per plan/market in `ProviderPlanMarketPrice.trial_days`, not in code constants. |
| Q21 | Warn + Allow with prominent persistent dashboard banner | Avoids abrupt workflow interruption while making upgrade risk highly visible and actionable. |
| Q22 | Keep active until period end, then freeze | Industry standard (Stripe/Notion/Slack). Prevents accidental data loss. Deletion is never automatic. |
| Q26 | Extend `User` with `admin_permissions: string[]`; require `billing:write` for tier/price mutations | Flat `is_admin` boolean is insufficient for delegation. RBAC allows billing managers without full admin access. Initial permission set: `users:write`, `billing:write`, `content:write`, `platform:write`. |
| Q28 | Organization country is the market signal; fall back to user profile country | Billing is per-business. Fitness members without an org are billed at their profile country's market rate. |
| Q29 | Business country wins over user country; admin can set explicit market override on org | Prevents accidental market switching when an owner travels. Override field (`billing_market_code`) on Organization. |
| Q23 | 3-day grace period, configurable per market | Prevents immediate lockout on payment failure while limiting revenue leakage. |
| Q24 | Owner only in v1 | Keeps billing control with the account owner; reduces accidental plan changes by staff. |
| Q27 | Next renewal only | Prevents surprise mid-cycle repricing; gives providers a full cycle to plan for the change. |
| Q30 | Yes, gateway priority editable per market in admin | Allows ops to react to gateway issues or commercial agreements per region without a code deploy. |
| Q31 | Yes, auto-fallback in `GatewayRouterService` | Core reliability requirement; manual failover adds unacceptable operational overhead. |
| Q32 | Yes, currency is per `ProviderPlanMarketPrice` row | Required for market affordability — NGN, GHS, KES, USD cannot share the same number. |

---

## 3. Proposed Tier Model

Subject to open questions above. This table is a bootstrap default only.
Production behavior must be driven by admin-configured tier records and
market-specific prices, not code constants.

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
| White-label | ❌ | ❌ | ✅ |

---

## 4. Architecture Overview

### 4.0 Tier Identity Model (Hybrid)

Tier identities remain enum-based in code, while limits/features/pricing are DB-driven.

```typescript
// src/core/enums/provider-plan-tier.enum.ts
export enum ProviderPlanTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}
```

This gives both safety and flexibility:

1. Enum values are stable identifiers used by guards and contracts.
2. Tier behavior is read from `ProviderPlanDefinition` and `ProviderPlanMarketPrice`.
3. Admin can change limits/prices per market without code deploys.

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
  default: ProviderSubscriptionStatus.TRIALING })
subscription_status: ProviderSubscriptionStatus;

@Prop({ default: null })
subscription_current_period_end: Date | null;

@Prop({ default: null })
subscription_trial_end: Date | null;  // set from ProviderPlanMarketPrice.trial_days on org creation

@Prop({ default: null })
subscription_cancelled_at: Date | null;

@Prop({ default: null })
downgrade_frozen_at: Date | null;  // set when billing period ends post-downgrade; gates over-limit resources

// Gateway-agnostic customer/subscription references
@Prop({ default: null })
billing_gateway: 'paystack' | 'flutterwave' | 'stripe' | null;

@Prop({ default: null })
billing_customer_id: string | null;  // external customer id in billing_gateway

@Prop({ default: null })
billing_subscription_id: string | null;  // external subscription id in billing_gateway

// Market resolution override (admin-settable; Q29)
@Prop({ default: null })
billing_market_code: string | null;  // if set, overrides country-derived market
```

**No migration needed.** Mongoose adds new optional fields transparently;
existing orgs get `plan_tier: 'free'` and `subscription_status: 'trialing'` on first read.

#### 4.1.4 Admin RBAC extension on `User`

The current `is_admin: boolean` flag is a flat binary. To support delegated billing
management (Q26), `User` is extended with a permissions array:

```typescript
// Added to src/core/entities/user.entity.ts
@Prop({ type: [String], default: [] })
admin_permissions: AdminPermission[];  // only meaningful when is_admin = true
```

```typescript
// src/core/enums/admin-permission.enum.ts  (new file)
export enum AdminPermission {
  USERS_WRITE       = 'users:write',
  BILLING_WRITE     = 'billing:write',   // can create/update tiers, prices, market rules
  CONTENT_WRITE     = 'content:write',
  PLATFORM_WRITE    = 'platform:write',  // platform settings, feature flags
}
```

- All existing `is_admin: true` users are treated as having **all permissions** for backward compatibility.
- New admin endpoints that mutate billing config require `billing:write`.
- A new `@RequireAdminPermission(AdminPermission.BILLING_WRITE)` decorator guards those routes.
- Fitness members / providers never have `is_admin: true`; this field is irrelevant to them.

#### 4.1.5 New collection: `ProviderInvoice`
```typescript
// src/core/entities/provider-invoice.entity.ts
@Schema({ collection: 'provider_invoices' })
export class ProviderInvoice extends BaseEntity {
  organization_id: Types.ObjectId   // ref Organization
  gateway: 'paystack' | 'flutterwave' | 'stripe'
  external_invoice_id: string       // provider invoice id in selected gateway
  external_payment_id?: string      // charge/payment intent/transaction id
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

#### 4.1.6 New collection: `ProviderPlanDefinition` (admin-managed)
```typescript
// src/core/entities/provider-plan-definition.entity.ts
@Schema({ collection: 'provider_plan_definitions' })
export class ProviderPlanDefinition extends BaseEntity {
  code: ProviderPlanTier;          // enum-constrained key
  name: string;                    // admin-editable display name
  description?: string;
  is_active: boolean;
  sort_order: number;

  // Limits/features are data, not hardcoded config
  max_active_members: number | null;      // null = unlimited
  max_membership_plans: number | null;
  max_staff_members: number | null;
  max_listings: number | null;
  analytics_enabled: boolean;
  consultations_enabled: boolean;
  journals_enabled: boolean;
  qr_checkin_enabled: boolean;
  white_label_enabled: boolean;
  custom_domain_enabled: boolean;
  branded_email_enabled: boolean;
}
```

#### 4.1.7 New collection: `ProviderPlanMarketPrice` (admin-managed)
```typescript
// src/core/entities/provider-plan-market-price.entity.ts
@Schema({ collection: 'provider_plan_market_prices' })
export class ProviderPlanMarketPrice extends BaseEntity {
  plan_code: string;                      // ref ProviderPlanDefinition.code
  market_code: string;                    // e.g. 'GLOBAL', 'NG', 'GH', 'KE'
  currency: string;                       // ISO 4217
  amount_minor: number;                   // in minor units
  interval: 'month' | 'year';
  trial_days: number;
  discount_percent: number;
  is_active: boolean;

  // Optional gateway-specific product references
  gateway_prices: Array<{
    gateway: 'paystack' | 'flutterwave' | 'stripe';
    external_price_id: string;
    is_primary_for_market: boolean;
  }>;
}
```

#### 4.1.8 New collection: `BillingMarketRule` (admin-managed)
```typescript
// src/core/entities/billing-market-rule.entity.ts
@Schema({ collection: 'billing_market_rules' })
export class BillingMarketRule extends BaseEntity {
  market_code: string;                    // ISO country code or custom market
  market_name: string;
  is_active: boolean;

  // Gateway preference order for fallback routing
  gateway_priority: Array<'paystack' | 'flutterwave' | 'stripe'>;

  // Country to market mapping
  country_codes: string[];                // e.g. ['NG']
  default_currency: string;
}
```

#### 4.1.9 New collection: `ProviderWhiteLabelConfig`
```typescript
// src/core/entities/provider-white-label-config.entity.ts
@Schema({ collection: 'provider_white_label_configs' })
export class ProviderWhiteLabelConfig extends BaseEntity {
  organization_id: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  brand_name: string;
  logo_url?: string;
  primary_color?: string;
  support_email?: string;
  custom_domain?: string;
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
  provider-billing.webhook.ts        # gateway webhook handler(s)
  dto/
    create-checkout-session.dto.ts
    update-subscription.dto.ts
  pricing/
    pricing-resolver.service.ts      # resolves plan+market price from DB
    market-resolver.service.ts       # resolves market from organization country
  guards/
    billing-tier.guard.ts            # checks plan_tier + status on route
  decorators/
    require-tier.decorator.ts        # @RequireTier(ProviderPlanTier.PRO)
```

#### 4.2.1 Dynamic plan/limits source

`TIER_LIMITS` constants are replaced with a cached data source backed by
`ProviderPlanDefinition`.

```typescript
// src/provider-billing/pricing/plan-catalog.service.ts
// Cache key: billing:plan-catalog:v1 (TTL 300s)
// Source of truth: provider_plan_definitions collection
```

If cache misses or admin edits happen, values refresh from DB.

---

### 4.3 New API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/provider-billing/checkout` | Provider | Create checkout intent via market gateway routing |
| `POST` | `/provider-billing/portal` | Provider | Open gateway customer portal (if supported) |
| `GET` | `/provider-billing/status` | Provider | Current tier, status, period end, next invoice |
| `GET` | `/provider-billing/invoices` | Provider | List past ProviderInvoice records |
| `POST` | `/provider-billing/webhooks/paystack` | Gateway signature | Paystack webhook (unauthed, signature-verified) |
| `POST` | `/provider-billing/webhooks/flutterwave` | Gateway signature | Flutterwave webhook |
| `POST` | `/provider-billing/webhooks/stripe` | Gateway signature | Stripe webhook |

### 4.3.1 Admin endpoints (pricing + plans + markets)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/admin/provider-billing/plans` | Admin | List all plan definitions |
| `POST` | `/admin/provider-billing/plans` | Admin | Create plan definition |
| `PATCH` | `/admin/provider-billing/plans/:id` | Admin | Update plan limits/features |
| `GET` | `/admin/provider-billing/prices` | Admin | List market prices |
| `POST` | `/admin/provider-billing/prices` | Admin | Create market price |
| `PATCH` | `/admin/provider-billing/prices/:id` | Admin | Update market price |
| `GET` | `/admin/provider-billing/markets` | Admin | List market rules + gateway priority |
| `POST` | `/admin/provider-billing/markets` | Admin | Create market rule |
| `PATCH` | `/admin/provider-billing/markets/:id` | Admin | Update gateway order / mapping |
| `GET` | `/admin/provider-billing/white-label` | Admin | List white-label org configs |
| `PATCH` | `/admin/provider-billing/white-label/:organizationId` | Admin | Approve/reject/update white-label config |

### 4.3.2 Provider white-label endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/provider-billing/white-label` | Provider | Get white-label capability + current org config |
| `PATCH` | `/provider-billing/white-label` | Provider | Update white-label branding payload |

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
  billingPortalUrl: string | null;  // only when active subscription exists
  limits: ResolvedPlanLimits;
  usage: {
    activeMembers: number;
    membershipPlans: number;
    staffMembers: number;
    listings: number;
  };
}
```

---

### 4.4 Gateway-Agnostic Integration Details (Paystack-first)

Gateway resolution policy:

1. Resolve provider market from organization registration country.
2. Read gateway priority from `BillingMarketRule.gateway_priority`.
3. Attempt checkout session/verification with first active gateway.
4. On provider outage or hard failure, automatically try next configured gateway.
5. Persist selected gateway in invoice/subscription metadata for traceability.

#### 4.4.1 Plug-and-play gateway abstraction

```typescript
// src/payments/gateways/payment-provider.interface.ts
export interface PaymentProvider {
  gateway: 'paystack' | 'flutterwave' | 'stripe';
  createCheckoutSession(input: CheckoutInput): Promise<CheckoutResult>;
  verifyTransaction(input: VerifyInput): Promise<VerifyResult>;
  createPortalSession?(input: PortalInput): Promise<PortalResult>;
  validateWebhookSignature(rawBody: string, signature: string, secret?: string): boolean;
}
```

```typescript
// src/payments/gateway-router.service.ts
// Uses market rule gateway_priority, with Paystack as preferred default.
```

#### 4.4.2 Checkout flow
1. Frontend calls `POST /provider-billing/checkout` with `tier`, `interval`, `organizationId`.
2. Backend resolves provider market (organization registration country).
3. Backend resolves active market price from `ProviderPlanMarketPrice`.
4. Backend resolves gateway order from `BillingMarketRule` (Paystack first unless overridden).
5. Backend creates checkout via first available gateway provider; auto-fallback on failure.
6. Frontend redirects to `checkoutUrl`.
7. On return, frontend queries `GET /provider-billing/status` to confirm tier change.

#### 4.4.3 Webhook events handled

| Event | Action |
|---|---|
| `checkout/session success` | Set `plan_tier`, `subscription_status: ACTIVE`, `current_period_end` on org |
| `invoice/charge paid` | Create `ProviderInvoice` record with `status: paid`; set `subscription_status: ACTIVE` |
| `invoice/charge failed` | Set `subscription_status: PAST_DUE`; trigger email to provider |
| `subscription updated` | Sync tier on plan change (upgrade/downgrade) |
| `subscription cancelled` | Set `subscription_status: CANCELLED`; start grace-period clock |

All webhook events are idempotent (lookup by gateway event id before writing).

#### 4.4.4 New environment variables (backend)
```env
PAYSTACK_SECRET_KEY=...
PAYSTACK_WEBHOOK_SECRET=...
FLUTTERWAVE_SECRET_KEY=...
FLUTTERWAVE_WEBHOOK_SECRET=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...

# Optional default order if no market rule exists
BILLING_GATEWAY_DEFAULT_PRIORITY=paystack,flutterwave,stripe
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
| `MarketplaceService` | `manuallyEnrollMember` | Active member count < resolved plan limit |
| `MarketplaceService` | `createMembershipPlan` | Plan count < resolved plan limit |
| `TeamsService` | `inviteMember` | Staff count < resolved plan limit |
| `MarketplaceService` | `createOrgListing` | Listing count < resolved plan limit (replaces unique index) |

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

`GET /marketplace/organizations/:id/analytics` -> if analytics is disabled for resolved plan definition, return `402` with `code: UPGRADE_REQUIRED`.

---

### 4.6 Multi-listing change

Currently a Mongoose unique index on `{ organization_id: 1 }` prevents more than one listing per org. For Pro/Enterprise multi-location support:

1. **Drop** the unique index on `marketplace_listings.organization_id`.
2. Replace it with a **runtime quota check** in `createOrgListing` using resolved plan limits from `ProviderPlanDefinition`.
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
1. **Current plan card** — tier badge, status pill, renewal date or "Free forever", "Manage subscription" button (→ billing portal) or "Upgrade" CTA.
2. **Usage meters** — 4 progress bars: Active members `n/10`, Plans `n/2`, Staff `n/0`, Listings `n/1`. Shows "Upgrade to increase limits" when ≥80% used.
3. **Invoices table** — date, amount, status (`paid` green / `open` yellow), PDF link.
4. **Plan comparison** — same table as §3 above, with current plan highlighted.

### 5.3 Pricing page wiring

Current state: CTAs link to `/register/gym` etc. with no dynamic market pricing.

Required changes:
1. Fetch catalog from backend (`GET /provider-billing/public-catalog?country=NG&role=GYM_OWNER`).
2. For unauthenticated visitors: CTAs go to `/register/[role]?tier=pro` (stored in query param, passed through registration flow, applied on first org creation).
3. For authenticated providers already on free: CTA calls `POST /provider-billing/checkout` and backend selects market + gateway.
4. UI must show prices from resolved market/currency, not static values.

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

For soft-warning scenarios (Q21), the API allows the action and returns a
warning payload. Frontend must render a large, high-contrast, persistent banner
at the top of the affected dashboard pages until the org upgrades or usage
returns within plan limits.

### 5.5 Sidebar billing link

Add "Billing" nav item to all three provider sidebars (`TrainerSidebar`, `DietitianSidebar`, `GymOwnerSidebar`) with a `CreditCard` Lucide icon. Show a "PRO" or "FREE" badge next to it so tier is always visible.

### 5.6 White-label management UI

| Route | Purpose |
|---|---|
| `/dashboard/[role]/white-label` | Manage branding profile and custom domain requests |

Behavior:

1. If plan does not allow white-label, show `UpgradeRequired`.
2. If plan allows white-label and approval is pending, show status banner + readonly config.
3. If approved, allow update of branding fields.

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

### Sprint 1 — Data model + admin configurability (4-5 days)
- [ ] New enums: `ProviderPlanTier`, `ProviderSubscriptionStatus`
- [ ] Add fields to `Organization` entity
- [ ] `ProviderInvoice` entity
- [ ] `ProviderPlanDefinition`, `ProviderPlanMarketPrice`, `BillingMarketRule` entities
- [ ] Admin CRUD endpoints for plans/prices/markets
- [ ] `ProviderBillingModule` scaffold (service, controller, DTOs)
- [ ] `GET /provider-billing/status` endpoint
- [ ] Unit tests for catalog/market resolution

### Sprint 2 — Gateway router + paystack-first fallback (4-5 days)
- [ ] Payment provider interface + provider implementations (Paystack/Flutterwave/Stripe)
- [ ] Gateway router with priority order + fallback
- [ ] `POST /provider-billing/checkout` via router
- [ ] Webhook endpoints for all gateways in §4.4.3
- [ ] `ProviderInvoice` write on `invoice.paid`
- [ ] Unit tests for fallback routing and webhook handling

### Sprint 3 — Dynamic feature gating (3-4 days)
- [ ] `BillingTierGuard` + `@RequireTier` decorator
- [ ] Quota checks in `MarketplaceService.manuallyEnrollMember`
- [ ] Quota checks in `MarketplaceService.createMembershipPlan`
- [ ] Quota checks in `TeamsService.inviteMember`
- [ ] Drop unique listing index; add runtime quota check in `createOrgListing`
- [ ] Analytics endpoint gating
- [ ] Integration tests for quota boundary behaviour

### Sprint 4 — Frontend dynamic pricing + billing UX (4-5 days)
- [ ] `providerBillingService` API client
- [ ] `/dashboard/[role]/billing` page (all three role variants share same component)
- [ ] Pricing page: render market-specific plans/prices from API
- [ ] "Upgrade required" empty state component (reused across all gated pages)
- [ ] Sidebar billing links + tier badge

### Sprint 5 — White-label scope (3-4 days)
- [ ] Add white-label gating from resolved plan definition
- [ ] Build provider white-label endpoints + admin approval endpoints
- [ ] Add white-label dashboard page and manager component
- [ ] Add custom domain verification status flow (pending/verified/failed)

### Sprint 6 — Email + QA (2-3 days)
- [ ] Billing email templates in Mailer module
- [ ] End-to-end test: free -> paid tier -> quota enforcement -> cancel -> grace period
- [ ] End-to-end test: enterprise -> white-label setup -> admin approval -> branding live
- [ ] Manual QA on all three account types (Gym Owner, Trainer, Dietitian)

**Total estimate: ~22-28 dev-days.**

---

## 8. Testing Strategy

| Layer | What to test |
|---|---|
| Unit | plan-catalog resolver, market resolver, `ProviderBillingService` methods, `BillingTierGuard` logic |
| Unit | Webhook handler: each event type in isolation, idempotency re-runs |
| Integration | Checkout → webhook → org tier update flow (mocked Stripe) |
| Integration | Quota enforcement at boundary (n-1, n, n+1 resources) |
| E2E | Free → Pro upgrade via Stripe test-mode; downgrade via portal; expiry locking |

---

## 9. Not In Scope (This Spec)

- API key issuance for Enterprise tier
- e-Commerce / store setup
- Metered billing (per-check-in or per-booking pricing models)

---

## 10. Appendix: Affected Files

### Backend — new files
- `src/core/enums/provider-plan-tier.enum.ts`
- `src/core/enums/provider-subscription-status.enum.ts`
- `src/core/enums/admin-permission.enum.ts`
- `src/core/entities/provider-invoice.entity.ts`
- `src/core/entities/provider-plan-definition.entity.ts`
- `src/core/entities/provider-plan-market-price.entity.ts`
- `src/core/entities/billing-market-rule.entity.ts`
- `src/core/entities/provider-white-label-config.entity.ts`
- `src/provider-billing/` (entire module)
- `src/payments/gateways/` (provider interface + gateway adapters)
- `src/payments/gateway-router.service.ts`

### Backend — modified files
- `src/core/entities/organization.entity.ts` — new billing fields, `billing_market_code`, gateway-agnostic customer/subscription refs
- `src/core/entities/user.entity.ts` — add `admin_permissions: AdminPermission[]`
- `src/marketplace/marketplace.service.ts` — quota checks, drop unique listing constraint
- `src/teams/teams.service.ts` — staff quota check
- `src/admin/` — new provider billing admin endpoints
- `src/mailer/` — new email templates

### Frontend — new files
- `src/lib/api/provider-billing.ts`
- `src/app/dashboard/gym-owner/billing/page.tsx`
- `src/app/dashboard/trainer/billing/page.tsx`
- `src/app/dashboard/dietitian/billing/page.tsx`
- `src/components/ProviderBillingManager.tsx` (shared by all 3 billing pages)
- `src/components/UpgradeRequired.tsx`
- `src/app/dashboard/[role]/white-label/page.tsx`
- `src/components/ProviderWhiteLabelManager.tsx`

### Frontend — modified files
- `src/app/pricing/page.tsx` — wire CTAs
- `src/components/GymOwnerSidebar.tsx` — billing link
- `src/components/TrainerSidebar.tsx` — billing link
- `src/components/DietitianSidebar.tsx` — billing link
- `src/app/dashboard/[role]/members/page.tsx` — upgrade state
- `src/app/dashboard/[role]/plans/page.tsx` — upgrade state
- `src/app/dashboard/[role]/staff/page.tsx` — upgrade state
- `src/app/dashboard/[role]/analytics/page.tsx` — upgrade state
