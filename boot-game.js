/* Backend & Cloud: defend a working system. One cancellable scene sequence owns the
   actor, so dialogue, reactions and work never race each other. */
(() => {
  'use strict';
  const {Pet,Bug,Bubble,Web,disintegrate,shatter}=WorldEngine;
  const $=id=>document.getElementById(id), host=$('boot'),play=$('play');
  const renderer=new TraceRenderer(host,{
    cold:['14.webp','9.webp'],engine:['15.webp','11.webp'],vault:['16.webp','11.webp'],
    cloud:['17.webp','12.webp'],
    'cloud-yellow':['cloud-yellow.png','17.webp'],
    'cloud-orange':['cloud-orange.png','17.webp'],
    'cloud-red':['cloud-red.png','17.webp'],
    delivery:['18.webp','13.webp']
  });
  const actor=new PoseActor(play,{ground:.84,charHeight:.195});
  const pet=new Pet(play),bubble=new Bubble(play),web=new Web(play);
  const prop=document.createElement('div');prop.className='stage-prop';prop.hidden=true;
  const propImage=new Image();propImage.alt='';prop.append(propImage);play.append(prop);
  const targetLabel=document.createElement('div');targetLabel.className='stage-target';targetLabel.hidden=true;play.append(targetLabel);
  // Transparent effects only: the structural beam and castle remain the ones
  // painted into the cloud artwork underneath this canvas.
  const cloudFx=document.createElement('canvas');cloudFx.className='cloud-fx';cloudFx.hidden=true;cloudFx.setAttribute('aria-hidden','true');
  const cloudC=cloudFx.getContext('2d');play.append(cloudFx);
  let W=0,H=0,epoch=0,clock=0,frameId=0,last=0,waiters=[],choiceBox=null;
  let stage=null,stageIndex=-1,beatIndex=0,kills=0,bugs=[],spawnTimer=1,armouredCount=0;
  let paused=true,running=false,workTimer=0,workIndex=0,reactionUntil=0,talkAt=0;
  let choice={},log=[],targetX=.34,propToken=0;
  const anchor=()=>({x:actor.x.x,headY:actor.headY});
  // The scene's resting floor and actor size. walkIntoDepth drives both away
  // from these and the cut restores them, so they live in one place.
  const groundFor=()=>stage?.ground??(W>H?.90:.84);
  const heightFor=()=>stage?.actorHeight??(W>H?.30:.195);
  // Grab the frame the visitor is looking at before the backdrop swaps, so the
  // shards that fly off are pieces of that room and not grey filler.
  const snapScene=()=>{try{return document.querySelector('#scenery')?.toDataURL('image/webp',.72)||null;}catch{return null;}};
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>{const n=Math.max(0,Math.min(1,t));return n*n*(3-2*n);};
  const leverNames=Array.from({length:32},(_,i)=>'lever-'+String(i+1).padStart(2,'0'));
  const failNames=Array.from({length:16},(_,i)=>'fail-'+String(i+1).padStart(2,'0'));
  /* Centre of the laptop screen inside a desk-* frame, measured off the art.
     It is what the bugs are actually coming for, so the fight has to be able to
     find it wherever the pose happens to put him. */
  const LAPTOP={x:.721,y:.420}, ROPE_Y=.13, KILLS_PER_BEAT=5;
  /* Only the desk-0* frames draw the laptop where LAPTOP says it is; desk-r* is
     a different set of reaction art. Read the anchor from a working frame and
     hold it, so a reaction does not teleport what the bugs are walking toward. */
  let laptopMark=null;
  function laptopAt(){
    if(/^desk-\d/.test(actor.pose||'')){
      const p=actor.mapPoint(LAPTOP.x,LAPTOP.y);
      if(p)laptopMark=p;
    }
    return laptopMark;
  }
  let laptopHp=0,laptopMax=0,attempts=0,undefended=0;

  const health=document.createElement('div');health.className='laptop-health';
  health.setAttribute('aria-hidden','true');health.hidden=true;play.append(health);
  const sniper=document.createElement('div');sniper.className='sniper-hud';sniper.setAttribute('aria-hidden','true');
  const sniperVeil=document.createElement('i');sniperVeil.className='sniper-veil';
  const sniperScope=document.createElement('i');sniperScope.className='sniper-scope';
  const rifle=new Image();rifle.className='sniper-rifle';rifle.alt='';rifle.src='./assets/worlds/sniper-foreground.png';
  const muzzle=document.createElement('i');muzzle.className='sniper-muzzle';
  // Keep the optic outside #play: the world beneath it magnifies while the
  // scope glass, crosshair and rifle remain a stable first-person HUD.
  sniper.append(sniperVeil,sniperScope,rifle,muzzle);host.append(sniper);
  let aiming=false,aimX=0,aimY=0,aimPointer=null;
  function renderHealth(){
    health.hidden=!laptopMax;
    if(!laptopMax)return;
    health.dataset.left=String(laptopHp);
    health.dataset.label=stage?.key==='vault'?'VAULT':stage?.key==='cloud'?'UPLINK':'LAPTOP';
    health.innerHTML='';
    const row=document.createElement('div');row.className='row';
    for(let i=0;i<laptopMax;i++){
      const seg=document.createElement('i');
      if(i<laptopHp)seg.className='on';
      row.append(seg);
    }
    health.append(row);
  }
  function strike(){
    host.classList.remove('is-struck');void host.offsetWidth;host.classList.add('is-struck');
    setTimeout(()=>host.classList.remove('is-struck'),400);
  }
  /* A bug that gets there does not bite and linger: it fastens onto the laptop
     and is drawn into it, which is why the screen takes the hit a beat later. */
  function consume(bug){
    if(bug.consumed||bug.dead)return;
    bug.consumed=true;bug.node.classList.add('absorbed');
    setTimeout(()=>{
      bug.dead=true;bug.node.remove();bugs=bugs.filter(b=>b!==bug);
      if(!running)return;
      laptopHp=Math.max(0,laptopHp-1);renderHealth();strike();
      announce(laptopHp?`Laptop damaged. ${laptopHp} left.`:'The laptop is gone.');
      if(laptopHp<=0)defeat(epoch);
    },460);
  }
  function consumeVault(bug){
    if(bug.consumed||bug.dead)return;
    bug.consumed=true;bug.node.classList.add('absorbed');
    setTimeout(()=>{
      bug.dead=true;bug.node.remove();bugs=bugs.filter(b=>b!==bug);
      if(!running||stage?.key!=='vault')return;
      laptopHp=Math.max(0,laptopHp-1);renderHealth();strike();
      prop.classList.remove('is-hit');void prop.offsetWidth;prop.classList.add('is-hit');
      announce(laptopHp?`Vault integrity: ${laptopHp}.`:'The vault seal is down.');
      if(laptopHp<=0)vaultDefeat(epoch);
    },460);
  }
  function consumeCloud(bug){
    if(bug.consumed||bug.dead)return;
    bug.consumed=true;bug.dead=true;bug.node.remove();bugs=bugs.filter(b=>b!==bug);
    if(!running||stage?.key!=='cloud')return;
    laptopHp=Math.max(0,laptopHp-1);renderHealth();strike();
    announce(laptopHp?`A packet was intercepted. Uplink integrity: ${laptopHp}.`:'The uplink has been severed.');
    if(laptopHp<=0)uplinkDefeat(epoch);
  }
  async function uplinkDefeat(token){
    if(!alive(token)||stage?.key!=='cloud')return;
    paused=true;running=false;clearBugs();
    bubble.hint('The uplink collapsed. Re-establishing the secure channel.');
    await wait(1.15);if(!alive(token))return;
    await startStage(2,token);
  }
  async function vaultDefeat(token){
    if(!alive(token)||stage?.key!=='vault')return;
    paused=true;running=false;aiming=false;sniper.classList.remove('is-aiming');
    sniper.classList.remove('is-live','is-firing');host.classList.remove('is-sniping','is-scoped');
    clearBugs();prop.classList.add('breached');
    bubble.hint('The seal broke. Rebuilding the defence.');
    await wait(1.15);if(!alive(token))return;
    prop.classList.remove('breached','is-hit');
    await startStage(1,token);
  }
  const awayNames=Array.from({length:8},(_,i)=>'away-'+String(i+1).padStart(2,'0'));

  /* The cold-start wallpaper already contains a lever, drawn head-on in the
     middle distance. Cutting straight from that to a side-on lever sprite reads
     as two different objects, so instead he turns his back and walks to the one
     in the artwork, shrinking into it, and the pull is presented as its own
     shot. The mismatch becomes a deliberate cut rather than a mistake. */
  /* Distance is carried by size alone; the floor line does not move. Raising
     the ground toward the walkway looked correct on paper but read as him
     lifting off, because he starts in the dark foreground where no floor is
     drawn, so there is nothing for the rise to travel along. Holding the feet
     on one line and shrinking him is the cue that actually reads.
     ?depth= overrides the shrink so it can be judged on a real phone without a
     redeploy; ?walk= does the same for how long the recede takes. */
  const qa=new URLSearchParams(location.search);
  // Temporary development entry point. Set back to null when the complete
  // progression should start from the cold room again.
  const DEBUG_START_STAGE=null;
  const qaNum=(key,fallback,lo,hi)=>{
    const v=parseFloat(qa.get(key));
    return Number.isFinite(v)&&v>=lo&&v<=hi?v:fallback;
  };
  const PEDESTAL={x:.50,scale:qaNum('depth',.85,.3,1)};
  async function walkIntoDepth(token){
    const h0=actor.charHeight,g0=actor.ground,x0=actor.x.x,seconds=qaNum('walk',3.5,.4,8),fps=9;
    await actor.preload(awayNames);if(!alive(token))return false;
    actor.cancelWalk();
    await actor.set(awayNames[0]);if(!alive(token))return false;
    play.classList.add('is-receding');
    // The pose's foot inset scales with him, so the ground line is nudged by
    // exactly that much each frame and his shoes stay on one line.
    const gap=h=>actor.footInset()*Math.min(H*h,W*.62), gap0=gap(h0);
    const t0=clock;let step=0,due=clock;
    while(clock-t0<seconds){
      if(!alive(token))return false;
      const e=smooth((clock-t0)/seconds);
      const h=mix(h0,h0*PEDESTAL.scale,e);
      actor.charHeight=h;
      actor.ground=g0+(gap(h)-gap0)/H;
      actor.x.set(mix(x0,W*PEDESTAL.x,e));
      if(clock>=due){due=clock+1/fps;actor.set(awayNames[step++%8]);}
      await wait(1/60);
    }
    return alive(token);
  }

  /* The room notices before he does. The wallpaper's amber lamp is part of the
     artwork, so a red bloom is laid over it and the set flinches underneath.
     23% rather than the artwork's own 25% because the backdrop is drawn at a
     1.09 cover zoom about the centre, which pulls everything toward the middle. */
  async function alarm(token){
    const lamp=document.createElement('i');lamp.className='alarm-lamp';
    // ?lamp= nudges the bloom onto the drawn lamp if the cover zoom shifts.
    lamp.style.top=(qaNum('lamp',.23,.05,.6)*100).toFixed(1)+'%';
    const wash=document.createElement('i');wash.className='alarm-wash';
    for(const n of [lamp,wash]){n.setAttribute('aria-hidden','true');play.append(n);}
    // He flinches on the same frame the room does. Setting the pose after the
    // alarm meant he stood there calmly through the whole shake and only reacted
    // once the line appeared.
    actor.set('react-01');
    host.classList.add('is-alarmed');
    announce('Warning: intrusion detected.');
    await wait(1.7);
    host.classList.remove('is-alarmed');lamp.remove();wash.remove();
    return alive(token);
  }

  /* A framed insert: black, then the artwork fades up centred with a slow
     push-in under it. Used for the lever and for losing the laptop, so the two
     moments are presented the same way. */
  async function cineShot(token,names,{fps=12,onFrame=null,caption=null}={}){
    const urls=[];
    for(const n of names){
      const u=await TraceRenderer.asset('./assets/worlds/anim/'+n+'.webp',512,'webp');
      if(!alive(token))return null;
      urls.push(u);
    }
    const shot=document.createElement('div');shot.className='cine-shot';shot.setAttribute('aria-hidden','true');
    shot.style.setProperty('--shot-w',(qaNum('shot',.5,.3,1)*100).toFixed(1)+'%');
    const frame=new Image();frame.alt='';frame.className='cine-frame';frame.src=urls[0];
    const bolt=document.createElement('i');bolt.className='world-flash';
    const glow=document.createElement('i');glow.className='cine-glow';
    const grain=document.createElement('i');grain.className='cine-grain';
    const motes=document.createElement('i');motes.className='cine-motes';
    for(let i=0;i<16;i++){
      const m=document.createElement('b');
      m.style.left=(Math.random()*100).toFixed(1)+'%';
      m.style.setProperty('--drift',((Math.random()-.5)*60).toFixed(0)+'px');
      m.style.setProperty('--size',(1+Math.random()*2.2).toFixed(1)+'px');
      m.style.animationDuration=(5+Math.random()*6).toFixed(1)+'s';
      m.style.animationDelay=(-Math.random()*8).toFixed(1)+'s';
      motes.append(m);
    }
    for(const n of [glow,grain,motes]) n.setAttribute('aria-hidden','true');
    shot.append(glow,motes,frame,grain,bolt);
    let line=null;
    if(caption){line=document.createElement('p');line.className='cine-line';line.textContent=caption;shot.append(line);}
    host.append(shot);
    void shot.offsetWidth;shot.classList.add('is-black');
    await wait(.5);if(!alive(token))return null;
    shot.classList.add('is-up');
    await wait(.55);if(!alive(token))return null;
    const gentle=matchMedia('(prefers-reduced-motion: reduce)').matches;
    for(let i=0;i<urls.length;i++){
      if(!alive(token)){shot.remove();return null;}
      frame.src=urls[i];
      onFrame?.(i+1,{shot,bolt,gentle});
      await wait(i===0?.14:i===urls.length-1?.22:1/fps);
    }
    return {shot,frame};
  }
  const leverShot=token=>cineShot(token,leverNames,{fps:12,onFrame:(n,{bolt,shot,gentle})=>{
    if(n!==20||gentle)return;
    bolt.classList.remove('is-live');void bolt.offsetWidth;bolt.classList.add('is-live');
    shot.classList.add('is-charged');
  }});

  /* Paint the insert into a canvas at its on-screen framing, so the shards that
     blow it apart are pieces of the shot the visitor was just watching. */
  function snapCine(frame){
    try{
      const r=host.getBoundingClientRect(),cv=document.createElement('canvas');
      cv.width=Math.round(r.width);cv.height=Math.round(r.height);
      const c=cv.getContext('2d');c.imageSmoothingEnabled=false;
      c.fillStyle='#000';c.fillRect(0,0,cv.width,cv.height);
      c.drawImage(frame,0,Math.round((cv.height-cv.width)/2),cv.width,cv.width);
      return cv.toDataURL('image/webp',.72);
    }catch{return null;}
  }
  const alive=token=>token===epoch;
  const record=(heading,text)=>{log.push({heading,text});$('traceCount').textContent=String(log.length);};
  const announce=text=>{$('live').textContent=text;};
  const wait=seconds=>new Promise(resolve=>waiters.push({until:clock+seconds,resolve}));
  const TALK=['talk-01','talk-02','talk-05','talk-03'];
  // Idle rotation while the engine stage waits. 01-03 are the arrival, so the
  // loop lives in 04-10, with typing recurring often enough that he reads as
  // working rather than posing.
  const WORK=['desk-04','desk-05','desk-06','desk-04','desk-07','desk-10','desk-08','desk-05','desk-09','desk-06'];
  function measure(){
    const r=host.getBoundingClientRect(),oldW=W;W=r.width;H=r.height;
    if(oldW&&oldW!==W){const ratio=W/oldW;actor.x.x*=ratio;actor.x.target*=ratio;pet.x.x*=ratio;pet.x.target*=ratio;}
    actor.ground=groundFor();pet.ground=actor.ground;pet.scale=stage?.petScale??1;actor.charHeight=heightFor();
    prop.style.width=Math.min(W*(stage?.propWidth??.40),H*(stage?.propHeight??.235))+'px';prop.style.left=(W*targetX)+'px';
    prop.style.top=(H*actor.ground+6)+'px';
    targetLabel.style.left=(W*targetX)+'px';targetLabel.style.top=(H*actor.ground+13)+'px';
    const fxDpr=Math.min(devicePixelRatio||1,1.5);
    cloudFx.width=Math.max(1,Math.round(W*fxDpr));cloudFx.height=Math.max(1,Math.round(H*fxDpr));
    cloudC.setTransform(fxDpr,0,0,fxDpr,0,0);
  }
  new ResizeObserver(measure).observe(host);measure();

  const threatStops=[
    [0,[177,255,207]], [.42,[244,239,92]], [.72,[255,157,48]], [1,[255,63,78]],
  ];
  function threatColour(p){
    const n=Math.max(0,Math.min(1,p));
    for(let i=1;i<threatStops.length;i++)if(n<=threatStops[i][0]){
      const [ap,a]=threatStops[i-1],[bp,b]=threatStops[i],k=(n-ap)/(bp-ap);
      return `rgb(${Math.round(mix(a[0],b[0],k))},${Math.round(mix(a[1],b[1],k))},${Math.round(mix(a[2],b[2],k))})`;
    }
    return 'rgb(255,63,78)';
  }
  function cloudGeometry(){
    const point=(x,y)=>renderer.scenePoint?.(x,y)??{x:W*x,y:H*y};
    return {castle:point(.5,.195),top:point(.5,.075),bottom:point(.5,.50)};
  }
  function curvePoint(a,q,b,t){
    const u=1-t;
    return {x:u*u*a.x+2*u*t*q.x+t*t*b.x,y:u*u*a.y+2*u*t*q.y+t*t*b.y};
  }
  function curvePath(c,a,q,b,end=1){
    const steps=Math.max(2,Math.ceil(30*end));c.beginPath();c.moveTo(a.x,a.y);
    for(let i=1;i<=steps;i++){const p=curvePoint(a,q,b,end*i/steps);c.lineTo(p.x,p.y);}
  }
  function drawCloudFx(geo){
    cloudC.clearRect(0,0,W,H);
    if(!geo||cloudFx.hidden)return;
    const c=cloudC,top=Math.max(-20,geo.top.y),bottom=Math.min(H*.76,geo.bottom.y);
    const beamH=bottom-top;if(beamH<60)return;
    const beamX=(geo.top.x+geo.bottom.x)*.5,beamW=Math.max(18,Math.min(44,W*.075));
    c.save();c.globalCompositeOperation='screen';

    // Energy bands rise inside the beam already painted into the wallpaper.
    // Each has a bright leading edge and a longer dim tail, so this reads as
    // upward transport rather than a generic opacity pulse.
    for(let i=0;i<5;i++){
      const phase=(clock*.31+i/5)%1,y=bottom-phase*beamH;
      const alpha=Math.sin(Math.PI*phase)*.46;
      const glow=c.createLinearGradient(beamX-beamW,0,beamX+beamW,0);
      glow.addColorStop(0,'rgba(117,255,190,0)');
      glow.addColorStop(.34,`rgba(117,255,190,${(alpha*.24).toFixed(3)})`);
      glow.addColorStop(.5,`rgba(225,255,232,${alpha.toFixed(3)})`);
      glow.addColorStop(.66,`rgba(117,255,190,${(alpha*.24).toFixed(3)})`);
      glow.addColorStop(1,'rgba(117,255,190,0)');
      c.fillStyle=glow;c.fillRect(beamX-beamW,y-13,beamW*2,18);
      c.strokeStyle=`rgba(215,255,229,${(alpha*.72).toFixed(3)})`;c.lineWidth=1;
      c.beginPath();c.ellipse(beamX,y,beamW*.58,3.4,0,0,Math.PI*2);c.stroke();
    }

    // Decimal telemetry rides upward in separate lanes at slightly different
    // rates. Stable number sequences keep it legible instead of random noise.
    const codes=['10.42','80.86','27.18','65.02','20.48','40.96','90.01'];
    c.font='600 7px Consolas,monospace';c.textAlign='center';c.textBaseline='middle';
    for(let lane=0;lane<3;lane++)for(let row=0;row<6;row++){
      const phase=(clock*(.105+lane*.012)+row/6+lane*.19)%1;
      const y=bottom-phase*beamH,x=beamX+(lane-1)*beamW*.42+Math.sin(clock*1.4+row)*1.2;
      const fade=Math.sin(Math.PI*phase)*.72;
      c.fillStyle=`rgba(201,255,222,${fade.toFixed(3)})`;c.shadowColor='#76ffc1';c.shadowBlur=5;
      c.fillText(codes[(row+lane*2)%codes.length],x,y);
    }
    c.shadowBlur=0;

    // A latch establishes in stages: probe rail, advancing handshake, three
    // locking nodes, then data pulses. Colour conveys the three-second danger
    // window from safe green through amber to final red.
    for(const bug of bugs){
      if(bug.dead||bug.phase!=='latched')continue;
      const progress=Math.max(0,Math.min(1,bug.latchTime/3)),grown=smooth(progress);
      const colour=threatColour(progress);bug.node.style.setProperty('--link-colour',colour);
      const a={x:bug.x,y:bug.y-5},b=geo.castle;
      const side=Math.sign(a.x-b.x)||1;
      const q={x:(a.x+b.x)*.5+side*Math.min(28,W*.055),y:Math.min(a.y,b.y)-Math.min(34,H*.045)};

      c.setLineDash([2,6]);c.lineDashOffset=-clock*22;c.strokeStyle='rgba(191,255,220,.2)';c.lineWidth=1;
      curvePath(c,a,q,b);c.stroke();c.setLineDash([]);
      curvePath(c,a,q,b,grown);c.strokeStyle=colour;c.globalAlpha=.18;c.lineWidth=7;c.shadowColor=colour;c.shadowBlur=13;c.stroke();
      curvePath(c,a,q,b,grown);c.globalAlpha=.92;c.lineWidth=1.45;c.shadowBlur=5;c.stroke();

      const tip=curvePoint(a,q,b,grown);c.globalAlpha=.95;c.fillStyle=colour;c.shadowBlur=10;
      c.beginPath();c.arc(tip.x,tip.y,2.4,0,Math.PI*2);c.fill();
      for(let lock=1;lock<=3;lock++){
        const at=lock*.25,p=curvePoint(a,q,b,at),on=grown>=at;
        c.globalAlpha=on?.9:.18;c.fillStyle=on?colour:'#bfffd9';
        c.beginPath();c.arc(p.x,p.y,on?2.1:1.25,0,Math.PI*2);c.fill();
      }
      if(grown>.18)for(let pulse=0;pulse<3;pulse++){
        const t=((clock*.72+pulse*.31)%1)*grown,p=curvePoint(a,q,b,Math.max(0,grown-t));
        c.globalAlpha=.8;c.fillStyle=colour;c.fillRect(p.x-1.5,p.y-1.5,3,3);
      }
      c.globalAlpha=.25+.22*Math.sin(clock*7);c.strokeStyle=colour;c.lineWidth=1;
      c.beginPath();c.arc(b.x,b.y,7+progress*5,0,Math.PI*2);c.stroke();
      c.globalAlpha=1;c.shadowBlur=0;
    }
    c.restore();
  }
  function syncCloudBackdrop(){
    if(stage?.key!=='cloud')return;
    const stolen=Math.max(0,laptopMax-laptopHp);
    const next=stolen>=3?'cloud-red':stolen===2?'cloud-orange':stolen===1?'cloud-yellow':'cloud';
    renderer.set(next);
  }

  const STAGES = [
    {
      key: 'engine', bg: 'engine', accent: '#84f5ad',
      chapter: '01 / ENGINE ROOM', title: 'The core comes online.',
      open: 'Everything I need is on this laptop. Keep them off it and I’ll have the rest of this running.',
      // They come in along a line at the top, walk it, then lower themselves
      // on a thread. A phone has no horizontal runway to spare, and the
      // descent is what makes the fight readable instead of frantic.
      spawn: { pattern: 'rope', max: 3, surge: 5, speed: 30, hp: 1, dropSpeed: .2 },
      /* Three stops, not four, and each one is what he is doing in plain words.
         The stack names sit underneath as the credential; the line itself never
         has to carry them. */
      beats: [
        ['Foundation first. Every other piece I add has to stand on this one.',
          '.NET 10 · ASP.NET CORE',
          // The question belongs here: the foundation is the thing both doors
          // open onto. On the jobs beat it was answering something nobody asked.
          { q: 'Same engine, two front doors. Which one do you want me to build?', a: 'A web app', b: 'A desktop app', key: 'client' }, 'runtime'],
        ['Now it remembers. What it’s told it keeps — and what it’s asked all day, it keeps within reach.',
          'EF CORE · SQL SERVER · REDIS', null, 'data'],
        ['Heavy jobs go out back. Nobody should be stuck in a queue behind someone else’s paperwork.',
          'BACKGROUND JOBS · AZURE FUNCTIONS', null, 'jobs'],
      ],
    },
    {
      key: 'vault', bg: 'vault', accent: '#f3cc70',
      chapter: '02 / THE VAULT', title: 'Hold steady. Protect the data.',
      open: 'This one isn’t mine to lose. Two banks, real account numbers. Anything that gets past me, gets to them.',
      // The large wallpaper vault becomes the play surface. Breaches open on
      // three structural ribs and the bugs climb down toward the smaller vault
      // sitting on the floor seal. Every third target carries armour.
      ground: .655, actorHeight: .09, petScale: .46, propWidth: .22, propHeight: .15,
      spawn: { pattern: 'vault-climb', max: 2, surge: 3, speed: 16, hp: 1, armouredEvery: 3, warmup: 1.05 },
      /* Three beats, same as the engine room. The banks and the five hundred
         procedures used to stand alone in a fourth beat, reading as a résumé
         bullet; they now fall out of the visitor's own choice, where the number
         is the price of a decision they just made. */
      beats: [
        ['Two banks handed me their account numbers. If this leaks it’s not my bad day — it’s theirs.',
          'INDUSIND · ICICI',
          { q: 'Lock the whole vault, or only the parts that actually hurt if they get out?', a: 'Only what hurts', b: 'The whole vault', key: 'crypto' }, 'data'],
        ['Now it’s scrambled for everyone. I built the lock, and I still can’t read what’s inside it.',
          'ENCRYPTION AT REST'],
        ['And everything leaves a footprint. Who touched it, when, what it looked like before. Nobody has to take my word for it.',
          'AUDIT TRAILS', null, 'analyze'],
      ],
    },
    {
      key: 'cloud', bg: 'cloud', accent: '#67daf5',
      chapter: '03 / UPLINK', title: 'Lift it into the cloud.',
      open: 'It’s all going up the beam now. Whatever’s out here knows it — and it’s grabbing at anything that flies past.',
      spawn: { pattern: 'fly', max: 2, speed: 26, hp: 1 },
      /* Five beats was twenty-five kills of glossary. Blob storage went — nobody
         outside the trade wonders where an attachment lives. The gateway,
         the identity and Graph were one idea told three times, so they are one
         beat. The first line is the callback: level one opened on "everything I
         need is on this laptop", and this is where it leaves the laptop. */
      beats: [
        ['Remember when all of this lived on my laptop? Not anymore. It has its own address now, and it stays awake when I don’t.',
          'AZURE APP SERVICE · AZURE SQL',
          { q: 'The heavy jobs — same roof as the app, or their own place?', a: 'Their own place', b: 'Same roof', key: 'compute' }, 'runtime'],
        ['Now the screen updates itself. No refresh button — when something changes, it just appears.',
          'SIGNALR'],
        ['One door in, and it knows your face before you knock. The same badge that opens your mail opens this.',
          'API MANAGEMENT · ENTRA ID · MS GRAPH', null, 'teams'],
      ],
    },
    {
      key: 'delivery', bg: 'delivery', accent: '#bf8cff',
      chapter: '04 / RELEASE', title: 'Getting it out is the job too.',
      open: 'Last stretch. They are riding the belt — clear them before the capsule reaches a gate.',
      spawn: { pattern: 'rail', max: 3, speed: 46, hp: 1 },
      beats: [
        ['Azure DevOps pipelines move changes through build and release steps. Problems can be caught before deployment.', 'CI/CD', null, 'devops'],
        ['Pull requests give other engineers a chance to review a change before it is merged.', 'CODE REVIEW', null, 'devops'],
        ['I coordinate QA, UAT and production releases with the team and client, so everyone knows what is ready to ship.', 'QA · UAT',
          { q: 'Client wants it live today. Straight to production, or through UAT first?', a: 'Through UAT first', b: 'Straight to production', key: 'release' }],
        ['Across enterprise .NET services, I have contributed more than twelve hundred commits and four hundred merged pull requests.', '1,200+ COMMITS · 400+ PRs'],
      ],
    },
  ];

  const CHOICE_REPLY = {
    client: { a: ['Web it is. Same engine underneath — the browser just gets its own door.', 'ASP.NET CORE'],
              b: ['Desktop works too. I built Windows Forms tools at C-DAC next to the web modules — same engine, different door.', 'DESKTOP APPS'] },
    crypto: { a: ['Same call I made. Costs you every query that touches those columns — five hundred of them, in my case.', 'COLUMN-LEVEL · 500+ PROCEDURES'],
              b: ['Safer to say out loud, heavier to live with. It guards the disk, not the person reading it off a screen.', 'FULL-DISK TRADE-OFF'] },
    compute:{ a: ['Agreed. Nobody’s screen should freeze because somebody else asked for a big report.', 'AZURE FUNCTIONS'],
              b: ['Fine while it’s small. The day one heavy job lands, everyone feels it.', 'WORKLOAD ISOLATION'] },
    release:{ a: ['Boring and correct. UAT is where surprises are cheap.', 'UAT SIGN-OFF'],
              b: ['I take releases through QA and UAT so problems can be caught before customers depend on the change.', 'RELEASE DISCIPLINE'] },
  };


  function pips(total,done){
    $('pips').replaceChildren();
    for(let i=0;i<total;i++){const dot=document.createElement('i');if(i<done)dot.className='on';$('pips').append(dot);}
  }
  function clearBugs(){
    bugs.forEach(b=>{b.node.remove();b.breachMark?.remove();});bugs=[];
    play.querySelectorAll('.breach-mark').forEach(n=>n.remove());
    pet.clear();targetLabel.classList.remove('under-attack');
  }
  function cancelRun(){
    epoch++;paused=true;running=false;actor.cancel();bubble.clear();bubble.clearHints();
    if(choiceBox){choiceBox.resolve(null);choiceBox.node.remove();choiceBox=null;}
    waiters.forEach(w=>w.resolve(false));waiters=[];clearBugs();
    play.querySelectorAll('.debris').forEach(n=>n.remove());
    host.querySelectorAll('.world-shatter').forEach(n=>n.remove());
    propToken++;prop.hidden=true;targetLabel.hidden=true;cloudFx.hidden=true;cloudC.clearRect(0,0,W,H);
    aiming=false;aimPointer=null;sniper.classList.remove('is-live','is-aiming','is-firing');host.classList.remove('is-sniping','is-scoped');
  }
  function restPose(){return stage?.key==='engine'?'desk-03':'talk-10';}
  async function speak(text,tag,token,{cta='Tap when ready',logo=null,tone='',pose=true}={}){
    bubble.clearHints();actor.stop();
    if(pose)await actor.set(TALK[talkAt++%TALK.length]);
    if(!alive(token))return false;
    // Let the actor settle before the bubble finds his head.
    await wait(.22);if(!alive(token))return false;
    announce(text);
    const done=await bubble.say(text,tag,{anchor,cta,logo,tone});
    return done&&alive(token);
  }
  function askChoice(ask,token){
    return new Promise(resolve=>{
      if(!alive(token)){resolve(null);return;}
      const box=document.createElement('div');box.className='world-bubble in choice';
      const line=document.createElement('p');line.className='bubble-line';line.textContent=ask.q;box.append(line);
      const options=document.createElement('div');options.className='choice-options';box.append(options);
      for(const [index,[key,label]]of [['a',ask.a],['b',ask.b]].entries()){
        const b=document.createElement('button');b.className='choice-btn';b.type='button';
        const keycap=document.createElement('span');keycap.className='choice-key';keycap.textContent=String.fromCharCode(65+index);
        const copy=document.createElement('span');copy.className='choice-copy';copy.textContent=label;
        const arrow=document.createElement('span');arrow.className='choice-arrow';arrow.setAttribute('aria-hidden','true');arrow.textContent='›';
        b.append(keycap,copy,arrow);
        b.onclick=()=>{if(!alive(token))return;box.remove();choiceBox=null;resolve(key);};options.append(b);
      }
      play.append(box);choiceBox={node:box,resolve};bubble.position(box,anchor);box.querySelector('button').focus({preventScroll:true});
    });
  }
  async function showProp(name,label,token){
    const request=++propToken;
    prop.className='stage-prop';prop.hidden=true;targetLabel.hidden=true;
    if(!name)return;
    const url=await TraceRenderer.asset('./assets/worlds/'+name+'.webp');
    if(!alive(token)||request!==propToken||!url)return;
    propImage.src=url;prop.hidden=false;targetLabel.textContent=label;targetLabel.hidden=false;measure();
  }
  function spawnBug(){
    const spec=stage.spawn;armouredCount++;
    const armoured=spec.armouredEvery&&armouredCount%spec.armouredEvery===0;
    // Vault bugs rotate through the gate ribs. Flying interceptors alternate
    // cloud banks so the player has to protect both sides of the beam.
    const from=stage.key==='vault'||stage.key==='cloud'?(armouredCount%2?1:-1):stage.key==='delivery'?1:-1;
    const lane=stage.key==='vault'?(armouredCount-1)%3:1;
    const bug=new Bug(play,{pattern:spec.pattern,from,y:actor.ground,speed:spec.speed*1.35*(.92+Math.random()*.16),
      hp:armoured?2:1,target:targetX,ropeY:ROPE_Y,dropSpeed:spec.dropSpeed||.10,warmup:spec.warmup,lane});
    bug.node.setAttribute('aria-label',armoured?'Armoured bug: tap twice to protect the vault':'Remove the bug to protect '+(stage.key==='vault'?'the vault':stage.key==='cloud'?'the uplink':stage.key==='delivery'?'the release capsule':'the system'));
    bugs.push(bug);
  }
  function hit(bug){
    if(paused||document.querySelector('dialog[open]'))return;
    const killed=bug.damage();
    actor.react(killed?.65:.3);
    if(!killed)return;
    bugs=bugs.filter(b=>b!==bug);kills++;
    undefended=Math.max(0,undefended-3.4);
    if(kills%KILLS_PER_BEAT===0){nextBeat(epoch);return;}
    reactionUntil=clock+.65;
    const rFrame='desk-r'+String(1+Math.floor(Math.random()*10)).padStart(2,'0');
    actor.set(stage?.key==='engine'?rFrame:'react-01');
    const left=KILLS_PER_BEAT-(kills%KILLS_PER_BEAT);
    bubble.hint(left===1?'One more and the next piece goes in.':left+' more and the next piece goes in.');
  }
  play.addEventListener('click',e=>{
    if(stage?.key==='vault')return;
    const node=e.target.closest('.world-bug');if(node){const bug=bugs.find(b=>b.node===node);if(bug)hit(bug);}
  });

  function moveScope(e){
    const r=host.getBoundingClientRect();
    const lift=e.pointerType==='touch'?78:0;
    aimX=Math.max(34,Math.min(W-34,e.clientX-r.left));
    aimY=Math.max(46,Math.min(H-46,e.clientY-r.top-lift));
    sniper.style.setProperty('--aim-x',aimX.toFixed(1)+'px');
    sniper.style.setProperty('--aim-y',aimY.toFixed(1)+'px');
    host.style.setProperty('--scope-x',aimX.toFixed(1)+'px');
    host.style.setProperty('--scope-y',aimY.toFixed(1)+'px');
    const nx=aimX/Math.max(1,W)-.5,ny=aimY/Math.max(1,H)-.5;
    sniper.style.setProperty('--rifle-x',(nx*-22).toFixed(1)+'px');
    sniper.style.setProperty('--rifle-y',(ny*-14).toFixed(1)+'px');
    sniper.style.setProperty('--rifle-r',(nx*-7+ny*3).toFixed(2)+'deg');
  }
  function beginScope(e){
    if(stage?.key!=='vault'||!running||paused||e.button>0||e.target.closest('header,.game-dock,dialog,.world-bubble'))return;
    e.preventDefault();aiming=true;aimPointer=e.pointerId;moveScope(e);
    sniper.classList.add('is-aiming');host.classList.add('is-scoped');host.setPointerCapture?.(e.pointerId);
  }
  function fireSniper(){
    sniper.classList.remove('is-firing');void sniper.offsetWidth;sniper.classList.add('is-firing');
    setTimeout(()=>sniper.classList.remove('is-firing'),220);
    const hr=host.getBoundingClientRect();
    let mark=null,best=Infinity;
    for(const bug of bugs){
      if(bug.dead||bug.consumed||bug.phase==='warn')continue;
      const r=bug.node.getBoundingClientRect();
      const x=r.left-hr.left+r.width/2,y=r.top-hr.top+r.height/2;
      const d=Math.hypot(aimX-x,aimY-y);
      if(d<Math.max(26,r.width*.72)&&d<best){best=d;mark=bug;}
    }
    const impact=document.createElement('i');impact.className='sniper-impact '+(mark?'is-hit':'is-miss');
    impact.style.left=aimX+'px';impact.style.top=aimY+'px';host.append(impact);
    setTimeout(()=>impact.remove(),520);
    if(mark)hit(mark);else announce('Shot missed.');
  }
  function releaseScope(e,fire=true){
    if(!aiming||e.pointerId!==aimPointer)return;
    if(fire){moveScope(e);fireSniper();}
    aiming=false;aimPointer=null;sniper.classList.remove('is-aiming');host.classList.remove('is-scoped');
    if(host.hasPointerCapture?.(e.pointerId))host.releasePointerCapture(e.pointerId);
  }
  host.addEventListener('pointerdown',beginScope);
  host.addEventListener('pointermove',e=>{if(aiming&&e.pointerId===aimPointer)moveScope(e);});
  host.addEventListener('pointerup',e=>releaseScope(e,true));
  host.addEventListener('pointercancel',e=>releaseScope(e,false));
  // Mobile browsers interpret a held finger as selection/context-menu input
  // unless the actual gesture surface opts out. That browser gesture was also
  // cancelling our captured pointer and closing the scope mid-hold.
  host.addEventListener('contextmenu',e=>{
    if(matchMedia('(pointer:coarse)').matches)e.preventDefault();
  });

  async function nextBeat(token){
    if(paused||!alive(token))return;
    paused=true;reactionUntil=0;pet.shots=[];
    const beat=stage.beats[beatIndex];if(!beat)return endStage(token);
    const [line,tag,ask,logo]=beat;
    pips(stage.beats.length,beatIndex+1);record(tag,line);
    if(!await speak(line,tag,token,{logo}))return;
    if(ask){
      const pick=await askChoice(ask,token);if(!pick||!alive(token))return;
      choice[ask.key]=pick;
      const reply=CHOICE_REPLY[ask.key][pick];record(reply[1],reply[0]);
      if(!await speak(reply[0],reply[1],token))return;
    }
    beatIndex++;
    if(beatIndex>=stage.beats.length)return endStage(token);
    await actor.set(restPose());if(!alive(token))return;
    paused=false;workTimer=0;spawnTimer=.55;
  }
  async function endStage(token){
    paused=true;clearBugs();actor.stop();
    if(stage?.key==='vault'){
      aiming=false;aimPointer=null;sniper.classList.remove('is-live','is-aiming');host.classList.remove('is-sniping','is-scoped');
    }
    await actor.set('react-07');if(!alive(token))return;
    prop.classList.add('charged');
    const endLines={
      engine:'The core is online. Come with me — now we protect its data.',
      vault:'The protected data is ready. Let’s give this application a home in the cloud.',
      cloud:'The services are connected. One last job: getting changes into production safely.',
      delivery:'Ready for launch. You cleared the route through every release gate.'
    };
    if(!await speak(endLines[stage.key],null,token,{cta:stage.key==='delivery'?'Launch the release':'Follow Madhur',tone:'win',pose:false}))return;
    if(stage.key==='delivery'){
      prop.classList.add('launching');await wait(1.1);if(!alive(token))return;
      return finish(token);
    }
    await actor.set('talk-10');if(!alive(token))return;
    // Finish the exit before changing rooms. The previous 72% target stopped
    // him visibly inside the frame, so the transition cut across his walk.
    await actor.walkTo(W*1.18);if(!alive(token))return;
    // Begin the scene dissolve underneath the falling bricks, not after a blank screen.
    renderer.set(STAGES[stageIndex+1].bg);
    await disintegrate(host);if(!alive(token))return;
    await startStage(stageIndex+1,token);
  }
  async function startStage(i,token,arriving=false){
    if(!alive(token))return;
    stageIndex=i;stage=STAGES[i];beatIndex=0;kills=0;armouredCount=0;paused=true;running=false;
    cloudFx.hidden=stage.key!=='cloud';
    aiming=false;aimPointer=null;sniper.classList.remove('is-live','is-aiming','is-firing');host.classList.remove('is-sniping','is-scoped');
    document.documentElement.style.setProperty('--ac',stage.accent);
    renderer.set(stage.bg);renderer.dim=.23;
    $('brief').classList.remove('is-cold','is-swept');
    $('chapter').textContent=stage.chapter;$('title').textContent=stage.title;$('intro').textContent='';
    pips(stage.beats.length,0);clearBugs();web.clear();
    // Only the engine stage has a laptop to lose. A retry gets the spare, which
    // is a worse machine, and the copy says so rather than the number changing
    // silently.
    laptopMark=null;
    laptopMax=stage.key==='engine'?(attempts?3:4):stage.key==='vault'?5:stage.key==='cloud'?4:0;
    laptopHp=laptopMax;undefended=0;renderHealth();
    targetX=stage.key==='vault'?.50:stage.key==='delivery'?.73:stage.key==='cloud'?.50:.35;
    await showProp(stage.key==='vault'?'prop-vault-core':stage.key==='delivery'?'prop-capsule':null,
      stage.key==='vault'?'PROTECT THE VAULT':'RELEASE CAPSULE',token);
    if(!alive(token))return;
    measure();
    // The objective health bar carries the label in sniper mode; a second label
    // on the same floor point would sit directly on top of it.
    if(stage.key==='vault')targetLabel.hidden=true;
    // Vault formation follows the circle already painted into the room: the
    // vault occupies its centre, with Madhur and the companion guarding its
    // open side instead of remaining in the generic centre-stage formation.
    const restX=W*(stage.key==='engine'?.18:stage.key==='vault'?.36:.42);
    const petX=W*(stage.key==='engine'?.06:stage.key==='vault'?.24:.24);
    // Arriving from the breaker, he walks into the room he just powered up
    // rather than appearing in it. Everything else still starts in position.
    actor.place(arriving?-W*.16:restX);pet.x.set(arriving?-W*.34:petX);
    if(arriving){await actor.walkTo(restX);if(!alive(token))return;}
    await actor.set(stage.key==='engine'?'desk-01':'talk-10');if(!alive(token))return;
    if(stage.key==='engine'){await actor.play('desk',1,3,5);if(!alive(token))return;}
    else await actor.set('talk-05');
    const opening=stage.key==='engine'&&attempts?RETRY_LINE:stage.open;
    if(!await speak(opening,null,token,{cta:attempts&&stage.key==='engine'?'Again':'I’m ready',pose:false}))return;
    await actor.set(restPose());if(!alive(token))return;
    // The chapter card gets swept off by the line the bugs are stringing across
    // the top: it arrives from the right and pushes the copy out of frame, so
    // the fight takes the screen over rather than appearing beside the titles.
    $('brief').classList.add('is-swept');
    await wait(.22);if(!alive(token))return;
    workTimer=0;spawnTimer=.4;paused=false;running=true;
    sniper.classList.toggle('is-live',stage.key==='vault');host.classList.toggle('is-sniping',stage.key==='vault');
    bubble.hint(stage.key==='vault'?'Hold, drag the crosshair onto a climber, release to fire. Armour takes two shots.':stage.key==='cloud'?'Stop them before they latch onto the beam. If one steals a packet, hit it before it escapes.':stage.key==='delivery'?'Clear the conveyor. Arm the next release gate.':'Tap them on the way down — that’s the easy window. Five clears the next piece.');
  }
  async function finish(token){
    paused=true;running=false;clearBugs();pips(0,0);prop.hidden=true;targetLabel.hidden=true;
    $('chapter').textContent='SYSTEM READY';$('title').textContent='The whole thing, running.';
    await actor.set('react-03');if(!alive(token))return;
    const line='My work has taken me from freelance websites to government records, banking and enterprise safety systems. Each added another piece of this experience.';
    record('System ready',line);
    if(await speak(line,'BACKEND · CLOUD · DELIVERY',token,{cta:'Open my boot log',tone:'win',pose:false}))openLog();
  }
  const DEFEAT_LINE='Everything I know how to build. None of it worth anything down here.';
  const RETRY_LINE='I keep a spare. It’s slower and it won’t take as much — so let’s not need it twice.';

  /* Losing the laptop is not a game over screen, it is the same framed insert
     the lever gets. Then we drop straight back to the first bug rather than
     replaying the walk in, because the story beat already happened. */
  async function defeat(token){
    if(!alive(token))return;
    paused=true;running=false;clearBugs();web.clear();
    laptopHp=0;renderHealth();
    announce('The laptop is destroyed. Starting again.');
    const shot=await cineShot(token,failNames,{fps:9,caption:DEFEAT_LINE});
    if(!shot||!alive(token))return;
    await wait(1.3);if(!alive(token))return;
    shot.shot.remove();
    attempts++;
    await startStage(0,token);
  }

  async function coldStart(){
    cancelRun();const token=epoch;
    stage=null;stageIndex=-1;log=[];choice={};$('traceCount').textContent='0';
    attempts=0;laptopMax=0;renderHealth();
    renderer.set('cold');renderer.dim=.12;document.documentElement.style.setProperty('--ac','#f3cc70');
    $('chapter').textContent='00 / COLD START';
    $('title').textContent='Let me show you around.';
    $('intro').textContent='';
    $('brief').classList.add('is-cold');
    pips(0,0);measure();actor.place(W*.42);pet.x.set(W*.24);
    await actor.set('talk-10');if(!alive(token))return;
    if(!await speak('We start at the core. Watch what happens when we bring the engine online.',null,token,{cta:'Boot it up',pose:false}))return;

    if(!await alarm(token))return;
    if(!await speak('Okay. That’s new. Something got in, and whatever it is, it bites. Keep them off me — I’ll handle the rest.',null,token,{cta:'I’ve got your back',pose:false}))return;
    await actor.set('talk-05');if(!alive(token))return;
    // The artwork only ever shows one pull, so the middle clause cannot promise
    // an off-and-on. Everything else about the joke stays where it was.
    if(!await speak('See that lever? Best thing a senior ever taught me. Don’t laugh — it works, and it takes them out with it.',null,token,{cta:'Pull it',pose:false}))return;

    // He turns his back and walks to the lever that is already drawn into the
    // wallpaper, shrinking as he goes.
    if(!await walkIntoDepth(token))return;
    const shot=await leverShot(token);
    if(!shot||!alive(token))return;
    record('Cold start','Pulled the main breaker. The engine room lit up.');
    // The insert is torn apart from the lever's own contact point, and the
    // engine room is what was waiting behind it.
    const torn=snapCine(shot.frame);
    renderer.set('engine');renderer.dim=.23;
    play.classList.remove('is-receding');
    actor.ground=groundFor();actor.charHeight=heightFor();
    // Prepare the room hidden behind the outgoing shot. Previously the actor
    // was still wearing the small away/back pose here, so the opening shards
    // exposed that pose before startStage finally moved him to the desk.
    actor.place(W*.18);pet.x.set(W*.06);
    await actor.set('desk-01');if(!alive(token))return;
    shot.shot.remove();
    await shatter(host,{origin:{x:.42,y:.5},tone:'#84f5ad',snapshot:torn});if(!alive(token))return;
    // No walk-in here: the desk is part of his pose artwork, so walking on with
    // the walk-cycle sprite means arriving into an empty room and having the
    // whole workstation pop in when he sits. The shatter is the transition.
    await startStage(0,token);
  }

  async function debugStageStart(index){
    cancelRun();const token=epoch;
    stage=null;stageIndex=-1;log=[];choice={};$('traceCount').textContent='0';
    attempts=0;laptopMax=0;renderHealth();
    await startStage(index,token);
  }

  function frame(now){
    const delta=Math.min(.034,last?(now-last)/1000:0);last=now;
    const visible=!document.hidden&&!document.querySelector('dialog[open]');
    if(visible){
      clock+=delta;
      const due=waiters.filter(w=>w.until<=clock);waiters=waiters.filter(w=>w.until>clock);due.forEach(w=>w.resolve(true));
      actor.update(delta,W,H);bubble.tick(delta);
      if(choiceBox)bubble.position(choiceBox.node,anchor);
      pet.follow(Math.max(W*.09,actor.x.x-W*.17));
      pet.update(paused?0:delta,W,H);
      const cloudGeo=stage?.key==='cloud'?cloudGeometry():null;
      if(running&&!paused&&stage){
        workTimer+=delta;spawnTimer-=delta;
        if(reactionUntil&&clock>=reactionUntil){reactionUntil=0;actor.set(restPose());}
        if(stage.key==='engine'&&!reactionUntil&&workTimer>2.1){workTimer=0;actor.set(WORK[++workIndex%WORK.length]);}
        // Leaving it alone is not a strategy. The longer nothing has been killed,
        // the tighter the spawn interval gets, so standing still turns into
        // being overrun at about ten seconds.
        undefended+=delta;
        const pressure=Math.min(1,undefended/10);
        // The cap has to rise with the rate, or the ramp just queues bugs behind
        // a ceiling of four and nothing ever gets worse.
        const cap=Math.round(stage.spawn.max+pressure*(stage.spawn.surge||0));
        if(bugs.filter(b=>!b.dead).length<cap&&spawnTimer<=0){
          spawnBug();spawnTimer=(1.05+Math.random()*.4)*(1-pressure*.68);
        }
        bugs=bugs.filter(b=>!b.dead);
        const lap=stage.key==='engine'?laptopAt():null;
        const ropeAt=x=>web.sample(x,H*ROPE_Y);
        // Attack the floating castle painted at the head of the existing beam.
        // Both axes come from the renderer's live cover/parallax transform.
        const paintedBeamX=cloudGeo?.castle.x??W*.5;
        let connectorBusy=stage.key==='cloud'&&bugs.some(b=>!b.dead&&(b.phase==='latched'||b.phase==='docking'));
        let underAttack=false;
        for(const b of bugs){
          b.target=lap?lap.x/W:stage.key==='cloud'?paintedBeamX/W:targetX;b.ropeAt=ropeAt;b.goal=lap;
          if(stage.key==='cloud'){
            b.anchorY=Math.max(.08,Math.min(.62,cloudGeo.castle.y/H));
            b.targetY=Math.max(.12,Math.min(.68,(cloudGeo.castle.y+H*.09)/H));
            const ownsConnector=b.phase==='latched'||b.phase==='docking';
            b.canLatch=ownsConnector||!connectorBusy;
          }
          const arrived=b.update(delta,W,H);
          if(stage.key==='cloud'&&(b.phase==='latched'||b.phase==='docking'))connectorBusy=true;
          if(stage.key==='cloud'&&b.phase==='escape')b.node.style.setProperty('--packet-colour',threatColour(b.escapeProgress));
          // Fire when bug enters a zone 22% of screen width before the target —
          // the projectile intercepts it before it can reach the actor.
          // The dog covers the floor. Anything still on the rope or on its thread
          // is the player's to deal with — that window is the whole point of the
          // slow descent, and letting the dog clear it made the fight play itself.
          const onFoot=b.pattern!=='fly'&&(b.pattern!=='rope'||b.phase==='crawl'||b.phase==='climb');
          const distToTarget=Math.abs(b.p*W - b.target*W);
          if(stage.key!=='vault'&&onFoot&&distToTarget<W*.22)pet.fire(b);
          if(arrived){
            underAttack=true;
            if(lap)consume(b);else if(stage.key==='vault')consumeVault(b);
          }
          if(stage.key==='cloud'&&b.escaped)consumeCloud(b);
        }
        web.update(delta,W,H,bugs,ROPE_Y,stage.spawn.pattern==='rope');
        if(laptopMax){
          // Sits under the pair of them rather than floating in a corner, so it
          // reads as their health and not as chrome.
          const healthW=health.offsetWidth||104,healthH=health.offsetHeight||30;
          const wantedLeft=stage.key==='cloud'?paintedBeamX:stage.key==='vault'?W*targetX:actor.x.x-W*.085;
          health.style.left=Math.round(Math.max(healthW/2+10,Math.min(W-healthW/2-10,wantedLeft)))+'px';
          health.style.top=Math.round(Math.min(H*actor.ground+10,H-healthH-18))+'px';
        }
        targetLabel.classList.toggle('under-attack',underAttack);
      }
      syncCloudBackdrop();
      drawCloudFx(cloudGeo);
    }
    frameId=requestAnimationFrame(frame);
  }
  addEventListener('pagehide',()=>{cancelAnimationFrame(frameId);last=0;});
  addEventListener('pageshow',e=>{if(e.persisted){last=0;frameId=requestAnimationFrame(frame);}});
  frameId=requestAnimationFrame(frame);

  const TOPICS=[
    ['A responsive backend','.NET 10 · EF Core · Redis','ASP.NET Core handles requests, EF Core maps application data to SQL Server, and suitable repeated reads can be cached.','Each component has a clear job, which helps the system remain maintainable.','Caching requires freshness rules. Permission caches also need version checks; they do not bypass access controls.'],
    ['Protecting stored values','Database encryption','I implemented encryption for sensitive database values, including table structures, functions and stored procedures.','Protected values need the appropriate decryption access. Key management and access controls remain essential.','IndusInd Bank and ICICI Bank; updates across 500+ stored procedures. Five banks refers separately to API integration work.'],
    ['Keeping long work off a request','Background jobs','Syncs, exports and scheduled tasks can run separately from a user’s request.','The application can respond while background work completes and reports its result.','Azure Functions and worker services; deployment and workload choices depend on the job.'],
    ['Connecting cloud services','Azure services','App Service, Azure SQL and Blob Storage host the application and its data. SignalR delivers live updates; Entra ID and API Management control entry.','Services work together as an application people can use.','Microsoft Graph connects workplace information using configured identity and permission flows.'],
    ['Releasing with the team','Review → QA → UAT → Production','Pull requests, testing and client coordination help determine what is ready to release.','A release is a team decision supported by evidence, with a plan for deployment.','Azure DevOps pipelines; 1,200+ commits and 400+ merged pull requests.']
  ];
  function topics(){
    const sel=$('topic');sel.replaceChildren();TOPICS.forEach((t,i)=>sel.add(new Option(t[0],String(i))));
    const show=()=>{const t=TOPICS[Number(sel.value)||0];$('detailHeading').textContent=t[1];$('detailText').textContent=t[2];$('detailBenefit').textContent=t[3];$('detailTech').textContent=t[4];};
    sel.onchange=show;show();
  }
  function openLog(){
    const sel=$('logSelect');sel.replaceChildren();log.forEach((s,i)=>sel.add(new Option((i+1)+' · '+s.heading,String(i))));
    const show=()=>{const s=log[Number(sel.value)||0];$('logHeading').textContent=s?.heading||'Ready when you are';$('logText').textContent=s?.text||'Wake the machine to begin your run.';};
    sel.onchange=show;show();$('traceLog').showModal();
  }
  $('explain').onclick=()=> $('details').showModal();
  $('journal').onclick=openLog;$('menuButton').onclick=()=> $('options').showModal();
  $('restart').onclick=()=>{
    $('options').close();
    DEBUG_START_STAGE==null?coldStart():debugStageStart(DEBUG_START_STAGE);
  };
  const gentle=matchMedia('(prefers-reduced-motion: reduce)').matches;
  host.classList.toggle('gentle',gentle);$('motion').setAttribute('aria-pressed',String(gentle));
  $('motion').onclick=e=>{
    const on=host.classList.toggle('gentle');e.currentTarget.setAttribute('aria-pressed',String(on));renderer.gentle=on;actor.gentle=on;
  };
  document.querySelectorAll('dialog').forEach(d=>d.querySelector('.close').onclick=()=>d.close());
  host.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=host.getBoundingClientRect();renderer.target={x:(e.clientX-r.left)/r.width*2-1,y:(e.clientY-r.top)/r.height*2-1};});
  host.addEventListener('pointerleave',()=>renderer.target={x:0,y:0});
  topics();
  const warm=['talk-10','talk-01','talk-02','talk-03','talk-05',
    'desk-01','desk-02','desk-03','desk-04','desk-05','desk-06','desk-07','desk-08','desk-09','desk-10',
    'desk-r01','desk-r02','desk-r03','desk-r04','desk-r05','desk-r06','desk-r07','desk-r08','desk-r09','desk-r10',
    'react-01','react-03','react-07'];
  async function start(){
    try{
      const loaded=await renderer.ready;
      if(!loaded)throw new Error('Background artwork unavailable');
      await actor.preload(warm.slice(0,5));
      actor.preload(warm.slice(5));
      actor.preload(Array.from({length:32},(_,i)=>'lever-'+String(i+1).padStart(2,'0')));
      for(const name of ['bug','bug-armour','runtime','data','cache','jobs'])TraceRenderer.asset('./assets/worlds/icon-'+name+'.webp');
      $('loading').remove();
      DEBUG_START_STAGE==null?coldStart():debugStageStart(DEBUG_START_STAGE);
    }catch{
      $('loading').querySelector('p:last-child').textContent='The artwork could not load. Reload to try again.';
      const retry=document.createElement('button');retry.textContent='Reload world';retry.onclick=()=>location.reload();$('loading').append(retry);
    }
  }
  start();
})();
