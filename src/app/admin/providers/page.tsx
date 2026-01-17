'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminProvidersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  // Mock data
  const providers = [
    {
      id: 1,
      name: 'PowerHouse Gym',
      email: 'contact@powerhousegym.com',
      type: 'GYM_OWNER',
      location: 'Los Angeles, USA',
      verified: true,
      members: 342,
      revenue: '$12,450',
      joinedDate: '2023-06-15',
      status: 'Active',
    },
    {
      id: 2,
      name: 'Mike Chen',
      email: 'mike@trainer.com',
      type: 'TRAINER',
      location: 'Hong Kong',
      verified: true,
      members: 28,
      revenue: '$3,200',
      joinedDate: '2023-08-20',
      status: 'Active',
    },
    {
      id: 3,
      name: 'Dr. Maria Garcia',
      email: 'maria@nutrition.com',
      type: 'DIETICIAN',
      location: 'Barcelona, Spain',
      verified: true,
      members: 45,
      revenue: '$5,600',
      joinedDate: '2023-09-10',
      status: 'Active',
    },
    {
      id: 4,
      name: 'FitCore Studio',
      email: 'info@fitcore.uk',
      type: 'GYM_OWNER',
      location: 'London, UK',
      verified: true,
      members: 289,
      revenue: '$9,870',
      joinedDate: '2023-07-22',
      status: 'Active',
    },
    {
      id: 5,
      name: 'Sarah Johnson',
      email: 'sarah@personaltraining.com',
      type: 'TRAINER',
      location: 'Sydney, Australia',
      verified: false,
      members: 12,
      revenue: '$1,400',
      joinedDate: '2024-01-05',
      status: 'Active',
    },
    {
      id: 6,
      name: 'Elite Fitness Center',
      email: 'contact@elitefitness.com',
      type: 'GYM_OWNER',
      location: 'Dubai, UAE',
      verified: true,
      members: 456,
      revenue: '$18,900',
      joinedDate: '2023-05-10',
      status: 'Suspended',
    },
  ];

  const handleViewProvider = (id: number) => {
    router.push(`/admin/providers/${id}`);
  };

  const handleSuspendProvider = (id: number, name: string) => {
    if (confirm(`Are you sure you want to suspend ${name}? Their services will be temporarily unavailable.`)) {
      alert('Provider suspended successfully');
    }
  };

  const handleActivateProvider = (id: number, name: string) => {
    if (confirm(`Are you sure you want to activate ${name}?`)) {
      alert('Provider activated successfully');
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
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
            <h1 className="text-3xl font-black text-foreground">Provider Management</h1>
            <p className="mt-1 text-foreground/60">Manage gyms, trainers, and dieticians</p>
          </div>
        </header>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 shadow-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent-blue-100">
                  <svg className="w-5 h-5 text-accent-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/60">Gyms</p>
                  <p className="text-2xl font-black text-foreground">342</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 shadow-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent-yellow-100">
                  <svg className="w-5 h-5 text-accent-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/60">Trainers</p>
                  <p className="text-2xl font-black text-foreground">289</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 shadow-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-accent-purple-100">
                  <svg className="w-5 h-5 text-accent-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/60">Dieticians</p>
                  <p className="text-2xl font-black text-foreground">216</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 shadow-card">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-primary-100">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/60">Verified</p>
                  <p className="text-2xl font-black text-foreground">789</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 shadow-card mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Search Providers
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or location..."
                  className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">
                  Filter by Type
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="all">All Types</option>
                  <option value="GYM_OWNER">Gyms</option>
                  <option value="TRAINER">Trainers</option>
                  <option value="DIETICIAN">Dieticians</option>
                </select>
              </div>
            </div>
          </div>

          {/* Providers Table */}
          <div className="bg-white shadow-card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Members
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {providers.map((provider) => (
                  <tr key={provider.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">{provider.name}</p>
                          {provider.verified && (
                            <span className="text-primary-500" title="Verified">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground/60">{provider.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold ${getTypeBadgeColor(provider.type)}`}>
                        {provider.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {provider.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground">
                      {provider.members}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground">
                      {provider.revenue}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold ${
                        provider.status === 'Active' ? 'bg-primary-100 text-primary-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {provider.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewProvider(provider.id)}
                          className="text-red-500 hover:text-red-700 font-semibold"
                        >
                          View
                        </button>
                        {provider.status === 'Active' ? (
                          <button
                            onClick={() => handleSuspendProvider(provider.id, provider.name)}
                            className="text-foreground/60 hover:text-red-600 font-semibold"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateProvider(provider.id, provider.name)}
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
              Showing 1 to 6 of 847 providers
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
