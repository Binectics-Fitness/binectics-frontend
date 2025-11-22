import Link from 'next/link';
import { Accordion } from '../components/Accordion';
import ProfessionalsTab from '../components/ProfessionalsTab';

export default function Home() {
  const faqItems = [
    {
      title: 'What is Binectics?',
      content:
        'Binectics is a global fitness ecosystem that connects verified gyms, certified personal trainers, and expert dieticians in one platform. With a single subscription, you get access to 500+ gyms across 50+ countries, plus the ability to book trainers and dieticians wherever you are.',
    },
    {
      title: 'How does Binectics work?',
      content:
        'Simply sign up, choose your plan, and get verified. You\'ll receive a unique QR code that works at any partner gym worldwide. You can also browse and book personal trainers and dieticians through our app, track your progress, and manage everything from one dashboard.',
    },
    {
      title: 'Is there a free trial?',
      content:
        'Yes! All new members get a 14-day free trial with full access to our platform. No credit card required to start. You can cancel anytime during the trial without being charged.',
    },
    {
      title: 'How do I check in at a gym?',
      content:
        'Simply open the Binectics app, navigate to your QR code, and scan it at the gym entrance. The system automatically verifies your membership and logs your visit. Most gyms have dedicated QR scanners at reception.',
    },
    {
      title: 'Can I visit any gym multiple times?',
      content:
        'Yes! With our Pro and Elite plans, you get unlimited access to all partner gyms. The Starter plan includes 5 gym visits per month. There are no restrictions on which gyms you can visit or how often.',
    },
    {
      title: 'What payment methods do you accept?',
      content:
        'We accept all major credit cards (Visa, Mastercard, American Express, Discover), debit cards, and digital wallets (Apple Pay, Google Pay). For annual plans, we also accept bank transfers and PayPal.',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background-secondary py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-4 py-2">
                <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-foreground">Available in 50+ countries</span>
              </div>
              <h1 className="font-display text-4xl font-black leading-[1.1] text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                Your global fitness ecosystem—<span className="text-primary-500">gyms, trainers & dieticians</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-foreground-secondary sm:text-xl">
                One unified marketplace connecting verified gyms, certified trainers, and expert dieticians worldwide. Subscribe, book, and track—all in one place.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/register"
                  className="inline-flex min-h-[44px] h-14 items-center justify-center rounded-lg bg-primary-500 px-8 text-base font-semibold text-foreground shadow-button transition-colors duration-200 hover:bg-primary-600 active:bg-primary-700"
                >
                  Explore the Marketplace
                </Link>
                <p className="text-sm text-foreground-tertiary text-center sm:text-left animate-fade-in">
                  Join 10,000+ members across 50 countries
                </p>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="relative h-[500px] w-full">
                {/* Visual element - illustrated icons */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 space-y-6">
                  <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-lg animate-fade-in" style={{animationDelay: '0.2s'}}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-blue-100">
                      <svg className="h-6 w-6 text-accent-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h2m0 0v4m0-4h2m12 0h2m0 0v4m0-4h-2m-8-4v12m0-12h4v12h-4z M7 10h10M7 14h10" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">500+ Gyms</div>
                      <div className="text-xs text-foreground-secondary">in 50 countries</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-lg animate-fade-in" style={{animationDelay: '0.4s'}}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-yellow-100">
                      <svg className="h-6 w-6 text-accent-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z M16 8a2 2 0 100-4 2 2 0 000 4z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">Certified Trainers</div>
                      <div className="text-xs text-foreground-secondary">verified & rated</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 rounded-2xl bg-white p-6 shadow-lg animate-fade-in" style={{animationDelay: '0.6s'}}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-orange-100">
                      <svg className="h-6 w-6 text-accent-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13c-2.21 0-4-1.79-4-4m4 4c2.21 0 4-1.79 4-4m-9 13h10M3 21h18" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">Meal Plans</div>
                      <div className="text-xs text-foreground-secondary">custom nutrition</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid gap-8 sm:grid-cols-3">
            <div className="text-center animate-fade-in" style={{animationDelay: '0.1s'}}>
              <div className="mb-2 flex items-center justify-center">
                <svg className="h-6 w-6 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div className="font-display text-4xl font-bold text-foreground">500+</div>
              <div className="mt-1 text-sm font-medium text-foreground-secondary">
                Verified Professionals
              </div>
            </div>
            <div className="text-center animate-fade-in" style={{animationDelay: '0.2s'}}>
              <div className="mb-2 flex items-center justify-center">
                <svg className="h-6 w-6 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </div>
              <div className="font-display text-4xl font-bold text-foreground">4.8</div>
              <div className="mt-1 text-sm font-medium text-foreground-secondary">
                Average Rating
              </div>
            </div>
            <div className="text-center animate-fade-in" style={{animationDelay: '0.3s'}}>
              <div className="mb-2 flex items-center justify-center">
                <svg className="h-6 w-6 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              </div>
              <div className="font-display text-4xl font-bold text-foreground">10K+</div>
              <div className="mt-1 text-sm font-medium text-foreground-secondary">
                Active Members
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-background-secondary py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h2 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Get started in 3 simple steps
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground-secondary">
              From signup to your first workout in minutes
            </p>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Browse & Discover',
                description: 'Search 500+ gyms, trainers, and nutritionists across 50 countries. Filter by specialty, location, ratings, and price.',
                color: 'blue',
                icon: (
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                ),
              },
              {
                step: '02',
                title: 'Subscribe & Connect',
                description: 'Choose your plan and subscribe to your favorite gyms and trainers. All payments and bookings managed in one place.',
                color: 'yellow',
                icon: (
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
              {
                step: '03',
                title: 'Train & Track',
                description: 'Check in with your QR code, complete workouts, and track progress automatically. Access your stats anytime, anywhere.',
                color: 'purple',
                icon: (
                  <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                ),
              },
            ].map((item, index) => {
              const colorClasses = {
                blue: 'bg-accent-blue-100 text-accent-blue-600',
                yellow: 'bg-accent-yellow-100 text-accent-yellow-600',
                purple: 'bg-accent-purple-100 text-accent-purple-600',
              };

              return (
                <div key={index} className="relative">
                  {/* Connector Line - Hidden on mobile, shown on desktop */}
                  {index < 2 && (
                    <div className="absolute left-1/2 top-16 hidden h-0.5 w-full bg-neutral-300 lg:block" style={{zIndex: 0}}></div>
                  )}

                  <div className="relative z-10 text-center">
                    {/* Step Number */}
                    <div className="mb-6 flex justify-center">
                      <div className={`flex h-20 w-20 items-center justify-center rounded-2xl ${colorClasses[item.color as keyof typeof colorClasses]} transition-shadow duration-300 hover:shadow-lg`}>
                        {item.icon}
                      </div>
                    </div>

                    {/* Step Label */}
                    <div className="mb-3 text-sm font-bold uppercase tracking-wider text-foreground-tertiary">
                      Step {item.step}
                    </div>

                    {/* Title */}
                    <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm leading-relaxed text-foreground-secondary">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Link
              href="/register"
              className="inline-flex h-14 items-center justify-center rounded-lg bg-primary-500 px-8 text-base font-semibold text-foreground shadow-button transition-colors duration-200 hover:bg-primary-600 active:bg-primary-700"
            >
              Start Your Free Trial
            </Link>
            <p className="mt-4 text-sm text-foreground-tertiary">
              No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases Section - Lifestyle Photos */}
      <section className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h2 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Work out anywhere—home, gym, or park
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-foreground-secondary">
              Access fitness professionals and facilities wherever life takes you
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'At the Gym',
                description: 'QR check-in, track workouts, access equipment guides',
                color: 'blue',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h2m0 0v4m0-4h2m12 0h2m0 0v4m0-4h-2m-8-4v12m0-12h4v12h-4z M7 10h10M7 14h10" />
                  </svg>
                ),
              },
              {
                label: 'Personal Training',
                description: 'One-on-one sessions with certified trainers',
                color: 'yellow',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z M16 8a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                ),
              },
              {
                label: 'Nutrition Plans',
                description: 'Custom meal plans from expert dieticians',
                color: 'orange',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13c-2.21 0-4-1.79-4-4m4 4c2.21 0 4-1.79 4-4m-9 13h10M3 21h18" />
                  </svg>
                ),
              },
              {
                label: 'Progress Tracking',
                description: 'Monitor your goals with detailed analytics',
                color: 'purple',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                ),
              },
            ].map((useCase, index) => {
              const colorClasses = {
                blue: 'bg-accent-blue-100 text-accent-blue-600',
                yellow: 'bg-accent-yellow-100 text-accent-yellow-600',
                orange: 'bg-accent-orange-100 text-accent-orange-600',
                purple: 'bg-accent-purple-100 text-accent-purple-600',
              };

              return (
              <div key={index} className="group relative">
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-background p-6 sm:p-8 shadow-card transition-shadow duration-300 hover:shadow-xl">
                  <div className={`mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl sm:rounded-2xl ${colorClasses[useCase.color as keyof typeof colorClasses]}`}>
                    {useCase.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">{useCase.label}</h3>
                  <p className="text-sm leading-relaxed text-foreground-secondary">{useCase.description}</p>
                </div>
              </div>
            )})}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-background-secondary py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h2 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl">
              Browse 500+ trainers and gyms near you
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground-secondary">
              Find fitness professionals specialized in your goals
            </p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: 'Strength Training',
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h2m0 0v4m0-4h2m12 0h2m0 0v4m0-4h-2m-8-4v12m0-12h4v12h-4z M7 10h10M7 14h10" />
                  </svg>
                ),
              },
              {
                label: 'Yoga & Flexibility',
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v.01M8 8v.01M16 8v.01M12 12c-2.21 0-4 1.79-4 4v4h8v-4c0-2.21-1.79-4-4-4z M12 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                ),
              },
              {
                label: 'Nutrition & Diet',
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13c-2.21 0-4-1.79-4-4m4 4c2.21 0 4-1.79 4-4m-9 13h10M3 21h18" />
                  </svg>
                ),
              },
              {
                label: 'Cardio & Running',
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z M16 8a2 2 0 100-4 2 2 0 000 4z" />
                  </svg>
                ),
              },
              {
                label: 'Bodybuilding',
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z M4 8v8m16-8v8 M2 10h2m16 0h2M2 14h2m16 0h2" />
                  </svg>
                ),
              },
              {
                label: 'CrossFit & HIIT',
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v18l7-4 7 4V3M9 6h6M9 10h6" />
                  </svg>
                ),
              },
              {
                label: 'Mental Wellness',
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                ),
              },
              {
                label: 'Sports Performance',
                icon: (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
              },
            ].map((category, index) => (
              <button
                key={index}
                className="group flex items-center gap-3 text-left transition-colors duration-200"
              >
                <span className="text-foreground-secondary transition-colors group-hover:text-primary-500">
                  {category.icon}
                </span>
                <span className="text-sm font-medium text-foreground transition-colors group-hover:text-primary-500">{category.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {[
              {
                title: 'For Gyms',
                description: 'Digitize your facility, manage memberships, and grow your business with our comprehensive gym management platform.',
                color: 'blue',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h2m0 0v4m0-4h2m12 0h2m0 0v4m0-4h-2m-8-4v12m0-12h4v12h-4z M7 10h10M7 14h10" />
                  </svg>
                ),
              },
              {
                title: 'For Trainers',
                description: 'Build your brand, sell training programs, and track client progress with powerful tools designed for fitness professionals.',
                color: 'yellow',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v18l7-4 7 4V3M9 6h6M9 10h6" />
                  </svg>
                ),
              },
              {
                title: 'For Dieticians',
                description: 'Offer personalized meal plans, track nutrition goals, and help clients succeed with integrated diet management tools.',
                color: 'orange',
                icon: (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v13m0-13c-2.21 0-4-1.79-4-4m4 4c2.21 0 4-1.79 4-4m-9 13h10M3 21h18" />
                  </svg>
                ),
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl bg-background p-8 shadow-card transition-shadow duration-300 hover:shadow-xl"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-${feature.color}-100 text-accent-${feature.color}-600`}>
                  {feature.icon}
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground-secondary">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Features - PRD Capabilities */}
      <section className="bg-background-secondary py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h2 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Everything you need in one platform
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground-secondary">
              Powerful features for users and professionals
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'QR Check-in',
                description: 'Seamless gym access with QR code scanning. Check in instantly and track your attendance automatically.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                ),
                color: 'blue',
              },
              {
                title: 'Verified Professionals',
                description: 'All gyms, trainers, and dieticians are verified with credentials, certifications, and background checks.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ),
                color: 'green',
              },
              {
                title: 'Client Journals',
                description: 'Trainers and dieticians log your progress. View notes, metrics, and track your fitness journey over time.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                ),
                color: 'yellow',
              },
              {
                title: 'Flexible Subscriptions',
                description: 'Choose from monthly memberships, fixed-duration programs, or one-time training packages that fit your schedule.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                ),
                color: 'purple',
              },
              {
                title: 'Multi-Currency Payments',
                description: 'Secure payments in your local currency via Stripe and regional gateways. All transactions are encrypted and safe.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                ),
                color: 'blue',
              },
              {
                title: 'Location-Based Search',
                description: 'Find gyms, trainers, and dieticians near you with smart filters by specialty, price, ratings, and verified status.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ),
                color: 'green',
              },
            ].map((feature, index) => {
              const colorClasses = {
                blue: 'bg-accent-blue-100',
                green: 'bg-primary-100',
                yellow: 'bg-accent-yellow-100',
                purple: 'bg-accent-purple-100',
              };

              const iconColorClasses = {
                blue: 'text-accent-blue-600',
                green: 'text-primary-600',
                yellow: 'text-accent-yellow-600',
                purple: 'text-accent-purple-600',
              };

              return (
                <div
                  key={index}
                  className="group rounded-xl sm:rounded-2xl bg-background p-5 sm:p-6 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                >
                  <div className={`mb-3 sm:mb-4 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl ${colorClasses[feature.color as keyof typeof colorClasses]} ${iconColorClasses[feature.color as keyof typeof iconColorClasses]}`}>
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 font-display text-lg sm:text-xl font-bold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground-secondary">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Global Reach Section */}
      <section className="bg-background-secondary py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h2 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Your fitness passport to 50+ countries
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-foreground-secondary">
              One subscription works everywhere. From Tokyo to Toronto, your fitness never stops.
            </p>
          </div>

          <div className="mt-12 sm:mt-16 grid gap-6 sm:gap-8 grid-cols-2 lg:grid-cols-4">
            {[
              { country: 'United States', gyms: '180+', trainers: '250+' },
              { country: 'United Kingdom', gyms: '90+', trainers: '120+' },
              { country: 'Australia', gyms: '60+', trainers: '85+' },
              { country: 'Canada', gyms: '70+', trainers: '95+' },
              { country: 'Germany', gyms: '50+', trainers: '70+' },
              { country: 'France', gyms: '45+', trainers: '65+' },
              { country: 'Japan', gyms: '40+', trainers: '55+' },
              { country: 'Singapore', gyms: '30+', trainers: '45+' },
            ].map((location, index) => (
              <div
                key={index}
                className="group rounded-xl sm:rounded-2xl bg-background p-4 sm:p-6 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="mb-3 sm:mb-4 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-primary-100">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-display text-base sm:text-lg font-bold text-foreground">{location.country}</h3>
                <div className="mt-2 sm:mt-3 space-y-1 text-xs sm:text-sm">
                  <p className="text-foreground-secondary">{location.gyms} gyms</p>
                  <p className="text-foreground-secondary">{location.trainers} trainers</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <p className="text-sm text-foreground-tertiary">
              + 42 more countries including Brazil, India, UAE, Spain, Italy, Thailand, and more
            </p>
            <Link
              href="#"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-accent-blue-500 hover:text-accent-blue-600"
            >
              View all countries
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* QR Check-in Highlight */}
      <section className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-8 lg:gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-blue-500/10 px-3 sm:px-4 py-1.5 sm:py-2">
                <svg className="h-4 w-4 sm:h-5 sm:w-5 text-accent-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-xs sm:text-sm font-semibold text-accent-blue-600">Seamless Access</span>
              </div>
              <h2 className="font-display text-2xl font-black leading-tight text-foreground sm:text-3xl lg:text-4xl xl:text-5xl">
                Check in with a tap. Walk straight to your workout.
              </h2>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-relaxed text-foreground-secondary">
                No more front desk queues or membership cards. Simply scan the gym's QR code with your phone, and you're in. Your attendance is tracked automatically, and your trainer gets notified when you arrive.
              </p>
              <div className="mt-6 sm:mt-8 grid gap-3 sm:gap-4 sm:grid-cols-2">
                {[
                  {
                    title: 'Instant Access',
                    description: 'QR scan takes less than 2 seconds',
                  },
                  {
                    title: 'Auto-Tracking',
                    description: 'Attendance logged automatically',
                  },
                  {
                    title: 'Trainer Alerts',
                    description: 'Your trainer knows when you arrive',
                  },
                  {
                    title: 'History View',
                    description: 'See all your gym visits in one place',
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 flex-shrink-0 text-accent-blue-500"
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
                      <h4 className="font-bold text-foreground">{item.title}</h4>
                      <p className="text-sm text-foreground-secondary">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mt-8 lg:mt-0">
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-accent-blue-500 to-accent-blue-600 p-8 sm:p-12 text-center shadow-2xl">
                {/* QR Code Visual */}
                <div className="mx-auto w-48 sm:w-64 rounded-xl sm:rounded-2xl bg-white p-4 sm:p-6">
                  <svg className="h-full w-full" viewBox="0 0 100 100" fill="none">
                    {/* Simplified QR code pattern */}
                    <rect width="100" height="100" fill="white" />
                    <rect x="10" y="10" width="20" height="20" fill="black" />
                    <rect x="70" y="10" width="20" height="20" fill="black" />
                    <rect x="10" y="70" width="20" height="20" fill="black" />
                    <rect x="15" y="15" width="10" height="10" fill="white" />
                    <rect x="75" y="15" width="10" height="10" fill="white" />
                    <rect x="15" y="75" width="10" height="10" fill="white" />
                    <rect x="40" y="15" width="5" height="5" fill="black" />
                    <rect x="50" y="15" width="5" height="5" fill="black" />
                    <rect x="40" y="25" width="5" height="5" fill="black" />
                    <rect x="55" y="25" width="5" height="5" fill="black" />
                    <rect x="40" y="35" width="5" height="5" fill="black" />
                    <rect x="45" y="40" width="5" height="5" fill="black" />
                    <rect x="55" y="40" width="5" height="5" fill="black" />
                    <rect x="40" y="50" width="5" height="5" fill="black" />
                    <rect x="50" y="50" width="5" height="5" fill="black" />
                    <rect x="45" y="60" width="5" height="5" fill="black" />
                    <rect x="55" y="60" width="5" height="5" fill="black" />
                    <rect x="70" y="40" width="5" height="5" fill="black" />
                    <rect x="75" y="45" width="5" height="5" fill="black" />
                    <rect x="70" y="55" width="5" height="5" fill="black" />
                    <rect x="80" y="60" width="5" height="5" fill="black" />
                  </svg>
                </div>
                <p className="mt-4 sm:mt-6 text-base sm:text-lg font-semibold text-white">Scan to check in</p>
                <p className="mt-2 text-xs sm:text-sm text-white/80">Elite Fitness Center - Downtown</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-background-secondary py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h2 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Trusted by members and professionals worldwide
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-foreground-secondary">
              From gym owners to fitness enthusiasts, see how Binectics is transforming fitness
            </p>
          </div>

          <div className="mt-12 sm:mt-16 grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                name: 'Sarah Chen',
                role: 'Marathon Runner',
                location: 'Singapore',
                image: '👩🏻‍💼',
                color: 'blue',
                rating: 5,
                text: "I travel for work constantly. Binectics lets me access gyms in 15+ countries with one subscription. Game changer for maintaining my training schedule.",
              },
              {
                name: 'Marcus Johnson',
                role: 'Bodybuilder',
                location: 'Los Angeles, USA',
                image: '👨🏿‍💼',
                color: 'yellow',
                rating: 5,
                text: "Found my coach through Binectics 8 months ago. Down 40lbs and competing in my first show next month. The nutrition tracking integration is incredible.",
              },
              {
                name: 'Priya Patel',
                role: 'Certified Dietician',
                location: 'Mumbai, India',
                image: '👩🏽‍💼',
                color: 'purple',
                rating: 5,
                text: "Binectics transformed my nutrition practice. I manage 50+ clients with custom meal plans, track their progress with journals, and they love the seamless experience.",
              },
              {
                name: 'Alex Rodriguez',
                role: 'CrossFit Athlete',
                location: 'Madrid, Spain',
                image: '👨🏻‍💼',
                color: 'orange',
                rating: 5,
                text: "The QR check-in is so smooth. I visit 3 different boxes depending on my schedule, and everything syncs automatically. No more paper sign-ins!",
              },
              {
                name: 'Jake Martinez',
                role: 'Personal Trainer',
                location: 'Miami, USA',
                image: '👨🏽‍💼',
                color: 'blue',
                rating: 5,
                text: "Went from 12 clients to 45 in 6 months on Binectics. The verification badge builds instant trust, and the client journal feature keeps everyone accountable and motivated.",
              },
              {
                name: 'David Kim',
                role: 'Gym Owner',
                location: 'Seoul, South Korea',
                image: '👨🏻‍💼',
                color: 'yellow',
                rating: 5,
                text: "Switched our entire facility to Binectics. Member retention up 35%, admin work down by half. The analytics dashboard shows exactly what's working.",
              },
            ].map((testimonial, index) => (
              <div
                key={index}
                className="group relative rounded-2xl sm:rounded-3xl bg-background p-5 sm:p-8 shadow-card transition-shadow duration-300 hover:shadow-xl"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`flex h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-accent-${testimonial.color}-100 text-2xl sm:text-3xl`}>
                    {testimonial.image}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm sm:text-base text-foreground truncate">{testimonial.name}</h3>
                        <p className="text-xs sm:text-sm text-foreground-secondary">{testimonial.role}</p>
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <svg key={i} className="h-3 w-3 sm:h-4 sm:w-4 text-accent-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-foreground-tertiary">{testimonial.location}</p>
                  </div>
                </div>
                <blockquote className="mt-4 sm:mt-6 text-sm leading-relaxed text-foreground-secondary">
                  "{testimonial.text}"
                </blockquote>
              </div>
            ))}
          </div>

          {/* Trust Metrics */}
          <div className="mt-12 sm:mt-16 lg:mt-20 rounded-2xl sm:rounded-3xl bg-neutral-100 px-6 py-8 sm:px-8 sm:py-12">
            <div className="grid gap-6 sm:gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="font-display text-3xl sm:text-4xl font-bold text-foreground">4.9/5</div>
                <div className="mt-2 flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 sm:h-5 sm:w-5 text-accent-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div className="mt-2 text-xs sm:text-sm text-foreground-secondary">Average rating</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl sm:text-4xl font-bold text-foreground">10,000+</div>
                <div className="mt-2 text-xs sm:text-sm text-foreground-secondary">Active members</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl sm:text-4xl font-bold text-foreground">50+</div>
                <div className="mt-2 text-xs sm:text-sm text-foreground-secondary">Countries served</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Verification Section */}
      <section className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-4 py-2">
              <svg className="h-5 w-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-semibold text-primary-600">Verified & Trusted</span>
            </div>
            <h2 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Every professional is verified
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-foreground-secondary">
              We ensure safety and quality through rigorous verification processes
            </p>
          </div>

          <div className="mt-12 sm:mt-16 grid gap-6 sm:gap-8 md:grid-cols-3">
            {[
              {
                title: 'Identity Verification',
                description: 'Government-issued ID verification for all professionals. We validate identity documents to ensure authenticity.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                  </svg>
                ),
                step: '01',
              },
              {
                title: 'Credential Check',
                description: 'Professional certifications, training credentials, and qualifications verified by our team.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                ),
                step: '02',
              },
              {
                title: 'Business Validation',
                description: 'For gyms: business registration, facility licenses, and insurance documentation verified.',
                icon: (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                ),
                step: '03',
              },
            ].map((item, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl sm:rounded-2xl bg-background p-6 sm:p-8 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="absolute right-3 top-3 sm:right-4 sm:top-4 text-4xl sm:text-6xl font-black text-neutral-200 opacity-50">
                  {item.step}
                </div>
                <div className="relative">
                  <div className="mb-3 sm:mb-4 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-primary-100 text-primary-600">
                    {item.icon}
                  </div>
                  <h3 className="mb-2 sm:mb-3 font-display text-lg sm:text-xl font-bold text-foreground">
                    {item.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground-secondary">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Verification Badge Preview */}
          <div className="mt-12 sm:mt-16 overflow-hidden rounded-2xl sm:rounded-3xl bg-primary-500 p-8 sm:p-12 text-center">
            <div className="mx-auto max-w-2xl">
              <div className="mb-4 sm:mb-6 flex justify-center">
                <div className="rounded-full bg-foreground p-3 sm:p-4">
                  <svg className="h-10 w-10 sm:h-12 sm:w-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <h3 className="font-display text-xl font-black text-foreground sm:text-2xl lg:text-3xl">
                Look for the Verified Badge
              </h3>
              <p className="mt-3 sm:mt-4 text-sm sm:text-base text-foreground-secondary">
                All verified professionals display this badge on their profile. It means they've completed our full verification process and meet our standards for safety and quality.
              </p>
              <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-foreground-secondary">
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>ID Verified</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Credentials Checked</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Background Reviewed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h2 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl">
              Frequently asked questions
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground-secondary">
              Everything you need to know about using Binectics
            </p>
          </div>

          <div className="mt-12">
            <Accordion items={faqItems} />
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-foreground-secondary">
              Have more questions?{' '}
              <Link href="/contact" className="font-medium text-primary-500 hover:text-primary-600">
                Contact our support team
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* For Professionals - Tabbed Section */}
      <ProfessionalsTab />

      {/* CTA Section */}
      <section className="bg-background-secondary py-16 sm:py-20 lg:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-2xl sm:rounded-3xl bg-primary-500 px-6 py-12 sm:px-12 sm:py-16 lg:py-20">
            <h2 className="font-display text-2xl font-black leading-tight text-foreground sm:text-3xl lg:text-4xl xl:text-5xl">
              Join 10,000+ members worldwide
            </h2>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg leading-relaxed text-foreground-secondary">
              Access gyms and fitness pros anywhere. No credit card required to start.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col items-center gap-4 sm:gap-6">
              <Link
                href="/register"
                className="inline-flex min-h-[44px] h-12 sm:h-14 items-center justify-center rounded-lg bg-white px-6 sm:px-8 text-sm sm:text-base font-semibold text-foreground shadow-lg transition-colors duration-200 hover:bg-neutral-50 active:bg-neutral-100 w-full sm:w-auto"
              >
                Explore Free
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <a
                  href="#"
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground/10 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-colors duration-200 hover:bg-foreground/20 active:bg-foreground/30"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                  </svg>
                  App Store
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground/10 px-4 py-2 text-sm font-medium text-foreground backdrop-blur-sm transition-colors duration-200 hover:bg-foreground/20 active:bg-foreground/30"
                >
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  Google Play
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
