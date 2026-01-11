'use client';

import { useState } from 'react';
import Link from 'next/link';
import PricingToggle from './PricingToggle';

export default function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: 'Starter',
      monthlyPrice: 29,
      annualPrice: 23,
      description: 'Perfect for casual fitness enthusiasts',
      color: 'blue',
      popular: false,
      features: [
        'Access to 100+ verified gyms',
        '5 gym visits per month',
        'Basic progress tracking',
        'QR check-in',
        'Community access',
        'Mobile app access',
      ],
    },
    {
      name: 'Pro',
      monthlyPrice: 59,
      annualPrice: 47,
      description: 'For dedicated athletes and travelers',
      color: 'yellow',
      popular: true,
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
    },
    {
      name: 'Elite',
      monthlyPrice: 99,
      annualPrice: 79,
      description: 'Ultimate fitness experience',
      color: 'purple',
      popular: false,
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
    },
  ];

  const colorClasses = {
    blue: 'bg-accent-blue-500 text-white',
    yellow: 'bg-accent-yellow-500 text-foreground',
    purple: 'bg-accent-purple-500 text-white',
  };

  const borderClasses = {
    blue: 'border-accent-blue-200',
    yellow: 'border-accent-yellow-300',
    purple: 'border-accent-purple-200',
  };

  return (
    <section id="pricing" className="bg-neutral-100 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center animate-fade-in">
          <h2 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-foreground-secondary">
            Choose the plan that fits your fitness journey
          </p>
        </div>

        <div className="mt-8 flex justify-center">
          <PricingToggle onChange={setIsAnnual} />
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const currentPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const period = isAnnual ? 'month, billed annually' : 'month';

            return (
              <div
                key={index}
                className={`relative rounded-3xl bg-background p-8 shadow-card transition-shadow duration-300 hover:shadow-xl ${
                  plan.popular
                    ? 'border-2 ' + borderClasses[plan.color as keyof typeof borderClasses]
                    : 'border border-neutral-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex rounded-full bg-accent-yellow-500 px-4 py-1 text-sm font-bold text-foreground">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="font-display text-2xl font-bold text-foreground">{plan.name}</h3>
                  <p className="mt-2 text-sm text-foreground-secondary">{plan.description}</p>

                  <div className="mt-6">
                    {isAnnual && (
                      <div className="mb-2">
                        <span className="text-lg text-foreground-secondary line-through">
                          ${plan.monthlyPrice}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="font-display text-5xl font-black text-foreground">
                        ${currentPrice}
                      </span>
                      <span className="text-foreground-secondary">/{isAnnual ? 'mo' : 'month'}</span>
                    </div>
                    {isAnnual && (
                      <p className="mt-2 text-sm text-foreground-secondary">
                        ${currentPrice * 12} billed annually
                      </p>
                    )}
                  </div>

                  <Link
                    href="/register"
                    className={`mt-6 inline-flex h-12 w-full items-center justify-center rounded-lg ${
                      colorClasses[plan.color as keyof typeof colorClasses]
                    } text-base font-semibold transition-all duration-200 hover:shadow-lg`}
                  >
                    Get Started
                  </Link>
                </div>

                <div className="mt-8 space-y-4">
                  {plan.features.map((feature, fIndex) => (
                    <div key={fIndex} className="flex items-start gap-3">
                      <svg
                        className="h-5 w-5 flex-shrink-0 text-primary-500"
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
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-foreground-secondary">
            All plans include a 14-day free trial • No credit card required •{' '}
            <Link href="#" className="font-medium text-accent-blue-500 hover:text-accent-blue-600">
              Compare plans
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
