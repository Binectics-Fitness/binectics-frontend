"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import {
  AsyncSpinner,
  EmptySlate,
  FilterPill,
  StatusPill,
  Tooltip,
  DSTable,
  DSTableHead,
  DSTableTh,
  DSTableRow,
  DSTableTd,
} from "@/components/ds";
import Modal from "@/components/Modal";
import { toast } from "@/components/Toast";
import {
  adminService,
  ADMIN_CURRENCY_USES,
  type AdminCurrency,
  type AdminCurrencyUse,
  type CurrencyInFlight,
  type PaymentMethodCode,
} from "@/lib/api/admin";
import { queryKeys } from "@/lib/queries/keys";
import { writeErrorMessage } from "@/lib/currencies/helpers";
import {
  currencyPatch,
  describeInFlight,
  draftOf,
  plural,
  type CurrencyDraft,
} from "@/lib/currencies/adminCurrency";

/**
 * Admin: the platform currency list (GET/PATCH /admin/currencies).
 *
 * A currency can be priced and paid only when it is offered on the platform
 * AND a payment provider we use can charge it AND that provider has it
 * switched on for our account. The API computes the result per use; this
 * page shows it with every reason, and edits the inputs an admin owns.
 */

const USE_LABEL: Record<AdminCurrencyUse, string> = {
  price: "Prices",
  charge_card: "Card",
  charge_transfer: "Transfer",
  provider_billing: "Provider billing",
};

const METHOD_LABEL: Record<PaymentMethodCode, string> = {
  card: "Card",
  bank_transfer: "Bank transfer",
};

type Filter = "enabled" | "all";

function liveTotal(c: AdminCurrency): number {
  const l = c.usage.live;
  return l.organizations + l.session_types + l.plans + l.listings;
}

function UseChip({ currency, use }: { currency: AdminCurrency; use: AdminCurrencyUse }) {
  const effect = currency.effective[use];
  if (!effect) return <span style={{ color: "var(--fg-4)" }}>-</span>;
  if (effect.selectable) return <StatusPill variant="confirmed" label="On" />;
  const [first, ...rest] = effect.reasons;
  const chip = (
    <span
      tabIndex={0}
      className="inline-flex flex-col items-start gap-1 outline-none"
      aria-label={`${USE_LABEL[use]} off: ${effect.reasons.map((r) => r.message).join(". ")}`}
    >
      <StatusPill variant="done" label="Off" />
      {first && (
        <span className="text-[11.5px] leading-snug max-w-[22ch]" style={{ color: "var(--fg-3)" }}>
          {first.message}
          {rest.length > 0 ? ` (+${rest.length})` : ""}
        </span>
      )}
    </span>
  );
  if (effect.reasons.length === 0) return chip;
  return (
    <Tooltip
      content={
        <ul className="flex flex-col gap-1">
          {effect.reasons.map((r) => (
            <li key={r.code}>{r.message}</li>
          ))}
        </ul>
      }
    >
      {chip}
    </Tooltip>
  );
}

function GatewayCell({ currency }: { currency: AdminCurrency }) {
  if (currency.gateways.length === 0) return <span style={{ color: "var(--fg-3)" }}>None</span>;
  return (
    <div className="flex flex-col gap-1">
      {currency.gateways.map((g) => (
        <div key={g.gateway} className="text-[12.5px] leading-snug">
          <span style={{ color: "var(--ink)" }}>{g.label}</span>
          <span style={{ color: "var(--fg-3)" }}>
            {!g.capable
              ? " · can't charge it"
              : g.account_enabled
                ? ` · on our account${g.methods.length ? ` (${g.methods.map((m) => METHOD_LABEL[m] ?? m).join(", ")})` : ""}`
                : " · not on our account"}
          </span>
        </div>
      ))}
    </div>
  );
}

