"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { authService } from "@/lib/api/auth";
import { getDashboardRoute } from "@/lib/constants/routes";
import { loginSchema, registerSchema, type LoginFormData, type RegisterFormData } from "@/lib/schemas/auth";
import { AccountType } from "@/lib/types";

/**
 * Maps the ?role= entry-point hint (provider CTAs like /for-dietitians,
 * /for-gyms link to /login?mode=signup&role=dietitian) to the account type
 * sent at registration. Unknown/absent values fall through to the backend's
 * fitness_member default. Kept in lockstep with the onboarding RoleIds.
 */
const ROLE_PARAM_TO_ACCOUNT_TYPE: Record<string, AccountType> = {
  member: AccountType.FITNESS_MEMBER,
  trainer: AccountType.PERSONAL_TRAINER,
  gym: AccountType.GYM_OWNER,
  dietitian: AccountType.DIETITIAN,
};

/**
 * Auth — auth.html prototype.
 * 2-column: left auth form (login/signup/reset panels) + right dark editorial panel.
 * Panels switch via state. OAuth row, 2FA code input, remember-me toggle.
 */

type Panel = "login" | "2fa" | "signup" | "reset" | "reset-sent";

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}><div className="w-10 h-10 rounded-full border-[3px] border-border-2 border-t-ink animate-spin" /></div>}>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const searchParams = useSearchParams();
  const { user, login, logout, register: authRegister, isLoading: authLoading } = useAuth();
  const initialMode = searchParams.get("mode");
  const [panel, setPanel] = useState<Panel>(initialMode === "signup" ? "signup" : "login");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const { register: registerField, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const { register: signupField, control: signupControl, handleSubmit: handleSignup, setValue: setSignupValue, formState: { errors: signupErrors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "", acceptTos: false },
  });

  const [signupAcceptTos, setSignupAcceptTos] = useState(false);

  const onSubmit = async (data: LoginFormData) => {
    setApiError("");
    setIsLoading(true);
    try {
      const result = await login({ email: data.email, password: data.password, rememberMe });
      if (!result.success) {
        setApiError(result.error || "Login failed. Please check your credentials.");
        setIsLoading(false);
      }
    } catch {
      setApiError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const onSignup = async (data: RegisterFormData) => {
    setApiError("");
    setIsLoading(true);
    // Carry the ?role= hint (from provider entry points like /for-dietitians)
    // into registration so the account is created with the intended role.
    // Without this the backend defaults to fitness_member and onboarding then
    // locks the user to the Member track — the role can't be changed after.
    const rawRole = searchParams.get("role");
    const signupRole = rawRole ? ROLE_PARAM_TO_ACCOUNT_TYPE[rawRole] : undefined;
    try {
      const result = await authRegister({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        password: data.password,
        accept_tos: data.acceptTos,
        ...(signupRole ? { role: signupRole } : {}),
      });
      if (!result.success) {
        setApiError(result.error || "Registration failed. Please try again.");
      }
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onResetPassword = async () => {
    if (!resetEmail) return;
    setApiError("");
    setResetLoading(true);
    try {
      const res = await authService.forgotPassword({ email: resetEmail });
      if (res.success) {
        setPanel("reset-sent");
      } else {
        setPanel("reset-sent");
      }
    } catch {
      setPanel("reset-sent");
    } finally {
      setResetLoading(false);
    }
  };

  const switcherText: Record<Panel, { text: string; link: string; panel: Panel }> = {
    login: { text: "Don’t have an account?", link: "Sign up", panel: "signup" },
    "2fa": { text: "", link: "← Sign in", panel: "login" },
    signup: { text: "Have an account?", link: "Sign in", panel: "login" },
    reset: { text: "", link: "← Sign in", panel: "login" },
    "reset-sent": { text: "", link: "← Sign in", panel: "login" },
  };

  const sw = switcherText[panel];

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_1.1fr]" style={{ background: "var(--bg)" }}>

      {/* ═══ LEFT — Auth form ═══ */}
      <div className="flex flex-col min-h-screen px-5 py-6 sm:px-8 sm:py-8 lg:px-12">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Link href="/"><BinecticsLockup /></Link>
          <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
            {sw.text}{" "}
            <button onClick={() => setPanel(sw.panel)} className="font-medium underline underline-offset-3" style={{ color: "var(--ink)", textDecorationColor: "var(--border-2)" }}>{sw.link}</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="max-w-[380px] w-full">

            {/* ── ALREADY SIGNED IN ── */}
            {/* A session can already exist here (e.g. logged in from another
                tab, or a prefetch-cached /login skipped the middleware
                redirect). Offer the dashboard instead of a dead login form. */}
            {(panel === "login" || panel === "signup") && user && !isLoading && !authLoading && (
              <>
                <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Signed in</div>
                <h1 className="text-[30px] font-medium leading-[1.1] mt-3" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>
                  You&apos;re already signed in{user.first_name ? (
                    <> as <em className="font-serif font-normal italic">{user.first_name}</em></>
                  ) : null}.
                </h1>
                <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "var(--fg-3)" }}>
                  Pick up where you left off, or sign out first to use a different account.
                </p>
                <div className="flex flex-col gap-3 mt-8">
                  <Link href={getDashboardRoute(user.role)} className="btn-primary-v2 w-full justify-center">
                    Continue to your dashboard
                  </Link>
                  <button type="button" onClick={() => void logout()} className="btn-ghost-v2 w-full justify-center">
                    Sign out
                  </button>
                </div>
              </>
            )}

            {/* ── LOGIN ── */}
            {panel === "login" && !(user && !isLoading && !authLoading) && (
              <>
                <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Sign in</div>
                <h1 className="text-[30px] font-medium leading-[1.1] mt-3" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>
                  Welcome back.<br />Pick up where you <em className="font-serif font-normal italic">left off</em>.
                </h1>
                <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "var(--fg-3)" }}>3 upcoming sessions waiting — including Wed 08:30 with Sarah.</p>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5 mt-8">
                  {apiError && (
                    <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-(--r-2)" style={{ background: "var(--danger-soft, oklch(0.95 0.03 25))", border: "1px solid oklch(0.85 0.06 25)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" style={{ color: "var(--danger)" }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                      <p className="text-[13px]" style={{ color: "var(--danger)" }}>{apiError}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Email or phone</label>
                    <input type="email" required placeholder="you@example.com" className="h-10.5 rounded-(--r-2) px-3.5 text-[14px]" style={{ border: errors.email ? "1px solid var(--danger)" : "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} {...registerField("email")} />
                    {errors.email && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{errors.email.message}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Password</label>
                      <button type="button" onClick={() => setPanel("reset")} className="font-mono text-[9px] uppercase tracking-[0.05em] underline underline-offset-3" style={{ color: "var(--fg-3)", textDecorationColor: "var(--border-2)" }}>Forgot password</button>
                    </div>
                    <div className="relative">
                      <input type={showPw ? "text" : "password"} required minLength={8} placeholder="••••••••••••" className="h-10.5 w-full rounded-(--r-2) px-3.5 pr-10 text-[14px]" style={{ border: errors.password ? "1px solid var(--danger)" : "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} {...registerField("password")} />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }} aria-label={showPw ? "Hide password" : "Show password"}>
                        {showPw ? "Hide" : "Show"}
                      </button>
                    </div>
                    {errors.password && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{errors.password.message}</p>}
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                    <span className={`w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 ${rememberMe ? "bg-ink border-ink" : "bg-bg border-border-2"}`}>
                      {rememberMe && <span className="w-[7px] h-1 border-l-[1.5px] border-b-[1.5px] -rotate-45 -translate-y-px" style={{ borderColor: "var(--bg)" }} />}
                    </span>
                    <span className="text-[13px]" style={{ color: "var(--fg-2)" }}>Keep me signed in on this device</span>
                  </label>

                  <button type="submit" disabled={isLoading || authLoading} className="btn-primary-v2 lg w-full justify-center">
                    {isLoading || authLoading ? "Signing in…" : "Sign in →"}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3.5 my-6">
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  <span className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>or</span>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                </div>

                {/* OAuth */}
                <div className="grid grid-cols-3 gap-2">
                  <button className="flex items-center justify-center gap-2 h-10 rounded-(--r-2) text-[13px] font-medium cursor-pointer" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)", transition: "border-color 120ms, background 120ms" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M22.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.7 3.2-8.1z"/><path d="M12 23c2.9 0 5.3-1 7.1-2.6l-3.6-2.7c-1 .7-2.2 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.5v2.7C4.3 20.5 7.9 23 12 23z"/><path d="M6.2 14.3c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.6H2.5C1.8 9 1.4 10.5 1.4 12s.4 3 1.1 4.4l3.7-2.1z"/><path d="M12 4.8c1.5 0 2.9.5 4 1.5l3-3C17.3 1.7 14.9.7 12 .7 7.9.7 4.3 3.2 2.5 6.8l3.7 2.7c.8-2.5 3.1-4.7 5.8-4.7z"/></svg>
                    Google
                  </button>
                  <button className="flex items-center justify-center gap-2 h-10 rounded-(--r-2) text-[13px] font-medium cursor-pointer" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)", transition: "border-color 120ms, background 120ms" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.6 12.5c0-2.6 2.1-3.9 2.2-3.9-1.2-1.7-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.3-.9-1.7 0-3.3 1-4.2 2.5-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.3 2.5 1.3 0 1.8-.8 3.4-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.2 3.2-2.5 1-1.4 1.4-2.8 1.4-2.9-.1 0-2.9-1.1-3.1-4.4zM15 4.5c.7-.9 1.2-2.1 1.1-3.3-1 0-2.3.7-3 1.5-.7.8-1.3 2-1.1 3.2 1.1.1 2.3-.5 3-1.4z"/></svg>
                    Apple
                  </button>
                  <button className="flex items-center justify-center gap-2 h-10 rounded-(--r-2) text-[13px] font-medium cursor-pointer" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)", transition: "border-color 120ms, background 120ms" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16v16H4z"/><path d="M4 4l16 16M20 4L4 20"/></svg>
                    SSO
                  </button>
                </div>
              </>
            )}

            {/* ── 2FA ── */}
            {panel === "2fa" && (
              <>
                <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>2-step verification</div>
                <h1 className="text-[30px] font-medium leading-[1.1] mt-3" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>
                  Check the code on your phone.
                </h1>
                <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "var(--fg-3)" }}>Sent to +27 82 ••• 1284 — should arrive in a few seconds. The code expires in 5 minutes.</p>

                <div className="flex flex-col gap-3.5 mt-8">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>6-digit code</label>
                    <div className="flex gap-2">
                      {["4", "2", "9", "1", "", ""].map((v, i) => (
                        <input key={i} maxLength={1} defaultValue={v} placeholder="•" className="w-11 h-12 rounded-(--r-2) text-center text-[20px] font-medium" style={{ border: "1px solid var(--border-2)", color: v ? "var(--ink)" : "var(--fg-4)", background: "var(--bg)", fontFamily: "inherit" }} readOnly />
                      ))}
                    </div>
                  </div>
                  <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                    Code didn&apos;t arrive?{" "}
                    <span className="underline underline-offset-3 cursor-pointer" style={{ color: "var(--ink)", textDecorationColor: "var(--border-2)" }}>Resend in 28s</span>
                    {" · "}
                    <span className="underline underline-offset-3 cursor-pointer" style={{ color: "var(--ink)", textDecorationColor: "var(--border-2)" }}>Use authenticator app</span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <span className="w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 bg-bg border-border-2" />
                    <span className="text-[13px]" style={{ color: "var(--fg-2)" }}>Trust this device for 30 days</span>
                  </label>

                  <div className="flex gap-2">
                    <button onClick={() => setPanel("login")} className="btn-ghost-v2">← Back</button>
                    <button className="btn-primary-v2 lg flex-1 justify-center">Sign in →</button>
                  </div>
                </div>
              </>
            )}

            {/* ── SIGNUP ── */}
            {panel === "signup" && !(user && !isLoading && !authLoading) && (
              <>
                <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Create an account</div>
                <h1 className="text-[30px] font-medium leading-[1.1] mt-3" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>
                  Find your <em className="font-serif font-normal italic">people</em>.<br />It takes a minute.
                </h1>
                <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "var(--fg-3)" }}>Free to join. Pay only for what you book. Cancel any session up to 24h before.</p>

                <form className="flex flex-col gap-3.5 mt-8" onSubmit={handleSignup(onSignup)}>
                  {apiError && (
                    <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-(--r-2)" style={{ background: "var(--danger-soft, oklch(0.95 0.03 25))", border: "1px solid oklch(0.85 0.06 25)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" style={{ color: "var(--danger)" }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                      <p className="text-[13px]" style={{ color: "var(--danger)" }}>{apiError}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>First name</label>
                      <input required placeholder="Tunde" className="h-10.5 rounded-(--r-2) px-3.5 text-[14px]" style={{ border: signupErrors.firstName ? "1px solid var(--danger)" : "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} {...signupField("firstName")} />
                      {signupErrors.firstName && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{signupErrors.firstName.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Last name</label>
                      <input required placeholder="Adebayo" className="h-10.5 rounded-(--r-2) px-3.5 text-[14px]" style={{ border: signupErrors.lastName ? "1px solid var(--danger)" : "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} {...signupField("lastName")} />
                      {signupErrors.lastName && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{signupErrors.lastName.message}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Email</label>
                    <input type="email" required placeholder="you@example.com" className="h-10.5 rounded-(--r-2) px-3.5 text-[14px]" style={{ border: signupErrors.email ? "1px solid var(--danger)" : "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} {...signupField("email")} />
                    {signupErrors.email && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{signupErrors.email.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Password</label>
                    <div className="relative">
                      <input type={showSignupPw ? "text" : "password"} required placeholder="At least 8 characters" className="h-10.5 w-full rounded-(--r-2) px-3.5 pr-14 text-[14px]" style={{ border: signupErrors.password ? "1px solid var(--danger)" : "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} {...signupField("password")} />
                      <button type="button" onClick={() => setShowSignupPw(!showSignupPw)} className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }} aria-label={showSignupPw ? "Hide password" : "Show password"}>
                        {showSignupPw ? "Hide" : "Show"}
                      </button>
                    </div>
                    {signupErrors.password && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{signupErrors.password.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Confirm password</label>
                    <div className="relative">
                      <input type={showSignupPw ? "text" : "password"} required placeholder="Re-enter your password" className="h-10.5 w-full rounded-(--r-2) px-3.5 pr-14 text-[14px]" style={{ border: signupErrors.confirmPassword ? "1px solid var(--danger)" : "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} {...signupField("confirmPassword")} />
                      <button type="button" onClick={() => setShowSignupPw(!showSignupPw)} className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }} aria-label={showSignupPw ? "Hide password" : "Show password"}>
                        {showSignupPw ? "Hide" : "Show"}
                      </button>
                    </div>
                    {signupErrors.confirmPassword && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{signupErrors.confirmPassword.message}</p>}
                  </div>
                  <button type="button" className="flex items-center gap-2 cursor-pointer text-left" onClick={() => { const next = !signupAcceptTos; setSignupAcceptTos(next); setSignupValue("acceptTos", next, { shouldValidate: true }); }}>
                    <span className={`w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 ${signupAcceptTos ? "bg-ink border-ink" : ""}`} style={{ background: signupAcceptTos ? "var(--ink)" : "var(--bg)", borderColor: signupErrors.acceptTos ? "var(--danger)" : signupAcceptTos ? "var(--ink)" : "var(--border-2)" }}>
                      {signupAcceptTos && <span className="w-1.75 h-1 border-l-[1.5px] border-b-[1.5px] -rotate-45 -translate-y-px" style={{ borderColor: "var(--bg)" }} />}
                    </span>
                    <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>I agree to the <Link href="/terms" className="underline underline-offset-3" style={{ color: "var(--ink)", textDecorationColor: "var(--border-2)" }}>Terms</Link> and <Link href="/privacy" className="underline underline-offset-3" style={{ color: "var(--ink)", textDecorationColor: "var(--border-2)" }}>Privacy</Link></span>
                  </button>
                  {signupErrors.acceptTos && <p className="text-[12px] -mt-2" style={{ color: "var(--danger)" }}>{signupErrors.acceptTos.message}</p>}
                  <button type="submit" disabled={isLoading || authLoading} className="btn-primary-v2 lg w-full justify-center">
                    {isLoading || authLoading ? "Creating account…" : "Create account →"}
                  </button>
                </form>

                <div className="flex items-center gap-3.5 my-6">
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                  <span className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>or continue with</span>
                  <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {["Google", "Apple", "SSO"].map((p) => (
                    <button key={p} className="flex items-center justify-center gap-2 h-10 rounded-(--r-2) text-[13px] font-medium cursor-pointer" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}>{p}</button>
                  ))}
                </div>
              </>
            )}

            {/* ── RESET ── */}
            {panel === "reset" && (
              <>
                <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Reset password</div>
                <h1 className="text-[30px] font-medium leading-[1.1] mt-3" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>
                  No worries.<br />Let&apos;s get you in.
                </h1>
                <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "var(--fg-3)" }}>Tell us where to send the reset link. It expires in 30 minutes.</p>
                <div className="flex flex-col gap-3.5 mt-8">
                  <div className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Email or phone</label>
                    <input type="email" required placeholder="you@example.com" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className="h-10.5 rounded-(--r-2) px-3.5 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
                    <span className="text-[12px] leading-relaxed" style={{ color: "var(--fg-3)" }}>If we find an account, you&apos;ll get an email. We don&apos;t say either way to protect privacy.</span>
                  </div>
                  <button className="btn-primary-v2 lg w-full justify-center" disabled={resetLoading || !resetEmail} onClick={onResetPassword}>
                    {resetLoading ? "Sending…" : "Send reset link →"}
                  </button>
                  <button className="btn-ghost-v2 w-full justify-center" onClick={() => setPanel("login")}>← Back to sign in</button>
                </div>
              </>
            )}

            {/* ── RESET SENT ── */}
            {panel === "reset-sent" && (
              <>
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ background: "var(--signal-soft)" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="oklch(0.22 0.05 148)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>
                </div>
                <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Check your inbox</div>
                <h1 className="text-[30px] font-medium leading-[1.1] mt-3" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>
                  We&apos;ve sent the link.
                </h1>
                <p className="text-[14px] mt-3 leading-relaxed" style={{ color: "var(--fg-3)" }}>If the email matches an account, the link should arrive within a minute. Check spam if you don&apos;t see it.</p>
                <div className="flex flex-col gap-3.5 mt-8">
                  <button className="btn-primary-v2 lg w-full justify-center" onClick={() => setPanel("login")}>Back to sign in</button>
                  <div className="text-[12.5px] text-center" style={{ color: "var(--fg-3)" }}>
                    Wrong email? <button onClick={() => setPanel("reset")} className="underline underline-offset-3" style={{ color: "var(--ink)", textDecorationColor: "var(--border-2)" }}>Try another</button>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
          <span>© 2026 Binectics</span>
          <span className="flex gap-2">
            <Link href="/help" style={{ color: "var(--fg-2)" }}>Help</Link> ·{" "}
            <Link href="/privacy" style={{ color: "var(--fg-2)" }}>Privacy</Link> ·{" "}
            <Link href="/terms" style={{ color: "var(--fg-2)" }}>Terms</Link>
          </span>
        </div>
      </div>

      {/* ═══ RIGHT — Dark editorial panel ═══ */}
      <aside className="hidden lg:flex flex-col justify-between gap-12" style={{ background: "var(--ink)", color: "var(--bg)", padding: "56px" }}>
        <div className="flex justify-between items-center">
          <div />
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.05em] px-2.5 py-1.25 rounded-full" style={{ color: "oklch(0.85 0.005 85)", border: "1px solid oklch(0.3 0.005 85)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--signal)", boxShadow: "0 0 0 3px oklch(0.68 0.16 148 / 0.2)" }} />
            Early access · founding cohort open
          </span>
        </div>

        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.05em] mb-4.5" style={{ color: "oklch(0.65 0.005 85)" }}>The promise</div>
          <p className="font-serif italic text-[48px] leading-[1.1] max-w-[18ch]" style={{ letterSpacing: "-0.02em", color: "var(--bg)" }}>
            Your Monday reports, already drafted. You review, send, and get back to the floor.
          </p>
          <div className="flex items-center gap-3 mt-8">
            <span className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold" style={{ background: "var(--signal)", color: "oklch(0.2 0.05 148)" }}>B</span>
            <div>
              <div className="text-[14px] font-medium">The Binectics copilot</div>
              <div className="font-mono text-[11px] uppercase tracking-[0.05em] mt-0.5" style={{ color: "oklch(0.65 0.005 85)" }}>Every draft reviewed by you before it sends</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5 pt-8" style={{ borderTop: "1px solid oklch(0.3 0.005 85)" }}>
          {[
            { v: "8", k: "Currencies at launch" },
            { v: "50+", k: "Countries supported" },
            { v: "0", k: "Drafts sent without review" },
          ].map((s) => (
            <div key={s.k}>
              <div className="text-[26px] font-medium" style={{ letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{s.v}</div>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.05em] mt-1.5" style={{ color: "oklch(0.65 0.005 85)" }}>{s.k}</div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
