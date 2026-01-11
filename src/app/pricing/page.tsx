'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const memberPlans = [
    {
      name: 'Starter',
      monthlyPrice: 29,
      annualPrice: 23,
      description: 'Perfect for casual fitness enthusiasts',
      features: [
        'Access to 100+ verified gyms',
        '5 gym visits per month',
        'Basic progress tracking',
        'QR check-in',
        'Community access',
        'Mobile app access',
      ],
      cta: 'Start Free Trial',
      popular: false,
      color: 'accent-blue',
    },
    {
      name: 'Pro',
      monthlyPrice: 59,
      annualPrice: 47,
      description: 'For dedicated athletes and travelers',
      features: [
        'Unlimited access to 500+ gyms',
        'Book personal trainers',
        'Book dietician consultations',
        'Advanced progress tracking',
        'Priority gym access',
        'Exclusive community events',
        'Workout plans library',
        'Nutrition guides',
      ],
      cta: 'Start Free Trial',
      popular: true,
      color: 'primary',
    },
    {
      name: 'Elite',
      monthlyPrice: 99,
      annualPrice: 79,
      description: 'Ultimate fitness experience',
      features: [
        'Everything in Pro',
        'Unlimited trainer sessions (2/week)',
        'Unlimited dietician consultations',
        'Personalized workout plans',
        'Custom meal plans',
        'VIP gym access',
        'Dedicated success manager',
        'Early access to new features',
        'Priority customer support',
      ],
      cta: 'Start Free Trial',
      popular: false,
      color: 'accent-purple',
    },
  ];

  const professionalPlans = [
    {
      name: 'Gym Basic',
      monthlyPrice: 99,
      annualPrice: 79,
      description: 'For single gym locations',
      features: [
        'List one gym location',
        'QR check-in system',
        'Member management',
        'Basic analytics',
        'Payment processing',
        '5% transaction fee',
      ],
      cta: 'Get Started',
      color: 'accent-blue',
    },
    {
      name: 'Gym Pro',
      monthlyPrice: 199,
      annualPrice: 159,
      description: 'For growing gym chains',
      features: [
        'List up to 5 gym locations',
        'Advanced analytics',
        'Class scheduling',
        'Staff management',
        'Marketing tools',
        '3% transaction fee',
        'Priority support',
      ],
      cta: 'Get Started',
      color: 'accent-blue',
      popular: true,
    },
    {
      name: 'Trainer',
      monthlyPrice: 49,
      annualPrice: 39,
      description: 'For personal trainers',
      features: [
        'Verified trainer profile',
        'Client booking system',
        'Progress tracking tools',
        'Session management',
        'Client communication',
        '10% commission on bookings',
      ],
      cta: 'Get Started',
      color: 'accent-yellow',
    },
    {
      name: 'Dietician',
      monthlyPrice: 49,
      annualPrice: 39,
      description: 'For nutrition professionals',
      features: [
        'Verified dietician profile',
        'Client booking system',
        'Meal planning tools',
        'Progress tracking',
        'Client communication',
        '10% commission on consultations',
      ],
      cta: 'Get Started',
      color: 'accent-purple',
    },
  ];

  const faqs = [
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes! You can cancel your subscription at any time. Your access will continue until the end of your current billing period.',
    },
    {
      question: 'What happens after my free trial?',
      answer: 'After your 14-day free trial, you\'ll be automatically enrolled in your chosen plan. You can cancel anytime during the trial without being charged.',
    },
    {
      question: 'Do you offer refunds?',
      answer: 'We offer a 30-day money-back guarantee on all annual plans. Monthly plans can be canceled anytime, and you won\'t be charged for the next month.',
    },
    {
      question: 'Can I switch plans later?',
      answer: 'Absolutely! You can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle.',
    },
  ];

  return (
    <div className="min-h-screen bg-background-secondary">{/* Hero Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl font-black text-foreground sm:text-5xl lg:text-6xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-foreground-secondary leading-relaxed">
            Choose the plan that fits your fitness goals. All plans include a 14-day free trial.
          </p>
        </div>
      </section>

      {/* Pricing Toggle */}
      <section className="bg-neutral-100 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsAnnual(false)}
                className={`text-base font-semibold transition-colors duration-200 min-h-[44px] px-2 ${
                  !isAnnual ? 'text-foreground' : 'text-foreground-secondary'
                }`}
              >
                Monthly
              </button>

              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ${
                  isAnnual ? 'bg-primary-500' : 'bg-neutral-300'
                }`}
                aria-label={isAnnual ? 'Switch to monthly' : 'Switch to annual'}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ${
                    isAnnual ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>

              <button
                onClick={() => setIsAnnual(true)}
                className={`text-base font-semibold transition-colors duration-200 min-h-[44px] px-2 ${
                  isAnnual ? 'text-foreground' : 'text-foreground-secondary'
                }`}
              >
                Annual
              </button>
            </div>

            {isAnnual && (
              <span className="rounded-full bg-primary-500 px-3 py-1 text-sm font-semibold text-white">
                Save 20%
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Member Plans */}
      <section className="bg-neutral-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              For Fitness Enthusiasts
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              Access gyms, trainers, and dieticians worldwide
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {memberPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl bg-background p-8 shadow-card transition-all duration-300 hover:shadow-xl ${
                  plan.popular ? 'ring-2 ring-primary-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary-500 px-4 py-1 text-sm font-bold text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="font-display text-2xl font-black text-foreground">
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-sm text-foreground-secondary">
                    {plan.description}
                  </p>
                  <div className="mt-6">
                    <span className="text-5xl font-black text-foreground">
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-foreground-secondary">/month</span>
                  </div>
                  {isAnnual && (
                    <p className="mt-2 text-sm text-foreground-tertiary">
                      Billed ${plan.annualPrice * 12}/year
                    </p>
                  )}
                </div>
                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <svg
                        className="h-6 w-6 flex-shrink-0 text-primary-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-foreground-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link
                    href="/register/user"
                    className={`flex h-12 items-center justify-center rounded-lg ${
                      plan.popular
                        ? 'bg-primary-500 hover:bg-primary-600'
                        : 'bg-accent-blue-500 hover:bg-accent-blue-600'
                    } text-white font-semibold transition-colors duration-200`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Plans */}
      <section className="bg-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              For Fitness Professionals
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              Grow your business with powerful tools
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {professionalPlans.map((plan, index) => (
              <div
                key={index}
                className={`relative rounded-2xl bg-neutral-100 p-6 shadow-card transition-all duration-300 hover:shadow-xl ${
                  plan.popular ? 'ring-2 ring-accent-blue-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-accent-blue-500 px-3 py-1 text-xs font-bold text-white">
                      Popular
                    </span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="font-display text-xl font-black text-foreground">
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-sm text-foreground-secondary">
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <span className="text-4xl font-black text-foreground">
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-foreground-secondary text-sm">/mo</span>
                  </div>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <svg
                        className={`h-5 w-5 flex-shrink-0 text-${plan.color}-500`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-foreground-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6">
                  <Link
                    href={`/register/${plan.name.toLowerCase().split(' ')[0]}`}
                    className={`flex h-10 items-center justify-center rounded-lg bg-${plan.color}-500 hover:bg-${plan.color}-600 text-white font-semibold text-sm transition-colors duration-200`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-neutral-100 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="rounded-2xl bg-background p-6 shadow-card">
                <h3 className="font-bold text-lg text-foreground mb-3">
                  {faq.question}
                </h3>
                <p className="text-foreground-secondary leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-500 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
            Start your 14-day free trial
          </h2>
          <p className="mt-4 text-lg text-foreground-secondary">
            No credit card required. Cancel anytime.
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-background px-8 text-base font-semibold text-foreground shadow-lg transition-colors duration-200 hover:bg-neutral-50"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
}
