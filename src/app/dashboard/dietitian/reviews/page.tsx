'use client';
import DietitianSidebar from '@/components/DietitianSidebar';
import ComingSoonPage from '@/components/ComingSoonPage';
export default function Page() {
  return (<div className="flex min-h-screen bg-background"><DietitianSidebar /><main className="flex-1 p-8"><ComingSoonPage title="Coming Soon" description="This feature is currently under development." backLink="/dashboard/dietitian" backLabel="Back to Dashboard" /></main></div>);
}
