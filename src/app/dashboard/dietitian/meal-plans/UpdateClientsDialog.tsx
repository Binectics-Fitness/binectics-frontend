"use client";

import { useEffect, useState } from "react";
import {
  progressService,
  type MealPlanUpdateClientPreview,
  type MealPlanUpdateClientResult,
  type MealPlanUpdatePreview,
} from "@/lib/api/progress";
import { parseBillingError, type BillingError } from "@/lib/utils/billingErrors";
import { PlanGate } from "@/components/ds/PlanGate";
import { toast } from "@/components/Toast";
import { BuilderDialog } from "@/components/programs/builder/BuilderDialog";
import { dayLabel } from "@/components/programs/builder/UpdateClientsDialog";
import { Btn, LinkBtn, errStyle, errText, fieldLabel, fieldLabelStyle, metaStyle } from "@/components/programs/builder/controls";
import { MEAL_UPDATE_COPY as C, diffDetail, diffWhere } from "./_updateCopy";

const firstName = (full: string | null) => (full ?? "Client").split(" ")[0] || "Client";

const KIND_STYLE = {
  added: { bg: "var(--signal-soft)", fg: "var(--signal-ink)" },
  changed: { bg: "var(--bg-3)", fg: "var(--fg-2)" },
  removed: { bg: "var(--danger-soft)", fg: "var(--danger-ink)" },
  plan: { bg: "var(--bg-3)", fg: "var(--fg-2)" },
} as const;

const SHOWN_ITEMS = 8;

/**
 * Update clients for a library meal plan (roadmap R2, decision G3): preview
 * what changes for each client who holds a copy, pick who to update, apply
 * (from tomorrow; the client's current day and everything they logged stay
 * as they are), then a per-client result and an Undo for 24 hours. One
 * idempotency key per opening, so Try again resumes instead of repeating.
 */
