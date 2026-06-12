# 03 — Database & Migrations

## Overview

Schema changes, indexes, and backfill scripts required by the new endpoints and modified responses in §02. The API uses MongoDB via Mongoose; migrations live as scripts under `binectics-api/scripts/`.

## Scope

- New fields on existing collections.
- New collections (conversations, messages, possibly geo-cache).
- Indexes for new query patterns (search, weekly grid, conversation listing).
- One-off backfill scripts that don't lock the cluster.

## Detailed task breakdown

### EPIC K — User entity additions (supports H1)
| ID | Field | Type | Default | Backfill |
|---|---|---|---|---|
| K1 | `is_onboarding_complete` | boolean | `false` for new, derived from existing onboarding checklist completion for old users | Run script: a user is "complete" if `OnboardingStatus.is_complete=true` OR `created_at < 2026-01-01` |
| K2 | `must_change_password` | boolean | `false`; set to `true` only by admin password-reset flow | None (only true going forward) |
| K3 | `first_name`, `last_name` | string \| null | split from existing `name` field on read; populate by background job that splits on first space | Script: best-effort split of `name` |
| K4 | `profile_picture` (already exists per controllers) | string \| null | unchanged | Verify field is on User schema, not on a side document |
| K5 | `country_code` (ISO-2) | string \| null | derived from existing `country` text field if it matches | Map common country names → ISO-2 |

**Indexes:** none new for K1–K5 (these are not query keys yet).

### EPIC L — Notification entity additions (supports H3, H4)
| ID | Change | Detail |
|---|---|---|
| L1 | Add `category` field (string enum) | Computed-at-write via a `NotificationType → Category` map in `notifications.service.ts` |
| L2 | Backfill `category` for existing rows | Bulk update grouped by type: `db.notifications.updateMany({type: {$in: [...]}}, {$set: {category: '...'}})` |
| L3 | Add compound index `{user_id: 1, category: 1, created_at: -1}` | Powers grouped drawer queries |
| L4 | Add `{user_id: 1, read: 1}` index if not already present | Powers unread count |

### EPIC M — Conversations & Messages (supports G4–G7)
| ID | Collection | Fields |
|---|---|---|
| M1 | `conversations` | `_id, participant_ids[2], created_by, organization_id?, last_message_at, last_message_preview, unread_by_user_id: Map<UserId, number>, created_at, updated_at, archived_by[]` |
| M2 | `messages` | `_id, conversation_id, sender_id, body, attachments[]?, read_by[], created_at, edited_at?, deleted_at?` |
| M3 | Indexes — conversations | `{participant_ids: 1, last_message_at: -1}` (list my conversations newest first), `{participant_ids: 1, archived_by: 1}` |
| M4 | Indexes — messages | `{conversation_id: 1, created_at: -1}` (paginate messages), `{conversation_id: 1, read_by: 1}` |
| M5 | TTL or archival policy | Decision: hard-delete after N days or archive flag only (see [09](../09-Risks-and-Open-Questions/README.md)) |

### EPIC N — Listings search index (supports H8)
| ID | Task | Detail |
|---|---|---|
| N1 | Decide: Mongo `$text` vs Atlas Search vs Meilisearch | Recommend Atlas Search if available — proper relevance + facets |
| N2 | Create index on `marketplace_listings`: `{name, description, specialties, city, country}` | If `$text`, only one allowed per collection |
| N3 | Add weighting (name 10, specialties 5, description 1) | Atlas Search analyzers |
| N4 | Define stopwords + language analyzers per market | Start with en, es, fr |

### EPIC O — Country / region enrichment (supports H6, H7)
| ID | Task | Detail |
|---|---|---|
| O1 | Add `currency, default_locale, dial_code` to the seeded `countries` collection | One-off seed script update |
| O2 | Add `payment_methods[], vat_rate?` to `supported_regions` config | Stored in DB or config file — pick one (see [09](../09-Risks-and-Open-Questions/README.md)) |

### EPIC P — Check-in derived fields (supports H5)
| ID | Task | Detail |
|---|---|---|
| P1 | No schema change required if `current_week_grid` and `current_streak` are computed on read | Preferred — avoid sync issues |
| P2 | Add `{user_id: 1, scanned_at: -1}` index if not already present | Powers weekly grid + history |
| P3 | If perf becomes an issue, add a `member_checkin_stats` materialised collection updated on each scan | Phase 2 |

### EPIC Q — Geo-resolve cache (supports G8)
| ID | Task | Detail |
|---|---|---|
| Q1 | New collection `geo_ip_cache: {ip_hash, country_code, region, city, currency, ttl_at}` | Cache IP-geo lookups to avoid per-request external calls |
| Q2 | TTL index on `ttl_at` (24h default) | |

### EPIC R — Backfill scripts (operational)
| ID | Script | Detail |
|---|---|---|
| R1 | `scripts/backfill-user-onboarding-flag.js` | Marks pre-cutoff users complete |
| R2 | `scripts/backfill-user-names.js` | Splits `name` → `first_name`/`last_name` |
| R3 | `scripts/backfill-notification-category.js` | Batched updateMany per type group |
| R4 | `scripts/seed-countries-currency.js` | Re-seeds countries with currency/locale |
| R5 | All scripts must be idempotent + chunked (batch size 1000, sleep between batches) | Follow existing scripts pattern under `binectics-api/scripts/` |

## Dependencies

- **Blocks:** §04 services that read/write the new fields, §07 contract tests that assert presence.
- **Blocked by:** §01 (versioning policy — additive only), §09 (Atlas Search availability, archival policy).

## Impacted components

- `binectics-api/src/core/entities/*.entity.ts` (Mongoose schemas).
- `binectics-api/scripts/*.js` (new backfill scripts).
- `binectics-api/src/notifications/notifications.service.ts` (category derivation on write).
- Atlas / DB infrastructure (new indexes; may require maintenance window).
- `binectics-api/infra/main.tf` if Atlas search is provisioned via Terraform.

## Assumptions

- We can add indexes during a low-traffic window without downtime.
- Backfills can run as one-off scripts (not a recurring migration framework).
- Conversations only ever have 2 participants for now — group chat is out of scope.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Backfills blow up working set | M | H | Chunk + sleep + monitor; run during off-peak |
| Atlas Search not enabled on current tier | M | M | Fall back to `$text`; document limitation |
| Computing `current_week_grid` on read is too slow | L | M | Materialise to `member_checkin_stats` (EPIC P3) |
| Conversation collection grows unbounded | M | M | Add archival policy (M5) and message retention TTL |
| Index addition locks collection | L | H | Use `{background: true}` (Mongo default on 4.2+); monitor |

## Migration & rollout

1. Ship schema field additions in code (default values populated at write).
2. Run backfills in chunks during off-peak; verify counts before/after.
3. Add indexes background.
4. Only then enable the dependent endpoints in §04 behind feature flags.

## Acceptance criteria

- [ ] All new fields exist in the production schema with backfill scripts checked in and runbook documented under `binectics-api/scripts/README.md`.
- [ ] No query plan introduced by §02 endpoints does a COLLSCAN on a collection > 10k docs.
- [ ] Backfills are idempotent (running twice has no effect on already-processed rows).
- [ ] A migration runbook exists in `binectics-api/docs/platform/migrations.md` covering ordering, rollback, and verification queries.
