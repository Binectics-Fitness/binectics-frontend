# Binectics Roadmap

_Last updated: May 2026_

This document reflects the **actual shipped state** of the platform and the
forward plan. It supersedes any earlier roadmap drafts that referenced
"prototypes" or features now live in production.

---

## Phase 1 — MVP (✅ Complete)

The MVP is functionally live across web, with all core marketplace and
provider tooling shipped.

### Identity & Access

- Email + password authentication, OTP verification
- Role-based registration: User, Gym Owner, Personal Trainer, Dietitian, Admin
- Provider verification workflow (document upload, admin review, "Verified"
  badge on profiles)

### Marketplace

- Public discovery for gyms, trainers, dietitians
- Location, role, and price filters with paginated results
- Provider profile pages with plans, photos, facilities, and reviews

### Plans, Subscriptions & Payments

- One-time and subscription plan models per provider
- Multi-currency checkout via **Stripe** (global), **Flutterwave**, and
  **Paystack** (regional gateways)
- Subscription lifecycle states (`ACTIVE`, `EXPIRED`, `CANCELLED`,
  `PENDING_PAYMENT`) with renewal handling

### Provider Tooling

- Gym owner: gym profile, plans, members, **QR check-in**, attendance history,
  staff invites
- Personal trainer: clients, plans, sessions, journals, revenue
- Dietitian: clients, plans, journals
- Shared **Consultations** module (availability, blocked dates, bookings,
  reschedule, cancel) with buffer time and minimum advance notice

### Reviews & Reputation

- Verified-purchase reviews on plans and providers
- Aggregate ratings on profile cards

### Admin

- User and provider management with suspension controls
- Verification queue
- Platform metrics dashboard
- Forms / consents administration

### Notifications

- Transactional email (subscription created / expiring / expired, booking
  confirmed / rescheduled / cancelled)
- In-app notification feed

### Frontend Foundation

- Next.js 16 App Router on React 19 with the Blinkist-derived design system
- Mobile + tablet responsive across all major dashboard surfaces
- Public marketing site (landing, pricing, about, contact, FAQ, blog)

---

## Phase 2 — Beta Hardening & First Commercial Launch (Q3 – Q4 2026)

Goal: take the live platform from "feature-complete" to "production-grade"
and onboard the first paying providers in two pilot markets.

### Native Mobile App v1

- React Native (Expo) iOS + Android client
- Authenticated browsing, provider profiles, and booking
- **QR check-in** with camera, offline queue, and background sync
- Push notifications for booking and subscription events
- Deep links into provider profiles and booking flows
- App Store + Play Store launch in pilot markets only

### Pilot Market Launch

- **Wave 1 — Africa** (Paystack-ready): Nigeria primary; Kenya and Ghana
  follow-on
- **Wave 2 — Europe**: UK + Ireland (Stripe-only; no regional gateway needed)
- KYC and tax onboarding playbooks for providers in each market
- Localized pricing display and currency defaults per region

### Reliability & Compliance

- Sentry-backed error monitoring on web + mobile
- Uptime monitoring on Azure backend (99.5% SLO target)
- GDPR data-subject-request workflow (export + delete)
- Payment processor compliance hardening (3DS coverage, dispute handling)
- Backup + disaster-recovery runbook for the production database

### Growth Foundations

- Onboarding email sequences (provider activation, member first-week)
- Transactional re-engagement emails (lapsed subscribers, abandoned checkout)
- SEO pass on marketing pages: structured data, sitemap completeness,
  Core Web Vitals budget
- Basic Google Analytics 4 funnel + Sentry release tracking

### Web Polish

- Cross-device QA pass on remaining dashboard / admin / detail routes
- Implementation of the 15 placeholder dashboard pages still flagged in
  `Claude.MD`
- Form validation library standardisation
- Error boundaries on all top-level routes

---

## Phase 3 — Growth (Q1 – Q3 2027)

Goal: scale from pilot into multi-region operation, unlock more revenue per
provider, and sharpen retention.

### Trainer & Dietitian Analytics

- Read-only dashboards: revenue trend, retention rate, no-show rate,
  consultation utilisation, journal adherence trend
- Exportable monthly statements (PDF + CSV)

### Lightweight Marketing Tools

- Provider-managed promo codes (percentage / flat / first-month)
- Referral programme (member-to-member, with reward credits)
- Bulk transactional email to a provider's own client list (opt-in only)
- _Out of scope: full campaign manager, attribution tooling, segmentation
  builder — defer to Phase 4 if commercially justified._

### Geographic Expansion

- Wave 3 — Middle East (UAE + Saudi Arabia)
- Wave 4 — South / Southeast Asia (India, Singapore)
- Localised content for top 5 categories per region
- Currency/timezone display checks in every booking and payment flow

### Mobile App v2

- Provider-side: view bookings, manage availability, log journal entries,
  scan member QR codes (for trainer-led mobile sessions)
- In-app messaging between client and provider (post-booking, scoped per
  active subscription)
- Apple Pay / Google Pay in checkout where supported by the gateway

### Diet Workflow (Lightweight Only)

- Reusable diet plan templates dietitians can attach to a client
- Daily compliance checklist (read-only for client)
- _Explicitly not in scope:_ macro tracking engine, food database, recipe
  builder, wearable integration. Those remain Phase 4+ candidates pending
  validated demand.

---

## Out of Scope (Across All Phases Above)

These items appear in earlier brainstorms but are intentionally **not** on
the 12-month plan:

- E-commerce / merchandise stores
- Bulk SMS / WhatsApp marketing campaigns
- Wearable device integrations (Apple Health, Garmin, Whoop, etc.)
- Corporate wellness B2B portal
- Insurance partner APIs
- White-label / partner reseller API
- Loyalty / gamification programme
- Native macro and food-database diet tracking

---

## Key Risks & Dependencies

| Area | Risk | Mitigation |
| --- | --- | --- |
| Mobile launch | No native app today; longest lead-time item in Phase 2 | Start Expo build immediately; treat web as canonical and mobile as a thin client |
| Payments | Regional gateway onboarding (Paystack / Flutterwave) requires KYC and can take 4–8 weeks per market | Begin onboarding before pilot launch dates; keep Stripe as fallback where possible |
| Compliance | GDPR data-subject requests at scale; PCI scope from gateways | Use processor tokens only (no raw card data); ship DSAR tooling in Phase 2 |
| Verification at scale | Manual admin review becomes a bottleneck past ~50 providers/week | Add automated triage (document type detection, expiry checks) in Phase 3 if volume warrants |
| Backend SLA | Single-region Azure deployment; cold-start risk | Multi-AZ + warm-up health pings before pilot launch |
| App store reviews | First submissions can take 2–4 weeks with rejections | Soft-deadline pilot launches 6 weeks after first submission |

---

## How This Document is Maintained

- Update at the end of each shipping cycle (roughly monthly)
- The "Phase 1" section is a snapshot of shipped functionality and only
  changes when scope is removed or substantially reworked
- Phase 2 / 3 sections are forward-looking and may be re-ordered as
  commercial signals come in
- Anything that slips off the 12-month horizon moves to the **Out of Scope**
  list rather than vanishing silently
