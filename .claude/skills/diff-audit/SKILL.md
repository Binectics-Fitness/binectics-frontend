---
name: diff-audit
description: Audit only files changed since last commit — checks design tokens, serif italic, region pricing, mobile, and accessibility. Faster than full audit for incremental work. Use after making changes or before committing.
allowed-tools: Bash(git *) Bash(grep *) Read
---

## Changed files

!`git diff --name-only HEAD 2>/dev/null; git diff --name-only --cached 2>/dev/null; git ls-files --others --exclude-standard 2>/dev/null`

## Instructions

Audit only the files listed above. Skip files that are not `.tsx` or `.ts` in `src/`.

**Source of truth:** `src/app/globals.css` (v2 oklch tokens + `btn-*-v2` classes) and `src/components/ds/`. `docs/UI_STANDARDS.md` is legacy — do not audit toward its hex/type/radii. Surviving hard rules: SearchableSelect over native `<select>`, enums, `text-sm` mobile min. The check-in/kiosk surface is exempt from the color/radii/shadow rules where scannability or the QR encoder requires it — flag as justified, don't fix.

For each changed file, check:

### 1. Design tokens
- Any raw hex colors, `rgb()`, `rgba()`, `hsl()` values? Should use `var(--token)`. (Includes `var(--token, #fallback)` — drop the hex fallback. Exception: hex passed to the `QRCode` encoder / canvas is justified.)
- Any raw `oklch()` not referencing a CSS variable?
- **Off-scale radii**: Tailwind classes `rounded-sm|md|lg|xl|2xl|3xl` or `rounded-[Npx]` — must be `rounded-(--r-1|--r-2|--r-3)` or `rounded-full`.
- **Legacy Tailwind color classes**: `bg-white`, `text-foreground*`, `bg-background*`, `bg-primary-N`, `(text|bg|border)-(neutral|gray|slate|zinc|red|green|blue|yellow)-N` — must be tokens.
- **Shadows** (`shadow-sm|md|lg|xl`, `boxShadow`) outside modals / check-in.

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

### 6. Shared components
- Native `<select>` → must be `SearchableSelect` (`@/components/SearchableSelect`). Hard rule.
- Raw color `<button>` reimplementing a button → `btn-*-v2` classes or `@/components/Button`.
- Bespoke card/toggle/table markup duplicating a `src/components/ds/` primitive.
- Dashboard page with its own `min-h-screen`/breadcrumb chrome instead of a role shell (`*DashboardShell`).

## Output

For each file, report:

```
src/app/pricing/page.tsx — 2 issues
  L45: raw oklch value, should use var(--fg-3)
  L112: grid-cols-4 without responsive breakpoint
```

If no issues: `All changed files pass audit.`
