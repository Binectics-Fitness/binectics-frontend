import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Trainers",
  description: "Grow your personal training business with client management, scheduling, and payments on Binectics.",
};

/**
 * For Trainers — marketing landing page for personal trainers.
 * Proto: for-trainers.html
 * Hero 56px h1, 3-col feature cards.
 */

const FEATURES = [
  { title: "Be discovered", desc: "14.2k verified providers. We send qualified leads — not tire-kickers." },
  { title: "Take payment", desc: "5% fee on member side. 0% on yours. Money in your account in 2 days." },
  { title: "Get rebooked", desc: "Auto-prompts, recurring bookings, 1-tap renewals. Retention up 34% vs DM-based." },
  { title: "Program in 8 min", desc: "Drag-drop strength & running programs. Reuse templates across clients." },
  { title: "Get paid for online", desc: "Take international clients without thinking about currency conversion." },
  { title: "Tax-handled", desc: "IRP6 forms auto-generated. Just hand to your accountant." },
];

export default function ForTrainersPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>For trainers</div>
        <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[18ch]" style={{ lineHeight: 1.04, letterSpacing: "-0.032em", color: "var(--ink)" }}>
          Get more clients. <em className="font-serif font-normal italic">Keep</em> them longer.
        </h1>
        <p className="text-[17px] sm:text-[18px] max-w-[60ch] leading-[1.5] mt-5" style={{ color: "var(--fg-2)" }}>
          A profile that ranks. A calendar that doesn&apos;t double-book. Payouts in 2 days. Programming tools that don&apos;t suck.
        </p>
        <div className="mt-7">
          <Link href="/register" className="btn-primary-v2 lg">List your practice — free</Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <h2 className="text-[28px] sm:text-[32px] font-medium mb-4.5" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
          What we <em className="font-serif font-normal italic">do</em> for you.
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
