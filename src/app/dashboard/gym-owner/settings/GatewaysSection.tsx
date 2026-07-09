"use client";

import { useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  useOrgPaymentConfigs,
  useUpsertPaymentConfig,
  useDeletePaymentConfig,
} from "@/lib/queries/marketplace";
import { PaymentGateway } from "@/lib/types";

const GATEWAY_META: Record<string, { label: string; color: string }> = {
  paystack: { label: "Paystack", color: "oklch(0.45 0.18 200)" },
  stripe: { label: "Stripe", color: "oklch(0.42 0.22 280)" },
  flutterwave: { label: "Flutterwave", color: "oklch(0.55 0.15 60)" },
};

const INPUT_STYLE = {
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
  background: "var(--bg)",
  fontFamily: "inherit",
} as const;
const INPUT_CLASS = "rounded-(--r-2) px-3.5 py-2.75 text-[14px]";
const LABEL_CLASS = "font-mono text-[10.5px] uppercase tracking-[0.06em]";

/**
 * Payment gateways card: lists the org's configured gateways (secrets never
 * leave the API — reads return public key + active flag only) with add and
 * remove. Backed by the marketplace payment-config endpoints.
 */
export function GatewaysSection() {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?._id;
  const { data: configs = [], isLoading } = useOrgPaymentConfigs(orgId);
  const upsert = useUpsertPaymentConfig(orgId);
  const remove = useDeletePaymentConfig(orgId);

  const [adding, setAdding] = useState(false);
  const [gateway, setGateway] = useState<string>(PaymentGateway.PAYSTACK);
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const startAdd = () => {
    setAdding(true);
    setError(null);
    setPublicKey("");
    setSecretKey("");
    const unconfigured = Object.values(PaymentGateway).find(
      (g) => !configs.some((c) => c.gateway === g),
    );
    if (unconfigured) setGateway(unconfigured);
  };

  const onSave = async () => {
    if (!publicKey.trim() || !secretKey.trim()) {
      setError("Public and secret key are both required.");
      return;
    }
    setError(null);
    const res = await upsert.mutateAsync({
      gateway,
      public_key: publicKey.trim(),
      secret_key: secretKey.trim(),
      is_active: true,
    });
    if (res.success) {
      setAdding(false);
    } else {
      setError(res.message || "Couldn't save the gateway. Check the keys and try again.");
    }
  };

  return (
    <section id="gateways">
      <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Payment gateways</h2>
      <p className="text-[12.5px] mt-1 mb-4 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>Where your money settles. Your own keys are used for checkout instead of the platform&rsquo;s. Secret keys are encrypted and never shown again.</p>
      <div className="flex flex-col gap-3 p-5.5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {isLoading && <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Loading gateways…</span>}
        {!isLoading && configs.length === 0 && !adding && (
          <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
            No gateways configured — checkout uses the platform&rsquo;s keys. Add your own to settle directly to your account.
          </span>
        )}
        {configs.map((c) => {
          const meta = GATEWAY_META[c.gateway] ?? { label: c.gateway, color: "var(--fg-3)" };
          return (
            <div key={c.gateway} className="flex items-center gap-3 p-3.5 rounded-(--r-2)" style={{ border: "1px solid var(--border)" }}>
              <span className="w-10 h-6.5 rounded-(--r-1) flex items-center justify-center text-[9px] font-bold" style={{ background: meta.color, color: "var(--bg)", fontFamily: "var(--font-mono)" }}>{meta.label}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{meta.label}</div>
                <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.5 truncate" style={{ color: "var(--fg-3)" }}>
                  {c.public_key.slice(0, 14)}…{c.public_key.slice(-4)}
                </div>
              </div>
              {c.is_active && (
                <span className="font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-full" style={{ color: "var(--signal-ink)", background: "var(--signal-soft)" }}>Active</span>
              )}
              <button
                className="btn-ghost-v2 sm"
                disabled={remove.isPending}
                onClick={() => {
                  if (window.confirm(`Remove the ${meta.label} configuration? Checkout falls back to the platform's keys.`)) {
                    void remove.mutateAsync(c.gateway);
                  }
                }}
              >
                Remove
              </button>
            </div>
          );
        })}

        {adding ? (
          <div className="flex flex-col gap-3.5 p-3.5 rounded-(--r-2)" style={{ border: "1px dashed var(--border-2)" }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Gateway</label>
                <select value={gateway} onChange={(e) => setGateway(e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE}>
                  {Object.values(PaymentGateway).map((g) => (
                    <option key={g} value={g}>{GATEWAY_META[g]?.label ?? g}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Public key</label>
                <input value={publicKey} onChange={(e) => setPublicKey(e.target.value)} placeholder="pk_live_…" className={INPUT_CLASS} style={INPUT_STYLE} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Secret key</label>
                <input type="password" value={secretKey} onChange={(e) => setSecretKey(e.target.value)} placeholder="sk_live_…" autoComplete="off" className={INPUT_CLASS} style={INPUT_STYLE} />
              </div>
            </div>
            {error && <span className="text-[12px]" style={{ color: "var(--danger, #b00020)" }}>{error}</span>}
            <div className="flex gap-2">
              <button className="btn-primary-v2 sm" disabled={upsert.isPending} onClick={() => void onSave()}>
                {upsert.isPending ? "Saving…" : "Save gateway"}
              </button>
              <button className="btn-ghost-v2 sm" disabled={upsert.isPending} onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="btn-ghost-v2 sm self-start" disabled={!orgId} onClick={startAdd}>+ Add gateway</button>
        )}
      </div>
    </section>
  );
}
