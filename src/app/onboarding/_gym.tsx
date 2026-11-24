"use client";

import { useEffect, useState } from "react";
import { StepProps, StageHead, FormGrid, Field, TextInput, SelectField, TextArea, ChipGrid, UploadZone, RadioCards } from "./_components";
import { PayoutChoice } from "./_payout";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useHomeCountry } from "./_homeCountry";
import { useCountries } from "@/lib/queries/utility";
import { providerBillingApi, type ProviderBillingLimits } from "@/lib/api/providerBilling";
import { OnboardingCurrencyField } from "./_currency";
import {
  PLAN_TEMPLATE_SIZES,
  defaultPlanTemplate,
  planTemplateFits,
  legalEntityOptions,
  registrationPlaceholder,
  ownerIdHint,
  staffInvited,
} from "./_providerSetup";

function toggleChip(list: string[], chip: string): string[] {
  return list.includes(chip) ? list.filter((c) => c !== chip) : [...list, chip];
}

/**
 * The workspace's plan limits (membership plans, staff seats), or null
 * until known. The workspace exists from step 2 on (it is created when step
 * 1 is submitted). A failed read leaves it null: the API still refuses what
 * the plan does not allow, and the page shows that refusal.
 */
function useOrgLimits(orgId: string | undefined): ProviderBillingLimits | null {
  const [limits, setLimits] = useState<{ orgId: string; limits: ProviderBillingLimits } | null>(null);
  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    providerBillingApi
      .getStatus(orgId)
      .then((res) => {
        if (!cancelled && res.success && res.data?.limits) setLimits({ orgId, limits: res.data.limits });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [orgId]);
  return limits && limits.orgId === orgId ? limits.limits : null;
}

export function GymStep1({ data, setField }: StepProps) {
  const { currentOrg } = useOrganization();
  const home = useHomeCountry();
  const { data: countries = [] } = useCountries();
  // The country starts as the account's own (or the detected region), never
  // as one fixed country; with neither the owner picks.
  const countryCode = (data.countryCode as string) || home || "";
  const countryName = countries.find((c) => c.code === countryCode)?.name ?? ((data.country as string) || "");
  // The location step and the save read these, so the default is written
  // into the form once the list has named it.
  useEffect(() => {
    if (!data.countryCode && countryCode) setField("countryCode", countryCode);
    if (!data.country && countryName) setField("country", countryName);
  }, [countryCode, countryName, data.country, data.countryCode, setField]);
  const entities = legalEntityOptions(countryCode || undefined);
  const entity = (data.entity as string) || "";
  // The workspace is created when this step is submitted, and the step's
  // save patches `currency` with the rest of the business details. The field
  // writes its effective value (an explicit pick, the org's saved currency,
  // or the country's suggestion) into the form as soon as it is known.

  return (
    <>
      <StageHead crumb="Step 01 of 08, gym track" title="Business details." desc="Tell us who you are, we'll use this on receipts and your verified profile." />
      <FormGrid>
        <Field label="Business name"><TextInput value={(data.bizName as string) || ""} onChange={(v) => setField("bizName", v)} placeholder="Iron Lab" /></Field>
        <Field label="Country" htmlFor="ob-gym-country">
          <SelectField
            id="ob-gym-country"
            value={countryName}
            placeholder="Choose country"
            onChange={(name) => {
              const code = countries.find((c) => c.name === name)?.code ?? "";
              setField("country", name);
              setField("countryCode", code);
              // Business types differ by country: a pick from another
              // country's list is cleared, not carried over.
              if (entity && !legalEntityOptions(code || undefined).includes(entity)) setField("entity", "");
            }}
            options={countries.map((c) => c.name)}
          />
        </Field>
        <Field label="Legal entity" htmlFor="ob-gym-entity"><SelectField id="ob-gym-entity" value={entities.includes(entity) ? entity : ""} placeholder="Choose type" onChange={(v) => setField("entity", v)} options={entities} /></Field>
        <Field label="Registration #"><TextInput value={(data.regNumber as string) || ""} onChange={(v) => setField("regNumber", v)} placeholder={registrationPlaceholder(countryCode || undefined)} /></Field>
        <OnboardingCurrencyField
          id="ob-gym-currency"
          data={data}
          setField={setField}
          countryCode={countryCode || undefined}
          countryName={countryName || "your country"}
          orgCurrency={currentOrg?.currency}
          priceKeys={[]}
        />
      </FormGrid>
      <p className="text-[12px] mt-2" style={{ color: "var(--fg-3)" }}>
        New membership plans and listings price in this currency.
      </p>
    </>
  );
}

export function GymStep2({ data, setField }: StepProps) {
  return (
    <>
      <StageHead crumb="Step 02 of 08, gym track" title="Add your first location." desc="You can add more later. We just need one to publish." />
      <FormGrid>
        <Field label="Location name" full><TextInput value={(data.locName as string) || ""} onChange={(v) => setField("locName", v)} placeholder="Main branch" /></Field>
        <Field label="Street address" full><TextInput value={(data.street as string) || ""} onChange={(v) => setField("street", v)} placeholder="Street and number" /></Field>
        <Field label="City"><TextInput value={(data.city as string) || ""} onChange={(v) => setField("city", v)} /></Field>
        <Field label="Postal code"><TextInput value={(data.postalCode as string) || ""} onChange={(v) => setField("postalCode", v)} /></Field>
      </FormGrid>
    </>
  );
}

const PLAN_TEMPLATES: { id: string; title: string; desc: string }[] = [
  { id: "standard", title: "Standard set · 3 plans", desc: "Studio · Pro · Day pass." },
  { id: "boutique", title: "Boutique · 4 plans", desc: "Adds an Annual tier and class-pack option." },
  { id: "crossfit", title: "CrossFit affiliate · 2 plans", desc: "Drop-in pricing + monthly unlimited." },
  { id: "blank", title: "Start blank", desc: "Build from scratch." },
];

export function GymStep3({ data, setField }: StepProps) {
  const { currentOrg } = useOrganization();
  const limits = useOrgLimits(currentOrg?._id);
  const cap = limits?.max_membership_plans ?? null;
  const picked = data.planTemplate as string | undefined;
  // A template over the plan's cap is refused by the API, so it is never
  // the one selected: the owner starts on one that fits.
  const selected = picked && planTemplateFits(picked, cap) ? picked : defaultPlanTemplate(cap);
  useEffect(() => {
    if (picked !== selected) setField("planTemplate", selected);
  }, [picked, selected, setField]);
  return (
    <>
      <StageHead crumb="Step 03 of 08, gym track" title="Membership plans." desc="Pick templates to start. Customize anything later." />
      <RadioCards
        selected={selected}
        onSelect={(v) => setField("planTemplate", v)}
        options={PLAN_TEMPLATES.map((t) =>
          planTemplateFits(t.id, cap)
            ? t
            : {
                ...t,
                disabled: true,
                note: `Your plan allows ${cap} membership plan${cap === 1 ? "" : "s"} and this adds ${PLAN_TEMPLATE_SIZES[t.id]}. Upgrade from Billing to use it.`,
              },
        )}
      />
    </>
  );
}

export function GymStep4({ data, setField, onUploadStart, onUploadEnd }: StepProps) {
  const countryCode = (data.countryCode as string) || undefined;
  return (
    <>
      <StageHead crumb="Step 04 of 08, gym track" title="Verification documents." desc="We'll review within 48h. Most gyms are approved on the first pass." />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <UploadZone
          title="Business registration certificate"
          hint="PDF or photo · max 10 MB"
          folder="gyms/verification"
          value={data.doc_reg as string | undefined}
          onUpload={(r) => setField("doc_reg", r.url)}
          onUploadStart={onUploadStart}
          onUploadEnd={onUploadEnd}
        />
        <UploadZone
          title="Tax registration"
          hint="VAT number proof if registered"
          folder="gyms/verification"
          value={data.doc_tax as string | undefined}
          onUpload={(r) => setField("doc_tax", r.url)}
          onUploadStart={onUploadStart}
          onUploadEnd={onUploadEnd}
        />
        <UploadZone
          title="Owner ID"
          hint={ownerIdHint(countryCode)}
          folder="gyms/verification"
          value={data.doc_id as string | undefined}
          onUpload={(r) => setField("doc_id", r.url)}
          onUploadStart={onUploadStart}
          onUploadEnd={onUploadEnd}
        />
      </div>
    </>
  );
}

export function GymStep5({ data, setField }: StepProps) {
  return (
    <>
      <StageHead crumb="Step 05 of 08, gym track" title="Connect your payments." desc="Payments go straight to your own Paystack account when you've connected one. Until then, Binectics collects them and pays them out to you once payouts are available and your account is verified." />
      <PayoutChoice data={data} setField={setField} />
    </>
  );
}

// Titles only: how to set the kiosk up is said on the kiosk page itself,
// where the owner opens it (text audit, 19 Nov 2026).
const CHECKIN_STEPS = [
  "Put a screen at your door",
  "Open the check-in kiosk",
  "Members scan it with their phone",
];

/**
 * Explains the real check-in flow (a browser kiosk showing a rotating QR that
 * members scan). There is nothing to choose here: no hardware, no app, so the
 * step saves nothing.
 */
export function GymStep6() {
  return (
    <>
      <StageHead crumb="Step 06 of 08, gym track" title="How check-in works." desc="There is no app or hardware to buy. Check-in runs in a web browser on a screen you already have." />
      <ol style={{ display: "flex", flexDirection: "column", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
        {CHECKIN_STEPS.map((title, i) => (
          <li
            key={title}
            style={{ display: "flex", alignItems: "baseline", gap: 14, padding: "14px 16px", border: "1px solid var(--border)", borderRadius: "var(--r-3)", background: "var(--bg)" }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)" }}>{String(i + 1).padStart(2, "0")}</span>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{title}</div>
          </li>
        ))}
      </ol>
    </>
  );
}

export function GymStep7({ data, setField }: StepProps) {
  const { currentOrg } = useOrganization();
  const limits = useOrgLimits(currentOrg?._id);
  const seats = limits?.max_staff_members ?? null;
  const roles = (data.staffRoles as string[]) || ["Coach (standard)"];
  const noSeats = seats === 0;
  // Nothing typed earlier is sent once the plan is known to have no seats.
  useEffect(() => {
    if (noSeats && data.staffEmails) setField("staffEmails", "");
  }, [noSeats, data.staffEmails, setField]);
  const invited = staffInvited(data);
  if (noSeats) {
    return (
      <>
        <StageHead crumb="Step 07 of 08, gym track" title="Invite your staff." desc="Your plan doesn't include staff accounts." />
        <div style={{ padding: "14px 16px", border: "1px solid var(--border)", borderRadius: "var(--r-3)", background: "var(--bg-2)", fontSize: "13.5px", color: "var(--fg-2)", lineHeight: 1.6 }}>
          You can run the gym on your own account now. To give coaches or front-desk staff their own logins, upgrade from Billing after setup, then invite them from Team.
        </div>
      </>
    );
  }
  return (
    <>
      <StageHead crumb="Step 07 of 08, gym track" title="Invite your staff." desc="We'll email each one a unique link to set their password." />
      <Field label="Coach emails (one per line)" htmlFor="ob-gym-staff" full hint={seats !== null ? `Your plan includes ${seats} staff seat${seats === 1 ? "" : "s"}.` : undefined}>
        <TextArea
          id="ob-gym-staff"
          value={(data.staffEmails as string) || ""}
          onChange={(v) => setField("staffEmails", v)}
          placeholder="coach@yourgym.com&#10;frontdesk@yourgym.com"
          minHeight={120}
        />
      </Field>
      {invited.length > 0 ? (
        <p style={{ fontSize: 12, color: "var(--fg-3)" }}>Already invited: {invited.join(", ")}</p>
      ) : null}
      <Field label="Role" full>
        <ChipGrid
          options={["Coach (standard)", "Coach (manager)", "Front desk"]}
          selected={roles}
          onToggle={(c) => setField("staffRoles", toggleChip(roles, c))}
        />
      </Field>
    </>
  );
}

const PLAN_DISPLAY: Record<string, string> = {
  standard: "Studio · Pro · Day pass",
  boutique: "Studio · Pro · Annual · Class-pack",
  crossfit: "Drop-in · Monthly unlimited",
  blank: "Custom (from scratch)",
};

export function GymStep8({ data }: StepProps) {
  const planId = (data.planTemplate as string) || "blank";
  // What was actually done, not what was typed: invites the API refused
  // are not counted (the staff step said why).
  const invited = staffInvited(data).length;
  const rows = [
    { k: "Business", v: (data.bizName as string) || "-" },
    { k: "First location", v: (data.locName as string) || "-" },
    { k: "Plans", v: PLAN_DISPLAY[planId] || "-" },
    { k: "Documents", v: [data.doc_reg, data.doc_tax, data.doc_id].filter(Boolean).length + " uploaded", signal: [data.doc_reg, data.doc_tax, data.doc_id].filter(Boolean).length > 0 },
    { k: "Payments", v: (data.payout as string) || "-", signal: true },
    { k: "Staff invites", v: invited > 0 ? `${invited} sent` : "None" },
  ];
  return (
    <>
      <StageHead crumb="Step 08 of 08, gym track" title="Submit for review." desc="Your gym will go live within 48h. We'll email you the moment search traffic starts." />
      <div style={{ background: "var(--bg-2)", border: "1px solid var(--border)", borderRadius: "var(--r-3)", padding: 20 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-3)", marginBottom: 14 }}>Submission summary</div>
        {rows.map((r) => (
          <div key={r.k} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{r.k}</span>
            <span style={{ fontSize: 13, fontWeight: 500, color: r.signal ? "var(--signal-ink)" : "var(--ink)" }}>{r.v}</span>
          </div>
        ))}
      </div>
    </>
  );
}

export const GYM_STEPS = [GymStep1, GymStep2, GymStep3, GymStep4, GymStep5, GymStep6, GymStep7, GymStep8];
