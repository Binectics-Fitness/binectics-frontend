'use client';

import { useParams, useRouter } from 'next/navigation';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  const handleDeletePlan = () => {
    if (confirm('Are you sure you want to delete this plan? All active subscriptions will need to be migrated.')) {
      alert('Plan deleted successfully');
      router.push('/dashboard/gym-owner/plans');
    }
  };

  const plan = {
    id: planId,
    name: 'Basic Monthly',
    type: 'SUBSCRIPTION',
    price: 49,
    duration: 30,
    description: 'Perfect for getting started with your fitness journey',
    features: ['Unlimited gym access', '24/7 facility access', 'Free WiFi', 'Locker access'],
    activeMembers: 234,
    revenue: 11466,
    isActive: true,
  };

  const subscribers = [
    { id: 1, name: 'John Smith', email: 'john@example.com', startDate: '2024-01-15', status: 'ACTIVE' },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', startDate: '2024-01-10', status: 'ACTIVE' },
    { id: 3, name: 'Mike Davis', email: 'mike@example.com', startDate: '2024-01-05', status: 'ACTIVE' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-accent-blue-500 hover:text-accent-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Plans
          </button>

          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-black text-foreground">{plan.name}</h1>
              <p className="text-foreground/60 mt-1">{plan.description}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push(`/dashboard/gym-owner/plans/${planId}/edit`)}
                className="px-4 py-2 border-2 border-accent-blue-500 text-accent-blue-500 font-semibold rounded-lg hover:bg-accent-blue-50"
              >
                Edit Plan
              </button>
              <button
                onClick={handleDeletePlan}
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600"
              >
                Delete Plan
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Price</p>
              <p className="text-3xl font-black text-foreground mt-2">${plan.price}</p>
              <p className="text-sm text-foreground/60 mt-1">per {plan.duration} days</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Active Subscribers</p>
              <p className="text-3xl font-black text-foreground mt-2">{plan.activeMembers}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Monthly Revenue</p>
              <p className="text-3xl font-black text-foreground mt-2">${plan.revenue.toLocaleString()}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Status</p>
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 mt-2">
                {plan.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              {/* Subscribers */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Subscribers ({subscribers.length})</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Member</th>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Email</th>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Start Date</th>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscribers.map((sub) => (
                        <tr key={sub.id} className="border-b border-gray-100 last:border-0">
                          <td className="py-3 font-medium text-foreground">{sub.name}</td>
                          <td className="py-3 text-foreground/60">{sub.email}</td>
                          <td className="py-3 text-foreground/60">{sub.startDate}</td>
                          <td className="py-3">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                              {sub.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Plan Details */}
            <div>
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Plan Features</h3>
                <div className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
