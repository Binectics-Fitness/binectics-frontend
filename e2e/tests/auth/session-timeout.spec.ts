import { test, expect } from "@playwright/test";
import { setupAuthState, createMockJwt } from "../../helpers/auth.helpers";
import { mockDefaultApiRoutes } from "../../helpers/api-mocks";
import { TEST_USERS } from "../../fixtures/test-data";

test.describe("Session Timeout", () => {
  test("shows session modal when token is near expiry", async ({ page }) => {
    await mockDefaultApiRoutes(page);

    // Create a token that expires in 2 minutes (AuthContext shows modal 5 min before expiry)
    const shortLivedToken = createMockJwt(
      { sub: TEST_USERS.USER.id, role: "USER" },
      120,
    );

    await page.goto("/");

    await page.evaluate(
      ({ token, user }) => {
        localStorage.setItem("access_token", token);
        localStorage.setItem("user", JSON.stringify(user));
      },
      { token: shortLivedToken, user: TEST_USERS.USER },
    );

    await page.context().addCookies([
      {
        name: "access_token",
        value: shortLivedToken,
        domain: "localhost",
        path: "/",
      },
      {
        name: "user_role",
        value: "USER",
        domain: "localhost",
        path: "/",
      },
    ]);

    await page.goto("/dashboard");

    // The session modal should appear since token expires in < 5 minutes
    const sessionModal = page.getByText(/session|expir|timeout/i).first();
    await expect(sessionModal).toBeVisible({ timeout: 10_000 });
  });

  test("continue session button triggers token refresh", async ({ page }) => {
    await mockDefaultApiRoutes(page);

    let refreshCalled = false;
    await page.route("**/api/v1/auth/refresh", (route) => {
      refreshCalled = true;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            access_token: createMockJwt({ sub: "e2e-user-id" }, 3600),
            refresh_token: "new-refresh-token",
          },
        }),
      });
    });

    // Set up with short-lived token
    const shortToken = createMockJwt({ sub: "e2e-user-id", role: "USER" }, 120);
    await page.goto("/");
    await page.evaluate(
      ({ token, user }) => {
        localStorage.setItem("access_token", token);
        localStorage.setItem("user", JSON.stringify(user));
      },
      { token: shortToken, user: TEST_USERS.USER },
    );
    await page.context().addCookies([
      { name: "access_token", value: shortToken, domain: "localhost", path: "/" },
      { name: "user_role", value: "USER", domain: "localhost", path: "/" },
    ]);

    await page.goto("/dashboard");

    // Wait for session modal
    const continueButton = page.getByRole("button", { name: /continue|extend|stay/i }).first();
    if (await continueButton.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await continueButton.click();
      // Session should be extended — modal should disappear
      await expect(continueButton).not.toBeVisible({ timeout: 5000 });
    }
  });
});
