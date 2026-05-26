import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import Link from "next/link";
import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Listing Details",
  description: "Review and moderate a provider listing.",
};

export default function AdminSingleListingPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = React.use(params);
  void listingId;

  return (
    <AdminDashboardShell
      activeItem="Listings"
      crumb="Aisha Adams · LST-2026-04812"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/admin/listings/LST-2026-04812/reject" className="btn-ghost-v2 no-underline">
            Reject
          </Link>
          <button className="btn-ghost-v2">Send back</button>
          <button className="btn-primary-v2" style={{ background: "var(--signal)", borderColor: "var(--signal)", color: "oklch(0.18 0.05 148)" }}>
            Approve
          </button>
        </div>
      }
    >
      {/* Heading */}
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Aisha Adams · Personal Training
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Submitted 23 May · waiting <strong style={{ color: "var(--ink)" }}>36h</strong> · queue position{" "}
          <strong style={{ color: "var(--ink)" }}>3 / 38</strong>
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3.5">
        {/* Profile preview */}
        <Card title="Profile preview">
          <div className="flex gap-4.5 items-start mb-4.5">
            <div
              className="w-[88px] h-[88px] rounded-[12px] shrink-0"
              style={{ background: "linear-gradient(135deg, oklch(0.85 0.05 320), oklch(0.72 0.08 280))" }}
            />
            <div>
              <div className="text-[18px] font-medium mb-1">Aisha Adams · Personal trainer</div>
              <div className="font-mono text-[11px] uppercase tracking-[0.04em] mb-2" style={{ color: "var(--fg-3)" }}>
                Dubai · UAE · in-person + online
              </div>
              <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
                &ldquo;I help women in their 30s build muscle and confidence. NASM-CPT certified, specializing in postpartum recovery and strength.&rdquo;
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
            <tbody>
              {[
                { label: "Rate", val: "د.إ 280 / 60 min · in-person" },
                { label: "Specializations", val: "Strength · postpartum · weight management" },
                { label: "Languages", val: "English · Arabic" },
                { label: "Photos", val: "5 uploaded · all professional · no logos" },
              ].map((r) => (
                <tr key={r.label}>
                  <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)", fontWeight: 600 }}>{r.label}</td>
                  <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>{r.val}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </Card>

        {/* Right column: Documents + Auto-checks */}
        <div className="flex flex-col gap-3.5">
          <Card title="Documents">
            <div className="flex flex-col gap-2">
              {[
                { name: "NASM-CPT", meta: "Valid · expires Oct 2027" },
                { name: "Emirates ID", meta: "Confirmed · matches name" },
                { name: "Liability insurance", meta: "د.إ 500k cover · 2027" },
              ].map((doc) => (
                <div key={doc.name} className="flex justify-between items-center p-[10px_12px] rounded-(--r-2)" style={{ background: "var(--bg-2)" }}>
                  <div>
                    <strong className="text-[13px]">{doc.name}</strong>
                    <br />
                    <span className="font-mono text-[11px] uppercase" style={{ color: "var(--fg-3)" }}>{doc.meta}</span>
                  </div>
                  <Pill variant="ok">{"✓"} verified</Pill>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Auto-checks">
            <div className="overflow-x-auto">
            <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
              <tbody>
                {["Image moderation", "Profile language", "Duplicate detection", "Sanctions screen"].map((check) => (
                  <tr key={check}>
                    <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>{check}</td>
                    <td className="py-[11px] px-[14px]" style={{ borderBottom: "1px solid var(--border)" }}>
                      <Pill variant="ok">Pass</Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Card>
        </div>
      </div>
    </AdminDashboardShell>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] p-[22px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <h3 className="text-[14px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>{title}</h3>
      {children}
    </div>
  );
}

function Pill({ variant, children }: { variant: "ok" | "warn" | "danger"; children: React.ReactNode }) {
  const styles: Record<string, { background: string; color: string }> = {
    ok: { background: "var(--signal-soft)", color: "var(--signal-ink)" },
    warn: { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" },
    danger: { background: "var(--danger-soft)", color: "var(--danger)" },
  };
  return (
    <span className="font-mono text-[10px] px-[7px] py-[2px] rounded-full uppercase tracking-[0.04em]" style={styles[variant]}>
      {children}
    </span>
  );
}
