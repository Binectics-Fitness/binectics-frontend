# Legal drafts: privacy policy, terms, cookie policy

## TL;DR

- The privacy policy, terms of service and cookie policy at `/privacy` (tabs `?tab=terms`, `?tab=cookies`) were rewritten in November 2026 as **drafts for legal review**, from the app's real data flows. Source: `src/app/privacy/legalDocs.tsx`.
- **No lawyer has reviewed them.** Every page shows a "Draft, pending legal review" note while `LEGAL_STATUS` says `"draft"`.
- Facts only the owner can give (legal name, RC number, address, DPO, retention periods, minimum age, liability cap, venue, prices...) are `[OWNER TO SUPPLY: ...]` placeholders. Nothing was invented to fill them.
- **A production build fails** while any placeholder remains or any document is still `"draft"` (`src/lib/legal/legalReady.ts`, called from `next.config.ts`). Previews and local builds only warn, so the drafts can be read on a deploy preview.
- The old `/legal` page (an older copy with invented details) now redirects to `/privacy`.

## How the build check works

`next.config.ts` calls `assertLegalReady()` in the `next build` phase. It reads `src/app/privacy/legalDocs.tsx` and lists:

- every `[OWNER TO SUPPLY: ...]` placeholder;
- every document whose `LEGAL_STATUS` is still `"draft"`.

It throws, failing the build, when the build is a production deploy: Netlify `CONTEXT=production`, Vercel `VERCEL_ENV=production`, or `LEGAL_CHECK=strict` (set this on the Azure workflow or any other production pipeline). Otherwise it prints the list as a warning.

To finish: replace each placeholder with the real value, have counsel review the final text, then set that document's `LEGAL_STATUS` to `"reviewed"`.

## Where the content comes from

| Topic | Evidence |
|---|---|
| Health Connect (types, retention, sharing switches) | Unchanged from the reviewed v3.2 section, which matched the API `health-data` module |
| Fasting and faith plans | API `src/fasting` (plan kinds: ramadan, lent, daniel_fast, church, custom); mobile `src/faith/prayerTimes.ts` computes dawn and sunset on the phone from a chosen city (`src/faith/cities.ts`) |
| Device location | Mobile `src/hooks/useExplorePlace.ts` (foreground permission, Explore only) |
| Account deletion | API `src/account-deletion` purges at once and retries failures daily, within 30 days |
| Cookies | Web `src/lib/utils/storage.ts` (user_role, onboarding_complete, must_change_password), `src/lib/constants/regions.ts` (region cookies), API `auth.controller.ts` (access_token, refresh_token) |
| Payments | Paystack only (inline checkout and transfers); no cut of member payments (pricing page FAQ) |
| Processors | Azure, Netlify, Vercel, Cloudinary, Sentry, Firebase, Expo (existing policy); PostHog (EU) for consented analytics (owner decision, Nov 2026); the email provider is a placeholder |

Claims rules followed: no iOS / App Store, no health claims about fasting, prayer and sunset times described as estimates (never "accurate", "reviewed" or "guaranteed"), no prices or trial lengths.

## Law referred to (check every citation with counsel)

- Nigeria Data Protection Act 2023 (Act No. 37 of 2023, Official Gazette No. 119, Vol. 110). Gazette copy: https://ncc.gov.ng/media/801/view
- NDPC, General Application and Implementation Directive (GAID) 2025, issued 20 March 2025: https://ndpc.gov.ng/wp-content/uploads/2025/07/NDP-ACT-GAID-2025-MARCH-20TH.pdf
- Secondary summaries used to locate provisions:
  - Future of Privacy Forum, "Nigeria's New Data Protection Act, Explained": https://fpf.org/blog/nigerias-new-data-protection-act-explained/ (s.27 notice contents, s.30 sensitive data, s.31 children under 18 and parental consent, s.40 breach within 72 hours, ss.41-43 cross-border transfers)
  - DLA Piper, Data Protection in Nigeria: https://www.dlapiperdataprotection.com/index.html?c=NG&t=law (sensitive data categories include health and religious beliefs; GAID privacy-notice contents; major-importance registration tiers)
  - Section 30 summary: https://www.lawglobalhub.com/?p=66777

The section numbers above come from these secondary sources. The full Act text was not machine-readable in this session, so counsel should confirm each one against the gazette.

## Questions for counsel

1. Lawful basis for health data a **provider** keeps about a member (PAR-Q, session notes): is Binectics a processor for the provider there, and does the provider need its own notice?
2. Explicit consent for sensitive data: is starting a log, connecting Health Connect or starting a faith plan a clear enough affirmative act, or does each need a separate consent screen?
3. Cross-border transfer basis for Azure (the dev API runs in Canada Central; the production region is to be confirmed) and the US-based processors.
4. Whether Binectics is a data controller "of major importance" under the GAID (registration tier, annual compliance audit return, DPO duty).
5. Minimum age, and whether under-18 members can join with parental consent.
6. Retention periods for payment records under Nigerian tax law.
7. Enforceability of the liability cap and the dispute venue.
8. Consumer protection: the FCCPA 2018 and any rules on auto-renewal and refunds.
