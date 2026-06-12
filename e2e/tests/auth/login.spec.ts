import { test, expect } from "@playwright/test";
import { mockDefaultApiRoutes, mockLoginFailure } from "../../helpers/api-mocks";
import { setupAuthState } from "../../helpers/auth.helpers";
import { expectOnDashboard } from "../../helpers/navigation.helpers";

test.describe("Login Page", () => {
  test.beforeEach(async ({ page }) => {
    await mockDefaultApiRoutes(page);
  });

  test("renders login form with email and password fields", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByText("Welcome back")).toBeVisible();
    await expect(page.getByPlaceholder("john@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows validation errors for empty form submission", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: /sign in/i }).click();

    // Zod validation should display error messages
    await expect(page.getByText(/email/i).first()).toBeVisible();
  });

  test("successful login redirects to user dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("john@example.com").fill("testuser@binectics.com");
    await page.getByPlaceholder("••••••••").fill("Password123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect to the user dashboard
    await expectOnDashboard(page, "USER");
  });

  test("shows error message on invalid credentials", async ({ page }) => {
    await mockLoginFailure(page, "Invalid email or password");
    await page.goto("/login");

    await page.getByPlaceholder("john@example.com").fill("wrong@email.com");
    await page.getByPlaceholder("••••••••").fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("remember me checkbox toggles", async ({ page }) => {
    await page.goto("/login");

    const checkbox = page.getByLabel(/remember me/i);
    await expect(checkbox).not.toBeChecked();

    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  test("forgot password link navigates correctly", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("link", { name: /forgot/i }).click();

    await expect(page).toHaveURL(/\/forgot-password/);
  });

  test("sign up link navigates to register page", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("link", { name: /sign up/i }).click();

    await expect(page).toHaveURL(/\/register/);
  });

  test("authenticated user visiting login is redirected to dashboard", async ({ page }) => {
    // Set up auth state before visiting login
    await setupAuthState(page, "USER");
    await page.goto("/login");

    // Middleware should redirect to the user dashboard
    await expectOnDashboard(page, "USER");
  });

  test("authenticated gym owner visiting login is redirected to gym owner dashboard", async ({ page }) => {
    await setupAuthState(page, "GYM_OWNER");
    await page.goto("/login");

    await expectOnDashboard(page, "GYM_OWNER");
  });

  test("button shows loading state during submission", async ({ page }) => {
    // Delay the API response to observe loading state
    await page.route("**/api/v1/auth/login", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: "1", email: "test@test.com", role: "USER" },
            tokens: { access_token: "tok", refresh_token: "ref" },
          },
        }),
      });
    });

    await page.goto("/login");
    await page.getByPlaceholder("john@example.com").fill("test@binectics.com");
    await page.getByPlaceholder("••••••••").fill("Password123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.getByRole("button", { name: /signing in/i })).toBeVisible();
  });
});
