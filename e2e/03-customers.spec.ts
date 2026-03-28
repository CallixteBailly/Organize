import { test, expect } from "@playwright/test";
import { loginAsOwner, expectHeading, expectToast } from "./helpers";

test.describe("03 — Customers & Vehicles", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  // ── Customer List ──

  test("customer list shows seeded customers", async ({ page }) => {
    await page.goto("/customers");
    await expectHeading(page, "Clients");
    await expect(page.getByText("Dupont")).toBeVisible();
    await expect(page.getByText("Transport Martin")).toBeVisible();
  });

  test("customer list shows correct count", async ({ page }) => {
    await page.goto("/customers");
    await expect(page.getByText("2 client(s)")).toBeVisible();
  });

  test("search customers by name", async ({ page }) => {
    await page.goto("/customers");
    await page.getByPlaceholder("Rechercher").fill("Claire");
    await page.getByPlaceholder("Rechercher").press("Enter");
    await expect(page.getByText("Dupont")).toBeVisible();
  });

  test("search customers by phone", async ({ page }) => {
    await page.goto("/customers");
    await page.getByPlaceholder("Rechercher").fill("0611223344");
    await page.getByPlaceholder("Rechercher").press("Enter");
    await expect(page.getByText("Dupont")).toBeVisible();
  });

  test("search with no results shows empty state", async ({ page }) => {
    await page.goto("/customers");
    await page.getByPlaceholder("Rechercher").fill("zzzznonexistent");
    await page.getByPlaceholder("Rechercher").press("Enter");
    await expect(page.getByText("Aucun resultat")).toBeVisible();
  });

  // ── Create Customer ──

  test("create individual customer via dialog", async ({ page }) => {
    await page.goto("/customers");
    await page.getByRole("button", { name: /Ajouter/ }).click();
    await expectHeading(page, "Nouveau client");

    await page.locator('input[name="firstName"]').fill("Marc");
    await page.locator('input[name="lastName"]').fill("Leroy");
    await page.locator('input[name="phone"]').fill("0699887766");
    await page.locator('input[name="email"]').fill("marc@test.fr");
    await page.locator('input[name="city"]').fill("Marseille");
    await page.getByRole("button", { name: "Creer" }).click();

    // Should redirect to customer detail
    await expectHeading(page, "Coordonnees");
    await expect(page.getByText("marc@test.fr")).toBeVisible();
  });

  // ── Customer Detail ──

  test("customer detail shows contact info", async ({ page }) => {
    await page.goto("/customers");
    await page.getByText("Dupont").click();
    await expect(page.getByText("0611223344")).toBeVisible();
    await expect(page.getByText("claire@example.fr")).toBeVisible();
    await expect(page.getByText("Paris")).toBeVisible();
  });

  test("customer detail shows vehicles", async ({ page }) => {
    await page.goto("/customers");
    await page.getByText("Dupont").click();
    await expectHeading(page, "Vehicules");
    await expect(page.getByText("Peugeot")).toBeVisible();
    await expect(page.getByText("308")).toBeVisible();
    await expect(page.getByText("Citroen")).toBeVisible();
  });

  test("customer detail shows stats cards", async ({ page }) => {
    await page.goto("/customers");
    await page.getByText("Dupont").click();
    const main = page.locator("main");
    await expect(main.getByText("CA total")).toBeVisible();
  });

  // ── Add Vehicle ──

  test("add vehicle dialog opens from customer detail", async ({ page }) => {
    await page.goto("/customers");
    await page.getByText("Dupont").click();
    // Click the "Ajouter" button within the Vehicules section
    const vehiculesSection = page.locator("text=Vehicules").locator("..");
    await vehiculesSection.getByRole("button", { name: "Ajouter" }).click();
    await expect(page.getByText("Nouveau vehicule")).toBeVisible();
    await expect(page.locator('input[name="licensePlate"]')).toBeVisible();
    await expect(page.locator('input[name="brand"]')).toBeVisible();
    await expect(page.locator('input[name="model"]')).toBeVisible();
  });

  // ── Vehicle Detail ──

  test("vehicle detail shows technical info", async ({ page }) => {
    await page.goto("/customers");
    await page.getByText("Dupont").click();
    await page.getByText("Peugeot").first().click();
    await expect(page.getByText("EE001AA")).toBeVisible();
    await expect(page.getByText("diesel")).toBeVisible();
    await expect(page.getByText("2022")).toBeVisible();
  });

  // ── Company Customer ──

  test("company customer shows Entreprise badge", async ({ page }) => {
    await page.goto("/customers");
    await expect(page.getByText("Entreprise")).toBeVisible();
  });
});
