"use client";

import { useState } from "react";
import { BookSessionModal } from "@/components/ds/modals/BookSessionModal";

export function BookSessionButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-primary-v2 sm" onClick={() => setOpen(true)}>+ Book session</button>
      <BookSessionModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
