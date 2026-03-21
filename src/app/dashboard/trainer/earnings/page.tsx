'use client';
import TrainerSidebar from '@/components/TrainerSidebar';
import ComingSoonPage from '@/components/ComingSoonPage';
export default function Page() {
  return (<div className="flex min-h-screen bg-background"><TrainerSidebar /><main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8"><ComingSoonPage title="Earnings Coming Soon" description="Track your earnings and financial performance." backLink="/dashboard/trainer" backLabel="Back to Dashboard" /></main></div>);
}
