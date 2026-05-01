"use client";

import { useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import {
  LoyaltyEventType,
  LoyaltyRedemptionStatus,
  UserRole,
  type LoyaltyPointsTransaction,
  type LoyaltyRedemption,
  type LoyaltyReward,
} from "@/lib/types";
import {
  useLoyaltyBalance,
  useLoyaltyHistory,
  useLoyaltyRewards,
  useMyLoyaltyRedemptions,
  useRedeemReward,
} from "@/lib/queries/loyalty";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const EVENT_LABEL: Record<LoyaltyEventType, string> = {
  [LoyaltyEventType.SUBSCRIPTION_PURCHASE]: "Subscription purchase",
  [LoyaltyEventType.GYM_CHECK_IN]: "Gym check-in",
  [LoyaltyEventType.JOURNAL_LOGGED]: "Journal entry",
  [LoyaltyEventType.REWARD_REDEMPTION]: "Reward redemption",
  [LoyaltyEventType.ADMIN_ADJUSTMENT]: "Admin adjustment",
  [LoyaltyEventType.SIGNUP_BONUS]: "Signup bonus",
};

const REDEMPTION_BADGE: Record<LoyaltyRedemptionStatus, string> = {
  [LoyaltyRedemptionStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [LoyaltyRedemptionStatus.FULFILLED]: "bg-primary-100 text-primary-700",
  [LoyaltyRedemptionStatus.CANCELLED]: "bg-neutral-100 text-neutral-700",
};

function getRewardName(redemption: LoyaltyRedemption): string {
  if (
    typeof redemption.reward_id === "object" &&
    redemption.reward_id !== null
  ) {
    return (redemption.reward_id as LoyaltyReward).name;
  }
  return "Reward";
}

export default function LoyaltyPage() {
  const { isLoading, isAuthorized } = useRoleGuard(UserRole.USER);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  const { data: balanceData, isLoading: balanceLoading } = useLoyaltyBalance(
    !isLoading && isAuthorized,
  );
  const { data: rewards = [], isLoading: rewardsLoading } = useLoyaltyRewards(
    undefined,
    !isLoading && isAuthorized,
  );
  const { data: history = [], isLoading: historyLoading } = useLoyaltyHistory(
    25,
    0,
    !isLoading && isAuthorized,
  );
  const { data: redemptions = [], isLoading: redemptionsLoading } =
    useMyLoyaltyRedemptions(!isLoading && isAuthorized);

  const redeem = useRedeemReward();
  const balance = balanceData?.balance ?? 0;

  const handleRedeem = async (reward: LoyaltyReward) => {
    setRedeemError(null);
    setRedeemSuccess(null);
    if (balance < reward.points_cost) {
      setRedeemError("You don't have enough points for this reward.");
      return;
    }
    const res = await redeem.mutateAsync(reward._id);
    if (res.success) {
      setRedeemSuccess(`Redeemed "${reward.name}" successfully!`);
    } else {
      setRedeemError(res.message || "Could not redeem reward. Please try again.");
    }
  };

  if (isLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground mb-2">
              Loyalty & Rewards
            </h1>
            <p className="text-foreground/60">
              Earn points for subscriptions, check-ins, and journal logs. Redeem
              them for exclusive rewards.
            </p>
          </div>

          {/* Balance card */}
          <div className="mb-8 rounded-2xl bg-accent-yellow-500 p-6 sm:p-8 shadow-[var(--shadow-card)]">
            <p className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Your balance
            </p>
            <p className="mt-2 text-5xl font-black text-foreground">
              {balanceLoading ? "—" : balance.toLocaleString()}
              <span className="ml-2 text-lg font-semibold text-foreground/70">
                points
              </span>
            </p>
            <p className="mt-3 text-sm text-foreground/70">
              Earn 0.1 points per $1 on subscriptions, 10 points per check-in,
              and 5 points per journal entry.
            </p>
          </div>

          {/* Feedback banners */}
          {redeemError && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {redeemError}
            </div>
          )}
          {redeemSuccess && (
            <div className="mb-4 rounded-lg bg-primary-50 border border-primary-200 px-4 py-3 text-sm text-primary-700">
              {redeemSuccess}
            </div>
          )}

          {/* Rewards */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Available rewards
            </h2>
            {rewardsLoading ? (
              <p className="text-sm text-foreground/60">Loading rewards…</p>
            ) : rewards.length === 0 ? (
              <EmptyState
                accent="yellow"
                compact
                title="No rewards yet"
                description="Check back soon — new rewards are added regularly."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rewards.map((reward) => {
                  const canAfford = balance >= reward.points_cost;
                  const soldOut =
                    reward.max_redemptions != null &&
                    reward.redemption_count >= reward.max_redemptions;
                  return (
                    <div
                      key={reward._id}
                      className="bg-white rounded-2xl shadow-[var(--shadow-card)] overflow-hidden flex flex-col"
                    >
                      {reward.image_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={reward.image_url}
                          alt={reward.name}
                          className="w-full h-32 object-cover"
                        />
                      )}
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-bold text-foreground">
                          {reward.name}
                        </h3>
                        {reward.description && (
                          <p className="mt-1 text-sm text-foreground/60 line-clamp-3">
                            {reward.description}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-lg font-black text-accent-yellow-700">
                            {reward.points_cost.toLocaleString()}
                          </span>
                          <span className="text-xs font-medium text-foreground/60">
                            points
                          </span>
                        </div>
                        <div className="mt-4 mt-auto pt-3">
                          <Button
                            variant="accent-yellow"
                            size="sm"
                            fullWidth
                            disabled={
                              !canAfford ||
                              soldOut ||
                              redeem.isPending ||
                              !reward.is_active
                            }
                            isLoading={
                              redeem.isPending && redeem.variables === reward._id
                            }
                            onClick={() => handleRedeem(reward)}
                          >
                            {soldOut
                              ? "Sold out"
                              : !reward.is_active
                                ? "Unavailable"
                                : !canAfford
                                  ? `Need ${(reward.points_cost - balance).toLocaleString()} more`
                                  : "Redeem"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Redemptions */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-foreground mb-4">
              My redemptions
            </h2>
            {redemptionsLoading ? (
              <p className="text-sm text-foreground/60">Loading…</p>
            ) : redemptions.length === 0 ? (
              <EmptyState
                accent="purple"
                compact
                title="No redemptions yet"
                description="Once you redeem a reward, it will appear here with a redemption code."
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] overflow-hidden">
                <ul className="divide-y divide-neutral-100">
                  {redemptions.map((r) => (
                    <li
                      key={r._id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                    >
                      <div>
                        <p className="font-semibold text-foreground">
                          {getRewardName(r)}
                        </p>
                        <p className="text-xs text-foreground/60 mt-0.5">
                          {formatDate(r.created_at)} ·{" "}
                          {r.points_spent.toLocaleString()} points
                          {r.redemption_code && (
                            <>
                              {" · Code: "}
                              <span className="font-mono text-foreground">
                                {r.redemption_code}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${REDEMPTION_BADGE[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* History */}
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">
              Recent activity
            </h2>
            {historyLoading ? (
              <p className="text-sm text-foreground/60">Loading…</p>
            ) : history.length === 0 ? (
              <EmptyState
                accent="blue"
                compact
                title="No activity yet"
                description="Subscribe to a plan or check into a gym to start earning points."
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] overflow-hidden">
                <ul className="divide-y divide-neutral-100">
                  {history.map((tx: LoyaltyPointsTransaction) => (
                    <li
                      key={tx._id}
                      className="p-4 sm:p-5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {EVENT_LABEL[tx.event_type] ?? tx.event_type}
                        </p>
                        <p className="text-xs text-foreground/60 mt-0.5">
                          {formatDate(tx.created_at)}
                          {tx.note ? ` · ${tx.note}` : ""}
                        </p>
                      </div>
                      <p
                        className={`text-sm font-bold ${tx.points >= 0 ? "text-primary-700" : "text-red-600"}`}
                      >
                        {tx.points >= 0 ? "+" : ""}
                        {tx.points.toLocaleString()}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
