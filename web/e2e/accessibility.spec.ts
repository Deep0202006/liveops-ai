import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
test.skip(({browserName})=>browserName!=="chromium","Automated accessibility gate runs in Chromium");
async function expectAccessible(page:Page){const results=await new AxeBuilder({page}).withTags(["wcag2a","wcag2aa","wcag21a","wcag21aa"]).analyze();expect(results.violations.filter(item=>item.impact==="critical"||item.impact==="serious")).toEqual([])}
test("Alloy Glass landing is keyboard accessible and has no serious violations",async({page})=>{
  await page.goto("/");
  await expect(page.getByRole("heading",{name:/See machine risk forming/})).toBeVisible();
  await expectAccessible(page);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link",{name:"Skip to content"})).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
});
test("command center, Data Lab error, maintenance, and model evidence have no serious violations",async({page})=>{await page.goto("/command");await expectAccessible(page);await page.goto("/lab");await expectAccessible(page);await page.getByLabel("Machine trajectory CSV").setInputFiles({name:"invalid.csv",mimeType:"text/csv",buffer:Buffer.from("machine_id,cycle\n1,1")});await page.getByRole("button",{name:"Validate trajectory"}).click();await expect(page.getByRole("alert")).toBeVisible();await expectAccessible(page);await page.goto("/maintenance");await expectAccessible(page);await page.goto("/model");await expectAccessible(page)});
test("command center remains accessible at 200 percent text scale",async({page})=>{await page.goto("/command");await page.addStyleTag({content:"html{font-size:200%!important}"});await expectAccessible(page);await expect(page.getByText("LIVE SIMULATION")).toBeVisible()});
test("landing remains accessible at 200 percent text scale without horizontal overflow",async({page})=>{
  await page.setViewportSize({width:430,height:932});
  await page.goto("/");
  await page.addStyleTag({content:"html{font-size:200%!important}"});
  await expectAccessible(page);
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});
test("command navigation and mobile dialog preserve visible keyboard focus",async({page})=>{
  await page.goto("/command");
  const commandLink=page.getByRole("navigation",{name:"Application navigation"}).getByRole("link",{name:"Command Center"});
  await commandLink.focus();
  await expect(commandLink).toBeFocused();
  await expect(commandLink).toHaveCSS("outline-style",/^(?!none$).+/);
  await page.setViewportSize({width:390,height:844});
  await page.getByRole("button",{name:"Open navigation"}).click();
  await expect(page.getByRole("button",{name:"Close navigation"})).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog",{name:"Application navigation"})).toHaveCount(0);
});
test("alert filters and pinned comparison have no serious violations",async({page})=>{await page.goto("/command");await page.getByLabel("Alert severity").selectOption("warning");await page.getByLabel("Alert asset").fill("RT-01");await expectAccessible(page);await page.getByRole("button",{name:"Pin RT-01"}).click();await page.getByRole("button",{name:"Pin RT-02"}).click();await page.getByRole("button",{name:"Compare pinned (2)"}).click();await expect(page.getByRole("heading",{name:"Operational comparison"})).toBeFocused();await expectAccessible(page)});
