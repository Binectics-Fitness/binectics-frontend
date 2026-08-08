"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AsyncSpinner } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import {
  programsService,
  type InstanceDetail,
  type ProgramInstance,
} from "@/lib/api/programs";
import type { ProgramsRoleConfig } from "./config";

const STATUS_TINT: Record<ProgramInstance["status"], string> = {
  active: "var(--signal-ink)",
  assigned: "var(--fg-2)",
  paused: "oklch(0.42 0.13 75)",
  completed: "var(--fg-3)",
  cancelled: "var(--fg-4)",
};

function clientName(i: ProgramInstance): string {
  if (typeof i.client_id === "object" && i.client_id !== null) {
    return `${i.client_id.first_name} ${i.client_id.last_name}`.trim();
  }
  return "Client";
}

function Stat({ label, value, tint }: { label: string; value: string; tint?: string }) {
  return (
    <div className="rounded-(--r-2) px-4 py-3" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{label}</div>
      <div className="text-[22px] font-medium mt-1" style={{ color: tint ?? "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{value}</div>
    </div>
  );
}

export default function ProgramInstanceView({
  config,
  instanceId,
}: {
  config: ProgramsRoleConfig;
  instanceId: string;
}) {
  const { Shell, basePath, navItem } = config;
  const { fmtDate } = useOrgFormat();
  const [detail, setDetail] = useState<InstanceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const applyDetail = (res: Awaited<ReturnType<typeof programsService.getInstance>>) => {
    if (res.success && res.data) {
      setDetail(res.data);
      setError(null);
    } else {
      setError(res.message || "We couldn't load this program.");
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await programsService.getInstance(instanceId);
      if (active) applyDetail(res);
    })();
    return () => {
      active = false;
    };
  }, [instanceId]);

  const runAction = async (
    action: "pause" | "resume" | "complete" | "cancel",
    confirmMsg?: string,
  ) => {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setActing(true);
    const fn = {
      pause: programsService.pauseInstance,
      resume: programsService.resumeInstance,
      complete: programsService.completeInstance,
      cancel: programsService.cancelInstance,
    }[action];
    const res = await fn(instanceId);
    setActing(false);
    if (res.success) {
      toast.success(`Program ${action === "resume" ? "resumed" : action + "d"}.`);
      applyDetail(await programsService.getInstance(instanceId));
    } else {
      toast.error(res.message ?? `Failed to ${action} program.`);
    }
  };

  const instance = detail?.instance;
  const status = instance?.status;
  const isTerminal = status === "completed" || status === "cancelled";

  return (
    <Shell activeItem={navItem} crumb="Program progress">
      <Link href={basePath} className="text-[12.5px] inline-flex items-center gap-1.5 mb-2" style={{ color: "var(--fg-3)" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6" /></svg>
        Back to programs
      </Link>

      {loading ? (
        <AsyncSpinner size="page" label="Loading program" />
      ) : error || !detail || !instance ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
          {error ?? "Program not found."}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-[26px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>{instance.name}</h1>
              <p className="text-[13.5px] mt-1" style={{ color: "var(--fg-3)" }}>
                {clientName(instance)}
                {instance.started_at ? ` · started ${fmtDate(instance.started_at)}` : ""}
                {" · "}
                <span style={{ color: STATUS_TINT[instance.status] }}>{instance.status}</span>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {status === "active" && (
                <button type="button" disabled={acting} onClick={() => runAction("pause")} className="h-9 px-4 rounded-(--r-2) text-[13px] font-medium disabled:opacity-50" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}>Pause</button>
              )}
              {status === "paused" && (
                <button type="button" disabled={acting} onClick={() => runAction("resume")} className="h-9 px-4 rounded-(--r-2) text-[13px] font-medium disabled:opacity-50" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}>Resume</button>
              )}
              {!isTerminal && (
                <button type="button" disabled={acting} onClick={() => runAction("complete", `Mark "${instance.name}" complete for ${clientName(instance)}?`)} className="h-9 px-4 rounded-(--r-2) text-[13px] font-medium disabled:opacity-50" style={{ background: "var(--ink)", border: "none", color: "var(--bg)" }}>Complete</button>
              )}
              {!isTerminal && (
                <button type="button" disabled={acting} onClick={() => runAction("cancel", `Cancel "${instance.name}" for ${clientName(instance)}? This can't be undone.`)} className="h-9 px-4 rounded-(--r-2) text-[13px] font-medium disabled:opacity-50" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--danger)" }}>Cancel</button>
              )}
            </div>
          </div>

          {/* Adherence */}
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>Adherence</div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Stat
                label="Adherence"
                value={detail.adherence.adherence_pct != null ? `${detail.adherence.adherence_pct}%` : "-"}
                tint="var(--signal-ink)"
              />
              <Stat label="Done" value={String(detail.adherence.done)} />
              <Stat label="Missed" value={String(detail.adherence.missed)} tint={detail.adherence.missed > 0 ? "var(--danger)" : undefined} />
              <Stat label="Skipped" value={String(detail.adherence.skipped)} />
              <Stat label="Pending" value={String(detail.adherence.pending)} />
            </div>
          </div>

          {/* Goals */}
          <div>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>Goals</div>
            {detail.goals.length === 0 ? (
              <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>No goals set on this program.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {detail.goals.map((g, i) => (
                  <div key={g._id ?? i} className="flex items-center justify-between gap-3 rounded-(--r-2) px-4 py-3" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium truncate" style={{ color: "var(--ink)" }}>{g.label}</div>
                      {g.metric && <div className="font-mono text-[11px] mt-0.5" style={{ color: "var(--fg-4)" }}>{g.metric}</div>}
                    </div>
                    <div className="text-right shrink-0" style={{ fontVariantNumeric: "tabular-nums" }}>
                      <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
                        {g.latest_value != null ? g.latest_value : "-"}
                        {g.target != null && <span className="text-[12px]" style={{ color: "var(--fg-3)" }}> / {g.target}</span>}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-4)" }}>{g.direction}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Shell>
  );
}
