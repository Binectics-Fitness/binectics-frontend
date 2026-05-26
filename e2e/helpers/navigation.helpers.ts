import { type Page, expect } from "@playwright/test";
import { DASHBOARD_PATHS, type TestRole } from "../fixtures/test-data";

/**
 * Assert the page has navigated to a specific path.
 */
export async function expectPathToBe(
  page: Page,
  expectedPath: string,
): Promise<void> {
  await expect(page).toHaveURL(new RegExp(`${expectedPath}(\\?.*)?$`));
}

/**
 * Assert the user is on the correct dashboard for their role.
 */
export async function expectOnDashboard(
  page: Page,
  role: TestRole,
): Promise<void> {
  const dashboardPath = DASHBOARD_PATHS[role];
  await expect(page).toHaveURL(new RegExp(dashboardPath));
}

/**
 * Assert the user has been redirected to the login page.
 */
export async function expectRedirectToLogin(
  page: Page,
  fromPath?: string,
): Promise<void> {
  if (fromPath) {
    await expect(page).toHaveURL(
      new RegExp(`/login\\?redirect=${encodeURIComponent(fromPath)}`),
    );
  } else {
    await expect(page).toHaveURL(/\/login/);
  }
}

/**
 * Wait for the page to finish loading (no pending network requests).
 */
export async function waitForPageReady(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
}
