import Link from 'next/link';

export default function AboutPage() {
  const stats = [
    { value: '500+', label: 'Gyms Worldwide' },
    { value: '10K+', label: 'Active Members' },
    { value: '50+', label: 'Countries' },
    { value: '4.9/5', label: 'Average Rating' },
  ];

  const values = [
    {
      title: 'Global Access',
      description: 'One subscription works everywhere. From Tokyo to Toronto, your fitness never stops.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Verified Professionals',
      description: 'Every gym, trainer, and dietician is verified with credentials and background checks.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      title: 'Seamless Technology',
      description: 'QR check-ins, progress tracking, and integrated payments make fitness effortless.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      title: 'Community First',
      description: 'Built by fitness enthusiasts, for fitness enthusiasts. Your success is our mission.',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
  ];

  const team = [
    {
      name: 'Mission',
      title: 'What We Believe',
      description: 'Fitness should be accessible to everyone, everywhere. We\'re breaking down barriers and connecting the global fitness community.',
    },
    {
      name: 'Vision',
      title: 'Where We\'re Going',
      description: 'To become the world\'s largest fitness ecosystem, empowering millions to achieve their health goals through verified professionals and cutting-edge technology.',
    },
    {
      name: 'Commitment',
      title: 'Our Promise',
      description: 'Safety, quality, and trust. Every professional is verified, every gym is validated, and every member is protected.',
    },
  ];

  return (
    <div className="min-h-screen bg-background-secondary">{/* Hero Section */}
      <section className="bg-background py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl font-black text-foreground sm:text-5xl lg:text-6xl">
            Your global fitness ecosystem
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-foreground-secondary leading-relaxed">
            Binectics connects verified gyms, certified trainers, and expert dieticians worldwide.
            One platform, unlimited possibilities, 50+ countries.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-neutral-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-display text-4xl sm:text-5xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="mt-2 text-sm sm:text-base text-foreground-secondary">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl lg:text-5xl">
              Our Story
            </h2>
          </div>
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-foreground-secondary leading-relaxed">
              Binectics was born from a simple frustration: finding quality fitness services while traveling
              shouldn't be complicated. Our founders, fitness enthusiasts who frequently traveled for work,
              struggled to maintain their training routines across different cities and countries.
            </p>
            <p className="mt-6 text-lg text-foreground-secondary leading-relaxed">
              We envisioned a world where your gym membership, personal trainer, and nutrition coach
              traveled with you. Where verification badges meant something. Where QR codes replaced
              membership cards. Where one subscription opened doors to fitness facilities worldwide.
            </p>
            <p className="mt-6 text-lg text-foreground-secondary leading-relaxed">
              Today, Binectics serves over 10,000 members across 50+ countries, connecting them with
              500+ verified gyms and hundreds of certified professionals. We're just getting started.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-neutral-100 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-black text-foreground sm:text-4xl lg:text-5xl">
              What Drives Us
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <div
                key={index}
                className="rounded-2xl bg-background p-6 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary-600">
                  {value.icon}
                </div>
                <h3 className="mb-3 font-display text-xl font-bold text-foreground">
                  {value.title}
                </h3>
                <p className="text-sm leading-relaxed text-foreground-secondary">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission, Vision, Commitment */}
      <section className="bg-background py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            {team.map((item, index) => (
              <div key={index} className="text-center lg:text-left">
                <h3 className="mb-3 font-display text-2xl font-black text-foreground">
                  {item.name}
                </h3>
                <p className="mb-4 text-sm font-semibold text-primary-500 uppercase tracking-wider">
                  {item.title}
                </p>
                <p className="text-base leading-relaxed text-foreground-secondary">
                  {item.description}
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
            Join the global fitness community
          </h2>
          <p className="mt-4 text-lg text-foreground-secondary">
            Start your journey with Binectics today
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-background px-8 text-base font-semibold text-foreground shadow-lg transition-colors duration-200 hover:bg-neutral-50"
            >
              Get Started Free
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-lg bg-foreground/10 backdrop-blur-sm px-8 text-base font-semibold text-foreground transition-colors duration-200 hover:bg-foreground/20"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
}
