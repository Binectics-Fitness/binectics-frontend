/**
 * Teams API Service
 * Handles all Team & Role Management API calls
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

// ==================== ENUMS ====================

export enum AccountType {
  GYM_OWNER = "gym_owner",
  PERSONAL_TRAINER = "personal_trainer",
  DIETICIAN = "dietician",
  FITNESS_MEMBER = "fitness_member",
}

export enum TeamPermission {
  VIEW_MEMBERS = "team:view_members",
  INVITE_MEMBER = "team:invite_member",
  REMOVE_MEMBER = "team:remove_member",
  UPDATE_MEMBER_ROLE = "team:update_member_role",
  DEACTIVATE_MEMBER = "team:deactivate_member",
  MANAGE_ROLES = "team:manage_roles",
  MANAGE_ORGANIZATION = "team:manage_organization",
  CANCEL_INVITATION = "team:cancel_invitation",
  VIEW_INVITATIONS = "team:view_invitations",
}

export enum MemberStatus {
  PENDING = "pending",
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum InvitationStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  EXPIRED = "expired",
  CANCELLED = "cancelled",
}

// ==================== TYPES ====================

export interface Organization {
  _id: string;
  owner_id: string;
  name: string;
  description?: string;
  logo?: string;
  account_type: AccountType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TeamRole {
  _id: string;
  organization_id: string | null;
  name: string;
  code: string;
  permissions: TeamPermission[];
  is_default: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  _id: string;
  organization_id: string;
  user_id: string;
  team_role_id: string;
  status: MemberStatus;
  invited_by: string | null;
  joined_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  // Populated fields (when API joins):
  user?: {
    _id: string;
    name: string;
    email: string;
  };
  team_role?: TeamRole;
}

export interface TeamInvitation {
  _id: string;
  organization_id: string;
  email: string;
  team_role_id: string;
  status: InvitationStatus;
  expires_at: string;
  invited_by: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
  team_role?: TeamRole;
}

// ==================== REQUEST TYPES ====================

export interface CreateOrganizationRequest {
  name: string;
  description?: string;
  logo?: string;
  account_type: AccountType;
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  logo?: string;
  is_active?: boolean;
}

export interface CreateTeamRoleRequest {
  name: string;
  code: string;
  permissions: TeamPermission[];
}

export interface UpdateTeamRoleRequest {
  name?: string;
  permissions?: TeamPermission[];
}

export interface InviteMemberRequest {
  email: string;
  team_role_id: string;
}

export interface AddMemberDirectRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  team_role_id: string;
}

export interface UpdateMemberRequest {
  team_role_id?: string;
  status?: MemberStatus;
}

export interface AcceptInvitationRequest {
  token: string;
}

// ==================== SERVICE ====================

export const teamsService = {
  // ==================== ORGANIZATIONS ====================

  /** Get all organizations the current user owns or belongs to */
  async getMyOrganizations(): Promise<ApiResponse<Organization[]>> {
    return await apiClient.get<Organization[]>("/teams/organizations");
  },

  /** Create a new organization */
  async createOrganization(
    data: CreateOrganizationRequest,
  ): Promise<ApiResponse<Organization>> {
    return await apiClient.post<Organization>("/teams/organizations", data);
  },

  /** Get a single organization by ID */
  async getOrganization(
    organizationId: string,
  ): Promise<ApiResponse<Organization>> {
    return await apiClient.get<Organization>(
      `/teams/organizations/${organizationId}`,
    );
  },

  /** Update organization details */
  async updateOrganization(
    organizationId: string,
    data: UpdateOrganizationRequest,
  ): Promise<ApiResponse<Organization>> {
    return await apiClient.patch<Organization>(
      `/teams/organizations/${organizationId}`,
      data,
    );
  },

  // ==================== TEAM ROLES ====================

  /** Get all roles available for an organization (global defaults + org-specific) */
  async getRoles(organizationId: string): Promise<ApiResponse<TeamRole[]>> {
    return await apiClient.get<TeamRole[]>(
      `/teams/organizations/${organizationId}/roles`,
    );
  },

  /** Create a custom role for an organization */
  async createRole(
    organizationId: string,
    data: CreateTeamRoleRequest,
  ): Promise<ApiResponse<TeamRole>> {
    return await apiClient.post<TeamRole>(
      `/teams/organizations/${organizationId}/roles`,
      data,
    );
  },

  /** Update a custom role */
  async updateRole(
    organizationId: string,
    roleId: string,
    data: UpdateTeamRoleRequest,
  ): Promise<ApiResponse<TeamRole>> {
    return await apiClient.patch<TeamRole>(
      `/teams/organizations/${organizationId}/roles/${roleId}`,
      data,
    );
  },

  /** Delete a custom role */
  async deleteRole(
    organizationId: string,
    roleId: string,
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/teams/organizations/${organizationId}/roles/${roleId}`,
    );
  },

  // ==================== MEMBERS ====================

  /** Get all members of an organization */
  async getMembers(
    organizationId: string,
  ): Promise<ApiResponse<OrganizationMember[]>> {
    return await apiClient.get<OrganizationMember[]>(
      `/teams/organizations/${organizationId}/members`,
    );
  },

  /** Update a member's role or status */
  async updateMember(
    organizationId: string,
    memberId: string,
    data: UpdateMemberRequest,
  ): Promise<ApiResponse<OrganizationMember>> {
    return await apiClient.patch<OrganizationMember>(
      `/teams/organizations/${organizationId}/members/${memberId}`,
      data,
    );
  },

  /** Remove a member from an organization */
  async removeMember(
    organizationId: string,
    memberId: string,
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/teams/organizations/${organizationId}/members/${memberId}`,
    );
  },

  // ==================== INVITATIONS ====================

  /** Directly add a member — creates a user account if the email is new */
  async addMemberDirect(
    organizationId: string,
    data: AddMemberDirectRequest,
  ): Promise<ApiResponse<OrganizationMember>> {
    return await apiClient.post<OrganizationMember>(
      `/teams/organizations/${organizationId}/members`,
      data,
    );
  },

  /** Invite a new member by email */
  async inviteMember(
    organizationId: string,
    data: InviteMemberRequest,
  ): Promise<ApiResponse<TeamInvitation>> {
    return await apiClient.post<TeamInvitation>(
      `/teams/organizations/${organizationId}/invitations`,
      data,
    );
  },

  /** Get all pending invitations for an organization */
  async getInvitations(
    organizationId: string,
  ): Promise<ApiResponse<TeamInvitation[]>> {
    return await apiClient.get<TeamInvitation[]>(
      `/teams/organizations/${organizationId}/invitations`,
    );
  },

  /** Cancel a pending invitation */
  async cancelInvitation(
    organizationId: string,
    invitationId: string,
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/teams/organizations/${organizationId}/invitations/${invitationId}`,
    );
  },

  /** Accept an invitation using the raw token from the email link */
  async acceptInvitation(
    data: AcceptInvitationRequest,
  ): Promise<ApiResponse<OrganizationMember>> {
    return await apiClient.post<OrganizationMember>(
      "/teams/invitations/accept",
      data,
    );
  },
};
