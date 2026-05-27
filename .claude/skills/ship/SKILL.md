---
name: ship
description: Pre-push readiness check — type-check, build, git status, uncommitted changes, commits ahead of remote. Use before pushing or when asked if the branch is ready.
disable-model-invocation: true
allowed-tools: Bash(git *) Bash(npx tsc *) Bash(npx next build)
---

## Ship readiness check

Run these checks in order and report results:

### 1. Git status

!`git status --short`

### 2. Commits ahead of remote

!`git log --oneline @{upstream}..HEAD 2>/dev/null || echo "No upstream tracking branch"`

### 3. Type-check

Run `npx tsc --noEmit`. Report pass/fail. If it fails, list the errors.

### 4. Build

Run `npx next build`. Report pass/fail. If it fails, list the errors.

### 5. Summary

Report in this format:

```
Ship check: [READY / NOT READY]

  Uncommitted changes:  X files
  Commits to push:      X
  Type-check:           PASS / FAIL
  Build:                PASS / FAIL
```

If NOT READY, list what needs to be fixed before pushing.

Do not push. Only report status.
