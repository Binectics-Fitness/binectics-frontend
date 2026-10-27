"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { DSCard, Eyebrow } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useMyProviders } from "@/components/messaging/MyCoachesCard";
import { starterService } from "@/lib/api/starter";
import { queryKeys } from "@/lib/queries/keys";
import { starterErrorMessage } from "@/lib/starter/errors";
import { STARTER_LEAVE_REASONS } from "@/lib/starter/goals";
import {
  StarterExportFormat,
  type StarterLeaveReason,
  type StarterProgram,
} from "@/lib/starter/types";
import { ChoiceGroup } from "./ChoiceGroup";

/** Saves a download in the browser. */
function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Toggle({
  id,
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-6 w-6 shrink-0 cursor-pointer accent-[var(--ink)]"
      />
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-[15px] font-medium" style={{ color: "var(--ink)" }}>{label}</span>
        {hint && <span className="mt-0.5 block text-[13px]" style={{ color: "var(--fg-3)" }}>{hint}</span>}
      </label>
    </div>
  );
}

/**
 * Manage the running program: morning reminder, read-only sharing with the
 * member's own coaches, download of their history, swap and leave. Every
 * switch is off by default and changes only when the API confirms.
 */
export function StarterManage({ program }: { program: StarterProgram }) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: queryKeys.starter.all });
  const providers = useMyProviders();
  const pros = providers.data?.professionals ?? [];

  // Switch values shown while a change is on its way to the API. They are
  // dropped once the saved value has been read back, or when the change fails.
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const settle = (key: string) =>
    setShown((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  const [exporting, setExporting] = useState<StarterExportFormat | null>(null);
  const [exportError, setExportError] = useState("");
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [reason, setReason] = useState<StarterLeaveReason | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState("");

  const toggleReminders = async (enabled: boolean) => {
    setBusyKey("reminders");
    setShown((p) => ({ ...p, reminders: enabled }));
    const res = await starterService.setReminders(program.id, enabled);
    setBusyKey(null);
    if (!res.success) {
      settle("reminders");
      return toast(starterErrorMessage(res, "Could not change the reminder. Try again."), "error");
    }
    toast(enabled ? "Morning reminder is on" : "Morning reminder is off", "success");
    await refresh();
    settle("reminders");
  };

  const toggleShare = async (providerId: string, on: boolean) => {
    const ids = new Set(program.sharedWithProviderIds);
    if (on) ids.add(providerId);
    else ids.delete(providerId);
    const key = `share-${providerId}`;
    setBusyKey(key);
    setShown((p) => ({ ...p, [key]: on }));
    const res = await starterService.setSharing(program.id, [...ids]);
    setBusyKey(null);
    if (!res.success) {
      settle(key);
      return toast(starterErrorMessage(res, "Could not change sharing. Try again."), "error");
    }
    toast(on ? "Your coach can now see this program" : "Sharing is off", "success");
    await refresh();
    settle(key);
  };

  const download = async (format: StarterExportFormat) => {
    setExporting(format);
    setExportError("");
    const res = await starterService.downloadExport(format);
    setExporting(null);
    if (!res.success || !res.data) {
      setExportError(starterErrorMessage(res, "Could not prepare your download. Try again."));
      return;
    }
    saveBlob(res.data.blob, res.data.filename);
  };

  const leave = async () => {
    setLeaving(true);
    setLeaveError("");
    const res = await starterService.leave(program.id, reason ?? undefined);
    setLeaving(false);
    if (!res.success) return setLeaveError(starterErrorMessage(res, "Could not leave the program. Try again."));
    toast("You have left the program. Your history is kept.", "success");
    setLeaveOpen(false);
    void refresh();
  };

  return (
    <section aria-labelledby="starter-manage-h" className="flex flex-col gap-3.5">
      <Eyebrow as="h2" id="starter-manage-h">Manage your program</Eyebrow>

      <DSCard className="p-5">
        <Toggle
          id="starter-reminder"
          label="Morning reminder"
          hint="A nudge at 8:00 on session days. Off unless you turn it on."
          checked={shown.reminders ?? program.remindersEnabled}
          disabled={busyKey === "reminders"}
          onChange={(v) => void toggleReminders(v)}
        />
      </DSCard>

      {pros.length > 0 && (
        <DSCard className="p-5">
          <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Share with my coach</h3>
          <p className="mt-0.5 mb-3 text-[13px]" style={{ color: "var(--fg-3)" }}>
            Read only. Your coach sees the program name, your week, how many sessions you have done and the
            numbers you logged. They cannot change it. Off unless you turn it on.
          </p>
          <div className="flex flex-col gap-3">
            {pros.map((p) => {
              const name = [p.first_name, p.last_name].filter(Boolean).join(" ") || "Your coach";
              return (
                <Toggle
                  key={p.professional_id}
                  id={`starter-share-${p.professional_id}`}
                  label={`Share with ${name}`}
                  hint={p.role ?? undefined}
                  checked={shown[`share-${p.professional_id}`] ?? program.sharedWithProviderIds.includes(p.professional_id)}
                  disabled={busyKey === `share-${p.professional_id}`}
                  onChange={(v) => void toggleShare(p.professional_id, v)}
                />
              );
            })}
          </div>
        </DSCard>
      )}

      <DSCard className="p-5">
        <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Download your history</h3>
        <p className="mt-0.5 mb-3 text-[13px]" style={{ color: "var(--fg-3)" }}>
          Your programs, sessions, workouts and weigh-ins. JSON is the complete file; CSV is one flat log.
        </p>
        <div className="flex flex-wrap gap-2">
          {[StarterExportFormat.Json, StarterExportFormat.Csv].map((f) => (
            <button
              key={f}
              type="button"
              className="btn-ghost-v2 md min-h-11"
              disabled={exporting !== null}
              onClick={() => void download(f)}
            >
              {exporting === f ? "Preparing…" : `Download ${f.toUpperCase()}`}
            </button>
          ))}
        </div>
        {exportError && (
          <p role="alert" className="mt-3 text-[14px]" style={{ color: "var(--danger)" }}>{exportError}</p>
        )}
      </DSCard>

      <DSCard className="p-5">
        <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Change or leave</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/dashboard/member/starter/start?swap=${encodeURIComponent(program.id)}`}
            className="btn-ghost-v2 md min-h-11"
          >
            Swap for another program
          </Link>
          {!leaveOpen && (
            <button type="button" className="btn-ghost-v2 md min-h-11" onClick={() => setLeaveOpen(true)}>
              Leave program
            </button>
          )}
        </div>
        {leaveOpen && (
          <div className="mt-4" role="group" aria-label="Leave this program">
            <p className="text-[14px]" style={{ color: "var(--ink)" }}>
              Leave this program? Your history is kept. Why? (optional)
            </p>
            <ChoiceGroup
              label="Why you are leaving"
              options={STARTER_LEAVE_REASONS}
              value={reason}
              onChange={setReason}
              className="mt-2"
            />
            {leaveError && (
              <p role="alert" className="mt-3 text-[14px]" style={{ color: "var(--danger)" }}>{leaveError}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-primary-v2 md min-h-11" disabled={leaving} onClick={() => void leave()}>
                {leaving ? "Leaving…" : "Leave program"}
              </button>
              <button type="button" className="btn-ghost-v2 md min-h-11" disabled={leaving} onClick={() => setLeaveOpen(false)}>
                Stay
              </button>
            </div>
          </div>
        )}
      </DSCard>
    </section>
  );
}
