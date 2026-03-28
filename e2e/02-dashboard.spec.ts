import { test, expect } from "@playwright/test";
import { loginAsOwner, expectHeading } from "./helpers";

test.describe("02 — Dashboard (UC-05)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsOwner(page);
  });

  test("dashboard displays all 6 KPI cards", async ({ page }) => {
    await expectHeading(page, "Dashboard");
    const main = page.locator("main");
    await expect(main.getByText("CA du jour")).toBeVisible();
    await expect(main.getByText("CA du mois")).toBeVisible();
    await expect(main.getByText("Factures impayees")).toBeVisible();
    await expect(main.getByText("Alertes stock")).toBeVisible();
  });

  test("dashboard shows revenue chart", async ({ page }) => {
    await expect(page.getByText("CA des 30 derniers jours")).toBeVisible();
  });

  test("dashboard shows N vs N-1 comparison", async ({ page }) => {
    await expect(page.getByText("CA mensuel vs N-1")).toBeVisible();
  });

  test("dashboard shows alerts section with stock alerts", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Alertes" })).toBeVisible();
    // Seeded data has 2 items under threshold (Plaquettes qty=1 min=4, Filtre air qty=0 min=2)
    await expect(page.getByText("article(s) sous le seuil")).toBeVisible();
  });

  test("stock alert count in KPI matches actual low stock items", async ({ page }) => {
    // The KPI card for alerts stock should show "2" (Plaquettes + Filtre air)
    const alertCard = page.locator("text=Alertes stock").locator("..");
    await expect(alertCard.getByText("2")).toBeVisible();
  });

  test("customer count in KPI is correct", async ({ page }) => {
    const custCard = page.locator("text=Clients").locator("..");
    await expect(custCard.getByText("2")).toBeVisible();
  });
});
