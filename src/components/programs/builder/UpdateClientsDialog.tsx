"use client";

import { useEffect, useMemo, useState } from "react";
import { programsService, type UpdateClientPreview, type UpdateClientResult, type UpdatePreview } from "@/lib/api/programs";
import { parseBillingError, type BillingError } from "@/lib/utils/billingErrors";
import { PlanGate } from "@/components/ds/PlanGate";
import { toast } from "@/components/Toast";
import { BuilderDialog } from "./BuilderDialog";
import { Btn, LinkBtn, errStyle, errText, fieldLabel, fieldLabelStyle, metaStyle } from "./controls";
import { UPDATE_COPY as C } from "./copy";

const firstName = (full: string | null) => (full ?? "Client").split(" ")[0] || "Client";

/** "Mon 30 Nov" from a YYYY-MM-DD calendar day (no timezone shift). */
export function dayLabel(day: string): string {
  return new Date(`${day}T00:00:00.000Z`)
    .toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
    .replace(",", "");
}

const KIND_STYLE = {
  added: { bg: "var(--signal-soft)", fg: "var(--signal-ink)" },
  changed: { bg: "var(--bg-3)", fg: "var(--fg-2)" },
  removed: { bg: "var(--danger-soft)", fg: "var(--danger-ink)" },
} as const;

/**
 * Update clients: preview what a newer version changes, pick the clients,
 * apply (future tasks only), then show a per-client result. One idempotency
 * key per opening, so Try again resumes instead of repeating.
 */
