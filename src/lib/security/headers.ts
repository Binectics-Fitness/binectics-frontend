/**
 * Security headers sent on every response (next.config.ts headers()).
 *
 * Kept free of imports: next.config.ts loads this file before path aliases
 * exist.
 *
 * The Content-Security-Policy is split in two on purpose:
 *
 * - ENFORCED: only directives that cannot break a working page. Nobody may
 *   frame the app (clickjacking), no plugins, no <base> hijack.
 * - REPORT-ONLY: the full source allowlist. The browser logs what it WOULD
 *   block but blocks nothing. Paystack's checkout, Firebase push and the
 *   same-origin /api/v1 proxy must be watched on a preview first: a wrong
 *   allowlist entry breaks sign-in or payments, which is why it is not
 *   enforced yet. Once a preview shows no violations, move it to the
 *   enforced header.
 *
 * The browser never calls the Azure API directly (it goes through the
 * same-origin /api/v1 rewrite), so connect-src needs no API host.
 */

/** Paystack inline checkout: its iframe, its API, and the Apple Pay script it may load. */
const PAYSTACK = {
  script: ["https://js.paystack.co", "https://applepay.cdn-apple.com"],
  frame: ["https://checkout.paystack.com"],
  connect: ["https://api.paystack.co", "https://checkout.paystack.com"],
};

/** Firebase web push (src/lib/push) and its service worker's imports. */
const FIREBASE = {
  script: ["https://www.gstatic.com"],
  connect: [
    "https://fcmregistrations.googleapis.com",
    "https://firebaseinstallations.googleapis.com",
    "https://firebase.googleapis.com",
  ],
};

/**
 * Google Analytics. Loaded only after analytics consent (see
 * GoogleAnalytics.tsx), but the hosts must be allowed for the times it is.
 */
const GOOGLE_ANALYTICS = {
  script: ["https://www.googletagmanager.com"],
  connect: [
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://www.googletagmanager.com",
  ],
  img: ["https://www.google-analytics.com", "https://www.googletagmanager.com"],
};

/**
 * PostHog (EU cloud). Loaded only after analytics consent (see
 * PostHogAnalytics.tsx). Events go to the ingest host; the SDK fetches its
 * small extension scripts from the assets host. A custom
 * NEXT_PUBLIC_POSTHOG_HOST needs adding here too.
 */
const POSTHOG = {
  script: ["https://eu-assets.i.posthog.com"],
  connect: ["https://eu.i.posthog.com", "https://eu-assets.i.posthog.com"],
};

/** Google Fonts, while the root layout still links its stylesheet. */
const GOOGLE_FONTS = {
  style: ["https://fonts.googleapis.com"],
  font: ["https://fonts.gstatic.com"],
};

function directive(name: string, sources: string[]): string {
  return `${name} ${sources.join(" ")}`;
}

/** The directives that are enforced today. None of them can block a resource load. */
export function enforcedCsp(): string {
  return [
    directive("frame-ancestors", ["'self'"]),
    directive("object-src", ["'none'"]),
    directive("base-uri", ["'self'"]),
  ].join("; ");
}

/**
 * The full allowlist, sent as Content-Security-Policy-Report-Only.
 *
 * 'unsafe-inline' stays on script-src: Next.js inlines its bootstrap
 * scripts, and removing it needs per-request nonces (every page rendered
 * dynamically), which is a separate change with a performance cost.
 */
export function reportOnlyCsp(): string {
  return [
    directive("default-src", ["'self'"]),
    directive("script-src", [
      "'self'",
      "'unsafe-inline'",
      ...PAYSTACK.script,
      ...FIREBASE.script,
      ...GOOGLE_ANALYTICS.script,
      ...POSTHOG.script,
    ]),
    directive("style-src", ["'self'", "'unsafe-inline'", ...GOOGLE_FONTS.style]),
    directive("font-src", ["'self'", "data:", ...GOOGLE_FONTS.font]),
    // Provider photos come from Cloudinary and S3, gallery previews are
    // blob: URLs, QR codes are data: URLs.
    directive("img-src", ["'self'", "data:", "blob:", "https:"]),
    directive("connect-src", [
      "'self'",
      ...PAYSTACK.connect,
      ...FIREBASE.connect,
      ...GOOGLE_ANALYTICS.connect,
      ...POSTHOG.connect,
    ]),
    directive("frame-src", ["'self'", ...PAYSTACK.frame]),
    directive("worker-src", ["'self'", "blob:"]),
    directive("manifest-src", ["'self'"]),
    directive("media-src", ["'self'", "blob:", "data:"]),
    directive("frame-ancestors", ["'self'"]),
    directive("object-src", ["'none'"]),
    directive("base-uri", ["'self'"]),
  ].join("; ");
}

export interface Header {
  key: string;
  value: string;
}

export function securityHeaders(): Header[] {
  return [
    { key: "X-DNS-Prefetch-Control", value: "on" },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    // One year, this host and any below it. No "preload": submitting a
    // domain to the browsers' preload list is the domain owner's call and
    // hard to undo.
    { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
    // The camera is used by QR check-in and location by the marketplace,
    // both on this origin only. Paystack's checkout frame keeps the payment
    // feature (card wallets such as Apple Pay run inside it). Nothing uses
    // the microphone or USB.
    {
      key: "Permissions-Policy",
      value: 'camera=(self), geolocation=(self), microphone=(), usb=(), payment=(self "https://checkout.paystack.com")',
    },
    { key: "Content-Security-Policy", value: enforcedCsp() },
    { key: "Content-Security-Policy-Report-Only", value: reportOnlyCsp() },
  ];
}
