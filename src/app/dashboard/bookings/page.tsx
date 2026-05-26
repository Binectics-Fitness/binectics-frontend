"use client";

import { useState } from "react";
import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { StatusPill } from "@/components/ds/StatusPill";

/**
 * My bookings — my-bookings.html prototype.
 * Consumer chrome (nav bar, not dashboard sidebar).
 * Tabs: Upcoming / Past / Cancelled / Recurring.
 * Layout: 1fr + 340px (booking list + detail card).
 * Month groupings. Right detail panel with status, receipt, QR mini.
 * Past bookings include review indicators (5★ review, review pending, plan delivered).
 */

type BookingStatus = "pending" | "confirmed" | "done" | "cancelled";

interface Booking {
  id: string;
  date: string;
  day: string;
  dow: string;
  title: string;
  meta: string;
  with: string;
  withInitials: string;
  withRole: "trainer" | "dietitian" | "gym";
  status: BookingStatus;
  statusLabel: string;
  price: string;
  priceNote?: string;
  active?: boolean;
  reviewIndicator?: string;
}

const UPCOMING: Booking[] = [
  { id: "042841", date: "May", day: "20", dow: "Wed", title: "Strength session · 60 min", meta: "08:30 SAST · Iron Lab Sea Point · In-person", with: "Sarah Okafor", withInitials: "SO", withRole: "trainer", status: "pending", statusLabel: "Pending · awaiting Sarah", price: "R 1,890.00 held", active: true },
  { id: "042791", date: "May", day: "22", dow: "Fri", title: "Nutrition follow-up · 30 min", meta: "14:00 SAST · Video call · Online", with: "Dr Nadia Hassan", withInitials: "NH", withRole: "dietitian", status: "confirmed", statusLabel: "Confirmed", price: "R 380.00 paid" },
  { id: "042668", date: "May", day: "27", dow: "Wed", title: "Strength session · 60 min", meta: "08:30 SAST · Iron Lab Sea Point · In-person", with: "Sarah Okafor · part of weekly recurring", withInitials: "SO", withRole: "trainer", status: "confirmed", statusLabel: "Confirmed", price: "R 1,200.00 paid" },
  { id: "042902", date: "Jun", day: "03", dow: "Wed", title: "Strength session · 60 min", meta: "08:30 SAST · Iron Lab Sea Point · Recurring", with: "Sarah Okafor", withInitials: "SO", withRole: "trainer", status: "confirmed", statusLabel: "Confirmed", price: "R 1,200.00" },
  { id: "042944", date: "Jun", day: "10", dow: "Wed", title: "Strength session · 60 min", meta: "08:30 SAST · Iron Lab Sea Point · Recurring", with: "Sarah Okafor", withInitials: "SO", withRole: "trainer", status: "confirmed", statusLabel: "Confirmed", price: "R 1,200.00" },
];

const PAST: Booking[] = [
  { id: "041921", date: "May", day: "13", dow: "Wed", title: "Strength session · 60 min", meta: "08:30 SAST · Iron Lab Sea Point", with: "Sarah Okafor", withInitials: "SO", withRole: "trainer", status: "done", statusLabel: "Completed", price: "R 1,200.00", reviewIndicator: "You left a 5★ review" },
  { id: "041840", date: "May", day: "06", dow: "Wed", title: "Nutrition consult · initial", meta: "14:00 SAST · Video call", with: "Dr Nadia Hassan", withInitials: "NH", withRole: "dietitian", status: "done", statusLabel: "Completed", price: "R 950.00", reviewIndicator: "plan delivered" },
  { id: "041780", date: "May", day: "06", dow: "Wed", title: "Strength session · 60 min", meta: "08:30 SAST · Iron Lab Sea Point", with: "Sarah Okafor", withInitials: "SO", withRole: "trainer", status: "done", statusLabel: "Completed", price: "R 1,200.00", reviewIndicator: "review pending" },
  { id: "040951", date: "Apr", day: "29", dow: "Wed", title: "Strength session · 60 min", meta: "08:30 SAST · Iron Lab Sea Point", with: "Sarah Okafor", withInitials: "SO", withRole: "trainer", status: "done", statusLabel: "Completed", price: "R 1,200.00", reviewIndicator: "5★ given" },
  { id: "040810", date: "Apr", day: "22", dow: "Wed", title: "Class · Open gym + group lift", meta: "17:00 SAST · Iron Lab Sea Point", with: "Iron Lab Sea Point · drop-in", withInitials: "IL", withRole: "gym", status: "done", statusLabel: "Completed", price: "R 180.00" },
  { id: "040728", date: "Apr", day: "15", dow: "Wed", title: "Strength session · 60 min", meta: "08:30 SAST · Iron Lab Sea Point", with: "Sarah Okafor", withInitials: "SO", withRole: "trainer", status: "done", statusLabel: "Completed", price: "R 1,200.00", reviewIndicator: "5★ given" },
  { id: "040521", date: "Apr", day: "08", dow: "Wed", title: "Strength session · 60 min", meta: "08:30 SAST · Iron Lab Sea Point", with: "Sarah Okafor", withInitials: "SO", withRole: "trainer", status: "done", statusLabel: "Completed", price: "R 1,200.00", reviewIndicator: "5★ given" },
];

