"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { WorkspaceShell } from "@/components/ds/WorkspaceShell";
import { ActionModal } from "@/components/ds/ActionModal";
import { AsyncSpinner, EmptySlate, StatusPill } from "@/components/ds";
import { ChargeRefundPanel, RefundRow } from "@/components/refunds/ChargeRefundPanel";
import { DisputeDetail } from "@/components/refunds/DisputeDetail";
import { SuggestedRefunds } from "@/components/refunds/SuggestedRefunds";
import { useOrganization } from "@/contexts/OrganizationContext";
import { formatMinor } from "@/lib/currencies/helpers";
import {
  refundsService,
  type Dispute,
  type OrgCharge,
  type Refund,
  type RefundPolicy,
} from "@/lib/api/refunds";
import { REFUND_STATUS, disputeTone, refundErrorMessage } from "@/lib/refunds/refundUi";
import { queryKeys } from "@/lib/queries/keys";

type Tab = "payments" | "refunds" | "disputes" | "policy";
const TABS: { id: Tab; label: string }[] = [
  { id: "payments", label: "Payments" },
  { id: "refunds", label: "Refunds" },
  { id: "disputes", label: "Disputes" },
  { id: "policy", label: "Cancellation policy" },
];

function when(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

function payer(c: OrgCharge): string {
  if (c.user_id && typeof c.user_id === "object") {
    return [c.user_id.first_name, c.user_id.last_name].filter(Boolean).join(" ") || c.user_id.email || "Member";
  }
  return "Member";
}

const card = { background: "var(--bg)", border: "1px solid var(--border)" } as const;

/**
 * /dashboard/refunds: the provider's money-back page, for every provider
 * role. Owner-only on the API; a non-owner sees the API's refusal.
 */
export function RefundsClient() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = (TABS.find((t) => t.id === params.get("tab"))?.id ?? "payments") as Tab;
  const setTab = (t: Tab) => router.replace(`${pathname}?tab=${t}`);
  const orgId = currentOrg?._id ?? null;
  // Bumped when a suggested refund is answered, so the lists below reload.
  const [rev, setRev] = useState(0);
  const queryClient = useQueryClient();
  const onSuggestionAnswered = () => {
    setRev((n) => n + 1);
    // The nav's Refunds count includes open suggestions.
    void queryClient.invalidateQueries({ queryKey: queryKeys.refunds.all });
  };

  return (
    <WorkspaceShell activeItem="Refunds" crumb="Refunds and disputes">
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Refunds and disputes
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Money taken on your own Paystack account, you refund. Money Binectics collected for you, Binectics refunds, and you can ask it to.
        </p>
      </div>
      <div role="tablist" aria-label="Refunds sections" className="flex flex-wrap gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`font-mono text-[11px] uppercase tracking-[0.04em] px-3 py-1.5 rounded-full ${tab === t.id ? "text-bg" : ""}`}
            style={{
              background: tab === t.id ? "var(--ink)" : "var(--bg)",
              color: tab === t.id ? "var(--bg)" : "var(--fg-3)",
              border: tab === t.id ? "1px solid var(--ink)" : "1px solid var(--border)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {orgId && !orgLoading ? (
        <SuggestedRefunds orgId={orgId} highlightId={params.get("suggested")} onChanged={onSuggestionAnswered} />
      ) : null}
      {orgLoading ? (
        <AsyncSpinner />
      ) : !orgId ? (
        <EmptySlate message="Set up your workspace to take payments first." />
      ) : tab === "payments" ? (
        <PaymentsTab key={rev} orgId={orgId} />
      ) : tab === "refunds" ? (
        <RefundsTab key={rev} orgId={orgId} />
      ) : tab === "disputes" ? (
        <DisputesTab orgId={orgId} openId={params.get("dispute")} />
      ) : (
        <PolicyTab orgId={orgId} />
      )}
    </WorkspaceShell>
  );
}

