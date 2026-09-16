const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
const native=require('C:/Users/Madhur/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const physics={window:{}};vm.createContext(physics);for(const file of ['world-content.js','world-physics.js'])vm.runInContext(fs.readFileSync(file,'utf8'),physics);
const levels=physics.window.worldLevels,Physics=physics.WorldPhysics,dt=1/120;
function run(g,seconds,input){for(let i=0;i<Math.round(seconds/dt);i++)g.step(dt,typeof input==='function'?input(g,i):input);}
const routes={};
for(const name of ['work','genai']){
 const g=new Physics(levels[name]);let ticks=0,attachments=0;
 while(g.checkpoint<g.level.platforms.length-1&&ticks<120*60){
  const p=g.player,floor=g.level.platforms[g.checkpoint],next=g.level.platforms[g.checkpoint+1];
  g.step(dt,{move:p.x<next.x+180?1:p.grounded?1:0,jump:p.grounded&&p.x>floor.x+floor.w-120,power:name==='work'?!p.grounded&&p.x<next.x+20:!p.grounded&&p.y>next.y-160&&p.x<next.x+80});
  if(g.rope)attachments++;assert(Number.isFinite(p.x)&&Number.isFinite(p.y));ticks++;
 }
 assert.equal(g.checkpoint,g.level.platforms.length-1,name+' route can reach every platform');assert.equal(g.respawns,0,name+' forward traversal needs no recovery');
 routes[name]={seconds:ticks/120,platforms:g.level.platforms.length,webFrames:attachments};
 // Traverse back using opposite inputs and the same attachment/jump mechanic.
 ticks=0;
 while(g.checkpoint>0&&ticks<120*60){
  const p=g.player,floor=g.level.platforms[g.checkpoint],next=g.level.platforms[g.checkpoint-1],edge=next.x+next.w;
  g.step(dt,{move:p.x>edge-180?-1:p.grounded?-1:0,jump:p.grounded&&p.x<floor.x+120,power:name==='work'?!p.grounded&&p.x>edge-20:!p.grounded&&p.y>next.y-160&&p.x>edge-80});ticks++;
 }
 assert.equal(g.checkpoint,0,name+' reverse route can return to start');routes[name].reverseSeconds=ticks/120;
}
const work=new Physics(levels.work);work.player.x=500;work.step(dt,{jump:true,move:1,power:true});assert(work.webShot&&!work.rope,'web launches before attachment');
run(work,.4,{move:1,power:true});const anchor=work.rope.anchor,h=work.hand();assert(Math.hypot(h.x-anchor.x,h.y-anchor.y)<=work.rope.length+.01,'rope constraint');
const velocity=work.player.vx;work.release();assert.equal(work.rope,null);assert.equal(work.player.vx,velocity,'release preserves momentum');
work.checkpoint=2;work.player.y=1300;work.step(dt,{});assert.equal(work.respawns,1);assert.equal(work.player.platform,2,'falls return to safe platform');
for(const fps of [30,60,120]){
 const g=new Physics(levels.hobbies);let accumulator=0;
 for(let i=0;i<fps;i++){accumulator+=1/fps;while(accumulator+1e-10>=dt){g.step(dt,{move:1});accumulator-=dt;}}
 if(fps===30)routes.frameReference=g.player.x;else assert(Math.abs(g.player.x-routes.frameReference)<1e-8,'fixed step has same travel at every refresh rate');
 run(g,.3,{move:-1});assert.equal(g.player.facing,-1);run(g,1,{});assert(Math.abs(g.player.vx)<.01,'releasing movement settles');
}
const lunar=new Physics(levels.genai),earth=new Physics(levels.work);lunar.step(dt,{jump:true});earth.step(dt,{jump:true});let lt=0,et=0;
while(!lunar.player.grounded&&lt<5){lunar.step(dt,{});lt+=dt;}while(!earth.player.grounded&&et<5){earth.step(dt,{});et+=dt;}assert(lt>et*1.5,'moon jumps have longer air time');
lunar.step(dt,{jump:true});run(lunar,2,{power:true});assert(lunar.player.fuel<.01,'boost is finite');run(lunar,10,{});assert(lunar.player.fuel>.9,'landing recharges boost');
// A shot has a travel phase, with ordinary ballistic motion until impact.
const shot=new Physics(levels.work),ballistic=new Physics(levels.work);
for(const g of [shot,ballistic])g.player.x=500;
shot.step(dt,{jump:true,power:true});ballistic.step(dt,{jump:true});
run(shot,.1,{power:true});run(ballistic,.1,{});
assert(shot.webShot&&!shot.rope);assert.equal(shot.player.y,ballistic.player.y,'no tension before the web arrives');
shot.release();run(shot,.5,{});assert(!shot.webShot&&!shot.rope,'cancelled launch cannot attach later');
const climber=new Physics(levels.work);climber.player.x=500;climber.step(dt,{jump:true,power:true});run(climber,.4,{power:true});
const originalLength=climber.rope.length;run(climber,.3,{power:true,climb:true});assert(climber.rope.length<originalLength-40,'climbing takes in web');
const shortLength=climber.rope.length;run(climber,.2,{power:true});assert.equal(climber.rope.length,shortLength,'swing retains the new height');
run(climber,4,{power:true,climb:true});assert.equal(climber.rope.length,85,'climbing stops safely at anchor');
const airborneVelocity={vx:climber.player.vx,vy:climber.player.vy};climber.release();assert.equal(climber.player.vx,airborneVelocity.vx);assert.equal(climber.player.vy,airborneVelocity.vy);
const flyer=new Physics(levels.hobbies);flyer.toggleJetpack();run(flyer,1,{});assert.equal(flyer.jetpackBlend,1);assert(!flyer.player.grounded);
const initialY=flyer.player.y;run(flyer,1,{ascend:true});assert(flyer.player.y<initialY-200,'flight rises');
run(flyer,1,{});const hoverY=flyer.player.y;run(flyer,10,{});assert(Math.abs(flyer.player.y-hoverY)<.1,'flight hovers without input');assert.equal(flyer.player.fuel,1,'gallery boost never consumes fuel');
run(flyer,1,{descend:true});assert(flyer.player.y>hoverY+180,'flight descends');
run(flyer,60,{ascend:true});assert.equal(flyer.player.y,280,'ceiling keeps flight inside gallery');assert(flyer.jetpack&&flyer.player.fuel===1,'unlimited flight');
flyer.player.x=levels.hobbies.exhibits[0].x;flyer.player.y=500;assert(flyer.nearby(),'can open an exhibit from flight');
flyer.toggleJetpack();run(flyer,2,{});assert.equal(flyer.jetpackBlend,0);assert(flyer.player.grounded,'dog form restores gravity');

async function browserFixture(world){
 const els=new Map(),images=[],events={},imageCache={};let raf=null,time=0;
 for(const name of ['madhur-avatar-atlas-v2.png','madhur-avatar-actions-v1.png','madhur-interactions-v1.png','madhur-revision-poses-v1.png','mechanical-companion-pixel-v2.png'])imageCache['./assets/'+name]=await native.loadImage(path.resolve('assets',name));
 class Element{
  constructor(){this.style={setProperty:(k,v)=>this.style[k]=v};this.dataset={};this.handlers={};this.children=[];this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n),toggle:(n,v)=>v?this.classes.add(n):this.classes.delete(n)};this.clientWidth=1600;this.clientHeight=900;this.hidden=false;this.open=false;this.textContent='';}
  addEventListener(n,f){(this.handlers[n]??=[]).push(f)}
  fire(n,p={}){const e={target:this,button:0,pointerId:1,preventDefault(){this.prevented=true},stopPropagation(){},...p};for(const f of this.handlers[n]||[])f(e);return e;}
  closest(q){return q==='dialog'&&this===el('#worldDialog')?this.open?this:null:null}
  append(...nodes){this.children.push(...nodes);for(const n of nodes)n.parent=this}
  replaceChildren(){this.children=[]} setAttribute(k,v){this[k]=v} focus(){} setPointerCapture(){} click(){this.fire('click',{detail:0})}
  showModal(){this.open=true} close(){this.open=false;this.fire('close')}
  getBoundingClientRect(){
   if(this.parent===el('#worldAvatar')){const a=this.parent,size=290*.56,s=Number(el('#stage').style.transform?.match(/scale\(([^)]+)\)/)?.[1]||1),r=el('#stage').getBoundingClientRect();return {left:r.left+(parseFloat(a.style.left)-size/2)*s,top:r.top+(900-parseFloat(a.style.bottom)-size)*s,width:size*s,height:size*s};}
   return {left:parseFloat(this.style.left)||0,top:parseFloat(this.style.top)||0,width:1600,height:900};
  }
 }
 class Canvas extends Element{constructor(){super();this.native=native.createCanvas(720,720)}get width(){return this.native.width}set width(v){this.native.width=v}get height(){return this.native.height}set height(v){this.native.height=v}getContext(){const ctx=this.native.getContext('2d');return new Proxy(ctx,{get:(o,k)=>k==='drawImage'?(image,...args)=>o.drawImage(image.native||image,...args):typeof o[k]==='function'?o[k].bind(o):o[k],set:(o,k,v)=>{o[k]=v;return true}})}}
 const el=s=>{if(!els.has(s))els.set(s,['#universe','#foreground','#labScene'].includes(s)?new Canvas():new Element());return els.get(s)};
 const buttons=['left','right','jump','power','interact','climb','descend'].map(action=>{const b=el('[data-action="'+action+'"]');b.dataset.action=action;return b});
 class Image{constructor(){images.push(this)}set src(v){this.native=imageCache[v];this.complete=true;this.naturalWidth=this.native.width;this.naturalHeight=this.native.height;}decode(){return Promise.resolve()}}
 const context={console,URLSearchParams,Image,Element,location:{search:'?world='+world},devicePixelRatio:1,document:{hidden:false,title:'',querySelector:el,querySelectorAll:q=>q==='[data-action]'?buttons:[],createElement:t=>t==='canvas'?new Canvas():new Element(),addEventListener:(n,f)=>(events[n]??=[]).push(f)},getComputedStyle:()=>({}),matchMedia:()=>({matches:false}),requestAnimationFrame:f=>raf=f,cancelAnimationFrame(){},addEventListener:(n,f)=>(events[n]??=[]).push(f)};
 context.window=context;context.landscapePrompt={blocked:false};vm.createContext(context);
 for(const file of ['scene-viewport.js','avatar.js','companion.js','world-content.js','world-physics.js','world-web.js','lunar-lab-data.js','lunar-lab-scene.js','lunar-lab.js','world.js'])vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});
 await Promise.all(images.map(i=>i.decode()));await new Promise(resolve=>setImmediate(resolve));
 const fire=(name,p={})=>{const e={target:new Element(),preventDefault(){this.prevented=true},...p};for(const fn of events[name]||[])fn(e);return e};
 const step=n=>{for(let i=0;i<n;i++){time+=1000/60;raf(time)}};
 function screenshot(name){
  const out=native.createCanvas(1600,900),oc=out.getContext('2d');oc.drawImage(el('#universe').native,0,0);
  const a=el('#worldAvatar'),sprite=a.children[0];if(sprite){const size=290*.56;oc.imageSmoothingEnabled=false;oc.drawImage(sprite.native,parseFloat(a.style.left)-size/2,900-parseFloat(a.style.bottom)-size,size,size);}
  oc.drawImage(el('#foreground').native,0,0);fs.writeFileSync('work/'+name+'.png',out.toBuffer('image/png'));
 }
 step(2);screenshot('world-'+world+'-canvas');
 const g=context.playableWorld.game,start=g.player.x;fire('keydown',{code:'KeyW'});step(4);assert(g.player.grounded,'W does not jump');fire('keyup',{code:'KeyW'});fire('keydown',{code:'ArrowUp'});step(4);assert(g.player.grounded,'up arrow does not jump');fire('keyup',{code:'ArrowUp'});fire('keydown',{code:'Space'});step(4);assert(!g.player.grounded,'Space jumps in every world');fire('keyup',{code:'Space'});g.reset();fire('wheel',{deltaY:900});step(10);assert.equal(g.player.x,start,'wheel never moves the avatar');
 fire('keydown',{code:'KeyD'});step(30);fire('keyup',{code:'KeyD'});assert(g.player.x>start,'keyboard moves character');
 fire('blur');step(60);assert(Math.abs(g.player.vx)<.01,'blur releases movement');
 const left=buttons[0];left.fire('pointerdown');step(20);left.fire('pointercancel');step(60);assert(Math.abs(g.player.vx)<.01,'touch cancel clears movement');
 const jump=buttons[2],power=buttons[3];g.reset();g.player.x=world==='work'?500:180;jump.fire('pointerdown',{pointerId:10});power.fire('pointerdown',{pointerId:11});step(3);
 if(world==='work'){assert(g.webShot&&!g.rope,'two-finger jump plus power launches');screenshot('world-work-launch-canvas');step(22);assert(g.rope,'travelling web attaches');screenshot('world-work-swing-canvas');const length=g.rope.length,frames=new Set();fire('keydown',{code:'KeyW'});for(let i=0;i<30;i++){step(1);frames.add(el('#worldAvatar').dataset.avatarFrame);}assert(g.rope.length<length,'W climbs');assert.equal(el('#worldAvatar').dataset.avatarState,'climb');assert(frames.size>1,'climb cycles through poses');screenshot('world-work-climb-canvas');fire('keyup',{code:'KeyW'});step(1);assert(!g.climbing&&g.rope,'release W returns to swing');power.fire('pointerup',{pointerId:11});assert.equal(g.rope,null,'power release immediately releases web');}
 if(world==='genai')assert(g.boosting,'moon touch power boosts');
 jump.fire('pointerup',{pointerId:10});power.fire('pointercancel',{pointerId:11});fire('blur');g.reset();
 if(world==='work'){
  g.player.x=500;jump.fire('pointerdown',{pointerId:20});power.fire('pointerdown',{pointerId:21});step(25);assert(g.rope);
  const beforeClimb=g.rope.length;buttons[5].fire('pointerdown',{pointerId:22});step(15);assert(g.climbing&&g.rope.length<beforeClimb,'touch CLIMB works with WEB held');buttons[5].fire('pointercancel',{pointerId:22});step(1);assert(!g.climbing&&g.rope,'climb cancel retains swing');fire('blur');g.reset();
 }
 if(world==='hobbies'){
  fire('keydown',{code:'ShiftLeft'});step(16);assert(g.jetpack&&g.jetpackBlend>0&&g.jetpackBlend<1,'Shift starts a gradual transformation');screenshot('world-hobbies-transform-canvas');
  fire('keydown',{code:'ShiftLeft',repeat:true});assert(g.jetpack,'key repeat never toggles again');fire('keyup',{code:'ShiftLeft'});step(30);assert(g.jetpack,'key release retains jetpack');
  const ground=g.player.y;fire('keydown',{code:'Space'});step(45);fire('keyup',{code:'Space'});assert(g.player.y<ground-150,'Space rises while flying');step(45);screenshot('world-hobbies-jetpack-canvas');
  const beforeDown=g.player.y;buttons[6].fire('pointerdown',{pointerId:12});step(25);buttons[6].fire('pointerup',{pointerId:12});assert(g.player.y>beforeDown+50,'touch DOWN descends');
  power.fire('pointerdown',{pointerId:13});power.fire('pointerup',{pointerId:13});power.fire('click',{detail:1});assert(!g.jetpack,'touch toggles exactly once');step(50);assert.equal(g.jetpackBlend,0,'dog returns');
  power.fire('click',{detail:0});assert(g.jetpack,'assistive activation toggles');el('#helpButton').click();const beforePause=g.jetpackBlend;step(10);assert.equal(g.jetpackBlend,beforePause,'dialog pauses transformation');el('#worldDialog').close();step(45);assert(g.jetpack,'closing help preserves flight mode');
  fire('resize');step(2);assert(g.jetpack,'rotation retains flight mode');el('#rescueButton').click();assert(!g.jetpack&&g.jetpackBlend===0,'reset restores dog');
 }
 const exhibit=g.level.exhibits[0];g.player.x=exhibit.x;step(1);fire('keydown',{code:'KeyE'});assert(el('#worldDialog').open,'E opens nearby content');
 const paused=g.player.x;fire('keydown',{code:'KeyD'});step(30);assert.equal(g.player.x,paused,'exhibit pauses movement');el('#worldDialog').close();
 context.landscapePrompt.blocked=true;fire('keydown',{code:'KeyD'});step(5);assert.equal(g.player.x,paused,'orientation prompt pauses physics');context.landscapePrompt.blocked=false;
 el('#sceneViewport').clientWidth=844;el('#sceneViewport').clientHeight=390;fire('resize');step(2);assert(Number.isFinite(g.player.x),'rotation retains player state');
 return {world,images:images.length};
}
(async()=>{const renders=[];for(const world of ['work','genai','hobbies'])renders.push(await browserFixture(world));const report={pass:true,routes,moonAirTime:lt,earthAirTime:et,renders,checks:['forward and reverse traversal','travelling web with no premature tension; cancelled shots stay cancelled','web climbing, minimum length, retained height and release momentum','safe landing recovery','fixed-step frame-rate parity','moon gravity, finite boost and recharge','uniform Space jump, W climb only','gallery unlimited flight, ceiling, hover, descent and airborne exhibits','keyboard, multi-touch and accessible jetpack toggle; repeat guard','transformation, pause, reset and rotation','wheel does not move world','existing avatar and pet canvas rendering'],limitation:'Canvas images use the real renderers with a mocked DOM; browser CSS and physical-device interaction remain unverified.'};fs.writeFileSync('work/world-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));})().catch(e=>{console.error(e);process.exitCode=1});
