import { type Page, expect } from "@playwright/test";

export const OWNER = { email: "owner@test.fr", password: "password123" };
export const MECHANIC = { email: "meca@test.fr", password: "password123" };
export const SECRETARY = { email: "secr@test.fr", password: "password123" };

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mot de passe").fill(password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(/^(?!.*\/login)/, { timeout: 15000 });
}

export async function loginAsOwner(page: Page) {
  await login(page, OWNER.email, OWNER.password);
}

export async function loginAsMechanic(page: Page) {
  await login(page, MECHANIC.email, MECHANIC.password);
}

export async function loginAsSecretary(page: Page) {
  await login(page, SECRETARY.email, SECRETARY.password);
}

export async function expectHeading(page: Page, name: string) {
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible({ timeout: 10000 });
}

export async function expectToast(page: Page, text: string) {
  await expect(page.getByText(text).first()).toBeVisible({ timeout: 10000 });
}
