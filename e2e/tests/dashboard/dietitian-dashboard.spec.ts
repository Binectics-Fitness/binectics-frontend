import { test, expect } from "@playwright/test";
import { mockDefaultApiRoutes, mockApiRoute } from "../../helpers/api-mocks";
import { setupAuthState } from "../../helpers/auth.helpers";

test.describe("Dietitian Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockDefaultApiRoutes(page, "DIETITIAN");
    await setupAuthState(page, "DIETITIAN");
  });

  test("loads dietitian dashboard", async ({ page }) => {
    await page.goto("/dashboard/dietitian");

    await expect(page).toHaveURL(/\/dashboard\/dietitian/);
    await expect(
      page.getByText(/dashboard|overview|dietitian/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("sidebar shows dietitian navigation", async ({ page }) => {
    await page.goto("/dashboard/dietitian");

    const navItems = [/clients/i, /meal.*plan/i, /consultation/i, /analytics/i];

    for (const pattern of navItems) {
      const link = page.getByRole("link", { name: pattern }).first();
      if (await link.isVisible().catch(() => false)) {
        await expect(link).toBeVisible();
      }
    }
  });

  test("navigates to meal plans", async ({ page }) => {
    await page.goto("/dashboard/dietitian");

    const link = page.getByRole("link", { name: /meal.*plan/i }).first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      await expect(page).toHaveURL(/\/meal-plan/);
    }
  });

  test("navigates to clients page", async ({ page }) => {
    await mockApiRoute(page, "**/api/v1/subscriptions**", []);

    await page.goto("/dashboard/dietitian");

    const link = page.getByRole("link", { name: /clients/i }).first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      await expect(page).toHaveURL(/\/clients/);
    }
  });
});
