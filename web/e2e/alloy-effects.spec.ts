import { expect, test } from "@playwright/test";

test.skip(({browserName})=>browserName!=="chromium","Alloy motion contract is verified in Chromium");

test("reduced motion disables approved ambient and entrance effects",async({page})=>{
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto("/");
  await expect(page.locator(".telemetry-aurora i").first()).toHaveCSS("animation-name","none");
  await expect(page.locator(".glass-refraction").first()).toBeVisible();
  await expect.poll(()=>page.locator(".glass-refraction").first().evaluate(element=>getComputedStyle(element,"::after").animationName)).toBe("none");
  const preview=page.locator(".alloy-preview-frame");
  await preview.hover({position:{x:40,y:40}});
  await expect(preview).toHaveCSS("transform","none");
});

test("landing depth drift stays inside the motion contract",async({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto("/");
  const preview=page.locator(".alloy-preview-frame");
  await preview.hover({position:{x:10,y:10}});
  await expect.poll(()=>preview.evaluate(element=>element.getAttribute("style")??"")).toContain("scale(1.004)");
  const transform=await preview.evaluate(element=>element.style.transform);
  const values=transform.match(/translate3d\((-?[\d.]+)px, (-?[\d.]+)px, 0px?\) rotateX\((-?[\d.]+)deg\) rotateY\((-?[\d.]+)deg\) scale\(([\d.]+)\)/);
  expect(values).not.toBeNull();
  expect(Math.abs(Number(values![1]))).toBeLessThanOrEqual(4);
  expect(Math.abs(Number(values![2]))).toBeLessThanOrEqual(4);
  expect(Math.abs(Number(values![3]))).toBeLessThanOrEqual(.4);
  expect(Math.abs(Number(values![4]))).toBeLessThanOrEqual(.4);
  expect(Number(values![5])).toBe(1.004);
  await page.mouse.move(0,0);
  await expect(preview).toHaveCSS("transform","none");
});

test("landing and command center avoid horizontal page overflow",async({page})=>{
  for(const viewport of [{width:360,height:800},{width:390,height:844},{width:430,height:932},{width:768,height:1024}]){
    await page.setViewportSize(viewport);
    for(const path of ["/","/command"]){
      await page.goto(path);
      await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),{message:`${path} must fit at ${viewport.width}px`}).toBe(true);
    }
  }
});
