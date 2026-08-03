import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const output = "../docs/frontend/screenshots";
mkdirSync(output, { recursive: true });
test.skip(({ browserName }) => browserName !== "chromium", "Stable visual baselines use Chromium only");

async function stable(page: Page) { await page.waitForLoadState("networkidle"); await page.evaluate(() => document.fonts.ready); }
async function capture(page: Page,path:string) { await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(900); await page.addStyleTag({content:".request-id,.error-state code,.product-state{visibility:hidden!important}.focus-lens:before{display:none!important}"}); const name=path.slice(path.lastIndexOf("/")+1); await expect(page).toHaveScreenshot(name,{fullPage:true,animations:"disabled",caret:"hide",maxDiffPixelRatio:0.0005}); }

for (const viewport of [{width:1440,height:900},{width:1280,height:800},{width:1024,height:768},{width:768,height:1024},{width:430,height:932},{width:390,height:844},{width:360,height:800}]) {
  test(`landing ${viewport.width}x${viewport.height}`, async ({ page }) => { await page.setViewportSize(viewport); await page.goto("/"); await stable(page); await capture(page,`${output}/landing-${viewport.width}x${viewport.height}.png`); expect(await page.locator("body").evaluate((body)=>body.scrollWidth)).toBeLessThanOrEqual(viewport.width); });
}

test("workspace states and prediction result", async ({ page }) => {
  await page.setViewportSize({width:1440,height:900}); await page.goto("/app"); await stable(page); await capture(page,`${output}/workspace-idle-1440x900.png`);
  await page.getByRole("button",{name:"Monitor sample"}).click(); await page.route("**/api/v1/datasets/inspect",async route=>{const response=await route.fetch();await new Promise(resolve=>setTimeout(resolve,1600));await route.fulfill({response})}); await page.getByRole("button",{name:"Validate trajectory"}).click(); await expect(page.getByRole("status").filter({hasText:"Uploading"})).toBeVisible(); await capture(page,`${output}/workspace-validating-1440x900.png`);
  await expect(page.getByRole("heading",{name:"Choose a machine"})).toBeVisible(); await capture(page,`${output}/machine-selection-1440x900.png`);
  await page.getByRole("option").first().click(); await expect(page.getByRole("button",{name:"Estimate remaining life"})).toBeEnabled(); await page.getByRole("button",{name:"Estimate remaining life"}).click(); await expect(page.locator("#prediction-result")).toBeVisible(); await capture(page,`${output}/prediction-result-1440x900.png`); await expect(page.locator(".rul-card")).toHaveScreenshot("rul-horizon-1440x900.png",{animations:"disabled",caret:"hide",maxDiffPixelRatio:0.0005});
});

test("validation error and API unavailable", async ({ page }) => {
  await page.goto("/app"); await stable(page); await page.getByLabel("Machine trajectory CSV").setInputFiles("e2e/fixtures/invalid.csv"); await page.getByRole("button",{name:"Validate trajectory"}).click(); await expect(page.getByRole("alert")).toBeVisible(); await capture(page,`${output}/validation-error-1440x900.png`);
  await page.route("**/api/v1/**",route=>route.abort()); await page.goto("/"); await page.waitForTimeout(800); await capture(page,`${output}/api-unavailable-1440x900.png`);
});

test("model evidence, demo mode, and reduced motion", async ({ page }) => {
  await page.goto("/app/model"); await stable(page); await capture(page,`${output}/model-evidence-1440x900.png`);
  await page.goto("/app"); await stable(page); await expect(page.getByText("Demo mode is active.")).toBeVisible(); await capture(page,`${output}/demo-mode-1440x900.png`); await page.getByRole("button",{name:"System status"}).click(); await expect(page.getByRole("dialog")).toBeVisible(); await capture(page,`${output}/status-drawer-1440x900.png`); await page.keyboard.press("Escape");
  await page.emulateMedia({reducedMotion:"reduce"}); await page.getByRole("button",{name:"Monitor sample"}).click(); await page.getByRole("button",{name:"Validate trajectory"}).click(); await page.getByRole("option").first().click(); await page.getByRole("button",{name:"Estimate remaining life"}).click(); await expect(page.locator("#prediction-result")).toBeVisible(); await capture(page,`${output}/reduced-motion-result-1440x900.png`);
});

test("mobile workspace result",async({page})=>{await page.setViewportSize({width:390,height:844});await page.goto("/app");await page.getByRole("button",{name:"Monitor sample"}).click();await page.getByRole("button",{name:"Validate trajectory"}).click();await page.getByRole("option").first().click();await page.getByRole("button",{name:"Estimate remaining life"}).click();await expect(page.locator("#prediction-result")).toBeVisible();await capture(page,`${output}/mobile-workspace-result-390x844.png`);expect(await page.locator("body").evaluate(body=>body.scrollWidth)).toBeLessThanOrEqual(390)});
