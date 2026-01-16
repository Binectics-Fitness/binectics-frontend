'use client';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';
import ComingSoonPage from '@/components/ComingSoonPage';
export default function Page() {
  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="flex-1 p-8">
        <ComingSoonPage
          title="Analytics Coming Soon"
          description="Track detailed metrics, member trends, and gym performance analytics."
          backLink="/dashboard/gym-owner"
          backLabel="Back to Dashboard"
        />
      </main>
    </div>
  );
}
