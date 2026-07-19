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

- **Design tokens source of truth: `src/app/globals.css`** (the "v2" oklch token layer + `btn-*-v2` utility classes). This is canonical — CLAUDE.md says so.
- **`docs/UI_STANDARDS.md` is LEGACY** — its hex colors (`#00d991`, `#03314b`), Tailwind-scale type (`text-2xl font-black`), and `rounded-2xl/xl` radii are superseded by the token layer. Do NOT audit toward it. The only rules that survive from it (re-asserted in CLAUDE.md) are: SearchableSelect over native `<select>`, enums for domain constants, and `text-sm` mobile minimum.
- Region pricing: all marketing pages must use `useRegion()` from `@/contexts/RegionContext`
- Serif italic: Instrument Serif italic limited to 1-2 instances per page max
- Mobile: 44px min touch targets (min-h-11), responsive at 320-430px
- **Design system components: `src/components/ds/`** — prefer these over bespoke markup that duplicates them (`DSCard`, `DSTable`, shells, `ChipEditor`, etc.).
- **Dropdowns: `SearchableSelect` (`@/components/SearchableSelect`), never native `<select>`.** Hard rule.
- **No shadows** except modals and the check-in/kiosk surface (which is also exempt from the hardcoded-color and radii rules where the QR encoder / scannability genuinely requires it — flag those as justified, don't force a fix).

## Audit scope

If `$scope` is provided, only run that specific audit. Valid scopes: `mobile`, `tokens`, `serif`, `region`, `components`, `all`.
If no scope is provided, run all audits.

## Audits to run

### 1. Serif italic audit
Find every file in `src/app/` that uses `font-serif` or `Instrument Serif` or `italic` class combinations. Count instances per file. Flag any file with more than 2.

### 2. Region pricing audit
Find every file in `src/app/` and `src/components/` that contains hardcoded currency symbols (`$`, `₦`, `£`, `€`, `R `, `KSh`, `₹`, `د.إ`) followed by numbers. These should use `useRegion()` instead. Exclude:
- `src/lib/constants/regions.ts` (the price table itself)
- Demo components (GymOwnerDemo, TrainerDemo, etc.)
- Dashboard pages

### 3. Design token audit (scope: `tokens`)
Find CSS values in `src/app/` and `src/components/` that bypass the token layer. Look for:
- Raw hex colors (`#xxx`) — including inside `var(--token, #fallback)`; the fallback should be dropped since the token always exists. **Exception:** hex passed to a non-CSS consumer (e.g. the `QRCode` encoder, canvas) is justified — flag, don't fix.
- Raw `rgb()` / `rgba()` / `hsl()`
- Raw `oklch()` values that don't reference `var(--)`
- **Off-scale radii — Tailwind scale classes** (`rounded-sm`/`md`/`lg`/`xl`/`2xl`/`3xl`) or `rounded-[Npx]`. Must be `rounded-(--r-1|--r-2|--r-3)` or `rounded-full`.
- **Legacy Tailwind color classes**: `bg-white`, `bg-black`, `text-foreground*`, `bg-background*`, `bg-primary-N`, and `(text|bg|border)-(neutral|gray|slate|zinc|red|green|blue|yellow)-N`. Must be tokens (`var(--…)` / `bg-bg`, `text-ink`, `border-border`, etc.).
- **Shadows** (`shadow-sm|md|lg|xl`, `boxShadow`) outside modals and the check-in/kiosk surface.
Exclude `globals.css` and `tailwind.config`.

### 4. Mobile responsiveness audit (scope: `mobile`)
Find components that may have mobile issues:
- Buttons or links without `min-h-11` (44px touch target)
- `grid-cols-3` or `grid-cols-4` without responsive breakpoints (`sm:` or `lg:` prefix)
- Fixed widths (`w-[XXXpx]`) without responsive alternatives
- Tables without `overflow-x-auto`
- Text smaller than `text-sm` used for readable body copy

### 5. Shared-component audit (scope: `components`)
Find bespoke markup that should use a shared component:
- **Native `<select>`** anywhere in `src/app/` or `src/components/` (excluding `SearchableSelect.tsx` itself) — must be `SearchableSelect`. Hard rule.
- Raw `<button className="…bg-…">` that reimplements a button — should use the `btn-primary-v2` / `btn-ghost-v2` / `btn-signal-v2` utility classes (with `.sm`/`.md`/`.lg`) or `@/components/Button`.
- Hand-rolled card/table/toggle markup that duplicates a `src/components/ds/` primitive.
- A dashboard page that renders its own page chrome (`min-h-screen` wrapper + bespoke breadcrumb) instead of the role shell (`GymDashboardShell` / `TrainerDashboardShell` / `DietitianDashboardShell` / `AdminDashboardShell`).

## Output format

Report as a table per audit:

```
| File | Issue | Line | Severity |
```

End with a summary: X issues found across Y files. List the files that need attention first.
