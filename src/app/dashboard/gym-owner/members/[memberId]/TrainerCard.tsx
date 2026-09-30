"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SearchableSelect from "@/components/SearchableSelect";
import { toast } from "@/components/Toast";
import { marketplaceService } from "@/lib/api/marketplace";
import { MemberStatus, teamsService, type OrganizationMember } from "@/lib/api/teams";
import { STAFF_TRAINER_ROLE_CODE } from "@/lib/workspaces";

const UNASSIGNED = "";

/** The staff this member can be assigned to: the gym's trainers, plus whoever has them now. */
export function trainerOptions(
  team: readonly OrganizationMember[],
  assignedUserId: string | null | undefined,
): { label: string; value: string }[] {
  const options: { label: string; value: string }[] = [];
  for (const m of team) {
    if (m.status !== MemberStatus.ACTIVE || typeof m.user_id !== "object") continue;
    const role = typeof m.team_role_id === "object" ? m.team_role_id : null;
    const userId = m.user_id._id;
    if (role?.code !== STAFF_TRAINER_ROLE_CODE && userId !== assignedUserId) continue;
    const name = `${m.user_id.first_name ?? ""} ${m.user_id.last_name ?? ""}`.trim() || m.user_id.email;
    options.push({ label: name, value: userId });
  }
  options.sort((a, b) => a.label.localeCompare(b.label));
  return [{ label: "Not assigned", value: UNASSIGNED }, ...options];
}

/**
 * Who coaches this gym member. Assigning makes the member one of the
 * trainer's clients: they see them in their client list and coach app, and
 * can open their progress and message them.
 */
export function TrainerCard({
  organizationId,
  subscriptionId,
  assignedUserId,
  canAssign,
  onAssigned,
}: {
  organizationId: string;
  subscriptionId: string;
  assignedUserId: string | null;
  /** Ended memberships can't be assigned. */
  canAssign: boolean;
  onAssigned: (userId: string | null) => void;
}) {
  const [team, setTeam] = useState<OrganizationMember[] | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    void teamsService.getMembers(organizationId).then((res) => {
      if (mounted) setTeam(res.success && res.data ? res.data : []);
    });
    return () => {
      mounted = false;
    };
  }, [organizationId]);

  const options = useMemo(() => trainerOptions(team ?? [], assignedUserId), [team, assignedUserId]);
  const hasTrainers = options.length > 1;

  async function assign(value: string) {
    const next = value === UNASSIGNED ? null : value;
    if (next === assignedUserId) return;
    setSaving(true);
    const res = await marketplaceService.assignMemberTrainer(organizationId, subscriptionId, next);
    setSaving(false);
    if (!res.success) {
      toast.error(res.message || "We couldn't change the trainer. Try again.");
      return;
    }
    onAssigned(next);
    const name = options.find((o) => o.value === value)?.label;
    toast.success(next ? `Assigned to ${name}.` : "Unassigned.");
  }

  return (
    <div className="rounded-(--r-3) p-5.5 flex flex-col gap-3" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div>
        <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Trainer</h3>
        <p className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>
          The trainer you pick sees this member in their clients and coach app, and can message them.
        </p>
      </div>
      {team === null ? (
        <div className="h-10 rounded-(--r-2) animate-pulse" style={{ background: "var(--bg-2)" }} />
      ) : hasTrainers ? (
        <SearchableSelect
          value={assignedUserId ?? UNASSIGNED}
          onChange={(v) => void assign(v)}
          options={options}
          placeholder="Not assigned"
          disabled={saving || !canAssign}
        />
      ) : (
        <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>
          Nobody on your team is a trainer yet. Give someone the Consultant / Trainer role on the{" "}
          <Link href="/dashboard/team" className="underline" style={{ color: "var(--ink)" }}>Team page</Link>.
        </p>
      )}
      {!canAssign && hasTrainers && (
        <p className="text-[12px]" style={{ color: "var(--fg-3)" }}>This membership has ended, so it can&apos;t be assigned.</p>
      )}
    </div>
  );
}
