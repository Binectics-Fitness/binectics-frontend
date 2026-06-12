/**
 * Dashboard loading skeleton — sidebar (232px) + KPI cards + content block.
 */
export default function DashboardLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-2)" }}>
      <div className="lg:grid" style={{ gridTemplateColumns: "232px 1fr" }}>
        {/* Sidebar placeholder — desktop only */}
        <aside className="hidden lg:block border-r" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
          <div className="p-5">
            <div className="h-5 w-24 animate-pulse rounded-(--r-2) mb-8" style={{ background: "var(--bg-3)" }} />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded-(--r-2) mb-4" style={{ background: "var(--bg-2)" }} />
            ))}
          </div>
        </aside>

        {/* Main area */}
        <main className="p-5 sm:p-8">
          {/* Page title */}
          <div className="h-7 w-40 animate-pulse rounded-(--r-2) mb-6" style={{ background: "var(--bg-3)" }} />

          {/* KPI cards — 2x2 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-(--r-3) border p-5" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                <div className="h-3 w-20 animate-pulse rounded-(--r-2) mb-3" style={{ background: "var(--bg-3)" }} />
                <div className="h-7 w-24 animate-pulse rounded-(--r-2)" style={{ background: "var(--bg-2)" }} />
              </div>
            ))}
          </div>

          {/* Large content block */}
          <div className="rounded-(--r-3) border p-6" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
            <div className="h-5 w-32 animate-pulse rounded-(--r-2) mb-4" style={{ background: "var(--bg-3)" }} />
            <div className="h-48 animate-pulse rounded-(--r-2)" style={{ background: "var(--bg-2)" }} />
          </div>
        </main>
      </div>
    </div>
  );
}
