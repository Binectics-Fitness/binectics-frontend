"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { GatewaysSection } from "./GatewaysSection";
import { NotificationsSection } from "./NotificationsSection";
import { RolesSection, ApiKeysSection } from "./TeamAccessSections";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  useOrganizationDetails,
  useUpdateOrganization,
} from "@/lib/queries/teams";
import { useCountries } from "@/lib/queries/utility";
import { utilityService } from "@/lib/api/utility";
import { SUPPORTED_CURRENCIES } from "@/lib/constants/regions";
import {
  FIRST_DAY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  TIME_FORMAT_OPTIONS,
  NUMBER_FORMAT_OPTIONS,
  LOCALE_DEFAULTS,
  getTimeZoneOptions,
  type FirstDayOfWeek,
  type DateFormat,
  type TimeFormat,
  type NumberFormat,
} from "@/lib/constants/settingsLocale";
import type {
  Organization,
  UpdateOrganizationRequest,
  BookingRules,
  KioskSettings,
  PayoutSchedule,
  PayoutFrequency,
} from "@/lib/api/teams";
import {
  DEFAULT_BOOKING_RULES,
  DEFAULT_KIOSK_SETTINGS,
  DEFAULT_PAYOUT_SCHEDULE,
  PAYOUT_WEEKDAYS,
} from "@/lib/constants/orgSettingsDefaults";

const SECTIONS = [
  { group: "Business", items: [{ id: "org", label: "Organization" }, { id: "currency", label: "Currency & locale" }, { id: "tax", label: "Tax & VAT" }] },
  { group: "Operations", items: [{ id: "booking", label: "Booking rules" }, { id: "kiosk", label: "Kiosk & QR" }, { id: "notifications", label: "Notifications" }] },
  { group: "Money", items: [{ id: "gateways", label: "Payment gateways" }, { id: "payouts", label: "Payout schedule" }] },
  { group: "Team", items: [{ id: "roles", label: "Roles & scopes" }, { id: "api", label: "API access" }] },
];

/** Booking toggles — key maps to a boolean on BookingRules (fee is derived). */
const BOOKING_TOGGLE_DEFS = [
  { key: "auto_confirm" as const, t: "Auto‑confirm bookings", s: "Confirmed instantly when the member taps Book. No manual approval needed." },
  { key: "require_parq" as const, t: "Require PAR‑Q from new members", s: "Standard health history form. Sent automatically before first session." },
  { key: "cancellation_fee" as const, t: "Charge cancellation fee within 24h", s: "50% of session price. Reasonable exceptions waived by support team." },
  { key: "allow_video_recording" as const, t: "Allow video recording of sessions", s: "Members can ask coaches to film working sets for technique review." },
  { key: "public_reviews" as const, t: "Public reviews on listing", s: "Strongly recommended · drives 3.4× more bookings vs hidden." },
];

const KIOSK_TOGGLE_DEFS = [
  { key: "qr_checkin_from_phones" as const, t: "Allow QR check‑in from members’ phones", s: "If off, only the kiosk’s camera can scan member codes." },
  { key: "success_animation" as const, t: "Show success animation on check‑in", s: "The 2‑second celebration the system is known for. Off only if you must." },
  { key: "auto_sleep" as const, t: "Auto‑sleep after 60 seconds idle", s: "Saves screen burn‑in on always‑on iPads." },
  { key: "voice_announcement" as const, t: "Voice announcement on successful check‑in", s: "“Welcome, Linda.” Useful at busy 6am rushes, can be intrusive at 8pm." },
];

const INPUT_STYLE = {
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
  background: "var(--bg)",
  fontFamily: "inherit",
} as const;
const INPUT_CLASS = "rounded-(--r-2) px-3.5 py-2.75 text-[14px]";
const LABEL_CLASS = "font-mono text-[10.5px] uppercase tracking-[0.06em]";

