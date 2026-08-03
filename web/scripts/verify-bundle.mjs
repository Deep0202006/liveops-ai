import { readdirSync, readFileSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
const assets = join(root, "dist", "assets");
const sizes = readdirSync(assets).filter((name) => name.endsWith(".js")).map((name) => ({ name, gzip: gzipSync(readFileSync(join(assets,name))).length }));
const core = sizes.find((item) => item.name.startsWith("index-"));
const chart = sizes.find((item) => item.name.startsWith("MachineSignalChart-"));
const evidence = sizes.find((item) => item.name.startsWith("ModelEvidencePage-"));
const uplot = sizes.find((item) => item.name.startsWith("uPlot.min-"));
if (!core || core.gzip > 150 * 1024) throw new Error(`Application shell JS budget exceeded: ${core?.gzip ?? "missing"}`);
if (core.gzip + (uplot?.gzip ?? 0) > 220 * 1024) throw new Error(`Command-center JS budget exceeded: ${core.gzip + (uplot?.gzip ?? 0)}`);
if (chart && chart.gzip > 35 * 1024) throw new Error(`Lazy chart budget exceeded: ${chart.gzip}`);
const largeRuntimeFile = readdirSync(join(root,"dist"), { recursive:true }).map(String).find((name) => { const path=join(root,"dist",name); return statSync(path).isFile() && !name.endsWith(".map") && statSync(path).size > 250*1024 && !name.endsWith(".js"); });
if (largeRuntimeFile) throw new Error(`Runtime asset exceeds 250 KiB: ${largeRuntimeFile}`);
console.log(JSON.stringify({ application_shell_gzip_kib:(core.gzip/1024).toFixed(2), command_center_with_uplot_gzip_kib:((core.gzip+(uplot?.gzip??0))/1024).toFixed(2), uplot_gzip_kib:uplot?(uplot.gzip/1024).toFixed(2):null, data_lab_chart_gzip_kib:chart?(chart.gzip/1024).toFixed(2):null, model_evidence_gzip_kib:evidence?(evidence.gzip/1024).toFixed(2):null }, null, 2));
