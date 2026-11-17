import type { FastingPresetKey, FastSession, FastStatus } from "@/lib/api/fasting";
import { FASTING_STAGES, type FastingStage } from "./fastingCopy";

/**
 * The fasting rules the web needs, as pure functions of ABSOLUTE timestamps.
 * The timer is never accumulated from ticks: every value is `now - started_at`
 * on the clock the caller passes in, so a sleeping tab, a throttled timer or
 * a changed clock cannot make it drift or run backwards.
 *
 * The limits mirror the API (binectics-api src/fasting/fasting.rules.ts).
 */

const MINUTE = 60_000;
export const HOUR_MS = 3_600_000;

export const MAX_TARGET_HOURS = 24;
/** A fast may run this long (24 hours plus 15 minutes of grace). */
export const MAX_ELAPSED_MS = 24 * HOUR_MS + 15 * MINUTE;
/** A fast may be started this far back ("Started earlier?"). */
export const START_MAX_PAST_MS = 36 * HOUR_MS;
/** "End" can be undone on the server for this long. */
export const UNDO_WINDOW_MS = 10 * MINUTE;
/** Allowed clock drift between this browser and the server. */
export const CLOCK_SKEW_MS = 5 * MINUTE;
export const MAX_NOTE_LENGTH = 200;

// ─── Presets ────────────────────────────────────────────────────────────────

export interface PresetOption {
  key: FastingPresetKey;
  label: string;
  /** Fixed length in hours; null for a free-form preset. */
  hours: number | null;
}

/**
 * "One meal a day" is a free-form preset on the API; the web proposes 23 hours
 * (one hour to eat), the same assumption as the phone app. The member can
 * still end earlier or edit.
 */
export const ONE_MEAL_HOURS = 23;
export const PRESET_OPTIONS: readonly PresetOption[] = [
  { key: "12_12", label: "12 h", hours: 12 },
  { key: "14_10", label: "14 h", hours: 14 },
  { key: "16_8", label: "16 h", hours: 16 },
  { key: "18_6", label: "18 h", hours: 18 },
  { key: "20_4", label: "20 h", hours: 20 },
  { key: "one_meal", label: "One meal a day", hours: ONE_MEAL_HOURS },
  { key: "custom", label: "Custom", hours: null },
];
export const DEFAULT_PRESET: FastingPresetKey = "16_8";

export function presetHours(key: string): number | null {
  return PRESET_OPTIONS.find((p) => p.key === key)?.hours ?? null;
}

/** 16 -> "16", 16.5 -> "16.5". */
export function formatHours(hours: number): string {
  return Number.isInteger(hours) ? String(hours) : String(Math.round(hours * 10) / 10);
}

/** "16 hour fast", "One meal a day". */
export function presetTitle(preset: string, targetHours: number): string {
  if (preset === "one_meal") return "One meal a day";
  return `${formatHours(targetHours)} hour fast`;
}

export type CustomHours = { ok: true; hours: number } | { ok: false; message: string };

/**
 * A custom length typed by the member: 1 to 24 hours, halves allowed. More
 * than 24 gets a plain message, never a silent clamp: the cap is a safety
 * limit the member should know about.
 */
export function parseCustomHours(text: string): CustomHours {
  const t = text.trim().replace(",", ".");
  if (!t) return { ok: false, message: "Enter how many hours, from 1 to 24." };
  if (!/^\d+(\.[05])?$/.test(t)) return { ok: false, message: "Use whole or half hours, like 18 or 18.5." };
  const n = Number(t);
  if (n > MAX_TARGET_HOURS) return { ok: false, message: "Fasts can be up to 24 hours. Pick 24 or fewer." };
  if (n < 1) return { ok: false, message: "A fast needs to be at least 1 hour." };
  return { ok: true, hours: n };
}

/** "16 hours fasting, 8 hours to eat." */
export function presetHint(hours: number): string {
  const eat = 24 - hours;
  return eat > 0 ? `${formatHours(hours)} hours fasting, ${formatHours(eat)} hours to eat.` : "24 hours fasting.";
}

// ─── Timer math ─────────────────────────────────────────────────────────────

export const toMs = (iso: string): number => new Date(iso).getTime();

/** Milliseconds since the start. Never negative (a start a few minutes ahead of the clock reads 0). */
export function elapsedMs(startedAt: string | number, nowMs: number): number {
  const start = typeof startedAt === "number" ? startedAt : toMs(startedAt);
  return Math.max(0, nowMs - start);
}

/** 0 at the start, 1 at the chosen length (and after). */
export function fastProgress(elapsed: number, targetHours: number): number {
  if (targetHours <= 0) return 1;
  return Math.min(1, Math.max(0, elapsed / (targetHours * HOUR_MS)));
}

/** Milliseconds to the chosen length; 0 once reached. */
export function remainingMs(elapsed: number, targetHours: number): number {
  return Math.max(0, targetHours * HOUR_MS - elapsed);
}

/** The status the browser can work out for itself, with no network. */
export function localStatus(f: { started_at: string; ended_at: string | null }, nowMs: number): FastStatus {
  if (f.ended_at) return "ended";
  return nowMs - toMs(f.started_at) > MAX_ELAPSED_MS ? "expired_unclosed" : "running";
}

