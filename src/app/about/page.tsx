import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description: "Learn about Binectics, our mission to unify the global fitness ecosystem, and the team behind the platform.",
};

/**
 * About — about.html prototype. Pixel-perfect rebuild.
 * Hero h1: 88px. Section heads: 1.2fr/2fr grid. Stats: 44px bordered card grid.
 * Principles: 3-col card grid. Team: 4-col with gradient photos. Timeline: 4-col milestone cards.
 * CTA: ink bg, 56px h2. All padding: 96px 40px per section.
 */

const STATS = [
  { v: <>14,200<small className="font-mono text-[16px] font-normal ml-0.5" style={{ color: "var(--fg-3)" }}>+</small></>, l: "Verified providers across the platform" },
  { v: <>$ <em className="font-serif italic font-normal">4.82</em>M</>, l: "Monthly GMV · April 2026 · up 18% MoM" },
  { v: "52", l: "Countries live · 8 currencies supported" },
  { v: <>99.97<small className="font-mono text-[16px] font-normal ml-0.5" style={{ color: "var(--fg-3)" }}>%</small></>, l: "Platform uptime, trailing 90 days" },
];

const PRINCIPLES = [
  { num: "01", title: <>Providers run businesses.<br />We run <em className="font-serif font-normal italic">rails</em>.</>, desc: <>Trainers pick their prices. Gyms set their cancellation policies. Dietitians own their methodology. <strong style={{ color: "var(--ink)", fontWeight: 500 }}>We never recommend what to charge.</strong> Marketplaces that price-set become race-to-the-bottoms; we&apos;d rather earn 5% of work that&apos;s worth it.</> },
  { num: "02", title: <>Money moves through. It doesn&apos;t <em className="font-serif font-normal italic">stop</em>.</>, desc: <>Payments settle directly to provider bank accounts. We never hold funds beyond the gateway settlement period. <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Float isn&apos;t our business model.</strong> It would compromise the trust the whole platform runs on.</> },
  { num: "03", title: <>If we&apos;re not in the room, the work still <em className="font-serif font-normal italic">happens</em>.</>, desc: <>The product is a tool, not a relationship. We don&apos;t gamify, we don&apos;t push, we don&apos;t optimize for daily active users. We optimize for sessions completed and providers who renew. <strong style={{ color: "var(--ink)", fontWeight: 500 }}>One measures pretending. The other measures fit.</strong></> },
];

const TEAM = [
  { name: "Lerato Mokoena", role: "CEO & founder · CPT", bio: "Ran Iron Lab for 7 years before starting Binectics. Holds the company's only NSCA‑CSCS certification on the engineering team.", grad: "linear-gradient(135deg, oklch(0.84 0.05 60), oklch(0.7 0.08 40))" },
  { name: "Sarah Okafor", role: "Head of provider success · CPT", bio: "Coached over a hundred providers onto the platform. Still trains a small client list on Wednesdays.", grad: "linear-gradient(135deg, oklch(0.84 0.04 120), oklch(0.7 0.06 100))" },
  { name: "Dr Nadia Hassan", role: "Head of nutrition product · Lagos", bio: "RD with 12 years in clinical practice. Designed the meal‑plan builder so dietitians could stop using Excel.", grad: "linear-gradient(135deg, oklch(0.86 0.04 300), oklch(0.74 0.06 280))" },
  { name: "Andile Khumalo", role: "VP engineering · Berlin", bio: "Stripe before Binectics. Believes payments should be boring, and runs the team that makes them so.", grad: "linear-gradient(135deg, oklch(0.84 0.04 248), oklch(0.7 0.06 220))" },
];

const TIMELINE = [
  { date: "Mar 2024", title: "v 0.1 — Cape Town", desc: "Three gyms, twelve trainers, one nutritionist. Hand‑held onboarding. We knew everyone's name." },
  { date: "Sep 2024", title: "Lagos & Paystack", desc: "First country outside South Africa. Local rails meant 4× higher conversion on the first day." },
  { date: "Feb 2025", title: "QR check‑ins ship", desc: "The signature moment of the platform. The kiosk app rewrote how a gym opens its doors at 5am." },
  { date: "Aug 2025", title: "10k providers", desc: "Verified providers ticked over 10,000 across 18 countries. We slowed down marketing for two months to make sure operations could keep up." },
  { date: "Jan 2026", title: "Plan builder · v 1", desc: "Trainers can program a 12‑week strength block in 8 minutes. The first feature we shipped that members ask for by name." },
  { date: "Apr 2026", title: "$4.8M monthly GMV", desc: "Live in 52 countries. Verification SLA holding at 36 hours. The platform feels finished and the work is just beginning." },
  { date: "Q3 2026", title: "Member mobile · planned", desc: "iOS and Android. We waited until we knew exactly what to build instead of shipping a watered‑down PWA." },
  { date: "2027", title: "Series B", desc: "If we need it. The plan is to stay capital‑efficient long enough that we don't." },
];

