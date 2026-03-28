import { test, expect } from "@playwright/test";
import { loginAsOwner, expectHeading, expectToast } from "./helpers";

test.describe("09 — Settings", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  // ── Settings Hub ──

  test("settings hub shows all 3 sections", async ({ page }) => {
    await page.goto("/settings");
    await expectHeading(page, "Parametres");
    await expect(page.getByText("Profil du garage")).toBeVisible();
    await expect(page.getByText("Equipe")).toBeVisible();
    await expect(page.getByText("Gerer vos fournisseurs")).toBeVisible();
  });

  // ── Garage Settings ──

  test("garage settings loads with seeded data", async ({ page }) => {
    await page.goto("/settings/garage");
    await expectHeading(page, "Profil du garage");
    await expect(page.locator('input[name="name"]')).toHaveValue("Garage E2E Test");
    await expect(page.locator('input[name="siret"]')).toHaveValue("99988877766655");
    await expect(page.locator('input[name="city"]')).toHaveValue("Testville");
    await expect(page.locator('input[name="postalCode"]')).toHaveValue("75000");
  });

  test("garage settings has document prefix fields", async ({ page }) => {
    await page.goto("/settings/garage");
    await expect(page.locator('input[name="invoicePrefix"]')).toHaveValue("FA");
    await expect(page.locator('input[name="quotePrefix"]')).toHaveValue("DE");
    await expect(page.locator('input[name="repairOrderPrefix"]')).toHaveValue("OR");
  });

  // ── User Management ──

  test("users page shows all team members", async ({ page }) => {
    await page.goto("/settings/users");
    await expectHeading(page, "Equipe");
    await expect(page.getByText("Paul Gerant")).toBeVisible();
    await expect(page.getByText("Luc Meca")).toBeVisible();
    await expect(page.getByText("Anne Secr")).toBeVisible();
  });

  test("users page shows correct role badges", async ({ page }) => {
    await page.goto("/settings/users");
    await expect(page.getByText("Proprietaire")).toBeVisible();
    await expect(page.getByText("Mecanicien")).toBeVisible();
    await expect(page.getByText("Secretaire")).toBeVisible();
  });

  test("add user dialog opens with role select", async ({ page }) => {
    await page.goto("/settings/users");
    await page.getByRole("button", { name: /Ajouter/ }).click();
    await expectHeading(page, "Nouvel utilisateur");
    await expect(page.locator('select[name="role"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test("owner cannot deactivate themselves", async ({ page }) => {
    await page.goto("/settings/users");
    // The owner row should NOT have a deactivate button
    const ownerRow = page.locator("text=Paul Gerant").locator("..");
    await expect(ownerRow.getByRole("button", { name: "Desactiver" })).not.toBeVisible();
  });
});
