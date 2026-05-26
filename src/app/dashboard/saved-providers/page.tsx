import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";

/**
 * Saved Providers — saved-providers.html prototype.
 * Consumer page: topnav, heading (14 saved, 3 lists), filter pills,
 * 3-column grid of 9 provider cards with heart icon, avatar gradient,
 * name, rating, "Saved X days ago".
 */

const FILTERS = [
  { label: "All", count: 14, on: true },
  { label: "Strength", count: 6 },
  { label: "Online", count: 4 },
  { label: "Postnatal", count: 4 },
];

const PROVIDERS = [
  { name: "Sarah Okafor", rating: "4.9", city: "Cape Town", days: 2, hue: 0 },
  { name: "Iron Lab Sea Point", rating: "4.9", city: "Cape Town", days: 5, hue: 40 },
  { name: "Dr Nadia Hassan", rating: "4.9", city: "Cape Town", days: 8, hue: 80 },
  { name: "Thandi Nkosi", rating: "4.9", city: "Cape Town", days: 11, hue: 120 },
  { name: "Marcus Bell", rating: "4.9", city: "Cape Town", days: 14, hue: 160 },
  { name: "Strathmore Strength", rating: "4.9", city: "Cape Town", days: 17, hue: 200 },
  { name: "Camilla Lapwing", rating: "4.9", city: "Cape Town", days: 20, hue: 240 },
  { name: "Themba Mokoena", rating: "4.9", city: "Cape Town", days: 23, hue: 280 },
  { name: "Studio Move", rating: "4.9", city: "Cape Town", days: 26, hue: 320 },
];

function HeartFilled() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--ink)" stroke="var(--ink)" strokeWidth="1.5">
      <path d="m12 21-1.5-1.4C5 14.7 2 12 2 8.5 2 6 4 4 6.5 4c1.5 0 3 .7 3.9 2A5 5 0 0 1 17.5 4C20 4 22 6 22 8.5c0 3.5-3 6.2-8.5 11.1L12 21z" />
    </svg>
  );
}

export default function SavedProvidersPage() {
  return (
    <div style={{ background: "var(--bg-2)", minHeight: "100vh" }}>
      {/* Topnav */}
      <header
        className="flex items-center justify-between px-8"
        style={{
          background: "var(--bg)",
          borderBottom: "1px solid var(--border)",
          padding: "14px clamp(16px, 4vw, 32px)",
        }}
      >
        <Link href="/">
          <BinecticsLockup />
        </Link>
        <nav className="hidden sm:flex items-center gap-4 text-[13.5px]" style={{ color: "var(--fg-2)" }}>
          <Link href="/marketplace" style={{ color: "var(--fg-2)" }}>
            Marketplace
          </Link>
          <Link href="/dashboard/bookings" style={{ color: "var(--fg-2)" }}>
            My bookings
          </Link>
          <Link href="/dashboard/messages" style={{ color: "var(--fg-2)" }}>
            Messages
          </Link>
          <Link href="/login" className="btn-primary-v2 sm">
            Sign in
          </Link>
        </nav>
      </header>

      {/* Shell */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(16px, 4vw, 32px)" }}>
        {/* Heading */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3" style={{ marginBottom: 24 }}>
          <div>
            <h1
              className="text-[32px] font-medium"
              style={{ letterSpacing: "-0.026em", color: "var(--ink)" }}
            >
              Saved providers
            </h1>
            <p className="mt-1.5" style={{ color: "var(--fg-3)" }}>
              14 saved &middot; 3 lists &middot; sorted by date saved
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost-v2 sm">+ New list</button>
            <button className="btn-primary-v2 sm">Compare</button>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2" style={{ marginBottom: 18 }}>
          {FILTERS.map((f) => (
            <span
              key={f.label}
              className="cursor-pointer font-mono text-[11px] uppercase"
              style={{
                padding: "6px 12px",
                borderRadius: 999,
                letterSpacing: "0.04em",
                background: f.on ? "var(--ink)" : "var(--bg)",
                color: f.on ? "var(--bg)" : "var(--fg-2)",
                border: f.on ? "1px solid var(--ink)" : "1px solid var(--border)",
              }}
            >
              {f.label} &middot; {f.count}
            </span>
          ))}
        </div>

        {/* Provider grid */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {PROVIDERS.map((p) => (
            <div
              key={p.name}
              className="relative rounded-(--r-3)"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                padding: 16,
              }}
            >
              {/* Heart button */}
              <button
                className="absolute"
                style={{
                  top: 12,
                  right: 12,
                  background: "transparent",
                  border: 0,
                  cursor: "pointer",
                }}
              >
                <HeartFilled />
              </button>

              {/* Avatar gradient */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  background: `linear-gradient(135deg, oklch(0.85 0.04 ${p.hue}), oklch(0.72 0.06 ${p.hue + 40}))`,
                  marginBottom: 12,
                }}
              />

              {/* Name */}
              <div
                className="text-[15px] font-medium"
                style={{ color: "var(--ink)", marginBottom: 4 }}
              >
                {p.name}
              </div>

              {/* Rating & city */}
              <div
                className="font-mono text-[10.5px] uppercase"
                style={{
                  color: "var(--fg-3)",
                  letterSpacing: "0.04em",
                  marginBottom: 10,
                }}
              >
                &#9733; {p.rating} &middot; {p.city}
              </div>

              {/* Saved date */}
              <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                Saved{" "}
                <strong style={{ color: "var(--ink)", fontWeight: 500 }}>
                  {p.days} days ago
                </strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
