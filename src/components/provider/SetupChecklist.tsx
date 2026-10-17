"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOptionalOrganization } from "@/contexts/OrganizationContext";
import { useCoachingGym } from "@/hooks/useTrainerAccess";
import { allows, gymPageRule, gymViewer } from "@/lib/gymStaffNav";
import { consultationsService } from "@/lib/api/consultations";
import { onboardingService } from "@/lib/api/onboarding";
import { useOnboardingStatus } from "@/lib/queries/onboarding";
import { queryKeys } from "@/lib/queries/keys";
import {
  useMyListing,
  useOrgListing,
  useOrgMembershipPlans,
  useOrgPaymentConfigs,
} from "@/lib/queries/marketplace";
import {
  SETUP_HREFS,
  coachSetupSteps,
  gymSetupSteps,
  type CoachKind,
  type SetupKind,
  type SetupStep,
} from "@/lib/provider/setupSteps";

export interface SetupChecklistProps {
  kind: SetupKind;
  /**
   * Clients (trainer, dietitian) or members (gym), from the page, which
   * loads them anyway. Null while they load, or when they couldn't be read:
   * the card waits rather than tell someone with fifty clients to add one.
   */
  people: number | null;
}

/**
 * A new provider's live setup checklist (discoverability F9): what's left
 * before members can find, book, join and pay them, read from the API
 * (lib/provider/setupSteps). Shown on the trainer and dietitian Today and
 * the gym Overview, once the setup wizard is done (OnboardingBanner covers
 * the time before that).
 *
 * It hides itself when every step is done, or when the provider hides it.
 * Hiding uses the onboarding walkthrough flag, the same per-user,
 * cross-device flag the coach app's checklist and OnboardingBanner use;
 * ShowSetupChecklist (in each provider's Settings) brings it back.
 *
 * Who sees what:
 * - A gym's trainer gets the coach steps without the listing (as on mobile).
 * - A gym's staff see only the steps whose page their role opens
 *   (lib/gymStaffNav), never the payment keys, which are the owner's.
 */
export function SetupChecklist({ kind, people }: SetupChecklistProps) {
  return kind === "gym" ? <GymChecklist people={people} /> : <CoachChecklist kind={kind} people={people} />;
}

/** Whether the checklist is for this person at all, and the Hide state they share. */
function useChecklistVisibility() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const applies = !!user?.is_onboarding_complete;
  const status = useOnboardingStatus(applies);
  // Optimistic hide; the server flag (refetched) is the truth.
  const [hidden, setHidden] = useState(false);
  const hide = async () => {
    setHidden(true);
    try {
      const res = await onboardingService.walkthroughDismiss();
      if (!res.success) setHidden(false);
    } catch {
      setHidden(false);
    } finally {
      void queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() });
    }
  };
  return {
    applies,
    loading: status.isLoading,
    hidden: hidden || !!status.data?.is_dismissed,
    hide,
  };
}

function CoachChecklist({ kind, people }: { kind: CoachKind; people: number | null }) {
  const vis = useChecklistVisibility();
  const staffTrainer = !!useCoachingGym();
  const listing = useMyListing(vis.applies && !staffTrainer);
  const rules = useQuery({
    queryKey: ["consultations", "myAvailability"],
    queryFn: async () => {
      const res = await consultationsService.getMyAvailability();
      return res.success && Array.isArray(res.data) ? res.data : [];
    },
    enabled: vis.applies,
  });
  const ownTypes = useQuery({
    queryKey: ["consultations", "ownTypes"],
    queryFn: async () => {
      const res = await consultationsService.getOwnTypes();
      return res.success && Array.isArray(res.data) ? res.data : [];
    },
    enabled: vis.applies,
  });

  if (!vis.applies || vis.hidden) return null;
  if (vis.loading || people == null || (!staffTrainer && listing.isLoading) || rules.isLoading || ownTypes.isLoading) {
    return null;
  }
  const steps = coachSetupSteps(kind, {
    listing: staffTrainer ? null : (listing.data ?? null),
    rules: rules.data ?? [],
    ownTypes: ownTypes.data ?? [],
    people,
    staffTrainer,
  });
  return <ChecklistCard steps={steps} onHide={vis.hide} />;
}

