"use client";

import { useId, useMemo, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import { toast } from "@/components/Toast";
import { useOrgPriceCurrencies } from "@/lib/queries/currencies";
import {
  useRefreshProviderCurrencies,
  useRemoveProviderCurrency,
  useVerifyProviderCurrency,
} from "@/lib/queries/marketplace";
import {
  providerCurrencyLocks,
  type ProviderAccountCurrency,
  type ProviderCurrenciesRefreshResult,
} from "@/lib/api/marketplace";
import {
  currencyListPhrase,
  describeCurrencyLock,
  isoCurrencyChoices,
  providerCurrencyMessage,
} from "@/lib/currencies/helpers";

const LABEL_CLASS = "font-mono text-[10.5px] uppercase tracking-[0.06em]";
const PILL_CLASS = "font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-full shrink-0";

function checkedOn(iso: string): string | null {
  const d = new Date(iso);
  if (!iso || Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/**
 * "Currencies on your Paystack account", inside a connected, active gateway
 * card (CURRENCY_MODEL.md, "Provider-account currencies").
 *
 * The platform's currencies are included for everyone. A provider who
 * collects on their OWN Paystack account may add others that account has
 * enabled, for membership plans and packages only (1:1 sessions are charged
 * on the platform account). Nothing is taken on trust: the API checks each
 * code with Paystack using the org's own key and says why when it refuses.
 * The picker offers every ISO code the browser knows, never a hardcoded
 * list of what Paystack accepts.
 */
export function ProviderCurrenciesPanel({
  orgId,
  gateway,
  label,
  currencies,
}: {
  orgId: string;
  gateway: string;
  /** Display name of the gateway, e.g. "Paystack". */
  label: string;
  /** Verified on this gateway's config (GET .../payment-config). */
  currencies: ProviderAccountCurrency[];
}) {
  const fieldId = useId();
  const priceCurrencies = useOrgPriceCurrencies(orgId);
  const verify = useVerifyProviderCurrency(orgId);
  const remove = useRemoveProviderCurrency(orgId);
  const refresh = useRefreshProviderCurrencies(orgId);

  const [adding, setAdding] = useState(false);
  const [code, setCode] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [locked, setLocked] = useState<{ code: string; message: string; holds: string } | null>(null);
  const [refreshed, setRefreshed] = useState<ProviderCurrenciesRefreshResult | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const added = new Set(currencies.map((c) => c.code));
  const rows = priceCurrencies.data ?? [];
  const platform = rows.filter((c) => c.selectable && c.route === "platform" && !added.has(c.code));
  const platformCodes = new Set(platform.map((c) => c.code));
  const rowOf = (c: string) => rows.find((r) => r.code === c);

  const isoChoices = useMemo(() => isoCurrencyChoices(), []);
  const addOptions = isoChoices
    .filter((c) => !added.has(c.code) && !platformCodes.has(c.code))
    .map((c) => ({ label: c.name === c.code ? c.code : `${c.code}, ${c.name}`, value: c.code }));

  const startAdd = () => {
    setAdding(true);
    setCode("");
    setAddError(null);
  };

  const onAdd = async () => {
    const next = code.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(next)) {
      setAddError("Choose a currency, or type its three-letter code.");
      return;
    }
    setAddError(null);
    const res = await verify.mutateAsync({ gateway, code: next });
    if (res.success) {
      setAdding(false);
      setLocked(null);
      toast.success(`${next} added. You can price membership plans in it now.`);
    } else {
      setAddError(providerCurrencyMessage(res, label, next));
    }
  };

  const onRemove = async (c: string) => {
    if (
      !window.confirm(
        `Remove ${c}? You won't be able to price new membership plans in ${c} unless Binectics takes it.`,
      )
    ) {
      return;
    }
    setLocked(null);
    const res = await remove.mutateAsync({ gateway, code: c });
    if (res.success) {
      toast.success(`${c} removed.`);
      return;
    }
    if (res.code === "CURRENCY_LOCKED") {
      setLocked({
        code: c,
        message: res.message ?? `Plans or payments depend on ${c}.`,
        holds: describeCurrencyLock(providerCurrencyLocks(res)[c]),
      });
      return;
    }
    toast.error(providerCurrencyMessage(res, label, c));
  };

  const onRefresh = async () => {
    setRefreshError(null);
    setRefreshed(null);
    const res = await refresh.mutateAsync(gateway);
    if (res.success && res.data) {
      setRefreshed(res.data);
      toast.success(`Checked with ${label}.`);
    } else {
      setRefreshError(providerCurrencyMessage(res, label));
    }
  };

  return (
    <div className="flex flex-col gap-3 pt-3 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
            Currencies on your {label} account
          </div>
          <p className="text-[12px] mt-0.5 max-w-[60ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>
            For membership plans and packages. Add a currency your {label} account has enabled and we&rsquo;ll check it
            with {label}. 1:1 sessions are charged by Binectics, so they use Binectics currencies only.
          </p>
        </div>
        {currencies.length > 0 && (
          <button
            type="button"
            className="btn-ghost-v2 sm"
            disabled={refresh.isPending}
            onClick={() => void onRefresh()}
          >
            {refresh.isPending ? "Checking…" : `Check again with ${label}`}
          </button>
        )}
      </div>

      {priceCurrencies.isLoading ? (
        <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Loading currencies…</span>
      ) : priceCurrencies.isError ? (
        <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
          We couldn&rsquo;t load your currencies. Try again shortly.
        </span>
      ) : (
        <ul className="flex flex-col gap-1.5" aria-label={`Currencies on your ${label} account`}>
          {platform.map((c) => (
            <li key={c.code} className="flex flex-wrap items-center gap-2.5 py-1">
              <span className="font-mono text-[12.5px] w-10" style={{ color: "var(--ink)" }}>{c.code}</span>
              <span className="flex-1 min-w-0 text-[12.5px] truncate" style={{ color: "var(--fg-2)" }}>{c.name}</span>
              <span className={PILL_CLASS} style={{ color: "var(--fg-2)", background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                From Binectics
              </span>
            </li>
          ))}
          {currencies.map((c) => {
            const row = rowOf(c.code);
            const when = checkedOn(c.verified_at);
            const blocked = row && !row.selectable ? row.reasons.map((r) => r.message).join(". ") : null;
            return (
              <li key={c.code} className="flex flex-col gap-1 py-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-[12.5px] w-10" style={{ color: "var(--ink)" }}>{c.code}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12.5px] truncate" style={{ color: "var(--fg-2)" }}>{row?.name ?? c.code}</div>
                    <div className="text-[11.5px]" style={{ color: "var(--fg-3)" }}>
                      {when ? `Checked with ${label} on ${when}` : `Checked with ${label}`}
                    </div>
                  </div>
                  <span className={PILL_CLASS} style={{ color: "var(--signal-ink)", background: "var(--signal-soft)" }}>
                    Your account
                  </span>
                  <button
                    type="button"
                    className="btn-ghost-v2 sm"
                    disabled={remove.isPending}
                    onClick={() => void onRemove(c.code)}
                    aria-label={`Remove ${c.code}`}
                  >
                    Remove
                  </button>
                </div>
                {blocked && (
                  <span className="text-[11.5px] leading-snug" style={{ color: "var(--fg-3)" }}>
                    Not usable for new prices right now: {blocked}
                  </span>
                )}
                {locked?.code === c.code && (
                  <div
                    role="alert"
                    className="text-[12px] leading-relaxed rounded-(--r-2) px-3 py-2"
                    style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}
                  >
                    <div>{locked.message}</div>
                    {locked.holds && (
                      <div className="mt-0.5" style={{ color: "var(--fg-2)" }}>Depends on {c.code}: {locked.holds}.</div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
          {platform.length === 0 && currencies.length === 0 && (
            <li className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>No currencies yet.</li>
          )}
        </ul>
      )}

      {refreshError && (
        <span role="alert" className="text-[12px]" style={{ color: "var(--danger)" }}>{refreshError}</span>
      )}
      {refreshed && (
        <div role="status" className="text-[12px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
          {refreshed.removed.length === 0 && refreshed.missing_on_account.length === 0 ? (
            <span>Every currency is still enabled on your {label} account.</span>
          ) : (
            <>
              {refreshed.removed.length > 0 && (
                <div>
                  Removed {currencyListPhrase(refreshed.removed)}: no longer enabled on your {label} account.
                </div>
              )}
              {refreshed.missing_on_account.length > 0 && (
                <div>
                  {currencyListPhrase(refreshed.missing_on_account)} {refreshed.missing_on_account.length === 1 ? "is" : "are"} no
                  longer enabled on your {label} account, but plans or payments still use{" "}
                  {refreshed.missing_on_account.length === 1 ? "it" : "them"}. Enable{" "}
                  {refreshed.missing_on_account.length === 1 ? "it" : "them"} with {label} again, or move those plans to
                  another currency.
                </div>
              )}
            </>
          )}
        </div>
      )}

      {adding ? (
        <div className="flex flex-col gap-2.5 p-3.5 rounded-(--r-2)" style={{ border: "1px dashed var(--border-2)" }}>
          <label htmlFor={fieldId} className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Currency to add</label>
          {addOptions.length > 0 ? (
            <SearchableSelect
              id={fieldId}
              name="providerCurrency"
              value={code}
              onChange={(v) => setCode(v)}
              options={addOptions}
              placeholder="Search currencies"
            />
          ) : (
            <input
              id={fieldId}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={3}
              placeholder="e.g. GHS"
              autoComplete="off"
              className="rounded-(--r-2) px-3.5 py-2.75 text-[14px] w-32 font-mono"
              style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)" }}
            />
          )}
          {addError && (
            <span role="alert" className="text-[12px]" style={{ color: "var(--danger)" }}>{addError}</span>
          )}
          <div className="flex gap-2">
            <button type="button" className="btn-primary-v2 sm" disabled={verify.isPending} onClick={() => void onAdd()}>
              {verify.isPending ? `Checking with ${label}…` : "Check and add"}
            </button>
            <button type="button" className="btn-ghost-v2 sm" disabled={verify.isPending} onClick={() => setAdding(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn-ghost-v2 sm self-start" onClick={startAdd}>
          + Add a currency
        </button>
      )}
    </div>
  );
}
