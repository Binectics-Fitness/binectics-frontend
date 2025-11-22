'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ProfessionalsTab() {
  const [activeTab, setActiveTab] = useState<'gym' | 'trainer' | 'dietician'>('gym');

  const tabs = {
    gym: {
      title: 'For Gym Owners',
      subtitle: 'Digitize your facility and grow your membership base',
      benefits: [
        {
          title: 'Reach More Members',
          description: '10,000+ active users searching for gyms daily',
        },
        {
          title: 'QR Check-in System',
          description: 'Modern access control with automatic attendance tracking',
        },
        {
          title: 'Manage Memberships',
          description: 'Create flexible plans with automated billing and renewals',
        },
        {
          title: 'Business Analytics',
          description: 'Track revenue, attendance trends, and member engagement',
        },
      ],
      cta: {
        text: 'List Your Gym',
        href: '/register/gym-owner',
      },
      stats: [
        { value: '$50K+', label: 'Avg. annual revenue increase' },
        { value: '250+', label: 'Verified gyms on platform' },
      ],
    },
    trainer: {
      title: 'For Personal Trainers',
      subtitle: 'Build your brand and grow your client base',
      benefits: [
        {
          title: 'Showcase Your Expertise',
          description: 'Verified profile highlighting your certifications and specialties',
        },
        {
          title: 'Sell Training Programs',
          description: 'Offer one-time packages or subscription-based training plans',
        },
        {
          title: 'Client Progress Journals',
          description: 'Log workouts, track progress, and keep clients motivated',
        },
        {
          title: 'Get Discovered',
          description: 'Users search by specialty, location, and ratings to find you',
        },
      ],
      cta: {
        text: 'Join as Trainer',
        href: '/register/trainer',
      },
      stats: [
        { value: '35%', label: 'More client engagement' },
        { value: '180+', label: 'Verified trainers earning' },
      ],
    },
    dietician: {
      title: 'For Dieticians',
      subtitle: 'Help clients achieve their nutrition goals',
      benefits: [
        {
          title: 'Verified Credentials',
          description: 'Display your qualifications and build trust with clients',
        },
        {
          title: 'Offer Diet Plans',
          description: 'Create custom meal plans and nutrition programs',
        },
        {
          title: 'Track Client Progress',
          description: 'Monitor nutrition goals, adherence, and results over time',
        },
        {
          title: 'Flexible Pricing',
          description: 'Set your own rates for consultations and meal plans',
        },
      ],
      cta: {
        text: 'Join as Dietician',
        href: '/register/dietician',
      },
      stats: [
        { value: '40%', label: 'Avg. client retention increase' },
        { value: '70+', label: 'Verified dieticians active' },
      ],
    },
  };

  const currentTab = tabs[activeTab];

  // Define color classes based on active tab
  const accentColors = {
    gym: {
      checkmark: 'text-accent-blue-500',
      button: 'bg-accent-blue-500 hover:bg-accent-blue-600 active:bg-accent-blue-700',
      buttonText: 'text-white',
      statIcon: 'bg-accent-blue-500',
      infoBox: 'bg-accent-blue-500/10',
      infoIcon: 'text-accent-blue-500',
    },
    trainer: {
      checkmark: 'text-accent-yellow-500',
      button: 'bg-accent-yellow-500 hover:bg-accent-yellow-600 active:bg-accent-yellow-700',
      buttonText: 'text-foreground',
      statIcon: 'bg-accent-yellow-500',
      infoBox: 'bg-accent-yellow-500/10',
      infoIcon: 'text-accent-yellow-500',
    },
    dietician: {
      checkmark: 'text-accent-purple-500',
      button: 'bg-accent-purple-500 hover:bg-accent-purple-600 active:bg-accent-purple-700',
      buttonText: 'text-white',
      statIcon: 'bg-accent-purple-500',
      infoBox: 'bg-accent-purple-500/10',
      infoIcon: 'text-accent-purple-500',
    },
  };

  const colors = accentColors[activeTab];

  return (
    <section className="bg-neutral-100 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-fade-in">
          <h2 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl">
            Grow your fitness business
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground-secondary">
            Join thousands of professionals earning more on Binectics
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex rounded-lg bg-background p-1 shadow-card">
            <button
              onClick={() => setActiveTab('gym')}
              className={`rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                activeTab === 'gym'
                  ? 'bg-accent-blue-500 text-white shadow-md'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              Gym Owners
            </button>
            <button
              onClick={() => setActiveTab('trainer')}
              className={`rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                activeTab === 'trainer'
                  ? 'bg-accent-yellow-500 text-foreground shadow-md'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              Trainers
            </button>
            <button
              onClick={() => setActiveTab('dietician')}
              className={`rounded-lg px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                activeTab === 'dietician'
                  ? 'bg-accent-purple-500 text-white shadow-md'
                  : 'text-foreground-secondary hover:text-foreground'
              }`}
            >
              Dieticians
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl">
                {currentTab.title}
              </h3>
              <p className="mt-4 text-lg text-foreground-secondary">{currentTab.subtitle}</p>

              <div className="mt-8 grid gap-6 sm:grid-cols-2">
                {currentTab.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <svg
                      className={`h-6 w-6 flex-shrink-0 ${colors.checkmark}`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div>
                      <h4 className="font-bold text-foreground">{benefit.title}</h4>
                      <p className="text-sm text-foreground-secondary">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <Link
                  href={currentTab.cta.href}
                  className={`inline-flex h-14 items-center justify-center rounded-lg ${colors.button} ${colors.buttonText} px-8 text-base font-semibold shadow-lg transition-colors duration-200`}
                >
                  {currentTab.cta.text}
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-background p-8 shadow-xl">
              <div className="space-y-6">
                {currentTab.stats.map((stat, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 rounded-2xl bg-neutral-100 p-6"
                  >
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors.statIcon}`}>
                      <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-foreground">{stat.value}</div>
                      <div className="text-sm text-foreground-secondary">{stat.label}</div>
                    </div>
                  </div>
                ))}

                <div className={`mt-8 rounded-2xl ${colors.infoBox} p-6`}>
                  <div className="flex items-start gap-3">
                    <svg className={`h-6 w-6 flex-shrink-0 ${colors.infoIcon}`} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="font-bold text-foreground">Verification Required</h4>
                      <p className="mt-1 text-sm text-foreground-secondary">
                        All professionals must complete our verification process to ensure quality and safety.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
