'use client';

import AdminSidebar from '@/components/AdminSidebar';

export default function AdminAnalyticsPage() {
  // Mock data
  const userGrowth = [
    { month: 'Aug', users: 8420 },
    { month: 'Sep', users: 9150 },
    { month: 'Oct', users: 10200 },
    { month: 'Nov', users: 11100 },
    { month: 'Dec', users: 11890 },
    { month: 'Jan', users: 12458 },
  ];

  const revenueData = [
    { month: 'Aug', revenue: 89400 },
    { month: 'Sep', revenue: 95200 },
    { month: 'Oct', revenue: 105800 },
    { month: 'Nov', revenue: 112300 },
    { month: 'Dec', revenue: 119600 },
    { month: 'Jan', revenue: 127450 },
  ];

  const topCountries = [
    { country: 'United States', users: 3842, percentage: 30.8 },
    { country: 'United Kingdom', users: 1987, percentage: 15.9 },
    { country: 'Canada', users: 1245, percentage: 10.0 },
    { country: 'Australia', users: 982, percentage: 7.9 },
    { country: 'Germany', users: 756, percentage: 6.1 },
  ];

  const categoryDistribution = [
    { category: 'Gym Memberships', count: 1876, color: 'bg-accent-blue-500' },
    { category: 'Personal Training', count: 1342, color: 'bg-accent-yellow-500' },
    { category: 'Nutrition Plans', count: 624, color: 'bg-accent-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-black text-foreground">Platform Analytics</h1>
            <p className="mt-1 text-foreground/60">Insights and metrics for the entire platform</p>
          </div>
        </header>

        <div className="p-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Total Revenue (MTD)</p>
              <p className="text-3xl font-black text-foreground mt-2">$127,450</p>
              <p className="text-sm text-primary-500 mt-2">↑ 23.8% from last month</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Active Subscriptions</p>
              <p className="text-3xl font-black text-foreground mt-2">2,987</p>
              <p className="text-sm text-primary-500 mt-2">↑ 12.4% from last month</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Avg. Subscription Value</p>
              <p className="text-3xl font-black text-foreground mt-2">$42.67</p>
              <p className="text-sm text-primary-500 mt-2">↑ 5.2% from last month</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Churn Rate</p>
              <p className="text-3xl font-black text-foreground mt-2">8.3%</p>
              <p className="text-sm text-red-500 mt-2">↑ 1.2% from last month</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* User Growth Chart */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-6">User Growth (Last 6 Months)</h2>
              <div className="h-64 flex items-end gap-4">
                {userGrowth.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-accent-blue-500 transition-all hover:bg-accent-blue-600"
                      style={{ height: `${(data.users / 12458) * 100}%` }}
                      title={`${data.users} users`}
                    ></div>
                    <p className="text-xs text-foreground/60 mt-2">{data.month}</p>
                    <p className="text-xs font-semibold text-foreground">{data.users.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-6">Revenue Trend (Last 6 Months)</h2>
              <div className="h-64 flex items-end gap-4">
                {revenueData.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-primary-500 transition-all hover:bg-primary-600"
                      style={{ height: `${(data.revenue / 127450) * 100}%` }}
                      title={`$${data.revenue.toLocaleString()}`}
                    ></div>
                    <p className="text-xs text-foreground/60 mt-2">{data.month}</p>
                    <p className="text-xs font-semibold text-foreground">${(data.revenue / 1000).toFixed(0)}K</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Countries */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-6">Top Countries by Users</h2>
              <div className="space-y-4">
                {topCountries.map((country, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-foreground">{country.country}</p>
                      <p className="text-sm text-foreground/60">{country.users.toLocaleString()} users ({country.percentage}%)</p>
                    </div>
                    <div className="w-full bg-gray-200 h-2">
                      <div
                        className="bg-red-500 h-2"
                        style={{ width: `${country.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-xl font-bold text-foreground mb-6">Active Subscriptions by Category</h2>
              <div className="space-y-6">
                {categoryDistribution.map((category, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className={`w-16 h-16 ${category.color} flex items-center justify-center`}>
                      <p className="text-2xl font-black text-foreground">{category.count}</p>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{category.category}</p>
                      <p className="text-sm text-foreground/60">{((category.count / 3842) * 100).toFixed(1)}% of total subscriptions</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-primary-100">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/60">Avg. Session Duration</p>
                  <p className="text-2xl font-black text-foreground">18m 42s</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-accent-yellow-100">
                  <svg className="w-6 h-6 text-accent-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/60">Verification Success Rate</p>
                  <p className="text-2xl font-black text-foreground">87.4%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-accent-purple-100">
                  <svg className="w-6 h-6 text-accent-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/60">Platform Rating</p>
                  <p className="text-2xl font-black text-foreground">4.8/5.0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
