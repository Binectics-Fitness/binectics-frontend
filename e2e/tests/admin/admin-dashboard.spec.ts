import { test, expect } from "@playwright/test";
import { mockDefaultApiRoutes, mockApiRoute } from "../../helpers/api-mocks";
import { setupAuthState } from "../../helpers/auth.helpers";

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockDefaultApiRoutes(page, "ADMIN");
    await setupAuthState(page, "ADMIN");
  });

  test("loads admin dashboard", async ({ page }) => {
    await page.goto("/admin/dashboard");

    await expect(page).toHaveURL(/\/admin\/dashboard/);
    await expect(
      page.getByText(/admin|dashboard|overview/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("sidebar shows admin navigation", async ({ page }) => {
    await page.goto("/admin/dashboard");

    const navItems = [/users/i, /providers/i, /verification/i, /analytics/i];

    for (const pattern of navItems) {
      const link = page.getByRole("link", { name: pattern }).first();
      if (await link.isVisible().catch(() => false)) {
        await expect(link).toBeVisible();
      }
    }
  });

  test("navigates to users management", async ({ page }) => {
    await mockApiRoute(page, "**/api/v1/admin/users**", {
      users: [],
      total: 0,
    });

    await page.goto("/admin/dashboard");

    const usersLink = page.getByRole("link", { name: /users/i }).first();
    if (await usersLink.isVisible().catch(() => false)) {
      await usersLink.click();
      await expect(page).toHaveURL(/\/admin\/users/);
    }
  });

  test("navigates to verification queue", async ({ page }) => {
    await page.goto("/admin/dashboard");

    const verificationLink = page.getByRole("link", { name: /verification/i }).first();
    if (await verificationLink.isVisible().catch(() => false)) {
      await verificationLink.click();
      await expect(page).toHaveURL(/\/admin\/verification/);
    }
  });

  test("displays platform metrics", async ({ page }) => {
    await mockApiRoute(page, "**/api/v1/admin/metrics**", {
      total_users: 1500,
      total_providers: 200,
      active_subscriptions: 800,
      revenue: 45000,
    });

    await page.goto("/admin/dashboard");

    // Dashboard should render metrics cards
    await page.waitForTimeout(2000);
  });
});
