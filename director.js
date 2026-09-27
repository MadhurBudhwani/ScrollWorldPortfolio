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
const reelAssetSpecs={
  'APP SERVICE':{src:'./assets/azure-reel/app-service.png',crop:[364,80,720,935]},
  'FUNCTIONS':{src:'./assets/azure-reel/functions.png',crop:[225,113,996,909]},
  'AZURE SQL':{src:'./assets/azure-reel/azure-sql.png',crop:[353,40,792,1030]},
  'BLOB STORAGE':{src:'./assets/azure-reel/blob-storage.png',crop:[302,92,848,950]},
  'SIGNALR':{src:'./assets/azure-reel/signalr.png',crop:[267,154,920,788]},
  'API MANAGEMENT':{src:'./assets/azure-reel/api-management.png',crop:[333,130,784,845]},
  'ENTRA ID':{src:'./assets/azure-reel/entra-id.png',crop:[389,117,722,857]},
  'MICROSOFT GRAPH':{src:'./assets/azure-reel/microsoft-graph.png',crop:[252,133,987,815]},
  'COGNITIVE SERVICES':{src:'./assets/azure-reel/cognitive-services.png',crop:[225,85,998,934]},
};
Object.values(reelAssetSpecs).forEach(spec=>{
  spec.image=new Image();
  spec.image.src=spec.src;
  spec.image.decode().catch(()=>{});
});
const securitySheet=new Image();
securitySheet.src='./assets/security/security-checkpoints.png';
securitySheet.decode().catch(()=>{});
const securityProgressionSheet=new Image();
securityProgressionSheet.src='./assets/security/security-progression.png';
securityProgressionSheet.decode().catch(()=>{});
const securityAssetCrops={
  request:[42,34,312,248],
  roleDormant:[403,20,358,254],
  roleApproved:[763,19,360,256],
  approved:[1193,75,194,191],
  tenantDormant:[18,296,371,262],
  tenantApproved:[398,296,374,262],
  denied:[877,304,199,251],
  scanner:[1237,302,126,254],
  accessDormant:[18,575,371,251],
  accessApproved:[400,575,376,252],
  encryption:[762,570,371,257],
  rail:[1137,738,311,88],
  auditDormant:[24,847,369,220],
  auditApproved:[394,847,368,220],
};
const securityProgressionCrops={
  requestRaw:[42,104,309,208],
  requestRole:[403,102,309,210],
  requestTenant:[766,102,309,210],
  requestAccess:[1127,102,308,210],
  requestEncrypted:[42,396,309,208],
  requestSecured:[403,396,337,207],
  requestExit:[740,421,361,177],
  completionPulse:[1158,385,250,238],
  securityCoreReady:[12,658,469,357],
  securityCoreDocked:[490,658,480,357],
  securityCoreProtected:[970,658,466,357],
};
const securityRequestStates=['requestRaw','requestRole','requestTenant','requestAccess','requestEncrypted','requestSecured'];
const securityGateSpecs={
  'ROLE PERMISSIONS':{dormant:'roleDormant',active:'roleApproved'},
  'MULTI-TENANT':{dormant:'tenantDormant',active:'tenantApproved'},
  'DATA ACCESS CONTROL':{dormant:'accessDormant',active:'accessApproved'},
  'AES ENCRYPTION':{dormant:'encryption',active:'encryption',cipher:true},
  'AUDIT TRAIL':{dormant:'auditDormant',active:'auditApproved',recorder:true},
};
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
    // The physical reel remains code-drawn; supplied artwork occupies a shared
    // dark aperture while labels stay crisp and independent below it.
    rect(52,22,280,166,'rgba(6,22,27,.72)');
    rect(60,30,264,2,'rgba(103,218,245,.38)');
    rect(60,184,264,2,'rgba(103,218,245,.20)');
    const unit=Math.min(5,320/(label.length*6-1));
    pixelText(c,label,(384-(label.length*6-1)*unit)/2,202,unit,'#f1fff6');
    tex.reelAsset=reelAssetSpecs[label]||null;
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
function reelObject(texture,x,y,scale=1,angle=0,alpha=1) {
  if(alpha<=0 || scale<=0 || x < -800*scale || x > state.w+800*scale)return;
  ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
  registerMascotTarget(texture.mascotLabel,0,0,352,216);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(texture,-192,-124);
  const asset=texture.reelAsset;
  if(asset?.image.complete&&asset.image.naturalWidth){
    const [sx,sy,sw,sh]=asset.crop,drawHeight=150,drawWidth=drawHeight*sw/sh;
    ctx.save();ctx.globalAlpha*=.94;
    ctx.drawImage(asset.image,sx,sy,sw,sh,-drawWidth/2,58-drawHeight,drawWidth,drawHeight);
    ctx.restore();
  }
  ctx.restore();
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
  s.textures.forEach((tex,i) => reelObject(tex,0,i*gap-offset,scale*.86));
  ctx.restore();
}
function searchActivation(index,p){return ease((p-(.06+index*.14))/.12);}
function searchSegment(a,b,amount,color,width){
  if(amount<=0)return;
  line([[a.x,a.y],[mix(a.x,b.x,amount),mix(a.y,b.y,amount)]],color,width);
}
function drawSearchLens(o,activation,focused,p,rush){
  const wake=ease(activation/.38),lock=ease((activation-.42)/.45),pulse=Math.sin(activation*Math.PI);
  const scale=o.scale*(focused?1-rush*.52:1),rx=104*scale,ry=66*scale;
  ctx.save();ctx.translate(Math.round(o.x),Math.round(o.y));ctx.rotate(o.angle);
  ctx.globalAlpha=o.alpha*(.60+.40*wake);
  ctx.fillStyle='#02080b';ctx.beginPath();ctx.ellipse(4*scale,6*scale,rx+7*scale,ry+7*scale,0,0,TAU);ctx.fill();
  ctx.fillStyle='#07161b';ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,TAU);ctx.fill();
  ctx.strokeStyle='#1c3c42';ctx.lineWidth=Math.max(2,8*scale);ctx.beginPath();ctx.ellipse(0,0,rx-4*scale,ry-4*scale,0,0,TAU);ctx.stroke();

  // Four hard-edged lens rails wake independently, keeping the treatment
  // mechanical rather than turning the nodes into soft neon bubbles.
  for(let q=0;q<4;q++){
    const start=q*TAU/4+.13,end=start+.78;
    ctx.strokeStyle=focused&&lock>.65?'#84f5ad':'#67daf5';
    ctx.globalAlpha=o.alpha*(.14+wake*.76);ctx.lineWidth=Math.max(2,3*scale);
    ctx.beginPath();ctx.ellipse(0,0,rx-13*scale,ry-13*scale,0,start,end);ctx.stroke();
    const a=start+.39,x=Math.cos(a)*(rx-3*scale),y=Math.sin(a)*(ry-3*scale);
    ctx.fillStyle=lock>.55?'#effff5':'#67daf5';ctx.fillRect(x-3*scale,y-3*scale,6*scale,6*scale);
  }

  if(wake>.02){
    const deckW=rx*1.22,scanX=mix(-deckW/2,deckW/2,ease((activation-.12)/.66));
    ctx.globalAlpha=o.alpha*wake*.72;ctx.fillStyle='#0d2930';ctx.fillRect(-deckW/2,-10*scale,deckW,20*scale);
    ctx.fillStyle=focused?'#84f5ad':'#67daf5';ctx.fillRect(scanX-2*scale,-15*scale,4*scale,30*scale);
    ctx.fillStyle='#dfffff';ctx.fillRect(scanX-1*scale,-5*scale,2*scale,10*scale);
  }

  if(focused&&lock>.02){
    for(let ring=0;ring<2;ring++){
      const turn=(ring?-1:1)*p*TAU*.72,radiusX=rx+(18+ring*13)*scale,radiusY=ry+(11+ring*8)*scale;
      ctx.globalAlpha=o.alpha*lock*(ring?.42:.72);ctx.strokeStyle=ring?'#67daf5':'#84f5ad';ctx.lineWidth=Math.max(2,(3-ring)*scale);
      for(let q=0;q<4;q++){ctx.beginPath();ctx.ellipse(0,0,radiusX,radiusY,0,turn+q*TAU/4,turn+q*TAU/4+.38);ctx.stroke();}
    }
  }

  if(pulse>.05){
    ctx.globalAlpha=o.alpha*pulse*.85;ctx.fillStyle=focused?'#effff5':'#67daf5';
    for(let i=0;i<6;i++){
      const a=i/6*TAU+.35,r=(rx+14*scale)*(1+pulse*.16);
      ctx.fillRect(Math.cos(a)*r-2*scale,Math.sin(a)*(ry+10*scale)-2*scale,4*scale,4*scale);
    }
  }
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
  line(path,'#10262c',9);line(path,'#315159',3);

  const objects=spiralObjects(s,p),flow=ease((p-.05)/.58);
  for(let i=0;i<objects.length-1;i++){
    const a=objects[i],b=objects[i+1],powered=ease((flow*3-i)/.82);
    line([[a.x,a.y],[b.x,b.y]],'#152d32',6);
    searchSegment(a,b,powered,i===objects.length-2?'#84f5ad':'#67daf5',2);
    if(powered>0&&powered<1){
      const x=mix(a.x,b.x,powered),y=mix(a.y,b.y,powered);
      ctx.fillStyle='#effff5';ctx.fillRect(x-5,y-5,10,10);
      ctx.fillStyle=i===objects.length-2?'#84f5ad':'#67daf5';ctx.fillRect(x-2,y-2,4,4);
    }
  }

  // As the individual methods finish, their evidence converges on VECTOR.
  const converge=ease((p-.62)/.14),vector=objects.at(-1);
  if(converge>.01)objects.slice(0,-1).forEach((o,i)=>{
    ctx.globalAlpha=(1-rush)*converge*(.30+i*.08);
    searchSegment(o,vector,converge,'#84f5ad',2);
    const packet=ease((converge-i*.10)/.65),x=mix(o.x,vector.x,packet),y=mix(o.y,vector.y,packet);
    ctx.fillStyle='#dffff0';ctx.fillRect(x-3,y-3,6,6);
  });
  ctx.globalAlpha=1;

  // A shared helix followed by a deliberate camera push through VECTOR.
  objects.sort((a,b)=>a.depth-b.depth).forEach(o=>{
    const activation=searchActivation(o.i,p),focused=o.i===objects.length-1;
    drawSearchLens(o,activation,focused,p,rush);
    const activationPulse=Math.sin(activation*Math.PI);
    imageObject(o.tex,o.x,o.y,o.scale*(1+activationPulse*.035),o.angle,o.alpha);
  });
  ctx.restore();
}
function drawSecurityCrop(key,x,y,width,height,alpha=1){
  const crop=securityAssetCrops[key];
  if(!crop||alpha<=0||!securitySheet.complete||!securitySheet.naturalWidth)return;
  ctx.save();ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;
  ctx.drawImage(securitySheet,...crop,x-width/2,y-height/2,width,height);
  ctx.restore();
}
function drawSecurityProgressionCrop(key,x,y,height,alpha=1){
  const crop=securityProgressionCrops[key];
  if(!crop||alpha<=0||!securityProgressionSheet.complete||!securityProgressionSheet.naturalWidth)return;
  const width=height*crop[2]/crop[3];
  ctx.save();ctx.globalAlpha*=alpha;ctx.imageSmoothingEnabled=false;
  ctx.drawImage(securityProgressionSheet,...crop,x-width/2,y-height/2,width,height);
  ctx.restore();
}
function securityFit(key,maxWidth,maxHeight){
  const [, ,sw,sh]=securityAssetCrops[key],scale=Math.min(maxWidth/sw,maxHeight/sh);
  return {width:sw*scale,height:sh*scale};
}
function drawSecurityRail(y){
  const crop=securityAssetCrops.rail,tileH=state.w<700?38:52,tileW=tileH*crop[2]/crop[3];
  ctx.save();ctx.globalAlpha=.78;ctx.imageSmoothingEnabled=false;
  for(let x=-tileW/2;x<state.w+tileW;x+=tileW-5)ctx.drawImage(securitySheet,...crop,x,y-tileH/2,tileW,tileH);
  ctx.restore();
}
function drawSecurityLabel(label,index,total,x,y,alpha,approved){
  if(alpha<=0)return;
  const maxWidth=Math.min(state.w<700?270:430,state.w*.42);
  const unit=Math.max(2,Math.min(state.w<700?3:4,Math.floor(maxWidth/(label.length*6-1))));
  const width=(label.length*6-1)*unit;
  ctx.save();ctx.globalAlpha*=alpha;
  pixelText(ctx,label,Math.round(x-width/2+4),Math.round(y+4),unit,'#071411');
  pixelText(ctx,label,Math.round(x-width/2),Math.round(y),unit,approved?'#effff5':'#b7d4d2');
  const dotsWidth=total*14-6,dotsX=Math.round(x-dotsWidth/2),dotsY=Math.round(y+unit*9+15);
  for(let i=0;i<total;i++){
    ctx.fillStyle=i<index?'#456f61':i===index?(approved?'#84f5ad':'#67daf5'):'#1b3433';
    ctx.fillRect(dotsX+i*14,dotsY,8,4);
  }
  ctx.restore();
}
function drawCipherActivity(x,y,r,amount,alpha){
  if(amount<=0||alpha<=0)return;
  ctx.save();ctx.globalAlpha*=alpha;ctx.lineWidth=4;ctx.lineCap='butt';
  for(let ring=0;ring<2;ring++){
    const radius=r-ring*13,direction=ring?-1:1,turn=amount*TAU*direction;
    for(let i=0;i<4;i++){
      ctx.strokeStyle=ring?'#84f5ad':'#67daf5';ctx.beginPath();
      ctx.arc(x,y,radius,turn+i*TAU/4,turn+i*TAU/4+.34);ctx.stroke();
    }
  }
  ctx.restore();
}
function securityCapsuleTurnX(mobile){
  const actorX=state.pose?.x??state.w*.14;
  return clamp(Math.max(state.w*(mobile?.31:.27),actorX+(mobile?112:190)),90,state.w*.42);
}
function drawSecurityFinale(p,railY,mobile){
  const focusX=state.w*(mobile?.59:.66),coreCrop=securityProgressionCrops.securityCoreReady;
  const coreHeight=Math.min(state.h*(mobile?.31:.38),mobile?275:350),coreWidth=coreHeight*coreCrop[2]/coreCrop[3];
  const baseline=railY+4,coreY=baseline-coreHeight/2;
  const enter=ease(p/.16),coreX=mix(state.w+coreWidth*.55,focusX,enter);
  const dock=ease((p-.28)/.18),seal=ease((p-.50)/.17),release=ease((p-.76)/.20);
  const capsuleHeight=mobile?66:88,startX=securityCapsuleTurnX(mobile),startY=baseline-(mobile?100:126);
  const dockX=coreX,exitX=mix(coreX,Math.min(state.w+200,coreX+coreWidth*.82),release);
  const capsuleX=release>0?exitX:mix(startX,dockX,dock),capsuleY=release>0?coreY:mix(startY,coreY,dock);

  if(release<=0)drawSecurityProgressionCrop('requestSecured',capsuleX,capsuleY,capsuleHeight,1);
  drawSecurityProgressionCrop('securityCoreReady',coreX,coreY,coreHeight,(1-dock)*enter);
  drawSecurityProgressionCrop('securityCoreDocked',coreX,coreY,coreHeight,dock*(1-seal));
  drawSecurityProgressionCrop('securityCoreProtected',coreX,coreY,coreHeight,seal);

  const pulseAmount=ease((p-.62)/.12),pulseFade=1-ease((p-.78)/.12);
  if(pulseAmount>0&&pulseFade>0){
    const pulseHeight=coreHeight*(.42+.56*pulseAmount);
    drawSecurityProgressionCrop('completionPulse',coreX,coreY,pulseHeight,pulseFade*.9);
  }
  if(release>0)drawSecurityProgressionCrop('requestExit',capsuleX,capsuleY,capsuleHeight,release);
  drawSecurityLabel('DATA SECURED',4,5,coreX,baseline-coreHeight-48,enter,seal>.72);
}
function gates(s,p) {
  if(!securitySheet.complete||!securitySheet.naturalWidth||!securityProgressionSheet.complete||!securityProgressionSheet.naturalWidth)return;
  const mobile=state.w<700,stages=s.skills.map(label=>({label,...securityGateSpecs[label]})).filter(stage=>stage.dormant);
  const count=stages.length,railY=state.h-82,gateEnd=.82;
  drawSecurityRail(railY);
  if(p>=gateEnd){drawSecurityFinale(clamp((p-gateEnd)/(1-gateEnd)),railY,mobile);return;}
  const travel=clamp(p/gateEnd)*count,index=Math.min(count-1,Math.floor(travel));
  const local=travel-index,stage=stages[index],focusX=state.w*(mobile?.59:.66);
  const maxWidth=Math.min(state.w*(mobile?.58:.34),mobile?330:445),maxHeight=Math.min(state.h*(mobile?.27:.31),292);
  const fitted=securityFit(stage.dormant,maxWidth,maxHeight),baseline=railY+4;
  const enter=ease(local/.18),leave=ease((local-.74)/.20);
  const turnX=securityCapsuleTurnX(mobile),pairedGap=fitted.width*.56,gateExitX=turnX-pairedGap;
  const machineX=mix(mix(state.w+fitted.width*.55,focusX,enter),gateExitX,leave);
  const alpha=(.22+.78*ease(local/.12))*(1-ease((local-.96)/.04));
  const approved=ease((local-.48)/.12),scan=ease((local-.31)/.10)*(1-ease((local-.61)/.12));
  const requestStart=index===0?.20:.02,requestApproach=ease((local-requestStart)/.26),requestPass=ease((local-(index===0?.38:.30))/.28);
  const approachingX=mix(turnX,focusX-fitted.width*.16,requestApproach);
  const processedX=mix(approachingX,focusX+pairedGap,requestPass);
  const requestX=mix(processedX,machineX+pairedGap,leave);
  const requestY=baseline-(mobile?100:126);
  const requestHeight=mobile?68:90;
  const requestAlpha=index===0?ease((local-.20)/.08):1;

  // The packet sits behind the checkpoint shell, so opaque machine parts mask
  // it naturally while the transparent opening remains readable.
  const requestUpgrade=ease((local-.52)/.14);
  drawSecurityProgressionCrop(securityRequestStates[index],requestX,requestY,requestHeight,requestAlpha*(1-requestUpgrade));
  drawSecurityProgressionCrop(securityRequestStates[index+1],requestX,requestY,requestHeight,requestAlpha*requestUpgrade);
  drawSecurityCrop(stage.dormant,machineX,baseline-fitted.height/2,fitted.width,fitted.height,alpha*(1-approved));
  drawSecurityCrop(stage.active,machineX,baseline-fitted.height/2,fitted.width,fitted.height,alpha*approved);

  if(scan>.01){
    const beamH=fitted.height*.72,beamW=beamH*securityAssetCrops.scanner[2]/securityAssetCrops.scanner[3]*.38;
    const sweep=mix(machineX-fitted.width*.20,machineX+fitted.width*.20,ease((local-.27)/.31));
    drawSecurityCrop('scanner',sweep,requestY,beamW,beamH,scan*.78);
  }
  if(stage.cipher)drawCipherActivity(machineX,baseline-fitted.height*.49,Math.min(fitted.width,fitted.height)*.25,approved,alpha*.88);

  const tokenIn=ease((local-.55)/.09),tokenOut=ease((local-.78)/.10),tokenAlpha=tokenIn*(1-tokenOut);
  if(tokenAlpha>.01){
    const tokenH=(mobile?44:58)*(1+.08*Math.sin(tokenIn*Math.PI)),crop=securityAssetCrops.approved;
    drawSecurityCrop('approved',machineX+fitted.width*.34,baseline-fitted.height*.78,tokenH*crop[2]/crop[3],tokenH,tokenAlpha);
  }
  drawSecurityLabel(stage.label,index,count,machineX,baseline-fitted.height-54,alpha,approved>.72);

  ctx.save();ctx.translate(machineX,baseline);ctx.scale(fitted.width/securityAssetCrops[stage.dormant][2],fitted.height/securityAssetCrops[stage.dormant][3]);
  registerMascotTarget(stage.label,0,-securityAssetCrops[stage.dormant][3]/2,securityAssetCrops[stage.dormant][2],securityAssetCrops[stage.dormant][3]);ctx.restore();
}
function slideOneActivation(index,progress){
  const timing=scenes[0].timeline;
  return ease((progress-(timing.nodeStart+index*timing.nodeStep))/timing.nodeDuration);
}
function orbitArc(cx,cy,r,start,end,color,width,alpha=1){
  if(end<=start)return;
  ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='butt';
  ctx.beginPath();ctx.ellipse(cx,cy,r,r*.48,0,start,end);ctx.stroke();ctx.restore();
}
function drawOrbitNodeFrame(o,activation,focused){
  const wake=ease(activation/.28),ring=ease((activation-.16)/.42),core=ease((activation-.46)/.40);
  const power=Math.max(activation,focused?1:0),pulse=Math.sin(activation*Math.PI);
  const rx=Math.round(91*o.scale),ry=Math.round(61*o.scale);
  ctx.save();ctx.translate(Math.round(o.x),Math.round(o.y));
  // Recessed extrusion and solid housing establish physical depth even while
  // dormant; activation powers distinct mechanical layers instead of adding a
  // single soft glow over the same circle.
  ctx.globalAlpha=.90;ctx.fillStyle='#020806';ctx.beginPath();ctx.ellipse(5,6,rx+5,ry+5,0,0,TAU);ctx.fill();
  ctx.globalAlpha=.98;ctx.fillStyle='#071410';ctx.beginPath();ctx.ellipse(0,0,rx,ry,0,0,TAU);ctx.fill();
  ctx.strokeStyle='#17342e';ctx.lineWidth=10;ctx.beginPath();ctx.ellipse(0,0,rx-3,ry-3,0,0,TAU);ctx.stroke();

  // Four separated armor rails progressively energize around the terminal.
  for(let q=0;q<4;q++){
    const start=q*TAU/4+.17,end=start+1.18;
    ctx.globalAlpha=.82;ctx.strokeStyle='#294b43';ctx.lineWidth=5;
    ctx.beginPath();ctx.ellipse(0,0,rx-3,ry-3,0,start,end);ctx.stroke();
    if(ring>.01){
      ctx.globalAlpha=.22+ring*.68;ctx.strokeStyle=focused?'#d9ffeb':'#75e99e';ctx.lineWidth=2;
      ctx.beginPath();ctx.ellipse(0,0,rx-3,ry-3,0,start,end);ctx.stroke();
    }
  }

  ctx.globalAlpha=.96;ctx.fillStyle='#06100e';ctx.beginPath();ctx.ellipse(0,0,rx-13,ry-13,0,0,TAU);ctx.fill();
  ctx.globalAlpha=.34+wake*.34;ctx.strokeStyle=focused?'#bfffd8':'#46766a';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(0,0,rx-13,ry-13,0,0,TAU);ctx.stroke();

  // Crisp internal scan deck; no blur, just stepped light levels.
  ctx.save();ctx.beginPath();ctx.ellipse(0,0,rx-17,ry-17,0,0,TAU);ctx.clip();
  for(let y=-ry+20;y<ry-18;y+=9){
    ctx.globalAlpha=.035+core*.055;ctx.fillStyle='#84f5ad';ctx.fillRect(-rx+18,y,rx*2-36,2);
  }
  ctx.globalAlpha=.08+core*.18;ctx.fillStyle='#84f5ad';ctx.fillRect(-rx+18,-5,rx*2-36,10);
  ctx.restore();

  const clamps=[[-rx-7,-7,14,14],[rx-7,-7,14,14],[-7,-ry-7,14,14],[-7,ry-7,14,14]];
  clamps.forEach(([x,y,w,h],i)=>{
    ctx.globalAlpha=.95;ctx.fillStyle='#020806';ctx.fillRect(x+3,y+3,w,h);
    ctx.fillStyle='#31564c';ctx.fillRect(x,y,w,h);
    ctx.globalAlpha=.22+power*.78;ctx.fillStyle=focused?'#ecfff4':'#91f8b3';
    ctx.fillRect(x+4,y+4,w-8,h-8);
    if(i>1&&core>.25){ctx.globalAlpha=core;ctx.fillStyle='#d9ffe7';ctx.fillRect(x+6,y+2,2,h-4);}
  });

  ctx.globalAlpha=.28+core*.72;ctx.fillStyle='#17362f';ctx.fillRect(-26,ry-16,52,5);
  ctx.fillStyle=focused?'#e6fff0':'#84f5ad';
  for(let i=0;i<3;i++)ctx.fillRect(-21+i*18,ry-15,8,3);
  if(pulse>.02&&!reducedMotion.matches){
    ctx.globalAlpha=pulse*.78;ctx.fillStyle='#d9ffe7';
    for(const [x,y]of[[-rx*.72,-ry*.78],[rx*.76,-ry*.66],[-rx*.82,ry*.58],[rx*.70,ry*.74]]){
      ctx.fillRect(Math.round(x)-3,Math.round(y)-1,6,2);ctx.fillRect(Math.round(x)-1,Math.round(y)-3,2,6);
    }
  }
  ctx.restore();
  return pulse;
}
function orbit(s,p) {
  const mobile=state.w<1000, cx=state.w*(mobile?.5:.70), cy=state.h*(mobile?.73:.66), r=mobile?125:245;
  const raw=state.local,step=TAU/s.skills.length;
  const objects=s.textures.map((tex,i)=>{
    const a=i/s.skills.length*TAU+p*TAU*.55;
    return {tex,i,a,x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r*.48,depth:Math.sin(a),scale:(mobile?.45:.66)+Math.sin(a)*.1,activation:slideOneActivation(i,raw)};
  });

  // Dark mechanical rail first, then permanently power each incoming section
  // as its node wakes. This makes completed progress remain visible.
  orbitArc(cx,cy,r,0,TAU,'#06100e',13,.92);
  orbitArc(cx,cy,r,0,TAU,'#1d3b34',6,.88);
  orbitArc(cx,cy,r,0,TAU,'#416c62',2,.55);
  objects.forEach(o=>{
    if(o.activation<=.001)return;
    const start=o.a-step,end=start+step*o.activation;
    orbitArc(cx,cy,r,start,end,'#173f30',7,.40+o.activation*.28);
    orbitArc(cx,cy,r,start,end,'#84f5ad',2,.30+o.activation*.60);
  });

  // A hard-edged packet now follows the actual orbital curve instead of
  // cutting a straight chord between neighbouring terminals.
  objects.forEach((o,i)=>{
    const pulse=Math.sin(o.activation*Math.PI);
    if(pulse<=.02||reducedMotion.matches)return;
    const a=o.a-step+step*ease(o.activation),x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.48;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.rotate(a+Math.PI/2);
    ctx.globalAlpha=pulse*.42;ctx.fillStyle='#173f30';ctx.fillRect(-9,-6,18,12);
    ctx.globalAlpha=pulse*.95;ctx.fillStyle='#84f5ad';ctx.fillRect(-6,-4,12,8);
    ctx.fillStyle='#ecfff3';ctx.fillRect(-2,-2,4,4);ctx.restore();
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
  // Let the temporary chapter-arrival hatch finish and disappear before the
  // four permanent hub portals power up. Their nearby rims otherwise occupy
  // the same pixels during the first part of the hub entrance.
  const opacity=ease((state.local-.15)/.10),phase=reducedMotion.matches?0:(state.time/2600)%1;
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
  // Security starts only after the chapter-entrance emergence and a short
  // settle, then uses the remaining slide for five checks plus the finale.
  const shotProgress=scene.mode==='gates'?clamp((state.local-.20)/.75):shotTime(state.directedLocal);
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
  if(state.hubLive&&!wasLive) {state.x=hubArrivalX();state.y=0;state.vy=0;state.keys.clear();}
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
  // Avatar frames deliberately overflow their DOM wrapper. During a chapter
  // transition that overflow used to remain visible below the hatch, making
  // the avatar look pasted in front while the canvas-drawn dog was correctly
  // clipped inside it. Pin the avatar's lower clip edge to the same portal Y.
  const portalMask=!!transition.mode&&transition.portalProfile==='genai-exit';
  const portalClip=portalMask
    ?Math.max(0,pose.feet-(transition.portalY??pose.feet))/Math.max(.01,pose.scale)
    :0;
  player.classList.toggle('portal-masked',portalMask);
  player.style.setProperty('--portal-clip-bottom',portalClip+'px');
  // The rails are painted on the foreground canvas, which sits above him. On the
  // way out of the delivery chapter he has to pass in front of one to jump, so
  // he is lifted over that canvas — early, while he is still clear of it.
  player.classList.toggle('over-rails',scenes[state.scene]?.key==='delivery'&&state.local>.80);
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
    // Search Intelligence reuses the registered train jump poses so the
    // long leap keeps the same body scale and scroll-locked silhouette.
    trainActionSet:state.scene===1||state.scene===4,
    trainJumpProgress:pose.jumpProgress??null,
    autoAlternate:state.scene===7,
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
