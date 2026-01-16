'use client';

import { useParams, useRouter } from 'next/navigation';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function TrainerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const trainerId = params.trainerId as string;

  // Mock trainer data
  const trainer = {
    id: trainerId,
    name: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
    phone: '+1 (555) 234-5678',
    role: 'Personal Trainer',
    status: 'ACTIVE',
    joinedDate: '2024-01-15',
    avatar: 'SJ',
    revenueShare: 70,
    specialties: ['Strength Training', 'Weight Loss', 'HIIT'],
    certifications: ['NASM-CPT', 'ACE Certified'],
    bio: 'Passionate fitness professional with 5 years of experience helping clients achieve their goals through personalized training programs.',
  };

  const stats = {
    clients: 12,
    monthlyRevenue: 4500,
    sessions: 48,
    avgRating: 4.8,
  };

  const clients = [
    { id: 1, name: 'John Doe', sessions: 12, lastSession: '2024-01-16', status: 'ACTIVE' },
    { id: 2, name: 'Jane Smith', sessions: 8, lastSession: '2024-01-15', status: 'ACTIVE' },
    { id: 3, name: 'Mike Brown', sessions: 15, lastSession: '2024-01-14', status: 'ACTIVE' },
  ];

  const recentSessions = [
    { id: 1, client: 'John Doe', date: '2024-01-16', time: '10:00 AM', revenue: 75 },
    { id: 2, client: 'Jane Smith', date: '2024-01-15', time: '2:00 PM', revenue: 75 },
    { id: 3, client: 'Mike Brown', date: '2024-01-14', time: '4:00 PM', revenue: 75 },
  ];

  const gymRevenue = (stats.monthlyRevenue * (100 - trainer.revenueShare)) / 100;
  const trainerRevenue = (stats.monthlyRevenue * trainer.revenueShare) / 100;

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-accent-blue-500 hover:text-accent-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Staff
          </button>

          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-accent-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {trainer.avatar}
              </div>
              <div>
                <h1 className="text-3xl font-black text-foreground">{trainer.name}</h1>
                <p className="text-foreground/60 mt-1">{trainer.role}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                      trainer.status === 'ACTIVE'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {trainer.status}
                  </span>
                  <span className="text-sm text-foreground/60">Joined {trainer.joinedDate}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/dashboard/gym-owner/staff/${trainerId}/schedule`)}
                className="px-4 py-2 border-2 border-accent-blue-500 text-accent-blue-500 font-semibold rounded-lg hover:bg-accent-blue-50"
              >
                Manage Schedule
              </button>
              <button
                onClick={() => router.push(`/dashboard/gym-owner/staff/${trainerId}/revenue`)}
                className="px-4 py-2 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600"
              >
                Revenue Settings
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Active Clients</p>
              <p className="text-3xl font-black text-foreground mt-2">{stats.clients}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Monthly Revenue</p>
              <p className="text-3xl font-black text-foreground mt-2">${stats.monthlyRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Sessions This Month</p>
              <p className="text-3xl font-black text-foreground mt-2">{stats.sessions}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Average Rating</p>
              <p className="text-3xl font-black text-foreground mt-2">{stats.avgRating}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground/60">Email</p>
                    <p className="text-foreground mt-1">{trainer.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/60">Phone</p>
                    <p className="text-foreground mt-1">{trainer.phone}</p>
                  </div>
                </div>
              </div>

              {/* Clients */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Active Clients</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Client</th>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Sessions</th>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Last Session</th>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client) => (
                        <tr key={client.id} className="border-b border-gray-100 last:border-0">
                          <td className="py-3 font-medium text-foreground">{client.name}</td>
                          <td className="py-3 text-foreground/60">{client.sessions}</td>
                          <td className="py-3 text-foreground/60">{client.lastSession}</td>
                          <td className="py-3">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                              {client.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Sessions */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Recent Sessions</h3>
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground">{session.client}</p>
                        <p className="text-sm text-foreground/60">
                          {session.date} at {session.time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">${session.revenue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Revenue Split */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Revenue Split</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground/60">Trainer's Share</p>
                    <p className="text-2xl font-black text-foreground mt-1">{trainer.revenueShare}%</p>
                    <p className="text-sm text-foreground/60 mt-1">${trainerRevenue.toLocaleString()} this month</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground/60">Gym's Share</p>
                    <p className="text-2xl font-black text-foreground mt-1">{100 - trainer.revenueShare}%</p>
                    <p className="text-sm text-foreground/60 mt-1">${gymRevenue.toLocaleString()} this month</p>
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/gym-owner/staff/${trainerId}/revenue`)}
                    className="w-full px-4 py-2 border-2 border-accent-blue-500 text-accent-blue-500 font-semibold rounded-lg hover:bg-accent-blue-50"
                  >
                    Update Revenue Split
                  </button>
                </div>
              </div>

              {/* Specialties */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Specialties</h3>
                <div className="flex flex-wrap gap-2">
                  {trainer.specialties.map((specialty, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-accent-blue-50 text-accent-blue-700 rounded-full text-sm font-medium"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Certifications</h3>
                <div className="space-y-2">
                  {trainer.certifications.map((cert, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-foreground">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-2 text-left text-accent-blue-500 hover:bg-accent-blue-50 rounded-lg font-medium">
                    Send Message
                  </button>
                  <button className="w-full px-4 py-2 text-left text-accent-blue-500 hover:bg-accent-blue-50 rounded-lg font-medium">
                    View Full Profile
                  </button>
                  <button className="w-full px-4 py-2 text-left text-accent-blue-500 hover:bg-accent-blue-50 rounded-lg font-medium">
                    Edit Permissions
                  </button>
                  {trainer.status === 'ACTIVE' ? (
                    <button className="w-full px-4 py-2 text-left text-yellow-600 hover:bg-yellow-50 rounded-lg font-medium">
                      Suspend Access
                    </button>
                  ) : (
                    <button className="w-full px-4 py-2 text-left text-primary-500 hover:bg-primary-50 rounded-lg font-medium">
                      Activate Trainer
                    </button>
                  )}
                  <button className="w-full px-4 py-2 text-left text-red-500 hover:bg-red-50 rounded-lg font-medium">
                    Remove from Gym
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
