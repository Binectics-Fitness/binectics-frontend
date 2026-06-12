"use client";

import { useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";

interface BlockOffTimeModalProps {
  open: boolean;
  onClose: () => void;
}

export function BlockOffTimeModal({ open, onClose }: BlockOffTimeModalProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [allDay, setAllDay] = useState(false);
  const [reason, setReason] = useState("");

  const handleBlock = () => {
    toast.success("Time blocked off");
    setStartDate("");
    setEndDate("");
    setStartTime("09:00");
    setEndTime("17:00");
    setAllDay(false);
    setReason("");
    onClose();
  };

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="Block off time"
      description="Mark yourself as unavailable. Clients will not be able to book during this period."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost-v2">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBlock}
            disabled={!startDate}
            className="btn-primary-v2 disabled:opacity-40"
          >
            Block time
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
              Start date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
              End date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-[13.5px] text-ink">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="accent-ink"
          />
          All day
        </label>
        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
                Start time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
                End time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
              />
            </div>
          </div>
        )}
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
            Reason (optional)
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Holiday, Personal, Conference"
            className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none"
          />
        </div>
      </div>
    </ActionModal>
  );
}
