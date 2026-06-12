---
name: onboard
description: Print a project brief for a new developer or AI session — tech stack, active branch, recent commits, open issues, key conventions. Use at the start of a session or when someone new joins.
allowed-tools: Bash(git *) Bash(gh *) Read
---

## Gather context

### Project rules
!`cat CLAUDE.md | head -40`

### Current branch and status
!`git branch --show-current`
!`git status --short`

### Recent commits (last 10)
!`git log --oneline -10`

### Package info
!`grep -E '"name"|"version"|"next"|"react"|"tailwindcss"' package.json | head -10`

## Instructions

Compile a project brief in this format:

```
## Project Brief

**Project:** [name from package.json]
**Branch:** [current branch]
**Stack:** [framework + version, React version, CSS framework]
**Node:** [from .nvmrc]

## What's happening

[2-3 sentences about the current state based on recent commits and git status]

## Key conventions

[5-6 most important rules from CLAUDE.md — the ones that cause build failures or regressions if violated]

## Recent work

[Bullet list of last 5 commits with brief context]

## Open items

[Uncommitted changes, if any]
[Untracked files, if any]

## Quick commands

| Command | What it does |
|---------|-------------|
| npm run dev | Start dev server on port 3001 |
| npx tsc --noEmit | Type-check |
| npx next build | Production build |
| git push | Push (pre-push hook runs tsc first) |
```

Keep it under 40 lines. This is a quick-start document, not a deep dive.
