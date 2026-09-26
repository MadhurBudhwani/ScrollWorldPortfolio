// Every shot shares its geometry with the avatar's contact points.
const shotTime = p => clamp((p - .10) / .80);
const actorViewportScale = () => Math.min(1,state.h/650);
// Backend-scene-only proportion correction. The companion reads this same pose
// scale, keeping the dog proportional here without changing either actor in any
// other chapter.
const BACKEND_ACTOR_SCALE = .75;
const BACKEND_PORTAL_RAIL_LIFT = 18;
const BACKEND_TRAIN_ENTRY_RIGHT_SHIFT = .26;
const DELIVERY_ACTOR_DECK_SETTLE = 10;
// Integrate a short smooth acceleration ramp at each end, keeping the same
// travel window and a steady cruise through the middle of the train.
function trainTravel(value) {
  const t=clamp(value),edge=.07;
  const ramp=u=>u*u*u-.5*u*u*u*u;
  if(t<edge)return edge*ramp(t/edge)/(1-edge);
  if(t>1-edge)return 1-edge*ramp((1-t)/edge)/(1-edge);
  return (t-edge/2)/(1-edge);
}
function trainGeometry(p) {
  const scale = state.w < 700 ? Math.min(.64,state.h/1000) : Math.min(1.05, state.w / 1400, state.h / 1000);
  const gap = (window.TrainArt ? TrainArt.GAP : 400) * scale;
  const travel = trainTravel((p - .21) / .64) * (scenes[1].skills.length - 1);
  const start=state.w<700?state.w*.25+gap-18:state.w*.52+gap*.15;
  const entryShift=state.w<700?0:state.w*BACKEND_TRAIN_ENTRY_RIGHT_SHIFT;
  const mobileExitShift=state.w<700?(start-state.w*.52)*ease(travel/(scenes[1].skills.length-1)):0;
  // `roll` is the ground distance covered, so the wheels can turn off the
  // train's own travel instead of a clock that drifts when the scroll stalls.
  return {scale, gap, roll:travel*gap+mobileExitShift,
    x:start+entryShift-travel*gap-mobileExitShift, y:state.h*.84};
}
// Slide 1's ground and the backend entrance share the train rail baseline, so
// the same opening continues across the chapter cut instead of jumping height.
function backendTrackY() {
  const g=trainGeometry(0),rail=window.TrainArt?.RAIL??138;
  return g.y+rail*g.scale;
}
function backendPortalY() { return backendTrackY()-BACKEND_PORTAL_RAIL_LIFT; }
function spiralObjects(s,p) {
  const mobile=state.w<1000, cx=state.w*(mobile?.52:.61), cy=state.h*(mobile?.79:.76);
  const radius=mobile?state.w*.28:Math.min(state.w*.28,360), turn=p*TAU*1.1, rush=ease((p-.78)/.22);
  return s.textures.map((tex,i)=>{
    const t=i/Math.max(1,s.skills.length-1), a=t*TAU*.86-turn, depth=(Math.sin(a)+1)/2;
    const r=radius*(.62+.38*t), focus=i===s.skills.length-1;
    const x=mix(cx+Math.cos(a)*r,cx,focus?rush:0), y=mix(cy+Math.sin(a)*r*.40,cy,focus?rush:0);
    const scale=((mobile?.44:.65)+depth*(mobile?.20:.32))*(1+(focus?rush*5:rush*2));
    return {tex,i,x,y,scale,depth:focus&&rush>.1?10:depth,alpha:focus?1:1-rush,angle:(1-rush)*Math.cos(a)*.08};
  });
}
function engine(g,p) {
  // The locomotive art is longer than a carriage, so it stands its own
  // half-width clear of the first wagon rather than a flat `-gap`.
  const ex=g.x-(window.TrainArt?TrainArt.engineOffset()*g.scale:g.gap);
  if(window.TrainArt&&TrainArt.ready&&TrainArt.draw('engine',ex,g,'BACKEND')){
    const stack=TrainArt.point('engine',.185,.03);
    ctx.save();ctx.translate(ex,g.y);ctx.scale(g.scale,g.scale);
    for(let i=0;i<4;i++){
      const t=(p*2.4+i/4)%1,size=12+t*30;
      ctx.globalAlpha=(1-t)*.30;ctx.fillStyle='#cfe6ea';
      ctx.fillRect(stack.x-size/2+t*30,stack.y-t*120-size,size,size);
    }
    ctx.globalAlpha=1;ctx.restore();
    return;
  }
  ctx.save();ctx.translate(ex,g.y);ctx.scale(g.scale,g.scale);
  registerMascotTarget('BACKEND',0,0,360,240);
  const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  rect(-180,-92,330,188,'#173b40');rect(-158,-80,286,152,'#67daf5');
  rect(36,-124,108,86,'#84f5ad');rect(56,-109,60,50,'#17343b');
  rect(-142,-132,32,54,'#f3cc70');rect(-152,-142,52,12,'#f1f8f5');
  rect(-182,28,30,42,'#f3cc70');rect(-190,76,348,16,'#37676a');
  for(let i=0;i<3;i++){
    const x=-116+i*112;
    rect(x-30,78,60,60,'#102527');rect(x-18,90,36,36,'#b6d7cf');
    ctx.save();ctx.translate(x,108);ctx.rotate(-p*40);rect(-22,-4,44,8,'#327783');ctx.restore();
  }
  pixelText(ctx,'BACKEND',-100,-30,4,'#10323b');
  for(let i=0;i<3;i++){
    const t=(p*3+i/3)%1;ctx.globalAlpha=(1-t)*.3;
    rect(-132+t*85,-155-t*110,18+t*22,18+t*22,'#bdd8d5');
  }
  ctx.restore();
}
const planetTextures = new Map();
function planetTexture(kind) {
  if(planetTextures.has(kind))return planetTextures.get(kind);
  const c=document.createElement('canvas');c.width=128;c.height=128;
  const g=c.getContext('2d');
  const palettes={jupiter:['#b9a086','#897969','#d8bca0','#695b55'],mars:['#aa6554','#7b433b','#c68666','#623c39'],sun:['#f4c679','#e8a859','#f8dba1','#ca8b48'],moon:['#b4c3cc','#80939e','#d2dbe0','#657783'],earth:['#507f96','#39736f','#79a098','#35515f']};
  const pal=palettes[kind]||palettes.moon;
  for(let y=0;y<128;y+=3)for(let x=0;x<128;x+=3){
    const dx=(x-64)/60,dy=(y-64)/60;
    if(dx*dx+dy*dy>1)continue;
    let tone=kind==='jupiter'?Math.floor((y+Math.sin(x*.07)*5)/11)%4:Math.floor((Math.sin(x*.09)*Math.cos(y*.08)+1)*1.7);
    g.fillStyle=pal[tone];g.fillRect(x,y,3,3);
    g.fillStyle=`rgba(3,9,15,${Math.max(0,dx*.6+.15)})`;g.fillRect(x,y,3,3);
  }
  if(kind==='moon')for(const [x,y,r]of[[38,37,10],[75,85,13],[86,39,6],[38,83,6]]){g.fillStyle='#657783';g.fillRect(x,y,r,r);g.fillStyle='#96a7b2';g.fillRect(x+3,y+3,r-4,r-4);}
  planetTextures.set(kind,c);return c;
}
function celestialLayer(position) {
  ctx.save();
  for(let i=0;i<17;i++){
    const x=(.06+((i*43)%89)/100)*state.w, y=(.09+((i*29)%68)/100)*state.h;
    const a=.24+.48*Math.pow(.5+.5*Math.sin(position*9+i*2.4),8);
    ctx.globalAlpha=a;ctx.fillStyle=i%3?'#c5dfed':'#f1ddb3';
    const size=i%4===0?3:2;
    ctx.fillRect(x-size,y-size,size*2,size*2);
    if(i%4===0){ctx.fillRect(x-7,y-1,14,2);ctx.fillRect(x-1,y-7,2,14);}
  }
  const itinerary=[['earth',.84,.27,180],['sun',.84,.20,155],['jupiter',.88,.25,235],['mars',.83,.30,160],['jupiter',.13,.49,155],['earth',.86,.20,175],['mars',.85,.25,155],['sun',.83,.22,145],['moon',.79,.27,190]];
  itinerary.forEach(([kind,x,y,size],i)=>{
    const opacity=.25*clamp(1-Math.abs(position-(i+.45))/.85);
    if(opacity<=0)return;
    const d=size*(state.w<700?.65:1);
    ctx.globalAlpha=opacity;
    ctx.drawImage(planetTexture(kind),state.w*x-d/2+(position-i-.5)*24,state.h*y-d/2,d,d);
  });
  ctx.restore();
}
function circuitPoint(t) {
  const nodes=[[.25,.79],[.44,.64],[.65,.79],[.86,.64]];
  const scaled=clamp(t)*3,i=Math.min(2,Math.floor(scaled)),f=scaled-i;
  return {x:mix(nodes[i][0],nodes[i+1][0],f)*state.w,y:mix(nodes[i][1],nodes[i+1][1],f)*state.h};
}
function circuit(s,p) {
  const mobile=state.w<700, radius=mobile?25:43;
  const nodes=[0,1/3,2/3,1].map(circuitPoint);
  ctx.save();
  nodes.forEach((node,i)=>{
    if(i){const a=nodes[i-1];line([[a.x,a.y],[node.x,a.y],[node.x,node.y]],'#305856',5);}
    const reveal=ease((p-i*.12)/.12);ctx.globalAlpha=reveal;
    for(let d=0;d<3;d++){ctx.fillStyle=d===2?colors[i%4]:'#173b3b';ctx.fillRect(node.x-radius+d*5,node.y-radius-d*5,radius*2,radius*2);}
    ctx.fillStyle='#102c32';ctx.fillRect(node.x-radius*.5,node.y-radius*.5,radius,radius);
    for(let pin=0;pin<4;pin++){ctx.fillStyle=colors[i%4];ctx.fillRect(node.x-radius-8,node.y-radius+pin*radius*.55,8,4);}
    const label=['RAG','MODEL','CHECK','RESULT'][i];const u=mobile?1.5:3;
    pixelText(ctx,label,node.x-(label.length*6-1)*u/2,node.y+radius+16,u,'#d5eee5');
  });
  ctx.globalAlpha=ease((p-.35)/.12)*.7;
  const a=nodes[2],b=nodes[1];
  const loop=[[a.x,a.y],[a.x,state.h*.90],[b.x,state.h*.90],[b.x,b.y]];
  line(loop,'#f58caf',3);
  const flow=clamp((p-.15)/.75);
  let packet;
  if(flow>.42&&flow<.70){const t=(flow-.42)/.28;packet={x:mix(a.x,b.x,t),y:state.h*.90-Math.sin(t*Math.PI)*16};}
  else packet=circuitPoint(flow<=.42?flow/.42*.66:.33+(flow-.7)/.3*.67);
  ctx.globalAlpha=1;ctx.fillStyle='#f3cc70';ctx.fillRect(packet.x-8,packet.y-8,16,16);
  ctx.strokeStyle='#f3cc70';ctx.lineWidth=2;ctx.strokeRect(packet.x-14,packet.y-14,28,28);
  ctx.restore();
}

