/**
 * Pages that showed invented data and were removed, sent to the real page
 * that does the job now. Someone may still arrive from an old bookmark or a
 * link shared before they went, so they redirect instead of 404ing.
 *
 * Only addresses whose target is the same for everyone live here (they run
 * in next.config, before the middleware, signed in or not). An address
 * whose target depends on the role belongs in legacyLinks.ts, which reads
 * the user_role cookie.
 *
 * Temporary (307), not permanent: a browser caches a 308 for good, and
 * some of these addresses may get a real page again.
 */
export interface RemovedPageRedirect {
  source: string;
  destination: string;
  permanent: false;
}

export const REMOVED_PAGE_REDIRECTS: RemovedPageRedirect[] = [
  // The fake workout builder; programs is where a trainer builds one, and
  // ?new=1 opens its builder straight away.
  {
    source: "/dashboard/trainer/workouts/create",
    destination: "/dashboard/trainer/programs?new=1",
    permanent: false,
  },
  // The fake review form (it submitted nothing). Reviews are written on a
  // listing's page, and a provider id doesn't name a listing.
  { source: "/review/:providerId", destination: "/marketplace", permanent: false },
  // Listed before the booking-id rule so it never reads as an id.
  { source: "/booking/confirmed", destination: "/dashboard/bookings", permanent: false },
  // The fake booking detail. Only a real booking id (an ObjectId) carries
  // over, as the ?booking= the bookings page opens; /booking/recurring and
  // /booking/:id/receipt are real pages and don't match.
  {
    source: "/booking/:id([a-fA-F0-9]{24})",
    destination: "/dashboard/bookings?booking=:id",
    permanent: false,
  },
  // The fake member help desk; the help centre is the real one.
  { source: "/dashboard/member/help", destination: "/help", permanent: false },
  // The fake unsubscribe page (it pretended to save). No email carries an
  // unsubscribe token; email choices are made in notification settings.
  {
    source: "/unsubscribe/:token",
    destination: "/dashboard/settings/notifications",
    permanent: false,
  },
  // Invented company pages: a press page reporting a funding round that
  // never happened, made-up job openings, and blog posts with invented
  // authors. About is the one real page about the company.
  { source: "/press", destination: "/about", permanent: false },
  { source: "/careers", destination: "/about", permanent: false },
  // Partners listed industry bodies we have no relationship with.
  { source: "/partners", destination: "/about", permanent: false },
  { source: "/blog", destination: "/", permanent: false },
  { source: "/blog/:slug", destination: "/", permanent: false },
  // A status page that hardcoded "Operational" for every service.
  { source: "/status", destination: "/help", permanent: false },
  // A gym-owner "Marketing tools" page of invented KPIs and discount codes.
  { source: "/dashboard/gym-owner/marketing", destination: "/dashboard/gym-owner", permanent: false },
];
