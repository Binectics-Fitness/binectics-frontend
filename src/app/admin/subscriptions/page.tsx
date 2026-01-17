'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminSubscriptionsPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data
  const subscriptions = [
    {
      id: 1,
      user: 'John Smith',
      userEmail: 'john@example.com',
      provider: 'PowerHouse Gym',
      plan: 'Premium Monthly',
      amount: '$49.99',
      status: 'ACTIVE',
      startDate: '2024-01-15',
      nextBilling: '2024-03-15',
      duration: '1 month',
    },
    {
      id: 2,
      user: 'Sarah Johnson',
      userEmail: 'sarah@example.com',
      provider: 'Mike Chen - Personal Training',
      plan: 'Elite Training Package',
      amount: '$199.99',
      status: 'ACTIVE',
      startDate: '2024-02-01',
      nextBilling: '2024-03-01',
      duration: '1 month',
    },
    {
      id: 3,
      user: 'Emily Davis',
      userEmail: 'emily@example.com',
      provider: 'Dr. Maria Garcia - Nutrition',
      plan: 'Weight Loss Plan',
      amount: '$89.99',
      status: 'CANCELLED',
      startDate: '2023-12-10',
      nextBilling: '-',
      duration: '3 months',
    },
    {
      id: 4,
      user: 'Mike Wilson',
      userEmail: 'mike@example.com',
      provider: 'FitCore Studio',
      plan: 'Annual Membership',
      amount: '$499.99',
      status: 'ACTIVE',
      startDate: '2023-06-01',
      nextBilling: '2024-06-01',
      duration: '12 months',
    },
    {
      id: 5,
      user: 'Lisa Anderson',
      userEmail: 'lisa@example.com',
      provider: 'PowerHouse Gym',
      plan: 'Day Pass',
      amount: '$15.00',
      status: 'EXPIRED',
      startDate: '2024-02-01',
      nextBilling: '-',
      duration: '1 day',
    },
    {
      id: 6,
      user: 'David Kim',
      userEmail: 'david@example.com',
      provider: 'Mike Chen - Personal Training',
      plan: 'Basic Training',
      amount: '$99.99',
      status: 'PENDING_PAYMENT',
      startDate: '2024-02-10',
      nextBilling: '2024-03-10',
      duration: '1 month',
    },
  ];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-primary-100 text-primary-700';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-700';
      case 'EXPIRED':
        return 'bg-red-100 text-red-700';
      case 'PENDING_PAYMENT':
        return 'bg-accent-yellow-100 text-accent-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleCancelSubscription = (id: number, user: string) => {
    if (confirm(`Are you sure you want to cancel ${user}'s subscription? This action cannot be undone.`)) {
      alert('Subscription cancelled successfully');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-black text-foreground">Subscription Management</h1>
            <p className="mt-1 text-foreground/60">Monitor and manage all platform subscriptions</p>
          </div>
        </header>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Total Subscriptions</p>
              <p className="text-3xl font-black text-foreground mt-2">3,842</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Active</p>
              <p className="text-3xl font-black text-primary-500 mt-2">2,987</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Pending Payment</p>
              <p className="text-3xl font-black text-accent-yellow-500 mt-2">156</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Cancelled</p>
              <p className="text-3xl font-black text-gray-500 mt-2">423</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Expired</p>
              <p className="text-3xl font-black text-red-500 mt-2">276</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 shadow-card mb-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-6 py-3 font-semibold ${
                  statusFilter === 'all'
                    ? 'bg-red-500 text-foreground'
                    : 'bg-gray-100 text-foreground/60 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-6 py-3 font-semibold ${
                  statusFilter === 'active'
                    ? 'bg-red-500 text-foreground'
                    : 'bg-gray-100 text-foreground/60 hover:bg-gray-200'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-6 py-3 font-semibold ${
                  statusFilter === 'pending'
                    ? 'bg-red-500 text-foreground'
                    : 'bg-gray-100 text-foreground/60 hover:bg-gray-200'
                }`}
              >
                Pending Payment
              </button>
              <button
                onClick={() => setStatusFilter('cancelled')}
                className={`px-6 py-3 font-semibold ${
                  statusFilter === 'cancelled'
                    ? 'bg-red-500 text-foreground'
                    : 'bg-gray-100 text-foreground/60 hover:bg-gray-200'
                }`}
              >
                Cancelled
              </button>
              <button
                onClick={() => setStatusFilter('expired')}
                className={`px-6 py-3 font-semibold ${
                  statusFilter === 'expired'
                    ? 'bg-red-500 text-foreground'
                    : 'bg-gray-100 text-foreground/60 hover:bg-gray-200'
                }`}
              >
                Expired
              </button>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="bg-white shadow-card overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Provider & Plan
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Start Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                    Next Billing
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-semibold text-foreground">{sub.user}</p>
                        <p className="text-sm text-foreground/60">{sub.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-foreground">{sub.plan}</p>
                        <p className="text-sm text-foreground/60">{sub.provider}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-semibold text-foreground">{sub.amount}</p>
                      <p className="text-xs text-foreground/60">{sub.duration}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(sub.status)}`}>
                        {sub.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {sub.startDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {sub.nextBilling}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-red-500 hover:text-red-700 font-semibold">
                          View
                        </button>
                        {sub.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleCancelSubscription(sub.id, sub.user)}
                            className="text-foreground/60 hover:text-red-600 font-semibold"
                          >
                            Cancel
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
              Showing 1 to 6 of 3,842 subscriptions
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
