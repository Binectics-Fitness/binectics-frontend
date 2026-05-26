"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { AccountType } from "@/lib/types";
import { registerSchema, type RegisterFormData } from "@/lib/schemas/auth";
import { mapApiErrors } from "@/lib/utils/form-errors";
import { BinecticsLockup } from "@/components/BinecticsLogo";

const REGISTER_FIELDS = ["firstName", "lastName", "email", "password", "confirmPassword"] as const;

export default function DietitianRegisterPage() {
  const { register: authRegister, isLoading: authLoading } = useAuth();
  const {
    register: registerField,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { firstName: "", lastName: "", email: "", password: "", confirmPassword: "", acceptTos: false },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);

  const onSubmit = async (data: RegisterFormData) => {
    setApiErrors([]);
    setIsLoading(true);
    try {
      const result = await authRegister({
        email: data.email, password: data.password,
        first_name: data.firstName, last_name: data.lastName,
        role: AccountType.DIETITIAN, accept_tos: data.acceptTos,
      });
      if (!result.success) {
        const unmapped = mapApiErrors(result, setError, REGISTER_FIELDS);
        if (unmapped.length > 0) setApiErrors(unmapped);
      }
    } catch { setApiErrors(["Something went wrong. Please try again."]); }
    finally { setIsLoading(false); }
  };

  const EyeIcon = ({ show }: { show: boolean }) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{show ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></> : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>}</svg>
  );

  const inputCls = "h-8.5 w-full rounded-(--r-2) px-3 text-[13.5px]";
  const inputStyle = (err?: string) => ({ background: "var(--bg)", border: err ? "1px solid var(--danger)" : "1px solid var(--border-2)", color: "var(--ink)", fontFamily: "inherit" as const });
  const lbl = "font-mono text-[10.5px] uppercase tracking-[0.06em]";

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <header className="flex items-center h-14 px-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <Link href="/"><BinecticsLockup /></Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Link href="/register" className="inline-flex items-center gap-2 text-[13px] font-medium mb-6" style={{ color: "var(--fg-2)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m15 19-7-7 7-7"/></svg>
            Back
          </Link>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 h-6 px-2.5 rounded-(--r-1) mb-3" style={{ background: "var(--dietitian-soft)", border: "1px solid oklch(0.88 0.04 300)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--dietitian)" }} />
              <span className="font-mono text-[10.5px] uppercase tracking-[0.05em]" style={{ color: "var(--dietitian)" }}>Dietitian</span>
            </div>
            <h1 className="text-[28px] font-medium leading-tight" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>Create your dietitian account</h1>
            <p className="text-[14.5px] mt-2" style={{ color: "var(--fg-3)" }}>Help clients achieve their nutrition goals.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            {apiErrors.length > 0 && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-(--r-2)" style={{ background: "oklch(0.95 0.03 25)", border: "1px solid oklch(0.85 0.06 25)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" style={{ color: "var(--danger)" }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                <div className="text-[13px]" style={{ color: "var(--danger)" }}>{apiErrors.map((e, i) => <p key={i}>{e}</p>)}</div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className={lbl} style={{ color: "var(--fg-3)" }}>First name <span style={{ color: "var(--danger)" }}>*</span></label>
                <input placeholder="John" className={inputCls} style={inputStyle(errors.firstName?.message)} {...registerField("firstName")} />
                {errors.firstName && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{errors.firstName.message}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={lbl} style={{ color: "var(--fg-3)" }}>Last name <span style={{ color: "var(--danger)" }}>*</span></label>
                <input placeholder="Doe" className={inputCls} style={inputStyle(errors.lastName?.message)} {...registerField("lastName")} />
                {errors.lastName && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{errors.lastName.message}</p>}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={lbl} style={{ color: "var(--fg-3)" }}>Email <span style={{ color: "var(--danger)" }}>*</span></label>
              <input type="email" placeholder="you@example.com" className={inputCls} style={inputStyle(errors.email?.message)} {...registerField("email")} />
              {errors.email && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={lbl} style={{ color: "var(--fg-3)" }}>Password <span style={{ color: "var(--danger)" }}>*</span></label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} placeholder="••••••••••••" className={`${inputCls} pr-9`} style={inputStyle(errors.password?.message)} {...registerField("password")} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--fg-3)" }}><EyeIcon show={showPw} /></button>
              </div>
              {errors.password && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{errors.password.message}</p>}
              <p className="text-[12px]" style={{ color: "var(--fg-3)" }}>Min 12 characters with uppercase, lowercase, number, and special character</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className={lbl} style={{ color: "var(--fg-3)" }}>Confirm password <span style={{ color: "var(--danger)" }}>*</span></label>
              <div className="relative">
                <input type={showCpw ? "text" : "password"} placeholder="••••••••••••" className={`${inputCls} pr-9`} style={inputStyle(errors.confirmPassword?.message)} {...registerField("confirmPassword")} />
                <button type="button" onClick={() => setShowCpw(!showCpw)} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--fg-3)" }}><EyeIcon show={showCpw} /></button>
              </div>
              {errors.confirmPassword && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{errors.confirmPassword.message}</p>}
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input type="checkbox" className="sr-only" {...registerField("acceptTos")} />
              <span className="w-4 h-4 rounded-1 border flex items-center justify-center shrink-0" style={{ background: "var(--bg)", borderColor: errors.acceptTos ? "var(--danger)" : "var(--border-2)" }} />
              <span className="text-[13px]" style={{ color: "var(--fg-2)" }}>
                I agree to the <Link href="/terms" target="_blank" className="font-medium" style={{ color: "var(--ink)" }}>Terms</Link> and <Link href="/privacy" target="_blank" className="font-medium" style={{ color: "var(--ink)" }}>Privacy Policy</Link>
              </span>
            </label>
            {errors.acceptTos && <p className="text-[12px] -mt-3" style={{ color: "var(--danger)" }}>{errors.acceptTos.message}</p>}
            <button type="submit" disabled={isLoading || authLoading} className="btn-signal-v2 w-full" style={{ height: "38px" }}>
              {isLoading || authLoading ? "Creating account…" : "Create account"}
            </button>
          </form>
          <p className="text-[13px] text-center mt-6" style={{ color: "var(--fg-3)" }}>
            Already have an account? <Link href="/login" className="font-medium" style={{ color: "var(--ink)" }}>Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
