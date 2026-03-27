"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { teamsService, type CreateOrganizationRequest } from "@/lib/api/teams";
import { marketplaceService } from "@/lib/api/marketplace";
import { UserRole, AccountType, type MarketplaceListing } from "@/lib/types";

// ─── Types ───

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  isComplete: boolean;
  href?: string;
  ctaLabel: string;
  isRequired: boolean;
}

interface ProviderOnboardingChecklistProps {
  className?: string;
}

// ─── Role-specific config ───

const ROLE_CONFIG: Record<
  string,
  {
    accent: string;
    accountType: AccountType;
    orgLabel: string;
    orgPlaceholder: string;
    orgDescPlaceholder: string;
    marketplaceHref: string;
    staffHref: string;
    profileHref: string;
  }
> = {
  [UserRole.GYM_OWNER]: {
    accent: "blue",
    accountType: AccountType.GYM_OWNER,
    orgLabel: "gym",
    orgPlaceholder: "e.g. FitZone Downtown",
    orgDescPlaceholder:
      "Brief description of your gym — location, vibe, what makes it unique",
    marketplaceHref: "/dashboard/gym-owner/marketplace",
    staffHref: "/dashboard/gym-owner/staff",
    profileHref: "/dashboard/gym-owner/settings",
  },
  [UserRole.DIETITIAN]: {
    accent: "purple",
    accountType: AccountType.DIETITIAN,
    orgLabel: "practice",
    orgPlaceholder: "e.g. NutriBalance Clinic",
    orgDescPlaceholder:
      "Brief description of your practice — your approach, specialties, mission",
    marketplaceHref: "/dashboard/marketplace",
    staffHref: "/dashboard/team",
    profileHref: "/dashboard/dietitian/settings",
  },
};

// ─── Color helpers ───

const ACCENT_CLASSES = {
  blue: {
    bg: "bg-accent-blue-50",
    border: "border-accent-blue-200",
    text: "text-accent-blue-900",
    textMuted: "text-accent-blue-700",
    button:
      "bg-accent-blue-500 hover:bg-accent-blue-600 active:bg-accent-blue-700 text-white",
    buttonOutline:
      "border-2 border-accent-blue-300 text-accent-blue-700 hover:bg-accent-blue-50",
    ring: "ring-accent-blue-500",
    progressBg: "bg-accent-blue-100",
    progressFill: "bg-accent-blue-500",
    stepDone: "bg-accent-blue-500 text-white",
    stepCurrent: "border-2 border-accent-blue-500 text-accent-blue-600",
    stepUpcoming: "border-2 border-neutral-300 text-neutral-400",
    connectorDone: "bg-accent-blue-500",
    connectorPending: "bg-neutral-200",
  },
  purple: {
    bg: "bg-accent-purple-50",
    border: "border-accent-purple-200",
    text: "text-accent-purple-900",
    textMuted: "text-accent-purple-700",
    button:
      "bg-accent-purple-500 hover:bg-accent-purple-600 active:bg-accent-purple-700 text-white",
    buttonOutline:
      "border-2 border-accent-purple-300 text-accent-purple-700 hover:bg-accent-purple-50",
    ring: "ring-accent-purple-500",
    progressBg: "bg-accent-purple-100",
    progressFill: "bg-accent-purple-500",
    stepDone: "bg-accent-purple-500 text-white",
    stepCurrent: "border-2 border-accent-purple-500 text-accent-purple-600",
    stepUpcoming: "border-2 border-neutral-300 text-neutral-400",
    connectorDone: "bg-accent-purple-500",
    connectorPending: "bg-neutral-200",
  },
};

// ─── Main Component ───

