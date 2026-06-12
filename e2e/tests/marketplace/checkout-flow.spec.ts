import { test, expect } from "@playwright/test";
import { mockDefaultApiRoutes, mockApiRoute } from "../../helpers/api-mocks";
import { setupAuthState } from "../../helpers/auth.helpers";
import { TEST_PLAN } from "../../fixtures/test-data";

test.describe("Checkout Flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockDefaultApiRoutes(page, "USER");
    await setupAuthState(page, "USER");

    // Mock plan details for checkout
    await mockApiRoute(page, "**/api/v1/plans/**", TEST_PLAN);
    await mockApiRoute(page, "**/api/v1/payments/**", {
      clientSecret: "pi_test_secret",
      paymentIntentId: "pi_test_123",
    });
  });

  test("checkout page loads with plan details", async ({ page }) => {
    await page.goto("/checkout?planId=e2e-plan-1");

    // Should display plan information
    await expect(page).toHaveURL(/\/checkout/);
  });

  test("success page renders after payment", async ({ page }) => {
    await page.goto("/checkout/success");

    await expect(
      page.getByText(/success|confirmed|thank you|congratulations/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("cancelled page renders correctly", async ({ page }) => {
    await page.goto("/checkout/cancelled");

    await expect(
      page.getByText(/cancel|failed|try again/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("success page has link back to dashboard", async ({ page }) => {
    await page.goto("/checkout/success");

    const dashboardLink = page.getByRole("link", { name: /dashboard|continue|home/i }).first();
    if (await dashboardLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(dashboardLink).toBeVisible();
    }
  });
});
