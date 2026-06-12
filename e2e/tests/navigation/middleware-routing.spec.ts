import { test, expect } from "@playwright/test";
import { setupAuthState, clearAuthState } from "../../helpers/auth.helpers";
import { mockDefaultApiRoutes } from "../../helpers/api-mocks";
import {
  expectRedirectToLogin,
  expectOnDashboard,
} from "../../helpers/navigation.helpers";
import { DASHBOARD_PATHS, type TestRole } from "../../fixtures/test-data";

test.describe("Middleware Route Protection", () => {
  test.beforeEach(async ({ page }) => {
    await mockDefaultApiRoutes(page);
  });

  test.describe("Unauthenticated users", () => {
    const protectedRoutes = [
      "/dashboard",
      "/admin/dashboard",
      "/forms",
      "/check-in",
      "/checkout",
      "/teams",
    ];

    for (const route of protectedRoutes) {
      test(`redirects to login when visiting ${route}`, async ({ page }) => {
        await page.goto(route);
        await expectRedirectToLogin(page, route);
      });
    }

    test("allows access to landing page", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/$/);
    });

    test("allows access to login page", async ({ page }) => {
      await page.goto("/login");
      await expect(page).toHaveURL(/\/login/);
    });

    test("allows access to register page", async ({ page }) => {
      await page.goto("/register");
      await expect(page).toHaveURL(/\/register/);
    });
  });

  test.describe("Authenticated users redirected from auth routes", () => {
    const roles: TestRole[] = ["USER", "GYM_OWNER", "TRAINER", "DIETITIAN", "ADMIN"];

    for (const role of roles) {
      test(`${role} visiting /login is redirected to ${DASHBOARD_PATHS[role]}`, async ({ page }) => {
        await setupAuthState(page, role);
        await page.goto("/login");
        await expectOnDashboard(page, role);
      });
    }

    for (const role of roles) {
      test(`${role} visiting /register is redirected to ${DASHBOARD_PATHS[role]}`, async ({ page }) => {
        await setupAuthState(page, role);
        await page.goto("/register");
        await expectOnDashboard(page, role);
      });
    }
  });
});
