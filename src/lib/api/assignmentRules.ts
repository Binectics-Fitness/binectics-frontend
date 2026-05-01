/**
 * Assignment Rules API Service
 * Routes are scoped to an organization (gym / trainer org / dietitian org).
 */

import { apiClient } from "./client";
import type {
  ApiResponse,
  AssignmentRule,
  CreateAssignmentRuleRequest,
  UpdateAssignmentRuleRequest,
} from "@/lib/types";

export const assignmentRulesService = {
  list: (organizationId: string): Promise<ApiResponse<AssignmentRule[]>> =>
    apiClient.get<AssignmentRule[]>(
      `/marketplace/organizations/${organizationId}/assignment-rules`,
    ),

  get: (
    organizationId: string,
    ruleId: string,
  ): Promise<ApiResponse<AssignmentRule>> =>
    apiClient.get<AssignmentRule>(
      `/marketplace/organizations/${organizationId}/assignment-rules/${ruleId}`,
    ),

  create: (
    organizationId: string,
    data: CreateAssignmentRuleRequest,
  ): Promise<ApiResponse<AssignmentRule>> =>
    apiClient.post<AssignmentRule>(
      `/marketplace/organizations/${organizationId}/assignment-rules`,
      data,
    ),

  update: (
    organizationId: string,
    ruleId: string,
    data: UpdateAssignmentRuleRequest,
  ): Promise<ApiResponse<AssignmentRule>> =>
    apiClient.patch<AssignmentRule>(
      `/marketplace/organizations/${organizationId}/assignment-rules/${ruleId}`,
      data,
    ),

  remove: (
    organizationId: string,
    ruleId: string,
  ): Promise<ApiResponse<void>> =>
    apiClient.delete<void>(
      `/marketplace/organizations/${organizationId}/assignment-rules/${ruleId}`,
    ),
};