const pad = (n: number) => String(n).padStart(2, "0");

/** The big numerals: elapsed time as "10:42" (hours:minutes), floored to the minute. */
export function clockText(elapsed: number): string {
  const totalMin = Math.floor(elapsed / MINUTE);
  return `${Math.floor(totalMin / 60)}:${pad(totalMin % 60)}`;
}

/** "16 h 04 min", "45 min": the way a duration reads in a sentence. */
export function durationText(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / MINUTE));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min`;
  return `${h} h ${pad(m)} min`;
}

/** Spoken form for a screen reader: "5 hours 18 minutes". */
export function spokenDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / MINUTE));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} ${h === 1 ? "hour" : "hours"}`);
  if (m > 0 || h === 0) parts.push(`${m} ${m === 1 ? "minute" : "minutes"}`);
  return parts.join(" ");
}

// ─── Clock and date text (the browser's locale, so 12 or 24 hour as it says) ─

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function timeOfDay(ms: number): string {
  return new Date(ms).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Calendar-day difference (local), DST-safe: counts days, not 24 hour blocks. */
export function dayDiff(ms: number, nowMs: number): number {
  const a = new Date(ms);
  const b = new Date(nowMs);
  const da = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  const db = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((da - db) / 86_400_000);
}

/** "Today", "Tomorrow", "Yesterday" or "Thu 19 Nov", relative to `nowMs`. */
export function relativeDay(ms: number, nowMs: number): string {
  const diff = dayDiff(ms, nowMs);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  const d = new Date(ms);
  return `${DAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Thu 19 Nov, 8:30 PM". */
export function stamp(ms: number): string {
  const d = new Date(ms);
  return `${DAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MONTHS[d.getMonth()]}, ${timeOfDay(ms)}`;
}

/** "Fri 12:34" for an end on the next day, the full stamp otherwise, the time alone on the same day. */
export function endStamp(startMs: number, endMs: number): string {
  const diff = dayDiff(endMs, startMs);
  if (diff === 0) return timeOfDay(endMs);
  if (diff === 1) return `${DAYS[new Date(endMs).getDay()].slice(0, 3)} ${timeOfDay(endMs)}`;
  return stamp(endMs);
}

/** The value of a datetime-local input for an instant, in the browser's zone. */
export function toLocalInput(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** The instant a datetime-local value means, or null when it is empty or invalid. */
export function fromLocalInput(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/** Whether `ms` can be a start time right now (not ahead of the clock, not over 36 hours back). */
export function startAllowed(ms: number, nowMs: number): boolean {
  return ms <= nowMs + CLOCK_SKEW_MS && nowMs - ms <= START_MAX_PAST_MS;
}

/** The plain sentence for a start time that is not allowed, or null. */
export function startProblem(ms: number | null, nowMs: number): string | null {
  if (ms === null) return "Enter a start date and time.";
  if (ms > nowMs + CLOCK_SKEW_MS) return "A fast cannot start in the future.";
  if (nowMs - ms > START_MAX_PAST_MS) return "A fast can start at most 36 hours ago.";
  return null;
}

/** Why a pair of edited times would be refused, or null. Mirrors the API's checks. */
export function timesProblem(startMs: number, endMs: number, nowMs: number): string | null {
  if (endMs <= startMs) return "The end must be after the start.";
  if (endMs - startMs > MAX_ELAPSED_MS) return "A fast can last at most 24 hours.";
  if (startMs > nowMs + CLOCK_SKEW_MS) return "A fast cannot start in the future.";
  if (endMs > nowMs + CLOCK_SKEW_MS) return "A fast cannot end in the future.";
  return null;
}

// ─── Stages ─────────────────────────────────────────────────────────────────

/** The stage a fast is in, by elapsed hours (stage windows are [from, to)). */
export function stageIndexAt(elapsed: number): number {
  const hours = elapsed / HOUR_MS;
  const idx = FASTING_STAGES.findIndex((s) => hours >= s.fromHours && hours < s.toHours);
  return idx === -1 ? FASTING_STAGES.length - 1 : idx;
}

export function stageAt(elapsed: number): FastingStage {
  return FASTING_STAGES[stageIndexAt(elapsed)];
}

// ─── How a finished fast reads ──────────────────────────────────────────────

/** Length reached or ended early, from the REAL times (an edit counts by what it now says). */
export function resultOf(f: Pick<FastSession, "started_at" | "ended_at" | "target_hours">): "reached" | "early" {
  if (!f.ended_at) return "early";
  return toMs(f.ended_at) - toMs(f.started_at) >= f.target_hours * HOUR_MS ? "reached" : "early";
}

/** How far before the chosen length a fast ended ("1 h 02 min"), or null when it reached it. */
export function shortBy(f: Pick<FastSession, "started_at" | "ended_at" | "target_hours">): string | null {
  if (!f.ended_at) return null;
  const left = f.target_hours * HOUR_MS - (toMs(f.ended_at) - toMs(f.started_at));
  return left > 0 ? durationText(left) : null;
}

/** Whether the Undo is still on offer at `nowMs` (the server's own window is the truth). */
export function canUndo(f: Pick<FastSession, "undo_until">, nowMs: number): boolean {
  return !!f.undo_until && toMs(f.undo_until) > nowMs;
}

// ─── The dawn surface: colour blend, contrast, arc geometry ─────────────────
// Owner-approved gradient (17 Nov 2026), the running fast hero ONLY. A
// vertical blend of EXISTING colours: night ink -> ink-2, morning FFEBD2
// (trainer soft) -> F5F3EF (bone). The values are the theme tokens' own hex;
// tests pin them to globals.css.

export type Rgb = [number, number, number];
export const hexToRgb = (hex: string): Rgb => {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};
const pad2 = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
export const rgbToHex = (c: Rgb): string => `#${c.map((v) => pad2(Math.round(v))).join("")}`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix = (a: string, b: string, t: number): string => {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex([lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)]);
};

/** WCAG relative luminance and contrast ratio. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export const DAWN_COLORS = {
  nightTop: "#0B0906", // --ink
  nightBottom: "#302D29", // --ink-2
  dayTop: "#FFEBD2", // trainer soft
  dayBottom: "#F5F3EF", // bone (--bg-2)
  /** Text on the night half: paper (--bg). */
  lightText: "#FCFAF6",
  /** Text on the morning half: ink (--ink). */
  darkText: "#0B0906",
} as const;

