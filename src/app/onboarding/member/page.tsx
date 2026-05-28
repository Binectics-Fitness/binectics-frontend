"use client";

import { useState } from "react";
import Link from "next/link";
import { BinecticsMark } from "@/components/BinecticsLogo";

/* ── Step indicator ── */
function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1 justify-center mb-6">
      {Array.from({ length: total }, (_, i) => {
        const idx = i + 1;
        let bg = "bg-[var(--border-2)]";
        if (idx < current) bg = "bg-[var(--signal)]";
        if (idx === current) bg = "bg-[var(--ink)]";
        return <span key={idx} className={`w-6 h-1 rounded-sm ${bg}`} />;
      })}
    </div>
  );
}

/* ── Radio option ── */
function Opt({
  title,
  sub,
  active,
  onClick,
}: {
  title: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex gap-3 items-start p-3 rounded-[10px] border cursor-pointer text-left mb-2 ${
        active
          ? "border-[var(--ink)] bg-[var(--bg-2)]"
          : "border-[var(--border)]"
      }`}
    >
      <span
        className={`w-3.5 h-3.5 rounded-full border flex-shrink-0 mt-[3px] ${
          active ? "border-[var(--ink)]" : "border-[var(--border-2)]"
        }`}
        style={
          active
            ? {
                background:
                  "radial-gradient(var(--ink) 40%, transparent 50%)",
              }
            : undefined
        }
      />
      <div>
        <div className="text-[13.5px] font-medium text-[var(--ink)]">
          {title}
        </div>
        <div className="text-[12.5px] text-[var(--fg-3)] mt-0.5 leading-[1.5]">
          {sub}
        </div>
      </div>
    </button>
  );
}

/* ── Chip ── */
function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-[7px] px-3 rounded-full text-[12.5px] cursor-pointer border ${
        active
          ? "bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]"
          : "bg-[var(--bg)] text-[var(--fg-2)] border-[var(--border)]"
      }`}
    >
      {label}
    </button>
  );
}

/* ── Field label ── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block mb-1.5 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--fg-3)]">
      {children}
    </label>
  );
}

/* ── Input ── */
function Input({
  defaultValue,
  placeholder,
}: {
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <input
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="w-full bg-[var(--bg)] border border-[var(--border-2)] rounded-[var(--r-2)] py-[11px] px-3.5 font-inherit text-sm"
    />
  );
}

/* ════════════════════════════════════════════════════════════════
   Member Onboarding — 4 steps
   ════════════════════════════════════════════════════════════════ */
