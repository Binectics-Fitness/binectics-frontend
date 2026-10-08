"use client";

import { useState } from "react";
import { ActionModal, AsyncSpinner, DSCard, EmptySlate } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  useOrgLoyaltyRewards,
  useOrgLoyaltySettings,
  useRemoveOrgReward,
  useSaveOrgReward,
  useUpdateOrgLoyaltySettings,
} from "@/lib/queries/loyalty";
import type { LoyaltyReward, LoyaltyRewardInput } from "@/lib/types";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

function Switch({
  on,
  onToggle,
  disabled,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onToggle}
      className="w-[30px] h-[18px] rounded-full relative cursor-pointer shrink-0 mt-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      style={{ background: on ? "var(--ink)" : "var(--border-2)", border: "none", padding: 0 }}
    >
      <span
        className="absolute w-3.5 h-3.5 rounded-full top-0.5"
        style={{ background: "var(--bg)", left: on ? "14px" : "2px", transition: "left var(--motion-fast) var(--ease)" }}
      />
    </button>
  );
}

interface RewardDraft {
  id?: string;
  name: string;
  description: string;
  points_cost: string;
  max_redemptions: string;
  is_active: boolean;
}

const EMPTY_DRAFT: RewardDraft = {
  name: "",
  description: "",
  points_cost: "",
  max_redemptions: "",
  is_active: true,
};

function draftFrom(r: LoyaltyReward): RewardDraft {
  return {
    id: r._id,
    name: r.name,
    description: r.description ?? "",
    points_cost: String(r.points_cost),
    max_redemptions: r.max_redemptions ? String(r.max_redemptions) : "",
    is_active: r.is_active,
  };
}

const inputStyle = {
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--ink)",
} as const;

/**
 * A provider's own loyalty program: the opt-in switch and, while it is on,
 * the rewards it offers. Off by default; nothing here is a Binectics-wide
 * program.
 */
