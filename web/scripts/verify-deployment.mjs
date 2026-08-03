import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const config = JSON.parse(readFileSync(resolve("..", "vercel.json"), "utf8"));
const rewrites = config.rewrites ?? [];
const source = (value) => rewrites.findIndex((item) => item.source === value);
if (source("/api/(.*)") < 0 || source("/api/(.*)") > source("/app/(.*)")) throw new Error("API rewrite must precede SPA rewrites");
for (const route of ["/app", "/app/(.*)"]) if (rewrites[source(route)]?.destination !== "/index.html") throw new Error(`SPA deep-link missing: ${route}`);
for (const route of ["/docs", "/openapi.json"]) if (rewrites[source(route)]?.destination !== "/api/index.py") throw new Error(`FastAPI route missing: ${route}`);
if (config.outputDirectory !== "web/dist" || !String(config.buildCommand).includes("npm ci") || !String(config.buildCommand).includes("npm run build")) throw new Error("Lockfile-safe Vite build/output configuration is incomplete");
const headers = new Map((config.headers?.[0]?.headers ?? []).map((item) => [item.key.toLowerCase(), item.value]));
for (const name of ["x-content-type-options","referrer-policy","x-frame-options","permissions-policy","content-security-policy"]) if (!headers.has(name)) throw new Error(`Security header missing: ${name}`);
if (!String(headers.get("content-security-policy")).includes("frame-ancestors 'none'")) throw new Error("CSP framing protection missing");
if (!String(headers.get("content-security-policy")).includes("style-src-attr 'unsafe-inline'")) throw new Error("CSP must permit the app's data-driven inline layout styles");
console.log("DEPLOYMENT_CONFIG_OK: API, SPA deep links, build output, and security headers verified");
