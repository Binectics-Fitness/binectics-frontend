"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toast";
import { paidContentService, paidContentErrorOf } from "@/lib/api/paidContent";
import { paidContentCopy } from "@/lib/paidContent/helpers";

/** Today as YYYY-MM-DD in the browser's own timezone. */
function todayLocal(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** The new instance's id from the API's reply (`id`, or the raw `_id`). */
function instanceIdOf(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const id = d.id ?? d._id ?? d.instance_id ?? d.instanceId;
  return typeof id === "string" && id ? id : null;
}

/**
 * Starts a program the member has access to, themselves (D9): today, or on a
 * date they pick. The API checks access and creates the instance.
 */
export function StartProgramControl({
  programId,
  title,
  onStarted,
}: {
  programId: string;
  title: string;
  onStarted?: () => void;
}) {
  const [picking, setPicking] = useState(false);
  const [date, setDate] = useState(todayLocal());
  const [busy, setBusy] = useState(false);
  // After a successful start the controls stay off: a second tap would start
  // a second copy while the page navigates.
  const [started, setStarted] = useState(false);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const start = async (startDate?: string) => {
    if (busy || started) return;
    setBusy(true);
    setError(null);
    const res = await paidContentService.startProgram(programId, {
      startDate,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    setBusy(false);
    if (!res.success) {
      const e = paidContentErrorOf(res);
      setError(e ? paidContentCopy(e) : res.message || "We couldn't start it. Please try again.");
      return;
    }
    setStarted(true);
    toast.success(`${title || "Program"} started`);
    onStarted?.();
    const instanceId = instanceIdOf(res.data);
    router.push(instanceId ? `/dashboard/my-programs/${encodeURIComponent(instanceId)}` : "/dashboard/my-programs");
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-signal-v2" disabled={busy || started} onClick={() => void start()}>
          {busy ? "Starting..." : started ? "Started" : "Start today"}
        </button>
        <button type="button" className="btn-ghost-v2" disabled={busy || started} onClick={() => setPicking((v) => !v)}>
          Pick a date
        </button>
      </div>
      {picking && (
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[13px]" style={{ color: "var(--fg-2)" }} htmlFor={`start-${programId}`}>
            Start on
          </label>
          <input
            id={`start-${programId}`}
            type="date"
            value={date}
            min={todayLocal()}
            onChange={(e) => setDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-(--r-2) text-[13.5px]"
            style={{ border: "1px solid var(--border-2)", background: "var(--bg)", color: "var(--ink)" }}
          />
          <button type="button" className="btn-primary-v2" disabled={busy || started || !date} onClick={() => void start(date)}>
            Start on this date
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="text-[13px]" style={{ color: "var(--danger-ink)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
