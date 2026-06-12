/**
 * Admin loading skeleton — dark sidebar (280px, ink bg) + KPI cards + table rows.
 */
export default function AdminLoading() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-2)" }}>
      <div className="lg:grid" style={{ gridTemplateColumns: "280px 1fr" }}>
        {/* Dark sidebar placeholder — desktop only */}
        <aside className="hidden lg:block" style={{ background: "var(--ink)" }}>
          <div className="p-5">
            <div className="h-5 w-24 animate-pulse rounded-(--r-2) mb-8" style={{ background: "oklch(0.25 0.008 80)" }} />
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-4 w-full animate-pulse rounded-(--r-2) mb-4" style={{ background: "oklch(0.22 0.008 80)" }} />
            ))}
          </div>
        </aside>

        {/* Main area */}
        <main className="p-5 sm:p-8">
          {/* Page title */}
          <div className="h-7 w-48 animate-pulse rounded-(--r-2) mb-6" style={{ background: "var(--bg-3)" }} />

          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-(--r-3) border p-5" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
                <div className="h-3 w-24 animate-pulse rounded-(--r-2) mb-3" style={{ background: "var(--bg-3)" }} />
                <div className="h-7 w-20 animate-pulse rounded-(--r-2)" style={{ background: "var(--bg-2)" }} />
              </div>
            ))}
          </div>

          {/* Table skeleton */}
          <div className="rounded-(--r-3) border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
            {/* Header row */}
            <div className="flex gap-4 px-5 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}>
              {[100, 140, 80, 60, 72].map((w, i) => (
                <div key={i} className="h-3 animate-pulse rounded-(--r-2)" style={{ width: w, background: "var(--bg-3)" }} />
              ))}
            </div>
            {/* Body rows */}
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                {[100, 140, 80, 60, 72].map((w, j) => (
                  <div key={j} className="h-3 animate-pulse rounded-(--r-2)" style={{ width: w, background: "var(--bg-2)" }} />
                ))}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
