"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getOnboardingRoute } from "@/lib/constants/routes";

/**
 * Self-gating setup banner for first logins. Renders only when the signed-in
 * user has not completed onboarding; dismissal persists per user. Pages just
 * mount <OnboardingBanner /> — no props, no gating at the call site.
 */

const ROLE_CONFIG: Record<string, { title: string; desc: string; steps: string[]; accent: string; soft: string }> = {
  GYM_OWNER: {
    title: "Complete your gym setup",
    desc: "Add your locations, facilities, and business details to publish your listing and start accepting members.",
    steps: ["Gym details & location", "Facilities & amenities", "Business registration", "Pricing & plans"],
    accent: "var(--gym)",
    soft: "var(--gym-soft)",
  },
  TRAINER: {
    title: "Complete your trainer profile",
    desc: "Add your certifications and specialties to get verified — the copilot starts drafting once your first clients join.",
    steps: ["Certifications & credentials", "Specialties & expertise", "Professional bio", "Pricing & availability"],
    accent: "var(--trainer)",
    soft: "var(--trainer-soft)",
  },
  DIETITIAN: {
    title: "Complete your dietitian profile",
    desc: "Add your credentials and license to get verified and start taking client intakes.",
    steps: ["Professional credentials", "License information", "Specialties & approach", "Consultation pricing"],
    accent: "var(--dietitian)",
    soft: "var(--dietitian-soft)",
  },
  USER: {
    title: "Complete your profile",
    desc: "Add your goals and preferences to get matched with verified providers near you.",
    steps: ["Fitness goals", "Preferences & interests", "Location", "Subscription plan"],
    accent: "var(--consumer)",
    soft: "var(--consumer-soft)",
  },
};

function dismissKey(userId: string) {
  return `setup-banner-dismissed:${userId}`;
}

export default function OnboardingBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  // user resolves async, so the stored flag is checked at render time rather
  // than in a state initializer that would only see the pre-auth null user.
  const storedDismissal =
    typeof window !== "undefined" && user
      ? localStorage.getItem(dismissKey(user.id)) === "1"
      : false;

  if (!user || user.is_onboarding_complete || dismissed || storedDismissal) return null;

  const config = ROLE_CONFIG[user.role];
  if (!config) return null; // e.g. ADMIN

  const dismiss = () => {
    localStorage.setItem(dismissKey(user.id), "1");
    setDismissed(true);
  };

  return (
    <div
      className="relative rounded-(--r-3) p-5 sm:p-6"
      style={{ background: config.soft, border: "1px solid var(--border-2)" }}
    >
      <button
        onClick={dismiss}
        className="absolute top-4 right-4 min-h-11 min-w-11 -m-3 flex items-center justify-center"
        style={{ color: "var(--fg-3)" }}
        aria-label="Dismiss setup banner"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] flex items-center gap-2" style={{ color: "var(--fg-3)" }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: config.accent }} />
        Setup
      </div>

      <h2 className="text-[19px] sm:text-[21px] font-medium mt-2" style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}>
        {user.first_name
          ? `Welcome, ${user.first_name} — ${config.title.charAt(0).toLowerCase()}${config.title.slice(1)}`
          : config.title}
      </h2>
      <p className="text-[14px] leading-relaxed mt-1 max-w-[58ch]" style={{ color: "var(--fg-2)" }}>
        {config.desc}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 mt-4 max-w-[60ch]">
        {config.steps.map((step, i) => (
          <div key={step} className="flex items-center gap-2.5">
            <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
              0{i + 1}
            </span>
            <span className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>{step}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
        <Link
          href={getOnboardingRoute(user.role)}
          className="inline-flex items-center justify-center h-11 px-4.5 rounded-(--r-2) text-[14px] font-medium"
          style={{ background: "var(--ink)", color: "var(--bg)", letterSpacing: "-0.005em" }}
        >
          Complete setup →
        </Link>
        <button
          onClick={dismiss}
          className="inline-flex items-center justify-center h-11 px-4.5 rounded-(--r-2) text-[14px] font-medium"
          style={{ border: "1px solid var(--border-2)", color: "var(--fg-2)", background: "transparent" }}
        >
          Later
        </button>
      </div>
    </div>
  );
}
