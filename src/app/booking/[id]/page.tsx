import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";

const TIMELINE = [
  { when: "11 May · 14:32", title: "Booking placed", desc: "Card authorized · waiting on Sarah.", done: true },
  { when: "11 May · 15:08", title: "Sarah confirmed", desc: "R 1,890.00 charged · confirmation sent to tunde@gmail.com.", done: true },
  { when: "11 May · 15:09", title: "Added to your calendar", desc: "Google Calendar event created · auto-synced.", done: true },
  { when: "Tue · 19 May", title: "24h reminder", desc: "Last chance to reschedule free of charge." },
  { when: "Wed · 08:30", title: "Check in with your QR at Iron Lab Sea Point", desc: "QR code is on this page — bring a phone or screenshot." },
];

function QrPattern({ size = 13, seed = 19 }: { size?: number; seed?: number }) {
  const total = size * size;
  let s = seed;
  const cells: boolean[] = [];
  for (let i = 0; i < total; i++) {
    s = (s * 9301 + 49297) % 233280;
    cells.push(s / 233280 <= 0.55);
  }
  return (
    <div
      className="w-full aspect-square rounded-(--r-2) p-4"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="w-full h-full gap-0.5"
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${size}, 1fr)`,
          gridTemplateRows: `repeat(${size}, 1fr)`,
        }}
      >
        {cells.map((filled, i) => (
          <span
            key={i}
            className="rounded-[1px]"
            style={{ background: filled ? "var(--ink)" : "transparent" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function BookingDetailPage() {
  return (
    <div style={{ background: "var(--bg-2)" }}>
      {/* Nav */}
      <nav
        className="h-15 flex items-center justify-between px-5 sm:px-10 sticky top-0 z-10"
        style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-7">
          <Link href="/">
            <BinecticsLockup />
          </Link>
          <div className="hidden sm:flex gap-1">
            {[
              { href: "/marketplace", label: "Marketplace" },
              { href: "/dashboard/bookings", label: "My bookings", active: true },
              { href: "#", label: "Messages" },
              { href: "#", label: "Saved" },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={`px-3 py-2 rounded-(--r-2) text-[13.5px] ${l.active ? "bg-bg-3 font-medium" : "hover:bg-bg-2"}`}
                style={{ color: l.active ? "var(--ink)" : "var(--fg-2)" }}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            className="w-8 h-8 rounded-(--r-2) flex items-center justify-center"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
          <button
            className="w-8 h-8 rounded-(--r-2) flex items-center justify-center"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </button>
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold cursor-pointer"
            style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}
          >
            TA
          </span>
        </div>
      </nav>

      <div className="mx-auto px-5 sm:px-10 pt-8 pb-20" style={{ maxWidth: 1180 }}>
        {/* Breadcrumb */}
        <div
          className="flex items-center gap-1.5 text-[13px] mb-4.5"
          style={{ color: "var(--fg-3)" }}
        >
          <Link href="/dashboard/bookings" className="hover:text-ink" style={{ color: "var(--fg-3)" }}>
            My bookings
          </Link>
          <span style={{ color: "var(--fg-4)" }}>/</span>
          <span className="font-medium" style={{ color: "var(--ink)" }}>
            BIN&#x2011;2026&#x2011;042841
          </span>
        </div>

        {/* Head */}
        <div
          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 mb-8"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h1
              className="text-[30px] font-medium leading-[1.1]"
              style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}
            >
              Strength session with Sarah Okafor
            </h1>
            <div
              className="flex flex-wrap items-center gap-3 mt-2.5 font-mono text-[11.5px] uppercase"
              style={{ letterSpacing: "0.04em", color: "var(--fg-3)" }}
            >
              <span>
                <strong
                  className="font-sans text-[13px] font-medium normal-case"
                  style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}
                >
                  Wed &middot; 20 May 2026
                </strong>{" "}
                &middot; 08:30 SAST &middot; 60 min
              </span>
              <span
                className="w-[3px] h-[3px] rounded-full"
                style={{ background: "var(--border-2)" }}
              />
              <span>
                <strong
                  className="font-sans text-[13px] font-medium normal-case"
                  style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}
                >
                  Iron Lab
                </strong>{" "}
                Sea Point
              </span>
              <span
                className="w-[3px] h-[3px] rounded-full"
                style={{ background: "var(--border-2)" }}
              />
              <span>In-person &middot; 1-on-1</span>
              <span
                className="w-[3px] h-[3px] rounded-full"
                style={{ background: "var(--border-2)" }}
              />
              <span>BIN&#x2011;2026&#x2011;042841</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase px-2.5 py-1 rounded-full"
              style={{
                letterSpacing: "0.05em",
                background: "var(--signal-soft)",
                color: "var(--signal-ink)",
                border: "1px solid oklch(0.88 0.05 148)",
              }}
            >
              <span
                className="w-[5px] h-[5px] rounded-full"
                style={{ background: "var(--signal)" }}
              />
              Confirmed
            </span>
            <button className="btn-ghost-v2 sm">Message Sarah</button>
          </div>
        </div>

        {/* Body grid */}
        <div
          className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start"
        >
          {/* LEFT */}
          <div className="flex flex-col gap-3.5">
            {/* Action cards */}
            <div
              className="rounded-(--r-3) overflow-hidden"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <div
                className="px-4.5 py-3.5 flex justify-between items-center"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <h3
                  className="text-[14px] font-medium"
                  style={{ color: "var(--ink)" }}
                >
                  Manage this booking
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3.5 sm:p-4.5">
                {/* Reschedule */}
                <div
                  className="flex flex-col gap-2 p-3.5 rounded-(--r-2) cursor-pointer"
                  style={{
                    border: "1px solid var(--border)",
                    transition: "border-color 120ms",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "var(--ink)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  >
                    <rect x="3" y="4" width="18" height="17" rx="2" />
                    <path d="M3 9h18M8 2v4M16 2v4" />
                    <path d="m14 14 2 2 4-4" />
                  </svg>
                  <div>
                    <div
                      className="text-[13px] font-medium"
                      style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}
                    >
                      Reschedule
                    </div>
                    <div
                      className="text-[11.5px] leading-[1.45] mt-0.5"
                      style={{ color: "var(--fg-3)" }}
                    >
                      Free up to 24h before — pick a new slot from Sarah&apos;s calendar.
                    </div>
                  </div>
                </div>

                {/* Cancel */}
                <div
                  className="flex flex-col gap-2 p-3.5 rounded-(--r-2) cursor-pointer"
                  style={{
                    border: "1px solid var(--border)",
                    transition: "border-color 120ms",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "var(--ink)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--ink)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M9 9l6 6M15 9l-6 6" />
                  </svg>
                  <div>
                    <div
                      className="text-[13px] font-medium"
                      style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}
                    >
                      Cancel session
                    </div>
                    <div
                      className="text-[11.5px] leading-[1.45] mt-0.5"
                      style={{ color: "var(--fg-3)" }}
                    >
                      32h before — full refund to your VISA &bull;&bull;&bull;&bull; 4421.
                    </div>
                  </div>
                </div>

                {/* Refund */}
                <div
                  className="flex flex-col gap-2 p-3.5 rounded-(--r-2) cursor-pointer"
                  style={{
                    border: "1px solid var(--border)",
                    transition: "border-color 120ms",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "var(--danger)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="var(--danger)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  >
                    <path d="M3 10h13a5 5 0 1 1 0 10h-3" />
                    <path d="m7 6-4 4 4 4" />
                  </svg>
                  <div>
                    <div
                      className="text-[13px] font-medium"
                      style={{ letterSpacing: "-0.005em", color: "var(--danger)" }}
                    >
                      Request a refund
                    </div>
                    <div
                      className="text-[11.5px] leading-[1.45] mt-0.5"
                      style={{ color: "var(--fg-3)" }}
                    >
                      Something already went wrong with a session you attended.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Cost breakdown */}
            <div
              className="rounded-(--r-3) overflow-hidden"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <div
                className="px-4.5 py-3.5 flex justify-between items-center"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <h3
                  className="text-[14px] font-medium"
                  style={{ color: "var(--ink)" }}
                >
                  What you paid
                </h3>
                <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>
                  Charged to VISA &bull;&bull;&bull;&bull; 4421 on 11 May, 14:32 SAST
                </span>
              </div>
              {[
                { k: "Session · 60 min", v: "R 1,200.00" },
                { k: "Take-home program · 4 weeks", v: "R 600.00" },
                { k: "Session recording", v: "Free" },
                { k: "Platform fee · 5%", v: "R 90.00" },
              ].map((r) => (
                <div
                  key={r.k}
                  className="px-4.5 py-3 flex justify-between items-center text-[13.5px]"
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <span
                    className="font-mono text-[11.5px] uppercase"
                    style={{ letterSpacing: "0.04em", color: "var(--fg-3)" }}
                  >
                    {r.k}
                  </span>
                  <span
                    className="font-mono"
                    style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
                  >
                    {r.v}
                  </span>
                </div>
              ))}
              <div
                className="px-4.5 py-3 flex justify-between items-center"
                style={{ background: "var(--bg-2)" }}
              >
                <span
                  className="text-[14px] font-medium"
                  style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}
                >
                  Total paid
                </span>
                <span
                  className="font-mono text-[16px] font-medium"
                  style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
                >
                  R 1,890.00
                </span>
              </div>
            </div>

            {/* Timeline */}
            <div
              className="rounded-(--r-3) overflow-hidden"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <div
                className="px-4.5 py-3.5"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <h3
                  className="text-[14px] font-medium"
                  style={{ color: "var(--ink)" }}
                >
                  Booking timeline
                </h3>
              </div>
              <div className="py-3.5">
                {TIMELINE.map((t, i) => (
                  <div
                    key={t.title}
                    className="relative grid gap-3.5 px-4.5 py-2 items-start"
                    style={{ gridTemplateColumns: "80px 24px 1fr" }}
                  >
                    {/* Connector line */}
                    {i < TIMELINE.length - 1 && (
                      <div
                        className="absolute w-px"
                        style={{
                          left: "calc(80px + 18px + 11px)",
                          top: 28,
                          bottom: -8,
                          background: t.done ? "var(--signal)" : "var(--border)",
                        }}
                      />
                    )}
                    {/* When */}
                    <span
                      className="font-mono text-[11px] uppercase text-right pt-1 pl-4.5"
                      style={{
                        letterSpacing: "0.04em",
                        color: t.done ? "var(--signal-ink)" : "var(--fg-3)",
                      }}
                    >
                      {t.when}
                    </span>
                    {/* Marker */}
                    <span
                      className="w-[22px] h-[22px] rounded-full inline-flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: t.done ? "var(--signal)" : "var(--bg)",
                        border: t.done
                          ? "1.5px solid var(--signal)"
                          : "1.5px solid var(--border-2)",
                      }}
                    >
                      {t.done && (
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: "var(--bg)" }}
                        >
                          &#x2713;
                        </span>
                      )}
                    </span>
                    {/* Body */}
                    <div>
                      <div
                        className="text-[13.5px] font-medium"
                        style={{
                          letterSpacing: "-0.005em",
                          color: "var(--ink)",
                        }}
                      >
                        {t.title}
                      </div>
                      <div
                        className="text-[12.5px] mt-0.5 leading-[1.5]"
                        style={{ color: "var(--fg-3)" }}
                      >
                        {t.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <aside
            className="flex flex-col gap-3.5 sticky"
            style={{ top: 88 }}
          >
            {/* QR card */}
            <div
              className="rounded-(--r-3) p-5 flex flex-col gap-3.5"
              style={{ background: "var(--ink)", color: "var(--bg)" }}
            >
              <div
                className="font-mono text-[10.5px] uppercase"
                style={{
                  letterSpacing: "0.06em",
                  color: "oklch(0.65 0.005 85)",
                }}
              >
                Check in on the day
              </div>
              <QrPattern size={13} seed={19} />
              <div>
                <div className="text-[14px] font-medium">Tunde Adebayo</div>
                <div
                  className="font-mono text-[11px] mt-0.5"
                  style={{ color: "oklch(0.65 0.005 85)" }}
                >
                  042841 &middot; Wed 08:30 SAST
                </div>
              </div>
            </div>

            {/* Provider card */}
            <div
              className="rounded-(--r-3) overflow-hidden"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <div
                className="px-4.5 py-3.5"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <h3
                  className="text-[14px] font-medium"
                  style={{ color: "var(--ink)" }}
                >
                  Your trainer
                </h3>
              </div>
              <div
                className="px-4.5 py-3.5 flex items-center gap-3"
                style={{ borderBottom: "1px solid var(--border)" }}
              >
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold"
                  style={{
                    background: "var(--trainer)",
                    color: "oklch(0.2 0.05 75)",
                  }}
                >
                  SO
                </span>
                <div className="flex-1">
                  <div
                    className="text-[14px] font-medium"
                    style={{ color: "var(--ink)" }}
                  >
                    Sarah Okafor
                  </div>
                  <div
                    className="font-mono text-[11px] uppercase mt-0.5"
                    style={{
                      letterSpacing: "0.04em",
                      color: "var(--fg-3)",
                    }}
                  >
                    4.9 &middot; 312 reviews &middot; CPT
                  </div>
                </div>
              </div>
              {[
                { k: "Email", v: "sarah@binectics.com" },
                { k: "Replies", v: "within 1h" },
              ].map((r) => (
                <div
                  key={r.k}
                  className="px-4.5 py-3 flex justify-between items-center gap-3.5 text-[13.5px]"
                  style={{
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span
                    className="font-mono text-[11.5px] uppercase"
                    style={{ letterSpacing: "0.04em", color: "var(--fg-3)" }}
                  >
                    {r.k}
                  </span>
                  <span style={{ color: "var(--ink)", textAlign: "right" }}>
                    {r.v}
                  </span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
