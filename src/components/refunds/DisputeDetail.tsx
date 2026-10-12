"use client";

import { useEffect, useState } from "react";
import { AsyncSpinner, StatusPill } from "@/components/ds";
import { formatMinor } from "@/lib/currencies/helpers";
import { refundsService, type Dispute } from "@/lib/api/refunds";
import { disputeTone, refundErrorMessage } from "@/lib/refunds/refundUi";

export type DisputeDetailProps =
  | { mode: "provider"; orgId: string; disputeId: string }
  | { mode: "admin"; disputeId: string };

function when(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const field = { border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" } as const;

/**
 * One dispute. Disputes follow the money: on the provider's own Paystack
 * money the provider answers it in Paystack (notes kept here); on money
 * Binectics collected, Binectics answers it and asks the provider for
 * evidence, which they add here. Admins can see every dispute but act only
 * on platform ones (`can_act`).
 */
export function DisputeDetail(props: DisputeDetailProps) {
  const orgId = props.mode === "provider" ? props.orgId : null;
  const { disputeId, mode } = props;
  const [d, setD] = useState<Dispute | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (orgId ? refundsService.orgDispute(orgId, disputeId) : refundsService.adminDispute(disputeId)).then((res) => {
      if (!active) return;
      if (res.success && res.data) setD(res.data);
      else setError(refundErrorMessage(res.code, res.message));
    });
    return () => {
      active = false;
    };
  }, [orgId, disputeId]);

  if (error && !d) return <div role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>{error}</div>;
  if (!d) return <AsyncSpinner />;
  const t = disputeTone(d);

  const addProviderEvidence = async () => {
    if (!orgId) return;
    setBusy(true);
    setError(null);
    let documentUrl: string | undefined;
    if (file) {
      const up = await refundsService.uploadEvidenceDocument(file);
      if (!up.success || !up.data?.url) {
        setBusy(false);
        setError("The document didn't upload. Try again.");
        return;
      }
      documentUrl = up.data.url;
    }
    const res = await refundsService.addEvidence(orgId, d.id, {
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(documentUrl ? { document_url: documentUrl } : {}),
    });
    setBusy(false);
    if (res.success && res.data) {
      setD(res.data);
      setNote("");
      setFile(null);
      setMsg("Added.");
    } else setError(refundErrorMessage(res.code, res.message));
  };

  const adminAction = async (kind: "request" | "note") => {
    if (!note.trim()) return;
    setBusy(true);
    setError(null);
    const res =
      kind === "request"
        ? await refundsService.requestEvidence(d.id, note.trim())
        : await refundsService.adminNote(d.id, note.trim());
    setBusy(false);
    if (res.success && res.data) {
      setD(res.data);
      setNote("");
      setMsg(kind === "request" ? "The provider has been asked." : "Note added.");
    } else setError(refundErrorMessage(res.code, res.message));
  };

  return (
    <div className="flex flex-col gap-3" data-testid="dispute-detail">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill label={t.label} tone={t.tone} />
        <span className="text-[13px]" style={{ color: "var(--fg-2)" }}>
          {d.refund_amount_minor !== null ? formatMinor(d.currency, d.refund_amount_minor) : ""} · Paystack status: {d.gateway_status ?? "unknown"}
          {d.resolution ? ` · ${d.resolution}` : ""}
        </span>
      </div>
      <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>
        {d.handled_by === "provider"
          ? mode === "provider"
            ? `This payment went to your own Paystack account, so you respond to the dispute in your Paystack dashboard${d.due_at && d.open ? ` by ${when(d.due_at)}` : ""}. Keep your notes and documents here.`
            : "Collected on the provider's own Paystack account: the provider handles this dispute."
          : mode === "provider"
            ? "Binectics collected this payment and is answering the dispute. Add anything that shows the service was delivered."
            : `Platform money: Binectics answers this in the Paystack dashboard${d.due_at && d.open ? ` by ${when(d.due_at)}` : ""}.`}
      </p>
      {d.evidence_request_note ? (
        <div className="rounded-(--r-2) p-3 text-[13px]" style={{ background: "var(--warn-soft)", color: "var(--warn-ink)" }}>
          Binectics asked for: {d.evidence_request_note}
        </div>
      ) : null}

      {d.evidence.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {d.evidence.map((e, i) => (
            <li key={i} className="text-[13px]" style={{ color: "var(--ink)" }}>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
                {e.by_role === "admin" ? "Binectics" : "Provider"} · {when(e.at)}
              </span>
              {e.note ? <div>{e.note}</div> : null}
              {e.document_url ? (
                <a href={e.document_url} target="_blank" rel="noopener noreferrer" className="underline">
                  View document
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>No evidence yet.</p>
      )}

      {mode === "provider" || d.can_act ? (
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-1.5 text-[13px]" style={{ color: "var(--ink)" }}>
            {mode === "provider" ? "Add a note" : "Message or note"}
            <textarea
              value={note}
              maxLength={mode === "provider" ? 2000 : 500}
              rows={3}
              onChange={(e) => setNote(e.target.value)}
              className="rounded-(--r-2) px-3 py-2 text-[14px]"
              style={field}
            />
          </label>
          {mode === "provider" ? (
            <label className="flex flex-col gap-1.5 text-[13px]" style={{ color: "var(--ink)" }}>
              Document (PDF or image, kept private)
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-[13px]"
              />
            </label>
          ) : null}
          {error ? <div role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>{error}</div> : null}
          {msg ? <div role="status" className="text-[13px]" style={{ color: "var(--signal-ink)" }}>{msg}</div> : null}
          <div className="flex flex-wrap gap-2">
            {mode === "provider" ? (
              <button className="btn-primary-v2" disabled={busy || (!note.trim() && !file)} onClick={addProviderEvidence}>
                Add evidence
              </button>
            ) : (
              <>
                <button className="btn-primary-v2" disabled={busy || !note.trim()} onClick={() => adminAction("request")}>
                  Ask the provider for evidence
                </button>
                <button className="btn-ghost-v2" disabled={busy || !note.trim()} onClick={() => adminAction("note")}>
                  Add note
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}

      {d.events.length > 0 ? (
        <details className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
          <summary>Paystack events</summary>
          <ul className="mt-1">
            {d.events.map((e, i) => (
              <li key={i}>
                {when(e.at)} · {e.event}
                {e.status ? ` (${e.status})` : ""}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
