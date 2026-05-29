"use client";

import { useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BinecticsLockup } from "@/components/BinecticsLogo";
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

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") as RoleId | null;
  const preselected = initialRole && VALID_ROLES.includes(initialRole) ? initialRole : null;

  const [role, setRole] = useState<RoleId | null>(preselected);
  const [step, setStep] = useState(preselected ? 1 : 0);
  const [data, setData] = useState<Record<string, unknown>>({});

  const setField = useCallback((key: string, value: unknown) => {
    setData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const roleDef = role ? ROLES.find((r) => r.id === role) : null;
  const steps = roleDef?.steps || GENERIC_STEPS;
  const totalSteps = steps.length;
  const progress = step === 0 ? 0 : Math.round((step / totalSteps) * 100);
  const minsLeft = Math.max(1, Math.round(((totalSteps - step) / totalSteps) * 8));

  const handleSelectRole = (id: RoleId) => {
    setRole(id);
    if (step === 0) setStep(1);
  };

  const handleContinue = () => {
    if (step === 0 && role) {
      setStep(1);
    } else if (step < totalSteps) {
      setStep(step + 1);
    } else {
      const routes: Record<RoleId, string> = {
        member: "/member",
        trainer: "/dashboard/trainer",
        gym: "/dashboard/gym-owner",
        dietitian: "/dashboard/dietitian",
      };
      if (role) router.push(routes[role]);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else if (step === 1) { setStep(0); setRole(null); }
  };

  const renderStage = () => {
    if (step === 0 || !role) {
      return (
        <>
          <StageHead crumb="Step 01" title="How will you use Binectics?" desc="Pick the role that fits. Each one unlocks a different dashboard and onboarding track." />
          <div className="ob-role-cards" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {ROLE_CARDS.map((rc) => {
              const on = role === rc.id;
              return (
                <button key={rc.id} type="button" onClick={() => { setRole(rc.id); }} style={{
                  background: on ? "var(--bg-2)" : "var(--bg)", border: on ? "1px solid var(--ink)" : "1px solid var(--border)",
                  borderRadius: "var(--r-3)", padding: 22, display: "flex", flexDirection: "column", gap: 10,
                  cursor: "pointer", textAlign: "left", position: "relative", transition: "border-color 120ms, background 120ms",
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
        .ob-stage-area h1 { font-size: 26px !important; }
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
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {ROLES.map((r) => {
              const on = role === r.id;
              return (
                <button key={r.id} type="button" onClick={() => handleSelectRole(r.id)} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                  border: on ? "1px solid var(--ink)" : "1px solid var(--border)",
                  borderRadius: "var(--r-2)", background: "var(--bg)", cursor: "pointer", textAlign: "left",
                  transition: "border-color 120ms",
                }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: r.color, flexShrink: 0 }} />
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
          <div style={{ display: "flex", flexDirection: "column" }}>
            {steps.map((s, i) => {
              const stepNum = i + 1;
              const isDone = step > stepNum;
              const isNow = step === stepNum || (step === 0 && stepNum === 1);
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "22px 1fr", gap: 12, padding: "4px 0", position: "relative" }}>
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
                </div>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ═══ Center stage ═══ */}
      <main style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="ob-stage-area">
          {renderStage()}
        </div>

        {/* Bottom nav bar */}
        <div className="ob-nav">
          <div className="ob-progress" style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", color: "var(--fg-3)", letterSpacing: "0.05em" }}>
            Progress <strong style={{ color: "var(--ink)", fontWeight: 500 }}>· {progress}%</strong> — about {minsLeft} min left
          </div>
          <div className="ob-actions" style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn-ghost-v2 sm">Save & finish later</button>
            {step > 0 && <button type="button" className="btn-ghost-v2 sm" onClick={handleBack}>&larr; Back</button>}
            <button
              type="button"
              disabled={step === 0 && !role}
              onClick={handleContinue}
              className="btn-primary-v2 sm"
              style={{ opacity: step === 0 && !role ? 0.4 : 1 }}
            >
              {step >= totalSteps ? "Go to dashboard" : `Continue${step < totalSteps && roleDef ? ` → ${roleDef.steps[step]?.title || ""}` : " →"}`}
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
