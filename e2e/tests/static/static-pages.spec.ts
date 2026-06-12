import { test, expect } from "@playwright/test";

test.describe("Static Pages", () => {
  const pages = [
    { path: "/about", heading: /about/i },
    { path: "/pricing", heading: /pricing|plans/i },
    { path: "/contact", heading: /contact/i },
    { path: "/privacy", heading: /privacy/i },
    { path: "/terms", heading: /terms/i },
    { path: "/cookies", heading: /cookie/i },
  ];

  for (const { path, heading } of pages) {
    test(`${path} loads and renders content`, async ({ page }) => {
      await page.goto(path);

      await expect(page).toHaveURL(new RegExp(path));
      await expect(page.getByText(heading).first()).toBeVisible({ timeout: 10_000 });
    });
  }

  test("about page has company information", async ({ page }) => {
    await page.goto("/about");

    await expect(
      page.getByText(/binectics|fitness|global/i).first()
    ).toBeVisible();
  });

  test("contact page has a contact form or contact info", async ({ page }) => {
    await page.goto("/contact");

    // Should have either a form or contact details
    const form = page.locator("form").first();
    const contactInfo = page.getByText(/email|phone|address/i).first();

    const hasForm = await form.isVisible().catch(() => false);
    const hasContactInfo = await contactInfo.isVisible().catch(() => false);

    expect(hasForm || hasContactInfo).toBeTruthy();
  });

  test("pricing page shows plan tiers", async ({ page }) => {
    await page.goto("/pricing");

    // Should show pricing tiers
    await expect(
      page.getByText(/explorer|athlete|professional|\$/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test("footer is present on static pages", async ({ page }) => {
    await page.goto("/about");

    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });
});
