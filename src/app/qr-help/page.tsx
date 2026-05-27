import Link from "next/link";
import type { Metadata } from "next";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";
import { MarketingFooter } from "@/components/ds/MarketingFooter";

/**
 * QR Help — step-by-step check-in guide + FAQ.
 * Hero 56px h1, numbered steps, FAQ, CTA.
 */

export const metadata: Metadata = {
  title: "QR Check-in Guide | Binectics",
  description: "Learn how to check in at any Binectics gym using the QR code scanner. Step-by-step guide and troubleshooting tips.",
};

const STEPS = [
  {
    step: "01",
    title: "Open the Binectics app",
    desc: "Launch Binectics on your phone. Make sure you're signed in to your account with an active gym subscription.",
  },
  {
    step: "02",
    title: "Tap \"Check in\" on the home screen",
    desc: "You'll see a green Check-in button on your dashboard. Tap it to open the camera scanner.",
  },
  {
    step: "03",
    title: "Point your camera at the gym's QR code",
    desc: "Hold your phone steady and frame the QR code displayed at the gym entrance. The scanner auto-detects it — no need to press anything.",
  },
  {
    step: "04",
    title: "You're checked in — your streak updates automatically",
    desc: "A confirmation screen appears instantly. Your attendance streak, visit history, and gym analytics all update in real time.",
  },
];

const FAQS = [
  {
    q: "What if the QR code won't scan?",
    a: "Make sure your camera lens is clean and you have adequate lighting. If the printed QR code is damaged, ask the front desk for a fresh one. You can also type in the gym's 6-digit check-in code manually from the Check-in screen.",
  },
  {
    q: "Can I check in without the app?",
    a: "Yes. Every gym has a 6-digit check-in code posted next to the QR poster. You can enter it at binectics.com/check-in from any browser. You'll need to be signed in.",
  },
  {
    q: "Does check-in work offline?",
    a: "The QR scanner works offline and queues your check-in locally. It will sync as soon as your phone reconnects to the internet — usually within seconds.",
  },
];

export default function QrHelpPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      {/* Hero */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 pt-16 sm:pt-20 pb-10 sm:pb-12">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em] mb-3.5" style={{ color: "var(--fg-3)" }}>Help</div>
        <h1 className="text-[36px] sm:text-[48px] lg:text-[56px] font-medium max-w-[22ch]" style={{ lineHeight: 1.04, letterSpacing: "-0.032em", color: "var(--ink)" }}>
          QR Check-in <em className="font-serif font-normal italic">guide</em>.
        </h1>
        <p className="text-[17px] sm:text-[18px] max-w-[60ch] leading-[1.5] mt-5" style={{ color: "var(--fg-2)" }}>
          Check in to any Binectics gym in under 3 seconds. Here&apos;s exactly how it works.
        </p>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <h2 className="text-[28px] sm:text-[32px] font-medium mb-6" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
          How to check in.
        </h2>
        <div className="flex flex-col gap-3.5">
          {STEPS.map((s) => (
            <div key={s.step} className="grid grid-cols-[40px_1fr] sm:grid-cols-[64px_1fr] items-start gap-3 sm:gap-4 rounded-(--r-3) p-5 sm:p-6" style={{ background: "var(--bg-2)" }}>
              <span className="text-[24px] sm:text-[32px] font-medium font-mono" style={{ color: "var(--signal)", lineHeight: 1 }}>{s.step}</span>
              <div>
                <h3 className="text-[17px] font-medium mb-1.5" style={{ color: "var(--ink)" }}>{s.title}</h3>
                <p className="text-[13.5px] leading-[1.55] max-w-[55ch]" style={{ color: "var(--fg-2)" }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-12" style={{ borderTop: "1px solid var(--border)" }}>
        <h2 className="text-[28px] sm:text-[32px] font-medium mb-6" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
          Common questions.
        </h2>
        <div className="flex flex-col gap-3.5">
          {FAQS.map((f) => (
            <div key={f.q} className="rounded-(--r-3) p-6" style={{ background: "var(--bg-2)" }}>
              <h3 className="text-[16px] font-medium mb-2" style={{ color: "var(--ink)" }}>{f.q}</h3>
              <p className="text-[13.5px] leading-[1.55] max-w-[60ch]" style={{ color: "var(--fg-2)" }}>{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-280 px-5 sm:px-8 py-16" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="rounded-(--r-3) p-6 sm:p-12 text-center" style={{ background: "var(--bg-2)" }}>
          <h2 className="text-[24px] sm:text-[36px] font-medium mb-3" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
            Ready to check in?
          </h2>
          <p className="text-[15px] sm:text-[17px] leading-[1.55] max-w-[45ch] mx-auto mb-6" style={{ color: "var(--fg-2)" }}>
            Download the Binectics app and start your first gym visit today.
          </p>
          <Link href="/login?mode=signup" className="btn-primary-v2">Download the app &rarr;</Link>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
