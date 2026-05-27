"use client";

import { useState, useCallback, Suspense } from "react";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";

/* ──────────────────────────────────────────────────────────────────
   Legal — Privacy / Terms / Cookies
   Matches /tmp/binectics-proto/binectics/legal.html pixel-for-pixel
   ────────────────────────────────────────────────────────────────── */

type DocTab = "privacy" | "terms" | "cookies";

/* ── TOC definitions ─────────────────────────────────────────────── */
const TOC: Record<DocTab, { id: string; label: string; n: string }[]> = {
  privacy: [
    { id: "p-1", label: "Plain‑English summary", n: "00" },
    { id: "p-2", label: "What we collect", n: "01" },
    { id: "p-3", label: "Why we collect it", n: "02" },
    { id: "p-4", label: "Who we share with", n: "03" },
    { id: "p-5", label: "Where it lives", n: "04" },
    { id: "p-6", label: "How long we keep it", n: "05" },
    { id: "p-7", label: "Your rights", n: "06" },
    { id: "p-8", label: "Contact us", n: "07" },
  ],
  terms: [
    { id: "t-1", label: "Plain‑English summary", n: "00" },
    { id: "t-2", label: "Who can use Binectics", n: "01" },
    { id: "t-3", label: "Your account", n: "02" },
    { id: "t-4", label: "Providers & members", n: "03" },
    { id: "t-5", label: "Payments & refunds", n: "04" },
    { id: "t-6", label: "Verification", n: "05" },
    { id: "t-7", label: "Content & conduct", n: "06" },
    { id: "t-8", label: "Termination", n: "07" },
    { id: "t-9", label: "Liability", n: "08" },
    { id: "t-10", label: "Disputes", n: "09" },
  ],
  cookies: [
    { id: "c-1", label: "Plain‑English summary", n: "00" },
    { id: "c-2", label: "Your preferences", n: "01" },
    { id: "c-3", label: "Required cookies", n: "02" },
    { id: "c-4", label: "Functional cookies", n: "03" },
    { id: "c-5", label: "Analytics", n: "04" },
    { id: "c-6", label: "Marketing", n: "05" },
    { id: "c-7", label: "Browser controls", n: "06" },
  ],
};

const TABS: { key: DocTab; label: string; version: string }[] = [
  { key: "privacy", label: "Privacy", version: "v 3.1" },
  { key: "terms", label: "Terms of service", version: "v 4.0" },
  { key: "cookies", label: "Cookies", version: "v 2.2" },
];

