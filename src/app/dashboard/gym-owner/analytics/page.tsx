'use client';
import { useState } from 'react';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';
export default function GymOwnerAnalyticsPage() {
  const [period, setPeriod] = useState('month');
  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black text-foreground mb-8">Analytics</h1>
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Member Growth</p>
              <p className="text-3xl font-black text-foreground mt-2">+12.5%</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Retention Rate</p>
              <p className="text-3xl font-black text-foreground mt-2">87%</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Avg Visits/Week</p>
              <p className="text-3xl font-black text-foreground mt-2">3.2</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
