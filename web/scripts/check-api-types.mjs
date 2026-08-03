import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const temporaryDirectory = mkdtempSync(join(tmpdir(), "liveops-openapi-"));
const generated = join(temporaryDirectory, "openapi.ts");
try {
  execFileSync(process.execPath, [resolve("node_modules/openapi-typescript/bin/cli.js"), resolve("..", "docs/web-api/openapi-v1.json"), "-o", generated], { stdio: "inherit" });
  const normalize = (value) => value.replace(/\r\n/g, "\n");
  const current = normalize(readFileSync(resolve("src/api/generated/openapi.ts"), "utf8"));
  const expected = normalize(readFileSync(generated, "utf8"));
  if (current !== expected) throw new Error("Generated OpenAPI types are not current. Run npm run api:types.");
  console.log("OPENAPI_TYPES_CURRENT: generated declarations match the frozen contract");
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true });
}
