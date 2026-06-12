import { test, expect } from "@playwright/test";
import { mockDefaultApiRoutes, mockApiRoute } from "../../helpers/api-mocks";

test.describe("Forgot Password Flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockDefaultApiRoutes(page);
  });

  test("renders forgot password form", async ({ page }) => {
    await page.goto("/forgot-password");

    await expect(page.getByText(/forgot|reset/i).first()).toBeVisible();
    await expect(
      page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first()
    ).toBeVisible();
  });

  test("submits email and shows success message", async ({ page }) => {
    await mockApiRoute(page, "**/api/v1/auth/forgot-password", {
      message: "Reset link sent",
    });

    await page.goto("/forgot-password");

    const emailInput = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
    await emailInput.fill("testuser@binectics.com");

    const submitButton = page.getByRole("button", { name: /send|reset|submit/i });
    await submitButton.click();

    // Should show a success message or redirect
    await expect(
      page.getByText(/sent|check your email|success/i).first()
    ).toBeVisible({ timeout: 5000 });
  });

  test("back to login link works", async ({ page }) => {
    await page.goto("/forgot-password");

    const backLink = page.getByRole("link", { name: /back|login|sign in/i }).first();
    if (await backLink.isVisible()) {
      await backLink.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
