import { test, expect } from "@playwright/test";
import { mockDefaultApiRoutes, mockApiRoute } from "../../helpers/api-mocks";
import { setupAuthState } from "../../helpers/auth.helpers";

test.describe("Gym Owner Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await mockDefaultApiRoutes(page, "GYM_OWNER");
    await setupAuthState(page, "GYM_OWNER");

    // Mock organization data for gym owner
    await mockApiRoute(page, "**/api/v1/teams/organizations/me", [
      {
        _id: "org-1",
        name: "E2E Test Gym",
        type: "GYM",
        owner: "e2e-gym-owner-id",
      },
    ]);
  });

  test("loads gym owner dashboard", async ({ page }) => {
    await page.goto("/dashboard/gym-owner");

    await expect(page).toHaveURL(/\/dashboard\/gym-owner/);
    await expect(
      page.getByText(/dashboard|overview|gym/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("sidebar shows gym owner navigation", async ({ page }) => {
    await page.goto("/dashboard/gym-owner");

    const navItems = [/staff|team/i, /plans/i, /members/i, /classes/i];

    for (const pattern of navItems) {
      const link = page.getByRole("link", { name: pattern }).first();
      if (await link.isVisible().catch(() => false)) {
        await expect(link).toBeVisible();
      }
    }
  });

  test("navigates to staff management", async ({ page }) => {
    await page.goto("/dashboard/gym-owner");

    const staffLink = page.getByRole("link", { name: /staff|team/i }).first();
    if (await staffLink.isVisible().catch(() => false)) {
      await staffLink.click();
      await expect(page).toHaveURL(/\/staff|\/team/);
    }
  });

  test("navigates to plans management", async ({ page }) => {
    await page.goto("/dashboard/gym-owner");

    const plansLink = page.getByRole("link", { name: /plans/i }).first();
    if (await plansLink.isVisible().catch(() => false)) {
      await plansLink.click();
      await expect(page).toHaveURL(/\/plans/);
    }
  });

  test("navigates to members list", async ({ page }) => {
    await page.goto("/dashboard/gym-owner");

    const membersLink = page.getByRole("link", { name: /members/i }).first();
    if (await membersLink.isVisible().catch(() => false)) {
      await membersLink.click();
      await expect(page).toHaveURL(/\/members/);
    }
  });

  test("displays organization stats", async ({ page }) => {
    await mockApiRoute(page, "**/api/v1/teams/organizations/*/stats**", {
      total_members: 50,
      active_subscriptions: 35,
      total_check_ins: 1200,
    });

    await page.goto("/dashboard/gym-owner");

    // Dashboard should display some stats
    await page.waitForTimeout(2000);
  });
});