function GymChecklist({ people }: { people: number | null }) {
  const { user } = useAuth();
  const vis = useChecklistVisibility();
  const org = useOptionalOrganization()?.currentOrg ?? null;
  const orgId = org?._id;
  const viewer = gymViewer(org, user?.id);
  const opens = (href: string) => allows(viewer, gymPageRule(href.split("#")[0]));
  // Only what this viewer may read, so nothing is asked for that the API
  // would refuse (staff without the listing page; the owner's keys).
  const wantsListing = vis.applies && !!orgId && opens(SETUP_HREFS.gym.listing);
  const wantsPlans = vis.applies && !!orgId && opens(SETUP_HREFS.gym.plans);
  const wantsPayments = vis.applies && !!orgId && viewer.isOwner;

  const listing = useOrgListing(orgId, wantsListing);
  const plans = useOrgMembershipPlans(orgId, wantsPlans);
  const payments = useOrgPaymentConfigs(wantsPayments ? orgId : undefined);

  if (!vis.applies || vis.hidden || !orgId) return null;
  if (
    vis.loading ||
    people == null ||
    (wantsListing && listing.isLoading) ||
    (wantsPlans && plans.isLoading) ||
    (wantsPayments && payments.isLoading)
  ) {
    return null;
  }
  const steps = gymSetupSteps({
    listing: listing.data ?? null,
    activePlans: (plans.data ?? []).filter((p) => p.is_active).length,
    payments: wantsPayments ? (payments.data ?? []) : null,
    people,
  }).filter((s) => {
    if (s.key === "listing") return wantsListing;
    if (s.key === "plans") return wantsPlans;
    return opens(s.href);
  });
  return <ChecklistCard steps={steps} onHide={vis.hide} />;
}

function ChecklistCard({ steps, onHide }: { steps: SetupStep[]; onHide: () => Promise<void> }) {
  const done = steps.filter((s) => s.done).length;
  if (steps.length === 0 || done === steps.length) return null;
  return (
    <section
      aria-labelledby="setup-checklist-title"
      data-testid="setup-checklist"
      className="rounded-(--r-3)"
      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between gap-3 px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-baseline gap-3 min-w-0">
          <h2 id="setup-checklist-title" className="text-[14px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>
            Get set up
          </h2>
          <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
            {done} of {steps.length} done
          </span>
        </div>
        <button
          type="button"
          onClick={() => void onHide()}
          aria-label="Hide the setup checklist"
          className="min-h-11 -my-2 px-2 text-[13px] underline underline-offset-2 shrink-0"
          style={{ color: "var(--fg-2)" }}
        >
          Hide
        </button>
      </div>
      <ul>
        {steps.map((s, i) => (
          <li key={s.key} style={{ borderBottom: i < steps.length - 1 ? "1px solid var(--border)" : "none" }}>
            <StepRow step={s} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function StepRow({ step }: { step: SetupStep }) {
  return (
    <Link
      href={step.href}
      className="flex items-center gap-3 px-4.5 py-3 min-h-15 hover:bg-[var(--bg-2)] focus-visible:outline-2 focus-visible:-outline-offset-2"
      style={{ textDecoration: "none" }}
    >
      <span
        aria-hidden
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={step.done ? { background: "var(--signal)", color: "var(--bg)" } : { border: "1.5px solid var(--border-2)" }}
      >
        {step.done && <Check size={14} strokeWidth={2.4} />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13.5px] font-medium" style={{ color: step.done ? "var(--fg-3)" : "var(--ink)" }}>
          {step.title}
          <span className="sr-only">{step.done ? ", done" : ", to do"}</span>
        </span>
        <span className="block text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
          {step.detail}
        </span>
      </span>
      <ChevronRight aria-hidden size={16} style={{ color: "var(--fg-3)" }} className="shrink-0" />
    </Link>
  );
}

/**
 * The way back after Hide, in each provider's Settings (like the coach
 * app's "Show setup checklist" on Me). Only there while the checklist is
 * hidden; it clears the same walkthrough flag Hide set.
 */
export function ShowSetupChecklist({ where, className = "" }: { where: "Today" | "Overview"; className?: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const applies = !!user?.is_onboarding_complete;
  const status = useOnboardingStatus(applies);
  const [state, setState] = useState<"idle" | "busy" | "shown" | "failed">("idle");

  if (!applies || (!status.data?.is_dismissed && state !== "shown")) return null;

  const reopen = async () => {
    setState("busy");
    try {
      const res = await onboardingService.walkthroughReopen();
      setState(res.success ? "shown" : "failed");
    } catch {
      setState("failed");
    } finally {
      void queryClient.invalidateQueries({ queryKey: queryKeys.onboarding.status() });
    }
  };

  return (
    <div
      data-testid="show-setup-checklist"
      className={`${className} flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-(--r-3) px-4.5 py-3.5`}
      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
    >
      <div className="min-w-0">
        <h2 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Setup checklist</h2>
        <p role="status" className="text-[12.5px] mt-0.5" style={{ color: state === "failed" ? "var(--danger)" : "var(--fg-3)" }}>
          {state === "shown"
            ? `Back on your ${where}.`
            : state === "failed"
              ? "We couldn't bring it back. Try again."
              : `Hidden from your ${where}.`}
        </p>
      </div>
      {state !== "shown" && (
        <button type="button" className="btn-ghost-v2 sm shrink-0" disabled={state === "busy"} onClick={() => void reopen()}>
          Show setup checklist
        </button>
      )}
    </div>
  );
}
