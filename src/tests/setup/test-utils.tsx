// src/tests/setup/test-utils.tsx
// Utility functions to help set up common mocks and render contexts for staff flow tests

import { ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { vi } from "vitest";

/**
 * Mock setup helpers for staff flow testing
 * Use these to avoid repetitive mock configuration
 */

export function setupTeamsServiceMocks() {
  return {
    getMembers: vi.fn(),
    getInvitations: vi.fn(),
    getRoles: vi.fn(),
    updateMember: vi.fn(),
    removeMember: vi.fn(),
    inviteMember: vi.fn(),
  };
}

export function setupCheckinsServiceMocks() {
  return {
    getOrgDashboardStats: vi.fn(),
    checkIn: vi.fn(),
    getCheckIns: vi.fn(),
  };
}

export function setupConsultationsServiceMocks() {
  return {
    getMyAvailability: vi.fn(),
    getMyExceptions: vi.fn(),
    createException: vi.fn(),
    updateAvailability: vi.fn(),
  };
}

/**
 * Mock data builders for consistent test data
 */

export const mockMemberBuilder = (overrides = {}) => ({
  _id: "member-1",
  status: "ACTIVE",
  user_id: {
    first_name: "John",
    last_name: "Doe",
    email: "john@example.com",
  },
  team_role_id: {
    _id: "role-1",
    name: "Trainer",
    code: "TRAINER",
    permissions: ["manage_clients", "view_reports"],
  },
  created_at: new Date().toISOString(),
  joined_at: new Date().toISOString(),
  ...overrides,
});

export const mockTeamRoleBuilder = (overrides = {}) => ({
  _id: "role-1",
  name: "Trainer",
  code: "TRAINER",
  permissions: ["manage_clients", "edit_clients", "schedule_sessions"],
  ...overrides,
});

export const mockInvitationBuilder = (overrides = {}) => ({
  _id: "inv-1",
  email: "invited@example.com",
  status: "PENDING",
  sent_at: new Date().toISOString(),
  expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  ...overrides,
});

export const mockAvailabilityRuleBuilder = (overrides = {}) => ({
  _id: "rule-1",
  dayOfWeek: 1, // Monday
  startTime: "09:00",
  endTime: "17:00",
  timezone: "America/New_York",
  ...overrides,
});

export const mockAvailabilityExceptionBuilder = (overrides = {}) => ({
  _id: "exc-1",
  date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  status: "UNAVAILABLE",
  reason: "Holiday",
  ...overrides,
});

export const mockOrgStatsBuilder = (overrides = {}) => ({
  revenue_today: 250,
  revenue_week: 1500,
  revenue_month: 6000,
  active_members: 45,
  total_check_ins: 150,
  ...overrides,
});

/**
 * Success/error response builders
 */

export const successResponse = <T,>(data: T) => ({
  success: true,
  data,
  message: "Success",
});

export const errorResponse = (message = "Operation failed") => ({
  success: false,
  message,
});

/**
 * Common organization context mock
 */
export const mockOrganizationContext = {
  useOrganization: () => ({
    currentOrg: { _id: "org-123" },
    isLoading: false,
  }),
};

/**
 * Common auth context mock
 */
export const mockAuthContext = {
  useRequireAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
  }),
};
