/* Code-native observatory: parallax sky, orbital machinery and reactive constellations. */
(() => {
  const tau=Math.PI*2;
  function path(c,points,color,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function ring(c,x,y,rx,ry,angle,color,width=2){c.beginPath();c.ellipse(x,y,rx,ry,angle,0,tau);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function label(c,text,x,y,size,color,align='center'){c.font=`${size}px monospace`;c.textAlign=align;c.fillStyle=color;c.fillText(text,x,y);}
  function artifact(c,type,t,color,lens=0,pulse=0){
    c.save();c.shadowColor=color;c.shadowBlur=12;
    if(type==='orbit'){
      for(let i=0;i<3;i++){ring(c,0,0,108,34,t*.16+i*Math.PI/3,color+'88');const a=t*(.6+i*.12)+i*2;const x=Math.cos(a)*108,y=Math.sin(a)*34;c.save();c.rotate(t*.16+i*Math.PI/3);c.fillStyle=color;c.fillRect(x-5,y-5,10,10);c.restore();}
      c.fillStyle='#18283f';c.fillRect(-23,-23,46,46);c.strokeStyle=color;c.strokeRect(-23,-23,46,46);label(c,['?','⚙','!'][lens%3],0,12,34,color);
    }else if(type==='forge'){
      const spread=28+Math.sin(t)*6+lens*12;for(let i=0;i<4;i++){const y=(i-1.5)*spread;c.save();c.translate(0,y);c.scale(1,.42);c.rotate(Math.PI/4);c.fillStyle=i===1?color+'66':'#18383a';c.fillRect(-58,-58,116,116);c.strokeStyle=color;c.strokeRect(-58,-58,116,116);c.restore();}
      for(let i=0;i<9;i++){const a=t*1.4+i*.7;c.fillStyle=color;c.fillRect(Math.sin(a)*85,-110+(t*40+i*23)%220,3,3);}
    }else if(type==='story'){
      for(let side of [-1,1]){c.save();c.scale(side,1);for(let i=4;i>=0;i--){const opening=.92+Math.sin(t*.8+i*.3)*.05;c.fillStyle=['#3a293d','#68506a','#dfcdb7','#eedcc3','#fff0d6'][i];c.beginPath();c.moveTo(0,-68+i*3);c.lineTo(96*opening,-85+i*4);c.lineTo(96*opening,68+i*3);c.lineTo(0,83+i*3);c.fill();}for(let i=0;i<6;i++)path(c,[[16,-42+i*17],[76,-52+i*17]],'#776479',3);c.restore();}
      c.fillStyle=color;for(let i=0;i<8;i++){const a=t*.3+i;c.fillRect(Math.sin(a)*125,-135+(i*31+t*12)%100,3,3);}
    }else if(type==='signal'){
      ring(c,0,0,104,104,0,color+'55');ring(c,0,0,70,70,0,color+'44');path(c,[[-112,0],[112,0]],color+'44');
      const points=[];for(let x=-106;x<=106;x+=4)points.push([x,Math.sin(x*.055+t*2)*32+Math.sin(x*.2+t*3)*(lens===0?14:4)]);path(c,points,color,3);
      c.save();c.rotate(t*.4);path(c,[[0,0],[95,0]],color+'88',2);c.restore();
    }else if(type==='heart'){
      const beat=1+Math.sin(t*2.2)*.04;c.scale(beat,beat);const pts=[[0,80],[-87,-2],[-87,-45],[-63,-68],[-25,-68],[0,-39],[25,-68],[63,-68],[87,-45],[87,-2],[0,80]];path(c,pts,color,4);path(c,[[-62,4],[-32,4],[-14,-21],[2,30],[22,-6],[36,4],[62,4]],color,3);ring(c,0,0,124,124,0,color+'33');
    }else{
      const points=[];for(let i=0;i<6;i++){const a=i*tau/6+t*.12;points.push([Math.cos(a)*104,Math.sin(a)*86]);}points.forEach((p,i)=>{path(c,[p,[0,0]],color+'66');path(c,[p,points[(i+1)%6]],color+'44');c.fillStyle=color;c.fillRect(p[0]-7,p[1]-7,14,14);});ring(c,0,0,29,29,0,color,3);label(c,'↗',0,10,28,color);
    }
    if(pulse>0){c.globalAlpha=pulse;ring(c,0,0,130+(1-pulse)*60,130+(1-pulse)*60,0,color,2);}
    c.restore();
  }
  function sky(c,camera,t,pulse){
    const bg=c.createLinearGradient(0,0,0,900);bg.addColorStop(0,'#080e20');bg.addColorStop(.65,'#18213b');bg.addColorStop(1,'#183633');c.fillStyle=bg;c.fillRect(0,0,1600,900);
    for(let band=0;band<3;band++){c.beginPath();for(let x=0;x<=1700;x+=24){const y=240+band*45+Math.sin(x*.003+t*.13+band)*72;x?c.lineTo(x,y):c.moveTo(x,y);}c.lineTo(1600,500);c.lineTo(0,480);c.closePath();c.fillStyle=['#b7a0ff08','#79e8c30a','#f5a7c908'][band];c.fill();}
    for(let i=0;i<135;i++){const x=((i*173.73-camera.x*(.04+i%3*.04))%1600+1600)%1600,y=(i*79.43)%610,alpha=.35+(Math.sin(t*.5+i)+1)*.2;c.globalAlpha=alpha;c.fillStyle=i%7?'#a5b5ce':'#d5c5ff';c.fillRect(x,y,i%11?2:4,i%11?2:4);}c.globalAlpha=1;
    c.save();c.translate(1300-camera.x*.06,214);ring(c,0,0,125,125,0,'#af9feb44');ring(c,0,0,163,38,-.35,'#af9feb55',3);const glow=c.createRadialGradient(0,0,15,0,0,124);glow.addColorStop(0,'#b6a0ee22');glow.addColorStop(1,'#5c669044');c.fillStyle=glow;c.beginPath();c.arc(0,0,120,0,tau);c.fill();c.restore();
    for(let layer=0;layer<3;layer++){c.beginPath();c.moveTo(0,900);for(let x=-100;x<1750;x+=60)c.lineTo(x,600+layer*55+Math.sin((x+camera.x*(.08+layer*.06))*.006+layer)*48);c.lineTo(1700,900);c.fillStyle=['#14223a','#152b3b','#173038'][layer];c.fill();}
  }
  function world(c,level,camera,t,player,visited,pulse,blaster){
    const floor=740;c.fillStyle='#10242d';c.fillRect(0,floor,level.width,160);path(c,[[0,floor],[level.width,floor]],'#b7a0ff',3);
    for(let x=0;x<level.width;x+=120){path(c,[[x,floor+7],[x-70,900]],'#30434d');c.fillStyle='#89b8b1';c.fillRect(x+20,floor+9,36,3);}for(const y of [776,835,897])path(c,[[0,y],[level.width,y]],'#30434d');
    for(let i=0;i<level.exhibits.length;i++){
      const e=level.exhibits[i],s={...AboutData.stations[i],color:blaster?.color(i)||AboutData.stations[i].color};if(e.x<camera.x-400||e.x>camera.x+1950)continue;
      const near=Math.max(0,1-Math.abs(e.x-player.x)/400),seen=visited.has(e.title);
      if(i<level.exhibits.length-1)path(c,[[e.x+150,570],[e.x+300,540],[e.x+500,570]],s.color+(seen?'88':'22'));
      c.save();c.translate(e.x,440);c.fillStyle=s.color+'08';c.beginPath();c.moveTo(-140,190);c.lineTo(-90,-150);c.lineTo(90,-150);c.lineTo(140,190);c.fill();ring(c,0,0,157,157,0,s.color+'22');
      for(let tick=0;tick<36;tick++){const a=tick*tau/36;c.save();c.rotate(a);c.fillStyle=s.color+(tick%3?'33':'88');c.fillRect(164,0,tick%3?5:12,2);c.restore();}
      c.translate(0,Math.sin(t*.8+i)*7);artifact(c,s.object,t+i,s.color,Math.floor(t/8)%3,pulse*near);c.restore();
      c.fillStyle='#10232c';c.fillRect(e.x-110,691,220,43);path(c,[[e.x-130,733],[e.x-110,684],[e.x+110,684],[e.x+130,733]],s.color+'99',2);ring(c,e.x,685,95,12,0,s.color+'88');
      label(c,String(i+1).padStart(2,'0')+' / '+s.title.toUpperCase(),e.x,235,22,s.color);label(c,s.tag,e.x,267,11,'#a8b8c7');label(c,seen?'CONSTELLATION DISCOVERED':near>.6?'E / EXPLORE THIS IDEA':'WALK CLOSER TO DISCOVER',e.x,642,12,seen?s.color:'#a5b6c6');
    }
    if(pulse>0){c.save();c.globalAlpha=pulse*.6;ring(c,player.x,player.y-70,60+(1-pulse)*150,60+(1-pulse)*150,0,'#d8c7ff',3);c.restore();}
  }
  window.AboutScene={sky,world,artifact};
})();