/* ── Styles (inline objects matching prototype CSS exactly) ───── */
const S = {
  hero: { maxWidth: 1440, margin: "0 auto", padding: "56px 40px 28px" } as const,
  eyebrow: {
    fontFamily: "var(--font-mono)",
    fontSize: "11px",
    color: "var(--fg-3)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  },
  h1: {
    fontSize: 48,
    letterSpacing: "-0.032em",
    fontWeight: 500,
    lineHeight: 1.02,
    marginTop: 14,
    maxWidth: "18ch",
    color: "var(--ink)",
  },
  heroP: {
    color: "var(--fg-2)",
    fontSize: 16,
    maxWidth: "56ch",
    marginTop: 16,
    lineHeight: 1.55,
  },
  meta: {
    fontFamily: "var(--font-mono)",
    fontSize: "11.5px",
    color: "var(--fg-3)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    marginTop: 22,
    display: "flex",
    gap: 24,
    flexWrap: "wrap" as const,
  },
  metaStrong: {
    color: "var(--ink)",
    fontFamily: "var(--font-sans)",
    fontSize: 13,
    letterSpacing: "-0.005em",
    textTransform: "none" as const,
    fontWeight: 500,
  },
  switcher: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "0 40px",
    borderBottom: "1px solid var(--border)",
  },
  switcherTab: (active: boolean) => ({
    padding: "16px 18px",
    fontSize: "14.5px",
    color: active ? "var(--ink)" : "var(--fg-3)",
    borderBottom: active ? "2px solid var(--ink)" : "2px solid transparent",
    marginBottom: -1,
    display: "inline-flex" as const,
    alignItems: "baseline" as const,
    gap: 10,
    cursor: "pointer" as const,
    fontWeight: active ? 500 : 400,
    background: "none",
    transition: "color var(--motion-fast) var(--ease), border-color var(--motion-fast) var(--ease)",
  }),
  switcherV: (active: boolean) => ({
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: active ? "var(--fg-3)" : "var(--fg-4)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
  }),
  layout: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "40px 40px 96px",
    display: "grid" as const,
    gridTemplateColumns: "260px 1fr 240px",
    gap: 56,
    alignItems: "start" as const,
  },
  tocAside: {
    position: "sticky" as const,
    top: 24,
    display: "flex",
    flexDirection: "column" as const,
    gap: 2,
  },
  tocLabel: {
    fontFamily: "var(--font-mono)",
    fontSize: "10.5px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "var(--fg-3)",
    padding: "4px 10px 8px",
  },
  tocLink: (active: boolean) => ({
    padding: active ? "6px 10px 6px 8px" : "6px 10px",
    fontSize: 13,
    color: active ? "var(--ink)" : "var(--fg-3)",
    borderRadius: "var(--r-2)",
    cursor: "pointer" as const,
    display: "flex" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    background: active ? "var(--bg-2)" : "transparent",
    fontWeight: active ? 500 : 400,
    borderLeft: active ? "2px solid var(--ink)" : "2px solid transparent",
    transition: "color var(--motion-fast) var(--ease), background var(--motion-fast) var(--ease)",
    textDecoration: "none" as const,
  }),
  tocN: (active: boolean) => ({
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: active ? "var(--ink)" : "var(--fg-4)",
  }),
  docH2: (isFirst: boolean) => ({
    fontSize: 26,
    letterSpacing: "-0.022em",
    fontWeight: 500,
    lineHeight: 1.1,
    marginTop: isFirst ? 0 : 56,
    paddingTop: isFirst ? 0 : 12,
    borderTop: isFirst ? "none" : "1px solid var(--border)",
    color: "var(--ink)",
  }),
  docNum: {
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    color: "var(--fg-3)",
    fontWeight: 400,
    marginRight: 12,
    letterSpacing: "0.04em",
  },
  docH3: {
    fontSize: 16,
    fontWeight: 500,
    letterSpacing: "-0.005em",
    color: "var(--ink)",
    margin: "28px 0 10px",
  },
  docP: {
    fontSize: 15,
    color: "var(--fg-2)",
    lineHeight: 1.65,
    margin: "0 0 14px",
    maxWidth: "60ch",
  },
  docStrong: { color: "var(--ink)", fontWeight: 500 },
  docUl: {
    margin: "0 0 14px",
    paddingLeft: 22,
    color: "var(--fg-2)",
    fontSize: 15,
    lineHeight: 1.65,
    maxWidth: "60ch",
  },
  plainBox: {
    background: "var(--bg-2)",
    borderLeft: "2px solid var(--ink)",
    padding: "12px 16px",
    borderRadius: "0 var(--r-2) var(--r-2) 0",
    margin: "16px 0",
    maxWidth: "60ch",
  },
  plainH: {
    fontFamily: "var(--font-mono)",
    fontSize: "10.5px",
    color: "var(--fg-3)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: 4,
  },
  plainP: {
    margin: 0,
    fontSize: 14,
    color: "var(--ink)",
    lineHeight: 1.5,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    margin: "16px 0 20px",
    fontSize: "13.5px",
    maxWidth: "60ch",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-2)",
    overflow: "hidden" as const,
  },
  th: {
    textAlign: "left" as const,
    padding: "10px 14px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-2)",
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--fg-3)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    fontWeight: 500,
  },
  td: {
    textAlign: "left" as const,
    padding: "10px 14px",
    borderBottom: "1px solid var(--border)",
  },
  tdLast: {
    textAlign: "left" as const,
    padding: "10px 14px",
    borderBottom: 0,
  },
  tdK: {
    color: "var(--ink)",
    fontWeight: 500,
    width: "30%",
  },
  rightRail: {
    position: "sticky" as const,
    top: 24,
    display: "flex",
    flexDirection: "column" as const,
    gap: 18,
  },
  railH: {
    fontFamily: "var(--font-mono)",
    fontSize: "10.5px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    color: "var(--fg-3)",
    marginBottom: 8,
  },
  railCard: {
    background: "var(--bg-2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-3)",
    padding: "16px 18px",
  },
  railCardP: {
    fontSize: 13,
    color: "var(--fg-2)",
    lineHeight: 1.55,
    margin: "0 0 10px",
  },
  railAction: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--ink)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    padding: "6px 10px",
    border: "1px solid var(--border)",
    borderRadius: "var(--r-2)",
    background: "var(--bg)",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    textDecoration: "none" as const,
    cursor: "pointer" as const,
  },
  anchorRow: {
    display: "flex",
    gap: 6,
    flexWrap: "wrap" as const,
    marginTop: 24,
    paddingTop: 16,
    borderTop: "1px solid var(--border)",
  },
  anchorLink: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--fg-2)",
    padding: "4px 10px",
    border: "1px solid var(--border)",
    borderRadius: 999,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    cursor: "pointer" as const,
    background: "none",
  },
  cookieRow: {
    padding: "12px 0",
    borderBottom: "1px solid var(--border)",
    display: "grid" as const,
    gridTemplateColumns: "1fr auto",
    gap: 12,
    alignItems: "center" as const,
    maxWidth: "60ch",
  },
  cookieName: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--ink)",
    letterSpacing: "-0.005em",
  },
  cookieMeta: {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    color: "var(--fg-3)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    marginTop: 3,
    display: "flex" as const,
    gap: 8,
    alignItems: "center" as const,
  },
  code: {
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    color: "var(--ink)",
  },
};

