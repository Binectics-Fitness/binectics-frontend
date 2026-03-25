"use client";

import ComingSoonPage from "@/components/ComingSoonPage";
import TrainerSidebar from "@/components/TrainerSidebar";

export default function Page() {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <TrainerSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <ComingSoonPage
          title="Earnings Coming Soon"
          description="Track your earnings and financial performance."
          backLink="/dashboard/trainer"
          backLabel="Back to Dashboard"
        />
      </main>
    </div>
  );
}
