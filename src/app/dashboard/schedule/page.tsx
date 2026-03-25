"use client";

import ComingSoonPage from "@/components/ComingSoonPage";
import DashboardSidebar from "@/components/DashboardSidebar";

export default function Page() {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <ComingSoonPage
          title="Coming Soon"
          description="This feature is currently under development."
          backLink="/dashboard"
          backLabel="Back to Dashboard"
        />
      </main>
    </div>
  );
}
