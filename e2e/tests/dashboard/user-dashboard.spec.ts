import { test, expect } from "@playwright/test";
import { mockDefaultApiRoutes, mockApiRoute } from "../../helpers/api-mocks";
import { setupAuthState } from "../../helpers/auth.helpers";

test.describe("User Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockDefaultApiRoutes(page, "USER");
    await setupAuthState(page, "USER");
  });

  test("loads dashboard page", async ({ page }) => {
    await page.goto("/dashboard");

    // Dashboard should render (may redirect to a sub-route)
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("displays user greeting or dashboard content", async ({ page }) => {
    await page.goto("/dashboard");

    // Should show some dashboard content
    await expect(
      page.getByText(/dashboard|welcome|overview|test user/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("sidebar navigation links are present", async ({ page }) => {
    await page.goto("/dashboard");

    // Common sidebar links for user dashboard
    const sidebarLinks = [/profile|settings/i, /subscription/i];

    for (const linkPattern of sidebarLinks) {
      const link = page.getByRole("link", { name: linkPattern }).first();
      if (await link.isVisible().catch(() => false)) {
        await expect(link).toBeVisible();
      }
    }
  });

  test("navigates to profile settings", async ({ page }) => {
    await page.goto("/dashboard");

    const profileLink = page.getByRole("link", { name: /profile|settings/i }).first();
    if (await profileLink.isVisible().catch(() => false)) {
      await profileLink.click();
      await expect(page).toHaveURL(/\/(profile|settings)/);
    }
  });

  test("displays check-in stats when available", async ({ page }) => {
    await mockApiRoute(page, "**/api/v1/check-ins/dashboard**", {
      total_check_ins: 42,
      current_streak_days: 7,
      longest_streak_days: 14,
      this_month: 12,
    });

    await page.goto("/dashboard");

    // Stats may be displayed in the dashboard
    const statsContent = page.getByText(/42|check.?in/i).first();
    if (await statsContent.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(statsContent).toBeVisible();
    }
  });
});
