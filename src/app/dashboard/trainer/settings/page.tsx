import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trainer Settings",
  description: "Configure your training preferences and availability.",
};

function Toggle({ on = true }: { on?: boolean }) {
  return (
    <span className="w-7.5 h-4.5 rounded-full relative cursor-pointer shrink-0 mt-0.5" style={{ background: on ? "var(--ink)" : "var(--border-2)" }}>
      <span className="absolute w-3.5 h-3.5 rounded-full top-0.5" style={{ background: "var(--bg)", left: on ? "14px" : "2px", transition: "left var(--motion-fast) var(--ease)" }} />
    </span>
  );
}

const SCHEDULE_TOGGLES = [
  { t: "Auto-confirm returning clients", s: "New leads still need approval. Returning clients book instantly.", on: true },
  { t: "Require PAR-Q from new clients", s: "Standard health-history form. Sent automatically before first session.", on: true },
  { t: "50% cancellation fee within 24h", s: "Reasonable exceptions waived by support team.", on: true },
  { t: "15-minute buffer between sessions", s: "Blocks back-to-back bookings.", on: true },
  { t: "Min 6h notice for new bookings", s: "No same-morning bookings before 12pm.", on: true },
  { t: "Max 8 bookings per day", s: "Protects your energy. Override per-day in the calendar.", on: true },
];

const NOTIF_TOGGLES = [
  { t: "New booking · push + email", s: "Within 30 seconds of a client booking.", on: true },
  { t: "Client messages · push", s: "Live chat during work hours.", on: true },
  { t: "Session reminders · 1h before · push", s: "So you know who’s next.", on: true },
  { t: "Cancellations · push + email", s: "Within 60 seconds of cancellation.", on: true },
  { t: "Payout confirmations · email", s: "Tuesday mornings when funds land in your account.", on: true },
  { t: "Weekly summary · email", s: "Sundays at 6pm. Sessions, earnings, no-shows.", on: true },
  { t: "Marketing tips & product updates", s: "Off by default. We don’t email unless you ask.", on: false },
];