/* ── Cookie toggle component ─────────────────────────────────── */
function CookieToggle({ locked, defaultOn }: { locked?: boolean; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn ?? true);

  const baseStyle: React.CSSProperties = {
    width: 30,
    height: 18,
    borderRadius: 999,
    position: "relative",
    cursor: locked ? "not-allowed" : "pointer",
    flexShrink: 0,
    background: locked
      ? "var(--signal)"
      : on
        ? "var(--ink)"
        : "var(--border-2)",
    transition: "background var(--motion-fast) var(--ease)",
  };

  const knobStyle: React.CSSProperties = {
    position: "absolute",
    width: 14,
    height: 14,
    background: "var(--bg)",
    borderRadius: "50%",
    top: 2,
    left: locked ? 14 : on ? 14 : 2,
    transition: "left var(--motion-fast) var(--ease)",
  };

  return (
    <span
      style={baseStyle}
      onClick={() => { if (!locked) setOn(!on); }}
      role="switch"
      aria-checked={locked ? true : on}
    >
      <span style={knobStyle} />
    </span>
  );
}

/* ── Dot separator for cookie meta ────────────────────────────── */
function Dot() {
  return (
    <span
      style={{
        width: 2,
        height: 2,
        background: "var(--border-2)",
        borderRadius: "50%",
        flexShrink: 0,
      }}
    />
  );
}

