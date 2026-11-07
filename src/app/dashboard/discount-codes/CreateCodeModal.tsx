"use client";

import { useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import SearchableSelect from "@/components/SearchableSelect";
import { MoneyInput } from "@/components/ds/MoneyInput";
import { useOrgPriceCurrencies } from "@/lib/queries/currencies";
import { orgPriceOptions } from "@/lib/currencies/helpers";
import {
  couponsService,
  CouponDiscountType,
  CouponKind,
  type Coupon,
  type CreateCouponInput,
} from "@/lib/api/coupons";
import { isValidCodeText } from "@/lib/coupons/couponUi";

const field = { border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" } as const;

interface Props {
  orgId: string;
  open: boolean;
  onClose: () => void;
  onCreated: (c: Coupon) => void;
}

/**
 * New discount code. The shared Modal asks before discarding typed input
 * (useUnsavedChangesGuard). Fixed amounts are per currency and never
 * converted; a percentage works in any currency.
 */
export function CreateCodeModal({ orgId, open, onClose, onCreated }: Props) {
  const { data: currencies } = useOrgPriceCurrencies(orgId);
  const options = orgPriceOptions(currencies);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<CouponDiscountType>(CouponDiscountType.PERCENT);
  const [percent, setPercent] = useState("10");
  const [currency, setCurrency] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");
  const [amountMinor, setAmountMinor] = useState<number | null>(null);
  const [kinds, setKinds] = useState<CouponKind[]>([CouponKind.MEMBERSHIP, CouponKind.BOOKING]);
  const [expires, setExpires] = useState("");
  const [cap, setCap] = useState("");
  const [perPerson, setPerPerson] = useState("1");
  // Local calendar day, read once: an expiry is the end of that day.
  const [today] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pct = Number(percent);
  const capN = cap === "" ? null : Number(cap);
  const per = Number(perPerson);
  const problems: string[] = [];
  if (!isValidCodeText(code)) problems.push("A code is 3 to 20 letters and digits.");
  if (type === CouponDiscountType.PERCENT && !(Number.isInteger(pct) && pct >= 1 && pct <= 100)) problems.push("Percent is a whole number from 1 to 100.");
  if (type === CouponDiscountType.FIXED && (!currency || !amountMinor || amountMinor < 1)) problems.push("Choose a currency and an amount.");
  if (kinds.length === 0) problems.push("Pick what the code works on.");
  if (capN !== null && !(Number.isInteger(capN) && capN >= 1)) problems.push("The total limit is a whole number of 1 or more.");
  if (!(Number.isInteger(per) && per >= 1 && per <= 10)) problems.push("Per-person limit is 1 to 10.");
  if (expires && expires < today) problems.push("The expiry date must be in the future.");

  const toggle = (k: CouponKind) => setKinds((ks) => (ks.includes(k) ? ks.filter((x) => x !== k) : [...ks, k]));

  const save = async () => {
    if (problems.length || busy) return;
    setBusy(true);
    setError(null);
    const input: CreateCouponInput = {
      ...(code ? { code } : {}),
      ...(label.trim() ? { label: label.trim() } : {}),
      discount_type: type,
      ...(type === CouponDiscountType.PERCENT
        ? { percent_off: pct }
        : { amounts_minor: [{ currency, amount_minor: amountMinor as number }] }),
      applies_to: kinds,
      ...(expires ? { expires_at: new Date(`${expires}T23:59:59`).toISOString() } : {}),
      ...(capN !== null ? { max_redemptions: capN } : {}),
      max_per_user: per,
    };
    const res = await couponsService.create(orgId, input);
    setBusy(false);
    if (res.success && res.data) onCreated(res.data);
    else setError(res.code === undefined && res.status === 409 ? "You already have a code with that name." : res.message || "We couldn't save the code.");
  };

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="New discount code"
      description="Members enter the code at checkout. It only works on your own memberships and sessions."
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost-v2" onClick={onClose} disabled={busy}>Cancel</button>
          <button type="button" className="btn-primary-v2" onClick={() => void save()} disabled={busy || problems.length > 0}>
            {busy ? "Saving..." : "Create code"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4 text-[13px]" style={{ color: "var(--ink)" }}>
        <label className="flex flex-col gap-1.5">
          Code <span style={{ color: "var(--fg-3)" }}>Leave empty to generate one.</span>
          <input value={code} onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20))} className="rounded-(--r-2) px-3 py-2 text-[14px] uppercase" style={field} placeholder="WELCOME10" />
        </label>
        <label className="flex flex-col gap-1.5">
          Label <span style={{ color: "var(--fg-3)" }}>For you only.</span>
          <input value={label} maxLength={120} onChange={(e) => setLabel(e.target.value)} className="rounded-(--r-2) px-3 py-2 text-[14px]" style={field} />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1">Discount</legend>
          <div className="flex gap-2">
            {([CouponDiscountType.PERCENT, CouponDiscountType.FIXED] as const).map((t) => (
              <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(t)} className="font-mono text-[11px] uppercase tracking-[0.04em] px-3 py-1.5 rounded-full" style={{ background: type === t ? "var(--ink)" : "var(--bg)", color: type === t ? "var(--bg)" : "var(--fg-3)", border: "1px solid var(--border)" }}>
                {t === CouponDiscountType.PERCENT ? "Percentage" : "Fixed amount"}
              </button>
            ))}
          </div>
          {type === CouponDiscountType.PERCENT ? (
            <label className="flex flex-col gap-1.5">
              Percent off
              <input inputMode="numeric" value={percent} onChange={(e) => setPercent(e.target.value.replace(/[^\d]/g, ""))} className="rounded-(--r-2) px-3 py-2 text-[14px]" style={field} />
            </label>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                Currency
                <SearchableSelect value={currency} onChange={setCurrency} options={options} placeholder={currencies ? "Choose currency" : "Loading..."} />
              </div>
              <div className="flex flex-col gap-1.5">
                Amount off
                {currency ? (
                  <MoneyInput currency={currency} value={amountDisplay} onChange={(d, m) => { setAmountDisplay(d); setAmountMinor(m); }} className="rounded-(--r-2) px-3 py-2 text-[14px]" style={field} />
                ) : (
                  <span style={{ color: "var(--fg-3)" }}>Choose a currency first.</span>
                )}
              </div>
              <p className="sm:col-span-2" style={{ color: "var(--fg-3)" }}>A fixed code only works for prices in this currency. A price is never charged below the payment gateway&apos;s minimum.</p>
            </div>
          )}
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1">Works on</legend>
          <div className="flex gap-4">
            {([CouponKind.MEMBERSHIP, CouponKind.BOOKING] as const).map((k) => (
              <label key={k} className="flex items-center gap-2">
                <input type="checkbox" checked={kinds.includes(k)} onChange={() => toggle(k)} />
                {k === CouponKind.MEMBERSHIP ? "Memberships" : "Sessions"}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="flex flex-col gap-1.5">
            Expires <span style={{ color: "var(--fg-3)" }}>Optional</span>
            <input type="date" min={today} value={expires} onChange={(e) => setExpires(e.target.value)} className="rounded-(--r-2) px-3 py-2 text-[14px]" style={field} />
          </label>
          <label className="flex flex-col gap-1.5">
            Total uses <span style={{ color: "var(--fg-3)" }}>Optional</span>
            <input inputMode="numeric" value={cap} onChange={(e) => setCap(e.target.value.replace(/[^\d]/g, ""))} className="rounded-(--r-2) px-3 py-2 text-[14px]" style={field} placeholder="No limit" />
          </label>
          <label className="flex flex-col gap-1.5">
            Per member
            <input inputMode="numeric" value={perPerson} onChange={(e) => setPerPerson(e.target.value.replace(/[^\d]/g, ""))} className="rounded-(--r-2) px-3 py-2 text-[14px]" style={field} />
          </label>
        </div>

        {problems.length > 0 && (code || cap || expires || type === CouponDiscountType.FIXED) && (
          <ul className="text-[12.5px]" style={{ color: "var(--danger)" }}>{problems.map((p) => <li key={p}>{p}</li>)}</ul>
        )}
        {error && <div role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>{error}</div>}
      </div>
    </ActionModal>
  );
}
