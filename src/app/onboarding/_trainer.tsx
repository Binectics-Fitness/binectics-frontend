"use client";

import { useEffect } from "react";
import { StepProps, StageHead, FormGrid, Field, TextInput, TextArea, MoneyField, SelectField, ChipGrid, PreviewCard, SessionPriceChoice, sessionPriceHint } from "./_components";
import { PayoutChoice } from "./_payout";
import { SESSION_MISSING, onboardingCurrency } from "./_config";
import { OnboardingCurrencyField } from "./_currency";
import { useAuth } from "@/contexts/AuthContext";
import { useStepCountry } from "./_homeCountry";
import { LISTING_BIO, providerDisplayName } from "./_providerSetup";

const SPECIALIZATIONS = ["Strength", "Hypertrophy", "Running", "Olympic lifting", "Powerlifting", "Bodybuilding", "Functional", "Mobility", "HIIT", "CrossFit", "Pre-natal", "Post-natal"];
const FORMATS = ["In-person 1:1", "In-person small group", "Online video", "Programming only", "Hybrid"];

function toggleChip(list: string[], chip: string, max?: number): string[] {
  if (list.includes(chip)) return list.filter((c) => c !== chip);
  if (max && list.length >= max) return list;
  return [...list, chip];
}

/** The pricing step's prices, cleared when the currency changes. */
const PRICE_KEYS = ["price1on1", "priceMonthly"] as const;

export function TrainerStep1({ data, setField }: StepProps) {
  const { user } = useAuth();
  // Every country, starting on the account's own (or the detected region),
  // and the account's name, so nothing has to be typed twice.
  const country = useStepCountry(data, setField);
  useEffect(() => {
    if (data.firstName === undefined && user?.first_name) setField("firstName", user.first_name);
    if (data.lastName === undefined && user?.last_name) setField("lastName", user.last_name);
  }, [data.firstName, data.lastName, user?.first_name, user?.last_name, setField]);
  return (
    <>
      <StageHead crumb="Step 01 of 05, trainer track" title="Tell us about yourself." desc="This is what members see in your profile." />
      <FormGrid>
        <Field label="First name" htmlFor="ob-tr-first"><TextInput id="ob-tr-first" value={(data.firstName as string) || ""} onChange={(v) => setField("firstName", v)} /></Field>
        <Field label="Last name" htmlFor="ob-tr-last"><TextInput id="ob-tr-last" value={(data.lastName as string) || ""} onChange={(v) => setField("lastName", v)} /></Field>
        <Field label="City" htmlFor="ob-tr-city"><TextInput id="ob-tr-city" value={(data.city as string) || ""} onChange={(v) => setField("city", v)} /></Field>
        <Field label="Country" htmlFor="ob-tr-country"><SelectField id="ob-tr-country" value={country.countryName} placeholder="Choose country" onChange={country.pick} options={country.options} /></Field>
        <OnboardingCurrencyField
          id="ob-tr-currency"
          data={data}
          setField={setField}
          countryCode={country.countryCode || undefined}
          countryName={country.countryName || "your country"}
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
      <StageHead crumb="Step 02 of 05, trainer track" title="Your specializations." desc="Pick up to 5. Members filter on these." />
      <Field label="Specializations" full>
        <ChipGrid options={SPECIALIZATIONS} selected={specs} onToggle={(c) => setField("specializations", toggleChip(specs, c, 5))} />
      </Field>
      <Field label="Session format" full>
        <ChipGrid options={FORMATS} selected={formats} onToggle={(c) => setField("formats", toggleChip(formats, c))} />
      </Field>
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

export function TrainerStep3({ data, setField }: StepProps) {
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
      <StageHead crumb="Step 03 of 05, trainer track" title="Set your pricing." desc="Members see this on your profile. You can always change it." />
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
        <Field label="Online coaching · monthly (optional)" htmlFor="ob-tr-monthly" hint="Becomes a monthly package clients can buy." full><MoneyField id="ob-tr-monthly" {...money("priceMonthly")} placeholder="120,000 / month" /></Field>
      </FormGrid>
      <p style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 10 }}>Session packs can be added from Packages after setup.</p>
    </>
  );
}

export function TrainerStep4({ data, setField }: StepProps) {
  return (
    <>
      <StageHead crumb="Step 04 of 05, trainer track" title="Connect your payout." desc="Payments go straight to your own Paystack account when you've connected one. Until then, Binectics collects them and pays them out to you once payouts are available and your account is verified." />
      <PayoutChoice data={data} setField={setField} />
    </>
  );
}

export function TrainerStep5({ data, setField }: StepProps) {
  const { user } = useAuth();
  const name = providerDisplayName("trainer", data, user) || "Your name";
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
      <StageHead crumb="Step 05 of 05, trainer track" title="Your marketplace profile." desc="Finishing saves this as your profile, as a draft. Add photos and publish it from My profile when you're ready." />
      <FormGrid>
        <Field label="Headline" htmlFor="ob-tr-headline-6" full>
          <TextInput id="ob-tr-headline-6" value={(data.headline as string) || ""} onChange={(v) => setField("headline", v)} placeholder="Strength & running coach" />
        </Field>
        <Field label="Short bio" htmlFor="ob-tr-bio" hint="Who you help and how. Needed, with the headline, to create your profile." full>
          <TextArea id="ob-tr-bio" value={(data[LISTING_BIO] as string) || ""} onChange={(v) => setField(LISTING_BIO, v.slice(0, 3000))} placeholder="I help busy professionals get strong with three sessions a week." />
        </Field>
      </FormGrid>
      <PreviewCard name={name} meta={meta} />
      <p style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 10 }}>You can list your certifications on My profile. Binectics doesn&apos;t check certificates yet, so they show as you enter them.</p>
    </>
  );
}

export const TRAINER_STEPS = [TrainerStep1, TrainerStep2, TrainerStep3, TrainerStep4, TrainerStep5];