export default function ProviderOnboardingChecklist({
  className = "",
}: ProviderOnboardingChecklistProps) {
  const { user } = useAuth();
  const { currentOrg, refreshOrganizations } = useOrganization();

  // Step status
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [teamMemberCount, setTeamMemberCount] = useState(0);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [statusError, setStatusError] = useState("");

  // Org creation form
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [orgError, setOrgError] = useState("");

  // UI
  const [isDismissed, setIsDismissed] = useState(false);

  const role = user?.role;
  const config = role ? ROLE_CONFIG[role] : null;
  const colors = config
    ? ACCENT_CLASSES[config.accent as keyof typeof ACCENT_CLASSES]
    : null;

  // ─── Load onboarding status ───

  const checkStatus = useCallback(async () => {
    if (!user || !config) return;
    setIsCheckingStatus(true);
    setStatusError("");

    try {
      // Check marketplace listing
      if (currentOrg?._id) {
        try {
          const listingRes = await marketplaceService.getOrgListing(
            currentOrg._id,
          );
          if (listingRes.success && listingRes.data) {
            setListing(listingRes.data);
          }
        } catch {
          // 404 is expected when no listing exists — ignore
        }
      }

      // Check team members
      if (currentOrg?._id) {
        try {
          const membersRes = await teamsService.getMembers(currentOrg._id);
          if (membersRes.success && membersRes.data) {
            setTeamMemberCount(membersRes.data.length);
          }
        } catch {
          // Non-critical — team count defaults to 0
        }
      }
    } catch {
      setStatusError("Failed to load onboarding status. Please refresh.");
    } finally {
      setIsCheckingStatus(false);
    }
  }, [user, config, currentOrg?._id]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // ─── Org creation ───

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config || !orgName.trim()) return;

    setIsCreatingOrg(true);
    setOrgError("");

    const payload: CreateOrganizationRequest = {
      name: orgName.trim(),
      description: orgDescription.trim() || undefined,
      account_type: config.accountType,
    };

    const res = await teamsService.createOrganization(payload);
    if (res.success) {
      setShowOrgForm(false);
      setOrgName("");
      setOrgDescription("");
      await refreshOrganizations();
    } else {
      setOrgError(res.message || "Failed to create organization");
    }
    setIsCreatingOrg(false);
  };

  // ─── Build steps ───

  if (!user || !config || !colors || isDismissed) return null;

  const hasOrg = !!currentOrg;
  const hasListing = !!listing;
  const isPublished = !!listing?.is_published;
  const hasTeam = teamMemberCount > 1; // >1 because owner is always member

  const steps: OnboardingStep[] = [
    {
      id: "org",
      title: `Create your ${config.orgLabel}`,
      description: `Set up your ${config.orgLabel} organization — this is required before you can appear on the marketplace.`,
      isComplete: hasOrg,
      ctaLabel: hasOrg
        ? "Done"
        : `Create ${config.orgLabel.charAt(0).toUpperCase() + config.orgLabel.slice(1)}`,
      isRequired: true,
    },
    {
      id: "listing",
      title: "Set up marketplace listing",
      description:
        "Create your public profile with headline, photos, pricing, and details that potential clients will see.",
      isComplete: hasListing,
      href: hasOrg ? config.marketplaceHref : undefined,
      ctaLabel: hasListing ? "Edit Listing" : "Create Listing",
      isRequired: true,
    },
    {
      id: "team",
      title: "Invite your team",
      description:
        "Add staff members and assign roles so your team can help manage operations.",
      isComplete: hasTeam,
      href: hasOrg ? config.staffHref : undefined,
      ctaLabel: hasTeam ? "Manage Team" : "Invite Members",
      isRequired: false,
    },
    {
      id: "publish",
      title: "Go live on the marketplace",
      description:
        "Publish your listing to become discoverable by potential clients in your area.",
      isComplete: isPublished,
      href: hasOrg ? config.marketplaceHref : undefined,
      ctaLabel: isPublished ? "View Listing" : "Publish Listing",
      isRequired: true,
    },
  ];

  const completedCount = steps.filter((s) => s.isComplete).length;
  const totalRequired = steps.filter((s) => s.isRequired).length;
  const completedRequired = steps.filter(
    (s) => s.isRequired && s.isComplete,
  ).length;
  const allRequiredDone = completedRequired === totalRequired;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  // Don't show if everything is done and user has dismissed before
  if (allRequiredDone && isPublished && hasTeam) return null;

  // Show skeleton while checking
  if (isCheckingStatus) {
    return (
      <div
        className={`rounded-2xl border-2 ${colors.border} ${colors.bg} p-6 animate-pulse ${className}`}
      >
        <div className="h-6 w-48 bg-neutral-200 rounded mb-4" />
        <div className="h-2 w-full bg-neutral-200 rounded mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-neutral-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-neutral-200 rounded" />
                <div className="h-3 w-64 bg-neutral-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Show error state if status check failed
  if (statusError) {
    return (
      <div
        className={`rounded-2xl border-2 ${colors.border} ${colors.bg} p-6 ${className}`}
      >
        <p className="text-sm text-red-600 mb-3">{statusError}</p>
        <button
          onClick={() => void checkStatus()}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${colors.button}`}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-2xl border-2 ${colors.border} ${colors.bg} p-6 sm:p-8 ${className}`}
    >
      {/* Dismiss if all required done */}
      {allRequiredDone && (
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-4 right-4 text-foreground-tertiary hover:text-foreground-secondary transition-colors"
          aria-label="Dismiss"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}

      {/* Header */}
      <div className="mb-5">
        <h2 className={`text-xl font-black ${colors.text} mb-1`}>
          {allRequiredDone
            ? "You're all set!"
            : `Get your ${config.orgLabel} ready`}
        </h2>
        <p className={`text-sm ${colors.textMuted}`}>
          {allRequiredDone
            ? "All required steps are complete. Here's what you can still do."
            : `Complete these steps to be listed on the marketplace. ${completedCount} of ${steps.length} done.`}
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className={`h-2 rounded-full ${colors.progressBg}`}>
          <div
            className={`h-2 rounded-full ${colors.progressFill} transition-all duration-500 ease-out`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-0">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const isCurrent =
            !step.isComplete &&
            steps.slice(0, index).every((s) => s.isComplete || !s.isRequired);
          const isLocked =
            !step.isComplete &&
            steps.slice(0, index).some((s) => s.isRequired && !s.isComplete);

          return (
            <div key={step.id} className="flex gap-4">
              {/* Step indicator + connector */}
              <div className="flex flex-col items-center">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    step.isComplete
                      ? colors.stepDone
                      : isCurrent
                        ? colors.stepCurrent
                        : colors.stepUpcoming
                  }`}
                >
                  {step.isComplete ? (
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`w-0.5 flex-1 min-h-[2rem] ${
                      step.isComplete
                        ? colors.connectorDone
                        : colors.connectorPending
                    }`}
                  />
                )}
              </div>

              {/* Step content */}
              <div className={`pb-6 ${isLast ? "pb-0" : ""} flex-1 min-w-0`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0">
                    <h3
                      className={`text-sm font-bold ${
                        step.isComplete || isCurrent
                          ? "text-foreground"
                          : "text-foreground-secondary"
                      }`}
                    >
                      {step.title}
                      {!step.isRequired && (
                        <span className="ml-2 text-xs font-normal text-foreground-tertiary">
                          Optional
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-foreground-secondary mt-0.5">
                      {step.description}
                    </p>
                  </div>

                  {/* CTA */}
                  {step.isComplete ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-600 shrink-0">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Complete
                    </span>
                  ) : step.id === "org" && !hasOrg ? (
                    <button
                      onClick={() => setShowOrgForm((prev) => !prev)}
                      className={`inline-flex h-8 items-center rounded-lg px-4 text-xs font-semibold transition-colors shrink-0 ${
                        isCurrent ? colors.button : colors.buttonOutline
                      }`}
                    >
                      {step.ctaLabel}
                    </button>
                  ) : step.href && !isLocked ? (
                    <Link
                      href={step.href}
                      className={`inline-flex h-8 items-center rounded-lg px-4 text-xs font-semibold transition-colors shrink-0 ${
                        isCurrent ? colors.button : colors.buttonOutline
                      }`}
                    >
                      {step.ctaLabel}
                    </Link>
                  ) : (
                    <span className="inline-flex h-8 items-center rounded-lg px-4 text-xs font-semibold text-foreground-tertiary bg-neutral-100 shrink-0 cursor-not-allowed">
                      {isLocked ? "Complete previous steps" : step.ctaLabel}
                    </span>
                  )}
                </div>

                {/* Inline org creation form */}
                {step.id === "org" && showOrgForm && !hasOrg && (
                  <form
                    onSubmit={handleCreateOrg}
                    className="mt-3 rounded-xl bg-white border border-neutral-200 p-4 space-y-3"
                  >
                    {orgError && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-2.5">
                        <p className="text-xs text-red-800">{orgError}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">
                        {config.orgLabel.charAt(0).toUpperCase() +
                          config.orgLabel.slice(1)}{" "}
                        Name *
                      </label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        required
                        maxLength={255}
                        className="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none"
                        placeholder={config.orgPlaceholder}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">
                        Description
                      </label>
                      <textarea
                        value={orgDescription}
                        onChange={(e) => setOrgDescription(e.target.value)}
                        maxLength={1000}
                        rows={2}
                        className="w-full rounded-lg border-2 border-neutral-300 bg-white px-3 py-2 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none resize-none"
                        placeholder={config.orgDescPlaceholder}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isCreatingOrg || !orgName.trim()}
                        className={`inline-flex h-9 items-center rounded-lg px-5 text-sm font-semibold transition-colors disabled:opacity-50 ${colors.button}`}
                      >
                        {isCreatingOrg ? "Creating…" : "Create"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowOrgForm(false);
                          setOrgError("");
                        }}
                        className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-foreground-secondary hover:text-foreground transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
