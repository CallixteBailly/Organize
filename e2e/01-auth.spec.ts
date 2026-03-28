import { test, expect } from "@playwright/test";
import { login, OWNER, MECHANIC, loginAsOwner, expectHeading } from "./helpers";

test.describe("01 — Authentication", () => {
  test("unauthenticated user is redirected to /login", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login page renders with form fields", async ({ page }) => {
    await page.goto("/login");
    await expectHeading(page, "Connexion");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Mot de passe")).toBeVisible();
    await expect(page.getByRole("button", { name: "Se connecter" })).toBeVisible();
  });

  test("invalid credentials show error message", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("fake@test.fr");
    await page.getByLabel("Mot de passe").fill("wrongpass");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByText("Email ou mot de passe incorrect")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("owner can login and reaches dashboard", async ({ page }) => {
    await loginAsOwner(page);
    await expect(page).toHaveURL("/");
    await expectHeading(page, "Dashboard");
  });

  test("mechanic can login and is redirected to /repair-orders", async ({ page }) => {
    await login(page, MECHANIC.email, MECHANIC.password);
    await expect(page).toHaveURL("/repair-orders");
  });

  test("register page is functional with all fields", async ({ page }) => {
    await page.goto("/register");
    await expectHeading(page, "Creer votre compte");
    await expect(page.getByPlaceholder("Nom du garage")).toBeVisible();
    await expect(page.getByPlaceholder("SIRET (14 chiffres)")).toBeVisible();
    await expect(page.getByPlaceholder("Adresse")).toBeVisible();
    await expect(page.locator('input[name="city"]')).toBeVisible();
    await expect(page.locator('input[name="postalCode"]')).toBeVisible();
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.getByRole("button", { name: "Creer mon garage" })).toBeVisible();
  });

  test("register page links to login", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("link", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test("all protected routes redirect when unauthenticated", async ({ page }) => {
    for (const route of ["/", "/customers", "/stock", "/orders", "/invoices", "/repair-orders", "/quotes", "/settings"]) {
      await page.goto(route);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("callbackUrl preserves original destination after login", async ({ page }) => {
    await page.goto("/customers");
    await expect(page).toHaveURL(/\/login.*callbackUrl/);
    await page.getByLabel("Email").fill(OWNER.email);
    await page.getByLabel("Mot de passe").fill(OWNER.password);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL("/customers");
  });
});
