import { test, expect } from "@playwright/test";

/**
 * PRD Validation E2E Tests — validates key use cases from the PRD
 */

const OWNER_EMAIL = "admin@garage-martin.fr";
const OWNER_PASSWORD = "password123";
const MECHANIC_EMAIL = "meca@garage-martin.fr";

async function login(page: any, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(/^(?!.*\/login)/, { timeout: 10000 });
}

// ── Authentication ──

test.describe("Authentication & Registration", () => {
  test("owner can login and reaches dashboard", async ({ page }) => {
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("wrong@test.fr");
    await page.getByLabel("Mot de passe").fill("wrong");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByText("Email ou mot de passe incorrect")).toBeVisible();
  });

  test("register page is functional", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Creer votre compte" })).toBeVisible();
    await expect(page.getByPlaceholder("Nom du garage")).toBeVisible();
    await expect(page.getByPlaceholder("SIRET")).toBeVisible();
  });
});

// ── UC-05: Dashboard ──

test.describe("UC-05: Dashboard consultation (owner)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);
  });

  test("dashboard shows KPI cards", async ({ page }) => {
    await expect(page.getByText("CA du jour")).toBeVisible();
    await expect(page.getByText("CA du mois")).toBeVisible();
    await expect(page.getByText("Factures impayees")).toBeVisible();
  });

  test("dashboard shows revenue chart and comparison", async ({ page }) => {
    await expect(page.getByText("CA des 30 derniers jours")).toBeVisible();
    await expect(page.getByText("CA mensuel vs N-1")).toBeVisible();
  });

  test("dashboard shows alerts section", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Alertes" })).toBeVisible();
  });
});

// ── Customer & Vehicle Management ──

test.describe("Customer & Vehicle Management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);
  });

  test("customer list page loads with seeded data", async ({ page }) => {
    await page.goto("/customers");
    await expect(page.getByRole("heading", { name: "Clients" })).toBeVisible();
    await expect(page.getByText("Durand")).toBeVisible();
  });

  test("customer detail page shows contact and vehicle", async ({ page }) => {
    await page.goto("/customers");
    await page.getByText("Durand").click();
    await expect(page.getByRole("heading", { name: "Coordonnees" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Vehicules" })).toBeVisible();
    await expect(page.getByText("Clio V")).toBeVisible();
  });

  test("customer search works", async ({ page }) => {
    await page.goto("/customers");
    await page.getByPlaceholder("Rechercher").fill("Marie");
    await page.getByPlaceholder("Rechercher").press("Enter");
    await expect(page.getByText("Durand")).toBeVisible();
  });

  test("add customer dialog opens", async ({ page }) => {
    await page.goto("/customers");
    await page.getByRole("button", { name: /Ajouter/ }).click();
    await expect(page.getByRole("heading", { name: "Nouveau client" })).toBeVisible();
  });
});

// ── UC-08: Stock & Alerts ──

test.describe("UC-08: Stock Management & Alerts", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);
  });

  test("stock list page loads with items", async ({ page }) => {
    await page.goto("/stock");
    await expect(page.getByRole("heading", { name: "Stock" })).toBeVisible();
    await expect(page.getByText("Filtre a huile Renault")).toBeVisible();
  });

  test("stock item detail page loads", async ({ page }) => {
    await page.goto("/stock");
    await page.getByText("Filtre a huile Renault").click();
    await expect(page.getByText("FH-001")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Mouvements" })).toBeVisible();
  });

  test("low stock alerts shows items under threshold", async ({ page }) => {
    await page.goto("/stock/alerts");
    await expect(page.getByRole("heading", { name: "Alertes stock" })).toBeVisible();
    await expect(page.getByText("Plaquettes frein")).toBeVisible();
  });

  test("stock categories page loads with seeded data", async ({ page }) => {
    await page.goto("/stock/categories");
    await expect(page.getByRole("heading", { name: "Categories" })).toBeVisible();
    await expect(page.getByText("Filtres")).toBeVisible();
    await expect(page.getByText("Freinage")).toBeVisible();
  });

  test("stock low stock filter works", async ({ page }) => {
    await page.goto("/stock");
    await page.getByRole("button", { name: /Alertes/ }).click();
    await expect(page.getByText("Plaquettes frein")).toBeVisible();
  });
});

