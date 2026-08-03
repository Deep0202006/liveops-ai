import { expect, test } from "@playwright/test";

type Metrics = { lcp: number; cls: number; requests: number; transferred: number };
declare global { interface Window { __releaseLcp: number; __releaseCls: number } }

test.beforeEach(async({page})=>{await page.addInitScript(()=>{window.__releaseLcp=0;window.__releaseCls=0;new PerformanceObserver(list=>{for(const entry of list.getEntries())window.__releaseLcp=entry.startTime}).observe({type:"largest-contentful-paint",buffered:true});new PerformanceObserver(list=>{for(const entry of list.getEntries() as Array<PerformanceEntry & {value:number;hadRecentInput:boolean}>)if(!entry.hadRecentInput)window.__releaseCls+=entry.value}).observe({type:"layout-shift",buffered:true})})});
test.skip(({browserName})=>browserName!=="chromium","Production performance budgets use the stable Chromium measurement environment");

async function collect(page: import("@playwright/test").Page): Promise<Metrics> {
  return page.evaluate(() => {
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    return { lcp: window.__releaseLcp, cls: window.__releaseCls, requests: resources.length, transferred: resources.reduce((sum, entry) => sum + entry.transferSize, 0) };
  });
}

test("landing and workspace stay responsive in the local production preview",async({page})=>{await page.goto("/");await page.waitForLoadState("networkidle");const landing=await collect(page);expect(landing.lcp).toBeLessThan(2500);expect(landing.cls).toBeLessThan(0.05);const start=Date.now();await page.getByRole("link",{name:"Analyze a machine"}).click();await expect(page.getByRole("heading",{name:"Machine remaining useful life"})).toBeVisible();const routeMs=Date.now()-start;expect(routeMs).toBeLessThan(200);await page.goto("/app");await page.waitForLoadState("networkidle");const workspaceLoad=await collect(page);expect(workspaceLoad.lcp).toBeLessThan(2500);expect(workspaceLoad.cls).toBeLessThan(0.05);await page.getByRole("button",{name:"Monitor sample"}).click();await page.getByRole("button",{name:"Validate trajectory"}).click();await page.getByRole("option").first().click();const predictionStart=Date.now();await page.getByRole("button",{name:"Estimate remaining life"}).click();await expect(page.locator("#prediction-result")).toBeVisible();const predictionRenderMs=Date.now()-predictionStart;const workspaceResult=await collect(page);expect(workspaceResult.cls).toBeLessThan(0.05);console.log(JSON.stringify({landing,workspaceLoad,workspaceResult,routeMs,predictionRenderMs}))});
