"use client";

import { useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import DashboardLoading from "@/components/DashboardLoading";

const faqSections = [
  {
    title: "Getting Started",
    icon: "🚀",
    items: [
      {
        q: "How do I find a gym or trainer near me?",
        a: 'Go to the Marketplace from the sidebar or use the Search page. You can filter by location, type (gym, trainer, dietitian), price range, and verified status.',
      },
      {
        q: "How do I subscribe to a plan?",
        a: "Visit a gym, trainer, or dietitian profile and browse their available plans. Click \"Subscribe\" on the plan you want, then complete the checkout process.",
      },
      {
        q: "What does the Verified badge mean?",
        a: "Verified providers have submitted government ID, professional certifications, and passed our background review process. Look for the green checkmark on profiles.",
      },
    ],
  },
  {
    title: "Subscriptions & Payments",
    icon: "💳",
    items: [
      {
        q: "How do I view my active subscriptions?",
        a: 'Go to Dashboard → Subscriptions to see all your active, expired, and cancelled subscriptions. You can also cancel or manage renewals from there.',
      },
      {
        q: "What payment methods are supported?",
        a: "We support credit/debit cards via Stripe, and regional payment gateways like Flutterwave and Paystack for African countries. Multi-currency payments are fully supported.",
      },
      {
        q: "How do I cancel a subscription?",
        a: 'Navigate to Dashboard → Subscriptions, find the subscription you want to cancel, and click "Cancel". Your access continues until the end of the current billing period.',
      },
    ],
  },
  {
    title: "Consultations & Bookings",
    icon: "📅",
    items: [
      {
        q: "How do I book a consultation?",
        a: "Visit a trainer or dietitian profile and click \"Book Consultation\". Select an available time slot, add any notes, and confirm the booking.",
      },
      {
        q: "How do I reschedule or cancel a booking?",
        a: 'Go to Dashboard → Schedule to see your upcoming bookings. Click on a booking to reschedule or cancel it. Cancellation policies may vary by provider.',
      },
      {
        q: "What happens if I miss a session?",
        a: 'Missed sessions are marked as "No Show". Please try to cancel at least 24 hours in advance to avoid being marked as a no-show.',
      },
    ],
  },
  {
    title: "Progress Tracking",
    icon: "📈",
    items: [
      {
        q: "How does progress tracking work?",
        a: "Your trainer or dietitian logs your progress including weight, meals, activities, and journal notes. You can view all this from your Nutrition, Workouts, and Goals pages.",
      },
      {
        q: "Can I log my own progress?",
        a: "Currently, progress entries are logged by your assigned professional. You can view all entries and summaries from your dashboard.",
      },
      {
        q: "How do I see my meal feedback?",
        a: 'Go to Dashboard → Nutrition to see all meal feedback logged by your dietitian, including meal type, ratings, calories, and personalized feedback.',
      },
    ],
  },
  {
    title: "QR Check-in",
    icon: "📱",
    items: [
      {
        q: "How does QR check-in work?",
        a: "When you visit a gym you're subscribed to, scan the QR code displayed at the entrance using the Check-in page. This records your attendance automatically.",
      },
      {
        q: "Where do I find my check-in history?",
        a: 'Your recent check-ins appear on your Dashboard. For full history, visit Dashboard → Check-ins.',
      },
    ],
  },
  {
    title: "Account & Support",
    icon: "⚙️",
    items: [
      {
        q: "How do I update my profile?",
        a: 'Go to Dashboard → Settings to update your name, email, profile picture, country, and other personal details.',
      },
      {
        q: "How do I change my password?",
        a: 'Go to Dashboard → Settings → Security to change your password. You can also use the "Forgot Password" flow from the login page.',
      },
      {
        q: "How do I contact support?",
        a: "Email us at support@binectics.com or visit our Contact page. We typically respond within 24 hours.",
      },
    ],
  },
];

export default function Page() {
  const { isLoading, isAuthorized } = useRoleGuard(UserRole.USER);
  const [openSection, setOpenSection] = useState<number | null>(0);
  const [openItem, setOpenItem] = useState<Record<string, number | null>>({});

  if (isLoading || !isAuthorized) return <DashboardLoading />;

  function toggleItem(sectionIdx: number, itemIdx: number) {
    setOpenItem((prev) => ({
      ...prev,
      [sectionIdx]: prev[sectionIdx] === itemIdx ? null : itemIdx,
    }));
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Help Center
          </h1>
          <p className="text-sm text-neutral-500 mb-8">
            Find answers to common questions about using Binectics.
          </p>

          <div className="space-y-4">
            {faqSections.map((section, sIdx) => (
              <div
                key={section.title}
                className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
              >
                <button
                  onClick={() =>
                    setOpenSection(openSection === sIdx ? null : sIdx)
                  }
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-neutral-50 transition-colors"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl">{section.icon}</span>
                    <span className="font-semibold text-foreground">
                      {section.title}
                    </span>
                  </span>
                  <svg
                    className={`w-5 h-5 text-neutral-400 transition-transform ${
                      openSection === sIdx ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {openSection === sIdx && (
                  <div className="border-t border-neutral-100">
                    {section.items.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="border-b border-neutral-50 last:border-b-0"
                      >
                        <button
                          onClick={() => toggleItem(sIdx, iIdx)}
                          className="w-full flex items-center justify-between px-4 sm:px-5 py-3 text-left hover:bg-neutral-50 transition-colors"
                        >
                          <span className="text-sm font-medium text-foreground pr-4">
                            {item.q}
                          </span>
                          <svg
                            className={`w-4 h-4 shrink-0 text-neutral-400 transition-transform ${
                              openItem[sIdx] === iIdx ? "rotate-180" : ""
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                        {openItem[sIdx] === iIdx && (
                          <p className="px-4 sm:px-5 pb-3 text-sm text-neutral-600 leading-relaxed">
                            {item.a}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact Support */}
          <div className="mt-8 bg-primary-50 rounded-xl border border-primary-200 p-6 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Still need help?
            </h2>
            <p className="text-sm text-neutral-600 mb-4">
              Our support team is here to assist you.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 text-foreground font-semibold rounded-lg hover:bg-primary-600 transition-colors text-sm"
            >
              Contact Support
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