// ─────────────────────────────────────────────────────────────────────────
// Form model — maps 1:1 to UpdateOrganizationRequest keys. The trading name
// is the org's `name`; `legal_name` is the registered legal name.
// ─────────────────────────────────────────────────────────────────────────
interface SettingsForm {
  name: string;
  legal_name: string;
  registration_number: string;
  vat_registration_number: string;
  country: string;
  primary_email: string;
  currency: string;
  time_zone: string;
  first_day_of_week: FirstDayOfWeek;
  date_format: DateFormat;
  time_format: TimeFormat;
  number_format: NumberFormat;
  /** Kept as the raw input string; converted to a number when saving. */
  tax_rate: string;
  tax_inclusive: boolean;
  tax_label: string;
  booking_rules: BookingRules;
  kiosk_settings: KioskSettings;
  payout_schedule: PayoutSchedule;
}

function seedForm(org: Organization): SettingsForm {
  return {
    name: org.name ?? "",
    legal_name: org.legal_name ?? "",
    registration_number: org.registration_number ?? "",
    vat_registration_number: org.vat_registration_number ?? "",
    country: org.country ?? "",
    primary_email: org.primary_email ?? "",
    currency: org.currency ?? "USD",
    time_zone: org.time_zone ?? "",
    first_day_of_week: org.first_day_of_week ?? LOCALE_DEFAULTS.first_day_of_week,
    date_format: org.date_format ?? LOCALE_DEFAULTS.date_format,
    time_format: org.time_format ?? LOCALE_DEFAULTS.time_format,
    number_format: org.number_format ?? LOCALE_DEFAULTS.number_format,
    tax_rate: org.tax_rate != null ? String(org.tax_rate) : "",
    tax_inclusive: org.tax_inclusive ?? true,
    tax_label: org.tax_label ?? "VAT",
    booking_rules: { ...DEFAULT_BOOKING_RULES, ...(org.booking_rules ?? {}) },
    kiosk_settings: { ...DEFAULT_KIOSK_SETTINGS, ...(org.kiosk_settings ?? {}) },
    payout_schedule: { ...DEFAULT_PAYOUT_SCHEDULE, ...(org.payout_schedule ?? {}) },
  };
}

/**
 * Only the keys that differ from the baseline, as an update payload.
 * Sub-objects (booking_rules, …) compare deeply and send whole — the API
 * replaces them atomically. tax_rate converts back to a number; an empty
 * input means "leave unset" and is skipped.
 */
function diff(base: SettingsForm, next: SettingsForm): UpdateOrganizationRequest {
  const out: UpdateOrganizationRequest = {};
  (Object.keys(next) as (keyof SettingsForm)[]).forEach((k) => {
    const b = base[k];
    const n = next[k];
    const changed =
      typeof n === "object" && n !== null
        ? JSON.stringify(b) !== JSON.stringify(n)
        : b !== n;
    if (!changed) return;
    if (k === "tax_rate") {
      const parsed = Number(next.tax_rate);
      if (next.tax_rate !== "" && !Number.isNaN(parsed)) out.tax_rate = parsed;
      return;
    }
    if (k === "payout_schedule") {
      const ps = { ...next.payout_schedule };
      if (ps.frequency === "daily") delete ps.payout_day;
      out.payout_schedule = ps;
      return;
    }
    (out as Record<string, unknown>)[k] = n;
  });
  return out;
}

