import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Press",
  description: "Binectics press resources, media kit, and recent news coverage.",
};

/**
 * Press — press coverage + press kit downloads.
 * Proto: press.html
 * Hero 56px h1, 2-col news cards (links), 3-col press kit download cards.
 */

const ARTICLES = [
  {
    pub: "TechCabal",
    date: "24 Apr 2026",
    title: "Binectics raised $24M Series A, led by Endeavor",
    desc: "Cape Town-headquartered Binectics has raised $24M to scale across Africa and select Asian markets.",
  },
  {
    pub: "Bloomberg Africa",
    date: "12 Mar 2026",
    title: "How a Lagos dietitian built the FCDB the government couldn’t",
    desc: "Dr Nadia Hassan single-handedly catalogued Nigerian foods on Binectics.",
  },
  {
    pub: "Wired",
    date: "01 Mar 2026",
    title: "The fitness OS quietly eating Mindbody’s lunch",
    desc: "African fitness operators are switching at 2x the pace of the global average.",
  },
  {
    pub: "Mail & Guardian",
    date: "18 Jan 2026",
    title: "Cape Town’s fastest-growing software company isn’t in a SaaS playbook",
    desc: "The team is 28, the GMV is $4.8M/mo, and they don’t take VC pitches.",
  },
];

const KIT = [
  { title: "Logos & wordmark", desc: "SVG · PNG · light + dark", cta: "Download" },
  { title: "Company facts", desc: "One-page fact sheet · numbers · leadership", cta: "Download PDF" },
  { title: "Founder photos", desc: "Hi-res · approved · use freely", cta: "Download .zip" },
];

export default function PressPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Press</div>
        <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[18ch]" style={{ lineHeight: 1.04, letterSpacing: "-0.032em", color: "var(--ink)" }}>
          Press &amp; <em className="font-serif font-normal italic">media</em>.
        </h1>
        <p className="text-[17px] sm:text-[18px] max-w-[60ch] leading-[1.5] mt-5" style={{ color: "var(--fg-2)" }}>
          Read what&apos;s been written, download the press kit, or email{" "}
          <a href="mailto:press@binectics" className="underline underline-offset-3" style={{ color: "var(--ink)" }}>press@binectics</a>.
          We respond within 4 hours on weekdays SAST.
        </p>
      </section>

      {/* In the news */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <h2 className="text-[28px] sm:text-[32px] font-medium mb-4.5" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
          In the <em className="font-serif font-normal italic">news</em>.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {ARTICLES.map((a) => (
            <Link key={a.title} href="#" className="block rounded-(--r-3) p-6 hover:border-ink" style={{ background: "var(--bg-2)", textDecoration: "none", color: "inherit" }}>
              <div className="flex justify-between items-baseline mb-2.5">
                <span className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{a.pub}</span>
                <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{a.date}</span>
              </div>
              <h3 className="text-[17px] font-medium leading-[1.3] mb-2" style={{ color: "var(--ink)" }}>{a.title}</h3>
              <p className="text-[13.5px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>{a.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Press kit */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <h2 className="text-[28px] sm:text-[32px] font-medium mb-4.5" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
          Press <em className="font-serif font-normal italic">kit</em>.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {KIT.map((k) => (
            <div key={k.title} className="rounded-(--r-3) p-6" style={{ background: "var(--bg-2)" }}>
              <h3 className="text-[16px] font-medium mb-3" style={{ color: "var(--ink)" }}>{k.title}</h3>
              <p className="text-[13px] mb-3" style={{ color: "var(--fg-2)" }}>{k.desc}</p>
              <Link href="#" className="btn-primary-v2 sm">{k.cta}</Link>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
