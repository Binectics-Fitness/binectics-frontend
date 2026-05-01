"use client";

import { useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import {
  UserRole,
  type LoyaltyReward,
  type CreateLoyaltyRewardRequest,
} from "@/lib/types";
import {
  useAdminAdjustUserPoints,
  useAdminCreateReward,
  useAdminDeleteReward,
  useAdminUpdateReward,
  useLoyaltyRewards,
} from "@/lib/queries/loyalty";

interface RewardFormState {
  name: string;
  description: string;
  points_cost: string;
  image_url: string;
  max_redemptions: string;
  is_active: boolean;
}

const EMPTY_FORM: RewardFormState = {
  name: "",
  description: "",
  points_cost: "",
  image_url: "",
  max_redemptions: "",
  is_active: true,
};

function rewardToForm(r: LoyaltyReward): RewardFormState {
  return {
    name: r.name,
    description: r.description ?? "",
    points_cost: String(r.points_cost),
    image_url: r.image_url ?? "",
    max_redemptions:
      r.max_redemptions != null ? String(r.max_redemptions) : "",
    is_active: r.is_active,
  };
}

function formToPayload(
  form: RewardFormState,
): CreateLoyaltyRewardRequest | null {
  const points = Number(form.points_cost);
  if (!form.name.trim() || !Number.isFinite(points) || points <= 0) return null;
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    points_cost: points,
    image_url: form.image_url.trim() || undefined,
    max_redemptions: form.max_redemptions
      ? Number(form.max_redemptions)
      : undefined,
    is_active: form.is_active,
  };
}

export default function AdminLoyaltyPage() {
  const { isLoading, isAuthorized } = useRoleGuard(UserRole.ADMIN);
  const { data: rewards = [], isLoading: rewardsLoading } = useLoyaltyRewards(
    undefined,
    !isLoading && isAuthorized,
  );
  const createReward = useAdminCreateReward();
  const updateReward = useAdminUpdateReward();
  const deleteReward = useAdminDeleteReward();
  const adjustPoints = useAdminAdjustUserPoints();

  const [form, setForm] = useState<RewardFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Adjust points form
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustPointsValue, setAdjustPointsValue] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustResult, setAdjustResult] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (isLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  const handleEdit = (reward: LoyaltyReward) => {
    setEditingId(reward._id);
    setForm(rewardToForm(reward));
    setFormError(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const handleSubmitReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const payload = formToPayload(form);
    if (!payload) {
      setFormError("Please provide a name and a positive points cost.");
      return;
    }
    const res = editingId
      ? await updateReward.mutateAsync({ rewardId: editingId, data: payload })
      : await createReward.mutateAsync(payload);
    if (res.success) {
      handleCancelEdit();
    } else {
      setFormError(res.message || "Could not save reward.");
    }
  };

  const handleDelete = async (rewardId: string) => {
    if (!confirm("Delete this reward? This cannot be undone.")) return;
    await deleteReward.mutateAsync(rewardId);
    if (editingId === rewardId) handleCancelEdit();
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustResult(null);
    const points = Number(adjustPointsValue);
    if (!adjustUserId.trim() || !adjustReason.trim() || !Number.isFinite(points) || points === 0) {
      setAdjustResult({
        type: "error",
        text: "User ID, non-zero points, and reason are required.",
      });
      return;
    }
    const res = await adjustPoints.mutateAsync({
      userId: adjustUserId.trim(),
      data: { points, reason: adjustReason.trim() },
    });
    if (res.success) {
      setAdjustResult({
        type: "success",
        text: `Adjusted ${points > 0 ? "+" : ""}${points} points. New balance: ${res.data?.balance_after ?? "—"}`,
      });
      setAdjustPointsValue("");
      setAdjustReason("");
    } else {
      setAdjustResult({
        type: "error",
        text: res.message || "Failed to adjust points.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <AdminSidebar />
      <div className="md:ml-64 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl">
          <h1 className="text-2xl font-bold text-foreground mb-1">
            Loyalty & Rewards
          </h1>
          <p className="text-sm text-foreground/60 mb-8">
            Manage the platform-wide reward catalog and adjust user point
            balances.
          </p>

          {/* Reward form */}
          <section className="mb-10 bg-white rounded-2xl shadow-[var(--shadow-card)] p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">
              {editingId ? "Edit reward" : "Create new reward"}
            </h2>
            <form onSubmit={handleSubmitReward} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Name *
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Points cost *
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.points_cost}
                    onChange={(e) =>
                      setForm({ ...form, points_cost: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Image URL
                  </label>
                  <input
                    value={form.image_url}
                    onChange={(e) =>
                      setForm({ ...form, image_url: e.target.value })
                    }
                    placeholder="https://..."
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Max redemptions (optional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.max_redemptions}
                    onChange={(e) =>
                      setForm({ ...form, max_redemptions: e.target.value })
                    }
                    placeholder="Unlimited"
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                />
                Active (visible to users)
              </label>
              {formError && (
                <p className="text-sm text-red-600">{formError}</p>
              )}
              <div className="flex gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={createReward.isPending || updateReward.isPending}
                >
                  {editingId ? "Save changes" : "Create reward"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline-neutral"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </section>

          {/* Rewards list */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-4">
              Reward catalog
            </h2>
            {rewardsLoading ? (
              <p className="text-sm text-foreground/60">Loading…</p>
            ) : rewards.length === 0 ? (
              <EmptyState
                accent="yellow"
                compact
                title="No rewards yet"
                description="Create your first reward using the form above."
              />
            ) : (
              <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] overflow-hidden">
                <ul className="divide-y divide-neutral-100">
                  {rewards.map((r) => (
                    <li
                      key={r._id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {r.name}
                          </p>
                          {!r.is_active && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                              Inactive
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground/60 mt-0.5">
                          {r.points_cost.toLocaleString()} points · Redeemed{" "}
                          {r.redemption_count}
                          {r.max_redemptions != null
                            ? ` / ${r.max_redemptions}`
                            : ""}{" "}
                          times
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline-neutral"
                          size="sm"
                          onClick={() => handleEdit(r)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(r._id)}
                          isLoading={
                            deleteReward.isPending &&
                            deleteReward.variables === r._id
                          }
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* Adjust points */}
          <section className="bg-white rounded-2xl shadow-[var(--shadow-card)] p-6">
            <h2 className="text-lg font-bold text-foreground mb-1">
              Manual point adjustment
            </h2>
            <p className="text-sm text-foreground/60 mb-4">
              Award or revoke points for a specific user. Use a negative number
              to deduct points.
            </p>
            <form onSubmit={handleAdjust} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  User ID *
                </label>
                <input
                  value={adjustUserId}
                  onChange={(e) => setAdjustUserId(e.target.value)}
                  required
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-mono focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Points (+ or −) *
                  </label>
                  <input
                    type="number"
                    value={adjustPointsValue}
                    onChange={(e) => setAdjustPointsValue(e.target.value)}
                    required
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Reason *
                  </label>
                  <input
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    required
                    placeholder="e.g. Goodwill credit for support issue"
                    className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                  />
                </div>
              </div>
              {adjustResult && (
                <p
                  className={`text-sm ${adjustResult.type === "success" ? "text-primary-700" : "text-red-600"}`}
                >
                  {adjustResult.text}
                </p>
              )}
              <Button
                type="submit"
                variant="primary"
                isLoading={adjustPoints.isPending}
              >
                Apply adjustment
              </Button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