// ── Orders ──

test.describe("Order Management", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);
  });

  test("orders page loads", async ({ page }) => {
    await page.goto("/orders");
    await expect(page.getByRole("heading", { name: "Commandes" })).toBeVisible();
  });

  test("quick order page loads", async ({ page }) => {
    await page.goto("/orders/new");
    await expect(page.getByRole("heading", { name: "Commande rapide" })).toBeVisible();
    await expect(page.getByText("Identifier la piece")).toBeVisible();
  });

  test("supplier management page loads", async ({ page }) => {
    await page.goto("/settings/suppliers");
    await expect(page.getByRole("heading", { name: "Fournisseurs" })).toBeVisible();
    await expect(page.getByText("Auto Pieces Express")).toBeVisible();
  });
});

// ── Repair Orders ──

test.describe("Repair Orders", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);
  });

  test("repair orders page loads", async ({ page }) => {
    await page.goto("/repair-orders");
    await expect(page.getByRole("heading", { name: "Interventions" })).toBeVisible();
  });

  test("new repair order page with customer search", async ({ page }) => {
    await page.goto("/repair-orders/new");
    await expect(page.getByRole("heading", { name: "Nouvel ordre de reparation" })).toBeVisible();
  });
});

// ── Quotes ──

test.describe("Quotes", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);
  });

  test("quotes page loads", async ({ page }) => {
    await page.goto("/quotes");
    await expect(page.getByRole("heading", { name: "Devis", exact: true })).toBeVisible();
  });

  test("new quote page with customer search", async ({ page }) => {
    await page.goto("/quotes/new");
    await expect(page.getByRole("heading", { name: "Nouveau devis" })).toBeVisible();
  });
});

// ── Invoices ──

test.describe("Invoices", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);
  });

  test("invoices page loads", async ({ page }) => {
    await page.goto("/invoices");
    await expect(page.getByRole("heading", { name: "Factures" })).toBeVisible();
  });
});

// ── Settings ──

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);
  });

  test("settings hub shows all sections", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByText("Profil du garage")).toBeVisible();
    await expect(page.getByText("Equipe")).toBeVisible();
    await expect(page.getByText("Gerer vos fournisseurs")).toBeVisible();
  });

  test("garage settings loads with seeded data", async ({ page }) => {
    await page.goto("/settings/garage");
    await expect(page.getByRole("heading", { name: "Profil du garage" })).toBeVisible();
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toHaveValue("Garage Martin Test");
  });

  test("users management shows team members", async ({ page }) => {
    await page.goto("/settings/users");
    await expect(page.getByRole("heading", { name: "Equipe" })).toBeVisible();
    await expect(page.getByText("Jean Martin")).toBeVisible();
    await expect(page.getByText("Pierre Dupont")).toBeVisible();
  });
});

// ── RBAC ──

test.describe("RBAC: Mechanic restrictions", () => {
  test("mechanic is redirected away from dashboard", async ({ page }) => {
    await login(page, MECHANIC_EMAIL, OWNER_PASSWORD);
    await expect(page).toHaveURL("/repair-orders");
  });

  test("mechanic can access stock page", async ({ page }) => {
    await login(page, MECHANIC_EMAIL, OWNER_PASSWORD);
    await page.goto("/stock");
    await expect(page.getByRole("heading", { name: "Stock" })).toBeVisible();
  });
});

// ── Mobile ──

test.describe("Mobile responsiveness", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("mobile bottom navigation is visible after login", async ({ page }) => {
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);
    await expect(page.locator("nav").last()).toBeVisible();
  });

  test("mobile dashboard KPIs are visible", async ({ page }) => {
    await login(page, OWNER_EMAIL, OWNER_PASSWORD);
    await expect(page.getByText("CA du jour")).toBeVisible();
  });
});

// ── PWA ──

test.describe("PWA", () => {
  test("manifest.json is accessible and correct", async ({ page }) => {
    const response = await page.goto("/manifest.json");
    expect(response?.status()).toBe(200);
    const json = await response?.json();
    expect(json.name).toBe("Organize - Gestion de Garage");
    expect(json.display).toBe("standalone");
    expect(json.icons).toHaveLength(3);
  });
});
