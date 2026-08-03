import { expect, test, type Page } from "@playwright/test";

test.skip(({ browserName }) => browserName !== "chromium", "Deterministic visual baselines use Chromium");
async function stable(page: Page) { await page.waitForLoadState("networkidle"); await page.evaluate(() => document.fonts.ready); await page.addStyleTag({ content: "*{caret-color:transparent!important}.telemetry-field{background-image:none!important}" }); }
async function shot(page: Page, name: string) { await stable(page); await expect(page).toHaveScreenshot(name, { animations: "disabled", caret: "hide", fullPage: true, maxDiffPixelRatio: 0.001 }); }

for (const [name, scenario] of [["normal-shift", "normal-shift"], ["degradation-wave", "degradation-wave"], ["maintenance-window", "maintenance-window"]] as const) {
  test(`${name} overview`, async ({ page }) => { await page.setViewportSize({ width: 1440, height: 900 }); await page.goto("/"); await page.locator(".command-bar label select").selectOption(scenario); await shot(page, `${name}-overview.png`); });
}

for (const [name, edge] of [["healthy", "healthy"], ["warning", "plan_maintenance"], ["critical", "critical"]] as const) {
  test(`selected ${name} asset`, async ({ page }) => { await page.goto("/"); const tile = page.locator(`.fleet-tile.edge-${edge}`).first(); if (await tile.count()) await tile.locator(".fleet-main").click(); await shot(page, `selected-${name}-asset.png`); });
}

test("paused command center", async ({ page }) => { await page.goto("/"); await shot(page, "paused-command-center.png"); });
test("maintenance queue", async ({ page }) => { await page.goto("/maintenance"); await shot(page, "maintenance-queue.png"); });
test("alert feed", async ({ page }) => { await page.goto("/"); await page.getByLabel("Seek simulation cycle").fill("29"); await shot(page, "alert-feed.png"); });
test("asset comparison foundation", async ({ page }) => { await page.goto("/"); await page.locator(".pin").nth(0).click(); await page.locator(".pin").nth(1).click(); await shot(page, "asset-pins.png"); });
test("model evidence", async ({ page }) => { await page.goto("/model"); await shot(page, "model-evidence-command-center.png"); });
test("Data Lab", async ({ page }) => { await page.goto("/lab"); await shot(page, "data-lab.png"); });
test("mobile command center", async ({ page }) => { await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/"); await shot(page, "mobile-command-center.png"); });
test("reduced-motion command center", async ({ page }) => { await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto("/"); await shot(page, "reduced-motion-command-center.png"); });
