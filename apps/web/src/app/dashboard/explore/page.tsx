'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardSidebar from '@/components/DashboardSidebar';

export default function ExplorePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', label: 'All', count: 500 },
    { id: 'gyms', label: 'Gyms', count: 200 },
    { id: 'trainers', label: 'Personal Trainers', count: 150 },
    { id: 'dieticians', label: 'Dieticians', count: 100 },
    { id: 'classes', label: 'Classes', count: 50 },
  ];

  const gyms = [
    {
      name: 'PowerHouse Fitness',
      location: 'New York, NY',
      distance: '0.3 mi',
      rating: 4.9,
      reviews: 245,
      amenities: ['Pool', 'Sauna', 'Locker Rooms'],
      price: 'Included in plan',
      type: 'gym',
    },
    {
      name: 'Yoga Flow Studio',
      location: 'New York, NY',
      distance: '0.5 mi',
      rating: 4.8,
      reviews: 189,
      amenities: ['Yoga', 'Meditation', 'Pilates'],
      price: 'Included in plan',
      type: 'gym',
    },
    {
      name: 'Mike Chen',
      specialty: 'Strength Training & CrossFit',
      location: 'New York, NY',
      rating: 4.9,
      reviews: 312,
      price: '$80/session',
      type: 'trainer',
    },
    {
      name: 'Sarah Johnson',
      specialty: 'Yoga & Flexibility',
      location: 'New York, NY',
      rating: 4.8,
      reviews: 198,
      price: '$60/session',
      type: 'trainer',
    },
    {
      name: 'Dr. Emily Wilson',
      specialty: 'Sports Nutrition',
      location: 'New York, NY',
      rating: 4.9,
      reviews: 156,
      price: '$120/consultation',
      type: 'dietician',
    },
  ];

  const filteredResults = gyms.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.type === selectedCategory.slice(0, -1);
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ('specialty' in item && item.specialty.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />

      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-foreground mb-2">
            Explore
          </h1>
          <p className="text-foreground-secondary">
            Discover gyms, trainers, and dieticians worldwide
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Search for gyms, trainers, or dieticians..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-neutral-200 bg-background py-3 pl-12 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-foreground text-background'
                    : 'bg-background text-foreground-secondary hover:bg-neutral-200'
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-foreground-secondary">
              {filteredResults.length} results found
            </p>
            <select className="border border-neutral-200 bg-background px-4 py-2 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20">
              <option>Sort by: Recommended</option>
              <option>Sort by: Distance</option>
              <option>Sort by: Rating</option>
              <option>Sort by: Price</option>
            </select>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResults.map((item, index) => (
              <Link
                key={index}
                href={`/dashboard/${item.type}s/${index}`}
                className="group bg-background p-6 shadow-card transition-all duration-300 hover:shadow-xl"
              >
                {/* Type Badge */}
                <div className="mb-4">
                  <span className="inline-block bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                    {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                  </span>
                </div>

                <h3 className="font-display text-lg font-bold text-foreground mb-2 group-hover:text-primary-500 transition-colors">
                  {item.name}
                </h3>

                <p className="text-sm text-foreground-secondary mb-3">
                  {'specialty' in item ? item.specialty : item.location}
                </p>

                {/* Amenities or Distance */}
                {'amenities' in item && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {item.amenities.slice(0, 3).map((amenity, i) => (
                      <span key={i} className="bg-neutral-100 px-2 py-1 text-xs text-foreground-tertiary">
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}

                {'distance' in item && (
                  <p className="text-sm text-foreground-tertiary mb-4">
                    {item.distance} away
                  </p>
                )}

                {/* Rating and Price */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <svg className="h-4 w-4 text-accent-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-foreground">{item.rating}</span>
                    <span className="text-xs text-foreground-tertiary">({item.reviews})</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">{item.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
