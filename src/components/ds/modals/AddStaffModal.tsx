"use client";

import { useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";

interface AddStaffModalProps {
  open: boolean;
  onClose: () => void;
}

const ROLES = ["Manager", "Front desk", "Trainer", "Cleaner", "Maintenance"];

export function AddStaffModal({ open, onClose }: AddStaffModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");

  const handleAdd = () => {
    toast.success(`Invitation sent to ${email}`);
    setName("");
    setEmail("");
    setRole("");
    onClose();
  };

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="Add staff member"
      description="They will receive an email invitation to join your team."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost-v2">Cancel</button>
          <button type="button" onClick={handleAdd} disabled={!name.trim() || !email.trim() || !role} className="btn-signal-v2 disabled:opacity-40">Send invite</button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Full name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@gym.com" className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Role</label>
          <div className="flex flex-wrap gap-1.5">
            {ROLES.map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)} className={`rounded-(--r-full) px-3 py-1.5 text-[12.5px] font-medium transition-colors ${role === r ? "bg-ink text-bg" : "bg-bg-2 text-fg-2 hover:bg-bg-3 hover:text-ink"}`} style={{ transitionDuration: "var(--motion-fast)" }}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ActionModal>
  );
}