export function MealPlanUpdateClientsDialog({
  planId,
  planTitle,
  onClose,
  onApplied,
}: {
  planId: string;
  planTitle: string;
  onClose: () => void;
  /** Called after any apply that changed a client (and after an Undo). */
  onApplied?: () => void;
}) {
  const [key] = useState(() =>
    typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `k-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  // "Tomorrow" is computed in this zone (clients have no stored zone yet).
  const [timezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
    } catch {
      return undefined;
    }
  });
  const [preview, setPreview] = useState<MealPlanUpdatePreview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [gate, setGate] = useState<BillingError | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<MealPlanUpdateClientResult[] | null>(null);

  useEffect(() => {
    let live = true;
    void (async () => {
      const res = await progressService.previewMealPlanUpdate(planId, timezone);
      if (!live) return;
      if (res.success && res.data) {
        setPreview(res.data);
        setPicked(new Set(res.data.clients.filter((c) => c.selectable && c.default_checked).map((c) => c.plan_id)));
      } else {
        const billing = parseBillingError(res);
        if (billing) setGate(billing);
        else setLoadError(res.message ?? C.loadFailed);
      }
    })();
    return () => {
      live = false;
    };
  }, [planId, timezone]);

  const clients = preview?.clients ?? [];
  const chosen = clients.filter((c) => picked.has(c.plan_id));

  const toggle = (c: MealPlanUpdateClientPreview) => {
    if (!c.selectable) return;
    setPicked((cur) => {
      const next = new Set(cur);
      if (next.has(c.plan_id)) next.delete(c.plan_id);
      else next.add(c.plan_id);
      return next;
    });
  };
  const toggleOpen = (id: string) =>
    setOpen((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const send = async (ids: string[]) => {
    setBusy(true);
    setError(null);
    // Ticking a hand-edited client is the confirmation to replace their edits.
    const overwrite = clients.filter((c) => ids.includes(c.plan_id) && c.hand_edited).map((c) => c.plan_id);
    const res = await progressService.updateMealPlanClients(planId, {
      plan_ids: ids,
      overwrite_edited_plan_ids: overwrite.length ? overwrite : undefined,
      idempotency_key: key,
      timezone,
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
      const byId = new Map((prev ?? []).map((r) => [r.plan_id, r]));
      for (const r of data.results) byId.set(r.plan_id, r);
      return [...byId.values()];
    });
    const changed = data.results.filter((r) => r.status === "updated");
    if (changed.length > 0) {
      onApplied?.();
      const undoable = changed.filter((r) => r.update_id).map((r) => ({ plan_id: r.plan_id, update_id: r.update_id! }));
      toast(C.toastUpdated(changed.length), "success", {
        label: C.undo,
        onClick: () => {
          void progressService.revertMealPlanUpdates(undoable).then((out) => {
            if (out.success && out.data && out.data.every((r) => r.status !== "failed")) {
              toast.success(C.toastReverted(undoable.length));
            } else {
              toast.error(C.toastRevertFailed);
            }
            onApplied?.();
          });
        },
      });
    }
  };

  // ── Result view ──
  if (results) {
    const done = results.filter((r) => r.status === "updated" || r.status === "replayed").length;
    const failed = results.filter((r) => r.status === "failed");
    const line = (r: MealPlanUpdateClientResult) => {
      switch (r.status) {
        case "failed":
          return C.resultFailed(firstName(r.client_name));
        case "skipped_edited":
          return C.resultEdited;
        case "skipped_bought":
          return C.resultBought;
        case "nothing_to_change":
          return C.resultNothing;
        default:
          return C.resultDone(r.things_changed ?? 0);
      }
    };
    return (
      <BuilderDialog label={C.resultTitle(done, results.length)} onDismiss={onClose}>
        <h3 className="text-[20px] font-medium" style={{ color: "var(--ink)" }}>{C.resultTitle(done, results.length)}</h3>
        <div className="flex flex-col gap-1.5">
          {results.map((r) => {
            const bad = r.status === "failed";
            return (
              <div
                key={r.plan_id}
                className="flex flex-col"
                style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${bad ? "var(--danger)" : "var(--border)"}`, background: bad ? "var(--danger-soft)" : "var(--bg)" }}
              >
                <span className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>{r.client_name ?? "Client"}</span>
                <span className="text-[13px]" style={bad ? errStyle : metaStyle}>{line(r)}</span>
              </div>
            );
          })}
        </div>
        {error && <span role="alert" className={errText} style={errStyle}>{error}</span>}
        <div className="flex gap-2 justify-end">
          {failed.length > 0 && (
            <Btn variant="ghost" disabled={busy} onClick={() => void send(failed.map((f) => f.plan_id))}>
              {busy ? C.applying : C.tryAgain}
            </Btn>
          )}
          <Btn onClick={onClose}>{C.done}</Btn>
        </div>
      </BuilderDialog>
    );
  }

  const nobody = preview !== null && clients.length === 0;
  const from = chosen[0]?.effective_from ?? preview?.effective_from ?? clients[0]?.effective_from;

  return (
    <BuilderDialog label={C.title(planTitle)} onDismiss={onClose} width={520}>
      <h3 className="text-[20px] font-medium" style={{ color: "var(--ink)" }}>{C.title(planTitle)}</h3>

      {gate && <PlanGate gate={gate} />}
      {loadError && <span role="alert" className={errText} style={errStyle}>{loadError}</span>}
      {!preview && !loadError && !gate && <span className="text-[13px]" style={metaStyle}>{C.loading}</span>}
      {nobody && <span className="text-[14px]" style={{ color: "var(--ink)" }}>{C.nobody}</span>}

      {preview && !nobody && (
        <>
          <div className="flex flex-col gap-1.5">
            <span className={fieldLabel} style={fieldLabelStyle}>{C.whoChanges}</span>
            <div className="flex flex-col gap-1.5 max-h-[340px] overflow-y-auto" role="group" aria-label={C.whoChanges}>
              {clients.map((c) => {
                const on = picked.has(c.plan_id);
                const expanded = open.has(c.plan_id);
                return (
                  <div
                    key={c.plan_id}
                    style={{
                      background: "var(--bg)",
                      borderRadius: 10,
                      border: `1px solid ${on ? "var(--ink)" : "var(--border)"}`,
                      opacity: c.selectable ? 1 : 0.6,
                    }}
                  >
                    <button
                      type="button"
                      aria-pressed={on}
                      aria-disabled={!c.selectable || undefined}
                      onClick={() => toggle(c)}
                      className="flex w-full justify-between items-center text-left"
                      style={{ minHeight: 56, padding: "10px 14px", cursor: c.selectable ? "pointer" : "default", background: "transparent", border: "none" }}
                    >
                      <span className="flex flex-col">
                        <span className="text-[15px]" style={{ color: "var(--ink)" }}>{c.client_name ?? "Client"}</span>
                        <span className="text-[13px]" style={metaStyle}>
                          {c.selectable ? C.mealsLine(c.meals) : (c.disabled_reason ?? C.bought)}
                        </span>
                        {c.hand_edited && c.selectable && (
                          <span className="text-[12.5px]" style={{ color: "var(--fg-2)" }}>
                            <strong className="font-medium">{C.handEdited}.</strong> {C.handEditedBody}
                          </span>
                        )}
                      </span>
                      {on && <span aria-hidden="true">✓</span>}
                    </button>
                    <div style={{ padding: "0 14px 10px" }}>
                      <LinkBtn aria-expanded={expanded} onClick={() => toggleOpen(c.plan_id)}>
                        {expanded ? C.hideChanges : C.showChanges}
                      </LinkBtn>
                      {expanded && (
                        <div className="flex flex-col gap-1 mt-1.5" data-testid={`diff-${c.plan_id}`}>
                          {c.items.slice(0, SHOWN_ITEMS).map((it, i) => (
                            <div key={i} className="flex items-start justify-between gap-3" style={{ padding: "8px 12px", borderRadius: 8, background: "var(--bg-2)" }}>
                              <div className="min-w-0">
                                <div className="text-[12px]" style={metaStyle}>{diffWhere(it)}</div>
                                <div className="text-[14.5px]" style={{ color: "var(--ink)" }}>{it.title}</div>
                                {diffDetail(it) && <div className="text-[13px]" style={{ color: "var(--fg-2)" }}>{diffDetail(it)}</div>}
                              </div>
                              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: KIND_STYLE[it.kind].bg, color: KIND_STYLE[it.kind].fg }}>
                                {C.kind[it.kind]}
                              </span>
                            </div>
                          ))}
                          {c.total_items > SHOWN_ITEMS && <span className="text-[13px]" style={metaStyle}>{C.moreItems(c.total_items - SHOWN_ITEMS)}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <ul className="flex flex-col gap-1 text-[13px]" style={{ color: "var(--fg-2)" }}>
            {from && <li>{C.futureOnly(dayLabel(from))}</li>}
            <li>{C.untouched}</li>
            <li>{C.skippedNote}</li>
            <li>{C.notified}</li>
            {preview.up_to_date_count > 0 && <li>{C.upToDate(preview.up_to_date_count)}</li>}
          </ul>
        </>
      )}

      {error && <span role="alert" className={errText} style={errStyle}>{error}</span>}
      <div className="flex flex-col">
        <Btn
          size="full"
          softDisabled={chosen.length === 0 || !preview}
          disabled={busy}
          onClick={() => chosen.length > 0 && void send(chosen.map((c) => c.plan_id))}
        >
          {busy ? C.applying : chosen.length === 0 ? C.pickOne : chosen.length === 1 ? C.applyOne(firstName(chosen[0].client_name)) : C.apply(chosen.length)}
        </Btn>
      </div>
      <LinkBtn className="self-center" onClick={onClose}>{C.cancel}</LinkBtn>
    </BuilderDialog>
  );
}
