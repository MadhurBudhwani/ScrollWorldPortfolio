const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const listeners={};let now=0;
class Element {closest(){return null}}
const state={exit:null,hubLive:false,travel:26100,top:0};
const lenis={animatedScroll:0,limit:26100,scrollTo(y){this.animatedScroll=y}};
const sandbox={Element,state,lenis,scenes:Array(9),reducedMotion:{matches:false},performance:{now:()=>now},
 clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),document:{addEventListener(){}},
 window:{addEventListener:(name,fn)=>(listeners[name]??=[]).push(fn)}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('pacing.js','utf8')+'\nglobalThis.pacer=new ScrollPacer();',sandbox);
const pacer=sandbox.pacer;
function event(type,props={}){const e={target:new Element(),preventDefault(){this.prevented=true},stopImmediatePropagation(){},...props};for(const f of listeners[type]||[])f(e);return e;}
function reset(chapter=0){pacer.cancel();now=0;lenis.animatedScroll=(chapter+.25)*state.travel/9;}
reset();const spaceStart=lenis.animatedScroll;event('keydown',{key:' '});pacer.tick(0,1/60);event('keyup',{key:' '});assert.equal(lenis.animatedScroll,spaceStart,'Space is reserved for jumping, never cinematic scroll');
function sample({chapter=0,fps=60,intervals=[16],delta=1,keyboard=false}){
 reset(chapter);const start=lenis.animatedScroll;let next=0,n=0;
 if(keyboard)event('keydown',{key:'ArrowDown'});
 for(let frame=0;frame<fps;frame++){
  const time=frame*1000/fps;
  if(!keyboard)while(next<=time+.000001){now=next;event('wheel',{deltaY:typeof delta==='function'?delta(n):delta});next+=intervals[n++%intervals.length];}
  now=time;pacer.tick(time,1/fps);
 }
 return lenis.animatedScroll-start;
}
const comparisons=[];
for(const chapter of [0,1,2,3,4,5,6,7])for(const fps of [30,60,120]){
 const keyboard=sample({chapter,fps,keyboard:true});
 for(const intervals of [[8],[16],[33],[50],[8,25,12,45,60]])for(const delta of [.001,1,5000,n=>20*Math.exp(-n*.09)]){
  const trackpad=sample({chapter,fps,intervals,delta});assert(Math.abs(keyboard-trackpad)<1e-7,JSON.stringify({chapter,fps,intervals,keyboard,trackpad}));
 }
 comparisons.push({chapter,fps,keyboard,trackpad:'identical'});
}
// The end-of-gesture interval is bounded independently of event count/magnitude.
const tails=[];
for(const count of [1,10000]){
 reset();for(let i=0;i<count;i++)event('wheel',{deltaY:5000});
 const start=lenis.animatedScroll;
 for(let frame=0;frame<120;frame++){now=frame*1000/60;pacer.tick(now,1/60);}
 tails.push(lenis.animatedScroll-start);
 const stopped=lenis.animatedScroll;pacer.tick(10000,1/60);assert.equal(lenis.animatedScroll,stopped);
}
assert.equal(tails[0],tails[1]);assert(tails[0]<30);
reset();event('wheel',{deltaY:100});pacer.tick(0,1/60);const forward=lenis.animatedScroll;now=16;event('wheel',{deltaY:-.001});pacer.tick(16,1/60);assert(lenis.animatedScroll<forward);
event('blur');const blurred=lenis.animatedScroll;pacer.tick(32,1/60);assert.equal(lenis.animatedScroll,blurred);
reset();event('touchstart',{touches:[{clientY:300}]});now=1;event('touchmove',{touches:[{clientY:280}]});pacer.tick(1,1/60);event('touchend');const touchEnd=lenis.animatedScroll;pacer.tick(16,1/60);assert.equal(lenis.animatedScroll,touchEnd);
reset();event('keydown',{key:'ArrowDown'});pacer.tick(0,1/60);event('keyup',{key:'ArrowDown'});const keyEnd=lenis.animatedScroll;pacer.tick(16,1/60);assert.equal(lenis.animatedScroll,keyEnd);
reset();const zoom=event('wheel',{ctrlKey:true,deltaY:50});assert(!zoom.prevented);const start=lenis.animatedScroll;pacer.tick(0,1/60);assert.equal(lenis.animatedScroll,start);
pacer.go(10000);pacer.tick(500,1/60);assert.equal(lenis.animatedScroll,10000);
class Button extends Element {
 constructor(direction){super();this.dataset={scrollDirection:String(direction)};this.handlers={};this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n)};}
 closest(){return this}
 addEventListener(name,fn){this.handlers[name]=fn}
 setPointerCapture(id){this.captured=id}
 fire(name,props={}){const e={target:this,button:0,pointerId:7,isPrimary:true,preventDefault(){},stopPropagation(){},...props};this.handlers[name]?.(e);return e;}
}
const up=new Button(-1),down=new Button(1);pacer.bindButtons([up,down]);
let buttonParityCases=0;
for(const chapter of [0,1,2,3,4,5,6,7])for(const fps of [30,60,120]){
 const keyboard=sample({chapter,fps,keyboard:true});
 for(const button of [up,down]){
  reset(chapter);const start=lenis.animatedScroll;button.fire('pointerdown');
  assert.equal(button.captured,7);assert(button.classes.has('is-held'));
  for(let frame=0;frame<fps;frame++){now=frame*1000/fps;pacer.tick(now,1/fps);}
  assert(Math.abs(Math.abs(lenis.animatedScroll-start)-keyboard)<1e-7,'button hold matches keyboard speed in both directions');
  button.fire('pointerup');const stopped=lenis.animatedScroll;button.fire('click',{detail:1});pacer.tick(now+1000,1/fps);
  assert.equal(lenis.animatedScroll,stopped,'release and following click add no scroll tail');assert(!button.classes.has('is-held'));buttonParityCases++;
 }
}
for(const name of ['pointerup','pointercancel','lostpointercapture','blur']){
 reset();down.fire('pointerdown');pacer.tick(0,1/60);down.fire(name);const stopped=lenis.animatedScroll;pacer.tick(16,1/60);assert.equal(lenis.animatedScroll,stopped,name+' stops a hold');
}
reset();down.fire('pointerdown');down.fire('pointerup',{pointerId:99});assert(pacer.heldControl,'unrelated pointer cannot release hold');event('blur');assert.equal(pacer.heldControl,null);
reset();down.fire('pointerdown');pacer.cancel();assert(!down.classes.has('is-held'),'resize/navigation cancellation clears pressed state');
reset();down.fire('pointerdown',{button:2});assert.equal(pacer.heldControl,null);down.fire('pointerdown',{isPrimary:false});assert.equal(pacer.heldControl,null);
for(const key of [' ','Enter']){
 reset();down.fire('keydown',{key,repeat:false});pacer.tick(0,1/60);down.fire('keyup',{key});const stopped=lenis.animatedScroll;pacer.tick(16,1/60);assert.equal(lenis.animatedScroll,stopped,'keyboard activation stops on release');
}
reset();const beforeClick=lenis.animatedScroll;down.fire('click',{detail:0});assert(lenis.animatedScroll>beforeClick,'assistive activation advances');const afterClick=lenis.animatedScroll;pacer.tick(1000,1/60);assert.equal(lenis.animatedScroll,afterClick);
reset();down.fire('pointerdown');event('touchstart',{target:down,touches:[{clientY:300}]});event('touchmove',{target:down,touches:[{clientY:250}]});down.fire('pointerup');assert.equal(pacer.gestureDirection,0,'button finger motion cannot queue a swipe');
reset(8);state.hubLive=true;const hubStart=lenis.animatedScroll;up.fire('pointerdown');pacer.tick(0,1/60);assert(lenis.animatedScroll<hubStart,'up button can leave hub without triggering avatar controls');state.hubLive=false;
reset();sandbox.reducedMotion.matches=true;down.fire('pointerdown');const reducedStart=lenis.animatedScroll;pacer.tick(0,1/60);assert(lenis.animatedScroll>reducedStart,'explicit controls remain usable with reduced motion');down.fire('pointerup');sandbox.reducedMotion.matches=false;
reset();sandbox.window.landscapePrompt={blocked:true};down.fire('pointerdown');assert.equal(pacer.heldControl,null);sandbox.window.landscapePrompt.blocked=false;
reset();state.exit={};down.fire('pointerdown');assert.equal(pacer.heldControl,null);state.exit=null;
const report={pass:true,equalSpeedCases:480,buttonParityCases,gestureGapMs:pacer.gestureGapMs,comparisons,tails,checks:['arrow and trackpad speed parity in every scroll chapter','tiny, large and diminishing deltas accepted','irregular event cadence bridged','30/60/120 Hz parity','event bursts cannot queue distance','immediate reversal','touchend, keyup and blur stop','pinch zoom preserved','navigation seeks immediately','48 screen-button/keyboard speed comparisons','button release, cancel and capture loss stop immediately','button keyboard/assistive activation and reduced-motion support','hub reverse scrolling and portrait/portal guards','button finger movement does not queue a swipe']};
fs.writeFileSync('work/pacing-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,comparisons:comparisons.filter(v=>v.fps===60)},null,2));
