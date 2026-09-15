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
const report={pass:true,equalSpeedCases:480,gestureGapMs:pacer.gestureGapMs,comparisons,tails,checks:['arrow and trackpad speed parity in every scroll chapter','tiny, large and diminishing deltas accepted','irregular event cadence bridged','30/60/120 Hz parity','event bursts cannot queue distance','immediate reversal','touchend, keyup and blur stop','pinch zoom preserved','navigation seeks immediately']};
fs.writeFileSync('work/pacing-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,comparisons:comparisons.filter(v=>v.fps===60)},null,2));
