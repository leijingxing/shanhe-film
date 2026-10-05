import { chromium } from 'playwright';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
fs.mkdirSync('qa-browser',{recursive:true});
const browser=await chromium.launch({headless:true,chromiumSandbox:true,args:['--use-gl=angle','--use-angle=swiftshader']});
const errors=[],evidence={};
const context=await browser.newContext({viewport:{width:1280,height:800},deviceScaleFactor:1,recordVideo:{dir:'qa-browser/video/',size:{width:960,height:600}}});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const root=process.env.FILM_URL||'http://127.0.0.1:8000/preview-v2/';
const save=async name=>{await page.screenshot({path:`qa-browser/${name}.png`});};
try{
 await page.goto(root+'?qa=1',{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__film);await save('00-cover');
 evidence.renderer=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2');return {version:gl.getParameter(gl.VERSION),renderer:gl.getParameter(gl.RENDERER),vendor:gl.getParameter(gl.VENDOR)}});
 await page.locator('#start').click();const started=Date.now();
 await page.waitForFunction(()=>window.__film.state.scoreReady,null,{timeout:45000});
 evidence.audioReady=await page.evaluate(()=>window.__film.state.scoreReady);assert.equal(evidence.audioReady,true);
 for(const t of [8,16,25,45,65,85,105,125,145,165,179.9]){
  await page.waitForFunction(t=>window.__film.state.position>=t,t,{timeout:50000});await save('film-'+String(Math.floor(t)).padStart(3,'0'));console.log('NATURAL_FRAME',t,JSON.stringify(await page.evaluate(()=>window.__film.state)));
 }
 await page.waitForFunction(()=>window.__film.state.ended,null,{timeout:10000});evidence.durationWallSeconds=(Date.now()-started)/1000;assert.ok(evidence.durationWallSeconds<193,'Film must finish in approximately 180 wall-clock seconds');
 assert.equal(await page.locator('#end').isVisible(),true);await save('film-ended');
 await page.locator('#again').click();assert.equal(await page.evaluate(()=>window.__film.state.playing),true);await page.locator('#pause').click();const paused=await page.evaluate(()=>window.__film.state.position);await page.waitForTimeout(1000);assert.ok(Math.abs((await page.evaluate(()=>window.__film.state.position))-paused)<.02);
 await page.evaluate(()=>window.__film.seek(35));await page.getByText('Lock camera',{exact:true}).click();const fixedBefore=await page.evaluate(()=>window.__film.state);const beforeImage=await page.locator('#world').screenshot();await page.locator('#pause').click();await page.waitForTimeout(3400);await page.locator('#pause').click();const fixedAfter=await page.evaluate(()=>window.__film.state);const afterImage=await page.locator('#world').screenshot();assert.deepEqual(fixedBefore.stats.camera,fixedAfter.stats.camera);assert.notDeepEqual(fixedBefore.stats.boat,fixedAfter.stats.boat);assert.notEqual(fixedBefore.stats.oar,fixedAfter.stats.oar);assert.notEqual(fixedBefore.stats.mist,fixedAfter.stats.mist);assert.notEqual(crypto.createHash('sha256').update(beforeImage).digest('hex'),crypto.createHash('sha256').update(afterImage).digest('hex'));evidence.lockedCamera={before:fixedBefore.stats,after:fixedAfter.stats};await save('locked-camera-motion');await page.getByText('Unlock camera',{exact:true}).click();
 for(const t of [60,96,126,153,0,180,35]){await page.evaluate(t=>window.__film.seek(t),t);assert.ok(Math.abs((await page.evaluate(()=>window.__film.state.position))-t)<.02)}
 const muteBefore=await page.evaluate(()=>window.__film.state.muted);await page.locator('#sound').click();await page.waitForFunction(v=>window.__film.state.muted!==v,muteBefore);evidence.muteToggle=true;
 for(let i=0;i<3;i++)await page.locator('#quality').click();await save('desktop-quality-controls');
 const mobile=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});const mp=await mobile.newPage();mp.on('pageerror',e=>errors.push('mobile:'+e.message));await mp.goto(root+'?qa=1&t=35',{waitUntil:'networkidle'});await mp.waitForFunction(()=>window.__film);await mp.screenshot({path:'qa-browser/mobile-portrait.png'});assert.equal(await mp.locator('#pause').isVisible(),true);assert.equal(await mp.locator('#seek').isVisible(),true);await mp.locator('#pause').click();await mp.waitForTimeout(2500);assert.ok((await mp.evaluate(()=>window.__film.state.position))>36);await mp.setViewportSize({width:844,height:390});await mp.screenshot({path:'qa-browser/mobile-landscape.png'});evidence.mobile=await mp.evaluate(()=>window.__film.state);await mobile.close();
 assert.deepEqual(errors,[],'No JS, resource or shader errors');evidence.passed=true;console.log('ACCEPTANCE_PASS',JSON.stringify(evidence));
}catch(e){evidence.passed=false;evidence.failure=e.stack;await save('FAILURE').catch(()=>{});console.error('ACCEPTANCE_FAIL',e);process.exitCode=1;}
finally{evidence.errors=errors;fs.writeFileSync('qa-browser/result.json',JSON.stringify(evidence,null,2));await context.close();await browser.close();}
