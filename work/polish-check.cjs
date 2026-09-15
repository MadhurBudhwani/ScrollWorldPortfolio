const {chromium}=require('playwright');
const path=require('path');
const {pathToFileURL}=require('url');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('index.html')).href);
 await page.waitForTimeout(600);
 const results=[];
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===390?844:900});
  await page.waitForTimeout(150);
  for(const [scene,local] of [['boot',.45],['backend',.744],['backend',.79],['backend',.90],['azure',.5],['search',.89],['genai',.65]]){
   await page.evaluate(([s,p])=>navigate(s,true,p),[scene,local]);await page.waitForTimeout(100);
   results.push(await page.evaluate(()=>({width:innerWidth,...scrollworld.diagnostics,overflow:document.documentElement.scrollWidth>innerWidth})));
   await page.screenshot({path:`work/polish-${width}-${scene}-${local}.png`});
  }
 }
 await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(100);
 for(const delta of [1,100,5000]){
  await page.evaluate(()=>navigate('backend',true,.35));await page.waitForTimeout(100);
  const start=await page.evaluate(()=>scrollworld.diagnostics.progress);
  for(let i=0;i<12;i++){await page.mouse.wheel(0,delta);await page.waitForTimeout(25);}
  await page.waitForTimeout(250);
  const end=await page.evaluate(()=>scrollworld.diagnostics.progress);
  await page.waitForTimeout(300);
  const stopped=await page.evaluate(()=>scrollworld.diagnostics.progress);
  results.push({delta,distance:end-start,backlog:stopped-end});
 }
 console.log(JSON.stringify({errors,results},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
