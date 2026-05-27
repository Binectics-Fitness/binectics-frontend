---
name: enforce
description: Apply a rule across the entire codebase. Use when a new convention is established and needs to be swept globally.
argument-hint: [rule description]
arguments: [rule]
allowed-tools: Bash(grep *) Bash(find *) Read Edit
---

## Project context

!`cat CLAUDE.md | head -70`

## Current design tokens

The source of truth for all CSS values is `src/app/globals.css`. Before replacing any value, verify the correct token exists.

## Instructions

The user wants to enforce this rule across the entire codebase:

**Rule:** $rule

Follow this process:

1. **Understand the rule** — identify exactly what pattern violates it and what the fix looks like
2. **Find all violations** — grep/find across `src/app/` and `src/components/` exhaustively. Do not stop at the first few matches.
3. **Show the violations** — list every file, line number, and the violating code before changing anything
4. **Fix every instance** — apply the fix to every violation found. Do not leave any behind.
5. **Verify** — re-grep to confirm zero remaining violations
6. **Report** — summarize: X violations fixed across Y files

## Exclusions

- `node_modules/`
- `globals.css` (token definitions themselves)
- `.next/` build output
- Test files (unless the rule explicitly applies to tests)

## Important

- Fix every instance in the same pass. Do not leave violations as tech debt.
- If a violation is ambiguous (could be intentional), list it separately as "needs review" instead of auto-fixing.
- Run `npx tsc --noEmit` after all fixes to confirm nothing broke.