// The delivery chapter keeps its original scroll path and camera turn, but the
// temporary block staircase is replaced by the generated release gantry.  Each
// crop is anchored by its walkable deck, so bridgePoint remains the single
// source of truth for both the art and the actors' feet.
const deliveryPlatformSheet=new Image();
deliveryPlatformSheet.src='./assets/delivery/release-platforms.png';
deliveryPlatformSheet.decode().catch(()=>{});
const DELIVERY_ACTIVE_ROW=295;
const deliveryPlatforms=[
  {label:'DEV',        crop:[18,145,272,145],deck:37},
  {label:'REVIEW',     crop:[351,108,280,182],deck:40},
  {label:'QA',         crop:[686,75,245,215],deck:43},
  {label:'UAT',        crop:[1017,46,240,244],deck:43},
  {label:'PRODUCTION', crop:[1341,10,423,280],deck:46},
];
// Each destination finishes building before its corresponding walk begins.
// The gaps between walk windows are intentional holds on the current stage.
const deliveryStageWindows=[
  {reveal:[0,0],     walk:[0,0]},
  {reveal:[.04,.12], walk:[.12,.24]},
  {reveal:[.24,.32], walk:[.32,.44]},
  {reveal:[.44,.52], walk:[.52,.64]},
  {reveal:[.64,.72], walk:[.72,.86]},
];
function deliveryActorState(p){
  for(let i=1;i<deliveryStageWindows.length;i++){
    const [start,end]=deliveryStageWindows[i].walk,from=(i-1)/(deliveryStageWindows.length-1),to=i/(deliveryStageWindows.length-1);
    if(p<start)return {travel:from,moving:false};
    if(p<end)return {travel:mix(from,to,ease((p-start)/(end-start))),moving:true};
  }
  return {travel:1,moving:false};
}

