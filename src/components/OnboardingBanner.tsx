"use client";

import { useState } from "react";
import Link from "next/link";

interface OnboardingBannerProps {
  userRole: "GYM_OWNER" | "TRAINER" | "DIETICIAN" | "USER";
  userName?: string;
}

export default function OnboardingBanner({ userRole, userName }: OnboardingBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const roleConfig = {
    GYM_OWNER: {
      title: "Complete your gym setup",
      description: "Add your gym details, location, facilities, and business information to start accepting members.",
      color: "blue",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      description: "Add your certifications, specialties, and experience to attract clients.",
      color: "yellow",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
    DIETICIAN: {
      title: "Complete your dietician profile",
      description: "Add your credentials, license, and specialties to start helping clients.",
      color: "purple",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      description: "Add your fitness goals and preferences to get personalized recommendations.",
      color: "green",
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

  const config = roleConfig[userRole];
  const colorClasses = {
    blue: {
      bg: "bg-accent-blue-50",
      border: "border-accent-blue-200",
      icon: "bg-accent-blue-500 text-white",
      button: "bg-accent-blue-500 hover:bg-accent-blue-600 active:bg-accent-blue-700",
      text: "text-accent-blue-900",
      textMuted: "text-accent-blue-700",
      checkboxBg: "bg-accent-blue-100",
      checkboxBorder: "border-accent-blue-300",
    },
    yellow: {
      bg: "bg-accent-yellow-50",
      border: "border-accent-yellow-200",
      icon: "bg-accent-yellow-500 text-foreground",
      button: "bg-accent-yellow-500 hover:bg-accent-yellow-600 active:bg-accent-yellow-700",
      text: "text-accent-yellow-900",
      textMuted: "text-accent-yellow-700",
      checkboxBg: "bg-accent-yellow-100",
      checkboxBorder: "border-accent-yellow-300",
    },
    purple: {
      bg: "bg-accent-purple-50",
      border: "border-accent-purple-200",
      icon: "bg-accent-purple-500 text-white",
      button: "bg-accent-purple-500 hover:bg-accent-purple-600 active:bg-accent-purple-700",
      text: "text-accent-purple-900",
      textMuted: "text-accent-purple-700",
      checkboxBg: "bg-accent-purple-100",
      checkboxBorder: "border-accent-purple-300",
    },
    green: {
      bg: "bg-primary-50",
      border: "border-primary-200",
      icon: "bg-primary-500 text-foreground",
      button: "bg-primary-500 hover:bg-primary-600 active:bg-primary-700",
      text: "text-primary-900",
      textMuted: "text-primary-700",
      checkboxBg: "bg-primary-100",
      checkboxBorder: "border-primary-300",
    },
  };

  const colors = colorClasses[config.color as keyof typeof colorClasses];

  return (
    <div
      className={`relative rounded-2xl border-2 ${colors.border} ${colors.bg} p-6 shadow-lg`}
    >
      {/* Dismiss Button */}
      <button
        onClick={() => setIsDismissed(true)}
        className="absolute top-4 right-4 text-foreground-tertiary hover:text-foreground-secondary transition-colors"
        aria-label="Dismiss"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <div className="flex gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 h-12 w-12 rounded-xl ${colors.icon} flex items-center justify-center`}>
          {config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 pr-8">
          {/* Header */}
          <div className="mb-3">
            <h3 className={`font-display text-xl font-black ${colors.text} mb-1`}>
              {userName ? `Welcome, ${userName}! ` : ""}{config.title}
            </h3>
            <p className={`text-sm ${colors.textMuted}`}>
              {config.description}
            </p>
          </div>

          {/* Steps */}
          <div className="mb-4">
            <p className={`text-xs font-semibold ${colors.text} uppercase tracking-wide mb-2`}>
              What you'll add:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {config.steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`h-5 w-5 rounded border-2 ${colors.checkboxBorder} ${colors.checkboxBg} flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-xs font-semibold ${colors.textMuted}`}>
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
              className={`inline-flex h-10 items-center justify-center rounded-lg ${colors.button} px-6 text-sm font-semibold text-foreground shadow-button transition-colors duration-200`}
            >
              Complete Setup
            </Link>
            <button
              onClick={() => setIsDismissed(true)}
              className="inline-flex h-10 items-center justify-center rounded-lg border-2 border-foreground-tertiary bg-transparent px-4 text-sm font-semibold text-foreground-secondary hover:bg-white/50 transition-colors duration-200"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
