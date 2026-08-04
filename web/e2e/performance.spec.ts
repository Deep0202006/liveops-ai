import { expect, test, type Page } from "@playwright/test";
type Metrics = { lcp: number; cls: number; requests: number; transferred: number };
declare global { interface Window { __releaseLcp: number; __releaseCls: number; __shiftSources: string[] } }
test.skip(({ browserName }) => browserName !== "chromium", "Production performance budgets use Chromium");
test.beforeEach(async ({ page }) => page.addInitScript(() => {
  window.__releaseLcp = 0; window.__releaseCls = 0; window.__shiftSources = [];
  new PerformanceObserver((list) => { for (const entry of list.getEntries()) window.__releaseLcp = entry.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => { for (const entry of list.getEntries() as Array<PerformanceEntry & { value: number; hadRecentInput: boolean; sources?: Array<{ node?: Node }> }>) if (!entry.hadRecentInput) { window.__releaseCls += entry.value; window.__shiftSources.push(...(entry.sources ?? []).map((source) => (source.node as Element | undefined)?.className?.toString() ?? source.node?.nodeName ?? "unknown")); } }).observe({ type: "layout-shift", buffered: true });
}));
const collect = (page: Page): Promise<Metrics> => page.evaluate(() => { const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[]; return { lcp: window.__releaseLcp, cls: window.__releaseCls, requests: resources.length, transferred: resources.reduce((sum, entry) => sum + entry.transferSize, 0) }; });
test("command center remains responsive in production preview", async ({ page }) => {
  await page.goto("/command"); await page.waitForLoadState("networkidle"); const initial = await collect(page); console.log("SHIFT_SOURCES", await page.evaluate(() => window.__shiftSources));
  expect(initial.lcp).toBeLessThan(2500); expect(initial.cls).toBeLessThan(.05);
  const start = performance.now(); await page.locator(".time-conductor").getByRole("button", { name: "Step one cycle" }).click(); await expect(page.getByText(/CYCLE 1\/29/)).toBeVisible(); const interactionMs = performance.now() - start;
  expect(interactionMs).toBeLessThan(200); await page.waitForTimeout(650); const updated = await collect(page); expect(updated.cls).toBeLessThan(.05); console.log(JSON.stringify({ initial, updated, interactionMs }));
});
