"use client";

import { useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";

interface NewPlanModalProps {
  open: boolean;
  onClose: () => void;
}

const PLAN_TYPES = [
  { value: "membership", label: "Membership plan", description: "Recurring gym membership with tiers" },
  { value: "training", label: "Training program", description: "Multi-week strength or conditioning plan" },
  { value: "meal", label: "Meal plan", description: "Dietitian-built nutrition protocol" },
];

export function NewPlanModal({ open, onClose }: NewPlanModalProps) {
  const [selected, setSelected] = useState("");
  const [name, setName] = useState("");

  const handleCreate = () => {
    toast.success(`${PLAN_TYPES.find((t) => t.value === selected)?.label} "${name}" created`);
    setSelected("");
    setName("");
    onClose();
  };

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="New plan"
      description="Choose the type of plan you want to create."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost-v2">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!selected || !name.trim()}
            className="btn-signal-v2 disabled:opacity-40"
          >
            Create plan
          </button>
        </>
      }
    >
      <div className="space-y-3">
        {PLAN_TYPES.map((type) => (
          <label
            key={type.value}
            className={`flex cursor-pointer items-start gap-3 rounded-(--r-2) border p-3 transition-colors ${
              selected === type.value ? "border-ink bg-bg-2" : "border-border hover:border-border-2"
            }`}
            style={{ transitionDuration: "var(--motion-fast)" }}
          >
            <input
              type="radio"
              name="plan-type"
              value={type.value}
              checked={selected === type.value}
              onChange={(e) => setSelected(e.target.value)}
              className="mt-0.5 accent-ink"
            />
            <div>
              <span className="text-[13.5px] font-medium text-ink">{type.label}</span>
              <p className="mt-0.5 text-[12.5px] text-fg-3">{type.description}</p>
            </div>
          </label>
        ))}
        {selected && (
          <div className="pt-2">
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
              Plan name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Gold membership"
              className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none"
            />
          </div>
        )}
      </div>
    </ActionModal>
  );
}
