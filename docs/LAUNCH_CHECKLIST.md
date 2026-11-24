# Pre-launch checklist: public site (January 2027)

## TL;DR

- Audited the 20-item launch checklist against `binectics-frontend` `main` (a47f5aed, 21 Nov 2026). Everything that needs no owner decision is fixed in five draft PRs:
  - #339 analytics and consent (first, because the PostHog work builds on it);
  - #340 security;
  - #341 legal drafts;
  - #342 SEO;
  - #344 performance and accessibility.
- **Status once the PRs land**: 7 done, 12 partial, 1 missing. Most of the "partial" items are partial only because an owner decision or fact is still outstanding.
- **Blockers only the owner can clear**:
  - the production API URL (production currently proxies to the **dev** API);
  - the legal name, address, RC number and DPO;
  - retention periods, minimum age, and the liability cap and venue;
  - prices and trial length;
  - the spam tool for a real contact endpoint;
  - whether GA stays now that PostHog (EU) is chosen. Recommendation: drop GA.
- **Mobile Lighthouse** (simulated throttling on a Moto G-class device, local production build): homepage performance went from 74 to 92 (median), accessibility from 94 to 100. See "Lighthouse" below.
- Claims rules applied:
  - iOS and App Store copy removed;
  - no invented numbers or entities left (removed "Binectics, Inc." and the "live sessions" label);
  - the fake `/legal` copy is gone;
  - no prices or trial lengths written; the legal drafts carry placeholders.

## What the site is

| Question | Answer | Evidence |
|---|---|---|
| Framework / router | Next.js 16.1.5, App Router, React 19, built with webpack (`next build --webpack`) | `package.json` |
| Hosting | **Netlify** (production, `binectics.netlify.app`, deploys from `main`) and **Vercel** (previews). An **Azure Web App** workflow also exists but is manual (`workflow_dispatch`) | `netlify.toml`, `.husky/pre-push`, `.github/workflows/main_binectics-frontend-app.yml` |
| API | Browser calls same-origin `/api/v1`, proxied by Netlify (`netlify.toml`) and `next.config.ts` rewrites to `API_UPSTREAM_URL`, which is **`binectics-gym-dev-api-…canadacentral…` (the DEV API)** | `netlify.toml:17`, `src/lib/api/upstream.ts:13` |
| binectics.com | A separate marketing site, repo `stop-gap-website` ("AI copilot for trainers and dietitians"). **Out of scope here**; it has its own privacy, terms and contact pages | `stop-gap-website/src/app` |
| Public marketing pages | `/`, `/about`, `/pricing`, `/contact`, `/help` (FAQ), `/qr-help`, `/privacy` (+ `?tab=terms`, `?tab=cookies`; `/terms` and `/cookies` redirect there), `/for-gyms`, `/for-trainers`, `/for-dietitians`, `/for-members`, `/features/dashboard`, `/features/qr-checkin`, `/features/client-journals`, `/features/multi-currency`, `/marketplace` and listing profiles `/marketplace/[slug]` | `src/app/*/page.tsx` |
| Auth pages (public, noindex) | `/login` (sign-in and sign-up panels), `/register/invite`, `/forgot-password`, `/reset-password`, `/verify-email`, `/verification`, account-state pages | `src/lib/routing/indexing.ts` |
| App / dashboard / admin | `/dashboard/**`, `/member/**`, `/admin/**`, `/onboarding/**`, `/checkout/**`, `/pay/**`, `/check-in/**`, `/teams/**`, `/forms/[id]` (shareable form fill), `/booking/**`, `/payments/return` | `src/middleware.ts` `protectedRoutes`, `indexing.ts` |

### Environment variables the browser can see

