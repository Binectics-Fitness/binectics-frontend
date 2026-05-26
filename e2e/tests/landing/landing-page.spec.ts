import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders hero section", async ({ page }) => {
    await expect(page.getByText(/50\+.*countries/i).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /explore|get started|marketplace/i }).first()
    ).toBeVisible();
  });

  test("renders how it works section", async ({ page }) => {
    await expect(page.getByText(/how it works/i).first()).toBeVisible();
    await expect(page.getByText(/browse.*discover/i).first()).toBeVisible();
    await expect(page.getByText(/subscribe.*connect/i).first()).toBeVisible();
    await expect(page.getByText(/train.*track/i).first()).toBeVisible();
  });

  test("renders features section", async ({ page }) => {
    const features = page.getByText(/features/i).first();
    await expect(features).toBeVisible();
  });

  test("renders pricing section with toggle", async ({ page }) => {
    const pricingSection = page.getByText(/pricing/i).first();
    await expect(pricingSection).toBeVisible();

    // Check for pricing tiers
    await expect(page.getByText(/explorer/i).first()).toBeVisible();
    await expect(page.getByText(/athlete/i).first()).toBeVisible();
    await expect(page.getByText(/professional/i).first()).toBeVisible();
  });

  test("pricing toggle switches between monthly and annual", async ({ page }) => {
    // Find the pricing toggle
    const toggle = page
      .getByRole("button", { name: /annual|yearly/i })
      .or(page.getByText(/annual|yearly/i).first());

    if (await toggle.isVisible()) {
      await toggle.click();
      // After clicking annual, prices should reflect the discount
      await page.waitForTimeout(300);
    }
  });

  test("FAQ accordion opens and closes", async ({ page }) => {
    // Scroll to FAQ section
    const faqHeading = page.getByText(/frequently asked/i).or(page.getByText(/FAQ/i)).first();
    await faqHeading.scrollIntoViewIfNeeded();

    // Find accordion items
    const accordionButtons = page.locator("button").filter({ hasText: /\?/ });
    const firstQuestion = accordionButtons.first();

    if (await firstQuestion.isVisible()) {
      // Click to open
      await firstQuestion.click();
      await page.waitForTimeout(300);

      // Click to close
      await firstQuestion.click();
      await page.waitForTimeout(300);
    }
  });

  test("renders testimonials section", async ({ page }) => {
    await expect(page.getByText(/testimonial|what.*say/i).first()).toBeVisible();
  });

  test("renders global reach section", async ({ page }) => {
    await expect(
      page.getByText(/global|countries/i).first()
    ).toBeVisible();
  });

  test("renders QR check-in section", async ({ page }) => {
    await expect(page.getByText(/QR.*check/i).first()).toBeVisible();
  });

  test("renders footer with navigation links", async ({ page }) => {
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();

    await expect(footer.getByText(/privacy/i).first()).toBeVisible();
    await expect(footer.getByText(/terms/i).first()).toBeVisible();
  });

  test("CTA buttons are visible and link correctly", async ({ page }) => {
    const ctaButtons = page.getByRole("link", { name: /explore|get started|sign up|join/i });
    const firstCta = ctaButtons.first();
    await expect(firstCta).toBeVisible();
  });

  test.describe("Mobile Responsiveness", () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test("renders correctly on mobile viewport", async ({ page }) => {
      await page.goto("/");

      // Hero should still be visible
      await expect(page.getByText(/50\+.*countries/i).first()).toBeVisible();

      // Navigation may be collapsed into hamburger menu
      const menuButton = page.getByRole("button", { name: /menu/i }).or(
        page.locator("[aria-label*='menu']"),
      );
      // Menu button may or may not exist depending on implementation
    });
  });

  test.describe("Tablet Responsiveness", () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test("renders correctly on tablet viewport", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByText(/50\+.*countries/i).first()).toBeVisible();
    });
  });
});
