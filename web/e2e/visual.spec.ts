import { expect, test, type Page } from "@playwright/test";

test.skip(({ browserName }) => browserName !== "chromium", "Deterministic visual baselines use Chromium");
async function stable(page: Page) { await page.waitForLoadState("networkidle"); await page.evaluate(() => document.fonts.ready); await page.addStyleTag({ content: "*{caret-color:transparent!important}.telemetry-field{background-image:none!important}" }); }
async function shot(page: Page, name: string) { await stable(page); await expect(page).toHaveScreenshot(name, { animations: "disabled", caret: "hide", fullPage: true, maxDiffPixelRatio: 0.001 }); }
async function seek(page:Page,cycle:number){await page.getByLabel("Seek simulation cycle").fill(String(cycle));await expect(page.getByText(`CYCLE ${cycle}/29`)).toBeVisible()}

for (const [name, scenario] of [["normal-shift", "normal-shift"], ["degradation-wave", "degradation-wave"], ["maintenance-window", "maintenance-window"]] as const) {
  test(`${name} overview`, async ({ page }) => { await page.setViewportSize({ width: 1440, height: 900 }); await page.goto("/"); await page.locator(".command-bar label select").selectOption(scenario); await shot(page, `${name}-overview.png`); });
}

for (const [name, edge] of [["healthy", "healthy"], ["warning", "plan_maintenance"], ["critical", "critical"]] as const) {
  test(`selected ${name} asset`, async ({ page }) => { await page.goto("/"); const tile = page.locator(`.fleet-tile.edge-${edge}`).first(); if (await tile.count()) await tile.locator(".fleet-main").click(); await shot(page, `selected-${name}-asset.png`); });
}

test("paused command center", async ({ page }) => { await page.goto("/"); await shot(page, "paused-command-center.png"); });
test("maintenance queue", async ({ page }) => { await page.goto("/maintenance"); await shot(page, "maintenance-queue.png"); });
test("alert feed", async ({ page }) => { await page.goto("/"); await page.getByLabel("Seek simulation cycle").fill("29"); await shot(page, "alert-feed.png"); });
test("one pinned asset", async ({ page }) => { await page.goto("/"); await page.locator(".pin").nth(0).click(); await shot(page, "one-pinned-asset.png"); });
test("combined alert filters", async ({ page }) => { await page.goto("/"); await page.getByLabel("Seek simulation cycle").fill("29"); await page.getByLabel("Alert severity").selectOption("warning"); await page.getByLabel("Alert asset").fill("RT-12"); await page.getByLabel("Alert event types").selectOption(["MAINTENANCE_DUE"]); await shot(page, "alert-feed-combined-filters.png"); });
test("empty alert filters", async ({ page }) => { await page.goto("/"); await page.getByLabel("Alert severity").selectOption("critical"); await shot(page, "alert-feed-empty-filtered.png"); });
for (const count of [2,3]) test(`${count}-asset comparison`, async ({ page }) => { await page.goto("/"); await seek(page,29); for(let index=0;index<count;index+=1)await page.locator(".pin").nth(index).click(); await page.getByRole("button",{name:`Compare pinned (${count})`}).click(); await shot(page, `${count}-asset-comparison.png`); });
test("critical asset comparison", async ({ page }) => { await page.goto("/"); await page.locator(".command-bar label select").selectOption("maintenance-window");await expect(page.locator(".time-conductor b")).toHaveText("Maintenance Window"); await seek(page,29); for(let index=0;index<3;index+=1)await page.locator(".fleet-tile.edge-critical .pin").nth(index).click(); await page.getByRole("button",{name:"Compare pinned (3)"}).click(); await shot(page,"critical-asset-comparison.png"); });
for(const [name,width,height] of [["mobile",390,844],["tablet",820,1180]] as const)test(`${name} comparison`,async({page})=>{await page.setViewportSize({width,height});await page.goto("/");await seek(page,29);await page.locator(".pin").nth(0).click();await page.locator(".pin").nth(1).click();await page.getByRole("button",{name:"Compare pinned (2)"}).click();await shot(page,`${name}-comparison.png`)});
test("reduced-motion comparison",async({page})=>{await page.emulateMedia({reducedMotion:"reduce"});await page.goto("/");await seek(page,29);await page.locator(".pin").nth(0).click();await page.locator(".pin").nth(1).click();await page.getByRole("button",{name:"Compare pinned (2)"}).click();await shot(page,"reduced-motion-comparison.png")});
test("model evidence", async ({ page }) => { await page.goto("/model"); await shot(page, "model-evidence-command-center.png"); });
test("Data Lab", async ({ page }) => { await page.goto("/lab"); await shot(page, "data-lab.png"); });
test("mobile command center", async ({ page }) => { await page.setViewportSize({ width: 390, height: 844 }); await page.goto("/"); await shot(page, "mobile-command-center.png"); });
test("reduced-motion command center", async ({ page }) => { await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto("/"); await shot(page, "reduced-motion-command-center.png"); });
