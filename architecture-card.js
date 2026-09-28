/* The architecture card: one handset drawn in code, three planes interlaced
   the way a lenticular print is. Held flat it is the screen somebody uses;
   tilted it becomes the board inside that screen, first with the service half
   carrying current, then the storage half. Both board planes are the same
   photograph — only the light moves — which is what makes the flip read as one
   object being turned rather than three pictures being swapped.

   The tuning bench (shimmer-lab.html) and the gyroscope world both drive this
   file, so there is one implementation to fix and one to tune.

   createArchitectureCard(canvas, options) -> { draw(t), resize(), setPlane(),
   options }, where t runs 0 (screen) .. 0.5 (service) .. 1 (storage). */
(function(global){
  'use strict';
  const DEFAULTS={
    sharp:0,        // how hard the planes switch; 0 is a plain crossfade
    pitch:3,        // lens pitch in CSS pixels
    bleed:0,        // crosstalk between neighbouring strips
    foil:.21,       // strength of the sweep that answers the viewer's movement
    grain:0,        // micro-noise on the foil
    plx:0,          // how much the deeper planes lag
    base:'./assets/worlds/',
    onFrame:null,   // (nearestPlaneIndex, t)
  };

  function createArchitectureCard(canvasEl,userOpts){
    const card=canvasEl, c=card.getContext('2d'), N=3;
    let W=0,H=0,dpr=1;
    const o=Object.assign({},DEFAULTS,userOpts||{});

    /* ---------- placeholder art -------------------------------------------------
       Drawn rather than shipped, so the lab runs with no assets and the three
       planes stay obviously different in palette: you can tell at a glance which
       depth you are looking at even mid-flip. Real art replaces these through the
       file pickers at the bottom. */
    const planes=[null,null,null];          // offscreen canvas or <img> per layer
    function makePlane(draw){
      const o=document.createElement('canvas');o.width=W;o.height=H;
      const x=o.getContext('2d');x.scale(dpr,dpr);draw(x,W/dpr,H/dpr);return o;
    }
    function label(x,text,px,py,size,colour,space=0){
      x.fillStyle=colour;x.font='600 '+size+'px Consolas,monospace';
      if(!space){x.fillText(text,px,py);return;}
      let at=px;for(const ch of text){x.fillText(ch,at,py);at+=x.measureText(ch).width+space;}
    }
    function roundRect(x,px,py,w,h,r){x.beginPath();x.moveTo(px+r,py);x.arcTo(px+w,py,px+w,py+h,r);
      x.arcTo(px+w,py+h,px,py+h,r);x.arcTo(px,py+h,px,py,r);x.arcTo(px,py,px+w,py,r);x.closePath();}

    /* The device outline is shared by all three planes. Held flat you see its
       screen; tilted, the same rectangle is the board inside it. Keeping one
       silhouette is what makes the flip read as looking *into* an object rather
       than as three unrelated pictures. */
    /* The body can be any shape the caller asks for, but the glass always keeps
       the artwork's own 2:3 — cropping it sideways would cut the ends off the
       form fields. Whatever height is left over becomes bezel above and below,
       which is where a handset's earpiece belongs anyway. */
    const BODY=(w,h)=>{
      const u=Math.min(w,h);
      const m=Math.max(6,u*.032), r=Math.max(16,u*.086), i=Math.max(5,u*.021);
      const bw=w-m*2, bh=h-m*2;
      const availW=bw-i*2, availH=bh-i*2;
      const sw=Math.min(availW,availH*2/3), sh=sw*1.5;
      return {m,bw,bh,r,sx:m+(bw-sw)/2,sy:m+(bh-sh)/2,sw,sh,
              sr:Math.max(9,r-i+1),brow:(bh-sh)/2-i};};

    /* The handset is drawn here rather than baked into any artwork, so every plane
       gets the same body and the outline cannot shift mid-flip. Content is clipped
       to the glass; the metal and the notch go over the top of it. */
    function bodyPlate(x,w,h){
      const {m,bw,bh,r,sx,sy,sw,sh,sr}=BODY(w,h);
      x.save();x.shadowColor='rgba(0,0,0,.72)';x.shadowBlur=m*2.6;x.shadowOffsetY=m*.5;
      roundRect(x,m,m,bw,bh,r);x.fillStyle='#0a0f18';x.fill();x.restore();
      // Brushed metal wants several stops, not two: with two it reads as a flat
      // grey border, which was what made the device look cheap.
      const metal=x.createLinearGradient(m,m,m+bw,m+bh);
      metal.addColorStop(0,'#9db3c8');metal.addColorStop(.17,'#3f5266');
      metal.addColorStop(.40,'#1b2939');metal.addColorStop(.62,'#4a5d72');
      metal.addColorStop(.84,'#243447');metal.addColorStop(1,'#8fa5bb');
      roundRect(x,m,m,bw,bh,r);x.fillStyle=metal;x.fill();
      const lip=Math.max(2,m*.3);
      roundRect(x,m+lip,m+lip,bw-lip*2,bh-lip*2,r-lip);x.fillStyle='#05080f';x.fill();
      roundRect(x,sx,sy,sw,sh,sr);x.fillStyle='#02040a';x.fill();
    }
    function bodyTop(x,w,h){
      const {m,bw,bh,r,sx,sy,sw,sh,sr}=BODY(w,h);
      const B=BODY(w,h);
      const nw=Math.min(76,sw*.36), nh=Math.max(13,sh*.027), nx=sx+sw/2-nw/2;
      // Sit in the forehead when the body gives us one, otherwise ride the top
      // of the glass as before.
      const roomy=B.brow>nh*1.35;
      const ny=roomy?m+(sy-m-nh)/2:sy-nh/2, cy=ny+nh/2;
      x.fillStyle='#04070d';roundRect(x,nx,ny,nw,nh,nh/2);x.fill();
      // camera, then the earpiece slit running back from it
      x.fillStyle='#0c1522';x.beginPath();x.arc(nx+nw-nh*.62,cy,nh*.28,0,7);x.fill();
      x.fillStyle='#2f6b88';x.beginPath();x.arc(nx+nw-nh*.62,cy,nh*.12,0,7);x.fill();
      x.fillStyle='#0c1522';roundRect(x,nx+nh*.55,cy-1.3,nw-nh*1.6,2.6,1.3);x.fill();
      if(roomy){ // a chin speaker grille, so the lower bezel is not dead space
        const gw=sw*.22,gx=sx+sw/2-gw/2,gy=sy+sh+(m+bh-sy-sh-3)/2;
        x.fillStyle='#0b1420';roundRect(x,gx,gy-1.6,gw,3.2,1.6);x.fill();}
      // glass sheen, kept inside the screen
      x.save();roundRect(x,sx,sy,sw,sh,sr);x.clip();
      const sheen=x.createLinearGradient(sx,sy,sx+sw*.85,sy+sh);
      sheen.addColorStop(0,'rgba(255,255,255,.085)');sheen.addColorStop(.32,'rgba(255,255,255,0)');
      x.fillStyle=sheen;x.fillRect(sx,sy,sw,sh);x.restore();
      roundRect(x,sx,sy,sw,sh,sr);x.strokeStyle='rgba(0,0,0,.6)';x.lineWidth=1.6;x.stroke();
      roundRect(x,m+.8,m+.8,bw-1.6,bh-1.6,r);x.strokeStyle='rgba(198,216,233,.62)';x.lineWidth=1.1;x.stroke();
    }

    /* ---- plane 1 · the screen ----
       The artwork carries every shape and no words: image models wreck small text,
       and text drawn here stays sharp at any card size and can be reworded without
       a regeneration. The coordinates below were measured off the artwork. */
    let screenImg=null;
    {const im=new Image();im.onload=()=>{screenImg=im;if(W)resize();};im.src=o.base+'screen.webp';}

    /* Each label bar was measured off the artwork rather than eyeballed, so the
       text centres inside its own pill instead of floating near it — the three
       bars are not the same width. */
    const UI={
      title : {y0:.029,y1:.068},
      labels: [{cx:.1904,cy:.1156,w:.2832},{cx:.1782,cy:.2604,w:.2588},{cx:.1782,cy:.3929,w:.2588}],
      fields: [[.133,.214],[.280,.344],[.413,.479]],
      pills : {y0:.521,y1:.596,x:[[.050,.345],[.354,.647],[.656,.949]]},
      tag   : {cx:.2124,cy:.6517,w:.3154},
      button: {y0:.716,y1:.807},
      pad   : .085,
    };
    const COPY={
      title :'NEW REPORT',
      rows  :[['SITE','Plant 4 — Line B'],['CATEGORY','Equipment damage'],['DESCRIPTION','Conveyor belt jam']],
      pills :['Low','Medium','High'],
      live  : 2,
      tag   :'2 photos added',
      button:'Submit report',
    };

    function drawPhone(x,w,h){
      const {sx,sy,sw,sh,sr}=BODY(w,h);
      bodyPlate(x,w,h);
      x.save();roundRect(x,sx,sy,sw,sh,sr);x.clip();

      if(!screenImg){
        x.fillStyle='#0a1422';x.fillRect(sx,sy,sw,sh);
        label(x,'SCREEN ART MISSING',sx+14,sy+28,9,'#4f7ba0',1.6);
      }else{
        const sc=Math.max(sw/screenImg.width,sh/screenImg.height);
        const iw=screenImg.width*sc, ih=screenImg.height*sc;
        const ox=sx+(sw-iw)/2, oy=sy+(sh-ih)/2;
        const PX=f=>ox+f*iw, PY=f=>oy+f*ih, FS=k=>Math.max(7,ih*k);

        x.drawImage(screenImg,ox,oy,iw,ih);

        const left=PX(UI.pad), mid=PX(.5);
        // Whole-pixel positions: canvas text drawn on a fraction blurs, which is
        // what made the small labels look soft.
        const put=(text,px,py,size,colour,align='left',weight='600')=>{
          x.save();x.textAlign=align;x.textBaseline='middle';
          x.fillStyle=colour;x.font=weight+' '+size+'px Consolas,monospace';
          x.fillText(text,Math.round(px),Math.round(py));x.restore();
        };
        // Shrink only if a word would not clear its pill, so one long label cannot
        // force the other two to be small.
        const fitted=(text,size,maxW,weight)=>{
          let sz=size;
          do{x.font=weight+' '+sz+'px Consolas,monospace';
             if(x.measureText(text).width<=maxW)break;sz-=.5;}while(sz>6);
          return sz;
        };

        put(COPY.title,left,PY((UI.title.y0+UI.title.y1)/2),FS(.028),'#d3f2ff');

        COPY.rows.forEach(([lab,val],n)=>{
          const bar=UI.labels[n];
          put(lab,PX(bar.cx),PY(bar.cy),fitted(lab,FS(.0205),bar.w*iw-10,'700'),'#d8e8ff','center','700');
          const [a,b]=UI.fields[n];
          put(val,left,PY((a+b)/2),FS(.024),'#dceaf9','left','400');
        });

        const pc=PY((UI.pills.y0+UI.pills.y1)/2);
        COPY.pills.forEach((p,n)=>{
          const [a,b]=UI.pills.x[n], on=n===COPY.live;
          put(p,PX((a+b)/2),pc,FS(.023),on?'#ffe4f4':'#93b6dd','center',on?'700':'400');
        });

        put(COPY.tag,PX(UI.tag.cx),PY(UI.tag.cy),
            fitted(COPY.tag,FS(.021),UI.tag.w*iw-12,'400'),'#bcd2ef','center','400');

        // The button is solid bright cyan, so its label has to go dark.
        put(COPY.button,mid,PY((UI.button.y0+UI.button.y1)/2),FS(.027),'#052236','center','700');
      }

      x.restore();
      bodyTop(x,w,h);
    }

    /* ---- planes 2 and 3 · one board, two live regions ----
       The board is one photograph, drawn identically into both planes. Only which
       half carries current changes, so tilting past the API does not swap the
       picture — it moves the light along the same object.
       The glow is the board's own copper drawn back over itself through 'lighter'.
       Copper is already the brightest thing in the photo, so the traces select
       themselves and nothing has to be kept in register with the artwork. */
    let boardImg=null;
    {const im=new Image();im.onload=()=>{boardImg=im;if(W)resize();};im.src=o.base+'board.webp';}

    /* Measured off the artwork by scanning it for its matte-black packages, so the
       labels land on the chips rather than near them. Fractions are of the image,
       not the card, because the board is cover-fitted into the body. */
    const CHIPS=[
      {r:'api', fx:.502,fy:.271,fw:.246,fh:.151,t:'API',  s:'ASP.NET CORE',big:1},
      {r:'api', fx:.260,fy:.103,fw:.215,fh:.049,t:'AUTH'},
      {r:'api', fx:.740,fy:.103,fw:.215,fh:.049,t:'RULES'},
      {r:'api', fx:.754,fy:.454,fw:.242,fh:.055,t:'SIGNALR'},
      {r:'data',fx:.256,fy:.633,fw:.254,fh:.063,t:'SQL',  s:'AZURE SQL',  big:1},
      {r:'data',fx:.748,fy:.633,fw:.254,fh:.063,t:'REDIS'},
      {r:'data',fx:.256,fy:.786,fw:.254,fh:.063,t:'BLOB'},
      {r:'data',fx:.748,fy:.786,fw:.254,fh:.063,t:'QUEUE'},
    ];
    // Where each half's power reaches full and where it dies away, in image
    // fractions top to bottom. The two bands overlap slightly across the middle
    // bus so neither flip leaves a dark seam there.
    const BAND={api:[0,.001,.50,.60], data:[.52,.60,1,1]};
    const TONE={api :{live:'#3bf7c4',edge:'#d2fff1',ink:'#f4fffc'},
                data:{live:'#c055ff',edge:'#efd7ff',ink:'#fcf2ff'}};

    function bandMask(ctx,x0,x1,band){
      const g=ctx.createLinearGradient(0,x0,0,x1);
      let last=-1;
      for(const [at,a] of [[band[0],0],[band[1],1],[band[2],1],[band[3],0]]){
        const stop=Math.min(1,Math.max(0,at));
        if(stop<=last)continue;            // addColorStop needs strictly rising offsets
        g.addColorStop(stop,'rgba(0,0,0,'+a+')');last=stop;
      }
      return g;
    }

    function drawBoard(x,w,h,region){
      const T=TONE[region],{sx,sy,sw,sh,sr}=BODY(w,h);
      bodyPlate(x,w,h);
      x.save();roundRect(x,sx,sy,sw,sh,sr);x.clip();

      if(!boardImg){
        x.fillStyle='#06181a';x.fillRect(sx,sy,sw,sh);
        label(x,'BOARD ART MISSING',sx+14,sy+28,9,'#4d7a70',1.6);
      }else{
        const sc=Math.max(sw/boardImg.width,sh/boardImg.height);
        const iw=boardImg.width*sc, ih=boardImg.height*sc;
        const ox=sx+(sw-iw)/2, oy=sy+(sh-ih)/2;
        const P=(fx,fy)=>({x:ox+fx*iw,y:oy+fy*ih});

        // Dead board: cooled towards the world's palette and dimmed, so the live
        // half has somewhere to rise from.
        x.filter='brightness(.38) saturate(.55)';
        x.drawImage(boardImg,ox,oy,iw,ih);
        x.filter='none';

        const t=document.createElement('canvas');
        t.width=Math.max(1,Math.round(sw*dpr));t.height=Math.max(1,Math.round(sh*dpr));
        const tc=t.getContext('2d');tc.setTransform(dpr,0,0,dpr,0,0);
        // Contrast crushes the solder mask down and pushes the copper up, so what
        // gets added back is the traces and not the whole rectangle.
        tc.filter='contrast(1.5) brightness(1.08)';
        tc.drawImage(boardImg,ox-sx,oy-sy,iw,ih);
        tc.filter='none';
        // 'color' takes hue and saturation from the fill and keeps the luminosity
        // underneath. 'overlay' could not move green copper to violet — it turned
        // it yellow — and this recolours both halves with one rule.
        // Half strength, not full: the board's own gold and cyan are part of the
        // style, so the region leans towards its colour instead of being repainted.
        tc.globalCompositeOperation='color';tc.globalAlpha=.5;
        tc.fillStyle=T.live;tc.fillRect(0,0,sw,sh);
        tc.globalAlpha=1;tc.globalCompositeOperation='destination-in';
        tc.fillStyle=bandMask(tc,oy-sy,oy-sy+ih,BAND[region]);tc.fillRect(0,0,sw,sh);

        x.save();x.globalCompositeOperation='lighter';x.globalAlpha=.72;
        x.drawImage(t,sx,sy,sw,sh);x.restore();

        for(const ch of CHIPS){
          const live=ch.r===region, p=P(ch.fx,ch.fy), cw=ch.fw*iw, chh=ch.fh*ih;
          // The measured box is the package itself, so the ring goes around it.
          // Three passes: a wide halo for the bloom, a tighter one for body, and a
          // hard unblurred line last so the border stays an edge and not a smudge.
          if(live){
            const rx=Math.round(p.x-cw*.56),ry=Math.round(p.y-chh*.66);
            const rw=Math.round(cw*1.12),rh=Math.round(chh*1.32);
            x.save();x.shadowColor=T.live;
            roundRect(x,rx,ry,rw,rh,4);
            x.strokeStyle=T.live;x.globalAlpha=.55;x.lineWidth=2.8;x.shadowBlur=26;x.stroke();
            x.globalAlpha=.85;x.lineWidth=1.8;x.shadowBlur=11;x.stroke();
            x.globalAlpha=1;x.lineWidth=1;x.shadowBlur=0;x.strokeStyle=T.edge;x.stroke();
            x.restore();
          }
          // Labels are drawn three times as well: a blurred glow underneath, a dark
          // outline to hold them against the lit package, then the crisp face on
          // top. Blurring the final pass is what smeared them before.
          const size=ch.big?14:11;
          const tx=Math.round(p.x), ty=Math.round(p.y+(ch.s?-3:size/3));
          x.save();x.textAlign='center';x.lineJoin='round';
          const stack=(text,px,py,font,glow,face)=>{
            x.font=font;
            if(live){x.save();x.shadowColor=glow;x.shadowBlur=9;x.globalAlpha=.5;
              x.fillStyle=glow;x.fillText(text,px,py);x.restore();}
            x.lineWidth=2.6;x.strokeStyle='rgba(2,6,16,.72)';x.strokeText(text,px,py);
            x.fillStyle=face;x.fillText(text,px,py);
          };
          stack(ch.t,tx,ty,'700 '+size+'px Consolas,monospace',T.live,live?T.ink:'#8aa2c4');
          if(ch.s)stack(ch.s,tx,Math.round(p.y+10),'700 8px Consolas,monospace',T.live,live?T.edge:'#6d84a6');
          x.restore();
        }
      }

      x.restore();
      bodyTop(x,w,h);
    }

    /* ---------- grain ----------------------------------------------------------
       Rendered once into a tile. A smooth rainbow reads as plastic; real foil has
       micro-noise, and this is the cheapest way to get it. */
    const grainTile=(()=>{const g=document.createElement('canvas');g.width=g.height=128;
      const gx=g.getContext('2d'),d=gx.createImageData(128,128);
      for(let i=0;i<d.data.length;i+=4){const v=200+Math.random()*55|0;
        d.data[i]=d.data[i+1]=d.data[i+2]=v;d.data[i+3]=255;}
      gx.putImageData(d,0,0);return g;})();

    /* The lenticular itself does not care what is on the three faces. The
       architecture chapter uses the screen and the two halves of the board; the
       security chapter hands in three views of the same list. Anything passed
       in is handed the same kit the built-in faces use, so every card keeps one
       handset and one silhouette. */
    const KIT={BODY,bodyPlate,bodyTop,roundRect,label};
    function resize(){
      const r=card.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);
      W=Math.round(r.width*dpr);H=Math.round(r.height*dpr);
      card.width=W;card.height=H;
      const faces=o.screens||[drawPhone,
        (x,w,h)=>drawBoard(x,w,h,'api'),
        (x,w,h)=>drawBoard(x,w,h,'data')];
      for(let i=0;i<N;i++)planes[i]=makePlane((x,w,h)=>faces[i](x,w,h,KIT));
      loaded.forEach((im,i)=>{if(im)planes[i]=im;});
    }
    const loaded=[null,null,null];
    new ResizeObserver(resize).observe(card);

    /* ---------- the lenticular itself ------------------------------------------ */
    const smoothstep=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};

    /* Each plane owns a viewing angle. Away from its own angle the weight is held
       near zero and then snaps, because a real card switches over three or four
       degrees rather than dissolving across the whole range. At the midpoint both
       neighbours sit near .5, which is the double image you see on a real card as
       it turns over. */
    function weights(t,sharp){
      const step=1/(N-1),lo=.5*sharp,hi=1-.5*sharp,w=[];
      for(let i=0;i<N;i++){
        const lin=Math.max(0,1-Math.abs(t-i*step)/step);
        w.push(sharp<.02?lin:smoothstep(lo,hi,lin));
      }
      return w;
    }

    function draw(t,o){
      if(!W)return;
      const w=weights(t,o.sharp), sum=w.reduce((a,b)=>a+b,0)||1;
      // Left transparent so the world shows around the handset. Filling here
      // is what put a black tile behind it.
      c.clearRect(0,0,W,H);

      // Depth parallax: the planes behind sit further away, so they travel less.
      const shift=i=>(t-i/(N-1))*o.plx*dpr*(1+i*.45);

      // 1. crosstalk — the soft bleed a real lens leaks between its strips. This
      //    also keeps thin strips from aliasing into noise at a small pitch.
      if(o.bleed>.002)for(let i=0;i<N;i++){
        if(w[i]<=.002)continue;
        c.globalAlpha=(w[i]/sum)*o.bleed;
        c.drawImage(planes[i],shift(i),0,W,H);
      }

      // 2. the strips. Within one lens pitch each plane owns a slice as wide as its
      //    weight, which is what a lenticular physically does.
      const pitch=Math.max(2,o.pitch*dpr), phase=(t*pitch*2.2)%pitch;
      let acc=0;
      for(let i=0;i<N;i++){
        const frac=w[i]/sum;
        if(frac>.002){
          c.save();c.beginPath();
          for(let x=-pitch+phase;x<W+pitch;x+=pitch)c.rect(x+acc*pitch,0,frac*pitch,H);
          c.clip();
          c.globalAlpha=1-o.bleed*.45;
          c.drawImage(planes[i],shift(i),0,W,H);
          c.restore();
        }
        acc+=frac;
      }
      c.globalAlpha=1;

      // Passes 3 and 4 belong to the device, not to the canvas. Unclipped they
      // washed over the transparent margin around it, which is what still read
      // as a pale frame once the black background came off.
      const B=BODY(W/dpr,H/dpr);
      c.save();roundRect(c,B.m*dpr,B.m*dpr,B.bw*dpr,B.bh*dpr,B.r*dpr);c.clip();

      // 3. lens ribbing — a faint standing line per pitch. Without this the card
      //    never reads as a piece of plastic.
      c.save();c.globalAlpha=.20;c.fillStyle='#000';
      for(let x=-pitch+phase;x<W+pitch;x+=pitch)c.fillRect(x,0,Math.max(1,pitch*.10),H);
      c.globalAlpha=.08;c.fillStyle='#cfe9ff';
      for(let x=-pitch+phase;x<W+pitch;x+=pitch)c.fillRect(x+pitch*.42,0,Math.max(1,pitch*.10),H);
      c.restore();

      // 4. foil sweep. It travels against the tilt and dies at rest, so the shine
      //    belongs to the viewer's movement instead of running as an animation.
      const gate=smoothstep(0,.16,t)*o.foil;
      if(gate>.004){
        const band=W*1.5, cxp=W*(1.25-t*1.9);
        const g=c.createLinearGradient(cxp-band/2,-H*.25,cxp+band/2,H*1.25);
        g.addColorStop(0,'rgba(0,0,0,0)');
        g.addColorStop(.34,'rgba(64,220,255,'+(gate*.30).toFixed(3)+')');
        g.addColorStop(.47,'rgba(224,255,246,'+(gate*.50).toFixed(3)+')');
        g.addColorStop(.58,'rgba(255,120,236,'+(gate*.34).toFixed(3)+')');
        g.addColorStop(.72,'rgba(255,205,96,'+(gate*.26).toFixed(3)+')');
        g.addColorStop(1,'rgba(0,0,0,0)');
        c.save();c.globalCompositeOperation='screen';c.fillStyle=g;c.fillRect(0,0,W,H);
        if(o.grain>.004){
          c.globalCompositeOperation='overlay';c.globalAlpha=gate*o.grain*.55;
          const p=c.createPattern(grainTile,'repeat');
          c.setTransform(1,0,0,1,(t*37)%128,(t*23)%128);c.fillStyle=p;c.fillRect(-128,-128,W+256,H+256);
          c.setTransform(1,0,0,1,0,0);
        }
        c.restore();
      }
      c.globalAlpha=1;c.restore();

    if(o.onFrame)o.onFrame(Math.round(t*(N-1)),t);
    }

    return {
      canvas:card,
      get options(){return o;},
      set options(v){Object.assign(o,v);},
      resize,
      draw(t){draw(Math.max(0,Math.min(1,t)),o);},
      setPlane(i,img){loaded[i]=img;resize();},
      planeCount:N,
    };
  }

  global.createTiltCard=createArchitectureCard;
  global.createArchitectureCard=createArchitectureCard;   // the original caller
})(window);
