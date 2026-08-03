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
  await page.goto("/maintenance");
  await expect(page.getByRole("heading", { name: "Priority queue" })).toBeVisible();
  await page.goto("/model");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Traceable performance");
  await page.goto("/lab");
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
