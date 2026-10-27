"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useOptionalOrganization } from "@/contexts/OrganizationContext";
import { gymViewer } from "@/lib/gymStaffNav";
import { providerBillingApi, type ProviderBillingFeatures } from "@/lib/api/providerBilling";
import { billingResourceLabel, type BillingError } from "@/lib/utils/billingErrors";
import { AccountType, UserRole } from "@/lib/types";

/** Where an owner sees and changes their Binectics plan. */
export const PLAN_GATE_HREF = "/dashboard/billing";

/** "free" → "Free"; unknown → "current". */
function tierLabel(tier: string | null): string {
  if (!tier) return "current";
  return tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase();
}

/**
 * One sentence saying what the plan includes, from a billing refusal
 * (parseBillingError): "Your Free plan doesn't include class schedules."
 * A coach's seats are their clients, so `people: "clients"` names them so
 * (the API counts both against max_active_members).
 */
export function planGateSentence(gate: BillingError, people: "members" | "clients" = "members"): string {
  const label =
    gate.resource === "max_active_members" && people === "clients" ? "active clients" : billingResourceLabel(gate.resource);
  const tier = tierLabel(gate.planTier);
  if (gate.kind === "limit" && gate.limit != null && gate.limit > 0) {
    return `Your ${tier} plan includes ${gate.limit} ${label}, and you're using all of them.`;
  }
  return `Your ${tier} plan doesn't include ${label}.`;
}

/**
 * Whether the signed-in user owns the workspace they're working in, and so
 * buys its plan. A gym's staff (and a gym's trainers) don't: the owner does.
 */
export function usePlanOwner(): boolean {
  const { user } = useAuth();
  const org = useOptionalOrganization()?.currentOrg ?? null;
  // No workspace yet: nothing to refuse, and nobody else to ask.
  if (!org) return true;
  return gymViewer(org, user?.id).isOwner;
}

/**
 * A plan feature the owner's current plan leaves out, read before they
 * reach for it (so a Free gym is told on "+ New class", not after filling
 * the form in). Owner-only, like the billing status it reads; staff get the
 * API's refusal instead. Null while unknown, or when the feature is in.
 */
export function useFeatureGate(feature: keyof ProviderBillingFeatures): BillingError | null {
  return useFeatureGateState(feature).gate;
}

/**
 * useFeatureGate plus whether the answer is in yet. A caller that wants to
 * skip a call the plan would refuse (and so avoid a 403 in the console) must
 * wait for `ready`; before that, `gate` is null only because it is unknown.
 */
export function useFeatureGateState(feature: keyof ProviderBillingFeatures): {
  gate: BillingError | null;
  ready: boolean;
} {
  const isOwner = usePlanOwner();
  const orgId = useOptionalOrganization()?.currentOrg?._id;
  const { data, isLoading } = useQuery({
    queryKey: ["providerBilling", "status", orgId ?? ""],
    queryFn: async () => {
      const res = await providerBillingApi.getStatus(orgId!);
      return res.success && res.data ? res.data : null;
    },
    enabled: isOwner && !!orgId,
    staleTime: 5 * 60_000,
    retry: false,
  });
  // Only an explicit false gates: an older API without the flag allows it.
  const ready = !(isOwner && !!orgId && isLoading);
  if (!data || data.features?.[feature] !== false) return { gate: null, ready };
  return {
    ready,
    gate: {
      kind: "feature",
      message: "",
      resource: feature,
      planTier: data.plan_tier ?? null,
      limit: null,
      currentUsage: null,
    },
  };
}

export interface PlanGateProps {
  /** The refusal, from parseBillingError (or useFeatureGate). */
  gate: BillingError;
  /**
   * Whether this person can change the plan. Defaults to owning the current
   * workspace; staff are told who to ask instead of being sent to Billing.
   */
  canUpgrade?: boolean;
  className?: string;
}

/**
 * The inline message shown when someone reaches for a feature their plan
 * leaves out (discoverability F4, design-system K14): one sentence saying
 * what the plan includes, and one link to Billing for the owner. Staff,
 * who can't buy a plan, are told to ask the gym's owner. Never shown
 * pre-emptively: only where the user reached for the gated thing.
 */
/** Whose seats the workspace counts: a gym's members, or a coach's clients. */
function usePeopleNoun(): "members" | "clients" {
  const { user } = useAuth();
  const org = useOptionalOrganization()?.currentOrg ?? null;
  if (org?.account_type) return org.account_type === AccountType.GYM_OWNER ? "members" : "clients";
  return user?.role === UserRole.TRAINER || user?.role === UserRole.DIETITIAN ? "clients" : "members";
}

export function PlanGate({ gate, canUpgrade, className = "" }: PlanGateProps) {
  const owner = usePlanOwner();
  const people = usePeopleNoun();
  const upgrade = canUpgrade ?? owner;
  return (
    <div
      role="status"
      data-testid="plan-gate"
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-(--r-2) px-4 py-3 ${className}`}
      style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
    >
      <p className="flex-1 min-w-[200px] text-[13.5px] leading-normal" style={{ color: "var(--ink)" }}>
        {planGateSentence(gate, people)}
      </p>
      {upgrade ? (
        <Link href={PLAN_GATE_HREF} className="btn-ghost-v2 sm shrink-0" style={{ textDecoration: "none" }}>
          See plans
        </Link>
      ) : (
        <span className="text-[13px] shrink-0" style={{ color: "var(--fg-3)" }}>
          Ask the gym&rsquo;s owner.
        </span>
      )}
    </div>
  );
}
