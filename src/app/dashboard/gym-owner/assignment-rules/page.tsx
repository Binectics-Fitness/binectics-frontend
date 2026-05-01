"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLoading from "@/components/DashboardLoading";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import SearchableSelect from "@/components/SearchableSelect";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/Button";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { teamsService, type OrganizationMember } from "@/lib/api/teams";
import { useOrgMembershipPlans } from "@/lib/queries/marketplace";
import {
  useAssignmentRules,
  useCreateAssignmentRule,
  useDeleteAssignmentRule,
  useUpdateAssignmentRule,
} from "@/lib/queries/assignmentRules";
import {
  AssignmentStrategy,
  ClientTier,
  type AssignmentRule,
  type CreateAssignmentRuleRequest,
} from "@/lib/types";

const STRATEGY_OPTIONS: { label: string; value: AssignmentStrategy }[] = [
  { label: "Round robin (rotate evenly)", value: AssignmentStrategy.ROUND_ROBIN },
  {
    label: "First available (top of list)",
    value: AssignmentStrategy.FIRST_AVAILABLE,
  },
  { label: "Least loaded", value: AssignmentStrategy.LEAST_LOADED },
];

const TIER_LABEL: Record<ClientTier, string> = {
  [ClientTier.STANDARD]: "Standard",
  [ClientTier.VIP]: "VIP ($100+)",
  [ClientTier.PREMIUM]: "Premium ($500+)",
};

interface RuleFormState {
  name: string;
  description: string;
  is_active: boolean;
  priority: string;
  min_amount: string;
  plan_ids: string[];
  client_tiers: ClientTier[];
  strategy: AssignmentStrategy;
  staff_user_ids: string[];
}

const EMPTY_FORM: RuleFormState = {
  name: "",
  description: "",
  is_active: true,
  priority: "100",
  min_amount: "",
  plan_ids: [],
  client_tiers: [],
  strategy: AssignmentStrategy.ROUND_ROBIN,
  staff_user_ids: [],
};

function ruleToForm(r: AssignmentRule): RuleFormState {
  return {
    name: r.name,
    description: r.description ?? "",
    is_active: r.is_active,
    priority: String(r.priority),
    min_amount: r.min_amount != null ? String(r.min_amount) : "",
    plan_ids: r.plan_ids ?? [],
    client_tiers: r.client_tiers ?? [],
    strategy: r.strategy,
    staff_user_ids: r.staff_user_ids ?? [],
  };
}

function formToPayload(
  form: RuleFormState,
): CreateAssignmentRuleRequest | null {
  const priority = Number(form.priority);
  if (!form.name.trim() || !Number.isFinite(priority)) return null;
  if (form.staff_user_ids.length === 0) return null;
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    is_active: form.is_active,
    priority,
    min_amount: form.min_amount ? Number(form.min_amount) : undefined,
    plan_ids: form.plan_ids,
    client_tiers: form.client_tiers,
    strategy: form.strategy,
    staff_user_ids: form.staff_user_ids,
  };
}

function getMemberUser(member: OrganizationMember) {
  return typeof member.user_id === "object" && member.user_id !== null
    ? member.user_id
    : null;
}

