import type { Metadata } from "next";
import FaqAccordion from "@/components/FaqAccordion";
import { MarketingFooter } from "@/components/ds/MarketingFooter";
import { MarketingTopbar } from "@/components/ds/MarketingTopbar";

export const metadata: Metadata = {
  title: "Help Centre",
  description: "Answers to common questions about using Binectics as a member or provider.",
  alternates: { canonical: "/help" },
};

/**
 * Help centre. The previous page listed article counts, view numbers,
 * response-time promises and support channels that didn't exist; these are
 * short answers that match what the product does today, plus the one real
 * contact address.
 */

const MEMBER_ANSWERS = [
  { q: "How do I check in at my gym?", a: "Open the Binectics app and scan the QR code on the screen at the gym\u2019s door. You need an active membership with that gym; the code keeps changing, so scan it there rather than from a photo." },
  { q: "How do I pay a provider?", a: "Pay in the app by card or bank transfer when you subscribe to a plan or book a session. Payments go through Paystack, straight to your provider. Binectics doesn\u2019t add a fee." },
  { q: "How do I cancel a booking or get a refund?", a: "Open the booking from your bookings list. Each provider sets their own cancellation and refund policy, and refunds come from the provider you paid. If you can\u2019t sort it out with them, email help@binectics.com." },
  { q: "What does the verified badge mean?", a: "Our team has reviewed the provider\u2019s documents, such as their business registration, certifications, and identity, before the badge appears on their listing." },
  { q: "I forgot my password.", a: "Choose \u201cForgot password\u201d on the sign-in page and we\u2019ll email you a link to set a new one." },
];

const PROVIDER_ANSWERS = [
  { q: "How do I get paid?", a: "Connect your own Paystack account in your workspace\u2019s payment settings. Member payments then settle directly into it, and Binectics takes no cut. You pay Binectics only for your plan\u2019s seats." },
  { q: "How do I get verified?", a: "Upload your documents from your dashboard. Our team reviews them and adds the verified badge to your listing, or tells you what to fix." },
  { q: "How do I set up check-in at my gym?", a: "Open the kiosk page from your gym dashboard on a tablet or phone at the door. It shows a rotating QR code that members scan from the app." },
  { q: "How do I bring my existing clients?", a: "Invite them by email from your clients page. They join your roster without going through the marketplace." },
];

export default function HelpPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      <MarketingTopbar />

      <section className="mx-auto max-w-270 px-5 sm:px-10 pt-16 sm:pt-22 pb-10 sm:pb-14 text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Help centre</div>
        <h1 className="text-[40px] sm:text-[64px] font-medium mt-4" style={{ lineHeight: 1, letterSpacing: "-0.04em", color: "var(--ink)" }}>
          How can we help?
        </h1>
        <p className="text-[17px] mx-auto max-w-[60ch] leading-[1.55] mt-5" style={{ color: "var(--fg-2)" }}>
          Short answers to the questions we hear most. For anything else, email{" "}
          <strong style={{ color: "var(--ink)", fontWeight: 500 }}>help@binectics.com</strong>.
        </p>
      </section>

      <section className="mx-auto max-w-270 px-5 sm:px-10 pb-10 sm:pb-14">
        <h2 className="text-[22px] font-medium mb-4" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>For members</h2>
        <div className="border border-border rounded-(--r-3) overflow-hidden bg-bg">
          <FaqAccordion items={MEMBER_ANSWERS} />
        </div>
      </section>

      <section className="mx-auto max-w-270 px-5 sm:px-10 pb-16 sm:pb-24">
        <h2 className="text-[22px] font-medium mb-4" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>For gyms, trainers, and dietitians</h2>
        <div className="border border-border rounded-(--r-3) overflow-hidden bg-bg">
          <FaqAccordion items={PROVIDER_ANSWERS} />
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
