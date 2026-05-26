import Link from "next/link";
import type { Metadata } from "next";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";

/**
 * Blog — listing page with hardcoded post cards.
 * Hero 56px h1 with serif italic, 3-col card grid.
 */

export const metadata: Metadata = {
  title: "Blog | Binectics",
  description: "Insights on fitness technology, multi-currency payments, and building the operating system for global fitness.",
};

function slugify(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const POSTS = [
  {
    category: "Engineering",
    title: "Why we built Binectics on oklch",
    excerpt: "Perceptual uniformity matters when your brand spans five accent colours and three continents. Here's how oklch changed our token system.",
    date: "18 May 2026",
    author: "Tunde Adeyemi",
    readTime: "6 min read",
  },
  {
    category: "Product",
    title: "The check-in problem nobody talks about",
    excerpt: "Gym operators lose 12% of revenue to buddy-scanning and forgotten check-outs. We fixed it with a 3-second QR flow.",
    date: "11 May 2026",
    author: "Lara van der Merwe",
    readTime: "5 min read",
  },
  {
    category: "Industry",
    title: "Multi-currency payments in African fitness",
    excerpt: "Stripe doesn't cover Naira. Paystack doesn't do Rand. We built a routing layer that handles both without the operator noticing.",
    date: "03 May 2026",
    author: "Kemi Ogunleye",
    readTime: "8 min read",
  },
  {
    category: "Industry",
    title: "How gyms in Lagos are going digital",
    excerpt: "Paper sign-in sheets, WhatsApp groups, and bank transfers are giving way to real software. We spent three months in Lekki finding out why.",
    date: "24 Apr 2026",
    author: "Tunde Adeyemi",
    readTime: "7 min read",
  },
  {
    category: "Product",
    title: "Trainer burnout is a platform problem",
    excerpt: "When your scheduling tool makes you do admin for 90 minutes a day, the problem isn't discipline. It's the tool.",
    date: "15 Apr 2026",
    author: "Jake Martinez",
    readTime: "4 min read",
  },
  {
    category: "Product",
    title: "What dietitians actually need from software",
    excerpt: "We interviewed 40 registered dietitians across four countries. None of them wanted another meal-plan template library.",
    date: "07 Apr 2026",
    author: "Priya Patel",
    readTime: "6 min read",
  },
];

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Engineering: { bg: "var(--accent-blue-soft, oklch(0.95 0.03 250))", color: "var(--accent-blue, oklch(0.55 0.14 250))" },
  Product: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
  Industry: { bg: "var(--accent-purple-soft, oklch(0.94 0.04 300))", color: "var(--accent-purple, oklch(0.55 0.14 300))" },
};

export default function BlogPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Blog</div>
        <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[18ch]" style={{ lineHeight: 1.04, letterSpacing: "-0.032em", color: "var(--ink)" }}>
          From the <em className="font-serif font-normal italic">team</em>.
        </h1>
        <p className="text-[17px] sm:text-[18px] max-w-[60ch] leading-[1.5] mt-5" style={{ color: "var(--fg-2)" }}>
          Fitness industry insights, engineering deep-dives, and lessons from building a global platform one city at a time.
        </p>
      </section>

      {/* Posts grid */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {POSTS.map((post) => {
            const cat = CATEGORY_COLORS[post.category] ?? { bg: "var(--bg-2)", color: "var(--fg-3)" };
            return (
              <Link key={post.title} href={`/blog/${slugify(post.title)}`} className="block rounded-(--r-3) p-6 hover:border-ink" style={{ background: "var(--bg-2)", textDecoration: "none", color: "inherit" }}>
                <span
                  className="inline-block font-mono text-[10px] px-2 py-0.75 rounded-full uppercase tracking-[0.04em] mb-4"
                  style={{ background: cat.bg, color: cat.color }}
                >
                  {post.category}
                </span>
                <h3 className="text-[17px] font-medium leading-[1.3] mb-2" style={{ color: "var(--ink)" }}>{post.title}</h3>
                <p className="text-[13.5px] leading-[1.55] mb-4" style={{ color: "var(--fg-2)" }}>{post.excerpt}</p>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{post.author}</span>
                  <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{post.date} &middot; {post.readTime}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
