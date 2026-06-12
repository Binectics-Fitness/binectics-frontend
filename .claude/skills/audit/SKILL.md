---
name: audit
description: Full project audit — mobile responsiveness, design tokens, serif italic limit, region pricing consistency. Use when the user asks to audit, check, or verify the project.
argument-hint: [scope]
arguments: [scope]
allowed-tools: Bash(grep *) Bash(find *) Read
context: fork
agent: Explore
---

## Project context

- Design tokens source of truth: `src/app/globals.css`
- Region pricing: all marketing pages must use `useRegion()` from `@/contexts/RegionContext`
- Serif italic: Instrument Serif italic limited to 1-2 instances per page max
- Mobile: 44px min touch targets (min-h-11), responsive at 320-430px
- Design system components: `src/components/ds/`

## Audit scope

If `$scope` is provided, only run that specific audit. Valid scopes: `mobile`, `tokens`, `serif`, `region`, `all`.
If no scope is provided, run all audits.

## Audits to run

### 1. Serif italic audit
Find every file in `src/app/` that uses `font-serif` or `Instrument Serif` or `italic` class combinations. Count instances per file. Flag any file with more than 2.

### 2. Region pricing audit
Find every file in `src/app/` and `src/components/` that contains hardcoded currency symbols (`$`, `₦`, `£`, `€`, `R `, `KSh`, `₹`, `د.إ`) followed by numbers. These should use `useRegion()` instead. Exclude:
- `src/lib/constants/regions.ts` (the price table itself)
- Demo components (GymOwnerDemo, TrainerDemo, etc.)
- Dashboard pages

### 3. Design token audit
Find CSS values in `src/app/` and `src/components/` that use raw colors instead of CSS custom properties. Look for:
- Raw hex colors (`#xxx`)
- Raw `rgb()` / `rgba()` / `hsl()`
- Raw `oklch()` values that don't reference `var(--)`
Exclude `globals.css` and `tailwind.config`.

### 4. Mobile responsiveness audit
Find components that may have mobile issues:
- Buttons or links without `min-h-11` (44px touch target)
- `grid-cols-3` or `grid-cols-4` without responsive breakpoints (`sm:` or `lg:` prefix)
- Fixed widths (`w-[XXXpx]`) without responsive alternatives
- Tables without `overflow-x-auto`
- Text smaller than `text-sm` used for readable body copy

## Output format

Report as a table per audit:

```
| File | Issue | Line | Severity |
```

End with a summary: X issues found across Y files. List the files that need attention first.
