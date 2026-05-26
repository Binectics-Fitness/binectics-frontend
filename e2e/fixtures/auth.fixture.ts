import { test as base, type Page } from "@playwright/test";
import { setupAuthState } from "../helpers/auth.helpers";
import { mockDefaultApiRoutes } from "../helpers/api-mocks";
import type { TestRole } from "./test-data";

/**
 * Extended test fixture that provides pre-authenticated pages per role.
 * Use when a test needs inline auth setup instead of relying on storageState projects.
 */
type AuthFixtures = {
  authenticatedPage: Page;
  authedRole: TestRole;
};

export const test = base.extend<AuthFixtures>({
  authedRole: ["USER", { option: true }],

  authenticatedPage: async ({ page, authedRole }, use) => {
    await mockDefaultApiRoutes(page, authedRole);
    await setupAuthState(page, authedRole);
    await use(page);
  },
});

export { expect } from "@playwright/test";
