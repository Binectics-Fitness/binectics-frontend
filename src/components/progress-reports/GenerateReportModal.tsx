"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Eyebrow } from "@/components/ds";
import { FilterPill } from "@/components/ds/FilterPill";
import {
  openReportPdf,
  progressReportsService,
  type ProgressReportView,
} from "@/lib/api/progressReports";
import {
  PERIOD_PRESETS,
  formatPeriod,
  periodProblem,
  presetPeriod,
  reportHighlights,
  type PeriodPresetKey,
} from "@/lib/progressReports/report";

interface Props {
  open: boolean;
  onClose: () => void;
  clientProfileId: string;
  clientFirstName: string;
  /** A draft was created (it is listed for the coach straight away). */
  onCreated: (report: ProgressReportView) => void;
  /** The report was shared with the client. */
  onShared: (report: ProgressReportView) => void;
  /** "Now", injectable for tests. */
  now?: Date;
}

const NOTE_MAX = 2000;

/**
 * Generate a progress report: pick a period, add a note, create a draft,
 * check it (figures here, the full PDF in a tab), then share it.
 * Nothing reaches the client until "Share".
 */
export function GenerateReportModal({
  open,
  onClose,
  clientProfileId,
  clientFirstName,
  onCreated,
  onShared,
  now,
}: Props) {
  const [today] = useState(() => now ?? new Date());
  const [preset, setPreset] = useState<PeriodPresetKey>("last-30");
  const [period, setPeriod] = useState(() => presetPeriod("last-30", today));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProgressReportView | null>(null);

  const problem = periodProblem(period, today);

  const reset = () => {
    setDraft(null);
    setError(null);
    setNote("");
    setPreset("last-30");
    setPeriod(presetPeriod("last-30", today));
  };

  const close = () => {
    reset();
    onClose();
  };

  const create = async () => {
    if (problem) return;
    setBusy(true);
    setError(null);
    const res = await progressReportsService.generate(clientProfileId, {
      period_start: period.start,
      period_end: period.end,
      ...(note.trim() ? { coach_note: note.trim() } : {}),
    });
    setBusy(false);
    if (!res.success || !res.data) {
      setError(res.message ?? "Couldn't create the report.");
      return;
    }
    setDraft(res.data);
    onCreated(res.data);
  };

  const share = async () => {
    if (!draft) return;
    setBusy(true);
    setError(null);
    const res = await progressReportsService.share(draft.id);
    setBusy(false);
    if (!res.success || !res.data) {
      setError(res.message ?? "Couldn't share the report.");
      return;
    }
    onShared(res.data);
    close();
  };

  const preview = async () => {
    if (!draft) return;
    const err = await openReportPdf(draft.id);
    if (err) setError(err);
  };

  const highlights = draft ? reportHighlights(draft.snapshot) : [];

  const footer = draft ? (
    <div className="flex flex-wrap justify-end gap-2">
      <button type="button" className="btn-ghost-v2 sm" onClick={close} disabled={busy}>
        Keep as draft
      </button>
      <button type="button" className="btn-ghost-v2 sm" onClick={() => void preview()} disabled={busy}>
        Open PDF
      </button>
      <button type="button" className="btn-signal-v2 sm" onClick={() => void share()} disabled={busy}>
        {busy ? "Sharing…" : `Share with ${clientFirstName}`}
      </button>
    </div>
  ) : (
    <div className="flex justify-end gap-2">
      <button type="button" className="btn-ghost-v2 sm" onClick={close} disabled={busy}>
        Cancel
      </button>
      <button type="button" className="btn-primary-v2 sm" onClick={() => void create()} disabled={busy || !!problem}>
        {busy ? "Creating…" : "Create report"}
      </button>
    </div>
  );

  return (
    <Modal open={open} onClose={close} title="Generate progress report" footer={footer} size="md">
      {draft ? (
        <div className="flex flex-col gap-4">
          <p className="text-[14px]" style={{ color: "var(--fg-2)" }}>
            Draft for {formatPeriod(draft.period_start, draft.period_end)}. Only you and your team can open it until
            you share it.
          </p>
          {highlights.length > 0 ? (
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {highlights.map((h) => (
                <div
                  key={h.label}
                  className="rounded-(--r-2) px-3 py-2.5"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <dt>
                    <Eyebrow>{h.label}</Eyebrow>
                  </dt>
                  <dd
                    className="text-[17px] font-medium mt-1"
                    style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
                  >
                    {h.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>
              Nothing was logged in this period, so the report says so in each section.
            </p>
          )}
          {draft.snapshot.weight.scope === "relationship" && (
            <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
              {clientFirstName} doesn&apos;t share their progress with providers, so the report shows only weight logged
              with you.
            </p>
          )}
          {error && (
            <p role="alert" className="text-[13.5px]" style={{ color: "var(--danger-ink)" }}>
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <fieldset>
            <legend className="mb-2">
              <Eyebrow>Period</Eyebrow>
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {PERIOD_PRESETS.map((p) => (
                <FilterPill
                  key={p.key}
                  label={p.label}
                  active={preset === p.key}
                  onClick={() => {
                    setPreset(p.key);
                    setPeriod(presetPeriod(p.key, today));
                  }}
                />
              ))}
              <FilterPill label="Custom" active={preset === "custom"} onClick={() => setPreset("custom")} />
            </div>
            {preset === "custom" && (
              <div className="grid grid-cols-2 gap-2.5 mt-3">
                <label className="flex flex-col gap-1 text-[13px]" style={{ color: "var(--fg-2)" }}>
                  From
                  <input
                    type="date"
                    value={period.start}
                    onChange={(e) => setPeriod((p) => ({ ...p, start: e.target.value }))}
                    className="h-10 px-3 rounded-(--r-2) text-[14px]"
                    style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
                  />
                </label>
                <label className="flex flex-col gap-1 text-[13px]" style={{ color: "var(--fg-2)" }}>
                  To
                  <input
                    type="date"
                    value={period.end}
                    onChange={(e) => setPeriod((p) => ({ ...p, end: e.target.value }))}
                    className="h-10 px-3 rounded-(--r-2) text-[14px]"
                    style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
                  />
                </label>
              </div>
            )}
            <p className="text-[13px] mt-2" style={{ color: problem ? "var(--danger-ink)" : "var(--fg-3)" }}>
              {problem ?? formatPeriod(period.start, period.end)}
            </p>
          </fieldset>

          <label className="flex flex-col gap-1.5">
            <Eyebrow>Note for {clientFirstName}</Eyebrow>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={NOTE_MAX}
              rows={4}
              placeholder="What went well, and what to focus on next"
              className="w-full px-3 py-2.5 rounded-(--r-2) text-[14px] resize-y"
              style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
            />
            <span className="text-[12px] self-end" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
              {note.length}/{NOTE_MAX}
            </span>
          </label>

          <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
            The report shows what was logged in the period: program tasks, weight, attendance and journal entries.
            You can check it before {clientFirstName} sees it.
          </p>
          {error && (
            <p role="alert" className="text-[13.5px]" style={{ color: "var(--danger-ink)" }}>
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
