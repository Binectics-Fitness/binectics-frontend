import type { Metadata } from "next";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";

/**
 * Contact — contact methods + form + office locations.
 * Hero 56px h1, 2-col grid (methods + form), office cards below.
 */

export const metadata: Metadata = {
  title: "Contact | Binectics",
  description: "Get in touch with the Binectics team. Email us, submit a request, or visit our offices in Lagos and London.",
};

const METHODS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
    label: "General enquiries",
    email: "help@binectics.com",
    desc: "Support, account issues, bug reports. We reply within 24 hours.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <line x1="19" y1="8" x2="19" y2="14" />
        <line x1="22" y1="11" x2="16" y2="11" />
      </svg>
    ),
    label: "Sales & partnerships",
    email: "sales@binectics.com",
    desc: "Enterprise plans, gym chains, API access, and integration discussions.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
      </svg>
    ),
    label: "Press & media",
    email: "press@binectics.com",
    desc: "Interviews, press kit requests, and media enquiries. 4-hour response on weekdays.",
  },
];

const OFFICES = [
  { city: "Lagos, Nigeria", tz: "WAT (UTC+1)", address: "14 Admiralty Way, Lekki Phase 1" },
  { city: "London, United Kingdom", tz: "GMT / BST", address: "71 Queen Victoria St, EC4V 4AY" },
];

export default function ContactPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Contact</div>
        <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[18ch]" style={{ lineHeight: 1.04, letterSpacing: "-0.032em", color: "var(--ink)" }}>
          Get in <em className="font-serif font-normal italic">touch</em>.
        </h1>
        <p className="text-[17px] sm:text-[18px] max-w-[60ch] leading-[1.5] mt-5" style={{ color: "var(--fg-2)" }}>
          Whether you&apos;re a gym owner exploring the platform, a trainer with a feature request, or press looking for a quote &mdash; we&apos;d love to hear from you.
        </p>
      </section>

      {/* Methods + Form */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left — contact methods */}
          <div className="flex flex-col gap-5">
            <h2 className="text-[28px] sm:text-[32px] font-medium mb-1" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
              Reach <em className="font-serif font-normal italic">us</em>.
            </h2>
            {METHODS.map((m) => (
              <div key={m.label} className="rounded-(--r-3) p-6" style={{ background: "var(--bg-2)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <span style={{ color: "var(--ink)" }}>{m.icon}</span>
                  <span className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>{m.label}</span>
                </div>
                <a href={`mailto:${m.email}`} className="text-[14px] font-mono underline underline-offset-3 mb-1.5 block" style={{ color: "var(--ink)" }}>{m.email}</a>
                <p className="text-[13.5px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>{m.desc}</p>
              </div>
            ))}
          </div>

          {/* Right — form */}
          <div>
            <h2 className="text-[28px] sm:text-[32px] font-medium mb-4.5" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
              Send a <em className="font-serif font-normal italic">message</em>.
            </h2>
            <form className="flex flex-col gap-4" action="#">
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-[0.04em] mb-1.5" style={{ color: "var(--fg-3)" }}>Name</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Your full name"
                  className="w-full rounded-(--r-2) px-4 py-3 text-[15px] outline-none"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-[0.04em] mb-1.5" style={{ color: "var(--fg-3)" }}>Email</label>
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-(--r-2) px-4 py-3 text-[15px] outline-none"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-[0.04em] mb-1.5" style={{ color: "var(--fg-3)" }}>Subject</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={200}
                  placeholder="e.g. Partnership enquiry"
                  className="w-full rounded-(--r-2) px-4 py-3 text-[15px] outline-none"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}
                />
              </div>
              <div>
                <label className="block font-mono text-[11px] uppercase tracking-[0.04em] mb-1.5" style={{ color: "var(--fg-3)" }}>Message</label>
                <textarea
                  rows={5}
                  required
                  minLength={10}
                  maxLength={2000}
                  placeholder="Tell us what you need..."
                  className="w-full rounded-(--r-2) px-4 py-3 text-[15px] outline-none resize-y"
                  style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}
                />
              </div>
              <button type="submit" className="btn-primary-v2 self-start mt-1">Send message &rarr;</button>
            </form>
          </div>
        </div>
      </section>

      {/* Offices */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <h2 className="text-[28px] sm:text-[32px] font-medium mb-4.5" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
          Our <em className="font-serif font-normal italic">offices</em>.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {OFFICES.map((o) => (
            <div key={o.city} className="rounded-(--r-3) p-6" style={{ background: "var(--bg-2)" }}>
              <h3 className="text-[17px] font-medium mb-1" style={{ color: "var(--ink)" }}>{o.city}</h3>
              <p className="text-[13.5px] leading-[1.55] mb-1" style={{ color: "var(--fg-2)" }}>{o.address}</p>
              <span className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{o.tz}</span>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
