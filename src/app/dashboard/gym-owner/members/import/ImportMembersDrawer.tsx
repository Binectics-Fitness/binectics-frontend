"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Drawer } from "@/components/ds/Drawer";
import { ProgressBar } from "@/components/ds/ProgressBar";
import { StatusPill } from "@/components/ds/StatusPill";
import SearchableSelect from "@/components/SearchableSelect";
import { toast } from "@/components/Toast";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import {
  memberImportsApi,
  type ImportDateFormat,
  type ImportField,
  type ImportInviteMode,
  type ImportMapping,
  type ImportPreviewRow,
  type MemberImportChoices,
  type MemberImportPreview,
  type MemberImportStatus,
} from "@/lib/api/memberImports";
import {
  buildTemplateCsv,
  DATE_FORMAT_OPTIONS,
  downloadText,
  FIELD_LABELS,
  FIELD_ORDER,
  formatDay,
  inviteDays,
  problemsCsv,
  problemsText,
  rowsWithProblems,
} from "./import-helpers";

type Step = "upload" | "columns" | "preview" | "invites" | "importing" | "done";

const STEPS: Array<{ id: Step; label: string }> = [
  { id: "upload", label: "Upload" },
  { id: "columns", label: "Map columns" },
  { id: "preview", label: "Preview" },
  { id: "invites", label: "Invites" },
  { id: "done", label: "Import" },
];

const PAGE = 50;

interface Props {
  open: boolean;
  orgId: string | undefined;
  onClose: () => void;
  /** Called once members were imported, so the page can reload its lists. */
  onImported?: () => void;
}

/**
 * Import members from another system (GymMaster or any spreadsheet).
 *
 * Upload a CSV → map its columns (and its plan and branch names) → preview
 * every row → choose whether to email invites now → import → result. Every
 * check runs on the server; this drawer shows what it found. Closing it
 * mid-way asks first (useUnsavedChangesGuard), since the mapping is lost.
 */
