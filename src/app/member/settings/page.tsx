"use client";

import { useState } from "react";
import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { useAuth } from "@/contexts/AuthContext";
import { openCommandBar } from "@/hooks/useCommandBar";
import { NotificationsDrawer } from "@/components/ds/NotificationsDrawer";

const SECTIONS = [
  { id: "profile", label: "Profile", group: "Account", icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg> },
  { id: "preferences", label: "Preferences", group: "Account", icon: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8M4.6 9a1.7 1.7 0 0 0-.3-1.8"/></svg> },
  { id: "notifications", label: "Notifications", group: "Account", icon: <svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M14 21a2 2 0 0 1-4 0"/></svg> },
  { id: "payments", label: "Payment methods", group: "Money", icon: <svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></svg> },
  { id: "billing", label: "Billing history", group: "Money", icon: <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg> },
  { id: "security", label: "Sign-in & 2FA", group: "Security", icon: <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
  { id: "privacy", label: "Privacy", group: "Security", icon: <svg viewBox="0 0 24 24"><path d="M12 22s-8-4-8-12V5l8-3 8 3v5c0 8-8 12-8 12z"/></svg> },
  { id: "linked", label: "Linked accounts", group: "Security", icon: <svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg> },
  { id: "danger", label: "Close account", group: "Danger", danger: true, icon: <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg> },
];

export default function MemberSettingsPage() {
  const { user, logout } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const firstName = user?.first_name || "";
  const lastName = user?.last_name || "";
  const initials = `${(firstName[0] || "").toUpperCase()}${(lastName[0] || "").toUpperCase()}` || "—";

  const icoStyle = { width: 14, height: 14, strokeWidth: 1.5, fill: "none", stroke: "currentColor" };
  let lastGroup = "";

  return (
    <div style={{ background: "var(--bg-2)", minHeight: "100vh" }}>
      {/* ── Top nav ── */}
      <nav style={{ height: 60, background: "var(--bg)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", position: "sticky", top: 0, zIndex: 5 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <Link href="/" style={{ textDecoration: "none" }}><BinecticsLockup /></Link>
          <div style={{ display: "flex", gap: 4 }}>
            <Link href="/marketplace" style={{ padding: "8px 12px", fontSize: "13.5px", color: "var(--fg-2)", borderRadius: "var(--r-2)", textDecoration: "none" }}>Marketplace</Link>
            <Link href="/dashboard/bookings" style={{ padding: "8px 12px", fontSize: "13.5px", color: "var(--fg-2)", borderRadius: "var(--r-2)", textDecoration: "none" }}>My bookings</Link>
            <Link href="/dashboard/messages" style={{ padding: "8px 12px", fontSize: "13.5px", color: "var(--fg-2)", borderRadius: "var(--r-2)", textDecoration: "none" }}>Messages</Link>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button type="button" onClick={openCommandBar} style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: "var(--r-2)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--fg-2)", cursor: "pointer" }}>
            <svg viewBox="0 0 24 24" {...icoStyle}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          </button>
          <button type="button" onClick={() => setNotifOpen(true)} style={{ width: 32, height: 32, border: "1px solid var(--border)", borderRadius: "var(--r-2)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--fg-2)", cursor: "pointer" }}>
            <svg viewBox="0 0 24 24" {...icoStyle}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M14 21a2 2 0 0 1-4 0"/></svg>
          </button>
          <span style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--bg-3)", color: "var(--fg-2)", fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{initials}</span>
        </div>
      </nav>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "40px 40px 96px" }}>
        {/* Head */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 24, borderBottom: "1px solid var(--border)", marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 30, letterSpacing: "-0.025em", fontWeight: 500, lineHeight: 1, color: "var(--ink)" }}>Settings</h1>
            <div style={{ fontSize: 14, color: "var(--fg-3)", marginTop: 8 }}>Manage your account, payments, notifications, and privacy. Most changes save automatically.</div>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", color: "var(--signal-ink)", textTransform: "uppercase", letterSpacing: "0.05em", display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: "var(--r-full)", background: "var(--signal-soft)", border: "1px solid oklch(0.88 0.05 148)" }}>
            <span style={{ width: 5, height: 5, background: "var(--signal)", borderRadius: "50%" }} />All changes saved
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 40, alignItems: "start" }}>
          {/* Section nav */}
          <aside style={{ position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 2 }}>
            {SECTIONS.map((s) => {
              let groupLabel = null;
              if (s.group !== lastGroup) {
                lastGroup = s.group;
                groupLabel = <div key={`g-${s.group}`} style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-3)", padding: "4px 10px 8px", marginTop: s.group === "Account" ? 0 : 14 }}>{s.group}</div>;
              }
              return (
                <div key={s.id}>
                  {groupLabel}
                  <a
                    href={`#${s.id}`}
                    onClick={() => setActiveSection(s.id)}
                    style={{
                      padding: "7px 10px",
                      fontSize: 13,
                      color: s.danger ? "var(--danger)" : activeSection === s.id ? "var(--ink)" : "var(--fg-3)",
                      borderRadius: "var(--r-2)",
                      textDecoration: "none",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: activeSection === s.id ? "var(--bg)" : "transparent",
                      fontWeight: activeSection === s.id ? 500 : 400,
                      borderLeft: activeSection === s.id ? "2px solid var(--ink)" : "2px solid transparent",
                    }}
                  >
                    <span style={{ width: 14, height: 14, display: "flex", opacity: activeSection === s.id ? 1 : 0.7 }}>{s.icon}</span>
                    {s.label}
                  </a>
                </div>
              );
            })}
            <button
              onClick={() => logout()}
              style={{
                padding: "7px 10px", fontSize: 13, color: "var(--ink)", fontWeight: 500,
                display: "flex", alignItems: "center", gap: 8, marginTop: 14,
                background: "transparent", border: "none", cursor: "pointer", textAlign: "left", borderRadius: "var(--r-2)",
              }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
              Sign out
            </button>
          </aside>

          {/* Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Profile */}
            <section id="profile" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-3)", overflow: "hidden" }}>
              <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: 16, letterSpacing: "-0.01em", fontWeight: 500, color: "var(--ink)" }}>Profile</h2>
                <p style={{ fontSize: "12.5px", color: "var(--fg-3)", marginTop: 4, lineHeight: 1.5 }}>Shown to providers you book with. Your photo and name appear next to your messages.</p>
              </div>
              <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
                  <span style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--bg-3)", color: "var(--fg-2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 500, letterSpacing: "-0.015em", flexShrink: 0 }}>{initials}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.01em" }}>{firstName} {lastName}</div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: "11.5px", color: "var(--fg-3)", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 4 }}>
                      Member since 2025 · {user?.email}
                    </div>
                  </div>
                  <button type="button" className="btn-ghost-v2 sm">Upload photo</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-3)" }}>First name</label>
                    <input defaultValue={firstName} style={{ background: "var(--bg)", border: "1px solid var(--border-2)", borderRadius: "var(--r-2)", padding: "11px 14px", fontSize: 14, color: "var(--ink)", fontFamily: "inherit", width: "100%" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <label style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-3)" }}>Last name</label>
                    <input defaultValue={lastName} style={{ background: "var(--bg)", border: "1px solid var(--border-2)", borderRadius: "var(--r-2)", padding: "11px 14px", fontSize: 14, color: "var(--ink)", fontFamily: "inherit", width: "100%" }} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-3)" }}>Email <span style={{ textTransform: "none", color: "var(--signal-ink)", fontFamily: "var(--font-sans)", letterSpacing: "-0.005em", marginLeft: 4 }}>verified</span></label>
                  <input defaultValue={user?.email || ""} style={{ background: "var(--bg)", border: "1px solid var(--border-2)", borderRadius: "var(--r-2)", padding: "11px 14px", fontSize: 14, color: "var(--ink)", fontFamily: "inherit", width: "100%" }} />
                  <span style={{ fontSize: 12, color: "var(--fg-3)", lineHeight: 1.5 }}>Used for receipts and security alerts. Change requires re-verification.</span>
                </div>
              </div>
            </section>

            {/* Security */}
            <section id="security" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-3)", overflow: "hidden" }}>
              <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: 16, letterSpacing: "-0.01em", fontWeight: 500, color: "var(--ink)" }}>Sign-in & 2FA</h2>
                <p style={{ fontSize: "12.5px", color: "var(--fg-3)", marginTop: 4, lineHeight: 1.5 }}>Manage your password and two-factor authentication.</p>
              </div>
              <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                  <div>
                    <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>Password</div>
                    <div style={{ fontSize: "12.5px", color: "var(--fg-3)", marginTop: 3 }}>Last changed 3 months ago</div>
                  </div>
                  <button type="button" className="btn-ghost-v2 sm">Change password</button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0" }}>
                  <div>
                    <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>Two-factor authentication</div>
                    <div style={{ fontSize: "12.5px", color: "var(--fg-3)", marginTop: 3 }}>Not enabled. We recommend enabling 2FA for extra security.</div>
                  </div>
                  <button type="button" className="btn-ghost-v2 sm">Enable</button>
                </div>
              </div>
            </section>

            {/* Danger zone */}
            <section id="danger" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-3)", overflow: "hidden" }}>
              <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: 16, letterSpacing: "-0.01em", fontWeight: 500, color: "var(--ink)" }}>Danger zone</h2>
              </div>
              <div style={{ padding: "20px 22px" }}>
                <div style={{ padding: "16px 18px", border: "1px solid oklch(0.88 0.05 25)", borderRadius: "var(--r-2)", background: "var(--danger-soft)", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>Delete your account</div>
                    <div style={{ fontSize: "12.5px", color: "var(--fg-2)", marginTop: 4, lineHeight: 1.5, maxWidth: "56ch" }}>
                      This permanently removes your account, bookings, health data, and messages. This action cannot be undone.
                    </div>
                  </div>
                  <button type="button" className="btn-ghost-v2 sm" style={{ color: "var(--danger)", borderColor: "oklch(0.88 0.05 25)" }}>Delete account</button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
