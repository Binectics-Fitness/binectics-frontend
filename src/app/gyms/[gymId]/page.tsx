'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';

export default function GymProfilePage() {
  const params = useParams();
  const router = useRouter();
  const gymId = params.gymId;
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  // Mock gym data - in production this would come from API
  const gym = {
    id: gymId,
    name: 'PowerHouse Gym',
    location: 'Los Angeles, USA',
    address: '123 Fitness Street, Downtown LA, CA 90012',
    rating: 4.8,
    reviews: 342,
    verified: true,
    description: 'Premier fitness facility with state-of-the-art equipment, expert trainers, and a motivating community. We offer everything you need to reach your fitness goals in a clean, modern environment.',
    facilities: [
      'Cardio Equipment',
      'Free Weights',
      'Group Classes',
      'Sauna',
      'Locker Rooms',
      'Personal Training',
      'Juice Bar',
      'Parking',
    ],
    hours: {
      'Monday - Friday': '5:00 AM - 11:00 PM',
      'Saturday - Sunday': '6:00 AM - 9:00 PM',
    },
    photos: ['/placeholder1.jpg', '/placeholder2.jpg', '/placeholder3.jpg'],
    plans: [
      {
        id: 1,
        name: 'Day Pass',
        type: 'ONE_TIME',
        price: 15,
        duration: '1 day',
        description: 'Perfect for trying out the gym',
        features: ['Full gym access', 'Locker room', 'Shower facilities'],
      },
      {
        id: 2,
        name: 'Premium Monthly',
        type: 'SUBSCRIPTION',
        price: 49,
        duration: '1 month',
        description: 'Most popular plan',
        features: [
          'Unlimited gym access',
          'All group classes',
          'Locker room & showers',
          'Free parking',
          '1 guest pass/month',
        ],
      },
      {
        id: 3,
        name: 'Annual Membership',
        type: 'SUBSCRIPTION',
        price: 499,
        duration: '12 months',
        description: 'Best value - Save 15%',
        features: [
          'Everything in Premium',
          '2 personal training sessions',
          'Nutrition consultation',
          'Priority class booking',
          '4 guest passes/month',
        ],
      },
    ],
    qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=gym_123',
  };

  const reviews = [
    {
      id: 1,
      user: 'John Smith',
      rating: 5,
      date: '2024-02-10',
      comment: 'Amazing facilities and great staff! The equipment is top-notch.',
    },
    {
      id: 2,
      user: 'Sarah Johnson',
      rating: 4,
      date: '2024-02-08',
      comment: 'Great gym, can get crowded during peak hours but overall excellent.',
    },
    {
      id: 3,
      user: 'Mike Chen',
      rating: 5,
      date: '2024-02-05',
      comment: 'Best gym in LA! Clean, modern, and the trainers are incredibly knowledgeable.',
    },
  ];

  const handleSubscribe = (planId: number) => {
    // In production, this would navigate to checkout
    router.push(`/checkout?gym=${gymId}&plan=${planId}`);
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
            Back to Search
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="h-96 bg-gray-200 flex items-center justify-center">
                <span className="text-8xl">🏋️</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl">📸</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gym Info */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-black text-foreground mb-2">{gym.name}</h1>
                  <p className="text-foreground/60 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {gym.location}
                  </p>
                </div>
                {gym.verified && (
                  <div className="bg-primary-500 text-foreground px-4 py-2 font-semibold flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    VERIFIED
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <span className="text-2xl font-black text-foreground">{gym.rating}</span>
                </div>
                <span className="text-foreground/60">({gym.reviews} reviews)</span>
              </div>

              {/* Description */}
              <p className="text-foreground/80 mb-6 leading-relaxed">{gym.description}</p>

              {/* Address */}
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
                <p className="text-sm font-semibold text-foreground mb-1">Address</p>
                <p className="text-foreground/80">{gym.address}</p>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <button className="flex-1 px-6 py-3 bg-accent-blue-500 text-foreground font-semibold hover:bg-accent-blue-600 transition-colors">
                  Get Directions
                </button>
                <button className="px-6 py-3 border-2 border-gray-200 text-foreground font-semibold hover:border-accent-blue-500 transition-colors">
                  Share
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
            {/* Facilities */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">Facilities & Amenities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {gym.facilities.map((facility, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-foreground">{facility}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hours */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">Opening Hours</h2>
              <div className="space-y-3">
                {Object.entries(gym.hours).map(([days, hours]) => (
                  <div key={days} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <span className="font-semibold text-foreground">{days}</span>
                    <span className="text-foreground/80">{hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">Member Reviews</h2>
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="pb-6 border-b border-gray-100 last:border-0">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{review.user}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-foreground">{'⭐'.repeat(review.rating)}</span>
                          <span className="text-sm text-foreground/60">{review.date}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-foreground/80">{review.comment}</p>
                  </div>
                ))}
              </div>
              <button className="mt-6 w-full px-6 py-3 border-2 border-gray-200 text-foreground font-semibold hover:border-primary-500 transition-colors">
                View All {gym.reviews} Reviews
              </button>
            </div>
          </div>

          {/* Right Column - Plans & CTA */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 shadow-card sticky top-4">
              <h2 className="text-2xl font-bold text-foreground mb-6">Membership Plans</h2>
              <div className="space-y-4">
                {gym.plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-4 border-2 cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'border-primary-500 bg-primary-500/5'
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
                          <svg className="w-4 h-4 text-primary-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
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
                onClick={() => selectedPlan && handleSubscribe(selectedPlan)}
                disabled={!selectedPlan}
                className="w-full mt-6 px-6 py-4 bg-primary-500 text-foreground font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {selectedPlan ? 'Subscribe Now' : 'Select a Plan'}
              </button>

              {/* QR Check-in */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-foreground mb-3">QR Check-in</h3>
                <div className="bg-gray-50 p-4 text-center">
                  <div className="w-32 h-32 bg-white mx-auto mb-2 flex items-center justify-center">
                    <span className="text-6xl">📱</span>
                  </div>
                  <p className="text-sm text-foreground/60">
                    Scan to check in when you arrive
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
