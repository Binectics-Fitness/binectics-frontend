"use client";

import { useState } from "react";
import { Drawer } from "@/components/ds/Drawer";
import { ActionModal } from "@/components/ds/ActionModal";
import type { EditFastInput, FastSession } from "@/lib/api/fasting";
import {
  DELETE_BODY,
  DELETE_CONFIRM,
  DELETE_KEEP,
  DELETE_TITLE,
  EDIT_RULES,
  EDIT_TITLE,
  NOTE_LABEL,
  NOTE_MAX,
} from "@/lib/solo/fastingCopy";
import {
  START_MAX_PAST_MS,
  fromLocalInput,
  startProblem,
  timesProblem,
  toLocalInput,
  toMs,
} from "@/lib/solo/fastingRules";
import { WriteError } from "./parts";
import styles from "./fasting.module.css";

/** The body of an edit: only what changed (ms precision lost to the minute inputs is ignored). Pure. */
export function editBody(fast: FastSession, startText: string, endText: string | null, note: string): EditFastInput {
  const body: EditFastInput = {};
  const s = fromLocalInput(startText);
  if (s !== null && toLocalInput(s) !== toLocalInput(toMs(fast.started_at))) body.started_at = new Date(s).toISOString();
  if (fast.ended_at && endText !== null) {
    const e = fromLocalInput(endText);
    if (e !== null && toLocalInput(e) !== toLocalInput(toMs(fast.ended_at))) body.ended_at = new Date(e).toISOString();
  }
  if (note.trim() !== (fast.note ?? "")) body.note = note.trim();
  return body;
}

/** Why the edited times would be refused, or null. For a running fast only the start is judged. */
export function editProblem(fast: FastSession, startText: string, endText: string | null, nowMs: number): string | null {
  const s = fromLocalInput(startText);
  if (!fast.ended_at) return startProblem(s, nowMs);
  const e = endText === null ? null : fromLocalInput(endText);
  if (s === null || e === null) return "Enter a start and an end date and time.";
  return timesProblem(s, e, nowMs);
}

/**
 * Edit this fast (design 06 drawer): start, end (a finished fast), a private
 * note, Save, Cancel and Delete (with a confirm). The API has the last word on
 * overlaps; its refusal is shown in plain words.
 */
export function FastEditDrawer({
  fast,
  nowMs,
  onClose,
  onSave,
  onDelete,
  saving,
  deleting,
  error,
}: {
  fast: FastSession | null;
  nowMs: number;
  onClose: () => void;
  onSave: (id: string, input: EditFastInput) => void;
  onDelete?: (id: string) => void;
  saving: boolean;
  deleting: boolean;
  error: string | null;
}) {
  return (
    <Drawer open={!!fast} onClose={onClose} title={EDIT_TITLE} width={440}>
      {fast && (
        <EditForm
          key={fast.id + fast.started_at + (fast.ended_at ?? "")}
          fast={fast}
          nowMs={nowMs}
          onClose={onClose}
          onSave={onSave}
          onDelete={onDelete}
          saving={saving}
          deleting={deleting}
          error={error}
        />
      )}
    </Drawer>
  );
}

function EditForm({
  fast,
  nowMs,
  onClose,
  onSave,
  onDelete,
  saving,
  deleting,
  error,
}: {
  fast: FastSession;
  nowMs: number;
  onClose: () => void;
  onSave: (id: string, input: EditFastInput) => void;
  onDelete?: (id: string) => void;
  saving: boolean;
  deleting: boolean;
  error: string | null;
}) {
  const [start, setStart] = useState(toLocalInput(toMs(fast.started_at)));
  const [end, setEnd] = useState<string | null>(fast.ended_at ? toLocalInput(toMs(fast.ended_at)) : null);
  const [note, setNote] = useState(fast.note ?? "");
  const [confirming, setConfirming] = useState(false);

  const problem = editProblem(fast, start, end, nowMs);
  const body = editBody(fast, start, end, note);
  const changed = Object.keys(body).length > 0;

  return (
    <form
      className="flex flex-col gap-4 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!problem && changed && !saving) onSave(fast.id, body);
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="edit-start" className={styles.label}>
          Started
        </label>
        <input
          id="edit-start"
          type="datetime-local"
          className={styles.field}
          value={start}
          min={fast.ended_at ? undefined : toLocalInput(nowMs - START_MAX_PAST_MS)}
          onChange={(e) => setStart(e.target.value)}
        />
      </div>
      {end !== null && (
        <div className="flex flex-col gap-1">
          <label htmlFor="edit-end" className={styles.label}>
            Ended
          </label>
          <input id="edit-end" type="datetime-local" className={styles.field} value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label htmlFor="edit-note" className={styles.label}>
          {NOTE_LABEL}
        </label>
        <textarea
          id="edit-note"
          className={styles.field}
          style={{ minHeight: 88, padding: 12 }}
          maxLength={NOTE_MAX}
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
        />
        <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>
          {note.length} of {NOTE_MAX}
        </span>
      </div>
      <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
        {EDIT_RULES}
      </p>
      {problem && (
        <p role="alert" className={styles.error} data-testid="edit-problem">
          {problem}
        </p>
      )}
      {error && <WriteError message={error} />}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary-v2" style={{ height: 44 }} disabled={!!problem || !changed || saving}>
          Save changes
        </button>
        <button type="button" className="btn-ghost-v2" style={{ height: 44 }} onClick={onClose}>
          Cancel
        </button>
      </div>
      {onDelete && fast.ended_at && (
        <button
          type="button"
          className="self-start text-[14px] underline underline-offset-2"
          style={{ color: "var(--danger-ink)", minHeight: 44 }}
          onClick={() => setConfirming(true)}
        >
          Delete this fast
        </button>
      )}
      <ActionModal
        open={confirming}
        onClose={() => setConfirming(false)}
        title={DELETE_TITLE}
        description={DELETE_BODY}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost-v2" style={{ height: 44 }} onClick={() => setConfirming(false)}>
              {DELETE_KEEP}
            </button>
            <button
              type="button"
              className="btn-primary-v2"
              style={{ height: 44 }}
              disabled={deleting}
              onClick={() => {
                setConfirming(false);
                onDelete?.(fast.id);
              }}
            >
              {DELETE_CONFIRM}
            </button>
          </div>
        }
      >
        {null}
      </ActionModal>
    </form>
  );
}
