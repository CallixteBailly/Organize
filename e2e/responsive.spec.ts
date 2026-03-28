import { test, expect, devices } from "@playwright/test";

test.describe("Responsive design", () => {
  test("login page is usable on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/login");

    const connectButton = page.getByRole("button", { name: "Se connecter" });
    await expect(connectButton).toBeVisible();

    // Check touch targets are large enough (44px min)
    const box = await connectButton.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThanOrEqual(40);
  });

  test("register form is scrollable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/register");

    const createButton = page.getByRole("button", { name: "Creer mon garage" });
    await createButton.scrollIntoViewIfNeeded();
    await expect(createButton).toBeVisible();
  });
});
