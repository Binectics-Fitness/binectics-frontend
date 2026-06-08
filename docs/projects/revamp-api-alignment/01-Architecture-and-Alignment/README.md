# 01 — Architecture & Alignment

## Overview

Establish the **conventions, pipelines, and contracts** that prevent the frontend/API from drifting again. Every other workstream depends on the decisions made here.

## Scope

- Type generation from the NestJS Swagger schema into the frontend.
- Shared enum source-of-truth and distribution strategy.
- Error envelope and pagination conventions (both repos currently mix patterns).
- API versioning policy for additive vs breaking changes.
- Contract-test framework selection.
- Documentation standard for new endpoints.

**Out of scope:** any individual endpoint or DTO change (those live in §02).

## Detailed task breakdown

### EPIC A — OpenAPI codegen pipeline
| ID | Task | Repo | Complexity | Notes |
|---|---|---|---|---|
| A1 | Audit current Swagger setup in `binectics-api/src/main.ts`; ensure every controller has `@ApiTags`, every DTO has `@ApiProperty` | api | M | Swagger is already on but inconsistent |
| A2 | Add npm script `npm run schema:export` that writes `openapi.json` to `binectics-api/schema/openapi.json` | api | S | |
| A3 | Add CI job that fails the build if `openapi.json` is out of date with controllers | api | S | Run `schema:export` and `git diff --exit-code` |
| A4 | Install `openapi-typescript` in `binectics-frontend`; add `npm run api:sync` that pulls `openapi.json` (from artifact or git submodule) and emits `src/lib/api/generated/schema.ts` | frontend | M | |
| A5 | Write thin wrappers over `openapi-fetch` (or keep existing `apiClient` and adopt generated types) | frontend | M | Decide: fully replace handcrafted clients or only types |
| A6 | Delete hand-maintained DTOs in `src/lib/api/*/types.ts` once parity confirmed | frontend | M | Phased per domain |

### EPIC B — Enum source of truth
| ID | Task | Repo | Complexity | Notes |
|---|---|---|---|---|
| B1 | Choose distribution: (a) generate from OpenAPI, (b) publish `@binectics/enums` npm package, (c) copy file in CI | both | S | Decision item — see [09](../09-Risks-and-Open-Questions/README.md) |
| B2 | Move all enums to a single `src/core/enums/index.ts` barrel in api (most already are) | api | S | |
| B3 | Document casing rule: enum **values** uppercase snake_case server side, frontend imports as-is | both | S | Update `AGENTS.md` |
| B4 | Add lint rule on frontend forbidding string-literal comparisons against enum-domain values (eslint custom or `no-restricted-syntax`) | frontend | M | |

### EPIC C — Error & pagination conventions
| ID | Task | Repo | Complexity | Notes |
|---|---|---|---|---|
| C1 | Confirm the error envelope: `{ statusCode, code, message, details?, correlationId }` | api | S | `HttpExceptionFilter` already maps codes per recent commit `50fea8c` |
| C2 | Standardise pagination: cursor-based for time-ordered feeds (notifications, journal, check-ins, requests), page/limit for browse (listings) | api | S | Document in [docs/platform](../../../../../binectics-api/docs/platform/) |
| C3 | Add response interceptor that always emits `{success, data, pagination?, message?}` shape | api | M | Some controllers already do, some return raw |
| C4 | Update generated types to reflect the envelope (don't double-wrap) | frontend | S | |

### EPIC D — Versioning & deprecation policy
| ID | Task | Repo | Complexity | Notes |
|---|---|---|---|---|
| D1 | Define: additive fields require no version bump; removals/renames require new version path or `Sunset` header | api | S | |
| D2 | Add `Deprecation` + `Sunset` response headers utility | api | S | |
| D3 | Document that `/api/v1` stays; future breaking changes go to `/api/v2` | both | S | |

### EPIC E — Contract testing framework
| ID | Task | Repo | Complexity | Notes |
|---|---|---|---|---|
| E1 | Evaluate Pact vs schema-driven validation (generated types + Vitest contract assertions) | both | M | Pact adds infra; schema validation is lighter |
| E2 | Add at least one example contract test per domain in 07 | both | M | See [07](../07-Testing-and-QA/README.md) |

### EPIC F — Documentation hygiene
| ID | Task | Repo | Complexity | Notes |
|---|---|---|---|---|
| F1 | Require every new controller to ship with a markdown doc in `binectics-api/docs/<domain>/` | api | S | Pattern already exists |
| F2 | Add ADR template + first ADR: "Frontend types are generated from API Swagger" | both | S | |

## Dependencies

- **Blocks:** §02, §04, §05 (they all consume the type pipeline and enum policy).
- **Blocked by:** §09 decisions on enum distribution (B1), contract framework (E1).

## Impacted components

- `binectics-api/src/main.ts` (Swagger setup)
- `binectics-api/package.json` (export script + CI)
- `binectics-frontend/package.json` (sync script + codegen dep)
- `binectics-frontend/src/lib/api/**` (gradual replacement of hand types)
- `binectics-frontend/eslint.config.mjs` (enum lint)
- CI configuration (both repos)
- `AGENTS.md` / `Claude.MD` updates

## Assumptions

- Swagger decorators are already on every controller (verified — they are, per Module list).
- We can run the API in CI long enough to export the schema (alternative: static extraction).
- Frontend is willing to absorb a build-time dependency on the API repo (or on a published artifact).

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Codegen produces noisy diffs every commit | M | L | Add stable sort + `prettier` to generated output |
| Mass DTO replacement breaks unrelated screens | M | M | Phase per domain; keep old types as deprecated aliases for one release |
| Enum lint rule produces too many false positives | M | M | Pilot on `src/components/ds/**` first |
| Pact adds infra cost no one wants to maintain | M | M | Prefer schema-driven contract validation |

## Acceptance criteria

- [ ] Running `npm run schema:export` in the API produces a stable `openapi.json`.
- [ ] Running `npm run api:sync` in the frontend updates `src/lib/api/generated/schema.ts` and `npm run typecheck` passes.
- [ ] At least one domain (notifications) consumes only generated types end-to-end.
- [ ] CI fails when a controller adds a DTO field but `openapi.json` is not regenerated.
- [ ] Error envelope and pagination conventions are documented in a single ADR and linked from both repo READMEs.
- [ ] An eslint rule rejects string-literal use of any enum value present in the generated schema (or a documented exception list exists).
