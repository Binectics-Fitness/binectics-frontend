'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminDashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'ADMIN')) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-foreground/60">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black text-foreground">Admin Dashboard</h1>
              <p className="mt-1 text-foreground/60">
                Welcome back, {user.firstName} {user.lastName}
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-sm font-medium text-foreground/60 hover:text-foreground"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60">Total Users</p>
                <p className="mt-2 text-3xl font-black text-foreground">0</p>
              </div>
              <div className="w-12 h-12 bg-primary-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60">Gym Owners</p>
                <p className="mt-2 text-3xl font-black text-foreground">0</p>
              </div>
              <div className="w-12 h-12 bg-accent-blue-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60">Trainers</p>
                <p className="mt-2 text-3xl font-black text-foreground">0</p>
              </div>
              <div className="w-12 h-12 bg-accent-yellow-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground/60">Dieticians</p>
                <p className="mt-2 text-3xl font-black text-foreground">0</p>
              </div>
              <div className="w-12 h-12 bg-accent-purple-500/10 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-accent-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-card p-8">
          <h2 className="text-2xl font-black text-foreground mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
              onClick={() => router.push('/admin/create-super-admin')}
              className="p-6 text-left border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-500/5 transition-colors"
            >
              <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Create Test Accounts</h3>
              <p className="text-sm text-foreground/60">Create super admin accounts for testing</p>
            </button>

            <button
              disabled
              className="p-6 text-left border-2 border-gray-200 rounded-xl opacity-50 cursor-not-allowed"
            >
              <div className="w-10 h-10 bg-accent-blue-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Verification Queue</h3>
              <p className="text-sm text-foreground/60">Review pending verifications (Coming soon)</p>
            </button>

            <button
              disabled
              className="p-6 text-left border-2 border-gray-200 rounded-xl opacity-50 cursor-not-allowed"
            >
              <div className="w-10 h-10 bg-accent-purple-500 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Platform Analytics</h3>
              <p className="text-sm text-foreground/60">View platform metrics (Coming soon)</p>
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="mt-8 bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-bold text-foreground mb-4">Your Admin Account</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-foreground/60">Email:</span>
              <span className="ml-2 font-semibold text-foreground">{user.email}</span>
            </div>
            <div>
              <span className="text-foreground/60">Role:</span>
              <span className="ml-2 font-semibold text-foreground">{user.role}</span>
            </div>
            <div>
              <span className="text-foreground/60">Account Status:</span>
              <span className="ml-2 font-semibold text-primary-500">Active</span>
            </div>
            <div>
              <span className="text-foreground/60">Email Verified:</span>
              <span className="ml-2 font-semibold text-foreground">
                {user.isEmailVerified ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
