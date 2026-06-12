"use client";

import { useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";

interface AddBankAccountModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddBankAccountModal({ open, onClose }: AddBankAccountModalProps) {
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [accountType, setAccountType] = useState<"checking" | "savings">("checking");

  const handleAdd = () => {
    toast.success("Bank account added");
    setBankName("");
    setAccountHolder("");
    setAccountNumber("");
    setRoutingNumber("");
    setAccountType("checking");
    onClose();
  };

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="Add bank account"
      description="Your payout account for receiving earnings. This information is encrypted and stored securely."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost-v2">Cancel</button>
          <button type="button" onClick={handleAdd} disabled={!bankName.trim() || !accountNumber.trim()} className="btn-signal-v2 disabled:opacity-40">Add account</button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Bank name</label>
          <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. First National Bank" className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Account holder name</label>
          <input type="text" value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="As it appears on the account" className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Account number</label>
            <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="••••••••" className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 font-mono text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Routing / branch code</label>
            <input type="text" value={routingNumber} onChange={(e) => setRoutingNumber(e.target.value)} placeholder="e.g. 250655" className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 font-mono text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none" />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">Account type</label>
          <div className="flex gap-2">
            {(["checking", "savings"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setAccountType(t)} className={`flex-1 rounded-(--r-2) border py-2 text-center text-[13px] font-medium capitalize transition-colors ${accountType === t ? "border-ink bg-bg-2 text-ink" : "border-border text-fg-3 hover:border-border-2"}`} style={{ transitionDuration: "var(--motion-fast)" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </ActionModal>
  );
}
