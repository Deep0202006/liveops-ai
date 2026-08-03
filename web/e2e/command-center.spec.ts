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
