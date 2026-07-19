# Binectics UI Standards

> **⚠️ This document described the v1 design system (hex palette, `text-2xl font-black`
> type, `rounded-2xl` radii, `<Button variant="accent-blue">`). That system is
> RETIRED.** The current system is the **v2 token layer** defined in
> [`src/app/globals.css`](../src/app/globals.css) — see **CLAUDE.md → "Design Tokens
> (source of truth: globals.css)"** for the authoritative reference. Do not build
> toward the old hex/Tailwind-scale values below the fold; they no longer match the code.

## Current system (v2) — the short version

**Source of truth:** `src/app/globals.css` — oklch tokens + `btn-*-v2` utility classes.
**Shared components:** `src/components/ds/` (`DSCard`, `DSTable`, the `*DashboardShell` role shells, `ChipEditor`, …).
**Upstream spec:** `binectics-design-system/shared.css` (token definitions; globals.css is the runtime copy).

### Compliance means

| Concern | Compliant | Not compliant |
| --- | --- | --- |
| Color | `var(--ink)`, `var(--fg-3)`, `bg-bg`, `text-ink`, `border-border` | raw hex/`rgb()`/`oklch()` literals; `bg-white`, `text-foreground`, `bg-primary-500`, `bg-neutral-N` |
| Radius | `rounded-(--r-1\|--r-2\|--r-3)`, `rounded-full` | `rounded-sm/md/lg/xl/2xl`, `rounded-[Npx]` |
| Buttons | `btn-primary-v2` / `btn-ghost-v2` / `btn-signal-v2` (`+ .sm/.md/.lg`), or `@/components/Button` | raw `<button className="…bg-…">` |
| Dropdowns | `SearchableSelect` (`@/components/SearchableSelect`) | native `<select>` |
| Cards / tables / shells | `src/components/ds/*` primitives | bespoke markup duplicating them |
| Shadows | none (hairline `1px` borders) | `shadow-*` — **except** modals and the check-in/kiosk surface |
| Type | Geist; mono-uppercase eyebrows (10–11px); `text-sm` mobile min | `font-black`, `text-xs` for body copy |

### Hard rules that carried over from v1 (still enforced — see CLAUDE.md)

- **`SearchableSelect`, never native `<select>`.** Options `{ label, value }[]`, `value`, `onChange`. Country before City.
- **Enums for domain constants** — no inline string unions where a shared enum exists.
- **`text-sm` (14px) minimum** for readable body copy on mobile.
- **Dark text on colored backgrounds**; one signal-colored button per page; sentence case; no emoji in product chrome.

### Justified exceptions

The **check-in / kiosk** surface (`dashboard/gym-owner/kiosk`, `/check-in/*`) is intentionally exempt from the shadow rule (CLAUDE.md), and its QR encoder takes literal hex (`#03314b`/`#ffffff`) because the `QRCode` library and canvas cannot read CSS variables. Flag these in audits as justified rather than "fixing" them.

## Auditing

- `/diff-audit` — checks changed files against the rules above (run before committing).
- `/audit [scope]` — full project sweep (`tokens`, `components`, `mobile`, `serif`, `region`, `all`).
- `/enforce "<rule>"` — sweep one rule across the whole codebase.
