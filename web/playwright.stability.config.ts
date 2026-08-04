import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir:"./tests/stability",timeout:11*60_000,fullyParallel:true,workers:2,reporter:[["line"]],
  use:{baseURL:"http://127.0.0.1:4173",colorScheme:"dark"},
  projects:[{name:"firefox-stability",use:{browserName:"firefox"}},{name:"webkit-stability",use:{browserName:"webkit"}}],
  webServer:[
    {command:"set LIVEOPS_MODE=real&& .venv\\Scripts\\python.exe -m uvicorn api.index:app --host 127.0.0.1 --port 8000",cwd:"..",url:"http://127.0.0.1:8000/api/v1/health/live",reuseExistingServer:false,timeout:120_000},
    {command:"npm run build && npm run preview -- --host 127.0.0.1 --port 4173",cwd:".",url:"http://127.0.0.1:4173",reuseExistingServer:false,timeout:120_000},
  ],
});
