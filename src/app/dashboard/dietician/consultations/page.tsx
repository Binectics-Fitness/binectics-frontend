'use client';
import DieticianSidebar from '@/components/DieticianSidebar';
import ComingSoonPage from '@/components/ComingSoonPage';
export default function Page() {
  return (<div className="flex min-h-screen bg-background"><DieticianSidebar /><main className="flex-1 p-8"><ComingSoonPage title="Coming Soon" description="This feature is currently under development." backLink="/dashboard/dietician" backLabel="Back to Dashboard" /></main></div>);
}
