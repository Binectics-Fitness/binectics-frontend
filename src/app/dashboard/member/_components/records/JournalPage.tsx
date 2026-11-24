"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { StickyNote } from "lucide-react";
import { ChipGroup, DSCard, Eyebrow, IconTile, PageHeader } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { useOnline } from "@/hooks/useOnline";
import { NOTE_MAX_CHARS, NOTE_MOODS, NOTES_PER_DAY, type MemberNote, type NoteMood } from "@/lib/api/memberNotes";
import { useCreateNote, useDeleteNote, useNotes, useUpdateNote } from "@/lib/queries/ownRecords";
import {
  JOURNAL_EMPTY,
  JOURNAL_PLACEHOLDER,
  JOURNAL_PRIVATE,
  MOOD_LABELS,
  charsLeftLine,
  composerLabel,
  dayHeading,
  dayLimitLine,
  notesOnDay,
  readDraft,
  writeDraft,
} from "@/lib/records/journal";
import { dayKeyOf } from "@/lib/solo/glance";
import { timeOfDay } from "@/lib/solo/fastingRules";
import { newOpId } from "@/lib/solo/time";
import { useClientNow } from "@/lib/ui/useClientNow";
import { ConfirmDelete, LoadError, SkeletonRows } from "./parts";
import { RecordsTabs } from "./RecordsTabs";
import styles from "./records.module.css";

const OFFLINE_NOTE = "You are offline. Your words stay in this browser. Save when you are back online.";

const MOOD_OPTIONS = NOTE_MOODS.map((m) => ({ value: m, label: MOOD_LABELS[m] }));

/** The text box, the four optional mood words and the characters-left line. */
function NoteFields({
  body,
  mood,
  onBody,
  onMood,
  label,
  disabled,
}: {
  body: string;
  mood: NoteMood | null;
  onBody: (v: string) => void;
  onMood: (m: NoteMood | null) => void;
  label: string;
  disabled?: boolean;
}) {
  const id = useId();
  const left = charsLeftLine(body.length, NOTE_MAX_CHARS);
  return (
    <>
      <textarea
        id={id}
        className={styles.area}
        value={body}
        onChange={(e) => onBody(e.target.value)}
        placeholder={JOURNAL_PLACEHOLDER}
        aria-label={label}
        maxLength={NOTE_MAX_CHARS}
        disabled={disabled}
        data-testid="note-input"
      />
      {left && (
        <p className={styles.small} aria-live="polite" data-testid="note-count">
          {left}
        </p>
      )}
      {/* Mood is not a category: the ink pill. Choosing the chosen one clears it. */}
      <ChipGroup
        label="How you feel, optional"
        options={MOOD_OPTIONS}
        value={mood}
        disabled={disabled}
        onChange={(m) => onMood(m === mood ? null : m)}
      />
    </>
  );
}

