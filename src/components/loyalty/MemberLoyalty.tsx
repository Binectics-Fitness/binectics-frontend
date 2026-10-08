"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import {
  useLoyaltyHistory,
  useLoyaltyPrograms,
  useLoyaltyRewards,
  useMyLoyaltyRedemptions,
  useRedeemReward,
} from "@/lib/queries/loyalty";
import {
  LoyaltyEventType,
  LoyaltyRedemptionStatus,
  type LoyaltyReward,
} from "@/lib/types";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

function rewardName(reward: string | LoyaltyReward): string {
  if (typeof reward === "string") return "Reward";
  return reward.name;
}

function eventTypeLabel(eventType: LoyaltyEventType): string {
  const labels: Record<LoyaltyEventType, string> = {
    [LoyaltyEventType.SUBSCRIPTION_PURCHASE]: "Membership",
    [LoyaltyEventType.GYM_CHECK_IN]: "Check-in",
    [LoyaltyEventType.JOURNAL_LOGGED]: "Journal entry",
    [LoyaltyEventType.REWARD_REDEMPTION]: "Reward redeemed",
    [LoyaltyEventType.ADMIN_ADJUSTMENT]: "Adjustment",
    [LoyaltyEventType.SIGNUP_BONUS]: "Bonus",
  };
  return labels[eventType] ?? eventType;
}

const card = { border: "1px solid var(--border)", background: "var(--bg)" } as const;

/**
 * A member's loyalty: one section per provider program they can see. Points
 * are earned with a provider and spend only on that provider's rewards, so
 * everything here is shown for one program at a time.
 */