export function ImportMembersDrawer({ open, orgId, onClose, onImported }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<MemberImportPreview | null>(null);
  const [choices, setChoices] = useState<MemberImportChoices>({});
  const [busy, setBusy] = useState(false);
  // `warn`: nothing went wrong with this import, it has to wait (409).
  const [notice, setNotice] = useState<{ text: string; warn: boolean } | null>(null);
  const setError = useCallback((text: string | null, warn = false) => setNotice(text ? { text, warn } : null), []);
  const [inviteMode, setInviteMode] = useState<ImportInviteMode>("later");
  const [status, setStatus] = useState<MemberImportStatus | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setPreview(null);
    setChoices({});
    setBusy(false);
    setError(null);
    setInviteMode("later");
    setStatus(null);
  }, [setError]);

  const close = useCallback(() => {
    const imported = step === "done";
    reset();
    onClose();
    if (imported) onImported?.();
  }, [step, reset, onClose, onImported]);

  const guard = useUnsavedChangesGuard(close, {
    // Nothing to lose before a file is read, or once the import is done.
    enabled: step !== "upload" && step !== "done",
  });
  const { markDirty, reset: resetGuard } = guard;

  useEffect(() => {
    if (open) resetGuard();
  }, [open, resetGuard]);

  // Move focus to the new step's heading, for keyboard and screen readers.
  // Not on the first step: the drawer puts focus on its close button.
  const stepChanged = useRef(false);
  useEffect(() => {
    if (!stepChanged.current) {
      stepChanged.current = true;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  // ── upload ──
  const onFile = async (file: File | undefined) => {
    if (!file || !orgId) return;
    setError(null);
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") {
      setError(
        /\.(xlsx?|numbers|ods)$/i.test(file.name)
          ? "Save the spreadsheet as CSV (File → Save As → CSV UTF-8) and upload that."
          : "Upload a .csv file.",
      );
      return;
    }
    setBusy(true);
    const res = await memberImportsApi.upload(orgId, file);
    setBusy(false);
    if (!res.success || !res.data) {
      setError(res.message || "We couldn't read that file.");
      return;
    }
    setPreview(res.data);
    setChoices(initialChoices(res.data));
    markDirty();
    setStep("columns");
  };

  // ── preview with the gym's choices ──
  const refresh = async (next: MemberImportChoices) => {
    if (!orgId || !preview) return null;
    setChoices(next);
    setBusy(true);
    setError(null);
    const res = await memberImportsApi.preview(orgId, preview.import_id, next);
    setBusy(false);
    if (!res.success || !res.data) {
      setError(res.message || "We couldn't check the file with those choices.");
      return null;
    }
    setPreview(res.data);
    return res.data;
  };

  // ── confirm, polling progress while it runs ──
  const runImport = async () => {
    if (!orgId || !preview) return;
    setStep("importing");
    setError(null);
    let finished = false;
    const poll = async () => {
      while (!finished) {
        await new Promise((r) => setTimeout(r, 800));
        if (finished) break;
        const s = await memberImportsApi.status(orgId, preview.import_id);
        if (!finished && s.success && s.data) setStatus(s.data);
      }
    };
    void poll();
    const res = await memberImportsApi.confirm(orgId, preview.import_id, inviteMode);
    finished = true;
    if (!res.success || !res.data) {
      if (res.status === 409) {
        // Another import for this gym (or this one, from another tab) holds
        // the gym's import lock. Nothing of this one was written; it can run
        // once that finishes.
        setError(res.message || "Another member import for this gym is running. Try again when it finishes.", true);
      } else {
        setError(res.message || "The import stopped part-way. Run it again: members already imported are not added twice.");
      }
      setStep("invites");
      return;
    }
    setStatus(res.data);
    setStep("done");
  };

  const sendInvites = async () => {
    if (!orgId || !preview) return;
    setBusy(true);
    const res = await memberImportsApi.sendInvites(orgId, preview.import_id);
    setBusy(false);
    if (!res.success || !res.data) {
      toast.error(res.message || "Couldn't queue the invites");
      return;
    }
    setStatus(res.data);
    toast.success("Invites are on their way");
  };

  const resendUnconfirmed = async () => {
    if (!orgId || !preview) return;
    setBusy(true);
    const res = await memberImportsApi.resendUnconfirmed(orgId, preview.import_id);
    setBusy(false);
    if (!res.success || !res.data) {
      toast.error(res.message || "Couldn't send those invites again");
      return;
    }
    setStatus(res.data);
    toast.success("Sending them once more. A member may get the email twice.");
  };

  const stepIndex = Math.max(0, STEPS.findIndex((s) => s.id === (step === "importing" ? "done" : step)));

  return (
    <Drawer open={open} onClose={guard.requestClose} title="Import members" width={880}>
      <div className="flex min-h-full flex-col" {...guard.dirtyProps}>
        <ol className="flex flex-wrap gap-x-4 gap-y-1 px-4 sm:px-6 pt-4" aria-label="Import steps">
          {STEPS.map((s, i) => (
            <li
              key={s.id}
              aria-current={i === stepIndex ? "step" : undefined}
              className="font-mono text-[11px] uppercase tracking-[0.05em]"
              style={{ color: i === stepIndex ? "var(--ink)" : "var(--fg-3)" }}
            >
              {i + 1}. {s.label}
            </li>
          ))}
        </ol>

        <div className="flex-1 px-4 sm:px-6 py-5">
          <div aria-live="polite" className="sr-only">
            {busy ? "Checking your file…" : ""}
          </div>
          {notice && (
            <div
              role="alert"
              className="mb-4 rounded-(--r-2) p-3 text-[13px]"
              style={
                notice.warn
                  ? { background: "var(--warn-soft)", color: "var(--warn-ink)", border: "1px solid var(--warn)" }
                  : { background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }
              }
            >
              {notice.text}
            </div>
          )}

          {step === "upload" && (
            <section aria-labelledby="import-step">
              <h3 id="import-step" ref={headingRef} tabIndex={-1} className="text-[16px] font-medium" style={{ color: "var(--ink)", outline: "none" }}>
                Bring your members over
              </h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
                Export your member list from your old system as a CSV file. Each member keeps the time left on
                their membership: it runs until the end date in your file, and nothing is charged. They claim it by
                signing in to Binectics with the email in the file.
              </p>
              <ul className="mt-3 list-disc pl-5 text-[13px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
                <li>Needed: name, email, plan and membership end date.</li>
                <li>Optional: phone, start date, branch and notes.</li>
                <li>Up to {(preview?.limits.max_rows ?? 5000).toLocaleString()} members per file. Excel? Save as CSV UTF-8 first.</li>
              </ul>
              <button
                type="button"
                className="btn-ghost-v2 sm mt-3"
                onClick={() => downloadText(buildTemplateCsv(), "binectics-member-import-template.csv")}
              >
                Download the CSV template
              </button>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  void onFile(e.dataTransfer.files?.[0]);
                }}
                className="mt-5 flex flex-col items-center justify-center rounded-(--r-3) border-2 border-dashed px-4 py-8 text-center"
                style={{
                  borderColor: dragOver ? "var(--signal)" : "var(--border-2)",
                  background: dragOver ? "var(--signal-soft)" : "var(--bg)",
                }}
              >
                <p className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>
                  Drop your CSV here, or
                </p>
                <button
                  type="button"
                  className="btn-primary-v2 sm mt-2"
                  disabled={busy || !orgId}
                  onClick={() => fileRef.current?.click()}
                >
                  {busy ? "Reading…" : "Choose a CSV file"}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  tabIndex={-1}
                  aria-label="CSV file of members"
                  data-testid="member-import-file"
                  onChange={(e) => {
                    void onFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </div>
            </section>
          )}

          {step === "columns" && preview && (
            <ColumnsStep
              headingRef={headingRef}
              preview={preview}
              choices={choices}
              busy={busy}
              onChange={(next) => void refresh(next)}
            />
          )}

          {step === "preview" && preview && <PreviewStep headingRef={headingRef} preview={preview} />}

          {step === "invites" && preview && (
            <InvitesStep
              headingRef={headingRef}
              preview={preview}
              mode={inviteMode}
              onMode={setInviteMode}
            />
          )}

          {(step === "importing" || step === "done") && preview && (
            <ResultStep
              headingRef={headingRef}
              preview={preview}
              status={status}
              running={step === "importing"}
              busy={busy}
              onSendInvites={() => void sendInvites()}
              onResendUnconfirmed={() => void resendUnconfirmed()}
            />
          )}
        </div>

        <footer
          className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3"
          style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}
        >
          <div>
            {(step === "columns" || step === "preview" || step === "invites") && (
              <button
                type="button"
                className="btn-ghost-v2 sm"
                disabled={busy}
                onClick={() => setStep(step === "columns" ? "upload" : step === "preview" ? "columns" : "preview")}
              >
                Back
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {step === "columns" && preview && (
              <button
                type="button"
                className="btn-primary-v2 sm disabled:opacity-40"
                disabled={busy || preview.mapping_problems.length > 0}
                onClick={() => setStep("preview")}
              >
                Preview {preview.summary.total.toLocaleString()} rows
              </button>
            )}
            {step === "preview" && preview && (
              <button
                type="button"
                className="btn-primary-v2 sm disabled:opacity-40"
                disabled={busy || preview.summary.ready === 0}
                onClick={() => setStep("invites")}
              >
                Continue with {preview.summary.ready.toLocaleString()} ready
              </button>
            )}
            {step === "invites" && preview && (
              <button
                type="button"
                className="btn-primary-v2 sm disabled:opacity-40"
                disabled={busy || preview.summary.ready === 0}
                onClick={() => void runImport()}
              >
                Import {preview.summary.ready.toLocaleString()} member{preview.summary.ready === 1 ? "" : "s"}
              </button>
            )}
            {step === "done" && (
              <button type="button" className="btn-primary-v2 sm" onClick={close}>
                Done
              </button>
            )}
          </div>
        </footer>
      </div>
      {guard.confirmationModal}
    </Drawer>
  );
}

/** The server's guesses become the starting choices. */
function initialChoices(p: MemberImportPreview): MemberImportChoices {
  return {
    mapping: { ...p.mapping },
    date_format: p.date_format.requested,
    plan_map: [],
    branch_map: [],
    default_listing_id: p.default_branch?._id ?? null,
  };
}

// ─────────────────────────── steps ───────────────────────────

type HeadingRef = React.RefObject<HTMLHeadingElement | null>;

function StepHeading({ headingRef, children }: { headingRef: HeadingRef; children: React.ReactNode }) {
  return (
    <h3
      id="import-step"
      ref={headingRef}
      tabIndex={-1}
      className="text-[16px] font-medium"
      // A heading focused by script to announce the step; it isn't a control.
      style={{ color: "var(--ink)", outline: "none" }}
    >
      {children}
    </h3>
  );
}

function ColumnsStep({
  headingRef,
  preview,
  choices,
  busy,
  onChange,
}: {
  headingRef: HeadingRef;
  preview: MemberImportPreview;
  choices: MemberImportChoices;
  busy: boolean;
  onChange: (next: MemberImportChoices) => void;
}) {
  const mapping: ImportMapping = choices.mapping ?? {};
  const columnOptions = [
    { label: "Not in my file", value: "" },
    ...preview.headers.map((h, i) => ({ label: h || `Column ${i + 1}`, value: String(i) })),
  ];
  const sampleFor = (idx: number | undefined) =>
    idx === undefined
      ? ""
      : preview.sample
          .map((r) => r[idx])
          .filter(Boolean)
          .slice(0, 2)
          .join(", ");

  const setColumn = (field: ImportField, value: string) => {
    const next: ImportMapping = { ...mapping };
    if (value === "") delete next[field];
    else next[field] = Number(value);
    onChange({ ...choices, mapping: next });
  };

  const planChoice = (value: string) =>
    choices.plan_map?.find((p) => p.value === value)?.plan_id ??
    preview.plans.find((p) => p.value === value)?.plan_id ??
    "";
  const setPlan = (value: string, planId: string) => {
    const rest = (choices.plan_map ?? []).filter((p) => p.value !== value);
    onChange({ ...choices, plan_map: planId ? [...rest, { value, plan_id: planId }] : rest });
  };
  const branchChoice = (value: string) =>
    choices.branch_map?.find((b) => b.value === value)?.listing_id ??
    preview.branches.find((b) => b.value === value)?.listing_id ??
    "";
  const setBranch = (value: string, listingId: string) => {
    const rest = (choices.branch_map ?? []).filter((b) => b.value !== value);
    onChange({ ...choices, branch_map: listingId ? [...rest, { value, listing_id: listingId }] : rest });
  };

  const unmatchedPlans = preview.plans.filter((p) => !p.plan_id).length;
  const df = preview.date_format;

  return (
    <section aria-labelledby="import-step" aria-busy={busy}>
      <StepHeading headingRef={headingRef}>Match your columns</StepHeading>
      <p className="mt-1.5 text-[13.5px]" style={{ color: "var(--fg-2)" }}>
        {preview.file_name ? `${preview.file_name} · ` : ""}
        {preview.summary.total.toLocaleString()} rows. We guessed from your column names; check each one.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {FIELD_ORDER.map(({ field, required, hint }) => {
          const idx = mapping[field];
          const sample = sampleFor(idx);
          const id = `import-col-${field}`;
          return (
            <div key={field}>
              <label htmlFor={id} className="block text-[13px] font-medium" style={{ color: "var(--ink)" }}>
                {FIELD_LABELS[field]}
                {required ? <span style={{ color: "var(--fg-3)" }}> (needed)</span> : null}
              </label>
              <div className="mt-1">
                <SearchableSelect
                  id={id}
                  name={FIELD_LABELS[field]}
                  value={idx === undefined ? "" : String(idx)}
                  onChange={(v) => setColumn(field, v)}
                  options={columnOptions}
                  disabled={busy}
                />
              </div>
              <p className="mt-1 text-[12px] truncate" style={{ color: "var(--fg-3)" }}>
                {sample ? `e.g. ${sample}` : hint ?? ""}
              </p>
            </div>
          );
        })}
      </div>

      {preview.mapping_problems.length > 0 && (
        <ul role="alert" className="mt-4 list-disc pl-5 text-[13px]" style={{ color: "var(--danger)" }}>
          {preview.mapping_problems.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}

      {preview.plans.length > 0 && (
        <fieldset className="mt-6">
          <legend className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
            Plans in your file
          </legend>
          <p className="mt-1 text-[12.5px]" style={{ color: "var(--fg-3)" }}>
            {unmatchedPlans > 0
              ? `${unmatchedPlans} plan name${unmatchedPlans === 1 ? "" : "s"} didn't match your plans. Choose which plan each one is.`
              : "Every plan name matched one of your plans."}
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {preview.plans.map((p) => {
              const id = `import-plan-${p.value}`;
              return (
                <div key={p.value} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_260px]">
                  <label htmlFor={id} className="text-[13px]" style={{ color: "var(--ink)" }}>
                    “{p.value}” <span style={{ color: "var(--fg-3)" }}>· {p.rows} row{p.rows === 1 ? "" : "s"}</span>
                    {!p.plan_id && <span style={{ color: "var(--danger)" }}> · not matched</span>}
                  </label>
                  <SearchableSelect
                    id={id}
                    name={`Plan for ${p.value}`}
                    value={planChoice(p.value)}
                    onChange={(v) => setPlan(p.value, v)}
                    options={[
                      { label: "Choose a plan", value: "" },
                      ...preview.gym_plans.map((g) => ({ label: g.name, value: g._id })),
                    ]}
                    disabled={busy}
                  />
                </div>
              );
            })}
          </div>
          {preview.gym_plans.length === 0 && (
            <p className="mt-2 text-[13px]" style={{ color: "var(--danger)" }}>
              You have no active plans yet. <Link href="/dashboard/gym-owner/plans" className="underline">Create your plans</Link> first.
            </p>
          )}
        </fieldset>
      )}

      {preview.gym_branches.length > 1 && (
        <fieldset className="mt-6">
          <legend className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
            Branches
          </legend>
          <div className="mt-2 grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_260px]">
            <label htmlFor="import-default-branch" className="text-[13px]" style={{ color: "var(--ink)" }}>
              Members with no branch (or one we don&apos;t recognise) join
            </label>
            <SearchableSelect
              id="import-default-branch"
              name="Default branch"
              value={choices.default_listing_id ?? preview.default_branch?._id ?? ""}
              onChange={(v) => onChange({ ...choices, default_listing_id: v || null })}
              options={[
                { label: "No branch", value: "" },
                ...preview.gym_branches.map((b) => ({ label: b.name, value: b._id })),
              ]}
              disabled={busy}
            />
            {preview.branches.map((b) => {
              const id = `import-branch-${b.value}`;
              return (
                <div key={b.value} className="contents">
                  <label htmlFor={id} className="text-[13px]" style={{ color: "var(--ink)" }}>
                    “{b.value}” <span style={{ color: "var(--fg-3)" }}>· {b.rows} row{b.rows === 1 ? "" : "s"}</span>
                  </label>
                  <SearchableSelect
                    id={id}
                    name={`Branch for ${b.value}`}
                    value={branchChoice(b.value)}
                    onChange={(v) => setBranch(b.value, v)}
                    options={[
                      { label: "Default branch", value: "" },
                      ...preview.gym_branches.map((g) => ({ label: g.name, value: g._id })),
                    ]}
                    disabled={busy}
                  />
                </div>
              );
            })}
          </div>
        </fieldset>
      )}
      {preview.gym_branches.length === 1 && preview.default_branch && (
        <p className="mt-6 text-[13px]" style={{ color: "var(--fg-2)" }}>
          Everyone joins your listing <strong style={{ color: "var(--ink)" }}>{preview.default_branch.name}</strong>.
        </p>
      )}

      <fieldset className="mt-6">
        <legend className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
          How does your file write dates?
        </legend>
        <p className="mt-1 text-[12.5px]" style={{ color: "var(--fg-3)" }}>
          {df.requested === "auto" && df.applied === "dmy"
            ? `Read as day first: ${df.day_first_only} date${df.day_first_only === 1 ? "" : "s"} like 25/03 can only be read that way.`
            : df.requested === "auto" && df.applied === "mdy"
              ? `Read as month first: ${df.month_first_only} date${df.month_first_only === 1 ? "" : "s"} like 03/25 can only be read that way.`
              : df.ambiguous_rows > 0
                ? `${df.ambiguous_rows} row${df.ambiguous_rows === 1 ? " has a date" : "s have dates"} like 03/04 that could be either. Choose below.`
                : `Dates are read in your gym's time zone (${preview.time_zone}).`}
        </p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Date format">
          {DATE_FORMAT_OPTIONS.map((o) => {
            const on = (choices.date_format ?? "auto") === o.value;
            return (
              <label
                key={o.value}
                className="flex cursor-pointer items-start gap-2 rounded-(--r-2) p-3 text-[13px]"
                style={{ border: `1px solid ${on ? "var(--ink)" : "var(--border)"}` }}
              >
                <input
                  type="radio"
                  name="import-date-format"
                  value={o.value}
                  checked={on}
                  disabled={busy}
                  onChange={() => onChange({ ...choices, date_format: o.value as ImportDateFormat })}
                  className="mt-0.5"
                />
                <span>
                  <span className="block font-medium" style={{ color: "var(--ink)" }}>
                    {o.label}
                  </span>
                  <span className="block text-[12px]" style={{ color: "var(--fg-3)" }}>
                    {o.example}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>
    </section>
  );
}

const STATUS_PILL: Record<ImportPreviewRow["status"], { label: string; tone: "success" | "danger" | "neutral" | "warn" }> = {
  ready: { label: "Ready", tone: "success" },
  error: { label: "Fix", tone: "danger" },
  skipped: { label: "Skipped", tone: "neutral" },
  over_cap: { label: "No seat", tone: "warn" },
};

function rowBackground(r: ImportPreviewRow): string | undefined {
  if (r.status === "error") return "var(--danger-soft)";
  if (r.status === "over_cap") return "var(--warn-soft)";
  return undefined;
}

function PreviewStep({ headingRef, preview }: { headingRef: HeadingRef; preview: MemberImportPreview }) {
  const { fmtNumber } = useOrgFormat();
  const [filter, setFilter] = useState<"all" | "problems" | "ready">(
    preview.summary.errors + preview.summary.over_cap > 0 ? "problems" : "all",
  );
  const [shown, setShown] = useState(PAGE);
  const s = preview.summary;
  const seats = preview.seats;
  const withProblems = useMemo(() => rowsWithProblems(preview.rows), [preview.rows]);
  const rows = useMemo(
    () =>
      filter === "all"
        ? preview.rows
        : filter === "ready"
          ? preview.rows.filter((r) => r.status === "ready")
          : withProblems,
    [filter, preview.rows, withProblems],
  );
  const planName = useMemo(() => new Map(preview.gym_plans.map((p) => [p._id, p.name])), [preview.gym_plans]);
  const branchName = useMemo(() => new Map(preview.gym_branches.map((b) => [b._id, b.name])), [preview.gym_branches]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(problemsText(withProblems));
      toast.success("Problem list copied");
    } catch {
      toast.error("Couldn't copy. Download the list instead.");
    }
  };

  const counts: Array<{ label: string; value: number; tone?: string }> = [
    { label: "Ready to import", value: s.ready },
    { label: "Need fixing", value: s.errors, tone: s.errors ? "var(--danger)" : undefined },
    { label: "Already here", value: s.skipped },
    { label: "Over seat limit", value: s.over_cap, tone: s.over_cap ? "var(--warn-ink)" : undefined },
  ];

  return (
    <section aria-labelledby="import-step">
      <StepHeading headingRef={headingRef}>Check before importing</StepHeading>
      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {counts.map((c) => (
          <div key={c.label} className="rounded-(--r-2) p-3" style={{ background: "var(--bg-2)" }}>
            <dt className="text-[12px]" style={{ color: "var(--fg-3)" }}>
              {c.label}
            </dt>
            <dd className="mt-0.5 font-mono text-[20px]" style={{ color: c.tone ?? "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
              {fmtNumber(c.value)}
            </dd>
          </div>
        ))}
      </dl>

      {seats.limit !== null && (
        <div
          className="mt-4 rounded-(--r-2) p-3 text-[13px] leading-relaxed"
          role={seats.over_by > 0 ? "status" : undefined}
          style={{
            border: `1px solid ${seats.over_by > 0 ? "var(--warn)" : "var(--border)"}`,
            background: seats.over_by > 0 ? "var(--warn-soft)" : "var(--bg)",
            color: "var(--ink)",
          }}
        >
          Your plan{seats.plan_tier ? ` (${seats.plan_tier})` : ""} has {fmtNumber(seats.limit)} seats: {fmtNumber(seats.used)} used
          {seats.reserved_by_imports > 0 ? `, ${fmtNumber(seats.reserved_by_imports)} held for imported members who haven't claimed yet` : ""}.{" "}
          {seats.over_by > 0 ? (
            <>
              {fmtNumber(seats.fits)} of {fmtNumber(seats.fits + seats.over_by)} ready members fit;{" "}
              <strong>{fmtNumber(seats.over_by)} won&apos;t be imported.</strong> A plan with at least{" "}
              {fmtNumber(seats.limit_needed)} seats takes everyone; upgrade, then upload the same file again (members
              already imported are skipped).{" "}
              <Link href="/dashboard/billing" className="underline">
                See plans
              </Link>
            </>
          ) : (
            <>Everyone ready fits.</>
          )}
        </div>
      )}

      <p className="mt-3 text-[12.5px]" style={{ color: "var(--fg-3)" }}>
        Dates read {preview.date_format.applied === "dmy" ? "day first" : preview.date_format.applied === "mdy" ? "month first" : preview.date_format.applied === "ymd" ? "year first" : "only where they can't be read two ways"}, in {preview.time_zone}. Check a few below: the month is spelled out.
      </p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Show rows">
          {(
            [
              ["problems", `Needs attention (${withProblems.length})`],
              ["ready", `Ready (${s.ready})`],
              ["all", `All (${s.total})`],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => {
                setFilter(value);
                setShown(PAGE);
              }}
              className="whitespace-nowrap rounded-full border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.04em]"
              style={{
                background: filter === value ? "var(--ink)" : "var(--bg)",
                borderColor: filter === value ? "var(--ink)" : "var(--border)",
                color: filter === value ? "var(--bg)" : "var(--fg-3)",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        {withProblems.length > 0 && (
          <div className="flex gap-2">
            <button type="button" className="btn-ghost-v2 sm" onClick={() => void copy()}>
              Copy problems
            </button>
            <button
              type="button"
              className="btn-ghost-v2 sm"
              onClick={() => downloadText(problemsCsv(withProblems), "member-import-problems.csv")}
            >
              Download problems
            </button>
          </div>
        )}
      </div>

      {/* Phones: one card per row, so the problem is never off-screen. */}
      <ul className="mt-3 flex flex-col gap-2 sm:hidden" aria-label="Rows in your file">
        {rows.length === 0 ? (
          <li className="px-3 py-6 text-center text-[13px]" style={{ color: "var(--fg-3)" }}>
            Nothing here.
          </li>
        ) : (
          rows.slice(0, shown).map((r) => (
            <li
              key={r.row}
              className="rounded-(--r-2) p-3 text-[13px]"
              style={{ border: "1px solid var(--border)", background: rowBackground(r) ?? "var(--bg)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div style={{ color: "var(--ink)" }}>
                    <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>
                      Row {r.row}
                    </span>{" "}
                    {r.name || "-"}
                  </div>
                  <div className="font-mono text-[11.5px] break-all" style={{ color: "var(--fg-3)" }}>
                    {r.email ?? "no email"}
                  </div>
                </div>
                <StatusPill label={STATUS_PILL[r.status].label} tone={STATUS_PILL[r.status].tone} />
              </div>
              <div className="mt-1.5" style={{ color: "var(--fg-2)" }}>
                {(r.plan_id && planName.get(r.plan_id)) || r.plan_value || "-"}
                {r.end_date ? ` · ends ${formatDay(r.end_date)}` : ""}
                {r.start_date ? ` · started ${formatDay(r.start_date)}` : ""}
                {r.listing_id && preview.gym_branches.length > 1 ? ` · ${branchName.get(r.listing_id) ?? ""}` : ""}
              </div>
              {r.problems.length > 0 && (
                <ul className="mt-1 text-[12.5px] leading-snug">
                  {r.problems.map((p, i) => (
                    <li key={i} style={{ color: p.severity === "error" ? "var(--danger)" : "var(--fg-2)" }}>
                      {p.message}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))
        )}
      </ul>

      <div className="mt-3 hidden overflow-x-auto rounded-(--r-2) sm:block" style={{ border: "1px solid var(--border)" }}>
        <table className="w-full min-w-[640px] border-collapse text-[13px]">
          <caption className="sr-only">Rows in your file and what will happen to each</caption>
          <thead>
            <tr className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)", background: "var(--bg-2)" }}>
              <th scope="col" className="px-3 py-2 text-left font-medium">Row</th>
              <th scope="col" className="px-3 py-2 text-left font-medium">Member</th>
              <th scope="col" className="px-3 py-2 text-left font-medium">Plan</th>
              <th scope="col" className="px-3 py-2 text-left font-medium">Ends</th>
              <th scope="col" className="px-3 py-2 text-left font-medium">Started</th>
              <th scope="col" className="px-3 py-2 text-left font-medium">Outcome</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center" style={{ color: "var(--fg-3)" }}>
                  Nothing here.
                </td>
              </tr>
            ) : (
              rows.slice(0, shown).map((r) => (
                <tr key={r.row} style={{ borderTop: "1px solid var(--border)", background: rowBackground(r) }}>
                  <td className="px-3 py-2 align-top font-mono" style={{ color: "var(--fg-3)" }}>
                    {r.row}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <div style={{ color: "var(--ink)" }}>{r.name || "-"}</div>
                    <div className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>
                      {r.email ?? "no email"}
                    </div>
                  </td>
                  <td className="px-3 py-2 align-top" style={{ color: "var(--ink)" }}>
                    {(r.plan_id && planName.get(r.plan_id)) || r.plan_value || "-"}
                    {r.listing_id && preview.gym_branches.length > 1 && (
                      <div className="text-[11.5px]" style={{ color: "var(--fg-3)" }}>
                        {branchName.get(r.listing_id)}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top whitespace-nowrap" style={{ color: "var(--ink)" }}>
                    {formatDay(r.end_date) || "-"}
                  </td>
                  <td className="px-3 py-2 align-top whitespace-nowrap" style={{ color: "var(--fg-2)" }}>
                    {formatDay(r.start_date) || "-"}
                  </td>
                  <td className="px-3 py-2 align-top">
                    <StatusPill label={STATUS_PILL[r.status].label} tone={STATUS_PILL[r.status].tone} />
                    {r.problems.length > 0 && (
                      <ul className="mt-1 text-[12px] leading-snug">
                        {r.problems.map((p, i) => (
                          <li key={i} style={{ color: p.severity === "error" ? "var(--danger)" : "var(--fg-2)" }}>
                            {p.message}
                          </li>
                        ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {rows.length > shown && (
        <button type="button" className="btn-ghost-v2 sm mt-3" onClick={() => setShown((n) => n + PAGE)}>
          Show {Math.min(PAGE, rows.length - shown)} more of {fmtNumber(rows.length - shown)}
        </button>
      )}
    </section>
  );
}

function InvitesStep({
  headingRef,
  preview,
  mode,
  onMode,
}: {
  headingRef: HeadingRef;
  preview: MemberImportPreview;
  mode: ImportInviteMode;
  onMode: (m: ImportInviteMode) => void;
}) {
  const ready = preview.summary.ready;
  const perDay = preview.limits.invites_per_day;
  const days = inviteDays(ready, perDay);
  const options: Array<{ value: ImportInviteMode; title: string; body: string }> = [
    {
      value: "later",
      title: "Add them now, invite them later",
      body: "No one is emailed. Members who sign in or sign up with their email still find their membership waiting. Send the invites from the Members page when you're ready.",
    },
    {
      value: "now",
      title: "Email everyone an invite now",
      body:
        days > 1
          ? `Up to ${perDay} invites go out a day, so all ${ready.toLocaleString()} are sent within ${days} days.`
          : `Each member gets an email telling them their membership has moved to Binectics and how to claim it.`,
    },
  ];
  return (
    <section aria-labelledby="import-step">
      <StepHeading headingRef={headingRef}>Tell your members?</StepHeading>
      <p className="mt-1.5 text-[13.5px]" style={{ color: "var(--fg-2)" }}>
        {ready.toLocaleString()} member{ready === 1 ? "" : "s"} will be imported. Each keeps their plan and end date. Nothing is
        charged, and these memberships are not counted as revenue: they were paid before Binectics.
      </p>
      <div className="mt-4 flex flex-col gap-2" role="radiogroup" aria-label="Invitations">
        {options.map((o) => {
          const on = mode === o.value;
          return (
            <label
              key={o.value}
              className="flex cursor-pointer items-start gap-3 rounded-(--r-2) p-4"
              style={{ border: `1px solid ${on ? "var(--ink)" : "var(--border)"}` }}
            >
              <input
                type="radio"
                name="import-invite-mode"
                value={o.value}
                checked={on}
                onChange={() => onMode(o.value)}
                className="mt-1"
              />
              <span>
                <span className="block text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                  {o.title}
                </span>
                <span className="mt-0.5 block text-[13px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
                  {o.body}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </section>
  );
}

function ResultStep({
  headingRef,
  preview,
  status,
  running,
  busy,
  onSendInvites,
  onResendUnconfirmed,
}: {
  headingRef: HeadingRef;
  preview: MemberImportPreview;
  status: MemberImportStatus | null;
  running: boolean;
  busy: boolean;
  onSendInvites: () => void;
  onResendUnconfirmed: () => void;
}) {
  const { fmtNumber } = useOrgFormat();
  const total = status?.total ?? preview.summary.total;
  const processed = status?.processed ?? 0;
  if (running) {
    return (
      <section aria-labelledby="import-step" aria-busy="true">
        <StepHeading headingRef={headingRef}>Importing…</StepHeading>
        <p className="mt-1.5 text-[13.5px]" style={{ color: "var(--fg-2)" }}>
          Keep this open until it finishes. If it stops, run it again: no one is added twice.
        </p>
        <ProgressBar
          className="mt-4"
          value={processed}
          max={Math.max(total, 1)}
          label="Import progress"
          valueText={`${fmtNumber(processed)} of ${fmtNumber(total)} rows`}
        />
        <p className="mt-2 font-mono text-[12px]" style={{ color: "var(--fg-3)" }} aria-live="polite">
          {fmtNumber(processed)} of {fmtNumber(total)} rows
        </p>
      </section>
    );
  }
  const r = status?.result ?? {};
  const inv = status?.invites ?? { held: 0, queued: 0, sent: 0, unconfirmed: 0 };
  // The result's own count: seats can be taken while the import runs, so
  // it can be more than the preview's estimate.
  const overCap = r.over_cap ?? 0;
  const lines: Array<[string, number | undefined]> = [
    ["Imported", r.imported],
    ["Already imported before", r.already_imported],
    ["Already your members (or already offered)", r.already_member],
    ["Not imported: need fixing", r.errors],
    ["Not imported: no seat left", r.over_cap],
  ];
  return (
    <section aria-labelledby="import-step">
      <StepHeading headingRef={headingRef}>Import finished</StepHeading>
      <dl className="mt-4 divide-y rounded-(--r-2)" style={{ border: "1px solid var(--border)" }}>
        {lines
          // "Imported" always; the other outcomes only when they happened.
          .filter(([label, n]) => label === "Imported" || (n ?? 0) > 0)
          .map(([label, n]) => (
            <div key={label} className="flex items-center justify-between px-3 py-2 text-[13.5px]" style={{ borderColor: "var(--border)" }}>
              <dt style={{ color: "var(--fg-2)" }}>{label}</dt>
              <dd className="font-mono" style={{ color: "var(--ink)" }}>
                {fmtNumber(n ?? 0)}
              </dd>
            </div>
          ))}
      </dl>
      <p className="mt-4 text-[13.5px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
        Imported members appear under “Waiting to accept” on your Members page until they claim their membership. Their seat
        is taken when they do.
      </p>
      {overCap > 0 && (
        <div
          role="status"
          className="mt-3 rounded-(--r-2) p-3 text-[13px] leading-relaxed"
          style={{ border: "1px solid var(--warn)", background: "var(--warn-soft)", color: "var(--ink)" }}
        >
          <strong>
            {fmtNumber(overCap)} {overCap === 1 ? "member" : "members"} didn&apos;t fit your seat limit and{" "}
            {overCap === 1 ? "wasn't" : "weren't"} imported.
          </strong>{" "}
          {overCap > preview.seats.over_by ? "Seats were taken while the import ran, so that's more than the preview showed. " : ""}
          Free up seats or upgrade, then upload the same file again: members already imported are skipped.{" "}
          <Link href="/dashboard/billing" className="underline">
            See plans
          </Link>
        </div>
      )}
      <div className="mt-3 rounded-(--r-2) p-3 text-[13px]" style={{ background: "var(--bg-2)", color: "var(--ink)" }}>
        {inv.held > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span>{fmtNumber(inv.held)} haven&apos;t been invited yet.</span>
            <button type="button" className="btn-primary-v2 sm" disabled={busy} onClick={onSendInvites}>
              Send invites now
            </button>
          </div>
        ) : inv.queued > 0 ? (
          <span>
            {fmtNumber(inv.sent)} invites sent, {fmtNumber(inv.queued)} on their way (up to {status?.invites_per_day ?? 200} a day).
          </span>
        ) : (
          <span>{fmtNumber(inv.sent)} invites sent.</span>
        )}
        {inv.unconfirmed > 0 && (
          <div
            className="mt-2 flex flex-wrap items-center justify-between gap-2 pt-2"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <span>
              {fmtNumber(inv.unconfirmed)} {inv.unconfirmed === 1 ? "invite" : "invites"} may not have arrived. Sending again
              may give some members a second copy.
            </span>
            <button type="button" className="btn-ghost-v2 sm" disabled={busy} onClick={onResendUnconfirmed}>
              Send {fmtNumber(inv.unconfirmed)} again
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
