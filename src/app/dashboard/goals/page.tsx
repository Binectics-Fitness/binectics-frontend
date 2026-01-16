'use client';
import DashboardSidebar from '@/components/DashboardSidebar';
import ComingSoonPage from '@/components/ComingSoonPage';
export default function Page() {
  return (<div className="flex min-h-screen bg-background"><DashboardSidebar /><main className="flex-1 p-8"><ComingSoonPage title="Coming Soon" description="This feature is currently under development." backLink="/dashboard" backLabel="Back to Dashboard" /></main></div>);
}
