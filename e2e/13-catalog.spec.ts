import { test, expect } from "@playwright/test";
import { loginAsOwner } from "./helpers";

test.describe("13 — Catalogue pièces", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
    await page.goto("/catalog");
  });

  test("catalog page shows both search mode tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Par immatriculation" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Par marque / modèle" })).toBeVisible();
  });

  test("plate search tab is active by default", async ({ page }) => {
    const plateTab = page.getByRole("button", { name: "Par immatriculation" });
    await expect(plateTab).toHaveClass(/bg-background/);
  });

  test("switching to model search shows make and model inputs", async ({ page }) => {
    await page.getByRole("button", { name: "Par marque / modèle" }).click();
    await expect(page.locator("#vehicle-make")).toBeVisible();
    await expect(page.locator("#vehicle-model")).toBeVisible();
  });

  test("model search returns parts for Renault Clio", async ({ page }) => {
    await page.getByRole("button", { name: "Par marque / modèle" }).click();

    await page.locator("#vehicle-make").fill("Renault");
    await page.locator("#vehicle-model").fill("Clio");
    await page.getByRole("button", { name: /Rechercher/i }).click();

    // Vehicle card should appear with Renault Clio
    await expect(page.getByText(/Renault/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/Clio/)).toBeVisible({ timeout: 5000 });
  });

  test("parts display shows part name prominently and OEM references", async ({ page }) => {
    await page.getByRole("button", { name: "Par marque / modèle" }).click();
    await page.locator("#vehicle-make").fill("Renault");
    await page.locator("#vehicle-model").fill("Clio");
    await page.getByRole("button", { name: /Rechercher/i }).click();

    // Wait for catalog to load
    await expect(page.getByText(/Renault/)).toBeVisible({ timeout: 15000 });

    // Check part name is shown (mock data: "Jeu de plaquettes de frein avant")
    await expect(page.getByText("Jeu de plaquettes de frein avant")).toBeVisible({ timeout: 10000 });

    // Check OEM references label is present
    await expect(page.getByText("Réf. constructeur :").first()).toBeVisible();
  });

  test("tip to open from repair order is shown when no roId", async ({ page }) => {
    await expect(page.getByText("Pour commander une pièce")).not.toBeVisible();
    // Run model search to trigger the tip
    await page.getByRole("button", { name: "Par marque / modèle" }).click();
    await page.locator("#vehicle-make").fill("Renault");
    await page.locator("#vehicle-model").fill("Clio");
    await page.getByRole("button", { name: /Rechercher/i }).click();
    await expect(page.getByText(/Renault/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("Pour commander une pièce")).toBeVisible({ timeout: 5000 });
  });
});