export default function AssignmentRulesPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth();
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const orgId = currentOrg?._id;

  const { data: rules = [], isLoading: rulesLoading } = useAssignmentRules(
    orgId,
    !authLoading && isAuthenticated && !orgLoading,
  );
  const { data: plans = [] } = useOrgMembershipPlans(orgId, !!orgId);
  const createRule = useCreateAssignmentRule(orgId ?? "");
  const updateRule = useUpdateAssignmentRule(orgId ?? "");
  const deleteRule = useDeleteAssignmentRule(orgId ?? "");

  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [form, setForm] = useState<RuleFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    let cancelled = false;
    (async () => {
      const res = await teamsService.getMembers(orgId);
      if (!cancelled && res.success && res.data) {
        setMembers(res.data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId]);

  const staffOptions = useMemo(
    () =>
      members
        .map((m) => {
          const u = getMemberUser(m);
          if (!u) return null;
          return {
            id: u._id,
            label: `${u.first_name} ${u.last_name}`.trim() || u.email,
            email: u.email,
          };
        })
        .filter((x): x is { id: string; label: string; email: string } =>
          Boolean(x),
        ),
    [members],
  );

  const planOptions = useMemo(
    () =>
      plans.map((p) => ({
        id: p._id,
        label: p.name,
        priceLabel: `${p.currency} ${p.price}`,
      })),
    [plans],
  );

  const planLookup = useMemo(() => {
    const map = new Map<string, string>();
    plans.forEach((p) => map.set(p._id, p.name));
    return map;
  }, [plans]);

  const staffLookup = useMemo(() => {
    const map = new Map<string, string>();
    staffOptions.forEach((s) => map.set(s.id, s.label));
    return map;
  }, [staffOptions]);

  const handleEdit = (rule: AssignmentRule) => {
    setEditingId(rule._id);
    setForm(ruleToForm(rule));
    setFormError(null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const togglePlan = (planId: string) => {
    setForm((f) => ({
      ...f,
      plan_ids: f.plan_ids.includes(planId)
        ? f.plan_ids.filter((id) => id !== planId)
        : [...f.plan_ids, planId],
    }));
  };

  const toggleTier = (tier: ClientTier) => {
    setForm((f) => ({
      ...f,
      client_tiers: f.client_tiers.includes(tier)
        ? f.client_tiers.filter((t) => t !== tier)
        : [...f.client_tiers, tier],
    }));
  };

  const toggleStaff = (userId: string) => {
    setForm((f) => ({
      ...f,
      staff_user_ids: f.staff_user_ids.includes(userId)
        ? f.staff_user_ids.filter((id) => id !== userId)
        : [...f.staff_user_ids, userId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!orgId) return;
    const payload = formToPayload(form);
    if (!payload) {
      setFormError(
        "Please provide a name, valid priority, and at least one staff member.",
      );
      return;
    }
    const res = editingId
      ? await updateRule.mutateAsync({ ruleId: editingId, data: payload })
      : await createRule.mutateAsync(payload);
    if (res.success) {
      handleCancelEdit();
    } else {
      setFormError(res.message || "Could not save rule.");
    }
  };

  const handleDelete = async (ruleId: string) => {
    if (!confirm("Delete this assignment rule? This cannot be undone.")) return;
    await deleteRule.mutateAsync(ruleId);
    if (editingId === ruleId) handleCancelEdit();
  };

  if (authLoading || orgLoading) return <DashboardLoading />;
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground mb-2">
              Assignment Rules
            </h1>
            <p className="text-foreground/60">
              Automatically assign new members to staff based on their plan,
              tier, or amount paid. Rules are evaluated in priority order
              (lowest number first).
            </p>
          </div>

          {!orgId ? (
            <EmptyState
              accent="blue"
              compact
              title="Select an organization"
              description="Switch to a gym in the sidebar to manage assignment rules."
            />
          ) : (
            <>
              {/* Form */}
              <section className="mb-10 bg-white rounded-2xl shadow-[var(--shadow-card)] p-6">
                <h2 className="text-lg font-bold text-foreground mb-4">
                  {editingId ? "Edit rule" : "Create new rule"}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-5">
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
                        placeholder="e.g. VIP members → Coach Sarah"
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Priority *
                      </label>
                      <input
                        type="number"
                        value={form.priority}
                        onChange={(e) =>
                          setForm({ ...form, priority: e.target.value })
                        }
                        required
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                      />
                      <p className="mt-1 text-xs text-foreground/60">
                        Lower numbers run first.
                      </p>
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
                      rows={2}
                      className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Strategy *
                      </label>
                      <SearchableSelect
                        value={form.strategy}
                        onChange={(val) =>
                          setForm({
                            ...form,
                            strategy: val as AssignmentStrategy,
                          })
                        }
                        options={STRATEGY_OPTIONS}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Min amount (optional)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.min_amount}
                        onChange={(e) =>
                          setForm({ ...form, min_amount: e.target.value })
                        }
                        placeholder="No minimum"
                        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                      />
                    </div>
                  </div>

                  {/* Client tiers */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Client tiers (optional — leave empty for all)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(ClientTier).map((tier) => {
                        const checked = form.client_tiers.includes(tier);
                        return (
                          <button
                            type="button"
                            key={tier}
                            onClick={() => toggleTier(tier)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                              checked
                                ? "bg-accent-blue-500 text-white border-accent-blue-500"
                                : "bg-white text-foreground border-neutral-300 hover:bg-neutral-50"
                            }`}
                          >
                            {TIER_LABEL[tier]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Plans */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Membership plans (optional — leave empty for all)
                    </label>
                    {planOptions.length === 0 ? (
                      <p className="text-sm text-foreground/60">
                        No membership plans yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-neutral-200 rounded-lg">
                        {planOptions.map((p) => (
                          <label
                            key={p.id}
                            className="flex items-start gap-2 p-2 rounded hover:bg-neutral-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={form.plan_ids.includes(p.id)}
                              onChange={() => togglePlan(p.id)}
                              className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {p.label}
                              </p>
                              <p className="text-xs text-foreground/60">
                                {p.priceLabel}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Staff */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Eligible staff *
                    </label>
                    {staffOptions.length === 0 ? (
                      <p className="text-sm text-foreground/60">
                        Add team members in the Staff page first.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-neutral-200 rounded-lg">
                        {staffOptions.map((s) => (
                          <label
                            key={s.id}
                            className="flex items-start gap-2 p-2 rounded hover:bg-neutral-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={form.staff_user_ids.includes(s.id)}
                              onChange={() => toggleStaff(s.id)}
                              className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                            />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {s.label}
                              </p>
                              <p className="text-xs text-foreground/60">
                                {s.email}
                              </p>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
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
                    Active
                  </label>

                  {formError && (
                    <p className="text-sm text-red-600">{formError}</p>
                  )}

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={createRule.isPending || updateRule.isPending}
                    >
                      {editingId ? "Save changes" : "Create rule"}
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

              {/* Rules list */}
              <section>
                <h2 className="text-lg font-bold text-foreground mb-4">
                  Active rules
                </h2>
                {rulesLoading ? (
                  <p className="text-sm text-foreground/60">Loading…</p>
                ) : rules.length === 0 ? (
                  <EmptyState
                    accent="blue"
                    compact
                    title="No assignment rules yet"
                    description="Create your first rule using the form above. New members will be auto-assigned based on the matching rule."
                  />
                ) : (
                  <div className="space-y-3">
                    {[...rules]
                      .sort((a, b) => a.priority - b.priority)
                      .map((rule) => (
                        <div
                          key={rule._id}
                          className="bg-white rounded-2xl shadow-[var(--shadow-card)] p-5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-foreground">
                                  {rule.name}
                                </h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-accent-blue-50 text-accent-blue-700 font-semibold">
                                  Priority {rule.priority}
                                </span>
                                {!rule.is_active && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              {rule.description && (
                                <p className="mt-1 text-sm text-foreground/70">
                                  {rule.description}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                variant="outline-neutral"
                                size="sm"
                                onClick={() => handleEdit(rule)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(rule._id)}
                                isLoading={
                                  deleteRule.isPending &&
                                  deleteRule.variables === rule._id
                                }
                              >
                                Delete
                              </Button>
                            </div>
                          </div>

                          <dl className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <dt className="text-xs uppercase text-foreground/50 font-semibold">
                                Strategy
                              </dt>
                              <dd className="text-foreground">
                                {STRATEGY_OPTIONS.find(
                                  (s) => s.value === rule.strategy,
                                )?.label ?? rule.strategy}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase text-foreground/50 font-semibold">
                                Min amount
                              </dt>
                              <dd className="text-foreground">
                                {rule.min_amount != null
                                  ? rule.min_amount
                                  : "Any"}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase text-foreground/50 font-semibold">
                                Tiers
                              </dt>
                              <dd className="text-foreground">
                                {rule.client_tiers.length === 0
                                  ? "All"
                                  : rule.client_tiers
                                      .map((t) => TIER_LABEL[t])
                                      .join(", ")}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-xs uppercase text-foreground/50 font-semibold">
                                Plans
                              </dt>
                              <dd className="text-foreground">
                                {rule.plan_ids.length === 0
                                  ? "All"
                                  : rule.plan_ids
                                      .map((id) => planLookup.get(id) ?? id)
                                      .join(", ")}
                              </dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="text-xs uppercase text-foreground/50 font-semibold">
                                Staff pool ({rule.staff_user_ids.length})
                              </dt>
                              <dd className="text-foreground">
                                {rule.staff_user_ids
                                  .map((id) => staffLookup.get(id) ?? id)
                                  .join(", ") || "None"}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
