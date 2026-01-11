'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function QRHelpPage() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      number: 1,
      title: 'Open the Binectics App',
      description: 'Launch the Binectics mobile app on your smartphone. Make sure you\'re logged into your account.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      number: 2,
      title: 'Tap "Check In" Button',
      description: 'On the home screen, tap the "Check In" button. This will activate your device camera to scan QR codes.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
    },
    {
      number: 3,
      title: 'Scan the Gym\'s QR Code',
      description: 'Point your camera at the QR code posted at the gym entrance or reception desk. The app will automatically detect and scan it.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      ),
    },
    {
      number: 4,
      title: 'Confirm Check-in',
      description: 'Review the gym details on screen and tap "Confirm Check-in". You\'ll receive a confirmation message and can start your workout!',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const troubleshooting = [
    {
      problem: 'QR code won\'t scan',
      solutions: [
        'Ensure your camera lens is clean',
        'Make sure there\'s adequate lighting',
        'Hold your phone steady and at the right distance (15-30cm)',
        'Check that camera permissions are enabled for the app',
      ],
    },
    {
      problem: 'App says I\'m not eligible',
      solutions: [
        'Verify your membership is active in Account Settings',
        'Check if the gym is part of your membership tier',
        'Ensure you haven\'t exceeded your monthly gym visits (if applicable)',
        'Contact support if you believe this is an error',
      ],
    },
    {
      problem: 'Check-in didn\'t register',
      solutions: [
        'Check your internet connection',
        'Wait a few seconds and try scanning again',
        'Make sure you completed the confirmation step',
        'Check your check-in history in the app to verify',
      ],
    },
    {
      problem: 'Camera won\'t open',
      solutions: [
        'Enable camera permissions in your phone settings',
        'Close and reopen the app',
        'Restart your phone',
        'Update the app to the latest version',
      ],
    },
  ];

  const faqs = [
    {
      question: 'Where can I find the QR code at the gym?',
      answer: 'QR codes are typically displayed at the gym entrance, reception desk, or near the turnstiles. Look for signage with the Binectics logo. If you can\'t find it, ask the gym staff.',
    },
    {
      question: 'Do I need to check in every time I visit?',
      answer: 'Yes, you need to check in each time you visit a gym. This helps us track your visits, ensure you have access, and maintain accurate gym capacity counts.',
    },
    {
      question: 'Can I check in for someone else?',
      answer: 'No, each member must check in using their own account. Checking in for others violates our Terms of Service and may result in membership suspension.',
    },
    {
      question: 'What if my phone battery dies?',
      answer: 'If your phone battery dies, ask the gym staff for assistance. They can manually verify your membership using your member ID or email address.',
    },
    {
      question: 'Can I check out when I leave?',
      answer: 'Check-out is optional but recommended. It helps gyms manage capacity and provides you with accurate workout duration tracking in your app.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-background-secondary py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-2xl bg-primary-500 mb-6">
            <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-foreground mb-4">
            QR Code Check-in Guide
          </h1>
          <p className="text-lg text-foreground-secondary">
            Learn how to quickly check in at any Binectics partner gym using your mobile app
          </p>
        </div>
      </section>

      {/* Step-by-Step Guide */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            How to Check In
          </h2>

          {/* Steps */}
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className={`flex gap-6 rounded-lg border-2 p-6 transition-all cursor-pointer ${
                  activeStep === index
                    ? 'border-primary-500 bg-primary-500 bg-opacity-5'
                    : 'border-neutral-300 bg-background hover:border-primary-500'
                }`}
                onClick={() => setActiveStep(index)}
              >
                <div className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl ${
                  activeStep === index ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-foreground-secondary'
                }`}>
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      activeStep === index ? 'bg-primary-500 text-white' : 'bg-neutral-200 text-foreground-secondary'
                    }`}>
                      {step.number}
                    </span>
                    <h3 className="font-display text-xl font-bold text-foreground">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-foreground-secondary leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Video Demo Section */}
      <section className="bg-background-secondary py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="font-display text-3xl font-black text-foreground mb-4">
              Watch the Demo
            </h2>
            <p className="text-lg text-foreground-secondary">
              See the check-in process in action
            </p>
          </div>
          <div className="aspect-video rounded-lg border-2 border-neutral-300 bg-neutral-100 flex items-center justify-center">
            <div className="text-center">
              <svg className="h-20 w-20 text-foreground-secondary mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-foreground-secondary font-semibold">Video Demo Coming Soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* Troubleshooting */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-8 text-center">
            Troubleshooting
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {troubleshooting.map((item, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6"
              >
                <h3 className="font-bold text-foreground mb-4 flex items-start gap-2">
                  <svg className="h-6 w-6 text-accent-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {item.problem}
                </h3>
                <ul className="space-y-2">
                  {item.solutions.map((solution, solutionIndex) => (
                    <li key={solutionIndex} className="flex items-start gap-2 text-sm text-foreground-secondary">
                      <svg className="h-5 w-5 text-accent-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {solution}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-background-secondary py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6"
              >
                <h3 className="font-bold text-foreground mb-3 flex items-start gap-2">
                  <svg className="h-6 w-6 text-primary-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {faq.question}
                </h3>
                <p className="text-foreground-secondary leading-relaxed pl-8">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Still Need Help */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-black text-foreground mb-4">
            Still having trouble?
          </h2>
          <p className="text-lg text-foreground-secondary mb-8">
            Our support team is ready to help you get checked in
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-base font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Contact Support
            </Link>
            <Link
              href="/help"
              className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-neutral-300 bg-background px-6 py-3 text-base font-semibold text-foreground transition-colors hover:bg-neutral-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Browse Help Center
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
}
