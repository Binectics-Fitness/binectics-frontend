import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import type { Metadata } from "next";
import { formatCurrency } from "@/utils/format";

export const metadata: Metadata = {
  title: "Compare Providers",
  description: "Compare gyms, trainers, and dietitians side by side on Binectics.",
};

/**
 * Marketplace Compare — side-by-side provider comparison table.
 * Proto: marketplace-compare.html
 * Topbar + shell max-w-320, comparison table with 3 provider columns,
 * rows: specialization, rate, rating, verified, next availability, format, location, cert, languages.
 */

const PROVIDERS = [
  {
    name: "Sarah Okafor",
    type: "Trainer · Cape Town",
    grad: "linear-gradient(135deg, oklch(0.85 0.04 40), oklch(0.72 0.06 90))",
    specialization: "Strength · running",
    rateAmount: 1200,
    rateCurrency: "ZAR",
    rateUnit: "/ 60 min",
    rating: "4.9 · 312 reviews",
    verified: "Yes · 2027",
    nextAvail: "Tomorrow 08:00",
    format: "In-person + online",
    location: "Sea Point",
    cert: "NSCA-CSCS",
    languages: "English · isiXhosa",
  },
  {
    name: "Marcus Bell",
    type: "Trainer · Cape Town",
    grad: "linear-gradient(135deg, oklch(0.85 0.04 100), oklch(0.72 0.06 150))",
    specialization: "Mobility · recovery",
    rateAmount: 800,
    rateCurrency: "ZAR",
    rateUnit: "/ 60 min",
    rating: "4.9 · 142 reviews",
    verified: "Yes · 2027",
    nextAvail: "Today 17:00",
    format: "In-person only",
    location: "Camps Bay",
    cert: "FRC mobility",
    languages: "English",
  },
  {
    name: "Thandi Nkosi",
    type: "Trainer · Cape Town",
    grad: "linear-gradient(135deg, oklch(0.85 0.04 160), oklch(0.72 0.06 210))",
    specialization: "Postnatal · strength",
    rateAmount: 850,
    rateCurrency: "ZAR",
    rateUnit: "/ 60 min",
    rating: "5.0 · 64 reviews",
    verified: "Yes · 2027",
    nextAvail: "Thursday 09:00",
    format: "In-person + home visits",
    location: "Foreshore + home",
    cert: "Pre/post-natal cert",
    languages: "English · isiZulu",
  },
];

const ROWS: { label: string; key: keyof (typeof PROVIDERS)[0] }[] = [
  { label: "Specialization", key: "specialization" },
  { label: "Rate", key: "rateAmount" },
  { label: "Rating", key: "rating" },
  { label: "Verified", key: "verified" },
  { label: "Next availability", key: "nextAvail" },
  { label: "Format", key: "format" },
  { label: "Location", key: "location" },
  { label: "Specialist cert", key: "cert" },
  { label: "Languages", key: "languages" },
];

export default function MarketplaceComparePage() {
  const renderCell = (provider: (typeof PROVIDERS)[0], key: keyof (typeof PROVIDERS)[0]) => {
    if (key === "rateAmount") {
      return `${formatCurrency(provider.rateAmount, provider.rateCurrency)} ${provider.rateUnit}`;
    }

    return provider[key];
  };

  return (
    <div style={{ background: "var(--bg-2)", minHeight: "100vh" }}>
      {/* Topbar */}
      <header className="border-b border-border" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-320 flex items-center justify-between h-14 px-5 sm:px-8">
          <Link href="/"><BinecticsLockup /></Link>
          <nav className="flex items-center gap-4 text-[13.5px]">
            <Link href="/marketplace" style={{ color: "var(--fg-2)", textDecoration: "none" }}>Marketplace</Link>
            <Link href="/login" prefetch={false} className="btn-primary-v2 sm">Sign in</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-320 px-5 sm:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-[28px] sm:text-[32px] font-medium" style={{ letterSpacing: "-0.026em", color: "var(--ink)" }}>Compare providers</h1>
          <p className="mt-1.5" style={{ color: "var(--fg-3)", fontSize: "14px" }}>
            Side-by-side · 3 trainers · drag to reorder · <Link href="/marketplace" style={{ color: "var(--ink)" }}>add from saved</Link>
          </p>
        </div>

        <div className="rounded-(--r-3) overflow-hidden overflow-x-auto" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <table className="w-full" style={{ borderCollapse: "collapse", fontSize: "13.5px" }}>
            <thead>
              <tr>
                <th className="text-left font-mono text-[10.5px] uppercase tracking-[0.04em] font-medium" style={{ padding: "18px 20px", color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>&nbsp;</th>
                {PROVIDERS.map((p) => (
                  <th key={p.name} className="text-left" style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", background: "var(--bg-2)", width: "26%" }}>
                    <div className="w-12 h-12 rounded-(--r-2) mb-2.5" style={{ background: p.grad }} />
                    <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>{p.name}</div>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-0.75" style={{ color: "var(--fg-3)" }}>{p.type}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label}>
                  <td className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ padding: "14px 20px", color: "var(--fg-3)", borderBottom: "1px solid var(--border)" }}>{r.label}</td>
                  {PROVIDERS.map((p) => (
                    <td key={p.name} style={{ padding: "14px 20px", color: "var(--ink)", borderBottom: "1px solid var(--border)" }}>{renderCell(p, r.key)}</td>
                  ))}
                </tr>
              ))}
              <tr>
                <td />
                {PROVIDERS.map((p) => (
                  <td key={p.name} style={{ padding: "18px 20px" }}>
                    <Link href="/booking" className="btn-primary-v2 sm">Book &rarr;</Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
