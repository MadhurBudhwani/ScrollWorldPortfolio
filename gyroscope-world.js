/* Plain-language, action-led illustrations. Data below is fictional demonstration data. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
  const button=(text,fn,cls)=>{const b=el('button',text,cls);b.type='button';b.onclick=fn;return b;};
  const order=['design','access','cache','protect','search'];
  const chapters={
    design:['01 / SYSTEM ARCHITECTURE','An idea becomes an application.','I design complete applications from scratch. Build one, then change what it needs to do.'],
    access:['02 / SECURITY BY DESIGN','Same question. Different access.','Two people ask for incident reports. Their company and role decide what comes back.'],
    cache:['03 / ARCHITECTURE + PERFORMANCE','Remember the answer. Check it’s current.','Reusing permission information avoids repeating the full lookup for every request.'],
    protect:['04 / PROTECTION + ACCOUNTABILITY','Protect the value. Record the change.','Sensitive stored information needs protection. Important changes need a history.'],
    search:['05 / SEARCH INTELLIGENCE','Find it—even without the perfect words.','Search across documents, attachments and work items in four different ways.']
  };
  const explanations={
    design:[
      ['From scratch','I design complete applications using established engineering practices, including SOLID principles: the user experience, API boundaries, business rules, data model and connections to other services.','The parts have clear jobs and a defined way to work together.','SOLID principles · separation of concerns · dependency injection'],
      ['One responsibility','The screen presents information, the API receives requests, business rules decide what should happen, and storage keeps the data.','A change has a clear home, reducing unrelated rework.','SOLID / Single Responsibility Principle'],
      ['Extend a capability','A notification feature can be added behind an existing boundary instead of scattering delivery logic across the application.','New behaviour can be introduced with less disruption to stable code.','SOLID / Open–Closed Principle'],
      ['Replace a component','Implementations that follow the same contract should remain usable by their callers. A replacement must preserve the behaviour that callers depend on.','Components can be substituted without breaking their expected contract.','SOLID / Liskov Substitution Principle'],
      ['Keep contracts focused','A component should depend on the operations it actually needs, rather than one large interface full of unrelated features.','Small, focused interfaces reduce unnecessary coupling.','SOLID / Interface Segregation Principle'],
      ['Depend on contracts','Business logic depends on a delivery contract. Dependency injection supplies the concrete email or notification provider.','Implementations can be swapped or replaced with test doubles more easily.','SOLID / Dependency Inversion · dependency injection'],
      ['Design for change','I use established engineering practices to make applications maintainable, testable and easier to extend. The demonstrations show the intention of these boundaries, not a promise that changes require no testing.','The architecture supports the next requirement as well as the first one.','Maintainability · testability · explicit boundaries']
    ],
    access:[
      ['What I built','I built shared access-control machinery for the Safety application. The application supplies the user’s context and SQL Server applies the relevant row-access rules.','Access enforcement is part of the system, not just a button hidden on a screen.','EF Core interceptors · SQL SESSION_CONTEXT · row-level security'],
      ['Company boundaries','People from different companies can use the same system while company-scoped rules limit which records each person receives.','One company’s protected records stay outside another company’s response.','Multi-tenant isolation · CompanyId'],
      ['Role and scope','Within a company, a person’s role and permission scope can change which records are available. The fictional site-manager and company-manager examples make this difference visible.','Access can match a person’s responsibilities.','Role permissions · scoped data access'],
      ['Identity on the connection','My session interceptor resolves permission information and sets UserId, CompanyId, PermissionType, CacheKey and UserRole on the SQL connection.','The database receives the context it needs to evaluate access.','SetSessionContextInterceptor · sp_set_session_context'],
      ['The database boundary','SQL predicate functions read session context. Security policies use those predicates to filter the rows returned by protected queries.','Restricted records are filtered at the database boundary.','SQL predicate functions · security policies · RLS'],
      ['Elevated site membership','My query interceptor extends supported User.UserSites checks for target users whose own role is Global Admin or Super User. Default-site checks are deliberately left alone.','Elevated users need not have a separate stored membership row for every site.','UserSiteAccessInterceptor · expression rewriting · explicit exceptions']
    ],
    cache:[
      ['Three places to look','The session interceptor first checks its per-DbContext permission cache. If needed, it checks Redis, then falls back to a stored procedure for permission data.','Repeated permission resolution can reuse work already done.','Per-DbContext cache → Redis UserDetails → sp_GetUserPermissionData'],
      ['A new connection','A Redis permission entry can be reused after its cache key is checked against the current database cache key. This still involves validation; it is not a claim of zero database work.','A reusable permission lookup and a freshness check have different jobs.','IsCacheKeyValid · UserPermissionCache.CacheKey'],
      ['Permissions changed','In this illustration, changing permissions starts a fresh context and invalidates the saved version. A stale Redis entry leads to fresh resolution.','The system can reject stale cached permission data instead of blindly reusing it.','CacheKey validation · permission-data refresh'],
      ['Architecture payoff','The cache, context stamping and database policy are separate parts of one request path. Each part has a defined responsibility.','Performance and access control are designed to work together.','Shared infrastructure · reusable policy resolution']
    ],
    protect:[
      ['Protect stored information','My work includes AES encryption for protected database values. This local illustration encrypts a fictional value so you can see the difference between readable content and ciphertext.','Protected content cannot be read as plain text from its encrypted representation.','AES · local illustration uses browser AES-GCM'],
      ['Keep an audit trail','My application work includes audit trails and status-history workflows. An example approval here records the actor, time and before/after status.','A change can be explained later: who did it, when, and what changed.','Audit trail · status history'],
      ['Different protections','Access control decides who may receive data. Encryption protects selected representations of the data. An audit trail records changes.','These solve different problems and complement one another.','Access control + encryption + accountability']
    ],
    search:[
      ['What I built','For Macro, I built backend search capabilities using Azure AI Search across documents, attachments and work items, including user-specific search APIs.','Stored information becomes easier to find and use.','Azure AI Search · ingestion · retrieval APIs'],
      ['Exact match','A known reference, phrase or identifier provides a precise way to locate the intended record.','Useful when you already know exactly what you need.','Exact retrieval'],
      ['Handle a typo','Fuzzy matching allows small spelling differences. Try “helmt” to find the helmet guidance in this local example.','A minor typing mistake need not end the search.','Fuzzy retrieval · this example uses edit distance'],
      ['Understand the question','Semantic retrieval considers the meaning of a query. The curated example connects a question about head injuries with helmet guidance.','People can ask in their own words.','Semantic search · curated local illustration, not a live model'],
      ['Find related information','Vector retrieval compares numerical representations. The example ranks related documents using small, hand-authored topic vectors; production retrieval uses embeddings.','Related information can be found without identical wording.','Vector similarity · embeddings · Azure AI Search'],
      ['Keep it scoped','Search and permissions both matter: a useful answer should also respect the access rules appropriate to the application. The search records here are fictional public examples.','Discoverability does not replace access control.','User-specific search APIs · scoped retrieval']
    ]
  };
  const renderer=new GyroRenderer($('world'),$('playfield'));let mode='design',epoch=0,busy=false,layoutFrame=0,selected='';
  const design={opened:false,briefed:false,built:false,change:'notify',notification:false,provider:'A',rule:'Manager approval'};
  const people=[{name:'Priya',label:'Priya · site manager · North / River',company:'North',site:'River',scope:'site'},{name:'Arjun',label:'Arjun · company manager · North',company:'North',site:null,scope:'company'},{name:'Nadia',label:'Nadia · site manager · South / Harbour',company:'South',site:'Harbour',scope:'site'}];let person=0;
  const reports=[
    {name:'Missing guardrail',company:'North',site:'River'},
    {name:'Chemical spill',company:'North',site:'River'},
    {name:'Forklift inspection',company:'North',site:'Hill'},
    {name:'Crane near miss',company:'North',site:'Hill'},
    {name:'Blocked exit',company:'South',site:'Harbour'},
    {name:'Ladder damage',company:'South',site:'Harbour'}];
  const mayRead=(who,r)=>r.company===who.company&&(who.scope==='company'||r.site===who.site);
  const access={opened:false};
  const cache={memory:false,redis:false,version:1,savedVersion:0};
  const protection={plain:'Confidential note: access review scheduled.',encrypted:false,cipher:null,key:null,iv:null,approved:false,audit:[]};
  const docs=[
    {id:'INC-104',title:'Scaffold guardrail report',kind:'Work item',text:'guardrail scaffold fall inspection',vector:[0,1,.1,0]},
    {id:'DOC-201',title:'Helmet replacement guide',kind:'Document',text:'helmet hard hat head protection replacement',vector:[1,0,0,.05]},
    {id:'ATT-202',title:'Head protection policy',kind:'Attachment',text:'helmet head injury protection policy',vector:[.95,.05,0,.1]},
    {id:'DOC-301',title:'Forklift inspection notes',kind:'Document',text:'forklift vehicle daily inspection',vector:[0,.1,1,0]},
    {id:'TASK-410',title:'Exit route checklist',kind:'Work item',text:'exit fire emergency route',vector:[0,0,.05,1]}
  ];let searchMode='exact';
  const searchOptions=[['exact','Find a known record · Exact'],['fuzzy','Allow a spelling mistake · Fuzzy'],['semantic','Ask in your own words · Semantic'],['vector','Find related documents · Vector']];
  function result(title,body,label='WHAT CHANGED'){$('resultTitle').textContent=title;$('resultBody').textContent=body;$('resultLabel').textContent=label;$('announcement').textContent=title+' '+body;scheduleLayout();}
  function actions(items){$('actions').replaceChildren(...items.map(([title,fn,secondary])=>button(title,fn,secondary?'secondary':'')));scheduleLayout();}
  function select(label,options,value,fn){const wrap=el('label',label),input=el('select');for(const [id,text] of options){const o=el('option',text);o.value=id;o.selected=id===String(value);input.append(o);}input.onchange=()=>fn(input.value);wrap.append(input);$('choices').append(wrap);return input;}
  function note(text){$('sceneReadout').append(el('p',text,'scene-note'));}
  function record(title,detail,cls=''){const r=el('div',undefined,'record '+cls);r.append(el('strong',title));if(detail)r.append(el('small',detail));$('sceneReadout').append(r);}
  function nodes(items,links){$('objects').replaceChildren();selected='';const list=items.map(n=>{const b=button('',()=>inspectNode(n.id),'world-object');b.style.width=n.width||'43%';b.setAttribute('aria-label',n.title+'. '+n.description);b.append(el('span',undefined,'object-space'),el('strong',n.title),el('small',n.description));$('objects').append(b);return{...n,dom:b};});renderer.set(mode,list,links);scheduleLayout();}
  function inspectNode(id){selected=id;renderer.emphasis(id);const descriptions={
    idea:['The requirement comes first.','A team needs one application for incident reports, approvals and notifications. Build it to see the responsibilities separate.'],
    screen:['People use the screen.','It collects an incident report and shows the response. Presentation is separate from business decisions.'],
    api:['One way into the application.','The API receives a request and sends it to the right part of the system.'],
    rules:['The rules have a clear home.','Business logic decides whether a report is valid and what approval it needs.'],
    database:['Information has somewhere to live.','The database stores records and participates in enforcing their access rules.'],
    service:['Other tools connect through a boundary.','Notifications and other integrations sit behind defined contracts.'],
    request:['This is a request, not a permission.','Asking for reports does not mean the caller is allowed to receive every report.'],
    checkpoint:['The connection carries context.','The shared interceptor resolves who is asking, their company, role and permission scope.'],
    vault:['The database decides which rows return.','Its access policies use that context. Restricted records stay behind this boundary.'],
    memory:['Reuse work within the current context.','Already-resolved permission information can be returned by the per-DbContext cache.'],
    redis:['Reuse a saved permission lookup.','A Redis entry can be reused after its cache version is checked against the database.'],
    oracle:['Resolve permissions from the source.','If no usable cached answer exists, a stored procedure resolves the permission data.'],
    encryption:['Protect the stored value.','Try encryption to turn a fictional readable value into ciphertext.'],
    audit:['Keep the explanation of a change.','Approve the fictional permit to record who changed its status, when, and from what.'],
    archive:['Documents, attachments and work items.','Choose how to search. The examples use fictional public records, not private project data.']};
    const d=descriptions[id];if(d)result(d[0],d[1],'THIS COMPONENT’S JOB');
  }
  function scheduleLayout(){cancelAnimationFrame(layoutFrame);layoutFrame=requestAnimationFrame(layout);}
  function layout(){const root=$('world').getBoundingClientRect(),brief=$('brief').getBoundingClientRect(),choices=$('choices'),out=$('outcome').getBoundingClientRect();choices.style.top=(brief.bottom-root.top+10)+'px';const cr=choices.getBoundingClientRect(),field=$('playfield'),landscape=root.width>root.height;
    const top=landscape?75:Math.max(brief.bottom,cr.bottom)-root.top+10,bottom=out.top-root.top-5;field.style.top=top+'px';field.style.height=Math.max(80,bottom-top)+'px';field.style.left=landscape?'47%':'14px';field.style.right='14px';$('world').classList.toggle('compact',bottom-top<255);renderer.measure();archFit();briefFit();}
  /* Page zoom, read as the gap between the window and the page inside it.
     outerWidth is the window and does not move when the zoom does, so the ratio
     is the zoom. screen.width looks like it would work and does on a phone, but
     on a desktop it is the whole monitor: measured here it claimed 1.5x on a
     windowed browser at 100%.
     Both directions are called out, but not symmetrically. A scrollbar puts
     the ratio a percent or two over 1 on its own, so the zoomed-in threshold
     sits above that rather than at exactly 1. Zooming out is harmless until it
     is extreme, so that side is left alone until 60%. */
  function zoomLevel(){return outerWidth&&innerWidth?outerWidth/innerWidth:1;}
  function checkZoom(){
    const z=zoomLevel(), inTooFar=z>1.06, outTooFar=z<.60;
    const off=inTooFar||outTooFar;
    $('zoomGuard').hidden=!off;
    if(!off)return;
    $('zoomGuardTitle').textContent=inTooFar
      ?'Your browser is zoomed in.'
      :'Your browser is zoomed out too far.';
    $('zoomNow').textContent=Math.round(z*100)+'%';
  }
  addEventListener('resize',checkZoom);
  visualViewport?.addEventListener('resize',checkZoom);
  checkZoom();
  const observer=new ResizeObserver(scheduleLayout);for(const id of ['brief','choices','outcome','world'])observer.observe($(id));
  async function animate(ids,done){if(busy)return;busy=true;const token=epoch;for(const b of document.querySelectorAll('#actions button,#choices select,#choices input'))b.disabled=true;const completed=await renderer.route(ids);if(token!==epoch)return;busy=false;if(completed)done();for(const b of document.querySelectorAll('#actions button,#choices select,#choices input'))b.disabled=false;}
  function enter(next){epoch++;busy=false;mode=next;renderer.cancel();archHide();briefHide();$('route').value=mode;$('choices').replaceChildren();$('sceneReadout').replaceChildren();const c=chapters[mode];$('chapter').textContent=c[0];$('heading').textContent=c[1];$('goal').textContent=c[2];$('continue').textContent=mode==='search'?'Back to design ↺':chapters[order[order.indexOf(mode)+1]][0].split('/')[1].trim().toLowerCase()+' →';({design:showDesign,access:showAccess,cache:showCache,protect:showProtect,search:showSearch})[mode]();scheduleLayout();}
  /* The chapter opens on the card rather than on the diagram. Tilting is the
     only thing asked for here, and it answers the question the whole chapter is
     about — what is underneath the screen someone uses — before any of it is
     named. Once that has landed, the existing build flow takes over unchanged. */
  let card=null,cardEl=null,cardLines=null,archT=0,archFrame=0,archPlane=-1;
  const CARDS={};
  /* One line per depth, in the order the card reveals them. The heading stays
     put; only this changes, so the card is doing the explaining and the words
     are only naming what is on screen. */
  // The heading already says to tilt, so these only have to name what is on
  // screen right now. One short line each.
  const archLine=i=>[
    'A form and a button. All anyone ever sees.',
    'The part that catches it and acts on it.',
    'Where it is kept, safe for tomorrow.',
  ][i];
  function cardShow(kind,lines,screens){
    const stage=$('archStage'), id=kind==='design'?'archCard':'accessCard';
    cardLines=lines;archPlane=-1;
    for(const el of stage.querySelectorAll('canvas'))el.hidden=el.id!==id;
    cardEl=$(id);
    if(!CARDS[kind])CARDS[kind]=createTiltCard(cardEl,{screens,onFrame:near=>{
      // Only on a change of plane: this runs every frame, and #resultBody is
      // read by a live region.
      if(near===archPlane)return;archPlane=near;
      const body=$('resultBody');if(body)body.textContent=cardLines(near);
    }});
    card=CARDS[kind];
    reserveFor(lines);
    stage.hidden=false;archT=0;$('world').classList.add('arch-intro');archFit();
    cancelAnimationFrame(archFrame);archFrame=requestAnimationFrame(archTick);
  }
  function archHide(){
    cancelAnimationFrame(archFrame);archFrame=0;
    const body=$('resultBody');if(body)body.style.minHeight='';
    const stage=document.getElementById('archStage');if(stage)stage.hidden=true;
    document.getElementById('world').classList.remove('arch-intro');
  }
  // A canvas carries an intrinsic width, which fights aspect-ratio and left the
  // handset short and wide. Size it here instead: the largest 2:3 that fits.
  /* Hold the panel at the height of its longest line before any of them is
     shown. The lines are close in length now, but a reworded one should not be
     able to make the card grow and shrink as it is tilted. */
  function reserveFor(lines){
    const body=$('resultBody');if(!body)return;
    const keep=body.textContent;
    body.style.minHeight='';
    let tallest=0;
    for(let i=0;i<3;i++){body.textContent=lines(i);tallest=Math.max(tallest,body.scrollHeight);}
    body.textContent=keep;
    if(tallest)body.style.minHeight=tallest+'px';
  }
  function archFit(){
    const stage=$('archStage');if(stage.hidden||!cardEl)return;
    const r=stage.getBoundingClientRect();if(!r.width||!r.height)return;
    // Width as a share of height. The artwork is 2:3, so going much below this
    // buys a slimmer handset only by growing its bezels.
    const RATIO=.60;
    const h=Math.min(r.height,r.width/RATIO);
    cardEl.style.width=Math.round(h*RATIO)+'px';
    cardEl.style.height=Math.round(h)+'px';
  }
  function archTick(){
    if(!card||$('archStage').hidden)return;
    // renderer.target is whatever is steering the camera — the motion sensor
    // when tilt is on, the drag when it is not — so the card follows either
    // without needing its own input. Distance from rest is the depth.
    // One signed axis, not the distance from rest. Distance meant a tilt in
    // either direction dug deeper, so the only way back out was to find dead
    // centre again. Signed, the same movement reversed brings you back, and it
    // stops at each end rather than wrapping.
    const want=Math.max(0,Math.min(1,renderer.target.x));
    archT+=(want-archT)*.11;          // the raw signal jitters enough to buzz
    card.draw(archT);
    archFrame=requestAnimationFrame(archTick);
  }

  /* After the card, before anything is named: Madhur says what the tilt just
     showed and why it is worth caring about. Three short stops, plain words, no
     stack names — those come later, once there is something to hang them on. */
  const BRIEF=[
    ['One screen. Three different things.',
     'You just tilted a phone. That is the shape of everything I build: the bit people touch, the bit that answers them, and the bit that remembers.'],
    ['Nobody ever sees most of it.',
     'People judge the screen on top. But when what sits underneath is wrong, a good-looking screen cannot rescue it.'],
    ['That is the job.',
     'I build all three so they fit each other — and so any one of them can change later without breaking the other two.'],
  ];
  /* Both sets were cut from their sheets by scripts/slice-sheet.py into one
     shared box and one shared anchor, so the handover between them does not
     move him. */
  const FRAME=(set,n)=>'./assets/worlds/anim/'+set+'-'+String(n).padStart(2,'0')+'.webp';
  let briefStep=0,briefTimer=0,idleAt=0,briefWarmed=false;
  function briefWarm(){
    if(briefWarmed)return;briefWarmed=true;
    for(let i=1;i<=16;i++){new Image().src=FRAME('idle',i);new Image().src=FRAME('speak',i);}
  }
  // He speaks while the line lands, then settles. Running the cycle forever
  // would turn him into wallpaper.
  /* Idle was drawn as a loop — one breath in across the top row, one out across
     the bottom — so it plays forward, forever. It never stops while he is on
     screen: a character who freezes between lines reads as a still image
     somebody forgot to take away. */
  function briefIdle(){
    clearInterval(briefTimer);
    $('talkAvatar').src=FRAME('idle',idleAt+1);
    briefTimer=setInterval(()=>{
      idleAt=(idleAt+1)%16;
      $('talkAvatar').src=FRAME('idle',idleAt+1);
    },210);
  }

  /* Speak does not loop: it ends with his hand on his chest, and frame 1 has it
     back at his side. So it runs out and then runs home again — the reverse of
     a hand being raised is a hand coming down, which is the motion we want
     anyway — and lands on the pose idle starts from. */
  const SAY=[];
  for(let i=1;i<=16;i++)SAY.push(i);
  for(let i=15;i>=2;i--)SAY.push(i);
  const SAY_STEP=115;
  function briefSay(){
    clearInterval(briefTimer);
    let i=0;
    briefTimer=setInterval(()=>{
      if(i>=SAY.length){idleAt=0;briefIdle();return;}
      $('talkAvatar').src=FRAME('speak',SAY[i++]);
    },SAY_STEP);
  }

  /* The line arrives at the speed he says it: the whole paragraph lands on the
     frame his hand comes back down. The tail of the sentence is already in the
     box, coloured transparent, so nothing reflows as it fills in — otherwise
     the panel would grow under him and shift the stage he is standing on. */
  let typeTimer=0;
  function typeInto(node,text,ms){
    clearInterval(typeTimer);
    node.replaceChildren();
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){node.textContent=text;return;}
    const inked=document.createElement('span'), ghost=document.createElement('span');
    ghost.className='ghost';ghost.setAttribute('aria-hidden','true');
    inked.textContent='';ghost.textContent=text;
    node.append(inked,ghost);
    let i=0;
    const step=Math.max(12,Math.round(ms/Math.max(1,text.length)));
    typeTimer=setInterval(()=>{
      i++;
      inked.textContent=text.slice(0,i);
      ghost.textContent=text.slice(i);
      if(i>=text.length){clearInterval(typeTimer);typeTimer=0;}
    },step);
  }
  // The frames are square with the figure standing in the middle of a lot of
  // empty space, so scale by height and let the stage clip the bare sides. A
  // percentage height on the image resolved against its own natural size.
  /* Fills the stage it is given, in both directions. Capping him at the frame's
     own height kept the pixel grid whole but left him a third of the height of
     a tall phone, where the stage runs to three times a frame. He is drawn with
     image-rendering: pixelated, so the scale stays hard-edged either way. */
  function briefFit(){
    const st=$('talkStage');if(st.hidden)return;
    const r=st.getBoundingClientRect();if(!r.height||!r.width)return;
    const av=$('talkAvatar'), nh=av.naturalHeight||339, nw=av.naturalWidth||178;
    av.style.height=Math.round(Math.min(r.height*.50,r.width*.80*(nh/nw)))+'px';
  }
  function briefHide(){
    clearInterval(briefTimer);briefTimer=0;clearInterval(typeTimer);typeTimer=0;
    const stage=document.getElementById('talkStage');if(stage)stage.hidden=true;
  }
  function briefShow(){
    nodes([],[]);
    $('talkStage').hidden=false;$('world').classList.add('arch-intro');
    const [title,body]=BRIEF[briefStep];
    briefWarm();briefSay();briefFit();
    // naturalHeight is only known once the first frame has decoded.
    $('talkAvatar').addEventListener('load',briefFit,{once:true});
    // result() has already put the whole line into the live region, so a screen
    // reader hears it once rather than one letter at a time.
    result(title,body,'MADHUR');
    typeInto($('resultBody'),body,SAY.length*SAY_STEP);
    const last=briefStep===BRIEF.length-1;
    actions([[last?'Now protect it →':'Go on',()=>{
      if(last){design.briefed=true;enter('access');return;}
      briefStep++;briefShow();
    }]]);
  }

  function showDesign(){
    if(!design.opened){
      nodes([],[]);cardShow('design',archLine);
      const coarse=matchMedia('(pointer:coarse)').matches;
      result('Tilt it and look underneath.',archLine(0),'LOOK INSIDE');
      actions([['I see it',()=>{design.opened=true;briefStep=0;enter('design');}]]);
      return;
    }
    if(!design.briefed){archHide();briefShow();return;}
    briefHide();
    select('Try a new requirement',[['notify','Add email alerts'],['swap','Replace the delivery provider'],['approval','Change the approval rule']],design.change,v=>{design.change=v;designActions();result('A new requirement arrives.','Apply the change and watch which part of the application needs to respond.','TRY A CHANGE');});
    if(design.built)designNodes();else nodes([{id:'idea',art:'api',x:.5,y:.44,width:'76%',scale:1.5,title:'An incident-reporting application',description:'Reports · approvals · notifications'}],[]);
    result(design.built?'Built to work together.':'Start with a real requirement.',design.built?'Tap any named component to understand its job, or change a requirement.':'A team needs to report incidents, approve them and notify the right people.','APPLICATION DESIGN');designActions();
  }
  function designNodes(){nodes([{id:'screen',art:'screen',x:.5,y:.12,title:'People’s screen',description:'Where users report an incident'},{id:'api',art:'api',x:.23,y:.43,title:'Receives requests',description:'The application’s API'},{id:'rules',art:'rules',x:.77,y:.43,title:'Applies the rules',description:design.rule},{id:'database',art:'database',x:.23,y:.78,title:'Stores the data',description:'The application database'},{id:'service',art:'service',x:.77,y:.78,title:design.notification?'Email alerts connected':'Connects other tools',description:'Delivery provider '+design.provider}],[['screen','api'],['api','rules'],['rules','database'],['rules','service']]);}
  function designActions(){actions(design.built?[[{notify:'Add email alerts',swap:'Replace delivery provider',approval:'Change approval rule'}[design.change],changeDesign],['Follow a request',()=>animate(['screen','api','rules','database'],()=>result('The parts have clear responsibilities.','The screen sends a report. The application checks its rules, then stores the information.')) ,true]]:[['Build this application',()=>{designNodes();animate(['screen','api','rules','database','rules','service'],()=>{design.built=true;result('A complete application, from the ground up.','I design the screens people use, the rules behind them, where data lives and how other tools connect.');designActions();});}]]);}
  function changeDesign(){const id=design.change==='approval'?'rules':'service';renderer.emphasis(id);animate(['screen','api','rules',id==='rules'?'database':'service'],()=>{
    if(design.change==='notify'){design.notification=true;result('Email alerts added at the integration boundary.','The notification capability extends the system while the screen and storage keep their existing jobs.','DESIGN FOR EXTENSION');}
    else if(design.change==='swap'){design.provider=design.provider==='A'?'B':'A';result('Delivery provider '+design.provider+' is connected.','The application asks for a message to be delivered. The chosen provider can change behind that boundary.','REPLACE ONE COMPONENT');}
    else{design.rule=design.rule==='Manager approval'?'Manager + safety review':'Manager approval';result('Approval rule updated.','The business-rules component now requires '+design.rule.toLowerCase()+'. The rule has one clear home.','SEPARATE RESPONSIBILITIES');}
    const node=renderer.nodes.find(n=>n.id===id);if(node){node.dom.querySelector('strong').textContent=id==='service'&&design.notification?'Email alerts connected':node.title;node.dom.querySelector('small').textContent=id==='rules'?design.rule:'Delivery provider '+design.provider;}renderer.emphasis(id);
  });}
  /* Chapter two's card is the same handset showing the same list to three
     different people. Nothing about the screen changes between the faces — the
     rows do not move, the header does not move — only who is allowed to read
     them, which is the whole point and is hard to say in a sentence. */
  /* One shape for all three, and near enough one length: the panel under the
     card is sized by whatever sits in it, and a longer third line grew it,
     shrank the playfield above and resized the card mid-tilt. */
  const ACCESS_LINES=i=>[
    'Priya manages one site. Same screen, her site.',
    'Arjun runs the company. Same screen, more rows.',
    'Nadia is another company. Same screen, not ours.',
  ][i];
  // What each of them says, in their own voice, inside the card.
  const WHO_SAYS={
    Priya:'I look after one site, so I see one site.',
    Arjun:'What Priya sees, and the other sites too — they all report to me.',
    Nadia:'Different company. Nothing they see reaches me; my list is its own.',
  };
  const accessOrder=[0,1,2];
  /* Their portraits, when they exist. The faces are prepared once at resize,
     so an arrival has to ask for them to be prepared again. */
  const WHO_ART={};
  function accessArt(){
    for(const p of people){
      const im=new Image();
      im.onload=()=>{WHO_ART[p.name]=im;if(CARDS.access)CARDS.access.resize();};
      im.src='./assets/worlds/anim/who-'+p.name.toLowerCase()+'.webp';
    }
  }
  // Greedy wrap, measured in the font it will actually be drawn in.
  function wrapTo(x,text,width,size){
    x.save();x.font='400 '+size+'px Consolas,monospace';
    const out=[];let line='';
    for(const word of text.split(' ')){
      const next=line?line+' '+word:word;
      if(line&&x.measureText(next).width>width){out.push(line);line=word;}
      else line=next;
    }
    if(line)out.push(line);
    x.restore();return out;
  }
  function accessFace(x,w,h,kit,who){
    const {BODY,bodyPlate,bodyTop,roundRect}=kit;
    const {sx,sy,sw,sh,sr}=BODY(w,h);
    bodyPlate(x,w,h);
    x.save();roundRect(x,sx,sy,sw,sh,sr);x.clip();

    const bg=x.createLinearGradient(sx,sy,sx,sy+sh);
    bg.addColorStop(0,'#14263f');bg.addColorStop(.62,'#0c1828');bg.addColorStop(1,'#0a1422');
    x.fillStyle=bg;x.fillRect(sx,sy,sw,sh);

    const L=sx+sw*.085, R=sx+sw*.915, WID=R-L;
    const FS=k=>Math.max(7,sh*k);
    const put=(t,px,py,size,col,align,weight)=>{
      x.save();x.textAlign=align||'left';x.textBaseline='middle';x.fillStyle=col;
      x.font=(weight||'600')+' '+size+'px Consolas,monospace';
      x.fillText(t,Math.round(px),Math.round(py));x.restore();};

    put('INCIDENT REPORTS',L,sy+sh*.070,FS(.024),'#7fb6d8','left','700');

    /* The person holding the phone stands at the top and says, in one line,
       what they are allowed to see. A name in a chip would have been smaller
       and cheaper, but the whole chapter is about people rather than rules, so
       the people are on screen. */
    const aw=WID*.30, ah=sh*.21, ax=L, ay=sy+sh*.100;
    const art=WHO_ART[who.name];
    if(art){
      const s=Math.min(aw/art.width,ah/art.height);
      x.drawImage(art,ax+(aw-art.width*s)/2,ay+ah-art.height*s,art.width*s,art.height*s);
    }else{
      // Stand-in until their art lands: head and shoulders, plus their initial.
      x.fillStyle='#1b3350';roundRect(x,ax+aw*.10,ay+ah*.42,aw*.80,ah*.58,aw*.16);x.fill();
      x.beginPath();x.arc(ax+aw*.5,ay+ah*.30,aw*.24,0,7);x.fill();
      put(who.name[0],ax+aw*.5,ay+ah*.30,FS(.032),'#6e9dc4','center','700');
    }

    const bx=ax+aw+WID*.045, bw2=R-bx;
    const said=WHO_SAYS[who.name], lines=wrapTo(x,said,bw2-WID*.075,FS(.021));
    const bh2=Math.max(sh*.085,lines.length*FS(.030)+sh*.038);
    const by=ay+ah*.42-bh2/2;
    roundRect(x,bx,by,bw2,bh2,7);
    x.fillStyle='#16304a';x.fill();x.strokeStyle='#3f86b0';x.lineWidth=1.2;x.stroke();
    // a tail pointing back at whoever said it
    x.beginPath();x.moveTo(bx,by+bh2*.52);x.lineTo(bx-WID*.030,by+bh2*.62);
    x.lineTo(bx,by+bh2*.74);x.closePath();
    x.fillStyle='#16304a';x.fill();x.strokeStyle='#3f86b0';x.stroke();
    x.beginPath();x.moveTo(bx+1,by+bh2*.53);x.lineTo(bx+1,by+bh2*.73);
    x.strokeStyle='#16304a';x.lineWidth=2.4;x.stroke();
    lines.forEach((ln,k)=>put(ln,bx+WID*.037,by+sh*.024+k*FS(.030),FS(.021),'#d6ecfb','left','400'));
    const where=who.scope==='company'?who.company+' · all sites':who.company+' / '+who.site;
    put(who.name.toUpperCase()+' · '+where,ax,ay+ah+sh*.030,FS(.018),'#7d9cbe','left','700');

    const rowH=sh*.072, gap=sh*.013;
    let y=sy+sh*.395, shown=0;
    reports.forEach((r,n)=>{
      const ok=mayRead(who,r);
      if(ok)shown++;
      roundRect(x,L,y,WID,rowH,7);
      x.fillStyle=ok?'#16283f':'#0f1726';x.fill();
      x.strokeStyle=ok?'#3f7fa8':'#222f44';x.lineWidth=1.1;x.stroke();
      if(ok){
        put(r.name,L+WID*.055,y+rowH*.37,FS(.024),'#e2effb');
        put(r.company+' / '+r.site,L+WID*.055,y+rowH*.73,FS(.018),'#82a0c0','left','400');
      }else{
        // Bars of uneven length, not one flat block: a redaction has to read as
        // words that were taken away.
        const bx=L+WID*.055;
        x.fillStyle='#27344a';
        roundRect(x,bx,y+rowH*.28,WID*(.30+(n%3)*.09),rowH*.18,2);x.fill();
        x.fillStyle='#1c2637';
        roundRect(x,bx,y+rowH*.60,WID*(.20+((n+1)%3)*.06),rowH*.14,2);x.fill();
        // a shut padlock at the far end
        const px2=R-WID*.075, py2=y+rowH*.50, u=rowH*.15;
        x.strokeStyle='#4a5f7d';x.lineWidth=1.4;
        x.beginPath();x.arc(px2,py2-u*.75,u*.55,Math.PI,0);x.stroke();
        x.fillStyle='#4a5f7d';roundRect(x,px2-u*.8,py2-u*.25,u*1.6,u*1.35,1.5);x.fill();
      }
      y+=rowH+gap;
    });

    put(shown+' of '+reports.length+' visible',sx+sw/2,sy+sh*.935,FS(.021),
        shown?'#8fb6d4':'#c08fa8','center','400');

    x.restore();
    bodyTop(x,w,h);
  }
  const ACCESS_FACES=accessOrder.map(i=>(x,w,h,kit)=>accessFace(x,w,h,kit,people[i]));

  function showAccess(){
    if(!access.opened){
      nodes([],[]);accessArt();cardShow('access',ACCESS_LINES,ACCESS_FACES);
      result('Same screen. Different person.',ACCESS_LINES(0),'WHO IS LOOKING');
      actions([['I see it',()=>{access.opened=true;enter('access');}]]);
      return;
    }
    archHide();
    select('Who is asking?',people.map((p,i)=>[String(i),p.label]),person,v=>{person=Number(v);epoch++;busy=false;renderer.cancel();$('sceneReadout').replaceChildren();result('Same request. A different person.','Send “Open incident reports” to see which records this person receives.','COMPARE ACCESS');accessActions();});
    nodes([{id:'request',art:'person',x:.16,y:.19,width:'31%',title:'Open reports',description:'The user’s request'},{id:'checkpoint',art:'gate',x:.5,y:.19,width:'34%',title:'Attach access context',description:'Shared application rules'},{id:'vault',art:'database',x:.84,y:.19,width:'31%',title:'Filter in the database',description:'Only permitted rows return'}],[['request','checkpoint'],['checkpoint','vault']]);
    result('Try the same request as two people.','Priya manages one North site. Arjun manages the North company. Nadia belongs to South.','ONE SYSTEM / DIFFERENT ACCESS');accessActions();
  }
  function accessActions(){actions([['Send “Open reports”',()=>animate(['request','checkpoint','vault','checkpoint','request'],()=>{
    const p=people[person],allowed=reports.filter(r=>r.company===p.company&&(p.scope==='company'||r.site===p.site));$('sceneReadout').replaceChildren();record(allowed.map(r=>r.name).join(' · '),'Returned to '+p.name+' · '+p.company);note((reports.length-allowed.length)+' restricted reports stay in the database.');
    renderer.emphasis('vault');result(p.name+' receives '+allowed.length+' of '+reports.length+' reports.','Company and permission scope change the response. Switch the person to compare.','ACCESS ENFORCED AT THE DATA BOUNDARY');
  })]]);}
  function showCache(){
    nodes([{id:'memory',art:'memory',x:.5,y:.16,title:'Already checked here',description:'This operation’s memory'},{id:'redis',art:'redis',x:.23,y:.64,title:'Saved permission information',description:'The shared cache · Redis'},{id:'oracle',art:'oracle',x:.77,y:.64,title:'Permission source',description:'Resolve it in the database'}],[['memory','redis'],['redis','oracle']]);
    result('Resolve access once, then repeat.','The first lookup needs the source. Later requests can reuse suitable cached information.','LESS REPEATED WORK');cacheActions();
  }
  function resolveCache(forceChange=false,newContext=false){if(forceChange){cache.version++;cache.memory=false;}if(newContext)cache.memory=false;
    const memoryHit=cache.memory,redisHit=!memoryHit&&cache.redis&&cache.savedVersion===cache.version;
    const path=memoryHit?['memory','memory']:['memory','redis','oracle',...(redisHit?['redis']:[])];
    animate(path,()=>{cache.memory=cache.redis=true;cache.savedVersion=cache.version;renderer.emphasis(memoryHit?'memory':redisHit?'redis':'oracle');
      if(memoryHit)result('We already checked during this operation.','The resolved permissions are reused without repeating the full lookup.','MEMORY REUSE');
      else if(redisHit)result('The saved permissions are still current.','The Redis entry passes a database cache-version check. Its permission data can be reused.','REDIS REUSE + VERSION VALIDATION');
      else result(forceChange?'The saved version is out of date.':'Resolve permissions from the source.',forceChange?'The old saved version is rejected. Current permissions are resolved again and the saved copies refreshed.':'No reusable entry exists yet. The database resolves permissions and the result is saved for reuse.','FRESH PERMISSION RESOLUTION');cacheActions();});
  }
  function cacheActions(){actions([['Resolve / repeat request',()=>resolveCache()],['New connection',()=>resolveCache(false,true),true],['Change permissions',()=>resolveCache(true),true]]);}
  function showProtect(){nodes([{id:'encryption',art:protection.encrypted?'lock':'database',x:.25,y:.21,title:'Protect stored information',description:'Readable value ↔ ciphertext'},{id:'audit',art:'rules',x:.75,y:.21,title:'Record who changed it',description:'Actor, time and status'}],[]);protectReadout();result('Two protections, two different jobs.','Encrypt a fictional stored value, or approve a permit and inspect the change record.','PROTECT / EXPLAIN');protectActions();}
  function protectReadout(){$('sceneReadout').replaceChildren();record(protection.encrypted?'Encrypted stored value':protection.plain,protection.encrypted?protection.cipher.slice(0,60)+'…':'Fictional example · currently readable',protection.encrypted?'encrypted':'');if(protection.audit.length){const a=protection.audit.at(-1);record(a.actor+' · '+a.time,a.from+' → '+a.to+' · permit status recorded');}}
  async function encrypt(){if(busy)return;busy=true;const token=epoch;for(const b of $('actions').querySelectorAll('button'))b.disabled=true;
    try{if(!crypto.subtle)throw new Error('Encryption needs HTTPS or localhost.');
      if(!protection.encrypted){const key=await crypto.subtle.generateKey({name:'AES-GCM',length:256},false,['encrypt','decrypt']),iv=crypto.getRandomValues(new Uint8Array(12));const value=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(protection.plain));if(token!==epoch)return;Object.assign(protection,{key,iv,bytes:value,cipher:btoa(String.fromCharCode(...new Uint8Array(value))),encrypted:true});}
      else{const value=await crypto.subtle.decrypt({name:'AES-GCM',iv:protection.iv},protection.key,protection.bytes);if(token!==epoch)return;protection.plain=new TextDecoder().decode(value);protection.encrypted=false;}
      if(token!==epoch)return;renderer.patch('encryption',{art:protection.encrypted?'lock':'database'});renderer.emphasis('encryption');protectReadout();result(protection.encrypted?'The stored value is no longer readable.':'The value is readable with the right key.',protection.encrypted?'AES encryption turns the sample into ciphertext. Access rules and encryption solve different problems.':'Decryption restores the fictional value. The key stays in this browser session.','ENCRYPTION');
    }catch(e){if(token===epoch)result('Encryption is unavailable here.',e.message,'LOCAL DEMO');}finally{if(token===epoch){busy=false;protectActions();}}
  }
  function approve(){protection.approved=!protection.approved;const a={actor:'Priya · site manager',time:new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'}),from:protection.approved?'Pending':'Approved',to:protection.approved?'Approved':'Pending'};protection.audit.push(a);renderer.emphasis('audit');protectReadout();result('This change has an explanation.',`${a.actor} changed the permit from ${a.from.toLowerCase()} to ${a.to.toLowerCase()}. The actor and time are recorded.`,'AUDIT TRAIL');protectActions();}
  function protectActions(){actions([[protection.encrypted?'Decrypt sample':'Encrypt sample',encrypt],[protection.approved?'Reopen permit':'Approve permit',approve,true]]);}
  function showSearch(){
    const controls=el('div',undefined,'search-controls');$('choices').append(controls);const label=el('label','How would you look for it?'),type=el('select');type.setAttribute('aria-label','Search method');for(const [id,text] of searchOptions){const o=el('option',text);o.value=id;o.selected=id===searchMode;type.append(o);}label.append(type);controls.append(label);
    const input=el('input');input.id='query';input.setAttribute('aria-label','Search query');input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();runSearch();}});const text=el('p',undefined,'query-label');text.id='queryDescription';controls.append(input,text,el('span','Illustrative search · fictional documents','sample-tag'));type.onchange=()=>{searchMode=type.value;searchPreset();};
    nodes([{id:'archive',art:'archive',x:.5,y:.17,width:'80%',title:'One searchable collection',description:'Documents · attachments · work items'}],[]);searchPreset();
  }
  function searchPreset(){const input=$('query');input.value={exact:'INC-104',fuzzy:'helmt',semantic:'How do we prevent head injuries?',vector:'Helmet replacement guide'}[searchMode];input.readOnly=['semantic','vector'].includes(searchMode);$('queryDescription').textContent={exact:'A reference number can point to one specific record.',fuzzy:'One missing letter should not stop you finding the guide.',semantic:'Try the meaning of the question, not an identical phrase.',vector:'Use this document to discover related information.'}[searchMode];$('sceneReadout').replaceChildren();result('Choose a way to find the information.','Run the example and compare the result. Exact and typo queries can also be edited.','SEARCH WITH A PURPOSE');actions([[searchMode==='vector'?'Find related documents':'Search the collection',runSearch]]);scheduleLayout();}
  function editDistance(a,b){const row=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let prev=row[0];row[0]=i;for(let j=1;j<=b.length;j++){const old=row[j];row[j]=Math.min(row[j]+1,row[j-1]+1,prev+(a[i-1]===b[j-1]?0:1));prev=old;}}return row[b.length];}
  function cosine(a,b){return a.reduce((s,v,i)=>s+v*b[i],0)/(Math.hypot(...a)*Math.hypot(...b));}
  function runSearch(){const q=$('query').value.trim().toLowerCase();if(!q){result('Enter something to find.','Use a reference number, word or the suggested example.','SEARCH');return;}
    animate(['archive','archive'],()=>{let found=[];if(searchMode==='exact')found=docs.filter(d=>d.id.toLowerCase()===q||d.title.toLowerCase().includes(q));
      if(searchMode==='fuzzy')found=docs.filter(d=>(d.title+' '+d.text).toLowerCase().split(/\W+/).some(w=>editDistance(q,w)<=Math.max(1,Math.min(2,Math.floor(q.length/4)))));
      if(searchMode==='semantic')found=docs.filter(d=>['DOC-201','ATT-202'].includes(d.id));
      if(searchMode==='vector'){const seed=docs.find(d=>d.id==='DOC-201');found=docs.filter(d=>d!==seed).map(d=>({d,score:cosine(d.vector,seed.vector)})).filter(x=>x.score>.6).sort((a,b)=>b.score-a.score).map(x=>x.d);}
      $('sceneReadout').replaceChildren();
      if(found.length>2){const pick=el('select',undefined,'result-select');pick.setAttribute('aria-label','Inspect any of the '+found.length+' matching records');found.forEach((d,i)=>{const o=el('option',d.title);o.value=i;pick.append(o);});$('sceneReadout').append(pick);const show=()=>{$('sceneReadout').querySelectorAll('.record').forEach(n=>n.remove());const d=found[Number(pick.value)];record(d.title,d.kind+' · '+d.id+' · '+found.length+' matches');};pick.onchange=show;show();}
      else found.forEach(d=>record(d.title,d.kind+' · '+d.id));
      if(!found.length)note('No matching sample records. Try the suggested query.');renderer.emphasis('archive');
      const messages={exact:['A precise reference finds a precise record.','Exact matching is useful when you know the record or phrase you need.'],fuzzy:['A spelling mistake does not end the search.','Fuzzy matching tolerates small spelling differences, so a typo can still lead to the intended guidance.'],semantic:['The question leads to relevant guidance.','The head-injury question connects to helmet and protection guidance in this curated example.'],vector:['Related information, without repeating the title.','The helmet guide leads to a related protection policy through topic similarity.']};
      result(found.length?messages[searchMode][0]:'No matches in this sample.',found.length?messages[searchMode][1]:'Try INC-104 for exact matching or helmt for the typo example.','SEARCH RESULT');
    });
  }
  function explanation(){const all=explanations[mode];$('detailTitle').textContent={design:'Designed from the ground up.',access:'Access is part of the architecture.',cache:'Reuse work without trusting stale data.',protect:'Protect it. Be able to explain it.',search:'Make knowledge findable.'}[mode];$('detailChoice').replaceChildren(...all.map((d,i)=>{const o=el('option',d[0]);o.value=i;return o;}));const show=()=>{const d=all[Number($('detailChoice').value)];$('detailHeading').textContent=d[0];$('detailCopy').textContent=d[1];$('detailBenefit').textContent='Why it matters: '+d[2];$('detailTech').textContent=d[3];};$('detailChoice').onchange=show;show();$('details').showModal();}
  $('route').onchange=()=>enter($('route').value);$('continue').onclick=()=>enter(order[(order.indexOf(mode)+1)%order.length]);$('explain').onclick=explanation;
  $('settingsButton').onclick=()=>$('settings').showModal();for(const d of document.querySelectorAll('dialog'))d.querySelector('.close').onclick=()=>d.close();
  let tiltEnabled=false,neutral=null,lastSensor=null;const setMotion=v=>{renderer.gentle=v;$('world').classList.toggle('gentle',v);$('motion').setAttribute('aria-pressed',String(v));$('motion').textContent=v?'Gentle motion · on':'Gentle motion';};setMotion(renderer.gentle);$('motion').onclick=()=>setMotion(!renderer.gentle);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');reduced.addEventListener('change',e=>setMotion(e.matches));
  /* Tilt is what this world is named after, and it used to sit inside the
     options dialog where nobody opened it, so on a phone the camera only ever
     answered to a drag. It is now a switch on the playfield itself.
     Enabling it is verified rather than assumed: a browser will accept the
     listener and then never fire an event — no sensor, a desktop, an in-app
     webview, an http origin — and the old code had already switched the
     pointer fallback off by then, so the camera simply froze. */
  let tiltSeen=false,tiltWatch=0,orientHandler=null;
  const chip=$('tiltChip'),chipLabel=chip.querySelector('span'),clamp=v=>Math.max(-1,Math.min(1,v));
  // The chip only earns its space where a device can actually tilt. A desktop
  // keeps the pointer parallax and the button inside the dialog.
  if(matchMedia('(pointer:coarse)').matches||typeof window.DeviceOrientationEvent?.requestPermission==='function')chip.hidden=false;
  const TOUCH_BACK=' Drag the world to look around instead.';
  function paintTilt(state,message){
    chip.dataset.state=state;chip.setAttribute('aria-pressed',String(state==='on'));
    chipLabel.textContent={on:'TILT ON',waiting:'…',unavailable:'NO TILT'}[state]??'TILT';
    $('tilt').textContent=state==='on'?'Re-centre tilt':'Enable tilt to look around';
    if(message)$('sensorStatus').textContent=message;
  }
  function stopTilt(state,message){
    if(orientHandler)removeEventListener('deviceorientation',orientHandler);
    orientHandler=null;clearTimeout(tiltWatch);tiltEnabled=false;neutral=null;
    renderer.target={x:0,y:0};paintTilt(state,message);
  }
  /* A silent attempt that did not take leaves no trace behind it. Some browsers
     refuse the sensor when it is asked for without a tap but allow the very same
     call from one, so the chip goes back to inviting that tap rather than
     reporting a failure the visitor cannot act on. */
  function quietFail(){
    if(orientHandler)removeEventListener('deviceorientation',orientHandler);
    orientHandler=null;clearTimeout(tiltWatch);tiltEnabled=false;neutral=null;
    delete chip.dataset.used;paintTilt('off');
  }
  async function startTilt(quiet){
    const give=(state,message)=>quiet?quietFail():stopTilt(state,message);
    const D=window.DeviceOrientationEvent;
    if(!D)return give('unavailable','This device has no motion sensor.'+TOUCH_BACK);
    if(!isSecureContext)return give('unavailable','Tilt needs a secure (https) connection.'+TOUCH_BACK);
    try{
      if(typeof D.requestPermission==='function'&&await D.requestPermission()!=='granted')
        return give('off','Motion access was not granted.'+TOUCH_BACK);
    }catch{return give('off','Motion access was not granted.'+TOUCH_BACK);}
    tiltSeen=false;neutral=null;
    orientHandler=e=>{
      if(e.gamma===null||e.beta===null)return;
      // The first real reading is what confirms the sensor, and the pose it
      // arrives in is the one the visitor is already holding the phone in.
      if(!tiltSeen){tiltSeen=true;clearTimeout(tiltWatch);tiltEnabled=true;
        paintTilt('on','Tilt changes your view. It never changes who can access the data.');}
      lastSensor={x:e.gamma,y:e.beta};neutral??={...lastSensor};
      const x=clamp((e.gamma-neutral.x)/25),y=clamp((e.beta-neutral.y)/30),a=(screen.orientation?.angle??0)*Math.PI/180;
      renderer.target={x:x*Math.cos(a)+y*Math.sin(a),y:y*Math.cos(a)-x*Math.sin(a)};
    };
    addEventListener('deviceorientation',orientHandler);
    paintTilt('waiting','Looking for the motion sensor…');
    // A sensor that is going to report does it within a frame or two. Anything
    // still silent after this is not coming, so hand the world back to touch
    // rather than leaving a dead camera behind.
    tiltWatch=setTimeout(()=>{if(!tiltSeen)give('unavailable','This device isn’t reporting motion.'+TOUCH_BACK);},1200);
  }
  const toggleTilt=()=>{chip.dataset.used='1';tiltEnabled?stopTilt('off','Tilt is off.'+TOUCH_BACK):startTilt();};
  chip.onclick=toggleTilt;
  // In the dialog the same control still re-centres while tilt is live.
  $('tilt').onclick=()=>{if(tiltEnabled){neutral=lastSensor?{...lastSensor}:null;renderer.target={x:0,y:0};return;}toggleTilt();};
  /* On by default, because the world is named after it and asking first meant
     most visitors never turned it on. Not attempted where the browser demands
     a gesture for the sensor — iOS rejects requestPermission() outside a tap,
     and a rejection here would look to the visitor like a device that cannot
     do it at all. There the chip still asks. The watchdog inside startTilt
     covers the rest: no reading, no harm, and the drag keeps working. */
  /* On by default, because the world is named after it and asking first meant
     most visitors never turned it on. It is attempted everywhere rather than
     only where no permission call exists: Chrome on Android carries
     requestPermission() too, and skipping on its presence meant the attempt was
     never made on the very phones it works on. Where the call needs a tap it
     rejects, and quietFail puts the chip back the way it was. */
  if(window.DeviceOrientationEvent&&isSecureContext){
    // The chip reads as an invitation until somebody has used it. Coming on by
    // itself counts, or it would sit there saying TILT TO LOOK AROUND while the
    // tilt was already working.
    chip.dataset.used='1';startTilt(true);
  }
  $('playfield').addEventListener('pointermove',e=>{if(tiltEnabled)return;const r=$('playfield').getBoundingClientRect();renderer.target={x:(e.clientX-r.left)/r.width*2-1,y:(e.clientY-r.top)/r.height*2-1};});$('playfield').addEventListener('pointerleave',()=>{if(!tiltEnabled)renderer.target={x:0,y:0};});addEventListener('orientationchange',()=>{neutral=null;renderer.target={x:0,y:0};});
  $('reset').onclick=()=>{if(mode==='design')Object.assign(design,{opened:false,briefed:false,built:false,notification:false,provider:'A',rule:'Manager approval'});if(mode==='cache')Object.assign(cache,{memory:false,redis:false,version:1,savedVersion:0});if(mode==='access'){person=0;access.opened=false;}if(mode==='protect')Object.assign(protection,{encrypted:false,cipher:null,key:null,iv:null,approved:false,audit:[]});if(mode==='search')searchMode='exact';$('settings').close();enter(mode);};
  renderer.ready.then(()=>{enter('design');$('loading').style.opacity='0';setTimeout(()=>$('loading').hidden=true,550);}).catch(()=>{$('loading').replaceChildren(el('p','The world artwork could not load.'),button('Retry',()=>location.reload()));});
})();
