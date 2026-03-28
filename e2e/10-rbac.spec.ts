import { test, expect } from "@playwright/test";
import { loginAsMechanic, loginAsSecretary, loginAsOwner, expectHeading } from "./helpers";

test.describe("10 — RBAC Role Restrictions", () => {
  // ── Mechanic ──

  test("mechanic is redirected from dashboard to repair-orders", async ({ page }) => {
    await loginAsMechanic(page);
    await expect(page).toHaveURL("/repair-orders");
  });

  test("mechanic can access stock", async ({ page }) => {
    await loginAsMechanic(page);
    await page.goto("/stock");
    await expectHeading(page, "Stock");
  });

  test("mechanic can access repair orders", async ({ page }) => {
    await loginAsMechanic(page);
    await page.goto("/repair-orders");
    await expectHeading(page, "Interventions");
  });

  test("mechanic can access customers", async ({ page }) => {
    await loginAsMechanic(page);
    await page.goto("/customers");
    await expectHeading(page, "Clients");
  });

  test("mechanic cannot access settings/users (redirected)", async ({ page }) => {
    await loginAsMechanic(page);
    await page.goto("/settings/users");
    // Should be redirected to / which then redirects to /repair-orders
    await expect(page).not.toHaveURL("/settings/users");
  });

  test("mechanic cannot access settings/suppliers", async ({ page }) => {
    await loginAsMechanic(page);
    await page.goto("/settings/suppliers");
    await expect(page).not.toHaveURL("/settings/suppliers");
  });

  // ── Secretary ──

  test("secretary can access invoices", async ({ page }) => {
    await loginAsSecretary(page);
    await page.goto("/invoices");
    await expectHeading(page, "Factures");
  });

  test("secretary can access customers", async ({ page }) => {
    await loginAsSecretary(page);
    await page.goto("/customers");
    await expectHeading(page, "Clients");
  });

  test("secretary can access repair orders", async ({ page }) => {
    await loginAsSecretary(page);
    await page.goto("/repair-orders");
    await expectHeading(page, "Interventions");
  });

  // ── Owner ──

  test("owner can access all sections", async ({ page }) => {
    await loginAsOwner(page);

    for (const { route, heading } of [
      { route: "/", heading: "Dashboard" },
      { route: "/customers", heading: "Clients" },
      { route: "/stock", heading: "Stock" },
      { route: "/orders", heading: "Commandes" },
      { route: "/repair-orders", heading: "Interventions" },
      { route: "/quotes", heading: "Devis" },
      { route: "/invoices", heading: "Factures" },
      { route: "/settings", heading: "Parametres" },
      { route: "/settings/garage", heading: "Profil du garage" },
      { route: "/settings/users", heading: "Equipe" },
      { route: "/settings/suppliers", heading: "Fournisseurs" },
    ]) {
      await page.goto(route);
      await expectHeading(page, heading);
    }
  });
});
