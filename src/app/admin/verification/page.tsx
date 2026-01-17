'use client';

import { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';

export default function AdminVerificationPage() {
  const [statusFilter, setStatusFilter] = useState('pending');

  // Mock data
  const verifications = [
    {
      id: 1,
      applicant: 'PowerHouse Gym',
      email: 'contact@powerhousegym.com',
      type: 'GYM_OWNER',
      location: 'Los Angeles, USA',
      appliedDate: '2024-02-10',
      status: 'PENDING',
      documents: ['Business Registration', 'Government ID', 'Facility Photos'],
    },
    {
      id: 2,
      applicant: 'Mike Chen',
      email: 'mike.chen@trainer.com',
      type: 'TRAINER',
      location: 'Hong Kong',
      appliedDate: '2024-02-11',
      status: 'PENDING',
      documents: ['NASM-CPT Certificate', 'Government ID', 'Insurance'],
    },
    {
      id: 3,
      applicant: 'Dr. Aisha Patel',
      email: 'aisha@nutrition.com',
      type: 'DIETICIAN',
      location: 'Mumbai, India',
      appliedDate: '2024-02-12',
      status: 'PENDING',
      documents: ['RD License', 'Government ID', 'University Degree'],
    },
    {
      id: 4,
      applicant: 'FitCore Studio',
      email: 'info@fitcore.uk',
      type: 'GYM_OWNER',
      location: 'London, UK',
      appliedDate: '2024-02-09',
      status: 'APPROVED',
      documents: ['Business Registration', 'Government ID', 'Facility Photos'],
    },
    {
      id: 5,
      applicant: 'John Smith',
      email: 'john@email.com',
      type: 'TRAINER',
      location: 'Sydney, Australia',
      appliedDate: '2024-02-08',
      status: 'REJECTED',
      documents: ['Incomplete Certificate', 'Government ID'],
      rejectionReason: 'Certification documents incomplete',
    },
  ];

  const handleApprove = (id: number, name: string) => {
    if (confirm(`Are you sure you want to approve ${name}? They will receive verified status.`)) {
      alert('Verification approved successfully');
    }
  };

  const handleReject = (id: number, name: string) => {
    const reason = prompt(`Please provide a reason for rejecting ${name}:`);
    if (reason) {
      alert('Verification rejected. Applicant will be notified.');
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-primary-100 text-primary-700';
      case 'REJECTED':
        return 'bg-red-100 text-red-700';
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
            <h1 className="text-3xl font-black text-foreground">Verification Queue</h1>
            <p className="mt-1 text-foreground/60">Review and approve provider verification requests</p>
          </div>
        </header>

        <div className="p-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Pending</p>
              <p className="text-3xl font-black text-accent-yellow-500 mt-2">23</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Approved This Week</p>
              <p className="text-3xl font-black text-primary-500 mt-2">47</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Rejected</p>
              <p className="text-3xl font-black text-red-500 mt-2">12</p>
            </div>
            <div className="bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">Avg Review Time</p>
              <p className="text-3xl font-black text-foreground mt-2">24h</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 shadow-card mb-6">
            <div className="flex gap-4">
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-6 py-3 font-semibold ${
                  statusFilter === 'pending'
                    ? 'bg-red-500 text-foreground'
                    : 'bg-gray-100 text-foreground/60 hover:bg-gray-200'
                }`}
              >
                Pending ({verifications.filter(v => v.status === 'PENDING').length})
              </button>
              <button
                onClick={() => setStatusFilter('approved')}
                className={`px-6 py-3 font-semibold ${
                  statusFilter === 'approved'
                    ? 'bg-red-500 text-foreground'
                    : 'bg-gray-100 text-foreground/60 hover:bg-gray-200'
                }`}
              >
                Approved
              </button>
              <button
                onClick={() => setStatusFilter('rejected')}
                className={`px-6 py-3 font-semibold ${
                  statusFilter === 'rejected'
                    ? 'bg-red-500 text-foreground'
                    : 'bg-gray-100 text-foreground/60 hover:bg-gray-200'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>

          {/* Verification List */}
          <div className="space-y-4">
            {verifications.map((verification) => (
              <div key={verification.id} className="bg-white p-6 shadow-card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-foreground">{verification.applicant}</h3>
                      <span className={`px-3 py-1 text-xs font-semibold ${getTypeBadgeColor(verification.type)}`}>
                        {verification.type.replace('_', ' ')}
                      </span>
                      <span className={`px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(verification.status)}`}>
                        {verification.status}
                      </span>
                    </div>
                    <p className="text-foreground/60 mb-1">{verification.email}</p>
                    <p className="text-sm text-foreground/60">📍 {verification.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-foreground/60">Applied</p>
                    <p className="font-semibold text-foreground">{verification.appliedDate}</p>
                  </div>
                </div>

                {/* Documents */}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">Submitted Documents:</p>
                  <div className="flex flex-wrap gap-2">
                    {verification.documents.map((doc, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-foreground text-sm">
                        📄 {doc}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rejection Reason */}
                {verification.status === 'REJECTED' && verification.rejectionReason && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200">
                    <p className="text-sm font-semibold text-red-700 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-red-600">{verification.rejectionReason}</p>
                  </div>
                )}

                {/* Actions */}
                {verification.status === 'PENDING' && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleApprove(verification.id, verification.applicant)}
                      className="flex-1 px-6 py-3 bg-primary-500 text-foreground font-semibold hover:bg-primary-600 transition-colors"
                    >
                      ✓ Approve Verification
                    </button>
                    <button
                      onClick={() => handleReject(verification.id, verification.applicant)}
                      className="flex-1 px-6 py-3 bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                    >
                      ✗ Reject Application
                    </button>
                    <button className="px-6 py-3 border-2 border-gray-200 text-foreground font-semibold hover:border-red-500 transition-colors">
                      View Documents
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
