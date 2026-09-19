/* Full-bleed art and spatial objects. Descriptive HTML labels share each sprite's coordinates. */
window.GyroRenderer=class {
  constructor(host,field){
    this.host=host;this.field=field;this.back=document.getElementById('backdrop');this.front=document.getElementById('machinery');this.b=this.back.getContext('2d');this.c=this.front.getContext('2d');this.buffer=document.createElement('canvas');this.bc=this.buffer.getContext('2d');
    this.nodes=[];this.links=[];this.mode='design';this.previous='design';this.blend=1;this.time=0;this.camera={x:0,y:0};this.target={x:0,y:0};this.gentle=matchMedia('(prefers-reduced-motion: reduce)').matches;this.visible=true;this.last=0;this.frame=0;
    this.ready=this.load();this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(host);this.resize();
    const tick=t=>{const dt=Math.min(.04,this.last?(t-this.last)/1000:0);this.last=t;if(this.art&&!document.hidden&&!document.querySelector('dialog[open]'))this.draw(dt);this.frame=requestAnimationFrame(tick);};this.frame=requestAnimationFrame(tick);
    addEventListener('pagehide',()=>{cancelAnimationFrame(this.frame);this.cancel();});addEventListener('pageshow',e=>{if(e.persisted){this.last=0;this.frame=requestAnimationFrame(tick);}});
  }
  async load(){
    const entries=await Promise.all([2,3,4,6,7,8].map(n=>new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve([n,i]);i.onerror=()=>reject(new Error('Artwork '+n+' could not load'));i.src='./assets/worlds/'+n+'.webp';})));
    const imgs=Object.fromEntries(entries),crop=(id,r)=>{const im=imgs[id],s=im.naturalWidth/1280,[x,y,w,h]=r.map(v=>Math.round(v*s)),cv=document.createElement('canvas');cv.width=w;cv.height=h;cv.getContext('2d').drawImage(im,x,y,w,h,0,0,w,h);return cv;};
    this.art={backgrounds:{design:imgs[6],access:imgs[7],cache:imgs[7],protect:imgs[7],search:imgs[8]},
      screen:crop(2,[65,920,237,198]),api:crop(2,[324,167,309,323]),rules:crop(2,[348,915,238,207]),database:crop(2,[925,155,313,328]),service:crop(2,[775,493,423,400]),lock:crop(2,[659,159,273,326]),
      gate:crop(3,[694,151,295,298]),archive:crop(3,[518,550,328,311]),memory:crop(4,[80,358,320,299]),redis:crop(4,[452,354,342,313]),oracle:crop(4,[815,353,376,315]),allowed:crop(4,[225,705,325,183]),denied:crop(4,[706,700,320,204]),person:crop(4,[25,52,234,218]),company:crop(4,[271,51,223,220]),role:crop(4,[518,50,224,220]),jewel:crop(3,[794,238,100,113])};
    return this.art;
  }
  resize(){const r=this.host.getBoundingClientRect();this.w=r.width;this.h=r.height;this.dpr=Math.min(devicePixelRatio||1,1.5);for(const cv of [this.back,this.front,this.buffer]){cv.width=Math.round(this.w*this.dpr);cv.height=Math.round(this.h*this.dpr);}for(const c of [this.b,this.c,this.bc]){c.setTransform(this.dpr,0,0,this.dpr,0,0);c.imageSmoothingEnabled=false;}this.measure();}
  measure(){const root=this.host.getBoundingClientRect(),r=this.field.getBoundingClientRect();this.area={x:r.left-root.left,y:r.top-root.top,w:r.width,h:r.height};}
  set(mode,nodes,links=[]){this.cancel();this.previous=this.mode;this.mode=mode;this.blend=0;this.nodes=nodes.map(n=>({...n,px:.5,py:.5,appear:this.gentle?1:0}));this.links=links;this.measure();}
  cancel(){if(this.flight){this.flight.done(false);this.flight=null;}}
  route(ids){this.cancel();return new Promise(done=>{this.flight={ids,elapsed:0,duration:this.gentle ? .3 : Math.max(1.3,ids.length*.52),done};});}
  emphasis(id){this.nodes.forEach(n=>{n.selected=n.id===id;if(n.selected)n.pulse=1;});}
  patch(id,values){const n=this.nodes.find(n=>n.id===id);if(n)Object.assign(n,values);}
  point(n){return{x:this.area.x+n.px*this.area.w-this.camera.x*5,y:this.area.y+n.py*this.area.h-this.camera.y*4};}
  halo(c,x,y,r,color,alpha=1){c.save();c.globalAlpha=alpha;const g=c.createRadialGradient(x,y,0,x,y,Math.max(1,r));g.addColorStop(0,color);g.addColorStop(1,color.slice(0,7)+'00');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}
  warp(im,alpha){const {w:W,h:H}=this,t=this.gentle?0:this.time,scale=Math.max(W/im.naturalWidth,H/im.naturalHeight)*(1.10+Math.sin(t*.12)*.025),iw=im.naturalWidth*scale,ih=im.naturalHeight*scale,ox=(W-iw)/2-this.camera.x*22,oy=(H-ih)/2-this.camera.y*18,c=this.bc;
    c.save();c.globalAlpha=alpha;c.translate(W/2,H/2);c.rotate(-this.camera.x*.012);c.translate(-W/2,-H/2);const slice=im.naturalHeight/44;
    for(let i=0;i<44;i++){const sy=i*slice,shift=this.gentle?0:Math.sin(sy*.02+t*.75)*3.7+Math.sin(sy*.007-t*.4)*2.5;c.drawImage(im,0,sy,im.naturalWidth,Math.min(slice+1,im.naturalHeight-sy),ox+shift,oy+sy*scale,iw,slice*scale+1.2);}c.restore();
  }
  draw(dt){
    this.time+=dt;this.blend=Math.min(1,this.blend+dt*1.7);this.camera.x+=(this.gentle?0:this.target.x-this.camera.x)*(1-Math.exp(-dt*3));this.camera.y+=(this.gentle?0:this.target.y-this.camera.y)*(1-Math.exp(-dt*3));if(this.gentle)this.camera.x=this.camera.y=0;
    const {w:W,h:H,b,c,bc}=this;bc.clearRect(0,0,W,H);this.warp(this.art.backgrounds[this.previous],1);if(this.mode!==this.previous)this.warp(this.art.backgrounds[this.mode],this.blend);
    b.clearRect(0,0,W,H);b.drawImage(this.buffer,0,0,this.buffer.width,this.buffer.height,0,0,W,H);
    if(!this.gentle){b.save();b.globalCompositeOperation='screen';b.globalAlpha=.12;b.filter='blur(10px)';b.drawImage(this.buffer,0,0,this.buffer.width,this.buffer.height,0,0,W,H);b.restore();b.save();b.globalAlpha=.04;b.globalCompositeOperation='screen';b.drawImage(this.buffer,0,0,this.buffer.width,this.buffer.height,3+this.camera.x*2,1,W,H);b.restore();}
    b.fillStyle='#030716a8';b.fillRect(0,0,W,H);const vignette=b.createRadialGradient(W/2,H*.48,W*.15,W/2,H*.48,H*.7);vignette.addColorStop(0,'#03061000');vignette.addColorStop(1,'#030610dd');b.fillStyle=vignette;b.fillRect(0,0,W,H);
    c.clearRect(0,0,W,H);const amount=1-Math.exp(-dt*6);
    for(const n of this.nodes){n.px+=(n.x-n.px)*amount;n.py+=(n.y-n.py)*amount;n.appear=Math.min(1,n.appear+dt*2);n.pulse=Math.max(0,(n.pulse||0)-dt*.8);const p=this.point(n);n.dom.style.left=(p.x-this.area.x)+'px';n.dom.style.top=(p.y-this.area.y)+'px';n.dom.dataset.dim=String(Boolean(n.dim));n.dom.dataset.locked=String(Boolean(n.locked));n.dom.setAttribute('aria-pressed',String(Boolean(n.selected)));}
    const get=id=>this.nodes.find(n=>n.id===id);
    for(const [a,z] of this.links){const from=get(a),to=get(z);if(!from||!to)continue;const p=this.point(from),q=this.point(to);c.save();c.globalAlpha=Math.min(from.appear,to.appear)*((from.dim || to.dim) ? .22 : .75);c.beginPath();c.moveTo(p.x,p.y-20);c.bezierCurveTo(p.x,p.y+(q.y-p.y)*.5,q.x,q.y-(q.y-p.y)*.5,q.x,q.y-20);c.strokeStyle='#09192b';c.lineWidth=8;c.stroke();c.strokeStyle='#6cadc766';c.lineWidth=2;c.stroke();c.restore();}
    for(const n of this.nodes){const p=this.point(n),im=this.art[n.art];if(!im)continue;const size=Math.min(95,Math.max(38,this.area.h*.205))*(n.scale||1),breath=this.gentle?0:Math.sin(this.time*1.1+n.x*4)*2;
      n.dom.style.setProperty('--art-size',size+'px');const cy=p.y-21,bob=breath*(n.selected?1:.4);c.save();c.globalAlpha=(n.dim ? .35 : 1)*n.appear;this.halo(c,p.x,cy,size*.83,n.locked?'#eb78a333':n.selected?'#9ce8ff55':'#71cafa22',1+n.pulse);const h=size*.85,w=h*im.width/im.height;c.drawImage(im,p.x-w/2,cy-h/2+bob,w,h);c.restore();
    }
    if(this.flight){const f=this.flight;f.elapsed=Math.min(f.duration,f.elapsed+dt);const k=f.elapsed/f.duration*(f.ids.length-1),i=Math.min(f.ids.length-2,Math.floor(k)),from=get(f.ids[i]),to=get(f.ids[i+1]);if(from&&to){const p=this.point(from),q=this.point(to),u=k-i,x=p.x+(q.x-p.x)*u,y=p.y+(q.y-p.y)*u-20;this.halo(c,x,y,30,'#a9f5ff88');c.drawImage(this.art.jewel,x-11,y-14,22,27);}if(f.elapsed>=f.duration){this.flight=null;f.done(true);}}
    if(!this.gentle)for(let i=0;i<24;i++){const x=((i*113.7-this.camera.x*20)%W+W)%W,y=((i*83.7-this.time*6)%H+H)%H;c.fillStyle=i%2?'#aad9ff44':'#d1afff55';c.fillRect(x,y,1.5,1.5);}
  }
};
