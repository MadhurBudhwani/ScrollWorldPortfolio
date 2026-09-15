// Shared interaction geometry: no independent animation clocks for scroll-linked actions.
const revisionUI={active:null,locked:false,buttons:[],bubble:null};
const bootDetails=[
  'C#, .NET 8, ASP.NET Core, EF Core, REST APIs, SQL Server',
  'App Service, Functions, Azure SQL, Blob Storage, Redis, Application Insights',
  'Azure OpenAI, AI Foundry, RAG, embeddings, semantic search, NL-to-SQL, AI agents',
  'Solution design, enterprise architecture, distributed services, RLS, RBAC, multi-tenant access control'
];
let foreground,frontCtx;
function resizeRevision(){
  foreground=document.querySelector('#foreground');if(!foreground)return;
  foreground.width=Math.round(state.w*state.dpr);foreground.height=Math.round(state.h*state.dpr);
  frontCtx=foreground.getContext('2d');frontCtx.setTransform(state.dpr,0,0,state.dpr,0,0);frontCtx.imageSmoothingEnabled=false;
}
function initRevision(){
  revisionUI.bubble=document.querySelector('#speechBubble');
  const root=document.querySelector('#orbitTargets');
  scenes[0].skills.forEach((label,i)=>{
    const b=document.createElement('button');b.className='orbit-target';b.setAttribute('aria-label',label+' expertise');b.setAttribute('aria-expanded','false');
    b.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&!revisionUI.locked)showSpeech(i);});
    b.addEventListener('pointerleave',()=>{if(!revisionUI.locked)showSpeech(null);});
    b.addEventListener('focus',()=>showSpeech(i));b.addEventListener('blur',()=>{if(!revisionUI.locked)showSpeech(null);});
    b.addEventListener('click',e=>{e.stopPropagation();const close=revisionUI.locked&&revisionUI.active===i;revisionUI.locked=!close;showSpeech(close?null:i);});
    root.append(b);revisionUI.buttons.push(b);
  });
  player.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'&&state.scene===0&&!revisionUI.locked)showSpeech('intro');});
  player.addEventListener('pointerleave',()=>{if(!revisionUI.locked)showSpeech(null);});
  player.addEventListener('focus',()=>{if(state.scene===0)showSpeech('intro');});
  player.addEventListener('blur',()=>{if(!revisionUI.locked)showSpeech(null);});
  const toggle=()=>{if(state.scene!==0)return;const close=revisionUI.locked&&revisionUI.active==='intro';revisionUI.locked=!close;showSpeech(close?null:'intro');};
  player.addEventListener('click',e=>{e.stopPropagation();toggle();});
  player.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();toggle();}});
  document.addEventListener('click',e=>{if(!e.target.closest('.orbit-target,#player')){revisionUI.locked=false;showSpeech(null);}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){revisionUI.locked=false;showSpeech(null);}});
}
function showSpeech(key){
  revisionUI.active=key;
  if(!revisionUI.bubble)return;
  revisionUI.bubble.hidden=key===null;
  revisionUI.buttons.forEach((b,i)=>b.setAttribute('aria-expanded',String(key===i)));
  player.setAttribute('aria-expanded',String(key==='intro'));
  if(key===null)return;
  revisionUI.bubble.querySelector('strong').textContent=key==='intro'?'Madhur Budhwani':scenes[0].skills[key];
  revisionUI.bubble.querySelector('p').textContent=key==='intro'?"I'm Madhur, a backend and GenAI engineer. I build systems and write worlds.":bootDetails[key];
}
function updateOrbitTargets(objects,s){
  objects.forEach(o=>{
    const b=revisionUI.buttons[o.i];if(!b)return;
    const width=Math.min(320,(s.skills[o.i].length*6-1)*7)*o.scale;
    Object.assign(b.style,{left:(o.x-width/2)+'px',top:(o.y-28*o.scale)+'px',width:width+'px',height:(104*o.scale)+'px'});
    b.style.zIndex=String(10+Math.round(o.depth*5));
  });
}
function chapterTransition(index,p,pose){
  const hole=document.querySelector('#chapterPortal');
  // Launch at the instant the final carriage reaches its stop. Both actors
  // follow this same arc; descent starts only after reaching the opening.
  if(index===1&&p>=.745&&!reducedMotion.matches){
    const start=scenePose(1,.85),t=clamp((p-.745)/.155);
    const portalWidth=Math.min(state.w*.8,Math.max(240,start.scale*300));
    const destination=Math.min(state.w-portalWidth/2-8,start.x+(state.w<700?72:155));
    const sink=clamp((p-.90)/.10);
    pose={...start,x:mix(start.x,destination,ease(t)),feet:mix(start.feet,state.h-82,t*t)-Math.sin(t*Math.PI)*85,mode:t<1?'jump':'drop',phase:t*4};
    Object.assign(hole.style,{left:destination+'px',top:(state.h-82)+'px',opacity:String(ease((p-.745)/.03)),width:portalWidth+'px'});
    hole.style.setProperty('--portal-color',colors[1]);
    return {pose,mode:t<1?null:'drop',progress:sink,trainExit:true};
  }
  let mode=null,progress=0,opacity=0;
  if(!reducedMotion.matches&&index>0&&p<.15){
    mode='emerge';progress=ease(p/.15);opacity=1-ease((p-.11)/.04);
    pose=revisionPose(index,0);
  } else if(!reducedMotion.matches&&index<8&&p>.85){
    mode='drop';progress=ease((p-.85)/.15);opacity=ease((p-.85)/.03);
    pose=revisionPose(index,1);
  }
  if(mode){pose={...pose,feet:mode==='drop'?mix(pose.feet,state.h-82,ease(progress/.25)):mix(state.h-82,pose.feet,ease((progress-.65)/.35)),mode};}
  Object.assign(hole.style,{left:pose.x+'px',top:(state.h-82)+'px',opacity:String(opacity),width:Math.min(state.w*.8,Math.max(240,pose.scale*300))+'px'});
  hole.style.setProperty('--portal-color',colors[index%4]);
  return {pose,mode,progress};
}
function revisionPose(index,p){
  if(index===5){
    const layout=routerLayout(),t=shotTime(p),base=state.w<700?.60:.82;
    const x=t<.25?mix(layout.front[0].x,layout.front[2].x,ease(t/.25)):t<.65?layout.front[2].x:mix(layout.front[2].x,layout.respond.x,ease((t-.65)/.25));
    return {x,feet:state.h*(state.w<700?.995:.94),scale:base,mode:t<.06?'tap':t<.15?'read':t<.25?'walk':t<.65?'read':t<.88?'walk':'present',direction:1,phase:t*10};
  }
  if(index===7){
    const t=shotTime(p),i=Math.min(5,Math.floor(t*6));
    return {x:state.w*.5,feet:state.h*.91,scale:state.w<700?.67:.82,mode:['read','sing','game','sketch','design','edit'][i],direction:1,phase:t*24};
  }
  const pose=scenePose(index,p);
  return pose;
}
function renderForeground(pose,transition,dt){
  if(!frontCtx)return;
  frontCtx.clearRect(0,0,state.w,state.h);
  const root=document.querySelector('#orbitTargets');root.hidden=state.scene!==0;root.inert=state.scene!==0;
  player.tabIndex=state.scene===0?0:-1;
  if(state.scene!==0&&revisionUI.active!==null){revisionUI.locked=false;showSpeech(null);}
  if(revisionUI.bubble&&!revisionUI.bubble.hidden){
    const b=revisionUI.bubble,w=b.offsetWidth,left=clamp(pose.x-w*.4,16,state.w-w-16);
    b.style.left=left+'px';b.style.top=Math.max(85,pose.feet-232*pose.scale-b.offsetHeight-20)+'px';b.style.setProperty('--tail',clamp(pose.x-left,16,w-32)+'px');
  }
  drawPullRope(frontCtx,state.reelRope);
  drawCompanion(frontCtx,pose,transition,dt);
}
// Capture the current hand once, after the avatar frame is updated. Both rope
// layers share this geometry, including when the pull cycle runs in reverse.
function pullRopeGeometry(hand){
  if(state.scene!==2||state.local<.15||state.local>.85||!hand)return null;
  const r=stage.getBoundingClientRect(),x=hand.x-r.left,y=hand.y-r.top;
  return {x,y,pulleyY:Math.min(state.h*.48,y-30),reelX:state.w*(state.w<1000?.52:.72),phase:state.directedLocal};
}
// The horizontal run and reel-side attachment are covered by the reel.
function drawReelRope(rope=state.reelRope){
  if(!rope)return;
  const {x,pulleyY,reelX}=rope;
  ctx.save();ctx.strokeStyle='#bdb49b';ctx.lineWidth=3;
  ctx.beginPath();ctx.moveTo(reelX,pulleyY+22);ctx.lineTo(reelX,pulleyY);ctx.lineTo(x,pulleyY);ctx.stroke();ctx.restore();
}
// Only the vertical hand-side run belongs above the avatar canvas.
function drawPullRope(c,rope){
  if(!rope)return;
  const {x,y,pulleyY,phase}=rope;
  c.save();c.strokeStyle='#bdb49b';c.lineWidth=3;
  c.beginPath();c.moveTo(x,pulleyY);c.lineTo(x,y);c.stroke();
  c.strokeStyle='#67daf5';c.lineWidth=4;c.strokeRect(x-8,pulleyY-8,16,16);
  c.fillStyle='#81795f';
  for(let dy=pulleyY+12-(phase*200)%16;dy<y-4;dy+=16)c.fillRect(x-2,dy,4,3);
  c.restore();
}
function diagramLabel(c,label,x,y,maxWidth,color='#d6e8e1',size=11){
  c.save();c.font=`600 ${size}px monospace`;c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;
  const words=label.split(' '),lines=[];let line='';
  words.forEach(word=>{if(line&&c.measureText(line+' '+word).width>maxWidth){lines.push(line);line=word;}else line+=(line?' ':'')+word;});if(line)lines.push(line);
  lines.forEach((line,i)=>c.fillText(line,x,y+(i-(lines.length-1)/2)*(size+3)));c.restore();
}
function routerLayout(){
  const mobile=state.w<700,w=state.w,h=state.h;
  const safety=['SCHEMA RAG','LLM','VALIDATE','CORRECT','RLS EXECUTE','VISUALIZE'];
  const galaxy=['GRAPH RAG','LLM','GROUND CHECK','REFINE','GRAPH SCOPE','DIGEST CARD'];
  const fast=['SEMANTIC CACHE','INSTANT REPLY'];
  const front=['AUTH','INTENT','ROUTER'].map((label,i)=>({label,x:w*(mobile?.15+i*.30:.07+i*.10),y:h*(mobile?.37:.55)}));
  const lanes=[safety,galaxy,fast].map((labels,lane)=>labels.map((label,i)=>({label,x:w*(mobile?.15+lane*.35:.37+i/(labels.length-1)*.40),y:h*(mobile?.43+i/(labels.length-1)*.19:.49+lane*.13)})));
  return {mobile,front,lanes,merge:{label:'VISUALIZE',x:w*(mobile?.49:.85),y:h*(mobile?.675:.62)},respond:{label:'RESPOND',x:w*(mobile?.81:.94),y:h*(mobile?.675:.62)},ambientY:h*(mobile?.73:.405),governanceY:h*(mobile?.78:.975)};
}
function pathPoint(points,t){
  const lengths=points.slice(1).map((b,i)=>Math.hypot(b.x-points[i].x,b.y-points[i].y)),total=lengths.reduce((a,b)=>a+b,0);
  let d=clamp(t)*total;
  for(let i=0;i<lengths.length;i++){if(d<=lengths[i]||i===lengths.length-1){const f=lengths[i]?d/lengths[i]:0;return {x:mix(points[i].x,points[i+1].x,f),y:mix(points[i].y,points[i+1].y,f)};}d-=lengths[i];}
  return points[0];
}
function diagramPath(points,color,width=2){line(points.map(v=>[v.x,v.y]),color,width);}
function packetAt(points,t,color){const at=pathPoint(points,t);ctx.fillStyle=color;ctx.fillRect(at.x-4,at.y-4,8,8);ctx.strokeStyle=color;ctx.lineWidth=1;ctx.strokeRect(at.x-8,at.y-8,16,16);return at;}
function routerCircuit(s,p){
  const l=routerLayout(),nodeW=l.mobile?Math.min(82,state.w*.22):Math.min(98,state.w*.063),nodeH=l.mobile?24:36;
  const paintNodes=[];
  const node=(n,color,lit=false,glow=false)=>{
    paintNodes.push(()=>{
    registerMascotTarget(n.label,n.x,n.y,nodeW,nodeH);
    ctx.save();ctx.fillStyle=lit?'#143b35':'#0c2025';ctx.strokeStyle=lit?color:'#37534e';ctx.lineWidth=lit?2:1;
    if(glow&&!reducedMotion.matches){ctx.shadowColor=color;ctx.shadowBlur=13;}
    ctx.fillRect(n.x-nodeW/2,n.y-nodeH/2,nodeW,nodeH);ctx.strokeRect(n.x-nodeW/2,n.y-nodeH/2,nodeW,nodeH);
    diagramLabel(ctx,n.label,n.x,n.y,nodeW-6,lit?'#effaf1':'#9bb8b6',l.mobile?9:10);ctx.restore();
    });
  };
  diagramPath(l.front,'#3c635b');
  l.front.forEach((n,i)=>node(n,colors[0],p>=i*.075,i===2&&p>.15&&p<.25));
  const router=l.front[2];
  const flow=clamp((p-.25)/.40);
  l.lanes.forEach((nodes,i)=>{
    const color=colors[i],route=[router,...nodes,l.merge];
    const laneFlow=i===2?clamp(flow*2.5):flow;
    diagramPath(route,'#2e4845');
    nodes.forEach((n,j)=>node(n,color,p>=.25&&laneFlow>=j/(nodes.length-1),Math.abs(laneFlow-j/(nodes.length-1))<.06&&p<.65));
    if(p>=.15&&p<.25)packetAt([l.front[1],router,nodes[0]],(p-.15)/.10,color);
    if(p>=.25&&p<.65)packetAt(nodes,laneFlow,color);
    if(p>=.65&&p<.80)packetAt([nodes.at(-1),l.merge],ease((p-.65)/.15),color);
  });
  if(p<.15)packetAt(l.front,clamp(p/.15),'#f3cc70');
  l.front.forEach((n,i)=>node(n,colors[0],p>=i*.075,i===2&&p>.15&&p<.25));
  const llm=l.lanes[0][1],validate=l.lanes[0][2],offset=l.mobile?-25:-33;
  const loop=l.mobile?[validate,{x:validate.x+offset,y:validate.y},{x:llm.x+offset,y:llm.y},llm]:[validate,{x:validate.x,y:validate.y+offset},{x:llm.x,y:llm.y+offset},llm];
  diagramPath(loop,p>.35&&p<.55?'#f58caf':'#402e40');
  if(p>.35&&p<.55)packetAt([...loop,...loop.slice().reverse()],(p-.35)/.20,'#f58caf');
  diagramPath([l.merge,l.respond],'#426757');
  const ambient=reducedMotion.matches?.4:(state.time/1000/12)%1;
  const ping=ambient>.86;
  node(l.merge,colors[0],p>.65,p>.65&&p<.8);node(l.respond,ping?colors[2]:colors[0],p>.8||ping,ping||p>.9);
  if(p>=.8)packetAt([l.merge,l.respond],clamp((p-.8)/.18),colors[0]);
  const ambientNodes=['SCHEDULE','GRAPH SWEEP','INSIGHT','PROACTIVE PING'].map((label,i)=>({label,x:state.w*(.12+i*.23),y:l.ambientY}));
  diagramPath([...ambientNodes,{x:l.respond.x,y:l.ambientY},l.respond],'#574d33');
  ambientNodes.forEach((n,i)=>{ctx.fillStyle='#111f23';ctx.fillRect(n.x-nodeW/2,n.y-15,nodeW,30);diagramLabel(ctx,n.label,n.x,n.y,nodeW-6,'#bcb69a',l.mobile?8:10);});
  packetAt([...ambientNodes,{x:l.respond.x,y:l.ambientY},l.respond],ambient,colors[2]);
  // Every connector and travelling packet sits beneath every solid node.
  paintNodes.forEach(paint=>paint());
  ambientNodes.forEach(n=>{ctx.fillStyle='#111f23';ctx.fillRect(n.x-nodeW/2,n.y-15,nodeW,30);diagramLabel(ctx,n.label,n.x,n.y,nodeW-6,'#bcb69a',l.mobile?8:10);});
  ambientNodes.forEach(n=>registerMascotTarget(n.label,n.x,n.y,nodeW,30));
  ctx.fillStyle='#162629';ctx.fillRect(state.w*.08,l.governanceY-12,state.w*.84,25);
  ['CACHE','AUDIT','RLS'].forEach((label,i)=>{
    const active=i===0?p>.25&&p<.43:i===1?[0,.075,.15,.25,.33,.41,.49,.57,.65,.80,.98].some(t=>Math.abs(p-t)<.018):p>.55&&p<.61;
    diagramLabel(ctx,label,state.w*(.30+i*.20),l.governanceY,90,active?colors[0]:'#728b89',10);
    registerMascotTarget(label,state.w*(.30+i*.20),l.governanceY,90,25);
  });
}
function hobbyObjects(p){
  const focus=Math.min(5,Math.floor(p*6)),radius=Math.min(state.w*.34,390),cy=state.h*.69;
  return scenes[7].skills.map((label,i)=>{
    const angle=(i/6-p)*TAU-Math.PI/2,depth=(Math.sin(angle)+1)/2;
    return {label,i,x:state.w*.5+Math.cos(angle)*radius,y:cy+Math.sin(angle)*state.h*.14,scale:(state.w<700?.68:1)+depth*.30,depth,focus:i===focus};
  });
}
function hobbyFusion(s,p){
  const objects=hobbyObjects(p);
  const path=[];for(let i=0;i<=64;i++){const a=i/64*TAU;path.push([state.w*.5+Math.cos(a)*Math.min(state.w*.34,390),state.h*.69+Math.sin(a)*state.h*.14]);}
  line(path,'#483541',2);
  objects.sort((a,b)=>a.depth-b.depth).forEach(o=>{
    ctx.save();ctx.translate(o.x,o.y);ctx.scale(o.scale,o.scale);ctx.globalAlpha=o.focus?1:.45;
    registerMascotTarget(o.label,0,0,94,88);
    drawHobbyObject(ctx,o.i,p*18);
    diagramLabel(ctx,o.label,0,47,120,o.focus?'#f5b1cc':'#a28c9b',state.w<700?10:12);ctx.restore();
  });
  pixelText(ctx,'HOBBIES',state.w*.5-41,state.h*.96,2,'#f58caf');
}