| Variable | Used for | Read at |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Optional API base; must stay **unset or same-origin** in production | `src/lib/api/client.ts`, `upstream.ts` |
| `NEXT_PUBLIC_APP_URL` | Canonical site URL override (default `https://binectics.netlify.app`) | `src/lib/site-url.ts` |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | GA4 id (only after consent, from #339) | `src/lib/analytics/consent.ts` |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog key; added by #339 so the banner appears; wired by the PostHog PR | `src/lib/analytics/consent.ts` |
| `NEXT_PUBLIC_FIREBASE_CONFIG`, `NEXT_PUBLIC_FIREBASE_VAPID_KEY` | Web push (public by design) | `src/lib/push/push.ts` |

`.env.example` also lists `NEXT_PUBLIC_STRIPE_*`, `NEXT_PUBLIC_FLUTTERWAVE_*`, `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_ENABLE_*` and `NEXT_PUBLIC_MAINTENANCE_MODE`. No code reads them. None is a secret.

## Checklist

Status is what holds **after the five PRs merge**. "Before" notes record what `main` had.

| # | Item | Status | Evidence | Fix | Needs owner? |
|---|---|---|---|---|---|
| 1 | Secrets off the frontend | **partial** | Source and built `.next/static` scanned: no Paystack secret, Azure connection string, private key or admin token. The only hit is Paystack inline-js's embedded RSA **public** key. The gateway-settings page lets a provider type their own secret key, which is sent to the API and is not bundled. **The production build proxies to the DEV API**: `netlify.toml:17`, `src/lib/api/upstream.ts:13` (mobile `eas.json` has the same bug) | #340 adds `scripts/check-client-secrets.mjs` as `postbuild`, which fails the build on secret patterns. API URL **not changed**, per the brief | **Yes**: production API URL |
| 2 | HTTPS forced, HSTS, security headers | **partial** | Before: nosniff, Referrer-Policy and X-Frame-Options only (`next.config.ts:55-77`). Netlify and Vercel force HTTPS on their domains | #340: HSTS 1 year with includeSubDomains (no preload), Permissions-Policy. CSP enforced for `frame-ancestors`, `object-src` and `base-uri`; the full allowlist (Paystack, Firebase, GA, same-origin API) is **report-only** until a preview shows no violations. Locally the only report is zod's harmless `Function("")` probe | Yes: flip the CSP to enforced after preview QA; turn on "HTTPS Only" on the Azure Web App if it is ever used; decide on HSTS preload |
| 3 | Form validation, client and server, Nigerian phone formats | **partial** | Sign-up: zod on the client (`src/lib/schemas/auth.ts`) and class-validator on the server (API `src/user/dto/register.dto.ts`), throttled at 5/min. **Contact form posted to `#` and dropped every message** (`src/app/contact/page.tsx:83`). No waitlist or provider-enquiry form exists in this repo. No public form asks for a phone number | #340: the contact form validates (schema matches the input limits), has a honeypot, and opens the visitor's email app addressed to help@binectics.com. Added a Nigerian phone validator, `src/lib/validation/ngPhone.ts` (+234 / 234 / 0…, mobile prefixes), ready for the first public phone field. Removed a fake `ContactForm` component | Yes: approve a real contact endpoint on the API (server validation) |
| 4 | Spam protection | **partial** | Honeypot on contact (#340). The API throttles auth routes (`@nestjs/throttler`) | **Proposal**: API `POST /public/contact` with a honeypot, a throttle of 3 per 10 minutes per IP, and **Cloudflare Turnstile**. Turnstile is free, privacy-friendly and has no image puzzles, which matters on low-end Android. hCaptcha is the alternative | **Yes**: pick the spam tool |
| 5 | Privacy policy (NDPA 2023) | **partial** | Before: v3.2 named Stripe and Flutterwave, Plausible and PostHog inconsistently, a "7 years" retention, and no legal entity, lawful bases, sensitive-data section or NDPC complaint right | #341: full draft from the real data flows (accounts, Paystack, health logs, Health Connect, fasting and faith plans, location, push, **PostHog EU** analytics with consent). Health and religion are flagged as sensitive data needing explicit consent. Has `[OWNER TO SUPPLY]` placeholders, a "Draft, pending legal review" note, and a **production build that fails** while either remains | **Yes**: legal name, RC number, address, DPO, NDPC registration, retention periods, hosting region, transfer mechanism, minimum age; then a lawyer's review |
| 6 | Terms and conditions | **partial** | Before: a short v2.4 with no entity, governing law, subscription or refund detail | #341: provider subscriptions, member payments (no cut), refunds (provider policy first, then help@), health and fasting disclaimer, acceptable use, liability, governing law (Nigeria), with placeholders. Same build gate | **Yes**: prices, trial length, notice period, plan-fee refund policy, liability cap, venue; lawyer's review |
| 7 | Cookie consent banner | **done** | Before: the banner always showed, listed Functional, Marketing (Meta + Google) and "PostHog" categories that don't exist, and defaulted analytics **on** outside the EU. GA **ignored it** (`src/components/GoogleAnalytics.tsx`) | #339: one optional category (Analytics), off by default for everyone, "Reject all" as prominent as "Accept all", shown only when an analytics tool is configured. GA loads only after consent and stops on withdrawal. Consent API for PostHog: `useConsent("analytics")`, `onAnalyticsConsentChange`, `registerAnalyticsSink`, and the `cookies:change` event | No |
| 8 | Unique meta title and description per public page | **done** | All public pages had titles and descriptions; `/pricing`'s named non-existent tiers; the 404 reused the home title; 8 pages had no canonical | #342: pricing description, 404 title (noindex), canonicals on `/for-*` and `/features/*` | No |
| 9 | Social preview image 1200×630 | **done** | None before | #342: `opengraph-image.png` and `twitter-image.png` with brand mark, wordmark and headline; **no app screens** | No (optional: approve the image) |
| 10 | Favicons, apple-touch-icon, manifest | **done** | Before: `icon.svg` and an SVG apple icon (iOS ignores SVG); no `.ico`, no manifest | #342: `favicon.ico` (16/32), PNG apple-touch-icon 180, manifest icons 192/512 plus maskable, `/manifest.webmanifest` | No |
| 11 | sitemap.xml and robots.txt, public only | **done** | Sitemap had public pages and listings only, but missed the 8 `/for-*` and `/features/*` pages. `robots.txt` disallows `/dashboard/`, `/admin/`, `/api/`; auth pages send `X-Robots-Tag: noindex` instead (deliberate, see `robots.ts`) | #342 adds the missing pages, plus tests that the sitemap never lists a private, auth or API path and that robots keeps app, admin and API out | No |
| 12 | Alt text | **done** | Crawl of 21 public pages: 0 `<img>` without `alt`. Marketing visuals are inline SVG/CSS; listing photos use `next/image` with alt | None needed | No |
| 13 | Compressed images, WebP/AVIF, lazy | **partial** | `next.config.ts` serves AVIF and WebP; `next/image` lazy-loads. 2.2 MB of unused, commercially licensed **Cera Pro .otf fonts are publicly served** from `public/fonts` | Nothing to convert: the marketing pages use inline SVG and CSS, not photos. Recommend deleting `public/fonts` (Cera Pro .otf, unused) | Yes, if the Cera Pro licence allows web serving; otherwise nothing |
| 14 | Mobile Lighthouse, before and after | **partial** | See "Lighthouse" below. On every page LCP is mostly render delay (CSS and JS on a throttled CPU), and it is still above 2.5 s, so this item stays partial | ##344: fonts self-hosted with `next/font` (not preloaded, size-matched fallbacks), which removes the third-party stylesheet. Next step: trim the home bundle (`DashboardMosaic` and `HeartbeatMotion` render on the client) | No |
| 15 | WCAG AA contrast | **partial** | Lighthouse flagged footer column titles (`--fg-4` on paper) on every page, plus a skipped heading level | Footer titles moved to `--fg-3` as `h2`. Lighthouse accessibility went from 94 to 100 on home and /help, and 96 on /pricing. The remaining pricing failures are `--fg-3` text on `--bg-2` cards (4.38:1), a design-system token synced by `tokens:check`, so it is flagged for design. The pricing toggle was moved to `--fg-2`. Text on images: the marketing pages put no text on photos | No |
| 16 | Mobile friendly at 360px | **partial** | Crawl at 360×740: `/legal` scrolled sideways (857px, page removed in #341), `/for-gyms` 366px. Footer social icons were 16×16 tap targets. Some 10–11px mono labels are design-system eyebrows | #344: `/for-gyms` KPI grid fixed (`minmax(0,1fr)`); footer social icons get 44px targets. A re-crawl at 360px finds no sideways scroll on 18 public pages and no tap target under 24px in main content or the footer. Tiny mono eyebrows left as designed | No (design: tiny mono labels) |
| 17 | Custom 404 and error page | **done** | `not-found.tsx` and `error.tsx` / `global-error.tsx` exist and link home | #342 title; #344 adds the main call to action ("Start free →") on the 404 | No |
| 18 | Broken links | **partial** | Crawled every link on the 21 public pages: all internal links answer 200. Outbound: `youtube.com/@binectics` is a **404**. `x.com`, `linkedin.com/company` and `instagram.com/binectics` answer but can't be verified as ours | YouTube link removed (#344) | **Yes**: confirm the X, LinkedIn and Instagram handles |
| 19 | Analytics, consent-gated, no sensitive data | **partial** | Owner chose **PostHog Cloud (EU)**; another agent is wiring it on #339 | #339: `track()` allows only `cta_click`, `sign_up_start` and `sign_up_complete`, with a property allowlist and plain-token values. Nothing is sent without consent; app pages are never measured. Page views come from the tool after consent | **Yes**: keep or drop GA. Recommendation: drop it once PostHog is live |
| 20 | One clear CTA per page, wording unchanged | **missing** | Pages carry the same primary CTA, "Start free →" (`/login?mode=signup`), with secondary links. The "website plan" document was not found in the repo or binectics-plans, so it could not be checked against it. CTA wording was not changed | None | **Yes**: share the website plan, or confirm "Start free" as the CTA |

Not in the table: binectics.com (`stop-gap-website`) is a different site with its own legal pages and contact form. If it is the launch site, it needs the same pass (**missing**).

## Lighthouse (mobile preset, simulated slow 4G, Moto G Power emulation; local `next build && next start`)

| Page | Perf before → after | Accessibility | Best practices | SEO* | LCP before → after | FCP before → after |
|---|---|---|---|---|---|---|
| `/` (home) | 88 → **92** | 94 → **100** | 100 → 100 | 66 → 66 | 3.3 s → 3.2 s | 2.3 s → **1.7 s** |
| `/pricing` | 94 → 93 | 94 → **96** | 100 → 100 | 66 → 66 | 2.9 s → 3.2 s | 1.8 s → **1.4 s** |
| `/help` (FAQ) | 92 → **94** | 94 → **100** | 100 → 100 | 66 → 66 | 3.2 s → 2.9 s | 1.8 s → **1.4 s** |

Figures are medians: 6 runs of `main` and 3 of #344, served side by side and measured alternately with `lighthouse@12.8.2`. Machine load from other agents swung between 4 and 60, so single runs vary by ±8 points. A first single run of `main` under heavier load scored home 74 with LCP 5.0 s. `/pricing` LCP is ~0.3 s worse because the self-hosted `@font-face` CSS is its own small render-blocking file; FCP is better, and no request goes to Google before consent. Total blocking time on home fell from ~110 ms to ~10 ms.

\*SEO is 66 on every local run because `localhost` is not the canonical host, so the middleware sends `X-Robots-Tag: noindex` (by design, to keep preview copies out of search). Every other SEO audit passes. "FAQ" is `/help`; there is no separate FAQ page. The home page also has an FAQ section.

## What the owner must supply or decide

1. **Production API URL.** Production proxies to the dev API (`netlify.toml`, `src/lib/api/upstream.ts`; mobile `eas.json` too).
2. **Legal entity**: registered company name, RC number, registered address.
3. **DPO**: name or firm, email and postal address; NDPC registration status (GAID tier).
4. **Legal facts**: retention periods, hosting region and transfer mechanism, minimum age, response time, liability cap, dispute venue, whether marketing emails will be sent; then a **lawyer's review** of #341.
5. **Prices and trial length** (also the price-change notice period and plan-fee refund policy).
6. **Analytics**: PostHog EU is chosen. Decide whether GA stays; the recommendation is to drop it.
7. **Spam tool** for a real contact endpoint: Cloudflare Turnstile (recommended) or hCaptcha, and approval of the API endpoint.
8. **Social handles** (X, LinkedIn, Instagram) and the support inboxes (help@, privacy@, sales@) are real and monitored.
9. **Website plan** for checking the per-page CTA (item 20).
10. **CSP**: after QA on a preview, approve flipping it from report-only to enforced.
11. **Cera Pro fonts** in `public/fonts`: confirm the licence, or let them be deleted.
12. Whether **binectics.com** (stop-gap-website) is part of this launch.

## Sources

- NDPA 2023 (Act No. 37, Official Gazette No. 119 Vol. 110): https://ncc.gov.ng/media/801/view
- NDPC GAID 2025: https://ndpc.gov.ng/wp-content/uploads/2025/07/NDP-ACT-GAID-2025-MARCH-20TH.pdf
- FPF, "Nigeria's New Data Protection Act, Explained": https://fpf.org/blog/nigerias-new-data-protection-act-explained/
- DLA Piper, Data Protection in Nigeria: https://www.dlapiperdataprotection.com/index.html?c=NG&t=law
