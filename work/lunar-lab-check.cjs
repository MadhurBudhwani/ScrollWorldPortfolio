// Real lab controller + renderer, deterministic clocks and a small DOM fixture. No browser launch.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const native=require('C:/Users/Madhur/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const elements=new Map(),callbacks=new Map();let nextId=0,time=0,focused=null;
class Element {
 constructor(){this.children=[];this.handlers={};this.attributes={};this.hidden=false;this.dataset={};this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n),toggle:(n,on)=>on?this.classes.add(n):this.classes.delete(n)};this.textContent='';}
 append(...children){this.children.push(...children)} replaceChildren(){this.children=[]} setAttribute(k,v){this.attributes[k]=v}
 addEventListener(n,f){(this.handlers[n]??=[]).push(f)} fire(n){for(const f of this.handlers[n]||[])f({})} focus(){focused=this} click(){if(!this.disabled)this.fire('click')}
}
const canvas=native.createCanvas(960,360),el=s=>{if(!elements.has(s))elements.set(s,new Element());return elements.get(s)};el('#labScene').getContext=()=>canvas.getContext('2d');
const motion={matches:false};
const context={console,document:{hidden:false,querySelector:el,createElement:()=>new Element()},matchMedia:()=>motion,requestAnimationFrame:f=>{callbacks.set(++nextId,f);return nextId},cancelAnimationFrame:id=>callbacks.delete(id)};
context.window=context;context.landscapePrompt={blocked:false};vm.createContext(context);
for(const f of ['lunar-lab-data.js','lunar-lab-scene.js','lunar-lab.js','world-content.js'])vm.runInContext(fs.readFileSync(f,'utf8'),context,{filename:f});
const definitions=context.LunarLabData.definitions,evaluate=context.LunarLabData.evaluate,dialog=el('#worldDialog'),lab=new context.LunarLab(dialog);
function advance(frames){for(let i=0;i<frames;i++){time+=1000/60;const todo=[...callbacks.values()];callbacks.clear();todo.forEach(f=>f(time));}}
function save(name){fs.writeFileSync('work/lab-'+name+'.png',canvas.toBuffer('image/png'));}
let cases=0;const board=native.createCanvas(1920,1080),bc=board.getContext('2d');
for(const [index,id] of Object.keys(definitions).entries()){
 const def=definitions[id];
 for(let i=0;i<def.groups[0].options.length;i++)for(let j=0;j<(def.groups[1]?.options.length||1);j++){
  lab.open(id);assert(dialog.classes.has('lab-mode'));assert.equal(focused,el('#labRun'));lab.choose(0,i);if(def.groups[1])lab.choose(1,j);
  el('#labRun').click();advance(60);assert(lab.progress>0&&lab.progress<1);assert.equal(el('#labResult').hidden,true,'no premature result');
  if(i===0&&j===0){save(id+'-working');}
  el('#labSkip').click();assert.equal(lab.progress,1);assert(!el('#labResult').hidden);assert(el('#labAnswer').textContent.length>20);assert.equal(callbacks.size,0,'skip cancels animation loop');
  if(i===0&&j===0){save(id);bc.drawImage(canvas,(index%2)*960,Math.floor(index/2)*360);}
  const answer=el('#labAnswer').textContent;el('#labReplay').click();advance(310);assert.equal(el('#labAnswer').textContent,answer,'replay retains the same captured run');assert.equal(callbacks.size,0);cases++;
 }
}
fs.writeFileSync('work/lab-contact-sheet.png',board.toBuffer('image/png'));
assert.deepEqual(Array.from(context.worldLevels.genai.exhibits,e=>e.lab),Object.keys(definitions),'all six world stations map to a distinct console');
assert(!JSON.stringify(context.worldLevels.genai).match(/Galaxy|Safety Chat|SAFETY/),'moon content is capability based');
assert.equal(evaluate('search',[0]).sources[0].id,'D1');assert.equal(evaluate('search',[1]).sources[0].id,'D2');assert.equal(evaluate('search',[2]).sources.length,0);assert.equal(evaluate('search',[2]).tone,'notice');
assert.deepEqual(Array.from(evaluate('data',[0]).bars,b=>b.value),[20,30,40]);assert.deepEqual(Array.from(evaluate('data',[1]).bars,b=>b.value),[54,36]);
const workflows=new Set();for(let i=0;i<2;i++)for(let j=0;j<2;j++)workflows.add(evaluate('automate',[i,j]).answer);assert.equal(workflows.size,4,'all trigger/destination pairs have distinct outcomes');
assert.notEqual(evaluate('agents',[0]).tools[0],evaluate('agents',[1]).tools[0]);assert.equal(evaluate('trust',[1]).gates[0],'DENY');assert.equal(evaluate('trust',[1]).gates[1],'SKIP');assert.equal(evaluate('trust',[2]).gates[1],'NO SOURCE');
lab.sessions={};lab.open('reliable');lab.choose(0,1);lab.start();assert.equal(lab.run.hit,false,'unprimed repeat is a miss');lab.finish();lab.start();assert.equal(lab.run.hit,true,'completed run primes cache');lab.finish();assert.equal(lab.run.duration,24);lab.choose(0,2);lab.start();lab.finish();assert(lab.run.timeout&&lab.run.duration===980);
lab.sessions={};lab.open('reliable');lab.start();advance(40);dialog.fire('close');assert(!lab.active&&callbacks.size===0);assert.equal(lab.sessions.reliable.cached,false,'closing an unfinished request does not populate cache');
lab.open('search');lab.start();advance(20);lab.choose(0,2);assert.equal(callbacks.size,0,'changing input cancels the old run');assert.equal(lab.progress,0);assert(el('#labResult').hidden);lab.start();advance(30);const beforePause=lab.progress;context.document.hidden=true;advance(120);assert.equal(lab.progress,beforePause);context.document.hidden=false;context.landscapePrompt.blocked=true;advance(30);assert.equal(lab.progress,beforePause);context.landscapePrompt.blocked=false;advance(310);assert.equal(lab.progress,1);
motion.matches=true;lab.open('data');lab.start();assert.equal(lab.progress,1,'reduced motion returns the result immediately');assert.equal(callbacks.size,0);motion.matches=false;
lab.open('agents');lab.start();lab.open('trust');assert.equal(callbacks.size,0,'opening another station kills the previous animation');assert.equal(lab.id,'trust');assert.equal(lab.progress,0);assert(el('#labResult').hidden);
lab.close();assert(!dialog.classes.has('lab-mode')&&el('#lunarLab').hidden,'ordinary dialogs keep their original layout');
const report={pass:true,caseCombinations:cases,checks:['six distinct mapped utility stations','evidence and unsupported-answer branches','sample aggregations and four workflow combinations','permission denial and insufficient evidence','real session cache hit and bounded retry illustration','skip/replay/input cancellation and closed-panel cleanup','visibility/orientation pause and reduced motion','keyboard-native buttons and accessible result text'],limitation:'Canvas previews and mocked-DOM behavior verified; actual browser layout and physical mobile input remain unverified.'};fs.writeFileSync('work/lab-results.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
