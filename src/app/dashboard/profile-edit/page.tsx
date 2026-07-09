import Link from "next/link";
import { ProviderListingProfile } from "@/components/provider/ProviderListingProfile";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit profile",
  description: "Edit your public marketplace profile.",
};

export default function ProfileEditPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-2)" }}>
      <div
        className="flex items-center gap-2 text-[13px] sticky top-0 z-10"
        style={{ height: 56, padding: "0 28px", background: "var(--bg)", borderBottom: "1px solid var(--border)", color: "var(--fg-3)" }}
      >
        <Link href="/dashboard" style={{ color: "var(--fg-3)" }}>Dashboard</Link>
        <span style={{ color: "var(--fg-4)" }}>/</span>
        <span style={{ color: "var(--ink)", fontWeight: 500 }}>Edit profile</span>
      </div>
      <div style={{ padding: "28px" }}>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Edit profile</h1>
        <p className="text-[13.5px] mt-1.5 mb-6 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>
          This is how you appear in the marketplace. Save your changes, then publish when you&rsquo;re ready for them to go live.
        </p>
        <ProviderListingProfile />
      </div>
    </div>
  );
}
