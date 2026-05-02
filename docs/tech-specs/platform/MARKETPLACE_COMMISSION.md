# Marketplace Commission & Transaction Fees — Technical Specification

**Status**: Stub — not yet ready for implementation  
**Last updated**: May 2026  
**Authors**: Engineering  
**Related roadmap phase**: Phase 3 (post-SaaS billing)  
**Depends on**: `PROVIDER_SAAS_BILLING.md` (gateway router, BillingMarketRule)

---

## 1. Problem Statement

Binectics earns a percentage fee on every transaction processed through the
platform — provider membership subscriptions, one-time plans, and any future
product sales. This fee is currently not collected. There is no commission
infrastructure, no provider payout model, and no admin tooling to configure
or audit commission rates.

This spec covers the design needed to:

1. Intercept marketplace transactions and apply a configurable commission split.
2. Route the net amount to providers and the platform fee to Binectics.
3. Support dynamic (volume-based) fee rates at a per-provider level.
4. Give providers visibility into their earnings and upcoming payouts.

---

## 2. Open Questions

> All questions below are **unresolved (🔲)**. They must be answered before
> implementation begins.

### 2.1 Fee Model

| # | Question | Options |
|---|---|---|
| Q1 | Is the platform fee deducted at checkout (split payment) or invoiced separately to providers after the fact? | Split at checkout / Post-invoice |
| Q2 | For split-payment model: does Binectics hold funds and remit net to provider, or does the gateway split directly? | Platform holds + remits / Gateway-native split (Paystack sub-accounts, Stripe Connect) |
| Q3 | Which transaction types are commissionable? | Membership subscriptions only / One-time plans + subscriptions / All paid events |
| Q4 | Is the fee applied to the gross amount or after gateway processing fees? | Gross / Net of gateway fees |
| Q5 | Is the SaaS subscription fee (provider pays Binectics) ever combined with commission, or always separate? | Separate / Combined |

### 2.2 Rate Structure

| # | Question | Options |
|---|---|---|
| Q6 | Base commission rate? | 5% / 7.5% / 10% |
| Q7 | Is the dynamic volume discount applied per-transaction (threshold reached mid-period) or per-billing-period (GMV over trailing 30 days)? | Per-transaction / Per-billing-period |
| Q8 | Who sets volume thresholds? | Hardcoded tiers / Admin-configured rate table |
| Q9 | Are commission rates different by provider role (gym vs. trainer vs. dietitian)? | Same for all / Role-differentiated |
| Q10 | Are commission rates different by market/country? | Global flat rate / Market-specific |
| Q11 | Can admin override commission rate for a specific provider or org? | Yes / No |

### 2.3 Payouts

| # | Question | Options |
|---|---|---|
| Q12 | What is the payout schedule? | Instant / Daily / Weekly / Monthly |
| Q13 | Is payout to bank account, mobile money, or both? | Bank only / Mobile money only / Both |
| Q14 | Who initiates payouts — provider (manual withdrawal) or automatic scheduled release? | Manual / Automatic / Both |
| Q15 | Is there a minimum payout threshold? | Yes / No |
| Q16 | Which gateways support native payouts (Paystack Transfers, Stripe Payouts, etc.)? | To be audited per gateway |
| Q17 | How are failed payouts handled (wrong account details, insufficient gateway balance)? | To be defined |

### 2.4 Compliance & Ledger

| # | Question | Options |
|---|---|---|
| Q18 | Do we need to issue formal receipts or tax invoices to providers for withheld commission? | Yes / No |
| Q19 | Is there a need for a double-entry ledger (Platform Revenue, Provider Payable, Gateway Fees)? | Yes / No |
| Q20 | For VAT/GST markets — is Binectics responsible for collecting and remitting tax on the platform fee? | Yes / No / Depends on market |

---

## 3. Proposed Data Model (Draft — not final)

The following entities are expected to be needed. Schemas are not yet defined.

- **`CommissionRateRule`** — admin-managed table of rate tiers (base rate, volume
  thresholds, market overrides, per-provider overrides).
- **`MarketplaceTransaction`** — each completed payment event, recording gross
  amount, commission amount, net provider amount, gateway, and payout status.
- **`ProviderPayout`** — aggregated payout record per provider per period. Links
  to one or more `MarketplaceTransaction` records.
- New fields on **`Organization`** — total lifetime GMV (for volume tier
  calculation), running-period GMV, payout account details (gateway-specific).

---

## 4. Proposed API Endpoints (Draft)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/provider-billing/earnings` | Provider | Current period earnings, pending payout, commission breakdown |
| `POST` | `/provider-billing/payout` | Provider | Request manual payout (if manual model is chosen) |
| `GET` | `/provider-billing/transactions` | Provider | List of commissionable transactions |
| `GET` | `/admin/provider-billing/commission-rules` | Admin | View/edit commission rate table |
| `POST` | `/admin/provider-billing/commission-rules` | Admin | Create commission rule |
| `PATCH` | `/admin/provider-billing/commission-rules/:id` | Admin | Update rate or threshold |
| `POST` | `/admin/provider-billing/payouts/release` | Admin | Trigger batch payout release |
| `GET` | `/admin/provider-billing/transactions` | Admin | Platform-wide transaction audit log |

---

## 5. Frontend Changes (Draft)

- **Provider earnings section** on `/dashboard/[role]/billing` — add an "Earnings"
  tab alongside the existing plan/invoice tabs. Shows current period GMV, platform
  fee withheld, net earnings, and payout status.
- **Transaction history table** — date, client, plan, gross, fee, net.
- **Payout request button** (if manual withdrawal model is chosen).
- **Admin commission panel** at `/admin/billing/commission` — rate table editor,
  per-provider overrides, payout release controls.

---

## 6. Dependencies & Risks

- Requires gateway sub-account / Connect setup if split-payment model is chosen
  (Paystack sub-accounts, Stripe Connect). This is non-trivial and gateway-specific.
- Payout timing and account verification requirements differ significantly between
  Paystack (Nigeria-first), Flutterwave (pan-Africa), and Stripe (global).
- Tax compliance in multiple jurisdictions is a legal risk item — needs legal review
  before implementation in live markets.

---

## 7. Not In Scope (This Spec)

- E-commerce product sales commission (deferred to store spec)
- Affiliate tracking and referral commissions
- Corporate wellness contract billing

---

## 8. Build Plan (Placeholder)

Sprint breakdown and estimates to be defined once open questions §2 are answered.

Rough estimate: **15–20 dev-days** depending on gateway split model chosen.
