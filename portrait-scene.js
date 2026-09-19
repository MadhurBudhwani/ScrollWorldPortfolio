/* Portrait choreography has its own camera and geometry. No landscape stage scaling. */
const TAU = Math.PI * 2;
(() => {
  const tones = ['#84f5ad', '#67daf5', '#f3cc70', '#f58caf'];
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const ease = x => x * x * (3 - 2 * x);
  class PortraitScene {
    constructor(host) {
      this.host = host; this.time = 0; this.trigger = -20; this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
      this.canvas = document.createElement('canvas'); this.canvas.setAttribute('aria-hidden', 'true');
      this.actor = document.createElement('div'); this.actor.className = 'player tower-avatar'; this.actor.setAttribute('aria-hidden', 'true');
      const image = document.createElement('img'); image.src = './assets/madhur-character.png'; image.alt = ''; this.actor.append(image);
      this.front = document.createElement('canvas'); this.front.className = 'tower-effects'; this.front.setAttribute('aria-hidden', 'true');
      host.append(this.canvas, this.actor, this.front); this.avatar = window.AvatarAnimator ? new AvatarAnimator(this.actor) : null;
      this.ready = Promise.all([image.decode().catch(() => {}), companionAtlas.decode().catch(() => {}), ...['madhur-avatar-atlas-v2.png','madhur-avatar-actions-v1.png','madhur-interactions-v1.png','madhur-revision-poses-v1.png'].map(file => {
        const sprite=new Image();sprite.src='./assets/'+file;return sprite.decode().catch(() => {});
      })]);
      this.c = this.canvas.getContext('2d'); this.f = this.front.getContext('2d');
      this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host); this.resize();
    }
    resize() {
      this.rect = this.host.getBoundingClientRect(); this.width = this.rect.width || 360;
      this.h = Math.max(80, this.rect.height * 360 / this.width); this.ratio = this.width / 360;
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      for (const cv of [this.canvas, this.front]) { cv.width = Math.round(this.width * dpr); cv.height = Math.round(this.rect.height * dpr); }
      for (const c of [this.c, this.f]) { c.setTransform(dpr * this.ratio, 0, 0, dpr * this.ratio, 0, 0); c.imageSmoothingEnabled = false; }
    }
    activate() { this.trigger = this.time; }
    box(x, y, w, h, fill, stroke) { const c = this.c; c.fillStyle = fill; c.fillRect(x, y, w, h); if (stroke) { c.strokeStyle = stroke; c.lineWidth = 1; c.strokeRect(x, y, w, h); } }
    line(points, color, width = 2) { const c = this.c; c.beginPath(); points.forEach(([x,y], i) => i ? c.lineTo(x,y) : c.moveTo(x,y)); c.strokeStyle = color; c.lineWidth = width; c.stroke(); }
    text(text, x, y, color = '#cee4e2', size = 10) { const c = this.c; c.font = `${size}px monospace`; c.textAlign = 'center'; c.fillStyle = color; c.fillText(text, x, y); }
    ring(x, y, rx, ry, color, angle = 0) { const c = this.c; c.beginPath(); c.ellipse(x,y,rx,ry,angle,0,TAU); c.strokeStyle=color;c.lineWidth=2;c.stroke(); }
    symbol(type, x, y, scale = .6, time = this.time) { const c = this.c; c.save(); c.translate(x,y); c.scale(scale,scale); drawMechSymbol(c,type,'',time); c.restore(); }
    backdrop(kind, position) {
      const c=this.c,h=this.h,t=this.reduced.matches?0:this.time;
      const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,kind==='gallery'?'#291e2b':'#081423');g.addColorStop(1,kind==='gallery'?'#46302f':'#152b37');c.fillStyle=g;c.fillRect(0,0,360,h);
      for(let i=0;i<45;i++){const x=(i*73.71)%360,y=((i*49.27+position*25)%h+h)%h;this.box(x,y,i%9?1:2,i%9?1:2,i%3?'#466577':'#a5c8db');}
      for(let side of [16,342]) { this.box(side,0,2,h,'#304454'); for(let j=-1;j<h/50+1;j++)this.box(side-3,((j*50+position*80)%h+h)%h,8,4,'#53707c'); }
      for(let i=0;i<3;i++){c.fillStyle=['#67daf505','#84f5ad04','#bf8cff08'][i];c.beginPath();c.ellipse(180+Math.sin(t*.2+i)*80,h*.5,110,80,t*.05+i,0,TAU);c.fill();}
    }
    platform(y, color='#67daf5', x=45, w=270) { this.box(x-5,y,w+10,7,'#06101b',color);this.box(x,y+7,w,13,'#263a46');for(let i=0;i<5;i++)this.box(x+12+i*(w-30)/5,y+10,12,3,color+'77'); }
    dog(x,y,moving=false) {
      if(!companionAtlas.complete||!companionAtlas.naturalWidth)return;
      const index=moving?0:4, s=companionSprites[index], w=54, h=w*s[3]/s[2], c=this.c;
      c.drawImage(companionAtlas,...s,x-w/2,y-h+(moving?Math.sin(this.time*16)*2:0),w,h);
    }
    person(dt, x, ground, mode='idle', direction=1) {
      const scale=clamp(this.h/480,.30,.48)*this.ratio;
      this.actor.style.setProperty('--player-s',scale);
      this.actor.style.left=`${x*this.ratio}px`;this.actor.style.top=`${ground*this.ratio-232}px`;
      this.actor.style.bottom='auto';
      this.avatar?.update(dt,{moving:mode==='walk',direction,airborne:mode==='fly',verticalSpeed:mode==='fly'?-150:0,interaction:mode, choreographyTime:this.time});
    }
    story(index, phase, dt, jump=0) {
      this.time+=this.reduced.matches?0:dt; const t=this.time,h=this.h,c=this.c,s=PortfolioChapters[index];
      const color=tones[s.color], floor=h-20, center=Math.max(45,(h-85)*.45), active=this.time-this.trigger<4 || (phase>.18&&phase<.76);
      this.backdrop(index===7?'gallery':'story',index+phase);this.f.clearRect(0,0,360,h);
      const small=clamp(h/270,.52,1), loop=this.reduced.matches ? .45 : ((t-this.trigger)/4)%1;
      c.save();c.translate(180,center);c.scale(small,small);c.translate(-180,-center);
      if(index===0){
        this.ring(180,center,105,43,color+'66',-.12);this.ring(180,center,72,60,'#67daf566',.4);
        ['server','brain','gateway','signal'].forEach((type,i)=>{const a=i*TAU/4+t*.22,x=180+Math.cos(a)*113,y=center+Math.sin(a)*53;this.symbol(type,x,y,.55);});
        this.box(158,center-26,44,52,'#12383d',color);this.text('MB',180,center+6,color,18);
      }else if(index===1){
        for(let i=0;i<3;i++){const y=center-78+i*58;this.box(108,y,144,43,'#132a36',color+'aa');this.symbol(['reactor','database','shield'][i],133,y+20,.36);this.text(['REQUEST','PROCESS','STORE'][i],194,y+24);for(let k=0;k<4;k++)this.box(227+k*5,y+33,3,3,(Math.floor(t*4)%4===k)?color:'#39505c');}
        this.line([[89,center-65],[70,center-65],[70,center+85],[89,center+85]],'#4a6c7c');this.box(67,center-65+loop*146,7,12,color);
        this.line([[270,center+66],[287,center+66],[287,center-67],[268,center-67]],'#4a6c7c');this.box(284,center+66-loop*133,7,12,'#f3cc70');
      }else if(index===2){
        for(let i=0;i<3;i++){let y=center+85-i*70;this.box(58+i*35,y,145,20,'#254a60');this.box(77+i*35,y-14,100,18,'#254a60');this.line([[180,y],[180,y-32]],color+'77');}
        const y=center+85-ease(loop)*180;this.box(154,y-24,52,48,'#14394b',color);this.symbol('bucket',180,y,.4);
        for(let i=0;i<2;i++){const x=70+i*220,dy=center-55+Math.sin(t*2+i)*12;this.box(x-16,dy,32,10,'#aac9d4');this.line([[x-23,dy-5],[x+23,dy-5]],color);this.box(x-2,dy+12,4,12,'#67daf544');}
      }else if(index===3){
        for(let i=0;i<3;i++){let y=center-80+i*60;this.box(78,y,204,40,'#302f2c','#75623c');const open=active?Math.sin(clamp((this.time-this.trigger-i*.5)/2)*Math.PI)*25:Math.max(0,Math.sin(t-i*1.5))*12;this.box(150-open,y+4,27,32,'#ab935d');this.box(183+open,y+4,27,32,'#ab935d');this.symbol(['identity','lock','shield'][i],103,y+20,.32);this.box(256,y+16,8,8,open>8?'#84f5ad':'#f3cc70');}
        this.line([[180,center-80],[180,center+85]],color+'44',1);
      }else if(index===4){
        for(let i=0;i<9;i++){const x=103+(i%3)*66,y=center-77+Math.floor(i/3)*51;this.box(x,y,44,36,'#c6cbb4');for(let l=0;l<3;l++)this.box(x+7,y+9+l*7,30-(l%2)*10,2,'#617e80');}
        const y=center-82+loop*150;this.box(86,y,208,13,'#67daf522');this.line([[86,y],[294,y]],color,2);
        this.ring(180+Math.sin(t*.7)*65,center+Math.cos(t*.7)*46,29,29,color);this.line([[201+Math.sin(t*.7)*65,center+22+Math.cos(t*.7)*46],[224+Math.sin(t*.7)*65,center+45+Math.cos(t*.7)*46]],color,5);
      }else if(index===5){
        const stages=['QUESTION','SCHEMA','GENERATE','VALIDATE','ANSWER'];
        stages.forEach((label,i)=>{const y=center-95+i*42;this.box(113,y,134,29,'#123b38',i===Math.floor(loop*5)?color:'#326b64');this.text(label,180,y+19);if(i<4)this.line([[180,y+30],[180,y+40]],color+'77');});
        this.line([[248,center+46],[277,center+46],[277,center-5],[249,center-5]],'#f3cc70');this.text('FIX',284,center+27,'#f3cc70',9);this.box(273,center+46-loop*51,7,7,'#f3cc70');
      }else if(index===6){
        ['DEV','REVIEW','QA','UAT','PROD'].forEach((label,i)=>{const y=center+83-i*43;this.box(80,y,49,26,'#33382e',i<loop*5?color:'#586454');this.text(label,104,y+17,i<loop*5?color:'#8b9e9e',9);this.line([[130,y+13],[147,y+13]],color+'55');});
        this.box(157,center-77,55,141,'#243743',color);this.box(169,center-101,31,24,'#dde9dc');this.box(170,center-69,29,28,'#4a9db3');this.box(150,center+43,14,35,'#8ba3ae');this.box(205,center+43,14,35,'#8ba3ae');
        if(active||loop>.65){const plume=18+Math.sin(t*24)*9;this.box(168,center+66,33,plume,'#67daf566');this.box(178,center+66,13,plume+12,'#c6f8ff');}
      }else if(index===7){
        this.box(62,center-91,236,160,'#3e3033','#9b795e');for(let i=0;i<3;i++)this.box(65,center-42+i*51,230,5,'#ad8565');
        for(let i=0;i<6;i++){c.save();c.translate(121+(i%2)*118,center-66+Math.floor(i/2)*51);c.scale(.48,.48);drawHobbyObject(c,i,t);c.restore();}
        const chosen=Math.floor(t/3)%6;this.ring(121+(chosen%2)*118,center-66+Math.floor(chosen/2)*51,36,23,'#f58caf88');
      }else{
        this.ring(180,center,120,58,color+'33');this.ring(180,center,100,85,'#bf8cff33',t*.12);
      }
      c.restore();this.platform(floor,color);
      const lift=this.reduced.matches?0:Math.sin(clamp(jump)*Math.PI)*Math.min(55,h*.2);
      let mode=lift>3?'fly':active?(index===7?['read','sing','game','sketch','design','edit'][Math.floor(t/3)%6]:index===2?'fly':index===6?'crouch':'tap'):'idle';
      this.person(dt,index===8?180:125,floor-lift,mode);this.dog(239,floor-2,lift>3);
      if(active&&index===2){this.box(112,floor-lift+2,7,14+Math.sin(t*20)*5,'#67daf5');this.box(134,floor-lift+2,7,18,'#b6f5ff');}
    }
    world(level, position, dt, transit=0) {
      this.time+=this.reduced.matches?0:dt;const h=this.h,t=this.time,c=this.c,kind=level.kind,step=Math.max(170,h*.78);
      this.backdrop(kind,position);this.f.clearRect(0,0,360,h);
      if(kind==='city')for(let i=0;i<7;i++){const x=28+i*47,y=h*.28+(i%3)*28+Math.sin(position*.3)*10;this.box(x,y,38,h,'#152d40');for(let yy=y+12;yy<h;yy+=24)for(let xx=x+7;xx<x+34;xx+=13)this.box(xx,yy,5,8,(i+yy)%3?'#4c6767':'#b49d66');}
      if(kind==='moon'){this.ring(276,48,33,33,'#b3d4df44');this.box(50,0,3,h,'#607e8d');this.box(307,0,3,h,'#607e8d');}
      for(let i=Math.max(0,Math.floor(position)-1);i<=Math.min(level.exhibits.length-1,Math.ceil(position)+1);i++){
        const y=h*.34+(position-i)*step,e=level.exhibits[i],color=kind==='observatory'?this.hitColor(i):kind==='gallery'?'#f58caf':kind==='city'?'#f3cc70':'#67daf5';
        if(y< -160||y>h+130)continue;
        c.save();c.translate(180,y);const scale=clamp(h/380,.55,.95);c.scale(scale,scale);
        if(kind==='observatory'){AboutScene.artifact(c,AboutData.stations[i].object,t,color,0,0);for(let k=0;k<5;k++){let a=k*TAU/5;this.line([[0,0],[Math.cos(a)*124,Math.sin(a)*101]],color+'33',1);this.box(Math.cos(a)*124-2,Math.sin(a)*101-2,4,4,color);}}
        else if(kind==='gallery'){this.box(-113,-84,226,164,'#927954');this.box(-101,-72,202,140,'#e4d1a7');this.box(-88,-59,176,114,'#142d37');c.save();c.scale(1.1,1.1);drawHobbyObject(c,e.art,t);c.restore();this.box(-122,83,244,6,'#bd9b75');}
        else if(kind==='moon'){this.box(-120,-75,240,150,'#223c4c','#8dabba');this.box(-107,-61,214,124,'#0b202d');this.symbol(['brain','database','gears','gateway','shield','cache'][i],0,-8,1);this.text('LAB '+String(i+1).padStart(2,'0'),0,51,color,12);for(let j=0;j<4;j++)this.box(-91+j*58,-69,20,3,j===Math.floor(t)%4?color:'#53717c');}
        else{this.box(-115,-62,230,139,'#223c49','#7a8982');this.box(-101,-48,202,74,'#0b2028');this.symbol(['desktop','server','database','reactor'][i],0,-12,.85);this.text(e.role||'ENGINEERING',0,51,color,11);this.box(-124,78,248,10,'#9e9472');}
        c.restore();
      }
      const floor=h-20,jump=this.reduced.matches?0:Math.sin(clamp(transit)*Math.PI)*Math.min(86,h*.22),firing=this.shot&&(performance.now()-this.shot.start)<900;
      const mode=firing?'blast':jump>2?(kind==='city'?'climb':'fly'):(this.time-this.trigger<2&&kind==='gallery'?'read':'idle');
      this.platform(floor,kind==='observatory'?'#bf8cff':'#67daf5',61,238);this.person(dt,119,floor-jump,mode,1);this.dog(248,floor-3,jump>2);
      if(jump>2){if(kind==='city')this.line([[119,floor-jump-75],[220,0]],'#c0e4e6',2);else{this.box(105,floor-jump+1,8,20+Math.sin(t*20)*5,'#67daf5');this.box(130,floor-jump+1,8,25,'#cafaff');}}
      this.paintLaser(position,step);
    }
    hitColor(i) { const hit=this.hits?.get(i);if(hit&&performance.now()<hit.until)return hit.color;return AboutData.stations[i].color; }
    fire(index) {
      const now=performance.now();if(this.shot&&now-this.shot.start<900)return;
      this.hits??=new Map();const palette=['#58dfff','#ff75b8','#ffe079','#87ffad','#bf8cff','#ff9468'].filter(color=>color!==this.hitColor(index));
      this.shot={index,start:now,color:palette[Math.floor(Math.random()*palette.length)],hit:false};
    }
    paintLaser(position,step) {
      if(!this.shot)return;const shot=this.shot,age=(performance.now()-shot.start)/1000;if(age>=.18&&!shot.hit){this.hits.set(shot.index,{color:shot.color,until:shot.start+3180});shot.hit=true;}if(age>.9){this.shot=null;return;}
      const rect=this.host.getBoundingClientRect(),anchor=this.avatar?.getPalmAnchor(),palm=anchor?{x:(anchor.x-rect.left)/this.ratio,y:(anchor.y-rect.top)/this.ratio}:{x:143,y:this.h-68};
      const target={x:180,y:this.h*.34+(position-shot.index)*step},reach=clamp((age-.12)/.08),c=this.f;
      c.save();c.globalAlpha=clamp((.9-age)/.2);c.lineCap='round';c.shadowColor='#37bfff';
      for(const [width,color,blur] of [[22,'#126aff66',18],[10,'#278fff',12],[5,'#8ceaff',7],[2,'#ffffff',0]]){c.beginPath();c.moveTo(palm.x,palm.y);c.lineTo(palm.x+(target.x-palm.x)*reach,palm.y+(target.y-palm.y)*reach);c.lineWidth=width;c.strokeStyle=color;c.shadowBlur=blur;c.stroke();}
      c.shadowBlur=0;c.fillStyle='#dfffff';c.beginPath();c.arc(palm.x,palm.y,5,0,TAU);c.fill();
      if(reach===1){for(let i=0;i<10;i++){const a=i*TAU/10,r=12+age*28;c.fillRect(target.x+Math.cos(a)*r,target.y+Math.sin(a)*r,3,3);}}
      c.restore();
    }
  }
  window.PortraitScene=PortraitScene;
})();
