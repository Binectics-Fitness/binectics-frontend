"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { getOnboardingRoute } from "@/lib/constants/routes";
import { useOnboardingStatus } from "@/lib/queries/onboarding";
import { onboardingService } from "@/lib/api/onboarding";
import { queryKeys } from "@/lib/queries/keys";

/**
 * Self-gating setup banner for first logins. Renders only when the signed-in
 * user has not completed onboarding; dismissal is stored on the server (via
 * the onboarding walkthrough endpoints) so it is per-user and cross-device,
 * not a per-device localStorage flag. Once dismissed it collapses to a slim
 * "Resume setup" row so the guide can always be brought back. Pages just mount
 * <OnboardingBanner /> — no props, no gating at the call site.
 */

/**
 * `plansHref`, when set, adds a secondary CTA pointing at the Binectics plan
 * catalogue. Only the provider roles carry it: they subscribe to a Binectics
 * tier, so onboarding should show them what plans are on offer. A fitness member
 * subscribes to a gym, not to Binectics, so there is nothing to point them at.
 */
const ROLE_CONFIG: Record<
  string,
  {
    title: string;
    desc: string;
    steps: string[];
    accent: string;
    soft: string;
    plansHref?: string;
  }
> = {
  GYM_OWNER: {
    title: "Complete your gym setup",
    desc: "Add your locations, facilities, and business details to publish your listing and start accepting members.",
    steps: ["Gym details & location", "Facilities & amenities", "Business registration", "Pricing & plans"],
    accent: "var(--gym)",
    soft: "var(--gym-soft)",
    plansHref: "/dashboard/billing",
  },
  TRAINER: {
    title: "Complete your trainer profile",
    desc: "Add your certifications and specialties to get verified, the copilot starts drafting once your first clients join.",
    steps: ["Certifications & credentials", "Specialties & expertise", "Professional bio", "Pricing & availability"],
    accent: "var(--trainer)",
    soft: "var(--trainer-soft)",
    plansHref: "/dashboard/billing",
  },
  DIETITIAN: {
    title: "Complete your dietitian profile",
    desc: "Add your credentials and license to get verified and start taking client intakes.",
    steps: ["Professional credentials", "License information", "Specialties & approach", "Consultation pricing"],
    accent: "var(--dietitian)",
    soft: "var(--dietitian-soft)",
    plansHref: "/dashboard/billing",
  },
  USER: {
    title: "Complete your profile",
    desc: "Add your goals and preferences to get matched with verified providers near you.",
    steps: ["Fitness goals", "Preferences & interests", "Location", "Subscription plan"],
    accent: "var(--consumer)",
    soft: "var(--consumer-soft)",
  },
};

export default function OnboardingBanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: status, isLoading } = useOnboardingStatus(!!user);

  // Optimistic override so a click reacts instantly; the server flag (refetched
  // after each call) is the source of truth. null means "defer to the server".
  const [pending, setPending] = useState<null | "dismissed" | "reopened">(null);

  if (!user || user.is_onboarding_complete) return null;

  const config = ROLE_CONFIG[user.role];
  if (!config) return null; // e.g. ADMIN

  // Wait for the server truth before the first render so a user who dismissed
  // on another device does not get a flash of the banner. react-query caches
  // the result, so this only ever delays the very first load.
  if (isLoading && !status) return null;

  const dismissed =
    pending === "dismissed"
      ? true
      : pending === "reopened"
        ? false
        : !!status?.is_dismissed;

  const setDismissed = async (next: boolean) => {
    setPending(next ? "dismissed" : "reopened");
    try {
      const res = next
        ? await onboardingService.walkthroughDismiss()
        : await onboardingService.walkthroughReopen();
      if (!res.success) setPending(null); // revert the optimistic flip on failure
    } catch {
      setPending(null);
    } finally {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.onboarding.status(),
      });
    }
  };

  // Dismissed: collapse to a slim row that can bring the guide back.
  if (dismissed) {
    return (
      <div
        className="flex items-center justify-between gap-3 rounded-(--r-2) px-4 py-2.5"
        style={{ border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: config.accent }}
          />
          <span className="text-[13px] truncate" style={{ color: "var(--fg-3)" }}>
            Setup guide hidden
          </span>
        </div>
        <button
          onClick={() => void setDismissed(false)}
          className="text-[13px] font-medium shrink-0"
          style={{ color: "var(--fg-2)" }}
        >
          Resume setup
        </button>
      </div>
    );
  }

  const dismiss = () => void setDismissed(true);

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
          ? `Welcome, ${user.first_name}, ${config.title.charAt(0).toLowerCase()}${config.title.slice(1)}`
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
        {config.plansHref && (
          <Link
            href={config.plansHref}
            className="inline-flex items-center justify-center h-11 px-4.5 rounded-(--r-2) text-[14px] font-medium"
            style={{ border: "1px solid var(--border-2)", color: "var(--fg-2)", background: "transparent" }}
          >
            Choose your plan
          </Link>
        )}
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
