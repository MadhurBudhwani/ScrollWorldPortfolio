/* Opt-in guided playback. The main render loop remains the only scroll clock. */
class AutoplayTour {
  constructor({getState,seek,cancelInput}){
    this.getState=getState;this.seek=seek;this.cancelInput=cancelInput;this.active=false;this.elapsed=0;this.progress=0;
    this.durations=[12,22,17,15,15,20,15,20,5];this.total=this.durations.reduce((a,b)=>a+b,0);
    // A continuously moving playhead. Shared boundary speeds join the chapters
    // smoothly without holding any pose halfway through its existing action.
    this.positions=[0,1,2,3,4,5,6,7,8,8.8];
    const rates=this.durations.map((duration,i)=>(this.positions[i+1]-this.positions[i])/duration);
    this.speeds=this.positions.map((_,i)=>i===0?rates[0]:i===rates.length?rates.at(-1):2*rates[i-1]*rates[i]/(rates[i-1]+rates[i]));
    this.startButton=document.querySelector('#autoplayStart');this.controls=document.querySelector('#autoplayControls');this.status=document.querySelector('#autoplayStatus');
    this.audio=new Audio('./assets/autoplay-blinding-lights-8bit.mp3');this.audio.preload='none';this.audio.loop=true;this.audio.volume=.55;
    this.startButton.onclick=()=>this.start();document.querySelector('#autoplayStop').onclick=()=>this.stop();
    const mute=document.querySelector('#autoplayMute');mute.onclick=()=>{this.audio.muted=!this.audio.muted;mute.textContent=this.audio.muted?'Unmute':'Mute';mute.setAttribute('aria-pressed',String(this.audio.muted));};
    addEventListener('wheel',e=>{if(this.active&&!e.ctrlKey&&e.deltaY)this.stop();},{passive:true,capture:true});
    addEventListener('scroll',()=>this.updateVisibility(),{passive:true});
    addEventListener('keydown',e=>{if(this.active&&!e.ctrlKey&&!e.metaKey&&!['Shift','Control','Alt','Meta','Tab'].includes(e.key)&&!e.target.closest?.('#autoplayControls'))this.stop();},{capture:true});
    addEventListener('pointerdown',e=>{if(this.active&&!e.target.closest?.('#autoplayControls,#autoplayStart'))this.stop();},{capture:true});
    addEventListener('touchstart',e=>{if(this.active&&!e.target.closest?.('#autoplayControls,#autoplayStart'))this.stop();},{passive:true,capture:true});
    addEventListener('pagehide',()=>this.stop());addEventListener('blur',()=>this.stop());document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();});
    this.audio.addEventListener('error',()=>{if(this.active){this.stop();this.startButton.textContent='Audio unavailable · retry';}});
    this.updateVisibility();
  }
  /* Where the playhead sits at a given moment. Pulled out of tick so the same
     curve can be run backwards when the tour is asked to join a page that is
     already part way down. */
  positionAt(elapsed){
    let time=Math.max(0,Math.min(this.total,elapsed)),index=0;
    while(index<this.durations.length-1&&time>=this.durations[index])time-=this.durations[index++];
    const duration=this.durations[index],u=Math.min(1,time/duration),u2=u*u,u3=u2*u;
    const from=this.positions[index],to=this.positions[index+1];
    const position=(2*u3-3*u2+1)*from+(u3-2*u2+u)*duration*this.speeds[index]
      +(-2*u3+3*u2)*to+(u3-u2)*duration*this.speeds[index+1];
    return {index,progress:position/this.durations.length};
  }
  /* The inverse, found by searching rather than solved. The curve is a spline
     over nine segments with shared boundary speeds; inverting it in closed form
     would be a page of algebra for a number that only has to land within a
     frame of the right place. A coarse sweep, then a short bisection. */
  elapsedFor(progress){
    const want=Math.max(0,Math.min(1,progress));
    let best=0,bestGap=Infinity;
    for(let i=0;i<=200;i++){
      const t=this.total*i/200,gap=Math.abs(this.positionAt(t).progress-want);
      if(gap<bestGap){bestGap=gap;best=t;}
    }
    let lo=Math.max(0,best-this.total/200),hi=Math.min(this.total,best+this.total/200);
    for(let i=0;i<24;i++){
      const mid=(lo+hi)/2;
      if(this.positionAt(mid).progress<want)lo=mid;else hi=mid;
    }
    return (lo+hi)/2;
  }
  /* Offered whenever the tour is not running. It used to be hidden unless the
     page sat at the very top, so interrupting the tour left no way back into it
     short of scrolling all the way up again. */
  updateVisibility(){
    this.startButton.hidden=this.active;
    if(this.active||this.retrying)return;
    const label=(this.getState().progress||0)>.002?'▶ Resume tour':'▶ Auto Play';
    if(this.startButton.textContent!==label)this.startButton.textContent=label;
  }
  start(){
    if(this.active||window.landscapePrompt?.blocked)return;
    this.cancelInput();
    // Join the page where it already is instead of snapping back to the start.
    this.elapsed=this.elapsedFor(this.getState().progress||0);
    this.faded=0;this.retrying=false;
    this.progress=this.positionAt(this.elapsed).progress;
    this.active=true;this.ready=false;
    const session=this.session=(this.session||0)+1;
    this.audio.volume=0;this.controls.hidden=false;this.updateVisibility();
    /* Put the music where the tour already is. The track loops, so the moment
       that belongs to this point is the elapsed time wrapped by the track's own
       length — and that length is only known once its metadata has arrived,
       which with preload='none' is after play() has asked for it. */
    const cue=this.elapsed;
    const placeAudio=()=>{
      if(!this.active||this.session!==session)return;
      const length=this.audio.duration;
      if(!length||!isFinite(length))return;
      try{this.audio.currentTime=cue%length;}catch{}
    };
    if(this.audio.readyState>=1)placeAudio();
    else this.audio.addEventListener('loadedmetadata',placeAudio,{once:true});
    this.audio.play().then(()=>{if(this.active&&this.session===session)this.ready=true;}).catch(()=>{if(this.active&&this.session===session){this.stop();this.retrying=true;this.startButton.textContent='▶ Retry Auto Play';}});
  }
  stop(){this.active=false;this.ready=false;this.audio.pause();this.audio.currentTime=0;this.controls.hidden=true;this.updateVisibility();}
  tick(dt){
    if(!this.active)return;
    if(document.hidden||window.landscapePrompt?.blocked){this.stop();return;}
    // Wait for playback to start once. Later audio-buffer fluctuations must not
    // stop the visual playhead or strand the actor in mid-jump.
    if(!this.ready)return;
    this.elapsed=Math.min(this.total,this.elapsed+Math.min(dt,.05));
    // The fade counts from when playback began rather than from the start of
    // the tour, so one joined half way still comes up out of silence.
    this.faded=(this.faded||0)+Math.min(dt,.05);
    this.audio.volume=.55*Math.max(0,Math.min(1,this.faded/1.5,(this.total-this.elapsed)/1.5));
    const {index,progress}=this.positionAt(this.elapsed);
    this.progress=progress;
    this.seek(this.progress);
    const status=`${String(index+1).padStart(2,'0')} / 09 · ${this.getState().title||'Guided tour'}`;
    if(this.status.textContent!==status)this.status.textContent=status;
    if(this.elapsed>=this.total)this.stop();
  }
}
