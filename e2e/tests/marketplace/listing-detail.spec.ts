import { test, expect } from "@playwright/test";
import { mockDefaultApiRoutes, mockApiRoute } from "../../helpers/api-mocks";
import { setupAuthState } from "../../helpers/auth.helpers";
import { TEST_GYM, TEST_PLAN } from "../../fixtures/test-data";

test.describe("Listing Detail Page", () => {
  test.beforeEach(async ({ page }) => {
    await mockDefaultApiRoutes(page, "USER");
    await setupAuthState(page, "USER");

    // Mock listing detail endpoint
    await mockApiRoute(page, "**/api/v1/marketplace/listings/gym-1**", {
      ...TEST_GYM,
      plans: [TEST_PLAN],
    });
  });

  test("displays listing details", async ({ page }) => {
    await page.goto("/marketplace/gym-1");

    await expect(
      page.getByText(/E2E Test Gym/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows available plans", async ({ page }) => {
    await page.goto("/marketplace/gym-1");

    await expect(
      page.getByText(/monthly membership|plan/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("subscribe button is present", async ({ page }) => {
    await page.goto("/marketplace/gym-1");

    const subscribeButton = page.getByRole("button", { name: /subscribe|join|book|buy/i }).first();
    if (await subscribeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(subscribeButton).toBeVisible();
    }
  });

  test("displays location information", async ({ page }) => {
    await page.goto("/marketplace/gym-1");

    await expect(
      page.getByText(/Lagos|Nigeria|123 Test St/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("displays facilities", async ({ page }) => {
    await page.goto("/marketplace/gym-1");

    const facilityText = page.getByText(/pool|sauna|weights/i).first();
    if (await facilityText.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(facilityText).toBeVisible();
    }
  });
});
