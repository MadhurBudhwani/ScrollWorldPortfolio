/* Opening + scanner only. A gesture starts each interaction; no slide timer. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),host=$('chamber');
  const canvases=[$('atmosphere'),$('architecture'),$('crystal')],contexts=canvases.map(c=>c.getContext('2d'));
  const [bg,arch,fx]=contexts,buffer=document.createElement('canvas'),bc=buffer.getContext('2d');
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),lerp=(a,b,t)=>a+(b-a)*t,smooth=n=>{n=clamp(n);return n*n*(3-2*n);},tau=Math.PI*2;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');let gentle=reduced.matches;
  const fields=[
    {name:'UserId',caption:'It knows who is asking.',detail:'UserId · the person making the request.',color:'#67daf5',crop:[90,125,112,103]},
    {name:'CompanyId',caption:'It knows where you belong.',detail:'CompanyId · the company boundary.',color:'#84f5ad',crop:[329,126,110,103]},
    {name:'UserRole',caption:'Your role takes shape.',detail:'UserRole · your role in the system.',color:'#f3cc70',crop:[580,126,112,103]},
    {name:'PermissionType',caption:'Your access has a scope.',detail:'PermissionType · your resolved permission scope.',color:'#f58caf',crop:[830,126,108,103]},
    {name:'CacheKey',caption:'The context is complete.',detail:'CacheKey · the permission-cache version.',color:'#bf8cff',crop:[1061,125,110,103]}
  ];
  const state={phase:'sleep',time:0,wake:0,travel:0,hold:0,scan:0,open:0,settle:0,field:-1,x:.5,y:.68,vx:0,vy:0,aimX:.5,aimY:.68,cameraX:0,cameraY:0,pulse:0,trail:[],keys:new Set()};
  let W=375,H=812,dpr=1,last=0,ready=false,drag=null,tiltActive=false,rawTilt=null,neutral=null,sensorTimer=0,lastAnnouncement='';
  let tiltX=0,tiltY=0,keyboardGuide=false,frame=0,art={};
  const layout=()=>({cx:W>H?.35:.5,cy:W>H?.47:.39,restY:W>H?.72:.68,margin:W>H?.12:.15});
  const gate=()=>({x:W*layout().cx-state.cameraX*11,y:H*layout().cy-state.cameraY*8});
  const dialogOpen=()=>Boolean(document.querySelector('dialog[open]'));
  function resize(){
    const r=host.getBoundingClientRect();W=r.width;H=r.height;dpr=Math.min(devicePixelRatio||1,1.5);
    for(const c of [...canvases,buffer]){c.width=Math.round(W*dpr);c.height=Math.round(H*dpr);}
    for(const c of [...contexts,bc]){c.setTransform(dpr,0,0,dpr,0,0);c.imageSmoothingEnabled=false;}
    if(state.phase==='sleep'){state.x=state.aimX=layout().cx;state.y=state.aimY=layout().restY;}
    $('scannerLabel').style.left=layout().cx*100+'%';$('scannerLabel').style.top=(layout().cy*H-Math.min(W*.41,H*.19)-24)+'px';
    $('crystalLabel').style.left=(state.x*W+44)+'px';$('crystalLabel').style.top=(state.y*H-2)+'px';
    state.trail=[];
  }
  new ResizeObserver(resize).observe(host);resize();
  function announce(text){if(text!==lastAnnouncement){$('announcement').textContent=text;lastAnnouncement=text;}}
  function caption(title,instruction,stage){$('caption').textContent=title;$('instruction').textContent=instruction;if(stage)$('stateText').textContent=stage;announce(title+' '+instruction);}
  function wake(){if(!ready||state.phase!=='sleep')return;state.phase='explore';host.classList.add('awake');caption('Bring yourself into focus.','Guide the crystal into the scanner. Hold it steady.','01 / THE ROOM IS LISTENING');}
  function startScan(){
    state.phase='scan';state.scan=0;state.field=-1;state.vx=state.vy=0;state.pulse=1;drag=null;state.keys.clear();keyboardGuide=false;
    host.classList.add('scanning');$('tilt').hidden=true;$('scannerText').textContent='READING YOUR CONTEXT';
    caption('Stay with the light.','The connection is taking on your identity.','02 / SESSION_CONTEXT');
  }
  function complete(){
    state.phase='complete';host.classList.remove('scanning');host.classList.add('complete');$('inspect').hidden=false;$('replay').hidden=false;
    caption('Same system. Your access.','The chamber recognises your context. Explore the connection.','03 / RECOGNISED');
  }
  function reset(){
    Object.assign(state,{phase:'sleep',wake:0,travel:0,hold:0,scan:0,open:0,settle:0,field:-1,x:layout().cx,y:layout().restY,vx:0,vy:0,aimX:layout().cx,aimY:layout().restY,pulse:0,trail:[]});
    drag=null;keyboardGuide=false;state.keys.clear();host.classList.remove('awake','scanning','complete');$('inspect').hidden=$('replay').hidden=true;
    $('tilt').hidden=!window.DeviceOrientationEvent;$('tilt').textContent=tiltActive?'Re-centre tilt ↗':'Enable tilt ↗';$('scannerText').textContent='IDENTITY SCANNER';
    caption('Move. The room will notice.','Drag anywhere to steer your crystal.','01 / UNRECOGNISED');resize();
  }
  function loadImage(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Could not load '+src));im.src=src;});}
  function crop(im,rect,reference=1280){
    const scale=im.naturalWidth/reference,[x,y,w,h]=rect.map(v=>Math.round(v*scale)),cv=document.createElement('canvas');cv.width=w;cv.height=h;
    cv.getContext('2d').drawImage(im,x,y,w,h,0,0,w,h);return cv;
  }
  function ellipseCut(cv,x,y,rx,ry){const c=cv.getContext('2d');c.save();c.globalCompositeOperation='destination-out';c.beginPath();c.ellipse(x*cv.width,y*cv.height,rx*cv.width,ry*cv.height,0,0,tau);c.fill();c.restore();return cv;}
  async function prepare(){
    try{
      const [chamber,identity,packet,sigils]=await Promise.all(['7','6','3','4'].map(n=>loadImage('./assets/worlds/'+n+'.webp')));
      const scanner=crop(packet,[691,151,297,299]);ellipseCut(scanner,.51,.51,.213,.324);
      const jewel=crop(packet,[794,238,100,113]),jc=jewel.getContext('2d');
      // Keep the authored crystal; its neighbouring gate belongs to the machine.
      jc.globalCompositeOperation='destination-in';jc.beginPath();jc.moveTo(jewel.width*.45,0);jc.lineTo(jewel.width,jewel.height*.57);jc.lineTo(jewel.width*.47,jewel.height);jc.lineTo(0,jewel.height*.58);jc.closePath();jc.fill();jc.globalCompositeOperation='source-over';
      art={chamber,identity,scanner,jewel,left:crop(sigils,[28,943,550,274]),right:crop(sigils,[703,943,536,274]),sigils:fields.map(f=>crop(sigils,f.crop))};
      ready=true;$('loading').style.opacity='0';setTimeout(()=>$('loading').hidden=true,750);announce('Drag anywhere to steer the crystal into the identity scanner.');
    }catch(error){const loading=$('loading');loading.replaceChildren();const title=document.createElement('p');title.textContent='The chamber artwork could not load.';const retry=document.createElement('button');retry.textContent='Try again';retry.onclick=()=>location.reload();loading.append(title,retry);}
  }
  function local(e){const r=host.getBoundingClientRect();return{x:(e.clientX-r.left)/W,y:(e.clientY-r.top)/H};}
  host.addEventListener('pointerdown',e=>{
    if(e.target.closest('button,a')||!ready||dialogOpen()||!['sleep','explore','complete'].includes(state.phase))return;
    if(drag)return;host.setPointerCapture(e.pointerId);const p=local(e);drag={id:e.pointerId,x:p.x,y:p.y,coreX:state.x,coreY:state.y};state.aimX=state.x;state.aimY=state.y;keyboardGuide=false;
  });
  host.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId)return;const p=local(e);state.aimX=clamp(drag.coreX+p.x-drag.x,.1,.9);state.aimY=clamp(drag.coreY+p.y-drag.y,.19,.77);
    if(Math.hypot(p.x-drag.x,p.y-drag.y)>.015)wake();
  });
  function release(e){if(drag?.id!==e.pointerId)return;drag=null;if(host.hasPointerCapture(e.pointerId))host.releasePointerCapture(e.pointerId);}
  host.addEventListener('pointerup',release);host.addEventListener('pointercancel',release);host.addEventListener('lostpointercapture',()=>{drag=null;});
  function orient(e){
    if(!Number.isFinite(e.gamma)||!Number.isFinite(e.beta))return;
    rawTilt={gamma:e.gamma,beta:e.beta};neutral??={...rawTilt};
    let x=clamp((e.gamma-neutral.gamma)/24,-1,1),y=clamp((e.beta-neutral.beta)/28,-1,1);
    const angle=(screen.orientation?.angle??window.orientation??0)*Math.PI/180;
    tiltX=x*Math.cos(angle)+y*Math.sin(angle);tiltY=y*Math.cos(angle)-x*Math.sin(angle);
    if(tiltActive){clearTimeout(sensorTimer);$('sensorNote').textContent='Tilt connected. Hold your phone comfortably and re-centre whenever needed.';if(Math.abs(tiltX)+Math.abs(tiltY)>.12)wake();}
  }
  async function enableTilt(){
    if(tiltActive){neutral=rawTilt?{...rawTilt}:null;tiltX=tiltY=0;return;}
    const Device=window.DeviceOrientationEvent;
    if(!Device)return;
    try{
      if(typeof Device.requestPermission==='function'&&(await Device.requestPermission())!=='granted')throw new Error('permission');
      tiltActive=true;neutral=null;addEventListener('deviceorientation',orient);$('tilt').textContent='Re-centre tilt ↗';$('calibrate').hidden=false;
      $('instruction').textContent='Tilt gently to steer. Drag works too.';
      sensorTimer=setTimeout(()=>{if(!rawTilt){$('instruction').textContent='No tilt signal yet. Drag anywhere to steer.';$('sensorNote').textContent='No sensor signal. On iPhone use HTTPS and allow motion access. Drag controls work without a sensor.';}},3500);
    }catch{$('instruction').textContent='Tilt isn’t available. Drag anywhere to steer.';$('sensorNote').textContent='Motion access was not granted. Drag or use the arrow keys.';}
  }
  $('tilt').hidden=!window.DeviceOrientationEvent;$('tilt').onclick=enableTilt;$('calibrate').onclick=()=>{neutral=rawTilt?{...rawTilt}:null;tiltX=tiltY=0;};
  for(const d of document.querySelectorAll('dialog')){d.querySelector('.close').onclick=()=>d.close();d.addEventListener('close',()=>{last=0;});}
  $('options').onclick=()=>{drag=null;state.keys.clear();$('keyboardDock').disabled=!['sleep','explore'].includes(state.phase);$('settings').showModal();};$('inspect').onclick=()=>{drag=null;$('meaning').showModal();};$('replay').onclick=reset;
  function setGentle(value){gentle=value;host.classList.toggle('gentle',value);$('motion').setAttribute('aria-pressed',String(value));$('motion').textContent=value?'Gentle motion · on':'Gentle motion';}
  setGentle(gentle);$('motion').onclick=()=>setGentle(!gentle);reduced.addEventListener('change',e=>setGentle(e.matches));
  $('keyboardDock').onclick=()=>{if(['sleep','explore'].includes(state.phase)){wake();keyboardGuide=true;}$('settings').close();};
  addEventListener('keydown',e=>{if(dialogOpen()||e.target.closest('button,a,select,input'))return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();state.keys.add(e.key);wake();keyboardGuide=false;}});
  addEventListener('keyup',e=>state.keys.delete(e.key));addEventListener('blur',()=>{state.keys.clear();drag=null;});
  document.addEventListener('visibilitychange',()=>{last=0;drag=null;state.keys.clear();});
  addEventListener('orientationchange',()=>{neutral=null;tiltX=tiltY=0;});

  function update(dt){
    state.time+=dt;state.wake=lerp(state.wake,state.phase==='sleep'?0:1,1-Math.exp(-dt*1.8));state.pulse=Math.max(0,state.pulse-dt*1.8);
    const g=gate(),gx=g.x/W,gy=g.y/H;
    if(state.phase==='scan'){
      state.scan+=dt;const s=state.scan;
      state.x=lerp(state.x,gx,1-Math.exp(-dt*8));state.y=lerp(state.y,gy,1-Math.exp(-dt*8));
      const f=Math.min(4,Math.floor((s-.9)/1.45));
      if(f>=0&&f!==state.field){state.field=f;state.pulse=.7;const field=fields[f];caption(field.caption,field.detail,`02 / WRITING ${field.name.toUpperCase()}`);}
      if(s>8.65){state.phase='opening';state.settle=0;state.pulse=.5;$('scannerText').textContent='CONTEXT STAMPED';caption('The architecture responds.','Your identity travels with the connection.','02 / CONTEXT STAMPED');}
    }else if(state.phase==='opening'){
      state.settle+=dt;state.open=smooth(state.settle/2.8);state.x=lerp(state.x,layout().cx,dt*3);state.y=lerp(state.y,layout().cy+.06,dt*2);
      if(state.settle>=3.6){state.aimX=state.x;state.aimY=state.y;complete();}
    }else{
      const oldX=state.x,oldY=state.y;
      if(keyboardGuide){state.aimX=gx;state.aimY=gy;}
      const spring=gentle?32:22,damping=gentle?12:8.4;
      if(drag||keyboardGuide){state.vx+=(state.aimX-state.x)*spring*dt;state.vy+=(state.aimY-state.y)*spring*dt;}
      else if(tiltActive){state.vx+=tiltX*.72*dt;state.vy+=tiltY*.60*dt;}
      if(state.keys.size){state.vx+=((state.keys.has('ArrowRight')?1:0)-(state.keys.has('ArrowLeft')?1:0))*.9*dt;state.vy+=((state.keys.has('ArrowDown')?1:0)-(state.keys.has('ArrowUp')?1:0))*.75*dt;}
      state.vx*=Math.exp(-dt*(drag||keyboardGuide?damping:3));state.vy*=Math.exp(-dt*(drag||keyboardGuide?damping:3));
      state.x=clamp(state.x+state.vx*dt,.1,.9);state.y=clamp(state.y+state.vy*dt,.19,.77);
      if(state.x===.1||state.x===.9)state.vx=0;if(state.y===.19||state.y===.77)state.vy=0;
      state.travel+=Math.hypot(state.x-oldX,state.y-oldY);
      if(state.phase==='explore'){
        const distance=Math.hypot((state.x-gx)*W,(state.y-gy)*H),inside=distance<Math.min(W*.115,H*.065),stable=Math.hypot(state.vx*W,state.vy*H)<W*.34;
        state.hold=clamp(state.hold+(inside&&stable?dt/1.05:-dt*2.2));
        $('scannerText').textContent=state.hold>.03?'HOLD STEADY':'IDENTITY SCANNER';
        if(state.hold>=1)startScan();
      }
    }
    const cx=clamp((state.x-layout().cx)*2,-1,1),cy=clamp((state.y-.5)*1.5,-1,1);
    state.cameraX=lerp(state.cameraX,gentle?0:cx,1-Math.exp(-dt*2.5));state.cameraY=lerp(state.cameraY,gentle?0:cy,1-Math.exp(-dt*2.5));
    if(!gentle){state.trail.push({x:state.x*W,y:state.y*H});if(state.trail.length>16)state.trail.shift();}
  }
  function halo(c,x,y,r,color,alpha=1){c.save();c.globalAlpha=alpha;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,color.slice(0,7)+'00');c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r);c.restore();}
  function sprite(c,im,x,y,w,alpha=1){c.save();c.globalAlpha=alpha;c.drawImage(im,x-w/2,y-w*im.height/im.width/2,w,w*im.height/im.width);c.restore();}
  function warp(im,alpha){
    const t=gentle?0:state.time,zoom=1.10+(gentle?0:Math.sin(t*.12)*.025)+state.open*.16+(state.phase==='scan'?smooth(state.scan/1.2)*.025:0);
    const cover=Math.max(W/im.naturalWidth,H/im.naturalHeight)*zoom,iw=im.naturalWidth*cover,ih=im.naturalHeight*cover;
    const ox=(W-iw)/2-state.cameraX*22,oy=(H-ih)/2-state.cameraY*16+state.open*H*.03,step=im.naturalHeight/48;
    bc.save();bc.globalAlpha=alpha;bc.translate(W/2,H/2);bc.rotate(gentle?0:-state.cameraX*.016);bc.translate(-W/2,-H/2);
    for(let i=0;i<48;i++){const sy=i*step,shift=gentle?0:(Math.sin(sy*.02+t*.75)*3.2+Math.sin(sy*.007-t*.4)*2.2);bc.drawImage(im,0,sy,im.naturalWidth,Math.min(step+1,im.naturalHeight-sy),ox+shift,oy+sy*cover,iw,step*cover+1.3);}
    bc.restore();
  }
  function background(){
    bc.clearRect(0,0,W,H);warp(art.chamber,1);if(state.open>.01)warp(art.identity,state.open*.7);
    bg.clearRect(0,0,W,H);bg.drawImage(buffer,0,0,buffer.width,buffer.height,0,0,W,H);
    if(!gentle){bg.save();bg.globalCompositeOperation='screen';bg.globalAlpha=.12;bg.filter='blur(10px)';bg.drawImage(buffer,0,0,buffer.width,buffer.height,0,0,W,H);bg.restore();
      bg.save();bg.globalCompositeOperation='screen';bg.globalAlpha=.045;bg.drawImage(buffer,0,0,buffer.width,buffer.height,2+state.cameraX*3,0,W,H);bg.restore();}
    bg.fillStyle=`rgba(3,6,17,${.68-state.wake*.17-state.open*.05})`;bg.fillRect(0,0,W,H);
    const light=bg.createRadialGradient(state.x*W,state.y*H,10,state.x*W,state.y*H,Math.max(W,H)*.7);
    light.addColorStop(0,'#02051300');light.addColorStop(.32,'#02051315');light.addColorStop(1,state.phase==='sleep'?'#020513ee':'#020513b0');bg.fillStyle=light;bg.fillRect(0,0,W,H);
    if(!gentle){for(let i=0;i<34;i++){const x=((i*113.7-state.cameraX*(i%3+1)*10)%W+W)%W,y=((i*97.3-state.time*(4+i%4))%H+H)%H;bg.fillStyle=i%3?'#acdbed55':'#ceb9ff77';bg.fillRect(x,y,i%8?1:2,i%8?1:2);}}
  }
  function architecture(){
    arch.clearRect(0,0,W,H);const g=gate(),awake=state.wake,opening=state.open,t=state.time;
    const scale=Math.min(W*.90,H*.47),high=scale*art.scanner.height/art.scanner.width,tilt=gentle?0:state.cameraX*.035;
    // Separate authored halves give the machinery weight and room to open.
    const wall=state.open*W*.3;
    sprite(arch,art.left,W*.045-wall-state.cameraX*22,H*.64-state.cameraY*16,W*.64,.16+awake*.42);
    sprite(arch,art.right,W*.955+wall-state.cameraX*22,H*.64-state.cameraY*16,W*.64,.16+awake*.42);
    arch.save();arch.translate(g.x,g.y);arch.rotate(tilt);arch.scale(1,1-Math.abs(state.cameraX)*.045);
    const split=opening*scale*.44,sh=art.scanner.height,sw=art.scanner.width;
    // A dark aperture separates the interactive machine from the bright artwork.
    arch.save();arch.globalAlpha=awake*(1-opening*.85);arch.fillStyle='#030a16e8';arch.beginPath();arch.ellipse(0,0,scale*.25,high*.35,0,0,tau);arch.fill();arch.restore();
    halo(arch,0,0,scale*.48,'#529eff44',awake*.7+state.hold*.3);
    arch.globalAlpha=.08+awake*.92;
    arch.drawImage(art.scanner,0,0,sw/2,sh,-scale/2-split,-high/2,scale/2,high);
    arch.drawImage(art.scanner,sw/2,0,sw/2,sh,split,-high/2,scale/2,high);
    if(state.phase==='scan'){
      const field=fields[Math.max(0,state.field)],sweep=(state.scan*.65)%1,yy=-high*.31+sweep*high*.62;
      const beam=arch.createLinearGradient(-scale*.35,0,scale*.35,0);beam.addColorStop(0,field.color+'00');beam.addColorStop(.2,field.color+'cc');beam.addColorStop(.5,'#f6ffff');beam.addColorStop(.8,field.color+'cc');beam.addColorStop(1,field.color+'00');
      arch.fillStyle=beam;arch.fillRect(-scale*.35,yy-1,scale*.7,3);halo(arch,0,yy,scale*.4,field.color+'33',.7);
    }
    if(state.hold>0&&state.phase==='explore'){
      // Solid illuminated segments sit on the scanner, not separate UI circles.
      for(let i=0;i<12;i++){arch.fillStyle=i/12<state.hold?'#c1ffff':'#315261';arch.fillRect(-scale*.19+i*scale*.033,high*.47,scale*.022,3);}
    }
    arch.restore();
    if(opening>0){
      arch.save();arch.globalCompositeOperation='screen';arch.globalAlpha=opening*.4;
      const shaft=arch.createLinearGradient(g.x,0,g.x+W*.09,0);shaft.addColorStop(0,'#8feeff00');shaft.addColorStop(.5,'#b8fff588');shaft.addColorStop(1,'#8feeff00');arch.fillStyle=shaft;arch.fillRect(g.x-W*.045,g.y,W*.09,H*.55);arch.restore();
    }
  }
  function crystal(){
    fx.clearRect(0,0,W,H);const x=state.x*W,y=state.y*H,t=state.time,scan=state.phase==='scan',recognised=state.phase==='opening'||state.phase==='complete';
    const scale=Math.min(W*.205,86)*(1+(scan?smooth(state.scan/.9)*.4:recognised?.22:0)),color=state.field>=0?fields[state.field].color:'#67daf5';
    const bob=gentle||drag||scan?0:Math.sin(t*1.8)*2.5,angle=gentle?0:clamp(state.vx*1.1,-.2,.2)+Math.sin(t*.8)*.018;
    if(!gentle&&Math.hypot(state.vx,state.vy)>.016){fx.save();fx.globalCompositeOperation='screen';state.trail.forEach((p,i)=>{fx.fillStyle=color;fx.globalAlpha=i/state.trail.length*.2;const size=1+i/state.trail.length*3;fx.fillRect(p.x-size/2,p.y-size/2,size,size);});fx.restore();}
    // Light lands on nearby architecture; the reflection trails the moving body.
    fx.save();fx.globalCompositeOperation='screen';halo(fx,x,y,scale*1.75,color+'44',.75+state.pulse*.3);fx.restore();
    fx.save();fx.translate(x,Math.min(H*.81,y+scale*.95));fx.scale(1,.19);halo(fx,0,0,scale*1.1,color+'66',.55);fx.restore();
    fx.save();fx.translate(x,y+bob);fx.rotate(angle);fx.scale(1-Math.abs(state.cameraX)*.12,1);
    if(!gentle){fx.save();fx.globalAlpha=.10;fx.globalCompositeOperation='screen';fx.drawImage(art.jewel,-scale/2+2,-scale*.565,scale,scale*1.13);fx.restore();}
    fx.drawImage(art.jewel,-scale/2,-scale*.565,scale,scale*1.13);
    if(!gentle){
      fx.save();fx.beginPath();fx.moveTo(-scale*.04,-scale*.50);fx.lineTo(scale*.40,scale*.05);fx.lineTo(-scale*.03,scale*.48);fx.lineTo(-scale*.40,scale*.05);fx.closePath();fx.clip();
      fx.globalAlpha=.16;fx.globalCompositeOperation='screen';
      const sw=scale*dpr,sh=scale*1.13*dpr,sx=clamp((x-scale*.5+state.cameraX*20)*dpr,0,buffer.width-sw),sy=clamp((y-scale*.565+state.cameraY*20)*dpr,0,buffer.height-sh);
      fx.drawImage(buffer,sx,sy,sw,sh,-scale*.5,-scale*.565,scale,scale*1.13);fx.restore();
    }
    if(state.field>=0){
      // Identity marks are embedded in the crystal itself, never collectibles.
      const slots=[[-.12,-.13],[.13,-.13],[0,.06],[-.12,.23],[.13,.23]];
      for(let i=0;i<=state.field;i++){const p=slots[i],arrival=clamp((state.scan-(.9+i*1.45))/.7),size=scale*.20;
        fx.save();fx.globalAlpha=recognised?.85:arrival*.9;fx.translate(p[0]*scale,p[1]*scale);fx.scale(1,.88);fx.beginPath();fx.arc(0,0,size*.52,0,tau);fx.clip();fx.drawImage(art.sigils[i],-size/2,-size/2,size,size);fx.restore();}
    }
    // Reflection crossing the authored facets gives the crystal an actual surface.
    if(!gentle){
      fx.save();fx.beginPath();fx.moveTo(-scale*.04,-scale*.565);fx.lineTo(scale*.5,scale*.08);fx.lineTo(-scale*.03,scale*.565);fx.lineTo(-scale*.5,scale*.08);fx.closePath();fx.clip();
      const sweep=((t*.25)%2-1)*scale;const g=fx.createLinearGradient(sweep-scale*.15,0,sweep+scale*.15,0);g.addColorStop(0,'#ffffff00');g.addColorStop(.5,'#dfffff88');g.addColorStop(1,'#ffffff00');fx.fillStyle=g;fx.globalAlpha=.3;fx.fillRect(-scale,-scale,scale*2,scale*2);fx.restore();
    }
    fx.restore();
    if(scan&&state.field>=0){
      const burst=clamp(1-(state.scan-(.9+state.field*1.45))/.65);
      if(burst>0){fx.save();fx.globalCompositeOperation='screen';halo(fx,x,y,scale*1.5,color+'55',burst);fx.restore();}
    }
  }
  function loop(now){
    const dt=Math.min(.033,last?(now-last)/1000:0);last=now;
    if(ready&&!document.hidden&&!dialogOpen()){update(dt);background();architecture();crystal();}
    frame=requestAnimationFrame(loop);
  }
  prepare();frame=requestAnimationFrame(loop);
  addEventListener('pagehide',()=>{cancelAnimationFrame(frame);clearTimeout(sensorTimer);});
  addEventListener('pageshow',e=>{if(e.persisted){last=0;frame=requestAnimationFrame(loop);}});
})();
