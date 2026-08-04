import { expect, test, type Locator, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DURATION_MS = 30 * 60_000;
const SAMPLE_MINUTES = [0, 5, 10, 15, 20, 25, 30] as const;
const ARTIFACT_DIR = path.resolve("test-results/soak/command-center-memory");

type Metric = {
  minute: number;
  capturedAt: string;
  browserPrivateMemoryBytes: number | null;
  jsHeapUsedBytes: number;
  jsHeapTotalBytes: number;
  domNodes: number;
  eventListeners: number;
  workerCount: number;
  activeTimerCount: number;
  chartInstanceCount: number;
  workerMessagesTotal: number;
  workerMessagesPerMinute: number;
  reactCommits: number | null;
  longTaskCount: number;
  longestMainThreadTaskMs: number;
  scenarioResourceBytes: number;
  requestsAfterInitialLoad: number;
  scenarioDownloads: number;
  route: string;
};

type Failure = { at: string; kind: "console" | "request" | "api"; detail: string };

declare global {
  interface Window {
    __liveOpsSoak?: { timers: Set<number>; workerMessages: number };
    __REACT_DEVTOOLS_GLOBAL_HOOK__?: { renderers?: Map<unknown, unknown> };
  }
}

async function clickIfVisible(locator: Locator) {
  const target = locator.first();
  if (await target.isVisible().catch(() => false)) await target.click();
}

async function selectNext(locator: Locator) {
  const target = locator.first();
  if (!(await target.isVisible().catch(() => false))) return;
  const values = await target.locator("option").evaluateAll((options) => options.map((option) => (option as HTMLOptionElement).value));
  const current = await target.inputValue();
  const next = values[(Math.max(0, values.indexOf(current)) + 1) % values.length];
  if (next !== undefined) await target.selectOption(next);
}

async function scheduledInteraction(page: Page, minute: number) {
  const action = minute % 15;
  if (action === 0) await clickIfVisible(page.locator(".fleet-main").nth((minute / 15 + 1) % 3));
  else if (action === 1) { const unpin=page.getByRole("button",{name:/^Unpin /}).first();if(await unpin.isVisible().catch(()=>false))await unpin.click();await clickIfVisible(page.getByRole("button", { name: /^Pin / }).first()); }
  else if (action === 2) await clickIfVisible(page.getByRole("button", { name: /Open comparison|Compare pinned/i }));
  else if (action === 3) await clickIfVisible(page.getByRole("button", { name: /telemetry window|30 cycles|60 cycles|120 cycles/i }).last());
  else if (action === 4) await selectNext(page.getByLabel(/selected comparison sensor|sensor comparison|compare sensor/i));
  else if (action === 5) { await clickIfVisible(page.getByRole("link",{name:"Return to fleet"}));await selectNext(page.getByLabel(/alert severity|severity filter/i)); }
  else if (action === 6) await clickIfVisible(page.getByRole("button", { name: /^Acknowledge / }).first());
  else if (action === 7) { await clickIfVisible(page.getByRole("button", { name: "Pause simulation" })); await page.waitForTimeout(750); await clickIfVisible(page.getByRole("button", { name: "Play simulation" })); }
  else if (action === 8) await page.getByLabel(/Seek (simulation|comparison) cycle/).evaluate((input: HTMLInputElement) => { input.value = String(Math.max(Number(input.min), Number(input.value) - 10)); input.dispatchEvent(new Event("change", { bubbles: true })); });
  else if (action === 9) await page.getByLabel(/Seek (simulation|comparison) cycle/).evaluate((input: HTMLInputElement) => { input.value = String(Math.min(Number(input.max), Number(input.value) + 15)); input.dispatchEvent(new Event("change", { bubbles: true })); });
  else if (action === 10) await selectNext(page.getByLabel("Simulation speed"));
  else if (action === 11) await clickIfVisible(page.getByRole("link", { name: "Maintenance" }));
  else if (action === 12) { await clickIfVisible(page.getByRole("link",{name:"Model Evidence"}));await expect(page.locator(".evidence-identity code")).not.toHaveText("Loading");await page.waitForTimeout(1_500); }
  else if (action === 13) { await clickIfVisible(page.getByRole("link",{name:"Command Center"}));await page.waitForLoadState("networkidle"); }
  else {
    await clickIfVisible(page.getByRole("button", { name: /Commands/ }));
    const backdrop = page.locator(".modal-backdrop");
    if (await backdrop.isVisible().catch(() => false)) await backdrop.click({ position: { x: 2, y: 2 } });
  }
}

function processMemory(processIds: number[]) {
  if (!processIds.length) return null;
  try {
    const script = `$p=Get-Process -Id ${processIds.join(",")} -ErrorAction SilentlyContinue; ($p | Measure-Object -Property PrivateMemorySize64 -Sum).Sum`;
    const value = execFileSync("powershell.exe", ["-NoProfile", "-Command", script], { encoding: "utf8" }).trim();
    return value ? Number(value) : null;
  } catch { return null; }
}

function increasingWithoutBound(values: number[]) {
  if (values.length < 5) return false;
  const tail = values.slice(2);
  const rises = tail.slice(1).filter((value, index) => value > tail[index]).length;
  const baseline = Math.max(1, tail[0]);
  return rises === tail.length - 1 && tail.at(-1)! > baseline * 1.35;
}

test("30-minute production command center Chromium memory soak", async ({ browser, page }) => {
  test.slow();
  await mkdir(ARTIFACT_DIR, { recursive: true });
  const failures: Failure[] = [];
  let requestCount = 0;
  let scenarioDownloads = 0;
  let initialLoadComplete = false;

  page.on("console", (message) => { if (message.type() === "error") failures.push({ at: new Date().toISOString(), kind: "console", detail: message.text() }); });
  page.on("requestfailed", (request) => failures.push({ at: new Date().toISOString(), kind: "request", detail: `${request.method()} ${request.url()} ${request.failure()?.errorText ?? "failed"}` }));
  page.on("response", (response) => {
    const url = response.url();
    if (initialLoadComplete) requestCount += 1;
    if (/\/simulations\/.*\.json(?:\?|$)/.test(url)) scenarioDownloads += 1;
    if (url.includes("/api/") && response.status() >= 400) failures.push({ at: new Date().toISOString(), kind: "api", detail: `${response.status()} ${url}` });
  });
  await page.addInitScript(() => {
    const timers = new Set<number>();
    const nativeSetTimeout = window.setTimeout.bind(window);
    const nativeClearTimeout = window.clearTimeout.bind(window);
    const nativeSetInterval = window.setInterval.bind(window);
    const nativeClearInterval = window.clearInterval.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => { let id = 0; id = nativeSetTimeout((...inner: unknown[]) => { timers.delete(id); if (typeof handler === "function") handler(...inner); else Function(handler)(); }, timeout, ...args); timers.add(id); return id; }) as typeof window.setTimeout;
    window.clearTimeout = ((id?: number) => { if (id !== undefined) timers.delete(id); nativeClearTimeout(id); }) as typeof window.clearTimeout;
    window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => { const id = nativeSetInterval(handler, timeout, ...args); timers.add(id); return id; }) as typeof window.setInterval;
    window.clearInterval = ((id?: number) => { if (id !== undefined) timers.delete(id); nativeClearInterval(id); }) as typeof window.clearInterval;
    window.__liveOpsSoak = { timers, workerMessages: 0 };
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener("message", () => { if (window.__liveOpsSoak) window.__liveOpsSoak.workerMessages += 1; });
      }
    };
  });

  const cdp = await page.context().newCDPSession(page);
  const browserCdp = await browser.newBrowserCDPSession();
  await cdp.send("Performance.enable");
  await page.goto("/");
  await expect(page.getByText("LIVE SIMULATION")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Simulation speed").selectOption("20");
  initialLoadComplete = true;
  await page.evaluate(() => {
    const observed = { count: 0, longest: 0 };
    new PerformanceObserver((list) => { for (const entry of list.getEntries()) { observed.count += 1; observed.longest = Math.max(observed.longest, entry.duration); } }).observe({ type: "longtask", buffered: true });
    Object.assign(window, { __liveOpsLongTasks: observed });
  });

  const start = Date.now();
  let previousWorkerMessages = 0;
  const metrics: Metric[] = [];
  for (let minute = 0; minute <= 30; minute += 1) {
    const due = start + minute * 60_000;
    if (Date.now() < due) await page.waitForTimeout(due - Date.now());
    if (minute > 0 && minute < 30) await scheduledInteraction(page, minute);
    if (minute === 0 || minute === 15 || minute === 30) await page.screenshot({ path: path.join(ARTIFACT_DIR, `minute-${String(minute).padStart(2, "0")}.png`), fullPage: true });
    if (!(SAMPLE_MINUTES as readonly number[]).includes(minute)) continue;
    const perf = await cdp.send("Performance.getMetrics") as { metrics: { name: string; value: number }[] };
    const values = Object.fromEntries(perf.metrics.map(({ name, value }) => [name, value]));
    const targets = await cdp.send("Target.getTargets") as { targetInfos: { type: string }[] };
    const processes = await browserCdp.send("SystemInfo.getProcessInfo") as { processInfo: { id: number; type: string }[] };
    const app = await page.evaluate(() => {
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const longTasks = (window as unknown as { __liveOpsLongTasks?: { count: number; longest: number } }).__liveOpsLongTasks;
      return {
        activeTimers: window.__liveOpsSoak?.timers.size ?? -1,
        workerMessages: window.__liveOpsSoak?.workerMessages ?? 0,
        charts: document.querySelectorAll(".uplot").length,
        scenarioBytes: resources.filter((item) => /\/simulations\/.*\.json(?:\?|$)/.test(item.name)).reduce((sum, item) => sum + (item.decodedBodySize || item.transferSize), 0),
        longTaskCount: longTasks?.count ?? 0,
        longestTask: longTasks?.longest ?? 0,
      };
    });
    metrics.push({
      minute, capturedAt: new Date().toISOString(), browserPrivateMemoryBytes: processMemory(processes.processInfo.map((item) => item.id)),
      jsHeapUsedBytes: values.JSHeapUsedSize ?? 0, jsHeapTotalBytes: values.JSHeapTotalSize ?? 0,
      domNodes: values.Nodes ?? 0, eventListeners: values.JSEventListeners ?? 0,
      workerCount: targets.targetInfos.filter((item) => item.type === "worker").length,
      activeTimerCount: app.activeTimers, chartInstanceCount: app.charts, workerMessagesTotal: app.workerMessages,
      workerMessagesPerMinute: (app.workerMessages - previousWorkerMessages) / Math.max(1, metrics.length ? minute - metrics.at(-1)!.minute : 1),
      reactCommits: null, longTaskCount: app.longTaskCount, longestMainThreadTaskMs: app.longestTask,
      scenarioResourceBytes: app.scenarioBytes, requestsAfterInitialLoad: requestCount, scenarioDownloads,
      route: new URL(page.url()).pathname,
    });
    previousWorkerMessages = app.workerMessages;
  }

  const stabilityFailures: string[] = [];
  const series = (key: keyof Metric) => metrics.map((item) => Number(item[key] ?? 0));
  if (new Set(series("workerCount")).size > 1) stabilityFailures.push(`workerCount changed: ${series("workerCount").join(" -> ")}`);
  // Unlike workers, chart counts legitimately differ by route. Accumulation is
  // detected as an unbounded trend across samples instead of requiring equality.
  if (increasingWithoutBound(series("chartInstanceCount"))) stabilityFailures.push(`chartInstanceCount shows an unbounded trend: ${series("chartInstanceCount").join(" -> ")}`);
  for (const key of ["jsHeapUsedBytes", "domNodes", "eventListeners"] as const) if (increasingWithoutBound(series(key))) stabilityFailures.push(`${key} shows an unbounded trend: ${series(key).join(" -> ")}`);
  if (metrics.at(-1)!.scenarioDownloads > metrics[0].scenarioDownloads) stabilityFailures.push("Scenario packs were downloaded again after initial load");
  if (metrics.at(-1)!.longestMainThreadTaskMs > 100) stabilityFailures.push(`Longest main-thread task was ${metrics.at(-1)!.longestMainThreadTaskMs.toFixed(1)} ms`);
  if (failures.length) stabilityFailures.push(`${failures.length} console, request, or API failure(s) occurred`);
  const result = { startedAt: new Date(start).toISOString(), finishedAt: new Date().toISOString(), durationMs: Date.now() - start, criteria: { minimumDurationMs: DURATION_MS, passed: stabilityFailures.length === 0 }, metrics, failures, stabilityFailures };
  await writeFile(path.join(ARTIFACT_DIR, "metrics.json"), `${JSON.stringify(result, null, 2)}\n`);
  const header = "| Minute | Route | Browser private | JS heap used / total | DOM | Listeners | Workers | Timers | Charts | Worker msg/min | Long tasks / longest | Requests |";
  const rows = metrics.map((item) => `| ${item.minute} | ${item.route} | ${item.browserPrivateMemoryBytes ?? "n/a"} | ${item.jsHeapUsedBytes} / ${item.jsHeapTotalBytes} | ${item.domNodes} | ${item.eventListeners} | ${item.workerCount} | ${item.activeTimerCount} | ${item.chartInstanceCount} | ${item.workerMessagesPerMinute.toFixed(1)} | ${item.longTaskCount} / ${item.longestMainThreadTaskMs.toFixed(1)} ms | ${item.requestsAfterInitialLoad} |`).join("\n");
  const markdown = `# Command Center 30-minute memory soak\n\n- Result: **${stabilityFailures.length ? "FAIL" : "PASS"}**\n- Wall-clock duration: ${(result.durationMs / 60_000).toFixed(2)} minutes\n- Scenario downloads: ${metrics.at(-1)!.scenarioDownloads}\n- Console/request/API failures: ${failures.length}\n- React commit count: not reported unless existing production instrumentation exposes it\n\n${header}\n|---:|:---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n${rows}\n\n## Stability findings\n\n${stabilityFailures.length ? stabilityFailures.map((item) => `- ${item}`).join("\n") : "No defined stability failure was observed."}\n`;
  await writeFile(path.join(ARTIFACT_DIR, "report.md"), markdown);
  expect(Date.now() - start, "must run for 30 continuous wall-clock minutes").toBeGreaterThanOrEqual(DURATION_MS);
  expect(stabilityFailures, "soak stability criteria").toEqual([]);
});
