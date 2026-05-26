/**
 * Marketplace loading skeleton — top bar + filter sidebar (260px) + 3x3 card grid.
 */
export default function MarketplaceLoading() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Top bar */}
      <div className="h-14 sm:h-16 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-360 h-full flex items-center justify-between px-5 sm:px-10">
          <div className="h-5 w-28 animate-pulse rounded-(--r-2)" style={{ background: "var(--bg-3)" }} />
          <div className="hidden md:flex gap-3">
            {[64, 80, 72, 52].map((w, i) => (
              <div key={i} className="h-4 animate-pulse rounded-(--r-2)" style={{ width: w, background: "var(--bg-3)" }} />
            ))}
          </div>
          <div className="h-8 w-20 animate-pulse rounded-(--r-2)" style={{ background: "var(--bg-3)" }} />
        </div>
      </div>

      {/* Hero placeholder */}
      <div className="mx-auto max-w-360 px-5 sm:px-10 pt-8 sm:pt-14 pb-6">
        <div className="h-3 w-32 animate-pulse rounded-(--r-2) mb-3" style={{ background: "var(--bg-3)" }} />
        <div className="h-10 w-80 max-w-full animate-pulse rounded-(--r-2) mb-3" style={{ background: "var(--bg-3)" }} />
        <div className="h-5 w-96 max-w-full animate-pulse rounded-(--r-2)" style={{ background: "var(--bg-2)" }} />
      </div>

      {/* Tabs placeholder */}
      <div className="mx-auto max-w-360 px-5 sm:px-10 py-4 border-b flex gap-2" style={{ borderColor: "var(--border)" }}>
        {[48, 40, 56, 60].map((w, i) => (
          <div key={i} className="h-8 animate-pulse rounded-(--r-2)" style={{ width: w, background: i === 0 ? "var(--bg-3)" : "var(--bg-2)" }} />
        ))}
      </div>

      {/* Filter sidebar + card grid */}
      <div className="mx-auto max-w-360 px-5 sm:px-10 pt-7 pb-20 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8 items-start">
        {/* Filter sidebar — desktop only */}
        <aside className="hidden lg:block rounded-(--r-3) border p-5" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="mb-5">
              <div className="h-3 w-16 animate-pulse rounded-(--r-2) mb-3" style={{ background: "var(--bg-3)" }} />
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-4 w-full animate-pulse rounded-(--r-2) mb-2" style={{ background: "var(--bg-2)" }} />
              ))}
            </div>
          ))}
        </aside>

        {/* 3x3 card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="rounded-(--r-3) border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
              <div className="h-40 animate-pulse" style={{ background: "var(--bg-2)" }} />
              <div className="p-4">
                <div className="h-4 w-3/4 animate-pulse rounded-(--r-2) mb-2" style={{ background: "var(--bg-3)" }} />
                <div className="h-3 w-1/2 animate-pulse rounded-(--r-2) mb-3" style={{ background: "var(--bg-2)" }} />
                <div className="flex gap-2">
                  {[40, 48, 36].map((w, j) => (
                    <div key={j} className="h-5 animate-pulse rounded-(--r-2)" style={{ width: w, background: "var(--bg-2)" }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
