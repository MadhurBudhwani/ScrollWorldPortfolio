/* Backend & Cloud: defend a working system. One cancellable scene sequence owns the
   actor, so dialogue, reactions and work never race each other. */
(() => {
  'use strict';
  const {Pet,Bug,Bubble,disintegrate,shatter}=WorldEngine;
  const $=id=>document.getElementById(id), host=$('boot'),play=$('play');
  const renderer=new TraceRenderer(host,{
    cold:['14.webp','9.webp'],engine:['15.webp','11.webp'],vault:['16.webp','11.webp'],
    cloud:['17.webp','12.webp'],delivery:['18.webp','13.webp']
  });
  const actor=new PoseActor(play,{ground:.84,charHeight:.195});
  const pet=new Pet(play),bubble=new Bubble(play);
  const prop=document.createElement('div');prop.className='stage-prop';prop.hidden=true;
  const propImage=new Image();propImage.alt='';prop.append(propImage);play.append(prop);
  const targetLabel=document.createElement('div');targetLabel.className='stage-target';targetLabel.hidden=true;play.append(targetLabel);
  let W=0,H=0,epoch=0,clock=0,frameId=0,last=0,waiters=[],choiceBox=null;
  let stage=null,stageIndex=-1,beatIndex=0,kills=0,bugs=[],spawnTimer=1,armouredCount=0;
  let paused=true,running=false,workTimer=0,workIndex=0,reactionUntil=0,talkAt=0;
  let choice={},log=[],targetX=.34,propToken=0;
  const anchor=()=>({x:actor.x.x,headY:actor.headY});
  // The scene's resting floor and actor size. walkIntoDepth drives both away
  // from these and the cut restores them, so they live in one place.
  const groundFor=()=>W>H?.90:.84, heightFor=()=>W>H?.30:.195;
  // Grab the frame the visitor is looking at before the backdrop swaps, so the
  // shards that fly off are pieces of that room and not grey filler.
  const snapScene=()=>{try{return document.querySelector('#scenery')?.toDataURL('image/webp',.72)||null;}catch{return null;}};
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=t=>{const n=Math.max(0,Math.min(1,t));return n*n*(3-2*n);};
  const leverNames=Array.from({length:32},(_,i)=>'lever-'+String(i+1).padStart(2,'0'));
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
  const qaNum=(key,fallback,lo,hi)=>{
    const v=parseFloat(qa.get(key));
    return Number.isFinite(v)&&v>=lo&&v<=hi?v:fallback;
  };
  const PEDESTAL={x:.50,scale:qaNum('depth',.95,.3,1)};
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

  /* The pull, played as a framed insert: black, then the machine fades up full
     width and vertically centred, with a slow push-in under it. */
  async function leverShot(token){
    const urls=[];
    for(const n of leverNames){
      const u=await TraceRenderer.asset('./assets/worlds/anim/'+n+'.webp',512,'webp');
      if(!alive(token))return null;
      urls.push(u);
    }
    const shot=document.createElement('div');shot.className='cine-shot';shot.setAttribute('aria-hidden','true');
    // ?shot= sizes the insert; it stays centred on both axes whatever it is.
    shot.style.setProperty('--shot-w',(qaNum('shot',.86,.3,1)*100).toFixed(1)+'%');
    const frame=new Image();frame.alt='';frame.className='cine-frame';frame.src=urls[0];
    const bolt=document.createElement('i');bolt.className='world-flash';
    shot.append(frame,bolt);host.append(shot);
    void shot.offsetWidth;shot.classList.add('is-black');
    await wait(.5);if(!alive(token))return null;
    shot.classList.add('is-up');
    await wait(.55);if(!alive(token))return null;
    const gentle=matchMedia('(prefers-reduced-motion: reduce)').matches;
    for(let i=0;i<urls.length;i++){
      if(!alive(token)){shot.remove();return null;}
      frame.src=urls[i];
      if(i===19&&!gentle){bolt.classList.remove('is-live');void bolt.offsetWidth;bolt.classList.add('is-live');}
      await wait(i===0?.14:i===urls.length-1?.22:1/12);
    }
    return {shot,frame};
  }

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
  const WORK=['desk-03','desk-08','desk-04','desk-10','desk-03','desk-07','desk-09','desk-06'];
  function measure(){
    const r=host.getBoundingClientRect(),oldW=W;W=r.width;H=r.height;
    if(oldW&&oldW!==W){const ratio=W/oldW;actor.x.x*=ratio;actor.x.target*=ratio;pet.x.x*=ratio;pet.x.target*=ratio;}
    actor.ground=groundFor();pet.ground=actor.ground;actor.charHeight=heightFor();
    prop.style.width=Math.min(W*.40,H*.235)+'px';prop.style.left=(W*targetX)+'px';
    prop.style.top=(H*actor.ground+6)+'px';
    targetLabel.style.left=(W*targetX)+'px';targetLabel.style.top=(H*actor.ground+13)+'px';
  }
  new ResizeObserver(measure).observe(host);measure();

  const STAGES = [
    {
      key: 'engine', bg: 'engine', accent: '#84f5ad',
      chapter: '01 / ENGINE ROOM', title: 'The core comes online.',
      open: 'Give me room to work and I will have this thing running.',
      spawn: { pattern: 'crawl', max: 2, speed: 22, hp: 1 },
      beats: [
        ['The engine is online. Every request now has a route to the application logic that handles it.', '.NET 10 · ASP.NET CORE', null, 'runtime'],
        ['EF Core connects the C# application to SQL Server. Migrations keep database changes alongside the code that uses them.', 'EF CORE · SQL SERVER', null, 'data'],
        ['I cache frequently needed information so the app can reuse it. Refresh rules keep that shortcut useful when the data changes.', 'REDIS', null, 'cache'],
        ['Syncs, exports and scheduled processing can run in the background. Your request does not have to carry the whole job.', 'BACKGROUND JOBS · AZURE FUNCTIONS',
          { q: 'Same engine, two front doors. Which one do you want me to build?', a: 'A web app', b: 'A desktop app', key: 'client' }, 'jobs'],
      ],
    },
    {
      key: 'vault', bg: 'vault', accent: '#f3cc70',
      chapter: '02 / THE VAULT', title: 'Now make the data unreadable.',
      open: 'They are not after me any more. They are after the vault. Keep them off it.',
      spawn: { pattern: 'crawl', max: 3, speed: 27, hp: 1, armouredEvery: 3, target: .5 },
      beats: [
        ['Sensitive values are encrypted in storage. Reading them requires the right decryption access.', 'ENCRYPTION AT REST',
          { q: 'Encrypt the whole database, or only the columns that matter?', a: 'Only the sensitive columns', b: 'The entire database', key: 'crypto' }],
        ['I updated the tables, encryption functions and stored procedures together, so existing workflows could use protected data.', 'COLUMN-LEVEL PROTECTION', null, 'data'],
        ['Audit trails and status history make changes traceable. The team can investigate what happened instead of guessing.', 'AUDIT TRAILS', null, 'data'],
        ['I implemented database encryption for IndusInd Bank and ICICI Bank, with updates across more than five hundred stored procedures.', '2 BANKS · 500+ PROCEDURES'],
      ],
    },
    {
      key: 'cloud', bg: 'cloud', accent: '#67daf5',
      chapter: '03 / UPLINK', title: 'Lift it into the cloud.',
      open: 'They can fly up here. Watch the beam — I need both hands for this.',
      spawn: { pattern: 'fly', max: 3, speed: 40, hp: 1 },
      beats: [
        ['The backend runs on Azure App Service, with Azure SQL supporting its data. The system has a home beyond a developer’s laptop.', 'APP SERVICE · AZURE SQL',
          { q: 'Should the heavy background work run beside the app, or on its own?', a: 'On its own, event-driven', b: 'Beside the app', key: 'compute' }],
        ['Documents and attachments live in Blob Storage. The app keeps the information it needs to find and use them.', 'BLOB STORAGE', null, 'cache'],
        ['Now the screen updates itself. No refresh button — when something changes, it just appears.', 'SIGNALR'],
        ['One guarded front door for every API, with rate limits and keys, and sign-in handled by the company identity everyone already uses.', 'API MANAGEMENT · ENTRA ID'],
        ['Microsoft Graph connects calendars, mail and Teams, with access controlled through configured identity and permissions.', 'MICROSOFT GRAPH', null, 'teams'],
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
    client: { a: ['Web app it is. A clear backend boundary lets a web interface use the application’s existing services.', 'ASP.NET CORE'],
              b: ['Desktop works too. At C-DAC I developed Windows Forms utilities alongside web modules and services.', 'DESKTOP APPS'] },
    crypto: { a: ['That is the approach I used for sensitive values. It needs careful changes to the queries and procedures that read them.', 'COLUMN-LEVEL ENCRYPTION'],
              b: ['Database-wide encryption protects a different layer. The choice depends on what needs protection and who must be able to read it.', 'PERFORMANCE TRADE-OFF'] },
    compute:{ a: ['Separate background processing keeps long-running work out of the user’s request.', 'AZURE FUNCTIONS'],
              b: ['That can work for smaller workloads. Separating it gives the app and background tasks more room to run as work grows.', 'WORKLOAD ISOLATION'] },
    release:{ a: ['Boring and correct. UAT is where surprises are cheap.', 'UAT SIGN-OFF'],
              b: ['I take releases through QA and UAT so problems can be caught before customers depend on the change.', 'RELEASE DISCIPLINE'] },
  };


  function pips(total,done){
    $('pips').replaceChildren();
    for(let i=0;i<total;i++){const dot=document.createElement('i');if(i<done)dot.className='on';$('pips').append(dot);}
  }
  function clearBugs(){bugs.forEach(b=>b.node.remove());bugs=[];pet.clear();targetLabel.classList.remove('under-attack');}
  function cancelRun(){
    epoch++;paused=true;running=false;actor.cancel();bubble.clear();bubble.clearHints();
    if(choiceBox){choiceBox.resolve(null);choiceBox.node.remove();choiceBox=null;}
    waiters.forEach(w=>w.resolve(false));waiters=[];clearBugs();
    play.querySelectorAll('.debris').forEach(n=>n.remove());
    host.querySelectorAll('.world-shatter').forEach(n=>n.remove());
    propToken++;prop.hidden=true;targetLabel.hidden=true;
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
      for(const [key,label]of [['a',ask.a],['b',ask.b]]){
        const b=document.createElement('button');b.className='choice-btn';b.textContent=label;
        b.onclick=()=>{if(!alive(token))return;box.remove();choiceBox=null;resolve(key);};box.append(b);
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
    const from=stage.key==='delivery'?1:-1; // bugs always from right except delivery conveyor
    const bug=new Bug(play,{pattern:spec.pattern,from,y:actor.ground,speed:spec.speed*1.35*(.92+Math.random()*.16),
      hp:armoured?2:1,target:targetX});
    bug.node.setAttribute('aria-label',armoured?'Armoured bug: tap twice to protect the vault':'Remove the bug to protect '+(stage.key==='vault'?'the vault':stage.key==='delivery'?'the release capsule':'the system'));
    bugs.push(bug);
  }
  function hit(bug){
    if(paused||document.querySelector('dialog[open]'))return;
    const killed=bug.damage();
    actor.react(killed?.65:.3);
    if(!killed)return;
    bugs=bugs.filter(b=>b!==bug);kills++;
    if(kills%2===0){nextBeat(epoch);return;}
    reactionUntil=clock+.65;
    const rFrame='desk-r'+String(1+Math.floor(Math.random()*10)).padStart(2,'0');
    actor.set(stage?.key==='engine'?rFrame:'react-01');
    bubble.hint('One more — then I can bring the next part online.');
  }
  play.addEventListener('click',e=>{const node=e.target.closest('.world-bug');if(node){const bug=bugs.find(b=>b.node===node);if(bug)hit(bug);}});

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
    await actor.walkTo(W*.72);if(!alive(token))return;
    // Begin the scene dissolve underneath the falling bricks, not after a blank screen.
    renderer.set(STAGES[stageIndex+1].bg);
    await disintegrate(host);if(!alive(token))return;
    await startStage(stageIndex+1,token);
  }
  async function startStage(i,token,arriving=false){
    if(!alive(token))return;
    stageIndex=i;stage=STAGES[i];beatIndex=0;kills=0;armouredCount=0;paused=true;running=false;
    document.documentElement.style.setProperty('--ac',stage.accent);
    renderer.set(stage.bg);renderer.dim=.23;
    $('chapter').textContent=stage.chapter;$('title').textContent=stage.title;$('intro').textContent='';
    pips(stage.beats.length,0);clearBugs();
    targetX=stage.key==='vault'?.73:stage.key==='delivery'?.73:stage.key==='cloud'?.67:.35;
    await showProp(stage.key==='vault'?'prop-vault-core':stage.key==='delivery'?'prop-capsule':null,
      stage.key==='vault'?'PROTECT THE VAULT':'RELEASE CAPSULE',token);
    if(!alive(token))return;
    const restX=stage.key==='engine'?W*.18:W*.42, petX=stage.key==='engine'?W*.06:W*.24;
    // Arriving from the breaker, he walks into the room he just powered up
    // rather than appearing in it. Everything else still starts in position.
    actor.place(arriving?-W*.16:restX);pet.x.set(arriving?-W*.34:petX);
    if(arriving){await actor.walkTo(restX);if(!alive(token))return;}
    await actor.set(stage.key==='engine'?'desk-01':'talk-10');if(!alive(token))return;
    if(stage.key==='engine'){await actor.play('desk',1,3,5);if(!alive(token))return;}
    else await actor.set('talk-05');
    if(!await speak(stage.open,null,token,{cta:'I’m ready',pose:false}))return;
    await actor.set(restPose());if(!alive(token))return;
    workTimer=0;spawnTimer=.4;paused=false;running=true;
    bubble.hint(stage.key==='vault'?'Tap the bugs before they reach the vault.':stage.key==='delivery'?'Clear the conveyor. Arm the next release gate.':'Tap the bugs. Two cleared unlock the next piece.');
  }
  async function finish(token){
    paused=true;running=false;clearBugs();pips(0,0);prop.hidden=true;targetLabel.hidden=true;
    $('chapter').textContent='SYSTEM READY';$('title').textContent='The whole thing, running.';
    await actor.set('react-03');if(!alive(token))return;
    const line='My work has taken me from freelance websites to government records, banking and enterprise safety systems. Each added another piece of this experience.';
    record('System ready',line);
    if(await speak(line,'BACKEND · CLOUD · DELIVERY',token,{cta:'Open my boot log',tone:'win',pose:false}))openLog();
  }
  async function coldStart(){
    cancelRun();const token=epoch;
    stage=null;stageIndex=-1;log=[];choice={};$('traceCount').textContent='0';
    renderer.set('cold');renderer.dim=.12;document.documentElement.style.setProperty('--ac','#f3cc70');
    $('chapter').textContent='00 / COLD START';$('title').textContent='You’re inside the system now.';
    $('intro').textContent='I’ll walk you through every layer we’ve got running — from the engine to the release pipeline.';
    pips(0,0);measure();actor.place(W*.42);pet.x.set(W*.24);
    await actor.set('talk-10');if(!alive(token))return;
    if(!await speak('We start at the core. Watch what happens when we bring the engine online.',null,token,{cta:'Boot it up',pose:false}))return;
    $('intro').textContent='';
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
    shot.shot.remove();
    await shatter(host,{origin:{x:.42,y:.5},tone:'#84f5ad',snapshot:torn});if(!alive(token))return;
    await startStage(0,token,true);
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
      if(running&&!paused&&stage){
        workTimer+=delta;spawnTimer-=delta;
        if(reactionUntil&&clock>=reactionUntil){reactionUntil=0;actor.set(restPose());}
        if(stage.key==='engine'&&!reactionUntil&&workTimer>2.1){workTimer=0;actor.set(WORK[++workIndex%WORK.length]);}
        if(bugs.filter(b=>!b.dead).length<stage.spawn.max&&spawnTimer<=0){spawnBug();spawnTimer=1.05+Math.random()*.4;}
        bugs=bugs.filter(b=>!b.dead);
        let underAttack=false;
        for(const b of bugs){
          b.target=stage.key==='engine'?actor.x.x/W:targetX;
          const arrived=b.update(delta,W,H);
          // Fire when bug enters a zone 22% of screen width before the target —
          // the projectile intercepts it before it can reach the actor.
          const distToTarget=Math.abs(b.p*W - b.target*W);
          if(distToTarget<W*.22)pet.fire(b);
          if(arrived)underAttack=true;
        }
        targetLabel.classList.toggle('under-attack',underAttack);
      }
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
  $('restart').onclick=()=>{$('options').close();coldStart();};
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
      $('loading').remove();coldStart();
    }catch{
      $('loading').querySelector('p:last-child').textContent='The artwork could not load. Reload to try again.';
      const retry=document.createElement('button');retry.textContent='Reload world';retry.onclick=()=>location.reload();$('loading').append(retry);
    }
  }
  start();
})();
