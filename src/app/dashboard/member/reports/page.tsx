"use client";

/**
 * Reports: the progress reports a member's coaches have shared with them.
 * Each opens as a PDF through a signed link minted on click. A report stays here
 * after the coaching relationship ends: it is the member's own progress.
 */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { AsyncSpinner, DSCard, EmptySlate, Eyebrow, PageHeader } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import {
  openReportPdf,
  progressReportsService,
  type ProgressReportView,
} from "@/lib/api/progressReports";
import { formatPeriod, reportHighlights } from "@/lib/progressReports/report";

function ReportsList() {
  const params = useSearchParams();
  const focusId = params?.get("reportId") ?? null;
  const { fmtDate } = useOrgFormat();
  const [reports, setReports] = useState<ProgressReportView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void progressReportsService.listMine().then((res) => {
      if (!active) return;
      if (res.success) setReports(res.data ?? []);
      else setError(res.message ?? "Couldn't load your reports.");
    });
    return () => {
      active = false;
    };
  }, []);

  const open = async (id: string) => {
    setOpening(id);
    const err = await openReportPdf(id);
    setOpening(null);
    if (err) toast.error(err);
  };

  if (error) {
    return (
      <div
        role="alert"
        className="rounded-(--r-3) p-4 text-[14px]"
        style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger-ink)" }}
      >
        {error}
      </div>
    );
  }
  if (reports === null) return <AsyncSpinner size="page" label="Loading reports" />;
  if (reports.length === 0) {
    return (
      <DSCard className="p-6">
        <EmptySlate
          mt="mt-0"
          message="No reports yet."
          hint="When a coach shares a progress report with you, it appears here."
        />
      </DSCard>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {reports.map((r) => {
        const s = r.snapshot;
        const highlights = reportHighlights(s);
        const focused = r.id === focusId;
        return (
          <li key={r.id}>
            <DSCard
              className="p-5"
              style={focused ? { borderColor: "var(--ink)" } : undefined}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="min-w-0">
                  <Eyebrow>{s.brand_name}</Eyebrow>
                  <h2 className="text-[17px] font-medium mt-1" style={{ color: "var(--ink)" }}>
                    {formatPeriod(r.period_start, r.period_end)}
                  </h2>
                  <p className="text-[13px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                    From {s.coach_name}
                    {r.shared_at ? ` · shared ${fmtDate(r.shared_at)}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-primary-v2 sm shrink-0"
                  onClick={() => void open(r.id)}
                  disabled={opening === r.id}
                >
                  {opening === r.id ? "Opening…" : "Open PDF"}
                </button>
              </div>
              {highlights.length > 0 && (
                <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
                  {highlights.map((h) => (
                    <div key={h.label}>
                      <dt>
                        <Eyebrow>{h.label}</Eyebrow>
                      </dt>
                      <dd
                        className="text-[15px] font-medium mt-0.5"
                        style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
                      >
                        {h.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}
              {s.coach_note && (
                <p className="text-[14px] leading-relaxed mt-4 whitespace-pre-line" style={{ color: "var(--fg-2)" }}>
                  {s.coach_note}
                </p>
              )}
            </DSCard>
          </li>
        );
      })}
    </ul>
  );
}

export default function MemberReportsPage() {
  return (
    <MemberDashboardShell activeLabel="Reports">
      <PageHeader
        eyebrow="Your progress"
        title="Reports"
        subtitle="Progress reports your coaches have shared with you."
      />
      <Suspense fallback={<AsyncSpinner size="page" label="Loading reports" />}>
        <ReportsList />
      </Suspense>
    </MemberDashboardShell>
  );
}
