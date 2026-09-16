/* Six small creative rooms. Content comes only from the generated folder index. */
(() => {
  'use strict';
  const titles=['Writing','Singing','Gaming','Drawing','Graphic Design','Video Editing'];
  const ids=['writing','singing','gaming','drawing','design','video'];
  const subtitles=['THE BOOK CORNER','THE LISTENING ROOM','THE POCKET ARCADE','THE SKETCHBOOK DESK','THE COMPOSITION STUDIO','THE EDITING SUITE'];
  const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  const button=(text,fn,cls='')=>{const n=el('button',cls,text);n.type='button';n.addEventListener('click',fn);return n;};
  const img=(src,alt)=>{const n=el('img');n.src=src;n.alt=alt;n.loading='lazy';return n;};
  function empty(title,body){const d=el('div','hobby-empty');d.append(el('strong','',title),el('p','',body));return d;}
  class HobbyGallery {
    constructor(dialog){
      this.dialog=dialog;this.root=el('section');this.root.id='hobbyGallery';this.root.hidden=true;dialog.insertBefore(this.root,dialog.querySelector('.dialog-footnote'));
      this.data=window.HobbyContent||{};this.active=false;this.cleanups=[];this.selected={};this.page=0;
      dialog.addEventListener('close',()=>this.close());
      document.addEventListener('visibilitychange',()=>{if(document.hidden)this.pauseMedia();});
      if(['127.0.0.1','localhost'].includes(location.hostname)&&typeof EventSource!=='undefined'){
        this.events=new EventSource('/__content_events');this.events.onmessage=async()=>{try{const r=await fetch('./contents/index.json',{cache:'no-store'});if(!r.ok)return;this.data=await r.json();if(this.active){const playing=[...this.root.querySelectorAll('audio,video')].some(n=>!n.paused);if(!playing)this.open(this.id);else this.pending=true;}}catch{}};
      }
    }
    pauseMedia(){this.root.querySelectorAll('audio,video').forEach(n=>n.pause());}
    cleanup(){this.pauseMedia();this.cleanups.splice(0).forEach(fn=>fn());}
    close(){this.cleanup();this.active=false;this.root.hidden=true;this.dialog.classList.remove('hobby-mode');}
    open(id){
      const i=typeof id==='number'?id:ids.indexOf(id);if(i<0)return;
      this.cleanup();this.active=true;this.id=ids[i];this.root.hidden=false;this.dialog.classList.add('hobby-mode');
      document.querySelector('#dialogTitle').textContent=titles[i];document.querySelector('#dialogTag').textContent=`0${i+1} / ${subtitles[i]}`;
      this.root.replaceChildren();
      const nav=el('nav','hobby-nav');nav.setAttribute('aria-label','Hobby rooms');
      titles.forEach((t,j)=>{const b=button(t,()=>this.open(j));b.setAttribute('aria-current',String(j===i));nav.append(b);});this.root.append(nav);
      const intro=['One story on the shelf. Open the book, turn its pages, and step into its world.','Choose a recording, then press Play. A small stage for the songs between everything else.','A little game break. Jump the obstacles for 30 seconds, then explore the games I enjoy.','Browse a sketchbook. Select a drawing and take a closer look.','Posters, illustration and composition. Select a piece to see the complete design.','Select a film, press Play, and follow the cut along the timeline.'][i];
      this.root.append(el('p','hobby-intro',intro));
      const grid=el('div','hobby-grid');this.main=el('div','hobby-main');this.side=el('aside','hobby-side');grid.append(this.main,this.side);this.root.append(grid);
      this[ids[i]]();
      const footer=el('div','hobby-toolbar');footer.append(button('← Back to gallery',()=>this.dialog.close()),el('span','hobby-counter',`0${i+1} / 06 · ${subtitles[i]}`));this.root.append(footer);
      if(this.pending){this.root.append(el('p','hobby-new','Collection updated. Select a recording to load the latest files.'));this.pending=false;}
    }
    list(items,onSelect,heading='COLLECTION'){
      this.side.append(el('h3','',heading));const list=el('div','hobby-list');this.side.append(list);
      if(!items.length)return;
      items.forEach((item,i)=>{const b=button('',()=>{this.selected[this.id]=i;onSelect(item);for(const [j,n]of [...list.children].entries())n.setAttribute('aria-pressed',String(i===j));},'hobby-card');if(item.poster||/\.(png|jpe?g|webp|gif|avif)(?:$|\?)/i.test(item.src))b.append(img(item.poster||item.src,item.title));b.append(el('span','',item.title));b.setAttribute('aria-pressed',String(i===(this.selected[this.id]||0)));list.append(b);});
      const at=Math.min(this.selected[this.id]||0,items.length-1);this.selected[this.id]=at;onSelect(items[at]);
    }
    room(canvas,kind,time=0,playing=false){
      const c=canvas.getContext('2d'),r=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};c.imageSmoothingEnabled=false;r(0,0,640,240,'#111c29');
      for(let x=0;x<640;x+=80)r(x,0,2,200,'#283341');r(0,200,640,40,'#65503c');for(let x=0;x<640;x+=70)r(x,204,2,36,'#342f2b');
      c.fillStyle='#f9d08e18';c.beginPath();c.moveTo(320,0);c.lineTo(175,200);c.lineTo(465,200);c.fill();r(293,4,54,8,'#dac092');
      if(kind===1){for(const x of [70,490]){r(x,100,80,100,'#435462');r(x+8,108,64,84,'#15232f');for(const y of [131,172]){c.fillStyle='#75938f';c.beginPath();c.arc(x+40,y,16,0,7);c.fill();c.fillStyle='#1d323b';c.beginPath();c.arc(x+40,y,9,0,7);c.fill();}}r(317,92,6,112,'#9badb3');r(294,201,52,5,'#adbbb9');r(306,68,28,37,'#dae2cf');for(let y=74;y<102;y+=6)r(309,y,22,2,'#536879');}
      else {c.save();c.translate(320,112);c.scale(2,2);if(typeof drawHobbyObject==='function')drawHobbyObject(c,kind,time);c.restore();}
      for(let i=0;i<17;i++)r(245+i*9,224-(playing?Math.sin(time*8+i)*8+10:3),5,playing?Math.sin(time*8+i)*8+12:3,'#9de8c4');
    }
    scene(kind){const s=el('div','hobby-stage'),c=el('canvas');c.width=640;c.height=240;s.append(c);this.main.append(s);this.room(c,kind);return c;}
    writing(){
      const book=this.data.writing||{title:'Placeholder Teddy',links:[]};
      const desk=el('div','book-desk'),page=el('article','book-page');desk.append(page);this.main.append(desk);
      const teddy=el('div','book-teddy');teddy.setAttribute('aria-hidden','true');const cv=el('canvas');cv.width=25;cv.height=30;const c=cv.getContext('2d');c.fillStyle='#ac7546';[[4,2,5,5],[17,2,5,5],[5,5,16,13],[6,18,14,10],[1,19,5,7],[20,19,5,7],[3,26,7,4],[16,26,7,4]].forEach(a=>c.fillRect(...a));c.fillStyle='#32271f';c.fillRect(9,9,2,2);c.fillRect(16,9,2,2);c.fillRect(12,13,3,2);c.fillRect(9,18,8,3);teddy.append(cv);desk.append(teddy);
      const controls=el('div','hobby-controls book-index');const prev=button('← Previous page',()=>show(this.page-1,-1)),next=button('Turn page →',()=>show(this.page+1,1)),count=el('span','hobby-counter');count.setAttribute('aria-live','polite');controls.append(prev,count,next);this.main.append(controls);
      const show=(p,dir=0)=>{this.page=Math.max(0,Math.min(2,p));page.replaceChildren();page.className='book-page'+(this.page===0?' cover':'');
        if(this.page===0){if(book.cover)page.append(img(book.cover,'Placeholder Teddy — pixel-art cover with a bride and teddy'));else page.append(el('h3','',book.title));}
        if(this.page===1){page.append(el('span','book-author',book.author||'Madhur Budhwani'),el('h3','',book.heading||book.title),el('p','',book.summary||'The story introduction will be here soon.'));}
        if(this.page===2){page.append(el('span','book-author','CONTINUE THE STORY'),el('h3','','Read Placeholder Teddy'));if(book.links?.length){for(const link of book.links){const a=el('a','',link.label+' ↗');a.href=link.href;a.target='_blank';a.rel='noopener noreferrer';page.append(a);}}else page.append(el('p','','Reading and publication links will be added here when available.'));}
        if(dir){void page.offsetWidth;page.classList.add(dir>0?'turn-next':'turn-prev');}prev.disabled=this.page===0;next.disabled=this.page===2;count.textContent=`${this.page+1} / 3`;};
      this.side.append(el('h3','','ON THE SHELF'));const shelf=el('div','book-shelf');shelf.append(button('Placeholder Teddy',()=>show(0,-1),'book-spine'));this.side.append(shelf,el('p','hobby-note','A novel by Madhur Budhwani. Three pages: the cover, the story, and where to read it.'));show(this.page);
    }
    singing(){
      const shell=el('div','listening-stage'),cv=el('canvas');cv.width=640;cv.height=240;shell.append(cv);this.main.append(shell);this.room(cv,1);
      const title=el('h3','hobby-track-title','The listening room'),note=el('p','hobby-note'),audio=el('audio','hobby-audio');audio.controls=true;audio.preload='metadata';audio.setAttribute('aria-label','Recording playback');this.main.append(title,note,audio);
      const eq=el('div','eq');eq.setAttribute('aria-hidden','true');for(let i=0;i<28;i++)eq.append(el('i'));this.main.append(eq);
      let context,analyser,source,raf=0;const bins=new Uint8Array(64);
      const stop=()=>{cancelAnimationFrame(raf);[...eq.children].forEach(n=>n.style.height='4px');this.room(cv,1);};
      const tick=t=>{if(audio.paused)return;if(analyser)analyser.getByteFrequencyData(bins);[...eq.children].forEach((n,i)=>n.style.height=(4+(analyser?bins[i*2]/255*36:10+Math.sin(t/100+i)*8))+'px');this.room(cv,1,t/1000,!matchMedia('(prefers-reduced-motion: reduce)').matches);raf=requestAnimationFrame(tick);};
      audio.addEventListener('play',()=>{try{if(!context){context=new(window.AudioContext||window.webkitAudioContext)();analyser=context.createAnalyser();analyser.fftSize=128;source=context.createMediaElementSource(audio);source.connect(analyser);analyser.connect(context.destination);}context.resume().catch(()=>{});}catch{}cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);});audio.addEventListener('pause',stop);audio.addEventListener('ended',stop);audio.addEventListener('error',()=>note.textContent='This recording could not play. Try another track or a browser-supported audio format.');
      this.cleanups.push(()=>{stop();if(context)context.close().catch(()=>{});audio.removeAttribute('src');audio.load();});
      const items=this.data.singing||[];this.list(items,item=>{audio.pause();audio.src=item.src;title.textContent=item.title;note.textContent=item.note||'Choose Play to listen.';shell.querySelector('img')?.remove();if(item.poster){const a=img(item.poster,item.title+' album art');a.className='track-art';shell.append(a);}},'RECORDINGS');if(!items.length){audio.hidden=true;this.side.append(empty('The mic is ready','Recordings will appear here soon.'));}
    }
    gaming(){
      const cab=el('div','arcade-cabinet'),cv=el('canvas');cv.width=640;cv.height=300;cv.tabIndex=0;cv.setAttribute('aria-label','Thirty-second obstacle runner. Press Space or the Jump button to jump.');const state=el('p','arcade-status','READY · 30 seconds · Three hearts');state.setAttribute('aria-live','polite');cab.append(el('div','arcade-marquee','AFTER HOURS / RUN'),cv,state);this.main.append(cab);
      let running=false,paused=false,elapsed=0,last=0,nextSpawn=1.5,obstacles=[],y=0,vy=0,hits=0,invincible=0,score=0,raf=0;const c=cv.getContext('2d');
      const controls=el('div','hobby-controls'),start=button('Start run',()=>{running=true;paused=false;elapsed=0;nextSpawn=1.5;obstacles=[];y=vy=hits=score=invincible=0;last=0;start.textContent='Restart';pause.disabled=false;pause.textContent='Pause';jump.disabled=false;state.textContent='RUNNING · Jump over the blocks';cv.focus();}),jump=button('Jump ↑',()=>doJump()),pause=button('Pause',()=>{if(running){paused=!paused;pause.textContent=paused?'Resume':'Pause';state.textContent=paused?'PAUSED':`RUNNING · ${Math.ceil(30-elapsed)} seconds left`;}});jump.disabled=true;pause.disabled=true;controls.append(start,jump,pause);cab.append(controls);
      const doJump=()=>{if(running&&!paused&&y===0)vy=520;};
      const key=e=>{if(this.active&&this.id==='gaming'&&e.code==='Space'&&!e.target.closest('button,input')){e.preventDefault();if(!e.repeat)doJump();}};addEventListener('keydown',key);cv.addEventListener('pointerdown',doJump);
      const finish=win=>{running=false;jump.disabled=true;pause.disabled=true;start.textContent='Replay';state.textContent=win?`FINISH! ${score} obstacles cleared. Play again?`:`Three hits · ${score} obstacles cleared. Try again!`;};
      const tick=t=>{const dt=Math.min(last?(t-last)/1000:0,.04);last=t;if(running&&!paused&&!document.hidden&&!window.landscapePrompt?.blocked){elapsed+=dt;invincible=Math.max(0,invincible-dt);y=Math.max(0,y+vy*dt);vy-=1400*dt;if(y===0)vy=0;
          if(elapsed>=nextSpawn){obstacles.push({x:670,w:25+(Math.floor(elapsed)%3)*9,h:30+(Math.floor(elapsed)%2)*18,counted:false});nextSpawn+=1.25+(Math.floor(elapsed)%3)*.18;}
          for(const o of obstacles){o.x-=(240+elapsed*3)*dt;if(!o.counted&&o.x+o.w<98){score++;o.counted=true;}if(!invincible&&o.x<126&&o.x+o.w>98&&y<o.h){hits++;invincible=1;state.textContent=`${3-hits} hearts left · Keep going`;if(hits===3)finish(false);}}obstacles=obstacles.filter(o=>o.x>-60);if(elapsed>=30&&running)finish(true);}
        c.fillStyle='#101d2c';c.fillRect(0,0,640,300);for(let i=0;i<25;i++){c.fillStyle=i%2?'#486677':'#90b8ba';c.fillRect((i*83-elapsed*12+1000)%660,i*23%150,2,2);}for(let i=0;i<9;i++){c.fillStyle='#243847';c.fillRect((i*98-elapsed*30+2000)%780-100,130+(i%3)*18,65,130);}c.fillStyle='#92c6a2';c.fillRect(0,250,640,4);c.fillStyle='#283b40';c.fillRect(0,254,640,46);
        c.fillStyle='#e7ac83';c.fillRect(98,208-y,25,20);c.fillStyle=invincible?'#ffc676':'#88ecc0';c.fillRect(96,228-y,30,18);c.fillStyle='#202731';c.fillRect(95,204-y,29,8);c.fillStyle='#17262d';c.fillRect(118,214-y,4,4);c.fillStyle='#b4c0b4';c.fillRect(98,246-y,10,5);c.fillRect(116,246-y,10,5);
        for(const o of obstacles){c.fillStyle='#b37c91';c.fillRect(o.x,250-o.h,o.w,o.h);c.fillStyle='#efb493';c.fillRect(o.x,250-o.h,o.w,5);}c.fillStyle='#d2efd8';c.font='14px monospace';c.fillText(`${Math.max(0,30-Math.floor(elapsed))}s`,20,28);c.fillText('♥'.repeat(Math.max(0,3-hits)),550,28);c.fillText(`CLEARED ${score}`,240,28);
        if(!running||paused){c.fillStyle='#07121acc';c.fillRect(170,96,300,85);c.fillStyle='#f0d195';c.font='bold 19px monospace';c.textAlign='center';c.fillText(paused?'PAUSED':elapsed?'TRY ANOTHER RUN':'READY, PLAYER?',320,133);c.font='12px monospace';c.fillText('SPACE / TAP TO JUMP',320,160);c.textAlign='left';}raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);this.cleanups.push(()=>{cancelAnimationFrame(raf);removeEventListener('keydown',key);});
      const items=this.data.gaming||[];this.side.classList.add('hobby-games');const note=el('p','hobby-note');this.list(items,item=>{note.textContent=item.note||item.title;},'GAMES I ENJOY');this.side.append(note);if(!items.length)this.side.append(empty('More worlds to explore','My favourite-games collection is on its way.'));
    }
    drawing(){this.art('drawing');}
    design(){this.art('design');}
    art(kind){
      const design=kind==='design',items=this.data[kind]||[];let stopProcess=()=>{};
      this.cleanups.push(()=>stopProcess());
      const select=item=>{stopProcess();this.main.replaceChildren();const desk=el('div','art-desk'+(design?' design-desk':'')),view=el('div','art-viewport');desk.append(view);this.main.append(desk);view.append(img(item.src,item.title));this.main.append(el('h3','hobby-track-title',item.title),el('p','hobby-note',item.note));const controls=el('div','hobby-controls');this.main.append(controls);
        controls.append(button('Zoom / full view',()=>{const d=el('dialog','hobby-zoom-dialog');d.setAttribute('aria-label',item.title+' full view');d.append(button('← Return to '+(design?'studio':'sketchbook'),()=>d.close()),img(item.src,item.title));document.body.append(d);d.addEventListener('close',()=>d.remove(),{once:true});d.showModal();this.cleanups.push(()=>{if(d.open)d.close();d.remove();});}));
        if(item.before){const wrap=el('div','art-compare'),after=img(item.src,item.title+' finished'),before=img(item.before,item.title+' earlier version'),line=el('i','compare-line');before.className='compare-before';wrap.append(after,before,line);view.replaceChildren(wrap);const labels=el('div','art-labels');labels.append(el('span','',design?'ORIGINAL / EARLIER VERSION':'SKETCH'),el('span','',design?'EDITED VERSION':'FINISHED'));desk.after(labels);const label=el('label','',design?'Compare versions':'Sketch → finished'),range=el('input');range.type='range';range.min='0';range.max='100';range.value='50';range.setAttribute('aria-label',design?'Compare original and edited design':'Compare sketch and finished drawing');range.addEventListener('input',()=>wrap.style.setProperty('--split',range.value+'%'));label.append(range);controls.append(label);}
        if(item.layers?.length){const layerButton=button('Show layers',()=>{const stack=el('div','layer-stack exploded');item.layers.forEach((src,i)=>{const layer=img(src,item.title+' layer '+(i+1));layer.style.setProperty('--layer',i);stack.append(layer);});view.replaceChildren(stack);controls.append(button('Assemble',()=>stack.classList.remove('exploded')));layerButton.disabled=true;});controls.append(layerButton);}
        if(item.process?.length){controls.append(button('Replay process',()=>{stopProcess();let step=0;const image=img(item.process[0],item.title+' process stage 1');view.replaceChildren(image);const timer=setInterval(()=>{step++;image.src=step<item.process.length?item.process[step]:item.src;image.alt=item.title+' process stage '+(step+1);if(step>=item.process.length)stopProcess();},matchMedia('(prefers-reduced-motion: reduce)').matches?100:900);stopProcess=()=>clearInterval(timer);}));}
      };
      this.list(items,select,design?'SELECTED WORK':'SKETCHBOOK');if(!items.length){this.scene(design?4:3);this.main.append(empty(design?'The studio is ready':'A fresh page','Original work will appear in this collection soon.'));}
    }
    video(){
      const monitor=el('div','editing-monitor'),video=el('video');video.controls=true;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-label','Video edit playback');monitor.append(video);const strip=el('div','filmstrip');strip.setAttribute('aria-hidden','true');for(let i=0;i<9;i++)strip.append(el('span'));const timeline=el('div','edit-timeline'),cursor=el('i');timeline.append(cursor);const time=el('div','edit-time','00:00 / 00:00'),title=el('h3','hobby-track-title'),note=el('p','hobby-note'),controls=el('div','hobby-controls');this.main.append(monitor,strip,timeline,time,title,note,controls);
      const fmt=s=>Number.isFinite(s)?`${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`:'00:00';const update=()=>{cursor.style.left=(Number.isFinite(video.duration)&&video.duration?100*video.currentTime/video.duration:0)+'%';time.textContent=`${fmt(video.currentTime)} / ${fmt(video.duration)}`;};video.addEventListener('timeupdate',update);video.addEventListener('loadedmetadata',update);video.addEventListener('error',()=>note.textContent='This clip could not play. Try another clip or a browser-supported video format.');this.cleanups.push(()=>{video.pause();video.removeAttribute('src');video.load();});
      const items=this.data.video||[];this.list(items,item=>{video.pause();video.src=item.src;video.poster=item.poster||'';title.textContent=item.title;note.textContent=item.note||'Final edit';controls.replaceChildren();update();if(item.before){for(const [label,src]of [['Raw',item.before],['Edited',item.src]])controls.append(button(label,()=>{const t=video.currentTime;video.pause();video.src=src;video.addEventListener('loadedmetadata',()=>{video.currentTime=Math.min(t,video.duration||0);},{once:true});}));}},'FILMS & EDITS');if(!items.length){video.hidden=true;monitor.append(empty('The next cut','Films will appear here soon.'));}
    }
  }
  window.HobbyGallery=HobbyGallery;
})();
