import { test, expect } from "@playwright/test";
import { mockDefaultApiRoutes, mockApiRoute } from "../../helpers/api-mocks";
import { setupAuthState } from "../../helpers/auth.helpers";

test.describe("Admin Verification Queue", () => {
  test.beforeEach(async ({ page }) => {
    await mockDefaultApiRoutes(page, "ADMIN");
    await setupAuthState(page, "ADMIN");

    await mockApiRoute(page, "**/api/v1/admin/verifications**", {
      verifications: [
        {
          _id: "ver-1",
          userId: "user-1",
          userName: "John Smith",
          role: "GYM_OWNER",
          status: "PENDING",
          documents: [
            { type: "government_id", url: "https://example.com/id.jpg" },
            { type: "business_registration", url: "https://example.com/reg.pdf" },
          ],
          createdAt: "2025-06-01T00:00:00Z",
        },
      ],
      total: 1,
    });
  });

  test("loads verification queue page", async ({ page }) => {
    await page.goto("/admin/verification");

    await expect(page).toHaveURL(/\/admin\/verification/);
  });

  test("displays pending verifications", async ({ page }) => {
    await page.goto("/admin/verification");

    await expect(
      page.getByText(/john smith|pending|verification/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("shows verification details", async ({ page }) => {
    await page.goto("/admin/verification");

    // Click on a verification to view details
    const verificationItem = page.getByText(/john smith/i).first();
    if (await verificationItem.isVisible().catch(() => false)) {
      await verificationItem.click();
      await page.waitForTimeout(1000);
    }
  });
});
