"use client";

import { useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";

interface BookSessionModalProps {
  open: boolean;
  onClose: () => void;
}

const SESSION_TYPES = ["1-on-1 training", "Group class", "Online session", "Assessment"];
const TIME_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

export function BookSessionModal({ open, onClose }: BookSessionModalProps) {
  const [type, setType] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");

  const handleBook = () => {
    toast.success("Session booked");
    setType("");
    setDate("");
    setTime("");
    setNotes("");
    onClose();
  };

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="Book a session"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost-v2">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBook}
            disabled={!type || !date || !time}
            className="btn-signal-v2 disabled:opacity-40"
          >
            Confirm booking
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
            Session type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SESSION_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-(--r-2) border px-3 py-2 text-left text-[13px] transition-colors ${
                  type === t ? "border-ink bg-bg-2 font-medium text-ink" : "border-border text-fg hover:border-border-2"
                }`}
                style={{ transitionDuration: "var(--motion-fast)" }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
          />
        </div>
        {date && (
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
              Available times
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTime(t)}
                  className={`rounded-(--r-full) px-3 py-1.5 font-mono text-[12.5px] transition-colors ${
                    time === t ? "bg-ink text-bg" : "bg-bg-2 text-fg-2 hover:bg-bg-3 hover:text-ink"
                  }`}
                  style={{ transitionDuration: "var(--motion-fast)", fontVariantNumeric: "tabular-nums" }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any specific goals or injuries to mention..."
            rows={2}
            className="w-full resize-none rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none"
          />
        </div>
      </div>
    </ActionModal>
  );
}