/* ── Privacy doc ──────────────────────────────────────────────── */
function PrivacyDoc({ onJump }: { onJump: (t: DocTab) => void }) {
  return (
    <article style={{ maxWidth: 720 }}>
      <h2 id="p-1" style={S.docH2(true)}>
        <span style={S.docNum}>00</span>Plain{"‑"}English summary
      </h2>
      <div style={S.plainBox}>
        <div style={S.plainH}>In one paragraph</div>
        <p style={S.plainP}>
          We collect what we need to run a marketplace — your account info, what you book, who you message, and how you pay. We use it to keep the service working, prevent fraud, and follow the law. <strong style={S.docStrong}>We don&apos;t sell your data, ever.</strong> You can download a full copy or delete your account from settings, any time, and the deletion is real.
        </p>
      </div>

      <h2 id="p-2" style={S.docH2(false)}>
        <span style={S.docNum}>01</span>What we collect
      </h2>
      <p style={S.docP}>Three categories — what you give us, what we observe, and what others tell us.</p>
      <h3 style={S.docH3}>You give us</h3>
      <ul style={S.docUl}>
        <li><strong style={S.docStrong}>Account info</strong> — name, email, phone, password (hashed with bcrypt + per{"‑"}user salt).</li>
        <li><strong style={S.docStrong}>Provider documents</strong> — ID, certifications, insurance, bank details. Used only for verification and payouts.</li>
        <li><strong style={S.docStrong}>Booking data</strong> — sessions, plans, payments, messages with the other side of the marketplace.</li>
        <li><strong style={S.docStrong}>Optional logs</strong> — weight, photos, mood, meal logs, workout adherence. You choose what to share with which provider.</li>
      </ul>
      <h3 style={S.docH3}>We observe</h3>
      <ul style={S.docUl}>
        <li><strong style={S.docStrong}>How you use the product</strong> — pages viewed, searches, taps. Stored against a rotating device ID, not your account, where possible.</li>
        <li><strong style={S.docStrong}>Device &amp; network</strong> — browser, OS, IP, approximate city. Used for fraud detection and to localize the experience.</li>
      </ul>
      <h3 style={S.docH3}>Others tell us</h3>
      <ul style={S.docUl}>
        <li><strong style={S.docStrong}>Payment processors</strong> — Stripe, Paystack, Flutterwave send us card last{"‑"}4, expiry, and fraud signals. We never see the full card number.</li>
        <li><strong style={S.docStrong}>Verification partners</strong> — confirm a certification is real or an ID is valid. We log the outcome, not the documents themselves where avoidable.</li>
      </ul>

      <h2 id="p-3" style={S.docH2(false)}>
        <span style={S.docNum}>02</span>Why we collect it
      </h2>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>We collect</th>
            <th style={S.th}>Because</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...S.td, ...S.tdK }}>Account &amp; bookings</td>
            <td style={S.td}>To run the service — without this, you can&apos;t book anything.</td>
          </tr>
          <tr>
            <td style={{ ...S.td, ...S.tdK }}>Payment data</td>
            <td style={S.td}>To charge you, pay providers, and prevent stolen{"‑"}card use.</td>
          </tr>
          <tr>
            <td style={{ ...S.td, ...S.tdK }}>Provider documents</td>
            <td style={S.td}>So members can trust the green verified badge.</td>
          </tr>
          <tr>
            <td style={{ ...S.td, ...S.tdK }}>Health logs</td>
            <td style={S.td}>So your coach can do their job. Visible to <em>only</em> the providers you choose.</td>
          </tr>
          <tr>
            <td style={{ ...S.tdLast, ...S.tdK }}>Behavioral data</td>
            <td style={S.tdLast}>To improve the product and catch fraud. Aggregated, not sold.</td>
          </tr>
        </tbody>
      </table>

      <h2 id="p-4" style={S.docH2(false)}>
        <span style={S.docNum}>03</span>Who we share it with
      </h2>
      <p style={S.docP}>A short list. We never add to it without telling you.</p>
      <ul style={S.docUl}>
        <li><strong style={S.docStrong}>The other side of your bookings</strong> — your coach sees what you&apos;d expect (name, sessions, messages, logs you&apos;ve shared).</li>
        <li><strong style={S.docStrong}>Payment processors</strong> — Stripe, Paystack, Flutterwave, Razorpay, depending on your country.</li>
        <li><strong style={S.docStrong}>Infrastructure providers</strong> — Cloudflare, AWS (eu{"‑"}west{"‑"}1, af{"‑"}south{"‑"}1), Postmark for email.</li>
        <li><strong style={S.docStrong}>Government authorities</strong> — only when legally required, with the narrowest possible response.</li>
      </ul>

      <h2 id="p-5" style={S.docH2(false)}>
        <span style={S.docNum}>04</span>Where it lives
      </h2>
      <p style={S.docP}>
        Primary database: <strong style={S.docStrong}>Cape Town, ZA</strong> (af{"‑"}south{"‑"}1). Real{"‑"}time replica: <strong style={S.docStrong}>Dublin, IE</strong> (eu{"‑"}west{"‑"}1) for backup and EU latency. Encrypted backups go to S3 with monthly rotation and 30{"‑"}day retention.
      </p>

      <h2 id="p-6" style={S.docH2(false)}>
        <span style={S.docNum}>05</span>How long we keep it
      </h2>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Data</th>
            <th style={S.th}>Retention</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...S.td, ...S.tdK }}>Bookings &amp; payments</td>
            <td style={S.td}>7 years (tax compliance)</td>
          </tr>
          <tr>
            <td style={{ ...S.td, ...S.tdK }}>Messages</td>
            <td style={S.td}>2 years after last interaction</td>
          </tr>
          <tr>
            <td style={{ ...S.td, ...S.tdK }}>Health &amp; meal logs</td>
            <td style={S.td}>Deleted with your account - purged after 30 days</td>
          </tr>
          <tr>
            <td style={{ ...S.td, ...S.tdK }}>Verification documents</td>
            <td style={S.td}>Hash + outcome only retained - originals deleted in 90 days</td>
          </tr>
          <tr>
            <td style={{ ...S.tdLast, ...S.tdK }}>Behavioral analytics</td>
            <td style={S.tdLast}>Anonymized after 14 days - aggregated indefinitely</td>
          </tr>
        </tbody>
      </table>

      <h2 id="p-7" style={S.docH2(false)}>
        <span style={S.docNum}>06</span>Your rights
      </h2>
      <p style={S.docP}>Wherever you are, you have these rights. POPIA, GDPR, and our own policy converge on them.</p>
      <ul style={S.docUl}>
        <li><strong style={S.docStrong}>Access</strong> — download a full copy of your data from settings - ZIP delivery in under 24 hours.</li>
        <li><strong style={S.docStrong}>Correction</strong> — fix anything wrong from settings, or email <code style={S.code}>privacy@binectics.com</code>.</li>
        <li><strong style={S.docStrong}>Deletion</strong> — purge your account - your coach keeps their record of past sessions for tax reasons, but we strip your name from anything else within 30 days.</li>
        <li><strong style={S.docStrong}>Portability</strong> — your data exports as machine{"‑"}readable JSON, not a PDF you can&apos;t reuse.</li>
        <li><strong style={S.docStrong}>Object to processing</strong> — turn off behavioral analytics in cookie settings - still works for fraud detection.</li>
      </ul>

      <h2 id="p-8" style={S.docH2(false)}>
        <span style={S.docNum}>07</span>How to contact us
      </h2>
      <p style={S.docP}>
        Our Data Protection Officer is <strong style={S.docStrong}>Lerato Mokoena</strong>. Email <code style={{ ...S.code, fontSize: 14 }}>privacy@binectics.com</code>. Most requests get a human reply within 4 hours during weekdays SAST.
      </p>
      <p style={S.docP}>
        If we get something wrong, you can complain to the South African Information Regulator (POPIA) or your local EU supervisory authority. We&apos;d rather hear from you first.
      </p>

      <div style={S.anchorRow}>
        <button style={S.anchorLink} onClick={() => onJump("terms")}>Terms of service &rarr;</button>
        <button style={S.anchorLink} onClick={() => onJump("cookies")}>Cookies &rarr;</button>
      </div>
    </article>
  );
}