const CANCELLED: Booking[] = [
  { id: "040112", date: "Apr", day: "01", dow: "Wed", title: "Strength session · 60 min", meta: "08:30 SAST · Iron Lab Sea Point · You cancelled · refunded", with: "Sarah Okafor", withInitials: "SO", withRole: "trainer", status: "cancelled", statusLabel: "Cancelled · 33h before", price: "R 1,200.00 refunded" },
];

const RECURRING: Booking[] = [
  { id: "rec-001", date: "Every", day: "Wed", dow: "08:30", title: "Strength session · weekly", meta: "Iron Lab Sea Point · Started Apr 08 · 22 sessions remaining", with: "Sarah Okafor · auto-charged 24h before", withInitials: "SO", withRole: "trainer", status: "confirmed", statusLabel: "Active", price: "R 1,200.00 / week" },
];

const TABS = [
  { key: "upcoming", label: "Upcoming", count: "3" },
  { key: "past", label: "Past", count: "12" },
  { key: "cancelled", label: "Cancelled", count: "1" },
  { key: "recurring", label: "Recurring", count: "1" },
];

function avatarStyle(role: "trainer" | "dietitian" | "gym") {
  switch (role) {
    case "trainer":
      return { background: "var(--trainer)", color: "oklch(0.2 0.05 75)" };
    case "dietitian":
      return { background: "var(--dietitian)", color: "oklch(0.95 0 0)" };
    case "gym":
      return { background: "var(--gym)", color: "oklch(0.95 0 0)" };
  }
}

