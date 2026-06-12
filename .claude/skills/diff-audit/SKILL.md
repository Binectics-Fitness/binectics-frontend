---
name: diff-audit
description: Audit only files changed since last commit — checks design tokens, serif italic, region pricing, mobile, and accessibility. Faster than full audit for incremental work. Use after making changes or before committing.
allowed-tools: Bash(git *) Bash(grep *) Read
---

## Changed files

!`git diff --name-only HEAD 2>/dev/null; git diff --name-only --cached 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null`

## Instructions

Audit only the files listed above. Skip files that are not `.tsx` or `.ts` in `src/`.

For each changed file, check:

### 1. Design tokens
- Any raw hex colors, `rgb()`, `rgba()`, `hsl()` values? Should use `var(--token)`
- Any raw `oklch()` not referencing a CSS variable?
- Any border-radius values not using `var(--r-1)`, `var(--r-2)`, `var(--r-3)`?

### 2. Serif italic
- Count instances of `font-serif` + `italic` in each file
- Flag if any file has more than 2

### 3. Region pricing
- Any hardcoded currency amounts (`$48`, `₦15,000`, etc.)?
- Should use `useRegion()` → `formatAmount()` or `getMonthlyEquivalent()`
- Exclude demo components and dashboard pages

### 4. Mobile responsiveness
- Buttons/links without `min-h-11`?
- Grids without responsive breakpoints?
- Fixed widths without responsive alternatives?
- Tables without `overflow-x-auto`?

### 5. Accessibility
- Images without `alt` text?
- Interactive elements without keyboard handlers?
- Missing `aria-label` on icon-only buttons?

## Output

For each file, report:

```
src/app/pricing/page.tsx — 2 issues
  L45: raw oklch value, should use var(--fg-3)
  L112: grid-cols-4 without responsive breakpoint
```

If no issues: `All changed files pass audit.`
