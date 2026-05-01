import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { assignmentRulesService } from "@/lib/api/assignmentRules";
import type {
  AssignmentRule,
  CreateAssignmentRuleRequest,
  UpdateAssignmentRuleRequest,
} from "@/lib/types";

export function useAssignmentRules(organizationId?: string, enabled = true) {
  return useQuery<AssignmentRule[]>({
    queryKey: queryKeys.assignmentRules.list(organizationId ?? ""),
    queryFn: async () => {
      const res = await assignmentRulesService.list(organizationId!);
      return res.success && res.data ? res.data : [];
    },
    enabled: enabled && !!organizationId,
  });
}

export function useCreateAssignmentRule(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAssignmentRuleRequest) =>
      assignmentRulesService.create(organizationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignmentRules.list(organizationId),
      });
    },
  });
}

export function useUpdateAssignmentRule(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ruleId,
      data,
    }: {
      ruleId: string;
      data: UpdateAssignmentRuleRequest;
    }) => assignmentRulesService.update(organizationId, ruleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignmentRules.list(organizationId),
      });
    },
  });
}

export function useDeleteAssignmentRule(organizationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleId: string) =>
      assignmentRulesService.remove(organizationId, ruleId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignmentRules.list(organizationId),
      });
    },
  });
}
