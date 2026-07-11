"use client";

import Link from "next/link";
import { useState, use } from "react";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { MarketplaceAuthCluster } from "@/components/MarketplaceAuthCluster";

/**
 * Review Provider — post-session review form.
 * Proto: review-provider.html
 * Topbar + centered 540px card with star rating, tag pills, textarea, checkbox.
 * "use client" for star rating interactivity + params unwrap.
 */

const TAGS = ["On time", "Clear cues", "Personalised", "Pushed me", "Great vibe", "Safe space", "Strong follow-up"];
const LABELS = ["Poor", "Fair", "Good", "Great", "Excellent"];

function Star({ filled, onClick }: { filled: boolean; onClick: () => void }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill={filled ? "oklch(0.65 0.18 75)" : "none"}
      stroke="oklch(0.55 0.14 60)"
      strokeWidth="1"
      className="cursor-pointer"
      onClick={onClick}
    >
      <path d="m12 2 3 7 7 .8-5.3 4.7L18 22l-6-4-6 4 1.3-7.5L2 9.8 9 9z" />
    </svg>
  );
}

export default function ReviewProviderPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = use(params);
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div style={{ background: "var(--bg-2)", minHeight: "100vh" }}>
      {/* Topbar */}
      <header className="border-b border-border" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-320 flex items-center justify-between h-14 px-5 sm:px-8">
          <Link href="/"><BinecticsLockup /></Link>
          <nav className="flex items-center gap-4 text-[13.5px]">
            <Link href="/marketplace" style={{ color: "var(--fg-2)", textDecoration: "none" }}>Marketplace</Link>
            <MarketplaceAuthCluster compact />
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-135 px-5 sm:px-6 py-8">
        <div className="rounded-(--r-3) p-8 sm:p-9" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Review · Session BIN-2026-040112</div>
          <h1 className="text-[26px] sm:text-[28px] font-medium leading-[1.2] mb-3" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
            How was your session with <em className="font-serif font-normal italic">Sarah</em>?
          </h1>
          <p className="text-[15px] leading-[1.6] mb-7" style={{ color: "var(--fg-2)" }}>
            Wed 20 May · 08:30 · Iron Lab Sea Point. Reviews are public, attached to your name, and Sarah can reply once.
          </p>

          {/* Star rating */}
          <div className="flex justify-center gap-2 py-4.5 rounded-(--r-3) mb-2.5" style={{ background: "var(--bg-2)" }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} filled={n <= rating} onClick={() => setRating(n)} />
            ))}
          </div>
          <div className="text-center font-mono text-[11px] uppercase tracking-[0.05em] mb-5.5" style={{ color: "var(--fg-3)" }}>
            {rating} of 5 · {LABELS[rating - 1]}
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1.5 mb-4.5">
            <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>What stood out (optional)</label>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="px-2.75 py-1.5 rounded-full text-[12px] cursor-pointer"
                  style={{
                    background: selectedTags.includes(tag) ? "var(--ink)" : "var(--bg-2)",
                    color: selectedTags.includes(tag) ? "var(--bg)" : "var(--ink)",
                    border: `1px solid ${selectedTags.includes(tag) ? "var(--ink)" : "var(--border)"}`,
                  }}
                >
                  {selectedTags.includes(tag) ? "" : "+ "}{tag}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="flex flex-col gap-1.5 mb-6">
            <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Your review</label>
            <textarea
              required
              minLength={30}
              maxLength={500}
              placeholder="What went well? Anything Sarah could improve?"
              className="rounded-(--r-2) px-3.5 py-3 text-[14px] outline-none resize-y"
              style={{ background: "var(--bg)", border: "1px solid var(--border-2)", font: "inherit", minHeight: "100px" }}
            />
            <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Minimum 30 characters · max 500</div>
          </div>

          {/* Checkbox */}
          <div className="flex gap-3.5 items-center px-3.5 py-3 rounded-(--r-2) mb-6" style={{ background: "var(--bg-2)" }}>
            <input type="checkbox" id="public" defaultChecked />
            <label htmlFor="public" className="text-[13px]" style={{ color: "var(--ink)" }}>
              Show my name with the review{" "}
              <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>· otherwise shown as &quot;Tunde A.&quot;</span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Link href="/dashboard/bookings" className="btn-ghost-v2 sm">Skip</Link>
            <button type="submit" className="btn-primary-v2 sm cursor-pointer">Post review</button>
          </div>
        </div>
      </div>
    </div>
  );
}
