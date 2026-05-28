"use client";

import { useState } from "react";
import { AddLocationModal } from "@/components/ds/modals/AddLocationModal";

export function AddLocationButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-primary-v2 sm" onClick={() => setOpen(true)}>+ Add location</button>
      <AddLocationModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
