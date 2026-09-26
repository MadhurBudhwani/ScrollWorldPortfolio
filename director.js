const canvas = document.querySelector('#universe');
const ctx = canvas.getContext('2d', { alpha: false });
const stage = document.querySelector('#stage');
const sceneViewport = new SceneViewport(document.querySelector('#sceneViewport'), stage);
const movie = document.querySelector('.scroll-movie');
const copy = document.querySelector('#storyCopy');
const player = document.querySelector('#player');
const avatar = window.AvatarAnimator ? new AvatarAnimator(player) : null;
const hub = document.querySelector('#hub');
const portals = [...document.querySelectorAll('.ground-portal')];
const hud = document.querySelector('.hud');
const menuToggle = document.querySelector('.menu-toggle');
const chapterNavigation = document.querySelector('#chapterNavigation');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const TAU = Math.PI * 2;
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const mix = (a, b, t) => a + (b - a) * t;
const ease = n => { const t = clamp(n); return t * t * (3 - 2 * t); };
const colors = ['#84f5ad', '#67daf5', '#f3cc70', '#f58caf'];

const scenes = window.PortfolioChapters.map(scene => ({ ...scene, skills: [...scene.skills] }));

// Rasterize the glyphs once. Object travel stays continuous rather than snapping to pixels.
const glyphs = {
  A:'01110/10001/10001/11111/10001/10001/10001', B:'11110/10001/10001/11110/10001/10001/11110', C:'01111/10000/10000/10000/10000/10000/01111',
  D:'11110/10001/10001/10001/10001/10001/11110', E:'11111/10000/10000/11110/10000/10000/11111', F:'11111/10000/10000/11110/10000/10000/10000',
  G:'01111/10000/10000/10111/10001/10001/01111', H:'10001/10001/10001/11111/10001/10001/10001', I:'11111/00100/00100/00100/00100/00100/11111',
  J:'00111/00010/00010/00010/10010/10010/01100', K:'10001/10010/10100/11000/10100/10010/10001', L:'10000/10000/10000/10000/10000/10000/11111',
  M:'10001/11011/10101/10101/10001/10001/10001', N:'10001/11001/11001/10101/10011/10011/10001', O:'01110/10001/10001/10001/10001/10001/01110',
  P:'11110/10001/10001/11110/10000/10000/10000', Q:'01110/10001/10001/10001/10101/10010/01101', R:'11110/10001/10001/11110/10100/10010/10001',
  S:'01111/10000/10000/01110/00001/00001/11110', T:'11111/00100/00100/00100/00100/00100/00100', U:'10001/10001/10001/10001/10001/10001/01110',
  V:'10001/10001/10001/10001/10001/01010/00100', W:'10001/10001/10001/10101/10101/10101/01010', X:'10001/10001/01010/00100/01010/10001/10001',
  Y:'10001/10001/01010/00100/00100/00100/00100', Z:'11111/00001/00010/00100/01000/10000/10000/11111',
  '0':'01110/10011/10101/10101/11001/10001/01110', '1':'00100/01100/00100/00100/00100/00100/01110', '2':'01110/10001/00001/00010/00100/01000/11111',
  '3':'11110/00001/00001/01110/00001/00001/11110', '4':'00010/00110/01010/10010/11111/00010/00010', '5':'11111/10000/10000/11110/00001/00001/11110',
  '6':'01110/10000/10000/11110/10001/10001/01110', '7':'11111/00001/00010/00100/01000/01000/01000', '8':'01110/10001/10001/01110/10001/10001/01110',
  '9':'01110/10001/10001/01111/00001/00001/01110', '.':'00000/00000/00000/00000/00000/00110/00110', '+':'00000/00100/00100/11111/00100/00100/00000',
  '/':'00001/00010/00010/00100/01000/01000/10000', '-':'00000/00000/00000/11111/00000/00000/00000',
};
function pixelText(c, text, x, y, unit, color) {
  c.fillStyle = color;
  [...text].forEach((ch, n) => (glyphs[ch] || '').split('/').forEach((row, j) => [...row].forEach((v, i) => {
    if (v === '1') c.fillRect(x + (n * 6 + i) * unit, y + j * unit, unit, unit);
  })));
}
function sprite(label, tone, kind, index) {
  const tex = document.createElement('canvas');
  tex.width = 384; tex.height = 248;
  const c = tex.getContext('2d');
  const color = colors[tone];
  const rect = (x,y,w,h,col) => { c.fillStyle = col; c.fillRect(x,y,w,h); };
  if(kind==='spiral'||kind==='orbit') {
    const unit=Math.min(7,320/(label.length*6-1));
    const width=(label.length*6-1)*unit;
    for(let d=14;d>=0;d-=2)pixelText(c,label,(384-width)/2+d,100+d,unit,d?'#214e4e':color);
    rect(50,168,284,3,color);
    for(let i=0;i<4;i++)rect(48+i*12,186,6,6,color);
    pixelText(c,String(index+1).padStart(2,'0'),304,179,2,color);
    return tex;
  }
  if(kind==='reel') {
    const paper=tone===3||tone===0;
    if(paper) {
      rect(104,30,176,130,'#e8dab3');rect(104,30,12,130,'#b96680');
      rect(128,52,112,6,'#897d6b');rect(128,68,128,6,'#897d6b');
      rect(128,84,112,6,'#897d6b');rect(128,100,128,6,'#897d6b');
      rect(128,116,72,6,'#897d6b');
    } else {
      rect(128,40,128,28,color);rect(96,68,192,24,color);rect(72,92,240,42,color);
      rect(128,134,8,30,color);rect(248,134,8,30,color);
      rect(112,164,40,18,'#f3cc70');rect(232,164,40,18,'#f3cc70');
    }
    const unit=Math.min(5,320/(label.length*6-1));
    pixelText(c,label,(384-(label.length*6-1)*unit)/2,202,unit,'#f1fff6');
    return tex;
  }
  // Cargo modules have a solid shell, sockets and wheels; names are printed on the shell.
  rect(24,24,336,204,'#030b0d'); rect(16,40,352,172,'#030b0d');
  rect(24,40,328,164,color); rect(40,24,296,188,color);
  rect(40,40,296,8,'#efffef'); rect(40,196,296,16,'#163c3a');
  rect(336,48,16,148,'#163c3a');
  if (kind === 'reel') {
    rect(48,60,272,112, tone === 3 ? '#eeddbb' : '#112329');
    for(let y=64;y<160;y+=24) { rect(32,y,8,12,'#051314'); rect(328,y,8,12,'#051314'); }
    if(tone === 3) { rect(64,74,6,80,'#cf738f'); rect(80,80,132,4,'#aa9b89'); rect(80,146,172,4,'#aa9b89'); }
  } else if(kind === 'gates') {
    rect(64,62,24,84,'#173b34'); rect(296,62,24,84,'#173b34');
    rect(112,60,160,104,'#112329'); rect(176,68,32,24,color); rect(184,96,16,28,color);
  } else {
    rect(48,60,272,104,color);
    for(let j=0;j<4;j++) rect(56+j*20,72,12,8,j===0?'#f3cc70':'#365657');
    for(let j=0;j<8;j++) rect(56+j*32,178,16,8,'#163c3a');
    rect(64,212,40,28,'#081519');rect(280,212,40,28,'#081519');
    rect(76,216,16,16,'#89b3b3');rect(292,216,16,16,'#89b3b3');
  }
  const unit = Math.min(4, 264 / (label.length * 6 - 1));
  const width = (label.length * 6 - 1) * unit;
  pixelText(c,label,(384-width)/2,112,unit,kind==='gates'?'#f1fff6':'#082124');
  pixelText(c,String(index+1).padStart(2,'0'),52,218,1.5,color);
  rect(290,216,40,4,color);
  return tex;
}
scenes.forEach(s => { s.textures = s.skills.map((label,i) => {const tex=sprite(label,(s.color+i%2)%4,s.mode,i);tex.mascotLabel=label;return tex;}); });