function PaymentsTab({ orgId }: { orgId: string }) {
  const [rows, setRows] = useState<OrgCharge[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<OrgCharge | null>(null);

  useEffect(() => {
    let active = true;
    refundsService.listOrgCharges(orgId).then((res) => {
      if (!active) return;
      if (res.success && res.data) setRows(res.data.items.filter((r) => r.type === "consultation" || r.type === "subscription"));
      else setError(refundErrorMessage(res.code, res.message));
    });
    return () => {
      active = false;
    };
  }, [orgId]);

  if (error) return <div role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>{error}</div>;
  if (!rows) return <AsyncSpinner />;
  if (rows.length === 0) return <EmptySlate message="No paid sessions or memberships yet." />;
  return (
    <div className="rounded-(--r-3) overflow-hidden" style={card}>
      <ul>
        {rows.map((c) => (
          <li key={c._id} className="flex flex-wrap items-center justify-between gap-3 px-4.5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="min-w-0">
              <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{payer(c)}</div>
              <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                {c.type === "consultation" ? "Session" : "Membership"} · {when(c.occurred_at)}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[14px]" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {formatMinor(c.currency, c.amount_minor)}
              </span>
              <button className="btn-ghost-v2" onClick={() => setOpen(c)} aria-label={`Refund options for ${payer(c)}`}>
                Refund…
              </button>
            </div>
          </li>
        ))}
      </ul>
      <ActionModal open={!!open} onClose={() => setOpen(null)} title="Refund a payment" size="lg">
        {open ? <ChargeRefundPanel mode="provider" orgId={orgId} chargeId={open._id} payerName={payer(open)} /> : null}
      </ActionModal>
    </div>
  );
}

function RefundsTab({ orgId }: { orgId: string }) {
  const [page, setPage] = useState<{ items: Refund[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [releasing, setReleasing] = useState<Refund | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await refundsService.orgRefunds(orgId);
    if (res.success && res.data) setPage(res.data);
    else setError(refundErrorMessage(res.code, res.message));
  }, [orgId]);

  useEffect(() => {
    let active = true;
    refundsService.orgRefunds(orgId).then((res) => {
      if (!active) return;
      if (res.success && res.data) setPage(res.data);
      else setError(refundErrorMessage(res.code, res.message));
    });
    return () => {
      active = false;
    };
  }, [orgId]);

  if (error) return <div role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>{error}</div>;
  if (!page) return <AsyncSpinner />;
  if (page.items.length === 0) return <EmptySlate message="No refunds yet." />;
  return (
    <div className="rounded-(--r-3) px-4.5 py-2" style={card}>
      <ul>
        {page.items.map((r) => (
          <Fragment key={r.id}>
            <RefundRow refund={r} />
            {r.status === "unknown" && r.payment_rail === "provider" ? (
              <li className="pb-2.5 text-[12.5px] list-none" style={{ color: "var(--fg-2)" }}>
                {r.needs_review
                  ? "We still can't find this refund at Paystack. If it is not in your Paystack dashboard, mark it as not sent to free the amount."
                  : REFUND_STATUS.unknown.help}{" "}
                {r.needs_review ? (
                  <button className="underline" onClick={() => setReleasing(r)}>Mark as not sent</button>
                ) : null}
              </li>
            ) : null}
          </Fragment>
        ))}
      </ul>
      <ActionModal
        open={!!releasing}
        onClose={() => setReleasing(null)}
        title="Mark refund as not sent"
        description="Only do this after checking your Paystack dashboard: if the refund is there, it was sent."
        footer={
          <button
            className="btn-primary-v2"
            disabled={busy || !note.trim()}
            onClick={async () => {
              if (!releasing) return;
              setBusy(true);
              const res = await refundsService.orgMarkNotSent(orgId, releasing.id, note.trim());
              setBusy(false);
              if (res.success) {
                setReleasing(null);
                setNote("");
                await load();
              } else setError(refundErrorMessage(res.code, res.message));
            }}
          >
            Mark as not sent
          </button>
        }
      >
        <label className="flex flex-col gap-1.5 text-[13px]" style={{ color: "var(--ink)" }}>
          What did you check?
          <textarea
            value={note}
            maxLength={500}
            rows={3}
            onChange={(e) => setNote(e.target.value)}
            className="rounded-(--r-2) px-3 py-2 text-[14px]"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
          />
        </label>
      </ActionModal>
    </div>
  );
}

function DisputesTab({ orgId, openId }: { orgId: string; openId: string | null }) {
  const [items, setItems] = useState<Dispute[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(openId);

  useEffect(() => {
    let active = true;
    refundsService.orgDisputes(orgId).then((res) => {
      if (!active) return;
      if (res.success && res.data) setItems(res.data.items);
      else setError(refundErrorMessage(res.code, res.message));
    });
    return () => {
      active = false;
    };
  }, [orgId]);

  if (error) return <div role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>{error}</div>;
  if (!items) return <AsyncSpinner />;
  if (items.length === 0) return <EmptySlate message="No disputed payments." />;
  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-(--r-3) overflow-hidden" style={card}>
        <ul>
          {items.map((d) => {
            const t = disputeTone(d);
            return (
              <li key={d.id} style={{ borderTop: "1px solid var(--border)" }}>
                <button
                  className="w-full flex flex-wrap items-center justify-between gap-3 px-4.5 py-3 text-left"
                  onClick={() => setSelected(selected === d.id ? null : d.id)}
                  aria-expanded={selected === d.id}
                >
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                      {d.refund_amount_minor !== null ? formatMinor(d.currency, d.refund_amount_minor) : d.currency} · {d.category ?? "dispute"}
                    </span>
                    <span className="block text-[12px]" style={{ color: "var(--fg-3)" }}>
                      {d.handled_by === "provider" ? "On your Paystack account: you respond in Paystack" : "Binectics is handling it"}
                      {d.due_at && d.open ? ` · respond by ${when(d.due_at)}` : ""}
                    </span>
                  </span>
                  <StatusPill label={t.label} tone={t.tone} />
                </button>
                {selected === d.id ? (
                  <div className="px-4.5 pb-4">
                    <DisputeDetail mode="provider" orgId={orgId} disputeId={d.id} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function PolicyTab({ orgId }: { orgId: string }) {
  const [policy, setPolicy] = useState<RefundPolicy | null>(null);
  const [hours, setHours] = useState("");
  const [percent, setPercent] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    refundsService.getPolicy(orgId).then((res) => {
      if (!active) return;
      if (res.success && res.data) {
        setPolicy(res.data);
        setHours(String(res.data.window_hours));
        setPercent(String(res.data.refund_percent));
      } else setMsg({ ok: false, text: refundErrorMessage(res.code, res.message) });
    });
    return () => {
      active = false;
    };
  }, [orgId]);

  if (!policy && !msg) return <AsyncSpinner />;
  const h = Number(hours);
  const p = Number(percent);
  const valid = Number.isInteger(h) && h >= 0 && h <= 720 && Number.isInteger(p) && p >= 0 && p <= 100;

  return (
    <form
      className="rounded-(--r-3) p-4.5 flex flex-col gap-4 max-w-xl"
      style={card}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!valid) return;
        setBusy(true);
        const res = await refundsService.setPolicy(orgId, { window_hours: h, refund_percent: p });
        setBusy(false);
        if (res.success && res.data) {
          setPolicy(res.data);
          setMsg({ ok: true, text: "Saved. It applies to cancellations from now on." });
        } else setMsg({ ok: false, text: refundErrorMessage(res.code, res.message) });
      }}
    >
      <p className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>
        A member who cancels at least <strong>{valid ? h : "…"} hours</strong> before a paid session gets{" "}
        <strong>{valid ? p : "…"}%</strong> back automatically. Later than that, nothing. When you cancel, the member always gets everything back.
        {policy?.is_default ? " You are on the default: 24 hours, 100%." : ""}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5 text-[13px]" style={{ color: "var(--ink)" }}>
          Hours before the start
          <input
            inputMode="numeric"
            value={hours}
            onChange={(e) => setHours(e.target.value.replace(/[^\d]/g, ""))}
            className="rounded-(--r-2) px-3 py-2 text-[14px]"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px]" style={{ color: "var(--ink)" }}>
          Percent refunded
          <input
            inputMode="numeric"
            value={percent}
            onChange={(e) => setPercent(e.target.value.replace(/[^\d]/g, ""))}
            className="rounded-(--r-2) px-3 py-2 text-[14px]"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
          />
        </label>
      </div>
      {!valid ? (
        <div className="text-[13px]" style={{ color: "var(--danger)" }}>Hours must be 0 to 720 and percent 0 to 100, whole numbers.</div>
      ) : null}
      {msg ? (
        <div role={msg.ok ? "status" : "alert"} className="text-[13px]" style={{ color: msg.ok ? "var(--signal-ink)" : "var(--danger)" }}>{msg.text}</div>
      ) : null}
      <div>
        <button type="submit" className="btn-primary-v2" disabled={!valid || busy}>Save policy</button>
      </div>
    </form>
  );
}
