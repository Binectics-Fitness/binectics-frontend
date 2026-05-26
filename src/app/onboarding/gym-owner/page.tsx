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
   Gym Owner Onboarding — 8 steps
   ════════════════════════════════════════════════════════════════ */
export default function GymOwnerOnboarding() {
  const [step, setStep] = useState(1);
  const totalSteps = 8;

  /* radio selections per step */
  const [planTemplate, setPlanTemplate] = useState(0);
  const [paymentGateway, setPaymentGateway] = useState(0);
  const [kioskOption, setKioskOption] = useState(0);
  const [staffRole, setStaffRole] = useState(0);

  /* select state */
  const [legalEntity, setLegalEntity] = useState("Pty Ltd");
  const [country, setCountry] = useState("South Africa");

  const next = () => setStep((s) => Math.min(s + 1, totalSteps));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  /* ── Step titles ── */
  const titles: Record<number, { heading: string; headingItalic?: string; lede: string }> = {
    1: { heading: "Business details", lede: "Tell us who you are -- we'll use this on receipts and your verified profile." },
    2: { heading: "Add your first", headingItalic: "location", lede: "You can add more later. We just need one to publish." },
    3: { heading: "Membership plans", lede: "Pick templates to start. Customize anything later." },
    4: { heading: "Verification documents", lede: "We'll review within 48h. Most gyms are approved on the first pass." },
    5: { heading: "Connect your payments", lede: "Payouts go straight to your account. Binectics never holds funds." },
    6: { heading: "Pick your", headingItalic: "kiosk", lede: "QR check-in needs an iPad at each location. Buy or use existing." },
    7: { heading: "Invite your staff", lede: "We'll email each one a unique link to set their password." },
    8: { heading: "Submit for review", lede: "Iron Lab will go live within 48h. We'll email you the moment search traffic starts." },
  };

  const t = titles[step];

  return (
    <div
      className="min-h-screen grid place-items-center p-8"
      style={{ background: "var(--bg-2)" }}
    >
      <div
        className="w-full max-w-[560px] rounded-2xl border border-[var(--border)]"
        style={{ background: "var(--bg)", padding: "clamp(24px, 5vw, 40px) clamp(20px, 4vw, 44px)" }}
      >
        {/* Brand mark */}
        <Link href="/" className="block w-[26px] h-[26px] mx-auto mb-[22px]">
          <BinecticsMark size={26} className="text-[var(--ink)]" />
        </Link>

        {/* Eyebrow */}
        <div className="font-mono text-[11px] text-[var(--fg-3)] uppercase tracking-[0.08em] text-center mb-3">
          Gym owner &middot; onboarding &middot; step {step} of {totalSteps}
        </div>

        {/* Steps */}
        <Steps current={step} total={totalSteps} />

        {/* Title */}
        <h1 className="text-[28px] font-medium text-center leading-[1.2] mb-3" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
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
                <Label>Business name</Label>
                <Input defaultValue="Iron Lab" />
              </div>
              <div>
                <Label>Legal entity</Label>
                <SearchableSelect
                  value={legalEntity}
                  onChange={setLegalEntity}
                  options={[
                    { label: "Pty Ltd", value: "Pty Ltd" },
                    { label: "CC", value: "CC" },
                    { label: "Sole prop", value: "Sole prop" },
                  ]}
                  placeholder="Select entity type"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
              <div>
                <Label>Country</Label>
                <SearchableSelect
                  value={country}
                  onChange={setCountry}
                  options={[{ label: "South Africa", value: "South Africa" }]}
                  placeholder="Select country"
                />
              </div>
              <div>
                <Label>Registration #</Label>
                <Input placeholder="2018/123456/07" />
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="mb-3.5">
              <Label>Location name</Label>
              <Input defaultValue="Sea Point" />
            </div>
            <div className="mb-3.5">
              <Label>Street address</Label>
              <Input placeholder="142 Main Road, Sea Point" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3.5">
              <div>
                <Label>City</Label>
                <Input defaultValue="Cape Town" />
              </div>
              <div>
                <Label>Postal code</Label>
                <Input defaultValue="8005" />
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            {[
              { t: "Standard set · 3 plans", s: "Studio · Pro · Day pass. Used by 78% of gyms." },
              { t: "Boutique · 4 plans", s: "Adds an Annual tier and class-pack option." },
              { t: "CrossFit affiliate", s: "3-class drop-in pricing + monthly unlimited." },
              { t: "Start blank", s: "Build from scratch." },
            ].map((opt, i) => (
              <Opt
                key={i}
                title={opt.t}
                sub={opt.s}
                active={planTemplate === i}
                onClick={() => setPlanTemplate(i)}
              />
            ))}
          </>
        )}

        {step === 4 && (
          <>
            <Upload
              title="Business registration certificate"
              sub="PDF or photo · max 10MB"
            />
            <Upload
              title="Tax registration"
              sub="VAT number proof if registered"
            />
            <Upload
              title="Owner ID"
              sub="South African ID or passport"
            />
          </>
        )}

        {step === 5 && (
          <>
            {[
              { t: "Paystack · ZA · NG · GH · KE", s: "Recommended for African markets. Setup takes 4 minutes." },
              { t: "Stripe · global", s: "USD · EUR · GBP · best for international clients." },
              { t: "Skip for now", s: "You can publish but cannot accept payments until connected." },
            ].map((opt, i) => (
              <Opt
                key={i}
                title={opt.t}
                sub={opt.s}
                active={paymentGateway === i}
                onClick={() => setPaymentGateway(i)}
              />
            ))}
          </>
        )}

        {step === 6 && (
          <>
            {[
              { t: "Use my existing iPad", s: "Free. Download the Binectics Kiosk app from the App Store." },
              { t: "Buy a Binectics-ready kit · R 8,400", s: "iPad mini + wall mount + Stripe card reader. Ships in 3 days." },
              { t: "Skip · I'll set this up later", s: "Members can also check in with their phone." },
            ].map((opt, i) => (
              <Opt
                key={i}
                title={opt.t}
                sub={opt.s}
                active={kioskOption === i}
                onClick={() => setKioskOption(i)}
              />
            ))}
          </>
        )}

        {step === 7 && (
          <>
            <div className="mb-3.5">
              <Label>Coach emails (one per line)</Label>
              <textarea
                defaultValue={`sarah@ironlab.co.za\nthemba@ironlab.co.za\nnadia@ironlab.co.za`}
                className="w-full min-h-[120px] bg-[var(--bg)] border border-[var(--border-2)] rounded-[var(--r-2)] p-3 font-inherit text-sm resize-y"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap mb-3.5">
              {["Coach (standard)", "Coach (manager)", "Front desk"].map(
                (label, i) => (
                  <Chip
                    key={label}
                    label={label}
                    active={staffRole === i}
                    onClick={() => setStaffRole(i)}
                  />
                )
              )}
            </div>
          </>
        )}

        {step === 8 && (
          <div
            className="rounded-[10px] mb-3.5 p-[18px]"
            style={{ background: "var(--bg-2)" }}
          >
            <div className="font-mono text-[11px] text-[var(--fg-3)] uppercase tracking-[0.06em] mb-2.5">
              Submission summary
            </div>
            <table className="w-full text-[13.5px]">
              <tbody>
                {[
                  ["Business", "Iron Lab Pty Ltd"],
                  ["First location", "Sea Point"],
                  ["Plans", "Studio · Pro · Day pass"],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td className="py-1">{k}</td>
                    <td className="py-1 text-right text-[var(--ink)]">{v}</td>
                  </tr>
                ))}
                {[
                  ["Documents", "3 uploaded"],
                  ["Payments", "Paystack"],
                ].map(([k, v]) => (
                  <tr key={k}>
                    <td className="py-1">{k}</td>
                    <td className="py-1 text-right text-[var(--signal-ink)]">
                      {v} &#10003;
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="py-1">Staff invites</td>
                  <td className="py-1 text-right text-[var(--ink)]">
                    3 emails
                  </td>
                </tr>
              </tbody>
            </table>
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
              href="/dashboard/gym"
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
