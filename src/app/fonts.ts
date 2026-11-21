import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";

/**
 * The brand fonts, self-hosted by next/font: downloaded at build time and
 * served from this site, with size-matched fallbacks so text
 * doesn't jump when the font arrives.
 *
 * They used to come from a fonts.googleapis.com stylesheet in <head>, which
 * blocked the first paint on a round trip to Google (about a second on a
 * throttled mobile connection) and leaked every visit to a third party.
 *
 * fonts.css points the design tokens (--font-sans, --font-mono,
 * --font-serif) at these variables; globals.css stays in sync with the
 * design system untouched.
 */
export const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-geist",
  // Not preloaded: on a slow mobile connection a preloaded font competes
  // with the CSS and JavaScript the first paint needs. Lighthouse (mobile,
  // simulated 4G) put the home page's LCP ~0.4s later with it preloaded.
  // display: swap paints the size-matched fallback first instead.
  preload: false,
});

export const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-geist-mono",
  // Mono is for small labels; not worth a preload on the critical path.
  preload: false,
});

export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument-serif",
  preload: false,
});

export const fontVariables = `${geist.variable} ${geistMono.variable} ${instrumentSerif.variable}`;
