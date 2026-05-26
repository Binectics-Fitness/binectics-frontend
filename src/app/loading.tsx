/**
 * Root loading skeleton — top bar + hero + card placeholders.
 */
export default function RootLoading() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      {/* Top bar */}
      <div className="h-16 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="mx-auto max-w-7xl h-full flex items-center justify-between px-5 sm:px-10">
          <div className="h-5 w-28 animate-pulse rounded-(--r-2)" style={{ background: "var(--bg-3)" }} />
          <div className="hidden sm:flex gap-3">
            {[80, 60, 72].map((w, i) => (
              <div key={i} className="h-4 animate-pulse rounded-(--r-2)" style={{ width: w, background: "var(--bg-3)" }} />
            ))}
          </div>
          <div className="h-8 w-20 animate-pulse rounded-(--r-2)" style={{ background: "var(--bg-3)" }} />
        </div>
      </div>

      {/* Hero placeholder */}
      <div className="mx-auto max-w-7xl px-5 sm:px-10 pt-16 sm:pt-24">
        <div className="h-10 w-64 animate-pulse rounded-(--r-2) mb-4" style={{ background: "var(--bg-3)" }} />
        <div className="h-6 w-96 max-w-full animate-pulse rounded-(--r-2) mb-3" style={{ background: "var(--bg-2)" }} />
        <div className="h-6 w-72 max-w-full animate-pulse rounded-(--r-2) mb-10" style={{ background: "var(--bg-2)" }} />
        <div className="h-12 w-44 animate-pulse rounded-(--r-2)" style={{ background: "var(--bg-3)" }} />
      </div>

      {/* Card grid placeholder */}
      <div className="mx-auto max-w-7xl px-5 sm:px-10 pt-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-(--r-3) border p-6" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
              <div className="h-36 animate-pulse rounded-(--r-2) mb-4" style={{ background: "var(--bg-2)" }} />
              <div className="h-4 w-3/4 animate-pulse rounded-(--r-2) mb-2" style={{ background: "var(--bg-3)" }} />
              <div className="h-4 w-1/2 animate-pulse rounded-(--r-2)" style={{ background: "var(--bg-2)" }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
