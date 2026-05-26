import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";

/**
 * Case Studies — three provider case studies with quote + KPI grid.
 * Proto: case-studies.html
 * Hero 56px h1, 1-col study cards with grid: 1fr 240px, 4 metric cells.
 */

const STUDIES = [
  {
    eyebrow: "Lerato Mokoena · owner",
    name: "Iron Lab · Cape Town",
    quote: "“We saved 14 hours of admin a week and dropped churn by 22%. The QR check-ins replaced our wooden sign-in sheet — best decision I made in 2025.”",
    note: "From 4 spreadsheets and Mindbody to one dashboard.",
    kpis: [
      { label: "Locations", value: "4" },
      { label: "Member growth", value: "+18% MoM" },
      { label: "Churn", value: "-22%" },
      { label: "Admin saved", value: "14h/wk" },
    ],
  },
  {
    eyebrow: "Independent · Cape Town",
    name: "Sarah Okafor · trainer",
    quote: "“I went from 12 active clients on WhatsApp to 42 with Binectics. The programming tools and auto-billing turned coaching into an actual business.”",
    note: "From WhatsApp DMs to a real practice.",
    kpis: [
      { label: "Active clients", value: "42" },
      { label: "Revenue YoY", value: "+218%" },
      { label: "Rebook rate", value: "94%" },
      { label: "Hours saved", value: "8h/wk" },
    ],
  },
  {
    eyebrow: "Lagos · clinical practice",
    name: "Dr Nadia Hassan · dietitian",
    quote: "“My PCOS protocol now runs across 22 clients with measurable adherence and HOMA-IR data. I couldn’t track that with paper plans.”",
    note: "From paper plans to scaling clinical outcomes.",
    kpis: [
      { label: "Active clients", value: "68" },
      { label: "Protocol outcomes", value: "tracked" },
      { label: "PDF plans", value: "sent" },
      { label: "Revenue MoM", value: "+12%" },
    ],
  },
];

export default function CaseStudiesPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Case studies</div>
        <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[18ch]" style={{ lineHeight: 1.04, letterSpacing: "-0.032em", color: "var(--ink)" }}>
          What&apos;s <em className="font-serif font-normal italic">working</em> in production.
        </h1>
        <p className="text-[17px] sm:text-[18px] max-w-[60ch] leading-[1.5] mt-5" style={{ color: "var(--fg-2)" }}>
          Three providers share what changed when they moved their practice onto Binectics. No spin · just numbers.
        </p>
      </section>

      {/* Studies */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex flex-col gap-3.5">
          {STUDIES.map((s) => (
            <div key={s.name} className="rounded-(--r-3) p-6 sm:p-8" style={{ background: "var(--bg-2)" }}>
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6 lg:gap-8 items-center">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-1.5" style={{ color: "var(--fg-3)" }}>{s.eyebrow}</div>
                  <h3 className="text-[22px] sm:text-[24px] font-medium mb-3" style={{ letterSpacing: "-0.018em", color: "var(--ink)" }}>{s.name}</h3>
                  <p className="font-serif italic text-[17px] sm:text-[18px] leading-[1.45] mb-3.5" style={{ color: "var(--ink)" }}>{s.quote}</p>
                  <p className="text-[14px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>{s.note}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {s.kpis.map((k) => (
                    <div key={k.label}>
                      <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
                      <div className="text-[18px] font-medium mt-0.5" style={{ color: "var(--ink)" }}>{k.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
