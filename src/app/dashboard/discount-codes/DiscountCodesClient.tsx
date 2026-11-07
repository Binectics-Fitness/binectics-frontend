"use client";

import { useCallback, useEffect, useState } from "react";
import { WorkspaceShell } from "@/components/ds/WorkspaceShell";
import { AsyncSpinner, EmptySlate, StatusPill } from "@/components/ds";
import { useOrganization } from "@/contexts/OrganizationContext";
import { formatMinor } from "@/lib/currencies/helpers";
import { couponsService, type Coupon, type CouponRedemption } from "@/lib/api/coupons";
import { APPLIES_LABEL, COUPON_STATE_LABEL, couponState, discountLabel, type CouponState } from "@/lib/coupons/couponUi";
import type { Tone } from "@/lib/ui/tones";
import { CreateCodeModal } from "./CreateCodeModal";

const TONE: Record<CouponState, Tone> = { active: "success", inactive: "neutral", expired: "neutral", used_up: "warn" };
const card = { background: "var(--bg)", border: "1px solid var(--border)" } as const;

function when(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

/**
 * /dashboard/discount-codes: the provider's own codes. Owner-only on the API
 * (anyone else gets its refusal); there are no platform codes.
 */
export function DiscountCodesClient() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const orgId = currentOrg?._id ?? null;
  const [rows, setRows] = useState<Coupon[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!orgId) return;
    const res = await couponsService.list(orgId);
    if (res.success && res.data) setRows(res.data);
    else setError(res.message || "We couldn't load your codes.");
  }, [orgId]);

  useEffect(() => {
    // Loading from the API is the external sync this effect is for.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const toggle = async (c: Coupon) => {
    if (!orgId) return;
    const res = c.is_active ? await couponsService.deactivate(orgId, c.id) : await couponsService.activate(orgId, c.id);
    if (res.success && res.data) setRows((rs) => (rs ?? []).map((r) => (r.id === c.id ? res.data! : r)));
    else setError(res.message || "We couldn't change that code.");
  };

  return (
    <WorkspaceShell
      activeItem="Discount codes"
      crumb="Discount codes"
      actions={orgId ? <button type="button" className="btn-primary-v2" onClick={() => setCreating(true)}>New code</button> : undefined}
    >
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Discount codes</h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          You fund every discount: the member pays you less, and Binectics takes no cut either way. One code per purchase.
        </p>
      </div>
      {orgLoading ? (
        <AsyncSpinner />
      ) : !orgId ? (
        <EmptySlate message="Set up your workspace to create codes." />
      ) : error ? (
        <div role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>{error}</div>
      ) : !rows ? (
        <AsyncSpinner />
      ) : rows.length === 0 ? (
        <EmptySlate message="No codes yet. Create one to offer a discount on a membership or a session." />
      ) : (
        <ul className="rounded-(--r-3) overflow-hidden" style={card}>
          {rows.map((c) => (
            <CodeRow key={c.id} orgId={orgId} c={c} onToggle={() => void toggle(c)} />
          ))}
        </ul>
      )}
      {orgId && creating && (
        <CreateCodeModal
          orgId={orgId}
          open
          onClose={() => setCreating(false)}
          onCreated={(c) => {
            setRows((rs) => [c, ...(rs ?? [])]);
            setCreating(false);
          }}
        />
      )}
    </WorkspaceShell>
  );
}

function CodeRow({ orgId, c, onToggle }: { orgId: string; c: Coupon; onToggle: () => void }) {
  const state = couponState(c);
  const [open, setOpen] = useState(false);
  const [uses, setUses] = useState<CouponRedemption[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const show = async () => {
    const next = !open;
    setOpen(next);
    if (next && !uses) {
      const res = await couponsService.redemptions(orgId, c.id);
      if (res.success && res.data) setUses(res.data);
      else setErr(res.message || "We couldn't load the uses.");
    }
  };

  return (
    <li className="px-4.5 py-3.5" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[14px] font-medium tracking-[0.03em]" style={{ color: "var(--ink)" }}>{c.code}</span>
            <StatusPill label={COUPON_STATE_LABEL[state]} tone={TONE[state]} />
          </div>
          <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>
            {discountLabel(c)} · {c.applies_to.map((k) => APPLIES_LABEL[k]).join(" and ")}
            {c.label ? ` · ${c.label}` : ""}
            {c.expires_at ? ` · expires ${when(c.expires_at)}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[13px]" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
            {c.used_count}
            {c.max_redemptions !== null ? ` of ${c.max_redemptions}` : ""} used
          </span>
          <button type="button" className="text-[12.5px] underline" style={{ color: "var(--fg-2)" }} onClick={() => void show()} aria-expanded={open}>
            {open ? "Hide uses" : "Who used it"}
          </button>
          <button type="button" className="btn-ghost-v2 sm" onClick={onToggle}>{c.is_active ? "Switch off" : "Switch on"}</button>
        </div>
      </div>
      {open && (
        <div className="mt-3 text-[13px]" style={{ color: "var(--fg-2)" }}>
          {err ? (
            <span role="alert" style={{ color: "var(--danger)" }}>{err}</span>
          ) : !uses ? (
            <AsyncSpinner />
          ) : uses.length === 0 ? (
            "Not used yet."
          ) : (
            <ul>
              {uses.map((u) => (
                <li key={u.id} className="flex justify-between gap-3 py-1.5" style={{ borderTop: "1px solid var(--border)" }}>
                  <span>{u.member_name} · {u.kind === "booking" ? "Session" : "Membership"} · {when(u.consumed_at)}</span>
                  <span style={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatMinor(u.currency, u.final_amount_minor)} <span style={{ color: "var(--fg-3)" }}>(-{formatMinor(u.currency, u.discount_minor)})</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
