"use client";

import { useState } from "react";
import { ApproveListingModal } from "@/components/ds/modals/ApproveListingModal";
import { RejectListingModal } from "@/components/ds/modals/RejectListingModal";

export function ApproveButton({ listingName }: { listingName?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-primary-v2"
        style={{ background: "var(--signal)", borderColor: "var(--signal)", color: "oklch(0.18 0.05 148)" }}
      >
        Approve
      </button>
      <ApproveListingModal open={open} onClose={() => setOpen(false)} listingName={listingName} />
    </>
  );
}

export function RejectButton({ listingName }: { listingName?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost-v2 no-underline">
        Reject
      </button>
      <RejectListingModal open={open} onClose={() => setOpen(false)} listingName={listingName} />
    </>
  );
}
