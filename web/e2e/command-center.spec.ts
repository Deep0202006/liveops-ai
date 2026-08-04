import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("fleet controls, asset focus, queue, and command palette", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("LIVE SIMULATION")).toBeVisible();
  await expect(page.getByText("No physical factory connection")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rotating assets" })).toBeVisible();
  const cycle = page.getByText(/CYCLE \d+\/\d+/);
  const before = await cycle.textContent();
  await page.locator(".time-conductor").getByRole("button", { name: "Step one cycle" }).click();
  await expect(cycle).not.toHaveText(before ?? "");
  await page.getByLabel("Simulation speed").selectOption("20");
  await page.locator(".fleet-main").nth(1).click();
  await expect(page.getByText("SELECTED ASSET COMMAND VIEW")).toBeVisible();
  await page.getByRole("link", { name: "Maintenance" }).click();
  await expect(page.getByRole("heading", { name: "Priority queue" })).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: /Commands/ }).click();
  await expect(page.getByRole("dialog", { name: "Command palette" })).toBeVisible();
});

test("command center has no serious accessibility violations", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "Automated axe gate runs in Chromium");
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.filter((item) => item.impact === "critical" || item.impact === "serious")).toEqual([]);
});

test("mobile command center is usable without page overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByText("LIVE SIMULATION")).toBeVisible();
  expect(await page.locator("body").evaluate((body) => body.scrollWidth)).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog", { name: "Application navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
});

test("alert feed combines severity, asset, and event-type filters across simulation controls", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Seek simulation cycle").fill("29");
  await page.getByLabel("Alert severity").selectOption("warning");
  await page.getByLabel("Alert asset").fill("RT-12");
  await page.getByLabel("Alert event types").selectOption(["MAINTENANCE_DUE"]);
  await expect(page.getByText("Unit RT-12 crossed the maintenance-planning threshold.")).toBeVisible();
  await expect(page.locator(".alert-row")).toHaveCount(1);
  await page.getByRole("button", { name: /Acknowledge RT-12/ }).click();
  await expect(page.getByRole("button", { name: /Acknowledge RT-12/ })).toBeDisabled();
  await page.locator(".time-conductor").getByRole("button", { name: "Play simulation" }).click();
  await expect(page.locator(".alert-row")).toHaveCount(1);
  await page.locator(".time-conductor").getByRole("button", { name: "Pause simulation" }).click();
  await page.getByLabel("Seek simulation cycle").fill("0");
  await expect(page.getByText("No events match the active filters.")).toBeVisible();
  await page.getByRole("button", { name: "Reset alert filters" }).click();
  await expect(page.getByLabel("0 active alert filters")).toBeVisible();
  await page.getByLabel("Alert severity").selectOption("critical");
  await page.locator(".command-bar label select").selectOption("degradation-wave");
  await expect(page.getByLabel("0 active alert filters")).toBeVisible();
  await expect(page.getByLabel("Alert severity")).toHaveValue("all");
});

test("pin limit and shared comparison journey remain synchronized", async ({ page }) => {
  await page.goto("/");
  const pins = page.getByRole("button", { name: /^Pin RT-/ });
  await pins.nth(0).click();
  await pins.nth(1).click();
  await pins.nth(2).click();
  await pins.nth(3).click();
  await expect(page.getByRole("status").filter({ hasText: "Up to 3 assets can be compared" })).toHaveCount(1);
  await page.getByRole("button", { name: "Compare pinned (3)" }).click();
  await expect(page.getByRole("heading", { name: "Operational comparison" })).toBeFocused();
  await expect(page.locator(".comparison-overview article")).toHaveCount(3);
  await expect(page.locator(".rul-shared-row")).toHaveCount(3);
  await page.getByRole("button", { name: "30 cycles" }).click();
  await page.getByLabel("Selected comparison sensor").selectOption({ index: 1 });
  const before = await page.getByText(/0\/29|1\/29/).first().textContent();
  await page.getByRole("button", { name: "Play simulation" }).click();
  await page.waitForTimeout(650);
  await page.getByRole("button", { name: "Pause simulation" }).click();
  await expect(page.getByText(before ?? "0/29", { exact: true })).toBeHidden();
  await page.getByRole("button", { name: /^Remove RT-/ }).first().click();
  await expect(page.locator(".comparison-overview article")).toHaveCount(2);
  await page.getByRole("link", { name: /Investigate asset/ }).first().click();
  await expect(page).toHaveURL(/\/asset\/RT-/);
  await expect(page.getByText("SELECTED ASSET COMMAND VIEW")).toBeVisible();
});
