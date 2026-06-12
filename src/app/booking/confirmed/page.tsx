"use client";

import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";

const TIMELINE = [
  { when: "Just now", title: "Booking placed", desc: "Card held — no charge until Sarah confirms.", done: true },
  { when: "Within 4h", title: "Sarah confirms", desc: "You'll get a push notification and email. Card is charged ZAR 1,890.00 only at this point. If she declines or doesn't reply, the hold is released automatically.", now: true },
  { when: "Tue · May 19", title: "Reminder · 24h before", desc: "Final chance to reschedule without a fee. You'll also get the gym's full address & parking info." },
  { when: "Wed · 08:30", title: "Show up · check in at the front desk with your QR", desc: "Bring water and clothes you can move in. Iron Lab provides shoes, plates, and chalk." },
  { when: "After", title: "Sarah delivers your program", desc: "4-week strength block in-app and as PDF within 48 hours. Plus your session recording." },
];

function QrPattern({ size = 13, seed = 42 }: { size?: number; seed?: number }) {
  const total = size * size;
  let s = seed;
  const cells: boolean[] = [];
  for (let i = 0; i < total; i++) {
    s = (s * 9301 + 49297) % 233280;
    cells.push(s / 233280 <= 0.5);
  }
  // Finder pattern corners (top-left, top-right, bottom-left)
  const finderPositions = [
    [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0],
    [0, 1], [6, 1],
    [0, 2], [2, 2], [3, 2], [4, 2], [6, 2],
    [0, 3], [2, 3], [3, 3], [4, 3], [6, 3],
    [0, 4], [2, 4], [3, 4], [4, 4], [6, 4],
    [0, 5], [6, 5],
    [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6],
  ];
  // Clear 7x7 areas for finder patterns
  const offsets = [[0, 0], [size - 7, 0], [0, size - 7]];
  offsets.forEach(([ox, oy]) => {
    for (let dy = 0; dy < 7; dy++) {
      for (let dx = 0; dx < 7; dx++) {
        const idx = (oy + dy) * size + (ox + dx);
        if (idx < total) cells[idx] = false;
      }
    }
    finderPositions.forEach(([dx, dy]) => {
      const idx = (oy + dy) * size + (ox + dx);
      if (idx < total) cells[idx] = true;
    });
  });

  return (
    <div
      className="w-full aspect-square rounded-(--r-2) p-5"
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

const ACTIONS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 9h6v6H9z" />
      </svg>
    ),
    title: "Manage booking",
    sub: "Reschedule · cancel · receipt",
    href: "/booking/1",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="17" rx="2" />
        <path d="M3 9h18M8 2v4M16 2v4" />
      </svg>
    ),
    title: "Add to calendar",
    sub: "Google · Apple · Outlook",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.4 8.4 0 0 1-1 4 8.5 8.5 0 0 1-7.5 4.5 8.5 8.5 0 0 1-4-1L3 21l2-5.5a8.5 8.5 0 1 1 16-4z" />
      </svg>
    ),
    title: "Message Sarah",
    sub: "Usually replies in 1h",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
    title: "What to expect",
    sub: "First session checklist",
  },
];

