import Link from 'next/link';

export const metadata = {
  title: 'Personal Training - Binectics',
  description: 'Work one-on-one with certified personal trainers to achieve your fitness goals faster.',
};

export default function PersonalTrainingPage() {
  const trainers = [
    {
      name: 'Alex Martinez',
      specialty: 'Strength & Conditioning',
      experience: '10 years',
      rating: 4.9,
      reviews: 412,
      location: 'Miami, USA',
      image: '💪',
      rate: '$75/session',
      certifications: ['NSCA-CPT', 'FMS Level 2'],
      expertise: ['Powerlifting', 'Olympic Lifting', 'Injury Prevention'],
    },
    {
      name: 'Lisa Chen',
      specialty: 'Weight Loss & Nutrition',
      experience: '8 years',
      rating: 5.0,
      reviews: 356,
      location: 'Singapore',
      image: '🌟',
      rate: '$80/session',
      certifications: ['ACE-CPT', 'Precision Nutrition L1'],
      expertise: ['Fat Loss', 'Metabolic Conditioning', 'Nutrition Coaching'],
    },
    {
      name: 'Tom Jackson',
      specialty: 'Athletic Performance',
      experience: '12 years',
      rating: 4.8,
      reviews: 489,
      location: 'London, UK',
      image: '🏃',
      rate: '$85/session',
      certifications: ['CSCS', 'USA Track & Field'],
      expertise: ['Speed Training', 'Agility', 'Sports Performance'],
    },
    {
      name: 'Maria Silva',
      specialty: 'Functional Fitness',
      experience: '7 years',
      rating: 4.9,
      reviews: 298,
      location: 'São Paulo, Brazil',
      image: '🤸',
      rate: '$70/session',
      certifications: ['NASM-CPT', 'TRX Certified'],
      expertise: ['Functional Movement', 'Mobility', 'Injury Rehabilitation'],
    },
    {
      name: 'David Kim',
      specialty: 'Bodybuilding',
      experience: '15 years',
      rating: 5.0,
      reviews: 567,
      location: 'Seoul, South Korea',
      image: '🏆',
      rate: '$90/session',
      certifications: ['ISSA-CPT', 'Bodybuilding Coach'],
      expertise: ['Hypertrophy', 'Contest Prep', 'Posing'],
    },
    {
      name: 'Sophie Dubois',
      specialty: 'Seniors & Rehabilitation',
      experience: '9 years',
      rating: 4.9,
      reviews: 321,
      location: 'Paris, France',
      image: '❤️',
      rate: '$65/session',
      certifications: ['ACSM-CPT', 'Geriatric Specialist'],
      expertise: ['Senior Fitness', 'Balance Training', 'Joint Health'],
    },
  ];

  const benefits = [
    {
      title: 'Personalized Programming',
      description: 'Workouts designed specifically for your goals, fitness level, and schedule',
      icon: '📋',
      color: 'bg-accent-blue-500',
    },
    {
      title: 'Expert Guidance',
      description: 'Learn proper form and technique to maximize results and prevent injuries',
      icon: '👨‍🏫',
      color: 'bg-accent-green-500',
    },
    {
      title: 'Accountability',
      description: 'Stay motivated with regular sessions and progress tracking',
      icon: '✅',
      color: 'bg-accent-yellow-500',
    },
    {
      title: 'Faster Results',
      description: 'Achieve your goals 2-3x faster with professional coaching',
      icon: '⚡',
      color: 'bg-accent-red-500',
    },
    {
      title: 'Flexible Scheduling',
      description: 'Train on your schedule at any Binectics partner gym',
      icon: '📅',
      color: 'bg-accent-purple-500',
    },
    {
      title: 'Ongoing Support',
      description: 'Get nutrition advice, workout plans, and 24/7 chat support',
      icon: '💬',
      color: 'bg-neutral-500',
    },
  ];

  const packages = [
    {
      name: 'Starter Package',
      sessions: '4 sessions/month',
      price: '$280',
      pricePerSession: '$70/session',
      features: [
        'Initial fitness assessment',
        'Personalized workout plan',
        'Form and technique coaching',
        'Progress tracking',
        'Email support',
      ],
      popular: false,
    },
    {
      name: 'Pro Package',
      sessions: '8 sessions/month',
      price: '$520',
      pricePerSession: '$65/session',
      features: [
        'Everything in Starter',
        'Nutrition guidance',
        'Bi-weekly plan updates',
        'Video form checks',
        'Priority scheduling',
        'WhatsApp support',
      ],
      popular: true,
    },
    {
      name: 'Elite Package',
      sessions: '12 sessions/month',
      price: '$720',
      pricePerSession: '$60/session',
      features: [
        'Everything in Pro',
        'Detailed meal plans',
        'Weekly progress calls',
        'Home workout programs',
        '24/7 chat support',
        'Supplement recommendations',
      ],
      popular: false,
    },
  ];

  const faqs = [
    {
      question: 'How do I book a personal training session?',
      answer: 'Simply browse our certified trainers, select one that matches your goals, and book available time slots directly through the app or website. You can train at any Binectics partner gym.',
    },
    {
      question: 'Can I train with different trainers?',
      answer: 'Yes! You can work with multiple trainers or switch between them. Many clients work with specialists for different aspects of their training (e.g., strength coach + nutrition coach).',
    },
    {
      question: 'What if I need to cancel a session?',
      answer: 'You can cancel or reschedule sessions up to 24 hours in advance at no charge. Cancellations within 24 hours are charged 50% of the session fee.',
    },
    {
      question: 'Do sessions include gym access?',
      answer: 'Yes! All personal training packages include access to Binectics partner gyms. You can train at any location with your trainer.',
    },
  ];

  const specializations = [
    { name: 'Weight Loss', icon: '📉', count: '127 trainers' },
    { name: 'Muscle Building', icon: '💪', count: '156 trainers' },
    { name: 'Athletic Performance', icon: '🏃', count: '89 trainers' },
    { name: 'Functional Fitness', icon: '🤸', count: '112 trainers' },
    { name: 'Seniors & Rehabilitation', icon: '❤️', count: '67 trainers' },
    { name: 'Bodybuilding', icon: '🏆', count: '78 trainers' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-background-secondary py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">👨‍🏫</div>
          <h1 className="font-display text-5xl sm:text-6xl font-black text-foreground mb-6">
            Personal Training
          </h1>
          <p className="text-xl text-foreground-secondary mb-8 max-w-3xl mx-auto">
            Transform your fitness with one-on-one coaching from certified personal trainers. Get personalized programs, expert guidance, and accountability to reach your goals faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-8 py-3 text-base font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
            >
              Browse Trainers
            </Link>
            <Link
              href="#packages"
              className="inline-flex items-center justify-center rounded-lg border-2 border-neutral-300 bg-background px-8 py-3 text-base font-semibold text-foreground transition-colors hover:bg-neutral-100"
            >
              View Packages
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Why Choose Personal Training
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

      {/* Specializations */}
      <section className="bg-background-secondary py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Training Specializations
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {specializations.map((spec, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6 hover:border-primary-500 transition-colors cursor-pointer"
              >
                <div className="text-4xl mb-3">{spec.icon}</div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  {spec.name}
                </h3>
                <p className="text-sm text-foreground-secondary">
                  {spec.count}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Trainers */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Featured Trainers
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {trainers.map((trainer, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6"
              >
                <div className="text-center mb-4">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-4xl mb-3">
                    {trainer.image}
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-1">
                    {trainer.name}
                  </h3>
                  <p className="text-sm text-foreground-secondary mb-2">
                    {trainer.specialty}
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-accent-yellow-500">★</span>
                      <span className="font-semibold text-foreground">{trainer.rating}</span>
                    </div>
                    <span className="text-sm text-foreground-secondary">
                      ({trainer.reviews} reviews)
                    </span>
                  </div>
                  <p className="text-sm text-foreground-secondary mb-2">
                    📍 {trainer.location}
                  </p>
                  <p className="text-lg font-bold text-primary-500">
                    {trainer.rate}
                  </p>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-foreground-secondary">
                    <strong>Experience:</strong> {trainer.experience}
                  </p>
                  <p className="text-sm text-foreground-secondary">
                    <strong>Certifications:</strong> {trainer.certifications.join(', ')}
                  </p>
                  <p className="text-sm text-foreground-secondary">
                    <strong>Expertise:</strong> {trainer.expertise.join(', ')}
                  </p>
                </div>
                <Link
                  href="/register"
                  className="block w-full rounded-lg bg-primary-500 px-4 py-2 text-center font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
                >
                  Book Session
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" className="bg-background-secondary py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Training Packages
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg, index) => (
              <div
                key={index}
                className={`rounded-lg border-2 bg-background p-6 flex flex-col ${
                  pkg.popular
                    ? 'border-primary-500 shadow-lg relative'
                    : 'border-neutral-300'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex rounded-full bg-primary-500 px-4 py-1 text-sm font-bold text-white">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                    {pkg.name}
                  </h3>
                  <p className="text-sm text-foreground-secondary mb-4">
                    {pkg.sessions}
                  </p>
                  <div className="text-4xl font-black text-foreground mb-2">
                    {pkg.price}
                    <span className="text-lg font-normal text-foreground-secondary">/month</span>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    {pkg.pricePerSession}
                  </p>
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  {pkg.features.map((feature, featureIndex) => (
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
                    pkg.popular
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
            Ready to Start Training?
          </h2>
          <p className="text-lg text-foreground-secondary mb-8">
            Find your perfect trainer and start your transformation today
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-8 py-3 text-base font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
          >
            Browse All Trainers
          </Link>
        </div>
      </section>
    </div>
  );
}
