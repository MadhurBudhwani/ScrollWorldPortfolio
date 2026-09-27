// Shared interaction geometry: no independent animation clocks for scroll-linked actions.
const revisionUI={active:null,buttons:[],bubble:null,petBubble:null,petTarget:null,
  narrativeKey:0,hoverKey:null,displayKey:null,manualTransition:null,petActive:false};
const SLIDE_ONE_TIMELINE=window.PortfolioChapters[0].timeline;
let foreground,frontCtx;
// GenAI's approved exit is the canonical transition composition. Every
// chapter entrance mirrors that exit: avatar on the hatch centre, companion
// separating to the right as it emerges (and converging while it drops), with
// all three sizes derived from the same actor scale.
const CHAPTER_PORTAL_PROFILE=Object.freeze({
  widthPerActorScale:250,
  aspect:240/52,
  actorOffsetPerActorScale:-32/.82,
  emergeRegistrationCompensationPerActorScale:-14/.82,
  companionHeightRatio:.60,
  companionOffsetPerActorScale:90/.82,
});
window.chapterPortalProfile=CHAPTER_PORTAL_PROFILE;
const CHAPTER_PORTAL_WIDTH_PER_ACTOR_SCALE=CHAPTER_PORTAL_PROFILE.widthPerActorScale;
const CHAPTER_PORTAL_ASPECT=CHAPTER_PORTAL_PROFILE.aspect;
const hubArrivalX=()=>state.w*.14-(state.w<700?20:36);
function canonicalPortalX(requested,scale){
  const portalHalf=scale*CHAPTER_PORTAL_WIDTH_PER_ACTOR_SCALE/2;
  const petHeight=232*scale*CHAPTER_PORTAL_PROFILE.companionHeightRatio;
  const petRight=scale*CHAPTER_PORTAL_PROFILE.companionOffsetPerActorScale+petHeight*.52;
  return clamp(requested,portalHalf+8,state.w-petRight-8);
}
// Slide 1 begins suggesting the exit before the existing drop sequence. The
// completed portal and actor transition still begin at the original .85 mark.
const SLIDE_ONE_PORTAL_HINT_START=SLIDE_ONE_TIMELINE.portalHintStart;
const SLIDE_ONE_PORTAL_COMPLETE=SLIDE_ONE_TIMELINE.portalComplete;
const SLIDE_ONE_DIALOGUE_HIDE_START=SLIDE_ONE_TIMELINE.bubbleHideStart;
function resizeRevision(){
  foreground=document.querySelector('#foreground');if(!foreground)return;
  foreground.width=Math.round(state.w*state.dpr);foreground.height=Math.round(state.h*state.dpr);
  frontCtx=foreground.getContext('2d');frontCtx.setTransform(state.dpr,0,0,state.dpr,0,0);frontCtx.imageSmoothingEnabled=false;
}
function initRevision(){
  revisionUI.bubble=document.querySelector('#speechBubble');
  revisionUI.petBubble=document.querySelector('#petSpeechBubble');
  revisionUI.petTarget=document.querySelector('#petHoverTarget');
  const root=document.querySelector('#orbitTargets');
  scenes[0].skills.forEach((label,i)=>{
    const b=document.createElement('button');b.className='orbit-target';b.setAttribute('aria-label',label+' expertise');b.setAttribute('aria-expanded','false');
    b.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')setSkillHover(i);});
    b.addEventListener('pointerleave',()=>setSkillHover(null));
    b.addEventListener('focus',()=>setSkillHover(i));b.addEventListener('blur',()=>setSkillHover(null));
    root.append(b);revisionUI.buttons.push(b);
  });
  const petVisible=visible=>{
    revisionUI.petActive=visible;
    if(revisionUI.petBubble)revisionUI.petBubble.hidden=!visible;
    if(revisionUI.bubble&&state.scene===0)revisionUI.bubble.hidden=visible;
  };
  revisionUI.petTarget.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')petVisible(true);});
  revisionUI.petTarget.addEventListener('pointerleave',()=>petVisible(false));
  revisionUI.petTarget.addEventListener('focus',()=>petVisible(true));
  revisionUI.petTarget.addEventListener('blur',()=>petVisible(false));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){setSkillHover(null);petVisible(false);}});
  setDialogueContent('intro');
}
function dialogueMessage(key){return key==='intro'?scenes[0].introMessage:key==='exit'?scenes[0].finalMessage:scenes[0].messages[key];}
function dialogueHighlight(key){return key==='exit'?scenes[0].messages.length-1:typeof key==='number'?key:null;}
function setDialogueContent(key){
  if(!revisionUI.bubble||revisionUI.displayKey===key)return;
  const message=dialogueMessage(key);if(!message)return;
  revisionUI.bubble.querySelector('strong').textContent=message.title;
  revisionUI.bubble.querySelector('p').textContent=message.description;
  revisionUI.displayKey=key;
}
function narrativeKeyAt(progress){
  const t=SLIDE_ONE_TIMELINE;
  if(progress>=t.finalMessageStart)return'exit';
  if(progress<t.nodeStart+t.dialogueHalf)return'intro';
  let key=0;
  for(let i=1;i<scenes[0].messages.length;i++)if(progress>=t.nodeStart+i*t.nodeStep+t.dialogueHalf)key=i;
  return key;
}
function dialogueBoundaryFrame(progress){
  const t=SLIDE_ONE_TIMELINE,half=t.dialogueHalf;
  const boundaries=[{at:t.nodeStart+half,from:'intro',to:0},
    ...scenes[0].messages.slice(1).map((_,i)=>({at:t.nodeStart+(i+1)*t.nodeStep+half,from:i,to:i+1}))];
  boundaries.push({at:t.finalMessageStart,from:scenes[0].messages.length-1,to:'exit'});
  for(const boundary of boundaries){
    if(progress<boundary.at-half||progress>boundary.at+half)continue;
    if(progress<boundary.at){
      const amount=clamp((progress-(boundary.at-half))/half);
      return{key:boundary.from,highlight:boundary.to==='exit'?dialogueHighlight(boundary.from):dialogueHighlight(boundary.to),phase:'out',visibility:1-amount};
    }
    const amount=clamp((progress-boundary.at)/half);
    return{key:boundary.to,highlight:dialogueHighlight(boundary.to),phase:'in',visibility:amount};
  }
  const key=narrativeKeyAt(progress);
  return{key,highlight:dialogueHighlight(key),phase:'stable',visibility:1};
}
function manualDialogueFrame(){
  const change=revisionUI.manualTransition;if(!change)return null;
  const amount=clamp((state.time-change.start)/change.duration);
  if(amount>=1){revisionUI.manualTransition=null;return{key:change.to,highlight:dialogueHighlight(change.to),phase:'stable',visibility:1};}
  if(amount<.48)return{key:change.from,highlight:dialogueHighlight(change.to),phase:'out',visibility:1-amount/.48};
  const reveal=(amount-.48)/.52;
  return{key:change.to,highlight:dialogueHighlight(change.to),phase:'in',visibility:reveal};
}
function setSkillHover(key){
  if(state.scene!==0)return;
  revisionUI.hoverKey=key;
  const target=key===null?narrativeKeyAt(state.local):key;
  const from=revisionUI.displayKey??narrativeKeyAt(state.local);
  if(from!==target)revisionUI.manualTransition={from,to:target,start:state.time,duration:230};
}
// Kept as a compatibility entry point for existing QA and integrations.
function showSpeech(key){setSkillHover(typeof key==='number'?key:null);}
function applyDialogueFrame(frame){
  const bubble=revisionUI.bubble,steps=4;
  setDialogueContent(frame.key);
  const visibility=Math.round(clamp(frame.visibility)*steps)/steps;
  const direction=frame.phase==='out'?-1:1;
  bubble.style.setProperty('--dialogue-opacity',visibility);
  bubble.style.setProperty('--dialogue-cut',(1-visibility)*100+'%');
  bubble.style.setProperty('--dialogue-shift',direction*(1-visibility)*6+'px');
  bubble.style.setProperty('--dialogue-scan',frame.phase==='stable'?0:(1-visibility)*.65);
  bubble.classList.toggle('is-switching',frame.phase!=='stable');
  revisionUI.active=frame.highlight;
  revisionUI.buttons.forEach((b,i)=>b.setAttribute('aria-expanded',String(frame.highlight===i)));
}
function currentDialogueFrame(){
  const manual=manualDialogueFrame();if(manual)return manual;
  if(revisionUI.hoverKey!==null)return{key:revisionUI.hoverKey,highlight:dialogueHighlight(revisionUI.hoverKey),phase:'stable',visibility:1};
  return dialogueBoundaryFrame(state.local);
}
function positionAvatarDialogue(pose){
  const b=revisionUI.bubble,w=b.offsetWidth,h=b.offsetHeight,avatarH=232*pose.scale;
  const left=clamp(pose.x-w*.35,16,state.w-w-16);
  const avatarTop=pose.feet-avatarH,safeBottom=avatarTop-34;
  const top=clamp(safeBottom-h,85,state.h-h-96);
  b.style.left=left+'px';b.style.top=top+'px';
  b.classList.remove('tail-side');
  b.style.setProperty('--tail',clamp(pose.x-left,16,w-32)+'px');
}
function layoutPetInteraction(){
  const target=revisionUI.petTarget,bubble=revisionUI.petBubble,d=state.mascotDiagnostics;
  const slideOneExit=state.scene===0&&state.local>=SLIDE_ONE_DIALOGUE_HIDE_START;
  const visible=!!d&&d.alpha>.08&&state.companionSkill==='MECHANICAL DOG'&&!state.exit&&!slideOneExit;
  target.hidden=!visible;
  if(!visible){revisionUI.petActive=false;bubble.hidden=true;return;}
  const pad=Math.max(5,d.height*.08),left=clamp(d.x-d.width/2-pad,0,state.w-(d.width+pad*2));
  Object.assign(target.style,{left:left+'px',top:Math.max(0,d.feet-d.height-pad)+'px',width:(d.width+pad*2)+'px',height:(d.height+pad*2)+'px'});
  if(bubble.hidden)return;
  const w=bubble.offsetWidth,h=bubble.offsetHeight;
  let bubbleLeft=clamp(d.x+d.width*.55+14,12,state.w-w-12),bubbleTop=clamp(d.feet-d.height*.74,12,state.h-h-86);
  const avatar=revisionUI.bubble?.getBoundingClientRect(),stageRect=stage.getBoundingClientRect();
  if(state.scene===0&&avatar&&!revisionUI.bubble.hidden){
    const localAvatar={left:avatar.left-stageRect.left,top:avatar.top-stageRect.top,right:avatar.right-stageRect.left,bottom:avatar.bottom-stageRect.top};
    const overlaps=bubbleLeft<localAvatar.right+8&&bubbleLeft+w>localAvatar.left-8&&bubbleTop<localAvatar.bottom+8&&bubbleTop+h>localAvatar.top-8;
    if(overlaps)bubbleLeft=clamp(d.x+d.width*.72+18,12,state.w-w-12);
  }
  bubble.style.left=bubbleLeft+'px';bubble.style.top=bubbleTop+'px';
  bubble.style.setProperty('--tail-y',clamp(d.feet-d.height*.45-bubbleTop,16,h-22)+'px');
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
  state.chapterPortal=null;
  // Launch at the instant the final carriage reaches its stop. Both actors
  // follow this same arc; descent starts only after reaching the opening.
  if(index===1&&p>=.745&&!reducedMotion.matches){
    const start=scenePose(1,.85),t=clamp((p-.745)/.155);
    const portalWidth=Math.min(state.w*.8,Math.round(start.scale*CHAPTER_PORTAL_WIDTH_PER_ACTOR_SCALE));
    const portalHeight=Math.round(portalWidth/CHAPTER_PORTAL_ASPECT);
    const destination=canonicalPortalX(start.x+(state.w<700?72:155),start.scale);
    const actorDestination=destination+start.scale*CHAPTER_PORTAL_PROFILE.actorOffsetPerActorScale;
    const exitPortalY=backendPortalY();
    const sink=clamp((p-.90)/.10);
    pose={...start,x:mix(start.x,actorDestination,ease(t)),feet:mix(start.feet,exitPortalY,t*t)-Math.sin(t*Math.PI)*85,mode:t<1?'jump':'drop',jumpProgress:t<1?t:null,phase:t*4};
    const opacity=ease((p-.745)/.03),approach=ease((p-.745)/.155);
    Object.assign(hole.style,{left:destination+'px',top:exitPortalY+'px',opacity:String(opacity),width:portalWidth+'px'});
    hole.style.setProperty('--portal-color',colors[1]);
    state.chapterPortal={x:destination,y:exitPortalY,width:portalWidth,height:portalHeight,theme:'cyan',opacity,approach,entering:sink,phase:p*4,reducedMotion:reducedMotion.matches};
    return {pose,mode:t<1?null:'drop',progress:sink,portalX:destination,portalY:exitPortalY,trainExit:true,portalProfile:'genai-exit'};
  }
  let mode=null,progress=0,opacity=0;
  if(!reducedMotion.matches&&index>0&&p<.15){
    mode='emerge';progress=ease(p/.15);opacity=1-ease((p-.11)/.04);
    pose=revisionPose(index,0);
  } else if(!reducedMotion.matches&&index<8&&p>.85){
    mode='drop';progress=ease((p-.85)/.15);opacity=ease((p-.85)/.03);
    pose=revisionPose(index,1);
  }
  // Move the complete hub-arrival group together: avatar, companion and hatch.
  if(index===8&&mode==='emerge')pose={...pose,x:hubArrivalX()};
  // Delivery's portal belongs to the gantry rather than the global floor. Use
  // the live DEV/PRODUCTION platform centre so the hatch sits exactly on the
  // generated deck even while the late perspective transformation is moving.
  // Only the entrance hatch is mounted on DEV. The exit returns to the lower
  // chapter baseline so the actors retain their existing leap/drop off the
  // raised PRODUCTION platform instead of sinking in place on its surface.
  const deliveryPortalAt=index===6&&mode==='emerge'
    ?bridgePoint(0,shotTime(state.directedLocal))
    :null;
  let portalX=canonicalPortalX(deliveryPortalAt?.x??pose.x,pose.scale);
  const portalY=deliveryPortalAt?.y??(index===0||(index===1&&p<.15)?backendPortalY():state.h-82);
  if(mode){
    const entryCompensation=mode==='emerge'?CHAPTER_PORTAL_PROFILE.emergeRegistrationCompensationPerActorScale:0;
    pose={...pose,x:portalX+pose.scale*(CHAPTER_PORTAL_PROFILE.actorOffsetPerActorScale+entryCompensation),feet:mode==='drop'?mix(pose.feet,portalY,ease(progress/.25)):mix(portalY,pose.feet,ease((progress-.65)/.35)),mode};
  }
  const slideOneBuildup=index===0&&p>=SLIDE_ONE_PORTAL_HINT_START;
  const build=slideOneBuildup
    ?clamp((p-SLIDE_ONE_PORTAL_HINT_START)/(SLIDE_ONE_PORTAL_COMPLETE-SLIDE_ONE_PORTAL_HINT_START))
    :1;
  const portalOpacity=slideOneBuildup
    ?ease((p-SLIDE_ONE_PORTAL_HINT_START)/.055)
    :opacity;
  const actorRelative=index<8&&(!!mode||slideOneBuildup);
  const width=actorRelative
    ?Math.min(state.w*.8,Math.round(pose.scale*CHAPTER_PORTAL_WIDTH_PER_ACTOR_SCALE))
    :Math.min(state.w*.8,Math.max(240,pose.scale*300));
  const height=actorRelative?Math.round(width/CHAPTER_PORTAL_ASPECT):52;
  Object.assign(hole.style,{left:portalX+'px',top:portalY+'px',opacity:String(portalOpacity),width:width+'px'});
  hole.style.setProperty('--portal-color',index===6?'#67daf5':colors[index%4]);
  if(portalOpacity>.001){
    const themes=['green','cyan','gold','pink'];
    state.chapterPortal={x:portalX,y:portalY,width,height,theme:index===6?'cyan':themes[index%4],opacity:portalOpacity,
      approach:mode?1:build*.65,entering:progress,build,phase:p*4,reducedMotion:reducedMotion.matches};
  }
  return {pose,mode,progress,portalX,portalY,portalProfile:mode?'genai-exit':null};
}
function revisionPose(index,p){
  if(index===5){
    const layout=routerLayout(),t=shotTime(p),base=(state.w<700?.60:.82)*actorViewportScale();
    const x=t<.25?mix(layout.front[0].x,layout.front[2].x,ease(t/.25)):t<.42?layout.front[2].x:mix(layout.front[2].x,layout.respond.x,ease((t-.42)/.54));
    return {x,feet:state.h*(state.w<700?.995:.94),scale:base,mode:t<.06?'tap':t<.15?'read':t<.25?'walk':t<.42?'read':t<.96?'walk':'present',direction:1,phase:t*10};
  }
  if(index===7){
    const t=shotTime(p),i=Math.min(5,Math.floor(t*6));
    // Scroll selects the hobby; a real-time clock animates its active pose.
    // One phase step is 750ms, so pausing scroll no longer freezes mid-frame.
    return {x:state.w*.5,feet:state.h*.91,scale:(state.w<700?.67:.82)*actorViewportScale(),mode:['read','sing','game','sketch','design','edit'][i],direction:1,phase:reducedMotion.matches?0:state.time/750};
  }
  const pose=scenePose(index,p);
  return pose;
}
function renderForeground(pose,transition,dt){
  if(!frontCtx)return;
  frontCtx.clearRect(0,0,state.w,state.h);
  const root=document.querySelector('#orbitTargets');root.hidden=state.scene!==0;root.inert=state.scene!==0;
  player.tabIndex=-1;
  if(state.scene===0){
    revisionUI.bubble.hidden=revisionUI.petActive||state.local>=SLIDE_ONE_DIALOGUE_HIDE_START;
    applyDialogueFrame(currentDialogueFrame());
    positionAvatarDialogue(pose);
  }else{
    revisionUI.bubble.hidden=true;revisionUI.hoverKey=null;revisionUI.manualTransition=null;
  }
  /* The delivery rails are queued during the scene pass and painted here, above
     the actors, so the two of them walk behind them. Leaving the PRODUCTION
     deck reverses that: he steps past the rail to jump, so from just before the
     exit begins the plates go down first and both actors draw over them. The
     swap is made while he is still clear of the nearest rail rather than at the
     moment of the jump, so nothing pops through. */
  const leavingDeck = scenes[state.scene]?.key==='delivery' && state.local>.80;
  const plates = typeof drawDeliveryPlates==='function' ? drawDeliveryPlates : null;
  if(leavingDeck&&plates)plates(frontCtx);
  drawPullRope(frontCtx,state.reelRope);
  drawCompanion(frontCtx,pose,transition,dt);
  if(!leavingDeck&&plates)plates(frontCtx);
  // The avatar is a DOM layer while the main portal is painted on the rear
  // canvas. Repaint only the hatch's near lip here so both the avatar and dog
  // emerge from behind the rim, including the train's final portal descent.
  if(transition.mode&&transition.portalProfile==='genai-exit'&&state.chapterPortal&&window.PortalArt?.drawFrontLip){
    const portal=state.chapterPortal;
    PortalArt.drawFrontLip(frontCtx,portal.x,portal.y,portal.width,portal.height,portal.theme,portal);
  }
  layoutPetInteraction();
}
// Capture the current hand once, after the avatar frame is updated. Both rope
// layers share this geometry, including when the pull cycle runs in reverse.
function pullRopeGeometry(hand){
  if(state.scene!==2||state.local<.15||state.local>.85||!hand)return null;
  const {x,y}=sceneViewport.point(hand.x,hand.y);
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
  for(let dy=pulleyY+12+(phase*200)%16;dy<y-4;dy+=16)c.fillRect(x-2,dy,4,3);
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
  const automaticPhase=reducedMotion.matches?0:state.time/750;
  const path=[];for(let i=0;i<=64;i++){const a=i/64*TAU;path.push([state.w*.5+Math.cos(a)*Math.min(state.w*.34,390),state.h*.69+Math.sin(a)*state.h*.14]);}
  line(path,'#483541',2);
  objects.sort((a,b)=>a.depth-b.depth).forEach(o=>{
    ctx.save();ctx.translate(o.x,o.y);ctx.scale(o.scale,o.scale);ctx.globalAlpha=o.focus?1:.45;
    registerMascotTarget(o.label,0,0,94,88);
    drawHobbyObject(ctx,o.i,automaticPhase);
    diagramLabel(ctx,o.label,0,47,120,o.focus?'#f5b1cc':'#a28c9b',state.w<700?10:12);ctx.restore();
  });
  pixelText(ctx,'HOBBIES',state.w*.5-41,state.h*.96,2,'#f58caf');
}
