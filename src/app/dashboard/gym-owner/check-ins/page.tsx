'use client';

import { useState } from 'react';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function GymOwnerCheckInsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  const checkIns = [
    { id: 1, memberName: 'John Smith', time: '08:15 AM', date: '2024-01-16' },
    { id: 2, memberName: 'Sarah Johnson', time: '09:30 AM', date: '2024-01-16' },
    { id: 3, memberName: 'Mike Davis', time: '10:45 AM', date: '2024-01-16' },
    { id: 4, memberName: 'Emily Brown', time: '11:20 AM', date: '2024-01-16' },
    { id: 5, memberName: 'Alex Wilson', time: '12:05 PM', date: '2024-01-16' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground">QR Check-ins</h1>
            <p className="text-foreground/60 mt-1">Track member attendance and gym traffic</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Today's Check-ins</p>
              <p className="text-3xl font-black text-foreground mt-2">87</p>
              <p className="text-sm text-primary-500 mt-2">+12% from yesterday</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">This Week</p>
              <p className="text-3xl font-black text-foreground mt-2">456</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">This Month</p>
              <p className="text-3xl font-black text-foreground mt-2">1,847</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Peak Hour</p>
              <p className="text-3xl font-black text-foreground mt-2">6 PM</p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-accent-blue-50 border-2 border-accent-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Your Gym QR Code</h3>
              <div className="bg-white rounded-lg p-6 flex items-center justify-center mb-4">
                <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
                  <svg className="w-32 h-32 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm4 4H7V7h2v2zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm4 4H7v-2h2v2zM13 3h8v8h-8V3zm2 2v4h4V5h-4zm4 4h-2V7h2v2zM13 13h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4-2h2v4h-2v-4zm2 0h2v2h-2v-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-sm text-foreground/60 text-center mb-4">
                Members scan this code to check in
              </p>
              <button className="w-full px-4 py-3 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600">
                Download QR Code
              </button>
            </div>

            {/* Recent Check-ins */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Recent Check-ins</h3>
              <div className="space-y-3">
                {checkIns.slice(0, 5).map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {checkIn.memberName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{checkIn.memberName}</p>
                        <p className="text-sm text-foreground/60">Checked in</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{checkIn.time}</p>
                      <p className="text-sm text-foreground/60">{checkIn.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Check-in History */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-foreground">Check-in History</h3>
              <div className="flex gap-2">
                {['today', 'week', 'month'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === period
                        ? 'bg-accent-blue-500 text-white'
                        : 'bg-gray-100 text-foreground hover:bg-gray-200'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-foreground/60">Check-in chart visualization coming soon...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
