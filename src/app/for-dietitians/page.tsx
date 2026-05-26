import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Dietitians",
  description: "Build meal plans, track client adherence, and manage consultations on Binectics.",
};

/**
 * For Dietitians — marketing landing page for dietitians.
 * Proto: for-dietitians.html
 * Hero 56px h1, 3-col feature cards.
 */

const FEATURES = [
  { title: "License verified", desc: "DAN · HPCSA · CDR — we verify against the regulator and re-check every 24 months." },
  { title: "Branded PDF plans", desc: "Plans go out as polished PDFs — your name, your colors, your credentials." },
  { title: "Real food database", desc: "12,842 foods. 1,840 from the Nigerian FCDB. Jollof rice has accurate macros." },
  { title: "Protocol library", desc: "Reusable clinical methodologies. Track outcomes across clients." },
  { title: "Meal-log feedback", desc: "Clients photograph what they eat. You react with a single tap." },
  { title: "Insurance-ready", desc: "Sessions logged with timestamps + outcomes. Plays with medical aid claims." },
];

export default function ForDietitiansPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>For dietitians</div>
        <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[18ch]" style={{ lineHeight: 1.04, letterSpacing: "-0.032em", color: "var(--ink)" }}>
          Clinical care, <em className="font-serif font-normal italic">without</em> the admin.
        </h1>
        <p className="text-[17px] sm:text-[18px] max-w-[60ch] leading-[1.5] mt-5" style={{ color: "var(--fg-2)" }}>
          Verified by your professional body. Branded PDF plans. Macro-tracking that clients actually use. The food database has West African staples already.
        </p>
        <div className="mt-7">
          <Link href="/register" className="btn-primary-v2 lg">Apply to list &rarr;</Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <h2 className="text-[28px] sm:text-[32px] font-medium mb-4.5" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
          Built for <em className="font-serif font-normal italic">practice</em>.
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-(--r-3) p-6" style={{ background: "var(--bg-2)" }}>
              <h3 className="text-[16px] font-medium mb-3" style={{ color: "var(--ink)" }}>{f.title}</h3>
              <p className="text-[14px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