/* ── Terms doc ────────────────────────────────────────────────── */
function TermsDoc({ onJump }: { onJump: (t: DocTab) => void }) {
  return (
    <article style={{ maxWidth: 720 }}>
      <h2 id="t-1" style={S.docH2(true)}>
        <span style={S.docNum}>00</span>Plain{"‑"}English summary
      </h2>
      <div style={S.plainBox}>
        <div style={S.plainH}>In one paragraph</div>
        <p style={S.plainP}>
          Binectics connects members and providers — gyms, trainers, dietitians. <strong style={S.docStrong}>Providers run their own businesses</strong> - we run the rails: search, payments, messages, verification. If something goes wrong with a session, we mediate. If you break the rules — fake credentials, abusive behavior, payment fraud — we&apos;ll suspend you. You can leave any time and your data goes with you.
        </p>
      </div>

      <h2 id="t-2" style={S.docH2(false)}>
        <span style={S.docNum}>01</span>Who can use Binectics
      </h2>
      <p style={S.docP}>
        You must be at least 16 years old to book sessions. Youth accounts (under 18) need a parent or guardian on the account. Providers must be 18+ and legally able to work in their country of operation.
      </p>

      <h2 id="t-3" style={S.docH2(false)}>
        <span style={S.docNum}>02</span>Your account
      </h2>
      <p style={S.docP}>
        One account per person. You&apos;re responsible for what happens under your login — keep your password and 2FA secure. Tell us within 24 hours if you suspect access has been compromised; we&apos;ll lock the account and walk you through recovery.
      </p>

      <h2 id="t-4" style={S.docH2(false)}>
        <span style={S.docNum}>03</span>Providers &amp; members
      </h2>
      <p style={S.docP}>
        Providers are independent businesses, not Binectics employees. Members are paying customers of those providers. Binectics is the platform that introduces and bills.
      </p>
      <ul style={S.docUl}>
        <li><strong style={S.docStrong}>Providers</strong> set their own prices, packages, cancellation policies, and availability.</li>
        <li><strong style={S.docStrong}>Binectics</strong> sets the platform fee, verification standards, and the rules everyone agrees to here.</li>
        <li><strong style={S.docStrong}>Members</strong> agree to show up, respect provider time, and follow gym rules where they apply.</li>
      </ul>

      <h2 id="t-5" style={S.docH2(false)}>
        <span style={S.docNum}>04</span>Payments &amp; refunds
      </h2>
      <p style={S.docP}>
        We take a transparent <strong style={S.docStrong}>platform fee</strong> on processed payments — currently 5% to members, 0% to providers. Providers receive the rest direct to their account; we never hold funds beyond the standard gateway settlement period.
      </p>
      <p style={S.docP}>Refund windows:</p>
      <ul style={S.docUl}>
        <li><strong style={S.docStrong}>Free cancellation</strong> up to 24 hours before a session.</li>
        <li><strong style={S.docStrong}>Provider no{"‑"}show</strong> - full refund within 48 hours.</li>
        <li><strong style={S.docStrong}>Service not as described</strong> - open a dispute and we mediate - usually resolved in 3 business days.</li>
        <li><strong style={S.docStrong}>Chargebacks</strong> - we&apos;ll defend against fraud but cooperate fully with legitimate disputes.</li>
      </ul>

      <h2 id="t-6" style={S.docH2(false)}>
        <span style={S.docNum}>05</span>Verification
      </h2>
      <p style={S.docP}>
        The green verified badge means a human on our team has reviewed the provider&apos;s documents — business registration, certifications, identity. Verified providers stay verified as long as documents remain current. We re{"‑"}check every 24 months.
      </p>
      <p style={S.docP}>
        Rejection comes with a written reason and a 30{"‑"}day path to resubmit.
      </p>

      <h2 id="t-7" style={S.docH2(false)}>
        <span style={S.docNum}>06</span>Content &amp; conduct
      </h2>
      <p style={S.docP}>Don&apos;t do these things on Binectics. We&apos;ll suspend or remove accounts that do.</p>
      <ul style={S.docUl}>
        <li>Fake credentials, fake reviews, fake clients, fake anything.</li>
        <li>Harassment, threats, or sexually explicit messages.</li>
        <li>Off{"‑"}platform payment circumvention (members and providers must transact on Binectics for the session to be covered).</li>
        <li>Reverse engineering, scraping, automated booking.</li>
        <li>Discrimination on the basis of race, gender, religion, disability, or sexual orientation.</li>
      </ul>

      <h2 id="t-8" style={S.docH2(false)}>
        <span style={S.docNum}>07</span>Termination
      </h2>
      <p style={S.docP}>
        You can close your account from settings, any time. We&apos;ll close yours if you break the rules above, repeatedly fail to pay, or your account becomes a fraud risk we can&apos;t otherwise mitigate.
      </p>
      <p style={S.docP}>
        Closed accounts: bookings within the next 7 days are honored or refunded. Future bookings are cancelled with full refund.
      </p>

      <h2 id="t-9" style={S.docH2(false)}>
        <span style={S.docNum}>08</span>Liability
      </h2>
      <p style={S.docP}>
        Binectics provides the platform. <em style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: "var(--ink)" }}>The training itself happens between you and the provider.</em> You&apos;re responsible for showing up healthy and safe; providers are responsible for delivering competent service. Our liability is capped at what you&apos;ve paid us in the trailing 12 months, except where local law requires otherwise.
      </p>

      <h2 id="t-10" style={S.docH2(false)}>
        <span style={S.docNum}>09</span>Disputes &amp; arbitration
      </h2>
      <p style={S.docP}>
        If you and a provider can&apos;t agree, open a dispute from the booking page. A Binectics admin reads both sides and decides within 3 business days. For disputes with Binectics itself, the governing jurisdiction is South Africa; either side can request mediation through the Cape Town arbitration foundation before litigation.
      </p>

      <div style={S.anchorRow}>
        <button style={S.anchorLink} onClick={() => onJump("privacy")}>Privacy &rarr;</button>
        <button style={S.anchorLink} onClick={() => onJump("cookies")}>Cookies &rarr;</button>
      </div>
    </article>
  );
}

