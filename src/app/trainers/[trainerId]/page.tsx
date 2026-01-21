'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function TrainerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const trainerId = params.trainerId;
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  // Mock trainer data - in production this would come from API
  const trainer = {
    id: trainerId,
    name: 'Mike Chen',
    location: 'Hong Kong',
    rating: 5.0,
    reviews: 128,
    clients: 45,
    verified: true,
    image: '💪',
    specialties: ['Strength Training', 'HIIT', 'Boxing'],
    certifications: ['NASM-CPT', 'CrossFit Level 2', 'Boxing Coach Level 1'],
    experience: '8 years',
    bio: 'Specialized in functional fitness and strength building. I help clients transform their bodies and minds through evidence-based training methods. Whether you\'re a beginner or advanced athlete, I\'ll create a customized program to help you reach your goals.',
    achievements: [
      'Trained 100+ clients to competition level',
      'Former collegiate athlete',
      'Published fitness researcher',
      'Nutrition specialist certified',
    ],
    plans: [
      {
        id: 1,
        name: 'Single Session',
        type: 'ONE_TIME',
        price: 99,
        duration: '1 session',
        description: 'Try a one-time session',
        features: ['1-on-1 training', 'Personalized workout', 'Progress assessment', 'Nutrition tips'],
      },
      {
        id: 2,
        name: '4-Week Package',
        type: 'SUBSCRIPTION',
        price: 349,
        duration: '4 weeks',
        description: 'Most popular package',
        features: [
          '8 training sessions',
          'Customized workout plan',
          'Nutrition guidance',
          'Progress tracking',
          'WhatsApp support',
        ],
      },
      {
        id: 3,
        name: '12-Week Transformation',
        type: 'SUBSCRIPTION',
        price: 899,
        duration: '12 weeks',
        description: 'Best value - Complete transformation',
        features: [
          '24 training sessions',
          'Full transformation program',
          'Meal planning',
          'Body composition analysis',
          'Weekly check-ins',
          '24/7 chat support',
        ],
      },
    ],
    availability: {
      'Monday - Friday': '6:00 AM - 8:00 PM',
      'Saturday': '8:00 AM - 4:00 PM',
      'Sunday': 'By appointment',
    },
    languages: ['English', 'Cantonese', 'Mandarin'],
  };

  const testimonials = [
    {
      id: 1,
      user: 'Sarah Johnson',
      rating: 5,
      date: '2024-02-10',
      comment: 'Mike completely transformed my approach to fitness. Lost 20 lbs and gained so much strength!',
      program: '12-Week Transformation',
    },
    {
      id: 2,
      user: 'David Lee',
      rating: 5,
      date: '2024-02-05',
      comment: 'Best trainer I\'ve ever worked with. His boxing techniques are incredible.',
      program: '4-Week Package',
    },
    {
      id: 3,
      user: 'Emily Chen',
      rating: 5,
      date: '2024-01-28',
      comment: 'Professional, knowledgeable, and motivating. Highly recommend!',
      program: '12-Week Transformation',
    },
  ];

  const handleBookNow = (planId: number) => {
    router.push(`/checkout?trainer=${trainerId}&plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-foreground/60 hover:text-foreground"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Trainers
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Image & Quick Stats */}
            <div className="space-y-6">
              <div className="h-96 bg-accent-yellow-100 flex items-center justify-center">
                <span className="text-9xl">{trainer.image}</span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-black text-foreground">{trainer.rating}</p>
                  <p className="text-sm text-foreground/60">Rating</p>
                </div>
                <div className="bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-black text-foreground">{trainer.reviews}</p>
                  <p className="text-sm text-foreground/60">Reviews</p>
                </div>
                <div className="bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-black text-foreground">{trainer.clients}</p>
                  <p className="text-sm text-foreground/60">Clients</p>
                </div>
              </div>
            </div>

            {/* Trainer Info */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-black text-foreground mb-2">{trainer.name}</h1>
                  <p className="text-foreground/60 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {trainer.location}
                  </p>
                </div>
                {trainer.verified && (
                  <div className="bg-primary-500 text-foreground px-4 py-2 font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    VERIFIED
                  </div>
                )}
              </div>

              {/* Bio */}
              <p className="text-foreground/80 mb-6 leading-relaxed">{trainer.bio}</p>

              {/* Experience */}
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
                <p className="text-sm font-semibold text-foreground mb-1">Experience</p>
                <p className="text-foreground/80">{trainer.experience} of professional training</p>
              </div>

              {/* Specialties */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-foreground mb-3">Specialties</p>
                <div className="flex flex-wrap gap-2">
                  {trainer.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-accent-yellow-100 text-accent-yellow-700 text-sm font-semibold"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-foreground mb-2">Languages</p>
                <p className="text-foreground/80">{trainer.languages.join(', ')}</p>
              </div>

              {/* Quick Contact */}
              <div className="flex gap-3">
                <button
                  onClick={() => selectedPlan && handleBookNow(selectedPlan)}
                  disabled={!selectedPlan}
                  className="flex-1 px-6 py-3 bg-accent-yellow-500 text-foreground font-semibold hover:bg-accent-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedPlan ? 'Book Now' : 'Select a Package'}
                </button>
                <button className="px-6 py-3 border-2 border-gray-200 text-foreground font-semibold hover:border-accent-yellow-500 transition-colors">
                  Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Certifications */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">Certifications & Credentials</h2>
              <div className="space-y-3">
                {trainer.certifications.map((cert, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50">
                    <svg className="w-6 h-6 text-accent-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium text-foreground">{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">Achievements & Highlights</h2>
              <div className="space-y-3">
                {trainer.achievements.map((achievement, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-foreground/80">{achievement}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">Availability</h2>
              <div className="space-y-3">
                {Object.entries(trainer.availability).map(([days, hours]) => (
                  <div key={days} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="font-semibold text-foreground">{days}</span>
                    <span className="text-foreground/80">{hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">Client Testimonials</h2>
              <div className="space-y-6">
                {testimonials.map((testimonial) => (
                  <div key={testimonial.id} className="pb-6 border-b border-gray-100 last:border-0">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{testimonial.user}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-foreground">{'⭐'.repeat(testimonial.rating)}</span>
                          <span className="text-sm text-foreground/60">{testimonial.date}</span>
                        </div>
                      </div>
                      <div className="bg-accent-yellow-100 px-3 py-1 text-xs font-semibold text-accent-yellow-700">
                        {testimonial.program}
                      </div>
                    </div>
                    <p className="text-foreground/80">{testimonial.comment}</p>
                  </div>
                ))}
              </div>
              <button className="mt-6 w-full px-6 py-3 border-2 border-gray-200 text-foreground font-semibold hover:border-accent-yellow-500 transition-colors">
                View All {trainer.reviews} Reviews
              </button>
            </div>
          </div>

          {/* Right Column - Packages */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 shadow-card sticky top-4">
              <h2 className="text-2xl font-bold text-foreground mb-6">Training Packages</h2>
              <div className="space-y-4">
                {trainer.plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-4 border-2 cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'border-accent-yellow-500 bg-accent-yellow-500/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-foreground">{plan.name}</h3>
                        <p className="text-sm text-foreground/60">{plan.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-foreground">${plan.price}</p>
                        <p className="text-xs text-foreground/60">{plan.duration}</p>
                      </div>
                    </div>
                    <ul className="space-y-1 mt-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="text-sm text-foreground/80 flex items-start gap-2">
                          <svg className="w-4 h-4 text-accent-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <button
                onClick={() => selectedPlan && handleBookNow(selectedPlan)}
                disabled={!selectedPlan}
                className="w-full mt-6 px-6 py-4 bg-accent-yellow-500 text-foreground font-semibold hover:bg-accent-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedPlan ? 'Book This Package' : 'Select a Package'}
              </button>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-foreground mb-3">Have Questions?</h3>
                <button className="w-full px-4 py-3 border-2 border-gray-200 text-foreground font-semibold hover:border-accent-yellow-500 transition-colors">
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
