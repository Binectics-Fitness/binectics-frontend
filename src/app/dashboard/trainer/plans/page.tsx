'use client';
import TrainerSidebar from '@/components/TrainerSidebar';
import ComingSoonPage from '@/components/ComingSoonPage';
export default function Page() {
  return (<div className="flex min-h-screen bg-background"><TrainerSidebar /><main className="flex-1 p-8"><ComingSoonPage title="Training Plans Coming Soon" description="Create and manage your training packages and pricing." backLink="/dashboard/trainer" backLabel="Back to Dashboard" /></main></div>);
}
