'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DieticiansPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  // Mock dieticians data
  const dieticians = [
    {
      id: 1,
      name: 'Dr. Sarah Thompson',
      location: 'New York, USA',
      rating: 5.0,
      reviews: 156,
      clients: 78,
      verified: true,
      image: '🥗',
      specialties: ['Weight Loss', 'Sports Nutrition', 'Meal Planning'],
      certifications: ['Registered Dietitian (RD)', 'CSSD', 'Precision Nutrition L2'],
      experience: '12 years',
      price: '$120/session',
      bio: 'Evidence-based nutrition strategies for sustainable health and performance.',
    },
    {
      id: 2,
      name: 'Priya Patel',
      location: 'Mumbai, India',
      rating: 4.9,
      reviews: 203,
      clients: 92,
      verified: true,
      image: '🍎',
      specialties: ['Diabetes Management', 'Heart Health', 'Plant-Based Diets'],
      certifications: ['MSc Nutrition', 'Certified Diabetes Educator'],
      experience: '15 years',
      price: '$85/session',
      bio: 'Helping clients manage chronic conditions through personalized nutrition.',
    },
    {
      id: 3,
      name: 'Carlos Rodriguez',
      location: 'Barcelona, Spain',
      rating: 4.8,
      reviews: 134,
      clients: 61,
      verified: true,
      image: '🥑',
      specialties: ['Mediterranean Diet', 'Athletic Performance', 'Body Recomposition'],
      certifications: ['RD', 'CSCS', 'Sports Nutritionist'],
      experience: '9 years',
      price: '$95/session',
      bio: 'Mediterranean nutrition expert specializing in athlete fueling.',
    },
    {
      id: 4,
      name: 'Emily Chen',
      location: 'Singapore',
      rating: 5.0,
      reviews: 187,
      clients: 85,
      verified: true,
      image: '🥙',
      specialties: ['Weight Management', 'Gut Health', 'Food Allergies'],
      certifications: ['RD', 'Certified LEAP Therapist', 'Gut Health Specialist'],
      experience: '10 years',
      price: '$110/session',
      bio: 'Specialized in digestive health and food sensitivity management.',
    },
    {
      id: 5,
      name: 'Michael Johnson',
      location: 'London, UK',
      rating: 4.9,
      reviews: 142,
      clients: 67,
      verified: true,
      image: '🥦',
      specialties: ['Vegan Nutrition', 'Muscle Gain', 'Meal Prep'],
      certifications: ['RD', 'Plant-Based Nutrition Certificate'],
      experience: '7 years',
      price: '$100/session',
      bio: 'Plant-based nutrition for strength and performance.',
    },
    {
      id: 6,
      name: 'Aisha Mohammed',
      location: 'Dubai, UAE',
      rating: 5.0,
      reviews: 98,
      clients: 52,
      verified: false,
      image: '🍊',
      specialties: ['Pregnancy Nutrition', 'Pediatric Nutrition', 'Family Health'],
      certifications: ['RD', 'Maternal & Child Nutrition Specialist'],
      experience: '8 years',
      price: '$90/session',
      bio: 'Supporting families through all life stages with evidence-based nutrition.',
    },
  ];

  const specialties = [
    'All Specialties',
    'Weight Loss',
    'Sports Nutrition',
    'Diabetes Management',
    'Heart Health',
    'Gut Health',
    'Plant-Based Diets',
    'Pregnancy Nutrition',
  ];

  const locations = [
    { value: 'all', label: 'All Locations' },
    { value: 'usa', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'asia', label: 'Asia' },
    { value: 'europe', label: 'Europe' },
    { value: 'middle-east', label: 'Middle East' },
  ];

  const filteredDieticians = dieticians.filter((dietician) => {
    const matchesSearch =
      dietician.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dietician.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dietician.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSpecialty =
      selectedSpecialty === 'all' ||
      dietician.specialties.some((s) => s.toLowerCase() === selectedSpecialty.toLowerCase());
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-accent-purple-500 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl sm:text-5xl font-black text-foreground mb-4">
              Find Your Certified Dietician
            </h1>
            <p className="text-lg text-foreground/90">
              Connect with registered dieticians worldwide for personalized nutrition guidance
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search by name, location, or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-4 pl-12 border-2 border-foreground/20 focus:outline-none focus:border-foreground"
            />
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/60"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-background border-b border-neutral-300 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Specialty Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-foreground mb-2">Specialty</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-4 py-2 border-2 border-neutral-300 focus:border-accent-purple-500 focus:outline-none"
              >
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty === 'All Specialties' ? 'all' : specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-foreground mb-2">Location</label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-2 border-2 border-neutral-300 focus:border-accent-purple-500 focus:outline-none"
              >
                {locations.map((location) => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Verified Only */}
            <div className="flex items-end">
              <label className="flex items-center cursor-pointer px-4 py-2 border-2 border-neutral-300 hover:border-accent-purple-500 transition-colors">
                <input type="checkbox" className="w-4 h-4 text-accent-purple-500 mr-2" />
                <span className="text-foreground font-semibold">Verified only</span>
              </label>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-foreground-secondary">
            Showing {filteredDieticians.length} {filteredDieticians.length === 1 ? 'dietician' : 'dieticians'}
          </div>
        </div>
      </section>

      {/* Dieticians Grid */}
      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDieticians.map((dietician) => (
              <div
                key={dietician.id}
                className="bg-white shadow-card hover:shadow-lg transition-shadow"
              >
                {/* Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-accent-purple-100 flex items-center justify-center text-3xl">
                        {dietician.image}
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-bold text-foreground">{dietician.name}</h3>
                        <p className="text-sm text-foreground-secondary">📍 {dietician.location}</p>
                      </div>
                    </div>
                    {dietician.verified && (
                      <div className="bg-primary-500 text-foreground px-2 py-1 text-xs font-semibold">
                        ✓
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <span className="text-accent-purple-500">★</span>
                      <span className="font-semibold text-foreground">{dietician.rating}</span>
                    </div>
                    <span className="text-sm text-foreground-secondary">
                      ({dietician.reviews} reviews)
                    </span>
                    <span className="text-sm text-foreground-secondary">• {dietician.clients} clients</span>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-foreground-secondary mb-4">{dietician.bio}</p>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {dietician.specialties.slice(0, 3).map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-accent-purple-100 text-accent-purple-700 text-xs font-semibold"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>

                  {/* Experience & Certifications */}
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex items-center gap-2 text-foreground-secondary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {dietician.experience} experience
                    </div>
                    <div className="flex items-center gap-2 text-foreground-secondary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                        />
                      </svg>
                      {dietician.certifications.join(', ')}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-foreground-secondary">Starting at</p>
                    <p className="text-xl font-black text-foreground">{dietician.price}</p>
                  </div>
                  <Link
                    href={`/dieticians/${dietician.id}`}
                    className="px-6 py-2 bg-accent-purple-500 text-white font-semibold hover:bg-accent-purple-600 transition-colors"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-accent-purple-100 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-black text-foreground mb-4">
            Ready to Transform Your Nutrition?
          </h2>
          <p className="text-lg text-foreground/80 mb-8">
            Connect with certified dieticians and achieve your health goals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-3 bg-accent-purple-500 text-white font-semibold hover:bg-accent-purple-600 transition-colors"
            >
              Sign Up Now
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-foreground/20 bg-background text-foreground font-semibold hover:border-foreground/40 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
