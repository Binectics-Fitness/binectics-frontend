"use client";

import { useState } from "react";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  useOrgPaymentConfigs,
  useUpsertPaymentConfig,
  useDeletePaymentConfig,
} from "@/lib/queries/marketplace";
import { usePaymentGateways } from "@/lib/queries/currencies";
import { GATEWAY_NOT_SUPPORTED } from "@/lib/api/paymentGateways";
import SearchableSelect from "@/components/SearchableSelect";
import { toast } from "@/components/Toast";
import { providerCurrencyMessage } from "@/lib/currencies/helpers";
import { ProviderCurrenciesPanel } from "./ProviderCurrenciesPanel";

/** "stripe" -> "Stripe", for a saved gateway the API no longer lists. */
function titleCase(id: string): string {
  return id ? id.charAt(0).toUpperCase() + id.slice(1) : id;
}

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
 * leave the API; reads return public key + active flag only) with add and
 * remove. Backed by the marketplace payment-config endpoints.
 *
 * The gateways a provider may connect come from GET /payment-gateways
 * (`provider_keys_supported`), never a client list. A saved config for any
 * other gateway (Stripe or Flutterwave keys from before) is shown as no
 * longer supported, with Remove; the API refuses to save one
 * (GATEWAY_NOT_SUPPORTED) and still allows deleting it.
 *
 * A connected, active gateway also lists the currencies its account can take
 * (ProviderCurrenciesPanel): the platform's, plus ones the provider adds and
 * the API checks with the gateway. Used by gyms, trainers and dietitians:
 * every org that sells membership plans can collect on its own keys.
 */
export function GatewaysSection({
  title = "Payment gateways",
  description = "Where your money settles. Your own keys are used for checkout instead of the platform\u2019s. Secret keys are encrypted and never shown again.",
}: {
  title?: string;
  description?: string;
} = {}) {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?._id;
  const { data: configs = [], isLoading } = useOrgPaymentConfigs(orgId);
  const upsert = useUpsertPaymentConfig(orgId);
  const remove = useDeletePaymentConfig(orgId);
  const gateways = usePaymentGateways();
  const connectable = (gateways.data ?? []).filter((g) => g.provider_keys_supported);
  const labelOf = (id: string) =>
    (gateways.data ?? []).find((g) => g.gateway === id)?.label ?? titleCase(id);
  const isSupported = (id: string) => connectable.some((g) => g.gateway === id);
  const addable = connectable.filter((g) => !configs.some((c) => c.gateway === g.gateway));

  const [adding, setAdding] = useState(false);
  const [gateway, setGateway] = useState<string>("");
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const startAdd = () => {
    setAdding(true);
    setError(null);
    setPublicKey("");
    setSecretKey("");
    setGateway(addable[0]?.gateway ?? "");
  };

  const onSave = async () => {
    if (!gateway) {
      setError("Choose a payment provider.");
      return;
    }
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
    } else if (res.code === GATEWAY_NOT_SUPPORTED) {
      // The API names what can be connected ("You can't connect Stripe
      // yet. You can connect Paystack."); refresh the list it came from.
      setError(res.message || `You can't connect ${labelOf(gateway)} yet.`);
      void gateways.refetch();
    } else if (res.code === "PROVIDER_ACCOUNT_CHECK_FAILED") {
      // New keys re-check the currencies added on the account (5xx copy is
      // hidden in production, so this keys off the code).
      setError(providerCurrencyMessage(res, labelOf(gateway)));
    } else {
      setError(res.message || "Couldn't save the gateway. Check the keys and try again.");
    }
  };

  const onRemove = async (id: string, label: string) => {
    if (!window.confirm(`Remove the ${label} configuration? Checkout falls back to the platform's keys.`)) return;
    const res = await remove.mutateAsync(id);
    // 409 CURRENCY_LOCKED: plans or payments rest on a currency only this
    // account can take. The server says what to do first.
    if (res && res.success === false) {
      toast.error(res.message || `We couldn't remove ${label}. Try again.`);
    }
  };

  return (
    <section id="gateways">
      <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>{title}</h2>
      <p className="text-[12.5px] mt-1 mb-4 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>{description}</p>
      <div className="flex flex-col gap-3 p-5.5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {isLoading && <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Loading gateways…</span>}
        {!isLoading && configs.length === 0 && !adding && (
          <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
            No gateways configured, checkout uses the platform&rsquo;s keys. Add your own to settle directly to your account.
          </span>
        )}
        {configs.map((c) => {
          const label = labelOf(c.gateway);
          // Only judge "no longer supported" once the list has loaded.
          const legacy = gateways.isSuccess && !isSupported(c.gateway);
          return (
            <div key={c.gateway} className="flex flex-col p-3.5 rounded-(--r-2)" style={{ border: "1px solid var(--border)" }}>
            <div className="flex flex-wrap items-center gap-3">
              <span className="min-w-10 h-6.5 px-1.5 rounded-(--r-1) flex items-center justify-center text-[9px] font-bold uppercase" style={{ background: "var(--bg-2)", color: "var(--ink)", border: "1px solid var(--border)", fontFamily: "var(--font-mono)" }}>{label.slice(0, 2)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{label}</div>
                {legacy ? (
                  <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                    We can&rsquo;t take payments on {label}. Remove these keys.
                  </div>
                ) : (
                  <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.5 truncate" style={{ color: "var(--fg-3)" }}>
                    {c.public_key.slice(0, 14)}…{c.public_key.slice(-4)}
                  </div>
                )}
              </div>
              {legacy ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-full" style={{ color: "var(--fg-2)", background: "var(--bg-2)", border: "1px solid var(--border)" }}>No longer supported</span>
              ) : c.is_active ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-full" style={{ color: "var(--signal-ink)", background: "var(--signal-soft)" }}>Active</span>
              ) : null}
              <button
                className="btn-ghost-v2 sm"
                disabled={remove.isPending}
                onClick={() => void onRemove(c.gateway, label)}
              >
                Remove
              </button>
            </div>
            {!legacy && c.is_active && gateways.isSuccess && orgId && (
              <ProviderCurrenciesPanel
                orgId={orgId}
                gateway={c.gateway}
                label={label}
                currencies={c.currencies ?? []}
              />
            )}
            </div>
          );
        })}

        {adding ? (
          <div className="flex flex-col gap-3.5 p-3.5 rounded-(--r-2)" style={{ border: "1px dashed var(--border-2)" }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Gateway</label>
                <SearchableSelect
                  value={gateway}
                  onChange={(v) => setGateway(v)}
                  options={addable.map((g) => ({ label: g.label, value: g.gateway }))}
                />
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
        ) : gateways.isError ? (
          <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
            We couldn&rsquo;t load the payment providers you can connect. Try again shortly.
          </span>
        ) : addable.length > 0 ? (
          <button className="btn-ghost-v2 sm self-start" disabled={!orgId} onClick={startAdd}>+ Add gateway</button>
        ) : null}
      </div>
    </section>
  );
}
