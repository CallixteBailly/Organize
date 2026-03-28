import { test, expect } from "@playwright/test";

test.describe("Navigation (unauthenticated)", () => {
  test("all protected routes redirect to login", async ({ page }) => {
    const protectedRoutes = [
      "/",
      "/stock",
      "/customers",
      "/invoices",
      "/settings",
    ];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("login page is accessible without redirect loop", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveURL(/\/login/);
    // Should not redirect again
    await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();
  });

  test("register page is accessible without redirect", async ({ page }) => {
    await page.goto("/register");
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe("PWA manifest", () => {
  test("manifest.json is accessible", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);
    const json = await response?.json();
    expect(json.name).toBe("Organize - Gestion de Garage");
    expect(json.display).toBe("standalone");
  });
});
