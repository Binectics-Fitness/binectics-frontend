'use client';

import { useState } from 'react';
import Link from 'next/link';
import DashboardSidebar from '@/components/DashboardSidebar';

export default function BookingsPage() {
  const [selectedTab, setSelectedTab] = useState('upcoming');

  const upcomingBookings = [
    {
      type: 'Trainer Session',
      name: 'Mike Chen - Strength Training',
      date: 'Today, 10:00 AM',
      location: 'PowerHouse Fitness',
      duration: '60 min',
      status: 'confirmed',
    },
    {
      type: 'Gym Visit',
      name: 'Yoga Flow Studio',
      date: 'Tomorrow, 6:00 PM',
      location: 'New York, NY',
      duration: 'Open',
      status: 'confirmed',
    },
    {
      type: 'Dietician',
      name: 'Dr. Emily Wilson - Consultation',
      date: 'Dec 28, 2:00 PM',
      location: 'Virtual',
      duration: '45 min',
      status: 'confirmed',
    },
  ];

  const pastBookings = [
    {
      type: 'Trainer Session',
      name: 'Sarah Johnson - Yoga',
      date: 'Dec 20, 11:00 AM',
      location: 'Yoga Flow Studio',
      duration: '45 min',
      status: 'completed',
    },
    {
      type: 'Gym Visit',
      name: 'PowerHouse Fitness',
      date: 'Dec 19, 8:00 AM',
      location: 'New York, NY',
      duration: '2 hours',
      status: 'completed',
    },
  ];

  const bookings = selectedTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />

      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-foreground mb-2">
            My Bookings
          </h1>
          <p className="text-foreground-secondary">
            Manage your gym visits, trainer sessions, and consultations
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-neutral-200">
            <div className="flex gap-8">
              <button
                onClick={() => setSelectedTab('upcoming')}
                className={`pb-4 text-sm font-medium transition-colors ${
                  selectedTab === 'upcoming'
                    ? 'border-b-2 border-foreground text-foreground'
                    : 'text-foreground-secondary hover:text-foreground'
                }`}
              >
                Upcoming ({upcomingBookings.length})
              </button>
              <button
                onClick={() => setSelectedTab('past')}
                className={`pb-4 text-sm font-medium transition-colors ${
                  selectedTab === 'past'
                    ? 'border-b-2 border-foreground text-foreground'
                    : 'text-foreground-secondary hover:text-foreground'
                }`}
              >
                Past ({pastBookings.length})
              </button>
            </div>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {bookings.map((booking, index) => (
            <div
              key={index}
              className="bg-background p-6 shadow-card transition-all duration-300 hover:shadow-xl"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex items-center gap-3">
                    <span className="bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                      {booking.type}
                    </span>
                    <span className={`px-3 py-1 text-xs font-semibold ${
                      booking.status === 'confirmed'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-neutral-100 text-foreground-tertiary'
                    }`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-foreground mb-2">
                    {booking.name}
                  </h3>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-foreground-tertiary mb-1">Date & Time</p>
                      <p className="font-medium text-foreground">{booking.date}</p>
                    </div>
                    <div>
                      <p className="text-foreground-tertiary mb-1">Location</p>
                      <p className="font-medium text-foreground">{booking.location}</p>
                    </div>
                    <div>
                      <p className="text-foreground-tertiary mb-1">Duration</p>
                      <p className="font-medium text-foreground">{booking.duration}</p>
                    </div>
                  </div>
                </div>

                {booking.status === 'confirmed' && (
                  <div className="flex gap-2 ml-6">
                    <button className="px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-neutral-100 transition-colors">
                      Reschedule
                    </button>
                    <button className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {bookings.length === 0 && (
            <div className="bg-background p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-foreground-tertiary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-lg font-semibold text-foreground mb-2">
                No {selectedTab} bookings
              </p>
              <p className="text-sm text-foreground-secondary mb-6">
                {selectedTab === 'upcoming'
                  ? 'Book a gym visit, trainer session, or consultation to get started'
                  : 'Your completed bookings will appear here'}
              </p>
              {selectedTab === 'upcoming' && (
                <Link
                  href="/dashboard/explore"
                  className="inline-flex h-10 items-center justify-center bg-primary-500 px-6 text-sm font-semibold text-foreground transition-colors hover:bg-primary-600"
                >
                  Explore & Book
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
