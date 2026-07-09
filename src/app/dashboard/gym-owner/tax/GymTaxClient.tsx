"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useOrganizationDetails } from "@/lib/queries/teams";
import { checkinsService, type OrgRevenueStats } from "@/lib/api/checkins";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

/**
 * Tax overview: the org's configured tax settings plus an estimate computed
 * from real recorded revenue (the same 30-day series the Revenue page uses).
 * Replaces the fabricated "R 9,824,180" mockup table.
 */
export function GymTaxClient() {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?._id;
  const { data: org } = useOrganizationDetails(orgId);
  const { fmtMoney } = useOrgFormat();
  const { data: revenue = null, isLoading: loading } =
    useQuery<OrgRevenueStats | null>({
      queryKey: ["checkins", "orgRevenueStats", orgId ?? ""],
      queryFn: async () => {
        if (!orgId) return null;
        const res = await checkinsService.getOrgRevenueStats(orgId);
        return res.success && res.data ? res.data : null;
      },
      enabled: !!orgId,
    });

  const taxRate = org?.tax_rate;
  const taxLabel = org?.tax_label || "VAT";
  const currency = revenue?.currency ?? org?.currency;

  // 30-day gross from the recorded timeseries (minor units → major).
  const gross = useMemo(() => {
    if (!revenue?.currency) return 0;
    return (
      revenue.timeseries
        .filter((r) => r.currency === revenue.currency)
        .reduce((sum, r) => sum + r.revenue_minor, 0) / 100
    );
  }, [revenue]);

  const estimate = taxRate != null ? (gross * taxRate) / 100 : null;

  const rows = [
    { label: "Gross recorded revenue · last 30 days", value: fmtMoney(gross, currency), bold: true },
    ...(estimate != null
      ? [
          {
            label: `Estimated ${taxLabel} at ${taxRate}%${org?.tax_inclusive ? " (included in prices)" : " (added on top)"}`,
            value: fmtMoney(estimate, currency),
            bold: false,
          },
        ]
      : []),
  ];

  return (
    <GymDashboardShell activeItem="Settings" crumb="Tax">
      <div className="pb-1">
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Tax</h1>
        <div className="text-[13.5px] mt-1.5 max-w-[60ch]" style={{ color: "var(--fg-3)" }}>
          Your configured tax settings and an estimate against recorded revenue.
        </div>
      </div>

      {/* Settings summary */}
      <section className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Tax settings</h2>
            {taxRate != null ? (
              <p className="text-[13px] mt-1.5" style={{ color: "var(--fg-3)" }}>
                {taxLabel} at <strong style={{ color: "var(--ink)" }}>{taxRate}%</strong> ·{" "}
                {org?.tax_inclusive ? "listed prices include tax" : "tax added on top of listed prices"}
              </p>
            ) : (
              <p className="text-[13px] mt-1.5" style={{ color: "var(--fg-3)" }}>
                No tax rate configured yet — set one to see estimates here and on receipts.
              </p>
            )}
          </div>
          <Link href="/dashboard/gym-owner/settings#tax" className="btn-ghost-v2 sm shrink-0" style={{ textDecoration: "none" }}>
            Edit in Settings →
          </Link>
        </div>
      </section>

      {/* Estimate table */}
      <section className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="px-5.5 pt-4 pb-3" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Revenue-based estimate</h2>
          <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>
            Computed from your recorded marketplace revenue. An estimate only — not tax advice, and nothing is filed on your behalf.
          </div>
        </div>
        {loading ? (
          <div className="px-5.5 py-6 text-[13px]" style={{ color: "var(--fg-3)" }}>Loading revenue…</div>
        ) : (
          <table className="w-full text-[13.5px]">
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.label}>
                  <td className="px-5.5 py-3" style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)", fontWeight: r.bold ? 600 : 400 }}>{r.label}</td>
                  <td className="px-5.5 py-3 text-right font-mono" style={{ borderBottom: i < rows.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)", fontVariantNumeric: "tabular-nums", fontWeight: r.bold ? 600 : 400 }}>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </GymDashboardShell>
  );
}
