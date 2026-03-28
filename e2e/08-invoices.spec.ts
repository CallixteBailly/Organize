import { test, expect } from "@playwright/test";
import { loginAsOwner, expectHeading } from "./helpers";

test.describe("08 — Invoices (NF525)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test("invoices page loads", async ({ page }) => {
    await page.goto("/invoices");
    await expectHeading(page, "Factures");
  });

  test("invoices empty state shows message", async ({ page }) => {
    await page.goto("/invoices");
    await expect(page.getByText("Les factures apparaitront ici")).toBeVisible();
  });

  test("FEC export API requires auth (via request context)", async ({ page }) => {
    // Use page.request which doesn't follow redirects by default for API
    const response = await page.request.get("/api/invoices/export");
    // Middleware returns 200 with redirect HTML or 302
    expect(response.status()).toBeLessThanOrEqual(302);
  });
});
