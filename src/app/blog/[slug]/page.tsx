import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";

const POSTS: Record<string, { category: string; title: string; date: string; author: string; role: string; readTime: string; body: string[] }> = {
  "why-we-built-binectics-on-oklch": {
    category: "Engineering",
    title: "Why we built Binectics on oklch",
    date: "18 May 2026",
    author: "Tunde Adeyemi",
    role: "Lead Frontend Engineer",
    readTime: "6 min read",
    body: [
      "When you operate a design system across five accent colours, three product surfaces, and dozens of generated tints, you need a colour space that behaves predictably. sRGB hex doesn't. HSL barely does. oklch does.",
      "oklch (Oklab Lightness, Chroma, Hue) is a perceptually uniform colour space — meaning a 10-point lightness step looks equally bright to the human eye regardless of hue. That property unlocks something powerful: you can generate palettes programmatically and trust the output.",
      "Our token layer defines each role colour as a single oklch triplet. From that, we derive soft backgrounds, hover states, text-on-background pairs, and chart colours — all with simple arithmetic on the L and C channels. No hand-tuning, no 'this green looks brighter than that blue' debates.",
      "The practical upside: when we added the --consumer role colour (oklch 0.58 0.14 320), every component that consumes a role token — badges, chart segments, sidebar accents — picked it up automatically. Zero design review needed.",
      "Browser support landed in Chrome 111, Safari 15.4, and Firefox 113. For the <1% of traffic on older browsers, CSS falls back gracefully to the nearest sRGB equivalent. We haven't heard a single support ticket about it.",
      "If you're starting a design system today, start in oklch. The tooling has caught up, the spec is stable, and the ergonomic gain over hex/hsl compounds with every token you add.",
    ],
  },
  "the-check-in-problem-nobody-talks-about": {
    category: "Product",
    title: "The check-in problem nobody talks about",
    date: "11 May 2026",
    author: "Lara van der Merwe",
    role: "Product Manager",
    readTime: "5 min read",
    body: [
      "Every gym has the same problem: people walk in, flash a card, and nobody really knows whether that person is an active member. Buddy-scanning — where one member scans for two — costs the average mid-size gym 12% of revenue annually.",
      "We replaced the legacy card scanner with a 3-second QR flow. The member opens the Binectics app, taps Check In, and the front-desk scanner reads a time-limited, single-use QR code tied to their active subscription.",
      "The QR code expires in 60 seconds and can't be forwarded. If the subscription has lapsed, the scan fails with a clear message. No confrontation at the front desk — the system handles it.",
      "For gym owners, the check-in feed is real-time. You can see peak hours, average visit duration, and which membership tiers actually show up. One operator in Cape Town discovered that 40% of their premium members hadn't checked in for 30+ days — a churn signal they'd never had before.",
      "The technical implementation is straightforward: a signed JWT embedded in a QR matrix, verified against the subscription service at scan time. Latency is under 200ms on a 3G connection, which matters in markets where Wi-Fi isn't reliable.",
      "Since launch, buddy-scanning incidents have dropped 94% across gyms using the system. That's not a product metric — it's recovered revenue.",
    ],
  },
  "multi-currency-payments-in-african-fitness": {
    category: "Industry",
    title: "Multi-currency payments in African fitness",
    date: "03 May 2026",
    author: "Kemi Ogunleye",
    role: "Head of Payments",
    readTime: "8 min read",
    body: [
      "Stripe covers 47 countries. Nigeria isn't one of them. Paystack covers Nigeria brilliantly — but try charging in South African Rand and you'll hit a wall. Flutterwave bridges some gaps but doesn't do recurring billing the way a subscription platform needs.",
      "We built a payment routing layer that abstracts the processor entirely. When a member in Lagos subscribes to a gym plan priced in Naira, the charge goes through Paystack. When the same platform signs up a Cape Town gym charging in Rand, it routes to Stripe. The gym owner sees one dashboard.",
      "The routing decision happens at checkout time based on three inputs: the member's country, the provider's settlement currency, and processor availability. If Paystack is down (rare, but it happens), the system fails gracefully with a retry prompt — it doesn't silently try a different processor.",
      "Currency conversion is handled at display time, not charge time. We show approximate equivalents for discovery ('~$12/month') but always charge in the provider's native currency. This avoids the FX surprise that kills conversion in cross-border commerce.",
      "The hardest part wasn't the routing — it was reconciliation. Three processors, three webhook formats, three settlement timelines. We built a unified ledger that normalises everything into a single schema, with a 15-minute reconciliation loop that flags discrepancies before they become support tickets.",
      "Today we process in 8 currencies across 50+ countries. The goal isn't to replace Stripe or Paystack — it's to make the operator forget they exist.",
    ],
  },
  "how-gyms-in-lagos-are-going-digital": {
    category: "Industry",
    title: "How gyms in Lagos are going digital",
    date: "24 Apr 2026",
    author: "Tunde Adeyemi",
    role: "Lead Frontend Engineer",
    readTime: "7 min read",
    body: [
      "We spent three months embedded in Lekki, Victoria Island, and Yaba — visiting 28 gyms, interviewing 14 owners, and watching how members actually interact with fitness businesses in Lagos.",
      "The dominant stack is: a WhatsApp group for announcements, a spreadsheet for memberships, bank transfers for payment, and a physical sign-in book at the front desk. It works. But it doesn't scale past about 200 members.",
      "The tipping point is usually payroll. When a gym has 4+ trainers on commission, tracking who trained whom and calculating splits manually becomes a full-time job. That's when owners start googling 'gym management software' — and finding tools built for American markets that assume credit cards and English-only interfaces.",
      "What Lagos gym owners actually need is simpler than what most SaaS products offer: reliable payment collection (bank transfer + card), a member list that's not a spreadsheet, and check-in tracking that doesn't rely on trust.",
      "We built Binectics to start there. No feature bloat, no 90-day onboarding. A gym owner in Lekki can be live in under an hour, with their existing members imported from a CSV and their first payment collected the same day.",
      "The surprise finding: trainers adopted faster than owners. When a trainer can see their own earnings, client count, and session history in one place, they stop asking the owner for reports. That alone saves 3–4 hours a week for a mid-size gym.",
      "Lagos is our launch city, but the pattern repeats in Nairobi, Accra, and Johannesburg. The fitness industry in Africa isn't behind — it's just been underserved by software that wasn't built for it.",
    ],
  },
  "trainer-burnout-is-a-platform-problem": {
    category: "Product",
    title: "Trainer burnout is a platform problem",
    date: "15 Apr 2026",
    author: "Jake Martinez",
    role: "Head of Provider Experience",
    readTime: "4 min read",
    body: [
      "Personal trainers don't burn out from training. They burn out from admin. Scheduling, invoicing, chasing payments, updating availability, messaging clients — the average independent trainer spends 90 minutes a day on tasks that aren't coaching.",
      "We ran a time audit with 22 trainers across four countries. The biggest time sink wasn't scheduling (most had figured out Calendly or similar). It was payment follow-up. Chasing a client for a missed payment is awkward, and most trainers just let it slide. That's revenue leakage.",
      "Binectics automates the awkward parts. Payments are collected upfront or on a recurring schedule. If a card fails, the system retries and notifies the client — the trainer never has to send the 'hey, your payment didn't go through' message.",
      "The second biggest sink: context-switching between tools. Calendar here, notes there, payments somewhere else. We consolidated everything into one dashboard. A trainer opens Binectics and sees today's sessions, pending payments, and client notes in one view.",
      "Since rolling this out, trainers on the platform report an average of 52 minutes saved per day. That's time they're reinvesting in actual coaching — or just taking a break, which is equally valuable.",
    ],
  },
  "what-dietitians-actually-need-from-software": {
    category: "Product",
    title: "What dietitians actually need from software",
    date: "07 Apr 2026",
    author: "Priya Patel",
    role: "Dietitian Product Lead",
    readTime: "6 min read",
    body: [
      "We interviewed 40 registered dietitians across South Africa, Nigeria, the UAE, and Kenya. We asked one question: 'What does your current software not do that you wish it did?' Not a single person said 'meal-plan templates.'",
      "What they said, overwhelmingly, was: 'I need a food composition database that includes the foods my clients actually eat.' The USDA database — the backbone of most nutrition software — doesn't include fufu, pap, bobotie, or shawarma. Dietitians working with African and Middle Eastern clients are manually entering nutritional data for half their meal plans.",
      "We partnered with Dr. Nadia Hassan, a clinical dietitian in Dubai, to build the Binectics Food Composition Database (FCDB). It now covers 2,400+ foods across West African, Southern African, East African, and Middle Eastern cuisines — with verified macro and micronutrient data.",
      "The second need was client communication. Most dietitians use WhatsApp to check in with clients between sessions. That works socially but fails clinically — there's no structured data, no adherence tracking, and no way to look back at a client's progress over time.",
      "We built client journals that sit between 'clinical EMR' and 'WhatsApp chat.' Dietitians log structured notes (weight, mood, adherence score) and can share a read-only view with the client. It's lightweight enough to use on a phone between sessions.",
      "The lesson: don't build what other software already has. Build what's missing. For dietitians outside the Western market, what's missing is representation in the data layer.",
    ],
  },
};

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function generateStaticParams() {
  return Object.keys(POSTS).map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return params.then(({ slug }) => {
    const post = POSTS[slug];
    if (!post) return { title: "Post not found | Binectics" };
    return { title: `${post.title} | Binectics Blog`, description: post.body[0] };
  });
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Engineering: { bg: "var(--accent-blue-soft, oklch(0.95 0.03 250))", color: "var(--accent-blue, oklch(0.55 0.14 250))" },
  Product: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
  Industry: { bg: "var(--accent-purple-soft, oklch(0.94 0.04 300))", color: "var(--accent-purple, oklch(0.55 0.14 300))" },
};

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS[slug];
  if (!post) notFound();

  const cat = CATEGORY_COLORS[post.category] ?? { bg: "var(--bg-2)", color: "var(--fg-3)" };
  const allSlugs = Object.keys(POSTS);
  const currentIdx = allSlugs.indexOf(slug);
  const related = allSlugs.filter((_, i) => i !== currentIdx).slice(0, 2);

  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      <article className="mx-auto max-w-180 px-5 sm:px-8 pt-14 sm:pt-20 pb-16 sm:pb-24">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-[13px] mb-8 hover:underline" style={{ color: "var(--fg-3)" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          Back to blog
        </Link>

        <span className="inline-block font-mono text-[10px] px-2 py-0.75 rounded-full uppercase tracking-[0.04em] mb-5" style={{ background: cat.bg, color: cat.color }}>
          {post.category}
        </span>

        <h1 className="text-[32px] sm:text-[40px] lg:text-[48px] font-medium" style={{ lineHeight: 1.08, letterSpacing: "-0.028em", color: "var(--ink)" }}>
          {post.title}
        </h1>

        <div className="flex items-center gap-3 mt-6 mb-10" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
          <span className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-medium shrink-0" style={{ background: "var(--bg-3)", color: "var(--ink)" }}>
            {post.author.split(" ").map(n => n[0]).join("")}
          </span>
          <div>
            <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{post.author}</div>
            <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{post.role} · {post.date} · {post.readTime}</div>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          {post.body.map((p, i) => (
            <p key={i} className="text-[16px] leading-[1.7] max-w-[65ch]" style={{ color: "var(--fg-2)" }}>
              {p}
            </p>
          ))}
        </div>
      </article>

      {related.length > 0 && (
        <section className="mx-auto max-w-280 px-5 sm:px-8 py-12 sm:py-16" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-6" style={{ color: "var(--fg-3)" }}>More from the blog</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {related.map((s) => {
              const r = POSTS[s];
              const rc = CATEGORY_COLORS[r.category] ?? { bg: "var(--bg-2)", color: "var(--fg-3)" };
              return (
                <Link key={s} href={`/blog/${s}`} className="block rounded-(--r-3) p-6 hover:border-ink" style={{ background: "var(--bg-2)", textDecoration: "none", color: "inherit" }}>
                  <span className="inline-block font-mono text-[10px] px-2 py-0.75 rounded-full uppercase tracking-[0.04em] mb-3" style={{ background: rc.bg, color: rc.color }}>{r.category}</span>
                  <h3 className="text-[17px] font-medium leading-[1.3] mb-2" style={{ color: "var(--ink)" }}>{r.title}</h3>
                  <p className="text-[13.5px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>{r.body[0].slice(0, 120)}...</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <MarketingFooter />
    </div>
  );
}
