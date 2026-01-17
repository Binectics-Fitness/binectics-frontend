'use client';

import { useRouter, useParams } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminUserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId;

  // Mock user data
  const user = {
    id: userId,
    name: 'John Smith',
    email: 'john@example.com',
    role: 'USER',
    country: 'United States',
    city: 'Los Angeles',
    phone: '+1 (555) 123-4567',
    status: 'Active',
    signupDate: '2024-01-15',
    lastLogin: '2024-02-14 14:32',
    emailVerified: true,
    phoneVerified: false,
  };

  const subscriptions = [
    {
      id: 1,
      provider: 'PowerHouse Gym',
      plan: 'Premium Monthly',
      status: 'ACTIVE',
      startDate: '2024-01-15',
      nextBilling: '2024-03-15',
      amount: '$49.99',
    },
    {
      id: 2,
      provider: 'Mike Chen - Personal Training',
      plan: 'Basic Package',
      status: 'ACTIVE',
      startDate: '2024-02-01',
      nextBilling: '2024-03-01',
      amount: '$99.99',
    },
    {
      id: 3,
      provider: 'FitCore Studio',
      plan: 'Day Pass',
      status: 'EXPIRED',
      startDate: '2024-01-20',
      nextBilling: '-',
      amount: '$15.00',
    },
  ];

  const activityLog = [
    { date: '2024-02-14 14:32', action: 'Logged in', details: 'From Los Angeles, USA' },
    { date: '2024-02-14 10:15', action: 'Checked in', details: 'PowerHouse Gym' },
    { date: '2024-02-13 18:20', action: 'Updated profile', details: 'Changed phone number' },
    { date: '2024-02-13 09:30', action: 'New subscription', details: 'Mike Chen - Basic Package' },
    { date: '2024-02-10 16:45', action: 'Logged in', details: 'From Los Angeles, USA' },
  ];

  const handleSuspendUser = () => {
    if (confirm(`Are you sure you want to suspend ${user.name}? They will lose access to the platform.`)) {
      alert('User suspended successfully');
      router.push('/admin/users');
    }
  };

  const handleDeleteUser = () => {
    const confirmation = prompt(`Type "${user.email}" to confirm permanent deletion of this account:`);
    if (confirmation === user.email) {
      alert('User account deleted permanently');
      router.push('/admin/users');
    } else if (confirmation) {
      alert('Confirmation failed. Account not deleted.');
    }
  };

  const handleSendEmail = () => {
    const message = prompt('Enter email message to send to user:');
    if (message) {
      alert('Email sent successfully');
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-primary-100 text-primary-700';
      case 'EXPIRED':
        return 'bg-red-100 text-red-700';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-accent-yellow-100 text-accent-yellow-700';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <button
              onClick={() => router.push('/admin/users')}
              className="text-sm text-foreground/60 hover:text-foreground flex items-center gap-2 mb-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Users
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-black text-foreground">{user.name}</h1>
                <p className="mt-1 text-foreground/60">{user.email}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSendEmail}
                  className="px-6 py-3 border-2 border-gray-200 text-foreground font-semibold hover:border-red-500 transition-colors"
                >
                  Send Email
                </button>
                <button
                  onClick={handleSuspendUser}
                  className="px-6 py-3 bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                >
                  Suspend User
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* User Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <div className="bg-white p-6 shadow-card mb-6">
                <h2 className="text-xl font-bold text-foreground mb-6">User Information</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Full Name</p>
                    <p className="font-semibold text-foreground">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Email</p>
                    <p className="font-semibold text-foreground">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Role</p>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-semibold">
                      {user.role}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Status</p>
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 text-sm font-semibold">
                      {user.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Phone</p>
                    <p className="font-semibold text-foreground">{user.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Location</p>
                    <p className="font-semibold text-foreground">{user.city}, {user.country}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Signup Date</p>
                    <p className="font-semibold text-foreground">{user.signupDate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Last Login</p>
                    <p className="font-semibold text-foreground">{user.lastLogin}</p>
                  </div>
                </div>
              </div>

              {/* Subscriptions */}
              <div className="bg-white p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-6">Active Subscriptions</h2>
                <div className="space-y-4">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="p-4 border-2 border-gray-200 hover:border-red-500 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-foreground mb-1">{sub.provider}</h3>
                          <p className="text-sm text-foreground/60">{sub.plan}</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(sub.status)}`}>
                          {sub.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-foreground/60">Amount</p>
                          <p className="font-semibold text-foreground">{sub.amount}</p>
                        </div>
                        <div>
                          <p className="text-foreground/60">Start Date</p>
                          <p className="font-semibold text-foreground">{sub.startDate}</p>
                        </div>
                        <div>
                          <p className="text-foreground/60">Next Billing</p>
                          <p className="font-semibold text-foreground">{sub.nextBilling}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Verification Status */}
              <div className="bg-white p-6 shadow-card">
                <h3 className="text-lg font-bold text-foreground mb-4">Verification Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/60">Email</span>
                    <span className={user.emailVerified ? 'text-primary-500' : 'text-red-500'}>
                      {user.emailVerified ? '✓ Verified' : '✗ Not Verified'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground/60">Phone</span>
                    <span className={user.phoneVerified ? 'text-primary-500' : 'text-red-500'}>
                      {user.phoneVerified ? '✓ Verified' : '✗ Not Verified'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white p-6 shadow-card">
                <h3 className="text-lg font-bold text-foreground mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-foreground/60">Total Subscriptions</p>
                    <p className="text-2xl font-black text-foreground">3</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60">Total Spent</p>
                    <p className="text-2xl font-black text-foreground">$164.98</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60">Check-ins</p>
                    <p className="text-2xl font-black text-foreground">42</p>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-red-50 border-2 border-red-500 p-6">
                <h3 className="text-lg font-bold text-red-700 mb-4">Danger Zone</h3>
                <button
                  onClick={handleDeleteUser}
                  className="w-full px-6 py-3 bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                >
                  Delete Account Permanently
                </button>
                <p className="text-xs text-red-600 mt-2">
                  This action cannot be undone. All user data will be permanently deleted.
                </p>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-6">Recent Activity</h2>
            <div className="space-y-3">
              {activityLog.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 pb-3 border-b border-gray-100 last:border-0">
                  <div className="p-2 bg-gray-100">
                    <svg className="w-4 h-4 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-foreground">{activity.action}</p>
                      <p className="text-sm text-foreground/60">{activity.date}</p>
                    </div>
                    <p className="text-sm text-foreground/60 mt-1">{activity.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
