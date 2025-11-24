'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardSidebar from '@/components/DashboardSidebar';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock user data
  const user = {
    name: 'John',
    memberSince: '2024',
    currentStreak: 7,
    totalVisits: 45,
  };

  // Personalized gym recommendation
  const featuredGym = {
    name: 'PowerHouse Fitness Downtown',
    location: 'New York, NY',
    distance: '0.3 mi',
    image: '🏋️',
    rating: 4.9,
    speciality: 'Strength Training & CrossFit',
    availableNow: true,
  };

  // Recommended gyms nearby
  const recommendedGyms = [
    {
      name: 'Yoga Flow Studio',
      trainer: 'Sarah Johnson',
      type: 'Yoga & Meditation',
      duration: '45 min',
      rating: 4.8,
      image: '🧘',
      color: 'bg-accent-purple-100',
    },
    {
      name: 'Iron Temple Gym',
      trainer: 'Mike Chen',
      type: 'Strength Training',
      duration: '60 min',
      rating: 4.9,
      image: '💪',
      color: 'bg-accent-blue-100',
    },
    {
      name: 'Cardio Core Studio',
      trainer: 'Emily Davis',
      type: 'HIIT & Cardio',
      duration: '30 min',
      rating: 4.7,
      image: '🏃',
      color: 'bg-accent-yellow-100',
    },
    {
      name: 'Wellness Center',
      trainer: 'Dr. James Wilson',
      type: 'Nutrition & Wellness',
      duration: '40 min',
      rating: 4.9,
      image: '🍎',
      color: 'bg-primary-100',
    },
  ];

  // Workout collections
  const collections = [
    {
      title: 'Beginner Strength',
      count: 12,
      image: '💪',
      color: 'bg-gradient-to-br from-accent-blue-400 to-accent-blue-600',
    },
    {
      title: 'Weight Loss Programs',
      count: 18,
      image: '🔥',
      color: 'bg-gradient-to-br from-accent-yellow-400 to-accent-yellow-600',
    },
    {
      title: 'Muscle Building',
      count: 15,
      image: '🏋️',
      color: 'bg-gradient-to-br from-accent-purple-400 to-accent-purple-600',
    },
    {
      title: 'Yoga & Flexibility',
      count: 20,
      image: '🧘',
      color: 'bg-gradient-to-br from-primary-400 to-primary-600',
    },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-foreground mb-2">
            Welcome back, {user.name}! 👋
          </h1>
          <p className="text-foreground-secondary">
            Keep up the great work! You're on a {user.currentStreak}-day streak.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Search gyms, trainers, workouts, or nutrition plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-background py-3 pl-12 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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

        {/* Selected Just For You */}
        <section className="mb-12">
          <h2 className="font-display text-2xl font-black text-foreground mb-6">
            Selected just for you
          </h2>
          <div className="rounded-2xl bg-gradient-to-r from-accent-yellow-50 to-accent-yellow-100 p-8">
            <div className="flex items-start gap-8">
              <div className="flex-1">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-500 px-3 py-1 text-xs font-bold text-white">
                  <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                  Available Now
                </div>
                <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                  {featuredGym.name}
                </h3>
                <p className="text-sm text-foreground-secondary mb-4">
                  {featuredGym.location} • {featuredGym.distance} away
                </p>
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1">
                    <svg className="h-5 w-5 text-accent-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-foreground">{featuredGym.rating}</span>
                  </div>
                  <span className="text-sm text-foreground-secondary">
                    Specializes in {featuredGym.speciality}
                  </span>
                </div>
                <Link
                  href="/dashboard/book"
                  className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600"
                >
                  Check In Now
                </Link>
              </div>
              <div className="flex-shrink-0">
                <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-white text-6xl shadow-lg">
                  {featuredGym.image}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Recommended for you */}
        <section className="mb-12">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-black text-foreground mb-2">
              Recommended for you
            </h2>
            <p className="text-sm text-foreground-secondary">
              We think you'll like these
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recommendedGyms.map((gym, index) => (
              <Link
                key={index}
                href="/dashboard/book"
                className="group rounded-2xl bg-background p-6 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl ${gym.color} text-3xl`}>
                  {gym.image}
                </div>
                <h3 className="font-display text-lg font-bold text-foreground mb-2 group-hover:text-primary-500 transition-colors">
                  {gym.name}
                </h3>
                <p className="text-sm text-foreground-secondary mb-3">
                  {gym.trainer}
                </p>
                <div className="flex items-center justify-between text-xs text-foreground-tertiary mb-4">
                  <span>{gym.type}</span>
                  <span>{gym.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <svg className="h-4 w-4 text-accent-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-semibold text-foreground">{gym.rating}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Collections for you */}
        <section>
          <div className="mb-6">
            <h2 className="font-display text-2xl font-black text-foreground mb-2">
              Collections for you
            </h2>
            <p className="text-sm text-foreground-secondary">
              Curated workout programs and nutrition plans
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {collections.map((collection, index) => (
              <Link
                key={index}
                href="/dashboard/explore"
                className={`group relative overflow-hidden rounded-2xl ${collection.color} p-8 text-center shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
              >
                <div className="mb-4 text-5xl">{collection.image}</div>
                <h3 className="font-display text-xl font-bold text-white mb-2">
                  {collection.title}
                </h3>
                <p className="text-sm text-white/90">
                  {collection.count} programs
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