export default function AboutPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar activeLabel="About" />

      {/* Hero */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 pt-16 sm:pt-20 lg:pt-24 pb-10 sm:pb-14" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>About · founded 2024 · Cape Town</div>
        <h1 className="text-[48px] sm:text-[72px] lg:text-[88px] font-medium max-w-[16ch]" style={{ lineHeight: 0.94, letterSpacing: "-0.045em", color: "var(--ink)", marginTop: "18px" }}>
          We build the rails. The <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>people</em> on them do the work.
        </h1>
        <p className="text-[17px] sm:text-[19px] max-w-[60ch] leading-[1.5]" style={{ color: "var(--fg-2)", marginTop: "28px" }}>
          Binectics is the operating system for fitness — a marketplace and operational platform serving gyms, trainers, dietitians, and the people they work with across 52 countries. We&apos;re 28 humans, three offices, and one strong opinion: software should get out of the way.
        </p>
      </section>

      {/* Origin — section head: 1.2fr/2fr grid */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-12 sm:py-16 lg:py-24" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 lg:gap-16 items-end mb-12">
          <h2 className="text-[36px] sm:text-[48px] font-medium leading-none max-w-[12ch]" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>Why we<br /><em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>started</em>.</h2>
          <p className="text-[17px] max-w-[50ch] leading-[1.55]" style={{ color: "var(--fg-2)" }}>The first version of Binectics was a spreadsheet. The founder was running a strength gym in Cape Town and trying to manage 142 members in Google Sheets. Everything you&apos;d expect went wrong.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-[16px] leading-[1.65]" style={{ color: "var(--fg-2)" }}>
          <div>
            <p className="mb-4.5 max-w-[56ch]">In 2023, <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Lerato Mokoena</strong> ran Iron Lab in Sea Point. Four locations, 22 coaches, a sheet of paper at the front desk for check‑ins. The sheet got lost twice in one week. Lerato spent her Sundays reconciling SnapScan receipts against a Google Sheet against a printed register.</p>
            <p className="max-w-[56ch]">The software she could buy was either built for Crunch Gym (and priced for it) or for a single trainer with three clients (and useless past that). The local fitness marketplace was Instagram DMs. <em className="font-serif italic text-[18px]" style={{ color: "var(--ink)" }}>There was nothing in the middle.</em></p>
          </div>
          <div>
            <p className="mb-4.5 max-w-[56ch]">So we built it. The first version went live in Cape Town in March 2024 with three gyms, twelve trainers, and one nutritionist. The second came live in Lagos six months later. By the time we hit a year, we&apos;d grown to 8 countries and a thousand providers.</p>
            <p className="max-w-[56ch]">Today the platform processes <strong style={{ color: "var(--ink)", fontWeight: 500 }}>$4.8M of bookings every month</strong> across 52 countries — and the spreadsheet is still sitting on Lerato&apos;s laptop, untouched since the day the kiosk app shipped.</p>
          </div>
        </div>
      </section>

      {/* Stats — bordered card grid, stat values at 44px */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-12 sm:py-16 lg:py-24" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 lg:gap-16 items-end mb-12">
          <h2 className="text-[36px] sm:text-[48px] font-medium leading-none max-w-[12ch]" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>Where we<br />are today.</h2>
          <p className="text-[17px] max-w-[50ch] leading-[1.55]" style={{ color: "var(--fg-2)" }}>The platform&apos;s growth is matched by an opinion about what&apos;s left out. We don&apos;t run flash sales. We don&apos;t sell ads. We charge a transparent platform fee and let providers run their own businesses on top.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 rounded-(--r-3) overflow-hidden" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
          {STATS.map((s, i) => (
            <div key={i} className="flex flex-col gap-2" style={{ padding: "32px 28px", borderRight: i < 3 ? "1px solid var(--border)" : "none" }}>
              <div className="text-[44px] font-medium" style={{ letterSpacing: "-0.03em", lineHeight: 1, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
              <div className="font-mono text-[11px] uppercase tracking-[0.05em] leading-[1.5]" style={{ color: "var(--fg-3)" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Principles — 3-col card grid, 22px titles, min-height 240px */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-12 sm:py-16 lg:py-24" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 lg:gap-16 items-end mb-12">
          <h2 className="text-[36px] sm:text-[48px] font-medium leading-none max-w-[12ch]" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>What we<br /><em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>believe</em>.</h2>
          <p className="text-[17px] max-w-[50ch] leading-[1.55]" style={{ color: "var(--fg-2)" }}>Three rules we wrote down on day one and haven&apos;t broken since. They sound obvious. They are obvious. The competition doesn&apos;t follow them.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PRINCIPLES.map((p) => (
            <div key={p.num} className="flex flex-col gap-3.5 rounded-(--r-3)" style={{ padding: "28px", border: "1px solid var(--border)", background: "var(--bg)", minHeight: "240px" }}>
              <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{p.num}</div>
              <div className="text-[22px] font-medium leading-[1.2]" style={{ letterSpacing: "-0.018em", color: "var(--ink)" }}>{p.title}</div>
              <p className="text-[14.5px] leading-[1.55] mt-auto" style={{ color: "var(--fg-2)" }}>{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Team — 4-col grid, gradient portrait photos at 4/5 aspect */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-12 sm:py-16 lg:py-24" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 lg:gap-16 items-end mb-12">
          <h2 className="text-[36px] sm:text-[48px] font-medium leading-none max-w-[12ch]" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>Who builds<br />this.</h2>
          <p className="text-[17px] max-w-[50ch] leading-[1.55]" style={{ color: "var(--fg-2)" }}>Twenty‑eight people across Cape Town, Lagos, Berlin, and one in Sydney who refuses to relocate. Founding team below — the rest live on the <Link href="/careers" className="underline underline-offset-3" style={{ color: "var(--ink)", textDecorationColor: "var(--border-2)" }}>careers page</Link>.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {TEAM.map((m) => (
            <div key={m.name} className="flex flex-col gap-3.5">
              <div className="aspect-[4/5] rounded-(--r-3)" style={{ background: m.grad }} />
              <div>
                <div className="text-[16px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>{m.name}</div>
                <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.75" style={{ color: "var(--fg-3)" }}>{m.role}</div>
                <p className="text-[13px] leading-[1.55] mt-2" style={{ color: "var(--fg-2)" }}>{m.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline — 4-col milestone cards on bg-2 background */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-12 sm:py-16 lg:py-24" style={{ borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 lg:gap-16 items-end mb-12">
          <h2 className="text-[36px] sm:text-[48px] font-medium leading-none max-w-[12ch]" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>What we<br />shipped<br />when.</h2>
          <p className="text-[17px] max-w-[50ch] leading-[1.55]" style={{ color: "var(--fg-2)" }}>A milestone-only timeline. Each one represents months of unglamorous work — the kind that&apos;s not worth a blog post but compounds into a product worth using.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {TIMELINE.map((t) => (
            <div key={t.date} className="flex flex-col gap-2.5 rounded-(--r-3)" style={{ padding: "22px 24px", border: "1px solid var(--border)", background: "var(--bg)" }}>
              <div className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>{t.date}</div>
              <div className="text-[17px] font-medium leading-[1.25]" style={{ letterSpacing: "-0.012em", color: "var(--ink)" }}>{t.title}</div>
              <p className="text-[13px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA — ink background, h2: 56px, rounded card, 80px padding */}
      <div className="mx-auto max-w-340 px-5 sm:px-10 my-10 sm:my-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 lg:gap-12 items-end rounded-(--r-3) p-6 sm:p-10 lg:p-20" style={{ background: "var(--ink)", color: "var(--bg)" }}>
          <h2 className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[14ch]" style={{ lineHeight: 0.98, letterSpacing: "-0.035em", color: "var(--bg)" }}>
            List your practice today. <em className="font-serif font-normal italic">Build something real.</em>
          </h2>
          <div className="flex flex-col gap-4 items-start">
            <p className="text-[16px] max-w-[36ch] leading-[1.5]" style={{ color: "oklch(0.78 0.005 85)", margin: 0 }}>Free to start, three minutes to publish. Or — if our principles resonate — we&apos;re hiring across engineering, design, and provider success.</p>
            <div className="flex gap-3">
              <Link href="/login?mode=signup" className="btn-signal-v2 lg" style={{ color: "oklch(0.18 0.05 148)" }}>Create your account →</Link>
              <Link href="/careers" className="btn-ghost-v2 lg" style={{ color: "var(--bg)", borderColor: "oklch(0.35 0.008 80)" }}>See open roles</Link>
            </div>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
