// Fixed-step platform physics, independent of rendering and browser input.
(() => {
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  class WorldPhysics {
    constructor(level){this.level=level;this.checkpoint=0;this.respawns=0;this.reset();}
    reset(){
      const floor=this.level.platforms[this.checkpoint];
      this.player={x:floor.x+Math.min(180,floor.w/2),y:floor.y,vx:0,vy:0,facing:1,grounded:true,platform:this.checkpoint,fuel:1};
      this.rope=null;this.webShot=null;this.climbing=false;this.climbPhase=0;this.jetpack=false;this.jetpackBlend=0;this.jumpBuffer=0;this.coyote=.1;this.powerWasHeld=false;
    }
    hand(){const p=this.player;return {x:p.x,y:p.y-148};}
    candidate(){
      const p=this.player,h=this.hand();
      return (this.level.anchors||[]).filter(a=>a.y<h.y-35&&Math.hypot(a.x-h.x,a.y-h.y)<690)
        .sort((a,b)=>this.anchorScore(a,p,h)-this.anchorScore(b,p,h))[0]||null;
    }
    anchorScore(a,p,h){return Math.hypot(a.x-h.x,a.y-h.y)+((a.x-p.x)*p.facing< -40?380:0);}
    release(){this.rope=null;this.webShot=null;this.climbing=false;this.powerWasHeld=false;}
    toggleJetpack(){if(this.level.kind==='gallery')this.jetpack=!this.jetpack;}
    step(dt,input={}){
      const p=this.player,move=clamp(input.move||0,-1,1);
      this.jetpackBlend=clamp(this.jetpackBlend+(this.jetpack?1:-1)*dt/.65,0,1);
      const flying=this.level.kind==='gallery'&&this.jetpack&&this.jetpackBlend>=.85;
      if(input.jump)this.jumpBuffer=.12;else this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
      this.coyote=p.grounded?.1:Math.max(0,this.coyote-dt);
      if(!flying&&this.jumpBuffer>0&&this.coyote>0){p.vy=-(this.level.kind==='moon'?510:650);p.grounded=false;this.coyote=0;this.jumpBuffer=0;}
      this.climbing=false;
      if(!input.power){this.rope=null;this.webShot=null;}
      if(this.level.kind==='city'&&input.power&&!this.powerWasHeld&&!p.grounded){
        const anchor=this.candidate(),h=this.hand();
        if(anchor)this.webShot={anchor,elapsed:0,progress:0,duration:clamp(Math.hypot(h.x-anchor.x,h.y-anchor.y)/1800,.16,.34)};
      }
      // No rope force until the travelling web tip actually reaches the anchor.
      if(this.webShot){
        const shot=this.webShot;shot.elapsed+=dt;shot.progress=Math.min(1,shot.elapsed/shot.duration);
        if(shot.progress===1){const h=this.hand();this.rope={anchor:shot.anchor,length:Math.hypot(h.x-shot.anchor.x,h.y-shot.anchor.y),age:0,minLength:85};this.webShot=null;this.climbPhase=0;}
      }
      if(this.rope){
        this.rope.age+=dt;
        if(input.climb&&this.rope.length>this.rope.minLength){
          const h=this.hand(),distance=Math.hypot(h.x-this.rope.anchor.x,h.y-this.rope.anchor.y);
          const length=Math.max(this.rope.minLength,Math.min(distance,this.rope.length)-145*dt);
          const takenUp=this.rope.length-length;this.rope.length=length;
          this.climbing=takenUp>0;this.climbPhase+=Math.min(takenUp,145*dt)/52;
        }
      }
      // Holding before a jump can attach as soon as the character leaves the roof.
      this.powerWasHeld=!!input.power&&!p.grounded;
      const accelerating=move*(p.grounded?2400:this.rope?1050:850);
      p.vx+=accelerating*dt;
      if(p.grounded&&!move)p.vx*=Math.exp(-14*dt);
      if(!p.grounded&&!move&&!this.rope)p.vx*=Math.exp(-2*dt);
      const limit=this.rope?880:p.grounded?340:this.level.kind==='moon'?420:650;p.vx=clamp(p.vx,-limit,limit);
      if(flying){
        this.jumpBuffer=0;
        const targetY=(input.descend?260:0)-(input.ascend?300:0);
        p.vy+=(targetY-p.vy)*(1-Math.exp(-9*dt));
        if(p.grounded&&!input.descend){p.y-=3;p.grounded=false;}
      }else p.vy+=(this.level.kind==='moon'?430:1500)*dt;
      this.boosting=this.level.kind==='moon'&&input.power&&p.fuel>0&&!p.grounded;
      if(this.boosting){p.vy=Math.max(-560,p.vy-900*dt);p.fuel=Math.max(0,p.fuel-dt*.7);}
      if(p.grounded)p.fuel=Math.min(1,p.fuel+dt*.7);
      const oldX=p.x,oldY=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;p.grounded=false;
      if(this.rope){
        const h=this.hand(),a=this.rope.anchor,dx=h.x-a.x,dy=h.y-a.y,d=Math.hypot(dx,dy);
        if(d>this.rope.length){
          const nx=dx/d,ny=dy/d;p.x-=nx*(d-this.rope.length);p.y-=ny*(d-this.rope.length);
          const radial=p.vx*nx+p.vy*ny;if(radial>0){p.vx-=radial*nx;p.vy-=radial*ny;}
        }
      }
      if(p.vy>=0)this.level.platforms.some((f,i)=>{
        if(p.x>=f.x+12&&p.x<=f.x+f.w-12&&oldY<=f.y+1&&p.y>=f.y){
          p.y=f.y;p.vy=0;p.grounded=true;p.platform=i;this.checkpoint=i;this.rope=null;this.webShot=null;this.climbing=false;return true;
        }return false;
      });
      // The visible building/cliff faces are solid below their rooftop edge.
      for(const floor of this.level.platforms){
        if(p.y<=floor.y+2)continue;
        if(oldX+18<=floor.x&&p.x+18>floor.x){p.x=floor.x-18;p.vx=0;}
        else if(oldX-18>=floor.x+floor.w&&p.x-18<floor.x+floor.w){p.x=floor.x+floor.w+18;p.vx=0;}
      }
      const boundedX=clamp(p.x,24,this.level.width-24);if(boundedX!==p.x)p.vx=0;p.x=boundedX;
      if(p.y< -500){p.y=-500;p.vy=Math.max(0,p.vy);}
      if(this.level.kind==='gallery'&&p.y<280){p.y=280;p.vy=Math.max(0,p.vy);}
      if(Math.abs(p.vx)>12)p.facing=Math.sign(p.vx);
      if(p.y>1120){this.respawns++;this.reset();}
    }
    nearby(){const p=this.player;return this.level.exhibits.find(e=>Math.abs(p.x-e.x)<150&&((p.grounded&&Math.abs(p.y-e.floor)<12)||(this.level.kind==='gallery'&&this.jetpack&&p.y<=e.floor+12&&p.y>=e.floor-380)))||null;}
  }
  globalThis.WorldPhysics=WorldPhysics;
})();
