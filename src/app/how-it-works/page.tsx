import Link from 'next/link';

export default function HowItWorksPage() {
  const steps = [
    {
      number: '01',
      title: 'Create Your Account',
      description: 'Sign up in under 2 minutes. Choose your role: fitness enthusiast, gym owner, trainer, or dietician.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      number: '02',
      title: 'Get Verified',
      description: 'Upload your ID and complete our quick verification process. Professionals submit credentials and certifications.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      number: '03',
      title: 'Choose Your Plan',
      description: 'Select from flexible membership options. Monthly or annual plans with access to global gyms and professionals.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      number: '04',
      title: 'Start Your Journey',
      description: 'Use QR codes to check in, book trainers, track workouts, and connect with the global fitness community.',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
  ];

  const userJourney = [
    {
      title: 'Find a Gym',
      description: 'Search gyms by location, amenities, and ratings. Filter by equipment, classes, and hours.',
      color: 'bg-accent-blue-500',
    },
    {
      title: 'Check In with QR',
      description: 'Scan your unique QR code at the entrance. No membership cards, no hassle.',
      color: 'bg-accent-yellow-500',
    },
    {
      title: 'Book a Trainer',
      description: 'Browse certified trainers by specialty, ratings, and availability. Book sessions instantly.',
      color: 'bg-accent-purple-500',
    },
    {
      title: 'Track Progress',
      description: 'Log workouts, track nutrition, and monitor your fitness journey with integrated tools.',
      color: 'bg-primary-500',
    },
  ];

  const professionalJourney = [
    {
      role: 'Gym Owners',
      steps: [
        'List your facility with photos and amenities',
        'Set membership pricing and class schedules',
        'Track attendance with QR check-ins',
        'Manage billing and member communications',
        'Access business analytics and insights',
      ],
      color: 'accent-blue',
    },
    {
      role: 'Trainers',
      steps: [
        'Create a verified professional profile',
        'Showcase certifications and specialties',
        'Set your rates and availability',
        'Manage client bookings and sessions',
        'Log client progress and workout journals',
      ],
      color: 'accent-yellow',
    },
    {
      role: 'Dieticians',
      steps: [
        'Display your credentials and experience',
        'Offer custom meal plans and consultations',
        'Set flexible pricing for services',
        'Track client nutrition goals',
        'Build long-term client relationships',
      ],
      color: 'accent-purple',
    },
  ];

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Hero Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl font-black text-foreground sm:text-5xl lg:text-6xl">
            How Binectics Works
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-foreground-secondary leading-relaxed">
            Your complete guide to getting started with the world's largest fitness ecosystem.
            Simple steps, powerful results.
          </p>
        </div>
      </section>

      {/* Main Steps */}
      <section className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl lg:text-5xl">
              Get Started in 4 Simple Steps
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative rounded-2xl bg-background p-6 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="absolute -top-4 left-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500 text-white shadow-lg">
                    {step.icon}
                  </div>
                </div>
                <div className="mt-8">
                  <div className="text-sm font-bold text-primary-500 mb-2">
                    STEP {step.number}
                  </div>
                  <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground-secondary">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Journey */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl lg:text-5xl">
              The Member Experience
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              From discovery to achievement, we've got you covered
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {userJourney.map((item, index) => (
              <div key={index} className="text-center">
                <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${item.color}`}>
                  <span className="text-2xl font-black text-white">{index + 1}</span>
                </div>
                <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-foreground-secondary">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Professional Journeys */}
      <section className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl lg:text-5xl">
              For Fitness Professionals
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              Everything you need to grow your business
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {professionalJourney.map((professional, index) => (
              <div
                key={index}
                className="rounded-2xl bg-background p-8 shadow-card"
              >
                <h3 className={`mb-6 font-display text-2xl font-black text-foreground`}>
                  {professional.role}
                </h3>
                <ul className="space-y-4">
                  {professional.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start gap-3">
                      <svg
                        className={`h-6 w-6 flex-shrink-0 text-${professional.color}-500`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-foreground-secondary leading-relaxed">
                        {step}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl lg:text-5xl">
                Powered by cutting-edge technology
              </h2>
              <p className="mt-6 text-lg text-foreground-secondary leading-relaxed">
                Binectics uses advanced QR technology, secure payment processing, and real-time
                analytics to deliver a seamless fitness experience across all platforms.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                    <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Bank-Level Security</h3>
                    <p className="text-sm text-foreground-secondary">256-bit encryption and PCI-DSS compliance</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                    <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Cloud Sync</h3>
                    <p className="text-sm text-foreground-secondary">Your data syncs across all devices instantly</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                    <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Mobile First</h3>
                    <p className="text-sm text-foreground-secondary">Native iOS and Android apps for on-the-go access</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-primary-500 to-accent-blue-500 p-12 text-center shadow-2xl">
              <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-3xl bg-white/20 backdrop-blur">
                <svg className="h-20 w-20 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="font-display text-3xl font-black text-white">
                Scan. Train. Grow.
              </h3>
              <p className="mt-4 text-lg text-white/90">
                Your entire fitness journey, accessible with a single QR code
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-500 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
            Ready to transform your fitness journey?
          </h2>
          <p className="mt-4 text-lg text-foreground-secondary">
            Join 10,000+ members and 500+ gyms worldwide
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-background px-8 text-base font-semibold text-foreground shadow-lg transition-colors duration-200 hover:bg-neutral-50"
            >
              Get Started Free
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-foreground/10 backdrop-blur-sm px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-foreground/20"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
