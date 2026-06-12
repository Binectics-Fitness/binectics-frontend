# Binectics PRD v2 — AI Copilot for Fitness Professionals

**Version:** 2.0
**Date:** 2026-06-11
**Status:** Draft for review
**Supersedes:** Extends `PRD_WEB_APP.md` v1.0 (which remains the as-built reference for the existing platform)
**Platform:** Web (Next.js 16, App Router) + external Azure API

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Strategic rationale](#2-strategic-rationale)
3. [Positioning & customers](#3-positioning--customers)
4. [Product pillars](#4-product-pillars)
5. [AI Copilot feature specifications](#5-ai-copilot-feature-specifications)
6. [Data & AI architecture](#6-data--ai-architecture)
7. [Pricing & packaging](#7-pricing--packaging)
8. [Sequencing & roadmap amendment](#8-sequencing--roadmap-amendment)
9. [Trust, safety & compliance](#9-trust-safety--compliance)
10. [Success metrics](#10-success-metrics)
11. [Risks & mitigations](#11-risks--mitigations)
12. [Out of scope](#12-out-of-scope)
13. [Relationship to PRD v1](#13-relationship-to-prd-v1)

---

## 1. Executive summary

### The repositioning

Binectics v1 is a two-sided fitness marketplace: members discover and subscribe to gyms, trainers, and dietitians. v2 keeps every rail of that platform but changes who we sell to and what we lead with.

**New positioning:** Binectics is the AI copilot and payments stack for fitness professionals. Trainers and dietitians are the paying customer. The marketplace becomes the acquisition funnel; the copilot becomes the product they pay for; the gym operations + multi-currency payments stack remains the structural moat.

### What ships in v2

Five copilot capabilities, layered on data models that already exist in production:

1. **Client check-in summaries** — AI-generated digests from journals, check-ins, weight logs, and meal feedback
2. **Weekly client reports & program adjustment drafts** — auto-drafted, professional-reviewed, one-click send
3. **Intake → plan generator** — intake form responses become a draft workout or meal plan
4. **Attention dashboard** — "who needs a nudge this week": engagement decay, adherence drops, churn-risk flags
5. **Voice/text → journal entry** — dictate or paste rough notes; copilot structures them into journal entries

### What does NOT change

The marketplace, QR check-in, gym operations suite, multi-currency payments (Stripe/Paystack/Flutterwave, 8 currencies, 50+ countries), reviews, notifications, and admin platform all remain as specified in PRD v1. This is a wedge strategy, not a pivot: gyms and the Africa-capable payment rails are the hardest-to-copy assets and stay on the roadmap.

### Why now

- The data plumbing already exists: journals (mood, adherence 0–100), weight logs, meal feedback, activity reports, intake forms, client invitations, and consultations are live (`progress.ts`, `forms.ts`, `consultations.ts`).
- Trainer and dietitian dashboards are the most complete provider surfaces in the product (11–12 pages each).
- B2B SaaS pricing ($30–80/mo per professional) generates revenue without waiting for marketplace liquidity.
- Competitors (Trainerize, Everfit, TrueCoach) are shipping similar AI features; our differentiation is the combined copilot + payments + marketplace + Africa-first rails, not the AI alone.

---

## 2. Strategic rationale

### The problem with marketplace-first

A two-sided marketplace needs simultaneous supply and demand liquidity. Pre-launch (Phase 1 complete, pilot not yet run), Binectics has neither. Marketplace revenue is take-rate on transactions that don't exist yet.

### The problem with copilot-only

An AI copilot for trainers is not independently defensible — every incumbent is adding identical features, and "our data is the moat" only holds after scale. A pure pivot would also orphan the gym operations suite (QR check-in, kiosk/device management, multi-location staff management) and the Paystack/Flutterwave multi-currency stack — the two assets a competitor cannot clone in a quarter.

### The dual-track answer

| Track | Role | Revenue model |
|---|---|---|
| **Copilot (lead)** | Product trainers/dietitians pay for from day one | Per-seat SaaS subscription |
| **Marketplace** | Acquisition funnel: free listing brings pros in, copilot converts them | Take-rate (later, at liquidity) |
| **Gym ops + payments** | Structural moat, regional differentiation (Africa-first) | Gym SaaS tiers + payment volume |

The copilot is the wedge: fastest to revenue, narrowest ICP, and a daily-active reason for professionals to live inside Binectics. The marketplace and gym rails make the wedge defensible.

---

## 3. Positioning & customers

### One-line positioning

*"Binectics runs your client business — payments, programs, and an AI copilot that writes the busywork — so you coach more and admin less."*

### Customer hierarchy

| Priority | Customer | Role enum | Relationship to product |
|---|---|---|---|
| **Primary (pays)** | Personal trainers, dietitians | `TRAINER`, `DIETITIAN` | Buys copilot subscription; manages clients in-product |
| **Secondary (pays)** | Gym owners | `GYM_OWNER` | Buys gym ops suite; staff trainers get copilot seats (expansion revenue) |
| **Tertiary (funnel)** | Fitness members | `USER` | Free; generates the data the copilot summarizes; marketplace demand side |
| **Internal** | Platform admins | `ADMIN` | Moderation, verification, AI quality review queue |

### Ideal customer profile (copilot launch)

Independent trainers and dietitians with 5–50 active clients who currently juggle WhatsApp, spreadsheets, and Google Docs. Pain: client reporting and program updates consume 5–10 unpaid hours weekly. Initial geographies follow the existing payment rails: pilot market per ROADMAP Phase 2, with NGN/ZAR/KES pricing on Paystack and USD/EUR/GBP on Stripe.

---

## 4. Product pillars

| Pillar | Status | Specification |
|---|---|---|
| 1. Marketplace & discovery | Built | PRD v1 §5.2 |
| 2. Subscriptions & payments | Built | PRD v1 §5.3 |
| 3. QR check-in & gym operations | Built | PRD v1 §5.4 |
| 4. Client management & health tracking | Built | PRD v1 §5.5–5.6 |
| **5. AI Copilot** | **New** | **This document §5** |

Pillar 5 consumes pillars 3–4 as its data substrate and is sold on top of pillar 2's billing rails.

---

## 5. AI Copilot feature specifications

All copilot features follow three invariants:

- **Human-in-the-loop:** AI output is always a *draft*. Nothing reaches a client without explicit professional review and send. No exceptions.
- **Grounded only:** Generation uses only that professional's own client data (journals, logs, check-ins, intake forms). No cross-client or cross-provider data leakage.
- **Frontend-only repo:** All inference, scoring, and transcription run on the Azure backend. This repo ships UI surfaces and API client calls only (per CLAUDE.md hard rules).

### 5.1 Client check-in summaries

**What:** A generated digest per client, on demand or scheduled, synthesizing since-last-summary activity: journal entries (mood, adherence score), weight log trend, meal feedback (type, rating, calories), activity reports (type, duration, intensity), and gym check-in frequency.

**Surfaces:**
- `dashboard/trainer/clients/[clientId]` and `dashboard/dietitian/clients/[clientId]`: "Summary" card with Generate button, streaming render, regenerate, copy, save-to-journal
- Client list: last-summary timestamp chip

**Output structure:** 3–5 sentence narrative + structured highlights (weight delta, adherence trend arrow, sessions attended/missed, flags). Tone: factual, sentence case, no exclamation marks (design principles apply to AI copy).

**API (backend, new):** `POST /ai/clients/{clientId}/summary` → SSE stream; `GET /ai/clients/{clientId}/summaries` (history, cursor-paginated).

**Empty/sparse data:** If <2 data points in window, return a "not enough activity to summarize" state — never hallucinate a narrative from sparse data.

### 5.2 Weekly client reports & program adjustment drafts

**What:** Scheduled weekly batch: for each active client, a draft report (client-facing) and a draft program adjustment note (professional-facing) proposing concrete plan changes ("reduce Thursday volume; adherence dropped 3 weeks running").

**Surfaces:**
- New route: `dashboard/{trainer|dietitian}/reports` — review queue with per-client draft cards: edit inline (TipTap), approve & send, skip, regenerate
- Sent reports appear in client's journal feed (read-only, consistent with v1 journal access model)
- Notification on batch-ready (extends existing 38-type SSE notification system)

**Adjustment drafts** link to the relevant workout/meal plan and deep-link into the existing plan editor with proposed deltas pre-described (text first; structured plan-diff is a fast-follow).

**API (backend, new):** `POST /ai/reports/generate-batch`, `GET /ai/reports?status=draft`, `PATCH /ai/reports/{id}` (edit/approve/skip), `POST /ai/reports/{id}/send`.

### 5.3 Intake → plan generator

**What:** Map a completed intake form (existing forms system, PRD v1 §5.12) to a draft workout plan (trainer) or meal/diet plan (dietitian) using the professional's preferred templates and the client's stated goals, constraints, injuries, and equipment access.

**Surfaces:**
- Form response view: "Draft plan from this intake" action
- Output lands in the existing plan builder (`dashboard/trainer/workouts/create`, dietitian meal plan CRUD) as a pre-filled draft — same editor, same save path, nothing new to learn

**Guardrails:** Generator refuses medical-nutrition territory (clinical conditions, eating-disorder signals, pregnancy) and instead surfaces a "requires professional judgment" banner with the relevant intake answers highlighted. Dietitian features stay within the "lightweight diet workflow" boundary from ROADMAP Phase 3 — no native macro/food-database tracking (still out of scope).

**API (backend, new):** `POST /ai/plans/draft` with `{formResponseId, planType}` → draft plan JSON matching existing plan schemas.

### 5.4 Attention dashboard ("who needs a nudge")

**What:** A ranked attention queue per professional: clients showing engagement decay (check-in gaps vs. their own baseline, missed sessions, journal silence, adherence drops, broken streaks). Each row: client, signal ("no check-ins in 9 days, was 4×/week"), suggested action (pre-drafted nudge message), dismiss/snooze.

**Phasing — important:** Launch (Phase 2b) uses **deterministic rules** computed from existing data, clearly labeled. True churn-risk *prediction* requires behavioral data volume that only exists post-pilot; the ML model is a Phase 3 upgrade behind a feature flag. We do not ship a fake "AI risk score" on day one.

**Surfaces:**
- Card on trainer/dietitian dashboard home (top 3) + full view at `dashboard/{role}/attention`
- Nudge drafts send through existing messaging (`dashboard/{role}/messages`)

**API (backend, new):** `GET /ai/attention` (rules-based v1), `POST /ai/attention/{clientId}/nudge-draft`.

### 5.5 Voice/text → journal entry

**What:** Professional dictates or pastes rough post-session notes; copilot structures them into a journal entry draft with extracted fields (mood enum, adherence estimate, weight if mentioned, narrative notes). Review → save via existing journal API.

**Surfaces:** Mic/paste affordance on the existing journal entry composer. Recording uses browser MediaRecorder; audio uploads to backend for transcription (no client-side model).

**API (backend, new):** `POST /ai/transcribe` (audio → text), `POST /ai/journals/structure` (text → journal draft fields).

**Privacy:** Explicit recording indicator; audio deleted after transcription per retention policy (§9).

### 5.6 Interface change inventory (design handoff)

Consolidated list of every UI change in v2. Design intent: AI lives inside existing surfaces; minimize net-new chrome. All work uses existing tokens, shells, and DS primitives — no new navigation patterns, no new editors.

#### New routes (2 per provider role)

| Route | Purpose | Notes |
|---|---|---|
| `dashboard/{trainer\|dietitian}/reports` | Weekly draft review queue | The only major new screen. Per-client `AiDraftCard` list: inline TipTap edit, approve & send, skip, regenerate. Batch progress header. Empty state for "no drafts this week" |
| `dashboard/{trainer\|dietitian}/attention` | Full attention queue | Ranked `AttentionRow` list: client, signal text ("no check-ins in 9 days, was 4×/week"), nudge action, dismiss/snooze |

#### Modified screens — trainer & dietitian

| Screen | Change |
|---|---|
| Client detail (`clients/[clientId]`) | New "Summary" card: generate button, `StreamingText` render, regenerate / copy / save-to-journal actions, sparse-data empty state ("not enough activity to summarize") |
| Client list | Last-summary timestamp chip per row |
| Dashboard home | "Attention" card showing top 3 flagged clients, links to `/attention` |
| Journal composer | Mic + paste affordance; recording indicator; structured-draft review state (extracted mood/adherence/weight fields shown for confirmation) before save |
| Form response view | New action: "Draft plan from this intake" → opens existing plan builder pre-filled. Guardrail state: "requires professional judgment" banner with flagged intake answers highlighted |
| Messages | Nudge drafts arrive pre-filled in existing composer (no UI change beyond entry point) |
| Settings | AI disclosure toggle ("clients can see that you use AI-assisted drafting") |

#### Modified screens — other roles

| Screen | Change |
|---|---|
| Member journal feed | Sent reports appear read-only with "AI-assisted, reviewed by {provider}" footer. No generation UI on member side, ever |
| Gym owner plan management | "+copilot seats" add-on line item |
| Admin audit log | AI generation/review events as new entry types in existing log table |
| Admin feature flags | No UI change; copilot flags become real entries |

#### Marketing site

`/for-trainers` and `/for-dietitians` rewritten to lead with copilot value proposition; pricing surfaces show Starter / Pro / Studio tiers (§7) with per-currency pricing per existing region conventions.

#### New DS components (3)

| Component | Spec |
|---|---|
| `AiDraftCard` | Card with mandatory "AI DRAFT" state badge, body slot (rendered or editable), action row (regenerate · edit · approve & send · skip). States: generating, draft, edited, approved, sent, error |
| `StreamingText` | Progressive text render for SSE generation; cursor indicator while streaming; resolves to static text |
| `AttentionRow` | Client avatar/name, signal sentence, severity dot (reuse `StatusDot`), action buttons (nudge · dismiss · snooze) |

#### Design conventions for AI surfaces

- Every AI-touched element carries a mono uppercase "AI DRAFT" eyebrow (10–11px, +6% tracking, per existing eyebrow convention). AI content is never undisclosed.
- AI-generated copy follows product copy rules: sentence case, no exclamation marks, no emoji.
- One signal-colored action per screen holds: on the reports queue, "approve & send" is the signal button; regenerate/skip are secondary.
- Generation states use existing motion tokens (`--motion-base`); no celebratory animation (reserved for QR check-in).
- Destructive-adjacent action: "send to client" requires the approved state first — disabled until the draft has been opened (forced review).

---

## 6. Data & AI architecture

### Constraint: this repo stays frontend-only

All v2 AI work in this repository is UI + API client modules. New frontend artifacts:

- `src/lib/api/ai.ts` — copilot API client (SSE streaming for generation endpoints, mirroring the notifications SSE pattern)
- React Query hooks: `useClientSummary`, `useReportQueue`, `useAttentionList`, `usePlanDraft`
- New enums in `src/lib/types/index.ts`: `AiArtifactType`, `AiArtifactStatus` (`DRAFT | EDITED | APPROVED | SENT | SKIPPED`), `AttentionSignalType` — no inline string unions
- DS components: `AiDraftCard` (draft badge, regenerate, edit, approve), `StreamingText`, `AttentionRow` — built from existing DS primitives; AI surfaces get a distinct mono "AI DRAFT" eyebrow label, never undisclosed

### Backend requirements (for the Azure API team)

- LLM gateway service with per-provider data scoping (a generation request can only read the requesting professional's clients)
- Generation endpoints listed in §5; SSE streaming for long generations
- Rules engine for attention signals (v1); feature-flagged ML scoring (Phase 3)
- Transcription service
- AI audit log: every generation request, prompt context hash, output, and reviewer action — surfaced in the existing admin audit log
- Rate limits per seat tier (§7)

### Feature flags

Every copilot feature ships behind the existing flag system with percentage rollout and segment targeting (pilot market first). Kill switches required for all generation endpoints.

---

## 7. Pricing & packaging

Per-seat monthly subscription, billed on existing rails (Stripe; Paystack/Flutterwave for African currencies), priced per currency like v1 plan tiers in `lib/constants/regions.ts`.

| Tier | USD/mo | Includes |
|---|---|---|
| **Starter** (free) | 0 | Marketplace listing, client management, payments, 3 AI summaries/mo (taste of copilot) |
| **Pro** | 39 | Unlimited summaries, weekly report batches, intake→plan, voice journals, attention dashboard |
| **Studio** | 79 | Pro + multi-staff seats (gym-employed trainers), priority generation, API-ready export |

Local pricing follows v1 conventions (e.g., Pro ≈ ₦25,000 NGN, R549 ZAR, KSh 3,900 KES — final figures set with pilot-market research, not FX conversion alone). Gym owner plans gain a "+copilot seats" add-on, making gym staff the expansion-revenue channel.

Marketplace take-rate is deferred until liquidity (Phase 3 decision); do not stack take-rate on copilot subscribers at launch.

---

## 8. Sequencing & roadmap amendment

Amends ROADMAP.md. Pilot launch stays first — the copilot needs the pilot's data exhaust.

| Phase | Timing | Contents |
|---|---|---|
| **2a — Pilot launch** (unchanged) | Q3 2026 | Per existing roadmap: pilot market, reliability, payments go-live. Adds: instrumentation of journal/check-in/meal data quality for copilot readiness |
| **2b — Copilot beta** | Q4 2026 | §5.1 summaries + §5.5 voice journals to 10–20 design partners in pilot market (free Pro), behind flags. Success gate: ≥60% weekly active usage among partners |
| **2c — Copilot GA** | Q1 2027 | §5.2 reports + §5.3 intake→plan + §5.4 attention (rules-based). Pro/Studio tiers live. Repositioned marketing site (`/for-trainers`, `/for-dietitians` lead with copilot) |
| **3 — Intelligence** | Q2–Q3 2027 | ML churn scoring (replaces rules engine behind flag), structured plan-diff adjustments, trainer/dietitian analytics (absorbs existing Phase 3 analytics item) |

Existing Phase 2 items (mobile v1, compliance, web polish) are unchanged. Mobile v1 scope gains one item: copilot review queue (approve/send from phone) — the single highest-leverage mobile use case for the new ICP.

---

## 9. Trust, safety & compliance

- **Professional review is mandatory.** No AI artifact reaches a client unreviewed. The send action belongs to the professional; the audit log records reviewer identity and edits.
- **Scope-of-practice guardrails.** Generators refuse clinical/medical content (diagnosis, medication, eating-disorder coaching, pregnancy nutrition) and route to "professional judgment required" states. Dietitian outputs carry a "not medical advice" notice.
- **Data privacy.** Client health data (weight, meals, mood) is sensitive: per-provider data isolation in every generation call; no training on customer data without explicit opt-in; voice recordings deleted post-transcription; client-facing disclosure that their provider uses AI-assisted drafting (settings-level, per provider).
- **Regional compliance.** Pilot market data-protection review (e.g., NDPR if Nigeria, POPIA if South Africa) lands in Phase 2a compliance workstream alongside existing items.
- **AI transparency in UI.** Every AI-touched surface carries the "AI DRAFT" eyebrow; sent reports retain an "AI-assisted, reviewed by {provider}" footer.

---

## 10. Success metrics

| Metric | Target (GA + 2 quarters) |
|---|---|
| Copilot paid seats | 300 in pilot market |
| Free → Pro conversion | ≥8% of active professionals |
| Weekly copilot actives / paid seats | ≥70% |
| Draft acceptance rate (sent with ≤minor edits) | ≥60% (quality proxy) |
| Time-to-send weekly reports | <15 min for a 20-client roster (vs. hours manually) |
| Provider churn (monthly, paid) | <4% |
| Guardrail violations reaching clients | 0 |

Counter-metric: member-side engagement (check-ins, logs) must not decline — the copilot's value depends on members continuing to generate data.

---

## 11. Risks & mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| Cold start: not enough client data to summarize at beta | High | Pilot-first sequencing (§8); sparse-data refusal states (§5.1); design partners chosen for active rosters |
| AI features are table stakes; incumbents ship same | High | Compete on bundle (copilot + payments + marketplace + Africa rails), not AI alone; speed in pilot market where incumbents are weak |
| Backend AI scope exceeds Azure team capacity | High | Endpoints specified early (§6); rules-based attention v1 avoids premature ML; one generation service reused across features |
| Hallucinated or unsafe advice reaches a client | Critical | Mandatory review, guardrail refusals, audit log, zero-tolerance metric (§10) |
| Repositioning confuses gym-owner pipeline | Medium | Gym suite messaging unchanged; copilot marketed as add-on for gym staff (expansion, not replacement) |
| Pricing misfit in pilot market | Medium | Local price research in 2b; free tier keeps funnel open |
| v1 known issues compound (placeholder pages, env/test gaps) | Medium | PRD v1 §14 items become 2a exit criteria before copilot beta |

---

## 12. Out of scope

Everything on the ROADMAP out-of-scope list remains out (e-commerce, bulk SMS/WhatsApp campaigns, wearables, corporate wellness, insurance APIs, white-label, loyalty/gamification, native macro/food-database tracking). Additionally out of scope for v2: client-facing AI chat (members talking to a bot), autonomous sending of any AI content, AI-generated marketing content for providers, and video form-check analysis.

---

## 13. Relationship to PRD v1

PRD v1 (`PRD_WEB_APP.md`) remains the authoritative as-built spec for: route inventory, existing feature specifications (§5.1–5.13), API integration, design system, component library, state management, security, SEO, testing, and deployment. This document adds pillar 5, amends positioning (§1–3), pricing (§7), and roadmap (§8). Where the two conflict on strategy, v2 governs; where they conflict on existing implementation detail, v1 governs.