const state = { w:0, h:0, dpr:1, travel:1, top:0, progress:0, scene:-1, time:0, frameMs:16.7, hubLive:false, x:0, y:0, vy:0, keys:new Set(), chapterPortal:null };
// ScrollPacer owns wheel/touch/key speed. Lenis maintains the document position.
const lenis = new Lenis({ autoRaf:false, smoothWheel:false, syncTouch:false });
const scrollPacer=new ScrollPacer();
scrollPacer.bindButtons(document.querySelectorAll('[data-scroll-direction]'));
const autoplayTour=window.portfolioTour=new AutoplayTour({
  getState:()=>({scroll:lenis.animatedScroll,title:scenes[state.scene]?.key.toUpperCase()}),
  seek:progress=>lenis.scrollTo(state.top+state.travel*progress,{immediate:true}),
  cancelInput:()=>scrollPacer.cancel()
});
function resize() {
  const hadLayout=state.w>0,progress=state.progress,relativeX=state.w?state.x/state.w:.2;
  const layout=sceneViewport.resize();
  state.w = layout.width; state.h = layout.height;
  state.dpr = Math.min(devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(state.w * state.dpr); canvas.height = Math.round(state.h * state.dpr);
  resizeRevision();
  ctx.setTransform(state.dpr,0,0,state.dpr,0,0); ctx.imageSmoothingEnabled = false;
  // Document travel uses the physical sticky viewport, never the design height.
  state.travel = movie.offsetHeight - layout.viewportHeight;
  state.top = movie.getBoundingClientRect().top + scrollY;
  state.x = clamp(relativeX*state.w, 30, state.w-30);
  lenis.resize();
  if(hadLayout){
    scrollPacer.cancel();
    lenis.scrollTo(state.top+state.travel*progress,{immediate:true});
    state.actorSample=null;mascot.x=null;mascot.pointer=null;
  }
}
function imageObject(texture,x,y,scale=1,angle=0,alpha=1) {
  if(alpha<=0 || scale<=0 || x < -800*scale || x > state.w+800*scale) return;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x,y); ctx.rotate(angle); ctx.scale(scale,scale);
  if(texture.mascotLabel){
    const textOnly=['orbit','spiral'].includes(scenes[state.scene]?.mode);
    registerMascotTarget(texture.mascotLabel,0,textOnly?22:0,textOnly?Math.min(336,texture.mascotLabel.length*42):352,textOnly?100:216);
  }
  ctx.drawImage(texture,-192,-124); ctx.restore();
}
function line(points,color,width=2) {
  ctx.strokeStyle=color; ctx.lineWidth=width; ctx.beginPath();
  points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.stroke();
}
function backdrop(position) {
  // Clear the full physical buffer, including the fractional-DPR edge pixel.
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.fillStyle='#070d11';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();
  celestialLayer(position);
  const horizon=state.h*(state.w<700?.64:.57);
  // Shared architecture travels continuously across all chapter boundaries.
  ctx.globalAlpha=.22;
  for(let i=0;i<22;i++) {
    const x=((i*137.3-position*72)%(state.w+100)+state.w+100)%(state.w+100);
    const y=100+(i*79.7)%(state.h-160);
    ctx.fillStyle=i%2?'#67daf5':'#84f5ad'; ctx.fillRect(x,y,2,2);
  }
  ctx.globalAlpha=1;
  for(let i=0;i<16;i++) {
    const x=(i/15-.5)*state.w*2;
    line([[state.w/2+x*.15,horizon],[state.w/2+x,state.h]],'#17282c');
  }
  for(let j=0;j<12;j++) {
    const depth=(j/12+position*.11)%1;
    const y=horizon+(state.h-horizon)*depth*depth;
    line([[0,y],[state.w,y]],'#17282c');
  }
  for(let i=0;i<5;i++) {
    const phase=(i/5+position*.35)%1;
    const width=mix(state.w*.2,state.w*1.6,phase*phase), height=width*.54;
    ctx.globalAlpha=.035+.12*phase;
    ctx.strokeStyle=colors[Math.floor(position)%4]; ctx.lineWidth=4;
    ctx.strokeRect(state.w/2-width/2,state.h*.68-height/2,width,height);
  }
  ctx.globalAlpha=1;
}
function procession(s,p) {
  const g=trainGeometry(state.directedLocal),{scale,gap,y}=g;
  line([[g.x-gap*2,y+138*scale],[g.x+s.skills.length*gap,y+138*scale]],colors[s.color],4);
  engine(g,p);
  const art=window.TrainArt&&TrainArt.ready;
  // Driven by the chapter's own skill list: adding a skill adds a wagon.
  s.skills.forEach((label,i)=>{
    const x=g.x+i*gap;
    if(art){
      const kind=TrainArt.car(i);
      const behind=i?TrainArt.width(TrainArt.car(i-1))/2:TrainArt.engineOffset()-TrainArt.width('engine')/2;
      TrainArt.coupling(g,i?x-gap+behind*scale:g.x-behind*scale,x-TrainArt.width(kind)/2*scale);
      TrainArt.draw(kind,x,g,label);
      return;
    }
    line([[x-gap+170*scale,y+65*scale],[x-170*scale,y+65*scale]],'#698b88',7);
    line([[x-100,y+115*scale],[x-100,y+138*scale],[x+100,y+138*scale],[x+100,y+115*scale]],'#344c4f',3);
    imageObject(s.textures[i],x,y,scale);
  });
}
function reel(s,p) {
  drawReelRope();
  const mobile=state.w<1000, scale=(mobile?.76:1.1)*actorViewportScale(), gap=270*scale;
  const anchorX=state.w*(mobile?.52:.72), anchorY=state.h*(mobile?.75:.60);
  ctx.save();
  // A continuous physical strip with synchronized sprockets and frames.
  ctx.beginPath(); ctx.rect(0,mobile?state.h*.49:105,state.w,state.h); ctx.clip();
  ctx.translate(anchorX,anchorY); ctx.rotate(s.key==='writing'?-.21:-.32);
  const offset=p*(s.skills.length-1)*gap, stripTop=-offset-gap;
  ctx.fillStyle='#203638'; ctx.fillRect(-181*scale,stripTop,362*scale,(s.skills.length+1)*gap);
  for(let side of [-1,1]) {
    ctx.fillStyle=colors[s.color]; ctx.fillRect(side*178*scale-3,stripTop,6,(s.skills.length+1)*gap);
    for(let y=stripTop;y<stripTop+(s.skills.length+1)*gap;y+=30*scale) {
      ctx.fillStyle='#070d11'; ctx.fillRect(side*158*scale-7,y,14*scale,16*scale);
    }
  }
  s.textures.forEach((tex,i) => imageObject(tex,0,i*gap-offset,scale*.86));
  ctx.restore();
}
function spiral(s,p) {
  const mobile=state.w<1000, cx=state.w*(mobile?.5:.61), cy=state.h*(mobile?.74:.70);
  const radius=mobile?125:Math.min(state.w*.28,360), turn=p*TAU*1.1, rush=ease((p-.70)/.28);
  ctx.save();
  ctx.beginPath(); ctx.rect(0,state.h*(mobile?.50:.43),state.w,state.h); ctx.clip();
  const path=[];
  for(let i=0;i<=100;i++) {
    const t=i/100, a=t*TAU*1.35-turn, r=radius*(.25+t*.75)*(1+ rush*4);
    path.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r*.46]);
  }
  line(path,'#365652',3);
  // A shared helix followed by a deliberate camera push through its front object.
  spiralObjects(s,p).sort((a,b)=>a.depth-b.depth).forEach(o=>imageObject(o.tex,o.x,o.y,o.scale,o.angle,o.alpha));
  ctx.restore();
}
function gates(s,p) {
  const mobile=state.w<700, cx=state.w*.5, cy=state.h*(mobile?.74:.73);
  for(let i=s.skills.length-1;i>=0;i--) {
    const z=i-p*(s.skills.length-1);
    if(z < -.72) continue;
    const size=(mobile?.73:1.15)/(1+Math.max(-.7,z)*.62), spread=160*size;
    const alpha=z<0?1-ease(-z/.72):1;
    ctx.globalAlpha=alpha; ctx.strokeStyle=colors[s.color]; ctx.lineWidth=8*size;
    ctx.strokeRect(cx-spread,cy-110*size,spread*2,225*size);
    imageObject(s.textures[i],cx,cy,size*.9,0,alpha);
  }
  ctx.globalAlpha=1;
}
function slideOneActivation(index,progress){
  const timing=scenes[0].timeline;
  return ease((progress-(timing.nodeStart+index*timing.nodeStep))/timing.nodeDuration);
}
function drawOrbitNodeFrame(o,activation,focused){
  const pulse=Math.sin(activation*Math.PI),rx=Math.round(88*o.scale),ry=Math.round(58*o.scale);
  ctx.save();ctx.translate(Math.round(o.x),Math.round(o.y));
  ctx.globalAlpha=.22+activation*.18;
  ctx.fillStyle='#06120f';ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,TAU);ctx.fill();
  ctx.globalAlpha=.72;ctx.strokeStyle='#102b27';ctx.lineWidth=7;
  ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,TAU);ctx.stroke();
  ctx.globalAlpha=.34+activation*.48;ctx.strokeStyle=focused?'#c8ffe0':'#4f8174';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,0,rx-5,ry-5,0,0,TAU);ctx.stroke();
  if(activation>.01){
    ctx.globalAlpha=.30+activation*.55;ctx.strokeStyle=colors[0];ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(0,0,rx-2,ry-2,0,-2.62,-.52);ctx.stroke();
    ctx.beginPath();ctx.ellipse(0,0,rx-2,ry-2,0,.52,2.62);ctx.stroke();
    ctx.fillStyle=focused?'#effff5':'#9affbd';
    for(const [x,y,w,h]of[[-rx-4,-3,8,6],[rx-4,-3,8,6],[-3,-ry-4,6,8],[-3,ry-4,6,8]])ctx.fillRect(x,y,w,h);
  }
  if(pulse>.02&&!reducedMotion.matches){
    ctx.globalAlpha=pulse*.75;ctx.fillStyle='#d9ffe7';
    for(const [x,y]of[[-rx*.72,-ry*.78],[rx*.76,-ry*.66],[-rx*.82,ry*.58],[rx*.70,ry*.74]])ctx.fillRect(Math.round(x)-2,Math.round(y)-2,4,4);
  }
  ctx.restore();
  return pulse;
}
function orbit(s,p) {
  const mobile=state.w<1000, cx=state.w*(mobile?.5:.70), cy=state.h*(mobile?.73:.66), r=mobile?125:245;
  const raw=state.local,points=[];
  for(let i=0;i<=64;i++){const a=i/64*TAU;points.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r*.48]);}
  ctx.save();ctx.globalAlpha=.75;line(points,'#102824',8);
  ctx.globalAlpha=.55;line(points,'#416c62',2);ctx.restore();
  const objects=s.textures.map((tex,i)=>{
    const a=i/s.skills.length*TAU+p*TAU*.55;
    return {tex,i,a,x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r*.48,depth:Math.sin(a),scale:(mobile?.45:.66)+Math.sin(a)*.1,activation:slideOneActivation(i,raw)};
  });
  objects.forEach(o=>{
    if(o.activation<=.01)return;
    ctx.save();ctx.globalAlpha=.18+o.activation*.42;ctx.strokeStyle=colors[0];ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(cx,cy,r,r*.48,0,o.a-.25,o.a+.25);ctx.stroke();ctx.restore();
  });
  // A single hard-edged packet hands activation from each node to the next.
  objects.forEach((o,i)=>{
    if(i===0)return;const pulse=Math.sin(o.activation*Math.PI);
    if(pulse<=.02||reducedMotion.matches)return;
    const from=objects[i-1],t=ease(o.activation),x=mix(from.x,o.x,t),y=mix(from.y,o.y,t);
    ctx.save();ctx.globalAlpha=pulse*.72;ctx.fillStyle='#baffcf';ctx.fillRect(Math.round(x)-3,Math.round(y)-3,6,6);ctx.restore();
  });
  updateOrbitTargets(objects,s);
  objects.sort((a,b)=>a.depth-b.depth).forEach(o=>{
    const focused=revisionUI.active===o.i,pulse=drawOrbitNodeFrame(o,o.activation,focused);
    imageObject(o.tex,o.x,o.y,o.scale*(1+pulse*.045)*(focused?1.08:1));
  });
}
const hubPortalThemes={work:'green',genai:'cyan',hobbies:'pink',about:'violet'};
function drawPortals(){
  if(!window.PortalArt)return;
  const chapter=state.chapterPortal;
  if(chapter?.opacity>.001)PortalArt.draw(ctx,chapter.x,chapter.y,chapter.width,chapter.height,chapter.theme,chapter);
  if(!state.hubLive)return;
  const opacity=ease(state.local/.16),phase=reducedMotion.matches?0:(state.time/2600)%1;
  portals.forEach(portal=>{
    const mouth=portal.querySelector('.portal-mouth'),box=sceneViewport.bounds(mouth);
    const selected=state.exit?.portal===portal;
    const entering=selected&&state.exit.phase==='descend'?clamp(state.exit.elapsed/.92):0;
    PortalArt.draw(ctx,box.left+box.width/2,box.top+box.height/2,box.width,box.height,
      hubPortalThemes[portal.dataset.world]||'green',{
        opacity,phase:phase+portals.indexOf(portal)*.17,
        approach:portal.classList.contains('is-near')?1:0,
        entering,reducedMotion:reducedMotion.matches,
      });
  });
}
function draw(position,index,p) {
  mascot.targets=[];
  backdrop(position);
  const scene=scenes[index], alpha=(index===0?1:ease(p/.10))*(1-ease((p-.9)/.1));
  ctx.save(); ctx.globalAlpha=alpha;
  const shotProgress=shotTime(state.directedLocal);
  ({procession,reel,spiral,gates,orbit,circuit:routerCircuit,crossing,fusion:hobbyFusion}[scene.mode] || (()=>{}))(scene,shotProgress);
  ctx.restore();
  if(scene.mode==='hub') {
    ctx.fillStyle='#84f5ad';ctx.fillRect(0,state.h-82,state.w,6);
    ctx.fillStyle='#12372d';ctx.fillRect(0,state.h-76,state.w,76);
    for(let x=0;x<state.w;x+=64){ctx.fillStyle='#245243';ctx.fillRect(x+4,state.h-58,46,6);}
  }
  drawPortals();
}
function updateCopy(index,p) {
  const scene=scenes[index];
  if(index!==state.scene) {
    state.scene=index;
    document.querySelector('#sceneKicker').textContent=scene.kicker;
    document.querySelector('#sceneTitle').textContent=scene.title;
    document.querySelector('#sceneBody').textContent=scene.body;
    document.querySelector('#chapterNo').textContent=String(index).padStart(2,'0');
    document.querySelector('#chapterKey').textContent=scene.key;
    stage.dataset.mode=scene.mode;stage.dataset.scene=scene.key;
    stage.style.setProperty('--accent',colors[scene.color]);
    hud.classList.toggle('is-compact',index>0);
    closeMenu(false);
    document.querySelectorAll('.hud nav a').forEach(a=>a.toggleAttribute('aria-current',a.hash===`#${scene.key}`));
  }
  const alpha=(index===0?1:ease(p/.12))*(1-ease((p-.86)/.14));
  copy.style.opacity=scene.key==='hub'?0:alpha;
  copy.style.transform=reducedMotion.matches?'none':`translateY(${(1-alpha)*18}px)`;
  document.querySelector('#progressBar').style.transform=`scaleY(${state.progress})`;
  const wasLive=state.hubLive;
  state.hubLive=scene.key==='hub';
  hub.style.opacity=state.hubLive?ease(p/.16):0;
  hub.classList.toggle('is-live',state.hubLive);hub.inert=!state.hubLive;
  if(state.hubLive&&!wasLive) {state.x=state.w*.14;state.y=0;state.vy=0;state.keys.clear();}
  document.querySelector('.game-controls').inert=!state.hubLive;
  document.querySelector('.game-controls').classList.toggle('is-live',state.hubLive);
}
function closeMenu(focus = false) {
  hud.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded','false');
  menuToggle.setAttribute('aria-label','Open navigation');
  chapterNavigation.inert=true;
  if(focus&&state.scene>0)menuToggle.focus();
}
function nearestPortal() {
  return portals.find(portal=>{
    const r=sceneViewport.bounds(portal.querySelector('.portal-mouth'));
    return Math.abs(state.x-r.left-r.width/2)<r.width*.45;
  });
}
function enterPortal(portal) {
  if(!state.hubLive||!portal||state.exit)return;
  state.keys.clear();state.jumpDelay=0;
  state.exit={portal,phase:'approach',elapsed:0};
  lenis.stop();closeMenu();
}
function cancelEntry() {
  if(!state.exit)return;
  state.exit=null;state.y=0;state.vy=0;
  player.classList.remove('entering');
  stage.style.setProperty('--iris','0%');
  stage.classList.remove('is-departing');
  lenis.start();
}
function updateEntry(dt) {
  const exit=state.exit;if(!exit)return;
  if(exit.phase==='navigating')return;
  const r=sceneViewport.bounds(exit.portal.querySelector('.portal-mouth'));
  const target=r.left+r.width/2;
  if(exit.phase==='approach'){
    const delta=target-state.x;
    state.x+=Math.sign(delta)*Math.min(Math.abs(delta),220*dt);
    if(Math.abs(delta)<2&&state.y===0){state.x=target;exit.phase='descend';exit.elapsed=0;player.classList.add('entering');}
  } else {
    exit.elapsed+=dt;
    const iris=clamp((exit.elapsed-.43)/.45);
    stage.classList.add('is-departing');
    stage.style.setProperty('--iris',iris*150+'%');
    stage.style.setProperty('--portal-x',target+'px');
    if(exit.elapsed>.92){
      exit.phase='navigating';
      const targetUrl=new URL('./world.html',location.href);
      targetUrl.searchParams.set('world',exit.portal.dataset.world);
      if(new URLSearchParams(location.search).get('avatar')==='original')targetUrl.searchParams.set('avatar','original');
      location.assign(targetUrl.href);
    }
  }
}
function updatePlayer(dt,paintForeground=true) {
  let movement=0;
  let pose=revisionPose(state.scene,state.directedLocal);
  const transition=chapterTransition(state.scene,state.local,pose);
  pose=transition.pose;
  if(state.hubLive) {
    const before=state.x;
    if(state.exit)updateEntry(dt);
    else {
      movement=Number(state.keys.has('d')||state.keys.has('arrowright'))-Number(state.keys.has('a')||state.keys.has('arrowleft'));
      state.x=clamp(state.x+movement*180*dt,25,state.w-25);
      if(state.jumpDelay>0){state.jumpDelay=Math.max(0,state.jumpDelay-dt);if(state.jumpDelay===0)state.vy=640;}
    }
    if(state.exit)movement=Math.sign(state.x-before);
    if(!state.exit||state.exit.phase==='approach'){
      state.vy-=1550*dt;state.y=Math.max(0,state.y+state.vy*dt);if(state.y===0)state.vy=0;
    }
    if(!transition.mode)pose={x:state.x,feet:state.h-82-state.y,scale:(state.w<700?.67:.82)*actorViewportScale(),mode:'idle',direction:movement};
    portals.forEach(p=>p.classList.toggle('is-near',p===nearestPortal()));
  } else {
    state.y=0;state.vy=0;state.jumpDelay=0;
    movement=pose.mode==='walk'?pose.direction:0;
  }
  const scrollMotion=Math.abs(state.progress-state.previousProgress)>.000001;
  if(scrollMotion)state.scrollDirection=Math.sign(state.progress-state.previousProgress);
  const previous=state.actorSample;
  const sameScene=previous&&previous.scene===state.scene;
  const dx=sameScene?pose.x-previous.x:0;
  const dy=sameScene?pose.feet-previous.feet:0;
  const travelling=Math.abs(dx)>.015;
  if(travelling)state.actorFacing=Math.sign(dx);
  else if(!sameScene)state.actorFacing=pose.direction||1;
  pose.direction=state.actorFacing||1;
  if(!state.hubLive)movement=pose.mode==='walk'&&travelling?pose.direction:0;
  pose.moving=movement!==0;
  if(pose.moving)state.walkPhase=(state.walkPhase||0)+dt*1.5;
  pose.walkPhase=state.walkPhase||0;
  pose.verticalSpeed=sameScene?-dy/Math.max(dt,.001):0;
  // Reverse portals preserve their exact geometry while using an emergence
  // pose when rising and a descent pose when returning into the opening.
  let transitionAction=transition.mode,transitionProgress=transition.progress;
  if(state.scrollDirection<0&&transition.mode==='drop'){
    transitionAction='emerge';transitionProgress=1-clamp((transition.progress-.25)/.75);
  }else if(state.scrollDirection<0&&transition.mode==='emerge'){
    transitionAction='drop';transitionProgress=.25+.75*(1-transition.progress);
  }
  if(scrollMotion||travelling||Math.abs(dy)>.015)state.lastMotionTime=state.time;
  state.actorSample={scene:state.scene,x:pose.x,feet:pose.feet};
  player.style.left=pose.x+'px';
  player.style.bottom=(state.h-pose.feet-232*pose.scale*.02)+'px';
  player.style.setProperty('--player-s',pose.scale);
  player.style.setProperty('--facing',pose.direction||1);
  player.style.opacity='1';
  player.classList.toggle('walking',movement!==0);
  avatar?.update(dt,{
    moving:movement!==0,
    direction:pose.direction,
    airborne:state.hubLive?state.y>0:pose.mode==='jump',
    verticalSpeed:state.hubLive?state.vy:pose.verticalSpeed,
    anticipating:state.jumpDelay>0||pose.mode==='anticipate',
    crouching:state.hubLive&&(state.keys.has('s')||state.keys.has('arrowdown')),
    entering:player.classList.contains('entering'),
    interaction:transitionAction || (state.hubLive?null:['pull','read','sing','game','sketch','design','edit','tap','present'].includes(pose.mode)?pose.mode:null),
    transitionProgress,
    trainActionSet:state.scene===1,
    choreographyTime:pose.moving?pose.walkPhase:state.hubLive?null:pose.phase,
    scrollMoving:scrollMotion
  });
  state.pose=pose;
  state.transition=transition;
  state.reelRope=pullRopeGeometry(avatar?.getHandAnchor());
  if(paintForeground)renderForeground(pose,transition,dt);
}
function navigate(key,immediate=false,local=.20) {
  const index=key==='start'?0:scenes.findIndex(s=>s.key===key);
  if(index<0)return;
  cancelEntry();closeMenu();
  const progress=index===0&&local===.20?0:(index+clamp(local,0,.99))/scenes.length;
  scrollPacer.cancel();
  const destination=state.top+state.travel*progress;
  if(immediate||reducedMotion.matches)lenis.scrollTo(destination,{immediate:true});
  else scrollPacer.go(destination);
}
menuToggle.addEventListener('click',()=>{
  const open=!hud.classList.contains('menu-open');
  hud.classList.toggle('menu-open',open);
  menuToggle.setAttribute('aria-expanded',String(open));
  menuToggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');
  chapterNavigation.inert=!open;
});
document.addEventListener('pointerdown',e=>{if(!hud.contains(e.target))closeMenu();});
document.querySelectorAll('.hud a').forEach(a=>a.addEventListener('click',e=>{
  e.preventDefault();history.replaceState(null,'',a.hash);navigate(a.hash.slice(1));
}));
function keyDown(key,repeat=false){
  if(!state.hubLive||state.exit)return;
  state.keys.add(key);
  if([' ','jump'].includes(key)&&state.y===0&&!state.jumpDelay&&!repeat)state.jumpDelay=.09;
  if(['s','arrowdown','enter'].includes(key)&&!repeat)enterPortal(nearestPortal());
}
window.addEventListener('keydown',e=>{
  const key=e.key.toLowerCase();
  if(key==='escape'){closeMenu(true);cancelEntry();return;}
  const target=e.target instanceof Element?e.target:null;
  if(target?.closest('input,textarea,select,[contenteditable="true"]'))return;
  if(target?.closest('button,a')&&[' ','enter'].includes(key))return;
  if(!state.hubLive)return;
  if(['arrowleft','arrowright','arrowup','arrowdown',' ','w','a','s','d'].includes(key))e.preventDefault();
  keyDown(key,e.repeat);
});
window.addEventListener('keyup',e=>state.keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>state.keys.clear());
window.addEventListener('resize',resize);
window.addEventListener('hashchange',()=>navigate(location.hash.slice(1)));
window.addEventListener('pageshow',e=>{if(e.persisted)cancelEntry();});
reducedMotion.addEventListener('change',()=>scrollPacer.cancel());
portals.forEach(p=>p.addEventListener('click',()=>enterPortal(p)));
document.querySelectorAll('[data-control]').forEach(button=>{
  button.addEventListener('pointerdown',e=>{e.preventDefault();button.setPointerCapture(e.pointerId);keyDown(button.dataset.control);});
  const release=()=>state.keys.delete(button.dataset.control);
  button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
});