export function UpdateClientsDialog({
  templateId,
  programName,
  publishLatest = false,
  onlyInstanceId,
  beforeApply,
  onClose,
  onApplied,
}: {
  templateId: string;
  programName: string;
  /** From the builder: publish the latest draft with the update. */
  publishLatest?: boolean;
  /** From one client's page: this client only. */
  onlyInstanceId?: string;
  /** Sends any pending autosave first; false when it couldn't. */
  beforeApply?: () => Promise<boolean>;
  onClose: () => void;
  /** Called after any apply that changed a client (and after an Undo). */
  onApplied: () => void;
}) {
  // One key per opening: a retry (Try again) is the same Apply, not a new one.
  const [key] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const [preview, setPreview] = useState<UpdatePreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [gate, setGate] = useState<BillingError | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<UpdateClientResult[] | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      if (beforeApply && publishLatest && !(await beforeApply())) {
        if (live) setLoadError(C.loadFailed);
        return;
      }
      const res = await programsService.previewUpdate(templateId, publishLatest);
      if (!live) return;
      if (res.success && res.data) {
        const clients = onlyInstanceId ? res.data.clients.filter((c) => c.instance_id === onlyInstanceId) : res.data.clients;
        setPreview({ ...res.data, clients });
        setPicked(new Set(clients.filter((c) => c.selectable && (onlyInstanceId ? true : c.default_checked)).map((c) => c.instance_id)));
      } else {
        const billing = parseBillingError(res);
        if (billing) setGate(billing);
        else setLoadError(res.message ?? C.loadFailed);
      }
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, publishLatest, onlyInstanceId]);

  const clients = preview?.clients ?? [];
  const chosen = clients.filter((c) => picked.has(c.instance_id));
  const first = chosen[0];
  const fromVersions = useMemo(() => new Set((preview?.changes ?? []).map((g) => g.from_version_no)), [preview]);

  const toggle = (c: UpdateClientPreview) => {
    if (!c.selectable) return;
    setPicked((cur) => {
      const next = new Set(cur);
      if (next.has(c.instance_id)) next.delete(c.instance_id);
      else next.add(c.instance_id);
      return next;
    });
  };

  const send = async (ids: string[]) => {
    setBusy(true);
    setError(null);
    if (beforeApply && !(await beforeApply())) {
      setBusy(false);
      setError(C.failed);
      return;
    }
    const res = await programsService.updateClients(templateId, {
      instance_ids: ids,
      idempotency_key: key,
      publish_latest: publishLatest || undefined,
    });
    setBusy(false);
    if (!(res.success && res.data)) {
      const billing = parseBillingError(res);
      if (billing) setGate(billing);
      else setError(res.message ?? C.failed);
      return;
    }
    const data = res.data;
    // A retry reports only the clients it re-sent; keep the rest as they were.
    setResults((prev) => {
      const byId = new Map((prev ?? []).map((r) => [r.instance_id, r]));
      for (const r of data.results) byId.set(r.instance_id, r);
      return [...byId.values()];
    });
    const changed = data.results.filter((r) => r.status === "updated");
    if (changed.length > 0) {
      onApplied();
      const undoable = changed.filter((r) => r.update_id).map((r) => ({ instance_id: r.instance_id, update_id: r.update_id! }));
      toast(C.toastUpdated(changed.length, data.target_version_no), "success", {
        label: C.undo,
        onClick: () => {
          void programsService.revertUpdates(undoable).then((out) => {
            if (out.success && out.data && out.data.every((r) => r.status !== "failed")) {
              toast.success(C.toastReverted(undoable.length));
            } else {
              toast.error(C.toastRevertFailed);
            }
            onApplied();
          });
        },
      });
    }
  };

  // ── Result view ──
  if (results) {
    const done = results.filter((r) => r.status === "updated" || r.status === "replayed").length;
    const failed = results.filter((r) => r.status === "failed");
    return (
      <BuilderDialog label={C.resultTitle(done, results.length)} onDismiss={onClose}>
        <h3 className="text-[20px] font-medium" style={{ color: "var(--ink)" }}>{C.resultTitle(done, results.length)}</h3>
        <div className="flex flex-col gap-1.5">
          {results.map((r) => {
            const bad = r.status === "failed";
            return (
              <div
                key={r.instance_id}
                className="flex flex-col"
                style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${bad ? "var(--danger)" : "var(--border)"}`, background: bad ? "var(--danger-soft)" : "var(--bg)" }}
              >
                <span className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>{r.client_name ?? "Client"}</span>
                <span className="text-[13px]" style={bad ? errStyle : metaStyle}>
                  {bad
                    ? C.resultFailed(firstName(r.client_name))
                    : r.status === "already_current"
                      ? C.resultSkipped
                      : r.status === "nothing_to_change"
                        ? C.resultNothing
                        : `${C.resultDone(r.to_version_no ?? preview?.target_version_no ?? 0)(C.resultTasks(r.tasks_changed ?? 0))}`}
                </span>
              </div>
            );
          })}
        </div>
        {error && <span role="alert" className={errText} style={errStyle}>{error}</span>}
        <div className="flex gap-2 justify-end">
          {failed.length > 0 && (
            <Btn variant="ghost" disabled={busy} onClick={() => void send(failed.map((f) => f.instance_id))}>
              {busy ? C.applying : C.tryAgain}
            </Btn>
          )}
          <Btn onClick={onClose}>{C.done}</Btn>
        </div>
      </BuilderDialog>
    );
  }

  const noneBehind = preview !== null && clients.length === 0;
  const soldNames = preview?.sold.paid_clients.map((p) => firstName(p.client_name)).join(" and ") ?? "";
  const soldFrom = preview?.sold.paid_clients[0]?.from_version_no ?? null;

  return (
    <BuilderDialog label={C.title(programName)} onDismiss={onClose} width={520}>
      <div>
        <h3 className="text-[20px] font-medium" style={{ color: "var(--ink)" }}>{C.title(programName)}</h3>
        {preview && !noneBehind && (
          <p className="text-[13px] mt-1" style={metaStyle}>
            {C.moves(fromVersions.size === 1 ? [...fromVersions][0] : null, preview.target_version_no)}
          </p>
        )}
      </div>

      {gate && <PlanGate gate={gate} />}
      {loadError && <span role="alert" className={errText} style={errStyle}>{loadError}</span>}
      {!preview && !loadError && !gate && <span className="text-[13px]" style={metaStyle}>{C.loading}</span>}
      {noneBehind && <span className="text-[14px]" style={{ color: "var(--ink)" }}>{C.nobody}</span>}

      {preview && !noneBehind && (
        <>
          {preview.sold.is_sold && (
            <div role="note" className="text-[13.5px]" style={{ background: "var(--warn-soft, var(--bg-3))", border: "1px solid var(--border-2)", borderRadius: 10, padding: "10px 12px", color: "var(--ink)" }}>
              <div className="font-medium">{C.soldTitle}</div>
              <div style={{ color: "var(--fg-2)" }}>
                {preview.sold.paid_clients.length > 0 ? C.soldBody(soldNames, soldFrom) : "Clients paid for the version they started. Updating changes what they bought. Check the changes first."}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <span className={fieldLabel} style={fieldLabelStyle}>{C.whatChanges}</span>
            <div className="flex flex-col gap-1 max-h-[240px] overflow-y-auto" data-testid="update-diff">
              {preview.changes.map((g) => (
                <div key={g.from_version_no} className="flex flex-col gap-1">
                  {preview.changes.length > 1 && <span className="text-[12px]" style={metaStyle}>{C.fromVersion(g.from_version_no)}</span>}
                  {g.items.length === 0 && <span className="text-[13px]" style={metaStyle}>Only the schedule moves.</span>}
                  {g.items.map((it, i) => (
                    <div key={i} className="flex items-start justify-between gap-3" style={{ padding: "8px 12px", borderRadius: 8, background: "var(--bg-2)" }}>
                      <div className="min-w-0">
                        <div className="text-[12px]" style={metaStyle}>{it.where}</div>
                        <div className="text-[14.5px]" style={{ color: "var(--ink)" }}>{it.title}</div>
                        {it.detail && <div className="text-[13px]" style={{ color: "var(--fg-2)" }}>{it.detail}</div>}
                      </div>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: KIND_STYLE[it.kind].bg, color: KIND_STYLE[it.kind].fg }}>
                        {C.kind[it.kind]}
                      </span>
                    </div>
                  ))}
                  {g.total_items > g.items.length && <span className="text-[13px]" style={metaStyle}>{C.more(g.total_items - g.items.length)}</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className={fieldLabel} style={fieldLabelStyle}>{C.clients}</span>
            <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto" role="group" aria-label={C.clients}>
              {clients.map((c) => {
                const on = picked.has(c.instance_id);
                return (
                  <button
                    key={c.instance_id}
                    type="button"
                    aria-pressed={on}
                    aria-disabled={!c.selectable || undefined}
                    onClick={() => toggle(c)}
                    className="flex justify-between items-center text-left"
                    style={{
                      minHeight: 56,
                      padding: "10px 14px",
                      background: "var(--bg)",
                      borderRadius: 10,
                      border: `1px solid ${on ? "var(--ink)" : "var(--border)"}`,
                      opacity: c.selectable ? 1 : 0.6,
                      cursor: c.selectable ? "pointer" : "default",
                    }}
                  >
                    <span className="flex flex-col">
                      <span className="text-[15px]" style={{ color: "var(--ink)" }}>{c.client_name ?? "Client"}</span>
                      <span className="text-[13px]" style={metaStyle}>
                        {c.selectable ? C.clientLine(c.from_version_no, c.versions_behind, c.future_tasks.total) : C.disabledLine(c.from_version_no, c.disabled_reason ?? "")}
                      </span>
                    </span>
                    {on && <span aria-hidden="true">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <ul className="flex flex-col gap-1 text-[13px]" style={{ color: "var(--fg-2)" }}>
            <li>{C.futureOnly(first ? dayLabel(first.effective_from) : dayLabel(clients[0]?.effective_from ?? new Date().toISOString().slice(0, 10)))}</li>
            <li>{C.untouched}</li>
            <li>{C.notified}</li>
            {preview.will_publish && <li>{C.publishNote}</li>}
          </ul>
        </>
      )}

      {error && <span role="alert" className={errText} style={errStyle}>{error}</span>}
      <div className="flex flex-col">
        <Btn
          size="full"
          softDisabled={chosen.length === 0 || !preview}
          disabled={busy}
          onClick={() => chosen.length > 0 && void send(chosen.map((c) => c.instance_id))}
        >
          {busy ? C.applying : chosen.length === 0 ? C.pickOne : chosen.length === 1 ? C.applyOne(firstName(chosen[0].client_name)) : C.apply(chosen.length)}
        </Btn>
      </div>
      <LinkBtn className="self-center" onClick={onClose}>{C.cancel}</LinkBtn>
    </BuilderDialog>
  );
}
