"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOptionalOrganization } from "@/contexts/OrganizationContext";
import { useCoachingGym } from "@/hooks/useTrainerAccess";
import { allows, gymPageRule, gymViewer } from "@/lib/gymStaffNav";
import { onboardingService } from "@/lib/api/onboarding";
import { useOnboardingStatus } from "@/lib/queries/onboarding";
import { queryKeys } from "@/lib/queries/keys";
import {
  useMyListing,
  useOrgListing,
  useOrgMembershipPlans,
  useOrgPaymentConfigs,
} from "@/lib/queries/marketplace";
import { setupSteps, type SetupKind, type SetupStep } from "@/lib/provider/setupSteps";

export interface SetupChecklistProps {
  kind: SetupKind;
  /**
   * Clients (trainer, dietitian) or members (gym), from the page, which
   * loads them anyway. Null while they load: the card waits rather than
   * flash "Add your first client" at someone who has fifty.
   */
  people: number | null;
}

/**
 * A new provider's live setup checklist (discoverability F9): what's left
 * before members can find, join and pay them, read from the API. Shown on
 * the trainer and dietitian Today and the gym Overview, once the setup
 * wizard is done (OnboardingBanner covers the time before that).
 *
 * It hides itself when every step is done, or when the provider hides it.
 * Hiding uses the onboarding walkthrough flag, the same per-user,
 * cross-device flag OnboardingBanner's "Later" sets, so a provider who put
 * the setup guide away isn't shown it again under another name.
 *
 * Who sees what:
 * - A gym's trainer (useCoachingGym) sees none of it: the gym sets up.
 * - A gym's staff see only the steps whose page their role opens
 *   (lib/gymStaffNav), never the payment keys, which are the owner's.
 */
export function SetupChecklist({ kind, people }: SetupChecklistProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const org = useOptionalOrganization()?.currentOrg ?? null;
  const orgId = org?._id;
  const coachingGym = useCoachingGym();
  const viewer = gymViewer(org, user?.id);
  // No workspace yet means nobody else owns it either.
  const isOwner = !org || viewer.isOwner;
  const gym = kind === "gym";

  // Coaches set up their own practice; a gym's trainer has nothing to set.
  const applies = !!user?.is_onboarding_complete && (gym || (!coachingGym && isOwner));
  const visible = (href: string) => !gym || allows(viewer, gymPageRule(href.split("#")[0]));
  // Steps whose data this viewer may read, so nothing is asked for that the
  // API would refuse (staff without the listing page, payment keys).
  const wantsListing = applies && (gym ? visible("/dashboard/profile-edit") : true);
  const wantsPlans = applies && !!orgId && visible(gym ? "/dashboard/gym-owner/plans" : "/");
  const wantsPayments = applies && !!orgId && isOwner;

  const status = useOnboardingStatus(applies);
  const orgListing = useOrgListing(orgId, wantsListing && gym);
  const myListing = useMyListing(wantsListing && !gym);
  const plans = useOrgMembershipPlans(orgId, wantsPlans);
  const payments = useOrgPaymentConfigs(wantsPayments ? orgId : undefined);

  // Optimistic hide; the server flag (refetched) is the truth.
  const [hidden, setHidden] = useState(false);

  if (!applies || hidden) return null;
  const listingQuery = gym ? orgListing : myListing;
  const loading =
    status.isLoading ||
    people == null ||
    (wantsListing && listingQuery.isLoading) ||
    (wantsPlans && plans.isLoading) ||
    (wantsPayments && payments.isLoading);
  if (loading || status.data?.is_dismissed) return null;

  const steps = setupSteps(kind, {
    listing: listingQuery.data ?? null,
    activePlans: (plans.data ?? []).filter((p) => p.is_active).length,
    payments: wantsPayments ? (payments.data ?? []) : null,
    people,
  }).filter((s) => {
    if (s.key === "listing") return wantsListing;
    if (s.key === "plans") return wantsPlans || (!gym && !orgId);
    return visible(s.href);
  });

  const done = steps.filter((s) => s.done).length;
  if (steps.length === 0 || done === steps.length) return null;

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
          onClick={() => void hide()}
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
