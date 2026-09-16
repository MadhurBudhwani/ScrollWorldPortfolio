// Playable portal worlds: input controls physics; the camera only follows the player.
(() => {
  const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const params=new URLSearchParams(location.search),key=Object.hasOwn(worldLevels,params.get('world'))?params.get('world'):'work';
  const level=worldLevels[key],game=new WorldPhysics(level);
  const stage=$('#stage'),viewport=new SceneViewport($('#sceneViewport'),stage,{fixed:true});
  const canvas=$('#universe'),c=canvas.getContext('2d',{alpha:false}),front=$('#foreground'),f=front.getContext('2d');
  const actor=$('#worldAvatar'),avatar=window.AvatarAnimator?new AvatarAnimator(actor):null;
  const dialog=$('#worldDialog'),buttons=[...document.querySelectorAll('[data-action]')],keys=new Set(),pointers=new Map(),visited=new Set();
  const lab=new LunarLab(dialog);
  const hobbies=window.HobbyGallery?new HobbyGallery(dialog):null;
  const about=window.AboutWorld?new AboutWorld(dialog):null;
  const blaster=level.kind==='observatory'?new AboutBlaster(level):null;
  const camera={x:0,y:0},dog={x:95,y:740,facing:1,lastMotion:0,gait:0};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let last=0,accumulator=0,clock=0,jumpPending=false,dpr=1,demoIndex=0,wasGrounded=true,dust=0,lastRespawns=0;
  $('#worldTitle').textContent=level.title;$('#worldSubtitle').textContent=level.subtitle;$('#worldHint').textContent=level.hint;
  document.title=level.title+' | Madhur Budhwani';
  $('#powerLabel').textContent=level.power||'';$('[data-action="power"]').hidden=!level.power;
  $('[data-action="power"]').setAttribute('aria-label',level.kind==='city'?'Hold to attach a web; release to launch':level.kind==='gallery'?'Toggle dog and jetpack':level.kind==='observatory'?'Fire a blue palm laser at the nearest constellation':'Hold for jetpack boost');
  $('[data-action="climb"]').hidden=level.kind!=='city';
  $('[data-action="descend"]').hidden=level.kind!=='gallery';
  $('#worldFuel').hidden=level.kind!=='moon';
  if(params.get('avatar')==='original')$('.world-return').href='./index.html?avatar=original#hub';
  const blocked=()=>dialog.open||window.landscapePrompt?.blocked||document.hidden;
  const held=action=>keys.has(action)||[...pointers.values()].includes(action);
  function clearInput(){keys.clear();pointers.clear();jumpPending=false;accumulator=0;game.release();buttons.forEach(b=>b.classList.remove('is-held'));}
  function resize(){viewport.resize();dpr=Math.min(devicePixelRatio||1,1.5);for(const cv of [canvas,front]){cv.width=1600*dpr;cv.height=900*dpr;}c.setTransform(dpr,0,0,dpr,0,0);f.setTransform(dpr,0,0,dpr,0,0);c.imageSmoothingEnabled=false;f.imageSmoothingEnabled=false;clearInput();}
  function openPanel(title,tag,body,steps,links=[]){
    lab.close();
    hobbies?.close();
    about?.close();
    clearInput();$('#dialogTitle').textContent=title;$('#dialogTag').textContent=tag;$('#dialogBody').textContent=body;
    const projectLinks=$('#dialogLinks');projectLinks.replaceChildren();projectLinks.hidden=!links.length;
    for(const link of links){const a=document.createElement('a');a.href=link.href;a.textContent=link.label+' ↗';a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',link.label+' (opens in a new tab)');projectLinks.append(a);}
    $('#dialogDemo').hidden=!steps;$('#demoSteps').replaceChildren();demoIndex=0;
    for(const text of steps||[]){const li=document.createElement('li');li.textContent=text;$('#demoSteps').append(li);}
    $('#demoNext').textContent='Next step';dialog.showModal();$('#closeDialog').focus();
  }
  function interact(){const exhibit=game.nearby();if(!exhibit||blocked())return;visited.add(exhibit.title);game.player.vx=0;render(0);openPanel(exhibit.title,exhibit.tag,exhibit.body,exhibit.steps,exhibit.links);if(exhibit.lab)lab.open(exhibit.lab);if(level.kind==='gallery')hobbies?.open(exhibit.art);if(level.kind==='observatory')about?.open(exhibit.about);}
  $('#closeDialog').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',clearInput);
  $('#demoNext').addEventListener('click',()=>{const items=[...$('#demoSteps').children];if(demoIndex===items.length){demoIndex=0;items.forEach(li=>li.classList.remove('is-complete'));}else items[demoIndex++].classList.add('is-complete');$('#demoNext').textContent=demoIndex===items.length?'Replay':'Next step';});
  $('#helpButton').addEventListener('click',()=>openPanel('You are in control','PLAYABLE WORLD',level.hint.replaceAll(' · ','\n')+'\n\nTouch: hold the arrow buttons to move. '+(level.kind==='gallery'?'Tap JETPACK to transform your dog, then hold RISE or DOWN to fly. Release them to hover. Tap DOG to transform back. Boost is unlimited.': level.kind==='observatory'?'Tap JUMP. Tap LASER to fire at the nearest constellation; its colour changes for three seconds.':'Tap JUMP; hold '+level.power+' as needed.')+(level.kind==='city'?' Once attached, hold CLIMB together with WEB to climb. Release CLIMB to swing at that height.':'')+' OPEN works near an exhibit.\n\nSpace is jump in every playable area; hold it to rise with the gallery jetpack. W is reserved for web climbing.\n\nR / Reset: return to the last safe landing. Falling recovers automatically. Wheel and swipe do not move the world.'));
  $('#rescueButton').addEventListener('click',()=>{clearInput();game.reset();camera.x=clamp(game.player.x-560,0,level.width-1600);camera.y=0;dog.x=game.player.x-80;dog.y=game.player.y;});
  $('#nearbyExhibit').addEventListener('click',interact);
  const keyActions={KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump',KeyW:'climb',KeyS:'descend',ArrowDown:'descend',ShiftLeft:'power',ShiftRight:'power',KeyE:'interact'};
  addEventListener('keydown',e=>{
    if(blocked()||e.ctrlKey||e.metaKey||e.altKey||e.target.closest?.('input,textarea,select,[contenteditable="true"]'))return;
    if(e.target.closest?.('button,a')&&['Space','Enter'].includes(e.code))return;
    if(e.code==='KeyR'){e.preventDefault();if(!e.repeat)$('#rescueButton').click();return;}
    if(e.code==='Escape'){e.preventDefault();$('#helpButton').click();return;}
    const action=keyActions[e.code];if(!action)return;e.preventDefault();
    if(action==='interact'){if(!e.repeat)interact();return;}
    if(action==='power'&&level.kind==='gallery'){if(!e.repeat)game.toggleJetpack();return;}
    if(action==='power'&&blaster){if(!e.repeat)blaster.fire(game.player);return;}
    if(action==='jump'&&!e.repeat)jumpPending=true;
    keys.add(action);
  });
  addEventListener('keyup',e=>{const action=keyActions[e.code];keys.delete(action);if(action==='power'&&!held('power'))game.release();});
  for(const button of buttons){
    const action=button.dataset.action;
    button.addEventListener('pointerdown',e=>{
      if(e.button!==0||blocked()||button.disabled)return;e.preventDefault();
      if(action==='interact'){interact();return;}
      if(action==='power'&&level.kind==='gallery'){game.toggleJetpack();return;}
      if(action==='power'&&blaster){blaster.fire(game.player);return;}
      pointers.set(e.pointerId,action);button.setPointerCapture(e.pointerId);button.classList.add('is-held');
      if(action==='jump')jumpPending=true;
    });
    const release=e=>{pointers.delete(e.pointerId);if(!held(action))button.classList.remove('is-held');if(action==='power'&&!held(action))game.release();};
    for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,release);
    button.addEventListener('contextmenu',e=>e.preventDefault());
    button.addEventListener('keydown',e=>{if(![' ','Enter'].includes(e.key)||blocked())return;e.preventDefault();if(action==='interact'){if(!e.repeat)interact();return;}if(action==='power'&&level.kind==='gallery'){if(!e.repeat)game.toggleJetpack();return;}if(action==='power'&&blaster){if(!e.repeat)blaster.fire(game.player);return;}keys.add(action);button.classList.add('is-held');if(action==='jump'&&!e.repeat)jumpPending=true;});
    button.addEventListener('keyup',e=>{if(![' ','Enter'].includes(e.key))return;e.preventDefault();keys.delete(action);button.classList.remove('is-held');if(action==='power')game.release();});
    button.addEventListener('blur',()=>{keys.delete(action);for(const [id,a] of pointers)if(a===action)pointers.delete(id);button.classList.remove('is-held');if(action==='power')game.release();});
    button.addEventListener('click',e=>{if(e.detail!==0||blocked())return;if(action==='interact')interact();if(action==='jump')jumpPending=true;if(action==='power'&&level.kind==='gallery')game.toggleJetpack();if(action==='power'&&blaster)blaster.fire(game.player);});
  }
  addEventListener('blur',clearInput);document.addEventListener('visibilitychange',clearInput);addEventListener('resize',resize);
  addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.target.closest?.('dialog'))e.preventDefault();},{passive:false});
  function rect(x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
  function label(text,x,y,size=18,color='#dbece5',align='left'){c.font=`600 ${size}px monospace`;c.fillStyle=color;c.textAlign=align;c.fillText(text,x,y);}
  function line(points,color,width=2,context=c){context.strokeStyle=color;context.lineWidth=width;context.beginPath();points.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));context.stroke();}
  function background(){
    if(level.kind==='observatory'){AboutScene.sky(c,camera,reduced.matches?0:clock);return;}
    const gradient=c.createLinearGradient(0,0,0,900);gradient.addColorStop(0,level.kind==='gallery'?'#181b22':'#060d19');gradient.addColorStop(1,level.kind==='city'?'#162330':level.kind==='moon'?'#10212e':'#2b252a');c.fillStyle=gradient;c.fillRect(0,0,1600,900);
    if(level.kind==='gallery')return;
    for(let i=0;i<105;i++){const x=((i*173.41-camera.x*.07)%1600+1600)%1600,y=(i*91.73)%590;rect(x,y,i%9===0?4:2,i%9===0?4:2,i%4?'#516775':'#a9c9c6');}
    if(level.kind==='city'){
      for(let layer=0;layer<2;layer++)for(let i=-2;i<24;i++){
        const w=95+(i*37+500)%70,x=i*145-camera.x*(layer?.2:.09),h=150+((i+30)*79)%230,y=740-h;
        rect(x,y,w,h+200,layer?'#172f3a':'#0e202e');rect(x+15,y-12,w-30,12,'#223844');
        for(let wy=y+24;wy<740;wy+=30)for(let wx=x+14;wx<x+w-12;wx+=25)if((Math.floor(wx)+wy)%3)rect(wx,wy,7,12,layer?'#315150':'#1b343e');
      }
    }else{
      c.save();c.translate(1290-camera.x*.05,220);c.beginPath();c.arc(0,0,96,0,Math.PI*2);c.fillStyle='#32627b';c.fill();c.clip();
      for(let i=0;i<18;i++)rect(-90+(i*47)%170,-80+(i*33)%150,35+(i%3)*16,13,'#619590');c.restore();
      c.fillStyle='#1c3441';c.beginPath();c.moveTo(0,770);for(let x=0;x<=1700;x+=100)c.lineTo(x,655+Math.sin((x+camera.x*.16)/180)*50);c.lineTo(1600,900);c.lineTo(0,900);c.fill();
    }
  }
  function city(){
    for(const [i,p] of level.platforms.entries()){
      rect(p.x,p.y,p.w,900,'#152a33');rect(p.x+12,p.y+20,p.w-24,900,'#1d3641');
      rect(p.x,p.y-10,p.w,10,'#a6d1c4');rect(p.x,p.y,p.w,8,'#426e6b');
      for(let x=p.x+28;x<p.x+p.w-22;x+=48)for(let y=p.y+45;y<1060;y+=58){rect(x,y,24,31,'#0a1c25');if((x+y)%5)rect(x+3,y+4,18,17,(x+y)%3?'#56766d':'#b29763');}
      rect(p.x+35,p.y-42,72,32,'#344d53');rect(p.x+39,p.y-46,64,5,'#7d9592');
      for(let n=0;n<5;n++)rect(p.x+42+n*12,p.y-34,4,19,'#162e37');
      label('0'+(i+1),p.x+25,p.y+115,32,'#779e9a');
    }
    const candidate=game.candidate();
    for(const a of level.anchors){
      const support=level.platforms.reduce((best,p)=>Math.abs(p.x+p.w/2-a.x)<Math.abs(best.x+best.w/2-a.x)?p:best,level.platforms[0]);
      const base=clamp(a.x,support.x+30,support.x+support.w-30);
      line([[base,support.y-12],[base,a.y-30],[a.x,a.y-30],[a.x,a.y]],'#3e6470',8);
      line([[base,support.y-140],[base+(a.x-base)*.6,a.y-30]],'#304b58',4);
      const active=(game.rope?.anchor||game.webShot?.anchor||candidate)===a;
      rect(a.x-12,a.y-12,24,24,active?'#97ffce':'#466877');rect(a.x-6,a.y-6,12,12,'#0b2530');
      if(active){c.strokeStyle='#84f5ad';c.lineWidth=2;c.strokeRect(a.x-21,a.y-21,42,42);label(game.rope?'ATTACHED':game.webShot?'LAUNCHING':'SHIFT / WEB',a.x,a.y-40,12,'#adffd9','center');}
    }
  }
  function moon(){
    for(const p of level.platforms){
      rect(p.x,p.y,p.w,34,'#91a4aa');rect(p.x+8,p.y+34,p.w-16,900,'#435761');rect(p.x+20,p.y+65,p.w-40,900,'#344852');
      for(let j=0;j<12;j++){const x=p.x+30+(j*73)%(p.w-70),y=p.y+65+(j*47)%240;rect(x,y,24,7,'#213844');rect(x+5,y+7,24,10,'#3d5560');}
      rect(p.x+12,p.y-5,p.w-24,5,'#dce7dc');
    }
  }
  function gallery(){
    rect(0,0,level.width,740,'#262930');rect(0,125,level.width,8,'#746555');
    for(let x=0;x<level.width;x+=160){rect(x,140,2,600,'#35383d');rect(x,740,2,160,'#54483e');}
    rect(0,740,level.width,160,'#3d3731');rect(0,740,level.width,7,'#ba9c70');
    for(let y=765;y<900;y+=34)line([[0,y],[level.width,y]],'#544a3d');
    for(const e of level.exhibits){
      c.save();c.globalAlpha=.1;c.fillStyle='#ffdeb0';c.beginPath();c.moveTo(e.x,137);c.lineTo(e.x-220,650);c.lineTo(e.x+220,650);c.closePath();c.fill();c.restore();
      rect(e.x-34,133,68,14,'#b7a17d');rect(e.x-185,295,370,265,'#141b22');rect(e.x-179,301,358,253,'#b49a72');rect(e.x-167,313,334,229,'#e1d7bc');rect(e.x-146,334,292,187,'#172e36');
      c.save();c.translate(e.x,425);c.beginPath();c.rect(-146,-91,292,187);c.clip();c.scale(2.5,2.5);drawHobbyObject(c,e.art,reduced.matches?0:clock);c.restore();
      label(e.title.toUpperCase(),e.x,606,22,'#e4d7bd','center');label(e.tag,e.x,633,12,'#a79882','center');
      rect(e.x-70,682,140,10,'#a7957b');rect(e.x-55,692,10,48,'#65594b');rect(e.x+45,692,10,48,'#65594b');
    }
  }
  function stations(){
    if(level.kind==='observatory')return;
    for(const e of level.exhibits){
      if(e.x<camera.x-500||e.x>camera.x+2000)continue;
      if(level.kind==='moon'){
        rect(e.x-85,e.floor-112,170,112,'#213e4b');rect(e.x-70,e.floor-137,140,25,'#aec1c4');rect(e.x-64,e.floor-102,128,72,'#80bdc4');rect(e.x-55,e.floor-93,110,52,'#102c3b');
        const type=['search','data','automate','agents','trust','reliable'].indexOf(e.lab);
        for(let k=0;k<4;k++)rect(e.x-43,e.floor-83+k*10,18+((k+type)%4)*16,3,k%2?'#67daf5':'#84f5ad');
        // Distinct pixel instrument silhouettes identify each laboratory from the route.
        const ix=e.x+36,iy=e.floor-72;
        if(type===0){rect(ix-7,iy-17,25,3,'#67daf5');rect(ix-7,iy+4,25,3,'#67daf5');rect(ix-7,iy-14,3,18,'#67daf5');rect(ix+15,iy-14,3,18,'#67daf5');rect(ix+16,iy+7,5,12,'#84f5ad');}
        else if(type===1){for(let k=0;k<3;k++)rect(ix-8+k*10,iy+14-k*10,6,10+k*10,'#67daf5');}
        else if(type===4){for(let k=0;k<4;k++)rect(ix-13+k*4,iy-17+k*9,32-k*8,7,'#84f5ad');}
        else{for(let k=0;k<3;k++){rect(ix-12+k*12,iy-15+(k%2)*21,8,8,'#67daf5');rect(ix-7+k*12,iy-6,2,15,'#84f5ad');}}
        rect(e.x+95,e.floor-190,5,190,'#a5bab9');rect(e.x+100,e.floor-187,68,37,'#548880');label('0'+(type+1),e.x+134,e.floor-162,18,'#e9ffef','center');
      }else if(level.kind==='city'){
        rect(e.x-160,e.floor-230,320,124,'#091b25');c.strokeStyle='#476e75';c.lineWidth=3;c.strokeRect(e.x-160,e.floor-230,320,124);
        rect(e.x-118,e.floor-104,5,104,'#355661');rect(e.x+113,e.floor-104,5,104,'#355661');
      }
      if(level.kind==='city'){
        const lines=e.signTitle||[e.title];lines.forEach((text,i)=>label(text,e.x,e.floor-(lines.length===1?190:202)+i*25,22,'#e0f0e7','center'));
        label(e.role,e.x,e.floor-147,12,'#b7d2ca','center');label(e.tag,e.x,e.floor-124,11,'#85aaa3','center');
      }else if(level.kind==='moon'){const lines=e.signTitle||[e.title];lines.forEach((text,i)=>label(text,e.x,e.floor-248+i*26,24,'#e0f0e7','center'));label(e.tag,e.x,e.floor-197,11,'#85aaa3','center');}
      if(visited.has(e.title)){label('EXPLORED',e.x,e.floor-20,11,'#84f5ad','center');}
    }
  }
  function backAttachment(){
    const p=game.player,anchor=avatar?.getBackAnchor?.();
    if(anchor)return viewport.point(anchor.x,anchor.y);
    return {x:p.x-camera.x-p.facing*5,y:p.y-camera.y-83};
  }
  function jetpack(){
    const blend=game.jetpackBlend;if(!blend)return;
    const p=game.player,unfold=clamp((blend-.3)/.7,0,1);
    const back=backAttachment();
    c.save();c.translate(back.x,back.y);c.scale(p.facing*unfold*.72,unfold*.72);
    // Dog armor folds into two silver thruster pods, behind the avatar's back.
    c.fillStyle='#101a25';c.fillRect(-28,-28,46,49);c.fillStyle='#71858f';c.fillRect(-23,-24,30,39);
    c.fillStyle='#cad6dc';c.fillRect(6,-19,16,5);c.fillRect(5,11,13,5);
    for(const x of [-31,-8]){
      c.fillStyle='#101d29';c.beginPath();c.moveTo(x+5,-35);c.lineTo(x+15,-35);c.lineTo(x+20,-27);c.lineTo(x+20,18);c.lineTo(x+16,29);c.lineTo(x+4,29);c.lineTo(x,18);c.lineTo(x,-27);c.closePath();c.fill();
      c.fillStyle='#d8e3e7';c.fillRect(x+3,-26,14,42);c.fillRect(x+6,-31,8,5);
      c.fillStyle='#8d9da8';c.fillRect(x+3,-8,4,24);c.fillRect(x+14,-23,3,37);c.fillStyle='#f5ffff';c.fillRect(x+6,-26,7,3);
      c.fillStyle='#354b58';for(const y of [-4,5,14]){c.fillRect(x+6,y,10,2);c.fillRect(x+3,y-1,2,2);}
      c.fillStyle='#2c404c';c.fillRect(x+3,18,14,9);c.fillStyle='#8297a2';c.fillRect(x+4,20,12,3);
      c.fillStyle='#182c39';c.fillRect(x+5,-20,10,13);c.fillStyle='#61e2ff';c.fillRect(x+7,-18,6,9);c.fillStyle='#e9ffff';c.fillRect(x+8,-16,2,5);
      if(blend>.85&&!p.grounded){const flame=reduced.matches?22:18+(Math.floor(clock*22)%3)*5+(held('jump')?14:0);c.fillStyle='#23738a';c.fillRect(x+1,29,18,flame);c.fillStyle='#67daf5';c.fillRect(x+4,29,12,flame-4);c.fillStyle='#edffff';c.fillRect(x+7,29,6,Math.max(5,flame-12));}
    }
    c.restore();
  }
  function jetpackStraps(){
    const blend=game.jetpackBlend;if(blend<.65)return;
    const back=backAttachment(),p=game.player;
    f.save();f.globalAlpha=clamp((blend-.65)/.35,0,1);f.translate(back.x,back.y);f.scale(p.facing,1);
    // Two shoulder loops wrap around the body; the backplate stays underneath it.
    line([[-12,-15],[-7,-20],[0,-18],[4,-9],[5,16]],'#334650',3,f);
    line([[6,-17],[13,-14],[16,-5],[14,15]],'#334650',3,f);
    line([[-7,-18],[-1,-16],[2,-8]],'#b9cace',2,f);
    f.fillStyle='#c1cdd0';f.fillRect(3,6,5,5);f.fillRect(12,6,4,5);f.restore();
  }
  function pet(dt){
    const p=game.player,height=232*.56*.60;
    let targetX=p.x-p.facing*85,targetY=p.y;
    if(p.grounded){const floor=level.platforms[p.platform];targetX=clamp(targetX,floor.x+40,floor.x+floor.w-40);targetY=floor.y;}
    const oldX=dog.x;dog.x+=(targetX-dog.x)*Math.min(1,dt*10);dog.y+=(targetY-dog.y)*Math.min(1,dt*14);
    const moving=Math.abs(dog.x-oldX)>.03;
    if(moving){dog.facing=Math.sign(dog.x-oldX);dog.gait+=dt*10;}
    if(moving||!p.grounded)dog.lastMotion=clock;
    const frame=!p.grounded?2:moving?2+Math.floor(dog.gait)%2:clock-dog.lastMotion>5?0:1;
    if(!companionAtlas.complete||!companionAtlas.naturalWidth)return;
    const blend=game.jetpackBlend,[sx,sy,sw,sh]=companionSprites[frame],w=height*sw/sh;
    if(blend>0){
      if(blend>=1)return;
      const fold=blend*blend*(3-2*blend),back=backAttachment(),backX=back.x+camera.x,backY=back.y+camera.y;
      f.save();f.translate(dog.x+(backX-dog.x)*fold-camera.x,dog.y-height/2+(backY-dog.y+height/2)*fold-camera.y);f.scale(dog.facing,1);f.globalAlpha=1-clamp((blend-.65)/.35,0,1);
      for(let row=0;row<3;row++)for(let col=0;col<3;col++){
        const tw=w/3,th=height/3,px=(col-1)*tw,py=(row-1)*th;
        f.save();f.translate(px*(1-fold),py*(1-fold));if(!reduced.matches)f.rotate((col-1)*fold*1.2);f.scale(1-fold*.7,1-fold*.4);
        f.beginPath();f.rect(-tw/2,-th/2,tw,th);f.clip();
        f.beginPath();f.rect(-w/2-px,-height/2-py,w,height);for(const [x,y,ww,hh] of companionGutters[frame]||[])f.rect(-w/2-px+(x-sx)*w/sw,-height/2-py+(y-sy)*height/sh,ww*w/sw,hh*height/sh);f.clip('evenodd');
        f.drawImage(companionAtlas,sx,sy,sw,sh,-w/2-px,-height/2-py,w,height);f.restore();
      }
      f.restore();return;
    }
    f.save();f.translate(dog.x-camera.x,dog.y-camera.y);f.scale(dog.facing,1);
    if(!moving&&p.grounded&&!reduced.matches)f.scale(1,1+Math.sin(clock*2)*.008);
    f.beginPath();f.rect(-w/2,-height,w,height);for(const [x,y,ww,hh] of companionGutters[frame]||[])f.rect(-w/2+(x-sx)*w/sw,-height+(y-sy)*height/sh,ww*w/sw,hh*height/sh);f.clip('evenodd');
    f.drawImage(companionAtlas,sx,sy,sw,sh,-w/2,-height,w,height);f.restore();
    if(!p.grounded){
      // The companion flies independently; there is no tether to the avatar.
      for(const offset of [-22,18]){const x=dog.x-camera.x+offset,y=dog.y-camera.y-2;f.fillStyle='#577982';f.fillRect(x-2,y-6,11,8);f.fillStyle='#67daf5';f.fillRect(x,y+2,7,reduced.matches?14:14+(Math.floor(clock*18)%3)*4);f.fillStyle='#e7ffff';f.fillRect(x+2,y+2,3,8);}
    }
  }
  function render(dt){
    const p=game.player,targetX=clamp(p.x-560,0,level.width-1600),targetY=clamp(p.y-260,-650,0);
    camera.x+=(targetX-camera.x)*(1-Math.exp(-5*dt));camera.y+=(targetY-camera.y)*(1-Math.exp(-5*dt));
    blaster?.update();
    if(blaster?.shot)p.facing=blaster.shot.facing;
    background();c.save();c.translate(-camera.x,-camera.y);if(level.kind==='city')city();else if(level.kind==='moon')moon();else if(level.kind==='observatory'){AboutScene.world(c,level,camera,reduced.matches?0:clock,p,visited,0,blaster);}else gallery();stations();
    if(p.grounded){c.fillStyle='#02091166';c.beginPath();c.ellipse(p.x,p.y+2,38,7,0,0,Math.PI*2);c.fill();}
    if(!wasGrounded&&p.grounded)dust=.3;wasGrounded=p.grounded;dust=Math.max(0,dust-dt);
    if(dust&&!reduced.matches)for(let i=0;i<7;i++)rect(p.x+(i-3)*(20-dust*30),p.y-4-(i%3)*10*(1-dust/.3),4,4,level.kind==='moon'?'#b4c4c7':'#6a9594');
    c.restore();
    actor.style.left=(p.x-camera.x)+'px';actor.style.bottom=(900-p.y+camera.y)+'px';actor.style.setProperty('--facing',p.facing);
    avatar?.update(dt,{moving:p.grounded&&Math.abs(p.vx)>12,direction:p.facing,airborne:!p.grounded,verticalSpeed:-p.vy,interaction:game.climbing?'climb':game.rope?'swing':game.webShot?'webcast':!p.grounded&&game.jetpackBlend>=.85?'fly':blaster?.shot?'blast':null,choreographyTime:game.climbing?game.climbPhase:null});
    jetpack();
    f.clearRect(0,0,1600,900);
    const web=game.rope||game.webShot;
    if(web){const grip=avatar?.getHandAnchor(),hand=grip?viewport.point(grip.x,grip.y):{x:p.x-camera.x,y:p.y-148-camera.y};WorldWeb.draw(f,{hand,anchor:{x:web.anchor.x-camera.x,y:web.anchor.y-camera.y},progress:game.webShot?.progress??1,attached:!!game.rope,age:game.rope?.age||0,reduced:reduced.matches});}
    if(game.boosting){f.fillStyle='#67daf5';f.fillRect(p.x-camera.x-p.facing*23,p.y-camera.y-50,12,25+(Math.floor(clock*20)%2)*14);}
    pet(dt);
    jetpackStraps();
    if(blaster?.shot){const palm=avatar?.getPalmAnchor();blaster.draw(f,palm?viewport.point(palm.x,palm.y):{x:p.x-camera.x+p.facing*37,y:p.y-camera.y-80},camera,reduced.matches);}
    const nearby=game.nearby(),button=$('#nearbyExhibit');button.hidden=!nearby;if(nearby)button.textContent='Open '+nearby.title+' · E';$('[data-action="interact"]').disabled=!nearby;
    $('[data-action="climb"]').disabled=!game.rope;
    if(level.kind==='gallery'){
      $('[data-action="power"]').setAttribute('aria-pressed',String(game.jetpack));
      $('#powerLabel').textContent=game.jetpack?'DOG':'JETPACK';
      $('[data-action="jump"] span').textContent=game.jetpack?'RISE':'JUMP';
      $('[data-action="jump"]').setAttribute('aria-label',game.jetpack?'Hold to rise':'Jump');
      $('[data-action="descend"]').disabled=!game.jetpack;
    }
    const status=visited.size+' / '+level.exhibits.length+' explored'+(game.climbing?' · CLIMBING':game.rope?' · WEB ATTACHED · W TO CLIMB':game.webShot?' · WEB LAUNCHING':game.jetpack?' · JETPACK · UNLIMITED BOOST':'');if($('#worldStatus').textContent!==status)$('#worldStatus').textContent=status;
    $('#worldFuel meter').value=p.fuel;
  }
  function frame(time){
    const dt=Math.min((time-last)/1000||1/60,.05);last=time;
    if(blocked()){clearInput();requestAnimationFrame(frame);return;}
    clock+=dt;accumulator+=dt;
    while(accumulator>=1/120){game.step(1/120,{move:Number(held('right'))-Number(held('left')),jump:jumpPending,power:held('power'),climb:held('climb'),ascend:held('jump'),descend:held('descend')});jumpPending=false;accumulator-=1/120;}
    if(game.respawns!==lastRespawns){lastRespawns=game.respawns;clearInput();dog.x=game.player.x-80;dog.y=game.player.y;camera.x=clamp(game.player.x-560,0,level.width-1600);camera.y=0;}
    render(dt);requestAnimationFrame(frame);
  }
  window.playableWorld={game,get diagnostics(){return {world:key,player:{...game.player},camera:{...camera},web:!!game.rope,webLaunch:game.webShot?.progress||0,climbing:game.climbing,ropeLength:game.rope?.length,jetpack:game.jetpack,jetpackBlend:game.jetpackBlend,nearby:game.nearby()?.title,visited:[...visited],paused:blocked()};}};
  if(level.kind==='observatory'){about.onExplore=i=>visited.add(level.exhibits[i].title);about.route(i=>{clearInput();const e=level.exhibits[i];Object.assign(game.player,{x:e.x,y:e.floor,vx:0,vy:0,grounded:true,platform:0});camera.x=clamp(e.x-560,0,level.width-1600);camera.y=0;dog.x=e.x-85;dog.y=e.floor;about.pulse();render(0);});}
  resize();dog.y=game.player.y;render(0);requestAnimationFrame(frame);
})();
