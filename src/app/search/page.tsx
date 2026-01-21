'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [priceRange, setPriceRange] = useState('all');

  // Mock search results
  const results = [
    {
      id: 1,
      type: 'gym',
      name: 'PowerHouse Gym',
      location: 'Los Angeles, USA',
      rating: 4.8,
      reviews: 342,
      image: '/placeholder-gym.jpg',
      price: '$49/month',
      verified: true,
      facilities: ['Cardio', 'Weights', 'Classes'],
    },
    {
      id: 2,
      type: 'trainer',
      name: 'Mike Chen',
      location: 'Hong Kong',
      rating: 5.0,
      reviews: 128,
      image: '/placeholder-trainer.jpg',
      price: '$99/session',
      verified: true,
      specialties: ['Strength', 'HIIT', 'Boxing'],
    },
    {
      id: 3,
      type: 'dietician',
      name: 'Dr. Maria Garcia',
      location: 'Barcelona, Spain',
      rating: 4.9,
      reviews: 89,
      image: '/placeholder-dietician.jpg',
      price: '$79/month',
      verified: true,
      specialties: ['Weight Loss', 'Sports Nutrition'],
    },
    {
      id: 4,
      type: 'gym',
      name: 'FitCore Studio',
      location: 'London, UK',
      rating: 4.7,
      reviews: 289,
      image: '/placeholder-gym.jpg',
      price: '$39/month',
      verified: true,
      facilities: ['Yoga', 'Pilates', 'Sauna'],
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'gym':
        return 'bg-accent-blue-500';
      case 'trainer':
        return 'bg-accent-yellow-500';
      case 'dietician':
        return 'bg-accent-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeLink = (type: string, id: number) => {
    switch (type) {
      case 'gym':
        return `/gyms/${id}`;
      case 'trainer':
        return `/trainers/${id}`;
      case 'dietician':
        return `/dieticians/${id}`;
      default:
        return '#';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Search Section */}
      <div className="bg-primary-500 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-foreground mb-4">
              Find Your Perfect Fit
            </h1>
            <p className="text-lg text-foreground/80">
              Discover gyms, trainers, and nutrition experts in 50+ countries
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-lg p-2 flex flex-col md:flex-row gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search gyms, trainers, dieticians..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-primary-500"
              />
              <input
                type="text"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                placeholder="Location"
                className="w-full md:w-48 px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-primary-500"
              />
              <button className="px-8 py-3 bg-accent-blue-500 text-foreground font-semibold hover:bg-accent-blue-600 transition-colors">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 shadow-card sticky top-4">
              <h2 className="text-xl font-bold text-foreground mb-6">Filters</h2>

              {/* Type Filter */}
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3">Type</h3>
                <div className="space-y-2">
                  {['all', 'gym', 'trainer', 'dietician'].map((type) => (
                    <label key={type} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        checked={selectedType === type}
                        onChange={() => setSelectedType(type)}
                        className="w-4 h-4 text-primary-500"
                      />
                      <span className="ml-2 text-foreground capitalize">{type === 'all' ? 'All' : type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3">Price Range</h3>
                <select
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-primary-500"
                >
                  <option value="all">All Prices</option>
                  <option value="0-50">$0 - $50</option>
                  <option value="50-100">$50 - $100</option>
                  <option value="100-200">$100 - $200</option>
                  <option value="200+">$200+</option>
                </select>
              </div>

              {/* Verified Only */}
              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 text-primary-500" />
                  <span className="ml-2 text-foreground">Verified only</span>
                </label>
              </div>

              {/* Quick Links */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-foreground mb-3">Browse by Type</h3>
                <div className="space-y-2">
                  <Link
                    href="/gyms"
                    className="block px-4 py-2 bg-accent-blue-100 text-accent-blue-700 font-semibold hover:bg-accent-blue-200 transition-colors"
                  >
                    All Gyms
                  </Link>
                  <Link
                    href="/trainers"
                    className="block px-4 py-2 bg-accent-yellow-100 text-accent-yellow-700 font-semibold hover:bg-accent-yellow-200 transition-colors"
                  >
                    All Trainers
                  </Link>
                  <Link
                    href="/dieticians"
                    className="block px-4 py-2 bg-accent-purple-100 text-accent-purple-700 font-semibold hover:bg-accent-purple-200 transition-colors"
                  >
                    All Dieticians
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">
                {results.length} Results Found
              </h2>
              <select className="px-4 py-2 border-2 border-gray-200 focus:outline-none focus:border-primary-500">
                <option>Most Relevant</option>
                <option>Highest Rated</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Most Reviews</option>
              </select>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((result) => (
                <Link
                  key={result.id}
                  href={getTypeLink(result.type, result.id)}
                  className="bg-white shadow-card hover:shadow-lg transition-shadow group"
                >
                  {/* Image Placeholder */}
                  <div className="relative h-48 bg-gray-200">
                    <div className={`absolute top-4 left-4 px-3 py-1 ${getTypeColor(result.type)} text-foreground text-sm font-semibold`}>
                      {result.type.toUpperCase()}
                    </div>
                    {result.verified && (
                      <div className="absolute top-4 right-4 bg-primary-500 text-foreground px-3 py-1 text-xs font-semibold flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        VERIFIED
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary-500 transition-colors">
                      {result.name}
                    </h3>
                    <p className="text-foreground/60 text-sm mb-3">📍 {result.location}</p>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center">
                        <span className="text-foreground">⭐</span>
                        <span className="font-semibold text-foreground ml-1">{result.rating}</span>
                      </div>
                      <span className="text-foreground/60 text-sm">({result.reviews} reviews)</span>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {(result.type === 'gym' ? result.facilities : result.specialties)?.map((tag, index) => (
                        <span key={index} className="px-3 py-1 bg-gray-100 text-foreground text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm text-foreground/60">Starting at</p>
                        <p className="text-xl font-black text-foreground">{result.price}</p>
                      </div>
                      <button className="px-6 py-2 bg-primary-500 text-foreground font-semibold hover:bg-primary-600 transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-center gap-2">
              <button className="px-4 py-2 border-2 border-gray-200 text-foreground font-semibold hover:bg-gray-50">
                Previous
              </button>
              <button className="px-4 py-2 bg-primary-500 text-foreground font-semibold">
                1
              </button>
              <button className="px-4 py-2 border-2 border-gray-200 text-foreground font-semibold hover:bg-gray-50">
                2
              </button>
              <button className="px-4 py-2 border-2 border-gray-200 text-foreground font-semibold hover:bg-gray-50">
                3
              </button>
              <button className="px-4 py-2 border-2 border-gray-200 text-foreground font-semibold hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
