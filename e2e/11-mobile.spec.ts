import { test, expect } from "@playwright/test";
import { loginAsOwner, expectHeading } from "./helpers";

test.describe("11 — Mobile Responsiveness & PWA", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("mobile bottom navigation is visible after login", async ({ page }) => {
    await loginAsOwner(page);
    const nav = page.locator("nav.fixed");
    await expect(nav).toBeVisible();
  });

  test("mobile nav shows 5 items max", async ({ page }) => {
    await loginAsOwner(page);
    const navLinks = page.locator("nav.fixed a");
    const count = await navLinks.count();
    expect(count).toBeLessThanOrEqual(5);
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("mobile dashboard KPIs are visible", async ({ page }) => {
    await loginAsOwner(page);
    await expect(page.getByText("CA du jour")).toBeVisible();
    await expect(page.getByText("CA du mois")).toBeVisible();
  });

  test("mobile stock page is usable", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/stock");
    await expectHeading(page, "Stock");
    await expect(page.getByText("Filtre huile")).toBeVisible();
  });

  test("mobile customer list is scrollable", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/customers");
    await expect(page.getByText("Dupont")).toBeVisible();
  });

  test("mobile login form has large touch targets", async ({ page }) => {
    await page.goto("/login");
    const button = page.getByRole("button", { name: "Se connecter" });
    const box = await button.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(40);
  });

  test("PWA manifest is accessible and correct", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);
    const json = await response?.json();
    expect(json.name).toBe("Organize - Gestion de Garage");
    expect(json.short_name).toBe("Organize");
    expect(json.display).toBe("standalone");
    expect(json.theme_color).toBe("#2563eb");
    expect(json.icons).toHaveLength(3);
    expect(json.icons[0].sizes).toBe("192x192");
    expect(json.icons[1].sizes).toBe("512x512");
  });

  test("PWA icons are accessible", async ({ page }) => {
    for (const icon of ["/icons/icon-192.png", "/icons/icon-512.png", "/icons/icon-512-maskable.png"]) {
      const response = await page.goto(icon);
      expect(response?.status()).toBe(200);
    }
  });
});
