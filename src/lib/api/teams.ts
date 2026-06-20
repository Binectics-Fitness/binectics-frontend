/**
 * Teams API Service
 * Handles all Team & Role Management API calls
 */

import { apiClient } from "./client";
import { AccountType, type ApiResponse } from "@/lib/types";

// ==================== ENUMS ====================
export { AccountType };

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

  // Progress Tracking Permissions
  PROGRESS_VIEW = "progress:view",
  PROGRESS_CREATE = "progress:create",
  PROGRESS_EDIT = "progress:edit",
  PROGRESS_DELETE = "progress:delete",
  PROGRESS_MANAGE_CLIENTS = "progress:manage_clients",
  PROGRESS_INVITE_CLIENT = "progress:invite_client",
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
  currency?: string;
  is_active: boolean;
  is_owner?: boolean;
  can_manage_organization?: boolean;
  my_role_code?: string | null;
  /** Optional white-label custom domain (gated by `custom_domain_enabled`). */
  custom_domain?: string | null;
  /** Optional white-label "From" sender (gated by `branded_email_enabled`). */
  branded_email_sender?: string | null;
  /** Token to publish at `_binectics-verify.<domain>` (TXT) to prove ownership. */
  branded_email_sender_verification_token?: string | null;
  /** ISO timestamp set when DNS verification last succeeded. */
  branded_email_sender_verified_at?: string | null;
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
  user_id:
    | string
    | {
        _id: string;
        first_name: string;
        last_name: string;
        email: string;
        profile_picture?: string;
      }; // Can be populated
  team_role_id: string | TeamRole; // Can be populated
  status: MemberStatus;
  invited_by: string | null;
  joined_at: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamInvitation {
  _id: string;
  organization_id: string;
  email: string;
  team_role_id: string | TeamRole; // Can be populated
  status: InvitationStatus;
  expires_at: string;
  invited_by: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
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
  currency?: string;
  is_active?: boolean;
  custom_domain?: string | null;
  branded_email_sender?: string | null;
  legal_entity?: string;
  registration_number?: string;
  preferred_payout_gateway?: string;
  kiosk_preference?: string;
}

export interface BrandedEmailVerificationResult {
  organization_id: string;
  branded_email_sender: string | null;
  verification_host: string | null;
  verification_token: string | null;
  verified_at: string | null;
  /** True only on the call that flipped the org from unverified → verified. */
  verified_now: boolean;
}

export interface OrganizationLocation {
  _id: string;
  organization_id: string;
  name: string;
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLocationRequest {
  name: string;
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  is_primary?: boolean;
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

  /**
   * Trigger DNS-TXT verification for the org's branded email sender domain.
   * The backend looks for the issued token at `_binectics-verify.<domain>`.
   * Always returns the current verification state — callers should poll or
   * re-call after the admin publishes the TXT record.
   */
  async verifyBrandedEmailSender(
    organizationId: string,
  ): Promise<ApiResponse<BrandedEmailVerificationResult>> {
    return await apiClient.post<BrandedEmailVerificationResult>(
      `/teams/organizations/${organizationId}/branded-email/verify`,
      {},
    );
  },

  // ==================== LOCATIONS ====================

  async createLocation(
    organizationId: string,
    data: CreateLocationRequest,
  ): Promise<ApiResponse<OrganizationLocation>> {
    return await apiClient.post<OrganizationLocation>(
      `/teams/organizations/${organizationId}/locations`,
      data,
    );
  },

  async getLocations(
    organizationId: string,
  ): Promise<ApiResponse<OrganizationLocation[]>> {
    return await apiClient.get<OrganizationLocation[]>(
      `/teams/organizations/${organizationId}/locations`,
    );
  },

  async updateLocation(
    organizationId: string,
    locationId: string,
    data: Partial<CreateLocationRequest>,
  ): Promise<ApiResponse<OrganizationLocation>> {
    return await apiClient.patch<OrganizationLocation>(
      `/teams/organizations/${organizationId}/locations/${locationId}`,
      data,
    );
  },

  // ==================== PLAN TEMPLATES ====================

  async seedMembershipPlanTemplate(
    organizationId: string,
    template: string,
  ): Promise<ApiResponse<unknown[]>> {
    return await apiClient.post<unknown[]>(
      `/teams/organizations/${organizationId}/membership-plans/seed-template`,
      { template },
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
