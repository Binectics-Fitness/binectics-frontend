---
name: page
description: Scaffold a new marketing page with all Binectics conventions — topbar, footer, region context, design tokens, responsive grid.
argument-hint: [page-name]
arguments: [page_name]
allowed-tools: Bash(ls *) Bash(find *) Read Write
---

## Project conventions

!`cat CLAUDE.md | head -70`

## Existing marketing page for reference

Use `src/app/about/page.tsx` as the structural reference. All marketing pages follow this pattern.

## Scaffold instructions

Create a new marketing page at `src/app/$page_name/page.tsx` with:

### Structure

```tsx
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";

export default function PageNamePage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero section */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 pt-12 sm:pt-16 lg:pt-20 pb-8 sm:pb-12">
        {/* Hero content */}
      </section>

      {/* Content sections — each separated by border-bottom */}

      <MarketingFooter />
    </div>
  );
}
```

### Required conventions

- Background: `var(--bg)`
- Max width: `max-w-360` (1440px)
- Horizontal padding: `px-5 sm:px-10`
- Section spacing: `py-10 sm:py-16` with `borderBottom: 1px solid var(--border)`
- Hero h1: `text-[48px] sm:text-[60px] lg:text-[72px]` with `letterSpacing: -0.04em`, `color: var(--ink)`
- Eyebrow labels: `font-mono text-[11px] uppercase tracking-[0.06em]` with `color: var(--fg-3)`
- Body text: `text-[17px] leading-[1.55]` with `color: var(--fg-2)`
- Serif italic: maximum 1-2 instances per page, never on every heading
- One signal-colored button max per page
- Buttons: `min-h-11` for 44px touch targets
- Mobile: all grids must have responsive breakpoints (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`)

### After creation

1. Verify the page renders at `localhost:3001/$page_name`
2. Check mobile at 375px width
3. Report what was created and suggest content sections based on the page name
