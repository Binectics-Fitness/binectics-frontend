import { GymDashboardShell } from "@/components/ds/GymDashboardShell";

const SECTIONS = [
  { group: "Business", items: [{ id: "org", label: "Organization" }, { id: "currency", label: "Currency & locale" }, { id: "tax", label: "Tax & VAT" }] },
  { group: "Operations", items: [{ id: "booking", label: "Booking rules" }, { id: "kiosk", label: "Kiosk & QR" }, { id: "notifications", label: "Notifications" }] },
  { group: "Money", items: [{ id: "gateways", label: "Payment gateways" }, { id: "payouts", label: "Payout schedule" }] },
  { group: "Team", items: [{ id: "roles", label: "Roles & scopes" }, { id: "api", label: "API access" }] },
];

const BOOKING_TOGGLES = [
  { t: "Auto‑confirm bookings", s: "Confirmed instantly when the member taps Book. No manual approval needed.", on: true },
  { t: "Require PAR‑Q from new members", s: "Standard health history form. Sent automatically before first session.", on: true },
  { t: "Charge cancellation fee within 24h", s: "50% of session price. Reasonable exceptions waived by support team.", on: true },
  { t: "Allow video recording of sessions", s: "Members can ask coaches to film working sets for technique review.", on: true },
  { t: "Public reviews on listing", s: "Strongly recommended · drives 3.4× more bookings vs hidden.", on: true },
];

const KIOSK_TOGGLES = [
  { t: "Allow QR check‑in from members’ phones", s: "If off, only the kiosk’s camera can scan member codes.", on: true },
  { t: "Show success animation on check‑in", s: "The 2‑second celebration the system is known for. Off only if you must.", on: true },
  { t: "Auto‑sleep after 60 seconds idle", s: "Saves screen burn‑in on always‑on iPads.", on: true },
  { t: "Voice announcement on successful check‑in", s: "“Welcome, Linda.” Useful at busy 6am rushes, can be intrusive at 8pm.", on: false },
];

function Toggle({ on = true }: { on?: boolean }) {
  return (
    <span className="w-[30px] h-[18px] rounded-full relative cursor-pointer shrink-0 mt-0.5" style={{ background: on ? "var(--ink)" : "var(--border-2)" }}>
      <span className="absolute w-3.5 h-3.5 rounded-full top-0.5" style={{ background: "var(--bg)", left: on ? "14px" : "2px", transition: "left var(--motion-fast) var(--ease)" }} />
    </span>
  );
}

