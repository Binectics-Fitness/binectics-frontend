"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "binectics-cookies";

interface CookiePreferences {
  required: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface CookieData extends CookiePreferences {
  version: string;
  ts: number;
  gdpr: boolean;
}

const CATEGORIES = [
  {
    id: "required" as const,
    name: "Required",
    meta: "Always on · 4 cookies · session + 13 mo",
    desc: "Authentication, session integrity, fraud prevention, and the legal consent record itself. Without these, sign-in and check-out cannot work.",
    locked: true,
  },
  {
    id: "functional" as const,
    name: "Functional",
    meta: "3 cookies · 13 mo",
    desc: "Remembers preferences like dark mode, last-used location, and saved providers. Off = the product still works but forgets your settings.",
  },
  {
    id: "analytics" as const,
    name: "Analytics",
    meta: "2 cookies · 13 mo · PostHog",
    desc: "Anonymised page views and feature usage. We use this to spot what is broken or unused. Never sold, never tied to your name.",
  },
  {
    id: "marketing" as const,
    name: "Marketing",
    meta: "4 cookies · 13 mo · Meta + Google",
    desc: "Allows us to measure ad effectiveness and show you Binectics on other sites. Off = ads you see elsewhere are random instead of relevant.",
  },
];

export default function CookieSettings() {
  const [prefs, setPrefs] = useState<CookiePreferences>({
    required: true,
    functional: false,
    analytics: false,
    marketing: false,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data: CookieData = JSON.parse(raw);
      setPrefs({
        required: data.required,
        functional: data.functional,
        analytics: data.analytics,
        marketing: data.marketing,
      });
    } catch {
      /* ignore */
    }
  }, []);

  const persist = useCallback((p: CookiePreferences) => {
    const data: CookieData = { ...p, version: "2.2", ts: Date.now(), gdpr: false };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    document.dispatchEvent(new CustomEvent("cookies:change", { detail: data }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }, []);

  const toggle = (key: keyof CookiePreferences) => {
    if (key === "required") return;
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  return (
    <div style={{ width: "100%" }}>
      {saved && (
        <div
          className="mb-6 flex items-center gap-2 rounded-(--r-2) px-4 py-3"
          style={{ background: "var(--signal-soft)", border: "1px solid var(--signal)" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--signal)" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[13px] font-medium" style={{ color: "var(--signal-ink)" }}>
            Cookie preferences saved
          </span>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-6">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            className="rounded-(--r-2) p-5"
            style={{ border: "1px solid var(--border)" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                  {cat.name}
                </div>
                <div
                  className="font-mono text-[11px] uppercase tracking-[0.04em] mt-1"
                  style={{ color: "var(--fg-3)" }}
                >
                  {cat.meta}
                </div>
                <div className="text-[12.5px] leading-[1.45] mt-1.5 max-w-[52ch]" style={{ color: "var(--fg-2)" }}>
                  {cat.desc}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[cat.id]}
                disabled={cat.locked}
                onClick={() => toggle(cat.id)}
                className="relative flex-shrink-0"
                style={{
                  width: 36,
                  minHeight: 44,
                  cursor: cat.locked ? "not-allowed" : "pointer",
                  border: "none",
                  padding: 0,
                  background: "transparent",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: 0,
                    width: 36,
                    height: 22,
                    marginTop: -11,
                    borderRadius: "var(--r-full)",
                    background: cat.locked
                      ? "var(--ink)"
                      : prefs[cat.id]
                        ? "var(--signal)"
                        : "var(--border-2)",
                    opacity: cat.locked ? 0.7 : 1,
                    transition: "background 150ms",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "var(--bg)",
                    top: "50%",
                    marginTop: -8,
                    left: prefs[cat.id] || cat.locked ? 17 : 3,
                    transition: "left 150ms",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
                  }}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          onClick={() => {
            const p: CookiePreferences = { required: true, functional: false, analytics: false, marketing: false };
            setPrefs(p);
            persist(p);
          }}
          className="rounded-(--r-2) px-5 py-2.5 text-[13px] font-medium cursor-pointer"
          style={{ background: "var(--bg-2)", color: "var(--ink)", border: "none" }}
        >
          Reject all
        </button>
        <button
          onClick={() => persist(prefs)}
          className="rounded-(--r-2) px-5 py-2.5 text-[13px] font-medium cursor-pointer"
          style={{ background: "var(--bg-2)", color: "var(--ink)", border: "none" }}
        >
          Save preferences
        </button>
        <button
          onClick={() => {
            const p: CookiePreferences = { required: true, functional: true, analytics: true, marketing: true };
            setPrefs(p);
            persist(p);
          }}
          className="rounded-(--r-2) px-5 py-2.5 text-[13px] font-medium cursor-pointer"
          style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}
        >
          Accept all
        </button>
      </div>
    </div>
  );
}
