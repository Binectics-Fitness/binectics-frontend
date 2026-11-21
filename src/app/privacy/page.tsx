"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { DOCS, LEGAL_STATUS, sectionId, type DocType } from "./legalDocs";

/**
 * Legal — legal.html prototype. 3-column layout (260px TOC + 1fr content + 240px sidebar).
 * Document tabs: Privacy, Terms, Cookies. Numbered sections with plain-English summaries.
 */

// The documents themselves (drafts pending legal review) live in legalDocs.tsx.

function LegalPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: DocType = tabParam === "terms" || tabParam === "cookies" ? tabParam : "privacy";
  const [activeDoc, setActiveDoc] = useState<DocType>(initialTab);
  const doc = DOCS[activeDoc];

  // The page renders on the client, so the browser's own jump to a #anchor
  // (e.g. /privacy#health-data, linked from the Android app) runs before the
  // section exists. Scroll to it once it does.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    document.getElementById(decodeURIComponent(hash))?.scrollIntoView();
  }, [activeDoc]);

  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 pt-10 sm:pt-14 pb-5 sm:pb-7">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Legal</div>
        <h1 className="text-[48px] font-medium max-w-[18ch]" style={{ lineHeight: 1.02, letterSpacing: "-0.032em", color: "var(--ink)", marginTop: "14px" }}>
          The fine print, in <em className="font-serif font-normal italic">plain English</em>.
        </h1>
        <p className="text-[16px] max-w-[56ch] leading-[1.55] mt-4" style={{ color: "var(--fg-2)" }}>Plain language where possible. If something is unclear, email privacy@binectics.com.</p>
        {LEGAL_STATUS[activeDoc] === "draft" && (
          <div role="note" className="rounded-(--r-2) mt-5.5 px-4 py-3 max-w-[64ch] text-[14px] leading-[1.5]" style={{ background: "var(--bg-2)", border: "1px solid var(--border-2)", color: "var(--ink)" }}>
            <strong className="font-medium">Draft, pending legal review.</strong>{" "}
            This document has not yet been reviewed by a lawyer and may change before launch. Highlighted items are still to be supplied.
          </div>
        )}
      </section>

      {/* Document tabs */}
      <div className="mx-auto max-w-360 px-5 sm:px-10 overflow-x-auto" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex gap-0">
          {(Object.entries(DOCS) as [DocType, typeof DOCS.privacy][]).map(([key, d]) => (
            <button key={key} onClick={() => setActiveDoc(key)} className={`px-4.5 py-4 text-[14.5px] whitespace-nowrap cursor-pointer -mb-px ${activeDoc === key ? "border-b-2 border-ink font-medium" : ""}`} style={{ color: activeDoc === key ? "var(--ink)" : "var(--fg-3)", transition: "color var(--motion-fast), border-color var(--motion-fast)" }}>
              {d.label}
              <span className="font-mono text-[11px] ml-2.5" style={{ color: activeDoc === key ? "var(--fg-3)" : "var(--fg-4)" }}>{d.version}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3-column layout */}
      <div className="mx-auto max-w-360 grid grid-cols-1 lg:grid-cols-[260px_1fr_240px] items-start gap-8 lg:gap-14 px-5 sm:px-10 py-8 sm:py-10 lg:pb-24">

        {/* TOC */}
        <aside className="hidden lg:flex sticky flex-col gap-0.5" style={{ top: "24px" }}>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] px-2.5 py-2" style={{ color: "var(--fg-3)" }}>{doc.label}</div>
          {doc.sections.map((s, i) => (
            <a key={s.num} href={`#${sectionId(s)}`} className={`flex justify-between items-center py-1.5 px-2.5 rounded-(--r-2) text-[13px] ${i === 0 ? "bg-bg-2 font-medium" : "hover:bg-bg-2"}`} style={{ color: i === 0 ? "var(--ink)" : "var(--fg-3)", borderLeft: i === 0 ? "2px solid var(--ink)" : "2px solid transparent", paddingLeft: i === 0 ? "8px" : "10px", textDecoration: "none" }}>
              {s.title}
              <span className="font-mono text-[11px]" style={{ color: i === 0 ? "var(--ink)" : "var(--fg-4)" }}>{s.num}</span>
            </a>
          ))}
        </aside>

        {/* Content */}
        <main className="max-w-[720px]">
          {doc.sections.map((s, i) => (
            <div key={s.num} id={sectionId(s)} style={{ marginTop: i > 0 ? "56px" : 0, paddingTop: i > 0 ? "12px" : 0, borderTop: i > 0 ? "1px solid var(--border)" : "none" }}>
              <h2 className="text-[26px] font-medium leading-[1.1]" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
                <span className="font-mono text-[13px] font-normal mr-3 tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.num}</span>
                {s.title}
              </h2>
              <div className="mt-4">{s.content}</div>
            </div>
          ))}
        </main>

        {/* Right rail */}
        <aside className="hidden lg:flex sticky flex-col gap-4.5" style={{ top: "24px" }}>
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>Quick actions</div>
            <div className="rounded-(--r-3) flex flex-col gap-2.5" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", padding: "16px 18px" }}>
              <p className="text-[13px] leading-[1.55]" style={{ color: "var(--fg-2)", margin: 0 }}>Manage your data from settings, or email us.</p>
              <div className="flex flex-col gap-1.5 mt-2.5">
                {[
                  { label: "Privacy settings", href: "/dashboard/settings/privacy", icon: "→" },
                  { label: "Email privacy team", href: "mailto:privacy@binectics.com", icon: "→" },
                ].map((a) => (
                  <a key={a.label} href={a.href} className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.04em] px-2.5 py-2.5 rounded-(--r-2) hover:border-ink" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)", textDecoration: "none" }}>
                    {a.label}
                    <span style={{ color: "var(--fg-3)" }}>{a.icon}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>


        </aside>
      </div>

      <MarketingFooter />
    </div>
  );
}

export default function LegalPage() {
  return (
    <Suspense fallback={<div style={{ background: "var(--bg)", minHeight: "100vh" }} />}>
      <LegalPageContent />
    </Suspense>
  );
}
