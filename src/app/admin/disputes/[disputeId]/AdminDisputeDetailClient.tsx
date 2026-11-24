"use client";

import { DisputeDetail } from "@/components/refunds/DisputeDetail";
import { useAdminAccess } from "@/hooks/useAdminAccess";
import { AdminPermission } from "@/lib/admin/permissions";

/** The admin view of a dispute; notes and evidence requests need refunds:write. */
export function AdminDisputeDetailClient({ disputeId }: { disputeId: string }) {
  const canAct = useAdminAccess().can(AdminPermission.REFUNDS_WRITE);
  return <DisputeDetail mode="admin" disputeId={disputeId} canAct={canAct} />;
}
