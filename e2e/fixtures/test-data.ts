/**
 * Shared test data builders for E2E tests.
 * Mirrors the User interface from src/lib/types/index.ts.
 */

export const TEST_USERS = {
  USER: {
    id: "e2e-user-id",
    email: "testuser@binectics.com",
    first_name: "Test",
    last_name: "User",
    role: "USER" as const,
    is_email_verified: true,
    is_onboarding_complete: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  GYM_OWNER: {
    id: "e2e-gym-owner-id",
    email: "gymowner@binectics.com",
    first_name: "Gym",
    last_name: "Owner",
    role: "GYM_OWNER" as const,
    is_email_verified: true,
    is_onboarding_complete: true,
    company_name: "E2E Test Gym",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  TRAINER: {
    id: "e2e-trainer-id",
    email: "trainer@binectics.com",
    first_name: "Test",
    last_name: "Trainer",
    role: "TRAINER" as const,
    is_email_verified: true,
    is_onboarding_complete: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  DIETITIAN: {
    id: "e2e-dietitian-id",
    email: "dietitian@binectics.com",
    first_name: "Test",
    last_name: "Dietitian",
    role: "DIETITIAN" as const,
    is_email_verified: true,
    is_onboarding_complete: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
  ADMIN: {
    id: "e2e-admin-id",
    email: "admin@binectics.com",
    first_name: "Test",
    last_name: "Admin",
    role: "ADMIN" as const,
    is_email_verified: true,
    is_onboarding_complete: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
  },
} as const;

export type TestRole = keyof typeof TEST_USERS;

/** Role to dashboard path mapping (mirrors middleware.ts) */
export const DASHBOARD_PATHS: Record<TestRole, string> = {
  USER: "/dashboard",
  GYM_OWNER: "/dashboard/gym-owner",
  TRAINER: "/dashboard/trainer",
  DIETITIAN: "/dashboard/dietitian",
  ADMIN: "/admin/dashboard",
};

/** Sample gym listing for marketplace tests */
export const TEST_GYM = {
  _id: "e2e-gym-1",
  name: "E2E Test Gym",
  description: "A test gym for E2E testing",
  address: "123 Test St",
  city: "Lagos",
  country: "Nigeria",
  facilities: ["Pool", "Sauna", "Weights"],
  photos: [],
  verificationStatus: "VERIFIED",
  rating: 4.5,
  reviewCount: 12,
};

/** Sample plan for checkout tests */
export const TEST_PLAN = {
  _id: "e2e-plan-1",
  name: "Monthly Membership",
  type: "SUBSCRIPTION",
  duration: 30,
  price: 49,
  currency: "USD",
  description: "Full gym access for 30 days",
  isActive: true,
};
