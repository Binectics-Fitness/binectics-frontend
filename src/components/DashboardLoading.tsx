/**
 * Reusable loading component for dashboard pages
 */
export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-500 border-r-transparent"></div>
        <p className="mt-4 text-foreground-secondary">Loading...</p>
      </div>
    </div>
  );
}