export function SettingsClient() {
  const { currentOrg, refreshOrganizations } = useOrganization();
  const orgId = currentOrg?._id;
  const { data: org, isLoading } = useOrganizationDetails(orgId);
  const updateOrg = useUpdateOrganization();
  const { data: countries = [] } = useCountries();

  const timeZones = useMemo(() => getTimeZoneOptions(), []);

  const [seededOrgId, setSeededOrgId] = useState<string | null>(null);
  const [baseline, setBaseline] = useState<SettingsForm | null>(null);
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const geoAppliedFor = useRef<string | null>(null);
  const [activeId, setActiveId] = useState("org");

  // Seed the form when the active org's data first arrives (and re-seed only
  // when the user switches to a different org) — the React-endorsed
  // "adjust state while rendering" pattern, keyed on org id so a background
  // refetch never clobbers unsaved edits.
  if (org && org._id !== seededOrgId) {
    const seeded = seedForm(org);
    setSeededOrgId(org._id);
    setBaseline(seeded);
    setForm(seeded);
  }

  // New org with no saved country → suggest one from the caller's IP.
  useEffect(() => {
    if (!org || org.country || geoAppliedFor.current === org._id) return;
    geoAppliedFor.current = org._id;
    let cancelled = false;
    void (async () => {
      const res = await utilityService.resolveGeo();
      const detected = res.success && res.data?.country ? res.data.country.toUpperCase() : "";
      if (cancelled || !detected) return;
      setForm((f) => (f && !f.country ? { ...f, country: detected } : f));
    })();
    return () => {
      cancelled = true;
    };
  }, [org]);

  // Scroll-spy: highlight the section currently in view.
  useEffect(() => {
    const ids = SECTIONS.flatMap((s) => s.items.map((i) => i.id));
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [form]);

  const payload = useMemo(
    () => (baseline && form ? diff(baseline, form) : {}),
    [baseline, form],
  );
  const dirty = Object.keys(payload).length > 0;

  const set = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const setBooking = (patch: Partial<BookingRules>) =>
    setForm((f) => (f ? { ...f, booking_rules: { ...f.booking_rules, ...patch } } : f));
  const setKiosk = (patch: Partial<KioskSettings>) =>
    setForm((f) => (f ? { ...f, kiosk_settings: { ...f.kiosk_settings, ...patch } } : f));
  const setPayout = (patch: Partial<PayoutSchedule>) =>
    setForm((f) => (f ? { ...f, payout_schedule: { ...f.payout_schedule, ...patch } } : f));

  // The "cancellation fee" toggle is derived: on = a non-zero fee percent.
  // Turning it on restores the standard 50% / 24h; off zeroes the fee.
  const bookingOn = (key: (typeof BOOKING_TOGGLE_DEFS)[number]["key"]): boolean => {
    if (!form) return false;
    if (key === "cancellation_fee") return form.booking_rules.cancellation_fee_percent > 0;
    return form.booking_rules[key];
  };
  const toggleBooking = (key: (typeof BOOKING_TOGGLE_DEFS)[number]["key"]) => {
    if (!form) return;
    if (key === "cancellation_fee") {
      setBooking(
        form.booking_rules.cancellation_fee_percent > 0
          ? { cancellation_fee_percent: 0 }
          : { cancellation_fee_percent: 50, cancellation_window_hours: 24 },
      );
    } else {
      setBooking({ [key]: !form.booking_rules[key] });
    }
  };
  // Switching payout frequency resets payout_day to that frequency's default
  // (the field's meaning changes: weekday index vs day of month).
  const onPayoutFrequency = (frequency: PayoutFrequency) =>
    setPayout({ frequency, payout_day: frequency === "daily" ? undefined : 1 });

  const onSave = async () => {
    if (!orgId || !dirty || !form) return;
    setSavedFlash(false);
    const res = await updateOrg.mutateAsync({ orgId, data: payload });
    if (res.success) {
      setBaseline(form);
      setSavedFlash(true);
      void refreshOrganizations();
      window.setTimeout(() => setSavedFlash(false), 2500);
    }
  };

  const saveAction = (() => {
    if (updateOrg.isPending)
      return <StatusPill tone="muted" dot="var(--fg-3)" label="Saving…" />;
    if (updateOrg.isError)
      return (
        <button className="btn-primary-v2 sm" onClick={() => void onSave()}>
          Save failed — retry
        </button>
      );
    if (dirty)
      return (
        <button className="btn-primary-v2 sm" onClick={() => void onSave()}>
          Save changes
        </button>
      );
    if (savedFlash)
      return <StatusPill tone="signal" dot="var(--signal)" label="Saved" />;
    return <StatusPill tone="signal" dot="var(--signal)" label="All changes saved" />;
  })();

  return (
    <GymDashboardShell activeItem="Settings" crumb="Settings" actions={saveAction}>
      <div className="pb-1">
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Settings</h1>
        <div className="text-[13.5px] mt-1.5 max-w-[60ch]" style={{ color: "var(--fg-3)" }}>Business identity, currencies, integrations, booking rules, and the org-level settings that apply across every location.</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 lg:gap-10 items-start">
        {/* Section nav */}
        <nav className="sticky top-22 flex flex-col sm:flex-row lg:flex-col gap-0.5 overflow-x-auto">
          {SECTIONS.map((s, si) => (
            <div key={s.group}>
              <div className={`font-mono text-[10.5px] uppercase tracking-[0.06em] px-2.5 py-1 ${si > 0 ? "mt-3.5" : ""}`} style={{ color: "var(--fg-3)" }}>{s.group}</div>
              {s.items.map((item) => {
                const active = activeId === item.id;
                return (
                  <a key={item.id} href={`#${item.id}`} className={`block px-2.5 py-[7px] rounded-(--r-2) text-[13px] ${active ? "bg-bg font-medium" : "hover:bg-bg"}`} style={{ color: active ? "var(--ink)" : "var(--fg-3)", borderLeft: active ? "2px solid var(--ink)" : "2px solid transparent", paddingLeft: active ? "8px" : "10px", textDecoration: "none" }}>
                    {item.label}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sections */}
        <div className="flex flex-col gap-10">
          {/* Organization */}
          <section id="org">
            <SectionHeading title="Organization" desc="Legal entity, trading name, primary contact. Used on receipts and tax documents." />
            <div className="flex flex-col gap-4 p-5.5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <TextField label="Legal name" value={form?.legal_name ?? ""} onChange={(v) => set("legal_name", v)} disabled={!form} />
                <TextField label="Trading name" value={form?.name ?? ""} onChange={(v) => set("name", v)} disabled={!form} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <TextField label="Registration #" value={form?.registration_number ?? ""} onChange={(v) => set("registration_number", v)} disabled={!form} />
                <TextField label="VAT registration #" value={form?.vat_registration_number ?? ""} onChange={(v) => set("vat_registration_number", v)} disabled={!form} />
                <SelectField label="Country" value={form?.country ?? ""} onChange={(v) => set("country", v)} disabled={!form}>
                  <option value="">Select country…</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.code}>{c.name} · {c.code}</option>
                  ))}
                </SelectField>
              </div>
              <TextField label="Primary email" type="email" value={form?.primary_email ?? ""} onChange={(v) => set("primary_email", v)} disabled={!form} />
            </div>
          </section>

          {/* Currency & locale */}
          <section id="currency">
            <SectionHeading title="Currency & locale" desc="How money and dates render across your dashboard and to your members." />
            <div className="flex flex-col gap-4 p-5.5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <SelectField label="Default currency" value={form?.currency ?? "USD"} onChange={(v) => set("currency", v)} disabled={!form} hint="Used for new membership plans, listings, and revenue display.">
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.currencyCode} value={c.currencyCode}>{c.currencyCode} · {c.symbol} — {c.regionName}</option>
                  ))}
                </SelectField>
                <SelectField label="Time zone" value={form?.time_zone ?? ""} onChange={(v) => set("time_zone", v)} disabled={!form}>
                  <option value="">Select time zone…</option>
                  {timeZones.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </SelectField>
                <LocaleSelect label="First day of week" value={form?.first_day_of_week} options={FIRST_DAY_OPTIONS} onChange={(v) => set("first_day_of_week", v)} disabled={!form} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <LocaleSelect label="Date format" value={form?.date_format} options={DATE_FORMAT_OPTIONS} onChange={(v) => set("date_format", v)} disabled={!form} />
                <LocaleSelect label="Time format" value={form?.time_format} options={TIME_FORMAT_OPTIONS} onChange={(v) => set("time_format", v)} disabled={!form} />
                <LocaleSelect label="Number format" value={form?.number_format} options={NUMBER_FORMAT_OPTIONS} onChange={(v) => set("number_format", v)} disabled={!form} />
              </div>
            </div>
          </section>

          {/* Tax & VAT */}
          <section id="tax">
            <SectionHeading title="Tax & VAT" desc="Shown on receipts and invoices. Nothing is computed platform-side yet — this is what your documents display." />
            <div className="flex flex-col gap-4 p-5.5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <TextField label="Tax label" value={form?.tax_label ?? ""} onChange={(v) => set("tax_label", v)} disabled={!form} />
                <TextField label="Tax rate %" type="number" value={form?.tax_rate ?? ""} onChange={(v) => set("tax_rate", v)} disabled={!form} />
                <div className="flex flex-col gap-1.5">
                  <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Prices include tax</label>
                  <div className="flex items-center gap-2.5 py-2.75">
                    <Toggle on={form?.tax_inclusive ?? true} onToggle={() => set("tax_inclusive", !(form?.tax_inclusive ?? true))} />
                    <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                      {form?.tax_inclusive ?? true ? "Listed prices already include tax" : "Tax is added on top of listed prices"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Booking rules */}
          <WiredToggleSection
            id="booking"
            title="Booking rules"
            desc="Defaults that apply to all locations · individual locations can override."
            items={BOOKING_TOGGLE_DEFS.map((d) => ({ ...d, on: bookingOn(d.key), onToggle: () => toggleBooking(d.key) }))}
            disabled={!form}
          />

          {/* Kiosk & QR */}
          <WiredToggleSection
            id="kiosk"
            title="Kiosk & QR"
            desc="Hardware and behaviour for the iPads at your front desks."
            items={KIOSK_TOGGLE_DEFS.map((d) => ({
              ...d,
              on: form?.kiosk_settings[d.key] ?? DEFAULT_KIOSK_SETTINGS[d.key],
              onToggle: () => form && setKiosk({ [d.key]: !form.kiosk_settings[d.key] }),
            }))}
            disabled={!form}
          />

          {/* Notifications — per-event channel matrix, saves per toggle */}
          <NotificationsSection />

          {/* Payment gateways — live CRUD against the payment-config API */}
          <GatewaysSection />

          {/* Payout schedule */}
          <section id="payouts">
            <SectionHeading title="Payout schedule" desc="How often earnings settle to your bank. Execution follows your gateway's capabilities." />
            <div className="flex flex-col gap-4 p-5.5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <SelectField label="Frequency" value={form?.payout_schedule.frequency ?? "weekly"} onChange={(v) => onPayoutFrequency(v as PayoutFrequency)} disabled={!form}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </SelectField>
                {form?.payout_schedule.frequency === "weekly" && (
                  <SelectField label="Payout day" value={String(form.payout_schedule.payout_day ?? 1)} onChange={(v) => setPayout({ payout_day: Number(v) })}>
                    {PAYOUT_WEEKDAYS.map((d) => (
                      <option key={d.value} value={String(d.value)}>{d.label}</option>
                    ))}
                  </SelectField>
                )}
                {form?.payout_schedule.frequency === "monthly" && (
                  <TextField label="Day of month (1–28)" type="number" value={String(form.payout_schedule.payout_day ?? 1)} onChange={(v) => {
                    const day = Math.min(28, Math.max(1, Number(v) || 1));
                    setPayout({ payout_day: day });
                  }} />
                )}
                <TextField label={`Minimum payout${form?.currency ? ` (${form.currency})` : ""}`} type="number" value={String(form?.payout_schedule.minimum_payout_amount ?? 0)} onChange={(v) => setPayout({ minimum_payout_amount: Math.max(0, Number(v) || 0) })} disabled={!form} />
                <TextField label="Hold period (days, 0–30)" type="number" value={String(form?.payout_schedule.hold_period_days ?? 0)} onChange={(v) => setPayout({ hold_period_days: Math.min(30, Math.max(0, Number(v) || 0)) })} disabled={!form} />
              </div>
              <span className="text-[11px]" style={{ color: "var(--fg-3)" }}>Earnings below the minimum roll over to the next run. The hold period applies before earnings become payable.</span>
            </div>
          </section>

          {/* Roles & scopes — read-only summary, managed at /dashboard/team */}
          <RolesSection />

          {/* API access — issue, list, revoke org API keys */}
          <ApiKeysSection />

          {isLoading && (
            <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Loading your organization…</p>
          )}
        </div>
      </div>
    </GymDashboardShell>
  );
}

