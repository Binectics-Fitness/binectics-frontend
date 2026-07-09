"use client";

import { useState } from "react";
import type { GymClass, CreateGymClassRequest } from "@/lib/api/classes";

const INPUT_STYLE = {
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
  background: "var(--bg)",
  fontFamily: "inherit",
} as const;
const INPUT_CLASS = "h-9 rounded-(--r-2) px-3 text-[13.5px]";
const LABEL_CLASS = "font-mono text-[10.5px] uppercase tracking-[0.06em]";

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface ClassFormProps {
  initial?: GymClass;
  saving: boolean;
  error?: string | null;
  onSubmit: (data: CreateGymClassRequest) => void;
  onCancel?: () => void;
  submitLabel?: string;
}

/** Shared create/edit form for a weekly class. */
export function ClassForm({ initial, saving, error, onSubmit, onCancel, submitLabel = "Save class" }: ClassFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [instructor, setInstructor] = useState(initial?.instructor_name ?? "");
  const [day, setDay] = useState(initial?.day_of_week ?? 1);
  const [time, setTime] = useState(initial?.start_time ?? "06:30");
  const [duration, setDuration] = useState(initial?.duration_minutes ?? 60);
  const [capacity, setCapacity] = useState(initial?.capacity ?? 16);
  const [waitlist, setWaitlist] = useState(initial?.waitlist_enabled ?? true);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = () => {
    if (!name.trim()) return setLocalError("Give the class a name.");
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return setLocalError("Start time must be HH:mm (24-hour).");
    setLocalError(null);
    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      instructor_name: instructor.trim() || undefined,
      day_of_week: day,
      start_time: time,
      duration_minutes: Math.min(240, Math.max(15, duration)),
      capacity: Math.min(500, Math.max(1, capacity)),
      waitlist_enabled: waitlist,
    });
  };

  return (
    <div className="flex flex-col gap-3.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Class name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} className={INPUT_CLASS} style={INPUT_STYLE} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Instructor</span>
          <input value={instructor} onChange={(e) => setInstructor(e.target.value)} maxLength={100} placeholder="optional" className={INPUT_CLASS} style={INPUT_STYLE} />
        </label>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Day</span>
          <select value={day} onChange={(e) => setDay(Number(e.target.value))} className={INPUT_CLASS} style={INPUT_STYLE}>
            {WEEKDAYS.map((d, i) => (
              <option key={d} value={i}>{d}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Start (24h)</span>
          <input value={time} onChange={(e) => setTime(e.target.value)} placeholder="06:30" className={INPUT_CLASS} style={INPUT_STYLE} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Minutes</span>
          <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value) || 60)} className={INPUT_CLASS} style={INPUT_STYLE} />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Capacity</span>
          <input type="number" value={capacity} onChange={(e) => setCapacity(Number(e.target.value) || 1)} className={INPUT_CLASS} style={INPUT_STYLE} />
        </label>
      </div>
      <label className="flex flex-col gap-1.5">
        <span className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>Description</span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} placeholder="optional"
          className="rounded-(--r-2) px-3 py-2.5 text-[13.5px] resize-y" style={{ ...INPUT_STYLE, minHeight: 60 }} />
      </label>
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input type="checkbox" checked={waitlist} onChange={(e) => setWaitlist(e.target.checked)} />
        <span className="text-[13px]" style={{ color: "var(--ink)" }}>Waitlist when full</span>
      </label>
      {(localError || error) && (
        <p className="text-[12.5px]" style={{ color: "var(--danger, #b00020)" }}>{localError || error}</p>
      )}
      <div className="flex gap-2">
        <button className="btn-primary-v2 sm" disabled={saving} onClick={submit}>
          {saving ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button className="btn-ghost-v2 sm" disabled={saving} onClick={onCancel}>Cancel</button>
        )}
      </div>
    </div>
  );
}
