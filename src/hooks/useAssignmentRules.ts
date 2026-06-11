import { useState, useCallback } from "react";
import { assignmentRulesService } from "@/lib/api/assignmentRules";
import type {
  AssignmentRule,
  CreateAssignmentRuleRequest,
  UpdateAssignmentRuleRequest,
} from "@/lib/types";

export function useAssignmentRules(organizationId: string) {
  const [rules, setRules] = useState<AssignmentRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRules = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await assignmentRulesService.list(organizationId);
      if (response.success && Array.isArray(response.data)) {
        setRules(response.data);
      } else {
        setError("Failed to load assignment rules");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  const createRule = useCallback(
    async (data: CreateAssignmentRuleRequest) => {
      if (!organizationId) return false;

      try {
        const response = await assignmentRulesService.create(organizationId, {
          ...data,
          strategy: data.strategy,
        });
        if (response.success && response.data) {
          setRules((prev) => [...prev, response.data as AssignmentRule]);
          return true;
        }
        setError("Failed to create rule");
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      }
    },
    [organizationId],
  );

  const updateRule = useCallback(
    async (ruleId: string, data: UpdateAssignmentRuleRequest) => {
      if (!organizationId) return false;

      try {
        const response = await assignmentRulesService.update(
          organizationId,
          ruleId,
          data,
        );
        if (response.success && response.data) {
          setRules((prev) =>
            prev.map((r) => (r._id === ruleId ? response.data : r)),
          );
          return true;
        }
        setError("Failed to update rule");
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      }
    },
    [organizationId],
  );

  const deleteRule = useCallback(
    async (ruleId: string) => {
      if (!organizationId) return false;

      try {
        const response = await assignmentRulesService.remove(
          organizationId,
          ruleId,
        );
        if (response.success) {
          setRules((prev) => prev.filter((r) => r._id !== ruleId));
          return true;
        }
        setError("Failed to delete rule");
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      }
    },
    [organizationId],
  );

  return {
    rules,
    isLoading,
    error,
    loadRules,
    createRule,
    updateRule,
    deleteRule,
  };
}