function StatusPill({ tone, dot, label }: { tone: "signal" | "muted"; dot: string; label: string }) {
  const signal = tone === "signal";
  return (
    <span className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.05em] px-2.5 py-1 rounded-full" style={{ color: signal ? "var(--signal-ink)" : "var(--fg-3)", background: signal ? "var(--signal-soft)" : "var(--bg)", border: signal ? "1px solid oklch(0.88 0.05 148)" : "1px solid var(--border)" }}>
      <span className="w-1.25 h-1.25 rounded-full" style={{ background: dot }} />
      {label}
    </span>
  );
}

function SectionHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <>
      <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>{title}</h2>
      <p className="text-[12.5px] mt-1 mb-4 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>{desc}</p>
    </>
  );
}

function TextField({ label, value, onChange, disabled, type = "text" }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>{label}</label>
      <input type={type} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE} />
    </div>
  );
}

function SelectField({ label, value, onChange, disabled, hint, children }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>{label}</label>
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE}>
        {children}
      </select>
      {hint && <span className="text-[11px]" style={{ color: "var(--fg-3)" }}>{hint}</span>}
    </div>
  );
}

/** Select bound to a LocaleOption list, showing the chosen value's preview. */
function LocaleSelect<T extends string>({ label, value, options, onChange, disabled }: { label: string; value: T | undefined; options: { value: T; label: string; preview: string }[]; onChange: (v: T) => void; disabled?: boolean }) {
  const preview = options.find((o) => o.value === value)?.preview;
  return (
    <div className="flex flex-col gap-1.5">
      <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>{label}</label>
      <select value={value ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value as T)} className={INPUT_CLASS} style={INPUT_STYLE}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {preview && <span className="text-[11px]" style={{ color: "var(--fg-3)" }}>Preview · {preview}</span>}
    </div>
  );
}

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle?: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className="w-[30px] h-[18px] rounded-full relative cursor-pointer shrink-0 mt-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      style={{ background: on ? "var(--ink)" : "var(--border-2)", border: "none", padding: 0 }}
    >
      <span className="absolute w-3.5 h-3.5 rounded-full top-0.5" style={{ background: "var(--bg)", left: on ? "14px" : "2px", transition: "left var(--motion-fast) var(--ease)" }} />
    </button>
  );
}

function WiredToggleSection({ id, title, desc, items, disabled }: { id: string; title: string; desc: string; items: { key: string; t: string; s: string; on: boolean; onToggle: () => void }[]; disabled?: boolean }) {
  return (
    <section id={id}>
      <SectionHeading title={title} desc={desc} />
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {items.map((t, i) => (
          <div key={t.key} className="flex items-start gap-3.5 px-5.5 py-3" style={{ borderBottom: i < items.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div className="flex-1">
              <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{t.t}</div>
              <div className="text-[12.5px] mt-0.75 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>{t.s}</div>
            </div>
            <Toggle on={t.on} onToggle={t.onToggle} disabled={disabled} />
          </div>
        ))}
      </div>
    </section>
  );
}
