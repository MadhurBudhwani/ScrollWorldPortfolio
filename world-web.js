// Organic silk filaments and an adhesive spiral, drawn in scene coordinates.
// Launch progress belongs to physics: the visual tip and attachment agree.
window.WorldWeb={
  draw(c,{hand,anchor,progress=1,attached=false,age=0,time=0,reduced=false}){
    const dx=anchor.x-hand.x,dy=anchor.y-hand.y,total=Math.hypot(dx,dy);
    if(total<1||progress<=0)return;
    const length=total*Math.min(1,progress),ux=dx/total,uy=dy/total,nx=-uy,ny=ux;
    const point=(s,offset=0)=>[hand.x+ux*s+nx*offset,hand.y+uy*s+ny*offset];
    c.save();c.lineCap='round';c.lineJoin='round';
    // Fine uneven filaments split and rejoin around a translucent central strand.
    c.strokeStyle='#57777e';c.lineWidth=4.5;c.beginPath();c.moveTo(hand.x,hand.y);c.lineTo(...point(length));c.stroke();
    for(let strand=0;strand<3;strand++){
      c.strokeStyle=['#edf3eb','#97aaa8','#d7e4df'][strand];c.lineWidth=strand===0?1.35:.9;c.beginPath();
      const segments=Math.max(2,Math.ceil(length/4));
      for(let i=0;i<=segments;i++){
        const s=length*i/segments,taper=Math.min(1,s/14,(length-s)/10);
        const grain=(Math.sin(s*.31+strand*2.3)*1.45+Math.sin(s*.113+strand*4)*.85)*taper;
        const p=point(s,grain);if(i===0)c.moveTo(...p);else c.lineTo(...p);
      }c.stroke();
    }
    // Small irregular silk loops give texture without turning it into a cable.
    c.strokeStyle='#b9ccc4';c.lineWidth=.8;
    for(let s=23;s<length-12;s+=31){const size=2+Math.sin(s)*.8;c.beginPath();c.moveTo(...point(s-5));c.quadraticCurveTo(...point(s-1,size*2),...point(s+4));c.quadraticCurveTo(...point(s+1,-size),...point(s-5));c.stroke();}
    if(!attached){
      const tip=point(length);c.strokeStyle='#edf7ef';c.lineWidth=1.2;
      for(const side of [-1,1]){c.beginPath();c.moveTo(...tip);c.lineTo(...point(Math.max(0,length-10),side*4));c.stroke();}
      if(progress<.25){c.globalAlpha=1-progress/.25;c.beginPath();c.arc(hand.x,hand.y,3+progress*14,0,Math.PI*2);c.stroke();}
    }else{
      // Silk splays over the target, then winds out into an irregular sticky spiral.
      const spread=reduced?1:Math.min(1,age/.19),radius=29*spread;
      c.translate(anchor.x,anchor.y);c.strokeStyle='#dbe9df';c.lineWidth=1.1;
      for(let i=0;i<7;i++){
        const angle=i*Math.PI*2/7+.14,r=radius*(.75+.22*Math.sin(i*2+1));
        const x=Math.cos(angle)*r,y=Math.sin(angle)*r;
        c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(x*.4+Math.sin(i)*4,y*.6,x,y);c.lineTo(x+Math.sin(i*3)*4*spread,y+Math.cos(i)*4*spread);c.stroke();
      }
      c.beginPath();
      for(let i=0;i<=100;i++){const t=i/100,angle=t*Math.PI*5.4,r=radius*(.1+t*.8)*(1+Math.sin(angle*3)*.09);const x=Math.cos(angle)*r,y=Math.sin(angle)*r;if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.stroke();
      c.fillStyle='#ecf4e7';c.fillRect(-2,-2,4,4);
    }
    c.restore();
  }
};
