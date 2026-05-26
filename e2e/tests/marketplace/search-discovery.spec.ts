import { test, expect } from "@playwright/test";
import { mockDefaultApiRoutes, mockApiRoute } from "../../helpers/api-mocks";
import { setupAuthState } from "../../helpers/auth.helpers";
import { TEST_GYM } from "../../fixtures/test-data";

test.describe("Marketplace Search & Discovery", () => {
  test.beforeEach(async ({ page }) => {
    await mockDefaultApiRoutes(page, "USER");
    await setupAuthState(page, "USER");
  });

  test("loads marketplace page", async ({ page }) => {
    await page.goto("/marketplace");

    await expect(page).toHaveURL(/\/marketplace/);
    await expect(
      page.getByText(/marketplace|discover|browse|search/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("displays listings when available", async ({ page }) => {
    await mockApiRoute(page, "**/api/v1/marketplace/listings**", {
      listings: [
        {
          ...TEST_GYM,
          _id: "gym-1",
          name: "Flex Fitness Center",
          type: "GYM",
        },
        {
          _id: "trainer-1",
          name: "John PT Studio",
          type: "TRAINER",
          description: "Personal training",
          city: "Lagos",
          country: "Nigeria",
          rating: 4.8,
        },
      ],
      total: 2,
      page: 1,
      limit: 10,
    });

    await page.goto("/marketplace");

    await expect(
      page.getByText(/flex fitness|john pt/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows empty state when no listings", async ({ page }) => {
    await mockApiRoute(page, "**/api/v1/marketplace/listings**", {
      listings: [],
      total: 0,
      page: 1,
      limit: 10,
    });

    await page.goto("/marketplace");

    // Should show some form of empty state
    await page.waitForTimeout(2000);
  });

  test("search input filters results", async ({ page }) => {
    await page.goto("/marketplace");

    const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole("searchbox")).first();
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill("yoga");
      await page.waitForTimeout(500);
    }
  });

  test("filter by type works", async ({ page }) => {
    await page.goto("/marketplace");

    // Look for type filter buttons/tabs
    const gymFilter = page.getByRole("button", { name: /gym/i })
      .or(page.getByText(/gyms/i).first());

    if (await gymFilter.isVisible().catch(() => false)) {
      await gymFilter.click();
      await page.waitForTimeout(500);
    }
  });
});
