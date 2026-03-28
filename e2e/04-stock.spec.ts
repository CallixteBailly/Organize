import { test, expect } from "@playwright/test";
import { loginAsOwner, expectHeading, expectToast } from "./helpers";

test.describe("04 — Stock Management (UC-08)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  // ── Stock List ──

  test("stock list shows seeded items", async ({ page }) => {
    await page.goto("/stock");
    await expectHeading(page, "Stock");
    await expect(page.getByText("Filtre huile Peugeot 308")).toBeVisible();
    await expect(page.getByText("Plaquettes frein AV 308")).toBeVisible();
    await expect(page.getByText("Filtre air Peugeot 308")).toBeVisible();
  });

  test("stock list shows correct count", async ({ page }) => {
    await page.goto("/stock");
    await expect(page.getByText("3 article(s)")).toBeVisible();
  });

  test("stock item shows OK badge when above threshold", async ({ page }) => {
    await page.goto("/stock");
    // Filtre huile has qty=15, min=3 → OK
    const filtreRow = page.locator("text=Filtre huile Peugeot 308").locator("..");
    await expect(filtreRow.getByText("OK")).toBeVisible();
  });

  test("stock item shows Bas badge when at/below threshold", async ({ page }) => {
    await page.goto("/stock");
    // Plaquettes has qty=1, min=4 → Bas
    const plaqRow = page.locator("text=Plaquettes frein AV 308").locator("..");
    await expect(plaqRow.getByText("Bas")).toBeVisible();
  });

  test("stock item shows Rupture badge when quantity is 0", async ({ page }) => {
    await page.goto("/stock");
    const airRow = page.locator("text=Filtre air Peugeot 308").locator("..");
    await expect(airRow.getByText("Rupture")).toBeVisible();
  });

  // ── Search & Filter ──

  test("search stock by name", async ({ page }) => {
    await page.goto("/stock");
    await page.getByPlaceholder("Rechercher").fill("Plaquettes");
    await page.getByPlaceholder("Rechercher").press("Enter");
    await expect(page.getByText("Plaquettes frein AV 308")).toBeVisible();
    await expect(page.getByText("Filtre huile")).not.toBeVisible();
  });

  test("search stock by reference", async ({ page }) => {
    await page.goto("/stock");
    await page.getByPlaceholder("Rechercher").fill("FH-308");
    await page.getByPlaceholder("Rechercher").press("Enter");
    await expect(page.getByText("Filtre huile")).toBeVisible();
  });

  test("filter by category", async ({ page }) => {
    await page.goto("/stock");
    await page.locator("select").first().selectOption({ label: "Freinage" });
    await expect(page.getByText("Plaquettes frein")).toBeVisible();
    await expect(page.getByText("Filtre huile")).not.toBeVisible();
  });

  test("filter low stock only", async ({ page }) => {
    await page.goto("/stock");
    await page.getByRole("button", { name: /Alertes/ }).click();
    await expect(page.getByText("Plaquettes frein")).toBeVisible();
    await expect(page.getByText("Filtre air")).toBeVisible();
    await expect(page.getByText("Filtre huile")).not.toBeVisible();
  });

  // ── Stock Item Detail ──

  test("stock item detail shows all info", async ({ page }) => {
    await page.goto("/stock");
    await page.getByText("Filtre huile Peugeot 308").click();
    await expect(page.getByText("FH-308")).toBeVisible();
    await expect(page.getByText("En stock")).toBeVisible();
    await expect(page.getByText("15")).toBeVisible();
    await expect(page.getByText("Mann")).toBeVisible();
    await expect(page.getByText("A1")).toBeVisible();
    await expectHeading(page, "Mouvements");
  });

  // ── Create Stock Item ──

  test("create stock item via dialog", async ({ page }) => {
    await page.goto("/stock");
    await page.getByRole("button", { name: /Ajouter/ }).last().click();
    await expectHeading(page, "Nouvel article");

    await page.locator('input[name="reference"]').fill("BG-UNIV");
    await page.locator('input[name="name"]').fill("Bougie universelle");
    await page.locator('input[name="brand"]').fill("NGK");
    await page.locator('input[name="sellingPrice"]').fill("8.50");
    await page.locator('input[name="quantity"]').fill("20");
    await page.locator('input[name="minQuantity"]').fill("5");
    await page.getByRole("button", { name: "Creer" }).click();

    await expectToast(page, "Article cree");
  });

  // ── Record Stock Movement ──

  test("record stock entry movement", async ({ page }) => {
    await page.goto("/stock");
    await page.getByText("Filtre huile Peugeot 308").click();
    await page.getByRole("button", { name: "Mouvement" }).click();
    await expectHeading(page, "Nouveau mouvement");

    await page.locator('select[name="type"]').selectOption("entry");
    await page.locator('input[name="quantity"]').fill("10");
    await page.locator('input[name="reason"]').fill("Reception commande test");
    await page.getByRole("button", { name: "Enregistrer" }).click();

    await expectToast(page, "Mouvement enregistre");
  });

  // ── Low Stock Alerts Page (UC-08) ──

  test("alerts page shows items under threshold", async ({ page }) => {
    await page.goto("/stock/alerts");
    await expectHeading(page, "Alertes stock");
    await expect(page.getByText("Plaquettes frein AV 308")).toBeVisible();
    await expect(page.getByText("Filtre air Peugeot 308")).toBeVisible();
  });

  test("alerts page shows quantity vs threshold", async ({ page }) => {
    await page.goto("/stock/alerts");
    // Plaquettes: qty=1, min=4 → "1 / 4"
    await expect(page.getByText("1 / 4")).toBeVisible();
  });

  // ── Categories ──

  test("categories page shows seeded categories", async ({ page }) => {
    await page.goto("/stock/categories");
    await expectHeading(page, "Categories");
    await expect(page.getByText("Moteur")).toBeVisible();
    await expect(page.getByText("Freinage")).toBeVisible();
    await expect(page.getByText("Electricite")).toBeVisible();
  });

  test("create category", async ({ page }) => {
    await page.goto("/stock/categories");
    await page.locator('input[name="name"]').fill("Pneumatiques");
    await page.getByRole("button", { name: /Ajouter/ }).click();
    await expectToast(page, "Categorie creee");
  });

  // ── Movements History ──

  test("movements page loads", async ({ page }) => {
    await page.goto("/stock/movements");
    await expectHeading(page, "Mouvements de stock");
  });
});