function BookingRow({ b, isSelected }: { b: Booking; isSelected?: boolean }) {
  const isRecurring = b.id.startsWith("rec-");
  const isCancelled = b.status === "cancelled";

  return (
    <Link
      href={isRecurring ? "#" : `/booking/${b.id}`}
      className={`grid gap-5 p-4.5 px-5 rounded-(--r-3) mb-3 ${isSelected ? "border-ink" : "hover:border-ink"}`}
      style={{
        gridTemplateColumns: "auto 1fr auto",
        border: `1px solid ${isSelected ? "var(--ink)" : "var(--border)"}`,
        background: "var(--bg)",
        transition: "border-color 120ms",
        textDecoration: "none",
        color: "inherit",
        alignItems: "center",
        cursor: "pointer",
      }}
    >
      {/* Date block */}
      <div
        className="flex flex-col items-center gap-0.5 shrink-0"
        style={{
          paddingRight: 20,
          borderRight: "1px solid var(--border)",
          minWidth: 56,
        }}
      >
        <span
          className="font-mono text-[10.5px] uppercase"
          style={{ letterSpacing: "0.05em", color: "var(--fg-3)" }}
        >
          {b.date}
        </span>
        <span
          className={`font-medium leading-none ${isRecurring ? "text-[22px]" : "text-[28px]"}`}
          style={{
            letterSpacing: "-0.025em",
            fontVariantNumeric: "tabular-nums",
            color: "var(--ink)",
          }}
        >
          {b.day}
        </span>
        <span
          className="font-mono text-[10px] uppercase"
          style={{ letterSpacing: "0.05em", color: "var(--fg-3)" }}
        >
          {b.dow}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-1 min-w-0">
        <div
          className="text-[15px] font-medium truncate"
          style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}
        >
          {b.title}
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11.5px] uppercase" style={{ letterSpacing: "0.04em", color: "var(--fg-3)" }}>
          {b.meta.split(" · ").map((part, i, arr) => (
            <span key={i} className="flex items-center gap-3">
              {part}
              {i < arr.length - 1 && (
                <span className="w-0.75 h-0.75 rounded-full" style={{ background: "var(--border-2)" }} />
              )}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9.5px] font-semibold"
            style={avatarStyle(b.withRole)}
          >
            {b.withInitials}
          </span>
          <span className="text-[12.5px]" style={{ color: "var(--fg-2)" }}>
            {b.with}
            {b.reviewIndicator && (
              <> &middot; <span style={{ color: b.reviewIndicator === "review pending" ? "var(--fg-3)" : "var(--ink)" }}>{b.reviewIndicator}</span></>
            )}
          </span>
        </div>
      </div>

      {/* Right */}
      <div className="flex flex-col items-end gap-1.5">
        <StatusPill variant={b.status} label={b.statusLabel} />
        <span
          className="font-mono text-[13px] font-medium"
          style={{
            color: isCancelled ? "var(--fg-3)" : "var(--ink)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {b.price}
        </span>
      </div>
    </Link>
  );
}

function MonthHeader({ label, count }: { label: string; count: string }) {
  return (
    <div
      className="flex justify-between font-mono text-[11px] uppercase pb-1.5"
      style={{ letterSpacing: "0.05em", color: "var(--fg-3)" }}
    >
      <span>{label}</span>
      <span style={{ color: "var(--fg-4)" }}>{count}</span>
    </div>
  );
}

function QrMiniPattern() {
  const cells: boolean[] = [];
  let seed = 12;
  for (let i = 0; i < 81; i++) {
    seed = (seed * 9301 + 49297) % 233280;
    cells.push(seed / 233280 <= 0.5);
  }
  return (
    <div
      className="w-16 h-16 rounded-[3px] p-1 shrink-0 grid grid-cols-9 grid-rows-9 gap-px"
      style={{ background: "var(--ink)" }}
    >
      {cells.map((filled, i) => (
        <span
          key={i}
          className="rounded-[1px]"
          style={{ background: filled ? "var(--bg)" : "oklch(0.3 0.008 80)" }}
        />
      ))}
    </div>
  );
}

export default function MyBookingsPage() {
  const [activeTab, setActiveTab] = useState("upcoming");

  return (
    <div style={{ background: "var(--bg)" }}>
      {/* Consumer nav */}
      <nav
        className="flex items-center justify-between h-14 sm:h-15 px-5 sm:px-10 sticky top-0 z-10"
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
            className="w-10 h-10 sm:w-8 sm:h-8 rounded-(--r-2) flex items-center justify-center"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
          </button>
          <button
            className="w-10 h-10 sm:w-8 sm:h-8 rounded-(--r-2) flex items-center justify-center relative"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: "var(--danger)" }} />
          </button>
          <span
            className="w-10 h-10 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] font-semibold"
            style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}
          >
            TA
          </span>
        </div>
      </nav>

      <div className="mx-auto max-w-360 px-5 sm:px-10 pt-6 sm:pt-8 pb-20">
        {/* Page header */}
        <div
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6 pb-6"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h1
              className="text-[32px] font-medium leading-none"
              style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}
            >
              Your bookings
            </h1>
            <div className="text-[14px] mt-2" style={{ color: "var(--fg-3)" }}>
              All your sessions across Iron Lab, Sarah, and Dr Nadia — one place.
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost-v2 sm">Export &middot; ICS</button>
            <Link href="/marketplace" className="btn-primary-v2 sm">
              + Book new session
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-6" style={{ borderBottom: "1px solid var(--border)" }}>
          {TABS.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-4.5 py-3 text-[14px] -mb-px cursor-pointer inline-flex items-center gap-2 ${isActive ? "border-b-2 border-ink font-medium" : ""}`}
                style={{ color: isActive ? "var(--ink)" : "var(--fg-3)" }}
              >
                {t.label}
                <span
                  className="font-mono text-[11px] px-1.5 py-px rounded-full"
                  style={{
                    color: isActive ? "var(--ink)" : "var(--fg-4)",
                    background: isActive ? "transparent" : "var(--bg)",
                    border: `1px solid ${isActive ? "transparent" : "var(--border)"}`,
                  }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Layout: list + detail */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] items-start gap-6 lg:gap-8">
          {/* Booking list */}
          <div>
            {/* UPCOMING TAB */}
            {activeTab === "upcoming" && (
              <>
                <MonthHeader label="May 2026 · this month" count="3 sessions" />
                {UPCOMING.filter((b) => b.date === "May").map((b) => (
                  <BookingRow key={b.id} b={b} isSelected={b.active} />
                ))}

                <div className="mt-2">
                  <MonthHeader label="June 2026" count="2 sessions" />
                </div>
                {UPCOMING.filter((b) => b.date === "Jun").map((b) => (
                  <BookingRow key={b.id} b={b} />
                ))}
              </>
            )}

            {/* PAST TAB */}
            {activeTab === "past" && (
              <>
                <MonthHeader label="May 2026" count="3 completed" />
                {PAST.filter((b) => b.date === "May").map((b) => (
                  <BookingRow key={b.id} b={b} />
                ))}

                <div className="mt-2">
                  <MonthHeader label="April 2026" count="9 completed" />
                </div>
                {PAST.filter((b) => b.date === "Apr").map((b) => (
                  <BookingRow key={b.id} b={b} />
                ))}
              </>
            )}

            {/* CANCELLED TAB */}
            {activeTab === "cancelled" && (
              <>
                <MonthHeader label="April 2026" count="1 cancelled" />
                {CANCELLED.map((b) => (
                  <BookingRow key={b.id} b={b} />
                ))}
              </>
            )}

            {/* RECURRING TAB */}
            {activeTab === "recurring" && (
              <>
                <MonthHeader label="Active recurring series" count="1 active" />
                {RECURRING.map((b) => (
                  <BookingRow key={b.id} b={b} />
                ))}
              </>
            )}
          </div>

          {/* Detail card (right rail) */}
          <div
            className="hidden lg:block sticky top-20 rounded-(--r-3) overflow-hidden"
            style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
          >
            <div className="px-5 pt-4.5 pb-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div
                className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                style={{ color: "var(--fg-3)" }}
              >
                Booking BIN&#x2011;2026&#x2011;042841
              </div>
              <div
                className="text-[18px] font-medium mt-1.5"
                style={{ letterSpacing: "-0.012em", color: "var(--ink)" }}
              >
                Strength session &middot; Wed May 20
              </div>
            </div>

            {/* Status */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div
                className="text-[13.5px] leading-relaxed"
                style={{ color: "var(--ink)" }}
              >
                <strong className="font-medium">Pending Sarah&apos;s confirmation.</strong>
              </div>
              <div
                className="text-[12.5px] mt-1 leading-normal"
                style={{ color: "var(--fg-3)" }}
              >
                Within 4h — usually faster. Your card is held, not charged, until she accepts.
              </div>
            </div>

            {/* When & where */}
            <div className="px-5 py-4 flex flex-col gap-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div
                className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2"
                style={{ color: "var(--fg-3)" }}
              >
                When &amp; where
              </div>
              {[
                { k: "Date", v: "Wed · 20 May 2026" },
                { k: "Time", v: "08:30 SAST" },
                { k: "Duration", v: "60 min" },
                { k: "Location", v: "Sea Point" },
              ].map((r) => (
                <div key={r.k} className="flex justify-between text-[13px] py-1.5 gap-3">
                  <span style={{ color: "var(--fg-3)" }}>{r.k}</span>
                  <span
                    className="font-mono text-right"
                    style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
                  >
                    {r.v}
                  </span>
                </div>
              ))}
            </div>

            {/* QR mini */}
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div
                className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2.5"
                style={{ color: "var(--fg-3)" }}
              >
                Check in
              </div>
              <div
                className="rounded-(--r-2) p-4 flex items-center gap-3.5"
                style={{ background: "var(--ink)" }}
              >
                <QrMiniPattern />
                <div className="text-[12px] leading-normal" style={{ color: "var(--bg)" }}>
                  <div
                    className="font-mono text-[10px] uppercase mb-1"
                    style={{ letterSpacing: "0.06em", color: "oklch(0.65 0.005 85)" }}
                  >
                    QR for the front desk
                  </div>
                  <strong className="font-medium">Tunde A.</strong>
                  <br />
                  <span style={{ color: "oklch(0.65 0.005 85)" }}>042841</span>
                </div>
              </div>
            </div>

            {/* Cost */}
            <div className="px-5 py-4 flex flex-col gap-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div
                className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-2"
                style={{ color: "var(--fg-3)" }}
              >
                Cost
              </div>
              {[
                { k: "Session", v: "R 1,200.00" },
                { k: "Take-home program", v: "R 600.00" },
                { k: "Platform fee", v: "R 90.00" },
              ].map((r) => (
                <div key={r.k} className="flex justify-between text-[13px] py-1">
                  <span style={{ color: "var(--fg-3)" }}>{r.k}</span>
                  <span
                    className="font-mono"
                    style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
                  >
                    {r.v}
                  </span>
                </div>
              ))}
              <div
                className="flex justify-between pt-2.5 mt-1 font-medium"
                style={{ borderTop: "1px solid var(--border)" }}
              >
                <span className="text-[13px]" style={{ color: "var(--ink)" }}>
                  Total &middot; held
                </span>
                <span
                  className="text-[15px]"
                  style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}
                >
                  R 1,890.00
                </span>
              </div>
            </div>

            {/* Actions */}
            <div
              className="px-5 py-4 flex flex-col gap-2"
              style={{ background: "var(--bg-2)" }}
            >
              <Link
                href="/booking/042841"
                className="btn-primary-v2 sm w-full justify-center"
              >
                Message Sarah
              </Link>
              <button className="btn-ghost-v2 sm w-full justify-center">
                Reschedule
              </button>
              <button
                className="btn-ghost-v2 sm w-full justify-center"
                style={{ color: "var(--danger)" }}
              >
                Cancel booking
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
