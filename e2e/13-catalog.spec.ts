import { test, expect } from "@playwright/test";
import { loginAsOwner, expectToast } from "./helpers";

// Plate seeded in global-setup + handled by mock provider (Renault Clio IV 2018)
const DEMO_PLATE = "FG533LT";
const DEMO_PLATE_FORMATTED = "FG-533-LT";

// Shared search helper
async function searchByModel(page: Parameters<typeof loginAsOwner>[0], make: string, model: string) {
  await page.getByRole("button", { name: "Par marque / modèle" }).click();
  await page.locator("#vehicle-make").fill(make);
  await page.locator("#vehicle-model").fill(model);
  await page.getByRole("button", { name: /Rechercher/i }).click();
}

test.describe("13 — Catalogue pièces", () => {
  // ── A — Navigation ────────────────────────────────────────────────────────

  test.describe("A — Navigation", () => {
    test("unauthenticated user is redirected to /login", async ({ page }) => {
      await page.goto("/catalog");
      await expect(page).toHaveURL(/\/login/);
    });

    test("page shows both search mode tabs", async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/catalog");
      await expect(page.getByRole("button", { name: "Par immatriculation" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Par marque / modèle" })).toBeVisible();
    });

    test("plate tab is active by default", async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/catalog");
      await expect(page.getByRole("button", { name: "Par immatriculation" })).toHaveClass(
        /bg-background/,
      );
    });

    test("switching to model tab shows make and model inputs", async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/catalog");
      await page.getByRole("button", { name: "Par marque / modèle" }).click();
      await expect(page.locator("#vehicle-make")).toBeVisible();
      await expect(page.locator("#vehicle-model")).toBeVisible();
    });
  });

  // ── B — Recherche par immatriculation ─────────────────────────────────────

  test.describe("B — Recherche par immatriculation", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/catalog");
    });

    test("formats plate input automatically (FG533LT → FG-533-LT)", async ({ page }) => {
      const plateInput = page.locator('input[aria-label="Plaque d\'immatriculation"]');
      await plateInput.fill("FG533LT");
      await expect(plateInput).toHaveValue(DEMO_PLATE_FORMATTED);
    });

    test("search button disabled when plate too short", async ({ page }) => {
      const plateInput = page.locator('input[aria-label="Plaque d\'immatriculation"]');
      await plateInput.fill("AB");
      await expect(page.getByRole("button", { name: /Rechercher/i })).toBeDisabled();
    });

    test("search button enabled when plate has 5+ chars", async ({ page }) => {
      const plateInput = page.locator('input[aria-label="Plaque d\'immatriculation"]');
      await plateInput.fill("AB12C");
      await expect(page.getByRole("button", { name: /Rechercher/i })).toBeEnabled();
    });

    test("demo plate FG533LT returns Renault Clio IV", async ({ page }) => {
      const plateInput = page.locator('input[aria-label="Plaque d\'immatriculation"]');
      await plateInput.fill(DEMO_PLATE);
      await page.getByRole("button", { name: /Rechercher/i }).click();
      await expect(page.getByText(/Renault/)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/Clio/)).toBeVisible();
    });

    test("unknown plate returns generic demo vehicle without null year displayed", async ({
      page,
    }) => {
      const plateInput = page.locator('input[aria-label="Plaque d\'immatriculation"]');
      await plateInput.fill("ZZ999ZZ");
      await page.getByRole("button", { name: /Rechercher/i }).click();
      await expect(page.getByText(/Inconnu/)).toBeVisible({ timeout: 15000 });
      // year is null → must NOT render "(null)" in the UI
      await expect(page.getByText(/\(null\)/)).not.toBeVisible();
    });

    test("?plate=FG533LT in URL triggers auto-search on load", async ({ page }) => {
      await page.goto(`/catalog?plate=${DEMO_PLATE}`);
      // Input should be pre-filled with formatted value
      await expect(
        page.locator('input[aria-label="Plaque d\'immatriculation"]'),
      ).toHaveValue(DEMO_PLATE_FORMATTED);
      // Vehicle should load automatically
      await expect(page.getByText(/Renault/)).toBeVisible({ timeout: 15000 });
    });

    test("plate seeded in local DB shows 'Connu' badge", async ({ page }) => {
      // FG533LT is seeded in global-setup — localVehicle is returned by /api/catalog/lookup
      await page.goto(`/catalog?plate=${DEMO_PLATE}`);
      await expect(page.getByText(/Renault/)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("Connu", { exact: true })).toBeVisible();
    });

    test("'Connu' vehicle shows 'Voir fiche' link", async ({ page }) => {
      await page.goto(`/catalog?plate=${DEMO_PLATE}`);
      await expect(page.getByText(/Renault/)).toBeVisible({ timeout: 15000 });
      await expect(page.getByRole("link", { name: /Voir fiche/ })).toBeVisible();
    });

    test("unknown plate does NOT show 'Connu' badge", async ({ page }) => {
      const plateInput = page.locator('input[aria-label="Plaque d\'immatriculation"]');
      await plateInput.fill("ZZ999ZZ");
      await page.getByRole("button", { name: /Rechercher/i }).click();
      await expect(page.getByText(/Inconnu/)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("Connu", { exact: true })).not.toBeVisible();
    });
  });

  // ── C — Recherche par marque / modèle ─────────────────────────────────────

  test.describe("C — Recherche par marque / modèle", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/catalog");
      await page.getByRole("button", { name: "Par marque / modèle" }).click();
    });

    test("search button disabled when fields are empty", async ({ page }) => {
      await expect(page.getByRole("button", { name: /Rechercher/i })).toBeDisabled();
    });

    test("search button disabled when only make is filled", async ({ page }) => {
      await page.locator("#vehicle-make").fill("Renault");
      await expect(page.getByRole("button", { name: /Rechercher/i })).toBeDisabled();
    });

    test("Renault Clio returns catalog results", async ({ page }) => {
      await page.locator("#vehicle-make").fill("Renault");
      await page.locator("#vehicle-model").fill("Clio");
      await page.getByRole("button", { name: /Rechercher/i }).click();
      await expect(page.getByText(/Renault/)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText(/Clio/)).toBeVisible();
    });

    test("BMW Série 3 returns catalog results", async ({ page }) => {
      await page.locator("#vehicle-make").fill("BMW");
      await page.locator("#vehicle-model").fill("Série 3");
      await page.getByRole("button", { name: /Rechercher/i }).click();
      await expect(page.getByText(/BMW/)).toBeVisible({ timeout: 15000 });
    });

    test("unknown make returns synthetic fallback with make name shown", async ({ page }) => {
      await page.locator("#vehicle-make").fill("MakeInconnue");
      await page.locator("#vehicle-model").fill("ModelInconnu");
      await page.getByRole("button", { name: /Rechercher/i }).click();
      // Synthetic vehicle built from params — make must appear
      await expect(page.getByText(/MakeInconnue/i)).toBeVisible({ timeout: 15000 });
    });

    test("parts are loaded after model search", async ({ page }) => {
      await page.locator("#vehicle-make").fill("Renault");
      await page.locator("#vehicle-model").fill("Clio");
      await page.getByRole("button", { name: /Rechercher/i }).click();
      await expect(page.getByText(/Renault/)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("Jeu de plaquettes de frein avant")).toBeVisible({
        timeout: 10000,
      });
    });
  });

  // ── D — Affichage du catalogue (PartsCatalog) ─────────────────────────────

  test.describe("D — Affichage du catalogue", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/catalog");
      await searchByModel(page, "Renault", "Clio");
      await expect(page.getByText(/Renault/)).toBeVisible({ timeout: 15000 });
    });

    test("first category is open by default", async ({ page }) => {
      await expect(
        page.getByText("Jeu de plaquettes de frein avant"),
      ).toBeVisible({ timeout: 10000 });
    });

    test("part name is displayed prominently", async ({ page }) => {
      await expect(
        page.getByText("Jeu de plaquettes de frein avant"),
      ).toBeVisible({ timeout: 10000 });
    });

    test("'N° origine :' label is visible", async ({ page }) => {
      await expect(page.getByText("N° origine :").first()).toBeVisible({ timeout: 10000 });
    });

    test("accordion can be toggled closed then re-opened", async ({ page }) => {
      // Click the "Freins" category button to close the open section
      const freinsBtn = page.getByRole("button").filter({ hasText: /^Freins/ });
      await freinsBtn.click();
      await expect(
        page.getByText("Jeu de plaquettes de frein avant"),
      ).not.toBeVisible({ timeout: 5000 });
      // Click again to re-open
      await freinsBtn.click();
      await expect(
        page.getByText("Jeu de plaquettes de frein avant"),
      ).toBeVisible({ timeout: 5000 });
    });

    test("tip 'Pour commander une pièce' is shown when no roId", async ({ page }) => {
      await expect(page.getByText("Pour commander une pièce")).toBeVisible({ timeout: 5000 });
    });

    test("no 'Ajouter' buttons when no roId", async ({ page }) => {
      await expect(page.getByRole("button", { name: "Ajouter" })).not.toBeVisible();
    });

    test("OEM references > 3 shows overflow counter '+N'", async ({ page }) => {
      // "Disque de frein avant" has 5 OEM refs → shows 3 + "+2"
      await expect(page.getByText("+2")).toBeVisible({ timeout: 10000 });
    });

    test("empty catalog shows 'Aucune pièce trouvée'", async ({ page }) => {
      // Intercept parts API to simulate a vehicle with no matching parts
      await page.route("/api/catalog/parts*", (route) =>
        route.fulfill({ json: { categories: [] } }),
      );
      await searchByModel(page, "Renault", "Clio");
      await expect(page.getByText(/Renault/)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("Aucune pièce trouvée pour ce véhicule")).toBeVisible({
        timeout: 5000,
      });
    });
  });

  // ── F — Mode Histovec (champs carte grise) ────────────────────────────────

  test.describe("F — Mode Histovec", () => {
    test.beforeEach(async ({ page }) => {
      await loginAsOwner(page);
      // ?histovec=1 active le mode Histovec en dev/test (NODE_ENV !== "production")
      await page.goto("/catalog?histovec=1");
    });

    test("histovec mode shows 'N° de formule' and 'Nom du titulaire' fields", async ({
      page,
    }) => {
      await expect(page.locator('input[aria-label="Numéro de formule"]')).toBeVisible({
        timeout: 5000,
      });
      await expect(page.locator('input[aria-label="Nom du titulaire"]')).toBeVisible();
    });

    test("histovec submit disabled when formule or nom missing", async ({ page }) => {
      const plateInput = page.locator('input[aria-label="Plaque d\'immatriculation"]');
      await plateInput.fill("FG533LT");
      // Only plate filled — button must remain disabled (formule + nom required)
      await expect(page.getByRole("button", { name: /Rechercher/i })).toBeDisabled();
    });

    test("histovec submit enabled when all fields filled", async ({ page }) => {
      await page.locator('input[aria-label="Plaque d\'immatriculation"]').fill("FG533LT");
      await page.locator('input[aria-label="Numéro de formule"]').fill("20140AB12345");
      await page.locator('input[aria-label="Nom du titulaire"]').fill("DUPONT");
      await expect(page.getByRole("button", { name: /Rechercher/i })).toBeEnabled();
    });
  });

  // ── E — Flux contextuel depuis une intervention ───────────────────────────

  test.describe("E — Flux contextuel depuis une intervention", () => {
    test("repair order detail shows 'Chercher pièces catalogue' link", async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/repair-orders");
      await page.getByText("OR-E2E-001").click();
      await expect(
        page.getByRole("link", { name: "Chercher pièces catalogue" }),
      ).toBeVisible({ timeout: 10000 });
    });

    test("link navigates to catalog with plate and roId params", async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/repair-orders");
      await page.getByText("OR-E2E-001").click();
      await page.getByRole("link", { name: "Chercher pièces catalogue" }).click();
      await expect(page).toHaveURL(/\/catalog.*plate.*roId/);
    });

    test("catalog with roId shows 'Ajouter' buttons and hides tip", async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/repair-orders");
      await page.getByText("OR-E2E-001").click();
      await page.getByRole("link", { name: "Chercher pièces catalogue" }).click();
      // Auto-search triggered by plate in URL
      await expect(page.getByText(/Renault/)).toBeVisible({ timeout: 15000 });
      await expect(
        page.getByRole("button", { name: "Ajouter" }).first(),
      ).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Pour commander une pièce")).not.toBeVisible();
    });

    test("adding a part to repair order shows success toast", async ({ page }) => {
      await loginAsOwner(page);
      await page.goto("/repair-orders");
      await page.getByText("OR-E2E-001").click();
      await page.getByRole("link", { name: "Chercher pièces catalogue" }).click();
      await expect(page.getByText(/Renault/)).toBeVisible({ timeout: 15000 });

      // Fill price and submit
      const priceInput = page.locator('input[placeholder="Prix €"]').first();
      await priceInput.fill("25");
      await page.getByRole("button", { name: "Ajouter" }).first().click();

      await expectToast(page, "Pièce ajoutée à l'OR");
    });

    test("direct URL with roId hides tip and shows Ajouter", async ({ page }) => {
      // Simulates opening catalog with ?plate=...&roId=... directly (e.g. from RO detail)
      await loginAsOwner(page);
      // Get the repair order ID first
      await page.goto("/repair-orders");
      await page.getByText("OR-E2E-001").click();
      const link = page.getByRole("link", { name: "Chercher pièces catalogue" });
      const href = await link.getAttribute("href");
      expect(href).toMatch(/\/catalog\?plate=.+&roId=.+/);

      await page.goto(href!);
      await expect(page.getByText(/Renault/)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText("Pour commander une pièce")).not.toBeVisible();
      await expect(page.getByRole("button", { name: "Ajouter" }).first()).toBeVisible({
        timeout: 10000,
      });
    });
  });
});
