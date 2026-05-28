"use client";

import { useState } from "react";
import Link from "next/link";
import { UserRole } from "@/lib/types";

interface OnboardingBannerProps {
  userRole: UserRole;
  userName?: string;
}

export default function OnboardingBanner({
  userRole,
  userName,
}: OnboardingBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const roleConfig = {
    GYM_OWNER: {
      title: "Complete your gym setup",
      description:
        "Add your gym details, location, facilities, and business information to start accepting members.",
      color: "blue",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h2m0 0v4m0-4h2m12 0h2m0 0v4m0-4h-2m-8-4v12m0-12h4v12h-4z M7 10h10M7 14h10"
          />
        </svg>
      ),
      steps: [
        "Gym details & location",
        "Facilities & amenities",
        "Business registration",
        "Pricing & plans",
      ],
    },
    TRAINER: {
      title: "Complete your trainer profile",
      description:
        "Add your certifications, specialties, and experience to attract clients.",
      color: "yellow",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      steps: [
        "Certifications & credentials",
        "Specialties & expertise",
        "Professional bio",
        "Pricing & availability",
      ],
    },
    DIETITIAN: {
      title: "Complete your dietitian profile",
      description:
        "Add your credentials, license, and specialties to start helping clients.",
      color: "purple",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v13m0-13c-2.21 0-4-1.79-4-4m4 4c2.21 0 4-1.79 4-4m-9 13h10M3 21h18"
          />
        </svg>
      ),
      steps: [
        "Professional credentials",
        "License information",
        "Specialties & approach",
        "Consultation pricing",
      ],
    },
    USER: {
      title: "Complete your profile",
      description:
        "Add your fitness goals and preferences to get personalized recommendations.",
      color: "green",
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      steps: [
        "Fitness goals",
        "Preferences & interests",
        "Location",
        "Subscription plan",
      ],
    },
  };

  const config = roleConfig[userRole as keyof typeof roleConfig];

  // If config is not found (e.g., ADMIN role), don't show the banner
  if (!config) return null;

  const colorClasses = {
    blue: {
      bg: "bg-gym-soft",
      border: "border-gym/30",
      icon: "bg-gym text-bg",
      button:
        "bg-gym hover:bg-gym/90 active:bg-gym/80",
      text: "text-fg",
      textMuted: "text-fg-2",
      checkboxBg: "bg-gym-soft",
      checkboxBorder: "border-gym/30",
    },
    yellow: {
      bg: "bg-trainer-soft",
      border: "border-trainer/30",
      icon: "bg-trainer text-fg",
      button:
        "bg-trainer hover:bg-trainer/90 active:bg-trainer/80",
      text: "text-fg",
      textMuted: "text-fg-2",
      checkboxBg: "bg-trainer-soft",
      checkboxBorder: "border-trainer/30",
    },
    purple: {
      bg: "bg-dietitian-soft",
      border: "border-dietitian/30",
      icon: "bg-dietitian text-bg",
      button:
        "bg-dietitian hover:bg-dietitian/90 active:bg-dietitian/80",
      text: "text-fg",
      textMuted: "text-fg-2",
      checkboxBg: "bg-dietitian-soft",
      checkboxBorder: "border-dietitian/30",
    },
    green: {
      bg: "bg-signal-soft",
      border: "border-signal/30",
      icon: "bg-signal text-fg",
      button: "bg-signal hover:bg-signal/90 active:bg-signal/80",
      text: "text-fg",
      textMuted: "text-signal-ink",
      checkboxBg: "bg-signal-soft",
      checkboxBorder: "border-signal/30",
    },
  };

  const colors = colorClasses[config.color as keyof typeof colorClasses];

  return (
    <div
      className={`relative rounded-(--r-3) border-2 ${colors.border} ${colors.bg} p-4 sm:p-6`}
    >
      {/* Dismiss Button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 text-fg-3 hover:text-fg-2 transition-colors"
        aria-label="Dismiss"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Icon */}
        <div
          className={`h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-(--r-3) ${colors.icon} flex items-center justify-center`}
        >
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 pr-6 sm:pr-8">
          {/* Header */}
          <div className="mb-2 sm:mb-3">
            <h3
              className={`font-display text-lg sm:text-xl font-black ${colors.text} mb-1`}
            >
              {userName ? `Welcome, ${userName}! ` : ""}
              {config.title}
            </h3>
            <p className={`text-sm ${colors.textMuted}`}>
              {config.description}
            </p>
          </div>

          {/* Steps */}
          <div className="mb-3 sm:mb-4">
            <p
              className={`text-xs font-semibold ${colors.text} uppercase tracking-wide mb-2`}
            >
              What you&#39;ll add:
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 sm:gap-2">
              {config.steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div
                    className={`h-5 w-5 shrink-0 rounded border-2 ${colors.checkboxBorder} ${colors.checkboxBg} flex items-center justify-center`}
                  >
                    <span
                      className={`text-xs font-semibold ${colors.textMuted}`}
                    >
                      {index + 1}
                    </span>
                  </div>
                  <span className={`text-sm ${colors.textMuted}`}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href="/dashboard/settings/profile"
              className={`inline-flex h-10 items-center justify-center rounded-(--r-2) ${colors.button} px-5 sm:px-6 text-sm font-semibold text-fg whitespace-nowrap transition-colors duration-200`}
            >
              Complete Setup
            </Link>
            <button
              onClick={() => setIsDismissed(true)}
              className="inline-flex h-10 items-center justify-center rounded-(--r-2) border-2 border-fg-3 bg-transparent px-4 text-sm font-semibold text-fg-2 hover:bg-bg/50 whitespace-nowrap transition-colors duration-200"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
