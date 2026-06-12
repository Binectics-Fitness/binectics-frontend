import Link from "next/link";
import type { Metadata } from "next";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";

export const metadata: Metadata = {
  title: "Saved Providers",
  description: "View your saved gyms, trainers, and dietitians.",
};

/**
 * Saved providers — awaiting backend.
 * There is no saved/favourites API yet (no endpoint in the service layer or the
 * OpenAPI contract), so rather than show a fabricated list this renders inside
 * the member shell with an honest pending state. Nav-promotion is deferred
 * until the backend lands.
 */
export default function SavedProvidersPage() {
  return (
    <MemberDashboardShell activeLabel="Saved">
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Saved providers</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Your bookmarked gyms, trainers, and dietitians</div>
      </div>

      <div className="rounded-(--r-3) flex flex-col items-center text-center px-6 py-14 mt-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--bg-2)", color: "var(--fg-3)" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 21-1.5-1.4C5 14.7 2 12 2 8.5 2 6 4 4 6.5 4c1.5 0 3 .7 3.9 2A5 5 0 0 1 17.5 4C20 4 22 6 22 8.5c0 3.5-3 6.2-8.5 11.1L12 21z" />
          </svg>
        </div>
        <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>Saved providers are coming soon</h2>
        <p className="text-[13.5px] mt-2 max-w-[420px]" style={{ color: "var(--fg-3)" }}>
          Bookmark gyms, trainers, and dietitians from the marketplace and they&apos;ll show up here so you can compare and rebook them quickly.
        </p>
        <Link href="/marketplace" className="btn-primary-v2 sm mt-5">Browse marketplace</Link>
      </div>
    </MemberDashboardShell>
  );
}
