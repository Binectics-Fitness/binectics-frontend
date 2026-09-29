"use client";

import { StepProps, StageHead, FormGrid, Field, TextInput, MoneyField, SelectField, ChipGrid, UploadZone, RadioCards, PreviewCard, SessionPriceChoice, sessionPriceHint } from "./_components";
import { DIETITIAN_DEFAULT_COUNTRY, SESSION_MISSING, dietitianCountry, dietitianCurrency } from "./_config";

const SPECIALIZATIONS = ["PCOS", "Diabetes", "Sport performance", "Gestational", "IBS · FODMAP", "Pre/post-natal", "Weight management", "Cardiovascular", "Renal", "Paediatric", "Eating disorders"];
const POPULATIONS = ["Adults", "Athletes", "Children", "Pre/post-natal", "Seniors"];

function toggleChip(list: string[], chip: string, max?: number): string[] {
  if (list.includes(chip)) return list.filter((c) => c !== chip);
  if (max && list.length >= max) return list;
  return [...list, chip];
}

export function DietStep1({ data, setField }: StepProps) {
  const changeCountry = (country: string) => {
    // A price typed on step 5 was in the old currency; relabelling "15,000"
    // from naira to shillings would publish a different price.
    if (dietitianCurrency({ ...data, country }) !== dietitianCurrency(data)) {
      setField("sessionPrice", "");
      setField("sessionPriceMinor", null);
    }
    setField("country", country);
  };
  return (
    <>
      <StageHead crumb="Step 01 of 07, dietitian track" title="Your practice basics." desc="We'll list this on your profile." />
      <FormGrid>
        <Field label="Full name (with title)" htmlFor="ob-diet-name"><TextInput id="ob-diet-name" value={(data.fullName as string) || ""} onChange={(v) => setField("fullName", v)} placeholder="Dr Nadia Hassan, RD" /></Field>
        <Field label="Pronouns" htmlFor="ob-diet-pronouns"><TextInput id="ob-diet-pronouns" value={(data.pronouns as string) || ""} onChange={(v) => setField("pronouns", v)} placeholder="she/her" /></Field>
        <Field label="City" htmlFor="ob-diet-city"><TextInput id="ob-diet-city" value={(data.city as string) || ""} onChange={(v) => setField("city", v)} placeholder="Lagos" /></Field>
        <Field label="Country" htmlFor="ob-diet-country"><SelectField id="ob-diet-country" value={dietitianCountry(data)} onChange={changeCountry} options={[DIETITIAN_DEFAULT_COUNTRY, "South Africa", "Kenya", "Ghana", "United States", "United Kingdom"]} /></Field>
        <Field label="Practice name (optional)" htmlFor="ob-diet-practice" full><TextInput id="ob-diet-practice" value={(data.practiceName as string) || ""} onChange={(v) => setField("practiceName", v)} placeholder="Nadia Hassan Clinical Nutrition" /></Field>
      </FormGrid>
    </>
  );
}

export function DietStep2({ data, setField, onUploadStart, onUploadEnd }: StepProps) {
  return (
    <>
      <StageHead crumb="Step 02 of 07, dietitian track" title="Licensure." desc="Dietitians are licensed practitioners, we verify against the regulatory body." />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <UploadZone
          title="Registered Dietitian license"
          hint="DAN (Nigeria) · HPCSA (SA) · CDR (US) etc."
          folder="teams/documents"
          value={data.doc_license as string | undefined}
          onUpload={(r) => setField("doc_license", r.url)}
          onUploadStart={onUploadStart}
          onUploadEnd={onUploadEnd}
        />
        <UploadZone
          title="Highest qualification"
          hint="BSc Dietetics · MSc Clinical Nutrition · PhD etc."
          folder="teams/documents"
          value={data.doc_qualification as string | undefined}
          onUpload={(r) => setField("doc_qualification", r.url)}
          onUploadStart={onUploadStart}
          onUploadEnd={onUploadEnd}
        />
        <UploadZone
          title="Professional indemnity"
          hint="Minimum cover varies by country"
          folder="teams/documents"
          value={data.doc_indemnity as string | undefined}
          onUpload={(r) => setField("doc_indemnity", r.url)}
          onUploadStart={onUploadStart}
          onUploadEnd={onUploadEnd}
        />
      </div>
    </>
  );
}

export function DietStep3({ data, setField }: StepProps) {
  const specs = (data.specializations as string[]) || [];
  const pops = (data.populations as string[]) || [];
  return (
    <>
      <StageHead crumb="Step 03 of 07, dietitian track" title="Your specializations." desc="Up to 5. Members filter on these." />
      <Field label="Specializations" full>
        <ChipGrid options={SPECIALIZATIONS} selected={specs} onToggle={(c) => setField("specializations", toggleChip(specs, c, 5))} />
      </Field>
      <Field label="Populations" full>
        <ChipGrid options={POPULATIONS} selected={pops} onToggle={(c) => setField("populations", toggleChip(pops, c))} />
      </Field>
    </>
  );
}

