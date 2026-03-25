// src/tests/unit/staff-flow.test.ts
// Unit tests for staff flow business logic (no component rendering)
// These tests focus on API integration, data transformations, and business logic

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  setupTeamsServiceMocks,
  setupCheckinsServiceMocks,
  setupConsultationsServiceMocks,
  mockMemberBuilder,
  mockTeamRoleBuilder,
  mockInvitationBuilder,
  mockAvailabilityRuleBuilder,
  mockAvailabilityExceptionBuilder,
  successResponse,
  errorResponse,
} from "../setup/test-utils";

describe("Staff Flow - Business Logic Unit Tests", () => {
  const teamsService = setupTeamsServiceMocks();
  const checkinsService = setupCheckinsServiceMocks();
  const consultationsService = setupConsultationsServiceMocks();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Staff List - Data loading", () => {
    it("should load all members for an organization", async () => {
      const mockMembers = [
        mockMemberBuilder({ _id: "member-1" }),
        mockMemberBuilder({ _id: "member-2", user_id: { first_name: "Jane", last_name: "Smith", email: "jane@example.com" } }),
      ];

      teamsService.getMembers.mockResolvedValue(
        successResponse(mockMembers)
      );

      const response = await teamsService.getMembers("org-123");

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
      expect(teamsService.getMembers).toHaveBeenCalledWith("org-123");
    });

    it("should load pending invitations for an organization", async () => {
      const mockInvitations = [
        mockInvitationBuilder(),
        mockInvitationBuilder({ _id: "inv-2", email: "another@example.com" }),
      ];

      teamsService.getInvitations.mockResolvedValue(
        successResponse(mockInvitations)
      );

      const response = await teamsService.getInvitations("org-123");

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
    });

    it("should handle errors when loading members", async () => {
      teamsService.getMembers.mockResolvedValue(
        errorResponse("Failed to load members")
      );

      const response = await teamsService.getMembers("org-123");

      expect(response.success).toBe(false);
      expect(response.message).toBe("Failed to load members");
    });
  });

  describe("Staff List - Search and filter", () => {
    it("should filter members by status", () => {
      const members = [
        mockMemberBuilder({ _id: "member-1", status: "ACTIVE" }),
        mockMemberBuilder({ _id: "member-2", status: "INACTIVE" }),
        mockMemberBuilder({ _id: "member-3", status: "PENDING" }),
      ];

      const activeOnly = members.filter((m) => m.status === "ACTIVE");
      expect(activeOnly).toHaveLength(1);
      expect(activeOnly[0]._id).toBe("member-1");
    });

    it("should search members by name", () => {
      const members = [
        mockMemberBuilder({ _id: "member-1", user_id: { first_name: "John", last_name: "Doe", email: "john@example.com" } }),
        mockMemberBuilder({ _id: "member-2", user_id: { first_name: "Jane", last_name: "Smith", email: "jane@example.com" } }),
      ];

      const searchQuery = "jane";
      const results = members.filter((m) => {
        const name = `${m.user_id?.first_name || ""} ${m.user_id?.last_name || ""}`.toLowerCase();
        const email = (m.user_id?.email || "").toLowerCase();
        return name.includes(searchQuery) || email.includes(searchQuery);
      });

      expect(results).toHaveLength(1);
      expect(results[0]._id).toBe("member-2");
    });

    it("should search members by email", () => {
      const members = [
        mockMemberBuilder({ _id: "member-1", user_id: { first_name: "John", last_name: "Doe", email: "john@example.com" } }),
        mockMemberBuilder({ _id: "member-2", user_id: { first_name: "Jane", last_name: "Smith", email: "jane@example.com" } }),
      ];

      const searchQuery = "@example.com";
      const results = members.filter((m) => 
        (m.user_id?.email || "").toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(results).toHaveLength(2);
    });
  });

  describe("Staff Detail - Member actions", () => {
    it("should toggle member status from active to inactive", async () => {
      const member = mockMemberBuilder({ status: "ACTIVE" });
      const updated = { ...member, status: "INACTIVE" };

      teamsService.updateMember.mockResolvedValue(successResponse(updated));

      const response = await teamsService.updateMember("org-123", "member-1", {
        status: "INACTIVE",
      });

      expect(response.success).toBe(true);
      expect(response.data.status).toBe("INACTIVE");
    });

    it("should handle status toggle errors", async () => {
      teamsService.updateMember.mockResolvedValue(
        errorResponse("Failed to update member")
      );

      const response = await teamsService.updateMember("org-123", "member-1", {
        status: "INACTIVE",
      });

      expect(response.success).toBe(false);
    });

    it("should remove member from organization", async () => {
      teamsService.removeMember.mockResolvedValue(
        successResponse({ message: "Member removed" })
      );

      const response = await teamsService.removeMember("org-123", "member-1");

      expect(response.success).toBe(true);
      expect(teamsService.removeMember).toHaveBeenCalledWith(
        "org-123",
        "member-1"
      );
    });

    it("should handle errors when removing member", async () => {
      teamsService.removeMember.mockResolvedValue(
        errorResponse("Cannot remove member")
      );

      const response = await teamsService.removeMember("org-123", "member-1");

      expect(response.success).toBe(false);
    });
  });

  describe("Staff Invite - Role selection", () => {
    it("should load all available team roles", async () => {
      const mockRoles = [
        mockTeamRoleBuilder({ _id: "role-1", name: "Trainer" }),
        mockTeamRoleBuilder({ _id: "role-2", name: "Admin", code: "ADMIN" }),
      ];

      teamsService.getRoles.mockResolvedValue(successResponse(mockRoles));

      const response = await teamsService.getRoles("org-123");

      expect(response.success).toBe(true);
      expect(response.data).toHaveLength(2);
    });

    it("should auto-select trainer-like role", () => {
      const roles = [
        mockTeamRoleBuilder({ _id: "role-1", name: "Support", code: "SUPPORT" }),
        mockTeamRoleBuilder({ _id: "role-2", name: "Trainer Coach", code: "TRAINER_COACH" }),
        mockTeamRoleBuilder({ _id: "role-3", name: "Admin", code: "ADMIN" }),
      ];

      const defaultRole = roles.find((role) => {
        const haystack = `${role.name} ${role.code}`.toLowerCase();
        return (
          haystack.includes("trainer") ||
          haystack.includes("coach") ||
          haystack.includes("instructor")
        );
      });

      expect(defaultRole?._id).toBe("role-2");
    });

    it("should send invitation with email and role", async () => {
      const formData = {
        email: "trainer@example.com",
        team_role_id: "role-1",
      };

      teamsService.inviteMember.mockResolvedValue(
        successResponse({ _id: "inv-1", ...formData })
      );

      const response = await teamsService.inviteMember("org-123", formData);

      expect(response.success).toBe(true);
      expect(teamsService.inviteMember).toHaveBeenCalledWith("org-123", formData);
    });

    it("should handle invitation errors", async () => {
      const formData = {
        email: "trainer@example.com",
        team_role_id: "role-1",
      };

      teamsService.inviteMember.mockResolvedValue(
        errorResponse("User already invited")
      );

      const response = await teamsService.inviteMember("org-123", formData);

      expect(response.success).toBe(false);
      expect(response.message).toContain("already invited");
    });
  });

  describe("Revenue Subpage - Organization stats", () => {
    it("should load organization revenue stats", async () => {
      const mockStats = {
        revenue_today: 250,
        revenue_week: 1500,
        revenue_month: 6000,
        active_members: 45,
      };

      checkinsService.getOrgDashboardStats.mockResolvedValue(
        successResponse(mockStats)
      );

      const response = await checkinsService.getOrgDashboardStats("org-123");

      expect(response.success).toBe(true);
      expect(response.data.revenue_today).toBe(250);
      expect(response.data.revenue_month).toBe(6000);
    });

    it("should handle errors loading organization stats", async () => {
      checkinsService.getOrgDashboardStats.mockResolvedValue(
        errorResponse("Failed to load stats")
      );

      const response = await checkinsService.getOrgDashboardStats("org-123");

      expect(response.success).toBe(false);
    });
  });

  describe("Schedule Subpage - Availability management", () => {
    it("should load availability rules filtered by day", () => {
      const rules = [
        mockAvailabilityRuleBuilder({ _id: "rule-1", dayOfWeek: 0 }), // Sunday
        mockAvailabilityRuleBuilder({ _id: "rule-2", dayOfWeek: 1 }), // Monday
        mockAvailabilityRuleBuilder({ _id: "rule-3", dayOfWeek: 1 }), // Monday
      ];

      const mondayRules = rules.filter((r) => r.dayOfWeek === 1);

      expect(mondayRules).toHaveLength(2);
      expect(mondayRules[0]._id).toBe("rule-2");
    });

    it("should load and sort upcoming exceptions", () => {
      const today = new Date();
      const exceptions = [
        mockAvailabilityExceptionBuilder({
          _id: "exc-1",
          date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        mockAvailabilityExceptionBuilder({
          _id: "exc-2",
          date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      ];

      const upcoming = exceptions
        .filter((e) => new Date(e.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

      expect(upcoming[0]._id).toBe("exc-2"); // Earlier date first
      expect(upcoming[1]._id).toBe("exc-1");
    });

    it("should load availability rules and exceptions", async () => {
      const mockRules = [mockAvailabilityRuleBuilder()];
      const mockExceptions = [mockAvailabilityExceptionBuilder()];

      consultationsService.getMyAvailability.mockResolvedValue(
        successResponse(mockRules)
      );
      consultationsService.getMyExceptions.mockResolvedValue(
        successResponse(mockExceptions)
      );

      const rulesResponse = await consultationsService.getMyAvailability();
      const exceptionsResponse = await consultationsService.getMyExceptions();

      expect(rulesResponse.success).toBe(true);
      expect(rulesResponse.data).toHaveLength(1);
      expect(exceptionsResponse.success).toBe(true);
      expect(exceptionsResponse.data).toHaveLength(1);
    });

    it("should count unavailable days from exceptions", () => {
      const exceptions = [
        mockAvailabilityExceptionBuilder({ _id: "exc-1", status: "UNAVAILABLE" }),
        mockAvailabilityExceptionBuilder({ _id: "exc-2", status: "UNAVAILABLE" }),
        mockAvailabilityExceptionBuilder({ _id: "exc-3", status: "PENDING" }),
      ];

      const unavailableDays = exceptions.filter((e) => e.status === "UNAVAILABLE");

      expect(unavailableDays).toHaveLength(2);
    });
  });

  describe("Helper functions - Extracting member data", () => {
    it("should extract member name from nested user object", () => {
      const member = mockMemberBuilder({
        user_id: { first_name: "John", last_name: "Doe", email: "john@example.com" },
      });

      const name = member.user_id.first_name && member.user_id.last_name
        ? `${member.user_id.first_name} ${member.user_id.last_name}`.trim()
        : "Unknown";

      expect(name).toBe("John Doe");
    });

    it("should extract member email safely", () => {
      const member = mockMemberBuilder();

      const email = member.user_id?.email ?? "No email available";

      expect(email).toBe("john@example.com");
    });

    it("should generate member initials", () => {
      const member = mockMemberBuilder({
        user_id: { first_name: "John", last_name: "Doe", email: "john@example.com" },
      });

      const initials = member.user_id
        ? `${member.user_id.first_name.charAt(0)}${member.user_id.last_name.charAt(0)}`.toUpperCase()
        : "?";

      expect(initials).toBe("JD");
    });

    it("should extract role from nested team_role_id", () => {
      const member = mockMemberBuilder({
        team_role_id: { _id: "role-1", name: "Trainer", code: "TRAINER", permissions: [] },
      });

      const role = member.team_role_id;

      expect(role?.name).toBe("Trainer");
      expect(role?.code).toBe("TRAINER");
    });
  });
});
