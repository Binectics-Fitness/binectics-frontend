"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { localeForDateFormat } from "@/lib/format/orgFormat";

interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface Preset {
  label: string;
  range: DateRange;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  presets?: Preset[];
  /** Override the org's first-day-of-week setting (0 Sun / 1 Mon / 6 Sat). */
  weekStartsOn?: 0 | 1 | 6;
}

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const DEFAULT_PRESETS: Preset[] = [
  { label: "7D", range: { start: daysAgo(7), end: new Date() } },
  { label: "30D", range: { start: daysAgo(30), end: new Date() } },
  { label: "90D", range: { start: daysAgo(90), end: new Date() } },
  { label: "YTD", range: { start: startOfYear(), end: new Date() } },
];

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function startOfYear(): Date {
  return new Date(new Date().getFullYear(), 0, 1);
}

function formatShort(d: Date | null, locale: string): string {
  if (!d) return "—";
  return d.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInRange(day: Date, range: DateRange): boolean {
  if (!range.start || !range.end) return false;
  return day >= range.start && day <= range.end;
}

export function DateRangePicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  weekStartsOn,
}: DateRangePickerProps) {
  const { weekStartsOn: orgWeekStart, prefs } = useOrgFormat();
  const dateLocale = localeForDateFormat(prefs);
  const weekStart = weekStartsOn ?? orgWeekStart;
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = value.start || new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [tempRange, setTempRange] = useState<DateRange>(value);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  const handleDayClick = (day: Date) => {
    if (selecting === "start") {
      setTempRange({ start: day, end: null });
      setSelecting("end");
    } else {
      const start = tempRange.start!;
      const range = day >= start ? { start, end: day } : { start: day, end: start };
      setTempRange(range);
      onChange(range);
      setSelecting("start");
      setOpen(false);
    }
  };

  const handlePreset = (preset: Preset) => {
    setTempRange(preset.range);
    onChange(preset.range);
    setOpen(false);
  };

  const prevMonth = () => {
    setViewMonth((v) => {
      const m = v.month - 1;
      return m < 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: m };
    });
  };

  const nextMonth = () => {
    setViewMonth((v) => {
      const m = v.month + 1;
      return m > 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: m };
    });
  };

  const daysInMonth = getDaysInMonth(viewMonth.year, viewMonth.month);
  // Leading blanks: offset of the month's first day from the configured
  // week start (e.g. a Wednesday the 1st with Monday-start = 2 blanks).
  const firstDay =
    (new Date(viewMonth.year, viewMonth.month, 1).getDay() - weekStart + 7) % 7;
  const weekdayLabels = [
    ...WEEKDAY_LABELS.slice(weekStart),
    ...WEEKDAY_LABELS.slice(0, weekStart),
  ];
  const monthLabel = new Date(viewMonth.year, viewMonth.month).toLocaleDateString(dateLocale, {
    month: "long",
    year: "numeric",
  });

  return (
    <div ref={containerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex h-9 items-center gap-2 rounded-(--r-2) border border-border bg-bg px-3 text-[13px] font-medium text-ink hover:border-border-2"
        style={{ transition: "border-color var(--motion-fast)" }}
      >
        <svg className="h-3.5 w-3.5 text-fg-3" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x={3} y={4} width={18} height={18} rx={2} />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {formatShort(value.start, dateLocale)} – {formatShort(value.end, dateLocale)}
        </span>
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 rounded-(--r-3) border border-border bg-bg p-4"
          style={{ boxShadow: "var(--shadow-2)", width: 300 }}
        >
          {presets.length > 0 && (
            <div className="mb-3 flex gap-1">
              {presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handlePreset(p)}
                  className="rounded-(--r-full) px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wide text-fg-2 hover:bg-bg-2 hover:text-ink"
                  style={{ transition: "all var(--motion-fast)" }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded-(--r-2) text-fg-3 hover:bg-bg-2 hover:text-ink">
              &lsaquo;
            </button>
            <span className="text-[13px] font-medium text-ink">{monthLabel}</span>
            <button type="button" onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-(--r-2) text-fg-3 hover:bg-bg-2 hover:text-ink">
              &rsaquo;
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0 text-center">
            {weekdayLabels.map((d) => (
              <div key={d} className="py-1 font-mono text-[10px] uppercase tracking-wide text-fg-4">
                {d}
              </div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = new Date(viewMonth.year, viewMonth.month, i + 1);
              const isStart = isSameDay(day, tempRange.start);
              const isEnd = isSameDay(day, tempRange.end);
              const inRange = isInRange(day, tempRange);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  className={`flex h-8 w-8 items-center justify-center rounded-(--r-2) text-[12.5px] transition-colors ${
                    isStart || isEnd
                      ? "bg-ink font-medium text-bg"
                      : inRange
                        ? "bg-bg-3 text-ink"
                        : isToday
                          ? "font-medium text-signal"
                          : "text-fg hover:bg-bg-2"
                  }`}
                  style={{ transitionDuration: "var(--motion-fast)", fontVariantNumeric: "tabular-nums" }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
