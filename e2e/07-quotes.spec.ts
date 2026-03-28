import { test, expect } from "@playwright/test";
import { loginAsOwner, expectHeading } from "./helpers";

test.describe("07 — Quotes", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test("quotes page loads with empty state", async ({ page }) => {
    await page.goto("/quotes");
    await expectHeading(page, "Devis");
    await expect(page.getByText("Aucun devis")).toBeVisible();
  });

  test("new quote button is visible", async ({ page }) => {
    await page.goto("/quotes");
    await expect(page.getByRole("link", { name: /Nouveau devis/ })).toBeVisible();
  });

  test("new quote page has customer search", async ({ page }) => {
    await page.goto("/quotes/new");
    await expectHeading(page, "Nouveau devis");
    await expect(page.getByText("Rechercher un client")).toBeVisible();
  });

  test("new quote: search and select customer shows form", async ({ page }) => {
    await page.goto("/quotes/new");
    await page.getByPlaceholder("Nom, telephone, email...").fill("Claire");
    await page.getByRole("button", { name: "Chercher" }).click();
    await page.getByText("Claire Dupont").click();

    await expect(page.getByText("Claire Dupont")).toBeVisible();
    await expect(page.getByRole("button", { name: "Creer le devis" })).toBeVisible();
    await expect(page.locator('input[name="validUntil"]')).toBeVisible();
  });
});
