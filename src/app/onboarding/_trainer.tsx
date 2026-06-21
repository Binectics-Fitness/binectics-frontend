"use client";

import { StepProps, StageHead, FormGrid, Field, TextInput, SelectField, ChipGrid, UploadZone, RadioCards, PreviewCard } from "./_components";

const SPECIALIZATIONS = ["Strength", "Hypertrophy", "Running", "Olympic lifting", "Powerlifting", "Bodybuilding", "Functional", "Mobility", "HIIT", "CrossFit", "Pre-natal", "Post-natal"];
const FORMATS = ["In-person 1:1", "In-person small group", "Online video", "Programming only", "Hybrid"];

function toggleChip(list: string[], chip: string, max?: number): string[] {
  if (list.includes(chip)) return list.filter((c) => c !== chip);
  if (max && list.length >= max) return list;
  return [...list, chip];
}

export function TrainerStep1({ data, setField }: StepProps) {
  return (
    <>
      <StageHead crumb="Step 01 of 06 — trainer track" title="Tell us about yourself." desc="This is what members see in your profile." />
      <FormGrid>
        <Field label="First name"><TextInput value={(data.firstName as string) || ""} onChange={(v) => setField("firstName", v)} /></Field>
        <Field label="Last name"><TextInput value={(data.lastName as string) || ""} onChange={(v) => setField("lastName", v)} /></Field>
        <Field label="City"><TextInput value={(data.city as string) || ""} onChange={(v) => setField("city", v)} /></Field>
        <Field label="Country"><SelectField value={(data.country as string) || "South Africa"} onChange={(v) => setField("country", v)} options={["South Africa", "Nigeria", "Kenya", "Ghana", "United States", "United Kingdom"]} /></Field>
        <Field label="Headline (60 char)" hint="Shows under your name in marketplace results." full>
          <TextInput value={(data.headline as string) || ""} onChange={(v) => setField("headline", v)} placeholder="Strength & running coach · Sea Point" />
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
      <StageHead crumb="Step 02 of 06 — trainer track" title="Your specializations." desc="Pick up to 5. Members filter on these." />
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
      <StageHead crumb="Step 03 of 06 — trainer track" title="Upload your certifications." desc="Verified providers convert 3.4x better. We re-check every 24 months." />
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

export function TrainerStep4({ data, setField }: StepProps) {
  return (
    <>
      <StageHead crumb="Step 04 of 06 — trainer track" title="Set your pricing." desc="Members see this on your profile. You can always change it." />
      <FormGrid>
        <Field label="1:1 session"><TextInput value={(data.price1on1 as string) || ""} onChange={(v) => setField("price1on1", v)} placeholder="₦ 80,000" /></Field>
        <Field label="Duration"><SelectField value={(data.duration as string) || "60 min"} onChange={(v) => setField("duration", v)} options={["60 min", "45 min", "30 min"]} /></Field>
        <Field label="4-session pack"><TextInput value={(data.price4pack as string) || ""} onChange={(v) => setField("price4pack", v)} placeholder="₦ 280,000" /></Field>
        <Field label="12-session pack"><TextInput value={(data.price12pack as string) || ""} onChange={(v) => setField("price12pack", v)} placeholder="₦ 800,000" /></Field>
        <Field label="Online programming · monthly" full><TextInput value={(data.priceMonthly as string) || ""} onChange={(v) => setField("priceMonthly", v)} placeholder="₦ 120,000 / month" /></Field>
      </FormGrid>
    </>
  );
}

export function TrainerStep5({ data, setField }: StepProps) {
  return (
    <>
      <StageHead crumb="Step 05 of 06 — trainer track" title="Connect your payout." desc="Direct to your account. Binectics never holds your money." />
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
  const price = (data.price1on1 as string) || "₦ 80,000";
  const meta = `${specs} · ${city} · ${price}/session`;
  return (
    <>
      <StageHead crumb="Step 06 of 06 — trainer track" title="Preview & publish." desc="Your profile goes live the moment we verify your docs. Usually within 48h." />
      <PreviewCard name={name} meta={meta} />
    </>
  );
}

export const TRAINER_STEPS = [TrainerStep1, TrainerStep2, TrainerStep3, TrainerStep4, TrainerStep5, TrainerStep6];
