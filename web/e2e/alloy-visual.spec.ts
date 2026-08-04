import { expect, test, type Locator, type Page } from "@playwright/test";

test.skip(({browserName})=>browserName!=="chromium","Deterministic Alloy Glass baselines use Chromium");
test.use({colorScheme:"light",reducedMotion:"reduce"});

async function settle(page:Page){
  await page.waitForLoadState("networkidle");
  await page.evaluate(()=>document.fonts.ready);
  await page.addStyleTag({content:"*{caret-color:transparent!important}.telemetry-field{background-image:none!important}"});
}
async function openFrozenLanding(page:Page){
  await page.goto("/command");
  await expect(page.getByText("LIVE SIMULATION")).toBeVisible();
  await page.getByLabel("Reset scenario").first().click();
  await page.evaluate(()=>{history.pushState({},"","/");window.dispatchEvent(new PopStateEvent("popstate"));});
  await expect(page.getByRole("heading",{name:/See machine risk forming/})).toBeVisible();
}
async function freezeLanding(page:Page){
  await settle(page);
  await expect(page.locator(".living-fleet")).toBeVisible();
  const pause=page.getByRole("button",{name:"Pause hero simulation"});
  if(await pause.isVisible().catch(()=>false))await pause.click();
}
async function sectionShot(page:Page,locator:Locator,name:string){
  await expect(locator).toBeVisible();
  await expect(locator).toHaveScreenshot(name,{animations:"disabled",caret:"hide",maxDiffPixelRatio:.001});
}

for(const [name,width,height] of [["desktop",1440,900],["tablet",768,1024],["mobile",390,844]] as const){
  test(`landing hero ${name}`,async({page})=>{
    await page.setViewportSize({width,height});
    await openFrozenLanding(page);
    await freezeLanding(page);
    await sectionShot(page,page.locator(".alloy-hero"),`alloy-landing-hero-${name}.png`);
  });
}

test("landing evidence, connected story, and final CTA",async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await openFrozenLanding(page);
  await freezeLanding(page);
  await sectionShot(page,page.locator(".alloy-evidence"),"alloy-evidence-ribbon.png");
  await sectionShot(page,page.locator(".alloy-story"),"alloy-product-story.png");
  await sectionShot(page,page.locator(".alloy-final"),"alloy-final-cta.png");
});

test("command scenario states use a deterministic cycle",async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/command");
  for(const [scenario,name,title] of [["normal-shift","normal","Normal Shift"],["degradation-wave","degradation","Degradation Wave"],["maintenance-window","maintenance","Maintenance Window"]] as const){
    await page.locator(".command-bar label select").selectOption(scenario);
    await expect(page.locator(".time-conductor b")).toHaveText(title);
    await page.getByLabel("Seek simulation cycle").fill("20");
    await expect(page.getByText("CYCLE 20/29")).toBeVisible();
    await settle(page);
    await expect(page).toHaveScreenshot(`alloy-command-${name}.png`,{animations:"disabled",caret:"hide",fullPage:false,maxDiffPixelRatio:.001});
  }
});

test("mobile and reduced-motion command states",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/command");
  await page.getByLabel("Seek simulation cycle").fill("20");
  await settle(page);
  await page.evaluate(()=>scrollTo(0,0));
  await expect(page.getByText("LIVE SIMULATION")).toBeVisible();
  await expect(page).toHaveScreenshot("alloy-command-mobile.png",{animations:"disabled",caret:"hide",fullPage:false,maxDiffPixelRatio:.001});
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
