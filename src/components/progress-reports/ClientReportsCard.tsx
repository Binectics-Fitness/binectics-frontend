"use client";

import { useEffect, useState } from "react";
import { DSCard, Eyebrow, StatusPill } from "@/components/ds";
import { toast } from "@/components/Toast";
import {
  openReportPdf,
  progressReportsService,
  type ProgressReportView,
} from "@/lib/api/progressReports";
import { formatPeriod } from "@/lib/progressReports/report";
import { GenerateReportModal } from "./GenerateReportModal";

interface Props {
  clientProfileId: string;
  clientFirstName: string;
}

/**
 * Progress reports on a coach's client page: the reports made for this
 * client (drafts and shared), and the "Generate progress report" action.
 * Hidden when the API refuses the list (no access, e.g. an ended link).
 */
export function ClientReportsCard({ clientProfileId, clientFirstName }: Props) {
  const [reports, setReports] = useState<ProgressReportView[] | null>(null);
  const [refused, setRefused] = useState(false);
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void progressReportsService.listForClient(clientProfileId).then((res) => {
      if (!active) return;
      if (res.success) setReports(res.data ?? []);
      else {
        setReports([]);
        setRefused(res.status === 403 || res.status === 404);
      }
    });
    return () => {
      active = false;
    };
  }, [clientProfileId]);

  const upsert = (r: ProgressReportView) =>
    setReports((list) => [r, ...(list ?? []).filter((x) => x.id !== r.id)]);

  const share = async (r: ProgressReportView) => {
    setSharing(r.id);
    const res = await progressReportsService.share(r.id);
    setSharing(null);
    if (res.success && res.data) {
      setReports((list) => (list ?? []).map((x) => (x.id === r.id ? res.data! : x)));
      toast.success(`Shared with ${clientFirstName}.`);
    } else {
      toast.error(res.message ?? "Couldn't share the report.");
    }
  };

  const openPdf = async (id: string) => {
    const err = await openReportPdf(id);
    if (err) toast.error(err);
  };

  if (refused) return null;

  return (
    <DSCard className="p-3.5">
      <section aria-labelledby="reports-heading">
        <div className="flex items-center justify-between gap-2 mb-2">
          <Eyebrow as="h2" id="reports-heading">
            Progress reports
          </Eyebrow>
          <button type="button" className="btn-ghost-v2 sm" onClick={() => setOpen(true)}>
            Generate progress report
          </button>
        </div>
        {reports === null ? (
          <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
            Loading…
          </div>
        ) : reports.length === 0 ? (
          <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
            No reports yet. A report is a PDF of {clientFirstName}&apos;s progress for a period, with your note.
          </div>
        ) : (
          <ul>
            {reports.map((r) => (
              <li
                key={r.id}
                className="py-2 flex flex-wrap items-center justify-between gap-2"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                    {formatPeriod(r.period_start, r.period_end)}
                  </div>
                  <div className="mt-0.5">
                    <StatusPill tone={r.shared_at ? "success" : "neutral"} label={r.shared_at ? "Shared" : "Draft"} />
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button type="button" className="btn-ghost-v2 sm" onClick={() => void openPdf(r.id)}>
                    Open PDF
                  </button>
                  {!r.shared_at && (
                    <button
                      type="button"
                      className="btn-ghost-v2 sm"
                      onClick={() => void share(r)}
                      disabled={sharing === r.id}
                    >
                      {sharing === r.id ? "Sharing…" : "Share"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <GenerateReportModal
        open={open}
        onClose={() => setOpen(false)}
        clientProfileId={clientProfileId}
        clientFirstName={clientFirstName}
        onCreated={upsert}
        onShared={(r) => {
          upsert(r);
          toast.success(`Shared with ${clientFirstName}.`);
        }}
      />
    </DSCard>
  );
}
