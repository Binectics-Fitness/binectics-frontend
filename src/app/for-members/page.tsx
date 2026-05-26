import Link from "next/link";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Members",
  description: "Discover gyms, trainers, and dietitians worldwide with one Binectics membership.",
};

/**
 * For Members — marketing landing page for fitness enthusiasts.
 * Proto: for-members.html
 * Hero 56px h1, 3-col feature cards.
 */

const FEATURES = [
  { title: "Verified providers", desc: "Every trainer, gym, and dietitian on Binectics has been checked by a human. The green badge isn't decorative." },
  { title: "One profile", desc: "Your bookings, logs, health metrics, payments — across every provider you work with." },
  { title: "Refund within 24h", desc: "Provider didn't show? Service not as described? Open a dispute and we mediate. Most resolve in under a day." },
  { title: "Real food & movement data", desc: "Track meals against your plan, watch your strength PRs, share with whoever's coaching you." },
  { title: "Streaks that matter", desc: "No vanity badges. Just a clean record of when you showed up." },
  { title: "No subscription", desc: "Binectics is free for members. You pay your provider directly — same price as without us." },
];

export default function ForMembersPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>For members</div>
        <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[18ch]" style={{ lineHeight: 1.04, letterSpacing: "-0.032em", color: "var(--ink)" }}>
          Find a gym, trainer, or dietitian — <em className="font-serif font-normal italic">book in 3 taps</em>.
        </h1>
        <p className="text-[17px] sm:text-[18px] max-w-[60ch] leading-[1.5] mt-5" style={{ color: "var(--fg-2)" }}>
          14,200 verified providers across 52 countries. One profile · one inbox · one checkout. No more WhatsApp DM dance.
        </p>
        <div className="mt-7">
          <Link href="/marketplace" className="btn-primary-v2 lg">Browse marketplace &rarr;</Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <h2 className="text-[28px] sm:text-[32px] font-medium mb-4.5" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
          Why <em className="font-serif font-normal italic">members</em> stay.
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
