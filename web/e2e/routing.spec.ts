import { expect, test } from "@playwright/test";

test("landing and command center have distinct route shells", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator(".operations-shell")).toHaveCount(0);

  await page.goto("/command");
  await expect(page.getByText("LIVE SIMULATION")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Application navigation" })).toBeVisible();
});

test("direct operational routes and compatibility aliases survive refresh", async ({ page }) => {
  for (const route of ["/maintenance", "/compare", "/model", "/lab", "/app", "/app/model"]) {
    await page.goto(route);
    await expect(page.locator("body")).not.toBeEmpty();
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`${route.replace("/", "\\/")}$`));
  }
});

test("unknown routes render an explicit recovery view", async ({ page }) => {
  await page.goto("/not-an-operational-route");
  await expect(page.getByRole("heading", { name: "Operational route not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Command Center" })).toHaveAttribute("href", "/command");
});
