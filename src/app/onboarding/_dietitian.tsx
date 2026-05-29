"use client";

import { StepProps, StageHead, FormGrid, Field, TextInput, SelectInput, ChipGrid, UploadZone, RadioCards, PreviewCard } from "./_components";

const SPECIALIZATIONS = ["PCOS", "Diabetes", "Sport performance", "Gestational", "IBS · FODMAP", "Pre/post-natal", "Weight management", "Cardiovascular", "Renal", "Paediatric", "Eating disorders"];
const POPULATIONS = ["Adults", "Athletes", "Children", "Pre/post-natal", "Seniors"];

function toggleChip(list: string[], chip: string, max?: number): string[] {
  if (list.includes(chip)) return list.filter((c) => c !== chip);
  if (max && list.length >= max) return list;
  return [...list, chip];
}

export function DietStep1({ data, setField }: StepProps) {
  return (
    <>
      <StageHead crumb="Step 01 of 06 — dietitian track" title="Your practice basics." desc="We'll list this on your profile." />
      <FormGrid>
        <Field label="Full name (with title)"><TextInput value={(data.fullName as string) || ""} onChange={(v) => setField("fullName", v)} placeholder="Dr Nadia Hassan, RD" /></Field>
        <Field label="Pronouns"><TextInput value={(data.pronouns as string) || ""} onChange={(v) => setField("pronouns", v)} placeholder="she/her" /></Field>
        <Field label="City"><TextInput value={(data.city as string) || ""} onChange={(v) => setField("city", v)} placeholder="Lagos" /></Field>
        <Field label="Country"><SelectInput value={(data.country as string) || "Nigeria"} onChange={(v) => setField("country", v)} options={["Nigeria", "South Africa", "Kenya", "Ghana", "United States", "United Kingdom"]} /></Field>
        <Field label="Practice name (optional)" full><TextInput value={(data.practiceName as string) || ""} onChange={(v) => setField("practiceName", v)} placeholder="Nadia Hassan Clinical Nutrition" /></Field>
      </FormGrid>
    </>
  );
}

export function DietStep2() {
  return (
    <>
      <StageHead crumb="Step 02 of 06 — dietitian track" title="Licensure." desc="Dietitians are licensed practitioners — we verify against the regulatory body." />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <UploadZone title="Registered Dietitian license" hint="DAN (Nigeria) · HPCSA (SA) · CDR (US) etc." />
        <UploadZone title="Highest qualification" hint="BSc Dietetics · MSc Clinical Nutrition · PhD etc." />
        <UploadZone title="Professional indemnity" hint="Minimum cover varies by country" />
      </div>
    </>
  );
}

export function DietStep3({ data, setField }: StepProps) {
  const specs = (data.specializations as string[]) || [];
  const pops = (data.populations as string[]) || [];
  return (
    <>
      <StageHead crumb="Step 03 of 06 — dietitian track" title="Your specializations." desc="Up to 5. Members filter on these." />
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
      <StageHead crumb="Step 04 of 06 — dietitian track" title="Seed your library." desc="Pick a starter pack — protocols and meal-plan templates you can customize per client." />
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

export function DietStep5({ data, setField }: StepProps) {
  return (
    <>
      <StageHead crumb="Step 05 of 06 — dietitian track" title="Connect your payout." desc="Direct to your bank account. Binectics never holds your money." />
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

export function DietStep6({ data }: StepProps) {
  const name = (data.fullName as string) || "Your Name";
  const specs = ((data.specializations as string[]) || []).slice(0, 3).map((s) => s.toLowerCase()).join(" · ") || "specializations";
  const city = (data.city as string) || "City";
  return (
    <>
      <StageHead crumb="Step 06 of 06 — dietitian track" title="Preview & publish." desc="Your profile goes live the moment we verify your license. Usually within 48h." />
      <PreviewCard name={name} meta={`${specs} · ${city} · ₦ 38k/consult`} />
    </>
  );
}

export const DIETITIAN_STEPS = [DietStep1, DietStep2, DietStep3, DietStep4, DietStep5, DietStep6];
