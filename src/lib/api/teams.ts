/**
 * Teams API Service
 * Handles all Team & Role Management API calls
 */

import { apiClient } from "./client";
import { AccountType, type ApiResponse } from "@/lib/types";
import type {
  FirstDayOfWeek,
  DateFormat,
  TimeFormat,
  NumberFormat,
} from "@/lib/constants/settingsLocale";

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

export type NoShowPolicy = "none" | "fee" | "block_after_3";

/** Org-wide booking defaults — stored/sent as a whole object. */
export interface BookingRules {
  auto_confirm: boolean;
  require_parq: boolean;
  /** 0–100; 0 disables the cancellation fee. */
  cancellation_fee_percent: number;
  cancellation_window_hours: number;
  allow_video_recording: boolean;
  public_reviews: boolean;
  booking_lead_time_hours: number;
  no_show_policy: NoShowPolicy;
  waitlist_enabled: boolean;
}

/** Front-desk kiosk & QR behaviour — stored/sent as a whole object. */
export interface KioskSettings {
  qr_checkin_from_phones: boolean;
  success_animation: boolean;
  auto_sleep: boolean;
  idle_seconds: number;
  voice_announcement: boolean;
}

export type PayoutFrequency = "daily" | "weekly" | "monthly";

/** Payout cadence preferences — stored/sent as a whole object. */
export interface PayoutSchedule {
  frequency: PayoutFrequency;
  /** Weekly: 0–6 (Sun=0). Monthly: 1–28. Omitted for daily. */
  payout_day?: number;
  minimum_payout_amount: number;
  hold_period_days: number;
}

export interface Organization {
  _id: string;
  owner_id: string;
  name: string;
  description?: string;
  logo?: string;
  account_type: AccountType;
  currency?: string;
  /** Business identity & locale settings (gym-owner Settings page). */
  legal_entity?: string;
  registration_number?: string;
  legal_name?: string;
  vat_registration_number?: string;
  /** ISO 3166-1 alpha-2 country code (uppercase). */
  country?: string;
  primary_email?: string;
  /** IANA time zone identifier, e.g. "Africa/Johannesburg". */
  time_zone?: string;
  first_day_of_week?: FirstDayOfWeek;
  date_format?: DateFormat;
  time_format?: TimeFormat;
  number_format?: NumberFormat;
  /** Tax & VAT settings (display/receipt metadata). */
  tax_rate?: number;
  tax_inclusive?: boolean;
  tax_label?: string;
  booking_rules?: BookingRules;
  kiosk_settings?: KioskSettings;
  payout_schedule?: PayoutSchedule;
  is_active: boolean;
  /** Short, human-typable code members enter on the manual check-in screen. */
  checkin_code?: string;
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
  doc_registration_url?: string;
  doc_tax_url?: string;
  doc_owner_id_url?: string;
  legal_name?: string;
  vat_registration_number?: string;
  country?: string;
  primary_email?: string;
  time_zone?: string;
  first_day_of_week?: FirstDayOfWeek;
  date_format?: DateFormat;
  time_format?: TimeFormat;
  number_format?: NumberFormat;
  tax_rate?: number;
  tax_inclusive?: boolean;
  tax_label?: string;
  booking_rules?: BookingRules;
  kiosk_settings?: KioskSettings;
  payout_schedule?: PayoutSchedule;
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


// ==================== ORG NOTIFICATION SETTINGS ====================

/**
 * Org-level notification toggles: 7 events x 3 channels, camelCase field
 * names mirroring the backend response (e.g. emailReminders, smsReminders).
 */
export type OrgNotificationSettings = Record<string, boolean | string>;

export const ORG_NOTIFICATION_EVENTS = [
  { key: "SubscriptionUpdates", label: "Subscription updates", desc: "Member plan sign-ups, changes, and expiries." },
  { key: "PaymentReceipts", label: "Payment receipts", desc: "Successful and failed member payments." },
  { key: "BookingConfirmations", label: "Booking confirmations", desc: "New session and class bookings." },
  { key: "Cancellations", label: "Cancellations", desc: "Cancelled bookings and subscriptions." },
  { key: "Reminders", label: "Reminders", desc: "Upcoming session and renewal reminders." },
  { key: "Newsletter", label: "Newsletter", desc: "Your periodic member newsletter." },
  { key: "Promotions", label: "Promotions", desc: "Offers and campaigns to members." },
] as const;

export const ORG_NOTIFICATION_CHANNELS = ["email", "sms", "push"] as const;
export type OrgNotificationChannel = (typeof ORG_NOTIFICATION_CHANNELS)[number];

// ==================== API KEYS ====================

export interface OrgApiKey {
  _id: string;
  organization_id: string;
  name: string;
  key_prefix: string;
  scopes: TeamPermission[];
  created_by_id: string;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateApiKeyRequest {
  name: string;
  scopes: TeamPermission[];
  expires_at?: string;
}

/** Reveal-once create response: api_key is never retrievable again. */
export interface CreatedApiKey {
  api_key: string;
  key: OrgApiKey;
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

  /** Deactivate a location */
  async deleteLocation(
    organizationId: string,
    locationId: string,
  ): Promise<ApiResponse<void>> {
    return await apiClient.delete<void>(
      `/teams/organizations/${organizationId}/locations/${locationId}`,
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

  // ==================== ORG NOTIFICATION SETTINGS ====================

  /** Org-level notification settings (get-or-create server-side). */
  async getOrgNotificationSettings(
    organizationId: string,
  ): Promise<ApiResponse<OrgNotificationSettings>> {
    return await apiClient.get<OrgNotificationSettings>(
      `/teams/organizations/${organizationId}/notification-settings`,
    );
  },

  /** Partial update — only the toggles provided are changed. */
  async updateOrgNotificationSettings(
    organizationId: string,
    data: Partial<Record<string, boolean>>,
  ): Promise<ApiResponse<OrgNotificationSettings>> {
    return await apiClient.patch<OrgNotificationSettings>(
      `/teams/organizations/${organizationId}/notification-settings`,
      data,
    );
  },

  // ==================== API KEYS ====================

  /** Create an API key — the secret in the response is shown exactly once. */
  async createApiKey(
    organizationId: string,
    data: CreateApiKeyRequest,
  ): Promise<ApiResponse<CreatedApiKey>> {
    return await apiClient.post<CreatedApiKey>(
      `/teams/organizations/${organizationId}/api-keys`,
      data,
    );
  },

  async getApiKeys(
    organizationId: string,
  ): Promise<ApiResponse<OrgApiKey[]>> {
    return await apiClient.get<OrgApiKey[]>(
      `/teams/organizations/${organizationId}/api-keys`,
    );
  },

  /** Revoke (not delete) an API key. */
  async revokeApiKey(
    organizationId: string,
    keyId: string,
  ): Promise<ApiResponse<OrgApiKey>> {
    return await apiClient.delete<OrgApiKey>(
      `/teams/organizations/${organizationId}/api-keys/${keyId}`,
    );
  },
};
