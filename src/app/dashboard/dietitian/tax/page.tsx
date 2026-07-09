import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tax",
  description: "View tax summaries and download tax documents.",
};

/**
 * Tax — awaiting backend. There are no provider-level earnings or tax
 * reporting endpoints yet, so this shows an honest pending state instead of
 * the previous fabricated figures.
 */
export default function DietitianTaxPage() {
  return (
    <DietitianDashboardShell activeItem="Earnings" crumb="Tax">
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Tax</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Summaries and documents for your practice</div>
      </div>
      <div className="rounded-(--r-3) flex flex-col items-center text-center px-6 py-14" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--bg-2)", color: "var(--fg-3)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="3" width="16" height="18" rx="2" /><path d="M8 8h8M8 12h8M8 16h5" /></svg>
        </div>
        <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>Tax summaries are coming soon</h2>
        <p className="text-[13.5px] mt-2 max-w-[440px]" style={{ color: "var(--fg-3)" }}>
          Earnings-based tax summaries and downloadable documents will appear here once provider earnings reporting is live. Nothing is filed on your behalf.
        </p>
      </div>
    </DietitianDashboardShell>
  );
}
