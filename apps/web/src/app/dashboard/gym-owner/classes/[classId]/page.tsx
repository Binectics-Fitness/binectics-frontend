'use client';

import { useParams, useRouter } from 'next/navigation';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const classData = {
    id: classId,
    name: 'Morning Yoga',
    instructor: 'Sarah Johnson',
    schedule: 'Monday, Wednesday, Friday at 7:00 AM',
    duration: '60 minutes',
    capacity: 20,
    enrolled: 18,
    waitlist: 3,
    description: 'Start your day with a peaceful yoga session focused on flexibility and mindfulness.',
    location: 'Studio A',
    level: 'All Levels',
    equipment: 'Yoga mat, blocks, straps (provided)',
    status: 'ACTIVE',
  };

  const enrolledMembers = [
    { id: 1, name: 'Emma Wilson', email: 'emma@example.com', joinedDate: '2024-01-15', attendance: '95%' },
    { id: 2, name: 'James Brown', email: 'james@example.com', joinedDate: '2024-01-10', attendance: '88%' },
    { id: 3, name: 'Olivia Davis', email: 'olivia@example.com', joinedDate: '2024-01-08', attendance: '92%' },
    { id: 4, name: 'Michael Chen', email: 'michael@example.com', joinedDate: '2024-01-05', attendance: '78%' },
    { id: 5, name: 'Sophie Miller', email: 'sophie@example.com', joinedDate: '2024-01-03', attendance: '100%' },
    { id: 6, name: 'Daniel Lee', email: 'daniel@example.com', joinedDate: '2024-01-02', attendance: '85%' },
  ];

  const upcomingSessions = [
    { id: 1, date: 'Mon, Jan 22', time: '7:00 AM', expectedAttendees: 16 },
    { id: 2, date: 'Wed, Jan 24', time: '7:00 AM', expectedAttendees: 18 },
    { id: 3, date: 'Fri, Jan 26', time: '7:00 AM', expectedAttendees: 17 },
    { id: 4, date: 'Mon, Jan 29', time: '7:00 AM', expectedAttendees: 18 },
  ];

  const utilizationPercentage = Math.round((classData.enrolled / classData.capacity) * 100);

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-accent-blue-500 hover:text-accent-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Classes
          </button>

          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-black text-foreground">{classData.name}</h1>
              <p className="text-foreground/60 mt-1">with {classData.instructor}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/dashboard/gym-owner/classes/${classId}/edit`)}
                className="px-4 py-2 border-2 border-accent-blue-500 text-accent-blue-500 font-semibold rounded-lg hover:bg-accent-blue-50"
              >
                Edit Class
              </button>
              <button
                onClick={() => router.push(`/dashboard/gym-owner/classes/${classId}/attendance`)}
                className="px-4 py-2 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600"
              >
                View Attendance
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Enrolled</p>
              <p className="text-3xl font-black text-foreground mt-2">{classData.enrolled}</p>
              <p className="text-sm text-foreground/60 mt-1">of {classData.capacity} capacity</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Utilization</p>
              <p className="text-3xl font-black text-foreground mt-2">{utilizationPercentage}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div
                  className={`h-2 rounded-full ${
                    utilizationPercentage >= 90
                      ? 'bg-red-500'
                      : utilizationPercentage >= 70
                      ? 'bg-accent-yellow-500'
                      : 'bg-primary-500'
                  }`}
                  style={{ width: `${utilizationPercentage}%` }}
                />
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Waitlist</p>
              <p className="text-3xl font-black text-foreground mt-2">{classData.waitlist}</p>
              <p className="text-sm text-foreground/60 mt-1">members waiting</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Status</p>
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 mt-2">
                {classData.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left Column - Enrolled Members */}
            <div className="col-span-2">
              <div className="bg-white rounded-xl shadow-card p-6 mb-6">
                <h3 className="text-lg font-bold text-foreground mb-4">
                  Enrolled Members ({enrolledMembers.length})
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Member</th>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Email</th>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Joined</th>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Attendance</th>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledMembers.map((member) => (
                        <tr key={member.id} className="border-b border-gray-100 last:border-0">
                          <td className="py-3 font-medium text-foreground">{member.name}</td>
                          <td className="py-3 text-foreground/60">{member.email}</td>
                          <td className="py-3 text-foreground/60">{member.joinedDate}</td>
                          <td className="py-3">
                            <span
                              className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                parseInt(member.attendance) >= 90
                                  ? 'bg-primary-100 text-primary-700'
                                  : parseInt(member.attendance) >= 70
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {member.attendance}
                            </span>
                          </td>
                          <td className="py-3">
                            <button className="text-accent-blue-500 hover:text-accent-blue-700 text-sm font-medium">
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Upcoming Sessions</h3>
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{session.date}</p>
                        <p className="text-sm text-foreground/60">{session.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-foreground">
                          {session.expectedAttendees} expected
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Class Details */}
            <div>
              <div className="bg-white rounded-xl shadow-card p-6 mb-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Class Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground/60">Schedule</p>
                    <p className="text-foreground mt-1">{classData.schedule}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/60">Duration</p>
                    <p className="text-foreground mt-1">{classData.duration}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/60">Location</p>
                    <p className="text-foreground mt-1">{classData.location}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/60">Level</p>
                    <p className="text-foreground mt-1">{classData.level}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/60">Equipment</p>
                    <p className="text-foreground mt-1">{classData.equipment}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Description</h3>
                <p className="text-foreground/80">{classData.description}</p>
              </div>

              <div className="bg-white rounded-xl shadow-card p-6 mt-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 text-left text-accent-blue-500 hover:bg-accent-blue-50 rounded-lg font-medium">
                    Send Announcement
                  </button>
                  <button className="w-full px-4 py-2 text-left text-accent-blue-500 hover:bg-accent-blue-50 rounded-lg font-medium">
                    Cancel Session
                  </button>
                  <button className="w-full px-4 py-2 text-left text-accent-blue-500 hover:bg-accent-blue-50 rounded-lg font-medium">
                    Change Instructor
                  </button>
                  <button className="w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 rounded-lg font-medium">
                    Delete Class
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
