import Link from "next/link";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";

const SECTIONS = [
  { id: "basics", label: "Basics", complete: true },
  { id: "bio", label: "Bio & headline", complete: true },
  { id: "photos", label: "Photos", complete: true },
  { id: "credentials", label: "Credentials", complete: true },
  { id: "specialties", label: "Specialties", complete: true },
  { id: "payout", label: "Payout", warn: true },
];

const DOCS = [
  { abbr: "RD", name: "Registered Dietitian · HPCSA", meta: "License #DT-114928 · expires Jun 2028", status: "verified" },
  { abbr: "SN", name: "Sports Nutrition · ISAK Level 2", meta: "Certified Mar 2024 · renewal Mar 2027", status: "verified" },
  { abbr: "FA", name: "First Aid · Level 2", meta: "Certified Aug 2024 · expires Aug 2026", status: "expiring" },
];

export default function DietitianProfilePage() {
  return (
    <DietitianDashboardShell
      activeItem="My profile"
      crumb="My profile"
      actions={
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--signal-ink)" }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--signal)" }} />All changes saved
          </span>
          <button className="btn-ghost-v2 sm">Preview listing</button>
          <button className="btn-primary-v2 sm">Publish changes</button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_280px] gap-6 lg:gap-10 items-start">
        {/* Section nav */}
        <nav className="hidden lg:flex sticky top-20 flex-col gap-0.5">
          {SECTIONS.map((s, i) => (
            <a key={s.id} href={`#${s.id}`} className={`flex items-center justify-between px-2.5 py-1.75 rounded-(--r-2) text-[13px] ${i === 0 ? "bg-bg font-medium" : "hover:bg-bg"}`} style={{ color: i === 0 ? "var(--ink)" : "var(--fg-3)", borderLeft: i === 0 ? "2px solid var(--ink)" : "2px solid transparent", paddingLeft: i === 0 ? "8px" : "10px", textDecoration: "none" }}>
              {s.label}
              <span className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0" style={{ background: s.complete ? "var(--signal)" : s.warn ? "var(--warn)" : "var(--bg-3)", color: s.complete ? "var(--bg)" : "transparent" }}>
                {s.complete && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5L20 7"/></svg>}
              </span>
            </a>
          ))}
          <div className="mt-4 p-3 rounded-(--r-3)" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Search rank</div>
            <div className="text-[18px] font-medium mt-1" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>#8 <small className="text-[12px] font-normal" style={{ color: "var(--fg-3)" }}>in Cape Town</small></div>
            <div className="text-[12px] mt-2 leading-relaxed" style={{ color: "var(--fg-3)" }}>Add a consultation intro video to move up 2–4 positions. Profiles with video get 1.8× more bookings.</div>
          </div>
        </nav>

        {/* Form sections */}
        <div className="flex flex-col gap-10">
          <section id="basics">
            <h2 className="text-[20px] font-medium" style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}>Basics</h2>
            <p className="text-[13px] mt-1 mb-5" style={{ color: "var(--fg-3)" }}>Name, title, and location. This is what shows in search results.</p>
            <div className="flex flex-col gap-4 p-5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ label: "Display name", value: "Dr. Nadia Hassan" }, { label: "Credentials suffix", value: "RD, ISAK" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="h-8.5 rounded-(--r-2) px-3 text-[13.5px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ label: "City", value: "Cape Town" }, { label: "Country", value: "South Africa" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="h-8.5 rounded-(--r-2) px-3 text-[13.5px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="bio">
            <h2 className="text-[20px] font-medium" style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}>Bio & headline</h2>
            <p className="text-[13px] mt-1 mb-5" style={{ color: "var(--fg-3)" }}>A short headline for cards and a longer bio for your full listing.</p>
            <div className="flex flex-col gap-4 p-5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Headline</label>
                <input defaultValue="Clinical dietitian specialising in sports nutrition & metabolic health" className="h-8.5 rounded-(--r-2) px-3 text-[13.5px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
                <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-4)" }}>68 / 80 characters</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Bio</label>
                <textarea defaultValue="Registered dietitian with 8 years of clinical experience across South Africa and the UAE. I built the Binectics FCDB to include the foods my clients actually eat — fufu, bobotie, shawarma, and 2,400+ others. My approach is evidence-based, culturally informed, and designed for people who want sustainable results without eliminating entire food groups." className="rounded-(--r-2) px-3 py-2.5 text-[13.5px] leading-relaxed resize-y" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", minHeight: "120px" }} />
                <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-4)" }}>342 / 500 characters</span>
              </div>
            </div>
          </section>

          <section id="photos">
            <h2 className="text-[20px] font-medium" style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}>Photos</h2>
            <p className="text-[13px] mt-1 mb-5" style={{ color: "var(--fg-3)" }}>A professional headshot and up to 4 gallery images. First image is your listing card.</p>
            <div className="p-5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {["Headshot", "Consultation", "Kitchen setup", "+ Add photo"].map((label, i) => (
                  <div key={label} className="aspect-square rounded-(--r-2) flex items-center justify-center text-[12px] cursor-pointer" style={{ background: i < 3 ? "var(--bg-3)" : "transparent", border: i < 3 ? "none" : "1.5px dashed var(--border-2)", color: "var(--fg-3)" }}>
                    {i < 3 ? (
                      <div className="text-center">
                        <svg className="mx-auto mb-1" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--fg-4)" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                        <span className="font-mono text-[10px] uppercase tracking-[0.04em]">{label}</span>
                      </div>
                    ) : (
                      <span className="font-mono text-[11px]">{label}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="credentials">
            <h2 className="text-[20px] font-medium" style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}>Credentials</h2>
            <p className="text-[13px] mt-1 mb-5" style={{ color: "var(--fg-3)" }}>Upload certifications and licenses. Verified credentials earn the green badge.</p>
            <div className="flex flex-col gap-2.5">
              {DOCS.map((doc) => (
                <div key={doc.abbr} className="flex items-center gap-4 p-4 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                  <span className="w-10 h-10 rounded-(--r-2) flex items-center justify-center text-[12px] font-medium shrink-0" style={{ background: "var(--dietitian-soft, oklch(0.94 0.04 300))", color: "var(--dietitian)" }}>{doc.abbr}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{doc.name}</div>
                    <div className="font-mono text-[11px] mt-0.5" style={{ color: "var(--fg-3)" }}>{doc.meta}</div>
                  </div>
                  <span className="font-mono text-[10.5px] px-1.75 py-0.5 rounded-full uppercase tracking-[0.04em] inline-flex items-center gap-1.25 shrink-0" style={{ background: doc.status === "verified" ? "var(--signal-soft)" : "var(--trainer-soft)", color: doc.status === "verified" ? "var(--signal-ink)" : "oklch(0.42 0.13 75)" }}>
                    <span className="w-1.25 h-1.25 rounded-full" style={{ background: "currentColor" }} />
                    {doc.status === "verified" ? "Verified" : "Expiring"}
                  </span>
                </div>
              ))}
              <button className="btn-ghost-v2 sm self-start mt-1">+ Add credential</button>
            </div>
          </section>

          <section id="specialties">
            <h2 className="text-[20px] font-medium" style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}>Specialties</h2>
            <p className="text-[13px] mt-1 mb-5" style={{ color: "var(--fg-3)" }}>Select up to 6 specialties. These appear as tags on your listing.</p>
            <div className="p-5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="flex flex-wrap gap-2">
                {["Sports nutrition", "Weight management", "Metabolic health", "Gut health", "Plant-based diets", "Eating disorders"].map((s, i) => (
                  <span key={s} className="font-mono text-[11px] px-3 py-1.5 rounded-full cursor-pointer" style={{ background: i < 4 ? "var(--ink)" : "transparent", color: i < 4 ? "var(--bg)" : "var(--fg-3)", border: i < 4 ? "none" : "1px solid var(--border)" }}>
                    {i < 4 ? `${s} ×` : s}
                  </span>
                ))}
              </div>
              <div className="font-mono text-[10.5px] mt-3" style={{ color: "var(--fg-4)" }}>4 / 6 selected</div>
            </div>
          </section>

          <section id="payout">
            <h2 className="text-[20px] font-medium" style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}>Payout</h2>
            <p className="text-[13px] mt-1 mb-5" style={{ color: "var(--fg-3)" }}>Bank details for receiving payouts. Processed every 14 days.</p>
            <div className="flex flex-col gap-4 p-5 rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="rounded-(--r-2) px-3.5 py-2.5 flex items-center gap-2.5" style={{ background: "var(--trainer-soft)", border: "1px solid oklch(0.88 0.06 75)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="oklch(0.42 0.13 75)" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>
                <span className="text-[12.5px]" style={{ color: "oklch(0.42 0.13 75)" }}>Bank details incomplete — add your account number to receive payouts.</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ label: "Bank name", value: "First National Bank" }, { label: "Account holder", value: "Nadia Hassan" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} className="h-8.5 rounded-(--r-2) px-3 text-[13.5px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[{ label: "Account number", value: "", placeholder: "Enter account number" }, { label: "Branch code", value: "250655" }].map((f) => (
                  <div key={f.label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                    <input defaultValue={f.value} placeholder={f.placeholder} className="h-8.5 rounded-(--r-2) px-3 text-[13.5px]" style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Preview rail */}
        <aside className="hidden lg:flex sticky top-20 flex-col gap-4">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Listing preview</div>
          <div className="rounded-(--r-3) overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <div className="aspect-[4/3] flex items-center justify-center" style={{ background: "var(--bg-3)" }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--fg-4)" strokeWidth="1"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="var(--signal)" stroke="var(--signal)" strokeWidth="1.5"><path d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
                <span className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--signal-ink)" }}>Verified</span>
              </div>
              <div className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Dr. Nadia Hassan, RD</div>
              <div className="text-[12.5px] mt-1 leading-[1.45]" style={{ color: "var(--fg-2)" }}>Clinical dietitian specialising in sports nutrition & metabolic health</div>
              <div className="flex items-center gap-3 mt-3 font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
                <span>Cape Town</span>
                <span>·</span>
                <span>4.9 ★</span>
                <span>·</span>
                <span>124 clients</span>
              </div>
            </div>
          </div>
          <Link href="/dietitians/dr-nadia-hassan" className="btn-ghost-v2 text-center text-[12.5px]">View public listing →</Link>
        </aside>
      </div>
    </DietitianDashboardShell>
  );
}
