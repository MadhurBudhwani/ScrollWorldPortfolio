/* One palm blast per press. Hit colours expire on wall time, even across dialogs. */
window.AboutBlaster=class AboutBlaster {
  constructor(level){this.level=level;this.hits=new Map();this.shot=null;}
  fire(player){
    const now=performance.now();if(this.shot&&now-this.shot.start<800)return;
    const target=this.level.exhibits.reduce((best,e)=>Math.hypot(e.x-player.x,440-player.y)<Math.hypot(best.x-player.x,440-player.y)?e:best);
    const index=target.about,base=AboutData.stations[index].color;
    const colours=['#58dfff','#ff75b8','#ffe079','#87ffad','#bf8cff','#ff9468','#69f0d0','#a0baff'].filter(c=>c!==base&&c!==this.hits.get(index)?.color);
    this.shot={start:now,target,index,color:colours[Math.floor(Math.random()*colours.length)],facing:Math.sign(target.x-player.x)||player.facing,hit:false};
  }
  update(){
    const now=performance.now();for(const [id,hit] of this.hits)if(now>=hit.until)this.hits.delete(id);
    if(this.shot){const age=(now-this.shot.start)/1000;if(age>=.18&&!this.shot.hit){this.hits.set(this.shot.index,{color:this.shot.color,until:now+3000});this.shot.hit=true;}if(age>=.9)this.shot=null;}
  }
  color(index){return this.hits.get(index)?.color||AboutData.stations[index].color;}
  draw(c,palm,camera,reduced){
    if(!this.shot)return;const age=(performance.now()-this.shot.start)/1000,charge=Math.min(1,age/.14),fade=Math.max(0,Math.min(1,(.9-age)/.25));
    const target={x:this.shot.target.x-camera.x,y:440-camera.y},travel=Math.min(1,Math.max(0,(age-.12)/.06));
    const end={x:palm.x+(target.x-palm.x)*travel,y:palm.y+(target.y-palm.y)*travel};
    c.save();c.lineCap='round';c.globalCompositeOperation='screen';c.globalAlpha=fade*(reduced?.65:1);
    const glow=c.createRadialGradient(palm.x,palm.y,0,palm.x,palm.y,36*charge+1);glow.addColorStop(0,'#ffffff');glow.addColorStop(.2,'#acffff');glow.addColorStop(.5,'#27b9ff99');glow.addColorStop(1,'#0870ff00');c.fillStyle=glow;c.fillRect(palm.x-38,palm.y-38,76,76);
    if(travel>0){
      const shimmer=reduced?1:1+Math.sin(age*75)*.12;
      for(const [width,color,blur] of [[27,'#075dff55',26],[13,'#168dffee',17],[6,'#79eaff',8],[2.5,'#f1ffff',0]]){c.beginPath();c.moveTo(palm.x,palm.y);c.lineTo(end.x,end.y);c.lineWidth=width*shimmer;c.strokeStyle=color;c.shadowColor='#39bfff';c.shadowBlur=blur;c.stroke();}
      c.shadowBlur=0;
      if(travel===1){
        const impact=c.createRadialGradient(target.x,target.y,0,target.x,target.y,62);impact.addColorStop(0,'#ffffffaa');impact.addColorStop(.25,'#55dfff99');impact.addColorStop(1,'#0870ff00');c.fillStyle=impact;c.fillRect(target.x-62,target.y-62,124,124);
        if(!reduced)for(let i=0;i<14;i++){const a=i*Math.PI*2/14+age,dist=18+((age*95+i*13)%60);c.fillStyle=i%2?'#70dcff':'#eaffff';c.fillRect(target.x+Math.cos(a)*dist,target.y+Math.sin(a)*dist,3+(i%3),3);}
        c.strokeStyle='#9eeeff';c.lineWidth=2;c.beginPath();c.ellipse(target.x,target.y,30+age*32,15+age*16,age,0,Math.PI*2);c.stroke();
      }
    }
    c.restore();
  }
};
