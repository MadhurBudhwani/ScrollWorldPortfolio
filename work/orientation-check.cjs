const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const listeners={},handlers={},buttonHandlers={},classes=new Set();
const dialog={open:false,contains(target){return target===this},showModal(){this.open=true},close(){this.open=false},setAttribute(){},querySelector(){return {addEventListener:(n,f)=>buttonHandlers[n]=f}},addEventListener:(n,f)=>handlers[n]=f};
const browser={innerWidth:390,innerHeight:844,screen:{orientation:{addEventListener(){}}},addEventListener:(n,f)=>(listeners[n]??=[]).push(f)};
const document={createElement:()=>dialog,body:{append(){}},documentElement:{classList:{toggle(name,on){on?classes.add(name):classes.delete(name)}}}};
vm.runInNewContext(fs.readFileSync('orientation.js','utf8'),{window:browser,document});
function resize(w,h){browser.innerWidth=w;browser.innerHeight=h;listeners.resize.forEach(f=>f());}
function event(name,props={}){const e={preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true},...props};for(const f of listeners[name]||[])f(e);return e;}
assert(dialog.open&&browser.landscapePrompt.blocked&&classes.has('orientation-paused'));
assert(event('wheel').prevented&&event('touchmove').stopped);assert(event('keydown',{key:'ArrowDown'}).prevented);assert(!event('keydown',{key:'Tab'}).prevented);
assert(!event('wheel',{ctrlKey:true}).prevented);assert(!event('touchmove',{touches:[{},{}]}).prevented);assert(!event('wheel',{target:dialog}).prevented);
resize(844,390);assert(!dialog.open&&!browser.landscapePrompt.blocked&&!classes.has('orientation-paused'));assert(!event('wheel').prevented);
resize(768,1024);assert(dialog.open);buttonHandlers.click();assert(!dialog.open&&!browser.landscapePrompt.blocked);
resize(760,1024);assert(!dialog.open,'portrait opt-out survives a same-orientation resize');
resize(1024,768);resize(500,900);assert(dialog.open,'new portrait orientation prompts again');
let canceled=false;handlers.cancel({preventDefault(){canceled=true}});assert(canceled&&!dialog.open);
resize(1920,1080);assert(!dialog.open);resize(800,800);assert(dialog.open);
console.log('Orientation checks passed: phone/tablet/narrow-window prompt, landscape dismissal, input pause, keyboard access, portrait fallback, repeat rotation.');
