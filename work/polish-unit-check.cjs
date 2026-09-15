// Deterministic integration checks without launching a browser.
const vm=require('vm'),fs=require('fs'),assert=require('assert');
const calls=[],listeners={},elements=new Map();let now=0;
const context=new Proxy({globalAlpha:1,getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),measureText:t=>({width:t.length*6}),createLinearGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:(...args)=>calls.push({op:k,args})});
class Element {
 constructor(){this.style={setProperty(){}};this.dataset={};this.classList={add(){},remove(){},toggle(){},contains(){return false}};this.clientWidth=1440;this.clientHeight=900;this.offsetHeight=27000;this.offsetWidth=250;this.hidden=true;}
 getContext(){return context} addEventListener(){} setAttribute(){} append(){} remove(){} closest(){return null} focus(){}
 getBoundingClientRect(){return {left:0,top:0,width:1440,height:900}} querySelector(s){return element(s)}
}
const element=s=>{if(!elements.has(s))elements.set(s,new Element());return elements.get(s)};
class Lenis {constructor(options){this.options=options;this.animatedScroll=0;this.limit=26100}resize(){}raf(){}start(){}stop(){}scrollTo(y){this.animatedScroll=y;this.targetScroll=y}}
const sandbox={console,Element,Lenis,Image:class{constructor(){this.complete=true;this.naturalWidth=1254;this.naturalHeight=1254}},performance:{now:()=>now},devicePixelRatio:1,scrollY:0,requestAnimationFrame(){},location:{hash:'',search:''},matchMedia:()=>({matches:false,addEventListener(){}}),document:{querySelector:element,querySelectorAll:()=>[],createElement:()=>new Element(),addEventListener(){}},addEventListener:(name,fn)=>{(listeners[name]??=[]).push(fn)}};
sandbox.window=sandbox;vm.createContext(sandbox);
for(const file of ['choreography.js','revision.js','companion.js','mascot-catalog.js','mascot-crops.js','mascot.js','pacing.js','director.js'])vm.runInContext(fs.readFileSync(file,'utf8'),sandbox,{filename:file});
const run=s=>vm.runInContext(s,sandbox);
for(const [w,h] of [[1440,900],[390,844]]){
 run(`state.w=${w};state.h=${h}`);
 for(let scene=0;scene<9;scene++)for(const p of [.01,.15,.4,.744,.745,.79,.85,.90,.96]){
  run(`state.scene=${scene};state.local=${p};state.directedLocal=clamp((${p}-.15)/.7);updateCopy(${scene},${p});draw(${scene+p},${scene},${p});updatePlayer(.016)`);
  assert(run('Number.isFinite(state.pose.x)&&Number.isFinite(state.pose.feet)'));
 }
 const start=run('chapterTransition(1,.745,{}).pose'),near=run('chapterTransition(1,.745001,{}).pose');
 assert(Math.abs(start.x-near.x)<.1&&Math.abs(start.feet-near.feet)<.1,'continuous train launch');
 const mid=run('chapterTransition(1,.80,{}).pose'),end=run('chapterTransition(1,.90,{}).pose');
 assert(mid.x>start.x&&end.x>mid.x,'forward jump');assert(mid.feet<start.feet,'upward jump arc');assert(Math.abs(end.feet-(h-82))<.001,'lands at hole');
 run('chapterTransition(4,.89,revisionPose(4,1))');
 assert(parseFloat(element('#chapterPortal').style.width)>run('revisionPose(4,1).scale*146'),'hole wider than avatar');
}
run('state.w=1440;state.h=900;state.scene=1;state.hubLive=false;state.exit=null');
const distances=[];
for(const delta of [1,100,5000]){
 run('scrollPacer.cancel();lenis.scrollTo(1000)');now=0;
 for(let i=0;i<60;i++){
  now=i*1000/60;
  if(i%3===0&&i<30)for(const fn of listeners.wheel||[])fn({deltaY:delta,target:new Element(),preventDefault(){},stopImmediatePropagation(){}});
  run(`scrollPacer.tick(${now},1/60)`);
 }
 distances.push(run('lenis.animatedScroll-1000'));
 const stopped=run('lenis.animatedScroll');run('scrollPacer.tick(4000,1/60)');assert.strictEqual(run('lenis.animatedScroll'),stopped,'no queued scroll');
}
assert(distances.every(d=>Math.abs(d-distances[0])<1e-8),'input magnitude independent');
calls.length=0;run('routerCircuit(scenes[5],.55)');
const finalLine=calls.findLastIndex(c=>c.op==='stroke');
assert(calls.slice(finalLine+1).filter(c=>c.op==='fillText').length>=25,'solid nodes drawn after connectors');
// A bounded activity window bridges sparse events; it never accumulates distance.
now=0;
run('scrollPacer.cancel();lenis.scrollTo(1000);scrollPacer.pulse(1);scrollPacer.tick(0,1/60)');
const one=run('lenis.animatedScroll');run('scrollPacer.tick(80,1/60)');assert.strictEqual(run('lenis.animatedScroll'),one);
run('scrollPacer.cancel();lenis.scrollTo(1000);for(let i=0;i<100;i++)scrollPacer.pulse(1);scrollPacer.tick(0,1/60)');assert.strictEqual(run('lenis.animatedScroll'),one);
// Only chapter 01 is slowed.
const steps=[];for(const chapter of [0,1,2,5]){run(`lenis.scrollTo(state.top+state.travel*(${chapter}+.5)/9);scrollPacer.pulse(1)`);const before=run('lenis.animatedScroll');run('scrollPacer.tick(0,1/60)');steps.push(run('lenis.animatedScroll')-before);}
assert(Math.abs(steps[0]-steps[2])<1e-7&&Math.abs(steps[2]-steps[3])<1e-7&&steps[1]<steps[0]*.6);
// Every visible object has a unique atlas mapping.
assert(run('scenes.every(s=>s.skills.every(label=>mascotFormCatalog[label]))'));
assert(run('new Set(Object.values(mascotFormCatalog).map(v=>v.sheet+":"+v.cell)).size===Object.keys(mascotFormCatalog).length'));
// Latest hover intent reverses current progress and replaces destination.
run('mascot.form=null;mascot.phase=0;updateMascotMorph(".NET CORE",.4)');const mid=run('mascot.phase');
run('updateMascotMorph(null,.1)');assert(run('mascot.phase')<mid);
run('updateMascotMorph("REDIS",1)');assert.strictEqual(run('mascot.form'),'REDIS');
run('updateMascotMorph("SQL SERVER",1)');assert.strictEqual(run('mascot.form'),'SQL SERVER');
// Reverse horizontal paths must face their actual direction with positive gait time.
for(const scene of [1,4,5,6]){
 run(`state.scene=${scene};state.hubLive=false;state.actorSample=null;state.time=100;state.previousProgress=.2;state.progress=.21;state.local=.6;state.directedLocal=(.6-.15)/.7;updatePlayer(.016)`);
 const start=run('state.pose.x');run('state.time+=16;state.previousProgress=state.progress;state.progress-=.001;state.local=.59;state.directedLocal=(.59-.15)/.7;updatePlayer(.016)');
 const end=run('state.pose.x');if(Math.abs(end-start)>.015)assert.strictEqual(run('state.pose.direction'),Math.sign(end-start));
 assert(Math.abs(run('state.mascotDiagnostics.height/state.mascotDiagnostics.avatarHeight')-.6)<1e-9);
}
run('state.scene=0;state.local=.4;state.directedLocal=.4;state.progress=.04;state.previousProgress=.04;state.time=10000;mascot.scene=-1;updatePlayer(.016);state.time=14999;updatePlayer(.016)');assert.notStrictEqual(run('state.mascotDiagnostics.pose'),'sit');
run('state.time=15500;for(let i=0;i<30;i++)updatePlayer(.016)');assert.strictEqual(run('state.mascotDiagnostics.pose'),'sit');assert.strictEqual(run('mascot.phase'),0);
const required=run('[...new Set([...scenes.flatMap(s=>s.skills),...routerLayout().lanes.flatMap(l=>l.map(n=>n.label)),"BACKEND","SCHEDULE","GRAPH SWEEP","INSIGHT","PROACTIVE PING","CACHE","AUDIT","Work Experience","GenAI Projects","Hobbies"])]');
// Regression: the hand-side rope must live only on the foreground canvas,
// while its horizontal/reel-side run stays on the scenery canvas.
const frontCalls=[];
sandbox.ropeFront=new Proxy({}, {get:(o,k)=>(...args)=>frontCalls.push({op:k,args})});
for(const width of [390,1440])for(const handY of [350,560]){
 run(`state.w=${width};state.h=900;state.scene=2;state.local=.5;state.directedLocal=.5;state.reelRope=pullRopeGeometry({x:80,y:${handY}})`);
 const rope=run('state.reelRope');calls.length=0;frontCalls.length=0;
 run('drawReelRope();drawPullRope(ropeFront,state.reelRope)');
 const rearLines=calls.filter(c=>c.op==='lineTo'),frontLines=frontCalls.filter(c=>c.op==='lineTo');
 assert(rearLines.every(c=>c.args[1]===rope.pulleyY),'rear rope never descends in front of avatar');
 assert.deepEqual(frontLines.map(c=>c.args),[[rope.x,rope.y]],'foreground rope reaches current hand only');
 assert.deepEqual(frontCalls.find(c=>c.op==='moveTo').args,[rope.x,rope.pulleyY],'both segments share pulley');
 assert(!frontCalls.some(c=>(c.op==='moveTo'||c.op==='lineTo')&&c.args[0]===rope.reelX),'foreground never crosses reel');
}
run('state.local=.9');assert.equal(run('pullRopeGeometry({x:80,y:560})'),null,'rope hidden during portal transition');
const catalog=run('mascotFormCatalog'),missing=required.filter(label=>!catalog[label]);assert.equal(missing.length,0);
const mapping=['# Mascot image mapping','',`Required mapped items: ${required.length}. Missing artwork: ${missing.length}.`,'','All forms use existing generated artwork. No new generation is needed.','', '| Item | Sprite sheet | Cell (row, column) | Visual |','|---|---|---|---|',...required.map(label=>{const f=catalog[label];return `| ${label} | mascot-forms-${f.sheet+1}.png | ${Math.floor(f.cell/4)+1}, ${f.cell%4+1} | ${f.meaning} |`;})].join('\n');fs.writeFileSync('MASCOT-MAPPING.md',mapping+'\n');
console.log(JSON.stringify({pass:true,sceneSamples:162,widths:[1440,390],scrollDistances:distances,chapterSteps:steps,forms:run('Object.keys(mascotFormCatalog).length'),required:required.length,missing,checks:['scene geometry and portal continuity','same wheel speed at deltas 1,100,5000','bounded event gap and zero distance backlog','backend-only slowdown','unique form coverage','hover reversal and latest intent','reverse facing follows displacement','locked 0.60 dog/avatar height ratio','five-second idle sitting','no automatic transform','nodes cover connectors','rope split between avatar foreground and reel background with shared current hand']},null,2));
