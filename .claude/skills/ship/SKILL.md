---
name: ship
description: Pre-push readiness check — type-check, unit tests, production build, git state. Knows this repo's real build/deploy pipeline and separates pre-existing failures from ones you introduced. Use before pushing or when asked if the branch is ready.
disable-model-invocation: true
allowed-tools: Bash(git *) Bash(npx tsc *) Bash(npx next build) Bash(npm run *) Bash(npm test *) Bash(ls *)
---

## Ship readiness check

### What this repo actually does

Know this before interpreting results — the checks below mirror it:

| | command | gates what |
|---|---|---|
| **pre-push hook** (`.husky/pre-push`) | `npx tsc --noEmit` | blocks your push locally |
| **CI** (`.github/workflows/ci.yml`) | blocking: `tsc --noEmit`, `test:ratchet`, `npm run build` · advisory: lint, turbopack build | runs on push to `revamp`/`main`, and PRs to `main` |
| **Deploy** (`main_binectics-frontend-app.yml`) | `npm install`, `npm run build`, `npm run test` → Azure Web App | **`workflow_dispatch` only — manual** |

The checks below mirror CI's blocking job, so a clean run here means a green CI. Two things to keep in mind:

- **Pushing does not deploy.** Deploy is manual dispatch. A green push means CI passed, nothing more.
- **The two builds use different bundlers.** `npm run build` is `next build --webpack` and is what the Azure deploy runs, so it is the one that ships and the one CI blocks on. `npx next build` is Turbopack (the Next 16 default) and runs advisory-only, to catch the two diverging.

### 1. Git state

!`git status --short`

!`git log --oneline @{upstream}..HEAD 2>/dev/null || echo "No upstream tracking branch"`

Note `Binectics.zip` — an 816K binary tracked in the repo that shows as modified on most checkouts. It is almost never an intentional part of a change. Call it out; do not count it as real work.

### 2. Type-check — BLOCKING

Run `npx tsc --noEmit`. This gates both the pre-push hook and CI, so a failure here stops everything.

### 3. Unit tests — BLOCKING for deploy, and needs a baseline

Run `npm test` (vitest).

**This repo has pre-existing test failures** — 34 at the time of writing, across 11 files. The largest groups are `onboarding-banner` (10), `command-bar` (7) and `staff/page` (6). Four suites fail on `Failed to resolve import "./page"`, three of them under `staff/[trainerId]/`, a route since renamed to `[staffId]` whose tests were left behind.

**Fetch before you baseline.** The baseline is only meaningful against the tree CI will actually test. A stale checkout produces a stale baseline that passes locally and fails in CI — the `command-bar` failures came in with auth wiring on `revamp` and are invisible to a branch cut before it. Run `git fetch && git status` first; if you are behind, rebase before trusting any of this.

So a red test run does **not** by itself mean your branch is broken. Run the ratchet, which answers that question directly:

```
npm run test:ratchet
```

It compares against `test-baseline.json` and fails **only on new failures**, matched by identity (`<file> >> <test name>`) rather than count — so a fixed test and a newly broken one cannot cancel out. It tracks two kinds of failure, because they surface differently in the vitest JSON and an assertion-only check misses the second:

- **assertion** — the test ran and failed
- **`[collect]`** — the suite never loaded (bad import, missing mock) and reports zero assertions

Exit 0 → no new failures; report the pre-existing count and move on. Exit 1 → it prints exactly which failures are yours; those block.

This same script gates CI, so its verdict here is the verdict there. If you legitimately fix failures, lock them in with `npm run test:ratchet:update` so they cannot regress.

### 4. Production build — BLOCKING

Run `npm run build` (`next build --webpack` — the deploy path).

Optionally also `npx next build` (CI's Turbopack path) to confirm the two agree.

### 5. Lint — ADVISORY, never blocking

Run `npm run lint`. It is **not** in CI and currently reports ~108 problems (59 errors), all pre-existing. Report the delta your change introduces, if any. Never hold a ship on the pre-existing count.

### 6. Skip `npm run api:check`

It regenerates types from `../binectics-api/schema/openapi.json`. That sibling repo is usually absent locally, so the check fails for reasons unrelated to the branch. Only run it if `ls -d ../binectics-api` succeeds.

### 7. Summary

```
Ship check: [READY / NOT READY]

  Branch:               <name> (ahead X, behind Y of <upstream>)
  Uncommitted changes:  X files  (+ Binectics.zip noise, if present)
  Type-check:           PASS / FAIL
  Unit tests:           PASS / N pre-existing failures / N NEW failures
  Build (webpack):      PASS / FAIL
  Lint:                 N pre-existing problems, +N from this change
```

READY requires: type-check passes, build passes, and **no new** test failures beyond baseline. Pre-existing failures and lint noise do not block — but always state them, so a red run is never mistaken for a clean one.

If NOT READY, list what needs fixing, and say plainly which items are yours versus inherited.

Do not push. Do not deploy. Only report status.
