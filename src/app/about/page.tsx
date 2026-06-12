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
  { v: "8", l: "Currencies at launch" },
  { v: <>50<small className="font-mono text-[16px] font-normal ml-0.5" style={{ color: "var(--fg-3)" }}>+</small></>, l: "Countries with payment support" },
  { v: <>100<small className="font-mono text-[16px] font-normal ml-0.5" style={{ color: "var(--fg-3)" }}>%</small></>, l: "AI drafts human-reviewed before send" },
  { v: "0", l: "Card numbers stored on our servers" },
];

const PRINCIPLES = [
  { num: "01", title: <>Providers run businesses.<br />We run rails.</>, desc: <>Trainers pick their prices. Gyms set their cancellation policies. Dietitians own their methodology. <strong style={{ color: "var(--ink)", fontWeight: 500 }}>We never recommend what to charge.</strong> Marketplaces that price-set become race-to-the-bottoms; we&apos;d rather earn a small fee on work that&apos;s worth it.</> },
  { num: "02", title: <>Money moves through. It doesn&apos;t stop.</>, desc: <>Payments settle directly to provider bank accounts. We never hold funds beyond the gateway settlement period. <strong style={{ color: "var(--ink)", fontWeight: 500 }}>Float isn&apos;t our business model.</strong> It would compromise the trust the whole platform runs on.</> },
  { num: "03", title: <>If we&apos;re not in the room, the work still happens.</>, desc: <>The product is a tool, not a relationship. We don&apos;t gamify, we don&apos;t push, we don&apos;t optimize for daily active users. We optimize for sessions completed and providers who renew. <strong style={{ color: "var(--ink)", fontWeight: 500 }}>One measures pretending. The other measures fit.</strong></> },
];

const TEAM = [
  { name: "Provider success", role: "Onboarding · verification", bio: "Hand-holds every founding-cohort provider onto the platform and reviews every verification document personally.", grad: "linear-gradient(135deg, oklch(0.84 0.05 60), oklch(0.7 0.08 40))" },
  { name: "Payments engineering", role: "Stripe · Paystack · Flutterwave", bio: "Believes payments should be boring. Three rails, eight currencies, settlement directly to provider accounts.", grad: "linear-gradient(135deg, oklch(0.84 0.04 248), oklch(0.7 0.06 220))" },
  { name: "Copilot & nutrition product", role: "AI drafts · meal plans", bio: "Builds the drafting engine and the meal-plan tools — designed so no client message ever sends without human review.", grad: "linear-gradient(135deg, oklch(0.86 0.04 300), oklch(0.74 0.06 280))" },
  { name: "Design", role: "Design system · product chrome", bio: "One signal color, 1px hairlines, no shadows. The calm is deliberate.", grad: "linear-gradient(135deg, oklch(0.84 0.04 120), oklch(0.7 0.06 100))" },
];

const TIMELINE = [
  { date: "2025", title: "The thesis", desc: "Fitness professionals lose hours every week to admin software should have absorbed years ago. We started designing the rails — marketplace, payments, check‑ins — as one product." },
  { date: "Early 2026", title: "Design system v2", desc: "Calm chrome: one signal color, hairline borders, restrained motion. An admin reviewing documents and a trainer writing a journal entry work in the same quiet product." },
  { date: "Now", title: "Early access", desc: "The founding cohort of gyms, trainers, and dietitians is onboarding — locked pricing, hands‑on setup, and a direct line to the team building the copilot." },
  { date: "Launch 2026", title: "Copilot GA", desc: "AI‑drafted summaries, weekly reports, and program updates — generated from your clients' data, reviewed by you before anything sends. Member mobile apps follow." },
];

