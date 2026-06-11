"use client";

import { useEffect, useMemo, useState } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import { OrganizationContextBanner } from "@/components/ds/OrganizationContextBanner";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAssignmentRules } from "@/hooks/useAssignmentRules";
import {
  AssignmentStrategy,
  ClientTier,
  type AssignmentRule,
  type CreateAssignmentRuleRequest,
  type UpdateAssignmentRuleRequest,
} from "@/lib/types";

function strategyLabel(strategy: AssignmentStrategy): string {
  const labels: Record<AssignmentStrategy, string> = {
    [AssignmentStrategy.ROUND_ROBIN]: "Round Robin",
    [AssignmentStrategy.FIRST_AVAILABLE]: "First Available",
    [AssignmentStrategy.LEAST_LOADED]: "Least Loaded",
  };
  return labels[strategy];
}

export default function AssignmentRulesPage() {
  const { organizations, currentOrg } = useOrganization();
  const orgId = currentOrg?._id;

  const { rules, isLoading, error, loadRules, createRule, updateRule, deleteRule } =
    useAssignmentRules(orgId ?? "");

  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [priority, setPriority] = useState(100);
  const [minAmount, setMinAmount] = useState<number | null>(null);
  const [strategy, setStrategy] = useState<AssignmentStrategy>(
    AssignmentStrategy.ROUND_ROBIN,
  );
  const [staffIds, setStaffIds] = useState<string>("");
  const [selectedTiers, setSelectedTiers] = useState<ClientTier[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<string>("");

  useEffect(() => {
    if (orgId) {
      void loadRules();
    }
  }, [orgId, loadRules]);

  const strategyOptions = useMemo(
    () => [
      { label: "Round Robin", value: AssignmentStrategy.ROUND_ROBIN },
      { label: "First Available", value: AssignmentStrategy.FIRST_AVAILABLE },
      { label: "Least Loaded", value: AssignmentStrategy.LEAST_LOADED },
    ],
    [],
  );

  const tierOptions = useMemo(
    () => [
      { label: "Standard", value: ClientTier.STANDARD },
      { label: "VIP", value: ClientTier.VIP },
      { label: "Premium", value: ClientTier.PREMIUM },
    ],
    [],
  );

  const sortedRules = useMemo(
    () => [...rules].sort((a, b) => a.priority - b.priority),
    [rules],
  );

  function resetForm() {
    setName("");
    setDescription("");
    setIsActive(true);
    setPriority(100);
    setMinAmount(null);
    setStrategy(AssignmentStrategy.ROUND_ROBIN);
    setStaffIds("");
    setSelectedTiers([]);
    setSelectedPlans("");
    setFormError(null);
    setFormSuccess(null);
  }

  function startCreate() {
    resetForm();
    setEditingId(null);
    setFormMode("create");
  }

  function startEdit(rule: AssignmentRule) {
    setName(rule.name);
    setDescription(rule.description || "");
    setIsActive(rule.is_active);
    setPriority(rule.priority);
    setMinAmount(rule.min_amount ?? null);
    setStrategy(rule.strategy);
    setStaffIds(rule.staff_user_ids.join(","));
    setSelectedTiers(rule.client_tiers || []);
    setSelectedPlans((rule.plan_ids || []).join(","));
    setEditingId(rule._id);
    setFormMode("edit");
    setFormError(null);
    setFormSuccess(null);
  }

  function cancelForm() {
    setFormMode(null);
    resetForm();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!name.trim()) {
      setFormError("Rule name is required");
      return;
    }

    if (priority < 0 || priority > 10000) {
      setFormError("Priority must be between 0 and 10000");
      return;
    }

    const parsedStaffIds = staffIds
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id);

    if (parsedStaffIds.length === 0) {
      setFormError("At least one staff member ID is required");
      return;
    }

    const parsedPlanIds = selectedPlans
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id);

    const data: CreateAssignmentRuleRequest = {
      name: name.trim(),
      description: description.trim() || undefined,
      is_active: isActive,
      priority,
      min_amount: minAmount ?? undefined,
      strategy,
      staff_user_ids: parsedStaffIds,
      client_tiers: selectedTiers.length > 0 ? selectedTiers : undefined,
      plan_ids: parsedPlanIds.length > 0 ? parsedPlanIds : undefined,
    };

    if (formMode === "create") {
      const success = await createRule(data);
      if (success) {
        setFormSuccess("Rule created successfully");
        resetForm();
        setFormMode(null);
      } else {
        setFormError("Failed to create rule. Please try again.");
      }
    } else if (formMode === "edit" && editingId) {
      const update: UpdateAssignmentRuleRequest = {
        name: data.name,
        description: data.description,
        is_active: data.is_active,
        priority: data.priority,
        min_amount: data.min_amount,
        strategy: data.strategy,
        staff_user_ids: data.staff_user_ids,
        client_tiers: data.client_tiers,
        plan_ids: data.plan_ids,
      };
      const success = await updateRule(editingId, update);
      if (success) {
        setFormSuccess("Rule updated successfully");
        resetForm();
        setFormMode(null);
      } else {
        setFormError("Failed to update rule. Please try again.");
      }
    }
  }

  async function handleDelete(ruleId: string) {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    const success = await deleteRule(ruleId);
    if (success) {
      setFormSuccess("Rule deleted successfully");
    } else {
      setFormError("Failed to delete rule");
    }
  }

  if (!currentOrg) {
    return (
      <MemberDashboardShell activeLabel="Home">
        <div className="flex flex-col gap-5">
          <OrganizationContextBanner
            label="Assignment organization"
            helperText="Assignment rules are scoped per organization. Select a workspace to continue."
            organizations={organizations}
            currentOrg={null}
            onChange={() => {}}
          />
          <div
            className="rounded-(--r-3) p-4"
            style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
          >
            <p className="text-sm" style={{ color: "var(--fg-2)" }}>
              Please select an organization to view assignment rules.
            </p>
          </div>
        </div>
      </MemberDashboardShell>
    );
  }

  return (
    <MemberDashboardShell activeLabel="Home">
      <div className="flex flex-col gap-5">
        <OrganizationContextBanner
          label="Assignment organization"
          helperText="Assignment rules are scoped per organization."
          organizations={organizations}
          currentOrg={currentOrg}
          onChange={() => {}}
        />

        <div>
          <div
            className="font-mono text-[11px] uppercase tracking-[0.06em]"
            style={{ color: "var(--fg-3)" }}
          >
            Workspace
          </div>
          <h1
            className="text-[30px] font-medium mt-1"
            style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            Assignment rules
          </h1>
          <p className="text-sm mt-2" style={{ color: "var(--fg-3)" }}>
            Configure auto-routing strategies to assign new subscribers to staff
            based on tier, amount, and availability.
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

        {formSuccess && (
          <div
            className="rounded-(--r-3) p-3 text-sm"
            style={{ border: "1px solid var(--signal)", background: "var(--signal-soft)", color: "var(--signal)" }}
          >
            {formSuccess}
          </div>
        )}

        <section
          className="rounded-(--r-3) p-4"
          style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>
              Active rules ({sortedRules.filter((r) => r.is_active).length})
            </h2>
            {formMode === null && (
              <button
                type="button"
                onClick={startCreate}
                className="rounded-(--r-2) px-4 py-2 text-sm font-medium"
                style={{
                  background: "var(--ink)",
                  color: "var(--bg)",
                  cursor: "pointer",
                }}
              >
                Add rule
              </button>
            )}
          </div>

          {isLoading ? (
            <p className="text-sm mt-4" style={{ color: "var(--fg-3)" }}>
              Loading rules...
            </p>
          ) : sortedRules.length === 0 ? (
            <p className="text-sm mt-4" style={{ color: "var(--fg-3)" }}>
              No assignment rules yet. Create one to start auto-routing.
            </p>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full min-w-[1000px] border-collapse text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                      Name
                    </th>
                    <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                      Strategy
                    </th>
                    <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                      Priority
                    </th>
                    <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                      Min Amount
                    </th>
                    <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                      Staff
                    </th>
                    <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                      Status
                    </th>
                    <th className="text-left py-2" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRules.map((rule) => (
                    <tr key={rule._id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="py-3 pr-4" style={{ color: "var(--ink)" }}>
                        <div>{rule.name}</div>
                        {rule.description && (
                          <div className="text-xs" style={{ color: "var(--fg-3)" }}>
                            {rule.description.substring(0, 40)}...
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4" style={{ color: "var(--fg-2)" }}>
                        {strategyLabel(rule.strategy)}
                      </td>
                      <td className="py-3 pr-4" style={{ color: "var(--fg-2)" }}>
                        <span
                          className="font-mono"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {rule.priority}
                        </span>
                      </td>
                      <td className="py-3 pr-4" style={{ color: "var(--fg-2)" }}>
                        {rule.min_amount ? `$${rule.min_amount}` : "-"}
                      </td>
                      <td className="py-3 pr-4" style={{ color: "var(--fg-2)" }}>
                        <span
                          className="font-mono text-xs"
                          style={{ fontVariantNumeric: "tabular-nums" }}
                        >
                          {rule.staff_user_ids.length} staff
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className="font-mono text-xs uppercase tracking-wider rounded-(--r-2) px-2 py-1"
                          style={{
                            background: rule.is_active
                              ? "var(--signal-soft)"
                              : "var(--bg-2)",
                            color: rule.is_active ? "var(--signal)" : "var(--fg-3)",
                          }}
                        >
                          {rule.is_active ? "active" : "inactive"}
                        </span>
                      </td>
                      <td className="py-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(rule)}
                          className="rounded-(--r-2) border px-3 py-1.5 text-xs"
                          style={{
                            borderColor: "var(--border)",
                            color: "var(--fg-2)",
                            background: "transparent",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rule._id)}
                          className="rounded-(--r-2) border px-3 py-1.5 text-xs"
                          style={{
                            borderColor: "var(--danger)",
                            color: "var(--danger)",
                            background: "transparent",
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {formMode && (
          <section
            className="rounded-(--r-3) p-4"
            style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
          >
            <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>
              {formMode === "create" ? "Create new rule" : "Edit rule"}
            </h2>

            {formError && (
              <div
                className="mt-4 rounded-(--r-2) p-3 text-sm"
                style={{ border: "1px solid var(--danger)", background: "var(--danger-soft)", color: "var(--danger)" }}
              >
                {formError}
              </div>
            )}

            <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                    style={{ color: "var(--fg-3)" }}
                  >
                    Rule name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Premium Members"
                    className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                  />
                </div>

                <div>
                  <label
                    className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                    style={{ color: "var(--fg-3)" }}
                  >
                    Strategy *
                  </label>
                  <div className="mt-1.5">
                    <SearchableSelect
                      value={strategy}
                      onChange={(v) => setStrategy(v as AssignmentStrategy)}
                      options={strategyOptions}
                      placeholder="Select strategy"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                  style={{ color: "var(--fg-3)" }}
                >
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this assignment rule..."
                  className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                    style={{ color: "var(--fg-3)" }}
                  >
                    Priority (0-10000)
                  </label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    min="0"
                    max="10000"
                    className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                  />
                </div>

                <div>
                  <label
                    className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                    style={{ color: "var(--fg-3)" }}
                  >
                    Min Amount ($)
                  </label>
                  <input
                    type="number"
                    value={minAmount ?? ""}
                    onChange={(e) => setMinAmount(e.target.value ? Number(e.target.value) : null)}
                    placeholder="Optional"
                    className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                  />
                </div>

                <div>
                  <label
                    className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                    style={{ color: "var(--fg-3)" }}
                  >
                    Status
                  </label>
                  <select
                    value={isActive ? "active" : "inactive"}
                    onChange={(e) => setIsActive(e.target.value === "active")}
                    className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                  style={{ color: "var(--fg-3)" }}
                >
                  Staff IDs (comma-separated) *
                </label>
                <textarea
                  value={staffIds}
                  onChange={(e) => setStaffIds(e.target.value)}
                  placeholder="user_id_1, user_id_2, user_id_3"
                  className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm font-mono"
                  style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                    style={{ color: "var(--fg-3)" }}
                  >
                    Client Tiers (optional)
                  </label>
                  <div className="mt-1.5 flex gap-2 flex-wrap">
                    {tierOptions.map((tier) => (
                      <label
                        key={tier.value}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-(--r-2) border cursor-pointer"
                        style={{
                          borderColor: selectedTiers.includes(tier.value as ClientTier)
                            ? "var(--ink)"
                            : "var(--border)",
                          background: selectedTiers.includes(tier.value as ClientTier)
                            ? "var(--ink)"
                            : "transparent",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedTiers.includes(tier.value as ClientTier)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTiers([
                                ...selectedTiers,
                                tier.value as ClientTier,
                              ]);
                            } else {
                              setSelectedTiers(
                                selectedTiers.filter((t) => t !== tier.value),
                              );
                            }
                          }}
                          style={{ cursor: "pointer" }}
                        />
                        <span
                          className="text-sm"
                          style={{
                            color: selectedTiers.includes(tier.value as ClientTier)
                              ? "var(--bg)"
                              : "var(--ink)",
                          }}
                        >
                          {tier.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                    style={{ color: "var(--fg-3)" }}
                  >
                    Plan IDs (comma-separated, optional)
                  </label>
                  <textarea
                    value={selectedPlans}
                    onChange={(e) => setSelectedPlans(e.target.value)}
                    placeholder="plan_id_1, plan_id_2"
                    className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm font-mono"
                    style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="rounded-(--r-2) px-4 py-2 text-sm font-medium"
                  style={{
                    background: "var(--ink)",
                    color: "var(--bg)",
                    cursor: "pointer",
                  }}
                >
                  {formMode === "create" ? "Create rule" : "Update rule"}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="rounded-(--r-2) border px-4 py-2 text-sm"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--fg-2)",
                    background: "transparent",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}
      </div>
    </MemberDashboardShell>
  );
}
