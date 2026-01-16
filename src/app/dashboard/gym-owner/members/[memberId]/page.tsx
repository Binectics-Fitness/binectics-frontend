'use client';

import { useParams, useRouter } from 'next/navigation';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';
import Link from 'next/link';

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.memberId as string;

  // Mock member data
  const member = {
    id: memberId,
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    avatar: 'JS',
    status: 'ACTIVE',
    plan: 'Basic Monthly - $49/month',
    joinDate: '2024-01-15',
    lastVisit: '2 hours ago',
    totalVisits: 45,
    streak: 7,
    address: '123 Main St, New York, NY 10001',
    emergencyContact: 'Jane Smith - +1 (555) 987-6543',
  };

  const recentCheckIns = [
    { date: '2024-01-16', time: '08:15 AM', duration: '1h 30m' },
    { date: '2024-01-15', time: '06:30 PM', duration: '1h 15m' },
    { date: '2024-01-14', time: '07:00 AM', duration: '1h 45m' },
    { date: '2024-01-13', time: '05:45 PM', duration: '1h 20m' },
  ];

  const paymentHistory = [
    { id: 1, date: '2024-01-01', amount: 49, status: 'Paid', plan: 'Basic Monthly' },
    { id: 2, date: '2023-12-01', amount: 49, status: 'Paid', plan: 'Basic Monthly' },
    { id: 3, date: '2023-11-01', amount: 49, status: 'Paid', plan: 'Basic Monthly' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-accent-blue-500 hover:text-accent-blue-700 font-medium mb-4 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Members
            </button>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-accent-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-black">
                {member.avatar}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-black text-foreground">{member.name}</h1>
                <p className="text-foreground/60">{member.email}</p>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 border-2 border-accent-blue-500 text-accent-blue-500 font-semibold rounded-lg hover:bg-accent-blue-50">
                  Message
                </button>
                <button className="px-4 py-2 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600">
                  Edit Member
                </button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Total Visits</p>
              <p className="text-3xl font-black text-foreground mt-2">{member.totalVisits}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Current Streak</p>
              <p className="text-3xl font-black text-primary-500 mt-2">{member.streak} days</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Member Since</p>
              <p className="text-xl font-bold text-foreground mt-2">{member.joinDate}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Status</p>
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 mt-2">
                {member.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            {/* Member Info */}
            <div className="col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Email</p>
                    <p className="text-foreground">{member.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground/60 mb-1">Phone</p>
                    <p className="text-foreground">{member.phone}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-foreground/60 mb-1">Address</p>
                    <p className="text-foreground">{member.address}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm font-medium text-foreground/60 mb-1">Emergency Contact</p>
                    <p className="text-foreground">{member.emergencyContact}</p>
                  </div>
                </div>
              </div>

              {/* Recent Check-ins */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-foreground">Recent Check-ins</h3>
                  <Link
                    href={`/dashboard/gym-owner/members/${memberId}/activity`}
                    className="text-sm text-accent-blue-500 hover:text-accent-blue-700 font-medium"
                  >
                    View All →
                  </Link>
                </div>
                <div className="space-y-3">
                  {recentCheckIns.map((checkIn, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground">{checkIn.date}</p>
                        <p className="text-sm text-foreground/60">{checkIn.time}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{checkIn.duration}</p>
                        <p className="text-sm text-foreground/60">Duration</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment History */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-foreground">Payment History</h3>
                  <Link
                    href={`/dashboard/gym-owner/members/${memberId}/billing`}
                    className="text-sm text-accent-blue-500 hover:text-accent-blue-700 font-medium"
                  >
                    View All →
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-gray-200">
                      <tr>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Date</th>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Plan</th>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Amount</th>
                        <th className="text-left py-2 text-sm font-semibold text-foreground/60">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paymentHistory.map((payment) => (
                        <tr key={payment.id} className="border-b border-gray-100 last:border-0">
                          <td className="py-3 text-foreground">{payment.date}</td>
                          <td className="py-3 text-foreground/60">{payment.plan}</td>
                          <td className="py-3 font-semibold text-foreground">${payment.amount}</td>
                          <td className="py-3">
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Current Plan */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Current Plan</h3>
                <div className="p-4 bg-accent-blue-50 border-2 border-accent-blue-200 rounded-lg mb-4">
                  <p className="font-bold text-foreground">{member.plan.split(' - ')[0]}</p>
                  <p className="text-2xl font-black text-accent-blue-500 mt-2">
                    {member.plan.split(' - ')[1]}
                  </p>
                </div>
                <button className="w-full px-4 py-2 border-2 border-accent-blue-500 text-accent-blue-500 font-semibold rounded-lg hover:bg-accent-blue-50">
                  Change Plan
                </button>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-foreground">
                    Freeze Membership
                  </button>
                  <button className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-foreground">
                    Send Invoice
                  </button>
                  <button className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg font-medium text-foreground">
                    Add Note
                  </button>
                  <button className="w-full px-4 py-3 text-left bg-red-50 hover:bg-red-100 rounded-lg font-medium text-red-600">
                    Cancel Membership
                  </button>
                </div>
              </div>

              {/* Member Notes */}
              <div className="bg-white rounded-xl shadow-card p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Notes</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-foreground/70">Prefers morning classes</p>
                    <p className="text-xs text-foreground/40 mt-1">Added 2 weeks ago</p>
                  </div>
                </div>
                <button className="w-full mt-3 px-4 py-2 border-2 border-gray-300 text-foreground font-medium rounded-lg hover:bg-gray-50">
                  Add Note
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
