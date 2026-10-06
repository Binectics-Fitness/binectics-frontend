import type { Metadata } from "next";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";

/**
 * Contact — contact methods + form + office locations.
 * Hero 56px h1, 2-col grid (methods + form), office cards below.
 */

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the Binectics team. Email us or send a message.",
  alternates: { canonical: "/contact" },
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
    desc: "Support, account issues, bug reports.",
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
          Whether you&apos;re a gym owner exploring the platform, a trainer with a feature request, or press looking for a quote, we&apos;d love to hear from you.
        </p>
      </section>

      {/* Methods + Form */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left — contact methods */}
          <div className="flex flex-col gap-5">
            <h2 className="text-[28px] sm:text-[32px] font-medium mb-1" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
              Reach us.
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

      <MarketingFooter />
    </div>
  );
}
