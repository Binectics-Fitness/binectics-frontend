"use client";

import { useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { toast } from "@/components/Toast";

interface RejectListingModalProps {
  open: boolean;
  onClose: () => void;
  listingName?: string;
}

const REJECTION_REASONS = [
  "Incomplete profile information",
  "Photos do not meet quality standards",
  "Pricing not within acceptable range",
  "Missing required certifications",
  "Duplicate listing",
  "Violates terms of service",
];

export function RejectListingModal({ open, onClose, listingName = "this listing" }: RejectListingModalProps) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");

  const handleReject = () => {
    toast.success(`${listingName} rejected`);
    setReason("");
    setDetails("");
    onClose();
  };

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="Reject listing"
      description={`The provider will be notified with your reason. They can resubmit after making changes.`}
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost-v2">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReject}
            disabled={!reason}
            className="btn-primary-v2 disabled:opacity-40"
            style={{ background: "var(--danger)", borderColor: "var(--danger)" }}
          >
            Reject listing
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
            Reason
          </label>
          <div className="space-y-1.5">
            {REJECTION_REASONS.map((r) => (
              <label
                key={r}
                className={`flex cursor-pointer items-center gap-2.5 rounded-(--r-2) border px-3 py-2.5 text-[13.5px] transition-colors ${
                  reason === r ? "border-ink bg-bg-2 font-medium text-ink" : "border-border text-fg hover:border-border-2"
                }`}
                style={{ transitionDuration: "var(--motion-fast)" }}
              >
                <input
                  type="radio"
                  name="reject-reason"
                  value={r}
                  checked={reason === r}
                  onChange={(e) => setReason(e.target.value)}
                  className="accent-ink"
                />
                {r}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
            Additional details for the provider
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Help the provider understand what to change..."
            rows={3}
            className="w-full resize-none rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink placeholder:text-fg-4 focus:border-border-2 focus:outline-none"
          />
        </div>
      </div>
    </ActionModal>
  );
}
