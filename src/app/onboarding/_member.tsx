"use client";

import { StepProps, StageHead, FormGrid, Field, TextInput, ChipGrid, RadioCards } from "./_components";

function toggleChip(list: string[], chip: string): string[] {
  return list.includes(chip) ? list.filter((c) => c !== chip) : [...list, chip];
}

export function MemberStep1({ data, setField }: StepProps) {
  return (
    <>
      <StageHead crumb="Step 01 of 04 — member track" title="What brings you here?" desc="Pick the goal that matters most. You can change it any time." />
      <RadioCards
        selected={(data.goal as string) || "strong"}
        onSelect={(v) => setField("goal", v)}
        options={[
          { id: "strong", title: "Get strong", desc: "Build muscle, lift heavier, look more capable." },
          { id: "weight", title: "Lose weight · feel lighter", desc: "Body comp · sustainable habits · no crash diets." },
          { id: "event", title: "Train for an event", desc: "Marathon · triathlon · obstacle race · etc." },
          { id: "better", title: "Just feel better", desc: "Move more, eat better, no specific goal." },
          { id: "condition", title: "Manage a condition", desc: "PCOS · diabetes · post-injury · matched with a dietitian." },
        ]}
      />
    </>
  );
}

export function MemberStep2({ data, setField }: StepProps) {
  const providers = (data.providerTypes as string[]) || [];
  return (
    <>
      <StageHead crumb="Step 02 of 04 — member track" title="Where do you train?" desc="We'll show providers near you. You can switch cities later." />
      <FormGrid>
        <Field label="City"><TextInput value={(data.city as string) || ""} onChange={(v) => setField("city", v)} placeholder="Cape Town" /></Field>
        <Field label="Neighbourhood (optional)"><TextInput value={(data.neighbourhood as string) || ""} onChange={(v) => setField("neighbourhood", v)} placeholder="Sea Point · Camps Bay · Foreshore" /></Field>
      </FormGrid>
      <Field label="What kind of providers?" full>
        <ChipGrid
          options={["Gyms", "Personal trainers", "Dietitians", "Group classes"]}
          selected={providers}
          onToggle={(c) => setField("providerTypes", toggleChip(providers, c))}
        />
      </Field>
    </>
  );
}

export function MemberStep3({ data, setField }: StepProps) {
  const times = (data.times as string[]) || [];
  const days = (data.days as string[]) || [];
  return (
    <>
      <StageHead crumb="Step 03 of 04 — member track" title="When do you train?" desc="We'll surface providers who match your schedule." />
      <Field label="Time slots" full>
        <ChipGrid
          options={["Early morning · 5-8am", "Late morning · 9-11am", "Lunch · 11am-2pm", "Afternoon · 2-5pm", "After work · 5-8pm", "Evening · 8-10pm"]}
          selected={times}
          onToggle={(c) => setField("times", toggleChip(times, c))}
        />
      </Field>
      <Field label="Days" full>
        <ChipGrid
          options={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]}
          selected={days}
          onToggle={(c) => setField("days", toggleChip(days, c))}
        />
      </Field>
    </>
  );
}

export function MemberStep4({ data }: StepProps) {
  const city = (data.city as string) || "your area";
  return (
    <>
      <StageHead crumb="Step 04 of 04 — member track" title="You're all set." desc={`We've found providers in ${city} who match. Hit "Go to dashboard" below to start exploring.`} />
      <div style={{ padding: 20, background: "var(--bg-2)", borderRadius: "var(--r-3)", border: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-3)", marginBottom: 8 }}>What happens next</div>
        <div style={{ fontSize: "13.5px", color: "var(--fg-2)", lineHeight: 1.55 }}>
          Browse the marketplace, book your first session, and track your progress — all from your home page.
        </div>
      </div>
    </>
  );
}

export const MEMBER_STEPS = [MemberStep1, MemberStep2, MemberStep3, MemberStep4];
