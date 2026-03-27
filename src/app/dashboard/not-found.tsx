import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-black text-primary-500 mb-4">404</h1>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Page Not Found
        </h2>
        <p className="text-sm text-neutral-500 mb-6">
          This dashboard page doesn&apos;t exist or may have been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex px-5 py-2.5 bg-primary-500 text-foreground font-semibold rounded-lg text-sm hover:bg-primary-600 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
