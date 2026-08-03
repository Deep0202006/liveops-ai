import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const allowed = new Set(["react","react-dom","@tanstack/react-query","motion","@visx/axis","@visx/event","@visx/scale","@visx/shape","@visx/tooltip","lucide-react","clsx","tailwind-merge","class-variance-authority","react-router-dom","geist"]);
const forbiddenDependencies = Object.keys(packageJson.dependencies).filter((name) => !allowed.has(name));
if (forbiddenDependencies.length) throw new Error(`Forbidden runtime dependencies: ${forbiddenDependencies.join(", ")}`);
const files = [];
function walk(directory) { for (const name of readdirSync(directory)) { const path = join(directory, name); if (statSync(path).isDirectory()) walk(path); else if (/\.(ts|tsx)$/.test(name) && !path.includes("generated")) files.push(path); } }
walk(join(root, "src"));
const forbidden = [/frontend\//, /backend\//, /rul_predictor/, /from\s+["'][^"']*\.py["']/];
for (const file of files) { const source = readFileSync(file, "utf8"); if (/:\s*any\b|\bas\s+any\b|<any>/.test(source)) throw new Error(`Explicit any in ${relative(root,file)}`); for (const pattern of forbidden) if (pattern.test(source)) throw new Error(`Forbidden internal import/reference in ${relative(root,file)}`); }
const workspace = readFileSync(join(root,"src/routes/WorkspacePage.tsx"),"utf8");
if (!workspace.includes("Demo mode is active")) throw new Error("Demo disclosure is missing");
const runtimeSource = files.filter((file) => !/\.test\.[jt]sx?$/.test(file)).map((file) => readFileSync(file,"utf8")).join("\n");
for (const pattern of [/dangerouslySetInnerHTML/, /\beval\s*\(/, /localStorage/, /sessionStorage/, /fetch\s*\(\s*["']https?:\/\//, /<script[^>]+src=["']https?:\/\//, /@import\s+url\(["']?https?:\/\//]) if (pattern.test(runtimeSource)) throw new Error(`Security/privacy rule failed: ${pattern}`);
console.log(`FRONTEND_RULES_OK: ${files.length} source files checked`);
