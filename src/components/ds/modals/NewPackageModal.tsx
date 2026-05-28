"use client";

import { useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";

interface NewPackageModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewPackageModal({ open, onClose }: NewPackageModalProps) {
  const [name, setName] = useState("");
  const [sessions, setSessions] = useState("10");
  const [price, setPrice] = useState("");
  const [validity, setValidity] = useState("30");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    toast.success(`Package "${name}" created`);
    setName("");
    setSessions("10");
    setPrice("");
    setValidity("30");
    setDescription("");
    onClose();
  };

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="New package"
      description="Create a session package that clients can purchase."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost-v2">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={!name.trim() || !price}
            className="btn-signal-v2 disabled:opacity-40"
          >
            Create package
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Package name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Starter bundle" className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Sessions</label>
            <input type="number" value={sessions} onChange={(e) => setSessions(e.target.value)} min={1} className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 font-mono text-[13.5px] text-ink focus:border-border-2 focus:outline-none" style={{ fontVariantNumeric: "tabular-nums" }} />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Price</label>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" min={0} step={0.01} className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 font-mono text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none" style={{ fontVariantNumeric: "tabular-nums" }} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Valid for (days)</label>
          <input type="number" value={validity} onChange={(e) => setValidity(e.target.value)} min={1} className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 font-mono text-[13.5px] text-ink focus:border-border-2 focus:outline-none" style={{ fontVariantNumeric: "tabular-nums" }} />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Description (optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's included in this package..." rows={2} className="w-full resize-none rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none" />
        </div>
      </div>
    </ActionModal>
  );
}
