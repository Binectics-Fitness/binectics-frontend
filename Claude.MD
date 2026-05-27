# Binectics

Global fitness marketplace — gyms, trainers, dietitians, enthusiasts. "Operating system for fitness."

## Hard Rules

### Frontend-only project

This repo is a frontend-only Next.js client. No backend code of any kind.
Reject: NestJS, Prisma, Express, `app/api/` routes, DB queries, server-side connections, backend deps.
Allow: React/Next.js components, API client calls to `NEXT_PUBLIC_API_URL`, client-side state (Context, hooks, localStorage).

### Enums for domain constants

Roles, statuses, booking states, provider roles, and similar fixed values must come from shared enums.
Reuse existing enums before adding new ones. No inline string unions or raw string comparisons when an enum exists.

### SearchableSelect, never native select

All dropdowns use `SearchableSelect` (`@/components/SearchableSelect`).
Props: `options: { label: string; value: string }[]`, `value`, `onChange`.
With react-hook-form: use `setValue()` inside `onChange` instead of `{...register()}`.
Country always appears before City in form field ordering.

### useSearchParams requires Suspense

Any component calling `useSearchParams()` must be wrapped in a `<Suspense>` boundary. Extract the hook into an inner component; export a wrapper with `<Suspense fallback={...}>`. Builds fail without this.

## Tech Stack

- Next.js 16 (App Router), React 19, Tailwind CSS 4
- Backend: external API on Azure (not in this repo)
- Fonts: Geist (display/body/UI), Geist Mono (numerals/timestamps/IDs/eyebrows), Instrument Serif Italic (marketing emphasis only, 1-2 per page max)

## Design Tokens (source of truth: globals.css)

```
Surfaces          --bg: oklch(0.985 0.005 85)  --bg-2: oklch(0.965 0.006 85)  --bg-3: oklch(0.945 0.007 85)
Foreground        --fg: oklch(0.18 0.008 80)   --fg-2: 0.36  --fg-3: 0.55  --fg-4: 0.72  --ink: 0.14
Borders           --border: oklch(0.91 0.006 85)  --border-2: oklch(0.86 0.008 85)
Signal (green)    --signal: oklch(0.68 0.16 148)  --signal-ink: oklch(0.22 0.05 148)  --signal-soft: oklch(0.94 0.04 148)
Role: consumer    --consumer: oklch(0.58 0.14 320)       --consumer-soft: oklch(0.94 0.03 320)
Role: gym         --gym: oklch(0.58 0.14 248)            --gym-soft: oklch(0.94 0.03 248)
Role: trainer     --trainer: oklch(0.72 0.13 75)          --trainer-soft: oklch(0.95 0.04 75)
Role: dietitian   --dietitian: oklch(0.58 0.14 300)       --dietitian-soft: oklch(0.95 0.03 300)
Role: admin       --admin: oklch(0.45 0.02 80)            --admin-soft: oklch(0.93 0.005 85)
Semantic          --danger: oklch(0.58 0.18 25)  --danger-soft: oklch(0.95 0.03 25)  --warn: oklch(0.72 0.14 75)
Radii             --r-1: 3px  --r-2: 6px  --r-3: 10px  --r-full: 999px (pills/avatars/toggles only)
Motion            --motion-fast: 120ms  --motion-base: 220ms  --motion-slow: 360ms  --motion-hero: 600ms (check-in only)
Easing            --ease-out: (.16,1,.3,1)  --ease-spring: (.34,1.4,.64,1)
```

## Design Principles

- One signal-colored button per page
- 1px hairlines, no shadows (except modals and check-in)
- Tabular nums on all number columns
- Sentence case only, no Title Case
- No emoji in product chrome
- No exclamation marks in product copy
- Mono uppercase for eyebrow labels (10-11px, +6% tracking)
- Only celebratory animation: QR check-in success
- Dark text on colored backgrounds

## Typography Hierarchy

- H1 (hero): 5xl-7xl, font-black, tight leading
- H2 (sections): 3xl-5xl, font-black
- H3 (cards): xl-2xl, font-bold
- Body: base-lg, font-normal, relaxed leading
- Small: sm, font-medium
- Minimum mobile body: text-sm (never text-xs for readable copy)

## Spacing System

- Section padding: py-20 sm:py-28
- Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Card padding: p-6 or p-8
- Grid gaps: gap-4, gap-6, gap-8, gap-12

## Component Patterns

- Cards: rounded-[--r-3], 1px border
- Buttons: h-12 or h-14, rounded-[--r-2], font-semibold
- Inputs: rounded-[--r-2]
- Modals: rounded-[--r-3], shadow-2

## Environment Variables

```
NODE_ENV, PORT (3001)
NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_API_URL
NEXT_PUBLIC_SESSION_TIMEOUT
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY, NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, NEXT_PUBLIC_GOOGLE_ANALYTICS_ID
NEXT_PUBLIC_SENTRY_DSN
NEXT_PUBLIC_ENABLE_ANALYTICS, NEXT_PUBLIC_ENABLE_COOKIE_CONSENT, NEXT_PUBLIC_MAINTENANCE_MODE
```

All secrets are backend-managed. Only `NEXT_PUBLIC_*` keys belong here.
