'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminReviewsPage() {
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock data
  const reviews = [
    {
      id: 1,
      user: 'John Smith',
      userEmail: 'john@example.com',
      provider: 'PowerHouse Gym',
      rating: 5,
      comment: 'Amazing facilities and great staff! The equipment is top-notch and always well-maintained.',
      date: '2024-02-14',
      status: 'Published',
      flagged: false,
      reports: 0,
    },
    {
      id: 2,
      user: 'Sarah Johnson',
      userEmail: 'sarah@example.com',
      provider: 'Mike Chen - Personal Training',
      rating: 5,
      comment: 'Mike is an incredible trainer! Lost 15 pounds in 2 months with his guidance.',
      date: '2024-02-13',
      status: 'Published',
      flagged: false,
      reports: 0,
    },
    {
      id: 3,
      user: 'Emily Davis',
      userEmail: 'emily@example.com',
      provider: 'Dr. Maria Garcia - Nutrition',
      rating: 2,
      comment: 'This service is terrible and a complete waste of money. The dietician was unprofessional and rude.',
      date: '2024-02-12',
      status: 'Flagged',
      flagged: true,
      reports: 3,
      flagReason: 'Inappropriate language, possible fake review',
    },
    {
      id: 4,
      user: 'Mike Wilson',
      userEmail: 'mike@example.com',
      provider: 'FitCore Studio',
      rating: 4,
      comment: 'Great gym overall, but can get crowded during peak hours. Would still recommend!',
      date: '2024-02-11',
      status: 'Published',
      flagged: false,
      reports: 0,
    },
    {
      id: 5,
      user: 'Anonymous User',
      userEmail: 'fake@temporary.com',
      provider: 'PowerHouse Gym',
      rating: 1,
      comment: 'Scam! DO NOT JOIN! They stole my money!!!',
      date: '2024-02-10',
      status: 'Flagged',
      flagged: true,
      reports: 5,
      flagReason: 'Suspected fake review, spam content',
    },
    {
      id: 6,
      user: 'Lisa Anderson',
      userEmail: 'lisa@example.com',
      provider: 'Mike Chen - Personal Training',
      rating: 5,
      comment: 'Best decision I ever made! Mike helped me achieve my fitness goals.',
      date: '2024-02-09',
      status: 'Published',
      flagged: false,
      reports: 0,
    },
  ];

  const handleApproveReview = (id: number, provider: string) => {
    if (confirm(`Approve this review for ${provider}?`)) {
      alert('Review approved and published');
    }
  };

  const handleRemoveReview = (id: number, provider: string) => {
    const reason = prompt(`Please provide a reason for removing this review from ${provider}:`);
    if (reason) {
      alert('Review removed successfully. User will be notified.');
    }
  };

  const getRatingStars = (rating: number) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-black text-foreground">Review Moderation</h1>
            <p className="mt-1 text-foreground/60">Moderate user reviews and handle flagged content</p>
          </div>
        </header>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Total Reviews</p>
              <p className="text-3xl font-black text-foreground mt-2">2,847</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Published</p>
              <p className="text-3xl font-black text-primary-500 mt-2">2,729</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Flagged</p>
              <p className="text-3xl font-black text-red-500 mt-2">18</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Avg. Rating</p>
              <p className="text-3xl font-black text-foreground mt-2">4.7</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 shadow-card mb-6">
            <div className="flex gap-3">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-6 py-3 font-semibold ${
                  statusFilter === 'all'
                    ? 'bg-red-500 text-foreground'
                    : 'bg-gray-100 text-foreground/60 hover:bg-gray-200'
                }`}
              >
                All Reviews
              </button>
              <button
                onClick={() => setStatusFilter('flagged')}
                className={`px-6 py-3 font-semibold ${
                  statusFilter === 'flagged'
                    ? 'bg-red-500 text-foreground'
                    : 'bg-gray-100 text-foreground/60 hover:bg-gray-200'
                }`}
              >
                Flagged ({reviews.filter(r => r.flagged).length})
              </button>
              <button
                onClick={() => setStatusFilter('published')}
                className={`px-6 py-3 font-semibold ${
                  statusFilter === 'published'
                    ? 'bg-red-500 text-foreground'
                    : 'bg-gray-100 text-foreground/60 hover:bg-gray-200'
                }`}
              >
                Published
              </button>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className={`bg-white p-6 shadow-card ${review.flagged ? 'border-2 border-red-500' : ''}`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-foreground">{review.user}</h3>
                      <span className="text-foreground/60">→</span>
                      <p className="text-foreground/60">{review.provider}</p>
                    </div>
                    <p className="text-sm text-foreground/60">{review.userEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground/60">{review.date}</p>
                    {review.flagged && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold">
                          ⚠️ FLAGGED
                        </span>
                        <span className="text-xs text-red-600 font-semibold">
                          {review.reports} reports
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rating */}
                <div className="mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getRatingStars(review.rating)}</span>
                    <span className="font-semibold text-foreground">{review.rating}/5</span>
                  </div>
                </div>

                {/* Comment */}
                <div className="mb-4 p-4 bg-gray-50 border-l-4 border-gray-300">
                  <p className="text-foreground">{review.comment}</p>
                </div>

                {/* Flag Reason */}
                {review.flagged && review.flagReason && (
                  <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500">
                    <p className="text-sm font-semibold text-red-700 mb-1">Flag Reason:</p>
                    <p className="text-sm text-red-600">{review.flagReason}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button className="px-6 py-2 border-2 border-gray-200 text-foreground font-semibold hover:border-red-500 transition-colors">
                    View Full Details
                  </button>
                  {review.flagged ? (
                    <>
                      <button
                        onClick={() => handleApproveReview(review.id, review.provider)}
                        className="flex-1 px-6 py-2 bg-primary-500 text-foreground font-semibold hover:bg-primary-600 transition-colors"
                      >
                        ✓ Approve Review
                      </button>
                      <button
                        onClick={() => handleRemoveReview(review.id, review.provider)}
                        className="flex-1 px-6 py-2 bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                      >
                        ✗ Remove Review
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleRemoveReview(review.id, review.provider)}
                      className="px-6 py-2 text-red-500 font-semibold hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-foreground/60">
              Showing 1 to 6 of 2,847 reviews
            </p>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-200 text-foreground/60 font-semibold hover:bg-gray-50">
                Previous
              </button>
              <button className="px-4 py-2 bg-red-500 text-foreground font-semibold hover:bg-red-600">
                1
              </button>
              <button className="px-4 py-2 border border-gray-200 text-foreground/60 font-semibold hover:bg-gray-50">
                2
              </button>
              <button className="px-4 py-2 border border-gray-200 text-foreground/60 font-semibold hover:bg-gray-50">
                3
              </button>
              <button className="px-4 py-2 border border-gray-200 text-foreground/60 font-semibold hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
