import Link from 'next/link';

export const metadata = {
  title: 'Gym Memberships - Binectics',
  description: 'Access 500+ premium gyms worldwide with a single Binectics membership.',
};

export default function GymMembershipsPage() {
  const membershipTiers = [
    {
      name: 'Essential',
      price: '$29',
      period: '/month',
      gyms: '100+ gyms',
      description: 'Perfect for casual gym-goers',
      features: [
        'Access to 100+ partner gyms',
        'Basic gym equipment',
        'Locker room access',
        'Mobile app check-in',
        'Guest pass (1/month)',
      ],
      highlighted: false,
    },
    {
      name: 'Premium',
      price: '$49',
      period: '/month',
      gyms: '300+ gyms',
      description: 'For serious fitness enthusiasts',
      features: [
        'Everything in Essential',
        'Access to 300+ premium gyms',
        'Group classes included',
        'Pool & sauna access',
        'Guest passes (3/month)',
        'Priority gym access',
      ],
      highlighted: true,
    },
    {
      name: 'Elite',
      price: '$79',
      period: '/month',
      gyms: '500+ gyms',
      description: 'Ultimate fitness freedom',
      features: [
        'Everything in Premium',
        'All 500+ gyms worldwide',
        'Unlimited guest passes',
        'Personal training discount (20%)',
        'Nutrition consultation included',
        'VIP gym access',
        'Home gym equipment rental',
      ],
      highlighted: false,
    },
  ];

  const gymTypes = [
    {
      name: 'Traditional Fitness Centers',
      description: 'Full-service gyms with cardio, weights, and group classes',
      icon: '🏋️',
      count: '250+ locations',
      amenities: ['Cardio equipment', 'Free weights', 'Machines', 'Locker rooms'],
    },
    {
      name: 'Boutique Studios',
      description: 'Specialized studios for yoga, pilates, cycling, and more',
      icon: '🧘',
      count: '120+ locations',
      amenities: ['Yoga', 'Pilates', 'Spin classes', 'HIIT'],
    },
    {
      name: 'CrossFit & Functional Gyms',
      description: 'High-intensity functional training facilities',
      icon: '⚡',
      count: '80+ locations',
      amenities: ['CrossFit boxes', 'Olympic lifting', 'Functional training', 'Competition prep'],
    },
    {
      name: '24/7 Access Gyms',
      description: 'Round-the-clock access for flexible schedules',
      icon: '🕐',
      count: '90+ locations',
      amenities: ['24/7 access', 'Keycard entry', 'Security monitored', 'Self-service'],
    },
    {
      name: 'Luxury Wellness Clubs',
      description: 'Premium facilities with spa and recovery amenities',
      icon: '✨',
      count: '40+ locations',
      amenities: ['Spa', 'Sauna & steam', 'Massage therapy', 'Premium equipment'],
    },
    {
      name: 'Climbing & Adventure Gyms',
      description: 'Indoor climbing walls and adventure fitness',
      icon: '🧗',
      count: '20+ locations',
      amenities: ['Bouldering walls', 'Sport climbing', 'Ninja courses', 'Training areas'],
    },
  ];

  const globalCoverage = [
    { region: 'North America', gyms: 180, countries: ['USA', 'Canada', 'Mexico'], flag: '🌎' },
    { region: 'Europe', gyms: 150, countries: ['UK', 'Germany', 'France', 'Spain'], flag: '🌍' },
    { region: 'Asia Pacific', gyms: 120, countries: ['Japan', 'Singapore', 'Australia'], flag: '🌏' },
    { region: 'Middle East', gyms: 30, countries: ['UAE', 'Saudi Arabia'], flag: '🕌' },
    { region: 'South America', gyms: 20, countries: ['Brazil', 'Argentina'], flag: '🌎' },
  ];

  const benefits = [
    {
      title: 'One Membership, Unlimited Gyms',
      description: 'Access hundreds of gyms worldwide with a single membership',
      icon: '🌍',
      color: 'bg-accent-blue-500',
    },
    {
      title: 'No Long-Term Contracts',
      description: 'Cancel anytime with no penalties or hidden fees',
      icon: '📋',
      color: 'bg-accent-green-500',
    },
    {
      title: 'QR Code Check-in',
      description: 'Fast, contactless entry at all partner locations',
      icon: '📱',
      color: 'bg-accent-purple-500',
    },
    {
      title: 'Premium Amenities',
      description: 'Pools, saunas, group classes, and more included',
      icon: '⭐',
      color: 'bg-accent-yellow-500',
    },
    {
      title: 'Travel-Friendly',
      description: 'Stay consistent with your workouts wherever you go',
      icon: '✈️',
      color: 'bg-accent-red-500',
    },
    {
      title: 'Cost Effective',
      description: 'Save 50-70% compared to individual gym memberships',
      icon: '💰',
      color: 'bg-neutral-500',
    },
  ];

  const faqs = [
    {
      question: 'Can I visit different gyms on the same day?',
      answer: 'Yes! You can check in to multiple gyms on the same day. There are no limits on how many different gyms you can visit.',
    },
    {
      question: 'What if I travel internationally?',
      answer: 'Your membership works at all Binectics partner gyms worldwide. Check the app to find gyms in your destination before you travel.',
    },
    {
      question: 'Are there any additional fees?',
      answer: 'No hidden fees! Your monthly membership covers gym access. Some gyms may charge separately for premium services like towel rental or personal training.',
    },
    {
      question: 'Can I bring a guest?',
      answer: 'Yes! Each membership tier includes guest passes per month. Check your tier details for the specific number of passes included.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-background-secondary py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">🏢</div>
          <h1 className="font-display text-5xl sm:text-6xl font-black text-foreground mb-6">
            Gym Memberships
          </h1>
          <p className="text-xl text-foreground-secondary mb-8 max-w-3xl mx-auto">
            Break free from single-gym limitations. Access 500+ premium gyms worldwide with one flexible membership. Train anywhere, anytime.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-8 py-3 text-base font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
            >
              Start Free Trial
            </Link>
            <Link
              href="/gyms"
              className="inline-flex items-center justify-center rounded-lg border-2 border-neutral-300 bg-background px-8 py-3 text-base font-semibold text-foreground transition-colors hover:bg-neutral-100"
            >
              Browse Gyms
            </Link>
          </div>
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="rounded-lg bg-background p-4">
              <div className="text-3xl font-black text-primary-500 mb-1">500+</div>
              <div className="text-sm text-foreground-secondary">Partner Gyms</div>
            </div>
            <div className="rounded-lg bg-background p-4">
              <div className="text-3xl font-black text-primary-500 mb-1">50+</div>
              <div className="text-sm text-foreground-secondary">Countries</div>
            </div>
            <div className="rounded-lg bg-background p-4">
              <div className="text-3xl font-black text-primary-500 mb-1">12K+</div>
              <div className="text-sm text-foreground-secondary">Members</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Why Binectics Membership
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${benefit.color} text-white text-2xl mb-4`}>
                  {benefit.icon}
                </div>
                <h3 className="font-bold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-foreground-secondary">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Membership Tiers */}
      <section className="bg-background-secondary py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Choose Your Membership
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {membershipTiers.map((tier, index) => (
              <div
                key={index}
                className={`rounded-lg border-2 bg-background p-6 flex flex-col ${
                  tier.highlighted
                    ? 'border-primary-500 shadow-lg relative'
                    : 'border-neutral-300'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex rounded-full bg-primary-500 px-4 py-1 text-sm font-bold text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                    {tier.name}
                  </h3>
                  <p className="text-sm text-foreground-secondary mb-4">
                    {tier.description}
                  </p>
                  <div className="text-5xl font-black text-foreground mb-2">
                    {tier.price}
                    <span className="text-lg font-normal text-foreground-secondary">{tier.period}</span>
                  </div>
                  <p className="text-sm font-semibold text-primary-500">
                    {tier.gyms}
                  </p>
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2 text-sm text-foreground-secondary">
                      <svg className="h-5 w-5 text-accent-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`block w-full rounded-lg px-4 py-3 text-center font-semibold transition-colors ${
                    tier.highlighted
                      ? 'bg-primary-500 text-foreground shadow-button hover:bg-primary-600'
                      : 'border-2 border-neutral-300 text-foreground hover:bg-neutral-100'
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gym Types */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Types of Gyms Available
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {gymTypes.map((type, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6"
              >
                <div className="text-4xl mb-4">{type.icon}</div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  {type.name}
                </h3>
                <p className="text-foreground-secondary mb-3">
                  {type.description}
                </p>
                <p className="text-sm font-semibold text-primary-500 mb-3">
                  {type.count}
                </p>
                <div className="flex flex-wrap gap-2">
                  {type.amenities.map((amenity, amenityIndex) => (
                    <span
                      key={amenityIndex}
                      className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-foreground-secondary"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Global Coverage */}
      <section className="bg-background-secondary py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Global Coverage
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {globalCoverage.map((region, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6"
              >
                <div className="text-4xl mb-4">{region.flag}</div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  {region.region}
                </h3>
                <p className="text-2xl font-black text-primary-500 mb-3">
                  {region.gyms} gyms
                </p>
                <div className="flex flex-wrap gap-2">
                  {region.countries.map((country, countryIndex) => (
                    <span
                      key={countryIndex}
                      className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-foreground-secondary"
                    >
                      {country}
                    </span>
                  ))}
                  {region.countries.length > 3 && (
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-foreground-secondary">
                      +more
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/countries"
              className="inline-flex items-center gap-2 rounded-lg border-2 border-neutral-300 bg-background px-6 py-3 font-semibold text-foreground transition-colors hover:bg-neutral-100"
            >
              View All Countries
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6"
              >
                <h3 className="font-bold text-foreground mb-3">
                  {faq.question}
                </h3>
                <p className="text-foreground-secondary">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-background-secondary py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-black text-foreground mb-4">
            Ready to Train Anywhere?
          </h2>
          <p className="text-lg text-foreground-secondary mb-8">
            Start your free trial and experience unlimited gym access today
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-8 py-3 text-base font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
          >
            Start 7-Day Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
}
