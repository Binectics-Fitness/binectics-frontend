"use client";

import ComingSoonPage from "@/components/ComingSoonPage";
import DietitianSidebar from "@/components/DietitianSidebar";

export default function Page() {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DietitianSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <ComingSoonPage
          title="Coming Soon"
          description="This feature is currently under development."
          backLink="/dashboard/dietitian"
          backLabel="Back to Dashboard"
        />
      </main>
    </div>
  );
}
