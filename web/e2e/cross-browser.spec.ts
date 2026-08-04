import { expect, test } from "@playwright/test";

test("critical command-center and secondary routes are cross-browser clean", async ({ page, browserName }) => {
  const failures: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") failures.push(message.text()); });
  page.on("pageerror", (error) => failures.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Rotating assets" })).toBeVisible();
  await page.getByRole("button", { name: "Step one cycle" }).last().click();
  await page.locator(".fleet-main").nth(1).click();
  await expect(page.getByText("SELECTED ASSET COMMAND VIEW")).toBeVisible();
  await page.getByRole("link",{name:"Maintenance"}).click();
  await expect(page.getByRole("heading", { name: "Priority queue" })).toBeVisible();
  await page.getByRole("link",{name:"Model Evidence"}).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Traceable performance");
  await expect(page.locator(".evidence-identity code")).not.toHaveText("Loading");
  await page.waitForTimeout(500);
  await page.getByRole("link",{name:"Data Lab"}).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("External trajectory analysis");
  expect(failures, `${browserName} console/page failures`).toEqual([]);
});

test("mobile navigation opens and closes by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog", { name: "Application navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Application navigation" })).toBeHidden();
});

test("accelerated replay, filters, comparison, and scenario cleanup stay cross-browser clean", async ({ page, browserName }) => {
  const failures:string[]=[];page.on("console",message=>{if(message.type()==="error")failures.push(message.text())});page.on("pageerror",error=>failures.push(error.message));
  await page.goto("/");
  await page.getByLabel("Simulation speed").selectOption("20");
  await page.getByLabel("Seek simulation cycle").fill("29");
  await page.getByLabel("Alert severity").selectOption("warning");
  await page.getByLabel("Alert asset").fill("RT-12");
  await page.getByRole("button",{name:"Pin RT-01"}).click();await page.getByRole("button",{name:"Pin RT-02"}).click();
  await page.getByRole("button",{name:"Compare pinned (2)"}).click();
  await page.getByLabel("Seek comparison cycle").fill("10");
  await page.getByLabel("Selected comparison sensor").selectOption({index:2});
  await page.getByRole("combobox",{name:"Scenario",exact:true}).selectOption("degradation-wave");
  await expect(page.locator(".comparison-overview article")).toHaveCount(2);
  await page.getByRole("link",{name:"Return to fleet"}).click();
  await expect(page.getByLabel("Alert severity")).toHaveValue("all");
  expect(failures,`${browserName} comparison/filter failures`).toEqual([]);
});
