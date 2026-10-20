"use client";

import { StepProps, StageHead, FormGrid, Field, TextInput, MoneyField, SelectField, ChipGrid, UploadZone, RadioCards, PreviewCard, SessionPriceChoice, sessionPriceHint } from "./_components";
import { PayoutChoice } from "./_payout";
import { COUNTRY_NAME_TO_CODE, DIETITIAN_DEFAULT_COUNTRY, SESSION_MISSING, dietitianCountry, dietitianCurrency } from "./_config";
import { dietitianLicenseDraft } from "./_credentials";
import {
  DIETITIAN_POPULATIONS,
  DIETITIAN_SPECIALIZATIONS,
  MAX_PRONOUNS,
  MAX_SPECIALIZATIONS,
  populationCode,
  populationLabel,
  specializationCode,
  specializationLabel,
  toggleCode,
} from "@/lib/credentials/dietitian";
import { OnboardingCurrencyField } from "./_currency";

/** The step 5 price, cleared when the currency changes. */
const PRICE_KEYS = ["sessionPrice"] as const;

/** The chips show labels; the data (and the API) hold the codes. */
const SPECIALIZATION_LABELS = DIETITIAN_SPECIALIZATIONS.map((o) => o.label);
const POPULATION_LABELS = DIETITIAN_POPULATIONS.map((o) => o.label);

/** The step 1 countries, as the licence step's choices (name → code). */
const LICENSE_COUNTRIES = Object.entries(COUNTRY_NAME_TO_CODE);

export function DietStep1({ data, setField }: StepProps) {
  const country = dietitianCountry(data);
  return (
    <>
      <StageHead crumb="Step 01 of 07, dietitian track" title="Your practice basics." desc="We'll list this on your profile." />
      <FormGrid>
        <Field label="Full name (with title)" htmlFor="ob-diet-name"><TextInput id="ob-diet-name" value={(data.fullName as string) || ""} onChange={(v) => setField("fullName", v)} placeholder="Dr Nadia Hassan, RD" /></Field>
        <Field label="Pronouns" htmlFor="ob-diet-pronouns"><TextInput id="ob-diet-pronouns" value={(data.pronouns as string) || ""} onChange={(v) => setField("pronouns", v.slice(0, MAX_PRONOUNS))} placeholder="she/her" /></Field>
        <Field label="City" htmlFor="ob-diet-city"><TextInput id="ob-diet-city" value={(data.city as string) || ""} onChange={(v) => setField("city", v)} placeholder="Lagos" /></Field>
        <Field label="Country" htmlFor="ob-diet-country"><SelectField id="ob-diet-country" value={country} onChange={(v) => setField("country", v)} options={[DIETITIAN_DEFAULT_COUNTRY, "South Africa", "Kenya", "Ghana", "United States", "United Kingdom"]} /></Field>
        <OnboardingCurrencyField
          id="ob-diet-currency"
          data={data}
          setField={setField}
          countryCode={COUNTRY_NAME_TO_CODE[country]}
          countryName={country}
          priceKeys={PRICE_KEYS}
        />
        <Field label="Practice name (optional)" htmlFor="ob-diet-practice" full><TextInput id="ob-diet-practice" value={(data.practiceName as string) || ""} onChange={(v) => setField("practiceName", v)} placeholder="Nadia Hassan Clinical Nutrition" /></Field>
      </FormGrid>
    </>
  );
}

/**
 * The practising licence. Saved to the dietitian's credentials: the number
 * and the document stay private (the dietitian and Binectics only); the
 * profile shows that they are licensed, who issued it and where. Optional:
 * leaving it blank moves on, and it can be added from the profile later.
 */
export function DietStep2({ data, setField, onUploadStart, onUploadEnd }: StepProps) {
  const draft = dietitianLicenseDraft(data);
  const countryName = LICENSE_COUNTRIES.find(([, code]) => code === draft.countryCode)?.[0] ?? DIETITIAN_DEFAULT_COUNTRY;
  return (
    <>
      <StageHead crumb="Step 02 of 07, dietitian track" title="Licensure." desc="Your practising licence. Your profile shows that you're licensed, who issued it and where; the number and the document stay private to you and the Binectics team." />
      <FormGrid>
        <Field label="Licence" htmlFor="ob-diet-lic-name">
          <TextInput id="ob-diet-lic-name" value={draft.name} onChange={(v) => setField("licName", v.slice(0, 120))} placeholder="Registered Dietitian" />
        </Field>
        <Field label="Issued by" htmlFor="ob-diet-lic-body">
          <TextInput id="ob-diet-lic-body" value={draft.issuingBody} onChange={(v) => setField("licBody", v.slice(0, 120))} placeholder="DAN · HPCSA · CDR" />
        </Field>
        <Field label="Registration number (optional)" htmlFor="ob-diet-lic-number">
          <TextInput id="ob-diet-lic-number" value={draft.number} onChange={(v) => setField("licNumber", v.slice(0, 60))} placeholder="Never shown publicly" />
        </Field>
        <Field label="Country" htmlFor="ob-diet-lic-country">
          <SelectField id="ob-diet-lic-country" value={countryName} onChange={(v) => setField("licCountry", COUNTRY_NAME_TO_CODE[v] ?? "")} options={LICENSE_COUNTRIES.map(([name]) => name)} />
        </Field>
        <Field label="Expires" htmlFor="ob-diet-lic-expiry">
          <TextInput id="ob-diet-lic-expiry" type="date" value={draft.expiresAt} onChange={(v) => setField("licExpiry", v)} />
        </Field>
      </FormGrid>
      <div style={{ marginTop: 14 }}>
        <UploadZone
          title="Licence document (optional)"
          hint="PDF or photo. Private: only you and the Binectics team can open it."
          folder="teams/documents"
          value={data.doc_license as string | undefined}
          onUpload={(r) => setField("doc_license", r.url)}
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
      <StageHead crumb="Step 03 of 07, dietitian track" title="Your specializations." desc={`Up to ${MAX_SPECIALIZATIONS}. Members filter on these.`} />
      <Field label="Specializations" full>
        <ChipGrid
          label="Specializations"
          options={SPECIALIZATION_LABELS}
          selected={specs.map(specializationLabel)}
          onToggle={(label) => {
            const code = specializationCode(label);
            if (code) setField("specializations", toggleCode(specs, code, MAX_SPECIALIZATIONS));
          }}
        />
      </Field>
      <Field label="Populations" full>
        <ChipGrid
          label="Populations"
          options={POPULATION_LABELS}
          selected={pops.map(populationLabel)}
          onToggle={(label) => {
            const code = populationCode(label);
            if (code) setField("populations", toggleCode(pops, code));
          }}
        />
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
  const currency = dietitianCurrency(data) ?? "";
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
        <Field label={currency ? `Price per session (${currency})` : "Price per session"} htmlFor="ob-diet-price" full>
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
      <PayoutChoice data={data} setField={setField} />
    </>
  );
}

export function DietStep7({ data }: StepProps) {
  const name = (data.fullName as string) || "Your Name";
  const specs = ((data.specializations as string[]) || []).slice(0, 3).map((s) => specializationLabel(s).toLowerCase()).join(" · ") || "specializations";
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