export default function MemberOnboarding() {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  /* step 1: goal */
  const [goalIndex, setGoalIndex] = useState(0);

  /* step 2: provider types */
  const [providerTypes, setProviderTypes] = useState<Set<string>>(
    new Set(["Gyms", "Personal trainers", "Group classes"])
  );

  /* step 3: time slots + days */
  const [timeSlots, setTimeSlots] = useState<Set<string>>(
    new Set(["Early morning · 5–8am", "After work · 5–8pm"])
  );
  const [days, setDays] = useState<Set<string>>(
    new Set(["Mon", "Wed", "Fri", "Sat"])
  );

  const toggleSet = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    value: string
  ) => {
    setter((prev) => {
      const next = new Set(prev);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  };

  const next = () => setStep((s) => Math.min(s + 1, totalSteps));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const titles: Record<number, { heading: string; lede: string }> = {
    1: {
      heading: "What brings you here?",
      lede: "Pick the goal that matters most. You can change it any time.",
    },
    2: {
      heading: "Where do you train?",
      lede: "We'll show providers near you. You can switch cities later.",
    },
    3: {
      heading: "When do you train?",
      lede: "We'll surface providers who match your schedule.",
    },
    4: {
      heading: "You’re all set",
      lede: "We’ve found 14 providers in Cape Town who match. Browse, book, or skip to the marketplace.",
    },
  };

  const t = titles[step];

  return (
    <div
      className="min-h-screen grid place-items-center p-8"
      style={{ background: "var(--bg-2)" }}
    >
      <div
        className="w-full max-w-[560px] rounded-(--r-3) border border-(--border)"
        style={{ background: "var(--bg)", padding: "clamp(24px, 5vw, 40px) clamp(20px, 4vw, 44px)" }}
      >
        {/* Brand mark */}
        <Link href="/" className="block w-[26px] h-[26px] mx-auto mb-[22px]">
          <BinecticsMark size={26} className="text-[var(--ink)]" />
        </Link>

        {/* Eyebrow */}
        <div className="font-mono text-[11px] text-[var(--fg-3)] uppercase tracking-[0.08em] text-center mb-3">
          Member &middot; onboarding &middot; step {step} of {totalSteps}
        </div>

        {/* Steps */}
        <Steps current={step} total={totalSteps} />

        {/* Title */}
        <h1
          className="text-[28px] font-medium text-center leading-[1.2] mb-3"
          style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}
        >
          {t.heading}
        </h1>
        <p className="text-[14.5px] text-[var(--fg-2)] leading-[1.55] text-center mb-7 max-w-[44ch] mx-auto">
          {t.lede}
        </p>

        {/* ── Step content ── */}

        {step === 1 && (
          <>
            {[
              {
                t: "Get strong",
                s: "Build muscle, lift heavier, look more capable.",
              },
              {
                t: "Lose weight · feel lighter",
                s: "Body comp · sustainable habits · no crash diets.",
              },
              {
                t: "Train for an event",
                s: "Marathon · triathlon · obstacle race · etc.",
              },
              {
                t: "Just feel better",
                s: "Move more, eat better, no specific goal.",
              },
              {
                t: "Manage a condition",
                s: "PCOS · diabetes · post-injury · matched with a dietitian.",
              },
            ].map((opt, i) => (
              <Opt
                key={i}
                title={opt.t}
                sub={opt.s}
                active={goalIndex === i}
                onClick={() => setGoalIndex(i)}
              />
            ))}
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-3.5">
              <Label>City</Label>
              <Input defaultValue="Cape Town" />
            </div>
            <div className="mb-3.5">
              <Label>Neighbourhood (optional)</Label>
              <Input placeholder="Sea Point · Camps Bay · Foreshore" />
            </div>
            <div className="mt-[18px]">
              <label className="block mb-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--fg-3)]">
                What kind of providers?
              </label>
              <div className="flex gap-1.5 flex-wrap mb-3.5">
                {[
                  "Gyms",
                  "Personal trainers",
                  "Dietitians",
                  "Group classes",
                ].map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    active={providerTypes.has(p)}
                    onClick={() => toggleSet(setProviderTypes, p)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex gap-1.5 flex-wrap mb-3.5">
              {[
                "Early morning · 5–8am",
                "Late morning · 9–11am",
                "Lunch · 11am–2pm",
                "Afternoon · 2–5pm",
                "After work · 5–8pm",
                "Evening · 8–10pm",
              ].map((s) => (
                <Chip
                  key={s}
                  label={s}
                  active={timeSlots.has(s)}
                  onClick={() => toggleSet(setTimeSlots, s)}
                />
              ))}
            </div>
            <div className="mt-[18px]">
              <label className="block mb-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--fg-3)]">
                Days
              </label>
              <div className="flex gap-1.5 flex-wrap mb-3.5">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                  (d) => (
                    <Chip
                      key={d}
                      label={d}
                      active={days.has(d)}
                      onClick={() => toggleSet(setDays, d)}
                    />
                  )
                )}
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <div
            className="rounded-[10px] mb-3.5 p-[18px]"
            style={{ background: "var(--bg-2)" }}
          >
            <div className="font-mono text-[11px] text-[var(--fg-3)] uppercase tracking-[0.06em] mb-2.5">
              Your matches
            </div>
            <div className="flex gap-2 flex-wrap">
              {[
                "Sarah Okafor",
                "Iron Lab Sea Point",
                "Thandi Nkosi",
                "Marcus Bell",
                "+10 more",
              ].map((name) => (
                <div
                  key={name}
                  className="py-2 px-3 rounded-full text-[12.5px] text-[var(--ink)] border border-[var(--border)]"
                  style={{ background: "var(--bg)" }}
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Actions ── */}
        <div className="flex justify-between items-center mt-[22px]">
          {step > 1 ? (
            <button
              type="button"
              onClick={back}
              className="btn-ghost-v2 lg"
              style={{ height: 42, padding: "0 16px", fontSize: 14 }}
            >
              &larr; Back
            </button>
          ) : (
            <span />
          )}
          {step < totalSteps ? (
            <button
              type="button"
              onClick={next}
              className="btn-primary-v2 lg"
              style={{ height: 42, padding: "0 20px", fontSize: 14 }}
            >
              Continue &rarr;
            </button>
          ) : (
            <Link
              href="/marketplace"
              className="btn-primary-v2 lg"
              style={{ height: 42, padding: "0 20px", fontSize: 14 }}
            >
              Continue &rarr;
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
