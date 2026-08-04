import { defineConfig } from "@playwright/test";

// Deliberately separate from playwright.config.ts: this suite consumes at least
// 30 minutes of wall-clock time and must never enter the normal developer loop.
export default defineConfig({
  testDir: "./tests/soak",
  outputDir: "./test-results/soak",
  timeout: 35 * 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["line"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    colorScheme: "dark",
    actionTimeout: 10_000,
    launchOptions: {
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      args: ["--enable-precise-memory-info"],
    },
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium-memory-soak", use: { browserName: "chromium" } }],
  webServer: [
    {
      command: "set LIVEOPS_MODE=real&& .venv\\Scripts\\python.exe -m uvicorn api.index:app --host 127.0.0.1 --port 8000",
      cwd: "..",
      url: "http://127.0.0.1:8000/api/v1/health/live",
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: "npm run build && npm run preview -- --host 127.0.0.1 --port 4173",
      cwd: ".",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
