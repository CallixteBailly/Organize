import { test, expect } from "@playwright/test";
import { loginAsOwner, expectHeading } from "./helpers";

test.describe("05 — Orders & Suppliers", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  // ── Orders List ──

  test("orders page loads with empty state", async ({ page }) => {
    await page.goto("/orders");
    await expectHeading(page, "Commandes");
    await expect(page.getByText("Aucune commande")).toBeVisible();
  });

  test("quick order link is visible", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByRole("link", { name: /Commande rapide/ })).toBeVisible();
  });

  // ── Quick Order Page (UC-01) ──

  test("quick order page shows search step", async ({ page }) => {
    await page.goto("/orders/new");
    await expectHeading(page, "Commande rapide");
    await expect(page.getByText("Identifier la piece")).toBeVisible();
    await expect(page.getByPlaceholder("Code-barres")).toBeVisible();
  });

  test("quick order barcode search finds item", async ({ page }) => {
    await page.goto("/orders/new");
    await page.getByPlaceholder("Code-barres").fill("3760099887766");
    await page.getByRole("button", { name: "Rechercher" }).click();
    await expect(page.getByText("Filtre huile Peugeot 308")).toBeVisible({ timeout: 10000 });
  });

  // ── Supplier Management ──

  test("suppliers page shows seeded suppliers", async ({ page }) => {
    await page.goto("/settings/suppliers");
    await expectHeading(page, "Fournisseurs");
    await expect(page.getByText("Pieces Auto Pro")).toBeVisible();
    await expect(page.getByText("Auto Distribution")).toBeVisible();
  });

  test("add supplier via dialog", async ({ page }) => {
    await page.goto("/settings/suppliers");
    await page.getByRole("button", { name: /Ajouter/ }).click();
    await expectHeading(page, "Nouveau fournisseur");

    await page.locator('input[name="name"]').fill("Fournisseur Test E2E");
    await page.locator('input[name="code"]').fill("FTE");
    await page.locator('input[name="email"]').fill("fte@test.fr");
    await page.locator('input[name="deliveryDays"]').fill("5");
    await page.getByRole("button", { name: "Creer" }).click();

    await expect(page.getByText("Fournisseur ajoute")).toBeVisible({ timeout: 10000 });
  });
});
