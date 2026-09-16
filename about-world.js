(() => {
  const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
  const button=(text,fn,cls='')=>{const b=el('button',cls,text);b.type='button';b.onclick=fn;return b;};
  class AboutWorld {
    constructor(dialog){
      this.dialog=dialog;this.root=el('section','about-panel');this.root.hidden=true;dialog.insertBefore(this.root,dialog.querySelector('.dialog-footnote'));this.reduced=matchMedia('(prefers-reduced-motion: reduce)');this.lenses={};this.energy=0;this.active=false;
      dialog.addEventListener('close',()=>this.close());
    }
    route(go){
      document.body.classList.add('about-world');const nav=el('nav','about-route');nav.setAttribute('aria-label','Observatory stations');const label=el('label','','Jump to an idea');const select=el('select');select.setAttribute('aria-label','Visit an About Me station');
      AboutData.stations.forEach((s,i)=>{const o=el('option','',String(i+1).padStart(2,'0')+' / '+s.title);o.value=i;select.append(o);});select.onchange=()=>go(Number(select.value));label.append(select);nav.append(label);document.querySelector('#sceneViewport').append(nav);this.routeSelect=select;
    }
    pulse(){this.energy=1;}
    close(){cancelAnimationFrame(this.frame);this.reader?.destroy();this.reader=null;this.active=false;this.root.hidden=true;this.dialog.classList.remove('about-mode');}
    open(index){
      this.close();this.active=true;this.index=index;this.onExplore?.(index);this.station=AboutData.stations[index];const s=this.station;this.root.hidden=false;this.dialog.classList.add('about-mode');this.root.replaceChildren();this.root.dataset.view='story';this.root.style.setProperty('--about-accent',s.color);
      document.querySelector('#dialogTitle').textContent=s.title;document.querySelector('#dialogTag').textContent=`ABOUT MADHUR / ${String(index+1).padStart(2,'0')} / ${s.tag}`;
      const top=el('div','about-panel-nav');const stationSelect=el('select');stationSelect.setAttribute('aria-label','Explore another side of Madhur');AboutData.stations.forEach((item,i)=>{const o=el('option','',item.title);o.value=i;o.selected=i===index;stationSelect.append(o);});stationSelect.onchange=()=>this.open(Number(stationSelect.value));top.append(stationSelect);
      const views=el('div','about-view-tabs');for(const [id,title] of [['story','The story'],['visual','The instrument']]){const b=button(title,()=>{this.root.dataset.view=id;[...views.children].forEach(n=>n.setAttribute('aria-pressed',String(n===b)));this.reader.schedule();});b.setAttribute('aria-pressed',String(id==='story'));views.append(b);}top.append(views);this.root.append(top);
      const body=el('div','about-panel-body'),visual=el('div','about-instrument'),canvas=el('canvas');canvas.width=720;canvas.height=640;canvas.setAttribute('aria-label',s.title+' animated instrument');visual.append(el('span','about-instrument-label','OBSERVATORY / '+s.object.toUpperCase()),canvas);const signal=el('p','about-signal');visual.append(signal);
      const readerHost=el('article','about-reading');body.append(visual,readerHost);this.root.append(body);this.reader=new PagedReader(readerHost);
      const lenses=el('nav','about-lenses');lenses.setAttribute('aria-label','Ways to explore this idea');this.root.append(lenses);
      const choose=i=>{this.lenses[s.id]=i;const lens=s.lenses[i];signal.textContent=lens.signal;[...lenses.children].forEach((n,j)=>n.setAttribute('aria-pressed',String(i===j)));this.reader.set([{tag:'h3',text:lens.heading},...lens.text.split('\n\n').map(text=>({tag:'p',text}))]);this.energy=1;};
      s.lenses.forEach((lens,i)=>lenses.append(button(lens.label,()=>choose(i))));choose(this.lenses[s.id]||0);
      const footer=el('footer','about-panel-footer');footer.append(button('← Observatory',()=>this.dialog.close()));
      if(s.id==='connect'){
        footer.classList.add('about-connect-footer');
        const links=el('div','about-socials');for(const social of AboutData.socials){const a=el('a','about-social');a.append(el('span','',social.label),el('span','about-social-handle',' · '+social.handle),el('span','',' ↗'));a.href=social.href;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label',social.label+' '+social.handle+' (opens in a new tab)');links.append(a);}footer.append(links);
      }else footer.append(button('Next constellation →',()=>this.open((index+1)%AboutData.stations.length)));
      this.root.append(footer);
      let elapsed=0,last=0,paused=false;const motion=button('Pause motion',()=>{paused=!paused;motion.textContent=paused?'Resume motion':'Pause motion';});motion.className='about-motion';motion.hidden=this.reduced.matches;visual.append(motion);
      const c=canvas.getContext('2d');const tick=t=>{if(!this.active)return;const dt=Math.min(.04,last?(t-last)/1000:0);last=t;if(!document.hidden&&!window.landscapePrompt?.blocked&&!paused&&!this.reduced.matches)elapsed+=dt;this.energy=Math.max(0,this.energy-dt*.65);
        c.fillStyle='#0c1826';c.fillRect(0,0,720,640);for(let x=0;x<720;x+=40){c.strokeStyle='#1b2b3c';c.beginPath();c.moveTo(x,0);c.lineTo(x,640);c.stroke();}for(let y=0;y<640;y+=40){c.beginPath();c.moveTo(0,y);c.lineTo(720,y);c.stroke();}
        c.save();c.translate(360,312);c.scale(1.8,1.8);AboutScene.artifact(c,s.object,elapsed,s.color,this.lenses[s.id]||0,this.reduced.matches?0:this.energy);c.restore();this.frame=requestAnimationFrame(tick);
      };this.frame=requestAnimationFrame(tick);
    }
  }
  window.AboutWorld=AboutWorld;
})();
