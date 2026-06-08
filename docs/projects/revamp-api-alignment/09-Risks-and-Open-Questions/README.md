# 09 — Risks & Open Questions

## Overview

Decisions that gate the rest of the project and risks that don't fit neatly inside a single workstream. This folder is the **first** thing to resolve — most workstream items above carry an explicit "decision in §09" pointer.

## Scope

- Scope decisions (in / out / phased).
- Technical decisions (transport, search engine, geo provider, codegen strategy).
- Operational risks (cost, drift, rollback complexity).
- Product / UX risks the design surfaces but doesn't resolve.

## Resolved decisions (locked 2026-06-07)

| Decision | Final choice |
|---|---|
| D1 Messaging scope | Defer messaging this phase; keep UI entry and show Coming Soon page |
| D2 Global search scope | In scope for v1: listings + bookings + clients + plans |
| D3 Realtime transport | No realtime in v1 |
| D4 Search engine | Mongo `$text` only (English-first weighting) |
| D5 Geo provider | MaxMind local DB first; fallback `Accept-Language` then US |
| D6 Contract alignment | OpenAPI-generated frontend types |
| D7 Aggregates | Broad phase: member home, provider dashboards, notifications grouped feed, marketplace detail, bookings dashboard, admin overview |

## Decision register

### D1 — Is messaging in scope for this project?
- **Surfaces affected:** `src/app/dashboard/messages/page.tsx`, EPIC S (§04), EPIC FF (§05), entire realtime infra (§06 NN).
- **Options:**
  - (a) Ship full messaging now — large effort, high realtime infra cost.
  - (b) Ship "Coming soon" stub and defer — small effort, removes UI promise.
  - (c) Ship a degraded version: per-conversation inbox, no realtime, manual refresh.
- **Decision:** Deferred this phase. Keep messaging menu entry, route to Coming Soon page.
- **Owner:** Product + Eng lead.
- **Needed by:** Before §04 EPIC S kicks off.

### D2 — Is global search in scope?
- **Surfaces affected:** `src/components/ds/CommandBar.tsx`, EPIC T (§04), EPIC GG (§05), search engine (§06 PP).
- **Options:**
  - (a) Build `/search` endpoint with multi-scope fan-out.
  - (b) Keep CommandBar as nav/action only, remove search input.
  - (c) Per-section search only (listings page already has it).
- **Decision:** In scope now with v1 entities: listings + bookings + clients + plans.
- **Owner:** Product + Eng lead.
- **Needed by:** Before §04 EPIC T kicks off.

### D3 — Realtime transport: SSE extension vs socket.io
- **Surfaces affected:** §04 EPIC S (S7), §06 EPIC NN.
- **Options:**
  - (a) Extend existing `/notifications/stream` SSE with `MESSAGE_RECEIVED` events. Cheap, no new infra, works on Netlify edge. Limitation: one stream per origin.
  - (b) Add `socket.io` gateway. Bi-directional, richer features. Requires sticky sessions and Redis adapter.
- **Decision:** Not in scope for v1 (no realtime).
- **Owner:** Eng lead.
- **Needed by:** Before §06 EPIC NN provisioning.

### D4 — Search engine: Atlas Search vs `$text` vs Meilisearch
- **Surfaces affected:** §03 EPIC N, §06 EPIC PP.
- **Options:**
  - (a) Atlas Search — best DX/quality if the cluster tier supports it.
  - (b) Mongo `$text` — built-in, mediocre relevance, single text index per collection.
  - (c) Meilisearch — best relevance, new infra to operate.
- **Decision:** Mongo `$text` only for this phase, English-first weighting.
- **Owner:** Eng lead + Infra.
- **Needed by:** Before §03 EPIC N.

### D5 — Geo provider
- **Surfaces affected:** §04 EPIC U, §06 EPIC MM.
- **Options:**
  - (a) Cloudflare in front of Netlify — free `CF-IPCountry` header.
  - (b) MaxMind GeoLite2 DB — bundled with API, weekly refresh.
  - (c) IPinfo / Ipdata — paid API, richest data.
