import Link from 'next/link';

export default function PartnersPage() {
  const benefits = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Access to Global Members',
      description: 'Reach 10,000+ active fitness enthusiasts across 50+ countries',
      color: 'accent-blue',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Data & Analytics',
      description: 'Powerful insights into member behavior, trends, and performance',
      color: 'accent-yellow',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Seamless Payments',
      description: 'Automated billing, subscriptions, and revenue management',
      color: 'accent-purple',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      title: 'Marketing Support',
      description: 'Co-marketing opportunities and promotional campaigns',
      color: 'primary',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      title: 'Dedicated Support',
      description: '24/7 partner success team to help you grow',
      color: 'accent-blue',
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Trust & Verification',
      description: 'Verified badge builds credibility and member trust',
      color: 'accent-yellow',
    },
  ];

  const partnerTypes = [
    {
      title: 'Gym & Fitness Centers',
      description: 'From boutique studios to large chains, join our network and attract new members',
      features: ['QR check-in system', 'Member management', 'Revenue analytics', 'Multi-location support'],
      cta: 'Become a Gym Partner',
      href: '/register/gym-owner',
    },
    {
      title: 'Personal Trainers',
      description: 'Build your client base and manage your training business on one platform',
      features: ['Verified trainer profile', 'Client booking system', 'Progress tracking', 'Session management'],
      cta: 'Join as a Trainer',
      href: '/register/trainer',
    },
    {
      title: 'Dieticians & Nutritionists',
      description: 'Connect with clients seeking nutrition guidance and meal planning',
      features: ['Professional credentials display', 'Consultation scheduling', 'Meal planning tools', 'Client progress tracking'],
      cta: 'Join as a Dietician',
      href: '/register/dietician',
    },
  ];

  const testimonials = [
    {
      quote: "Joining Binectics was the best decision for our gym chain. We've seen a 40% increase in memberships and member retention has never been better.",
      author: 'David Kim',
      role: 'Owner, Elite Fitness Centers',
      location: 'Seoul, South Korea',
    },
    {
      quote: "The platform made it so easy to grow my personal training business. I went from 10 clients to over 50 in just 6 months.",
      author: 'Jake Martinez',
      role: 'Certified Personal Trainer',
      location: 'Miami, USA',
    },
    {
      quote: "As a dietician, Binectics gave me the tools to manage my practice efficiently while reaching clients worldwide.",
      author: 'Priya Patel',
      role: 'Registered Dietician',
      location: 'Mumbai, India',
    },
  ];

  return (
    <div className="min-h-screen bg-background-secondary">{/* Hero Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl font-black text-foreground sm:text-5xl lg:text-6xl">
            Partner with Binectics
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-foreground-secondary leading-relaxed">
            Join the world's largest fitness ecosystem. Grow your business, reach new clients, and transform the way people experience fitness.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-neutral-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="font-display text-4xl font-black text-primary-500">500+</div>
              <div className="mt-2 text-sm text-foreground-secondary">Partner Gyms</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl font-black text-primary-500">10K+</div>
              <div className="mt-2 text-sm text-foreground-secondary">Active Members</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl font-black text-primary-500">50+</div>
              <div className="mt-2 text-sm text-foreground-secondary">Countries</div>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl font-black text-primary-500">4.9★</div>
              <div className="mt-2 text-sm text-foreground-secondary">Partner Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Why Partner with Us
            </h2>
            <p className="mt-4 text-lg text-foreground-secondary">
              Everything you need to succeed in one platform
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="rounded-2xl bg-neutral-100 p-6 shadow-card">
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-${benefit.color}-100 text-${benefit.color}-600`}>
                  {benefit.icon}
                </div>
                <h3 className="font-bold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-foreground-secondary leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Choose Your Partnership
            </h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {partnerTypes.map((type, index) => (
              <div key={index} className="rounded-2xl bg-background p-8 shadow-card">
                <h3 className="font-display text-2xl font-bold text-foreground mb-3">
                  {type.title}
                </h3>
                <p className="text-foreground-secondary mb-6 leading-relaxed">
                  {type.description}
                </p>
                <ul className="space-y-3 mb-8">
                  {type.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <svg className="h-5 w-5 flex-shrink-0 text-primary-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-foreground-secondary">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={type.href}
                  className="flex h-12 items-center justify-center rounded-lg bg-primary-500 text-white font-semibold transition-colors duration-200 hover:bg-primary-600"
                >
                  {type.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Partner Success Stories
            </h2>
          </div>
          <div className="grid gap-8 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="rounded-2xl bg-neutral-100 p-8 shadow-card">
                <blockquote className="text-foreground-secondary leading-relaxed mb-6">
                  "{testimonial.quote}"
                </blockquote>
                <div>
                  <div className="font-bold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-foreground-secondary">{testimonial.role}</div>
                  <div className="text-sm text-foreground-tertiary">{testimonial.location}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-500 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl">
            Ready to Join Our Partner Network?
          </h2>
          <p className="mt-4 text-lg text-foreground-secondary">
            Start growing your business with Binectics today
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-background px-8 text-base font-semibold text-foreground shadow-lg transition-colors duration-200 hover:bg-neutral-50"
            >
              Become a Partner
            </Link>
            <a
              href="mailto:partners@binectics.com"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-foreground/10 backdrop-blur-sm px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-foreground/20"
            >
              Contact Partnership Team
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
}
