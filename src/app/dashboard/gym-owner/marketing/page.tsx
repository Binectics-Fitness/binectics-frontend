'use client';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';
export default function MarketingPage() {
  const campaigns = [
    { name: 'New Year Promo', status: 'Active', reach: '1.2K', conversions: 34 },
    { name: 'Referral Program', status: 'Active', reach: '890', conversions: 23 },
  ];
  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-black text-foreground mb-8">Marketing</h1>
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="font-bold text-foreground mb-4">Active Campaigns</h3>
            {campaigns.map(c => (
              <div key={c.name} className="flex justify-between p-4 bg-gray-50 rounded-lg mb-3">
                <div><p className="font-semibold">{c.name}</p><p className="text-sm text-foreground/60">{c.status}</p></div>
                <div className="text-right"><p className="font-semibold">{c.reach} reach</p><p className="text-sm text-primary-500">{c.conversions} conversions</p></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