export default function BookingConfirmedPage() {
  return (
    <div style={{ background: "var(--bg)" }}>
      {/* Top bar */}
      <header
        className="flex items-center justify-between px-5 sm:px-10 py-4.5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <Link href="/">
          <BinecticsLockup />
        </Link>
        <span
          className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase px-2.5 py-1 rounded-full"
          style={{
            letterSpacing: "0.05em",
            color: "var(--signal-ink)",
            background: "var(--signal-soft)",
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--signal)" }}
          />
          Booking placed &middot; waiting on Sarah
        </span>
      </header>

      {/* 2-column layout */}
      <div
        className="mx-auto px-5 sm:px-10 pt-12 pb-20 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-10 items-start"
        style={{ maxWidth: 1080 }}
      >
        {/* LEFT — main content */}
        <main>
          {/* Hero */}
          <div
            className="flex flex-col gap-1.5 pb-8 mb-8"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div
              className="flex items-center gap-2 font-mono text-[11px] uppercase"
              style={{ letterSpacing: "0.05em", color: "var(--fg-3)" }}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: "var(--signal)", color: "var(--bg)" }}
              >
                &#x2713;
              </span>
              Confirmation BIN&#x2011;2026&#x2011;042841
            </div>
            <h1
              className="text-[36px] sm:text-[40px] font-medium leading-[1.04] mt-3.5 max-w-[18ch]"
              style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}
            >
              You&apos;re booked. We&apos;ll let you know the moment{" "}
              <em className="font-serif font-normal italic">Sarah</em> confirms.
            </h1>
            <p
              className="text-[15.5px] mt-4 leading-relaxed max-w-[56ch]"
              style={{ color: "var(--fg-3)" }}
            >
              A hold has been placed on your card — you won&apos;t be charged
              until Sarah accepts (usually within 4 hours). You can cancel or
              reschedule up to 24 hours before your session.
            </p>
            <p
              className="font-mono text-[11.5px] mt-4"
              style={{ letterSpacing: "0.03em", color: "var(--fg-3)" }}
            >
              Confirmation sent to{" "}
              <strong
                className="font-medium"
                style={{ color: "var(--ink)", letterSpacing: "0.04em" }}
              >
                tunde@gmail.com
              </strong>{" "}
              &middot; SMS to{" "}
              <strong
                className="font-medium"
                style={{ color: "var(--ink)", letterSpacing: "0.04em" }}
              >
                +27 82 &#x2022;&#x2022;&#x2022; 1284
              </strong>
            </p>
          </div>

          {/* Session card */}
          <Link
            href="/booking/1"
            className="grid gap-6 p-7 rounded-(--r-3) items-center mb-6"
            style={{
              gridTemplateColumns: "auto 1fr",
              background: "var(--bg-2)",
              border: "1px solid var(--border)",
              textDecoration: "none",
              color: "inherit",
              transition: "border-color 120ms",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "var(--ink)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "var(--border)")
            }
          >
            <div
              className="text-center"
              style={{
                borderRight: "1px solid var(--border)",
                paddingRight: 28,
              }}
            >
              <div
                className="font-mono text-[12px] uppercase"
                style={{ letterSpacing: "0.06em", color: "var(--fg-3)" }}
              >
                May
              </div>
              <div
                className="text-[56px] font-medium leading-none"
                style={{
                  letterSpacing: "-0.04em",
                  fontVariantNumeric: "tabular-nums",
                  color: "var(--ink)",
                }}
              >
                20
              </div>
              <div
                className="font-mono text-[11px] uppercase mt-1"
                style={{ letterSpacing: "0.05em", color: "var(--fg-3)" }}
              >
                Wed
              </div>
            </div>
            <div>
              <div
                className="text-[17px] font-medium"
                style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}
              >
                In-person strength session &middot; 60 minutes
              </div>
              <div
                className="font-mono text-[12px] uppercase mt-1.5"
                style={{ letterSpacing: "0.04em", color: "var(--fg-3)" }}
              >
                08:30 SAST &middot; arrive 5 min early &middot; Iron Lab{" "}
                <strong className="font-medium" style={{ color: "var(--ink)" }}>
                  Sea Point
                </strong>
              </div>
              <div
                className="font-mono text-[12px] uppercase mt-1.5"
                style={{ letterSpacing: "0.04em", color: "var(--fg-3)" }}
              >
                Take-home program (4 weeks) included &middot; session recording
                included
              </div>
              <div
                className="flex items-center gap-2.5 mt-3.5 pt-3.5"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold"
                  style={{
                    background: "var(--trainer)",
                    color: "oklch(0.2 0.05 75)",
                  }}
                >
                  SO
                </span>
                <div>
                  <div
                    className="text-[13.5px] font-medium"
                    style={{ color: "var(--ink)" }}
                  >
                    With Sarah Okafor
                  </div>
                  <div
                    className="font-mono text-[11px] uppercase"
                    style={{ letterSpacing: "0.05em", color: "var(--fg-3)" }}
                  >
                    Strength &amp; running coach &middot; 4.9 &middot; 312
                    reviews
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* Action cards — 4 cards in a row (3 on the prototype but 4 items) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8">
            {ACTIONS.map((a) => {
              const inner = (
                <div
                  className="flex flex-col gap-2 p-4 rounded-(--r-3) cursor-pointer"
                  style={{
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    transition: "border-color 120ms",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "var(--ink)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                >
                  <span
                    className="w-[18px] h-[18px]"
                    style={{ color: "var(--ink)" }}
                  >
                    {a.icon}
                  </span>
                  <div>
                    <div
                      className="text-[13px] font-medium"
                      style={{ color: "var(--ink)" }}
                    >
                      {a.title}
                    </div>
                    <div
                      className="font-mono text-[11.5px] uppercase mt-0.5"
                      style={{
                        letterSpacing: "0.04em",
                        color: "var(--fg-3)",
                      }}
                    >
                      {a.sub}
                    </div>
                  </div>
                </div>
              );
              return a.href ? (
                <Link
                  key={a.title}
                  href={a.href}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  {inner}
                </Link>
              ) : (
                <div key={a.title}>{inner}</div>
              );
            })}
          </div>

          {/* Timeline */}
          <div>
            <div
              className="font-mono text-[10.5px] uppercase mb-4.5"
              style={{ letterSpacing: "0.06em", color: "var(--fg-3)" }}
            >
              What happens next
            </div>
            <div className="flex flex-col">
              {TIMELINE.map((t, i) => (
                <div
                  key={t.title}
                  className="relative grid gap-4 py-3.5"
                  style={{ gridTemplateColumns: "80px 24px 1fr" }}
                >
                  {/* Connector */}
                  {i < TIMELINE.length - 1 && (
                    <div
                      className="absolute w-px"
                      style={{
                        left: 91,
                        top: 28,
                        bottom: -14,
                        background: t.done
                          ? "var(--signal)"
                          : "var(--border)",
                      }}
                    />
                  )}
                  {/* When */}
                  <span
                    className="font-mono text-[11.5px] uppercase text-right pt-0.5"
                    style={{
                      letterSpacing: "0.04em",
                      color: t.done
                        ? "var(--signal-ink)"
                        : t.now
                          ? "var(--ink)"
                          : "var(--fg-3)",
                    }}
                  >
                    {t.when}
                  </span>
                  {/* Marker */}
                  <span
                    className="w-6 h-6 rounded-full inline-flex items-center justify-center shrink-0"
                    style={{
                      background: t.done
                        ? "var(--signal)"
                        : t.now
                          ? "var(--ink)"
                          : "var(--bg)",
                      border: t.done
                        ? "1.5px solid var(--signal)"
                        : t.now
                          ? "1.5px solid var(--ink)"
                          : "1.5px solid var(--border-2)",
                    }}
                  >
                    {t.done && (
                      <span
                        className="text-[11px] font-bold"
                        style={{ color: "var(--bg)" }}
                      >
                        &#x2713;
                      </span>
                    )}
                    {t.now && (
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: "var(--bg)",
                          animation: "pulse 1.8s ease-in-out infinite",
                        }}
                      />
                    )}
                  </span>
                  {/* Body */}
                  <div>
                    <div
                      className="text-[14px] font-medium"
                      style={{
                        letterSpacing: "-0.005em",
                        color: "var(--ink)",
                      }}
                    >
                      {t.title}
                    </div>
                    <div
                      className="text-[12.5px] mt-0.5 leading-normal"
                      style={{ color: "var(--fg-3)" }}
                    >
                      {t.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          <section
            className="mt-14 pt-8"
            style={{ borderTop: "1px solid var(--border)" }}
          >
            <h2
              className="text-[22px] font-medium mb-4.5"
              style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}
            >
              Other things you might want to do
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  eyebrow: "My bookings",
                  title: "See all your sessions",
                  desc: "Upcoming · past · cancelled. Manage everything from one place.",
                  href: "/dashboard/bookings",
                },
                {
                  eyebrow: "Marketplace",
                  title: "Add a dietitian to your routine",
                  desc: "5 nutritionists in Cape Town verified this week.",
                  href: "/marketplace",
                },
                {
                  eyebrow: "Iron Lab",
                  title: "Try a class while you're there",
                  desc: "Free first group class for new bookers — 6:00 strength is open.",
                  href: "/marketplace/iron-lab",
                },
              ].map((s) => (
                <Link
                  key={s.title}
                  href={s.href}
                  className="rounded-(--r-3) p-4.5 cursor-pointer"
                  style={{
                    border: "1px solid var(--border)",
                    background: "var(--bg)",
                    transition: "border-color 120ms",
                    textDecoration: "none",
                    color: "inherit",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = "var(--ink)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = "var(--border)")
                  }
                >
                  <div
                    className="font-mono text-[10.5px] uppercase"
                    style={{ letterSpacing: "0.05em", color: "var(--fg-3)" }}
                  >
                    {s.eyebrow}
                  </div>
                  <div
                    className="text-[14.5px] font-medium mt-1.5"
                    style={{
                      letterSpacing: "-0.005em",
                      color: "var(--ink)",
                    }}
                  >
                    {s.title}
                  </div>
                  <div
                    className="text-[12.5px] mt-1 leading-normal"
                    style={{ color: "var(--fg-3)" }}
                  >
                    {s.desc}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </main>

        {/* RIGHT RAIL */}
        <aside
          className="flex flex-col gap-5 sticky"
          style={{ top: 24 }}
        >
          {/* QR card */}
          <div>
            <div
              className="font-mono text-[10.5px] uppercase mb-3"
              style={{ letterSpacing: "0.06em", color: "var(--fg-3)" }}
            >
              Check in on the day
            </div>
            <div
              className="rounded-(--r-3) p-6 flex flex-col gap-4"
              style={{ background: "var(--ink)", color: "var(--bg)" }}
            >
              <div className="flex justify-between items-start">
                <div
                  className="font-mono text-[11px] uppercase"
                  style={{
                    letterSpacing: "0.05em",
                    color: "oklch(0.75 0.005 85)",
                  }}
                >
                  Iron Lab
                  <br />
                  <strong className="font-medium" style={{ color: "var(--bg)" }}>
                    Sea Point
                  </strong>
                </div>
                <div
                  className="font-mono text-[11px] text-right"
                  style={{ color: "oklch(0.75 0.005 85)" }}
                >
                  Wed &middot; 20 May
                  <br />
                  <span style={{ color: "var(--bg)" }}>08:30 SAST</span>
                </div>
              </div>
              <QrPattern size={13} seed={42} />
              <div>
                <div className="text-[15px] font-medium">Tunde Adebayo</div>
                <div
                  className="font-mono text-[11px]"
                  style={{ color: "oklch(0.65 0.005 85)" }}
                >
                  Session BIN&#x2011;2026&#x2011;042841
                </div>
              </div>
            </div>
          </div>

          {/* Receipt */}
          <div>
            <div
              className="font-mono text-[10.5px] uppercase mb-3"
              style={{ letterSpacing: "0.06em", color: "var(--fg-3)" }}
            >
              Receipt
            </div>
            <div
              className="rounded-(--r-3) p-4.5"
              style={{
                background: "var(--bg-2)",
                border: "1px solid var(--border)",
              }}
            >
              {[
                { k: "Session · 60 min", v: "R 1,200.00" },
                { k: "Take-home program", v: "R 600.00" },
                { k: "Session recording", v: "Free" },
                { k: "Platform fee · 5%", v: "R 90.00" },
              ].map((r) => (
                <div
                  key={r.k}
                  className="flex justify-between py-2 text-[13px]"
                >
                  <span style={{ color: "var(--fg-3)" }}>{r.k}</span>
                  <span
                    className="font-mono"
                    style={{
                      color: "var(--ink)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {r.v}
                  </span>
                </div>
              ))}
              <div
                className="flex justify-between pt-3.5 mt-1.5 font-medium"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span className="text-[14px]" style={{ color: "var(--ink)" }}>
                  Total &middot; held
                </span>
                <span
                  className="text-[16px]"
                  style={{
                    color: "var(--ink)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  R 1,890.00
                </span>
              </div>
              <div
                className="font-mono text-[10.5px] uppercase flex justify-between mt-3.5 pt-3.5"
                style={{
                  letterSpacing: "0.05em",
                  borderTop: "1px solid var(--border)",
                  color: "var(--fg-3)",
                }}
              >
                <span>Paystack &middot; VISA 4421</span>
                <span>ZAR</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
