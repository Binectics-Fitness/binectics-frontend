'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function TrainerSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const trainerId = params.trainerId as string;

  const trainer = {
    id: trainerId,
    name: 'Sarah Johnson',
    role: 'Personal Trainer',
  };

  const [selectedDay, setSelectedDay] = useState('Monday');

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const schedule = {
    Monday: [
      { time: '06:00 - 07:00', type: 'Available', client: null },
      { time: '07:00 - 08:00', type: 'Booked', client: 'John Doe' },
      { time: '09:00 - 10:00', type: 'Booked', client: 'Jane Smith' },
      { time: '10:00 - 11:00', type: 'Available', client: null },
      { time: '14:00 - 15:00', type: 'Class', client: 'Group HIIT Class' },
      { time: '16:00 - 17:00', type: 'Booked', client: 'Mike Brown' },
      { time: '17:00 - 18:00', type: 'Available', client: null },
    ],
    Tuesday: [
      { time: '06:00 - 07:00', type: 'Available', client: null },
      { time: '10:00 - 11:00', type: 'Booked', client: 'Sarah Lee' },
      { time: '15:00 - 16:00', type: 'Class', client: 'Strength Training' },
    ],
    // Add more days as needed
  };

  const currentDaySchedule = schedule[selectedDay as keyof typeof schedule] || [];

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push(`/dashboard/gym-owner/staff/${trainerId}`)}
            className="text-accent-blue-500 hover:text-accent-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Trainer Profile
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground">Schedule Management</h1>
            <p className="text-foreground/60 mt-1">{trainer.name} - {trainer.role}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">This Week</p>
              <p className="text-3xl font-black text-foreground mt-2">24</p>
              <p className="text-sm text-foreground/60 mt-1">hours booked</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Available</p>
              <p className="text-3xl font-black text-foreground mt-2">16</p>
              <p className="text-sm text-foreground/60 mt-1">hours open</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Classes</p>
              <p className="text-3xl font-black text-foreground mt-2">8</p>
              <p className="text-sm text-foreground/60 mt-1">group sessions</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Utilization</p>
              <p className="text-3xl font-black text-foreground mt-2">60%</p>
              <p className="text-sm text-foreground/60 mt-1">capacity</p>
            </div>
          </div>

          {/* Day Selector */}
          <div className="bg-white rounded-xl shadow-card p-6 mb-6">
            <div className="flex gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    selectedDay === day
                      ? 'bg-accent-blue-500 text-white'
                      : 'bg-gray-100 text-foreground hover:bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Grid */}
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <div className="bg-white rounded-xl shadow-card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-foreground">{selectedDay} Schedule</h3>
                  <button className="px-4 py-2 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600 text-sm">
                    Add Time Slot
                  </button>
                </div>

                <div className="space-y-3">
                  {currentDaySchedule.map((slot, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        slot.type === 'Booked'
                          ? 'border-accent-blue-200 bg-accent-blue-50'
                          : slot.type === 'Class'
                          ? 'border-accent-yellow-200 bg-accent-yellow-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-foreground">{slot.time}</p>
                          {slot.client && (
                            <p className="text-sm text-foreground/60 mt-1">{slot.client}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              slot.type === 'Booked'
                                ? 'bg-accent-blue-500 text-white'
                                : slot.type === 'Class'
                                ? 'bg-accent-yellow-500 text-foreground'
                                : 'bg-primary-100 text-primary-700'
                            }`}
                          >
                            {slot.type}
                          </span>
                          <button className="text-foreground/60 hover:text-foreground">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {currentDaySchedule.length === 0 && (
                    <div className="py-12 text-center">
                      <p className="text-foreground/60">No schedule set for {selectedDay}</p>
                      <button className="mt-4 px-6 py-2 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600">
                        Add Time Slots
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Working Hours */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Working Hours</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground/60">Weekdays</p>
                    <p className="text-foreground mt-1">6:00 AM - 8:00 PM</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/60">Weekends</p>
                    <p className="text-foreground mt-1">8:00 AM - 6:00 PM</p>
                  </div>
                  <button className="w-full px-4 py-2 border-2 border-accent-blue-500 text-accent-blue-500 font-semibold rounded-lg hover:bg-accent-blue-50 text-sm">
                    Edit Hours
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Legend</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-accent-blue-500 rounded"></div>
                    <span className="text-sm text-foreground">Booked Session</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-accent-yellow-500 rounded"></div>
                    <span className="text-sm text-foreground">Group Class</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-primary-500 rounded"></div>
                    <span className="text-sm text-foreground">Available</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 text-left text-accent-blue-500 hover:bg-accent-blue-50 rounded-lg font-medium text-sm">
                    Block Time Off
                  </button>
                  <button className="w-full px-4 py-2 text-left text-accent-blue-500 hover:bg-accent-blue-50 rounded-lg font-medium text-sm">
                    Set Recurring Hours
                  </button>
                  <button className="w-full px-4 py-2 text-left text-accent-blue-500 hover:bg-accent-blue-50 rounded-lg font-medium text-sm">
                    Export Schedule
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