function UsageCell({ currency }: { currency: AdminCurrency }) {
  const u = currency.usage;
  const live = liveTotal(currency);
  const title =
    `${u.live.organizations} orgs, ${u.live.session_types} sessions, ${u.live.plans} plans, ${u.live.listings} listings. ` +
    `${describeInFlight(u.in_flight) || "Nothing"} in progress. ${u.historical.transactions} transactions.`;
  return (
    <div className="text-[12.5px] leading-snug font-mono" title={title} style={{ color: "var(--fg-2)" }}>
      <div>{plural(live, "price")}</div>
      <div style={{ color: u.in_flight_total > 0 ? "var(--ink)" : undefined }}>{u.in_flight_total} in progress</div>
      <div>{plural(u.historical.transactions, "payment")} recorded</div>
    </div>
  );
}

// ─── Edit ───────────────────────────────────────────────────────────────────

type Draft = CurrencyDraft;

function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer" style={{ opacity: disabled ? 0.5 : 1 }}>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <span
        aria-hidden
        className="relative inline-block w-7 h-4 rounded-full shrink-0 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
        style={{ background: checked ? "var(--ink)" : "var(--border-2)", transition: "background var(--motion-fast)" }}
      >
        <span
          className="absolute top-0.5 w-3 h-3 rounded-full"
          style={{ background: "var(--bg)", left: checked ? "14px" : "2px", transition: "left var(--motion-fast)" }}
        />
      </span>
      <span className="text-[13.5px]" style={{ color: "var(--ink)" }}>{label}</span>
    </label>
  );
}

const inputClass = "h-9 w-full rounded-(--r-2) px-3 text-[13.5px]";
const inputStyle = { background: "var(--bg)", border: "1px solid var(--border-2)", color: "var(--ink)" };
const labelClass = "font-mono text-[10.5px] uppercase tracking-[0.06em]";

