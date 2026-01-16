'use client';

import { useParams, useRouter } from 'next/navigation';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function MemberActivityPage() {
  const params = useParams();
  const router = useRouter();
  const memberId = params.memberId as string;

  const member = { name: 'John Smith' };
  const checkIns = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: ['06:30 AM', '07:00 AM', '05:45 PM', '06:15 PM'][Math.floor(Math.random() * 4)],
    duration: `${Math.floor(Math.random() * 60 + 60)} min`,
  }));

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
            Back to Profile
          </button>

          <h1 className="text-3xl font-black text-foreground mb-2">{member.name} - Activity Log</h1>
          <p className="text-foreground/60 mb-8">Complete check-in history</p>

          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Total Check-ins</p>
              <p className="text-3xl font-black text-foreground mt-2">{checkIns.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">This Month</p>
              <p className="text-3xl font-black text-foreground mt-2">15</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Avg Per Week</p>
              <p className="text-3xl font-black text-foreground mt-2">3.5</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Current Streak</p>
              <p className="text-3xl font-black text-primary-500 mt-2">7 days</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold text-foreground">Check-in History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Date</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Check-in Time</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {checkIns.map((checkIn) => (
                    <tr key={checkIn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-foreground">{checkIn.date}</td>
                      <td className="px-6 py-4 text-foreground/60">{checkIn.time}</td>
                      <td className="px-6 py-4 text-foreground/60">{checkIn.duration}</td>
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
