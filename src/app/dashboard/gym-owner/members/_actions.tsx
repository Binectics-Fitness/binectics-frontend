"use client";

import { useState } from "react";
import { InviteClientModal } from "@/components/ds/modals/InviteClientModal";
import { ImportMembersDrawer } from "./import/ImportMembersDrawer";
import { useGymViewer } from "@/hooks/useGymViewer";
import { holds, TeamPermission } from "@/lib/gymStaffNav";

export function AddMemberButton({ onEnrolled }: { onEnrolled?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn-primary-v2 sm" onClick={() => setOpen(true)}>+ Add member</button>
      <InviteClientModal open={open} onClose={() => setOpen(false)} onEnrolled={onEnrolled} />
    </>
  );
}

/** "Import members": bring a member list over from another system. */
export function ImportMembersButton({
  orgId,
  onImported,
  variant = "ghost",
  label = "Import members",
}: {
  orgId: string | undefined;
  onImported?: () => void;
  variant?: "ghost" | "primary";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  // The import routes are member management (marketplace:manage_listing).
  const canImport = holds(useGymViewer(), TeamPermission.MARKETPLACE_MANAGE_LISTING);
  if (!canImport) return null;
  return (
    <>
      <button
        type="button"
        className={`${variant === "primary" ? "btn-primary-v2" : "btn-ghost-v2"} sm`}
        disabled={!orgId}
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
      <ImportMembersDrawer open={open} orgId={orgId} onClose={() => setOpen(false)} onImported={onImported} />
    </>
  );
}
