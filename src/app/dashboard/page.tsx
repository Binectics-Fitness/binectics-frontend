'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardSidebar from '@/components/DashboardSidebar';
import OnboardingBanner from '@/components/OnboardingBanner';

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // Mock user data
  const user = {
    name: 'John',
    memberSince: '2024',
    currentStreak: 7,
    totalVisits: 45,
    role: 'USER' as const, // Change this to test different roles: 'USER' | 'GYM_OWNER' | 'TRAINER' | 'DIETICIAN'
    isOnboardingComplete: false, // Set to true to hide the banner
  };

  // Personalized gym recommendation
  const featuredGym = {
    name: 'PowerHouse Fitness Downtown',
    location: 'New York, NY',
    distance: '0.3 mi',
    image: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h2m0 0v4m0-4h2m12 0h2m0 0v4m0-4h-2m-8-4v12m0-12h4v12h-4z M7 10h10M7 14h10" /></svg>),
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
      image: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
      color: 'bg-accent-purple-100',
    },
    {
      name: 'Iron Temple Gym',
      trainer: 'Mike Chen',
      type: 'Strength Training',
      duration: '60 min',
      rating: 4.9,
      image: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>),
      color: 'bg-accent-blue-100',
    },
    {
      name: 'Cardio Core Studio',
      trainer: 'Emily Davis',
      type: 'HIIT & Cardio',
      duration: '30 min',
      rating: 4.7,
      image: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>),
      color: 'bg-accent-yellow-100',
    },
    {
      name: 'Wellness Center',
      trainer: 'Dr. James Wilson',
      type: 'Nutrition & Wellness',
      duration: '40 min',
      rating: 4.9,
      image: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>),
      color: 'bg-primary-100',
    },
  ];

  // Workout collections
  const collections = [
    {
      title: 'Beginner Strength',
      count: 12,
      image: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>),
      color: 'bg-gradient-to-br from-accent-blue-400 to-accent-blue-600',
    },
    {
      title: 'Weight Loss Programs',
      count: 18,
      image: <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>,
      color: 'bg-gradient-to-br from-accent-yellow-400 to-accent-yellow-600',
    },
    {
      title: 'Muscle Building',
      count: 15,
      image: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h2m0 0v4m0-4h2m12 0h2m0 0v4m0-4h-2m-8-4v12m0-12h4v12h-4z M7 10h10M7 14h10" /></svg>),
      color: 'bg-gradient-to-br from-accent-purple-400 to-accent-purple-600',
    },
    {
      title: 'Yoga & Flexibility',
      count: 20,
      image: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
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
            Welcome back, {user.name}!
          </h1>
          <p className="text-foreground-secondary">
            Keep up the great work! You're on a {user.currentStreak}-day streak.
          </p>
        </div>

        {/* Onboarding Banner */}
        {!user.isOnboardingComplete && (
          <div className="mb-8">
            <OnboardingBanner userRole={user.role} userName={user.name} />
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Search gyms, trainers, workouts, or nutrition plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full  border border-neutral-200 bg-background py-3 pl-12 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
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
          <div className="bg-gradient-to-r from-accent-yellow-50 to-accent-yellow-100 p-8">
            <div className="flex items-start gap-8">
              <div className="flex-1">
                <div className="mb-4 inline-flex items-center gap-2  bg-primary-500 px-3 py-1 text-xs font-bold text-white">
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
                  className="inline-flex h-12 items-center justify-center bg-primary-500 px-8 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600"
                >
                  Check In Now
                </Link>
              </div>
              <div className="flex-shrink-0">
                <div className="flex h-32 w-32 items-center justify-center bg-white text-6xl shadow-lg">
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
                className="group bg-background p-6 shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center  ${gym.color} text-3xl`}>
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
                className={`group relative overflow-hidden ${collection.color} p-8 text-center shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
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
