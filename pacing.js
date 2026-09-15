// Every input holds a direction; one frame clock owns all movement.
// Wheel magnitudes and event counts never become queued scroll distance.
class ScrollPacer {
  constructor() {
    this.direction=0;this.touchY=null;this.keys=new Map();
    this.secondsPerChapter=10;this.trainSeconds=18;
    this.gestureDirection=0;this.lastGestureAt=-Infinity;this.gestureGapMs=72;
    this.editable=e=>e.target instanceof Element&&e.target.closest('input,textarea,select,[contenteditable="true"]');
    window.addEventListener('wheel',e=>{
      if(e.ctrlKey||reducedMotion.matches||this.editable(e)||!Number.isFinite(e.deltaY)||e.deltaY===0)return;
      e.preventDefault();e.stopImmediatePropagation();
      if(state.exit)return;
      this.pulse(Math.sign(e.deltaY));
    },{passive:false,capture:true});
    window.addEventListener('touchstart',e=>{this.touchY=e.touches.length===1?e.touches[0].clientY:null;},{passive:true});
    window.addEventListener('touchmove',e=>{
      if(this.touchY===null||reducedMotion.matches||this.editable(e)||e.touches.length!==1)return;
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
      const directions={ArrowDown:1,ArrowUp:-1,PageDown:1,PageUp:-1,' ':e.shiftKey?-1:1};
      if(directions[e.key]){e.preventDefault();this.endGesture();this.keys.set(e.key,directions[e.key]);}
      if(e.key==='Home'||e.key==='End'){e.preventDefault();this.go(e.key==='Home'?0:lenis.limit);}
    });
    window.addEventListener('keyup',e=>{this.keys.delete(e.key);});
    window.addEventListener('blur',()=>this.cancel());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.cancel();});
    window.addEventListener('pointerdown',()=>this.endGesture());
  }
  pulse(direction){this.gestureDirection=direction;this.lastGestureAt=performance.now();}
  endGesture(){this.gestureDirection=0;this.lastGestureAt=-Infinity;}
  // Explicit navigation is a seek, never a long-running trip through chapters.
  go(destination){this.cancel();lenis.scrollTo(destination,{immediate:true});}
  cancel(){this.direction=0;this.endGesture();this.keys.clear();}
  tick(time,dt){
    if(reducedMotion.matches||state.exit){this.cancel();return;}
    const gestureActive=time-this.lastGestureAt<this.gestureGapMs;
    this.direction=this.keys.size?[...this.keys.values()].at(-1):gestureActive?this.gestureDirection:0;
    if(!this.direction)return;
    const current=lenis.animatedScroll,chapter=(current-state.top)/state.travel*scenes.length;
    const seconds=chapter>=1&&chapter<2?this.trainSeconds:this.secondsPerChapter;
    const step=state.travel/scenes.length/seconds*Math.min(dt,1/30);
    lenis.scrollTo(clamp(current+this.direction*step,0,lenis.limit),{immediate:true});
  }
}
