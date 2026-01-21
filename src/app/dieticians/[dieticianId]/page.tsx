'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function DieticianProfilePage() {
  const params = useParams();
  const router = useRouter();
  const dieticianId = params.dieticianId;
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  // Mock dietician data - in production this would come from API
  const dietician = {
    id: dieticianId,
    name: 'Dr. Sarah Thompson',
    location: 'New York, USA',
    rating: 5.0,
    reviews: 156,
    clients: 78,
    verified: true,
    image: '🥗',
    specialties: ['Weight Loss', 'Sports Nutrition', 'Meal Planning', 'Metabolic Health'],
    certifications: ['Registered Dietitian (RD)', 'CSSD', 'Precision Nutrition L2', 'ISSN Sports Nutritionist'],
    experience: '12 years',
    bio: 'Evidence-based nutrition strategies for sustainable health and performance. I specialize in helping clients achieve their health and fitness goals through personalized meal plans, behavior change strategies, and ongoing support. Whether you\'re looking to lose weight, improve athletic performance, or simply eat healthier, I\'ll create a customized nutrition plan tailored to your unique needs and lifestyle.',
    education: [
      'PhD in Nutritional Sciences - Columbia University',
      'MS in Clinical Nutrition - NYU',
      'BS in Dietetics - Cornell University',
    ],
    approach: [
      'Evidence-based nutrition counseling',
      'Personalized meal planning',
      'Behavior modification strategies',
      'Sustainable lifestyle changes',
      'No restrictive diets',
    ],
    plans: [
      {
        id: 1,
        name: 'Initial Consultation',
        type: 'ONE_TIME',
        price: 120,
        duration: '1 session',
        description: 'Comprehensive nutrition assessment',
        features: ['90-minute consultation', 'Full dietary analysis', 'Personalized recommendations', 'Meal plan outline', 'Follow-up email support'],
      },
      {
        id: 2,
        name: '6-Week Program',
        type: 'SUBSCRIPTION',
        price: 499,
        duration: '6 weeks',
        description: 'Most popular program',
        features: [
          '6 bi-weekly sessions',
          'Custom meal plans',
          'Recipe recommendations',
          'Progress tracking',
          'Email support',
          'Grocery shopping guides',
        ],
      },
      {
        id: 3,
        name: '3-Month Transformation',
        type: 'SUBSCRIPTION',
        price: 999,
        duration: '12 weeks',
        description: 'Complete nutrition transformation',
        features: [
          '12 weekly sessions',
          'Comprehensive meal planning',
          'Supplement recommendations',
          'Lab work interpretation',
          'Body composition tracking',
          'Priority support (24/7)',
          'Monthly recipe ebooks',
        ],
      },
    ],
    availability: {
      'Monday - Friday': '9:00 AM - 6:00 PM EST',
      'Saturday': '10:00 AM - 2:00 PM EST',
      'Sunday': 'Closed',
    },
    languages: ['English', 'Spanish'],
    consultationModes: ['In-person (NYC)', 'Video call', 'Phone'],
  };

  const testimonials = [
    {
      id: 1,
      user: 'Jennifer Miller',
      rating: 5,
      date: '2024-02-12',
      comment: 'Dr. Thompson completely changed my relationship with food. Lost 35 lbs and kept it off for 2 years!',
      program: '3-Month Transformation',
    },
    {
      id: 2,
      user: 'Marcus Williams',
      rating: 5,
      date: '2024-02-08',
      comment: 'As an athlete, I needed expert nutrition guidance. Sarah\'s sports nutrition knowledge is incredible.',
      program: '6-Week Program',
    },
    {
      id: 3,
      user: 'Lisa Chen',
      rating: 5,
      date: '2024-01-30',
      comment: 'Professional, knowledgeable, and genuinely cares about her clients. Highly recommend!',
      program: '3-Month Transformation',
    },
  ];

  const handleBookNow = (planId: number) => {
    router.push(`/checkout?dietician=${dieticianId}&plan=${planId}`);
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
            Back to Dieticians
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Profile Image & Quick Stats */}
            <div className="space-y-6">
              <div className="h-96 bg-accent-purple-100 flex items-center justify-center">
                <span className="text-9xl">{dietician.image}</span>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-black text-foreground">{dietician.rating}</p>
                  <p className="text-sm text-foreground/60">Rating</p>
                </div>
                <div className="bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-black text-foreground">{dietician.reviews}</p>
                  <p className="text-sm text-foreground/60">Reviews</p>
                </div>
                <div className="bg-gray-50 p-4 text-center">
                  <p className="text-2xl font-black text-foreground">{dietician.clients}</p>
                  <p className="text-sm text-foreground/60">Clients</p>
                </div>
              </div>
            </div>

            {/* Dietician Info */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-black text-foreground mb-2">{dietician.name}</h1>
                  <p className="text-foreground/60 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {dietician.location}
                  </p>
                </div>
                {dietician.verified && (
                  <div className="bg-primary-500 text-foreground px-4 py-2 font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    VERIFIED RD
                  </div>
                )}
              </div>

              {/* Bio */}
              <p className="text-foreground/80 mb-6 leading-relaxed">{dietician.bio}</p>

              {/* Experience */}
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
                <p className="text-sm font-semibold text-foreground mb-1">Experience</p>
                <p className="text-foreground/80">{dietician.experience} of clinical and sports nutrition practice</p>
              </div>

              {/* Specialties */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-foreground mb-3">Specialties</p>
                <div className="flex flex-wrap gap-2">
                  {dietician.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-accent-purple-100 text-accent-purple-700 text-sm font-semibold"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Languages & Consultation Modes */}
              <div className="mb-6 space-y-2">
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Languages</p>
                  <p className="text-foreground/80">{dietician.languages.join(', ')}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground mb-1">Consultation Options</p>
                  <p className="text-foreground/80">{dietician.consultationModes.join(' • ')}</p>
                </div>
              </div>

              {/* Quick Contact */}
              <div className="flex gap-3">
                <button
                  onClick={() => selectedPlan && handleBookNow(selectedPlan)}
                  disabled={!selectedPlan}
                  className="flex-1 px-6 py-3 bg-accent-purple-500 text-white font-semibold hover:bg-accent-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {selectedPlan ? 'Book Now' : 'Select a Program'}
                </button>
                <button className="px-6 py-3 border-2 border-gray-200 text-foreground font-semibold hover:border-accent-purple-500 transition-colors">
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
            {/* Education */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">Education & Credentials</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Academic Degrees</p>
                  <div className="space-y-2">
                    {dietician.education.map((degree, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50">
                        <svg className="w-5 h-5 text-accent-purple-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                        </svg>
                        <span className="text-foreground/80">{degree}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground mb-2">Professional Certifications</p>
                  <div className="space-y-2">
                    {dietician.certifications.map((cert, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50">
                        <svg className="w-5 h-5 text-accent-purple-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-foreground/80">{cert}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Approach */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">My Approach</h2>
              <div className="space-y-3">
                {dietician.approach.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-foreground/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">Availability</h2>
              <div className="space-y-3">
                {Object.entries(dietician.availability).map(([days, hours]) => (
                  <div key={days} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="font-semibold text-foreground">{days}</span>
                    <span className="text-foreground/80">{hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Testimonials */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">Client Success Stories</h2>
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
                      <div className="bg-accent-purple-100 px-3 py-1 text-xs font-semibold text-accent-purple-700">
                        {testimonial.program}
                      </div>
                    </div>
                    <p className="text-foreground/80">{testimonial.comment}</p>
                  </div>
                ))}
              </div>
              <button className="mt-6 w-full px-6 py-3 border-2 border-gray-200 text-foreground font-semibold hover:border-accent-purple-500 transition-colors">
                View All {dietician.reviews} Reviews
              </button>
            </div>
          </div>

          {/* Right Column - Programs */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 shadow-card sticky top-4">
              <h2 className="text-2xl font-bold text-foreground mb-6">Nutrition Programs</h2>
              <div className="space-y-4">
                {dietician.plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-4 border-2 cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'border-accent-purple-500 bg-accent-purple-500/5'
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
                          <svg className="w-4 h-4 text-accent-purple-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
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
                className="w-full mt-6 px-6 py-4 bg-accent-purple-500 text-white font-semibold hover:bg-accent-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedPlan ? 'Book This Program' : 'Select a Program'}
              </button>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-foreground mb-3">Have Questions?</h3>
                <button className="w-full px-4 py-3 border-2 border-gray-200 text-foreground font-semibold hover:border-accent-purple-500 transition-colors">
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