/** The least contrast hero text must have (WCAG AA for normal text). */
export const DAWN_MIN_CONTRAST = 4.5;
/** Large numerals and the arc's progress stroke (WCAG AA for large text and graphics). */
export const DAWN_MIN_LARGE_CONTRAST = 3;

/** Where text may sit down the surface: top, three quarters of the way, bottom. */
export const DAWN_SAMPLE_POINTS = [0, 0.25, 0.5, 0.75, 1] as const;

/** Light text is used up to this blend of the surface, dark text from `DARK_FROM`. */
export const LIGHT_UP_TO = 0.32;
export const DARK_FROM = 0.52;

/**
 * How far the night -> morning blend has gone for a fast `progress` (0..1)
 * into its chosen length.
 *
 * Why it is not a plain ramp (measured, see the PR): with a plain linear
 * blend and a text flip at 50 percent, the surface at the flip is a mid grey
 * on which paper text has 3.05:1 and ink text 4.73:1, so a plain ramp fails
 * 4.5:1 for light text from about 36 percent. Text must keep 4.5:1 everywhere
 * it sits, so the blend crosses the unreadable middle band in one small step
 * AT the flip (LIGHT_UP_TO -> DARK_FROM, a few shades of warm grey) instead of
 * lingering in it. Each half is a plain linear run, so both halves still move
 * smoothly from night towards morning.
 */
export function blendAmount(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  return p < 0.5 ? LIGHT_UP_TO * (p / 0.5) : DARK_FROM + (1 - DARK_FROM) * ((p - 0.5) / 0.5);
}

export interface DawnPalette {
  top: string;
  bottom: string;
  /** Which text family reads on this surface. */
  tone: "light" | "dark";
  /** Primary text colour for the tone. */
  text: string;
}

/** The flip is at the halfway point of the fast (design: "text switches at half way"). */
export function dawnPalette(progress: number): DawnPalette {
  const amount = blendAmount(progress);
  const light = progress < 0.5;
  return {
    top: mix(DAWN_COLORS.nightTop, DAWN_COLORS.dayTop, amount),
    bottom: mix(DAWN_COLORS.nightBottom, DAWN_COLORS.dayBottom, amount),
    tone: light ? "light" : "dark",
    text: light ? DAWN_COLORS.lightText : DAWN_COLORS.darkText,
  };
}

/** The least contrast of the palette's text against the surface anywhere text may sit. */
export function worstContrast(pal: DawnPalette, text: string = pal.text): number {
  return Math.min(...DAWN_SAMPLE_POINTS.map((f) => contrastRatio(text, mix(pal.top, pal.bottom, f))));
}

/** The CSS gradient for a palette (design: top at 0 percent, bottom from 70 percent). */
export function dawnGradient(pal: DawnPalette): string {
  return `linear-gradient(${pal.top} 0%, ${pal.bottom} 70%)`;
}

/** The half-arc (design 05): viewBox 390x230, centre (195, 200), radius 165, left end to right end. */
export const ARC = { cx: 195, cy: 200, r: 165, stroke: 16, width: 390, height: 230 } as const;
export const ARC_PATH = `M${ARC.cx - ARC.r} ${ARC.cy} A${ARC.r} ${ARC.r} 0 0 1 ${ARC.cx + ARC.r} ${ARC.cy}`;
export const ARC_LENGTH = Math.PI * ARC.r;

/** Where the marker sits for a progress: exactly on the end of the drawn arc. */
export function arcPoint(progress: number): { x: number; y: number } {
  const p = Math.min(1, Math.max(0, progress));
  const theta = Math.PI * p;
  return { x: ARC.cx - ARC.r * Math.cos(theta), y: ARC.cy - ARC.r * Math.sin(theta) };
}
