---
name: design-ref
description: Check a page or component against its design-system prototype in binectics-design-system/binectics/ before or after building it. Finds the matching prototype HTML, extracts the intended structure and rules, and reports where the implementation drifts. Use when building or changing any UI surface, when asked whether something matches the design, and before opening a PR that touches a page.
allowed-tools: Bash(ls *) Bash(grep *) Bash(find *) Bash(git *) Read Glob
---

## Design reference check

The prototype is the specification. `binectics-design-system/binectics/`
holds ~165 built HTML surfaces — one per screen in the product. If you are
building a surface that exists there, you are re-implementing a design that
has already been decided, not inventing one.

Run this **before** writing a page (to know the target) and **after** (to
catch drift). It reports; it does not rewrite.

### 1. Locate the design system

Sibling checkout, same convention `scripts/sync-design-tokens.mjs` already
uses — override with `BINECTICS_DS` if it lives elsewhere:

!`ls -d "${BINECTICS_DS:-../binectics-design-system}/binectics" 2>/dev/null || echo "NOT FOUND — set BINECTICS_DS to the design-system checkout"`

If it is absent, say so and stop. Do not guess at a design; a page built
against no reference is the exact failure this skill exists to prevent.

### 2. Find the prototype for the surface

Prototypes are flat files named `<area>-<surface>.html`. Map from the app
route:

| app route | prototype |
|---|---|
| `/dashboard/dietitian/earnings` | `dietitian-earnings.html` |
| `/dashboard/gym-owner/members` | `gym-members.html` |
| `/dashboard/trainer/sessions` | `trainer-sessions-list.html` |
| `/dashboard/trainer/sessions/[id]` | `trainer-single-session.html` |
| `/dashboard/member/billing` | `member-billing-history.html` |
| `/admin/payments` | `admin-payments.html` |
| `/onboarding/...` | `onboarding-*.html` (25 of them) |
| marketing / auth / errors | unprefixed: `about.html`, `auth-*.html`, `error-*.html` |

Three traps, all of which caught this table on first write:

- `gym-owner` in routes maps to `gym-` in prototypes.
- Detail pages use `-single-` (`trainer-single-session.html`), not `[id]`.
- **The names are not mechanically derivable.** `/trainer/sessions` is
  `trainer-sessions-list`, not `trainer-sessions`; `/member/billing` is
  `member-billing-history`, not `member-billing`. Always `ls` before
  concluding a prototype is missing — a wrong guess reads identically to
  "no design exists", which is the one conclusion that lets someone invent
  a screen freely.

Search rather than assume:

```
ls "${BINECTICS_DS:-../binectics-design-system}/binectics" | grep -i <keyword>
grep -rl "<page heading text>" "${BINECTICS_DS:-../binectics-design-system}/binectics"
```

**If no prototype exists**, say so explicitly. That is a real finding: either
the surface is new (and `BUILD-PLAN.md` may already scope it) or it is one of
the fabricated pages that should not exist. Check `BUILD-PLAN.md` before
concluding it is unspecified.

### 3. Read the rules, once per session

`binectics/HANDOFF.md` is the design contract. The parts that get violated
most:

- **"Do not invent new colors."** Everything is in `shared.css`. A new colour
  must be derived in oklch at matched lightness/chroma.
- **One signal colour.** `--signal` is for primary CTAs, verified badges,
  success states and the check-in moment. *Nothing else.* Colouring a random
  accent with it defeats its purpose.
- **Role accents are matched at lightness ~0.55, chroma ~0.15** so a screen
  showing all four roles harmonises. Do not hand-pick a role colour.
- **Semantic colours stay semantic.** `--danger` red means something is
  wrong, never decoration.
- **1px hairlines, no shadows.**
- **The vibe test:** "if a design decision would feel at home on a Headspace
  marketing page, it's probably wrong for Binectics." Stripe Dashboard and
  Linear are the reference points.

`QA-AUDIT.md` and `ACTION-AUDIT.md` list known gaps in the prototypes
themselves — check before reporting a prototype omission as an app bug.

### 4. Compare

Read the prototype in full, then the implementation. Compare in this order —
the earlier items matter more than the later ones:

1. **Information architecture** — same sections, in the same order? A page
   that reorders or drops a section has diverged from a decision someone made
   deliberately.
2. **Hierarchy** — what is the primary action? The prototype's visual weight
   tells you. A CTA demoted to a ghost button is a real change.
3. **States** — empty, loading, error. Prototypes usually include these; they
   are the most commonly skipped part of a build.
4. **Copy** — headings and empty-state text are written, not placeholder.
   Prefer the prototype's wording over invented wording.
5. **Tokens** — `npm run tokens:check` already covers token *values*. Here,
   check token *choice*: is this using `--signal` where the prototype uses a
   neutral?

Do **not** diff markup literally. The prototype is static HTML; the app is
React with real data, shared shells and design-system components. Matching
`ProviderEarnings` against a hand-written `<div>` soup is noise.

### 5. Report

```
Design reference: <prototype>.html

  Prototype:     found / MISSING (surface not in the design system)
  IA:            matches / drifts — <what>
  Hierarchy:     matches / drifts — <what>
  States:        empty ✓/✗  loading ✓/✗  error ✓/✗
  Copy:          matches / invented — <what>
  Token choice:  clean / <violation>
```

List drift as findings the author can act on, each naming the prototype line
or section it came from. When the implementation is deliberately different,
say so and why — an intentional divergence recorded in the PR is fine; an
unnoticed one is the problem.

Never edit files in the design-system repo from here. It is the source of
truth, not an output.
