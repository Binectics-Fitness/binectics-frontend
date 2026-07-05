"use client";

import { useState } from "react";
import { AddLocationModal } from "@/components/ds/modals/AddLocationModal";
import { useOrganization } from "@/contexts/OrganizationContext";

export function AddLocationButton() {
  const [open, setOpen] = useState(false);
  const { currentOrg } = useOrganization();
  return (
    <>
      <button className="btn-primary-v2 sm" onClick={() => setOpen(true)}>+ Add location</button>
      <AddLocationModal open={open} onClose={() => setOpen(false)} organizationId={currentOrg?._id ?? null} />
    </>
  );
}