export function DietStep4({ data, setField }: StepProps) {
  return (
    <>
      <StageHead crumb="Step 04 of 07, dietitian track" title="Seed your library." desc="Pick a starter pack, protocols and meal-plan templates you can customize per client." />
      <RadioCards
        selected={(data.library as string) || "clinical"}
        onSelect={(v) => setField("library", v)}
        options={[
          { id: "clinical", title: "Clinical · 6 protocols", desc: "PCOS · T2D · gestational · IBS · CVD · weight management" },
          { id: "sports", title: "Sports · 4 protocols", desc: "Endurance · strength · contact-sport · physique" },
          { id: "general", title: "General · 3 protocols", desc: "Wellness · weight loss · maintenance" },
          { id: "blank", title: "Start blank", desc: "Build your library from scratch." },
        ]}
      />
    </>
  );
}

const SESSION_LENGTHS = ["30 min", "45 min", "60 min", "90 min"];

/**
 * The consultation members book. The prototypes have no pricing step (the
 * preview shows a price per consult), so it sits before the payout, as the
 * trainer track's pricing does. A price, or Free, creates the dietitian's
 * own session; leaving both creates nothing, to set up later.
 */
export function DietStep5({ data, setField }: StepProps) {
  const currency = dietitianCurrency(data);
  const free = data.sessionFree === true;
  const later = data.sessionLater === true;
  const missing = data[SESSION_MISSING] === true;
  const duration = (data.sessionDuration as string) || "60 min";
  const display = (data.sessionPrice as string) || "";
  const choose = (choice: "free" | "later") => {
    setField("sessionFree", choice === "free" ? !free : false);
    setField("sessionLater", choice === "later" ? !later : false);
    setField(SESSION_MISSING, false);
  };
  return (
    <>
      <StageHead crumb="Step 05 of 07, dietitian track" title="Set your consultation." desc="This is what clients book with you. You can change it, or add more sessions, any time." />
      <FormGrid>
        <Field label="Session length" htmlFor="ob-diet-length" full>
          <SelectField id="ob-diet-length" value={duration} onChange={(v) => setField("sessionDuration", v)} options={SESSION_LENGTHS} />
        </Field>
        <Field label={`Price per session (${currency})`} htmlFor="ob-diet-price" full>
          <MoneyField
            id="ob-diet-price"
            describedBy="ob-diet-price-hint"
            value={free || later ? "" : display}
            onChange={(next, minor) => {
              setField("sessionPrice", next);
              setField("sessionPriceMinor", minor);
              setField(SESSION_MISSING, false);
            }}
            currency={currency}
            placeholder={free ? "Free" : later ? "Set up later" : "15,000"}
            disabled={free || later}
          />
          <SessionPriceChoice
            freeLabel="Free consultation"
            free={free}
            later={later}
            onChoose={choose}
            hintId="ob-diet-price-hint"
            error={missing}
            hint={sessionPriceHint({
              display,
              minor: data.sessionPriceMinor as number | null | undefined,
              free,
              later,
              missing,
              laterNote: "Members can't book you until you set a price. You can add it from your dashboard.",
              minutes: parseInt(duration, 10) || 60,
              noun: "consultation",
            })}
          />
        </Field>
      </FormGrid>
    </>
  );
}

export function DietStep6({ data, setField }: StepProps) {
  return (
    <>
      <StageHead crumb="Step 06 of 07, dietitian track" title="Connect your payout." desc="Direct to your bank account. Binectics never holds your money." />
      <RadioCards
        selected={(data.payout as string) || "paystack"}
        onSelect={(v) => setField("payout", v)}
        options={[
          { id: "paystack", title: "Paystack · GTBank", desc: "Setup takes 4 minutes. NGN payouts." },
          { id: "flutterwave", title: "Flutterwave", desc: "For wider African coverage." },
          { id: "stripe", title: "Stripe", desc: "For USD clients abroad." },
        ]}
      />
    </>
  );
}

export function DietStep7({ data }: StepProps) {
  const name = (data.fullName as string) || "Your Name";
  const specs = ((data.specializations as string[]) || []).slice(0, 3).map((s) => s.toLowerCase()).join(" · ") || "specializations";
  const city = (data.city as string) || "City";
  const minor = data.sessionPriceMinor;
  const price =
    data.sessionFree === true
      ? " · Free consult"
      : data.sessionLater !== true && typeof minor === "number" && minor > 0 && data.sessionPrice
        ? ` · ${data.sessionPrice as string}/consult`
        : "";
  return (
    <>
      <StageHead crumb="Step 07 of 07, dietitian track" title="Preview & publish." desc="Your profile goes live the moment we verify your license. Usually within 48h." />
      <PreviewCard name={name} meta={`${specs} · ${city}${price}`} />
    </>
  );
}

export const DIETITIAN_STEPS = [DietStep1, DietStep2, DietStep3, DietStep4, DietStep5, DietStep6, DietStep7];
