'use client';

import { useState } from 'react';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function GymOwnerMembersPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const members = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john@example.com',
      plan: 'Basic Monthly',
      status: 'ACTIVE',
      joinDate: '2024-01-15',
      lastVisit: '2 hours ago',
      totalVisits: 45,
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      plan: '3-Month Package',
      status: 'ACTIVE',
      joinDate: '2023-11-20',
      lastVisit: '1 day ago',
      totalVisits: 127,
    },
    {
      id: 3,
      name: 'Mike Davis',
      email: 'mike@example.com',
      plan: 'Basic Monthly',
      status: 'EXPIRED',
      joinDate: '2024-02-01',
      lastVisit: '2 weeks ago',
      totalVisits: 23,
    },
  ];

  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground">Members</h1>
            <p className="text-foreground/60 mt-1">Manage your gym members and subscriptions</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Total Members</p>
              <p className="text-3xl font-black text-foreground mt-2">{members.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Active</p>
              <p className="text-3xl font-black text-primary-500 mt-2">
                {members.filter((m) => m.status === 'ACTIVE').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Expired</p>
              <p className="text-3xl font-black text-red-500 mt-2">
                {members.filter((m) => m.status === 'EXPIRED').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">New This Month</p>
              <p className="text-3xl font-black text-foreground mt-2">12</p>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-xl shadow-card p-6 mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search members..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                />
              </div>
              <button className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">
                All Status
              </button>
              <button className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 font-medium">
                All Plans
              </button>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Member</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Plan</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Join Date</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Last Visit</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Total Visits</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-foreground">{member.name}</p>
                          <p className="text-sm text-foreground/60">{member.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground">{member.plan}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            member.status === 'ACTIVE'
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground/60">{member.joinDate}</td>
                      <td className="px-6 py-4 text-foreground/60">{member.lastVisit}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{member.totalVisits}</td>
                      <td className="px-6 py-4">
                        <button className="text-accent-blue-500 hover:text-accent-blue-700 text-sm font-medium">
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