function EditCurrencyModal({
  currency,
  onClose,
  onSaved,
}: {
  currency: AdminCurrency;
  onClose: () => void;
  onSaved: (row: AdminCurrency) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => draftOf(currency));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inUse, setInUse] = useState<{ message: string; inFlight?: CurrencyInFlight; usesLost: string[] } | null>(null);

  const setGateway = (id: string, next: Partial<Draft["gateways"][string]>) =>
    setDraft((d) => ({ ...d, gateways: { ...d.gateways, [id]: { ...d.gateways[id], ...next } } }));

  const save = async (stopNewPayments = false) => {
    const patch = currencyPatch(currency, draft);
    if (Object.keys(patch).length === 0) {
      onClose();
      return;
    }
    setSaving(true);
    setError(null);
    const res = await adminService.updateCurrency(currency.code, {
      ...patch,
      ...(stopNewPayments ? { stop_new_payments: true } : {}),
    });
    setSaving(false);
    if (res.success && res.data) {
      onSaved(res.data);
      return;
    }
    if (res.status === 409 && res.code === "CURRENCY_IN_USE" && !stopNewPayments) {
      setInUse({
        message: res.message ?? "",
        inFlight: res.details?.in_flight as CurrencyInFlight | undefined,
        usesLost: Array.isArray(res.details?.uses_lost) ? (res.details!.uses_lost as string[]) : [],
      });
      return;
    }
    setInUse(null);
    setError(writeErrorMessage(res, "We couldn't save this currency. Try again."));
  };

  const footer = inUse ? (
    <>
      <button type="button" className="btn-ghost-v2 sm" onClick={() => setInUse(null)} disabled={saving}>
        Keep it on
      </button>
      <button
        type="button"
        className="btn-ghost-v2 sm"
        style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
        onClick={() => void save(true)}
        disabled={saving}
      >
        {saving ? "Saving..." : "Stop new payments now"}
      </button>
    </>
  ) : (
    <>
      <button type="button" className="btn-ghost-v2 sm" onClick={onClose} disabled={saving}>
        Cancel
      </button>
      <button type="button" className="btn-primary-v2 sm" onClick={() => void save()} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </button>
    </>
  );

  return (
    <Modal open onClose={onClose} title={`${currency.code}, ${currency.name}`} footer={footer} size="lg">
      {inUse ? (
        <div className="flex flex-col gap-3" role="alert">
          <p className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
            Payments in {currency.code} are in progress.
          </p>
          <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
            {describeInFlight(inUse.inFlight) || "Some payments"} would be affected. This change turns off{" "}
            {inUse.usesLost.map((u) => USE_LABEL[u as AdminCurrencyUse]?.toLowerCase() ?? u).join(", ") || "this currency"}.
          </p>
          <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
            Stopping new payments takes effect at once. Payments already in progress still complete in {currency.code}.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <Switch
            label="Offered on the platform"
            checked={draft.platform_enabled}
            onChange={(v) => setDraft((d) => ({ ...d, platform_enabled: v }))}
          />

          <section className="flex flex-col gap-3">
            <div className={labelClass} style={{ color: "var(--fg-3)" }}>Payment providers</div>
            {currency.gateways.length === 0 && (
              <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>No payment provider is set up for this currency.</p>
            )}
            {currency.gateways.map((g) => {
              const d = draft.gateways[g.gateway];
              return (
                <div
                  key={g.gateway}
                  className="flex flex-col gap-2.5 rounded-(--r-2) p-3.5"
                  style={{ border: "1px solid var(--border)" }}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{g.label}</span>
                    <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                      {g.capable ? `Can charge ${currency.code}` : `Can't charge ${currency.code}`}
                    </span>
                  </div>
                  {g.capable ? (
                    <>
                      <Switch
                        label="Enabled on our account"
                        checked={d.account_enabled}
                        onChange={(v) => setGateway(g.gateway, { account_enabled: v })}
                      />
                      <div className="flex flex-wrap gap-4 pl-9.5">
                        {g.capable_methods.map((m) => (
                          <label key={m} className="flex items-center gap-2 text-[13px]" style={{ color: "var(--ink)" }}>
                            <input
                              type="checkbox"
                              checked={d.methods.includes(m)}
                              onChange={(e) =>
                                setGateway(g.gateway, {
                                  methods: e.target.checked
                                    ? [...d.methods, m]
                                    : d.methods.filter((x) => x !== m),
                                })
                              }
                            />
                            {METHOD_LABEL[m] ?? m}
                          </label>
                        ))}
                      </div>
                      <p className="text-[12px] leading-relaxed" style={{ color: "var(--fg-3)" }}>
                        Turn this on only once {g.label} has confirmed {currency.code} on our account.
                      </p>
                    </>
                  ) : (
                    <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                      {g.label} doesn&apos;t support {currency.code}, so it can&apos;t be switched on.
                    </p>
                  )}
                </div>
              );
            })}
          </section>

          <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={labelClass} style={{ color: "var(--fg-3)" }}>Name</span>
              <input
                value={draft.name}
                maxLength={80}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                className={inputClass}
                style={inputStyle}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={labelClass} style={{ color: "var(--fg-3)" }}>Symbol</span>
              <input
                value={draft.symbol}
                maxLength={10}
                onChange={(e) => setDraft((d) => ({ ...d, symbol: e.target.value }))}
                className={inputClass}
                style={inputStyle}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className={labelClass} style={{ color: "var(--fg-3)" }}>Notes</span>
            <textarea
              value={draft.notes}
              maxLength={500}
              rows={3}
              placeholder="Why it is on or off, e.g. waiting on Paystack to enable GHS"
              onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
              className="w-full rounded-(--r-2) px-3 py-2 text-[13.5px]"
              style={inputStyle}
            />
          </label>
          <p className="text-[12px]" style={{ color: "var(--fg-3)" }}>
            {currency.minor_unit === 0
              ? `${currency.code} has no minor unit.`
              : `${currency.code} has ${currency.minor_unit} decimal places.`}{" "}
            This comes from ISO 4217 and can&apos;t be changed.
          </p>
          {error && (
            <p role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminCurrenciesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery<AdminCurrency[]>({
    queryKey: queryKeys.currencies.admin(),
    queryFn: async () => {
      const res = await adminService.listCurrencies();
      if (!res.success || !res.data) throw new Error(res.message || "We couldn't load currencies.");
      return res.data;
    },
  });
  const [filter, setFilter] = useState<Filter>("enabled");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminCurrency | null>(null);

  const all = useMemo(() => data ?? [], [data]);
  const enabledCount = all.filter((c) => c.platform_enabled).length;
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter(
      (c) =>
        (filter === "all" || c.platform_enabled) &&
        (!q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)),
    );
  }, [all, filter, search]);

  const onSaved = (row: AdminCurrency) => {
    queryClient.setQueryData<AdminCurrency[]>(queryKeys.currencies.admin(), (prev) =>
      (prev ?? []).map((c) => (c.code === row.code ? row : c)),
    );
    // Pickers across the app read the public list; refresh it too.
    void queryClient.invalidateQueries({ queryKey: queryKeys.currencies.list() });
    setEditing(null);
    toast.success(`${row.code} saved.`);
  };

  return (
    <>
    <AdminDashboardShell activeItem="Currencies" crumb="Currencies">
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
          Currencies
        </h1>
        <p className="text-[13.5px] mt-1.5 max-w-[68ch]" style={{ color: "var(--fg-3)" }}>
          A currency can be priced and paid only when it is offered on the platform, a payment provider we use can
          charge it, and that provider has it switched on for our account. Each column shows the result and why.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search code or name"
          aria-label="Search currencies"
          className="h-9 w-full sm:w-64 rounded-(--r-2) px-3 text-[13.5px]"
          style={inputStyle}
        />
        <div className="flex items-center gap-2">
          <FilterPill label="Enabled" count={enabledCount} active={filter === "enabled"} onClick={() => setFilter("enabled")} />
          <FilterPill label="All" count={all.length} active={filter === "all"} onClick={() => setFilter("all")} />
        </div>
      </div>

      {error ? (
        <div
          className="rounded-(--r-3) p-4 mt-4 text-[13px]"
          style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}
        >
          {(error as Error).message}
        </div>
      ) : isLoading ? (
        <AsyncSpinner />
      ) : rows.length === 0 ? (
        <EmptySlate
          message="No currencies match"
          hint={filter === "enabled" && !search ? "No currency is offered yet. Choose All to turn one on." : "Try another search."}
        />
      ) : (
        <div className="rounded-(--r-3) mt-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <DSTable minWidth={1100}>
            <DSTableHead>
              <DSTableTh>Currency</DSTableTh>
              <DSTableTh>Platform</DSTableTh>
              {ADMIN_CURRENCY_USES.map((u) => (
                <DSTableTh key={u}>{USE_LABEL[u]}</DSTableTh>
              ))}
              <DSTableTh>Payment providers</DSTableTh>
              <DSTableTh>Usage</DSTableTh>
              <DSTableTh align="right">
                <span className="sr-only">Actions</span>
              </DSTableTh>
            </DSTableHead>
            <tbody>
              {rows.map((c, i) => (
                <DSTableRow key={c.code} last={i === rows.length - 1}>
                  <DSTableTd>
                    <div className="font-mono text-[13px]" style={{ color: "var(--ink)" }}>
                      {c.code} <span style={{ color: "var(--fg-3)" }}>{c.symbol !== c.code ? c.symbol : ""}</span>
                    </div>
                    <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>{c.name}</div>
                    {c.notes && (
                      <div className="text-[11.5px] mt-0.5 max-w-[24ch]" style={{ color: "var(--fg-3)" }}>{c.notes}</div>
                    )}
                  </DSTableTd>
                  <DSTableTd>
                    <StatusPill variant={c.platform_enabled ? "confirmed" : "done"} label={c.platform_enabled ? "Offered" : "Off"} />
                  </DSTableTd>
                  {ADMIN_CURRENCY_USES.map((u) => (
                    <DSTableTd key={u}>
                      <UseChip currency={c} use={u} />
                    </DSTableTd>
                  ))}
                  <DSTableTd>
                    <GatewayCell currency={c} />
                  </DSTableTd>
                  <DSTableTd>
                    <UsageCell currency={c} />
                  </DSTableTd>
                  <DSTableTd align="right">
                    <button
                      type="button"
                      className="btn-ghost-v2 sm"
                      onClick={() => setEditing(c)}
                      aria-label={`Edit ${c.code}`}
                    >
                      Edit
                    </button>
                  </DSTableTd>
                </DSTableRow>
              ))}
            </tbody>
          </DSTable>
        </div>
      )}
    </AdminDashboardShell>
    {/* Outside the shell, which renders its body twice (desktop and phone). */}
    {editing && (
      <EditCurrencyModal currency={editing} onClose={() => setEditing(null)} onSaved={onSaved} />
    )}
    </>
  );
}
