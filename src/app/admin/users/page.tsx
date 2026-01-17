'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminUsersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Mock data
  const users = [
    { id: 1, name: 'John Smith', email: 'john@example.com', role: 'USER', country: 'United States', status: 'Active', signupDate: '2024-01-15', subscriptions: 2 },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', role: 'USER', country: 'United Kingdom', status: 'Active', signupDate: '2024-01-18', subscriptions: 1 },
    { id: 3, name: 'Mike Chen', email: 'mike@example.com', role: 'TRAINER', country: 'Hong Kong', status: 'Active', signupDate: '2024-01-20', subscriptions: 0 },
    { id: 4, name: 'Emily Davis', email: 'emily@example.com', role: 'USER', country: 'Australia', status: 'Suspended', signupDate: '2024-01-22', subscriptions: 3 },
    { id: 5, name: 'David Kim', email: 'david@example.com', role: 'GYM_OWNER', country: 'South Korea', status: 'Active', signupDate: '2024-01-25', subscriptions: 0 },
    { id: 6, name: 'Maria Garcia', email: 'maria@example.com', role: 'DIETICIAN', country: 'Spain', status: 'Active', signupDate: '2024-01-28', subscriptions: 0 },
    { id: 7, name: 'James Wilson', email: 'james@example.com', role: 'USER', country: 'Canada', status: 'Active', signupDate: '2024-02-01', subscriptions: 1 },
    { id: 8, name: 'Lisa Anderson', email: 'lisa@example.com', role: 'TRAINER', country: 'United States', status: 'Active', signupDate: '2024-02-03', subscriptions: 0 },
  ];

  const handleSuspendUser = (userId: number, userName: string) => {
    if (confirm(`Are you sure you want to suspend ${userName}? They will lose access to the platform.`)) {
      alert('User suspended successfully');
    }
  };

  const handleActivateUser = (userId: number, userName: string) => {
    if (confirm(`Are you sure you want to activate ${userName}?`)) {
      alert('User activated successfully');
    }
  };

  const handleViewUser = (userId: number) => {
    router.push(`/admin/users/${userId}`);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'GYM_OWNER':
        return 'bg-accent-blue-100 text-accent-blue-700';
      case 'TRAINER':
        return 'bg-accent-yellow-100 text-accent-yellow-700';
      case 'DIETICIAN':
        return 'bg-accent-purple-100 text-accent-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-black text-foreground">User Management</h1>
            <p className="mt-1 text-foreground/60">View and manage all platform users</p>
          </div>
        </header>

        <div className="p-8">
          {/* Filters */}
          <div className="bg-white p-6 shadow-card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Search Users
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Filter by Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Roles</option>
                  <option value="USER">Users</option>
                  <option value="GYM_OWNER">Gym Owners</option>
                  <option value="TRAINER">Trainers</option>
                  <option value="DIETICIAN">Dieticians</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Total Users</p>
              <p className="text-3xl font-black text-foreground mt-2">12,458</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Active</p>
              <p className="text-3xl font-black text-primary-500 mt-2">11,892</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Suspended</p>
              <p className="text-3xl font-black text-red-500 mt-2">566</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">New This Week</p>
              <p className="text-3xl font-black text-foreground mt-2">284</p>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white shadow-card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Signup Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Subscriptions
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-semibold text-foreground">{user.name}</p>
                        <p className="text-sm text-foreground/60">{user.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {user.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold ${
                        user.status === 'Active' ? 'bg-primary-100 text-primary-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground/60">
                      {user.signupDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {user.subscriptions}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewUser(user.id)}
                          className="text-red-500 hover:text-red-700 font-semibold"
                        >
                          View
                        </button>
                        {user.status === 'Active' ? (
                          <button
                            onClick={() => handleSuspendUser(user.id, user.name)}
                            className="text-foreground/60 hover:text-red-600 font-semibold"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateUser(user.id, user.name)}
                            className="text-primary-500 hover:text-primary-700 font-semibold"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-foreground/60">
              Showing 1 to 8 of 12,458 users
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-200 text-foreground/60 font-semibold hover:bg-gray-50">
                Previous
              </button>
              <button className="px-4 py-2 bg-red-500 text-foreground font-semibold hover:bg-red-600">
                1
              </button>
              <button className="px-4 py-2 border border-gray-200 text-foreground/60 font-semibold hover:bg-gray-50">
                2
              </button>
              <button className="px-4 py-2 border border-gray-200 text-foreground/60 font-semibold hover:bg-gray-50">
                3
              </button>
              <button className="px-4 py-2 border border-gray-200 text-foreground/60 font-semibold hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
