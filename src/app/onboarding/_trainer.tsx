"use client";

import { StepProps, StageHead, FormGrid, Field, TextInput, MoneyField, SelectField, ChipGrid, UploadZone, RadioCards, PreviewCard, SessionPriceChoice, sessionPriceHint } from "./_components";
import { COUNTRY_NAME_TO_CODE, SESSION_MISSING, onboardingCurrency, trainerCountry } from "./_config";
import { OnboardingCurrencyField } from "./_currency";

const SPECIALIZATIONS = ["Strength", "Hypertrophy", "Running", "Olympic lifting", "Powerlifting", "Bodybuilding", "Functional", "Mobility", "HIIT", "CrossFit", "Pre-natal", "Post-natal"];
const FORMATS = ["In-person 1:1", "In-person small group", "Online video", "Programming only", "Hybrid"];

function toggleChip(list: string[], chip: string, max?: number): string[] {
  if (list.includes(chip)) return list.filter((c) => c !== chip);
  if (max && list.length >= max) return list;
  return [...list, chip];
}

/** The step 4 prices, cleared when the currency changes. */
const PRICE_KEYS = ["price1on1", "price4pack", "price12pack", "priceMonthly"] as const;

export function TrainerStep1({ data, setField }: StepProps) {
  const country = trainerCountry(data);
  return (
    <>
      <StageHead crumb="Step 01 of 06, trainer track" title="Tell us about yourself." desc="This is what members see in your profile." />
      <FormGrid>
        <Field label="First name" htmlFor="ob-tr-first"><TextInput id="ob-tr-first" value={(data.firstName as string) || ""} onChange={(v) => setField("firstName", v)} /></Field>
        <Field label="Last name" htmlFor="ob-tr-last"><TextInput id="ob-tr-last" value={(data.lastName as string) || ""} onChange={(v) => setField("lastName", v)} /></Field>
        <Field label="City" htmlFor="ob-tr-city"><TextInput id="ob-tr-city" value={(data.city as string) || ""} onChange={(v) => setField("city", v)} /></Field>
        <Field label="Country" htmlFor="ob-tr-country"><SelectField id="ob-tr-country" value={country} onChange={(v) => setField("country", v)} options={["South Africa", "Nigeria", "Kenya", "Ghana", "United States", "United Kingdom"]} /></Field>
        <OnboardingCurrencyField
          id="ob-tr-currency"
          data={data}
          setField={setField}
          countryCode={COUNTRY_NAME_TO_CODE[country]}
          countryName={country}
          priceKeys={PRICE_KEYS}
        />
        <Field label="Headline (60 char)" hint="Shows under your name in marketplace results." htmlFor="ob-tr-headline" full>
          <TextInput id="ob-tr-headline" value={(data.headline as string) || ""} onChange={(v) => setField("headline", v)} placeholder="Strength & running coach · Sea Point" />
        </Field>
      </FormGrid>
    </>
  );
}

export function TrainerStep2({ data, setField }: StepProps) {
  const specs = (data.specializations as string[]) || [];
  const formats = (data.formats as string[]) || [];
  return (
    <>
      <StageHead crumb="Step 02 of 06, trainer track" title="Your specializations." desc="Pick up to 5. Members filter on these." />
      <Field label="Specializations" full>
        <ChipGrid options={SPECIALIZATIONS} selected={specs} onToggle={(c) => setField("specializations", toggleChip(specs, c, 5))} />
      </Field>
      <Field label="Session format" full>
        <ChipGrid options={FORMATS} selected={formats} onToggle={(c) => setField("formats", toggleChip(formats, c))} />
      </Field>
    </>
  );
}

export function TrainerStep3({ data, setField, onUploadStart, onUploadEnd }: StepProps) {
  return (
    <>
      <StageHead crumb="Step 03 of 06, trainer track" title="Upload your certifications." desc="Verified providers convert 3.4x better. We re-check every 24 months." />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <UploadZone
          title="Primary certification"
          hint="NSCA-CSCS · NASM-CPT · ACE · ACSM · etc."
          folder="teams/documents"
          value={data.doc_cert as string | undefined}
          onUpload={(r) => setField("doc_cert", r.url)}
          onUploadStart={onUploadStart}
          onUploadEnd={onUploadEnd}
        />
        <UploadZone
          title="Public liability insurance"
          hint="Minimum cover for in-person (e.g. ₦ 33,000k)"
          folder="teams/documents"
          value={data.doc_insurance as string | undefined}
          onUpload={(r) => setField("doc_insurance", r.url)}
          onUploadStart={onUploadStart}
          onUploadEnd={onUploadEnd}
        />
        <UploadZone
          title="ID document"
          hint="For payout verification"
          folder="teams/documents"
          value={data.doc_id as string | undefined}
          onUpload={(r) => setField("doc_id", r.url)}
          onUploadStart={onUploadStart}
          onUploadEnd={onUploadEnd}
        />
      </div>
    </>
  );
}