function bridgePoint(t,p) {
  const turn=ease((p-.70)/.30);
  // The generated PRODUCTION module is substantially deeper than the former
  // blocks. Lift the entire shared delivery geometry so its lower frame stays
  // inside the viewport even before the perspective turn begins.
  const stageLift=Math.min(64,state.h*.065);
  // Once the gantry turns into its final perspective, add a smaller second
  // lift to keep the DEV platform's lower supports inside the viewport too.
  const bottomLift=turn*Math.min(42,state.h*.045);
  return {x:mix(state.w*(.12+t*.76),state.w*(.33+t*.36),turn),y:mix(state.h*.81,state.h*(.91-t*.30),turn)-stageLift-bottomLift,scale:mix(1,1.12-t*.45,turn)};
}
function fallbackCrossing(s,p) {
  const count=20, built=clamp(p/.70)*count;
  for(let i=0;i<count;i++){
    const at=bridgePoint(i/(count-1),p), reveal=ease(built-i);
    if(!reveal)continue;
    const w=state.w*.76/(count-1)*at.scale+3,h=20*at.scale;
    const rise=(1-reveal)*state.h*.27;
    ctx.fillStyle=i%5===0?'#f3cc70':'#457b78';ctx.fillRect(at.x-w/2,at.y+rise,w,h);
    ctx.fillStyle='#b7dac8';ctx.fillRect(at.x-w/2,at.y+rise,w,4);
    ctx.fillStyle='#1d4043';ctx.fillRect(at.x-w/2,at.y+h+rise,w,h*.65);
    if(i%5===0||i===count-1){
      const label=['DEV','REVIEW','QA','UAT','PROD'][i===19?4:i/5],u=state.w<700?1.5:2.5;
      ctx.fillStyle='#f3cc70';ctx.fillRect(at.x-2,at.y+20,4,30);
      pixelText(ctx,label,at.x-(label.length*6-1)*u/2,at.y+59,u,'#e9e3c3');
      registerMascotTarget(label==='PROD'?'PRODUCTION':label,at.x,at.y+36,Math.max(65,w),95);
    }
  }
  if(p>.1&&p<.8)for(let j=0;j<6;j++){
    const t=(p*4+j/6)%1,at=bridgePoint(clamp((built-1)/count),p);
    ctx.globalAlpha=1-t;ctx.fillStyle=colors[j%3];ctx.fillRect(at.x+(j-3)*18*(1-t),at.y+110*(1-t),8,8);
  }
  ctx.globalAlpha=1;
}
function deliveryConnector(a,b,aWidth,bWidth,aScale,bScale,alpha,active){
  const x1=a.x+aWidth/2-5*aScale,x2=b.x-bWidth/2+5*bScale;
  if(alpha<=0||x2<=x1+3)return;
  const y1=a.y+18*aScale,y2=b.y+18*bScale;
  const thickness=Math.max(8,14*Math.min(aScale,bScale));
  ctx.save();ctx.globalAlpha*=alpha;
  // A hard-edged truss sits behind the platform bodies.  It follows the exact
  // same moving endpoints as the old bridge, so the late perspective turn is
  // unchanged even though the visual language is now industrial.
  ctx.fillStyle='#071217';
  ctx.beginPath();ctx.moveTo(x1,y1-thickness);ctx.lineTo(x2,y2-thickness);ctx.lineTo(x2,y2+thickness);ctx.lineTo(x1,y1+thickness);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#263a46';ctx.lineWidth=Math.max(3,5*Math.min(aScale,bScale));
  ctx.beginPath();ctx.moveTo(x1,y1-thickness*.62);ctx.lineTo(x2,y2-thickness*.62);ctx.moveTo(x1,y1+thickness*.62);ctx.lineTo(x2,y2+thickness*.62);ctx.stroke();
  ctx.strokeStyle=active?'#6fffd5':'#365563';ctx.lineWidth=Math.max(2,2.5*Math.min(aScale,bScale));
  ctx.beginPath();ctx.moveTo(x1,y1-thickness*.18);ctx.lineTo(x2,y2-thickness*.18);ctx.stroke();
  const distance=Math.hypot(x2-x1,y2-y1),braces=Math.max(1,Math.floor(distance/34));
  ctx.strokeStyle=active?'#258f87':'#172b33';ctx.lineWidth=Math.max(2,3*Math.min(aScale,bScale));
  for(let i=0;i<braces;i++){
    const t0=i/braces,t1=(i+1)/braces;
    ctx.beginPath();ctx.moveTo(mix(x1,x2,t0),mix(y1,y2,t0)-thickness*.55);ctx.lineTo(mix(x1,x2,t1),mix(y1,y2,t1)+thickness*.55);ctx.stroke();
  }
  ctx.restore();
}
function drawDeliveryPlatform(spec,at,artScale,reveal,active){
  const [sx,sy,sw,sh]=spec.crop,scale=artScale*at.scale;
  const rise=(1-reveal)*state.h*.24;
  const x=Math.round(at.x),deckY=Math.round(at.y+rise);
  const dx=Math.round(x-sw*scale/2),dy=Math.round(deckY-spec.deck*scale);
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.globalAlpha*=reveal;
  if(active<1)ctx.drawImage(deliveryPlatformSheet,sx,sy,sw,sh,dx,dy,sw*scale,sh*scale);
  if(active>0){ctx.globalAlpha*=active;ctx.drawImage(deliveryPlatformSheet,sx,sy+DELIVERY_ACTIVE_ROW,sw,sh,dx,dy,sw*scale,sh*scale);}
  ctx.restore();
  return {x, y:deckY, width:sw*scale, scale};
}
function deliveryLabel(spec,index,platform,reveal,active){
  if(reveal<=0)return;
  const label=spec.label,u=state.w<700?1.25:Math.max(1.7,2.25*platform.scale);
  const width=(label.length*6-1)*u;
  // Labels remain code-rendered and sit on a compact dark nameplate rather
  // than being baked into the supplied artwork.
  const y=platform.y+Math.max(45,58*platform.scale);
  ctx.save();ctx.globalAlpha*=reveal;
  ctx.fillStyle='rgba(3,13,17,.84)';ctx.fillRect(platform.x-width/2-10,y-7,width+20,7*u+14);
  ctx.fillStyle=active>.55?'#84f5ad':'#4f7881';ctx.fillRect(platform.x-width/2-10,y-7,width+20,3);
  pixelText(ctx,label,platform.x-width/2+2,y+2,u,'#061315');
  pixelText(ctx,label,platform.x-width/2,y,u,active>.55?'#effff5':'#c4d4d6');
  ctx.restore();
  registerMascotTarget(label,platform.x,platform.y+42*platform.scale,Math.max(86,platform.width*.76),Math.max(95,120*platform.scale));
}
function crossing(s,p) {
  if(!deliveryPlatformSheet.complete||!deliveryPlatformSheet.naturalWidth){fallbackCrossing(s,p);return;}
  const built=clamp(p/.70)*20;
  const artScale=Math.min(state.w/1774,state.h/887)*1.02;
  const entries=deliveryPlatforms.map((spec,i)=>{
    const at=bridgePoint(i/(deliveryPlatforms.length-1),p);
    const [revealStart,revealEnd]=deliveryStageWindows[i].reveal;
    // DEV exists before emergence. Every other stage and its illumination are
    // completely resolved before deliveryActorState releases the next walk.
    const reveal=i===0?1:ease((p-revealStart)/(revealEnd-revealStart));
    const active=i===0?1:ease((p-(revealStart+.025))/(revealEnd-revealStart-.025));
    const scale=artScale*at.scale;
    const rise=(1-reveal)*state.h*.24;
    return {spec,at,reveal,active,x:at.x,y:at.y+rise,width:spec.crop[2]*scale,scale};
  });
  // Connectors are revealed with their destination platform and remain behind
  // the bodies, preventing visible seams while the gantry changes perspective.
  for(let i=0;i<entries.length-1;i++){
    const a=entries[i],b=entries[i+1],reveal=Math.min(a.reveal,b.reveal);
    deliveryConnector(a,b,a.width,b.width,a.scale,b.scale,reveal,Math.min(a.active,b.active)>.45);
  }
  const platforms=entries.map(entry=>drawDeliveryPlatform(entry.spec,entry.at,artScale,entry.reveal,entry.active));
  platforms.forEach((platform,i)=>deliveryLabel(deliveryPlatforms[i],i,platform,entries[i].reveal,entries[i].active));
  if(p>.1&&p<.8)for(let j=0;j<6;j++){
    const t=(p*4+j/6)%1,at=bridgePoint(clamp((built-1)/20),p);
    ctx.globalAlpha=1-t;ctx.fillStyle=colors[j%3];ctx.fillRect(at.x+(j-3)*18*(1-t),at.y+110*(1-t),8,8);
  }
  ctx.globalAlpha=1;
}
function bookGeometry(p){return {x:state.w*(state.w<700?.55:.64),y:state.h*.79,w:Math.min(state.w*.7,700),open:ease((p-.10)/.25)};}
function storybook(s,p) {
  const b=bookGeometry(p),half=b.w/2, height=state.h*.22;
  ctx.save();ctx.translate(b.x,b.y);
  for(const side of [-1,1]){
    ctx.save();ctx.scale(side*b.open,1);
    ctx.fillStyle='#915369';ctx.fillRect(0,-height*.22,half+8,height*.64+12);
    ctx.fillStyle='#e4d7b5';ctx.fillRect(0,-height*.22,half,height*.64);
    for(let i=0;i<6;i++){ctx.fillStyle='#bcae93';ctx.fillRect(18,height*.18+i*6,half-34,2);}
    ctx.restore();
  }
  ctx.fillStyle='#725669';ctx.fillRect(-3,-height*.22,6,height*.66);
  for(let i=0;i<7;i++){
    const rise=ease((p-.27-i*.04)/.18),x=(i-3)*b.w*.105,w=b.w*.075,h=height*(.5+(i%3)*.22)*rise;
    ctx.fillStyle=['#5c9f9b','#bd728e','#929ebe'][i%3];ctx.fillRect(x,-h,w,h);
    ctx.fillStyle='#d8dcbf';for(let n=0;n<3;n++)ctx.fillRect(x+8,-h+12+n*19,5,6);
    ctx.fillStyle='#334e5e';ctx.fillRect(x-4,-h-6,w+8,6);
  }
  const u=state.w<700?1.5:3;
  pixelText(ctx,'PLACEHOLDER TEDDY',-(16*6-1)*u/2,height*.58,u,'#f58caf');
  for(let i=0;i<8;i++){
    const rise=ease((p-.44-i*.025)/.22),x=(i-3.5)*b.w*.1,y=-height*(.8+Math.sin(i*2)*.35)*rise;
    ctx.globalAlpha=rise;pixelText(ctx,['A','B','C','D'][i%4],x,y,2,colors[i%4]);
  }
  ctx.globalAlpha=1;
  const flip=ease((p-.82)/.18);
  if(flip>0){
    ctx.fillStyle='#f1e4c3';ctx.beginPath();ctx.moveTo(0,-height*.22);ctx.lineTo(half*Math.cos(flip*Math.PI),-height*.22-height*Math.sin(flip*Math.PI));ctx.lineTo(half*Math.cos(flip*Math.PI),height*.4-height*Math.sin(flip*Math.PI));ctx.lineTo(0,height*.4);ctx.fill();
  }
  ctx.restore();
}
function rope(s,p,pose) {
  const x=pose.x-7,top=state.h*.48;
  const low=Math.floor(p*10)%2===1;
  const handY=pose.feet-(low?139:243)*pose.scale;
  ctx.save();ctx.strokeStyle='#bdb49b';ctx.lineWidth=3;
  const reelX=state.w*(state.w<1000?.52:.72);
  line([[x,handY+25],[x,top],[reelX,top],[reelX,top+35]],'#bdb49b',3);
  ctx.strokeStyle='#67daf5';ctx.lineWidth=4;ctx.strokeRect(x-10,top-10,20,20);
  for(let y=top+14+(p*260)%18;y<handY+25;y+=18){ctx.fillStyle='#756f64';ctx.fillRect(x-3,y,6,3);}
  ctx.restore();
}
function scenePose(index,p) {
  const baseScale=(state.w<700?.67:.82)*actorViewportScale();
  const idle={x:state.w*.14,feet:state.h-82,scale:baseScale,mode:'idle',direction:1,phase:p*5};
  if(index===0)return {...idle,feet:backendPortalY(),scale:(state.w<700?.56:.64)*actorViewportScale()};
  if(index===1){
    // The wagons are a heavier industrial object than the blocks they replaced,
    // so the rider is eased down a touch here — only on the train, so no other
    // chapter's composition moves.
    // Keep both actors fixed to the opening until the emergence has completely
    // finished. Only then settle them onto the rail, avoiding the portal rim
    // crossing in front of a character that is still climbing out.
    // `p` is the directed choreography value and intentionally lags behind the
    // raw slide progress. Use the raw value here so the rail correction begins
    // immediately after the .15 emergence cutoff instead of much later.
    const entrySettle=ease((state.local-.15)/.025);
    const entryFeet=mix(backendPortalY(),backendTrackY(),entrySettle);
    const rider={...idle,feet:entryFeet,scale:baseScale*BACKEND_ACTOR_SCALE};
    const g=trainGeometry(p),roof=g.y-100*g.scale;
    const landX=trainGeometry(0).x-g.gap+18;
    const takeoffX=landX-Math.min(210,state.w*.11);
    if(p<.135){const t=ease(p/.135);return {...rider,x:mix(rider.x,takeoffX,t),mode:'walk',phase:p*13};}
    if(p<.145)return {...rider,x:takeoffX,mode:'anticipate',phase:(p-.135)/.01};
    if(p<.20){const t=ease((p-.145)/.055);return {...rider,x:mix(takeoffX,landX,t),feet:mix(rider.feet,roof-24*g.scale,t)-Math.sin(t*Math.PI)*42,mode:'jump',jumpProgress:t};}
    const lastX=trainGeometry(.85).x+(scenes[1].skills.length-1)*g.gap;
    if(p>.85)return {...rider,x:lastX,feet:roof};
    const x=mix(landX,lastX,trainTravel((p-.20)/.65));
    const n=(x-g.x)/g.gap,platform=Math.floor(n),across=n-platform;
    const leap=clamp((across-.35)/.30),airborne=across>.35&&across<.65;
    // The engine roof is higher. Blend that height during the first leap so
    // the feet never snap down at the midpoint between the two vehicles.
    const engineLift=platform<-1?24*g.scale:platform===-1?24*g.scale*(1-ease(leap)):0;
    const lift=airborne?Math.sin(leap*Math.PI)*Math.max(18,30*g.scale):0;
    return {...rider,x,feet:roof-engineLift-lift,mode:airborne?'jump':'walk',jumpProgress:airborne?leap:null,phase:p*12};
  }
  if(index===2)return {...idle,mode:'pull',phase:shotTime(p)*5};
  if(index===4){
    const target=spiralObjects(scenes[4],shotTime(p)).at(-1);
    const t=ease(p/.20),feet=target.y-26*target.scale;
    const landingShift=state.w<700?28:state.w<1000?44:58;
    return {...idle,x:mix(idle.x,target.x-landingShift,t),feet:mix(idle.feet,feet,t)-Math.sin(t*Math.PI)*80,scale:mix(baseScale,baseScale*Math.min(2.2,target.scale/.7),t),mode:p<.2?'jump':'idle',jumpProgress:p<.2?t:null};
  }
  if(index===5){const at=circuitPoint(clamp((p-.1)/.85));return {...idle,x:mix(idle.x,at.x,ease(p/.15)),mode:p>.15&&p<.9?'walk':'read',phase:p*8};}
  if(index===6){
    const deliveryTime=shotTime(p),deliveryState=deliveryActorState(deliveryTime),travel=deliveryState.travel;
    const at=bridgePoint(travel,deliveryTime);
    // Centre the avatar + right-offset companion as one group on every deck.
    // Without this shared nudge the avatar sits at the platform centre while
    // the dog hangs beyond its right edge on REVIEW, QA and UAT.
    const stageGroupShift=state.w<700?20:38;
    // On the initial flat gantry the generated decks read smaller than the old
    // blocks. Apply a delivery-only correction to both actors, then restore the
    // original perspective scale as the staircase begins to rise.
    const flatScale=mix(.92,1,ease((deliveryTime-.64)/.12));
    // Keep emergence registered to the portal. Once it has fully disappeared,
    // settle both actors a few pixels onto the visible deck surface.
    const deckSettle=ease((state.local-.15)/.04)*DELIVERY_ACTOR_DECK_SETTLE;
    return {...idle,x:at.x-stageGroupShift,feet:at.y+deckSettle,scale:baseScale*at.scale*flatScale,mode:deliveryState.moving?'walk':'idle',phase:deliveryTime*10};
  }
  if(index===7){const b=bookGeometry(shotTime(p)),t=ease((p-.36)/.36);return {...idle,x:mix(idle.x,b.x+b.w*.22,t),feet:mix(idle.feet,b.y+b.w*.01,t)-Math.sin(t*Math.PI)*55,mode:p<.34?'read':p<.7?'walk':'idle',phase:p*8};}
  return idle;
}
