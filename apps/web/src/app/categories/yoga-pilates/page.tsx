import Link from 'next/link';

export const metadata = {
  title: 'Yoga & Pilates - Binectics',
  description: 'Find inner peace and build core strength with expert yoga and pilates instructors.',
};

export default function YogaPilatesPage() {
  const programs = [
    {
      name: 'Beginner Yoga Flow',
      duration: '6 weeks',
      level: 'Beginner',
      sessions: '2x per week',
      price: '$149',
      description: 'Perfect introduction to yoga. Learn foundational poses, breathing techniques, and mindfulness.',
      features: ['Hatha & Vinyasa basics', 'Breathing exercises', 'Meditation practice', 'Flexibility training'],
    },
    {
      name: 'Pilates Core Power',
      duration: '8 weeks',
      level: 'All Levels',
      sessions: '3x per week',
      price: '$229',
      description: 'Build core strength, improve posture, and enhance body awareness through pilates.',
      features: ['Mat pilates', 'Reformer training', 'Core conditioning', 'Posture correction'],
    },
    {
      name: 'Advanced Yoga Practice',
      duration: '12 weeks',
      level: 'Advanced',
      sessions: '4x per week',
      price: '$349',
      description: 'Deepen your practice with advanced asanas, pranayama, and meditation techniques.',
      features: ['Advanced asanas', 'Arm balances', 'Inversions', 'Pranayama mastery'],
    },
  ];

  const instructors = [
    {
      name: 'Maya Patel',
      specialty: 'Vinyasa Yoga',
      experience: '15 years',
      rating: 5.0,
      reviews: 421,
      location: 'Mumbai, India',
      image: '🧘‍♀️',
      certifications: ['RYT-500', 'Yoga Alliance'],
    },
    {
      name: 'Sophie Laurent',
      specialty: 'Pilates',
      experience: '10 years',
      rating: 4.9,
      reviews: 289,
      location: 'Paris, France',
      image: '🤸‍♀️',
      certifications: ['PMA-CPT', 'BASI Pilates'],
    },
    {
      name: 'Kenji Nakamura',
      specialty: 'Yin Yoga',
      experience: '12 years',
      rating: 4.8,
      reviews: 356,
      location: 'Kyoto, Japan',
      image: '🧘',
      certifications: ['RYT-200', 'Yin Yoga Specialist'],
    },
  ];

  const benefits = [
    {
      title: 'Increased Flexibility',
      description: 'Improve range of motion and reduce muscle tension',
      icon: '🤸',
      color: 'bg-accent-purple-500',
    },
    {
      title: 'Core Strength',
      description: 'Build a strong, stable core for better posture and balance',
      icon: '💪',
      color: 'bg-accent-blue-500',
    },
    {
      title: 'Stress Relief',
      description: 'Reduce stress and anxiety through mindful movement',
      icon: '😌',
      color: 'bg-accent-green-500',
    },
    {
      title: 'Better Posture',
      description: 'Correct imbalances and improve body alignment',
      icon: '🧍',
      color: 'bg-accent-yellow-500',
    },
    {
      title: 'Mind-Body Connection',
      description: 'Enhance awareness of your body and breath',
      icon: '🧠',
      color: 'bg-accent-red-500',
    },
    {
      title: 'Injury Prevention',
      description: 'Strengthen stabilizer muscles and improve mobility',
      icon: '🛡️',
      color: 'bg-neutral-500',
    },
  ];

  const styles = [
    {
      name: 'Vinyasa Yoga',
      description: 'Dynamic, flowing sequences synchronized with breath',
      intensity: 'Medium to High',
      icon: '🌊',
    },
    {
      name: 'Hatha Yoga',
      description: 'Traditional yoga focusing on physical postures and breathing',
      intensity: 'Low to Medium',
      icon: '🕉️',
    },
    {
      name: 'Yin Yoga',
      description: 'Slow-paced, meditative practice with long-held poses',
      intensity: 'Low',
      icon: '☯️',
    },
    {
      name: 'Mat Pilates',
      description: 'Core-focused exercises performed on a mat',
      intensity: 'Medium',
      icon: '🧘‍♀️',
    },
    {
      name: 'Reformer Pilates',
      description: 'Resistance-based pilates using specialized equipment',
      intensity: 'Medium to High',
      icon: '🔧',
    },
    {
      name: 'Hot Yoga',
      description: 'Yoga performed in a heated room for increased flexibility',
      intensity: 'High',
      icon: '🔥',
    },
  ];

  const faqs = [
    {
      question: 'What\'s the difference between yoga and pilates?',
      answer: 'Yoga focuses on flexibility, balance, and mind-body connection through ancient practices. Pilates emphasizes core strength, stability, and precise movements developed in the 20th century. Both complement each other well.',
    },
    {
      question: 'Do I need to be flexible to start yoga?',
      answer: 'No! Yoga helps you become more flexible over time. Everyone starts somewhere, and our beginner classes are designed for all flexibility levels.',
    },
    {
      question: 'What should I bring to a yoga/pilates class?',
      answer: 'Bring a yoga mat (or we can provide one), comfortable clothing that allows movement, water bottle, and a small towel. For pilates, grip socks are recommended.',
    },
    {
      question: 'How often should I practice?',
      answer: 'For best results, practice 2-4 times per week. Consistency is more important than duration. Even 20-30 minutes of daily practice can yield significant benefits.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-background-secondary py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">🧘‍♀️</div>
          <h1 className="font-display text-5xl sm:text-6xl font-black text-foreground mb-6">
            Yoga & Pilates
          </h1>
          <p className="text-xl text-foreground-secondary mb-8 max-w-3xl mx-auto">
            Find balance, build strength, and enhance flexibility with expert yoga and pilates instruction. Connect mind and body through ancient wisdom and modern techniques.
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
            Benefits of Yoga & Pilates
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

      {/* Styles */}
      <section className="bg-background-secondary py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Practice Styles
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {styles.map((style, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6"
              >
                <div className="text-4xl mb-4">{style.icon}</div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  {style.name}
                </h3>
                <p className="text-foreground-secondary mb-3">
                  {style.description}
                </p>
                <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-sm">
                  <span className="text-foreground-secondary">Intensity:</span>
                  <span className="font-semibold text-foreground">{style.intensity}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Programs */}
      <section id="programs" className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Yoga & Pilates Programs
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

      {/* Instructors */}
      <section className="bg-background-secondary py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Expert Instructors
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {instructors.map((instructor, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6"
              >
                <div className="text-center mb-4">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-4xl mb-3">
                    {instructor.image}
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-1">
                    {instructor.name}
                  </h3>
                  <p className="text-sm text-foreground-secondary mb-2">
                    {instructor.specialty}
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-accent-yellow-500">★</span>
                      <span className="font-semibold text-foreground">{instructor.rating}</span>
                    </div>
                    <span className="text-sm text-foreground-secondary">
                      ({instructor.reviews} reviews)
                    </span>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    📍 {instructor.location}
                  </p>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-foreground-secondary">
                    <strong>Experience:</strong> {instructor.experience}
                  </p>
                  <p className="text-sm text-foreground-secondary">
                    <strong>Certifications:</strong> {instructor.certifications.join(', ')}
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
            Begin Your Journey
          </h2>
          <p className="text-lg text-foreground-secondary mb-8">
            Start your yoga or pilates practice today with world-class instructors
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-8 py-3 text-base font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
          >
            Join Binectics Now
          </Link>
        </div>
      </section>
    </div>
  );
}
