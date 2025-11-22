import Link from 'next/link';

export default function RegisterPage() {
  const roles = [
    {
      id: 'user',
      title: 'Fitness Enthusiast',
      description: 'Find gyms, trainers, and dieticians worldwide',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: 'blue',
      href: '/register/user',
      features: [
        'Access 500+ gyms globally',
        'Book trainers & dieticians',
        'Track your progress',
        'QR check-in at gyms',
      ],
    },
    {
      id: 'gym-owner',
      title: 'Gym Owner',
      description: 'List your gym and grow your membership',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h2m0 0v4m0-4h2m12 0h2m0 0v4m0-4h-2m-8-4v12m0-12h4v12h-4z M7 10h10M7 14h10" />
        </svg>
      ),
      color: 'blue',
      href: '/register/gym-owner',
      features: [
        'QR check-in system',
        'Manage memberships',
        'Business analytics',
        'Reach 10K+ members',
      ],
    },
    {
      id: 'trainer',
      title: 'Personal Trainer',
      description: 'Build your brand and grow your client base',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z M16 8a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      ),
      color: 'yellow',
      href: '/register/trainer',
      features: [
        'Verified trainer badge',
        'Sell training programs',
        'Client progress journals',
        'Get discovered globally',
      ],
    },
    {
      id: 'dietician',
      title: 'Dietician',
      description: 'Help clients achieve their nutrition goals',
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13c-2.21 0-4-1.79-4-4m4 4c2.21 0 4-1.79 4-4m-9 13h10M3 21h18" />
        </svg>
      ),
      color: 'purple',
      href: '/register/dietician',
      features: [
        'Verified credentials',
        'Custom meal plans',
        'Track client progress',
        'Build your practice',
      ],
    },
  ];

  const colorClasses = {
    blue: {
      bg: 'bg-accent-blue-100',
      icon: 'text-accent-blue-600',
      button: 'bg-accent-blue-500 hover:bg-accent-blue-600 text-white',
      border: 'border-accent-blue-200 hover:border-accent-blue-500',
    },
    yellow: {
      bg: 'bg-accent-yellow-100',
      icon: 'text-accent-yellow-600',
      button: 'bg-accent-yellow-500 hover:bg-accent-yellow-600 text-foreground',
      border: 'border-accent-yellow-200 hover:border-accent-yellow-500',
    },
    purple: {
      bg: 'bg-accent-purple-100',
      icon: 'text-accent-purple-600',
      button: 'bg-accent-purple-500 hover:bg-accent-purple-600 text-white',
      border: 'border-accent-purple-200 hover:border-accent-purple-500',
    },
  };

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Header */}
      <header className="border-b border-neutral-300 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500">
                <span className="text-xl font-bold text-white">B</span>
              </div>
              <span className="font-display text-xl font-bold text-foreground">
                Binectics
              </span>
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-foreground-secondary transition-colors hover:text-accent-blue-500"
            >
              Already have an account? <span className="font-semibold text-foreground">Sign in</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-12 sm:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center">
            <h1 className="font-display text-3xl font-black leading-tight text-foreground sm:text-4xl lg:text-5xl">
              Join Binectics
            </h1>
            <p className="mt-4 text-base sm:text-lg text-foreground-secondary">
              Choose the account type that best describes you
            </p>
          </div>

          {/* Role Cards */}
          <div className="mt-12 grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => {
              const colors = colorClasses[role.color as keyof typeof colorClasses];

              return (
                <div
                  key={role.id}
                  className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 ${colors.border} bg-background p-6 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
                >
                  {/* Icon */}
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl ${colors.bg} ${colors.icon}`}>
                    {role.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="mb-2 font-display text-xl font-bold text-foreground">
                      {role.title}
                    </h3>
                    <p className="text-sm text-foreground-secondary">
                      {role.description}
                    </p>

                    {/* Features */}
                    <ul className="mt-6 space-y-2">
                      {role.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-foreground-secondary">
                          <svg className="h-5 w-5 flex-shrink-0 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <Link
                    href={role.href}
                    className={`mt-6 inline-flex h-12 items-center justify-center rounded-lg ${colors.button} text-sm font-semibold transition-colors duration-200`}
                  >
                    Get Started
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 rounded-2xl bg-neutral-100 px-6 py-8 sm:px-8">
            <div className="grid gap-6 sm:grid-cols-3 text-center">
              <div>
                <div className="font-display text-3xl font-bold text-foreground">500+</div>
                <div className="mt-1 text-sm text-foreground-secondary">Gyms worldwide</div>
              </div>
              <div>
                <div className="font-display text-3xl font-bold text-foreground">10K+</div>
                <div className="mt-1 text-sm text-foreground-secondary">Active members</div>
              </div>
              <div>
                <div className="font-display text-3xl font-bold text-foreground">50+</div>
                <div className="mt-1 text-sm text-foreground-secondary">Countries</div>
              </div>
            </div>
          </div>

          {/* Footer Text */}
          <p className="mt-8 text-center text-sm text-foreground-tertiary">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="text-accent-blue-500 hover:text-accent-blue-600">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-accent-blue-500 hover:text-accent-blue-600">
              Privacy Policy
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
