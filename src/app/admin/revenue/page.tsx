'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminRevenuePage() {
  const [timeFilter, setTimeFilter] = useState('month');

  // Mock data
  const transactions = [
    {
      id: 1,
      date: '2024-02-14',
      time: '14:32',
      user: 'John Smith',
      provider: 'PowerHouse Gym',
      plan: 'Premium Monthly',
      amount: '$49.99',
      platformFee: '$4.99',
      providerPayout: '$45.00',
      status: 'Completed',
      paymentMethod: 'Stripe',
    },
    {
      id: 2,
      date: '2024-02-14',
      time: '12:15',
      user: 'Sarah Johnson',
      provider: 'Mike Chen - Training',
      plan: 'Elite Package',
      amount: '$199.99',
      platformFee: '$19.99',
      providerPayout: '$180.00',
      status: 'Completed',
      paymentMethod: 'Stripe',
    },
    {
      id: 3,
      date: '2024-02-14',
      time: '09:45',
      user: 'Emily Davis',
      provider: 'Dr. Maria Garcia',
      plan: 'Nutrition Plan',
      amount: '$89.99',
      platformFee: '$8.99',
      providerPayout: '$81.00',
      status: 'Completed',
      paymentMethod: 'PayPal',
    },
    {
      id: 4,
      date: '2024-02-13',
      time: '16:20',
      user: 'Mike Wilson',
      provider: 'FitCore Studio',
      plan: 'Annual Membership',
      amount: '$499.99',
      platformFee: '$49.99',
      providerPayout: '$450.00',
      status: 'Completed',
      paymentMethod: 'Stripe',
    },
    {
      id: 5,
      date: '2024-02-13',
      time: '11:30',
      user: 'David Kim',
      provider: 'PowerHouse Gym',
      plan: 'Basic Plan',
      amount: '$29.99',
      platformFee: '$2.99',
      providerPayout: '$27.00',
      status: 'Pending',
      paymentMethod: 'Stripe',
    },
    {
      id: 6,
      date: '2024-02-13',
      time: '10:05',
      user: 'Lisa Anderson',
      provider: 'Mike Chen - Training',
      plan: 'Basic Training',
      amount: '$99.99',
      platformFee: '$9.99',
      providerPayout: '$90.00',
      status: 'Failed',
      paymentMethod: 'Stripe',
    },
  ];

  const payoutQueue = [
    { provider: 'PowerHouse Gym', amount: '$12,450', dueDate: '2024-02-20', status: 'Scheduled' },
    { provider: 'Mike Chen - Training', amount: '$8,340', dueDate: '2024-02-20', status: 'Scheduled' },
    { provider: 'FitCore Studio', amount: '$9,870', dueDate: '2024-02-20', status: 'Scheduled' },
    { provider: 'Dr. Maria Garcia', amount: '$5,620', dueDate: '2024-02-18', status: 'Ready' },
  ];

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-primary-100 text-primary-700';
      case 'Pending':
        return 'bg-accent-yellow-100 text-accent-yellow-700';
      case 'Failed':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleProcessPayout = (provider: string, amount: string) => {
    if (confirm(`Process payout of ${amount} to ${provider}?`)) {
      alert('Payout processed successfully');
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-black text-foreground">Revenue & Payouts</h1>
            <p className="mt-1 text-foreground/60">Track platform earnings and provider payouts</p>
          </div>
        </header>

        <div className="p-8">
          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Total Revenue (MTD)</p>
              <p className="text-3xl font-black text-foreground mt-2">$127,450</p>
              <p className="text-sm text-primary-500 mt-2">↑ 23.8% from last month</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Platform Fees Collected</p>
              <p className="text-3xl font-black text-primary-500 mt-2">$12,745</p>
              <p className="text-sm text-foreground/60 mt-2">10% commission</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Pending Payouts</p>
              <p className="text-3xl font-black text-accent-yellow-500 mt-2">$36,280</p>
              <p className="text-sm text-foreground/60 mt-2">Due in next 7 days</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Failed Transactions</p>
              <p className="text-3xl font-black text-red-500 mt-2">$4,230</p>
              <p className="text-sm text-foreground/60 mt-2">12 transactions</p>
            </div>
          </div>

          {/* Time Filter */}
          <div className="bg-white p-6 shadow-card mb-6">
            <div className="flex gap-3">
              <button
                onClick={() => setTimeFilter('today')}
                className={`px-6 py-3 font-semibold ${
                  timeFilter === 'today'
                    ? 'bg-red-500 text-foreground'
                    : 'bg-gray-100 text-foreground/60 hover:bg-gray-200'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setTimeFilter('week')}
                className={`px-6 py-3 font-semibold ${
                  timeFilter === 'week'
                    ? 'bg-red-500 text-foreground'
                    : 'bg-gray-100 text-foreground/60 hover:bg-gray-200'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setTimeFilter('month')}
                className={`px-6 py-3 font-semibold ${
                  timeFilter === 'month'
                    ? 'bg-red-500 text-foreground'
                    : 'bg-gray-100 text-foreground/60 hover:bg-gray-200'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setTimeFilter('year')}
                className={`px-6 py-3 font-semibold ${
                  timeFilter === 'year'
                    ? 'bg-red-500 text-foreground'
                    : 'bg-gray-100 text-foreground/60 hover:bg-gray-200'
                }`}
              >
                This Year
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Recent Transactions */}
            <div className="lg:col-span-2">
              <div className="bg-white shadow-card overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-foreground">Recent Transactions</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                          Date & Time
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                          Transaction
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                          Platform Fee
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-foreground uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-semibold text-foreground">{txn.date}</p>
                            <p className="text-xs text-foreground/60">{txn.time}</p>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-foreground">{txn.user}</p>
                            <p className="text-xs text-foreground/60">{txn.provider} - {txn.plan}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-semibold text-foreground">{txn.amount}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-semibold text-primary-600">{txn.platformFee}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(txn.status)}`}>
                              {txn.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Payout Queue */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-6">Payout Queue</h2>
                <div className="space-y-4">
                  {payoutQueue.map((payout, index) => (
                    <div key={index} className="p-4 border-2 border-gray-200 hover:border-red-500 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <p className="font-semibold text-foreground mb-1">{payout.provider}</p>
                          <p className="text-2xl font-black text-foreground">{payout.amount}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold ${
                          payout.status === 'Ready' ? 'bg-primary-100 text-primary-700' : 'bg-accent-yellow-100 text-accent-yellow-700'
                        }`}>
                          {payout.status}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/60 mb-3">Due: {payout.dueDate}</p>
                      {payout.status === 'Ready' && (
                        <button
                          onClick={() => handleProcessPayout(payout.provider, payout.amount)}
                          className="w-full px-4 py-2 bg-primary-500 text-foreground font-semibold hover:bg-primary-600 transition-colors"
                        >
                          Process Payout
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-foreground/60">Stripe Transactions</p>
                <div className="p-2 bg-accent-blue-100">
                  <svg className="w-5 h-5 text-accent-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">$102,340</p>
              <p className="text-sm text-foreground/60 mt-1">80.3% of total</p>
            </div>

            <div className="bg-white p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-foreground/60">PayPal Transactions</p>
                <div className="p-2 bg-accent-yellow-100">
                  <svg className="w-5 h-5 text-accent-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">$25,110</p>
              <p className="text-sm text-foreground/60 mt-1">19.7% of total</p>
            </div>

            <div className="bg-white p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-foreground/60">Avg. Transaction Value</p>
                <div className="p-2 bg-primary-100">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">$68.45</p>
              <p className="text-sm text-foreground/60 mt-1">Per transaction</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
