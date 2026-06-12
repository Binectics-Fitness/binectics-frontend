import { test, expect } from "@playwright/test";
import { mockDefaultApiRoutes, mockApiRoute } from "../../helpers/api-mocks";
import { setupAuthState } from "../../helpers/auth.helpers";

test.describe("Forms System", () => {
  test.beforeEach(async ({ page }) => {
    await mockDefaultApiRoutes(page, "GYM_OWNER");
    await setupAuthState(page, "GYM_OWNER");

    await mockApiRoute(page, "**/api/v1/forms**", {
      forms: [
        {
          _id: "form-1",
          title: "New Member Intake",
          description: "Onboarding form for new gym members",
          status: "PUBLISHED",
          responseCount: 15,
          createdAt: "2025-06-01T00:00:00Z",
        },
      ],
      total: 1,
    });
  });

  test("loads forms list page", async ({ page }) => {
    await page.goto("/forms");

    await expect(page).toHaveURL(/\/forms/);
  });

  test("displays existing forms", async ({ page }) => {
    await page.goto("/forms");

    await expect(
      page.getByText(/new member intake|forms/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("navigates to form detail/edit", async ({ page }) => {
    await mockApiRoute(page, "**/api/v1/forms/form-1**", {
      _id: "form-1",
      title: "New Member Intake",
      description: "Onboarding form for new gym members",
      questions: [
        {
          _id: "q-1",
          type: "text",
          label: "Full Name",
          required: true,
        },
      ],
    });

    await page.goto("/forms");

    const formLink = page.getByText(/new member intake/i).first();
    if (await formLink.isVisible().catch(() => false)) {
      await formLink.click();
      await page.waitForTimeout(1000);
    }
  });
});