/** Today's composer. The unsaved words are kept in this browser until saved. */
function Composer({ writtenToday, now }: { writtenToday: number; now: Date }) {
  const { user } = useAuth();
  const uid = user?.id ?? "";
  const online = useOnline();
  const create = useCreateNote();
  const [body, setBody] = useState("");
  const [mood, setMood] = useState<NoteMood | null>(null);
  const [error, setError] = useState<string | null>(null);
  // One id per note being written: a double click or a retry adds nothing twice.
  const opId = useRef<string | null>(null);
  const seeded = useRef<string | null>(null);

  // Start from the draft this browser kept, once per account.
  useEffect(() => {
    if (!uid || seeded.current === uid) return;
    seeded.current = uid;
    const draft = readDraft(uid);
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding from storage once the account is known
      setBody(draft.body);
      setMood(draft.mood);
    }
  }, [uid]);

  const keep = (next: { body: string; mood: NoteMood | null }) => writeDraft(uid, next.body ? next : null);

  const trimmed = body.trim();
  const atLimit = writtenToday >= NOTES_PER_DAY;
  const limitLine = dayLimitLine(writtenToday);
  const canSave = trimmed.length > 0 && !atLimit && !create.isPending;

  const save = async () => {
    if (!canSave) return;
    setError(null);
    if (!online) {
      setError(OFFLINE_NOTE);
      return;
    }
    opId.current ??= newOpId();
    try {
      await create.mutateAsync({ body: trimmed, ...(mood ? { mood } : {}), client_op_id: opId.current });
      opId.current = null;
      setBody("");
      setMood(null);
      writeDraft(uid, null);
      toast("Note saved", "success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The note could not be saved. Try again.");
    }
  };

  return (
    <DSCard className="p-4 sm:p-5">
      <form
        className={styles.stack}
        data-testid="journal-composer"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <h2 className={styles.label}>{composerLabel(now)}</h2>
        <NoteFields
          label="Write a note"
          body={body}
          mood={mood}
          onBody={(v) => {
            setBody(v);
            opId.current = null;
            keep({ body: v, mood });
          }}
          onMood={(m) => {
            setMood(m);
            opId.current = null;
            keep({ body, mood: m });
          }}
        />
        {limitLine && (
          <p className={styles.sub} role={atLimit ? "alert" : undefined} data-testid="note-limit">
            {limitLine}
          </p>
        )}
        {error && (
          <p className={styles.error} role="alert" data-testid="note-error">
            {error}
          </p>
        )}
        <div>
          <button type="submit" className={`btn-primary-v2 ${styles.btn}`} disabled={!canSave} aria-busy={create.isPending}>
            {create.isPending ? "Saving" : "Save note"}
          </button>
        </div>
      </form>
    </DSCard>
  );
}

