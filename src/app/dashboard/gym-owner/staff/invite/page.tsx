'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function InviteTrainerPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Personal Trainer',
    revenueShare: '70',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simulate API call to send invitation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Redirect back to staff page
    router.push('/dashboard/gym-owner/staff');
  };

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-accent-blue-500 hover:text-accent-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Staff
          </button>

          <h1 className="text-3xl font-black text-foreground mb-2">Invite Trainer</h1>
          <p className="text-foreground/60 mb-8">Send an invitation to a personal trainer to join your gym</p>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card p-8">
            {/* Trainer Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Trainer Information</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    placeholder="e.g., Sarah Johnson"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    placeholder="sarah@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    required
                  >
                    <option value="Personal Trainer">Personal Trainer</option>
                    <option value="Yoga Instructor">Yoga Instructor</option>
                    <option value="Pilates Instructor">Pilates Instructor</option>
                    <option value="CrossFit Coach">CrossFit Coach</option>
                    <option value="Spin Instructor">Spin Instructor</option>
                    <option value="Group Fitness Instructor">Group Fitness Instructor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Revenue Share (%) *
                  </label>
                  <input
                    type="number"
                    value={formData.revenueShare}
                    onChange={(e) => setFormData({ ...formData, revenueShare: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    placeholder="70"
                    min="0"
                    max="100"
                    required
                  />
                  <p className="text-sm text-foreground/60 mt-1">
                    Trainer receives {formData.revenueShare}%, Gym keeps {100 - parseInt(formData.revenueShare || '0')}%
                  </p>
                </div>
              </div>
            </div>

            {/* Personal Message */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Invitation Message</h2>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                  placeholder="Add a personal message to the invitation..."
                  rows={4}
                />
              </div>
            </div>

            {/* Revenue Split Info */}
            <div className="mb-8 p-6 bg-accent-blue-50 border-2 border-accent-blue-200 rounded-lg">
              <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                <svg className="w-5 h-5 text-accent-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                How Revenue Splitting Works
              </h3>
              <ul className="text-sm text-foreground/80 space-y-1">
                <li>• Trainer earns {formData.revenueShare}% from their personal training clients</li>
                <li>• Gym receives {100 - parseInt(formData.revenueShare || '0')}% as facility fee</li>
                <li>• Payments from trainer's clients are split automatically</li>
                <li>• Gym membership fees are separate and go 100% to the gym</li>
                <li>• Revenue share can be adjusted later from trainer settings</li>
              </ul>
            </div>

            {/* Preview */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-bold text-foreground mb-3">Email Preview</h3>
              <div className="space-y-2 text-sm">
                <p className="text-foreground/80">
                  <strong>To:</strong> {formData.email || 'trainer@example.com'}
                </p>
                <p className="text-foreground/80">
                  <strong>Subject:</strong> You're invited to join our gym as a {formData.role}
                </p>
                <div className="mt-4 p-4 bg-white rounded border border-gray-200">
                  <p className="text-foreground/80 mb-2">Hi {formData.name || 'there'},</p>
                  <p className="text-foreground/80 mb-2">
                    We'd love to have you join our team at [Gym Name] as a {formData.role}.
                  </p>
                  {formData.message && (
                    <p className="text-foreground/80 mb-2 italic">{formData.message}</p>
                  )}
                  <p className="text-foreground/80 mb-2">
                    <strong>Your revenue share:</strong> {formData.revenueShare}% from your clients
                  </p>
                  <p className="text-foreground/80">
                    Click the link below to accept this invitation and set up your profile.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border-2 border-gray-300 text-foreground font-semibold rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
