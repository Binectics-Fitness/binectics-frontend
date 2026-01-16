'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function ClassAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const classData = {
    id: classId,
    name: 'Morning Yoga',
    instructor: 'Sarah Johnson',
  };

  // Mock attendance data for the last 30 days
  const sessions = [
    {
      id: 1,
      date: '2024-01-22',
      day: 'Monday',
      time: '7:00 AM',
      capacity: 20,
      attended: 16,
      noShows: 2,
      cancelled: 0,
      attendees: [
        { id: 1, name: 'Emma Wilson', status: 'ATTENDED', checkInTime: '6:58 AM' },
        { id: 2, name: 'James Brown', status: 'ATTENDED', checkInTime: '7:02 AM' },
        { id: 3, name: 'Olivia Davis', status: 'ATTENDED', checkInTime: '7:00 AM' },
        { id: 4, name: 'Michael Chen', status: 'NO_SHOW', checkInTime: null },
        { id: 5, name: 'Sophie Miller', status: 'ATTENDED', checkInTime: '6:55 AM' },
        { id: 6, name: 'Daniel Lee', status: 'ATTENDED', checkInTime: '7:03 AM' },
      ],
    },
    {
      id: 2,
      date: '2024-01-20',
      day: 'Saturday',
      time: '7:00 AM',
      capacity: 20,
      attended: 18,
      noShows: 0,
      cancelled: 0,
      attendees: [],
    },
    {
      id: 3,
      date: '2024-01-19',
      day: 'Friday',
      time: '7:00 AM',
      capacity: 20,
      attended: 17,
      noShows: 1,
      cancelled: 0,
      attendees: [],
    },
    {
      id: 4,
      date: '2024-01-17',
      day: 'Wednesday',
      time: '7:00 AM',
      capacity: 20,
      attended: 15,
      noShows: 3,
      cancelled: 0,
      attendees: [],
    },
    {
      id: 5,
      date: '2024-01-15',
      day: 'Monday',
      time: '7:00 AM',
      capacity: 20,
      attended: 16,
      noShows: 2,
      cancelled: 0,
      attendees: [],
    },
  ];

  const [expandedSession, setExpandedSession] = useState<number | null>(1);

  const totalSessions = sessions.length;
  const totalAttended = sessions.reduce((sum, s) => sum + s.attended, 0);
  const totalNoShows = sessions.reduce((sum, s) => sum + s.noShows, 0);
  const avgAttendance = Math.round(totalAttended / totalSessions);
  const avgAttendanceRate = Math.round((totalAttended / (totalSessions * 20)) * 100);

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.push(`/dashboard/gym-owner/classes/${classId}`)}
            className="text-accent-blue-500 hover:text-accent-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Class
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground">{classData.name} - Attendance</h1>
            <p className="text-foreground/60 mt-1">with {classData.instructor}</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Total Sessions</p>
              <p className="text-3xl font-black text-foreground mt-2">{totalSessions}</p>
              <p className="text-sm text-foreground/60 mt-1">Last 30 days</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Avg Attendance</p>
              <p className="text-3xl font-black text-foreground mt-2">{avgAttendance}</p>
              <p className="text-sm text-foreground/60 mt-1">per session</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Attendance Rate</p>
              <p className="text-3xl font-black text-foreground mt-2">{avgAttendanceRate}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div
                  className="h-2 rounded-full bg-primary-500"
                  style={{ width: `${avgAttendanceRate}%` }}
                />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Total No-Shows</p>
              <p className="text-3xl font-black text-foreground mt-2">{totalNoShows}</p>
              <p className="text-sm text-foreground/60 mt-1">Last 30 days</p>
            </div>
          </div>

          {/* Session History */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-foreground">Session History</h3>
              <button className="text-accent-blue-500 hover:text-accent-blue-700 text-sm font-medium">
                Export Report
              </button>
            </div>

            <div className="space-y-3">
              {sessions.map((session) => {
                const attendanceRate = Math.round((session.attended / session.capacity) * 100);
                const isExpanded = expandedSession === session.id;

                return (
                  <div key={session.id} className="border-2 border-gray-200 rounded-lg overflow-hidden">
                    {/* Session Header */}
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <p className="font-bold text-foreground">
                              {session.day}, {session.date}
                            </p>
                            <p className="text-sm text-foreground/60">{session.time}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground/60">Attended</p>
                            <p className="text-xl font-bold text-primary-500">
                              {session.attended}/{session.capacity}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-sm font-semibold text-foreground/60">Rate</p>
                            <p className="text-xl font-bold text-foreground">{attendanceRate}%</p>
                          </div>

                          {session.noShows > 0 && (
                            <div className="text-right">
                              <p className="text-sm font-semibold text-foreground/60">No-Shows</p>
                              <p className="text-xl font-bold text-red-500">{session.noShows}</p>
                            </div>
                          )}

                          <svg
                            className={`w-5 h-5 text-foreground/60 transition-transform ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Attendee List */}
                    {isExpanded && session.attendees.length > 0 && (
                      <div className="border-t-2 border-gray-200 p-4 bg-gray-50">
                        <h4 className="font-semibold text-foreground mb-3">Attendees</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="border-b border-gray-200">
                              <tr>
                                <th className="text-left py-2 text-sm font-semibold text-foreground/60">
                                  Member
                                </th>
                                <th className="text-left py-2 text-sm font-semibold text-foreground/60">
                                  Status
                                </th>
                                <th className="text-left py-2 text-sm font-semibold text-foreground/60">
                                  Check-in Time
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {session.attendees.map((attendee) => (
                                <tr key={attendee.id} className="border-b border-gray-100 last:border-0">
                                  <td className="py-2 font-medium text-foreground">{attendee.name}</td>
                                  <td className="py-2">
                                    <span
                                      className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                        attendee.status === 'ATTENDED'
                                          ? 'bg-primary-100 text-primary-700'
                                          : attendee.status === 'NO_SHOW'
                                          ? 'bg-red-100 text-red-700'
                                          : 'bg-yellow-100 text-yellow-700'
                                      }`}
                                    >
                                      {attendee.status.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td className="py-2 text-foreground/60">
                                    {attendee.checkInTime || '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
