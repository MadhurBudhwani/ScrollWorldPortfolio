// Every input holds a direction; one frame clock owns all movement.
// Wheel magnitudes and event counts never become queued scroll distance.
class ScrollPacer {
  constructor() {
    this.direction=0;this.touchY=null;this.keys=new Map();this.heldControl=null;
    this.secondsPerChapter=10;this.trainSeconds=18;this.securitySeconds=28;this.writingSeconds=18;
    this.gestureDirection=0;this.lastGestureAt=-Infinity;this.gestureGapMs=72;
    // A trackpad emits a wheel event every ~10ms, a mouse wheel one per notch
    // every ~150ms. A single 72ms hold therefore ran a trackpad at full duty
    // and a mouse at about half, which is what made wheel scrolling crawl in
    // visible steps. Measure the cadence rather than guessing the device and
    // hold the gesture just past the next expected notch. Pace is untouched;
    // only the dead gaps between notches close.
    this.gestureHoldMs=this.gestureGapMs;this.wheelHoldMs=this.gestureGapMs;
    this.wheelGaps=[];this.lastWheelAt=-Infinity;
    this.editable=e=>e.target instanceof Element&&e.target.closest('input,textarea,select,[contenteditable="true"]');
    window.addEventListener('wheel',e=>{
      if(e.ctrlKey||reducedMotion.matches||this.editable(e)||!Number.isFinite(e.deltaY)||e.deltaY===0)return;
      window.portfolioTour?.stop();
      e.preventDefault();e.stopImmediatePropagation();
      if(state.exit)return;
      this.measureWheel(performance.now());
      this.pulse(Math.sign(e.deltaY),this.wheelHoldMs);
    },{passive:false,capture:true});
    window.addEventListener('touchstart',e=>{
      const onControl=e.target instanceof Element&&e.target.closest('[data-scroll-direction]');
      this.touchY=!onControl&&e.touches.length===1?e.touches[0].clientY:null;
    },{passive:true});
    window.addEventListener('touchmove',e=>{
      if(this.touchY===null||reducedMotion.matches||this.editable(e)||e.touches.length!==1)return;
      window.portfolioTour?.stop();
      const y=e.touches[0].clientY,dy=this.touchY-y;this.touchY=y;
      e.preventDefault();e.stopImmediatePropagation();
      if(dy!==0&&!state.exit)this.pulse(Math.sign(dy));
    },{passive:false,capture:true});
    const endTouch=()=>{this.touchY=null;this.endGesture();};
    window.addEventListener('touchend',endTouch,{passive:true});
    window.addEventListener('touchcancel',endTouch,{passive:true});
    window.addEventListener('keydown',e=>{
      if(reducedMotion.matches||this.editable(e)||state.hubLive||e.ctrlKey||e.metaKey||e.altKey)return;
      if(e.target instanceof Element&&e.target.closest('button,a')&&e.key===' ')return;
      const directions={ArrowDown:1,ArrowUp:-1,PageDown:1,PageUp:-1};
      if(directions[e.key]){e.preventDefault();this.endGesture();this.keys.set(e.key,directions[e.key]);}
      if(e.key==='Home'||e.key==='End'){e.preventDefault();this.go(e.key==='Home'?0:lenis.limit);}
    });
    window.addEventListener('keyup',e=>{this.keys.delete(e.key);});
    window.addEventListener('blur',()=>this.cancel());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.cancel();});
    window.addEventListener('pointerdown',()=>this.endGesture());
  }
  pulse(direction,holdMs=this.gestureGapMs){this.gestureDirection=direction;this.lastGestureAt=performance.now();this.gestureHoldMs=holdMs;}
  endGesture(){this.gestureDirection=0;this.lastGestureAt=-Infinity;this.gestureHoldMs=this.gestureGapMs;}
  // Only wheel events feed the cadence sample; touch already arrives fast
  // enough that the default hold covers it.
  measureWheel(now){
    const gap=now-this.lastWheelAt;this.lastWheelAt=now;
    // A longer pause is the start of a new gesture, not the device's rhythm.
    if(!(gap>0&&gap<500))return;
    this.wheelGaps.push(gap);if(this.wheelGaps.length>8)this.wheelGaps.shift();
    const sorted=[...this.wheelGaps].sort((a,b)=>a-b),median=sorted[sorted.length>>1];
    // 1.8x absorbs the jitter between notches without leaving a coast that
    // outlives the gesture. The ceiling keeps a very slow wheel honest.
    this.wheelHoldMs=Math.min(220,Math.max(this.gestureGapMs,median*1.8));
  }
  bindButtons(buttons){
    buttons.forEach(button=>{
      button.addEventListener('pointerdown',e=>{
        if(e.button!==0||e.isPrimary===false)return;
        e.preventDefault();
        if(this.holdControl(button,e.pointerId))button.setPointerCapture(e.pointerId);
      });
      const release=e=>{
        if(this.heldControl?.button===button&&this.heldControl.pointerId===e.pointerId)this.releaseControl();
      };
      for(const name of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(name,release);
      button.addEventListener('keydown',e=>{
        if(e.key!==' '&&e.key!=='Enter')return;
        e.preventDefault();e.stopPropagation();
        if(!e.repeat)this.holdControl(button);
      });
      button.addEventListener('keyup',e=>{
        if(e.key!==' '&&e.key!=='Enter')return;
        e.preventDefault();e.stopPropagation();
        if(this.heldControl?.button===button)this.releaseControl();
      });
      button.addEventListener('blur',()=>{if(this.heldControl?.button===button)this.releaseControl();});
      button.addEventListener('contextmenu',e=>e.preventDefault());
      button.addEventListener('click',e=>{
        e.preventDefault();
        // Assistive activation has no pointer hold; make one immediate step.
        // Pointer clicks already moved while held and must not add a tail.
        if(e.detail===0&&!state.exit&&!window.landscapePrompt?.blocked)this.advance(Number(button.dataset.scrollDirection),.15);
      });
    });
  }
  holdControl(button,pointerId=null){
    if(state.exit||window.landscapePrompt?.blocked)return false;
    this.releaseControl();this.endGesture();this.touchY=null;
    this.heldControl={button,pointerId,direction:Number(button.dataset.scrollDirection)};
    button.classList.add('is-held');return true;
  }
  releaseControl(){
    this.heldControl?.button.classList.remove('is-held');
    this.heldControl=null;this.direction=0;this.endGesture();
  }
  // Explicit navigation is a seek, never a long-running trip through chapters.
  go(destination){window.portfolioTour?.stop();this.cancel();lenis.scrollTo(destination,{immediate:true});}
  cancel(){this.releaseControl();this.touchY=null;this.keys.clear();}
  tick(time,dt){
    if(state.exit||window.landscapePrompt?.blocked||(reducedMotion.matches&&!this.heldControl)){this.cancel();return;}
    const gestureActive=time-this.lastGestureAt<this.gestureHoldMs;
    this.direction=this.heldControl?.direction||(this.keys.size?[...this.keys.values()].at(-1):gestureActive?this.gestureDirection:0);
    if(!this.direction)return;
    this.advance(this.direction,Math.min(dt,1/30));
  }
  advance(direction,dt){
    const current=lenis.animatedScroll,chapter=(current-state.top)/state.travel*scenes.length;
    const scene=Math.floor(chapter);
    const seconds=scene===1?this.trainSeconds:scene===3?this.securitySeconds:scene===7?this.writingSeconds:this.secondsPerChapter;
    const step=state.travel/scenes.length/seconds*dt;
    lenis.scrollTo(clamp(current+direction*step,0,lenis.limit),{immediate:true});
  }
}