export function MemberLoyalty() {
  const { fmtDate, fmtNumber } = useOrgFormat();
  const programsQuery = useLoyaltyPrograms();
  const programs = useMemo(() => programsQuery.data ?? [], [programsQuery.data]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"rewards" | "history" | "redemptions">("rewards");
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  // The chosen program, or the first one until the member picks.
  const program = programs.find((p) => p.organization_id === selectedId) ?? programs[0] ?? null;
  const orgId = program?.organization_id;
  const rewardsQuery = useLoyaltyRewards(orgId, !!orgId);
  const historyQuery = useLoyaltyHistory(25, 0, orgId, !!orgId);
  const redemptionsQuery = useMyLoyaltyRedemptions(!!orgId);
  const redeem = useRedeemReward();

  const rewards = (rewardsQuery.data ?? []).filter((r) => r.is_active);
  const history = historyQuery.data ?? [];
  const redemptions = (redemptionsQuery.data ?? []).filter(
    (r) => !orgId || r.organization_id == null || r.organization_id === orgId,
  );
  const pending = redemptions.filter((r) => r.status === LoyaltyRedemptionStatus.PENDING);

  async function handleRedeem(rewardId: string) {
    setMessage(null);
    try {
      await redeem.mutateAsync(rewardId);
      setMessage({ tone: "ok", text: "Reward redeemed. Show the code in your redemptions to claim it." });
    } catch (err) {
      setMessage({
        tone: "error",
        text: err instanceof Error ? err.message : "Couldn't redeem that reward.",
      });
    }
  }

  if (programsQuery.isLoading) return <AsyncSpinner size="page" label="Loading loyalty" />;

  if (programsQuery.isError) {
    return (
      <div className="rounded-(--r-3) p-4 text-sm" style={{ border: "1px solid var(--danger)", background: "var(--danger-soft)", color: "var(--danger)" }}>
        Couldn&apos;t load your loyalty programs. Refresh to try again.
      </div>
    );
  }

  if (!programs.length) {
    return (
      <div className="rounded-(--r-3) p-6" style={card}>
        <EmptySlate
          message="None of your providers runs a loyalty program right now."
          hint="Loyalty is something each gym, trainer or dietitian chooses to offer. When one of yours turns it on, your points with them show here."
        />
        <Link href="/dashboard/member" className="mt-4 inline-block text-sm font-medium underline" style={{ color: "var(--ink)" }}>
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {programs.length > 1 && (
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Loyalty programs">
          {programs.map((p) => {
            const active = p.organization_id === selectedId;
            return (
              <button
                key={p.organization_id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setSelectedId(p.organization_id);
                  setMessage(null);
                }}
                className="rounded-full px-3.5 py-2 min-h-11 text-sm font-medium cursor-pointer"
                style={{
                  background: active ? "var(--ink)" : "var(--bg-2)",
                  color: active ? "var(--bg)" : "var(--fg-2)",
                  border: "1px solid var(--border)",
                }}
              >
                {p.organization_name || "Provider"} · {fmtNumber(p.balance)} pts
              </button>
            );
          })}
        </div>
      )}

      {message && (
        <div
          className="rounded-(--r-3) p-3 text-sm"
          role={message.tone === "error" ? "alert" : "status"}
          style={
            message.tone === "error"
              ? { border: "1px solid var(--danger)", background: "var(--danger-soft)", color: "var(--danger)" }
              : { border: "1px solid var(--signal)", background: "var(--signal-soft)", color: "var(--signal)" }
          }
        >
          {message.text}
        </div>
      )}

      {program && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-(--r-3) p-4" style={card}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
              Points with {program.organization_name || "this provider"}
            </div>
            <div className="text-[36px] font-medium mt-2 tabular-nums" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
              {fmtNumber(program.balance)}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>
              Spend them on this provider&apos;s rewards
            </div>
          </div>
          <div className="rounded-(--r-3) p-4" style={card}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
              Rewards
            </div>
            <div className="text-[36px] font-medium mt-2 tabular-nums" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
              {rewards.length}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>available here</div>
          </div>
          <div className="rounded-(--r-3) p-4" style={card}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
              Pending redemptions
            </div>
            <div className="text-[36px] font-medium mt-2 tabular-nums" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
              {pending.length}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>awaiting fulfilment</div>
          </div>
        </div>
      )}

      {program && !program.is_member && (
        <p className="text-sm" style={{ color: "var(--fg-3)" }}>
          Your membership with {program.organization_name || "this provider"} isn&apos;t active, so its rewards can&apos;t be redeemed until it is. Your points are kept.
        </p>
      )}

      <div className="rounded-(--r-3) overflow-hidden" style={card}>
        <div className="flex gap-1 p-2" style={{ borderBottom: "1px solid var(--border)" }}>
          {(["rewards", "history", "redemptions"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className="rounded-(--r-2) px-3 py-1.5 text-sm font-medium capitalize"
              style={{
                background: activeTab === tab ? "var(--ink)" : "transparent",
                color: activeTab === tab ? "var(--bg)" : "var(--fg-2)",
                cursor: "pointer",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === "rewards" &&
            (rewardsQuery.isLoading ? (
              <AsyncSpinner label="Loading rewards" />
            ) : rewards.length === 0 ? (
              <EmptySlate message="This provider hasn't added any rewards yet." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rewards.map((reward) => {
                  const canAfford = !!program && program.is_member && program.balance >= reward.points_cost;
                  const busy = redeem.isPending && redeem.variables === reward._id;
                  return (
                    <div key={reward._id} className="rounded-(--r-3) p-4 flex flex-col gap-3" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
                      {reward.image_url && (
                        <div className="relative w-full h-32 rounded-(--r-2) overflow-hidden">
                          <Image src={reward.image_url} alt={reward.name} fill className="object-cover" unoptimized />
                        </div>
                      )}
                      <div>
                        <div className="font-medium" style={{ color: "var(--ink)" }}>{reward.name}</div>
                        {reward.description && (
                          <div className="text-sm mt-1" style={{ color: "var(--fg-3)" }}>{reward.description}</div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm font-medium tabular-nums" style={{ color: "var(--signal)" }}>
                          {fmtNumber(reward.points_cost)} pts
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRedeem(reward._id)}
                          disabled={!canAfford || busy}
                          className="rounded-(--r-2) px-3 py-1.5 text-sm font-medium"
                          style={{
                            background: canAfford ? "var(--signal)" : "var(--bg-3)",
                            color: canAfford ? "var(--signal-ink)" : "var(--fg-4)",
                            cursor: canAfford ? "pointer" : "not-allowed",
                            opacity: busy ? 0.7 : 1,
                          }}
                        >
                          {busy ? "Redeeming..." : canAfford ? "Redeem" : "Not enough points"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

          {activeTab === "history" &&
            (historyQuery.isLoading ? (
              <AsyncSpinner label="Loading history" />
            ) : history.length === 0 ? (
              <EmptySlate message="No points activity with this provider yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] border-collapse text-sm">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)" }}>
                      <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>Event</th>
                      <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>Points</th>
                      <th className="text-left py-2" style={{ color: "var(--fg-3)", fontWeight: 500 }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((tx) => (
                      <tr key={tx._id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="py-3 pr-4" style={{ color: "var(--ink)" }}>
                          <div>{eventTypeLabel(tx.event_type)}</div>
                          {tx.note && <div className="text-xs" style={{ color: "var(--fg-3)" }}>{tx.note}</div>}
                        </td>
                        <td className="py-3 pr-4">
                          <span className="font-mono font-medium tabular-nums" style={{ color: tx.points >= 0 ? "var(--signal)" : "var(--danger)" }}>
                            {tx.points >= 0 ? "+" : ""}
                            {fmtNumber(tx.points)}
                          </span>
                        </td>
                        <td className="py-3" style={{ color: "var(--fg-2)" }}>{fmtDate(tx.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {activeTab === "redemptions" &&
            (redemptionsQuery.isLoading ? (
              <AsyncSpinner label="Loading redemptions" />
            ) : redemptions.length === 0 ? (
              <EmptySlate message="No redemptions with this provider yet." />
            ) : (
              <div className="flex flex-col gap-3">
                {redemptions.map((redemption) => (
                  <div key={redemption._id} className="rounded-(--r-2) p-4 flex items-center justify-between gap-4" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
                    <div>
                      <div className="font-medium" style={{ color: "var(--ink)" }}>{rewardName(redemption.reward_id)}</div>
                      <div className="text-sm mt-1" style={{ color: "var(--fg-3)" }}>
                        {fmtNumber(redemption.points_spent)} points spent · {fmtDate(redemption.created_at)}
                      </div>
                      {redemption.redemption_code && (
                        <div className="mt-1.5">
                          <span className="font-mono text-xs px-2 py-1 rounded-(--r-1)" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
                            {redemption.redemption_code}
                          </span>
                        </div>
                      )}
                    </div>
                    <span
                      className="font-mono text-xs uppercase tracking-wider rounded-(--r-2) px-2 py-1 whitespace-nowrap"
                      style={{
                        background:
                          redemption.status === LoyaltyRedemptionStatus.FULFILLED
                            ? "var(--signal-soft)"
                            : redemption.status === LoyaltyRedemptionStatus.CANCELLED
                              ? "var(--danger-soft)"
                              : "var(--bg-3)",
                        color:
                          redemption.status === LoyaltyRedemptionStatus.FULFILLED
                            ? "var(--signal)"
                            : redemption.status === LoyaltyRedemptionStatus.CANCELLED
                              ? "var(--danger)"
                              : "var(--fg-3)",
                      }}
                    >
                      {redemption.status}
                    </span>
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