export function ProviderLoyaltyPanel() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const orgId = currentOrg?._id;
  const canManage = !!currentOrg && (currentOrg.is_owner || currentOrg.can_manage_organization);
  const { fmtNumber } = useOrgFormat();

  const settings = useOrgLoyaltySettings(orgId);
  const update = useUpdateOrgLoyaltySettings(orgId);
  const enabled = settings.data?.enabled === true;
  const rewards = useOrgLoyaltyRewards(orgId, enabled && canManage);
  const save = useSaveOrgReward(orgId);
  const remove = useRemoveOrgReward(orgId);

  const [confirmOff, setConfirmOff] = useState(false);
  const [draft, setDraft] = useState<RewardDraft | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (orgLoading || (orgId && settings.isLoading)) {
    return <AsyncSpinner size="page" label="Loading loyalty settings" />;
  }
  if (!orgId) {
    return (
      <EmptySlate
        message="Loyalty programs are run by each provider."
        hint="Open a gym, trainer or dietitian workspace to set one up."
      />
    );
  }
  if (settings.isError) {
    return (
      <div className="rounded-(--r-3) p-4 text-sm" role="alert" style={{ border: "1px solid var(--danger)", background: "var(--danger-soft)", color: "var(--danger)" }}>
        Couldn&apos;t load your loyalty settings. Refresh to try again.
      </div>
    );
  }

  async function setEnabled(next: boolean) {
    try {
      await update.mutateAsync(next);
      toast.success(next ? "Loyalty program turned on." : "Loyalty program turned off.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't change the loyalty setting.");
    }
  }

  async function submitDraft() {
    if (!draft) return;
    const cost = Number(draft.points_cost);
    const cap = draft.max_redemptions.trim() ? Number(draft.max_redemptions) : undefined;
    if (!draft.name.trim()) return setFormError("Give the reward a name.");
    if (!Number.isInteger(cost) || cost < 1) return setFormError("Points cost must be a whole number of at least 1.");
    if (cap !== undefined && (!Number.isInteger(cap) || cap < 1))
      return setFormError("Leave the limit empty, or use a whole number of at least 1.");
    const data: LoyaltyRewardInput = {
      name: draft.name.trim(),
      points_cost: cost,
      is_active: draft.is_active,
      ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
      ...(cap !== undefined ? { max_redemptions: cap } : {}),
    };
    try {
      await save.mutateAsync({ rewardId: draft.id, data });
      toast.success(draft.id ? "Reward updated." : "Reward added.");
      setDraft(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Couldn't save the reward.");
    }
  }

  async function removeReward(r: LoyaltyReward) {
    try {
      const res = await remove.mutateAsync(r._id);
      toast.success(res.archived ? "Reward archived: members who redeemed it keep their codes." : "Reward removed.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove the reward.");
    }
  }

  const list = rewards.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <DSCard>
        <div className="flex items-start gap-3.5 px-5.5 py-4">
          <div className="flex-1">
            <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
              Run a loyalty program for your clients
            </div>
            <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "var(--fg-3)" }}>
              This is your own program, not a Binectics one. When it&apos;s on, your clients earn points with you
              (10 per check-in, and one point for every 10 they pay online for a membership) and spend them only
              on rewards you set and hand out yourself. It&apos;s off until you turn it on, and it&apos;s included on
              every plan.
            </p>
            <p className="text-[13px] mt-2 leading-relaxed" style={{ color: "var(--fg-3)" }}>
              Turning it off hides it from your clients and stops new points. Nothing is deleted: their points come
              back if you turn it on again.
            </p>
            {!canManage && (
              <p className="text-[12.5px] mt-2" style={{ color: "var(--fg-3)" }}>
                Only the owner, or a teammate who can manage the organization, can change this.
              </p>
            )}
          </div>
          <Switch
            on={enabled}
            label="Loyalty program"
            disabled={!canManage || update.isPending}
            onToggle={() => (enabled ? setConfirmOff(true) : void setEnabled(true))}
          />
        </div>
      </DSCard>

      {enabled && canManage && (
        <DSCard>
          <div className="flex items-center justify-between gap-3 px-5.5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Your rewards</div>
              <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                What your clients can spend their points on. You hand these out yourself.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setDraft({ ...EMPTY_DRAFT });
              }}
              className="rounded-(--r-2) px-3 py-2 min-h-11 text-sm font-medium cursor-pointer"
              style={{ background: "var(--ink)", color: "var(--bg)" }}
            >
              Add reward
            </button>
          </div>
          <div className="px-5.5 py-4">
            {rewards.isLoading ? (
              <AsyncSpinner label="Loading rewards" />
            ) : rewards.isError ? (
              <p className="text-sm" style={{ color: "var(--danger)" }}>Couldn&apos;t load your rewards.</p>
            ) : list.length === 0 ? (
              <EmptySlate message="No rewards yet." hint="Add one so your clients have something to spend their points on." mt="mt-0" />
            ) : (
              <ul className="flex flex-col gap-2">
                {list.map((r) => (
                  <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 rounded-(--r-2) p-3" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
                    <div className="min-w-0">
                      <div className="font-medium" style={{ color: "var(--ink)" }}>
                        {r.name}
                        {!r.is_active && (
                          <span className="ml-2 font-mono text-[11px] uppercase" style={{ color: "var(--fg-3)" }}>Hidden</span>
                        )}
                      </div>
                      <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                        {fmtNumber(r.points_cost)} pts · {fmtNumber(r.redemption_count)} redeemed
                        {r.max_redemptions ? ` of ${fmtNumber(r.max_redemptions)}` : ""}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormError(null);
                          setDraft(draftFrom(r));
                        }}
                        className="rounded-(--r-2) px-3 py-1.5 min-h-11 text-sm cursor-pointer"
                        style={{ border: "1px solid var(--border)", color: "var(--ink)", background: "var(--bg)" }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeReward(r)}
                        disabled={remove.isPending}
                        className="rounded-(--r-2) px-3 py-1.5 min-h-11 text-sm cursor-pointer"
                        style={{ border: "1px solid var(--border)", color: "var(--danger)", background: "var(--bg)" }}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DSCard>
      )}

      <ActionModal
        open={confirmOff}
        onClose={() => setConfirmOff(false)}
        title="Turn off your loyalty program?"
        description="Your clients will stop earning points with you, and your rewards and their balances will be hidden. Nothing is deleted: turning it back on shows everything again."
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setConfirmOff(false)} className="rounded-(--r-2) px-3 py-2 min-h-11 text-sm cursor-pointer" style={{ border: "1px solid var(--border)", color: "var(--ink)" }}>
              Keep it on
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmOff(false);
                void setEnabled(false);
              }}
              className="rounded-(--r-2) px-3 py-2 min-h-11 text-sm font-medium cursor-pointer"
              style={{ background: "var(--ink)", color: "var(--bg)" }}
            >
              Turn off
            </button>
          </div>
        }
      >
        <span />
      </ActionModal>

      <ActionModal
        open={!!draft}
        onClose={() => setDraft(null)}
        title={draft?.id ? "Edit reward" : "Add reward"}
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDraft(null)} className="rounded-(--r-2) px-3 py-2 min-h-11 text-sm cursor-pointer" style={{ border: "1px solid var(--border)", color: "var(--ink)" }}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void submitDraft()}
              disabled={save.isPending}
              className="rounded-(--r-2) px-3 py-2 min-h-11 text-sm font-medium cursor-pointer"
              style={{ background: "var(--ink)", color: "var(--bg)", opacity: save.isPending ? 0.7 : 1 }}
            >
              {save.isPending ? "Saving..." : "Save reward"}
            </button>
          </div>
        }
      >
        {draft && (
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-[13px]" style={{ color: "var(--fg-2)" }}>
              Name
              <input value={draft.name} maxLength={120} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="rounded-(--r-2) px-3 py-2 text-sm" style={inputStyle} />
            </label>
            <label className="flex flex-col gap-1 text-[13px]" style={{ color: "var(--fg-2)" }}>
              Description (optional)
              <textarea value={draft.description} maxLength={1000} rows={3} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className="rounded-(--r-2) px-3 py-2 text-sm" style={inputStyle} />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-[13px]" style={{ color: "var(--fg-2)" }}>
                Points cost
                <input inputMode="numeric" value={draft.points_cost} onChange={(e) => setDraft({ ...draft, points_cost: e.target.value })} className="rounded-(--r-2) px-3 py-2 text-sm" style={inputStyle} />
              </label>
              <label className="flex flex-col gap-1 text-[13px]" style={{ color: "var(--fg-2)" }}>
                Limit (optional)
                <input inputMode="numeric" value={draft.max_redemptions} placeholder="No limit" onChange={(e) => setDraft({ ...draft, max_redemptions: e.target.value })} className="rounded-(--r-2) px-3 py-2 text-sm" style={inputStyle} />
              </label>
            </div>
            <label className="flex items-center gap-2 text-[13px]" style={{ color: "var(--fg-2)" }}>
              <input type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />
              Show this reward to clients
            </label>
            {formError && (
              <p className="text-[13px]" role="alert" style={{ color: "var(--danger)" }}>{formError}</p>
            )}
          </div>
        )}
      </ActionModal>
    </div>
  );
}
