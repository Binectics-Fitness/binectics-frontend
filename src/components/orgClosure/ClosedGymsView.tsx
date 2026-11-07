"use client";

import { useState } from "react";
import { Button } from "@/components/Button";
import { DSCard } from "@/components/ds";
import { AsyncSpinner } from "@/components/ds/AsyncStates";
import { toast } from "@/components/Toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import { orgClosureService } from "@/lib/api/orgClosure";
import { useClosedOrganizations, useReopenOrganization } from "@/lib/queries/orgClosure";
import {
  EXPORTS,
  canReopenNow,
  closureErrorMessage,
  daysLeftLabel,
  daysLeftToReopen,
  exportFileName,
  type ClosedOrganization,
  type ExportFormat,
  type ExportKind,
} from "@/lib/orgClosure/closure";

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function saveText(text: string, fileName: string, format: ExportFormat) {
  const type = format === "csv" ? "text/csv;charset=utf-8" : "application/json;charset=utf-8";
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/** The body of the Closed gyms page: each closed gym, its deadline, reopen and exports. */
export function ClosedGymsView() {
  const { data, isLoading, isError, refetch } = useClosedOrganizations();

  if (isLoading) return <AsyncSpinner label="Loading your closed gyms" />;
  if (isError) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3">
        <p className="text-[14px]" style={{ color: "var(--danger-ink)" }}>
          We could not load your closed gyms. Your records are safe; this is only the page failing to load.
        </p>
        <Button variant="ghost" onClick={() => void refetch()}>Try again</Button>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <DSCard className="p-5.5">
        <p className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>No closed gyms</p>
        <p className="text-[12.5px] mt-1 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>
          When you close a gym from Settings, it appears here with its reopen deadline and your record downloads.
        </p>
      </DSCard>
    );
  }
  return (
    <div className="flex flex-col gap-5">
      {data.map((c) => <ClosedGymCard key={c.id} gym={c} />)}
    </div>
  );
}

function ClosedGymCard({ gym }: { gym: ClosedOrganization }) {
  const reopen = useReopenOrganization();
  const { refreshOrganizations } = useOrganization();
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const canReopen = canReopenNow(gym);
  // The server says it is open; a device clock that disagrees must not print "ended".
  const left = daysLeftToReopen(gym);
  const days = left === null ? null : Math.max(1, left);
  const closedOn = fmtDate(gym.closedAt);
  const until = fmtDate(gym.reopenUntil);

  const doReopen = async () => {
    setError(null);
    const res = await reopen.mutateAsync(gym.id);
    if (!res.success) {
      setError(closureErrorMessage(res.code, res.status, res.message));
      return;
    }
    toast.success(`${gym.name} is open again.`);
    await refreshOrganizations();
  };

  const doExport = async (kind: ExportKind, slug: string) => {
    setBusy(kind);
    setExportError(null);
    const res = await orgClosureService.fetchExport(kind, gym.id, format);
    setBusy(null);
    if (!res.success || res.data === undefined) {
      setExportError(closureErrorMessage(res.code, res.status, res.message));
      return;
    }
    saveText(res.data, exportFileName(gym.name, slug, format), format);
    toast.success("Download started.");
  };

  return (
    <DSCard className="p-5.5 flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.01em" }}>{gym.name}</h2>
          <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: "var(--fg-3)" }}>
            {closedOn ? `Closed on ${closedOn}.` : "Closed."}{" "}
            {canReopen && until ? `You can reopen it until ${until}. ` : ""}
            {canReopen ? <strong style={{ color: "var(--ink)" }}>{daysLeftLabel(days)}</strong> : null}
            {!canReopen ? "The 30-day reopen window has ended. Your records stay available below." : null}
          </p>
          {gym.closedReason && (
            <p className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>Reason you gave: {gym.closedReason}</p>
          )}
        </div>
        {canReopen && (
          <Button onClick={() => void doReopen()} isLoading={reopen.isPending} disabled={reopen.isPending}>
            Reopen gym
          </Button>
        )}
      </div>
      {error && <p role="alert" className="text-[13px]" style={{ color: "var(--danger-ink)" }}>{error}</p>}

      <div style={{ borderTop: "1px solid var(--border)" }} className="pt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Download your records</h3>
          <div role="group" aria-label="File format" className="flex gap-1.5">
            {(["csv", "json"] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={format === f}
                onClick={() => setFormat(f)}
                className="px-3 h-8 rounded-(--r-2) text-[12.5px] font-medium"
                style={{
                  border: "1px solid var(--border-2)",
                  background: format === f ? "var(--ink)" : "var(--bg)",
                  color: format === f ? "var(--bg)" : "var(--fg-2)",
                }}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <ul className="flex flex-col">
          {EXPORTS.map((e, i) => (
            <li
              key={e.kind}
              className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderTop: i > 0 ? "1px solid var(--border)" : undefined }}
            >
              <div className="min-w-0">
                <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{e.title}</div>
                <div className="text-[12.5px] max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>{e.desc}</div>
              </div>
              <Button
                variant="ghost"
                onClick={() => void doExport(e.kind, e.slug)}
                isLoading={busy === e.kind}
                disabled={busy !== null}
                aria-label={`Download ${e.title} as ${format.toUpperCase()}`}
              >
                Download {format.toUpperCase()}
              </Button>
            </li>
          ))}
        </ul>
        {exportError && <p role="alert" className="text-[13px]" style={{ color: "var(--danger-ink)" }}>{exportError}</p>}
        {format === "csv" && (
          <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--fg-3)" }}>
            Names with accents or non-English letters can look garbled if you double-click a CSV to open it in Excel. In
            Excel, use Data, From Text/CSV and choose UTF-8, or pick JSON.
          </p>
        )}
      </div>
    </DSCard>
  );
}