/**
 * Prices are in the currency chosen on step 1 (the country's suggestion or
 * the trainer's own pick). Step 1 does not continue without one.
 */
export function trainerPricingCurrency(data: Record<string, unknown>): string {
  return onboardingCurrency(data) ?? "";
}

export function TrainerStep4({ data, setField }: StepProps) {
  const currency = trainerPricingCurrency(data);
  // The display string is what the field shows again; the minor amount is
  // what the session type is created from when the step is saved.
  const money = (key: string) => ({
    value: (data[key] as string) || "",
    onChange: (display: string, minor: number | null) => {
      setField(key, display);
      setField(`${key}Minor`, minor);
    },
    currency,
  });
  // Free is an explicit choice (a price of 0); a blank price is no answer
  // and saves no session, so the trainer can set it up later.
  const free = data.price1on1Free === true;
  const later = data.price1on1Later === true;
  const missing = data[SESSION_MISSING] === true;
  const oneOnOne = money("price1on1");
  const duration = (data.duration as string) || "60 min";
  const choose = (choice: "free" | "later") => {
    setField("price1on1Free", choice === "free" ? !free : false);
    setField("price1on1Later", choice === "later" ? !later : false);
    setField(SESSION_MISSING, false);
  };
  return (
    <>
      <StageHead crumb="Step 04 of 06, trainer track" title="Set your pricing." desc="Members see this on your profile. You can always change it." />
      <FormGrid>
        <Field label="1:1 session" htmlFor="ob-tr-price" full>
          <MoneyField
            {...oneOnOne}
            onChange={(display, minor) => {
              oneOnOne.onChange(display, minor);
              setField(SESSION_MISSING, false);
            }}
            id="ob-tr-price"
            describedBy="ob-tr-price-hint"
            value={free || later ? "" : oneOnOne.value}
            placeholder={free ? "Free" : later ? "Set up later" : "80,000"}
            disabled={free || later}
          />
          <SessionPriceChoice
            freeLabel="Free session"
            free={free}
            later={later}
            onChoose={choose}
            hintId="ob-tr-price-hint"
            error={missing}
            hint={sessionPriceHint({
              display: (data.price1on1 as string) || "",
              minor: data.price1on1Minor as number | null | undefined,
              free,
              later,
              missing,
              laterNote: "Members book the standard session until you set your own. You can do it from your dashboard.",
              minutes: parseInt(duration, 10) || 60,
              noun: "session",
            })}
          />
        </Field>
        <Field label="Duration" htmlFor="ob-tr-duration"><SelectField id="ob-tr-duration" value={duration} onChange={(v) => setField("duration", v)} options={["60 min", "45 min", "30 min"]} /></Field>
        <Field label="4-session pack" htmlFor="ob-tr-pack4"><MoneyField id="ob-tr-pack4" {...money("price4pack")} placeholder="280,000" /></Field>
        <Field label="12-session pack" htmlFor="ob-tr-pack12"><MoneyField id="ob-tr-pack12" {...money("price12pack")} placeholder="800,000" /></Field>
        <Field label="Online programming · monthly" htmlFor="ob-tr-monthly"><MoneyField id="ob-tr-monthly" {...money("priceMonthly")} placeholder="120,000 / month" /></Field>
      </FormGrid>
    </>
  );
}

export function TrainerStep5({ data, setField }: StepProps) {
  return (
    <>
      <StageHead crumb="Step 05 of 06, trainer track" title="Connect your payout." desc="Direct to your account. Binectics never holds your money." />
      <RadioCards
        selected={(data.payout as string) || "paystack"}
        onSelect={(v) => setField("payout", v)}
        options={[
          { id: "paystack", title: "Paystack", desc: "Setup takes 4 minutes. Recommended for ZA + NG." },
          { id: "stripe", title: "Stripe", desc: "For USD / EUR / GBP clients." },
        ]}
      />
    </>
  );
}

export function TrainerStep6({ data }: StepProps) {
  const name = `${(data.firstName as string) || "Your"} ${(data.lastName as string) || "Name"}`;
  const specs = ((data.specializations as string[]) || []).slice(0, 2).join(" & ") || "Specializations";
  const city = (data.city as string) || "City";
  // Only what the trainer answered: no price segment for a blank price or
  // "Set up later", never a made-up one.
  const price =
    data.price1on1Free === true
      ? " · Free sessions"
      : data.price1on1Later !== true && typeof data.price1on1Minor === "number" && data.price1on1Minor > 0 && data.price1on1
        ? ` · ${data.price1on1 as string}/session`
        : "";
  const meta = `${specs} · ${city}${price}`;
  return (
    <>
      <StageHead crumb="Step 06 of 06, trainer track" title="Preview & publish." desc="Your profile goes live the moment we verify your docs. Usually within 48h." />
      <PreviewCard name={name} meta={meta} />
    </>
  );
}

export const TRAINER_STEPS = [TrainerStep1, TrainerStep2, TrainerStep3, TrainerStep4, TrainerStep5, TrainerStep6];
