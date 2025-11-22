'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function GymsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedAmenity, setSelectedAmenity] = useState('all');

  const gyms = [
    {
      name: 'FitZone Downtown',
      city: 'New York',
      country: 'United States',
      countryCode: 'us',
      flag: '🇺🇸',
      address: '123 Broadway, New York, NY 10001',
      rating: 4.8,
      reviews: 245,
      image: '🏢',
      amenities: ['Pool', 'Sauna', 'Locker Rooms', 'Personal Training', 'Group Classes'],
      hours: '24/7',
      distance: '0.5 mi',
    },
    {
      name: 'Strength & Power Gym',
      city: 'Los Angeles',
      country: 'United States',
      countryCode: 'us',
      flag: '🇺🇸',
      address: '456 Sunset Blvd, Los Angeles, CA 90028',
      rating: 4.9,
      reviews: 312,
      image: '💪',
      amenities: ['Free Weights', 'CrossFit', 'Personal Training', 'Nutrition Coaching'],
      hours: '5:00 AM - 11:00 PM',
      distance: '1.2 mi',
    },
    {
      name: 'Yoga & Wellness Studio',
      city: 'San Francisco',
      country: 'United States',
      countryCode: 'us',
      flag: '🇺🇸',
      address: '789 Market St, San Francisco, CA 94103',
      rating: 4.7,
      reviews: 189,
      image: '🧘',
      amenities: ['Yoga', 'Pilates', 'Meditation Room', 'Massage Therapy'],
      hours: '6:00 AM - 9:00 PM',
      distance: '2.1 mi',
    },
    {
      name: 'Premier Fitness London',
      city: 'London',
      country: 'United Kingdom',
      countryCode: 'gb',
      flag: '🇬🇧',
      address: '10 Oxford Street, London W1D 1BS',
      rating: 4.6,
      reviews: 421,
      image: '🏋️',
      amenities: ['Pool', 'Sauna', 'Steam Room', 'Cafe', 'Personal Training'],
      hours: '24/7',
      distance: '0.8 mi',
    },
    {
      name: 'Berlin Athletic Club',
      city: 'Berlin',
      country: 'Germany',
      countryCode: 'de',
      flag: '🇩🇪',
      address: 'Unter den Linden 5, 10117 Berlin',
      rating: 4.8,
      reviews: 276,
      image: '🏃',
      amenities: ['Running Track', 'CrossFit', 'Group Classes', 'Locker Rooms'],
      hours: '5:00 AM - 11:00 PM',
      distance: '1.5 mi',
    },
    {
      name: 'Tokyo Fitness Hub',
      city: 'Tokyo',
      country: 'Japan',
      countryCode: 'jp',
      flag: '🇯🇵',
      address: '1-1 Shibuya, Tokyo 150-0002',
      rating: 4.9,
      reviews: 534,
      image: '🏯',
      amenities: ['Pool', 'Sauna', 'Personal Training', 'Nutrition Coaching', 'Spa'],
      hours: '24/7',
      distance: '0.3 mi',
    },
  ];

  const countries = [
    { code: 'all', name: 'All Countries', flag: '🌍' },
    { code: 'us', name: 'United States', flag: '🇺🇸' },
    { code: 'gb', name: 'United Kingdom', flag: '🇬🇧' },
    { code: 'de', name: 'Germany', flag: '🇩🇪' },
    { code: 'jp', name: 'Japan', flag: '🇯🇵' },
  ];

  const amenityFilters = [
    'All Amenities',
    'Pool',
    'Sauna',
    'Personal Training',
    'Group Classes',
    'CrossFit',
    'Yoga',
  ];

  const filteredGyms = gyms.filter((gym) => {
    const matchesSearch = gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         gym.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         gym.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCountry = selectedCountry === 'all' || gym.countryCode === selectedCountry;
    const matchesAmenity = selectedAmenity === 'all' ||
                          gym.amenities.some(a => a.toLowerCase() === selectedAmenity.toLowerCase());
    return matchesSearch && matchesCountry && matchesAmenity;
  });

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
              Join Now
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-background-secondary py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl sm:text-5xl font-black text-foreground mb-4">
              Find Your Perfect Gym
            </h1>
            <p className="text-lg text-foreground-secondary">
              Access 500+ gyms worldwide with your Binectics membership
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search by gym name, city, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border-2 border-neutral-300 bg-background px-5 py-4 pl-12 text-foreground placeholder-foreground-secondary focus:border-primary-500 focus:outline-none"
            />
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-secondary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-background border-b border-neutral-300 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Country Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full rounded-lg border-2 border-neutral-300 bg-background px-4 py-2 text-foreground focus:border-primary-500 focus:outline-none"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amenity Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Amenities
              </label>
              <select
                value={selectedAmenity}
                onChange={(e) => setSelectedAmenity(e.target.value)}
                className="w-full rounded-lg border-2 border-neutral-300 bg-background px-4 py-2 text-foreground focus:border-primary-500 focus:outline-none"
              >
                {amenityFilters.map((amenity) => (
                  <option key={amenity} value={amenity === 'All Amenities' ? 'all' : amenity}>
                    {amenity}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-foreground-secondary">
            Showing {filteredGyms.length} {filteredGyms.length === 1 ? 'gym' : 'gyms'}
          </div>
        </div>
      </section>

      {/* Gym Listings */}
      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredGyms.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                No gyms found
              </h3>
              <p className="text-foreground-secondary mb-6">
                Try adjusting your search or filters
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCountry('all');
                  setSelectedAmenity('all');
                }}
                className="rounded-lg border-2 border-neutral-300 px-6 py-2 font-semibold text-foreground transition-colors hover:bg-neutral-100"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredGyms.map((gym, index) => (
                <div
                  key={index}
                  className="rounded-lg border-2 border-neutral-300 bg-background overflow-hidden transition-all hover:border-primary-500 hover:shadow-lg"
                >
                  {/* Image Placeholder */}
                  <div className="h-48 bg-neutral-100 flex items-center justify-center text-6xl">
                    {gym.image}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display text-xl font-bold text-foreground mb-1">
                          {gym.name}
                        </h3>
                        <p className="text-sm text-foreground-secondary flex items-center gap-1">
                          {gym.flag} {gym.city}, {gym.country}
                        </p>
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        <span className="text-accent-yellow-500">★</span>
                        <span className="font-semibold text-foreground">{gym.rating}</span>
                      </div>
                      <span className="text-sm text-foreground-secondary">
                        ({gym.reviews} reviews)
                      </span>
                    </div>

                    {/* Address */}
                    <p className="text-sm text-foreground-secondary mb-4 flex items-start gap-2">
                      <svg className="h-4 w-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {gym.address}
                    </p>

                    {/* Hours & Distance */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-foreground-secondary">
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {gym.hours}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        {gym.distance}
                      </span>
                    </div>

                    {/* Amenities */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {gym.amenities.slice(0, 3).map((amenity, amenityIndex) => (
                        <span
                          key={amenityIndex}
                          className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-foreground-secondary"
                        >
                          {amenity}
                        </span>
                      ))}
                      {gym.amenities.length > 3 && (
                        <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-foreground-secondary">
                          +{gym.amenities.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/gyms/${gym.countryCode}/${gym.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="block w-full rounded-lg bg-primary-500 px-4 py-3 text-center font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-background-secondary py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-black text-foreground mb-4">
            Ready to Start Training?
          </h2>
          <p className="text-lg text-foreground-secondary mb-8">
            Join Binectics today and get instant access to all these gyms and more
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-8 py-3 text-base font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg border-2 border-neutral-300 bg-background px-8 py-3 text-base font-semibold text-foreground transition-colors hover:bg-neutral-100"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
}
