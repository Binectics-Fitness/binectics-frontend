"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const STORAGE_KEY = "binectics-cookies";
const VERSION = "2.2";
const RECONSENT_DAYS = 395;
const EU_LANGS =
  /^(en-(GB|IE)|fr|de|es|it|nl|sv|fi|da|el|pt|pl|cs|hu|ro|sk|sl|bg|hr|et|lt|lv|mt|ga)$/i;

type CategoryId = "required" | "functional" | "analytics" | "marketing";

interface CookieData {
  required: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  version: string;
  ts: number;
  gdpr: boolean;
}

interface Category {
  id: CategoryId;
  name: string;
  meta: string;
  desc: string;
  locked?: boolean;
  defaultOn?: boolean;
}

function detectGDPR(): boolean {
  if (typeof navigator === "undefined") return false;
  if (EU_LANGS.test(navigator.language)) return true;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    return /Europe\//.test(tz);
  } catch {
    return false;
  }
}

function loadConsent(): CookieData | null {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function saveConsent(
  prefs: Pick<CookieData, CategoryId>,
  isGDPR: boolean,
) {
  const data: CookieData = { ...prefs, version: VERSION, ts: Date.now(), gdpr: isGDPR };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  document.dispatchEvent(new CustomEvent("cookies:change", { detail: data }));
}

function isStale(data: CookieData): boolean {
  if (!data?.ts) return true;
  return Date.now() - data.ts > RECONSENT_DAYS * 86400000;
}

function getCategories(gdpr: boolean): Category[] {
  return [
    {
      id: "required",
      name: "Required",
      meta: "Always on · 4 cookies · session + 13 mo",
      desc: "Authentication, session integrity, fraud prevention, and the legal consent record itself. Without these, sign-in and check-out cannot work.",
      locked: true,
    },
    {
      id: "functional",
      name: "Functional",
      meta: "3 cookies · 13 mo",
      desc: "Remembers preferences like dark mode, last-used location, and saved providers. Off = the product still works but forgets your settings.",
    },
    {
      id: "analytics",
      name: "Analytics",
      meta: "2 cookies · 13 mo · PostHog",
      desc: "Anonymised page views and feature usage. We use this to spot what is broken or unused. Never sold, never tied to your name.",
      defaultOn: !gdpr,
    },
    {
      id: "marketing",
      name: "Marketing",
      meta: "4 cookies · 13 mo · Meta + Google",
      desc: "Allows us to measure ad effectiveness and show you Binectics on other sites. Off = ads you see elsewhere are random instead of relevant.",
      defaultOn: false,
    },
  ];
}

function CookieIcon({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      style={{ flexShrink: 0 }}
    >
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5z" />
      <circle cx="8.5" cy="8.5" r="1" />
      <circle cx="15.5" cy="15.5" r="1" />
      <circle cx="9" cy="14" r="1" />
    </svg>
  );
}

function Toggle({
  on,
  locked,
  onToggle,
}: {
  on: boolean;
  locked?: boolean;
  onToggle?: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={locked}
      onClick={locked ? undefined : onToggle}
      style={{
        position: "relative",
        width: 36,
        minHeight: 44,
        border: "none",
        padding: 0,
        flexShrink: 0,
        cursor: locked ? "not-allowed" : "pointer",
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
          background: locked ? "var(--ink)" : on ? "var(--signal)" : "var(--border-2)",
          opacity: locked ? 0.7 : 1,
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
          left: on || locked ? 17 : 3,
          transition: "left 150ms",
          boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
        }}
      />
    </button>
  );
}

export default function CookieConsent() {
  const [isGDPR, setIsGDPR] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerIn, setBannerIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showFab, setShowFab] = useState(false);
  const [toggles, setToggles] = useState<Record<CategoryId, boolean>>({
    required: true,
    functional: false,
    analytics: false,
    marketing: false,
  });

  const categories = getCategories(isGDPR);

  useEffect(() => {
    const gdpr = detectGDPR();
    setIsGDPR(gdpr);

    const existing = loadConsent();
    if (!existing || existing.version !== VERSION || isStale(existing)) {
      setTimeout(() => {
        setShowBanner(true);
        setShowFab(true);
        requestAnimationFrame(() => requestAnimationFrame(() => setBannerIn(true)));
      }, 400);
    } else {
      setShowFab(true);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).CookieConsent = {
      open: () => openModal(gdpr),
      get: loadConsent,
      reset: () => {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
      },
      isGDPR: () => gdpr,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hideBanner = useCallback(() => {
    setBannerIn(false);
    setTimeout(() => setShowBanner(false), 320);
  }, []);

  const doAcceptAll = useCallback(
    (gdpr: boolean) => {
      const prefs: Pick<CookieData, CategoryId> = {
        required: true,
        functional: true,
        analytics: true,
        marketing: true,
      };
      saveConsent(prefs, gdpr);
      hideBanner();
      setShowFab(true);
    },
    [hideBanner],
  );

  const doRejectAll = useCallback(
    (gdpr: boolean) => {
      const prefs: Pick<CookieData, CategoryId> = {
        required: true,
        functional: false,
        analytics: false,
        marketing: false,
      };
      saveConsent(prefs, gdpr);
      hideBanner();
      setShowFab(true);
    },
    [hideBanner],
  );

  const openModal = useCallback(
    (gdpr?: boolean) => {
      const g = gdpr ?? isGDPR;
      const existing = loadConsent();
      const cats = getCategories(g);
      const t: Record<CategoryId, boolean> = {
        required: true,
        functional: false,
        analytics: false,
        marketing: false,
      };
      cats.forEach((c) => {
        t[c.id] = c.locked ? true : (existing?.[c.id] ?? c.defaultOn ?? false);
      });
      setToggles(t);
      hideBanner();
      setShowModal(true);
    },
    [isGDPR, hideBanner],
  );

  const closeModal = useCallback(() => setShowModal(false), []);

  const saveModalPrefs = useCallback(() => {
    saveConsent(toggles, isGDPR);
    setShowModal(false);
    setShowFab(true);
  }, [toggles, isGDPR]);

  useEffect(() => {
    if (!showModal) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowModal(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showModal]);

  return (
    <>
      <style>{`
        @media (max-width: 720px) {
          .cc-banner-grid { grid-template-columns: 1fr !important; }
          .cc-actions { justify-content: stretch; }
          .cc-actions button { flex: 1 1 auto; min-width: 100px; }
        }
        @media (max-width: 480px) {
          .cc-modal-foot { flex-direction: column !important; }
          .cc-modal-foot button { width: 100%; }
          .cc-modal-head { padding-left: 16px !important; padding-right: 16px !important; }
          .cc-modal-body { padding-left: 16px !important; padding-right: 16px !important; }
          .cc-modal-foot { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>

      {/* Banner */}
      {showBanner && (
        <div
          role="region"
          aria-label="Cookie consent"
          className="cc-banner-grid"
          style={{
            position: "fixed",
            left: 16,
            right: 16,
            bottom: 16,
            zIndex: 8000,
            background: "var(--ink)",
            color: "var(--bg)",
            borderRadius: 14,
            padding: "18px 20px",
            boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 16,
            alignItems: "center",
            maxWidth: 880,
            margin: "0 auto",
            transform: bannerIn ? "translateY(0)" : "translateY(140%)",
            transition: "transform 0.32s cubic-bezier(.2,.7,.2,1)",
            fontFamily: "var(--font-sans)",
          }}
        >
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <CookieIcon size={28} />
            <div style={{ fontSize: "13.5px", lineHeight: 1.55 }}>
              <strong style={{ fontWeight: 500 }}>We use cookies.</strong>{" "}
              {isGDPR
                ? "Required only by default — opt in to others to help us improve."
                : "Essential cookies keep you logged in. Optional ones help us improve and remember preferences."}{" "}
              <Link
                href="/cookies"
                style={{
                  color: "var(--bg)",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                }}
              >
                Read policy
              </Link>
            </div>
          </div>
          <div className="cc-actions" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => openModal()}
              style={{
                font: "inherit",
                fontSize: 13,
                padding: "9px 15px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.18)",
                background: "transparent",
                color: "var(--bg)",
                cursor: "pointer",
              }}
            >
              Customize
            </button>
            <button
              onClick={() => doRejectAll(isGDPR)}
              style={{
                font: "inherit",
                fontSize: 13,
                padding: "9px 15px",
                borderRadius: 8,
                border: 0,
                background: "rgba(255,255,255,0.1)",
                color: "var(--bg)",
                cursor: "pointer",
              }}
            >
              {isGDPR ? "Reject all" : "Required only"}
            </button>
            <button
              onClick={() => doAcceptAll(isGDPR)}
              style={{
                font: "inherit",
                fontSize: 13,
                padding: "9px 15px",
                borderRadius: 8,
                border: 0,
                background: "var(--bg)",
                color: "var(--ink)",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Accept all
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 9000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cc-title"
            style={{
              background: "var(--bg)",
              color: "var(--ink)",
              width: 520,
              maxWidth: "100%",
              borderRadius: 14,
              overflow: "hidden",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              fontFamily: "var(--font-sans)",
            }}
          >
            {/* Head */}
            <div
              className="cc-modal-head"
              style={{
                padding: "22px 24px 12px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div>
                <h3
                  id="cc-title"
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 500,
                    letterSpacing: "-0.015em",
                  }}
                >
                  Cookie preferences
                </h3>
                <p
                  style={{
                    margin: "6px 0 0",
                    fontSize: 13,
                    color: "var(--fg-2)",
                    lineHeight: 1.55,
                  }}
                >
                  {isGDPR
                    ? "GDPR mode — explicit opt-in required for non-essential."
                    : "Customize what runs in your browser. Saved for 13 months."}
                </p>
              </div>
              <button
                aria-label="Close"
                onClick={closeModal}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  background: "var(--bg-2)",
                  border: 0,
                  cursor: "pointer",
                  flexShrink: 0,
                  fontSize: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--fg-2)",
                }}
              >
                &times;
              </button>
            </div>

            {/* Body */}
            <div className="cc-modal-body" style={{ padding: "8px 24px 16px", overflowY: "auto", flex: 1 }}>
              {categories.map((cat, i) => (
                <div
                  key={cat.id}
                  style={{
                    padding: "14px 0",
                    borderBottom:
                      i < categories.length - 1 ? "1px solid var(--border)" : "none",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{cat.name}</div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--fg-3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        marginTop: 3,
                      }}
                    >
                      {cat.meta}
                    </div>
                    <div
                      style={{
                        fontSize: "12.5px",
                        color: "var(--fg-2)",
                        marginTop: 6,
                        lineHeight: 1.45,
                        maxWidth: "52ch",
                      }}
                    >
                      {cat.desc}
                    </div>
                  </div>
                  <Toggle
                    on={toggles[cat.id]}
                    locked={cat.locked}
                    onToggle={() =>
                      setToggles((prev) => ({ ...prev, [cat.id]: !prev[cat.id] }))
                    }
                  />
                </div>
              ))}
            </div>

            {/* Foot */}
            <div
              className="cc-modal-foot"
              style={{
                padding: "14px 24px 18px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => {
                  doRejectAll(isGDPR);
                  closeModal();
                }}
                style={{
                  font: "inherit",
                  fontSize: 13,
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: 0,
                  background: "var(--bg-2)",
                  color: "var(--ink)",
                  cursor: "pointer",
                }}
              >
                Reject all
              </button>
              <button
                onClick={saveModalPrefs}
                style={{
                  font: "inherit",
                  fontSize: 13,
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: 0,
                  background: "var(--bg-2)",
                  color: "var(--ink)",
                  cursor: "pointer",
                }}
              >
                Save preferences
              </button>
              <button
                onClick={() => {
                  doAcceptAll(isGDPR);
                  closeModal();
                }}
                style={{
                  font: "inherit",
                  fontSize: 13,
                  padding: "9px 16px",
                  borderRadius: 8,
                  border: 0,
                  background: "var(--ink)",
                  color: "var(--bg)",
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB */}
      {showFab && !showBanner && !showModal && (
        <button
          aria-label="Manage cookies"
          title="Manage cookies"
          onClick={() => openModal()}
          style={{
            position: "fixed",
            bottom: 14,
            left: 14,
            zIndex: 7000,
            width: 36,
            height: 36,
            borderRadius: "var(--r-full)",
            background: "var(--bg)",
            border: "1px solid var(--border-2)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <CookieIcon size={18} />
        </button>
      )}
    </>
  );
}
