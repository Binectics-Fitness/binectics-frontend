"use client";

import { useState, useCallback } from "react";
import { teamsService } from "@/lib/api/teams";
import type {
  Organization,
  CreateOrganizationRequest,
  OrganizationMember,
  TeamRole,
  TeamInvitation,
  InviteMemberRequest,
  AddMemberDirectRequest,
  UpdateMemberRequest,
  CreateTeamRoleRequest,
} from "@/lib/api/teams";

/**
 * Hook for fetching and managing the current user's organizations.
 */
export function useMyOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrganizations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const response = await teamsService.getMyOrganizations();
    if (response.success && response.data) {
      setOrganizations(response.data);
    } else {
      setError(response.message || "Failed to load organizations");
    }
    setIsLoading(false);
  }, []);

  const createOrganization = useCallback(
    async (data: CreateOrganizationRequest): Promise<Organization | null> => {
      const response = await teamsService.createOrganization(data);
      if (response.success && response.data) {
        setOrganizations((prev) => [...prev, response.data!]);
        return response.data;
      }
      return null;
    },
    [],
  );

  return {
    organizations,
    isLoading,
    error,
    loadOrganizations,
    createOrganization,
  };
}

/**
 * Hook for managing a single organization.
 * Encapsulates all member, role, and invitation management operations.
 */
export function useOrgManagement(orgId: string) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [roles, setRoles] = useState<TeamRole[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrgData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const [orgRes, membersRes, rolesRes, invitationsRes] =
      await Promise.allSettled([
        teamsService.getOrganization(orgId),
        teamsService.getMembers(orgId),
        teamsService.getRoles(orgId),
        teamsService.getInvitations(orgId),
      ]);

    if (orgRes.status === "fulfilled" && orgRes.value.success && orgRes.value.data) {
      setOrganization(orgRes.value.data);
    } else {
      const msg =
        orgRes.status === "fulfilled"
          ? orgRes.value.message
          : "Failed to load organization";
      setError(msg || "Failed to load organization");
    }

    if (membersRes.status === "fulfilled" && membersRes.value.success && membersRes.value.data) {
      setMembers(membersRes.value.data);
    }

    if (rolesRes.status === "fulfilled" && rolesRes.value.success && rolesRes.value.data) {
      setRoles(rolesRes.value.data);
    }

    if (invitationsRes.status === "fulfilled" && invitationsRes.value.success && invitationsRes.value.data) {
      setInvitations(invitationsRes.value.data);
    }

    setIsLoading(false);
  }, [orgId]);

  const inviteMember = useCallback(
    async (data: InviteMemberRequest): Promise<TeamInvitation | null> => {
      const response = await teamsService.inviteMember(orgId, data);
      if (response.success && response.data) {
        setInvitations((prev) => [...prev, response.data!]);
        return response.data;
      }
      return null;
    },
    [orgId],
  );

  const addMemberDirect = useCallback(
    async (
      data: AddMemberDirectRequest,
    ): Promise<OrganizationMember | null> => {
      const response = await teamsService.addMemberDirect(orgId, data);
      if (response.success && response.data) {
        setMembers((prev) => [...prev, response.data!]);
        return response.data;
      }
      return null;
    },
    [orgId],
  );

  const removeMember = useCallback(
    async (memberId: string): Promise<boolean> => {
      const response = await teamsService.removeMember(orgId, memberId);
      if (response.success) {
        setMembers((prev) => prev.filter((m) => m._id !== memberId));
        return true;
      }
      return false;
    },
    [orgId],
  );

  const updateMember = useCallback(
    async (
      memberId: string,
      data: UpdateMemberRequest,
    ): Promise<OrganizationMember | null> => {
      const response = await teamsService.updateMember(orgId, memberId, data);
      if (response.success && response.data) {
        setMembers((prev) =>
          prev.map((m) => (m._id === memberId ? response.data! : m)),
        );
        return response.data;
      }
      return null;
    },
    [orgId],
  );

  const cancelInvitation = useCallback(
    async (invitationId: string): Promise<boolean> => {
      const response = await teamsService.cancelInvitation(orgId, invitationId);
      if (response.success) {
        setInvitations((prev) => prev.filter((i) => i._id !== invitationId));
        return true;
      }
      return false;
    },
    [orgId],
  );

  const createRole = useCallback(
    async (data: CreateTeamRoleRequest): Promise<TeamRole | null> => {
      const response = await teamsService.createRole(orgId, data);
      if (response.success && response.data) {
        setRoles((prev) => [...prev, response.data!]);
        return response.data;
      }
      return null;
    },
    [orgId],
  );

  const deleteRole = useCallback(
    async (roleId: string): Promise<boolean> => {
      const response = await teamsService.deleteRole(orgId, roleId);
      if (response.success) {
        setRoles((prev) => prev.filter((r) => r._id !== roleId));
        return true;
      }
      return false;
    },
    [orgId],
  );

  return {
    organization,
    members,
    roles,
    invitations,
    isLoading,
    error,
    loadOrgData,
    inviteMember,
    addMemberDirect,
    removeMember,
    updateMember,
    cancelInvitation,
    createRole,
    deleteRole,
  };
}

/**
 * Hook for accepting a team invitation.
 */
export function useTeamInviteAccept() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const acceptInvite = useCallback(async (token: string) => {
    setStatus("loading");
    setError(null);
    const response = await teamsService.acceptInvitation({ token });
    if (response.success) {
      setStatus("success");
      return true;
    }
    setError(response.message || "Failed to accept invitation");
    setStatus("error");
    return false;
  }, []);

  return { status, error, acceptInvite };
}
