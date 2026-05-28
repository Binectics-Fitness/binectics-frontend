"use client";

import { useState } from "react";
import { NewPlanModal } from "@/components/ds/modals/NewPlanModal";

export function NewPlanButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-primary-v2 sm" onClick={() => setOpen(true)}>+ New plan</button>
      <NewPlanModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
