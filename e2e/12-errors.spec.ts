import { test, expect } from "@playwright/test";
import { loginAsOwner } from "./helpers";

test.describe("12 — Error Handling & Edge Cases", () => {
  test("404 not-found page renders for unknown routes (authenticated)", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/this-does-not-exist-at-all");
    await expect(page.getByText("Page introuvable")).toBeVisible();
    await expect(page.getByRole("link", { name: "Retour au dashboard" })).toBeVisible();
  });

  test("non-existent customer ID shows not found", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/customers/00000000-0000-0000-0000-000000000000");
    await expect(
      page.getByText("introuvable").or(page.getByText("not found")).or(page.getByText("404")),
    ).toBeVisible({ timeout: 10000 });
  });

  test("non-existent stock item ID shows not found", async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/stock/00000000-0000-0000-0000-000000000000");
    await expect(
      page.getByText("introuvable").or(page.getByText("not found")).or(page.getByText("404")),
    ).toBeVisible({ timeout: 10000 });
  });

  test("unauthenticated API request returns 200 with redirect body", async ({ page }) => {
    // Playwright request follows redirects; middleware returns HTML redirect
    const response = await page.request.get("/api/dashboard/kpis");
    // Response arrives after redirect to login page (200 HTML)
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain("Connexion");
  });

  test("open redirect prevention: external callbackUrl is ignored", async ({ page }) => {
    await page.goto("/login?callbackUrl=https://evil.com");
    await page.getByLabel("Email").fill("owner@test.fr");
    await page.getByLabel("Mot de passe").fill("password123");
    await page.getByRole("button", { name: "Se connecter" }).click();
    // After login, should land on "/" (our open redirect fix), not on evil.com
    await page.waitForURL(/localhost:3000\/$/, { timeout: 10000 });
    expect(page.url()).toBe("http://localhost:3000/");
  });
});
