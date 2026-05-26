import Link from "next/link";
import type { Metadata } from "next";
import { BinecticsLockup } from "@/components/BinecticsLogo";

export const metadata: Metadata = {
  title: "Register",
  description: "Create your Binectics account. Join as a fitness enthusiast, gym owner, personal trainer, or dietitian.",
};

const ROLES = [
  {
    id: "user",
    label: "Member",
    sub: "consumer",
    desc: "Find gyms, trainers, and dietitians. Track your progress.",
    href: "/register/user",
    dot: "var(--ink)",
    features: ["Browse the marketplace", "QR check-in at gyms", "Track weight, meals, activity", "Read trainer journals"],
  },
  {
    id: "gym-owner",
    label: "Gym / studio",
    sub: "business",
    desc: "List your gym, manage members, and grow revenue.",
    href: "/register/gym-owner",
    dot: "var(--gym)",
    features: ["QR check-in system", "Membership plans & billing", "Staff management", "Revenue analytics"],
  },
  {
    id: "trainer",
    label: "Trainer",
    sub: "licensed",
    desc: "Build your brand, sell programs, manage clients.",
    href: "/register/trainer",
    dot: "oklch(0.58 0.14 75)",
    features: ["Verified trainer badge", "Sell training plans", "Client progress journals", "Get discovered globally"],
  },
  {
    id: "dietitian",
    label: "Dietitian",
    sub: "licensed",
    desc: "Create meal plans, track adherence, grow your practice.",
    href: "/register/dietitian",
    dot: "var(--dietitian)",
    features: ["Verified credentials", "Custom meal plans", "Client adherence tracking", "Build your practice"],
  },
];

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <header className="flex items-center h-14 px-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <Link href="/"><BinecticsLockup /></Link>
      </header>

      <main className="flex-1 py-12 sm:py-16">
        <div className="mx-auto max-w-360 px-5 sm:px-10">
          <div className="max-w-xl mx-auto text-center mb-10 sm:mb-14">
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2" style={{ color: "var(--fg-3)" }}>Create account</div>
            <h1 className="text-[28px] sm:text-[36px] font-medium leading-tight" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>
              How will you use Binectics?
            </h1>
            <p className="text-[15px] mt-3" style={{ color: "var(--fg-3)" }}>
              Pick the role that fits. You can always change later.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-5xl mx-auto">
            {ROLES.map((role) => (
              <Link
                key={role.id}
                href={role.href}
                className="group flex flex-col border rounded-(--r-3) p-5 bg-bg hover:border-ink"
                style={{ borderColor: "var(--border)", transition: "border-color 120ms" }}
              >
                <div className="flex items-center gap-2.5 mb-3">
                  <span className="w-2 h-2 rounded-full" style={{ background: role.dot }} />
                  <span className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>{role.label}</span>
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-4)" }}>{role.sub}</span>
                </div>
                <p className="text-[13.5px] leading-relaxed mb-4" style={{ color: "var(--fg-3)" }}>{role.desc}</p>
                <ul className="flex flex-col gap-1.5 mb-5 flex-1">
                  {role.features.map((f) => (
                    <li key={f} className="text-[12.5px] pl-4 relative" style={{ color: "var(--fg-2)" }}>
                      <span className="absolute left-0 top-[5px] w-2 h-1.5 border-l-[1.5px] border-b-[1.5px] -rotate-45" style={{ borderColor: "var(--signal-ink)" }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <span className="btn-primary-v2 w-full text-center" style={{ height: "34px" }}>
                  Get started
                </span>
              </Link>
            ))}
          </div>

          <p className="text-[12.5px] text-center mt-8" style={{ color: "var(--fg-3)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-medium" style={{ color: "var(--ink)" }}>Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
