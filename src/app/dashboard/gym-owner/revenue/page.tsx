'use client';

import { useState } from 'react';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function GymOwnerRevenuePage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const revenueData = {
    today: 2340,
    week: 15680,
    month: 67450,
    year: 789500,
  };

  const transactions = [
    { id: 1, member: 'John Smith', plan: 'Basic Monthly', amount: 49, date: '2024-01-16', status: 'completed' },
    { id: 2, member: 'Sarah Johnson', plan: '3-Month Package', amount: 129, date: '2024-01-16', status: 'completed' },
    { id: 3, member: 'Mike Davis', plan: 'Day Pass', amount: 15, date: '2024-01-15', status: 'completed' },
    { id: 4, member: 'Emily Brown', plan: 'Basic Monthly', amount: 49, date: '2024-01-15', status: 'pending' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground">Revenue & Earnings</h1>
            <p className="text-foreground/60 mt-1">Track your gym's financial performance</p>
          </div>

          {/* Revenue Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Today</p>
              <p className="text-3xl font-black text-foreground mt-2">${revenueData.today.toLocaleString()}</p>
              <p className="text-sm text-primary-500 mt-2">+8% from yesterday</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">This Week</p>
              <p className="text-3xl font-black text-foreground mt-2">${revenueData.week.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">This Month</p>
              <p className="text-3xl font-black text-foreground mt-2">${revenueData.month.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">This Year</p>
              <p className="text-3xl font-black text-foreground mt-2">${revenueData.year.toLocaleString()}</p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-card p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-foreground">Revenue Trends</h3>
              <div className="flex gap-2">
                {['week', 'month', 'year'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === period
                        ? 'bg-accent-blue-500 text-white'
                        : 'bg-gray-100 text-foreground hover:bg-gray-200'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-foreground/60">Revenue chart visualization coming soon...</p>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-foreground">Recent Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Member</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Plan</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Amount</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-foreground">{tx.member}</td>
                      <td className="px-6 py-4 text-foreground/60">{tx.plan}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">${tx.amount}</td>
                      <td className="px-6 py-4 text-foreground/60">{tx.date}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            tx.status === 'completed'
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {tx.status}
                        </span>
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
