"use client";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
export default function GymOwnerAnalyticsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-8">
            Analytics
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">
                Member Growth
              </p>
              <p className="text-3xl font-black text-foreground mt-2">+12.5%</p>
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">
                Retention Rate
              </p>
              <p className="text-3xl font-black text-foreground mt-2">87%</p>
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <p className="text-sm font-medium text-foreground/60">
                Avg Visits/Week
              </p>
              <p className="text-3xl font-black text-foreground mt-2">3.2</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
