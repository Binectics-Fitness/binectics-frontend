"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";

/**
 * Legal — legal.html prototype. 3-column layout (260px TOC + 1fr content + 240px sidebar).
 * Document tabs: Privacy, Terms, Cookies. Numbered sections with plain-English summaries.
 */

type DocType = "privacy" | "terms" | "cookies";

type Section = {
  num: string;
  title: string;
  /** A stable anchor for sections linked from outside (default `s-<num>`). */
  id?: string;
  content: React.ReactNode;
};

const sectionId = (s: Section) => s.id ?? `s-${s.num}`;

/* Shared styles for the connected-health section (same values as the rest of the page). */
const hcP = "text-[15px] leading-[1.65] mb-3.5 max-w-[60ch]";
const hcH3 = "text-[16px] font-medium mt-7 mb-2.5";
const hcUl = "flex flex-col gap-1 pl-5.5 text-[15px] leading-[1.65] max-w-[60ch] mb-3.5";
const hcStrong = { color: "var(--ink)", fontWeight: 500 } as const;

const HEALTH_DATA_SECTION: Section = {
  num: "06",
  id: "health-data",
  title: "Connected health apps",
  content: (<>
    <div className="rounded-r-(--r-2) py-3 px-4 my-4 max-w-[60ch]" style={{ background: "var(--bg-2)", borderLeft: "2px solid var(--ink)" }}>
      <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-1" style={{ color: "var(--fg-3)" }}>In one paragraph</div>
      <p className="text-[14px] leading-[1.5]" style={{ color: "var(--ink)", margin: 0 }}>If you connect <strong>Health Connect</strong> in the Binectics Android app, we read only the health data types you allow, and we never write to it. We use that data for your Health log and, only if you turn it on, to complete your program tasks. <strong>No ads, and we never sell it.</strong> Disconnecting deletes what we imported unless you choose to keep it, and deleting your account deletes all of it.</p>
    </div>
    <p className={hcP} style={{ color: "var(--fg-2)" }}>This section applies only if you connect Health Connect, Android&apos;s shared health store. It includes data that other apps, such as Samsung Health or a Galaxy Watch, have saved to Health Connect.</p>

    <h3 className={hcH3} style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>What we read</h3>
    <ul className={hcUl} style={{ color: "var(--fg-2)" }}>
      <li><strong style={hcStrong}>Only these types, and only the ones you allow</strong>: steps, workouts (exercise sessions, with their distance), sleep, resting heart rate and weight. You choose them on Health Connect&apos;s permission screen and can change them there at any time.</li>
      <li><strong style={hcStrong}>Read only</strong>. Binectics never writes anything to Health Connect.</li>
      <li><strong style={hcStrong}>When</strong>: up to 30 days from before you connect, then whatever is new each time you open the app. Nothing is read in the background.</li>
      <li><strong style={hcStrong}>Steps</strong> are added up on your phone, and we store a total per day, not every reading. We read resting heart rate only, not your continuous heart rate.</li>
      <li><strong style={hcStrong}>With each record</strong> we keep which app saved it and whether it was recorded by a device or typed in by hand.</li>
    </ul>

    <h3 className={hcH3} style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>What we use it for</h3>
    <ul className={hcUl} style={{ color: "var(--fg-2)" }}>
      <li><strong style={hcStrong}>Your Health log</strong>. Imported workouts and weigh‑ins appear next to the ones you log yourself, so you don&apos;t type them twice. They can&apos;t be edited or deleted in Binectics: delete them in the app that recorded them, and they go here on the next sync.</li>
      <li><strong style={hcStrong}>Your program tasks, only if you turn on &ldquo;Use for my program tasks&rdquo;</strong>. It is off until you turn it on. A task such as &ldquo;Walk 8,000 steps&rdquo; then completes itself. By default only data recorded by a device counts, not entries typed in by hand, unless the provider who set the task allowed hand entries. That provider sees the task completed and, for a measurement task such as hours slept or weight, the value that filled it. If the data is later deleted, the task stays completed and is marked.</li>
      <li><strong style={hcStrong}>Nothing else</strong>. Imported data never earns loyalty points or rewards.</li>
    </ul>

    <h3 className={hcH3} style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>What your providers see</h3>
    <ul className={hcUl} style={{ color: "var(--fg-2)" }}>
      <li><strong style={hcStrong}>Sharing is per type and starts off</strong>. Steps, workouts, sleep, heart rate and weight each have their own &ldquo;share with my providers&rdquo; switch, in the connect flow and in Settings → Privacy. Every one starts off.</li>
      <li><strong style={hcStrong}>Steps, workouts, sleep and resting heart rate</strong> you import are not shown to providers today, whatever those switches say.</li>
      <li><strong style={hcStrong}>Weight is the exception</strong>. Imported weigh‑ins join your weight history, and providers you are currently working with (and authorised staff at their gym or practice) can see your weight history while &ldquo;Share my progress with my providers&rdquo; is on. Turn that off in Settings → Privacy and they see only the weights logged within their own relationship with you.</li>
      <li><strong style={hcStrong}>Program tasks</strong>, as described above, if you turned on &ldquo;Use for my program tasks&rdquo;.</li>
    </ul>

    <h3 className={hcH3} style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>What we never do</h3>
    <ul className={hcUl} style={{ color: "var(--fg-2)" }}>
      <li>We don&apos;t use it for advertising, and we never sell it or give it to data brokers.</li>
      <li>We don&apos;t use it for insurance, credit, lending or employment decisions, or to train AI models.</li>
      <li>Our servers keep it out of error reports and logs. The contents of health data requests are dropped before they reach our error monitoring, and our logs record counts and types, never values.</li>
      <li>There is no Binectics staff screen for it. People at Binectics look at it only to help with a request you make, to keep accounts secure, or when the law requires it.</li>
    </ul>

    <h3 className={hcH3} style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>How long we keep it</h3>
    <div className="rounded-(--r-3) overflow-hidden my-4 max-w-[60ch]" style={{ border: "1px solid var(--border)" }}>
      <div className="grid font-mono text-[11px] uppercase tracking-[0.04em]" style={{ gridTemplateColumns: "1fr 1.5fr", padding: "10px 16px", background: "var(--bg-2)", borderBottom: "1px solid var(--border)", color: "var(--fg-3)" }}><span>Data</span><span>Retention</span></div>
      {[
        ["Records we read", "13 months after the activity, then deleted automatically"],
        ["Daily totals", "About 25 months after the day was last updated, then deleted automatically"],
        ["Workouts & weigh‑ins in your Health log", "Until you delete them at the source, disconnect, or delete your account"],
        ["Consent history", "When you connected, the types you allowed and what you changed. Kept until you delete your account"],
      ].map(([k, v], i, rows) => (
        <div key={k} className="grid text-[14px]" style={{ gridTemplateColumns: "1fr 1.5fr", padding: "12px 16px", borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none" }}>
          <span className="font-medium" style={{ color: "var(--ink)" }}>{k}</span>
          <span style={{ color: "var(--fg-2)" }}>{v}</span>
        </div>
      ))}
    </div>

    <h3 className={hcH3} style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Disconnecting and deleting</h3>
    <ul className={hcUl} style={{ color: "var(--fg-2)" }}>
      <li><strong style={hcStrong}>Disconnect</strong> from Connected apps in the app. By default this deletes everything we imported: the records, the daily totals, and the imported workouts and weigh‑ins. What you logged yourself is not touched. Binectics also gives up its Health Connect access on your phone.</li>
      <li><strong style={hcStrong}>&ldquo;Keep my history&rdquo;</strong> is the option. Syncing stops and what was already imported stays, still deleted on the schedule above or when you delete your account.</li>
      <li><strong style={hcStrong}>Either way</strong>, program tasks already completed stay completed.</li>
      <li><strong style={hcStrong}>Deleting your account</strong> deletes all of it: imported data, the connection and your consent history.</li>
      <li><strong style={hcStrong}>In Health Connect</strong> you can also remove Binectics&apos;s access, or single types, at any time. We stop reading them.</li>
    </ul>
    <p className={hcP} style={{ color: "var(--fg-2)" }}>Your phone sends this data to our servers over an encrypted connection, and it is stored with the rest of your account (see &ldquo;Where it lives&rdquo;). Questions go to <span className="font-mono text-[14px]" style={{ color: "var(--ink)" }}>privacy@binectics.com</span>.</p>
  </>),
};

const DOCS: Record<DocType, { label: string; version: string; sections: Section[] }> = {
  privacy: {
    label: "Privacy policy",
    version: "v 3.2 · 13 Oct 2026",
    sections: [
      { num: "00", title: "Plain‑English summary", content: (
        <div className="rounded-r-(--r-2) py-3 px-4 my-4 max-w-[60ch]" style={{ background: "var(--bg-2)", borderLeft: "2px solid var(--ink)" }}>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-1" style={{ color: "var(--fg-3)" }}>In one paragraph</div>
          <p className="text-[14px] leading-[1.5]" style={{ color: "var(--ink)", margin: 0 }}>We collect what we need to run a marketplace, your account info, what you book, who you message, and how you pay. We use it to keep the service working, prevent fraud, and follow the law. <strong>We don&apos;t sell your data, ever.</strong> You can download a full copy or delete your account from settings, any time, and the deletion is real.</p>
        </div>
      )},
      { num: "01", title: "What we collect", content: (<>
        <p className="text-[15px] leading-[1.65] mb-3.5 max-w-[60ch]" style={{ color: "var(--fg-2)" }}>Three categories, what you give us, what we observe, and what others tell us.</p>
        <h3 className="text-[16px] font-medium mt-7 mb-2.5" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>You give us</h3>
        <ul className="flex flex-col gap-1 pl-5.5 text-[15px] leading-[1.65] max-w-[60ch] mb-3.5" style={{ color: "var(--fg-2)" }}>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Account info</strong>, name, email, phone, password (hashed with bcrypt + per‑user salt).</li>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Provider documents</strong>, ID, certifications, insurance, bank details. Used only for verification and payouts.</li>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Booking data</strong>, sessions, plans, payments, messages with the other side of the marketplace.</li>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Optional logs</strong>, weight, photos, mood, meal logs, workout adherence. You choose what to share with which provider.</li>
        </ul>
        <h3 className="text-[16px] font-medium mt-7 mb-2.5" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>We observe</h3>
        <ul className="flex flex-col gap-1 pl-5.5 text-[15px] leading-[1.65] max-w-[60ch] mb-3.5" style={{ color: "var(--fg-2)" }}>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>How you use the product</strong>, pages viewed, searches, taps. Stored against a rotating device ID, not your account, where possible.</li>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Device & network</strong>, browser, OS, IP, approximate city. Used for fraud detection and to localize the experience.</li>
        </ul>
        <h3 className="text-[16px] font-medium mt-7 mb-2.5" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Others tell us</h3>
        <ul className="flex flex-col gap-1 pl-5.5 text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Payment processors</strong>, Stripe, Paystack, Flutterwave send us card last‑4, expiry, and fraud signals. We never see the full card number. (Stripe and Flutterwave are not currently used.)</li>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Verification partners</strong>, confirm a certification is real or an ID is valid. We log the outcome, not the documents themselves where avoidable.</li>
        </ul>
      </>)},
      { num: "02", title: "Why we collect it", content: (
        <div className="rounded-(--r-3) overflow-hidden my-4 max-w-[60ch]" style={{ border: "1px solid var(--border)" }}>
          <div className="grid font-mono text-[11px] uppercase tracking-[0.04em]" style={{ gridTemplateColumns: "1fr 2fr", padding: "10px 16px", background: "var(--bg-2)", borderBottom: "1px solid var(--border)", color: "var(--fg-3)" }}><span>We collect</span><span>Because</span></div>
          {[
            ["Account & bookings", "To run the service, without this, you can't book anything."],
            ["Payment data", "To charge you, pay providers, and prevent stolen‑card use."],
            ["Provider documents", "So members can trust the green verified badge."],
            ["Health logs", "So your coach can do their job. Visible to only the providers you choose."],
            ["Behavioral data", "To improve the product and catch fraud. Aggregated, not sold."],
          ].map(([k, v], i) => (
            <div key={k} className="grid text-[14px]" style={{ gridTemplateColumns: "1fr 2fr", padding: "12px 16px", borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
              <span className="font-medium" style={{ color: "var(--ink)" }}>{k}</span>
              <span style={{ color: "var(--fg-2)" }}>{v}</span>
            </div>
          ))}
        </div>
      )},
      { num: "03", title: "Who we share with", content: (<>
        <p className="text-[15px] leading-[1.65] mb-3.5 max-w-[60ch]" style={{ color: "var(--fg-2)" }}>A short list. We never add to it without telling you.</p>
        <ul className="flex flex-col gap-1 pl-5.5 text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>The other side of your bookings</strong>, your coach sees what you&apos;d expect.</li>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Payment processors</strong>, Paystack.</li>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Infrastructure providers</strong>, Microsoft Azure (hosting and databases), Netlify (this website), Cloudinary (photos you upload), Sentry (error monitoring), Firebase and Expo (push notifications), and our email delivery provider.</li>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Government authorities</strong>, only when legally required.</li>
        </ul>
      </>)},
      { num: "04", title: "Where it lives", content: <p className="text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>Binectics runs on <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Microsoft Azure</strong>. Your data is stored in Azure databases and encrypted at rest and in transit.</p> },
      { num: "05", title: "How long we keep it", content: (
        <div className="rounded-(--r-3) overflow-hidden my-4 max-w-[60ch]" style={{ border: "1px solid var(--border)" }}>
          <div className="grid font-mono text-[11px] uppercase tracking-[0.04em]" style={{ gridTemplateColumns: "1fr 1.5fr", padding: "10px 16px", background: "var(--bg-2)", borderBottom: "1px solid var(--border)", color: "var(--fg-3)" }}><span>Data</span><span>Retention</span></div>
          {[
            ["Bookings & payments", "7 years (tax compliance)"],
            ["Messages", "2 years after last interaction"],
            ["Health & meal logs", "Deleted when you delete your account · backup copies expire within 35 days"],
            ["Connected health app data", "13 months for records, about 25 months for daily totals · see Connected health apps"],
            ["Verification documents", "Hash + outcome only · originals deleted in 90 days"],
            ["Behavioral analytics", "Anonymized after 14 days · aggregated indefinitely"],
          ].map(([k, v], i) => (
            <div key={k} className="grid text-[14px]" style={{ gridTemplateColumns: "1fr 1.5fr", padding: "12px 16px", borderBottom: i < 5 ? "1px solid var(--border)" : "none" }}>
              <span className="font-medium" style={{ color: "var(--ink)" }}>{k}</span>
              <span style={{ color: "var(--fg-2)" }}>{v}</span>
            </div>
          ))}
        </div>
      )},
      HEALTH_DATA_SECTION,
      { num: "07", title: "Your rights", content: (<>
        <p className="text-[15px] leading-[1.65] mb-3.5 max-w-[60ch]" style={{ color: "var(--fg-2)" }}>Wherever you are, you have these rights. Data protection law and our own policy converge on them.</p>
        <ul className="flex flex-col gap-1 pl-5.5 text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Access</strong>, download a full copy of your data from settings.</li>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Correction</strong>, fix anything wrong from settings or email privacy@binectics.com.</li>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Deletion</strong>, purge your account. 30-day processing.</li>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Portability</strong>, your data exports as machine‑readable JSON.</li>
          <li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Object to processing</strong>, turn off behavioral analytics in cookie settings.</li>
        </ul>
      </>)},
      { num: "08", title: "Contact us", content: <p className="text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>Email <span className="font-mono text-[14px]" style={{ color: "var(--ink)" }}>privacy@binectics.com</span> for any privacy request.</p> },
    ],
  },
  terms: {
    label: "Terms of service",
    version: "v 2.4 · 14 May 2026",
    sections: [
      { num: "00", title: "Plain‑English summary", content: (
        <div className="rounded-r-(--r-2) py-3 px-4 my-4 max-w-[60ch]" style={{ background: "var(--bg-2)", borderLeft: "2px solid var(--ink)" }}>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-1" style={{ color: "var(--fg-3)" }}>In one paragraph</div>
          <p className="text-[14px] leading-[1.5]" style={{ color: "var(--ink)", margin: 0 }}>Binectics connects members and providers, gyms, trainers, dietitians. <strong>Providers run their own businesses</strong> · we run the rails. If something goes wrong, we mediate. If you break the rules, we&apos;ll suspend you. You can leave any time and your data goes with you.</p>
        </div>
      )},
      { num: "01", title: "Who can use Binectics", content: <p className="text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>You must be at least 16 years old to book sessions. Youth accounts (under 18) need a parent or guardian. Providers must be 18+ and legally able to work in their country.</p> },
      { num: "02", title: "Your account", content: <p className="text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>One account per person. You&apos;re responsible for what happens under your login. Tell us within 24 hours if you suspect access has been compromised.</p> },
      { num: "03", title: "Providers & members", content: (<><p className="text-[15px] leading-[1.65] mb-3.5 max-w-[60ch]" style={{ color: "var(--fg-2)" }}>Providers are independent businesses, not Binectics employees.</p><ul className="flex flex-col gap-1 pl-5.5 text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}><li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Providers</strong> set their own prices, packages, and cancellation policies.</li><li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Binectics</strong> sets verification standards and platform rules.</li><li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Members</strong> agree to show up, respect provider time, and follow gym rules.</li></ul></>)},
      { num: "04", title: "Payments & refunds", content: (<><p className="text-[15px] leading-[1.65] mb-3.5 max-w-[60ch]" style={{ color: "var(--fg-2)" }}>Binectics takes no fee from member payments. Members pay providers directly at the provider’s price; providers pay Binectics for their plan’s seats.</p><ul className="flex flex-col gap-1 pl-5.5 text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}><li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Cancellation</strong> · each provider sets their own policy. If they haven’t, cancelling 24 hours or more before a session gets a full refund.</li><li><strong style={{ color: "var(--ink)", fontWeight: 500 }}>Something went wrong</strong> · contact the provider first, then email help@binectics.com.</li></ul></>)},
      { num: "05", title: "Verification", content: <p className="text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>The green verified badge means a human reviewed the provider&apos;s documents. Rejection comes with a written reason and a path to resubmit.</p> },
      { num: "06", title: "Content & conduct", content: (<><p className="text-[15px] leading-[1.65] mb-3.5 max-w-[60ch]" style={{ color: "var(--fg-2)" }}>Don&apos;t do these things on Binectics:</p><ul className="flex flex-col gap-1 pl-5.5 text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}><li>Fake credentials, reviews, clients, or anything.</li><li>Harassment, threats, or sexually explicit messages.</li><li>Off‑platform payment circumvention.</li><li>Reverse engineering, scraping, automated booking.</li><li>Discrimination of any kind.</li></ul></>)},
      { num: "07", title: "Termination", content: <p className="text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>You can close your account from settings, any time. Bookings within 7 days are honored or refunded. Future bookings are cancelled with full refund.</p> },
      { num: "08", title: "Liability", content: <p className="text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>Binectics provides the platform. <em className="font-serif italic" style={{ color: "var(--ink)" }}>The training itself happens between you and the provider.</em> Our liability is capped at what you&apos;ve paid us in the trailing 12 months.</p> },
      { num: "09", title: "Disputes", content: <p className="text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>If you and a provider can’t agree, email help@binectics.com and we’ll help.</p> },
    ],
  },
  cookies: {
    label: "Cookie policy",
    version: "v 1.2 · 14 May 2026",
    sections: [
      { num: "00", title: "Plain‑English summary", content: (
        <div className="rounded-r-(--r-2) py-3 px-4 my-4 max-w-[60ch]" style={{ background: "var(--bg-2)", borderLeft: "2px solid var(--ink)" }}>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-1" style={{ color: "var(--fg-3)" }}>In one paragraph</div>
          <p className="text-[14px] leading-[1.5]" style={{ color: "var(--ink)", margin: 0 }}>We use cookies for three things: <strong>keeping you logged in</strong>, <strong>remembering your preferences</strong>, and <strong>understanding how the product is used.</strong> The first two can&apos;t be turned off. The third one you can switch off and we&apos;ll respect it.</p>
        </div>
      )},
      { num: "01", title: "Your preferences", content: <p className="text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>Toggle a category off and your choice is remembered for 13 months. Toggle it back on any time.</p> },
      { num: "02", title: "Required cookies", content: <p className="text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>Login session, CSRF protection, cart state. These cannot be disabled, the app stops working without them.</p> },
      { num: "03", title: "Functional cookies", content: <p className="text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>Language preference, timezone, currency display, last-used filters. Improve your experience but optional.</p> },
      { num: "04", title: "Analytics", content: <p className="text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>Anonymous usage data via Plausible (privacy-first, no cross-site tracking). Helps us understand which features get used. You can opt out in settings.</p> },
      { num: "05", title: "Marketing", content: <p className="text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>We don&apos;t use marketing cookies. No ad trackers, no retargeting pixels, no Facebook SDK. This is a deliberate choice.</p> },
      { num: "06", title: "Browser controls", content: <p className="text-[15px] leading-[1.65] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>Most browsers let you block or delete cookies from settings. If you block required cookies, login won&apos;t work. Everything else degrades gracefully.</p> },
    ],
  },
};

function LegalPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: DocType = tabParam === "terms" || tabParam === "cookies" ? tabParam : "privacy";
  const [activeDoc, setActiveDoc] = useState<DocType>(initialTab);
  const doc = DOCS[activeDoc];

  // The page renders on the client, so the browser's own jump to a #anchor
  // (e.g. /privacy#health-data, linked from the Android app) runs before the
  // section exists. Scroll to it once it does.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    document.getElementById(decodeURIComponent(hash))?.scrollIntoView();
  }, [activeDoc]);

  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 pt-10 sm:pt-14 pb-5 sm:pb-7">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Legal · last updated 13 October 2026</div>
        <h1 className="text-[48px] font-medium max-w-[18ch]" style={{ lineHeight: 1.02, letterSpacing: "-0.032em", color: "var(--ink)", marginTop: "14px" }}>
          The fine print, in <em className="font-serif font-normal italic">plain English</em>.
        </h1>
        <p className="text-[16px] max-w-[56ch] leading-[1.55] mt-4" style={{ color: "var(--fg-2)" }}>Plain language where possible. If something is unclear, email legal@binectics.com and we&apos;ll explain it like humans.</p>
        <div className="font-mono text-[11.5px] uppercase tracking-[0.04em] flex flex-wrap gap-6 mt-5.5" style={{ color: "var(--fg-3)" }}>
          <span>Privacy <strong className="text-[13px] font-medium uppercase-none" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", textTransform: "none", letterSpacing: "-0.005em" }}>v 3.2</strong></span>
          <span>Terms <strong className="text-[13px] font-medium" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", textTransform: "none", letterSpacing: "-0.005em" }}>v 2.4</strong></span>
          <span>Cookies <strong className="text-[13px] font-medium" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", textTransform: "none", letterSpacing: "-0.005em" }}>v 1.2</strong></span>
        </div>
      </section>

      {/* Document tabs */}
      <div className="mx-auto max-w-360 px-5 sm:px-10 overflow-x-auto" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex gap-0">
          {(Object.entries(DOCS) as [DocType, typeof DOCS.privacy][]).map(([key, d]) => (
            <button key={key} onClick={() => setActiveDoc(key)} className={`px-4.5 py-4 text-[14.5px] cursor-pointer -mb-px ${activeDoc === key ? "border-b-2 border-ink font-medium" : ""}`} style={{ color: activeDoc === key ? "var(--ink)" : "var(--fg-3)", transition: "color var(--motion-fast), border-color var(--motion-fast)" }}>
              {d.label}
              <span className="font-mono text-[11px] ml-2.5" style={{ color: activeDoc === key ? "var(--fg-3)" : "var(--fg-4)" }}>{d.version}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3-column layout */}
      <div className="mx-auto max-w-360 grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] items-start gap-8 lg:gap-14 px-5 sm:px-10 py-8 sm:py-10 lg:pb-24">

        {/* TOC */}
        <aside className="hidden lg:flex sticky flex-col gap-0.5" style={{ top: "24px" }}>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] px-2.5 py-2" style={{ color: "var(--fg-3)" }}>{doc.label}</div>
          {doc.sections.map((s, i) => (
            <a key={s.num} href={`#${sectionId(s)}`} className={`flex justify-between items-center py-1.5 px-2.5 rounded-(--r-2) text-[13px] ${i === 0 ? "bg-bg-2 font-medium" : "hover:bg-bg-2"}`} style={{ color: i === 0 ? "var(--ink)" : "var(--fg-3)", borderLeft: i === 0 ? "2px solid var(--ink)" : "2px solid transparent", paddingLeft: i === 0 ? "8px" : "10px", textDecoration: "none" }}>
              {s.title}
              <span className="font-mono text-[11px]" style={{ color: i === 0 ? "var(--ink)" : "var(--fg-4)" }}>{s.num}</span>
            </a>
          ))}
        </aside>

        {/* Content */}
        <main className="max-w-[720px]">
          {doc.sections.map((s, i) => (
            <div key={s.num} id={sectionId(s)} style={{ marginTop: i > 0 ? "56px" : 0, paddingTop: i > 0 ? "12px" : 0, borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
              <h2 className="text-[26px] font-medium leading-[1.1]" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
                <span className="font-mono text-[13px] font-normal mr-3 tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.num}</span>
                {s.title}
              </h2>
              <div className="mt-4">{s.content}</div>
            </div>
          ))}
        </main>

        {/* Right rail */}
        <aside className="hidden lg:flex sticky flex-col gap-4.5" style={{ top: "24px" }}>
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>Quick actions</div>
            <div className="rounded-(--r-3) flex flex-col gap-2.5" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", padding: "16px 18px" }}>
              <p className="text-[13px] leading-[1.55]" style={{ color: "var(--fg-2)", margin: 0 }}>Your data, your call. These work from settings too.</p>
              <div className="flex flex-col gap-1.5 mt-2.5">
                {[
                  { label: "Download my data", icon: "↓" },
                  { label: "Delete my account", icon: "×" },
                  { label: "Contact DPO", icon: "→" },
                ].map((a) => (
                  <span key={a.label} className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.04em] px-2.5 py-1.5 rounded-(--r-2) cursor-pointer hover:border-ink" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)", textDecoration: "none" }}>
                    {a.label}
                    <span style={{ color: "var(--fg-3)" }}>{a.icon}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-(--r-3)" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", padding: "16px 18px" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>Version history</div>
            <p className="text-[13px] leading-[1.55]" style={{ color: "var(--fg-2)", margin: 0 }}>We keep every version. If we change something material, we email you 14 days before it takes effect.</p>
            <span className="inline-block font-mono text-[11px] uppercase tracking-[0.04em] mt-2.5 cursor-pointer" style={{ color: "var(--ink)" }}>View changelog →</span>
          </div>

          <div className="rounded-(--r-3)" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", padding: "16px 18px" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>Plain‑English commitment</div>
            <p className="text-[13px] leading-[1.55]" style={{ color: "var(--fg-2)", margin: 0 }}>Every section starts with a summary you can actually read. If the legal text and the summary ever conflict, the summary wins.</p>
          </div>
        </aside>
      </div>

      <MarketingFooter />
    </div>
  );
}

export default function LegalPage() {
  return (
    <Suspense fallback={<div style={{ background: "var(--bg)", minHeight: "100vh" }} />}>
      <LegalPageContent />
    </Suspense>
  );
}
