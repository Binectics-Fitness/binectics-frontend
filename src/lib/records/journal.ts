import { NOTES_PER_DAY, type MemberNote, type NoteMood } from "@/lib/api/memberNotes";
import { dayDiffBetween, dayKeyOf, longDayLabel } from "@/lib/solo/glance";
import { SOLO_STORAGE_PREFIX } from "@/lib/solo/storage";
import { timeOfDay } from "@/lib/solo/fastingRules";

/*
 * The journal's words and rules, the same as mobile (src/utils/journal.ts,
 * src/constants/memberTextCopy.ts). Notes stay neutral: no colour, no emoji,
 * and nothing here says a note can be shared.
 */

export const JOURNAL_PRIVATE = "Only you can read your notes.";
export const JOURNAL_PLACEHOLDER = "How did today go?";
export const JOURNAL_EMPTY = "Nothing written yet";

/** The member's mood word, as they see it. Words only: no emoji, no colour meaning. */
export const MOOD_LABELS: Record<NoteMood, string> = { good: "Good", okay: "Okay", tired: "Tired", low: "Low" };

/** "Today", "Yesterday" or "Thursday 19 Nov": the heading above a day's entries. */
export function dayHeading(day: string, now: Date): string {
  const diff = dayDiffBetween(dayKeyOf(now), day);
  if (diff === 0) return "Today";
  if (diff === -1) return "Yesterday";
  return longDayLabel(day);
}

/** "Today, Friday 20 Nov": the composer's label. */
export function composerLabel(now: Date): string {
  return `Today, ${longDayLabel(dayKeyOf(now))}`;
}

/** "Thursday 19 Nov · 21:10 · Tired": the line above a saved note. */
export function noteMeta(note: Pick<MemberNote, "local_day" | "created_at" | "mood">, now: Date): string {
  const time = note.created_at ? timeOfDay(new Date(note.created_at).getTime()) : null;
  return [dayHeading(note.local_day, now), time, note.mood ? MOOD_LABELS[note.mood] : null].filter(Boolean).join(" · ");
}

/** How many of the loaded notes are for `day`. */
export function notesOnDay(notes: readonly Pick<MemberNote, "local_day">[], day: string): number {
  return notes.filter((n) => n.local_day === day).length;
}

/**
 * How many notes are left today, in plain words, or null while there is
 * plenty of room. The limit is stated before it bites, never as a countdown.
 */
export function dayLimitLine(written: number): string | null {
  if (written >= NOTES_PER_DAY) return "You have written 5 notes today, the most for one day. You can write more tomorrow.";
  if (written === NOTES_PER_DAY - 1) return "You can write 1 more note today.";
  return null;
}

/** "1,960 characters left" once the end is near, else null. */
export function charsLeftLine(length: number, max: number): string | null {
  const left = max - length;
  if (left > 200) return null;
  if (left <= 0) return "That is the longest a note can be.";
  return `${left} ${left === 1 ? "character" : "characters"} left`;
}

// ─── The unsaved draft ──────────────────────────────────────────────────

/**
 * A new note's unsaved words are kept in this browser until it is saved.
 * The key starts with `solo:`, so sign-out wipes it (clearSoloStorage), and it
 * is per account, so another member signing in on the same browser never
 * sees it. Reads and writes never throw: a blocked store just keeps nothing.
 */
export interface NoteDraft {
  body: string;
  mood: NoteMood | null;
}

export const draftKey = (userId: string): string => `${SOLO_STORAGE_PREFIX}journal-draft:${userId}`;

export function readDraft(userId: string): NoteDraft | null {
  if (!userId) return null;
  try {
    const raw = window.localStorage.getItem(draftKey(userId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const body = (parsed as { body?: unknown }).body;
    const mood = (parsed as { mood?: unknown }).mood;
    if (typeof body !== "string" || !body) return null;
    return { body, mood: typeof mood === "string" && mood in MOOD_LABELS ? (mood as NoteMood) : null };
  } catch {
    return null;
  }
}

export function writeDraft(userId: string, draft: NoteDraft | null): void {
  if (!userId) return;
  try {
    if (!draft || !draft.body) window.localStorage.removeItem(draftKey(userId));
    else window.localStorage.setItem(draftKey(userId), JSON.stringify(draft));
  } catch {
    /* nothing kept */
  }
}
