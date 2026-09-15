// Hover intent and animation state are separate: rapid hover changes replace
// the destination, never enqueue transformations.
const mascot={targets:[],pointer:null,focused:null,tapped:null,buttons:new Map(),
  form:null,desired:null,phase:0,lastMotion:0,gait:0,facing:1,x:null,scene:-1,sit:0};
function registerMascotTarget(label,x,y,width,height){
  if(!mascotFormCatalog[label]||ctx.globalAlpha<.15)return;
  const m=ctx.getTransform(),d=state.dpr;
  const points=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>{
    const px=x+a*width/2,py=y+b*height/2;
    return {x:(m.a*px+m.c*py+m.e)/d,y:(m.b*px+m.d*py+m.f)/d};
  });
  const left=Math.max(0,Math.min(...points.map(p=>p.x))),right=Math.min(state.w,Math.max(...points.map(p=>p.x)));
  const clipTop=state.scene===2?(state.w<1000?state.h*.49:105):0;
  const top=Math.max(clipTop,Math.min(...points.map(p=>p.y))),bottom=Math.min(state.h,Math.max(...points.map(p=>p.y)));
  if(right>left&&bottom>top)mascot.targets.push({label,points,left,top,width:right-left,height:bottom-top});
}
function insideMascotTarget(p,target){
  if(p.x<target.left||p.x>target.left+target.width||p.y<target.top||p.y>target.top+target.height)return false;
  let sign=0;
  for(let i=0;i<4;i++){
    const a=target.points[i],b=target.points[(i+1)%4],cross=(b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
    if(Math.abs(cross)<.001)continue;
    if(sign&&Math.sign(cross)!==sign)return false;sign=Math.sign(cross);
  }
  return true;
}
function initMascot(){
  const root=document.createElement('div');root.id='mascotTargets';root.setAttribute('aria-label','Explore mascot transformations');stage.append(root);mascot.root=root;
  stage.addEventListener('pointermove',e=>{
    if(e.pointerType==='touch')return;
    mascot.pointer=sceneViewport.point(e.clientX,e.clientY);mascot.tapped=null;mascot.focused=null;
  });
  stage.addEventListener('pointerleave',()=>{mascot.pointer=null;mascot.focused=null;});
  window.addEventListener('blur',()=>{mascot.pointer=null;mascot.focused=null;mascot.tapped=null;});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'){mascot.focused=null;mascot.tapped=null;mascot.pointer=null;}});
  revisionUI.buttons.forEach((b,i)=>{
    b.addEventListener('focus',()=>{mascot.focused=scenes[0].skills[i];});
    b.addEventListener('blur',()=>{mascot.focused=null;});
  });
  portals.forEach(p=>{
    const label=p.querySelector('strong').textContent;
    p.addEventListener('pointerenter',()=>{mascot.focused=label;});
    p.addEventListener('pointerleave',()=>{mascot.focused=null;});
    p.addEventListener('focus',()=>{mascot.focused=label;});
    p.addEventListener('blur',()=>{mascot.focused=null;});
  });
}
function updateMascotTargets(){
  const seen=new Set();
  mascot.targets.forEach((t,i)=>{
    // Boot already has accessible expertise buttons; hub has portal buttons.
    if(state.scene===0||state.scene===8)return;
    const key=t.label+':'+i;seen.add(key);
    let b=mascot.buttons.get(key);
    if(!b){
      b=document.createElement('button');b.className='mascot-target';b.setAttribute('aria-label','Transform companion: '+t.label);
      b.addEventListener('focus',()=>{mascot.focused=t.label;});
      b.addEventListener('blur',()=>{mascot.focused=null;});
      b.addEventListener('click',e=>{if(e.pointerType==='touch')mascot.tapped=mascot.tapped===t.label?null:t.label;});
      mascot.root.append(b);mascot.buttons.set(key,b);
    }
    Object.assign(b.style,{left:t.left+'px',top:t.top+'px',width:t.width+'px',height:t.height+'px'});
    const polygon=t.points.map(p=>`${(p.x-t.left)/t.width*100}% ${(p.y-t.top)/t.height*100}%`).join(',');
    b.style.clipPath=`polygon(${polygon})`;b.hidden=false;
  });
  for(const [key,b] of mascot.buttons)if(!seen.has(key)){b.remove();mascot.buttons.delete(key);}
  const hovered=mascot.pointer?[...mascot.targets].reverse().find(t=>insideMascotTarget(mascot.pointer,t)):null;
  const focused=mascot.focused;
  mascot.desired=focused||mascot.tapped||hovered?.label||null;
}
function updateMascotMorph(desired,dt){
  if(desired&&!mascotFormCatalog[desired])desired=null;
  if(!mascot.form&&desired)mascot.form=desired;
  const target=desired===mascot.form&&desired?1:0;
  const step=reducedMotion.matches?1:dt/.85;
  mascot.phase=clamp(mascot.phase+Math.sign(target-mascot.phase)*Math.min(step,Math.abs(target-mascot.phase)));
  if(mascot.phase===0&&mascot.form!==desired)mascot.form=desired;
}
function dogSource(index){return {image:companionAtlas,rect:companionSprites[index],index};}
function formSource(label){
  const form=mascotFormCatalog[label];if(!form)return null;
  const image=mascotFormSheets[form.sheet];
  if(!image.complete||!image.naturalWidth)return null;
  const cw=image.naturalWidth/4,ch=image.naturalHeight/4;
  const crop=typeof mascotFormCrops!=='undefined'?mascotFormCrops[form.sheet]?.[form.cell]:null;
  return {image,rect:crop||[(form.cell%4)*cw,Math.floor(form.cell/4)*ch,cw,ch],index:-1};
}
function drawMascotSprite(c,source,height,direction,fold=0){
  const [sx,sy,sw,sh]=source.rect,w=height*sw/sh,h=height;
  c.save();if(source.index>=0)c.scale(direction,1);
  const paint=()=>{
    c.save();
    if(source.index>=0&&companionGutters[source.index]){
      c.beginPath();c.rect(-w/2,-h,w,h);
      companionGutters[source.index].forEach(([x,y,ww,hh])=>c.rect(-w/2+(x-sx)*w/sw,-h+(y-sy)*h/sh,ww*w/sw,hh*h/sh));c.clip('evenodd');
    }
    c.drawImage(source.image,sx,sy,sw,sh,-w/2,-h,w,h);c.restore();
  };
  if(fold<.001)paint();
  else{
    // Nine armor segments hinge towards the cyan core. Target-form panels
    // expand from that same core in the second half of the transformation.
    for(let row=0;row<3;row++)for(let col=0;col<3;col++){
      const px=-w/2+(col+.5)*w/3,py=-h+(row+.5)*h/3;
      const amount=ease(fold),arc=Math.sin(amount*Math.PI)*height*.14;
      c.save();c.translate(px*(1-amount)+(col-1)*arc,-h*.48+(py+h*.48)*(1-amount));
      c.rotate((col-1||1)*(row+1)*amount*.65);c.scale(Math.max(.015,1-amount*.985),Math.max(.015,1-amount*.985));
      c.beginPath();c.rect(-w/6,-h/6,w/3+.1,h/3+.1);c.clip();c.translate(-px,-py);paint();c.restore();
    }
  }
  c.restore();
}
function drawCompanion(c,pose,transition,dt){
  if(!companionAtlas.complete||!companionAtlas.naturalWidth)return;
  if(mascot.scene!==state.scene){
    mascot.scene=state.scene;mascot.focused=null;mascot.tapped=null;mascot.form=null;mascot.phase=0;mascot.x=null;mascot.lastMotion=state.time;
  }
  updateMascotTargets();
  const exiting=transition.mode||transition.trainExit||state.exit;
  // SS2 establishes the dog height: 60% of the avatar's registered height.
  const height=232*pose.scale*.60;
  const offset=(state.scene===1?-80:90)*pose.scale/.82;
  const x=clamp(pose.x+offset*(transition.mode?1-transition.progress:1),height*.65,state.w-height*.65);
  const dx=mascot.x===null?0:x-mascot.x;
  const moving=Math.abs(dx)>.025&&!transition.mode;
  if(moving){mascot.facing=Math.sign(dx);mascot.gait+=dt*9;}
  else if(mascot.x===null)mascot.facing=pose.direction||1;
  mascot.x=x;
  if(moving||Math.abs(state.progress-state.previousProgress)>.000001||pose.mode==='jump'||exiting)mascot.lastMotion=state.time;
  const sitting=!moving&&!exiting&&state.time-mascot.lastMotion>=5000;
  mascot.sit=mix(mascot.sit,sitting?1:0,Math.min(1,dt*9));
  const frame=exiting?2:moving?2+Math.floor(mascot.gait)%2:mascot.sit>.5?0:1;
  updateMascotMorph(exiting?null:mascot.desired,dt);
  const form=formSource(mascot.form),phase=form?mascot.phase:0;
  let feet=pose.feet,alpha=1;
  if(transition.mode==='drop'){feet=state.h-82+Math.max(0,(transition.progress-.25)/.75)*height*1.5;alpha=1-ease((transition.progress-.75)/.25);}
  if(transition.mode==='emerge'){feet=state.h-82+(1-transition.progress)*height*1.5;alpha=ease(transition.progress/.3);}
  if(state.exit?.phase==='descend')alpha=1-clamp(state.exit.elapsed/.45);
  c.save();c.imageSmoothingEnabled=false;c.globalAlpha=alpha;
  if(transition.mode){c.beginPath();c.rect(0,0,state.w,state.h-78);c.clip();}
  c.translate(Math.round(x*state.dpr)/state.dpr,feet);
  const breath=reducedMotion.matches||moving||exiting?1:1+Math.sin(state.time/550)*.008;
  c.scale(1,breath);
  if(phase<=.5)drawMascotSprite(c,dogSource(frame),height,mascot.facing,phase*2);
  else drawMascotSprite(c,form,height,1,(1-phase)*2);
  if(phase>0&&phase<1&&!reducedMotion.matches){
    const pulse=Math.sin(phase*Math.PI),radius=height*(.09+.17*pulse);
    c.fillStyle='#bfffff';c.fillRect(-radius*.3,-height*.48-radius*.3,radius*.6,radius*.6);
    for(let i=0;i<8;i++){
      const angle=i/8*TAU+phase*TAU;
      c.save();c.translate(Math.cos(angle)*radius,-height*.48+Math.sin(angle)*radius);c.rotate(angle);
      c.fillStyle=i%2?'#67daf5':'#d8faff';c.fillRect(-3,-2,6,4);c.restore();
    }
  }
  if(phase>.96&&mascot.form)diagramLabel(c,mascot.form,0,-height-12,Math.max(130,height*1.7),'#d5f5ef',10);
  c.restore();
  state.companionSkill=phase>0?mascot.form:'MECHANICAL DOG';
  state.mascotDiagnostics={x,feet,height,avatarHeight:232*pose.scale,facing:mascot.facing,moving,pose:frame===0?'sit':moving?'walk':'stand',phase,form:mascot.form,desired:mascot.desired};
}