// One clock: input, actor pose, rear scenery, then foreground interactions.
function frame(time) {
  const dt=Math.min((time-state.time)/1000||1/60,.05);
  state.frameMs=mix(state.frameMs,dt*1000,.05);state.time=time;
  if(window.landscapePrompt?.blocked){
    if(autoplayTour.active)autoplayTour.stop();
    state.pausedAt??=time;state.keys.clear();scrollPacer.cancel();
    requestAnimationFrame(frame);return;
  }
  if(state.pausedAt!==undefined){mascot.lastMotion+=time-state.pausedAt;delete state.pausedAt;}
  lenis.raf(time);
  const autoplayFrame=autoplayTour.active;
  if(autoplayFrame)autoplayTour.tick(dt);else scrollPacer.tick(time,dt);
  state.previousProgress=state.progress;
  // The browser rounds document scroll to pixels. Render guided playback from
  // its precise playhead so that rounding cannot jitter the train or avatar.
  state.progress=autoplayFrame?autoplayTour.progress:clamp((lenis.animatedScroll-state.top)/state.travel);
  const position=Math.min(state.progress*scenes.length,scenes.length-.00001);
  const index=Math.floor(position),p=position-index;
  state.local=p;
  state.directedLocal=reducedMotion.matches?.45:clamp((p-.15)/.70);
  updateCopy(index,p);
  updatePlayer(dt,false);
  draw(position,index,p);
  renderForeground(state.pose,state.transition,dt);
  requestAnimationFrame(frame);
}
Object.defineProperty(window,'scrollworld',{value:{
  get diagnostics(){return {version:'phase-1-revision',scroll:lenis.animatedScroll,target:lenis.targetScroll,progress:state.progress,local:state.local,scene:scenes[state.scene]?.key,mode:scenes[state.scene]?.mode,frameMs:state.frameMs,actor:player.dataset.avatarState,exit:state.exit?.phase,companion:state.companionSkill,hand:avatar?.getHandAnchor(),pose:state.pose};}
}});
resize();
initRevision();
initMascot();
window.lucide?.createIcons();
if(location.hash)navigate(location.hash.slice(1),true);
requestAnimationFrame(frame);
