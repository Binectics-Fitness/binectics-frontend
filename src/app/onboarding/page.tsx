"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { teamsService, type UpdateOrganizationRequest } from "@/lib/api/teams";
import { marketplaceService } from "@/lib/api/marketplace";
import { onboardingService } from "@/lib/api/onboarding";
import { authService } from "@/lib/api/auth";
import { consultationsService } from "@/lib/api/consultations";
import { toast } from "@/components/Toast";
import { AccountType } from "@/lib/types";
import { ROLES, GENERIC_STEPS, ROLE_CARDS, ACCOUNT_ROLE_TO_ID, resolveEstablishedRole, resolvePreselectedRole, canChangeRole, workspaceDecision, ACCOUNT_TYPE_TO_USER_ROLE, trainerLocationPatch, trainerSessionPatch, dietitianLocationPatch, dietitianSessionPatch, upsertOwnSession, sessionStepUnanswered, SESSION_MISSING, currencyStepUnanswered, CURRENCY_MISSING, type RoleId } from "./_config";
import { describeCurrencyError } from "@/lib/currencies/helpers";
import { StageHead } from "./_components";
import Modal from "@/components/Modal";
import { MEMBER_STEPS } from "./_member";
import { TRAINER_STEPS } from "./_trainer";
import { GYM_STEPS } from "./_gym";
import { DIETITIAN_STEPS } from "./_dietitian";

const STEP_RENDERERS: Record<RoleId, React.ComponentType<{ data: Record<string, unknown>; setField: (k: string, v: unknown) => void; onUploadStart?: () => void; onUploadEnd?: () => void }>[]> = {
  member: MEMBER_STEPS,
  trainer: TRAINER_STEPS,
  gym: GYM_STEPS,
  dietitian: DIETITIAN_STEPS,
};

const ROLE_ICONS: Record<RoleId, React.ReactNode> = {
  member: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  ),
  trainer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  gym: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
  dietitian: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  ),
};

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}><div className="w-10 h-10 rounded-full border-[3px] border-border-2 border-t-ink animate-spin" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}

const ROLE_DASHBOARD_ROUTES: Record<RoleId, string> = {
  member: "/dashboard/member",
  trainer: "/dashboard/trainer",
  gym: "/dashboard/gym-owner",
  dietitian: "/dashboard/dietitian",
};

const ROLE_TO_ACCOUNT_TYPE: Partial<Record<RoleId, AccountType>> = {
  trainer: AccountType.PERSONAL_TRAINER,
  gym: AccountType.GYM_OWNER,
  dietitian: AccountType.DIETITIAN,
};

function buildDefaultOrganizationName(role: RoleId, firstName?: string, lastName?: string): string {
  const ownerName = [firstName, lastName].filter(Boolean).join(" ").trim() || "Your";
  switch (role) {
    case "gym":
      return `${ownerName} Gym`;
    case "trainer":
      return `${ownerName} Training`;
    case "dietitian":
      return `${ownerName} Practice`;
    default:
      return `${ownerName} Workspace`;
  }
}

function OnboardingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { organizations, currentOrg, setCurrentOrg, refreshOrganizations, isLoading: orgLoading } = useOrganization();
  const preselected = resolvePreselectedRole(searchParams.get("role"), user?.role);
  const establishedRole = resolveEstablishedRole(user?.role);
  const accountRole = user?.role ? (ACCOUNT_ROLE_TO_ID[user.role] ?? null) : null;

  const [manualRole, setManualRole] = useState<RoleId | null>(preselected);
  const [rawStep, setStep] = useState(preselected ? 1 : 0);
  // Every generic signup gets the `fitness_member` role as a backend default,
  // so a member account role alone doesn't tell us whether the role was
  // *chosen* (member invite / gym enrollment — locked, their role IS their
  // membership) or merely *defaulted* (free to pick any track). Membership
  // evidence is the distinguishing signal: an invited/enrolled member has at
  // least one membership subscription; a generic signup has none. "pending"
  // keeps the rail locked until we know — briefly locking a free user is
  // harmless, briefly unlocking an invited member is the bug this guards.
  const [memberGate, setMemberGate] = useState<"pending" | "invited" | "free">("pending");
  useEffect(() => {
    if (accountRole !== "member") return;
    let cancelled = false;
    marketplaceService
      .getMyMembershipSubscriptions()
      .then((res) => {
        if (cancelled) return;
        setMemberGate((res.data?.length ?? 0) > 0 ? "invited" : "free");
      })
      .catch(() => {
        // Availability over the guard: wrongly locking a genuine signup out
        // of the role picker is worse than a UX-only unlock of an invitee.
        if (!cancelled) setMemberGate("free");
      });
    return () => {
      cancelled = true;
    };
  }, [accountRole]);

  // Deliberately NOT frozen in state: `user` from useAuth() hydrates
  // asynchronously (starts null, populated a tick after mount), so a
  // useState-frozen value computed on the very first render could lock in
  // "false" before the account's real role is known — and never re-lock
  // once it arrives. Recomputing every render self-heals the instant the
  // inputs resolve. The rail locks when the role is no longer an open
  // choice: an established provider role, an org that already exists
  // (switching after workspace creation would strand a mistyped org), or a
  // member whose role was preassigned by the invite/enrollment flow.
  const roleLocked =
    Boolean(establishedRole) ||
    organizations.length > 0 ||
    (accountRole === "member" && memberGate !== "free");

  // An invited member's track is already decided: force the Member track
  // (ignoring any role card clicked before the membership evidence
  // resolved) and skip the picker. Derived, not set in an effect, so it
  // takes hold the same render the evidence arrives.
  const invitedMember = accountRole === "member" && memberGate === "invited";
  const role = invitedMember ? "member" : (manualRole ?? accountRole);
  const step = invitedMember && rawStep === 0 ? 1 : rawStep;
  const [data, setData] = useState<Record<string, unknown>>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [isSavingLater, setIsSavingLater] = useState(false);
  const [uploadCount, setUploadCount] = useState(0);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [workspacePending, setWorkspacePending] = useState(false);
  const [changeRoleOpen, setChangeRoleOpen] = useState(false);
  // Spans the whole of Continue: creating the workspace, refreshing the
  // account, saving the step. workspacePending alone re-enabled the button
  // after the first request, with the rest still in flight.
  const [advancing, setAdvancing] = useState(false);
  const [changingRole, setChangingRole] = useState(false);
  const roleDef = role ? ROLES.find((r) => r.id === role) : null;
  const steps = roleDef?.steps || GENERIC_STEPS;
  const totalSteps = steps.length;

  useEffect(() => {
    if (user?.is_onboarding_complete && user) {
      const routes: Record<string, string> = { USER: "/dashboard/member", GYM_OWNER: "/dashboard/gym-owner", TRAINER: "/dashboard/trainer", DIETITIAN: "/dashboard/dietitian", ADMIN: "/admin/dashboard" };
      window.location.replace(routes[user.role] || "/dashboard/member");
    }
  }, [user]);

  // The workspace (organization) is what promotes the account to the chosen
  // role, so it is created only when the person commits by moving past the
  // first step - never on the click that picked the role. That click used to
  // spin up a Trainer workspace and lock the account into it before anything
  // else was seen, with no way back. Until then, Back reopens the picker.
  // Returns the workspace id to save against ("" for members), or null when
  // it could not be created and the step must not advance.
  const ensureWorkspace = useCallback(async (): Promise<string | null> => {
    setWorkspaceError(null);
    const accountType = role ? ROLE_TO_ACCOUNT_TYPE[role] : undefined;
    const decision = workspaceDecision({
      currentOrg,
      userId: user?.id,
      providerTrack: Boolean(accountType),
      accountRole,
      memberGate,
      orgLoading,
    });
    if (decision.kind === "member") return "";
    if (decision.kind === "reuse") return decision.orgId;
    if (decision.kind === "blocked") {
      setWorkspaceError(
        decision.reason === "loading"
          ? "Just a moment, we are still loading your account."
          : decision.reason === "gate"
            ? "Just a moment, we are still checking your account."
            : `You are part of ${currentOrg?.name ?? "another workspace"}, which belongs to someone else. To set up a workspace of your own, contact support.`,
      );
      return null;
    }
    if (!accountType || !user) return "";
    setWorkspacePending(true);
    try {
      const response = await teamsService.createOrganization({
        name: buildDefaultOrganizationName(role ?? "trainer", user.first_name, user.last_name),
        account_type: accountType,
        description: "Auto-created from onboarding",
      });
      if (!response.success || !response.data) {
        setWorkspaceError(response.message || "We could not create your workspace yet. Try again.");
        return null;
      }
      setCurrentOrg(response.data);
      // Org creation promotes the account role server-side (USER →
      // provider). Pull the fresh user immediately so localStorage /
      // useAuth stop serving the stale member role - the dashboards'
      // role guards would otherwise bounce a newly-promoted provider
      // off their own dashboard until the next full refresh.
      try {
        const fresh = await authService.refreshUserFromApi();
        if (fresh) updateUser(fresh);
      } catch {
        // best-effort; onboarding completion refreshes again
      }
      await refreshOrganizations();
      return response.data._id;
    } catch {
      setWorkspaceError("We could not create your workspace yet. Try again.");
      return null;
    } finally {
      setWorkspacePending(false);
    }
  }, [accountRole, currentOrg, memberGate, orgLoading, refreshOrganizations, role, setCurrentOrg, updateUser, user]);

  // Undo a role picked by mistake: remove the untouched workspace, drop the
  // account back to a plain member, and reopen the picker.
  const changeRole = async () => {
    if (!currentOrg) return;
    setChangingRole(true);
    setWorkspaceError(null);
    try {
      const res = await teamsService.deleteOrganization(currentOrg._id);
      if (!res.success) {
        toast.error(res.message || "We could not change your role. Try again.");
        return;
      }
      setCurrentOrg(null);
      // The account is a member again server-side. If the profile refresh
      // fails, fall back to the role the API just reported; otherwise the
      // stale provider role would keep the rail locked with nothing to
      // change, and the next Continue would create another workspace.
      const fallbackRole = ACCOUNT_TYPE_TO_USER_ROLE[res.data?.account_type ?? ""];
      let fresh: typeof user = null;
      try {
        fresh = await authService.refreshUserFromApi();
      } catch {
        fresh = null;
      }
      if (fresh) updateUser(fresh);
      else if (user && fallbackRole) updateUser({ ...user, role: fallbackRole });
      await refreshOrganizations();
      setManualRole(null);
      setStep(0);
      setData({});
      setChangeRoleOpen(false);
      // A ?role= link would preselect the old role again on refresh.
      router.replace("/onboarding");
    } finally {
      setChangingRole(false);
    }
  };

  const setField = useCallback((key: string, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);
  const progress = step === 0 ? 0 : Math.round((step / totalSteps) * 100);
  const minsLeft = Math.max(1, Math.round(((totalSteps - step) / totalSteps) * 8));

  const handleSelectRole = (id: RoleId) => {
    if (roleLocked) return;
    setWorkspaceError(null);
    setManualRole(id);
    if (step === 0) setStep(1);
  };

  /** Resolves an error message only when the chosen currency was refused. */
  const persistGymStep = useCallback(async (currentStep: number, stepData: Record<string, unknown>, orgId: string): Promise<string | null> => {
    try {
      if (currentStep === 1) {
        // Business details: patch org name + business fields
        const patch: import("@/lib/api/teams").UpdateOrganizationRequest = {};
        if (stepData.bizName) patch.name = stepData.bizName as string;
        if (stepData.entity) patch.legal_entity = stepData.entity as string;
        if (stepData.regNumber) patch.registration_number = stepData.regNumber as string;
        // The step seeds `currency` with the effective value (an explicit
        // pick, or the country's suggestion), so it is saved here with the
        // rest rather than by a separate write racing page navigation.
        if (stepData.currency) patch.currency = stepData.currency as string;
        if (Object.keys(patch).length > 0) {
          const res = await teamsService.updateOrganization(orgId, patch);
          // Everything else here is best effort; a refused currency is not,
          // because every plan the gym creates next would price in it.
          const refused = res.success ? null : describeCurrencyError(res);
          if (refused) return refused;
        }
      } else if (currentStep === 2) {
        // First location — guard against duplicate creation on Back+Continue
        if (stepData.locName && !stepData.locationId) {
          const locRes = await teamsService.createLocation(orgId, {
            name: stepData.locName as string,
            street: stepData.street as string | undefined,
            city: stepData.city as string | undefined,
            postal_code: stepData.postalCode as string | undefined,
            country: stepData.country as string | undefined,
            is_primary: true,
          });
          const locId = (locRes.data as { _id?: string; id?: string } | undefined)?._id ?? (locRes.data as { _id?: string; id?: string } | undefined)?.id;
          if (locRes.success && locId) {
            setField('locationId', locId);
          }
        } else if (stepData.locName && stepData.locationId) {
          await teamsService.updateLocation(orgId, stepData.locationId as string, {
            name: stepData.locName as string,
            street: stepData.street as string | undefined,
            city: stepData.city as string | undefined,
            postal_code: stepData.postalCode as string | undefined,
            country: stepData.country as string | undefined,
          });
        }
      } else if (currentStep === 3) {
        // Membership plan template — guard against re-seeding on Back+Continue
        const template = (stepData.planTemplate as string) || 'standard';
        if (template !== 'blank' && !stepData.planSeeded) {
          await teamsService.seedMembershipPlanTemplate(orgId, template);
          setField('planSeeded', true);
        }
      } else if (currentStep === 4) {
        // Verification documents — persist Cloudinary URLs to the org record
        const patch: import("@/lib/api/teams").UpdateOrganizationRequest = {};
        if (stepData.doc_reg) patch.doc_registration_url = stepData.doc_reg as string;
        if (stepData.doc_tax) patch.doc_tax_url = stepData.doc_tax as string;
        if (stepData.doc_id) patch.doc_owner_id_url = stepData.doc_id as string;
        if (Object.keys(patch).length > 0) {
          await teamsService.updateOrganization(orgId, patch);
        }
      } else if (currentStep === 5) {
        // Payout gateway — use visual default ('paystack') if user never interacted
        const payout = (stepData.payout as string) || 'paystack';
        if (payout !== 'skip') {
          await teamsService.updateOrganization(orgId, {
            preferred_payout_gateway: payout,
          });
        }
      } else if (currentStep === 6) {
        // Kiosk preference — use visual default ('existing') if user never interacted
        const kiosk = (stepData.kiosk as string) || 'existing';
        await teamsService.updateOrganization(orgId, {
          kiosk_preference: kiosk,
        });
      } else if (currentStep === 7) {
        // Staff invites
        const emails = ((stepData.staffEmails as string) || '')
          .split(/[\n,]/)
          .map((e) => e.trim())
          .filter(Boolean);
        if (emails.length > 0) {
          const rolesRes = await teamsService.getRoles(orgId);
          const roles = rolesRes.data ?? [];
          // Map chip label to role code: "Coach (manager)" → manager, "Front desk" → assistant, default → consultant
          const selectedChips = (stepData.staffRoles as string[]) ?? [];
          const primaryChip = selectedChips[0] ?? '';
          let targetCode = 'consultant';
          if (primaryChip.toLowerCase().includes('manager')) targetCode = 'manager';
          else if (primaryChip.toLowerCase().includes('front desk') || primaryChip.toLowerCase().includes('assistant')) targetCode = 'assistant';
          const role = roles.find((r) => r.code === targetCode) ?? roles.find((r) => r.code === 'consultant') ?? roles[0];
          if (role) {
            await Promise.allSettled(
              emails.map((email) =>
                teamsService.inviteMember(orgId, { email, team_role_id: role._id }),
              ),
            );
          }
        }
      }
    } catch {
      // Non-blocking: step data save failures don't block navigation
    }
    return null;
  }, []);

  /**
   * Resolves an error message when the currency chosen on step 1 was refused
   * or the session the trainer answered could not be saved, else null.
   */
  const persistTrainerStep = useCallback(async (currentStep: number, stepData: Record<string, unknown>, orgId: string): Promise<string | null> => {
    try {
      if (currentStep === 1) {
        const { profile, currency } = trainerLocationPatch(stepData);
        if (Object.keys(profile).length > 0) await authService.updateProfile(profile);
        // The workspace trades in the currency chosen here, as the gym track
        // records on its own step 1; packages and earnings read it.
        if (orgId && currency) {
          const res = await teamsService.updateOrganization(orgId, { currency });
          const refused = res.success ? null : describeCurrencyError(res);
          if (refused) return refused;
        }
      } else if (currentStep === 4) {
        // The 1:1 price and length become the trainer's own session type,
        // which is what clients book. Until this was saved the step
        // collected a price and threw it away, and a trainer who finished
        // onboarding still had nothing bookable.
        // Free saves a price of 0; a blank price creates nothing.
        const session = trainerSessionPatch(stepData);
        if (session && !(await upsertOwnSession(session, consultationsService))) {
          return "We couldn't save your session. Check your connection and try again.";
        }
      } else if (currentStep === 5) {
        if (stepData.payout && orgId) {
          await teamsService.updateOrganization(orgId, { preferred_payout_gateway: stepData.payout as string });
        }
      }
    } catch { /* non-blocking */ }
    return null;
  }, []);

  const persistMemberStep = useCallback(async (currentStep: number, stepData: Record<string, unknown>) => {
    try {
      if (currentStep === 1) {
        const goal = stepData.goal as string;
        if (goal) await authService.updateProfile({ fitness_goals: [goal] });
      } else if (currentStep === 2) {
        const patch: Record<string, unknown> = {};
        const providerTypes = stepData.providerTypes as string[];
        if (providerTypes?.length) patch.preferred_activities = providerTypes;
        const city = (stepData.city as string | undefined)?.trim();
        if (city) patch.city = city;
        if (Object.keys(patch).length > 0) await authService.updateProfile(patch);
      } else if (currentStep === 3) {
        // Training times/days were collected and thrown away until the API
        // gained fields for them — persisted here so the answers survive.
        const patch: Record<string, unknown> = {};
        const times = stepData.times as string[] | undefined;
        const days = stepData.days as string[] | undefined;
        if (times?.length) patch.preferred_training_times = times;
        if (days?.length) patch.preferred_training_days = days;
        if (Object.keys(patch).length > 0) await authService.updateProfile(patch);
      }
    } catch { /* non-blocking */ }
  }, []);

  /**
   * Resolves an error message when the currency chosen on step 1 was refused
   * or the consultation the dietitian answered could not be saved, else null.
   */
  const persistDietitianStep = useCallback(async (currentStep: number, stepData: Record<string, unknown>, orgId: string): Promise<string | null> => {
    try {
      if (currentStep === 1) {
        const { profile, currency } = dietitianLocationPatch(stepData);
        if (Object.keys(profile).length > 0) await authService.updateProfile(profile);
        // The workspace trades in the currency chosen here, as the trainer
        // track records on its step 1; the consultation price uses it too.
        const orgPatch: UpdateOrganizationRequest = {};
        if (currency) orgPatch.currency = currency;
        if (stepData.practiceName) orgPatch.name = stepData.practiceName as string;
        if (orgId && Object.keys(orgPatch).length > 0) {
          const res = await teamsService.updateOrganization(orgId, orgPatch);
          const refused = res.success ? null : describeCurrencyError(res);
          if (refused) return refused;
        }
      } else if (currentStep === 5) {
        // The consultation becomes the dietitian's own session type, which
        // is what members book. There is no dietitian platform default, so
        // without it a new dietitian had nothing bookable. Free saves a
        // price of 0; a blank price creates nothing (set it up later).
        const session = dietitianSessionPatch(stepData);
        if (session && !(await upsertOwnSession(session, consultationsService))) {
          return "We couldn't save your consultation. Check your connection and try again.";
        }
      } else if (currentStep === 6) {
        if (stepData.payout && orgId) {
          await teamsService.updateOrganization(orgId, { preferred_payout_gateway: stepData.payout as string });
        }
      }
    } catch { /* non-blocking */ }
    return null;
  }, []);

  /**
   * Persists the current step. Every save is best effort except the session
   * members book: the step promised "Clients pay ₦15,000", so a failed save
   * keeps the person on the step and says so, instead of finishing
   * onboarding with nothing bookable.
   */
  const persistStep = async (orgId: string): Promise<boolean> => {
    let error: string | null = null;
    if (role === "gym" && orgId) {
      error = await persistGymStep(step, data, orgId);
    } else if (role === "trainer" && orgId) {
      error = await persistTrainerStep(step, data, orgId);
    } else if (role === "member") {
      await persistMemberStep(step, data);
    } else if (role === "dietitian") {
      error = await persistDietitianStep(step, data, orgId);
    }
    if (error) toast.error(error);
    return error === null;
  };

  const handleContinue = async () => {
    if (advancing) return;
    setAdvancing(true);
    try {
      await advance();
    } finally {
      setAdvancing(false);
    }
  };

  const advance = async () => {
    if (step === 0 && role) {
      setStep(1);
    } else if (step < totalSteps) {
      // A provider's step 1 needs a currency: the country only suggests one,
      // and when it has none the person chooses.
      if (currencyStepUnanswered(role, step, data)) {
        setField(CURRENCY_MISSING, true);
        return;
      }
      // The session step needs an answer: a price, Free, or Set up later.
      if (sessionStepUnanswered(role, step, data)) {
        setField(SESSION_MISSING, true);
        return;
      }
      const orgId = await ensureWorkspace();
      if (orgId === null) return;
      if (!(await persistStep(orgId))) return;
      setStep(step + 1);
    } else if (role) {
      if ((await ensureWorkspace()) === null) return;
      setIsFinishing(true);
      // dismiss() is what marks onboarding complete server-side. A silent
      // failure here re-onboards the user on every fresh device — surface
      // it instead of swallowing it (a swallowed 404 hid exactly that bug).
      const dismissed = await onboardingService.dismiss();
      if (!dismissed.success) {
        toast.error(
          "We couldn't save your onboarding progress, you may be asked again next time.",
        );
      }
      // Refresh from API so localStorage has the promoted role (e.g. USER→GYM_OWNER)
      // before navigating — the dashboard's useRoleGuard reads from localStorage.
      try {
        const fresh = await authService.refreshUserFromApi();
        if (fresh) updateUser(fresh);
      } catch {
        // best-effort; navigate anyway
      }
      window.location.href = ROLE_DASHBOARD_ROUTES[role];
    }
  };

  const handleSaveLater = async () => {
    setIsSavingLater(true);
    try {
      // Leaving from the picker or before the first step commits to nothing;
      // from step 1 on, the role is the person's choice, so the workspace
      // is created here too (their dashboard needs the role).
      const orgId = step >= 1 ? await ensureWorkspace() : "";
      if (orgId === null) {
        setIsSavingLater(false);
        return;
      }
      // Leaving says nothing about the session, so an unanswered step is
      // simply not saved; a failed save of an answered one stays here.
      if (!(await persistStep(orgId))) return;
    } catch {
      // non-blocking — still redirect
    } finally {
      setIsSavingLater(false);
    }
    window.location.href = role && (step >= 1 || role === "member") ? ROLE_DASHBOARD_ROUTES[role] : "/dashboard/member";
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    // Consistent with the rail: only reopen the role picker while the role
    // is still an open choice (same roleLocked signal that gates the rail).
    else if (step === 1 && !roleLocked) {
      setStep(0);
      setManualRole(null);
      setWorkspaceError(null);
    }
  };

  const renderStage = () => {
    if (step === 0 || !role) {
      return (
        <>
          <StageHead crumb="Step 01" title="How will you use Binectics?" desc="Pick the role that fits. Each one unlocks a different dashboard and onboarding track." />
          <div className="ob-role-cards" role="radiogroup" aria-label="Select your role" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {ROLE_CARDS.map((rc) => {
              const on = role === rc.id;
              return (
                <button key={rc.id} type="button" role="radio" aria-checked={on} onClick={() => { handleSelectRole(rc.id); }} style={{
                  background: on ? "var(--bg-2)" : "var(--bg)", border: on ? "1px solid var(--ink)" : "1px solid var(--border)",
                  borderRadius: "var(--r-3)", padding: 22, display: "flex", flexDirection: "column", gap: 10,
                  cursor: "pointer", textAlign: "left", position: "relative", transition: "border-color 120ms, background 120ms",
                  minHeight: 44,
                }}>
                  <span style={{ position: "absolute", top: 22, right: 22, width: 10, height: 10, borderRadius: "50%", background: rc.color }} />
                  <div style={{ width: 36, height: 36, borderRadius: "var(--r-2)", background: on ? "var(--ink)" : "var(--bg-3)", color: on ? "var(--bg)" : "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {ROLE_ICONS[rc.id]}
                  </div>
                  <div style={{ fontSize: 18, letterSpacing: "-0.01em", fontWeight: 500, color: "var(--ink)" }}>{rc.title}</div>
                  <div style={{ fontSize: "13.5px", color: "var(--fg-3)", lineHeight: 1.5 }}>{rc.desc}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", color: "var(--fg-3)", letterSpacing: "0.05em", marginTop: 4 }}>{rc.meta}</div>
                </button>
              );
            })}
          </div>
        </>
      );
    }

    const renderers = STEP_RENDERERS[role];
    const StepComponent = renderers[step - 1];
    if (!StepComponent) return null;
    return (
      <StepComponent
        data={data}
        setField={setField}
        onUploadStart={() => setUploadCount((c) => c + 1)}
        onUploadEnd={() => setUploadCount((c) => Math.max(0, c - 1))}
      />
    );
  };

  return (
    <>
    <style>{`
      .ob-shell { min-height: 100vh; display: grid; grid-template-columns: 280px 1fr 360px; background: var(--bg); }
      .ob-rail { background: var(--bg-2); border-right: 1px solid var(--border); padding: 28px 24px; display: flex; flex-direction: column; gap: 36px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
      .ob-summary { background: var(--bg-2); border-left: 1px solid var(--border); padding: 36px 24px; display: flex; flex-direction: column; gap: 24px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
      .ob-stage-area { padding: 56px 80px; display: flex; flex-direction: column; gap: 32px; max-width: 740px; flex: 1; }
      .ob-next-arrow { display: none; }
      .ob-nav { padding: 24px 80px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; position: sticky; bottom: 0; background: var(--bg); }
      .ob-mobile-header { display: none; }
      @media (max-width: 1024px) {
        .ob-shell { grid-template-columns: 280px 1fr; }
        .ob-summary { display: none; }
      }
      @media (max-width: 768px) {
        .ob-shell { grid-template-columns: 1fr; }
        .ob-rail { display: none; }
        .ob-mobile-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid var(--border); background: var(--bg); position: sticky; top: 0; z-index: 10; }
        .ob-stage-area { padding: 28px 16px; }
        .ob-nav { padding: 16px; flex-wrap: wrap; gap: 10px; }
        .ob-nav .ob-progress { width: 100%; }
        .ob-nav .ob-actions { width: 100%; display: flex; gap: 8px; }
        .ob-nav .ob-actions button { flex: 1; }
        /* Three buttons share a phone's width; the next step's name would push
           the row off screen, and the progress bar already shows it. */
        .ob-nav .ob-next-title { display: none; }
        .ob-nav .ob-next-arrow { display: inline; }
        .ob-role-cards { grid-template-columns: 1fr !important; }
        .ob-form-grid { grid-template-columns: 1fr !important; }
      }
      @media (max-width: 480px) {
        .ob-stage-area { padding: 20px 14px; }
        .ob-stage-area h1 { font-size: 28px !important; }
      }
      @media (max-width: 375px) {
        .ob-stage-area { padding: 20px 12px; }
        .ob-stage-area h1 { font-size: 26px !important; }
      }
      @media (max-width: 320px) {
        .ob-stage-area { padding: 16px 10px; }
        .ob-stage-area h1 { font-size: 24px !important; }
      }
    `}</style>
    <div className="ob-shell">

      {/* ═══ Mobile header (hidden on desktop) ═══ */}
      <div className="ob-mobile-header">
        <Link href="/" style={{ textDecoration: "none" }}><BinecticsLockup /></Link>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--fg-3)" }}>
          {step === 0 ? "Pick role" : `Step ${step} of ${totalSteps}`}
          {role && roleDef && <span style={{ marginLeft: 8, color: "var(--ink)", fontWeight: 500 }}>{roleDef.label}</span>}
        </div>
      </div>

      {/* Mobile step dots */}
      {step > 0 && role && (
        <div className="ob-mobile-header" style={{ justifyContent: "center", gap: 4, padding: "8px 16px", borderBottom: "1px solid var(--border)", borderTop: "none" }}>
          {steps.map((_, i) => (
            <span key={i} style={{ width: 24, height: 4, borderRadius: 2, background: i + 1 <= step ? (i + 1 === step ? "var(--ink)" : "var(--signal)") : "var(--border-2)" }} />
          ))}
        </div>
      )}

      {/* ═══ Left rail ═══ */}
      <aside className="ob-rail">
        <Link href="/" style={{ textDecoration: "none" }}><BinecticsLockup /></Link>

        {/* Role pills */}
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", textTransform: "uppercase", color: "var(--fg-4)", letterSpacing: "0.06em", marginBottom: 12 }}>Role</div>
          {roleLocked ? (
            // Role no longer an open choice (established provider role,
            // invited/enrolled member, or an org already exists) — no live
            // picker. Switching here would silently spin up an unrelated
            // org and overwrite the account's role.
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", minHeight: 44, border: "1px solid var(--border)", borderRadius: "var(--r-2)", background: "var(--bg)" }}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: ROLES.find((r) => r.id === role)?.color, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{ROLES.find((r) => r.id === role)?.label}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", color: "var(--fg-4)", letterSpacing: "0.05em", marginLeft: "auto" }}>Active</span>
              {canChangeRole(user, currentOrg) && (
                <button
                  type="button"
                  onClick={() => setChangeRoleOpen(true)}
                  aria-label="Change role"
                  className="underline"
                  style={{ fontSize: 12, color: "var(--fg-2)", background: "none", border: "none", cursor: "pointer", padding: "4px 0", minHeight: 32 }}
                >
                  Change
                </button>
              )}
            </div>
          ) : (
            <div role="radiogroup" aria-label="Select your role" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ROLES.map((r) => {
                const on = role === r.id;
                return (
                  <button key={r.id} type="button" role="radio" aria-checked={on} onClick={() => handleSelectRole(r.id)} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", minHeight: 44,
                    border: on ? "1px solid var(--ink)" : "1px solid var(--border)",
                    borderRadius: "var(--r-2)", background: "var(--bg)", cursor: "pointer", textAlign: "left",
                    transition: "border-color 120ms",
                  }}>
                    <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: on ? "var(--ink)" : "var(--fg-2)", fontWeight: 500 }}>{r.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", color: on ? "var(--ink)" : "var(--fg-4)", letterSpacing: "0.05em", marginLeft: "auto" }}>{on ? "Active" : r.badge}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Step stepper */}
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", textTransform: "uppercase", color: "var(--fg-4)", letterSpacing: "0.06em", marginBottom: 14 }}>Onboarding</div>
          <ol role="list" aria-label={`Onboarding steps: ${steps.length} total`} style={{ display: "flex", flexDirection: "column", listStyle: "none", margin: 0, padding: 0 }}>
            {steps.map((s, i) => {
              const stepNum = i + 1;
              const isDone = step > stepNum;
              const isNow = step === stepNum || (step === 0 && stepNum === 1);
              return (
                <li key={i} aria-current={isNow ? "step" : undefined} style={{ display: "grid", gridTemplateColumns: "22px 1fr", gap: 12, padding: "4px 0", position: "relative" }}>
                  {i < steps.length - 1 && (
                    <span style={{ position: "absolute", left: 11, top: 26, bottom: 0, width: 1, background: "var(--border-2)", zIndex: 0 }} />
                  )}
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    border: isDone || isNow ? "1px solid var(--ink)" : "1px solid var(--border-2)",
                    background: isDone || isNow ? "var(--ink)" : "var(--bg)",
                    color: isDone || isNow ? "var(--bg)" : "var(--fg-3)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-mono)", fontSize: 11, fontVariantNumeric: "tabular-nums", zIndex: 1,
                  }}>
                    {isDone ? <span style={{ fontSize: 12 }}>&#10003;</span> : stepNum}
                  </span>
                  <div style={{ paddingBottom: 18, paddingTop: 1 }}>
                    <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", textTransform: "uppercase", color: "var(--fg-4)", letterSpacing: "0.05em" }}>{s.label}</div>
                    <div style={{ fontSize: "13.5px", color: isNow ? "var(--ink)" : "var(--fg-2)", marginTop: 2, fontWeight: 500 }}>{s.title}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </aside>

      {/* ═══ Center stage ═══ */}
      <main style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="ob-stage-area">
          {workspaceError ? (
            <div className="rounded-(--r-3) p-3.5" style={{ border: "1px solid var(--danger)", background: "var(--bg-2)", color: "var(--danger)" }} role="alert">
              {workspaceError}
            </div>
          ) : null}
          {renderStage()}
        </div>

        {/* Bottom nav bar */}
        <div className="ob-nav">
          <div className="ob-progress" style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", color: "var(--fg-3)", letterSpacing: "0.05em" }}>
            Progress <strong style={{ color: "var(--ink)", fontWeight: 500 }}>· {progress}%</strong>, about {minsLeft} min left
          </div>
          <div className="ob-actions" style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn-ghost-v2 sm" onClick={handleSaveLater} disabled={isSavingLater || workspacePending || advancing || orgLoading || uploadCount > 0}>
              {isSavingLater ? "Saving..." : "Save & finish later"}
            </button>
            {(step > 1 || (step === 1 && !roleLocked)) && <button type="button" className="btn-ghost-v2 sm" onClick={handleBack} disabled={advancing}>&larr; Back</button>}
            <button
              type="button"
              disabled={(step === 0 && !role) || isFinishing || advancing || isSavingLater || orgLoading || uploadCount > 0}
              onClick={handleContinue}
              className="btn-primary-v2 sm"
              style={{ opacity: (step === 0 && !role) || isFinishing || advancing || isSavingLater || orgLoading || uploadCount > 0 ? 0.4 : 1 }}
            >
              {step >= totalSteps
                ? isFinishing
                  ? "Finishing..."
                  : "Go to dashboard"
                : workspacePending
                  ? "Preparing workspace..."
                  : advancing
                    ? "Saving..."
                    : step < totalSteps && roleDef
                      ? <>Continue<span className="ob-next-title"> → {roleDef.steps[step]?.title || ""}</span><span className="ob-next-arrow" aria-hidden="true"> →</span></>
                      : "Continue →"}
            </button>
          </div>
        </div>
      </main>

      {/* ═══ Right summary rail ═══ */}
      <aside className="ob-summary">
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-3)" }}>
            Your profile so far
          </div>
          {role && roleDef && (
            <div style={{ marginTop: 14 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px",
                borderRadius: "var(--r-full)", background: "var(--bg)", border: "1px solid var(--border)",
                fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ink)",
              }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: roleDef.color }} />
                {ROLE_CARDS.find((r) => r.id === role)?.title}{data.city ? ` · ${data.city as string}` : ""}
              </span>
            </div>
          )}
          {!role && (
            <p style={{ fontSize: "12.5px", color: "var(--fg-3)", lineHeight: 1.6, marginTop: 14 }}>
              Pick a role to begin. Your progress is saved automatically.
            </p>
          )}
        </div>

        {/* Account summary — shows after step 1 */}
        {step > 1 && (
          <div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-3)", marginBottom: 10 }}>Account</div>
            {[
              { k: "Name", v: role === "dietitian" ? (data.fullName as string) : `${(data.firstName as string) || ""} ${(data.lastName as string) || ""}`.trim() || (data.bizName as string) },
              { k: "City", v: (data.city as string) },
              { k: "Country", v: (data.country as string) },
            ].filter((r) => r.v).map((r) => (
              <div key={r.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid var(--border)", gap: 12 }}>
                <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{r.k}</span>
                <span style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500, textAlign: "right", maxWidth: "60%" }}>{r.v}</span>
              </div>
            ))}
          </div>
        )}

        {/* What happens next */}
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-3)", marginBottom: 4 }}>
            {step > 0 && roleDef ? "Up next" : "What happens next"}
          </div>
          {(roleDef?.steps || GENERIC_STEPS).slice(step).map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 16, padding: "14px 0", borderBottom: "1px solid var(--border)", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)", fontVariantNumeric: "tabular-nums", width: 28, textAlign: "right" }}>
                {String(step + i + 1).padStart(2, "0")}
              </span>
              <div style={{ width: 22, height: 22, color: "var(--fg-4)", flexShrink: 0 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" width="100%" height="100%"><circle cx="12" cy="12" r="10" /></svg>
              </div>
              <div>
                <div style={{ fontSize: "13.5px", color: "var(--ink)" }}>{s.title}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Why we ask */}
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-3)", marginBottom: 10 }}>Why we ask</div>
          <p style={{ fontSize: "12.5px", color: "var(--fg-3)", lineHeight: 1.6 }}>
            Members see a verified badge on your profile only after ID and certification are confirmed by our team. Verified providers earn 3.4x more trust from reviewers, so we move quickly. Most are approved in under 48 hours.
          </p>
        </div>
      </aside>
    </div>

      <Modal
        open={changeRoleOpen}
        onClose={() => setChangeRoleOpen(false)}
        title="Change your role?"
        size="sm"
        disableCloseGuard
        footer={
          <>
            <button type="button" className="btn-ghost-v2 sm" onClick={() => setChangeRoleOpen(false)} disabled={changingRole}>
              Keep {roleDef?.label ?? "this role"}
            </button>
            <button type="button" className="btn-primary-v2 sm" onClick={changeRole} disabled={changingRole}>
              {changingRole ? "Changing..." : "Change role"}
            </button>
          </>
        }
      >
        <p style={{ fontSize: "13.5px", color: "var(--fg-2)", lineHeight: 1.6 }}>
          Your {roleDef?.label ?? ""} workspace will be removed and you can pick again. Anything you have entered so far will be cleared.
        </p>
      </Modal>
    </>
  );
}
