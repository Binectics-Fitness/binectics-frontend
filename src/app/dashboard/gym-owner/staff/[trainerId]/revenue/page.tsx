'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function TrainerRevenuePage() {
  const params = useParams();
  const router = useRouter();
  const trainerId = params.trainerId as string;

  const trainer = {
    id: trainerId,
    name: 'Sarah Johnson',
    role: 'Personal Trainer',
  };

  const [revenueShare, setRevenueShare] = useState(70);
  const [effectiveDate, setEffectiveDate] = useState('immediate');

  // Mock revenue data
  const monthlyRevenue = 4500;
  const trainerEarnings = (monthlyRevenue * revenueShare) / 100;
  const gymEarnings = (monthlyRevenue * (100 - revenueShare)) / 100;

  const revenueHistory = [
    { month: 'January 2024', total: 4500, trainerShare: 70, trainerEarned: 3150, gymEarned: 1350 },
    { month: 'December 2023', total: 4200, trainerShare: 70, trainerEarned: 2940, gymEarned: 1260 },
    { month: 'November 2023', total: 3800, trainerShare: 70, trainerEarned: 2660, gymEarned: 1140 },
    { month: 'October 2023', total: 4100, trainerShare: 70, trainerEarned: 2870, gymEarned: 1230 },
  ];

  const handleSave = async () => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    router.push(`/dashboard/gym-owner/staff/${trainerId}`);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.push(`/dashboard/gym-owner/staff/${trainerId}`)}
            className="text-accent-blue-500 hover:text-accent-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Trainer Profile
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground">Revenue Split Settings</h1>
            <p className="text-foreground/60 mt-1">{trainer.name} - {trainer.role}</p>
          </div>

          {/* Current Split Preview */}
          <div className="bg-white rounded-xl shadow-card p-8 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-6">Current Revenue Split</h3>

            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <p className="text-sm font-medium text-foreground/60 mb-2">Monthly Revenue</p>
                <p className="text-4xl font-black text-foreground">${monthlyRevenue.toLocaleString()}</p>
              </div>
              <div className="bg-accent-blue-50 rounded-lg p-6 text-center border-2 border-accent-blue-200">
                <p className="text-sm font-medium text-foreground/60 mb-2">Trainer Gets</p>
                <p className="text-4xl font-black text-accent-blue-600">${trainerEarnings.toLocaleString()}</p>
                <p className="text-sm font-semibold text-accent-blue-600 mt-1">{revenueShare}%</p>
              </div>
              <div className="bg-primary-50 rounded-lg p-6 text-center border-2 border-primary-200">
                <p className="text-sm font-medium text-foreground/60 mb-2">Gym Gets</p>
                <p className="text-4xl font-black text-primary-600">${gymEarnings.toLocaleString()}</p>
                <p className="text-sm font-semibold text-primary-600 mt-1">{100 - revenueShare}%</p>
              </div>
            </div>

            {/* Visual Split Bar */}
            <div className="mb-4">
              <div className="flex h-12 rounded-lg overflow-hidden">
                <div
                  className="bg-accent-blue-500 flex items-center justify-center text-white font-bold"
                  style={{ width: `${revenueShare}%` }}
                >
                  {revenueShare}%
                </div>
                <div
                  className="bg-primary-500 flex items-center justify-center text-white font-bold"
                  style={{ width: `${100 - revenueShare}%` }}
                >
                  {100 - revenueShare}%
                </div>
              </div>
            </div>
          </div>

          {/* Adjust Split */}
          <div className="bg-white rounded-xl shadow-card p-8 mb-6">
            <h3 className="text-lg font-bold text-foreground mb-6">Adjust Revenue Split</h3>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-foreground mb-3">
                Trainer's Share: {revenueShare}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={revenueShare}
                onChange={(e) => setRevenueShare(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent-blue-500"
              />
              <div className="flex justify-between text-sm text-foreground/60 mt-2">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="p-4 bg-accent-blue-50 rounded-lg border border-accent-blue-200">
                <p className="text-sm font-medium text-foreground/60">Trainer Will Earn</p>
                <p className="text-2xl font-black text-accent-blue-600 mt-1">
                  ${((monthlyRevenue * revenueShare) / 100).toLocaleString()}
                </p>
                <p className="text-sm text-foreground/60 mt-1">per month (based on current revenue)</p>
              </div>
              <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
                <p className="text-sm font-medium text-foreground/60">Gym Will Earn</p>
                <p className="text-2xl font-black text-primary-600 mt-1">
                  ${((monthlyRevenue * (100 - revenueShare)) / 100).toLocaleString()}
                </p>
                <p className="text-sm text-foreground/60 mt-1">per month (based on current revenue)</p>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-foreground mb-2">
                When should this change take effect?
              </label>
              <select
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
              >
                <option value="immediate">Immediately</option>
                <option value="next-month">Beginning of next month</option>
                <option value="next-billing">Next billing cycle</option>
              </select>
            </div>

            <div className="p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg mb-6">
              <div className="flex gap-2">
                <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="font-semibold text-yellow-800">Important</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Changing the revenue split will affect the trainer's earnings. Make sure to communicate this change with the trainer before implementing it.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => router.back()}
                className="px-6 py-3 border-2 border-gray-300 text-foreground font-semibold rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-3 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600"
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Revenue History */}
          <div className="bg-white rounded-xl shadow-card p-8">
            <h3 className="text-lg font-bold text-foreground mb-4">Revenue History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 text-sm font-semibold text-foreground/60">Month</th>
                    <th className="text-right py-3 text-sm font-semibold text-foreground/60">Total Revenue</th>
                    <th className="text-right py-3 text-sm font-semibold text-foreground/60">Split</th>
                    <th className="text-right py-3 text-sm font-semibold text-foreground/60">Trainer Earned</th>
                    <th className="text-right py-3 text-sm font-semibold text-foreground/60">Gym Earned</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueHistory.map((record, index) => (
                    <tr key={index} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 font-medium text-foreground">{record.month}</td>
                      <td className="py-3 text-right text-foreground">${record.total.toLocaleString()}</td>
                      <td className="py-3 text-right text-foreground">{record.trainerShare}% / {100 - record.trainerShare}%</td>
                      <td className="py-3 text-right font-semibold text-accent-blue-600">${record.trainerEarned.toLocaleString()}</td>
                      <td className="py-3 text-right font-semibold text-primary-600">${record.gymEarned.toLocaleString()}</td>
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
