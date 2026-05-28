"use client";

import { useState } from "react";
import Link from "next/link";
import { BinecticsMark } from "@/components/BinecticsLogo";
import SearchableSelect from "@/components/SearchableSelect";

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

/* ── Upload zone ── */
function Upload({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="py-6 px-6 border-2 border-dashed border-[var(--border-2)] rounded-[12px] text-center text-[var(--fg-3)] mb-3.5 cursor-pointer">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
        className="w-7 h-7 mx-auto mb-2 stroke-[var(--fg-3)]"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5-5 5 5M12 5v12" />
      </svg>
      <div className="text-[13.5px] font-medium text-[var(--ink)]">
        {title}
      </div>
      <div className="text-xs text-[var(--fg-3)] mt-1">{sub}</div>
    </div>
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

/* ── Select (removed — now uses SearchableSelect directly) ── */

/* ════════════════════════════════════════════════════════════════
   Trainer Onboarding — 6 steps
   ════════════════════════════════════════════════════════════════ */
export default function TrainerOnboarding() {
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  /* chip toggles */
  const [specializations, setSpecializations] = useState<Set<string>>(
    new Set(["Strength", "Hypertrophy", "Running"])
  );
  const [formats, setFormats] = useState<Set<string>>(
    new Set(["In-person 1:1", "In-person small group"])
  );

  /* payout radio */
  const [payoutOption, setPayoutOption] = useState(0);

  /* select state */
  const [country, setCountry] = useState("South Africa");
  const [duration, setDuration] = useState("60 min");

  const toggleSpec = (s: string) =>
    setSpecializations((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  const toggleFormat = (s: string) =>
    setFormats((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });

  const next = () => setStep((s) => Math.min(s + 1, totalSteps));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const titles: Record<number, { heading: string; headingItalic?: string; lede: string }> = {
    1: { heading: "Tell us about yourself", lede: "This is what members see in your profile." },
    2: { heading: "Your", headingItalic: "specializations", lede: "Pick up to 5. Members filter on these." },
    3: { heading: "Upload your certifications", lede: "Verified providers convert 3.4x better. We re-check every 24 months." },
    4: { heading: "Set your pricing", lede: "Members see this on your profile. You can always change it." },
    5: { heading: "Connect your payout", lede: "Direct to your account. Binectics never holds your money." },
    6: { heading: "Preview & publish", lede: "Your profile goes live the moment we verify your docs. Usually within 48h." },
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
          Trainer &middot; onboarding &middot; step {step} of {totalSteps}
        </div>

        {/* Steps */}
        <Steps current={step} total={totalSteps} />

        {/* Title */}
        <h1
          className="text-[28px] font-medium text-center leading-[1.2] mb-3"
          style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}
        >
          {t.heading}
          {t.headingItalic && (
            <>
              {" "}
              <em className="font-serif italic">{t.headingItalic}</em>
            </>
          )}
        </h1>
        <p className="text-[14.5px] text-[var(--fg-2)] leading-[1.55] text-center mb-7 max-w-[44ch] mx-auto">
          {t.lede}
        </p>

        {/* ── Step content ── */}

        {step === 1 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
              <div>
                <Label>First name</Label>
                <Input defaultValue="Sarah" />
              </div>
              <div>
                <Label>Last name</Label>
                <Input defaultValue="Okafor" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
              <div>
                <Label>City</Label>
                <Input defaultValue="Cape Town" />
              </div>
              <div>
                <Label>Country</Label>
                <SearchableSelect
                  value={country}
                  onChange={setCountry}
                  options={[{ label: "South Africa", value: "South Africa" }]}
                  placeholder="Select country"
                />
              </div>
            </div>
            <div className="mb-3.5">
              <Label>Headline (60 char)</Label>
              <Input defaultValue="Strength & running coach · Sea Point" />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex gap-1.5 flex-wrap mb-3.5">
              {[
                "Strength",
                "Hypertrophy",
                "Running",
                "Olympic lifting",
                "Powerlifting",
                "Bodybuilding",
                "Functional",
                "Mobility",
                "HIIT",
                "CrossFit",
                "Pre-natal",
                "Post-natal",
              ].map((s) => (
                <Chip
                  key={s}
                  label={s}
                  active={specializations.has(s)}
                  onClick={() => toggleSpec(s)}
                />
              ))}
            </div>
            <div className="mt-[18px]">
              <label className="block mb-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-[var(--fg-3)]">
                Session format
              </label>
              <div className="flex gap-1.5 flex-wrap mb-3.5">
                {[
                  "In-person 1:1",
                  "In-person small group",
                  "Online video",
                  "Programming only",
                  "Hybrid",
                ].map((f) => (
                  <Chip
                    key={f}
                    label={f}
                    active={formats.has(f)}
                    onClick={() => toggleFormat(f)}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Upload
              title="Primary certification"
              sub="NSCA-CSCS · NASM-CPT · ACE · ACSM · etc."
            />
            <Upload
              title="Public liability insurance"
              sub="R 500k minimum cover for in-person"
            />
            <Upload
              title="ID document"
              sub="For payout verification"
            />
          </>
        )}

        {step === 4 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
              <div>
                <Label>1:1 session</Label>
                <Input defaultValue="R 1,200" />
              </div>
              <div>
                <Label>Duration</Label>
                <SearchableSelect
                  value={duration}
                  onChange={setDuration}
                  options={[
                    { label: "60 min", value: "60 min" },
                    { label: "45 min", value: "45 min" },
                    { label: "30 min", value: "30 min" },
                  ]}
                  placeholder="Select duration"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
              <div>
                <Label>4-session pack</Label>
                <Input defaultValue="R 4,200" />
              </div>
              <div>
                <Label>12-session pack</Label>
                <Input defaultValue="R 12,000" />
              </div>
            </div>
            <div className="mb-3.5">
              <Label>Online programming &middot; monthly</Label>
              <Input defaultValue="R 1,800 / month" />
            </div>
          </>
        )}

        {step === 5 && (
          <>
            {[
              { t: "Paystack", s: "Setup takes 4 minutes. Recommended for ZA + NG." },
              { t: "Stripe", s: "For USD / EUR / GBP clients." },
            ].map((opt, i) => (
              <Opt
                key={i}
                title={opt.t}
                sub={opt.s}
                active={payoutOption === i}
                onClick={() => setPayoutOption(i)}
              />
            ))}
          </>
        )}

        {step === 6 && (
          <div
            className="rounded-[10px] mb-3.5 p-[18px] flex gap-3.5 items-start"
            style={{ background: "var(--bg-2)" }}
          >
            <div
              className="w-12 h-12 rounded-lg flex-shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.85 0.05 60), oklch(0.72 0.08 40))",
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">Sarah Okafor</div>
              <div className="font-mono text-[11px] text-[var(--fg-3)] uppercase tracking-[0.04em] mt-0.5">
                Strength &amp; running &middot; Cape Town &middot; R 1,200/session
              </div>
            </div>
            <button
              type="button"
              className="btn-ghost-v2"
              style={{
                fontSize: "12.5px",
                padding: "6px 12px",
                height: "auto",
              }}
            >
              Preview
            </button>
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
              href="/dashboard/trainer"
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
