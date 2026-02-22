'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardRoute } from '@/lib/constants/routes';
import AdminSidebar from '@/components/AdminSidebar';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated or wrong role
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    } else if (!isLoading && user && user.role !== 'ADMIN') {
      router.replace(getDashboardRoute(user.role));
    }
  }, [isLoading, user, router]);

  // Loading and auth checks are handled by layout
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-foreground/60">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const stats = [
    {
      label: 'Total Users',
      value: '12,458',
      change: '+284 this week',
      changeType: 'positive',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      color: 'bg-accent-blue-100',
      iconColor: 'text-accent-blue-600',
    },
    {
      label: 'Active Providers',
      value: '847',
      change: '+12 pending',
      changeType: 'neutral',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'bg-primary-100',
      iconColor: 'text-primary-600',
    },
    {
      label: 'Monthly Revenue',
      value: '$127,450',
      change: '+18.3%',
      changeType: 'positive',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-accent-yellow-100',
      iconColor: 'text-accent-yellow-600',
    },
    {
      label: 'Pending Verifications',
      value: '23',
      change: 'Requires action',
      changeType: 'warning',
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: 'bg-red-100',
      iconColor: 'text-red-600',
    },
  ];

  const recentActivity = [
    { user: 'John Smith', action: 'Registered as Gym Owner', time: '5 minutes ago', type: 'user' },
    { user: 'Sarah Johnson', action: 'Submitted verification documents', time: '12 minutes ago', type: 'verification' },
    { user: 'PowerHouse Gym', action: 'New subscription payment received', time: '23 minutes ago', type: 'payment' },
    { user: 'Mike Davis', action: 'Verified as Personal Trainer', time: '1 hour ago', type: 'verification' },
    { user: 'Emily Brown', action: 'Reported a violation', time: '2 hours ago', type: 'warning' },
  ];

  const pendingActions = [
    { id: 1, title: 'Review 12 verification applications', priority: 'high', count: 12 },
    { id: 2, title: 'Respond to 5 support tickets', priority: 'medium', count: 5 },
    { id: 3, title: 'Review 3 flagged content items', priority: 'high', count: 3 },
    { id: 4, title: 'Approve 8 pending provider profiles', priority: 'low', count: 8 },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />

      <main className="ml-64 flex-1 p-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-foreground/60">
            Welcome back, {user.first_name} {user.last_name}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <div className={stat.iconColor}>{stat.icon}</div>
                </div>
              </div>
              <p className="text-sm font-medium text-foreground/60">{stat.label}</p>
              <p className="text-3xl font-black text-foreground mt-2">{stat.value}</p>
              <p className={`text-sm mt-2 ${
                stat.changeType === 'positive' ? 'text-primary-600' :
                stat.changeType === 'warning' ? 'text-red-600' :
                'text-foreground/60'
              }`}>
                {stat.change}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Pending Actions</h2>
              <div className="space-y-3">
                {pendingActions.map((action) => (
                  <div key={action.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground text-sm">{action.title}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            action.priority === 'high' ? 'bg-red-100 text-red-700' :
                            action.priority === 'medium' ? 'bg-accent-yellow-100 text-accent-yellow-700' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {action.priority}
                          </span>
                          <span className="text-xs text-foreground/60">{action.count} items</span>
                        </div>
                      </div>
                      <svg className="w-5 h-5 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-card p-6">
              <h2 className="text-xl font-bold text-foreground mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                    <div className={`p-2 rounded-lg ${
                      activity.type === 'user' ? 'bg-accent-blue-100' :
                      activity.type === 'verification' ? 'bg-primary-100' :
                      activity.type === 'payment' ? 'bg-accent-yellow-100' :
                      'bg-red-100'
                    }`}>
                      <svg className={`w-4 h-4 ${
                        activity.type === 'user' ? 'text-accent-blue-600' :
                        activity.type === 'verification' ? 'text-primary-600' :
                        activity.type === 'payment' ? 'text-accent-yellow-600' :
                        'text-red-600'
                      }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{activity.user}</p>
                      <p className="text-sm text-foreground/60">{activity.action}</p>
                      <p className="text-xs text-foreground/40 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/admin/verification" className="bg-white rounded-xl shadow-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 rounded-lg">
                  <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Review Verifications</p>
                  <p className="text-sm text-foreground/60">23 pending</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/users" className="bg-white rounded-xl shadow-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-accent-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Manage Users</p>
                  <p className="text-sm text-foreground/60">12,458 total</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/providers" className="bg-white rounded-xl shadow-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent-yellow-100 rounded-lg">
                  <svg className="w-6 h-6 text-accent-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-foreground">View Providers</p>
                  <p className="text-sm text-foreground/60">847 active</p>
                </div>
              </div>
            </Link>

            <Link href="/admin/analytics" className="bg-white rounded-xl shadow-card p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-accent-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-foreground">View Analytics</p>
                  <p className="text-sm text-foreground/60">Platform metrics</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
