// Layout/coordinate regression checks; these do not substitute for device QA.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let coarse=false;
const sandbox={window:{},matchMedia:()=>({matches:coarse}),getComputedStyle:e=>e.padding};
vm.runInNewContext(fs.readFileSync('scene-viewport.js','utf8'),sandbox);
function fixture(w,h,safe={}){
 const viewport={clientWidth:w,clientHeight:h,padding:{paddingLeft:0,paddingRight:0,paddingTop:0,paddingBottom:0,...safe}};
 const properties={},classes=new Set();
 const stage={style:{setProperty:(name,value)=>properties[name]=value},classList:{toggle:(name,on)=>on?classes.add(name):classes.delete(name)},getBoundingClientRect(){
  const s=properties['--scene-scale'];return {left:parseFloat(this.style.left),top:parseFloat(this.style.top),width:parseFloat(this.style.width)*s,height:parseFloat(this.style.height)*s};
 }};
 return {viewport,stage,classes,fit:new sandbox.window.SceneViewport(viewport,stage)};
}
const cases=[];
const sizes=[[568,320],[667,375],[740,360],[844,390],[896,414],[915,412],[932,430],[1024,768],[1180,820],[1366,1024],[390,844]];
coarse=true;
for(const [w,h] of sizes)for(const safe of [{},{paddingLeft:44,paddingRight:44,paddingBottom:21}]){
 const {fit,stage,viewport,classes}=fixture(w,h,safe),layout=fit.resize(),rect=stage.getBoundingClientRect();
 assert.equal(layout.width,1600);assert.equal(layout.height,900);assert(classes.has('is-fitted'));
 assert(Math.abs(rect.width/rect.height-16/9)<1e-10,'one common aspect ratio on all compact screens');
 assert(Math.abs(rect.width/layout.width-rect.height/layout.height)<1e-10,'no horizontal/vertical stretching');
 const p=viewport.padding;
 assert(rect.left>=p.paddingLeft-1e-9&&rect.top>=p.paddingTop-1e-9,'respects top/left safe area');
 assert(rect.left+rect.width<=w-p.paddingRight+1e-9&&rect.top+rect.height<=h-p.paddingBottom+1e-9,'whole scene fits without cropping');
 for(const [x,y] of [[0,0],[200,710],[1152,432],[800,820],[1600,900]]){
  const logical=fit.point(rect.left+x*fit.scale,rect.top+y*fit.scale);
  assert(Math.abs(logical.x-x)<1e-9&&Math.abs(logical.y-y)<1e-9,'pointer/hand anchor maps back to exact scene point');
 }
 const anchor={getBoundingClientRect:()=>({left:rect.left+500*fit.scale,top:rect.top+800*fit.scale,width:180*fit.scale,height:40*fit.scale})};
 const bounds=fit.bounds(anchor);assert(Math.abs(bounds.left-500)<1e-9&&Math.abs(bounds.width-180)<1e-9,'portal bounds stay in logical units');
 cases.push({viewport:[w,h],safeArea:!!safe.paddingLeft,scale:fit.scale});
}
coarse=false;
for(const [w,h] of [[1280,720],[1440,900],[1536,730],[1920,920],[2560,1440]]){
 const {fit,stage,classes}=fixture(w,h),layout=fit.resize();
 assert.equal(layout.width,w);assert.equal(layout.height,h);assert.equal(fit.scale,1);assert(!classes.has('is-fitted'));
 assert.deepEqual(stage.getBoundingClientRect(),{left:0,top:0,width:w,height:h},'desktop geometry is unchanged');
}
// Both entry points include the fitter before the render loop and share a stage.
for(const [html,script] of [['index.html','director.js'],['world.html','world.js']]){
 const source=fs.readFileSync(html,'utf8');assert(source.indexOf('./scene-viewport.js')<source.indexOf('./'+script));
 assert(source.includes('id="sceneViewport"')&&source.includes('id="stage"'));
}
const report={pass:true,compactCases:cases.length,desktopCases:5,design:[1600,900],checks:['uniform aspect ratio and scale','whole composition inside safe areas','screen-to-scene hand/pointer/portal alignment','desktop dimensions unchanged','shared fitter on main and destination pages'],cases};
fs.writeFileSync('work/mobile-fit-results.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({...report,cases:undefined},null,2));
