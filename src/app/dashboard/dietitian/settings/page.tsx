import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dietitian Settings",
  description: "Configure your practice preferences and availability.",
};

function Toggle({ on = true }: { on?: boolean }) {
  return (
    <span className="w-7.5 h-4.5 rounded-full relative cursor-pointer shrink-0 mt-0.5" style={{ background: on ? "var(--ink)" : "var(--border-2)" }}>
      <span className="absolute w-3.5 h-3.5 rounded-full top-0.5" style={{ background: "var(--bg)", left: on ? "14px" : "2px", transition: "left var(--motion-fast) var(--ease)" }} />
    </span>
  );
}

export default function DietitianSettingsPage() {
  return (
    <DietitianDashboardShell
      activeItem="Settings"
      crumb="Settings"
    >
      <div className="pb-1">
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Settings</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Profile, clinical licensure, consultation defaults, plan delivery, and notifications.</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 lg:gap-10 items-start">
        {/* Section nav */}
        <nav className="sticky top-20 flex flex-col sm:flex-row lg:flex-col gap-0.5 overflow-x-auto">
          {[
            { group: "Account", items: [{ id: "profile", label: "Profile", active: true }, { id: "licensure", label: "Licensure" }, { id: "consultations", label: "Consultations" }, { id: "delivery", label: "Plan delivery" }, { id: "notifications", label: "Notifications" }] },
            { group: "Money", items: [{ id: "payouts", label: "Payouts" }, { id: "tax", label: "Tax info" }] },
          ].map((s) => (
            <div key={s.group}>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] px-2.5 py-1 mt-3.5 first:mt-0 mb-1" style={{ color: "var(--fg-3)" }}>{s.group}</div>
              {s.items.map((item) => (
                <a key={item.id} href={`#${item.id}`} className={`block py-1.75 rounded-(--r-2) text-[13px] ${"active" in item && item.active ? "bg-bg font-medium" : "hover:bg-bg"}`} style={{ color: "active" in item && item.active ? "var(--ink)" : "var(--fg-3)", borderLeft: "active" in item && item.active ? "2px solid var(--ink)" : "2px solid transparent", paddingLeft: "active" in item && item.active ? "8px" : "10px", textDecoration: "none" }}>
                  {item.label}
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-3.5">
          {/* Profile */}
          <section id="profile" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Profile</h2>
            </div>
            <div className="px-5.5 py-5 flex flex-col gap-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[{ label: "Name", value: "Dr Nadia Hassan, RD" }, { label: "Email", value: "nadia@binectics.com" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", width: "100%" }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[{ label: "Phone", value: "+234 80 ••• 4218" }, { label: "Time zone", value: "Africa / Lagos · UTC+1" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", width: "100%" }} />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Practice address</label>
                <input defaultValue="42 Awolowo Rd, Ikoyi, Lagos" className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", width: "100%" }} />
              </div>
            </div>
          </section>

          {/* Licensure */}
          <section id="licensure" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Licensure</h2>
              <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>Required for verification. Updates may require re-verification by our clinical reviewer.</div>
            </div>
            <div className="px-5.5 py-5 flex flex-col gap-2">
              {[
                { abbr: "RD", name: "Registered Dietitian · Nigerian DA", meta: "License 24‑1844‑NG · expires Sep 2027", bg: "var(--signal)", color: "var(--bg)" },
                { abbr: "MS", name: "MSc Clinical Nutrition · UCT", meta: "Awarded 2018 · doc submitted", bg: "var(--gym)", color: "var(--bg)" },
                { abbr: "PI", name: "Professional indemnity · Allianz", meta: "Policy 4421‑NG · renews Dec 2026", bg: "var(--trainer)", color: "var(--bg)" },
              ].map((l) => (
                <div key={l.abbr} className="flex items-center gap-3 p-3.5 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
                  <span className="w-7.5 h-7.5 rounded-(--r-1) flex items-center justify-center text-[14px] font-bold shrink-0" style={{ background: l.bg, color: l.color }}>{l.abbr}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{l.name}</div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>{l.meta}</div>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-2 py-0.75 rounded-full" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}>Verified</span>
                </div>
              ))}
            </div>
          </section>

          {/* Consultations */}
          <section id="consultations" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Consultations</h2>
            </div>
            <div className="px-5.5" style={{ paddingTop: "8px", paddingBottom: "8px" }}>
              {[
                { t: "Require intake form before first consult", s: "Medical history, current meds, blood-work upload.", on: true },
                { t: "Auto-confirm follow-ups", s: "Returning clients book straight in.", on: true },
                { t: "Record video consultations", s: "Saved for 90 days · client can request the file.", on: false },
                { t: "48h cancellation window", s: "Stricter than the platform default of 24h.", on: true },
              ].map((t, i) => (
                <div key={t.t} className="flex justify-between items-start gap-3.5 py-3" style={{ borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                  <div><div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{t.t}</div><div className="text-[12.5px] mt-0.75" style={{ color: "var(--fg-3)", lineHeight: 1.5, maxWidth: "56ch" }}>{t.s}</div></div>
                  <Toggle on={t.on} />
                </div>
              ))}
            </div>
          </section>

          {/* Plan delivery */}
          <section id="delivery" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Plan delivery</h2>
              <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>How clients receive your meal plans.</div>
            </div>
            <div className="px-5.5" style={{ paddingTop: "8px", paddingBottom: "8px" }}>
              {[
                { t: "Branded PDF export", s: "Your logo + practice details on every plan PDF.", on: true },
                { t: "Auto-deliver after consult", s: "Plan emailed within 2 business days of consult completion.", on: true },
                { t: "Send meal-log reminder · daily", s: "7pm push to log the day's meals.", on: true },
                { t: "Weekly check-in nudge", s: "Sunday email · weight, adherence, mood.", on: true },
              ].map((t, i) => (
                <div key={t.t} className="flex justify-between items-start gap-3.5 py-3" style={{ borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                  <div><div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{t.t}</div><div className="text-[12.5px] mt-0.75" style={{ color: "var(--fg-3)", lineHeight: 1.5, maxWidth: "56ch" }}>{t.s}</div></div>
                  <Toggle on={t.on} />
                </div>
              ))}
            </div>
          </section>

          {/* Notifications */}
          <section id="notifications" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Notifications</h2>
            </div>
            <div className="px-5.5" style={{ paddingTop: "8px", paddingBottom: "8px" }}>
              {[
                { t: "New consultation booking · push + email", s: "Within 30 seconds.", on: true },
                { t: "Client meal logs · digest at 8am", s: "All overnight logs in one push.", on: true },
                { t: "Adherence alerts · client below 40% · push", s: "Catch silent drop-offs early.", on: true },
                { t: "Plan expiry · 7 days before", s: "Reminder to nudge for renewal.", on: true },
              ].map((t, i) => (
                <div key={t.t} className="flex justify-between items-start gap-3.5 py-3" style={{ borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                  <div><div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{t.t}</div><div className="text-[12.5px] mt-0.75" style={{ color: "var(--fg-3)", lineHeight: 1.5, maxWidth: "56ch" }}>{t.s}</div></div>
                  <Toggle on={t.on} />
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </DietitianDashboardShell>
  );
}
