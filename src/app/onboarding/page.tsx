"use client";

import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { teamsService } from "@/lib/api/teams";
import { onboardingService } from "@/lib/api/onboarding";
import { authService } from "@/lib/api/auth";
import { AccountType } from "@/lib/types";
import { ROLES, GENERIC_STEPS, ROLE_CARDS, type RoleId } from "./_config";
import { StageHead } from "./_components";
import { MEMBER_STEPS } from "./_member";
import { TRAINER_STEPS } from "./_trainer";
import { GYM_STEPS } from "./_gym";
import { DIETITIAN_STEPS } from "./_dietitian";

const STEP_RENDERERS: Record<RoleId, React.ComponentType<{ data: Record<string, unknown>; setField: (k: string, v: unknown) => void }>[]> = {
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

const VALID_ROLES: RoleId[] = ["member", "trainer", "gym", "dietitian"];

const ROLE_DASHBOARD_ROUTES: Record<RoleId, string> = {
  member: "/member",
  trainer: "/dashboard/trainer",
  gym: "/dashboard/gym-owner",
  dietitian: "/dashboard/dietitian",
};

// Role is chosen once, at registration. When the account already carries it,
// onboarding skips its role-selection step instead of asking again.
const ACCOUNT_ROLE_TO_ID: Record<string, RoleId> = {
  USER: "member",
  TRAINER: "trainer",
  GYM_OWNER: "gym",
  DIETITIAN: "dietitian",
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
  const { user, updateUser } = useAuth();
  const { organizations, currentOrg, setCurrentOrg, refreshOrganizations, isLoading: orgLoading } = useOrganization();
  const initialRole = searchParams.get("role") as RoleId | null;
  const accountRole = (user?.role && ACCOUNT_ROLE_TO_ID[user.role]) || null;
  const preselected = (initialRole && VALID_ROLES.includes(initialRole) ? initialRole : null) ?? accountRole;

  const [manualRole, setManualRole] = useState<RoleId | null>(preselected);
  const role = manualRole ?? accountRole;
  const [step, setStep] = useState(preselected ? 1 : 0);
  const [data, setData] = useState<Record<string, unknown>>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [isSavingLater, setIsSavingLater] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const creatingWorkspaceRef = useRef(false);

  const workspaceReady = Boolean(currentOrg);
  const roleDef = role ? ROLES.find((r) => r.id === role) : null;
  const steps = roleDef?.steps || GENERIC_STEPS;
  const totalSteps = steps.length;

  useEffect(() => {
    if (user?.is_onboarding_complete && user) {
      const routes: Record<string, string> = { USER: "/member", GYM_OWNER: "/dashboard/gym-owner", TRAINER: "/dashboard/trainer", DIETITIAN: "/dashboard/dietitian", ADMIN: "/admin/dashboard" };
      window.location.replace(routes[user.role] || "/member");
    }
  }, [user]);

  useEffect(() => {
    const activeRole = role ?? accountRole;
    if (!user || orgLoading || creatingWorkspaceRef.current || workspaceReady || organizations.length > 0) {
      return;
    }

    const accountType = activeRole ? ROLE_TO_ACCOUNT_TYPE[activeRole] : undefined;
    if (!accountType) {
      return;
    }

    creatingWorkspaceRef.current = true;

    const createWorkspace = async () => {
      setWorkspaceError(null);
      const response = await teamsService.createOrganization({
        name: buildDefaultOrganizationName(activeRole ?? "trainer", user.first_name, user.last_name),
        account_type: accountType,
        description: "Auto-created from onboarding",
      });

      if (response.success && response.data) {
        setCurrentOrg(response.data);
        await refreshOrganizations();
      } else {
        setWorkspaceError(response.message || "We could not create your workspace yet.");
        creatingWorkspaceRef.current = false;
      }
    };

    void createWorkspace();
  }, [accountRole, currentOrg, organizations.length, orgLoading, refreshOrganizations, role, setCurrentOrg, user, workspaceReady]);

  const setField = useCallback((key: string, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);
  const progress = step === 0 ? 0 : Math.round((step / totalSteps) * 100);
  const minsLeft = Math.max(1, Math.round(((totalSteps - step) / totalSteps) * 8));

  const handleSelectRole = (id: RoleId) => {
    setManualRole(id);
    if (step === 0) setStep(1);
  };

  const persistGymStep = useCallback(async (currentStep: number, stepData: Record<string, unknown>, orgId: string) => {
    try {
      if (currentStep === 1) {
        // Business details: patch org name + business fields
        const patch: Record<string, unknown> = {};
        if (stepData.bizName) patch.name = stepData.bizName as string;
        if (stepData.entity) patch.legal_entity = stepData.entity as string;
        if (stepData.regNumber) patch.registration_number = stepData.regNumber as string;
        if (Object.keys(patch).length > 0) {
          await teamsService.updateOrganization(orgId, patch as Parameters<typeof teamsService.updateOrganization>[1]);
        }
      } else if (currentStep === 2) {
        // First location
        if (stepData.locName) {
          await teamsService.createLocation(orgId, {
            name: stepData.locName as string,
            street: stepData.street as string | undefined,
            city: stepData.city as string | undefined,
            postal_code: stepData.postalCode as string | undefined,
            country: stepData.country as string | undefined,
            is_primary: true,
          });
        }
      } else if (currentStep === 3) {
        // Membership plan template
        const template = (stepData.planTemplate as string) || 'standard';
        if (template !== 'blank') {
          await teamsService.seedMembershipPlanTemplate(orgId, template);
        }
      } else if (currentStep === 5) {
        // Payout gateway
        if (stepData.payout && stepData.payout !== 'skip') {
          await teamsService.updateOrganization(orgId, {
            preferred_payout_gateway: stepData.payout as string,
          } as Parameters<typeof teamsService.updateOrganization>[1]);
        }
      } else if (currentStep === 6) {
        // Kiosk preference
        if (stepData.kiosk) {
          await teamsService.updateOrganization(orgId, {
            kiosk_preference: stepData.kiosk as string,
          } as Parameters<typeof teamsService.updateOrganization>[1]);
        }
      } else if (currentStep === 7) {
        // Staff invites
        const emails = ((stepData.staffEmails as string) || '')
          .split('\n')
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
  }, []);

  const persistTrainerStep = useCallback(async (currentStep: number, stepData: Record<string, unknown>, orgId: string) => {
    try {
      if (currentStep === 1) {
        const patch: Record<string, unknown> = {};
        if (stepData.firstName) patch.first_name = stepData.firstName;
        if (stepData.lastName) patch.last_name = stepData.lastName;
        if (Object.keys(patch).length > 0) await authService.updateProfile(patch);
      } else if (currentStep === 5) {
        if (stepData.payout && orgId) {
          await teamsService.updateOrganization(orgId, { preferred_payout_gateway: stepData.payout as string });
        }
      }
    } catch { /* non-blocking */ }
  }, []);

  const persistMemberStep = useCallback(async (currentStep: number, stepData: Record<string, unknown>) => {
    try {
      if (currentStep === 1) {
        const goal = stepData.goal as string;
        if (goal) await authService.updateProfile({ fitness_goals: [goal] });
      } else if (currentStep === 2) {
        const providerTypes = stepData.providerTypes as string[];
        if (providerTypes?.length) await authService.updateProfile({ preferred_activities: providerTypes });
      }
    } catch { /* non-blocking */ }
  }, []);

  const persistDietitianStep = useCallback(async (currentStep: number, stepData: Record<string, unknown>, orgId: string) => {
    try {
      if (currentStep === 1) {
        const fullName = (stepData.fullName as string || "").replace(/^(Dr\.?|Prof\.?)\s*/i, "").trim();
        const parts = fullName.split(/\s+/).filter(Boolean);
        const patch: Record<string, unknown> = {};
        if (parts.length >= 2) {
          patch.first_name = parts.slice(0, -1).join(" ");
          patch.last_name = parts[parts.length - 1];
        } else if (parts.length === 1) {
          patch.first_name = parts[0];
        }
        if (Object.keys(patch).length > 0) await authService.updateProfile(patch);
        if (stepData.practiceName && orgId) {
          await teamsService.updateOrganization(orgId, { name: stepData.practiceName as string });
        }
      } else if (currentStep === 5) {
        if (stepData.payout && orgId) {
          await teamsService.updateOrganization(orgId, { preferred_payout_gateway: stepData.payout as string });
        }
      }
    } catch { /* non-blocking */ }
  }, []);

  const handleContinue = async () => {
    if (step === 0 && role) {
      setStep(1);
    } else if (step < totalSteps) {
      if (role === "gym" && currentOrg) {
        await persistGymStep(step, data, currentOrg._id);
      } else if (role === "trainer" && currentOrg) {
        await persistTrainerStep(step, data, currentOrg._id);
      } else if (role === "member") {
        await persistMemberStep(step, data);
      } else if (role === "dietitian") {
        await persistDietitianStep(step, data, currentOrg?._id ?? "");
      }
      setStep(step + 1);
    } else if (role) {
      setIsFinishing(true);
      try {
        await onboardingService.dismiss();
      } catch {
        // Non-blocking; user state update below ensures deterministic routing.
      }
      if (user) {
        updateUser({ ...user, is_onboarding_complete: true });
      }
      window.location.href = ROLE_DASHBOARD_ROUTES[role];
    }
  };

  const handleSaveLater = async () => {
    setIsSavingLater(true);
    try {
      if (currentOrg && data.bizName) {
        await teamsService.updateOrganization(currentOrg._id, {
          name: data.bizName as string,
        });
      }
    } catch {
      // non-blocking — still redirect
    } finally {
      setIsSavingLater(false);
    }
    window.location.href = role ? ROLE_DASHBOARD_ROUTES[role] : "/member";
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else if (step === 1 && !accountRole) {
      setStep(0);
      setManualRole(null);
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
    return <StepComponent data={data} setField={setField} />;
  };

  return (
    <>
    {workspaceError && (
      <div className="ob-mobile-header" style={{ position: "sticky", top: 0, zIndex: 10, paddingInline: 16, background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ color: "var(--danger)", fontSize: 12 }}>{workspaceError}</div>
      </div>
    )}
    <style>{`
      .ob-shell { min-height: 100vh; display: grid; grid-template-columns: 280px 1fr 360px; background: var(--bg); }
      .ob-rail { background: var(--bg-2); border-right: 1px solid var(--border); padding: 28px 24px; display: flex; flex-direction: column; gap: 36px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
      .ob-summary { background: var(--bg-2); border-left: 1px solid var(--border); padding: 36px 24px; display: flex; flex-direction: column; gap: 24px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
      .ob-stage-area { padding: 56px 80px; display: flex; flex-direction: column; gap: 32px; max-width: 740px; flex: 1; }
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
          {role !== "member" && !workspaceReady ? (
            <div className="rounded-(--r-3) p-3.5" style={{ border: "1px solid var(--border)", background: "var(--bg-2)", color: "var(--fg-2)" }}>
              Preparing your workspace...
            </div>
          ) : null}
          {renderStage()}
        </div>

        {/* Bottom nav bar */}
        <div className="ob-nav">
          <div className="ob-progress" style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", color: "var(--fg-3)", letterSpacing: "0.05em" }}>
            Progress <strong style={{ color: "var(--ink)", fontWeight: 500 }}>· {progress}%</strong> — about {minsLeft} min left
          </div>
          <div className="ob-actions" style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn-ghost-v2 sm" onClick={handleSaveLater} disabled={isSavingLater}>
              {isSavingLater ? "Saving..." : "Save & finish later"}
            </button>
            {(step > 1 || (step === 1 && !accountRole)) && <button type="button" className="btn-ghost-v2 sm" onClick={handleBack}>&larr; Back</button>}
            <button
              type="button"
              disabled={(step === 0 && !role) || isFinishing || (!workspaceReady && role !== "member")}
              onClick={handleContinue}
              className="btn-primary-v2 sm"
              style={{ opacity: (step === 0 && !role) || isFinishing || (!workspaceReady && role !== "member") ? 0.4 : 1 }}
            >
              {step >= totalSteps
                ? isFinishing
                  ? "Finishing..."
                  : "Go to dashboard"
                : !workspaceReady && role !== "member"
                  ? "Preparing workspace..."
                  : `Continue${step < totalSteps && roleDef ? ` → ${roleDef.steps[step]?.title || ""}` : " →"}`}
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
            Members see a verified badge on your profile only after ID and certification are confirmed by our team. Verified providers earn 3.4x more trust from reviewers — so we move quickly. Most are approved in under 48 hours.
          </p>
        </div>
      </aside>
    </div>
    </>
  );
}
