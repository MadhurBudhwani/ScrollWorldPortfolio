const {chromium}=require('playwright');
const {pathToFileURL}=require('url'),path=require('path'),fs=require('fs'),assert=require('assert');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[],results=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.resolve('index.html')).href);await page.waitForTimeout(500);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:width===390?844:900});await page.waitForTimeout(100);
  for(const scene of ['boot','backend','azure','security','search','genai','delivery','writing','hub']){
   await page.evaluate(s=>navigate(s,true,.45),scene);await page.waitForTimeout(100);
   const d=await page.evaluate(()=>({scene:state.scene,ratio:state.mascotDiagnostics.height/state.mascotDiagnostics.avatarHeight,targets:mascot.targets.length,overflow:document.documentElement.scrollWidth>innerWidth}));
   assert(Math.abs(d.ratio-.6)<1e-8);assert(!d.overflow);results.push({width,scene,...d});
   if(['boot','backend','genai'].includes(scene))await page.screenshot({path:`work/mascot-${width}-${scene}.png`});
  }
 }
 await page.setViewportSize({width:1440,height:900});
 await page.evaluate(()=>navigate('backend',true,.35));await page.waitForTimeout(100);
 const target=page.getByRole('button',{name:'Transform companion: .NET CORE',exact:true});
 if(await target.count()){
  await target.hover();await page.waitForTimeout(400);await page.screenshot({path:'work/mascot-transform-mid.png'});
  await page.waitForTimeout(600);assert.strictEqual(await page.evaluate(()=>mascot.form),'.NET CORE');
  await page.screenshot({path:'work/mascot-dotnet.png'});
  await page.mouse.move(20,20);await page.waitForTimeout(1000);assert.strictEqual(await page.evaluate(()=>mascot.phase),0);
 }
 await page.evaluate(()=>navigate('boot',true,.4));await page.mouse.move(10,10);await page.waitForTimeout(5400);
 assert.strictEqual(await page.evaluate(()=>state.mascotDiagnostics.pose),'sit');await page.screenshot({path:'work/mascot-idle-sit.png'});
 for(const scene of ['backend','search','genai','delivery']){
  await page.evaluate(s=>navigate(s,true,.5),scene);await page.waitForTimeout(100);
  for(let i=0;i<8;i++){await page.mouse.wheel(0,-100);await page.waitForTimeout(16);}
  const sample=await page.evaluate(()=>({pose:state.pose,dog:state.mascotDiagnostics}));results.push({reverse:scene,...sample});
 }
 const stopped=await page.evaluate(()=>lenis.animatedScroll);await page.waitForTimeout(400);assert.strictEqual(await page.evaluate(()=>lenis.animatedScroll),stopped);
 assert.deepStrictEqual(errors,[]);fs.writeFileSync('work/mascot-browser-results.json',JSON.stringify({errors,results},null,2));
 console.log('Browser checks passed');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
