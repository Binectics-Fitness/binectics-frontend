'use client';

import { useRouter, useParams } from 'next/navigation';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminProviderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const providerId = params.providerId;

  // Mock provider data
  const provider = {
    id: providerId,
    name: 'PowerHouse Gym',
    email: 'contact@powerhousegym.com',
    type: 'GYM_OWNER',
    ownerName: 'David Martinez',
    location: 'Los Angeles, USA',
    address: '123 Fitness Street, Downtown LA',
    phone: '+1 (555) 987-6543',
    status: 'Active',
    verified: true,
    joinedDate: '2023-06-15',
    lastActive: '2024-02-14 16:20',
    description: 'Premier fitness facility with state-of-the-art equipment and expert trainers.',
    facilities: ['Cardio Equipment', 'Free Weights', 'Group Classes', 'Sauna', 'Locker Rooms', 'Personal Training'],
  };

  const plans = [
    { id: 1, name: 'Premium Monthly', type: 'SUBSCRIPTION', price: '$49.99', duration: '1 month', active: 156 },
    { id: 2, name: 'Annual Membership', type: 'SUBSCRIPTION', price: '$499.99', duration: '12 months', active: 89 },
    { id: 3, name: 'Day Pass', type: 'ONE_TIME', price: '$15.00', duration: '1 day', active: 97 },
  ];

  const revenueData = {
    thisMonth: '$12,450',
    lastMonth: '$11,230',
    total: '$87,650',
    platformFees: '$8,765',
  };

  const recentMembers = [
    { name: 'John Smith', plan: 'Premium Monthly', joinedDate: '2024-02-14', status: 'Active' },
    { name: 'Sarah Johnson', plan: 'Annual Membership', joinedDate: '2024-02-12', status: 'Active' },
    { name: 'Mike Wilson', plan: 'Day Pass', joinedDate: '2024-02-10', status: 'Expired' },
    { name: 'Emily Davis', plan: 'Premium Monthly', joinedDate: '2024-02-08', status: 'Active' },
  ];

  const reviews = [
    { user: 'John Smith', rating: 5, comment: 'Amazing facilities!', date: '2024-02-14' },
    { user: 'Mike Wilson', rating: 4, comment: 'Great gym, gets crowded during peak hours.', date: '2024-02-11' },
    { user: 'Lisa Brown', rating: 5, comment: 'Best gym in LA!', date: '2024-02-09' },
  ];

  const handleSuspendProvider = () => {
    if (confirm(`Are you sure you want to suspend ${provider.name}? Their services will be temporarily unavailable.`)) {
      alert('Provider suspended successfully');
      router.push('/admin/providers');
    }
  };

  const handleRevokeVerification = () => {
    if (confirm(`Are you sure you want to revoke verification for ${provider.name}? They will lose their verified badge.`)) {
      alert('Verification revoked successfully');
    }
  };

  const handleDeleteProvider = () => {
    const confirmation = prompt(`Type "${provider.email}" to confirm permanent deletion:`);
    if (confirmation === provider.email) {
      alert('Provider deleted permanently');
      router.push('/admin/providers');
    } else if (confirmation) {
      alert('Confirmation failed. Provider not deleted.');
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
            <button
              onClick={() => router.push('/admin/providers')}
              className="text-sm text-foreground/60 hover:text-foreground flex items-center gap-2 mb-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Providers
            </button>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-black text-foreground">{provider.name}</h1>
                  {provider.verified && (
                    <span className="px-4 py-2 bg-primary-500 text-foreground font-semibold">
                      ✓ VERIFIED
                    </span>
                  )}
                  <span className={`px-3 py-1 text-sm font-semibold ${getTypeBadgeColor(provider.type)}`}>
                    {provider.type.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-foreground/60">{provider.email}</p>
              </div>
              <div className="flex gap-3">
                <button className="px-6 py-3 border-2 border-gray-200 text-foreground font-semibold hover:border-red-500 transition-colors">
                  Send Email
                </button>
                <button
                  onClick={handleSuspendProvider}
                  className="px-6 py-3 bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                >
                  Suspend Provider
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Provider Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <div className="bg-white p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-6">Provider Information</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Business Name</p>
                    <p className="font-semibold text-foreground">{provider.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Owner</p>
                    <p className="font-semibold text-foreground">{provider.ownerName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Email</p>
                    <p className="font-semibold text-foreground">{provider.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Phone</p>
                    <p className="font-semibold text-foreground">{provider.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-foreground/60 mb-1">Address</p>
                    <p className="font-semibold text-foreground">{provider.address}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Joined Date</p>
                    <p className="font-semibold text-foreground">{provider.joinedDate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Last Active</p>
                    <p className="font-semibold text-foreground">{provider.lastActive}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-sm font-medium text-foreground/60 mb-2">Description</p>
                  <p className="text-foreground">{provider.description}</p>
                </div>
                <div className="mt-6">
                  <p className="text-sm font-medium text-foreground/60 mb-2">Facilities</p>
                  <div className="flex flex-wrap gap-2">
                    {provider.facilities.map((facility, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-foreground text-sm">
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Plans */}
              <div className="bg-white p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-6">Plans & Pricing</h2>
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <div key={plan.id} className="p-4 border-2 border-gray-200 hover:border-red-500 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-bold text-foreground">{plan.name}</h3>
                          <p className="text-sm text-foreground/60">{plan.duration} • {plan.type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-foreground">{plan.price}</p>
                          <p className="text-sm text-foreground/60">{plan.active} active</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Members */}
              <div className="bg-white p-6 shadow-card">
                <h2 className="text-xl font-bold text-foreground mb-6">Recent Members</h2>
                <div className="space-y-3">
                  {recentMembers.map((member, index) => (
                    <div key={index} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-semibold text-foreground">{member.name}</p>
                        <p className="text-sm text-foreground/60">{member.plan}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-foreground/60">{member.joinedDate}</p>
                        <span className={`text-xs px-2 py-1 font-semibold ${
                          member.status === 'Active' ? 'bg-primary-100 text-primary-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {member.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Revenue Stats */}
              <div className="bg-white p-6 shadow-card">
                <h3 className="text-lg font-bold text-foreground mb-4">Revenue Stats</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-foreground/60">This Month</p>
                    <p className="text-2xl font-black text-foreground">{revenueData.thisMonth}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60">Last Month</p>
                    <p className="text-xl font-black text-foreground/60">{revenueData.lastMonth}</p>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm text-foreground/60">Total Revenue</p>
                    <p className="text-2xl font-black text-foreground">{revenueData.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60">Platform Fees Paid</p>
                    <p className="text-xl font-black text-primary-500">{revenueData.platformFees}</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white p-6 shadow-card">
                <h3 className="text-lg font-bold text-foreground mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-foreground/60">Total Members</p>
                    <p className="text-2xl font-black text-foreground">342</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60">Active Plans</p>
                    <p className="text-2xl font-black text-foreground">3</p>
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60">Avg. Rating</p>
                    <p className="text-2xl font-black text-foreground">4.8/5</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {provider.verified && (
                <div className="bg-accent-yellow-50 border-2 border-accent-yellow-500 p-6">
                  <h3 className="text-lg font-bold text-accent-yellow-700 mb-4">Verification</h3>
                  <button
                    onClick={handleRevokeVerification}
                    className="w-full px-6 py-3 bg-accent-yellow-500 text-foreground font-semibold hover:bg-accent-yellow-600 transition-colors"
                  >
                    Revoke Verification
                  </button>
                </div>
              )}

              {/* Danger Zone */}
              <div className="bg-red-50 border-2 border-red-500 p-6">
                <h3 className="text-lg font-bold text-red-700 mb-4">Danger Zone</h3>
                <button
                  onClick={handleDeleteProvider}
                  className="w-full px-6 py-3 bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                >
                  Delete Provider Permanently
                </button>
                <p className="text-xs text-red-600 mt-2">
                  This will delete all provider data, plans, and member subscriptions.
                </p>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white p-6 shadow-card">
            <h2 className="text-xl font-bold text-foreground mb-6">Recent Reviews</h2>
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <div key={index} className="p-4 border-b border-gray-100 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-foreground">{review.user}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{'⭐'.repeat(review.rating)}</span>
                      <span className="text-sm text-foreground/60">{review.date}</span>
                    </div>
                  </div>
                  <p className="text-foreground/60">{review.comment}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
