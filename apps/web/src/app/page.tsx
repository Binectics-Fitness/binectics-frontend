import Link from 'next/link';
import { Accordion } from '../components/Accordion';

export default function Home() {
  const faqItems = [
    {
      title: 'What can Binectics do for me?',
      content:
        'Think of Binectics as your fitness passport. Subscribe to gyms and book trainers in over 50 countries—all managed from one app. No more juggling multiple gym memberships or trainer apps.',
    },
    {
      title: 'How do I get started?',
      content:
        'Sign up free, browse gyms and trainers in your area, then subscribe to the plan that fits your goals. Start booking sessions within minutes—no paperwork, no hassle.',
    },
    {
      title: 'What types of services are available?',
      content:
        'Browse gym memberships, personal training sessions, dietician consultations, custom meal plans, and progress tracking. All providers are verified and rated by real members.',
    },
    {
      title: "What's included in a subscription?",
      content:
        'It depends on the provider. Gym subscriptions give you facility access and amenities. Trainer subscriptions include sessions and workout tracking. Dietician plans come with meal planning and regular check-ins.',
    },
    {
      title: 'Can I cancel my subscription anytime?',
      content:
        'Absolutely. Cancel any subscription with one click. Your access stays active until the end of your billing period—no penalties, no questions asked.',
    },
    {
      title: 'How does the QR check-in work?',
      content:
        'Once you subscribe to a gym, you get a QR code in your app. Just scan it at the gym entrance for instant, contactless check-in. No membership cards to carry around.',
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-neutral-300 bg-background-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-background-secondary/95">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500">
                <span className="text-xl font-bold text-white">B</span>
              </div>
              <span className="font-display text-xl font-bold text-foreground">
                Binectics
              </span>
            </div>
            <nav className="hidden gap-8 md:flex">
              <Link
                href="#features"
                className="text-sm font-medium text-foreground-secondary transition-all duration-200 hover:text-accent-blue-500 hover:translate-x-1 inline-block"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-foreground-secondary transition-all duration-200 hover:text-accent-blue-500 hover:translate-x-1 inline-block"
              >
                How it Works
              </Link>
              <Link
                href="#faq"
                className="text-sm font-medium text-foreground-secondary transition-all duration-200 hover:text-accent-blue-500 hover:translate-x-1 inline-block"
              >
                FAQ
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary transition-colors hover:text-accent-blue-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" fillRule="evenodd" d="M6.75 9.003c.41 0 .75-.34.75-.75V4.5H19v16H7.5v-3.75c0-.41-.34-.75-.75-.75s-.75.34-.75.75v4.5c0 .41.34.75.75.75h13c.41 0 .75-.34.75-.75V3.75c0-.41-.34-.75-.75-.75h-13c-.41 0-.75.34-.75.75v4.503c0 .41.34.75.75.75Z" clipRule="evenodd"></path>
                  <path fill="currentColor" fillRule="evenodd" d="m16.52 11.823-3.81-3.71a.754.754 0 0 0-1.06.01c-.29.3-.28.77.01 1.06l2.59 2.53H3.75c-.41 0-.75.34-.75.75s.34.75.75.75h10.37l-2.37 2.43c-.29.3-.28.77.01 1.06.3.29.77.28 1.06-.01l3.71-3.81c.29-.3.28-.77-.01-1.06Z" clipRule="evenodd"></path>
                </svg>
                Sign In
              </Link>
              <Link
                href="/register"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-primary-500 px-6 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600 active:bg-primary-700"
              >
                Join Free
              </Link>
            </div>
          </div>
        </div>
      </header>


      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background-secondary py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h1 className="font-display text-5xl font-black leading-[1.1] text-foreground sm:text-6xl lg:text-7xl">
                Your gym, trainer, and nutritionist—<span className="text-primary-500">all in one platform</span>
              </h1>
              <p className="mt-6 max-w-lg text-xl leading-relaxed text-foreground-secondary">
                Subscribe to gyms worldwide, book certified trainers, and get personalized meal plans—without juggling multiple apps.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                <Link
                  href="/register"
                  className="inline-flex h-14 items-center justify-center rounded-lg bg-primary-500 px-8 text-base font-semibold text-foreground shadow-button transition-colors duration-200 hover:bg-primary-600 active:bg-primary-700"
                >
                  Browse Gyms & Trainers
                </Link>
                <p className="text-sm text-foreground-tertiary animate-fade-in">
                  Join 10,000+ active members
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

      {/* Use Cases Section - Lifestyle Photos */}
      <section id="how-it-works" className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h2 className="font-display text-4xl font-black leading-tight text-foreground sm:text-5xl">
              Work out anywhere—home, gym, or park
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground-secondary">
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
                <div className="relative overflow-hidden rounded-3xl bg-background p-8 shadow-card transition-shadow duration-300 hover:shadow-xl">
                  <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${colorClasses[useCase.color as keyof typeof colorClasses]}`}>
                    {useCase.icon}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{useCase.label}</h3>
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

      {/* Testimonials Section */}
      <section className="bg-background-secondary py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-fade-in">
            <h2 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Trusted by fitness enthusiasts worldwide
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground-secondary">
              See how Binectics is transforming the fitness journey for thousands of members
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                role: 'Yoga Instructor',
                location: 'Mumbai, India',
                image: '👩🏽‍💼',
                color: 'purple',
                rating: 5,
                text: "As an instructor, Binectics helps me manage 50+ clients effortlessly. The progress tracking and meal planning tools save me hours every week.",
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
                name: 'Emma Thompson',
                role: 'Busy Professional',
                location: 'London, UK',
                image: '👩🏼‍💼',
                color: 'blue',
                rating: 5,
                text: "Between my trainer, nutritionist, and gym membership, I used to juggle 4 different apps. Now it's all in one place. Actually sticking to my goals for once!",
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
                className="group relative rounded-3xl bg-background p-8 shadow-card transition-shadow duration-300 hover:shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-accent-${testimonial.color}-100 text-3xl`}>
                    {testimonial.image}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-foreground">{testimonial.name}</h3>
                        <p className="text-sm text-foreground-secondary">{testimonial.role}</p>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <svg key={i} className="h-4 w-4 text-accent-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-foreground-tertiary">{testimonial.location}</p>
                  </div>
                </div>
                <blockquote className="mt-6 text-sm leading-relaxed text-foreground-secondary">
                  "{testimonial.text}"
                </blockquote>
              </div>
            ))}
          </div>

          {/* Trust Metrics */}
          <div className="mt-20 rounded-3xl bg-neutral-100 px-8 py-12">
            <div className="grid gap-8 sm:grid-cols-3">
              <div className="text-center">
                <div className="font-display text-4xl font-bold text-foreground">4.9/5</div>
                <div className="mt-2 flex items-center justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-5 w-5 text-accent-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <div className="mt-2 text-sm text-foreground-secondary">Average rating</div>
              </div>
              <div className="text-center">
                <div className="font-display text-4xl font-bold text-foreground">10,000+</div>
                <div className="mt-2 text-sm text-foreground-secondary">Active members</div>
              </div>
              <div className="text-center">
                <div className="font-display text-4xl font-bold text-foreground">50+</div>
                <div className="mt-2 text-sm text-foreground-secondary">Countries served</div>
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

      {/* CTA Section */}
      <section className="bg-background-secondary py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-primary-500 px-8 py-16 sm:px-12 sm:py-20">
            <h2 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Join 10,000+ members worldwide
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-foreground-secondary">
              Access gyms and fitness pros anywhere. No credit card required to start.
            </p>
            <div className="mt-8 flex flex-col items-center gap-6">
              <Link
                href="/register"
                className="inline-flex h-14 items-center justify-center rounded-lg bg-white px-8 text-base font-semibold text-foreground shadow-lg transition-colors duration-200 hover:bg-neutral-50 active:bg-neutral-100"
              >
                Explore Free
              </Link>
              <div className="flex flex-wrap items-center justify-center gap-4">
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

      {/* Footer */}
      <footer className="border-t border-neutral-300 bg-neutral-200 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500">
                  <span className="text-lg font-bold text-white">B</span>
                </div>
                <span className="font-display text-lg font-bold text-foreground">
                  Binectics
                </span>
              </div>
              <p className="mt-4 text-sm text-foreground-secondary">
                Your global fitness ecosystem connecting gyms, trainers, and wellness enthusiasts.
              </p>
              <div className="mt-6 flex gap-4">
                <a href="#" className="text-foreground-tertiary transition-colors duration-200 hover:text-primary-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="text-foreground-tertiary transition-colors duration-200 hover:text-primary-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="text-foreground-tertiary transition-colors duration-200 hover:text-primary-500">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Popular Categories */}
            <div>
              <h3 className="font-semibold text-foreground">Popular Categories</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link href="#" className="text-foreground-secondary transition-all duration-200 hover:text-primary-500 hover:translate-x-1 inline-block">
                    Strength Training
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground-secondary transition-all duration-200 hover:text-primary-500 hover:translate-x-1 inline-block">
                    Yoga & Pilates
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground-secondary transition-all duration-200 hover:text-primary-500 hover:translate-x-1 inline-block">
                    Nutrition Plans
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground-secondary transition-all duration-200 hover:text-primary-500 hover:translate-x-1 inline-block">
                    Personal Training
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground-secondary transition-all duration-200 hover:text-primary-500 hover:translate-x-1 inline-block">
                    Gym Memberships
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="font-semibold text-foreground">Company</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link href="#" className="text-foreground-secondary transition-all duration-200 hover:text-primary-500 hover:translate-x-1 inline-block">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground-secondary transition-all duration-200 hover:text-primary-500 hover:translate-x-1 inline-block">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground-secondary transition-all duration-200 hover:text-primary-500 hover:translate-x-1 inline-block">
                    Press
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground-secondary transition-all duration-200 hover:text-primary-500 hover:translate-x-1 inline-block">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground-secondary transition-all duration-200 hover:text-primary-500 hover:translate-x-1 inline-block">
                    Partners
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold text-foreground">Support</h3>
              <ul className="mt-4 space-y-3 text-sm">
                <li>
                  <Link href="#" className="text-foreground-secondary transition-all duration-200 hover:text-primary-500 hover:translate-x-1 inline-block">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground-secondary transition-all duration-200 hover:text-primary-500 hover:translate-x-1 inline-block">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground-secondary transition-all duration-200 hover:text-primary-500 hover:translate-x-1 inline-block">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground-secondary transition-all duration-200 hover:text-primary-500 hover:translate-x-1 inline-block">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-foreground-secondary transition-all duration-200 hover:text-primary-500 hover:translate-x-1 inline-block">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 border-t border-neutral-200 pt-8 text-center">
            <p className="text-sm text-foreground-tertiary">
              © 2025 Binectics. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
