'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function GymOwnerPlansPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleEditPlan = (planId: number) => {
    router.push(`/dashboard/gym-owner/plans/${planId}`);
  };

  const handleDeletePlan = (planId: number, planName: string) => {
    if (confirm(`Are you sure you want to delete "${planName}"? This action cannot be undone.`)) {
      alert('Plan deleted successfully');
      // In production: API call to delete plan
    }
  };

  const plans = [
    {
      id: 1,
      name: 'Basic Monthly',
      type: 'SUBSCRIPTION',
      price: 49,
      duration: 30,
      activeMembers: 234,
      revenue: 11466,
      isActive: true,
    },
    {
      id: 2,
      name: '3-Month Package',
      type: 'SUBSCRIPTION',
      price: 129,
      duration: 90,
      activeMembers: 89,
      revenue: 11481,
      isActive: true,
    },
    {
      id: 3,
      name: 'Day Pass',
      type: 'ONE_TIME',
      price: 15,
      duration: 1,
      activeMembers: 45,
      revenue: 675,
      isActive: true,
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-black text-foreground">Membership Plans</h1>
              <p className="text-foreground/60 mt-1">Create and manage your gym's pricing plans</p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="h-12 px-6 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Plan
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Total Plans</p>
              <p className="text-3xl font-black text-foreground mt-2">{plans.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Active Members</p>
              <p className="text-3xl font-black text-foreground mt-2">
                {plans.reduce((sum, p) => sum + p.activeMembers, 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Monthly Revenue</p>
              <p className="text-3xl font-black text-foreground mt-2">
                ${plans.reduce((sum, p) => sum + p.revenue, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Avg Plan Price</p>
              <p className="text-3xl font-black text-foreground mt-2">
                ${Math.round(plans.reduce((sum, p) => sum + p.price, 0) / plans.length)}
              </p>
            </div>
          </div>

          {/* Plans List */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Plan Name</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Active Members</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Revenue</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-foreground">{plan.name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            plan.type === 'SUBSCRIPTION'
                              ? 'bg-accent-blue-100 text-accent-blue-700'
                              : 'bg-primary-100 text-primary-700'
                          }`}
                        >
                          {plan.type === 'SUBSCRIPTION' ? 'Subscription' : 'One-time'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">${plan.price}</td>
                      <td className="px-6 py-4 text-foreground/60">
                        {plan.duration === 1 ? '1 day' : `${plan.duration} days`}
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground">{plan.activeMembers}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">
                        ${plan.revenue.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            plan.isActive
                              ? 'bg-primary-100 text-primary-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditPlan(plan.id)}
                            className="text-accent-blue-500 hover:text-accent-blue-700 text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePlan(plan.id, plan.name)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create Plan Modal (placeholder) */}
          {isCreating && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
                <h2 className="text-2xl font-black text-foreground mb-6">Create New Plan</h2>
                <p className="text-foreground/60 mb-4">
                  Plan creation form coming soon...
                </p>
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-3 bg-gray-200 text-foreground font-semibold rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
