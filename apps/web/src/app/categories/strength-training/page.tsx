import Link from 'next/link';

export const metadata = {
  title: 'Strength Training - Binectics',
  description: 'Build muscle and strength with expert trainers and world-class gym facilities.',
};

export default function StrengthTrainingPage() {
  const programs = [
    {
      name: 'Beginner Strength Program',
      duration: '8 weeks',
      level: 'Beginner',
      sessions: '3x per week',
      price: '$199',
      description: 'Perfect for those new to strength training. Learn proper form and build a solid foundation.',
      features: ['Personal trainer guidance', 'Custom workout plan', 'Form coaching', 'Progress tracking'],
    },
    {
      name: 'Powerlifting Fundamentals',
      duration: '12 weeks',
      level: 'Intermediate',
      sessions: '4x per week',
      price: '$299',
      description: 'Master the big three: squat, bench press, and deadlift with expert powerlifting coaches.',
      features: ['Competition prep', 'Advanced techniques', '1-on-1 coaching', 'Nutrition guidance'],
    },
    {
      name: 'Bodybuilding & Hypertrophy',
      duration: '16 weeks',
      level: 'Advanced',
      sessions: '5x per week',
      price: '$399',
      description: 'Build maximum muscle mass with scientifically-backed bodybuilding protocols.',
      features: ['Personalized split', 'Nutrition plan', 'Supplement guidance', 'Contest prep'],
    },
  ];

  const trainers = [
    {
      name: 'Marcus Steel',
      specialty: 'Powerlifting',
      experience: '12 years',
      rating: 4.9,
      reviews: 234,
      location: 'New York, USA',
      image: '💪',
      certifications: ['NSCA-CSCS', 'USA Powerlifting Coach'],
    },
    {
      name: 'Sarah Thompson',
      specialty: 'Olympic Weightlifting',
      experience: '10 years',
      rating: 4.8,
      reviews: 189,
      location: 'London, UK',
      image: '🏋️',
      certifications: ['USAW Level 2', 'CrossFit L3'],
    },
    {
      name: 'James Rodriguez',
      specialty: 'Bodybuilding',
      experience: '15 years',
      rating: 5.0,
      reviews: 312,
      location: 'Los Angeles, USA',
      image: '🦾',
      certifications: ['IFBB Pro', 'ACE-CPT'],
    },
  ];

  const benefits = [
    {
      title: 'Build Muscle Mass',
      description: 'Increase lean muscle tissue and achieve the physique you desire',
      icon: '💪',
      color: 'bg-accent-blue-500',
    },
    {
      title: 'Increase Strength',
      description: 'Get stronger in compound lifts and functional movements',
      icon: '⚡',
      color: 'bg-accent-yellow-500',
    },
    {
      title: 'Boost Metabolism',
      description: 'Build muscle to increase your resting metabolic rate',
      icon: '🔥',
      color: 'bg-accent-red-500',
    },
    {
      title: 'Improve Bone Density',
      description: 'Strengthen bones and reduce risk of osteoporosis',
      icon: '🦴',
      color: 'bg-neutral-500',
    },
    {
      title: 'Enhanced Performance',
      description: 'Improve athletic performance across all activities',
      icon: '🎯',
      color: 'bg-accent-purple-500',
    },
    {
      title: 'Mental Toughness',
      description: 'Build discipline, confidence, and mental resilience',
      icon: '🧠',
      color: 'bg-accent-green-500',
    },
  ];

  const faqs = [
    {
      question: 'How often should I strength train?',
      answer: 'For beginners, 2-3 sessions per week is ideal. Intermediate and advanced lifters can train 4-6 times per week with proper programming and recovery.',
    },
    {
      question: 'Do I need supplements?',
      answer: 'While not necessary, protein powder and creatine can support your training. Focus on whole foods first, then add supplements as needed.',
    },
    {
      question: 'How long until I see results?',
      answer: 'Most people notice strength gains within 2-4 weeks. Visible muscle growth typically takes 6-12 weeks of consistent training and nutrition.',
    },
    {
      question: 'Can I build muscle and lose fat at the same time?',
      answer: 'Yes, especially for beginners. This is called "body recomposition" and requires proper training, nutrition, and recovery.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-neutral-300 bg-background sticky top-0 z-50">
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
              href="/register"
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
            >
              Start Training
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-background-secondary py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">💪</div>
          <h1 className="font-display text-5xl sm:text-6xl font-black text-foreground mb-6">
            Strength Training
          </h1>
          <p className="text-xl text-foreground-secondary mb-8 max-w-3xl mx-auto">
            Transform your body with expert-guided strength training programs. Build muscle, increase strength, and achieve your fitness goals with certified trainers and world-class facilities.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-8 py-3 text-base font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
            >
              Start Free Trial
            </Link>
            <Link
              href="#programs"
              className="inline-flex items-center justify-center rounded-lg border-2 border-neutral-300 bg-background px-8 py-3 text-base font-semibold text-foreground transition-colors hover:bg-neutral-100"
            >
              View Programs
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Benefits of Strength Training
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

      {/* Programs */}
      <section id="programs" className="bg-background-secondary py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Strength Training Programs
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6 flex flex-col"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center rounded-full bg-primary-500 bg-opacity-20 px-3 py-1 text-sm font-semibold text-primary-500">
                    {program.level}
                  </span>
                  <span className="text-2xl font-black text-foreground">
                    {program.price}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  {program.name}
                </h3>
                <p className="text-foreground-secondary mb-4">
                  {program.description}
                </p>
                <div className="flex gap-4 text-sm text-foreground-secondary mb-4">
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {program.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {program.sessions}
                  </span>
                </div>
                <ul className="space-y-2 mb-6 flex-1">
                  {program.features.map((feature, featureIndex) => (
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
                  className="block w-full rounded-lg bg-primary-500 px-4 py-3 text-center font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expert Trainers */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Expert Strength Coaches
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
                  <p className="text-sm text-foreground-secondary">
                    📍 {trainer.location}
                  </p>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-foreground-secondary">
                    <strong>Experience:</strong> {trainer.experience}
                  </p>
                  <p className="text-sm text-foreground-secondary">
                    <strong>Certifications:</strong> {trainer.certifications.join(', ')}
                  </p>
                </div>
                <Link
                  href="/register"
                  className="block w-full rounded-lg border-2 border-neutral-300 px-4 py-2 text-center font-semibold text-foreground transition-colors hover:bg-neutral-100"
                >
                  Book Session
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-background-secondary py-16">
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
      <section className="bg-background py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-black text-foreground mb-4">
            Ready to Get Stronger?
          </h2>
          <p className="text-lg text-foreground-secondary mb-8">
            Start your strength training journey today with expert guidance
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-8 py-3 text-base font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
          >
            Join Binectics Now
          </Link>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
}
