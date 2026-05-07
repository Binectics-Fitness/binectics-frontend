---
applyTo: "src/app/**/page.tsx,src/app/**/layout.tsx,src/app/**/route.ts"
---

# Reserve top-level route slugs

Marketplace listings get public URLs from a per-account-type slug
(`/gyms/:slug`, `/trainers/:slug`, `/dietitians/:slug`). To prevent owners
from claiming a slug that would shadow an existing route, the backend keeps
a reserved-words blocklist that **must stay in sync with the App Router**.

## When this rule fires

You are editing, creating, or deleting a route under `src/app/`. Determine
whether you are introducing a **new top-level segment** — i.e. a new
directory directly under `src/app/` such as `src/app/foo/page.tsx` or
`src/app/foo/[id]/page.tsx`.

> Only top-level segments matter. Nested routes like
> `src/app/dashboard/new-page/page.tsx` are already shielded by the
> `dashboard` reservation and do **not** need a blocklist update.

## What to do

If you added a new top-level segment named `<segment>`:

1. Open `binectics-api/src/marketplace/utils/slug.util.ts` and add
   `'<segment>'` to the `RESERVED_SLUGS` Set, in alphabetical order.
2. Open `binectics-api/scripts/backfill-listing-slugs.js` and add the same
   string to the inline `RESERVED` Set so the backfill script never assigns
   a colliding slug.
3. If the new route name might already be in use as a slug in production,
   call this out to the user — they may need to migrate affected listings.

If you removed a top-level segment that was previously reserved, leave the
entry in `RESERVED_SLUGS` (cheap, and protects against the route returning
later).

## Quick audit

If you are unsure which segments are currently reserved, the source of truth
is `binectics-api/src/marketplace/utils/slug.util.ts`. The list should be a
superset of:

```bash
ls -1 binectics-frontend/src/app | grep -v '^[._]' | grep -v '^layout\|^page\|^global\|^error\|^not-found\|^robots\|^sitemap'
```

Skip dotfiles and Next.js convention files (`layout.tsx`, `page.tsx`,
`error.tsx`, `not-found.tsx`, `globals.css`, `robots.ts`, `sitemap.ts`).