/* ── Cookies doc ──────────────────────────────────────────────── */
function CookiesDoc({ onJump }: { onJump: (t: DocTab) => void }) {
  return (
    <article style={{ maxWidth: 720 }}>
      <h2 id="c-1" style={S.docH2(true)}>
        <span style={S.docNum}>00</span>Plain{"‑"}English summary
      </h2>
      <div style={S.plainBox}>
        <div style={S.plainH}>In one paragraph</div>
        <p style={S.plainP}>
          We use cookies for three things: <strong style={S.docStrong}>keeping you logged in</strong>, <strong style={S.docStrong}>remembering your preferences</strong>, and <strong style={S.docStrong}>understanding how the product is used.</strong> The first two can&apos;t be turned off (the app stops working). The third one you can switch off below and we&apos;ll respect it.
        </p>
      </div>

      <h2 id="c-2" style={S.docH2(false)}>
        <span style={S.docNum}>01</span>Your preferences
      </h2>
      <p style={S.docP}>Toggle a category off and your choice is remembered for 13 months. Toggle it back on any time.</p>

      {/* Cookie preference rows */}
      <div style={S.cookieRow}>
        <div>
          <div style={S.cookieName}>Required</div>
          <div style={S.cookieMeta}>
            <span>Login session</span><Dot /><span>CSRF protection</span><Dot /><span>Cart state</span>
          </div>
        </div>
        <CookieToggle locked />
      </div>
      <div style={S.cookieRow}>
        <div>
          <div style={S.cookieName}>Functional</div>
          <div style={S.cookieMeta}>
            <span>Language</span><Dot /><span>Time zone</span><Dot /><span>Currency - saved searches</span>
          </div>
        </div>
        <CookieToggle defaultOn />
      </div>
      <div style={S.cookieRow}>
        <div>
          <div style={S.cookieName}>Analytics</div>
          <div style={S.cookieMeta}>
            <span>Page views</span><Dot /><span>Feature use</span><Dot /><span>Performance</span>
          </div>
        </div>
        <CookieToggle defaultOn={false} />
      </div>
      <div style={{ ...S.cookieRow, borderBottom: 0 }}>
        <div>
          <div style={S.cookieName}>Marketing</div>
          <div style={S.cookieMeta}>
            <span>Off by default - only for ads we run</span>
          </div>
        </div>
        <CookieToggle defaultOn={false} />
      </div>

      <h2 id="c-3" style={S.docH2(false)}>
        <span style={S.docNum}>02</span>Required cookies
      </h2>
      <p style={S.docP}>Without these, the app won&apos;t load. We never weaken or remove them based on preference.</p>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Cookie</th>
            <th style={S.th}>What it does</th>
            <th style={S.th}>How long</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...S.td, ...S.tdK }}>bx_session</td>
            <td style={S.td}>Keeps you logged in</td>
            <td style={S.td}>30 days</td>
          </tr>
          <tr>
            <td style={{ ...S.td, ...S.tdK }}>bx_csrf</td>
            <td style={S.td}>Prevents cross{"‑"}site forgery on forms</td>
            <td style={S.td}>session</td>
          </tr>
          <tr>
            <td style={{ ...S.tdLast, ...S.tdK }}>bx_cart</td>
            <td style={S.tdLast}>Holds your in{"‑"}progress booking</td>
            <td style={S.tdLast}>2 hours</td>
          </tr>
        </tbody>
      </table>

      <h2 id="c-4" style={S.docH2(false)}>
        <span style={S.docNum}>03</span>Functional cookies
      </h2>
      <p style={S.docP}>Quality{"‑"}of{"‑"}life. The app works without them, just worse.</p>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Cookie</th>
            <th style={S.th}>What it does</th>
            <th style={S.th}>How long</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...S.td, ...S.tdK }}>bx_locale</td>
            <td style={S.td}>Language &amp; date format</td>
            <td style={S.td}>1 year</td>
          </tr>
          <tr>
            <td style={{ ...S.td, ...S.tdK }}>bx_tz</td>
            <td style={S.td}>Time zone for displaying session times</td>
            <td style={S.td}>1 year</td>
          </tr>
          <tr>
            <td style={{ ...S.td, ...S.tdK }}>bx_currency</td>
            <td style={S.td}>Default currency for prices</td>
            <td style={S.td}>1 year</td>
          </tr>
          <tr>
            <td style={{ ...S.tdLast, ...S.tdK }}>bx_saved</td>
            <td style={S.tdLast}>Last 8 marketplace searches</td>
            <td style={S.tdLast}>30 days</td>
          </tr>
        </tbody>
      </table>

      <h2 id="c-5" style={S.docH2(false)}>
        <span style={S.docNum}>04</span>Analytics
      </h2>
      <p style={S.docP}>Aggregate, no personal identifiers. Self{"‑"}hosted Plausible, no third{"‑"}party scripts.</p>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.th}>Cookie</th>
            <th style={S.th}>What it does</th>
            <th style={S.th}>How long</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...S.td, ...S.tdK }}>bx_anon_id</td>
            <td style={S.td}>Rotating device fingerprint - counts unique visits</td>
            <td style={S.td}>24 hours</td>
          </tr>
          <tr>
            <td style={{ ...S.tdLast, ...S.tdK }}>bx_perf</td>
            <td style={S.tdLast}>Page load timings for ops</td>
            <td style={S.tdLast}>7 days</td>
          </tr>
        </tbody>
      </table>

      <h2 id="c-6" style={S.docH2(false)}>
        <span style={S.docNum}>05</span>Marketing
      </h2>
      <p style={S.docP}>
        Off by default. Even when on, we don&apos;t run third{"‑"}party trackers (no Meta Pixel, no Google Ads). When we run a campaign, we set a single first{"‑"}party cookie to attribute new signups.
      </p>

      <h2 id="c-7" style={S.docH2(false)}>
        <span style={S.docNum}>06</span>Browser controls
      </h2>
      <p style={S.docP}>Every browser has a way to clear cookies and block new ones. The settings below also override what you&apos;ve set on this page.</p>
      <ul style={S.docUl}>
        <li><strong style={S.docStrong}>Chrome / Edge / Brave</strong> - Settings &rarr; Privacy &amp; security &rarr; Cookies</li>
        <li><strong style={S.docStrong}>Firefox</strong> - Preferences &rarr; Privacy &amp; Security &rarr; Cookies and Site Data</li>
        <li><strong style={S.docStrong}>Safari</strong> - Settings &rarr; Privacy &rarr; Manage Website Data</li>
        <li><strong style={S.docStrong}>iOS / Android</strong> - System Settings &rarr; app permissions for the Binectics app</li>
      </ul>

      <div style={S.anchorRow}>
        <button style={S.anchorLink} onClick={() => onJump("privacy")}>Privacy &rarr;</button>
        <button style={S.anchorLink} onClick={() => onJump("terms")}>Terms of service &rarr;</button>
      </div>
    </article>
  );
}