export default function AboutPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar activeLabel="About" />

      {/* Hero */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 pt-16 sm:pt-20 lg:pt-24 pb-10 sm:pb-14" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>About · early access · launching 2026</div>
        <h1 className="text-[48px] sm:text-[72px] lg:text-[88px] font-medium max-w-[16ch]" style={{ lineHeight: 0.94, letterSpacing: "-0.045em", color: "var(--ink)", marginTop: "18px" }}>
          We build the rails. The <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>people</em> on them do the work.
        </h1>
        <p className="text-[17px] sm:text-[19px] max-w-[60ch] leading-[1.5]" style={{ color: "var(--fg-2)", marginTop: "28px" }}>
          Binectics is the copilot fitness professionals run their business on — AI-drafted client work, payments, and a verified marketplace for gyms, trainers, dietitians, and the people they work with. We&apos;re a small team with one strong opinion: software should get out of the way.
        </p>
      </section>

      {/* Origin — section head: 1.2fr/2fr grid */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-12 sm:py-16 lg:py-24" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 lg:gap-16 items-end mb-12">
          <h2 className="text-[36px] sm:text-[48px] font-medium leading-none max-w-[12ch]" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>Why we<br />started.</h2>
          <p className="text-[17px] max-w-[50ch] leading-[1.55]" style={{ color: "var(--fg-2)" }}>Binectics started as a simple observation: the people who keep other humans healthy spend half their week on admin that software should have absorbed years ago.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-[16px] leading-[1.65]" style={{ color: "var(--fg-2)" }}>
          <div>
            <p className="mb-4.5 max-w-[56ch]">Walk into any independent gym and you&apos;ll find the same stack: a spreadsheet for members, a WhatsApp group for scheduling, a card machine that talks to neither, and a coach writing Monday check‑in notes at 9pm. The software they could buy was either built for global chains (and priced for it) or for a single trainer with three clients (and useless past that).</p>
            <p className="max-w-[56ch]">The local fitness marketplace was Instagram DMs. There was nothing in the middle.</p>
          </div>
          <div>
            <p className="mb-4.5 max-w-[56ch]">So we&apos;re building it: one platform where discovery, payments, check‑ins, and client work run on the same rails — and where <strong style={{ color: "var(--ink)", fontWeight: 500 }}>an AI copilot drafts the busywork</strong> that eats a professional&apos;s week, with every draft reviewed by a human before it sends.</p>
            <p className="max-w-[56ch]">Early access is open now. The founding cohort of providers is shaping what ships at launch — pricing locked, direct line to the team.</p>
          </div>
        </div>
      </section>

      {/* Stats — bordered card grid, stat values at 44px */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 py-12 sm:py-16 lg:py-24" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_2fr] gap-8 lg:gap-16 items-end mb-12">
          <h2 className="text-[36px] sm:text-[48px] font-medium leading-none max-w-[12ch]" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>Where we<br />are today.</h2>
          <p className="text-[17px] max-w-[50ch] leading-[1.55]" style={{ color: "var(--fg-2)" }}>We&apos;re pre-launch and building in the open. The numbers we can show you are the ones designed into the product — usage numbers come after launch, and they&apos;ll be real when they do.</p>
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
          <p className="text-[17px] max-w-[50ch] leading-[1.55]" style={{ color: "var(--fg-2)" }}>A small team across product, engineering, and provider success — growing as we head to launch. The disciplines below; the open roles live on the <Link href="/careers" className="underline underline-offset-3" style={{ color: "var(--ink)", textDecorationColor: "var(--border-2)" }}>careers page</Link>.</p>
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
          <h2 className="text-[36px] sm:text-[48px] font-medium leading-none max-w-[12ch]" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>What ships<br />when.</h2>
          <p className="text-[17px] max-w-[50ch] leading-[1.55]" style={{ color: "var(--fg-2)" }}>A build log and a roadmap. Each entry is months of unglamorous work — the kind that&apos;s not worth a blog post but compounds into a product worth using.</p>
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
            List your practice today. Build something real.
          </h2>
          <div className="flex flex-col gap-4 items-start">
            <p className="text-[16px] max-w-[36ch] leading-[1.5]" style={{ color: "oklch(0.78 0.005 85)", margin: 0 }}>Free to start, three minutes to publish. Or — if our principles resonate — we&apos;re hiring across engineering, design, and provider success.</p>
            <div className="flex gap-3">
              <Link href="/login?mode=signup" className="btn-signal-v2 lg" style={{ color: "oklch(0.18 0.05 148)" }}>Start free →</Link>
              <Link href="/careers" className="btn-ghost-v2 lg" style={{ color: "var(--bg)", borderColor: "oklch(0.35 0.008 80)" }}>See open roles</Link>
            </div>
          </div>
        </div>
      </div>

      <MarketingFooter />
    </div>
  );
}
