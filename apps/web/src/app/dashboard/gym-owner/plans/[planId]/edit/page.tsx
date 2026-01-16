'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function EditPlanPage() {
  const params = useParams();
  const router = useRouter();
  const planId = params.planId as string;

  // Mock existing plan data
  const existingPlan = {
    id: planId,
    name: 'Basic Monthly',
    type: 'SUBSCRIPTION',
    price: 49,
    duration: 30,
    description: 'Perfect for getting started with your fitness journey',
    features: ['Unlimited gym access', '24/7 facility access', 'Free WiFi', 'Locker access'],
  };

  const [formData, setFormData] = useState({
    name: existingPlan.name,
    type: existingPlan.type,
    price: existingPlan.price.toString(),
    duration: existingPlan.duration.toString(),
    description: existingPlan.description,
    features: existingPlan.features,
  });

  const [newFeature, setNewFeature] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Redirect back to plan detail
    router.push(`/dashboard/gym-owner/plans/${planId}`);
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()],
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index),
    });
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
            Back to Plan
          </button>

          <h1 className="text-3xl font-black text-foreground mb-8">Edit Plan</h1>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card p-8">
            {/* Basic Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    placeholder="e.g., Basic Monthly"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Plan Type *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    required
                  >
                    <option value="SUBSCRIPTION">Subscription</option>
                    <option value="ONE_TIME">One-Time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    placeholder="49"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Duration (days) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    placeholder="30"
                    min="1"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    placeholder="Describe what this plan includes..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Plan Features */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Plan Features</h2>

              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                  placeholder="Add a feature (e.g., Unlimited gym access)"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-6 py-3 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600"
                >
                  Add
                </button>
              </div>

              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-4 py-3 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-primary-500 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-foreground">{feature}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {formData.features.length === 0 && (
                <p className="text-foreground/60 text-center py-8">
                  No features added yet. Add features to describe what this plan includes.
                </p>
              )}
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
                className="px-6 py-3 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