/** One saved note: read, or changed in place. Delete asks first. */
function NoteCard({ note }: { note: MemberNote }) {
  const update = useUpdateNote();
  const del = useDeleteNote();
  const online = useOnline();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(note.body);
  const [mood, setMood] = useState<NoteMood | null>(note.mood);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const time = note.created_at ? timeOfDay(new Date(note.created_at).getTime()) : null;
  const meta = [time, note.mood ? MOOD_LABELS[note.mood] : null].filter(Boolean).join(" · ");

  const startEdit = () => {
    setBody(note.body);
    setMood(note.mood);
    setError(null);
    setEditing(true);
  };

  const saveEdit = async () => {
    const trimmed = body.trim();
    if (!trimmed) return;
    setError(null);
    if (!online) return setError("You are offline. Your changes are still here. Save when you are back online.");
    try {
      await update.mutateAsync({ id: note.id, input: { body: trimmed, mood } });
      setEditing(false);
      toast("Note changed", "success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "The note could not be changed. Try again.");
    }
  };

  const remove = async () => {
    setError(null);
    try {
      await del.mutateAsync(note.id);
      setConfirm(false);
      toast("Note deleted", "success");
    } catch (e) {
      setConfirm(false);
      setError(e instanceof Error ? e.message : "The note could not be deleted. Try again.");
    }
  };

  return (
    <li style={{ listStyle: "none" }} data-testid={`note-${note.id}`}>
      <DSCard className={styles.note}>
        {meta && <p className={styles.noteMeta}>{meta}</p>}
        {editing ? (
          <form
            className={styles.stack}
            onSubmit={(e) => {
              e.preventDefault();
              void saveEdit();
            }}
          >
            <NoteFields label="Edit your note" body={body} mood={mood} onBody={setBody} onMood={setMood} disabled={update.isPending} />
            <div className={styles.actions}>
              <button type="submit" className={`btn-primary-v2 ${styles.btn}`} disabled={!body.trim() || update.isPending} aria-busy={update.isPending}>
                {update.isPending ? "Saving" : "Save changes"}
              </button>
              <button type="button" className={`btn-ghost-v2 ${styles.btn}`} onClick={() => setEditing(false)} disabled={update.isPending}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className={styles.noteBody}>{note.body}</p>
            <div className={styles.actions}>
              <button type="button" className={`btn-ghost-v2 ${styles.btn}`} onClick={startEdit} aria-label={`Edit the note from ${meta || note.local_day}`}>
                Edit
              </button>
              <button
                type="button"
                className={`btn-ghost-v2 ${styles.dangerBtn}`}
                onClick={() => {
                  setError(null);
                  setConfirm(true);
                }}
                aria-label={`Delete the note from ${meta || note.local_day}`}
              >
                Delete
              </button>
            </div>
          </>
        )}
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </DSCard>
      <ConfirmDelete
        open={confirm}
        title="Delete this note?"
        body="It will be gone for good."
        busy={del.isPending}
        onKeep={() => setConfirm(false)}
        onDelete={() => void remove()}
      />
    </li>
  );
}

/**
 * Journal: the member's private notes, newest first under day headings, with
 * today's composer on top. Limits (5 a day, 1000 in all) are said only when
 * they matter. Mirrors binectics-mobile JournalView.
 */
export function JournalPage() {
  const now = useClientNow();
  const online = useOnline();
  const notes = useNotes();
  const items = useMemo(() => notes.data?.pages.flatMap((p) => p.items) ?? [], [notes.data]);
  const today = now ? dayKeyOf(now) : null;
  const writtenToday = today ? notesOnDay(items, today) : 0;
  const days = useMemo(() => {
    const out: { day: string; notes: MemberNote[] }[] = [];
    for (const n of items) {
      const last = out[out.length - 1];
      if (last && last.day === n.local_day) last.notes.push(n);
      else out.push({ day: n.local_day, notes: [n] });
    }
    return out;
  }, [items]);
  const failed = notes.isError && items.length === 0;

  return (
    <div className={styles.page}>
      <PageHeader eyebrow="Log" title="Journal" subtitle={JOURNAL_PRIVATE} />
      <RecordsTabs current="journal" />
      {!online && (
        <div role="status" className="rounded-(--r-2) p-3 text-[14px]" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
          {OFFLINE_NOTE}
        </div>
      )}

      {failed ? (
        <LoadError title="We could not load your notes" onRetry={() => void notes.refetch()} testId="journal-error" />
      ) : (
        <>
          {now && <Composer writtenToday={writtenToday} now={now} />}
          {notes.isLoading || !now ? (
            <SkeletonRows count={2} height={88} label="Loading your notes" />
          ) : items.length === 0 ? (
            <div className={`${styles.empty} ${styles.rise}`} data-testid="journal-empty">
              <IconTile icon={StickyNote} size="lg" />
              <h2 className={styles.emptyTitle}>{JOURNAL_EMPTY}</h2>
            </div>
          ) : (
            <section aria-label="Your notes" className={styles.stack}>
              {days.map((d) => (
                <div key={d.day} className={styles.stack}>
                  <Eyebrow as="h2" className={styles.day}>
                    {dayHeading(d.day, now)}
                  </Eyebrow>
                  <ul className={styles.list}>
                    {d.notes.map((n) => (
                      <NoteCard key={`${n.id}:${n.updated_at ?? ""}`} note={n} />
                    ))}
                  </ul>
                </div>
              ))}
              {notes.hasNextPage && (
                <div>
                  <button
                    type="button"
                    className={`btn-ghost-v2 ${styles.btn}`}
                    onClick={() => void notes.fetchNextPage()}
                    disabled={notes.isFetchingNextPage}
                    aria-busy={notes.isFetchingNextPage}
                  >
                    {notes.isFetchingNextPage ? "Loading" : "Show older notes"}
                  </button>
                </div>
              )}
              {notes.isFetchNextPageError && <p className={styles.small}>Could not load more. Check your connection.</p>}
            </section>
          )}
        </>
      )}
    </div>
  );
}