- **Decision:** MaxMind GeoLite2 DB first.
- **Fallback policy:** `Accept-Language` then `US/USD/en-US`.
- **Owner:** Infra.
- **Needed by:** Before §04 EPIC U.

### D6 — Codegen strategy and enum distribution
- **Surfaces affected:** §01 EPIC A & B, §05 EPIC CC.
- **Options:**
  - (a) `openapi-typescript` generation; enums come along.
  - (b) Publish `@binectics/enums` npm package.
  - (c) Copy file in CI from API → frontend.
- **Decision:** Use `openapi-typescript` generation.
- **Owner:** Eng lead.
- **Needed by:** Before §01 EPIC A2.

### D7 — Aggregate endpoints vs composition in the frontend
- **Surfaces affected:** §02 G1/G10, §04 EPIC V/W, §05 EPIC EE/JJ.
- **Tradeoff:** Aggregates = fewer round trips but heavier server logic and harder caching. Frontend composition = more round trips but each cacheable independently.
- **Decision:** Broad aggregate phase across these surfaces: member home, provider dashboards, notifications grouped feed, marketplace listing detail, bookings dashboard, admin overview.
- **Owner:** Eng lead.
- **Needed by:** Before §04 EPIC V/W.

### D8 — Tax / payouts page (trainer)
- **Surfaces affected:** `src/app/dashboard/trainer/tax/page.tsx`, §05 EPIC KK1.
- **Options:**
  - (a) Delete page + nav entry — honest about scope.
  - (b) Ship behind a feature flag with a "Request early access" form.
  - (c) Scope a full payouts module — large; new domain.
- **Recommendation:** (a) now; (c) as a separate project.
- **Owner:** Product.
- **Needed by:** Before §05 EPIC KK1.

### D9 — Health-metrics HR scatter
- **Surfaces affected:** `src/app/dashboard/member/health-metrics/page.tsx`, §05 EPIC KK2.
- **Options:**
  - (a) Drop the HR chart, keep weight + activity (real data).
  - (b) Add a `vitals` collection and let users self-log HR (no wearable sync).
  - (c) Defer the entire page until wearable integration is in scope.
- **Recommendation:** (a).
- **Owner:** Product.
- **Needed by:** Before §05 EPIC KK2.

### D10 — Messaging attachments
- **Surfaces affected:** §03 M2, §06 EPIC SS.
- **Options:** support images at launch / text-only / no attachments ever.
- **Recommendation:** text-only at launch; images post-launch behind a flag.
- **Owner:** Product.
- **Needed by:** Before §03 M2.

### D11 — Conversation retention
- **Surfaces affected:** §03 M5.
- **Options:** keep forever, soft-delete only, hard-delete after N days, archive policy.
- **Recommendation:** soft-delete on user action; hard-delete only via admin tool. No automatic TTL at launch.
- **Owner:** Legal + Product.
- **Needed by:** Before messaging GA.

### D12 — `MARKET_PRICES` ownership
- **Surfaces affected:** §02 H7, §05 EPIC II.
- **Today:** prices hardcoded in `src/lib/constants/regions.ts`. Should live where?
- **Options:**
  - (a) API `/utility/platform-config.market_prices` (admin-editable via existing currency tooling).
  - (b) Per-listing in marketplace (already exists for plans).
  - (c) Keep client-side but as a typed schema export from the API.
- **Recommendation:** (a) — single editable source.
- **Owner:** Product + Eng.
- **Needed by:** Before §05 EPIC II2.

### D13 — Account-type rename strategy
- **Surfaces affected:** §02 EPIC I, §05 EPIC LL.
- **Tradeoff:** rename `USER → FITNESS_MEMBER` cleanly (touches many files) vs. perma-alias.
- **Recommendation:** rename via codemod in a single PR, keep alias for one release.
- **Owner:** Eng lead.
- **Needed by:** Before §05 EPIC LL.

