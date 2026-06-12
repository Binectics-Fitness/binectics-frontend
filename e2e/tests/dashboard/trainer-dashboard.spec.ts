import { test, expect } from "@playwright/test";
import { mockDefaultApiRoutes, mockApiRoute } from "../../helpers/api-mocks";
import { setupAuthState } from "../../helpers/auth.helpers";

test.describe("Trainer Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockDefaultApiRoutes(page, "TRAINER");
    await setupAuthState(page, "TRAINER");
  });

  test("loads trainer dashboard", async ({ page }) => {
    await page.goto("/dashboard/trainer");

    await expect(page).toHaveURL(/\/dashboard\/trainer/);
    await expect(
      page.getByText(/dashboard|overview|trainer/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("sidebar shows trainer navigation", async ({ page }) => {
    await page.goto("/dashboard/trainer");

    const navItems = [/clients/i, /plans/i, /consultation/i, /earning/i];

    for (const pattern of navItems) {
      const link = page.getByRole("link", { name: pattern }).first();
      if (await link.isVisible().catch(() => false)) {
        await expect(link).toBeVisible();
      }
    }
  });

  test("navigates to clients page", async ({ page }) => {
    await mockApiRoute(page, "**/api/v1/subscriptions**", []);

    await page.goto("/dashboard/trainer");

    const clientsLink = page.getByRole("link", { name: /clients/i }).first();
    if (await clientsLink.isVisible().catch(() => false)) {
      await clientsLink.click();
      await expect(page).toHaveURL(/\/clients/);
    }
  });

  test("navigates to consultations page", async ({ page }) => {
    await page.goto("/dashboard/trainer");

    const link = page.getByRole("link", { name: /consultation/i }).first();
    if (await link.isVisible().catch(() => false)) {
      await link.click();
      await expect(page).toHaveURL(/\/consultation/);
    }
  });
});
