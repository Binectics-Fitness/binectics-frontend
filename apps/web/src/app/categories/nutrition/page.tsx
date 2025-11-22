import Link from 'next/link';

export const metadata = {
  title: 'Nutrition Plans - Binectics',
  description: 'Transform your diet with personalized nutrition plans from certified dieticians and nutritionists.',
};

export default function NutritionPage() {
  const programs = [
    {
      name: 'Weight Loss Program',
      duration: '12 weeks',
      level: 'All Levels',
      sessions: 'Weekly check-ins',
      price: '$299',
      description: 'Sustainable weight loss through balanced nutrition and lifestyle changes.',
      features: ['Personalized meal plan', 'Weekly consultations', 'Recipe library', 'Progress tracking'],
    },
    {
      name: 'Muscle Building Nutrition',
      duration: '16 weeks',
      level: 'Intermediate',
      sessions: 'Bi-weekly check-ins',
      price: '$399',
      description: 'Optimize your nutrition for maximum muscle growth and recovery.',
      features: ['High-protein meal plans', 'Supplement guidance', 'Macro tracking', 'Performance nutrition'],
    },
    {
      name: 'Plant-Based Nutrition',
      duration: '8 weeks',
      level: 'All Levels',
      sessions: 'Weekly check-ins',
      price: '$249',
      description: 'Thrive on a plant-based diet with complete nutrition guidance.',
      features: ['Vegan meal plans', 'Nutrient optimization', 'Recipe coaching', 'Transition support'],
    },
  ];

  const dieticians = [
    {
      name: 'Dr. Emily Chen',
      specialty: 'Sports Nutrition',
      experience: '12 years',
      rating: 4.9,
      reviews: 387,
      location: 'San Francisco, USA',
      image: '👩‍⚕️',
      certifications: ['RD', 'CSSD', 'MS Nutrition'],
    },
    {
      name: 'Marco Rossi',
      specialty: 'Weight Management',
      experience: '15 years',
      rating: 5.0,
      reviews: 521,
      location: 'Rome, Italy',
      image: '👨‍⚕️',
      certifications: ['RD', 'CDN', 'Certified Diabetes Educator'],
    },
    {
      name: 'Sarah Williams',
      specialty: 'Plant-Based Nutrition',
      experience: '8 years',
      rating: 4.8,
      reviews: 294,
      location: 'London, UK',
      image: '🥗',
      certifications: ['RD', 'Plant-Based Nutrition Certificate'],
    },
  ];

  const benefits = [
    {
      title: 'Optimized Performance',
      description: 'Fuel your workouts and recovery with proper nutrition',
      icon: '⚡',
      color: 'bg-accent-yellow-500',
    },
    {
      title: 'Weight Management',
      description: 'Achieve and maintain your ideal body composition',
      icon: '⚖️',
      color: 'bg-accent-blue-500',
    },
    {
      title: 'Better Energy',
      description: 'Stable energy levels throughout the day',
      icon: '🔋',
      color: 'bg-accent-green-500',
    },
    {
      title: 'Improved Health',
      description: 'Reduce disease risk and enhance overall wellness',
      icon: '❤️',
      color: 'bg-accent-red-500',
    },
    {
      title: 'Better Digestion',
      description: 'Optimize gut health and nutrient absorption',
      icon: '🦠',
      color: 'bg-accent-purple-500',
    },
    {
      title: 'Mental Clarity',
      description: 'Enhanced focus and cognitive function',
      icon: '🧠',
      color: 'bg-neutral-500',
    },
  ];

  const specializations = [
    {
      name: 'Sports Nutrition',
      description: 'Performance optimization for athletes and active individuals',
      icon: '🏃‍♀️',
    },
    {
      name: 'Weight Loss',
      description: 'Evidence-based strategies for sustainable fat loss',
      icon: '📉',
    },
    {
      name: 'Muscle Gain',
      description: 'Nutrition protocols for building lean muscle mass',
      icon: '💪',
    },
    {
      name: 'Plant-Based',
      description: 'Complete nutrition on vegan and vegetarian diets',
      icon: '🌱',
    },
    {
      name: 'Gut Health',
      description: 'Optimize digestive health and microbiome',
      icon: '🦋',
    },
    {
      name: 'Disease Prevention',
      description: 'Nutrition for heart health, diabetes, and more',
      icon: '🏥',
    },
  ];

  const faqs = [
    {
      question: 'Do I need to count calories?',
      answer: 'Not necessarily. While some programs use calorie tracking, many focus on portion control, food quality, and intuitive eating. Your dietician will recommend the best approach for your goals and lifestyle.',
    },
    {
      question: 'Can I still eat foods I enjoy?',
      answer: 'Absolutely! Our nutrition programs focus on balance and sustainability. No foods are off-limits. We teach you how to enjoy your favorite foods in moderation while meeting your goals.',
    },
    {
      question: 'How quickly will I see results?',
      answer: 'Most clients notice improved energy within 1-2 weeks. Physical changes like weight loss or muscle gain typically become visible in 4-6 weeks with consistent adherence.',
    },
    {
      question: 'Do I need supplements?',
      answer: 'Supplements are optional and personalized to your needs. Your dietician will assess your diet and recommend only necessary supplements, if any.',
    },
  ];

  const process = [
    {
      step: 1,
      title: 'Initial Assessment',
      description: 'Complete health questionnaire and dietary analysis',
      icon: '📋',
    },
    {
      step: 2,
      title: 'Goal Setting',
      description: 'Work with your dietician to set realistic, achievable goals',
      icon: '🎯',
    },
    {
      step: 3,
      title: 'Custom Plan',
      description: 'Receive your personalized meal plan and nutrition guide',
      icon: '📝',
    },
    {
      step: 4,
      title: 'Weekly Check-ins',
      description: 'Regular progress reviews and plan adjustments',
      icon: '📊',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-background-secondary py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-6xl mb-6">🥗</div>
          <h1 className="font-display text-5xl sm:text-6xl font-black text-foreground mb-6">
            Nutrition Plans
          </h1>
          <p className="text-xl text-foreground-secondary mb-8 max-w-3xl mx-auto">
            Transform your health with personalized nutrition guidance from certified dieticians. Achieve your goals with science-backed meal plans tailored to your lifestyle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-8 py-3 text-base font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
            >
              Start Free Consultation
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

      {/* Process */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            How It Works
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {process.map((item, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-500 text-3xl mb-4">
                  {item.icon}
                </div>
                <div className="mb-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-sm font-bold text-foreground">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-bold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-foreground-secondary">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-background-secondary py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Benefits of Proper Nutrition
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
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Nutrition Specializations
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {specializations.map((spec, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6"
              >
                <div className="text-4xl mb-4">{spec.icon}</div>
                <h3 className="font-display text-xl font-bold text-foreground mb-2">
                  {spec.name}
                </h3>
                <p className="text-foreground-secondary">
                  {spec.description}
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
            Nutrition Programs
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

      {/* Dieticians */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-12 text-center">
            Certified Dieticians
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {dieticians.map((dietician, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6"
              >
                <div className="text-center mb-4">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-neutral-100 text-4xl mb-3">
                    {dietician.image}
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground mb-1">
                    {dietician.name}
                  </h3>
                  <p className="text-sm text-foreground-secondary mb-2">
                    {dietician.specialty}
                  </p>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="flex items-center gap-1">
                      <span className="text-accent-yellow-500">★</span>
                      <span className="font-semibold text-foreground">{dietician.rating}</span>
                    </div>
                    <span className="text-sm text-foreground-secondary">
                      ({dietician.reviews} reviews)
                    </span>
                  </div>
                  <p className="text-sm text-foreground-secondary">
                    📍 {dietician.location}
                  </p>
                </div>
                <div className="space-y-2 mb-4">
                  <p className="text-sm text-foreground-secondary">
                    <strong>Experience:</strong> {dietician.experience}
                  </p>
                  <p className="text-sm text-foreground-secondary">
                    <strong>Certifications:</strong> {dietician.certifications.join(', ')}
                  </p>
                </div>
                <Link
                  href="/register"
                  className="block w-full rounded-lg border-2 border-neutral-300 px-4 py-2 text-center font-semibold text-foreground transition-colors hover:bg-neutral-100"
                >
                  Book Consultation
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
            Ready to Transform Your Nutrition?
          </h2>
          <p className="text-lg text-foreground-secondary mb-8">
            Get personalized guidance from certified nutrition experts
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-8 py-3 text-base font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
          >
            Schedule Free Consultation
          </Link>
        </div>
      </section>
    </div>
  );
}
