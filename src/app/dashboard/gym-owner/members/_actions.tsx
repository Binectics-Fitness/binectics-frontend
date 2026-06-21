"use client";

import { useState } from "react";
import { InviteClientModal } from "@/components/ds/modals/InviteClientModal";

export function AddMemberButton({ onEnrolled }: { onEnrolled?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-primary-v2 sm" onClick={() => setOpen(true)}>+ Add member</button>
      <InviteClientModal open={open} onClose={() => setOpen(false)} onEnrolled={onEnrolled} />
    </>
  );
}
