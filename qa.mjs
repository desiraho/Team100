import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/sabya/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
await mkdir('qa',{recursive:true});
const browser = await chromium.launch({headless:true, channel:"msedge"});
const results=[];
for (const [name,width,height] of [['desktop',1440,1000],['tablet',820,1180],['mobile',390,844],['small-mobile',320,740]]) {
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:4173',{waitUntil:'domcontentloaded'});
 await page.evaluate(()=>document.fonts.ready);
 await page.locator('img').evaluateAll(images=>Promise.all(images.map(img=>{img.loading='eager'; return img.decode();})));
 assert.equal(await page.locator('#team-grid .person').count(),8);
 assert.equal(await page.locator('#photo-gallery .photo-card').count(),4);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${name}: horizontal overflow`);
 assert.equal(await page.locator('img').evaluateAll(images=>images.every(img=>img.complete&&img.naturalWidth>0)),true,`${name}: images loaded`);
 await page.screenshot({path:`qa/${name}.png`,fullPage:true});
 if(width<=850) {await page.locator('.menu-toggle').click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'true');}
 await page.locator('#main-nav a[href="#contact-us"]').click();
 await page.waitForFunction(()=>{const r=document.querySelector('#contact-heading').getBoundingClientRect();return r.top>=0&&r.bottom<innerHeight;});
 if(width<=850) assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
 await page.locator('#join-button').click();
 assert.equal(await page.locator('#registration-dialog').evaluate(d=>d.open),true);
 assert.equal(await page.locator('#registration-dialog input[name="name"]').isDisabled(),false);
 assert.equal(await page.locator('#registration-dialog input').count(),9);
 assert.equal(await page.locator('#registration-dialog select').count(),2);
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#join-button').evaluate(el=>el===document.activeElement),true);
 await page.locator('[data-video="founder"]').click();
 assert.equal(await page.locator('#media-dialog').evaluate(d=>d.open),true);
 await page.keyboard.press('Escape');
 const before=await page.locator('#photo-gallery').evaluate(el=>el.scrollLeft);
 await page.locator('#next-photo').click();
 const after=await page.locator('#photo-gallery').evaluate(el=>el.scrollLeft);
 assert.ok(after>before,`${name}: next arrow advances`);
 await page.locator('#photo-gallery').focus();await page.keyboard.press('Home');
 assert.equal(await page.locator('#photo-gallery').evaluate(el=>el.scrollLeft),0);
 await page.keyboard.press('ArrowRight');
 assert.ok(await page.locator('#photo-gallery').evaluate(el=>el.scrollLeft)>0,`${name}: keyboard advances`);
 assert.deepEqual(errors,[],`${name}: no JavaScript errors`);
 results.push({viewport:name,width,height,overflow:false,photos:'loaded',navigation:'passed',registration:'unconfigured form, Escape and focus restoration passed',carousel:'arrows and keyboard passed',javascriptErrors:errors});
 await page.close();
}
await writeFile('qa/results.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
await browser.close();


