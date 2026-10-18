"use client";

import { useEffect, useState } from "react";
import { DSCard, DSCardHead } from "@/components/ds/DSCard";
import { InviteClientModal } from "@/components/ds/modals/InviteClientModal";
import { toast } from "@/components/Toast";
import { useGymViewer } from "@/hooks/useGymViewer";
import { holds, TeamPermission } from "@/lib/gymStaffNav";
import { useEndOrgConnection, useOrgConnectedClients } from "@/lib/queries/marketplace";
import type { OrgConnectedClient } from "@/lib/api/marketplace";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

function fullName(p: { first_name: string | null; last_name: string | null }): string {
  return [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
}

/**
 * People connected to the gym who hold no membership: accepting a
 * connection request makes someone the gym's client (and takes a seat),
 * but the members table above lists memberships only. Each row offers a
 * plan (the Add member flow, filled in) or ends the connection, which
 * frees the seat.
 *
 * Member management: shown to the owner and staff holding
 * marketplace:manage_listing, which the API route asks for. Renders nothing
 * when there is no one, or the read failed (the members table is the roster).
 */
export function ConnectedClients({
  orgId,
  refreshKey,
  onEnrolled,
}: {
  orgId: string | undefined;
  refreshKey?: number;
  onEnrolled?: () => void;
}) {
  const canManage = holds(useGymViewer(), TeamPermission.MARKETPLACE_MANAGE_LISTING);
  const { data: people = [], refetch } = useOrgConnectedClients(orgId, canManage);
  const end = useEndOrgConnection(orgId);
  const { fmtDate } = useOrgFormat();
  const [offerTo, setOfferTo] = useState<OrgConnectedClient | null>(null);

  useEffect(() => {
    if (refreshKey && canManage) void refetch();
  }, [refreshKey, refetch, canManage]);

  if (!canManage || people.length === 0) return null;

  const remove = async (person: OrgConnectedClient) => {
    const name = fullName(person.client) || person.client.email || "this person";
    if (
      !window.confirm(
        `Remove ${name}? They stop being the gym's client and their seat is freed. They keep their account and history, and can send a new request later.`,
      )
    )
      return;
    try {
      await end.mutateAsync(person.profile_id);
      toast.success(`${name} removed, their seat is freed`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove this person");
    }
  };

  return (
    <DSCard>
      <DSCardHead
        title={`Connected · ${people.length}`}
        subtitle="Clients of the gym without a membership. Each holds a seat. Offer them a plan, or remove them to free it."
      />
      <ul aria-label="Connected without a membership">
        {people.map((person, i) => {
          const name = fullName(person.client) || "Unnamed";
          const acceptedBy = person.accepted_by ? fullName(person.accepted_by) : "";
          const detail = [
            person.connected_at ? `Connected ${fmtDate(person.connected_at)}` : "Connected",
            acceptedBy ? `accepted by ${acceptedBy}` : null,
          ]
            .filter(Boolean)
            .join(" · ");
          return (
            <li
              key={person.profile_id}
              className="flex flex-wrap items-center justify-between gap-3 px-4.5 py-3"
              style={i > 0 ? { borderTop: "1px solid var(--border)" } : undefined}
            >
              <div className="min-w-0">
                <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>
                  {name}
                </div>
                {person.client.email && (
                  <div className="font-mono text-[11px] break-all" style={{ color: "var(--fg-3)" }}>
                    {person.client.email}
                  </div>
                )}
                <div className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                  {detail}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary-v2 sm"
                  disabled={!person.client.email}
                  aria-label={`Offer ${name} a plan`}
                  onClick={() => setOfferTo(person)}
                >
                  Offer a plan
                </button>
                <button
                  type="button"
                  className="btn-ghost-v2 sm"
                  disabled={end.isPending}
                  aria-label={`Remove ${name}`}
                  onClick={() => void remove(person)}
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>
      {offerTo && (
        <InviteClientModal
          key={offerTo.profile_id}
          open
          prefill={{
            email: offerTo.client.email ?? "",
            first_name: offerTo.client.first_name ?? "",
            last_name: offerTo.client.last_name ?? "",
          }}
          onClose={() => setOfferTo(null)}
          onEnrolled={onEnrolled}
        />
      )}
    </DSCard>
  );
}