### D14 — `must_change_password` UX
- **Surfaces affected:** §02 H1, §04 X4, §05 HH4.
- **Question:** when set, do we hard-block all other navigation or surface a banner?
- **Recommendation:** hard-block to a `/change-password` modal; only auth and logout routes accessible.
- **Owner:** Product.
- **Needed by:** Before §05 EPIC HH4.

### D15 — Feature-flag platform
- **Surfaces affected:** §08 EPIC EEE.
- **Recommendation:** DB-backed `feature_flags` collection toggleable via `/admin/feature-flags`, frontend reads through `/utility/platform-config`. No external vendor.
- **Owner:** Eng lead.
- **Needed by:** Before §08 EPIC EEE1.

## Cross-cutting risk register

| ID | Risk | Likelihood | Impact | Owner | Mitigation |
|---|---|---|---|---|---|
| R1 | Enum drift returns after the project ends | H | M | Eng lead | Codegen + lint rule in §01; ADR + onboarding doc |
| R2 | Realtime infra becomes pager source | M | H | Infra | Start with SSE; budget alert + on-call playbook |
| R3 | Aggregate endpoints become hidden god-services | M | M | Eng lead | Composition-only rule + dep audit in §04 acceptance |
| R4 | Backfill window collides with peak traffic | M | H | Infra | Off-peak only; dry-run + chunked; monitored |
| R5 | Visual regression baseline drifts during the rewire | H | L | Frontend | Snapshot revamp HEAD before any wiring lands |
| R6 | Onboarding-flag rollout misses a path → users re-stuck in wizard | M | H | Frontend + Backend | Keep localStorage fallback for one release; dual-read |
| R7 | Geo provider misclassifies VPN traffic → wrong pricing | M | M | Product | Allow user override + manual currency selector |
| R8 | Messaging spam | M | M | Backend | Throttle, abuse reporting, mute / block primitives in v1.5 |
| R9 | Contract tests too strict block routine work | M | M | Eng lead | Additive-OK schema mode |
| R10 | OpenAPI export omits dynamic routes | L | M | Backend | CI guard + manual spot check of generated schema |
| R11 | Frontend ships flags ON in prod by mistake | L | H | DevOps | Default OFF for new flags; PR template requires explicit flag-on call-out |
| R12 | Stripe webhook signature secrets diverge between env | M | H | Backend | Verification step in deploy pipeline |
| R13 | Aggregate cache invalidation race (write → stale read) | M | M | Backend | Use write-through invalidation + short TTL safety net |
| R14 | GDPR / data-residency questions around geo lookups | L | M | Legal + Product | Hash IPs in cache; document data flow |
| R15 | New endpoints accidentally bypass `HttpExceptionFilter` | L | M | Backend | Existing global filter + contract test enforces error envelope |

## Open product questions (not engineering decisions)

1. Does a member ever message a member? (Today's design implies provider↔client only.)
2. Can a provider message clients of other providers in the same org?
3. Do messages count toward provider plan limits (PRO/Enterprise)?
4. Should onboarding-incomplete users see CommandBar / NotificationsDrawer at all?
5. What's the policy on revealing a member's check-in streak to their trainer? (privacy)
6. For region pricing — do we honour user-set currency over IP-detected, even when they conflict?
7. Will marketplace search return both org listings *and* solo professional listings in one feed?

## How to use this folder

Treat each `D#` as a 1-paragraph ADR draft. Promote the resolved decisions into `binectics-api/docs/adrs/` (or equivalent) and link from the originating workstream README. Re-link the risk register from sprint planning.

## Acceptance criteria

- [ ] Every `D#` decision has a documented resolution before its dependent workstream begins.
- [ ] Each resolution lives in an ADR file referenced from the workstream that consumed it.
- [ ] Risk register is reviewed weekly during project active phase; closed risks moved to an "Archive" section with the date.
- [ ] Open product questions have a named owner and a target answer date.