export default function TrainerSettingsPage() {
  return (
    <TrainerDashboardShell
      activeItem="Settings"
      crumb="Settings"
      actions={
        <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.05em] px-2.5 py-1 rounded-full" style={{ color: "var(--signal-ink)", background: "var(--signal-soft)", border: "1px solid oklch(0.88 0.05 148)" }}>
          <span className="w-1.25 h-1.25 rounded-full" style={{ background: "var(--signal)" }} />All changes saved
        </span>
      }
    >
      <div className="pb-1">
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Settings</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Account, scheduling rules, payouts, integrations, and notifications.</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-6 lg:gap-10 items-start">
        {/* Section nav */}
        <nav className="sticky top-20 flex flex-col sm:flex-row lg:flex-col gap-0.5 overflow-x-auto">
          {[
            { group: "Account", items: [{ id: "profile", label: "Profile", active: true }, { id: "scheduling", label: "Scheduling rules" }, { id: "notifications", label: "Notifications" }] },
            { group: "Money", items: [{ id: "payouts", label: "Payouts" }, { id: "tax", label: "Tax info" }] },
            { group: "Tools", items: [{ id: "integrations", label: "Integrations" }, { id: "security", label: "Security & 2FA" }] },
            { group: "Danger", items: [{ id: "close", label: "Close account", danger: true }] },
          ].map((s) => (
            <div key={s.group}>
              <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] px-2.5 py-1 mt-3.5 first:mt-0 mb-1" style={{ color: "var(--fg-3)" }}>{s.group}</div>
              {s.items.map((item) => (
                <a key={item.id} href={`#${item.id}`} className={`block py-1.75 rounded-(--r-2) text-[13px] ${"active" in item && item.active ? "bg-bg font-medium" : "hover:bg-bg"}`} style={{ color: "danger" in item && item.danger ? "var(--danger)" : "active" in item && item.active ? "var(--ink)" : "var(--fg-3)", borderLeft: "active" in item && item.active ? "2px solid var(--ink)" : "2px solid transparent", paddingLeft: "active" in item && item.active ? "8px" : "10px", textDecoration: "none" }}>
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
              <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Profile basics</h2>
              <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)", maxWidth: "56ch", lineHeight: 1.5 }}>Personal details. To edit what clients see on your public profile, use <a href="/dashboard/trainer/profile" style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: "3px", textDecorationColor: "var(--border-2)" }}>My profile</a>.</div>
            </div>
            <div className="px-5.5 py-5 flex flex-col gap-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[{ label: "Display name", value: "Sarah Okafor" }, { label: "Pronouns", value: "she / her" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", width: "100%" }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[{ label: "Email", value: "sarah@binectics.com" }, { label: "Phone", value: "+27 82 ••• 1284" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", width: "100%" }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[{ label: "Time zone", value: "Africa / Johannesburg · UTC+2" }, { label: "Currency", value: "ZAR · R" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", width: "100%" }} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Scheduling rules */}
          <section id="scheduling" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Scheduling rules</h2>
              <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)", maxWidth: "56ch", lineHeight: 1.5 }}>When and how clients can book you. Calendar-level overrides live in <a href="/dashboard/trainer/sessions" style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: "3px", textDecorationColor: "var(--border-2)" }}>your calendar</a>.</div>
            </div>
            <div className="px-5.5" style={{ paddingTop: "8px", paddingBottom: "8px" }}>
              {SCHEDULE_TOGGLES.map((t, i) => (
                <div key={t.t} className="flex justify-between items-start gap-3.5 py-3" style={{ borderBottom: i < SCHEDULE_TOGGLES.length - 1 ? "1px solid var(--border)" : "none" }}>
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
              <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)", maxWidth: "56ch", lineHeight: 1.5 }}>How Binectics reaches you. Security alerts always go by email — that&apos;s not optional.</div>
            </div>
            <div className="px-5.5" style={{ paddingTop: "8px", paddingBottom: "8px" }}>
              {NOTIF_TOGGLES.map((t, i) => (
                <div key={t.t} className="flex justify-between items-start gap-3.5 py-3" style={{ borderBottom: i < NOTIF_TOGGLES.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div><div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{t.t}</div><div className="text-[12.5px] mt-0.75" style={{ color: "var(--fg-3)", lineHeight: 1.5, maxWidth: "56ch" }}>{t.s}</div></div>
                  <Toggle on={t.on} />
                </div>
              ))}
            </div>
          </section>

          {/* Payouts */}
          <section id="payouts" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Payouts</h2>
              <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)", maxWidth: "56ch", lineHeight: 1.5 }}>Where Binectics sends your money. Manage detailed payout history in <a href="/dashboard/trainer/earnings" style={{ color: "var(--ink)", textDecoration: "underline", textUnderlineOffset: "3px", textDecorationColor: "var(--border-2)" }}>earnings</a>.</div>
            </div>
            <div className="px-5.5 py-5 flex flex-col gap-2">
              {/* Bank card - primary */}
              <div className="flex items-center gap-3 p-3.5 rounded-(--r-2)" style={{ border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-center shrink-0 font-mono text-[9px] font-bold" style={{ width: 38, height: 28, borderRadius: "var(--r-1)", background: "linear-gradient(135deg, oklch(0.45 0.18 200), oklch(0.55 0.15 220))", color: "var(--bg)" }}>ABSA</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>Sarah Okafor</div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.75" style={{ color: "var(--fg-3)" }}>Cheque · ABSA · •••• 3914 · ZAR</div>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: "var(--ink)", color: "var(--bg)" }}>Primary</span>
              </div>
              {/* Bank card - USD */}
              <div className="flex items-center gap-3 p-3.5 rounded-(--r-2) mb-3.5" style={{ border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-center shrink-0 font-mono text-[9px] font-bold" style={{ width: 38, height: 28, borderRadius: "var(--r-1)", background: "oklch(0.42 0.22 280)", color: "var(--bg)" }}>Stripe</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>USD payouts</div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.75" style={{ color: "var(--fg-3)" }}>Bank of America · •••• 8104 · USD · for online clients</div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[{ label: "Payout schedule", value: "Weekly · Tuesdays" }, { label: "Minimum amount", value: "R 500" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", width: "100%" }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between items-start gap-3.5 pt-3.5 mt-1" style={{ borderTop: "1px solid var(--border)" }}>
                <div><div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Auto-payout when minimum reached</div><div className="text-[12.5px] mt-0.75" style={{ color: "var(--fg-3)", lineHeight: 1.5 }}>If your weekly total is below R 500, it rolls into next week.</div></div>
                <Toggle on={true} />
              </div>
            </div>
          </section>

          {/* Tax info */}
          <section id="tax" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Tax info</h2>
              <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)", maxWidth: "56ch", lineHeight: 1.5 }}>Required for tax compliance and payout. Updates may require re-verification.</div>
            </div>
            <div className="px-5.5 py-5 flex flex-col gap-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[{ label: "Tax type", value: "Sole proprietor · independent contractor" }, { label: "SARS tax #", value: "9180 481 729" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", width: "100%" }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[{ label: "VAT registered", value: "No · under R 1M threshold" }, { label: "Country of residence", value: "South Africa" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", width: "100%" }} />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Business address</label>
                <input defaultValue="14 Sea Point Drive, Cape Town, 8005" className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", width: "100%" }} />
              </div>
            </div>
          </section>

          {/* Integrations */}
          <section id="integrations" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Integrations</h2>
              <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>External services connected to your account.</div>
            </div>
            <div className="px-5.5 py-5 flex flex-col gap-2">
              {[
                { name: "Google Calendar", meta: "2-way sync · last refresh 4m ago", connected: true, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--ink)" strokeWidth="1.5"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/></svg> },
                { name: "Zoom", meta: "For online video sessions · auto-link in bookings", connected: true, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--ink)" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
                { name: "Apple Health · sync with clients", meta: "Read workouts and body weight client-shared", connected: false, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--ink)" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> },
                { name: "Strava", meta: "Pull running data from clients who consent", connected: false, icon: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--ink)" strokeWidth="1.5"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18"/></svg> },
              ].map((int) => (
                <div key={int.name} className="flex items-center gap-3 p-3.5 rounded-(--r-2)" style={{ border: "1px solid var(--border)" }}>
                  <div className="w-8 h-8 rounded-(--r-1) flex items-center justify-center" style={{ background: "var(--bg-2)" }}>{int.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{int.name}</div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>{int.meta}</div>
                  </div>
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.05em] px-2 py-0.75 rounded-full" style={int.connected ? { color: "var(--signal-ink)", background: "var(--signal-soft)", border: "1px solid oklch(0.88 0.05 148)" } : { color: "var(--fg-3)", background: "var(--bg-2)", border: "1px solid var(--border)" }}>{int.connected ? "Connected" : "Not connected"}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Security & 2FA */}
          <section id="security" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Security & 2FA</h2>
              <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>How you sign in and how we know it&apos;s you.</div>
            </div>
            <div className="px-5.5" style={{ paddingTop: "8px", paddingBottom: "8px" }}>
              {[
                { t: "Password", s: "Last changed 14 Jan 2026 · 4 months ago.", action: "button" as const },
                { t: "SMS 2FA · +27 82 ••• 1284", s: "6-digit code on every new sign-in.", on: true },
                { t: "Authenticator app", s: "Stronger than SMS · Google Authenticator, 1Password, Authy.", on: false },
                { t: "Passkey · this device", s: "Face ID is your sign-in. No passwords, no codes.", on: true },
              ].map((row, i) => (
                <div key={row.t} className="flex justify-between items-start gap-3.5 py-3" style={{ borderBottom: i < 3 ? "1px solid var(--border)" : "none" }}>
                  <div><div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{row.t}</div><div className="text-[12.5px] mt-0.75" style={{ color: "var(--fg-3)", lineHeight: 1.5, maxWidth: "56ch" }}>{row.s}</div></div>
                  {"action" in row ? <button className="btn-ghost-v2 sm shrink-0">Change</button> : <Toggle on={row.on} />}
                </div>
              ))}
            </div>
          </section>

          {/* Close account */}
          <section id="close" className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-5.5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2 className="text-[16px] font-medium" style={{ color: "var(--danger)" }}>Close account</h2>
              <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)", maxWidth: "56ch", lineHeight: 1.5 }}>Three reversible actions and one permanent one. Read what each does before clicking.</div>
            </div>
            <div className="px-5.5 py-5 flex flex-col gap-2">
              {/* Pause */}
              <div className="flex items-start gap-3.5 p-4 rounded-(--r-2)" style={{ background: "oklch(0.96 0.06 75)", border: "1px solid oklch(0.88 0.07 75)" }}>
                <div className="flex-1"><div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Pause my account</div><div className="text-[12.5px] mt-1" style={{ color: "var(--fg-2)", lineHeight: 1.5, maxWidth: "56ch" }}>Hides your profile from the marketplace, freezes bookings, holds active client packages. Reactivate any time within 12 months.</div></div>
                <button className="btn-ghost-v2 sm shrink-0">Pause</button>
              </div>
              {/* Export & delete */}
              <div className="flex items-start gap-3.5 p-4 rounded-(--r-2)" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
                <div className="flex-1"><div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Export data then delete</div><div className="text-[12.5px] mt-1" style={{ color: "var(--fg-2)", lineHeight: 1.5, maxWidth: "56ch" }}>We email a ZIP of your data, then schedule deletion 30 days later. Cancel any time during the window.</div></div>
                <button className="btn-ghost-v2 sm shrink-0">Export & delete</button>
              </div>
              {/* Delete forever */}
              <div className="flex items-start gap-3.5 p-4 rounded-(--r-2)" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.88 0.05 25)" }}>
                <div className="flex-1"><div className="text-[14px] font-medium" style={{ color: "var(--danger)" }}>Delete my account now</div><div className="text-[12.5px] mt-1" style={{ color: "var(--fg-2)", lineHeight: 1.5, maxWidth: "56ch" }}>Permanent. We strip your name and contact details within 24 hours. Active client packages must be refunded or transferred to another trainer first.</div></div>
                <button className="shrink-0 h-7 px-2.5 rounded-(--r-2) text-[12.5px] font-medium" style={{ background: "var(--danger)", color: "oklch(0.98 0 0)", border: "none" }}>Delete forever</button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </TrainerDashboardShell>
  );
}
