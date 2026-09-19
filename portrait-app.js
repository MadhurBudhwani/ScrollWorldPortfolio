/* Shared content, a separate touch-first journey. Desktop controllers never run here. */
(() => {
  'use strict';
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const button=(text,fn,cls='')=>{const b=el('button',cls,text);b.type='button';b.onclick=fn;return b;};
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const store={get(key,fallback){try{return JSON.parse(sessionStorage.getItem(key))??fallback;}catch{return fallback;}},set(key,value){try{sessionStorage.setItem(key,JSON.stringify(value));}catch{}}};
  const params=new URLSearchParams(location.search),isWorld=Boolean(window.worldLevels);
  const worldKey=Object.hasOwn(window.worldLevels||{},params.get('world'))?params.get('world'):'work';
  const level=isWorld?worldLevels[worldKey]:null;
  const chapters=isWorld?level.exhibits:PortfolioChapters;
  const names=isWorld?chapters.map(x=>x.title):['Arrival','Backend','Azure','Security','Search','GenAI','Delivery','Beyond Code','World hub'];
  const savedKey='portrait-'+(isWorld?worldKey:'story');
  const hashIndex=isWorld?-1:chapters.findIndex(x=>'#'+x.key===location.hash);
  let target=clamp(hashIndex>=0?hashIndex:store.get(savedKey,0),0,chapters.length-1),position=target,index=-1,skillPage=0,transition=1;
  let last=0,paused=false,live=false,pending=false,generation=0,tourTime=0,muted=false,noticeTimer=0;
  const visited=new Set(store.get(savedKey+'-visited',[]));
  const root=el('main','tower '+(isWorld?'tower-world':'tower-story'));root.setAttribute('aria-label',isWorld?level.title+' portrait world':"Madhur’s Tower — portrait portfolio");
  document.body.append(root);
  const header=el('header','tower-header'),home=el('a','tower-brand',isWorld?'← Hub':'MB / TOWER');
  home.href='./index.html?experience=portrait'+(isWorld?'#hub':'#boot');
  const select=el('select','tower-map');select.setAttribute('aria-label',isWorld?'Visit a station':'Visit a chapter');
  names.forEach((name,i)=>{const o=el('option','',`${String(i+1).padStart(2,'0')} · ${name}`);o.value=i;select.append(o);});
  select.onchange=()=>go(Number(select.value));
  const autoplay=button('▶ Auto play',startTour,'tower-autoplay');autoplay.hidden=isWorld;
  const menu=button('⋯',showMenu,'tower-menu');menu.setAttribute('aria-label','Journey options');header.append(home,select,autoplay,menu);
  const copy=el('section','tower-copy');copy.setAttribute('aria-label','Chapter introduction');
  const stage=el('section','tower-stage');stage.setAttribute('aria-label',isWorld?'Vertical world scene':'Interactive chapter scene');
  const scene=new PortraitScene(stage);
  const portals=el('nav','tower-portals');portals.setAttribute('aria-label','Choose a world');portals.hidden=true;
  for(const [key,num,name,detail] of [['work','01','Work','Climb the rooftops'],['genai','02','GenAI','Enter the lunar lab'],['hobbies','03','Hobbies','Visit the studios'],['about','04','About Me','Follow the stars']]){
    const a=el('a','tower-door');a.href=`./world.html?world=${key}&experience=portrait`;a.append(el('span','tower-door-number',num),el('strong','',name),el('span','',detail));portals.append(a);
  }
  stage.append(portals);
  const shelf=el('section','tower-shelf');shelf.setAttribute('aria-label',isWorld?'Station information':'Chapter skills');
  const footer=el('nav','tower-footer');footer.setAttribute('aria-label','Journey controls');
  const previous=button('↓ Back',()=>go(target-1)),action=button('',activate,'tower-primary'),next=button('Up ↑',()=>go(target+1));
  footer.append(previous,action,next);
  const status=el('p','tower-status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const tourControls=el('div','tower-tour-controls');tourControls.hidden=true;
  const mute=button('Mute',()=>{muted=!muted;audio.muted=muted;mute.textContent=muted?'Unmute':'Mute';mute.setAttribute('aria-pressed',String(muted));});mute.setAttribute('aria-pressed','false');
  tourControls.append(el('span','','GUIDED TOUR'),mute,button('Stop ✕',()=>stopTour()));
  root.append(header,copy,stage,shelf,footer,status,tourControls);
  const reader=isWorld?null:new PagedReader(copy);
  if(reader){reader.prev.textContent='← Text';reader.next.textContent='Text →';reader.prev.setAttribute('aria-label','Previous text page');reader.next.setAttribute('aria-label','Next text page');}
  const dialog=isWorld?document.querySelector('#worldDialog'):el('dialog','tower-dialog');
  if(!isWorld){dialog.setAttribute('aria-label','Journey options');document.body.append(dialog);}
  let temporaryReader=null,temporaryHost=null;
  const lab=isWorld?new LunarLab(dialog):null,hobbies=isWorld?new HobbyGallery(dialog):null,about=isWorld?new AboutWorld(dialog):null;
  if(isWorld){document.querySelector('#closeDialog').onclick=()=>dialog.close();about.onExplore=i=>{if(worldKey==='about'){markVisited(i);go(i,false);}};}
  dialog.addEventListener('close',()=>{temporaryReader?.destroy();temporaryReader=null;temporaryHost?.remove();temporaryHost=null;dialog.classList.remove('tower-reading-mode');paused=false;last=0;action.focus({preventScroll:true});});
  const audio=new Audio('./assets/autoplay-blinding-lights-8bit.mp3');audio.preload='none';audio.loop=true;audio.volume=.45;
  const durations=[12,22,17,15,15,20,15,20,5],positions=[0,1,2,3,4,5,6,7,8,8.8];
  const rates=durations.map((d,i)=>(positions[i+1]-positions[i])/d);
  const speeds=positions.map((_,i)=>i===0?rates[0]:i===rates.length?rates.at(-1):2*rates[i-1]*rates[i]/(rates[i-1]+rates[i]));
  const total=durations.reduce((a,b)=>a+b,0);
  const actionNames=['Wake the tower','Send a request','Launch capsule','Unlock the vault','Scan the archive','Run the pipeline','Launch release','Bring it to life','Choose a world'];
  function tell(text){status.textContent=text;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{status.textContent=hint();},4500);}
  function hint(){return isWorld?`${visited.size} / ${chapters.length} explored · Swipe up to ascend`:'Swipe up to ascend · tap to explore';}
  function go(to,manual=true){
    if(manual)stopTour();to=clamp(Math.round(to),0,chapters.length-1);
    if(to!==target){target=to;transition=0;scene.activate();}else if(manual&&to===0)position=0;
    store.set(savedKey,target);refresh();
  }
  function refresh(){
    const current=clamp(Math.floor(live?position:target),0,chapters.length-1);
    autoplay.hidden=isWorld||pending||live||target!==0||position>.0001;
    previous.disabled=target===0;next.disabled=target===chapters.length-1;
    select.value=String(current);if(current===index)return;
    index=current;skillPage=0;const data=chapters[index];
    root.dataset.chapter=String(index);root.style.setProperty('--tower-accent',isWorld?(worldKey==='about'?AboutData.stations[index].color:worldKey==='hobbies'?'#f58caf':worldKey==='work'?'#f3cc70':'#67daf5'):['#84f5ad','#67daf5','#f3cc70','#f58caf'][data.color]);
    if(isWorld){copy.replaceChildren(el('p','tower-eyebrow',`${level.title.toUpperCase()} / ${String(index+1).padStart(2,'0')}`),el('h1','',data.title));action.textContent=worldKey==='hobbies'?'Open room':worldKey==='genai'?'Enter lab':'Explore';document.title=`${level.title} | Madhur Budhwani`;}
    else{reader.set([{tag:'p',cls:'tower-eyebrow',text:data.kicker},{tag:'h1',text:data.title.replace('\n',' ')},{tag:'p',text:data.body}]);action.textContent=actionNames[index];}
    portals.hidden=isWorld||index!==8;action.hidden=!isWorld&&index===8;stage.classList.toggle('is-hub',!portals.hidden);renderShelf();status.textContent=hint();
  }
  function renderShelf(){
    shelf.replaceChildren();const data=chapters[index];
    if(isWorld){
      const line=el('p','tower-station-tag',data.role?`${data.role} · ${data.tag}`:data.tag);shelf.append(line);
      const powerName={work:'Web climb ↑',genai:'Boost ↑',hobbies:'Jetpack ↑',about:'Palm laser'}[worldKey];
      const power=button(powerName,()=>{if(worldKey==='about'){scene.fire(Math.round(position));tell('Blue palm laser · constellation colour returns after 3 seconds');}else{scene.activate();go(target<chapters.length-1?target+1:target-1);}},'tower-power');
      power.disabled=worldKey!=='about'&&index===chapters.length-1;shelf.append(power);return;
    }
    if(!data.skills.length){shelf.append(el('p','tower-hub-caption','Four doors. Four different sides of Madhur.'));return;}
    const count=Math.ceil(data.skills.length/4),start=skillPage*4,grid=el('div','tower-skills');
    data.skills.slice(start,start+4).forEach(skill=>grid.append(button(skill,()=>{stopTour();scene.activate();tell(skill+' · '+names[index]);},'tower-skill')));shelf.append(grid);
    if(count>1){const nav=el('nav','tower-skill-pages');nav.setAttribute('aria-label','Skill batches');const back=button('←',()=>{stopTour();skillPage--;renderShelf();}),forward=button('→',()=>{stopTour();skillPage++;renderShelf();});back.disabled=skillPage===0;forward.disabled=skillPage===count-1;back.setAttribute('aria-label','Previous skills');forward.setAttribute('aria-label','More skills');nav.append(back,el('span','',`Skills ${start+1}–${Math.min(start+4,data.skills.length)} / ${data.skills.length}`),forward);shelf.append(nav);}
  }
  function markVisited(i){visited.add(i);store.set(savedKey+'-visited',[...visited]);status.textContent=hint();}
  function clearPanel(){
    lab?.close();hobbies?.close();about?.close();temporaryReader?.destroy();temporaryReader=null;temporaryHost?.remove();temporaryHost=null;
    if(isWorld){document.querySelector('#dialogLinks').replaceChildren();document.querySelector('#dialogLinks').hidden=true;document.querySelector('#dialogDemo').hidden=true;document.querySelector('#dialogBody').textContent='';}
  }
  function activate(){
    stopTour();if(!isWorld){scene.activate();tell(['The tower is awake. Choose a chapter or swipe up.','Request → processing → storage → response','A capsule carries the delivery through the cloud.','Identity, permissions and protected data.','The search lens scans the document archive.','A question passes through generation, validation and correction.','The release rises through DEV, review, QA, UAT and production.','Six creative rooms. Visit Hobbies from the hub.'][index]||'Choose a world.');return;}
    clearPanel();paused=true;markVisited(index);const data=chapters[index];
    document.querySelector('#dialogTitle').textContent=data.title;document.querySelector('#dialogTag').textContent=data.tag;
    dialog.showModal();
    if(data.lab)lab.open(data.lab);else if(worldKey==='hobbies')hobbies.open(data.art);else if(worldKey==='about')about.open(data.about);
    else{
      dialog.classList.add('tower-reading-mode');temporaryHost=el('article','tower-work-reader');dialog.insertBefore(temporaryHost,dialog.querySelector('.dialog-footnote'));
      temporaryReader=new PagedReader(temporaryHost);temporaryReader.set(data.body.split('\n\n').map(text=>({tag:'p',text})));
      const links=document.querySelector('#dialogLinks');links.hidden=!data.links?.length;
      for(const link of data.links||[]){const a=el('a','',link.label+' ↗');a.href=link.href;a.target='_blank';a.rel='noopener noreferrer';links.append(a);}
    }
  }
  function showMenu(){
    stopTour();clearPanel();paused=true;
    if(isWorld){dialog.classList.add('tower-reading-mode');document.querySelector('#dialogTitle').textContent='Your way up';document.querySelector('#dialogTag').textContent='PORTRAIT CONTROLS';}
    else dialog.replaceChildren(button('Close ✕',()=>dialog.close(),'tower-dialog-close'),el('h2','','Your way up'));
    temporaryHost=el('article','tower-work-reader');if(isWorld)dialog.insertBefore(temporaryHost,dialog.querySelector('.dialog-footnote'));else dialog.append(temporaryHost);
    temporaryReader=new PagedReader(temporaryHost);temporaryReader.set([{tag:'p',text:'Swipe up to ascend, or down to revisit a floor. The arrows and chapter selector do the same thing. Every room is available immediately; there is no score or challenge blocking the content.'},{tag:'p',text:isWorld?'Tap Explore to open a station. Use the power button for a web climb, jetpack ride or palm laser. Reading, media and experiments keep their own page controls.':'Tap a glowing skill or the centre action button to bring the chapter to life. Text pages and skill batches preserve the full story. Auto play starts only at the arrival floor and plays the tour music. Any manual navigation stops it.'},{tag:'p',text:'Keyboard: Up/Down changes floors, Enter opens a station, Shift uses the world power. Rotation keeps your place. Desktop view is available below.'}]);
    const link=el('a','tower-desktop-link','Open desktop experience ↗');link.href=isWorld?`./world.html?world=${worldKey}&experience=desktop`:`./index.html?experience=desktop#${chapters[target].key}`;
    if(isWorld){const links=document.querySelector('#dialogLinks');links.hidden=false;links.append(link);}else{dialog.append(link);}
    dialog.showModal();
  }
  function stopTour(){
    generation++;pending=false;if(live){live=false;target=clamp(Math.floor(position),0,8);position=target;store.set(savedKey,target);}audio.pause();audio.currentTime=0;root.classList.remove('is-touring');tourControls.hidden=true;refresh();
  }
  async function startTour(){
    if(isWorld||target!==0||position>.0001||pending||live)return;
    const token=++generation;pending=true;autoplay.hidden=true;audio.currentTime=0;audio.volume=0;audio.muted=muted;tell('Preparing your ascent…');
    try{await audio.play();}catch{if(token!==generation)return;pending=false;refresh();tell('Music could not start. Tap Auto play to try again.');return;}
    if(token!==generation)return;
    // Decode the same actor sprites before the first animated beat, while the
    // user-initiated audio element has permission to play on mobile browsers.
    await scene.ready;
    if(token!==generation)return;
    pending=false;live=true;tourTime=0;target=0;position=0;index=-1;audio.currentTime=0;root.classList.add('is-touring');tourControls.hidden=false;refresh();
  }
  function advanceTour(dt){
    tourTime=Math.min(total,tourTime+dt);audio.volume=Math.min(.45,tourTime*.3);let local=tourTime,segment=0;
    while(segment<durations.length-1&&local>=durations[segment])local-=durations[segment++];
    const u=clamp(local/durations[segment]),u2=u*u,u3=u2*u,d=durations[segment];
    position=(2*u3-3*u2+1)*positions[segment]+(u3-2*u2+u)*d*speeds[segment]+(-2*u3+3*u2)*positions[segment+1]+(u3-u2)*d*speeds[segment+1];
    target=Math.min(8,Math.floor(position));refresh();
    const pages=Math.ceil((chapters[index].skills?.length||0)/4),page=pages?Math.min(pages-1,Math.floor(u*pages)):0;
    if(page!==skillPage){skillPage=page;renderShelf();}
    if(reader.pages.length>1){const leaf=Math.min(reader.pages.length-1,Math.floor(u*reader.pages.length));if(reader.index!==leaf)reader.show(leaf);}
    if(tourTime>=total){stopTour();go(8,false);tell('Tour complete. Choose a world to explore.');}
  }
  // Gestures belong to the scene, not to open dialogs, selectors or reading pages.
  let pointer=null,wheelTime=0;
  root.addEventListener('pointerdown',e=>{if(e.target.closest('button,a,select,.reader-nav'))return;if(pending||live)stopTour();pointer={id:e.pointerId,x:e.clientX,y:e.clientY};});
  root.addEventListener('pointerup',e=>{if(!pointer||pointer.id!==e.pointerId)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;if(Math.abs(dy)>40&&Math.abs(dy)>Math.abs(dx)*1.15)go(target+(dy<0?1:-1));else if(Math.abs(dy)<12&&Math.abs(dx)<12&&stage.contains(e.target))activate();});
  root.addEventListener('pointercancel',()=>{pointer=null;});
  root.addEventListener('wheel',e=>{if(dialog.open)return;e.preventDefault();if(pending||live)stopTour();if(performance.now()-wheelTime<550||Math.abs(e.deltaY)<3)return;wheelTime=performance.now();go(target+(e.deltaY>0?1:-1));},{passive:false});
  root.addEventListener('click',e=>{if(e.target.closest('.reader-nav'))stopTour();});
  document.addEventListener('keydown',e=>{
    if(dialog.open||e.target.matches('select,input,textarea,button,a'))return;
    if(['ArrowUp','ArrowDown','PageDown','PageUp','Home','End','Shift','Enter','Escape'].includes(e.key)){e.preventDefault();if(e.repeat)return;
      if(e.key==='ArrowUp'||e.key==='PageDown')go(target+1);else if(e.key==='ArrowDown'||e.key==='PageUp')go(target-1);else if(e.key==='Home')go(0);else if(e.key==='End')go(chapters.length-1);else if(e.key==='Enter')activate();else if(e.key==='Shift'){stopTour();if(worldKey==='about'&&isWorld)scene.fire(Math.round(position));else if(isWorld)go(target+1);else scene.activate();}else stopTour();}
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopTour();last=0;});
  window.addEventListener('pagehide',()=>{stopTour();hobbies?.pauseMedia();});
  window.addEventListener('hashchange',()=>{if(isWorld)return;const i=chapters.findIndex(x=>'#'+x.key===location.hash);if(i>=0)go(i);});
  function frame(now){
    const dt=Math.min(.04,last?(now-last)/1000:0);last=now;
    if(!document.hidden&&!paused){
      if(live)advanceTour(dt);else{transition=Math.min(1,transition+dt/1.15);position+=(target-position)*(1-Math.exp(-dt*5));if(Math.abs(target-position)<.001)position=target;}
      if(isWorld)scene.world(level,position,dt,transition);
      else scene.story(index,position%1,dt,live?0:transition);
      autoplay.hidden=isWorld||pending||live||target!==0||position>.0001;
    }
    requestAnimationFrame(frame);
  }
  refresh();requestAnimationFrame(frame);
})();
