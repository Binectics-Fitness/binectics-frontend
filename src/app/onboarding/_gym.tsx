"use client";

import { StepProps, StageHead, FormGrid, Field, TextInput, SelectField, TextArea, ChipGrid, UploadZone, RadioCards } from "./_components";
import { PayoutChoice } from "./_payout";
import { useOrganization } from "@/contexts/OrganizationContext";
import { COUNTRY_NAME_TO_CODE } from "./_config";
import { OnboardingCurrencyField } from "./_currency";

function toggleChip(list: string[], chip: string): string[] {
  return list.includes(chip) ? list.filter((c) => c !== chip) : [...list, chip];
}

export function GymStep1({ data, setField }: StepProps) {
  const { currentOrg } = useOrganization();
  const country = (data.country as string) || "South Africa";
  // The workspace is created when this step is submitted, and the step's
  // save patches `currency` with the rest of the business details. The field
  // writes its effective value (an explicit pick, the org's saved currency,
  // or the country's suggestion) into the form as soon as it is known.

  return (
    <>
      <StageHead crumb="Step 01 of 08, gym track" title="Business details." desc="Tell us who you are, we'll use this on receipts and your verified profile." />
      <FormGrid>
        <Field label="Business name"><TextInput value={(data.bizName as string) || ""} onChange={(v) => setField("bizName", v)} placeholder="Iron Lab" /></Field>
        <Field label="Legal entity"><SelectField value={(data.entity as string) || "Pty Ltd"} onChange={(v) => setField("entity", v)} options={["Pty Ltd", "CC", "Sole prop", "LLC", "Inc"]} /></Field>
        <Field label="Country"><SelectField value={country} onChange={(v) => setField("country", v)} options={["South Africa", "Nigeria", "Kenya", "Ghana", "United States", "United Kingdom"]} /></Field>
        <Field label="Registration #"><TextInput value={(data.regNumber as string) || ""} onChange={(v) => setField("regNumber", v)} placeholder="2018/123456/07" /></Field>
        <OnboardingCurrencyField
          id="ob-gym-currency"
          data={data}
          setField={setField}
          countryCode={COUNTRY_NAME_TO_CODE[country]}
          countryName={country}
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
        <Field label="Location name" full><TextInput value={(data.locName as string) || ""} onChange={(v) => setField("locName", v)} placeholder="Sea Point" /></Field>
        <Field label="Street address" full><TextInput value={(data.street as string) || ""} onChange={(v) => setField("street", v)} placeholder="142 Main Road, Sea Point" /></Field>
        <Field label="City"><TextInput value={(data.city as string) || ""} onChange={(v) => setField("city", v)} placeholder="Cape Town" /></Field>
        <Field label="Postal code"><TextInput value={(data.postalCode as string) || ""} onChange={(v) => setField("postalCode", v)} placeholder="8005" /></Field>
      </FormGrid>
    </>
  );
}

export function GymStep3({ data, setField }: StepProps) {
  return (
    <>
      <StageHead crumb="Step 03 of 08, gym track" title="Membership plans." desc="Pick templates to start. Customize anything later." />
      <RadioCards
        selected={(data.planTemplate as string) || "standard"}
        onSelect={(v) => setField("planTemplate", v)}
        options={[
          { id: "standard", title: "Standard set · 3 plans", desc: "Studio · Pro · Day pass. Used by 78% of gyms." },
          { id: "boutique", title: "Boutique · 4 plans", desc: "Adds an Annual tier and class-pack option." },
          { id: "crossfit", title: "CrossFit affiliate", desc: "3-class drop-in pricing + monthly unlimited." },
          { id: "blank", title: "Start blank", desc: "Build from scratch." },
        ]}
      />
    </>
  );
}

export function GymStep4({ data, setField, onUploadStart, onUploadEnd }: StepProps) {
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
          hint="South African ID or passport"
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
      <StageHead crumb="Step 05 of 08, gym track" title="Connect your payments." desc="Payouts go straight to your account. Binectics never holds funds." />
      <PayoutChoice data={data} setField={setField} />
    </>
  );
}

const CHECKIN_STEPS = [
  {
    title: "Put a screen at your door",
    desc: "Any tablet, phone or computer with a web browser. A spare phone on a stand is enough.",
  },
  {
    title: "Open the check-in kiosk",
    desc: "After setup, open Check-in kiosk from your dashboard on that screen and leave it on. It shows a QR code that changes every minute.",
  },
  {
    title: "Members scan it with their phone",
    desc: "With the Binectics app or their phone camera. Members with an active plan are checked in, and each arrival shows on the kiosk page.",
  },
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
        {CHECKIN_STEPS.map((s, i) => (
          <li
            key={s.title}
            style={{ display: "flex", gap: 14, padding: "14px 16px", border: "1px solid var(--border)", borderRadius: "var(--r-3)", background: "var(--bg)" }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)", paddingTop: 2 }}>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{s.title}</div>
              <div style={{ fontSize: 13, color: "var(--fg-3)", marginTop: 3, lineHeight: 1.5 }}>{s.desc}</div>
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}

export function GymStep7({ data, setField }: StepProps) {
  const roles = (data.staffRoles as string[]) || ["Coach (standard)"];
  return (
    <>
      <StageHead crumb="Step 07 of 08, gym track" title="Invite your staff." desc="We'll email each one a unique link to set their password." />
      <Field label="Coach emails (one per line)" full>
        <TextArea
          value={(data.staffEmails as string) || ""}
          onChange={(v) => setField("staffEmails", v)}
          placeholder="sarah@ironlab.co.za&#10;themba@ironlab.co.za"
          minHeight={120}
        />
      </Field>
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
  const planId = (data.planTemplate as string) || "standard";
  const rows = [
    { k: "Business", v: (data.bizName as string) || "-" },
    { k: "First location", v: (data.locName as string) || "-" },
    { k: "Plans", v: PLAN_DISPLAY[planId] || "-" },
    { k: "Documents", v: [data.doc_reg, data.doc_tax, data.doc_id].filter(Boolean).length + " uploaded", signal: [data.doc_reg, data.doc_tax, data.doc_id].filter(Boolean).length > 0 },
    { k: "Payments", v: (data.payout as string) || "-", signal: true },
    { k: "Staff invites", v: ((data.staffEmails as string) || "").split("\n").filter(Boolean).length + " emails" },
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