function ToggleSection({ title, desc, toggles }: { title: string; desc: string; toggles: { t: string; s: string; on: boolean }[] }) {
  return (
    <section>
      <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>{title}</h2>
      <p className="text-[12.5px] mt-1 mb-4 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>{desc}</p>
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        {toggles.map((t, i) => (
          <div key={t.t} className="flex items-start gap-3.5 px-5.5 py-3" style={{ borderBottom: i < toggles.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div className="flex-1">
              <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{t.t}</div>
              <div className="text-[12.5px] mt-0.75 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>{t.s}</div>
            </div>
            <Toggle on={t.on} />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function GymSettingsPage() {
  return (
    <GymDashboardShell
      activeItem="Settings"
      crumb="Settings"
      actions={
        <span className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.05em] px-2.5 py-1 rounded-full" style={{ color: "var(--signal-ink)", background: "var(--signal-soft)", border: "1px solid oklch(0.88 0.05 148)" }}>
          <span className="w-1.25 h-1.25 rounded-full" style={{ background: "var(--signal)" }} />
          All changes saved
        </span>
      }
    >
      <div className="pb-1">
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Settings</h1>
        <div className="text-[13.5px] mt-1.5 max-w-[60ch]" style={{ color: "var(--fg-3)" }}>Business identity, currencies, integrations, booking rules, and the org-level settings that apply across every location.</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 lg:gap-10 items-start">
        {/* Section nav */}
        <nav className="sticky top-22 flex flex-col sm:flex-row lg:flex-col gap-0.5 overflow-x-auto">
          {SECTIONS.map((s, si) => (
            <div key={s.group}>
              <div className={`font-mono text-[10.5px] uppercase tracking-[0.06em] px-2.5 py-1 ${si > 0 ? "mt-3.5" : ""}`} style={{ color: "var(--fg-3)" }}>{s.group}</div>
              {s.items.map((item, i) => {
                const active = si === 0 && i === 0;
                return (
                  <a key={item.id} href={`#${item.id}`} className={`block px-2.5 py-[7px] rounded-(--r-2) text-[13px] ${active ? "bg-bg font-medium" : "hover:bg-bg"}`} style={{ color: active ? "var(--ink)" : "var(--fg-3)", borderLeft: active ? "2px solid var(--ink)" : "2px solid transparent", paddingLeft: active ? "8px" : "10px", textDecoration: "none" }}>
                    {item.label}
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sections */}
        <div className="flex flex-col gap-10">
          {/* Organization */}
          <section id="org">
            <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Organization</h2>
            <p className="text-[12.5px] mt-1 mb-4 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>Legal entity, trading name, primary contact. Used on receipts and tax documents.</p>
            <div className="flex flex-col gap-4 p-5.5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {[{ label: "Legal name", value: "Iron Lab (Pty) Ltd" }, { label: "Trading name", value: "Iron Lab" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {[{ label: "Registration #", value: "2017/142849/07" }, { label: "VAT registration #", value: "4480281472" }, { label: "Country", value: "South Africa · ZA" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Primary email</label>
                <input defaultValue="lerato@ironlab.co.za" className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
              </div>
            </div>
          </section>

          {/* Currency & locale */}
          <section id="currency">
            <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Currency & locale</h2>
            <p className="text-[12.5px] mt-1 mb-4 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>How money and dates render across your dashboard and to your members.</p>
            <div className="flex flex-col gap-4 p-5.5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {[{ label: "Default currency", value: "ZAR · R" }, { label: "Time zone", value: "Africa / Johannesburg · UTC+2" }, { label: "First day of week", value: "Monday" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {[{ label: "Date format", value: "DD MMM YYYY · 18 May 2026" }, { label: "Time format", value: "24-hour · 14:30" }, { label: "Number format", value: "1,234.56" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="rounded-(--r-2) px-3.5 py-2.75 text-[14px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Booking rules */}
          <ToggleSection
            title="Booking rules"
            desc="Defaults that apply to all 4 locations · individual locations can override."
            toggles={BOOKING_TOGGLES}
          />

          {/* Kiosk & QR */}
          <ToggleSection
            title="Kiosk & QR"
            desc="Hardware and behaviour for the iPads at your front desks."
            toggles={KIOSK_TOGGLES}
          />

          {/* Payment gateways */}
          <section id="gateways">
            <h2 className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>Payment gateways</h2>
            <p className="text-[12.5px] mt-1 mb-4 max-w-[56ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>Where your money settles. Multiple gateways for multi-currency members.</p>
            <div className="flex flex-col gap-3 p-5.5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              {[
                { logo: "Paystack", color: "oklch(0.45 0.18 200)", name: "Paystack · primary", meta: "ZAR · NGN · KES · settles to ABSA •••• 2241" },
                { logo: "Stripe", color: "oklch(0.42 0.22 280)", name: "Stripe · secondary", meta: "USD · EUR · GBP · settles to USB •••• 8104" },
              ].map((g) => (
                <div key={g.logo} className="flex items-center gap-3 p-3.5 rounded-(--r-2)" style={{ border: "1px solid var(--border)" }}>
                  <span className="w-10 h-6.5 rounded-(--r-1) flex items-center justify-center text-[9px] font-bold" style={{ background: g.color, color: "var(--bg)", fontFamily: "var(--font-mono)" }}>{g.logo}</span>
                  <div className="flex-1">
                    <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{g.name}</div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.5" style={{ color: "var(--fg-3)" }}>{g.meta}</div>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-0.5 rounded-full" style={{ color: "var(--signal-ink)", background: "var(--signal-soft)" }}>Active</span>
                </div>
              ))}
              <button className="btn-ghost-v2 sm self-start">+ Add gateway</button>
            </div>
          </section>
        </div>
      </div>
    </GymDashboardShell>
  );
}
