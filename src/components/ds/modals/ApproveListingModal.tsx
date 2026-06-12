"use client";

import { useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";

interface ApproveListingModalProps {
  open: boolean;
  onClose: () => void;
  listingName?: string;
}

export function ApproveListingModal({ open, onClose, listingName = "this listing" }: ApproveListingModalProps) {
  const [note, setNote] = useState("");

  const handleApprove = () => {
    toast.success(`${listingName} approved and published`);
    setNote("");
    onClose();
  };

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="Approve listing"
      description={`This will publish ${listingName} to the marketplace. The provider will be notified.`}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost-v2">
            Cancel
          </button>
          <button type="button" onClick={handleApprove} className="btn-signal-v2">
            Approve and publish
          </button>
        </>
      }
    >
      <div>
        <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
          Internal note (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any context for the team..."
          rows={3}
          className="w-full resize-none rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none"
        />
      </div>
    </ActionModal>
  );
}
