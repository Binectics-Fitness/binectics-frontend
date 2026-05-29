"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BinecticsLockup, BinecticsMark } from "@/components/BinecticsLogo";

const ROLES = [
  {
    id: "trainer",
    title: "Personal trainer",
    desc: "List your services, manage clients, take bookings, and get paid — all in one place.",
    meta: "Individual · provider",
    href: "/onboarding/trainer",
    color: "var(--trainer)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: "gym",
    title: "Gym / studio",
    desc: "Manage locations, memberships, staff, check-ins, and revenue from a single dashboard.",
    meta: "Business · multi-location",
    href: "/onboarding/gym-owner",
    color: "var(--gym)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
        <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
        <line x1="6" y1="1" x2="6" y2="4" />
        <line x1="10" y1="1" x2="10" y2="4" />
        <line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
  },
  {
    id: "dietitian",
    title: "Dietitian",
    desc: "Build meal plans, consult clients, track adherence, and grow your practice online.",
    meta: "Licensed · provider",
    href: "/onboarding/dietitian",
    color: "var(--dietitian)",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    ),
  },
];

export default function OnboardingRolePicker() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <header className="flex items-center h-14 px-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <Link href="/"><BinecticsLockup /></Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-[620px]">
          <div className="flex justify-center mb-7">
            <BinecticsMark size={28} className="text-(--ink)" />
          </div>
          <div className="eyebrow text-center mb-3">Onboarding · step 1</div>
          <h1
            className="text-center text-[32px] font-medium leading-[1.1] mb-3"
            style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}
          >
            How will you use Binectics?
          </h1>
          <p className="text-center text-[15px] leading-relaxed mb-10 mx-auto max-w-[44ch]" style={{ color: "var(--fg-3)" }}>
            Pick your role. Each one unlocks a different dashboard and onboarding track.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-10">
            {ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelected(role.id)}
                className="flex flex-col gap-2.5 rounded-(--r-3) p-5 text-left cursor-pointer"
                style={{
                  border: selected === role.id ? "1px solid var(--ink)" : "1px solid var(--border)",
                  background: selected === role.id ? "var(--bg-2)" : "var(--bg)",
                  transition: "border-color 120ms, background 120ms",
                }}
              >
                <div
                  className="w-9 h-9 rounded-(--r-2) flex items-center justify-center"
                  style={{
                    background: selected === role.id ? "var(--ink)" : "var(--bg-3)",
                    color: selected === role.id ? "var(--bg)" : "var(--ink)",
                  }}
                >
                  <span className="w-[18px] h-[18px]">{role.icon}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[16px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>{role.title}</span>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: role.color }} />
                </div>
                <span className="text-[13px] leading-[1.5]" style={{ color: "var(--fg-3)" }}>{role.desc}</span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.05em] mt-1" style={{ color: "var(--fg-3)" }}>{role.meta}</span>
              </button>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[13px]" style={{ color: "var(--fg-3)" }}>
              Looking for the member app?{" "}
              <Link href="/marketplace" className="font-medium underline underline-offset-3" style={{ color: "var(--ink)", textDecorationColor: "var(--border-2)" }}>
                Browse marketplace
              </Link>
            </span>
            <button
              disabled={!selected}
              onClick={() => {
                const role = ROLES.find((r) => r.id === selected);
                if (role) router.push(role.href);
              }}
              className="btn-primary-v2"
              style={{ opacity: selected ? 1 : 0.4 }}
            >
              Continue →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
