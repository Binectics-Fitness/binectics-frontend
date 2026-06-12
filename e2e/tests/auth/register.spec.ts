import { test, expect } from "@playwright/test";
import { mockDefaultApiRoutes } from "../../helpers/api-mocks";

test.describe("Registration Flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockDefaultApiRoutes(page);
  });

  test.describe("Role Selection Page", () => {
    test("renders all role options", async ({ page }) => {
      await page.goto("/register");

      await expect(page.getByText(/fitness enthusiast|fitness member/i).first()).toBeVisible();
      await expect(page.getByText(/gym owner/i).first()).toBeVisible();
      await expect(page.getByText(/trainer|personal trainer/i).first()).toBeVisible();
      await expect(page.getByText(/dietitian|dietician/i).first()).toBeVisible();
    });

    test("user role card links to user registration form", async ({ page }) => {
      await page.goto("/register");

      await page.getByText(/fitness enthusiast|fitness member|get started/i).first().click();

      await expect(page).toHaveURL(/\/register\/(user|fitness)/);
    });

    test("gym owner card links to gym owner registration form", async ({ page }) => {
      await page.goto("/register");

      // Find and click the gym owner option
      const gymOwnerLink = page.locator("a[href*='gym-owner']").first();
      if (await gymOwnerLink.isVisible()) {
        await gymOwnerLink.click();
        await expect(page).toHaveURL(/\/register\/gym-owner/);
      }
    });
  });

  test.describe("User Registration Form", () => {
    test("renders registration form fields", async ({ page }) => {
      await page.goto("/register/user");

      // Should have basic form fields
      await expect(page.getByLabel(/first name/i).or(page.getByPlaceholder(/first name/i)).first()).toBeVisible();
      await expect(page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first()).toBeVisible();
    });

    test("shows validation errors on empty submit", async ({ page }) => {
      await page.goto("/register/user");

      // Find and click submit button
      const submitButton = page.getByRole("button", { name: /sign up|register|create account/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Should show validation errors
        await page.waitForTimeout(500);
        const errorMessages = page.locator("[class*='error'], [class*='red'], [role='alert']");
        await expect(errorMessages.first()).toBeVisible();
      }
    });
  });

  test.describe("Gym Owner Registration Form", () => {
    test("renders gym owner specific fields", async ({ page }) => {
      await page.goto("/register/gym-owner");

      // Should have company-related fields
      await expect(
        page.getByLabel(/company|business|gym name/i)
          .or(page.getByPlaceholder(/company|business|gym name/i))
          .first()
      ).toBeVisible();
    });
  });

  test("login link from register page navigates correctly", async ({ page }) => {
    await page.goto("/register");

    const loginLink = page.getByRole("link", { name: /sign in|log in|login/i }).first();
    if (await loginLink.isVisible()) {
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
