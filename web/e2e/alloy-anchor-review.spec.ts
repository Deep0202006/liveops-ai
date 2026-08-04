import { expect, test } from "@playwright/test";

test.use({ colorScheme: "light", reducedMotion: "reduce" });

test("Alloy Glass landing anchor", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: /See machine risk forming/ })).toBeVisible();
  await expect(page.locator(".living-fleet")).toBeVisible();
  await page.screenshot({ path: "../docs/alloy-glass/screenshots/anchors/landing-1440x900.png", fullPage: true });
});

test("Alloy Glass command anchor", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/command");
  await expect(page.getByText("LIVE SIMULATION")).toBeVisible();
  await expect(page.locator(".asset-command")).toBeVisible();
  await page.screenshot({ path: "../docs/alloy-glass/screenshots/anchors/command-1440x900.png", fullPage: false });
});

test("Alloy Glass mobile anchors do not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const [path, name] of [["/", "landing-mobile-390x844"], ["/command", "command-mobile-390x844"]] as const) {
    await page.goto(path);
    await expect(path === "/" ? page.locator(".living-fleet") : page.locator(".fleet-panel")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `../docs/alloy-glass/screenshots/anchors/${name}.png`, fullPage: false });
  }
});
