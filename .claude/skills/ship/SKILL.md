---
name: ship
description: Readiness check for this repo — type-check, unit tests against the failure baseline, production build, design tokens, git state. Knows the real Vercel/Netlify pipeline and separates pre-existing failures from ones you introduced. Use before committing or pushing, when a change is finished, when asked whether the branch is ready, and after any batch of edits large enough to have broken something.
allowed-tools: Bash(git *) Bash(npx tsc *) Bash(npx next build) Bash(npm run *) Bash(npm test *) Bash(npx eslint *) Bash(ls *)
---

## Ship readiness check

Run this **while work is in progress**, not only at the end. The cheap
checks (type-check, tokens) catch most of what breaks a push, and finding
them mid-change is far cheaper than finding them after a deploy.

### Where this code actually goes

This matters more than it looks, because it changes what a push costs:

| | trigger | what happens |
|---|---|---|
| **pre-commit hook** | `git commit` | design tokens + eslint on staged files |
| **pre-push hook** | `git push` | `tsc --noEmit`, then the test ratchet |
| **CI** (`.github/workflows/ci.yml`) | push to `main`, PRs to `main` | type-check + build |
| **Netlify** | **every push, any branch** | builds and publishes a deploy preview |
| **Vercel** | **every push, any branch** | builds and publishes a deploy preview |

> **Pushing deploys.** Both hosts build from git integration, so a push to
> any branch produces a live preview URL, and a push to `main` goes to
> production. This is the opposite of a manual-dispatch pipeline: a broken
> push is publicly visible, not just a red check.

There is an Azure workflow (`main_binectics-frontend-app.yml`) still in
the repo. **It is not the deploy path** — it is `workflow_dispatch` only
and nothing routes traffic to it. Do not reason about it, and do not
report Azure state as if it were production.

Netlify is the one that matters for auth: `netlify.toml` proxies
`/api/v1/*` to the backend so auth cookies stay first-party. If a change
touches `NEXT_PUBLIC_API_URL`, read that file before assuming anything.

### 1. Git state

!`git status --short`

!`git log --oneline @{upstream}..HEAD 2>/dev/null || echo "No upstream tracking branch"`

!`git log --oneline HEAD..origin/main 2>/dev/null | wc -l | xargs echo "commits behind origin/main:"`

Two things to call out rather than gloss over:

- **`Binectics.zip`** — an 816K binary tracked in the repo that shows as
  modified on most checkouts. Almost never part of a real change. Name it;
  don't count it as work.
- **Being far behind `main`.** A baseline is only meaningful against the
  tree CI will test. If the branch is dozens of commits behind, say so and
  recommend rebasing before trusting any result here — a stale branch
  produces a stale baseline that passes locally and fails in CI.

### 2. Type-check — BLOCKING

Run `npx tsc --noEmit`. Gates the pre-push hook and CI, so a failure here
stops everything downstream.

### 3. Design tokens — BLOCKING

Run `npm run tokens:check`. Gates pre-commit and pre-push. It verifies the
design-system tokens still match `globals.css`; a mismatch means a token
was added or renamed in one place only.

### 4. Unit tests — measured against a baseline, not zero

Run `npm run test:ratchet` if that script exists, otherwise `npm test`.

This repo has carried pre-existing failures. **A red run does not by
itself mean the branch is broken** — the question is whether *this change*
added anything. A ratchet answers exactly that: it compares against
`test-baseline.json` by failure identity (`<file> >> <test name>`), not by
count, so a fixed test and a newly broken one cannot cancel out.

It should track two kinds, because an assertion-only check misses the
second:

- **assertion** — the test ran and failed
- **`[collect]`** — the suite never loaded (bad import, missing mock) and
  reports zero assertions

Exit 0 → report the pre-existing count and move on. Exit 1 → the new
failures are printed, and they block.

If the count has *dropped*, someone fixed something: lock it in with
`npm run test:ratchet:update` so it cannot silently regress.

**Check the baseline's own age.** If `test-baseline.json` disagrees wildly
with a fresh `npm test`, the baseline is stale and is hiding real
regressions. Say so rather than trusting it.

### 5. Production build — BLOCKING

Run `npm run build` (`next build --webpack`). This is what Netlify and
Vercel run, so it is the one that ships.

Optionally `npx next build` too (Turbopack, the Next 16 default) to catch
the two bundlers diverging.

### 6. Lint — ADVISORY

Run `npm run lint`. Pre-commit lints staged files only; the full run is
not in CI and carries a large pre-existing count. Report **the delta your
change introduces**, never the absolute number as if it were yours.

### 7. Skip `npm run api:check` unless the sibling repo is present

It regenerates types from `../binectics-api/schema/openapi.json`. Only run
it if `ls -d ../binectics-api` succeeds; otherwise it fails for reasons
unrelated to the branch.

### 8. Summary

```
Ship check: [READY / NOT READY]

  Branch:               <name> (ahead X, behind Y of origin/main)
  Uncommitted changes:  X files  (+ Binectics.zip noise, if present)
  Type-check:           PASS / FAIL
  Design tokens:        PASS / FAIL
  Unit tests:           PASS / N pre-existing / N NEW
  Build (webpack):      PASS / FAIL
  Lint:                 N pre-existing, +N from this change
```

READY requires: type-check passes, tokens pass, build passes, and **no new
test failures beyond baseline**. Pre-existing failures and lint noise do
not block — but always state them, so a red run is never mistaken for a
clean one.

Remember a push publishes a preview. If NOT READY, say what needs fixing
and which items are yours versus inherited. Report status; do not push.
