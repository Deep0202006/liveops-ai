import { expect,test } from "@playwright/test";

const DURATION_MS=10*60_000;
declare global{interface Window{__stabilityWorkers?:{created:number;active:number}}}

test("10-minute accelerated replay remains stable",async({page,browserName})=>{
  const failures:string[]=[];
  page.on("console",message=>{if(message.type()==="error")failures.push(message.text())});
  page.on("pageerror",error=>failures.push(error.message));
  await page.addInitScript(()=>{const NativeWorker=window.Worker;window.__stabilityWorkers={created:0,active:0};window.Worker=class extends NativeWorker{constructor(url:string|URL,options?:WorkerOptions){super(url,options);window.__stabilityWorkers!.created+=1;window.__stabilityWorkers!.active+=1;const terminate=this.terminate.bind(this);this.terminate=()=>{window.__stabilityWorkers!.active-=1;terminate()}}}});
  await page.goto("/");await expect(page.getByText("LIVE SIMULATION")).toBeVisible();await page.getByLabel("Simulation speed").selectOption("20");
  const started=Date.now();
  for(let minute=0;minute<10;minute+=1){
    const due=started+minute*60_000;if(Date.now()<due)await page.waitForTimeout(due-Date.now());
    if(minute%2===0){await page.getByLabel("Seek simulation cycle").fill(String((minute*3)%29));await page.getByLabel("Alert severity").selectOption(minute%4===0?"warning":"all")}
    else if(minute===1){await page.getByRole("button",{name:/^Pin RT-/}).first().click();await page.getByRole("button",{name:"Compare pinned (1)"}).click();await page.getByLabel("Selected comparison sensor").selectOption({index:1});await page.getByRole("link",{name:"Return to fleet"}).click()}
    else if(minute===3){await page.getByRole("combobox",{name:"Scenario",exact:true}).selectOption("degradation-wave");await expect(page.getByLabel("Alert severity")).toHaveValue("all")}
    else if(minute===5){await page.getByRole("link",{name:"Maintenance"}).click();await expect(page.getByRole("heading",{name:"Priority queue"})).toBeVisible();await page.getByRole("link",{name:"Command Center",exact:true}).click()}
    else {await page.getByRole("button",{name:/Commands/}).click();await page.locator(".modal-backdrop").click({position:{x:2,y:2}})}
  }
  const remaining=started+DURATION_MS-Date.now();if(remaining>0)await page.waitForTimeout(remaining);
  const workers=await page.evaluate(()=>window.__stabilityWorkers);
  expect(workers,`${browserName} worker lifecycle`).toEqual({created:1,active:1});
  expect(failures,`${browserName} console/page errors`).toEqual([]);
});
