"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { loyaltyService } from "@/lib/api/loyalty";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { AsyncSpinner } from "@/components/ds";
import {
  LoyaltyEventType,
  LoyaltyRedemptionStatus,
  type LoyaltyBalance,
  type LoyaltyPointsTransaction,
  type LoyaltyRedemption,
  type LoyaltyReward,
} from "@/lib/types";

function rewardName(reward: string | LoyaltyReward): string {
  if (typeof reward === "string") return "Reward";
  return reward.name;
}

function eventTypeLabel(eventType: LoyaltyEventType): string {
  const labels: Record<LoyaltyEventType, string> = {
    [LoyaltyEventType.SUBSCRIPTION_PURCHASE]: "Subscription",
    [LoyaltyEventType.GYM_CHECK_IN]: "Gym check-in",
    [LoyaltyEventType.JOURNAL_LOGGED]: "Journal entry",
    [LoyaltyEventType.REWARD_REDEMPTION]: "Reward redeemed",
    [LoyaltyEventType.ADMIN_ADJUSTMENT]: "Manual adjustment",
    [LoyaltyEventType.SIGNUP_BONUS]: "Signup bonus",
  };
  return labels[eventType] ?? eventType;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default function LoyaltyCenterPage() {
  const [balance, setBalance] = useState<LoyaltyBalance | null>(null);
  const [history, setHistory] = useState<LoyaltyPointsTransaction[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [redemptions, setRedemptions] = useState<LoyaltyRedemption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redeemMessage, setRedeemMessage] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"rewards" | "history" | "redemptions">("rewards");



  // Load data once on mount and when loadData changes - using isMounted pattern
  useEffect(() => {
    let isMounted = true;
    const run = async () => {
      if (isMounted) {
        setIsLoading(true);
        setError(null);
        try {
          const [balanceRes, historyRes, rewardsRes, redemptionsRes] =
            await Promise.all([
              loyaltyService.getBalance(),
              loyaltyService.getHistory(25, 0),
              loyaltyService.listRewards(),
              loyaltyService.listMyRedemptions(),
            ]);

          if (!isMounted) return;
          if (balanceRes.success && balanceRes.data) setBalance(balanceRes.data);
          if (historyRes.success && Array.isArray(historyRes.data)) setHistory(historyRes.data);
          if (rewardsRes.success && Array.isArray(rewardsRes.data)) setRewards(rewardsRes.data);
          if (redemptionsRes.success && Array.isArray(redemptionsRes.data)) setRedemptions(redemptionsRes.data);
        } catch (err) {
          if (isMounted) setError(err instanceof Error ? err.message : "Failed to load loyalty data");
        } finally {
          if (isMounted) setIsLoading(false);
        }
      }
    };
    void run();
    return () => { isMounted = false; };
  }, []);

  async function handleRedeem(rewardId: string) {
    setRedeemingId(rewardId);
    setRedeemMessage(null);
    setError(null);

    try {
      const response = await loyaltyService.redeemReward(rewardId);
      if (response.success) {
        setRedeemMessage("Reward redeemed successfully. Check your redemptions tab.");
        // Refresh balance and redemptions
        const [balanceRes, redemptionsRes] = await Promise.all([
          loyaltyService.getBalance(),
          loyaltyService.listMyRedemptions(),
        ]);
        if (balanceRes.success && balanceRes.data) setBalance(balanceRes.data);
        if (redemptionsRes.success && Array.isArray(redemptionsRes.data)) setRedemptions(redemptionsRes.data);
      } else {
        setError("Failed to redeem reward. You may not have enough points.");
      }
    } catch {
      setError("An error occurred while redeeming the reward.");
    } finally {
      setRedeemingId(null);
    }
  }

  const activeRewards = useMemo(
    () => rewards.filter((r) => r.is_active),
    [rewards],
  );

  const pendingRedemptions = useMemo(
    () =>
      redemptions.filter((r) => r.status === LoyaltyRedemptionStatus.PENDING),
    [redemptions],
  );

  return (
    <MemberDashboardShell activeLabel="Home">
      <div className="flex flex-col gap-5">
        <div>
          <div
            className="font-mono text-[11px] uppercase tracking-[0.06em]"
            style={{ color: "var(--fg-3)" }}
          >
            Member
          </div>
          <h1
            className="text-[30px] font-medium mt-1"
            style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            Loyalty center
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--fg-3)" }}>
            Earn points through activity and redeem them for rewards.
          </p>
        </div>

        {error && (
          <div
            className="rounded-(--r-3) p-3 text-sm"
            style={{ border: "1px solid var(--danger)", background: "var(--danger-soft)", color: "var(--danger)" }}
          >
            {error}
          </div>
        )}

        {redeemMessage && (
          <div
            className="rounded-(--r-3) p-3 text-sm"
            style={{ border: "1px solid var(--signal)", background: "var(--signal-soft)", color: "var(--signal)" }}
          >
            {redeemMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className="rounded-(--r-3) p-4"
            style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
          >
            <div
              className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
              style={{ color: "var(--fg-3)" }}
            >
              Current balance
            </div>
            <div
              className="text-[36px] font-medium mt-2 tabular-nums"
              style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
            >
              {balance ? balance.balance.toLocaleString() : "-"}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>
              points
            </div>
          </div>

          <div
            className="rounded-(--r-3) p-4"
            style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
          >
            <div
              className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
              style={{ color: "var(--fg-3)" }}
            >
              Active rewards
            </div>
            <div
              className="text-[36px] font-medium mt-2 tabular-nums"
              style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
            >
              {activeRewards.length}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>
              available to redeem
            </div>
          </div>

          <div
            className="rounded-(--r-3) p-4"
            style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
          >
            <div
              className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
              style={{ color: "var(--fg-3)" }}
            >
              Pending redemptions
            </div>
            <div
              className="text-[36px] font-medium mt-2 tabular-nums"
              style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
            >
              {pendingRedemptions.length}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>
              awaiting fulfilment
            </div>
          </div>

          <div
            className="rounded-(--r-3) p-4"
            style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
          >
            <div
              className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
              style={{ color: "var(--fg-3)" }}
            >
              Total transactions
            </div>
            <div
              className="text-[36px] font-medium mt-2 tabular-nums"
              style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
            >
              {history.length}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--fg-3)" }}>
              points earned/spent
            </div>
          </div>
        </div>

        <div
          className="rounded-(--r-3) overflow-hidden"
          style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
        >
          <div
            className="flex gap-1 p-2"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            {(["rewards", "history", "redemptions"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className="rounded-(--r-2) px-3 py-1.5 text-sm font-medium capitalize"
                style={{
                  background:
                    activeTab === tab ? "var(--ink)" : "transparent",
                  color:
                    activeTab === tab ? "var(--bg)" : "var(--fg-2)",
                  cursor: "pointer",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4">
            {isLoading ? (
              <AsyncSpinner label="Loading rewards" />
            ) : (
              <>
                {activeTab === "rewards" && (
                  <>
                    {activeRewards.length === 0 ? (
                      <p className="text-sm" style={{ color: "var(--fg-3)" }}>
                        No rewards available at the moment.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeRewards.map((reward) => {
                          const canAfford = balance
                            ? balance.balance >= reward.points_cost
                            : false;

                          return (
                            <div
                              key={reward._id}
                              className="rounded-(--r-3) p-4 flex flex-col gap-3"
                              style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}
                            >
                              {reward.image_url && (
                                <div className="relative w-full h-32 rounded-(--r-2) overflow-hidden">
                                  <Image
                                    src={reward.image_url}
                                    alt={reward.name}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                </div>
                              )}
                              <div>
                                <div className="font-medium" style={{ color: "var(--ink)" }}>
                                  {reward.name}
                                </div>
                                {reward.description && (
                                  <div
                                    className="text-sm mt-1"
                                    style={{ color: "var(--fg-3)" }}
                                  >
                                    {reward.description}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between">
                                <div>
                                  <span
                                    className="font-mono text-sm font-medium tabular-nums"
                                    style={{ color: "var(--signal)" }}
                                  >
                                    {reward.points_cost.toLocaleString()} pts
                                  </span>
                                  {reward.max_redemptions && (
                                    <span className="text-xs ml-2" style={{ color: "var(--fg-3)" }}>
                                      {reward.redemption_count}/{reward.max_redemptions} redeemed
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRedeem(reward._id)}
                                  disabled={
                                    !canAfford || redeemingId === reward._id
                                  }
                                  className="rounded-(--r-2) px-3 py-1.5 text-sm font-medium"
                                  style={{
                                    background: canAfford
                                      ? "var(--signal)"
                                      : "var(--bg-3)",
                                    color: canAfford ? "var(--signal-ink)" : "var(--fg-4)",
                                    cursor: canAfford ? "pointer" : "not-allowed",
                                    opacity:
                                      redeemingId === reward._id ? 0.7 : 1,
                                  }}
                                >
                                  {redeemingId === reward._id
                                    ? "Redeeming..."
                                    : canAfford
                                      ? "Redeem"
                                      : "Not enough points"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {activeTab === "history" && (
                  <>
                    {history.length === 0 ? (
                      <p className="text-sm" style={{ color: "var(--fg-3)" }}>
                        No transaction history yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[600px] border-collapse text-sm">
                          <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                              <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                                Event
                              </th>
                              <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                                Points
                              </th>
                              <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                                Balance after
                              </th>
                              <th className="text-left py-2" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {history.map((tx) => (
                              <tr
                                key={tx._id}
                                style={{ borderBottom: "1px solid var(--border)" }}
                              >
                                <td className="py-3 pr-4" style={{ color: "var(--ink)" }}>
                                  <div>{eventTypeLabel(tx.event_type)}</div>
                                  {tx.note && (
                                    <div
                                      className="text-xs"
                                      style={{ color: "var(--fg-3)" }}
                                    >
                                      {tx.note}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 pr-4">
                                  <span
                                    className="font-mono font-medium tabular-nums"
                                    style={{
                                      color:
                                        tx.points >= 0
                                          ? "var(--signal)"
                                          : "var(--danger)",
                                    }}
                                  >
                                    {tx.points >= 0 ? "+" : ""}
                                    {tx.points.toLocaleString()}
                                  </span>
                                </td>
                                <td
                                  className="py-3 pr-4 font-mono text-sm tabular-nums"
                                  style={{ color: "var(--fg-2)" }}
                                >
                                  {tx.balance_after.toLocaleString()}
                                </td>
                                <td className="py-3" style={{ color: "var(--fg-2)" }}>
                                  {formatDate(tx.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {activeTab === "redemptions" && (
                  <>
                    {redemptions.length === 0 ? (
                      <p className="text-sm" style={{ color: "var(--fg-3)" }}>
                        No redemptions yet.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {redemptions.map((redemption) => (
                          <div
                            key={redemption._id}
                            className="rounded-(--r-2) p-4 flex items-center justify-between gap-4"
                            style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}
                          >
                            <div>
                              <div className="font-medium" style={{ color: "var(--ink)" }}>
                                {rewardName(redemption.reward_id)}
                              </div>
                              <div
                                className="text-sm mt-1"
                                style={{ color: "var(--fg-3)" }}
                              >
                                {redemption.points_spent.toLocaleString()} points spent ·{" "}
                                {formatDate(redemption.created_at)}
                              </div>
                              {redemption.redemption_code && (
                                <div className="mt-1.5">
                                  <span
                                    className="font-mono text-xs px-2 py-1 rounded-(--r-1)"
                                    style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}
                                  >
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
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MemberDashboardShell>
  );
}