/* ── Main page content (uses useSearchParams) ────────────────── */
function LegalPageContent() {
  const hashDoc = (typeof window !== "undefined" ? window.location.hash.replace("#", "") : "") as DocTab;
  const initial: DocTab = (["privacy", "terms", "cookies"].includes(hashDoc) ? hashDoc : "privacy") as DocTab;

  const [activeDoc, setActiveDoc] = useState<DocTab>(initial);
  const [activeTocId, setActiveTocId] = useState<string>(TOC[initial][0].id);

  const switchDoc = useCallback((doc: DocTab) => {
    setActiveDoc(doc);
    setActiveTocId(TOC[doc][0].id);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "#" + doc);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  const handleTocClick = useCallback((id: string) => {
    setActiveTocId(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section style={S.hero}>
        <div style={S.eyebrow}>Legal - the part nobody reads, written so you can</div>
        <h1 style={S.h1}>
          The <em style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}>rules</em>, the <em style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontWeight: 400 }}>data</em>, and how to leave.
        </h1>
        <p style={S.heroP}>
          We&apos;ve kept it short. Privacy is what data we collect and why. Terms is the contract you accept by using us. Cookies is what runs in your browser and how to turn it off.
        </p>
        <div style={S.meta}>
          <span><strong style={S.metaStrong}>Last updated</strong> - 14 May 2026</span>
          <span><strong style={S.metaStrong}>Effective</strong> - 1 June 2026</span>
          <span><strong style={S.metaStrong}>Jurisdiction</strong> - South Africa primary - GDPR - POPIA</span>
        </div>
      </section>

      {/* Switcher tabs */}
      <nav style={S.switcher}>
        <div style={{ display: "flex", gap: 0 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              style={S.switcherTab(activeDoc === t.key)}
              onClick={() => switchDoc(t.key)}
            >
              {t.label} <span style={S.switcherV(activeDoc === t.key)}>{t.version}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* 3-column layout */}
      <div style={S.layout}>
        {/* Left: TOC */}
        <aside style={S.tocAside}>
          <div style={S.tocLabel}>
            {TABS.find((t) => t.key === activeDoc)?.label}
          </div>
          {TOC[activeDoc].map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              style={S.tocLink(activeTocId === item.id)}
              onClick={(e) => {
                e.preventDefault();
                handleTocClick(item.id);
              }}
            >
              {item.label}
              <span style={S.tocN(activeTocId === item.id)}>{item.n}</span>
            </a>
          ))}
        </aside>

        {/* Center: document content */}
        <main>
          {activeDoc === "privacy" && <PrivacyDoc onJump={switchDoc} />}
          {activeDoc === "terms" && <TermsDoc onJump={switchDoc} />}
          {activeDoc === "cookies" && <CookiesDoc onJump={switchDoc} />}
        </main>

        {/* Right: rail */}
        <aside style={S.rightRail}>
          {/* Contact card */}
          <div>
            <div style={S.railH}>Need a real human</div>
            <div style={S.railCard}>
              <p style={S.railCardP}>
                <strong style={S.docStrong}>privacy@binectics.com</strong> for anything in this section. Lerato Mokoena, DPO, replies within 4 hours on weekdays.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                <a href="mailto:privacy@binectics.com" style={S.railAction}>
                  <span>Email privacy team</span> <span style={{ color: "var(--fg-3)" }}>&nearr;</span>
                </a>
                <a href="/dashboard/settings" style={S.railAction}>
                  <span>Download my data</span> <span style={{ color: "var(--fg-3)" }}>&nearr;</span>
                </a>
                <a href="/dashboard/settings" style={S.railAction}>
                  <span>Delete my account</span> <span style={{ color: "var(--fg-3)" }}>&nearr;</span>
                </a>
              </div>
            </div>
          </div>

          {/* Version history card */}
          <div>
            <div style={S.railH}>Version history</div>
            <div style={S.railCard}>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)", lineHeight: 1.55, margin: "0 0 10px" }}>
                <strong style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>v 3.1</strong> - 14 May 2026 - Updated retention table - clarified analytics
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)", lineHeight: 1.55, margin: "0 0 10px" }}>
                <strong style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>v 3.0</strong> - 01 Mar 2026 - POPIA alignment - DPO appointment
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)", lineHeight: 1.55, margin: "0 0 10px" }}>
                <strong style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>v 2.4</strong> - 12 Dec 2025 - Added Razorpay processor
              </p>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)", lineHeight: 1.55, margin: 0 }}>
                <strong style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>v 2.0</strong> - 01 Jul 2025 - First public version
              </p>
            </div>
          </div>

          {/* Plain-English commitment card */}
          <div>
            <div style={S.railH}>Plain{"‑"}English commitment</div>
            <div style={S.railCard}>
              <p style={S.railCardP}>
                We don&apos;t hide behind legalese. If a clause doesn&apos;t make sense to a non{"‑"}lawyer, that&apos;s our problem to fix.
              </p>
              <p style={{ ...S.railCardP, margin: 0 }}>
                Spotted something opaque? Tell us - <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink)" }}>legal@binectics.com</code>
              </p>
            </div>
          </div>
        </aside>
      </div>

      <MarketingFooter />
    </div>
  );
}

/* ── Default export with Suspense boundary ───────────────────── */
export default function LegalPage() {
  return (
    <Suspense
      fallback={
        <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--fg-3)" }}>Loading...</span>
        </div>
      }
    >
      <LegalPageContent />
    </Suspense>
  );
}
