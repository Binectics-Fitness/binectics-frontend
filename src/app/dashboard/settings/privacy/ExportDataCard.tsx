"use client";

import { useState } from "react";
import { ChipGroup, DSCard, Eyebrow } from "@/components/ds";
import { useAuth } from "@/contexts/AuthContext";
import { useOnline } from "@/hooks/useOnline";
import { starterService } from "@/lib/api/starter";
import { starterErrorMessage } from "@/lib/starter/errors";
import { StarterExportFormat } from "@/lib/starter/types";
import {
  EXPORT_INCLUDED,
  EXPORT_NOT_INCLUDED,
  EXPORT_RANGE_LABELS,
  exportWindow,
  saveBlob,
  type ExportRange,
} from "@/lib/records/exportData";
import { dayKeyOf } from "@/lib/solo/glance";
import { UserRole } from "@/lib/types";

const FORMAT_OPTIONS = [
  { value: StarterExportFormat.Csv, label: "Spreadsheet (CSV)" },
  { value: StarterExportFormat.Json, label: "JSON" },
];
const RANGE_OPTIONS = (Object.keys(EXPORT_RANGE_LABELS) as ExportRange[]).map((r) => ({ value: r, label: EXPORT_RANGE_LABELS[r] }));

/** Too large for one file: the API says so with 413 / EXPORT_TOO_LARGE. */
const TOO_LARGE = "Your history is too large for one file. Pick a shorter time below and try again.";

/**
 * Settings → Privacy: "Export my data" for every member, with or without a
 * Starter program. The file is made on request by the member's own export
 * (GET /my-programs/export): programs, activity, weight, fasts, water, the
 * daily list, journal and goals, as a spreadsheet (CSV) or the complete JSON.
 * It downloads in this browser and is never emailed. The API returns no
 * counts, so none are shown; meals are not in the file, and the card says so.
 * Mirrors binectics-mobile ExportDataScreen. Members only.
 */
export function ExportDataCard() {
  const { user } = useAuth();
  const online = useOnline();
  const [format, setFormat] = useState<StarterExportFormat>(StarterExportFormat.Csv);
  const [range, setRange] = useState<ExportRange>("all");
  const [tooLarge, setTooLarge] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (user?.role !== UserRole.USER) return null;

  const create = async () => {
    if (busy) return;
    setError("");
    if (!online) return setError("You need a connection to make your file. Try again when you are back online.");
    setBusy(true);
    const res = await starterService.downloadExport(format, exportWindow(range, dayKeyOf(new Date())));
    setBusy(false);
    if (!res.success || !res.data) {
      if (res.code === "EXPORT_TOO_LARGE" || res.status === 413) {
        setTooLarge(true);
        return setError(TOO_LARGE);
      }
      return setError(
        res.status === undefined
          ? "Could not reach Binectics. Check your connection and try again."
          : starterErrorMessage(res, "Could not make your file. Try again."),
      );
    }
    saveBlob(res.data.blob, res.data.filename);
  };

  return (
    <DSCard className="p-4 sm:p-6" style={{ overflow: "visible" }}>
      <section aria-labelledby="export-h" className="flex flex-col gap-3.5" data-testid="export-card">
        <div>
          <h3 id="export-h" className="mb-1 text-[16px] font-medium text-ink">
            Export my data
          </h3>
          <p className="text-sm text-fg-2">Take a copy of what you logged. A spreadsheet opens in any spreadsheet app.</p>
        </div>

        <Eyebrow as="h4">Included</Eyebrow>
        <ul className="rounded-(--r-2) border border-border" data-testid="export-included">
          {EXPORT_INCLUDED.map((line, i) => (
            <li
              key={line}
              className="flex min-h-11 items-center px-3.5 text-sm text-ink"
              style={{ listStyle: "none", borderTop: i ? "1px solid var(--border)" : "none" }}
            >
              {line}
            </li>
          ))}
        </ul>
        <p className="text-sm text-fg-2" data-testid="export-not-included">
          {EXPORT_NOT_INCLUDED}
        </p>

        <Eyebrow as="h4">Format</Eyebrow>
        <ChipGroup label="Format" options={FORMAT_OPTIONS} value={format} onChange={setFormat} disabled={busy} />
        <p className="text-sm text-fg-2">
          {format === StarterExportFormat.Csv ? "One line for each entry, oldest first." : "Everything, with all its details, for other apps."}
        </p>

        {tooLarge && (
          <div className="flex flex-col gap-2" data-testid="export-range">
            <Eyebrow as="h4">How far back</Eyebrow>
            <ChipGroup label="How far back" options={RANGE_OPTIONS} value={range} onChange={setRange} disabled={busy} />
          </div>
        )}

        {error && (
          <p className="text-sm" style={{ color: "var(--danger-ink)" }} role="alert" data-testid="export-error">
            {error}
          </p>
        )}

        <div>
          <button type="button" className="btn-primary-v2" style={{ minHeight: 44 }} onClick={() => void create()} disabled={busy} aria-busy={busy}>
            {busy ? "Making your file" : "Create my file"}
          </button>
        </div>
        <p className="text-[13px] text-fg-2">
          The file downloads in this browser. We do not email it. It includes your notes in plain text, so share it only with people you
          trust.
        </p>
      </section>
    </DSCard>
  );
}
