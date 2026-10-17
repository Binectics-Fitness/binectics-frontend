"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queries/keys";
import { DSCard, DSCardHead } from "@/components/ds/DSCard";
import { toast } from "@/components/Toast";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { useGymViewer } from "@/hooks/useGymViewer";
import { holds, TeamPermission } from "@/lib/gymStaffNav";
import { memberImportsApi, type MemberImportListItem } from "@/lib/api/memberImports";

/**
 * The gym's finished member imports, with the "send invites later" half of
 * "add now, invite later". Renders nothing until there is an import (or if
 * the read fails: the members table above is the real roster).
 *
 * An invite the sender handed to the mail server but never lived to record
 * is "unconfirmed": it probably arrived, nobody knows. It is counted apart
 * from "invited", never as a fact, and the gym can ask for one more try.
 */
export function RecentImports({ orgId, refreshKey }: { orgId: string | undefined; refreshKey?: number }) {
  const { fmtDate, fmtNumber } = useOrgFormat();
  const [busyId, setBusyId] = useState<string | null>(null);
  // The import endpoints are member management (marketplace:manage_listing).
  const canManage = holds(useGymViewer(), TeamPermission.MARKETPLACE_MANAGE_LISTING);
  const { data: items = [], refetch } = useQuery<MemberImportListItem[]>({
    queryKey: queryKeys.marketplace.memberImports(orgId ?? ""),
    queryFn: async () => {
      const res = await memberImportsApi.list(orgId!);
      if (!res.success) throw new Error(res.message ?? "Couldn't load imports");
      return (res.data ?? []).filter((i) => i.status === "done");
    },
    enabled: !!orgId,
    retry: false,
  });

  useEffect(() => {
    if (refreshKey) void refetch();
  }, [refreshKey, refetch]);

  if (items.length === 0) return null;

  const send = async (item: MemberImportListItem) => {
    if (!orgId) return;
    setBusyId(item._id);
    const res = await memberImportsApi.sendInvites(orgId, item._id);
    setBusyId(null);
    if (!res.success) {
      toast.error(res.message || "Couldn't queue the invites");
      return;
    }
    toast.success("Invites are on their way");
    void refetch();
  };

  const resend = async (item: MemberImportListItem) => {
    if (!orgId) return;
    setBusyId(`${item._id}:again`);
    const res = await memberImportsApi.resendUnconfirmed(orgId, item._id);
    setBusyId(null);
    if (!res.success) {
      toast.error(res.message || "Couldn't send those invites again");
      return;
    }
    toast.success("Sending them once more. A member may get the email twice.");
    void refetch();
  };

  return (
    <DSCard>
      <DSCardHead title="Imports" subtitle="Members you brought over from another system." />
      <ul>
        {items.map((item, i) => (
          <li
            key={item._id}
            className="flex flex-wrap items-center justify-between gap-3 px-4.5 py-3"
            style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
          >
            <div className="min-w-0">
              <div className="text-[13.5px] truncate" style={{ color: "var(--ink)" }}>
                {item.file_name ?? "Member list"}
              </div>
              <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                {fmtDate(item.finished_at ?? item.created_at)} · {fmtNumber(item.result?.imported ?? 0)} imported
                {item.invites.sent > 0 ? ` · ${fmtNumber(item.invites.sent)} invited` : ""}
                {item.invites.queued > 0 ? ` · ${fmtNumber(item.invites.queued)} invites on their way` : ""}
                {item.invites.held > 0 ? ` · ${fmtNumber(item.invites.held)} not invited yet` : ""}
                {item.invites.unconfirmed > 0
                  ? ` · ${fmtNumber(item.invites.unconfirmed)} ${item.invites.unconfirmed === 1 ? "invite" : "invites"} may not have arrived`
                  : ""}
              </div>
            </div>
            {canManage && (item.invites.held > 0 || item.invites.unconfirmed > 0) && (
              <div className="flex flex-wrap gap-2">
                {item.invites.held > 0 && (
                  <button
                    type="button"
                    className="btn-ghost-v2 sm"
                    disabled={busyId !== null}
                    onClick={() => void send(item)}
                  >
                    {busyId === item._id ? "Sending…" : `Send ${fmtNumber(item.invites.held)} invites`}
                  </button>
                )}
                {item.invites.unconfirmed > 0 && (
                  <button
                    type="button"
                    className="btn-ghost-v2 sm"
                    disabled={busyId !== null}
                    onClick={() => void resend(item)}
                  >
                    {busyId === `${item._id}:again` ? "Sending…" : `Send ${fmtNumber(item.invites.unconfirmed)} again`}
                  </button>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </DSCard>
  );
}

