'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function StaffPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Mock staff data
  const staff = [
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      role: 'Personal Trainer',
      status: 'ACTIVE',
      joinedDate: '2024-01-15',
      clients: 12,
      revenue: 4500,
      revenueShare: 70,
      avatar: 'SJ',
      specialties: ['Strength Training', 'Weight Loss'],
    },
    {
      id: 2,
      name: 'Mike Chen',
      email: 'mike.chen@example.com',
      role: 'Personal Trainer',
      status: 'ACTIVE',
      joinedDate: '2023-11-20',
      clients: 18,
      revenue: 6200,
      revenueShare: 70,
      avatar: 'MC',
      specialties: ['HIIT', 'CrossFit'],
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      email: 'emily.r@example.com',
      role: 'Yoga Instructor',
      status: 'ACTIVE',
      joinedDate: '2023-09-10',
      clients: 25,
      revenue: 3800,
      revenueShare: 65,
      avatar: 'ER',
      specialties: ['Yoga', 'Pilates'],
    },
    {
      id: 4,
      name: 'David Kim',
      email: 'david.kim@example.com',
      role: 'Personal Trainer',
      status: 'PENDING',
      joinedDate: '2024-01-18',
      clients: 0,
      revenue: 0,
      revenueShare: 70,
      avatar: 'DK',
      specialties: ['Bodybuilding', 'Nutrition'],
    },
  ];

  const filteredStaff = staff.filter((member) => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || member.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalStaff = staff.length;
  const activeStaff = staff.filter(s => s.status === 'ACTIVE').length;
  const totalClients = staff.reduce((sum, s) => sum + s.clients, 0);
  const totalRevenue = staff.reduce((sum, s) => sum + s.revenue, 0);

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-black text-foreground">Staff & Trainers</h1>
              <p className="text-foreground/60 mt-1">Manage personal trainers and instructors at your gym</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/gym-owner/staff/invite')}
              className="px-6 py-3 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Invite Trainer
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Total Staff</p>
              <p className="text-3xl font-black text-foreground mt-2">{totalStaff}</p>
              <p className="text-sm text-accent-blue-500 mt-1">{activeStaff} active</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Total Clients</p>
              <p className="text-3xl font-black text-foreground mt-2">{totalClients}</p>
              <p className="text-sm text-foreground/60 mt-1">across all trainers</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Trainer Revenue</p>
              <p className="text-3xl font-black text-foreground mt-2">${totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-foreground/60 mt-1">this month</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Avg Revenue Share</p>
              <p className="text-3xl font-black text-foreground mt-2">68%</p>
              <p className="text-sm text-foreground/60 mt-1">to trainers</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-card p-6 mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search trainers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Staff List */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground/60">Trainer</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground/60">Role</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground/60">Clients</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground/60">Revenue</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground/60">Share</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground/60">Status</th>
                    <th className="text-left py-4 px-6 text-sm font-semibold text-foreground/60">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-accent-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {member.avatar}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">{member.name}</p>
                            <p className="text-sm text-foreground/60">{member.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-foreground">{member.role}</p>
                        <p className="text-sm text-foreground/60">Joined {member.joinedDate}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-lg font-bold text-foreground">{member.clients}</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-foreground">${member.revenue.toLocaleString()}</p>
                        <p className="text-sm text-foreground/60">this month</p>
                      </td>
                      <td className="py-4 px-6">
                        <p className="font-semibold text-foreground">{member.revenueShare}%</p>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            member.status === 'ACTIVE'
                              ? 'bg-primary-100 text-primary-700'
                              : member.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => router.push(`/dashboard/gym-owner/staff/${member.id}`)}
                          className="text-accent-blue-500 hover:text-accent-blue-700 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredStaff.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-foreground/60">No trainers found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
