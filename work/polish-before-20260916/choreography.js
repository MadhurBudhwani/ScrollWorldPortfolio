// Every shot shares its geometry with the avatar's contact points.
const shotTime = p => clamp((p - .10) / .80);
function trainGeometry(p) {
  const scale = state.w < 700 ? .64 : Math.min(1.05, state.w / 1400, state.h / 1000);
  const gap = 400 * scale;
  const travel = clamp((p - .16) / .69) * (scenes[1].skills.length - 1);
  const start=state.w<700?state.w*.25+gap-18:state.w*.52+gap*.15;
  return {scale, gap, x:start-travel*gap, y:state.h*.84};
}
function spiralObjects(s,p) {
  const mobile=state.w<1000, cx=state.w*(mobile?.52:.61), cy=state.h*(mobile?.79:.76);
  const radius=mobile?state.w*.28:Math.min(state.w*.28,360), turn=p*TAU*1.1, rush=ease((p-.78)/.22);
  return s.textures.map((tex,i)=>{
    const t=i/Math.max(1,s.skills.length-1), a=t*TAU*.86-turn, depth=(Math.sin(a)+1)/2;
    const r=radius*(.62+.38*t), focus=i===s.skills.length-1;
    const x=mix(cx+Math.cos(a)*r,cx,focus?rush:0), y=mix(cy+Math.sin(a)*r*.40,cy,focus?rush:0);
    const scale=((mobile?.44:.65)+depth*(mobile?.20:.32))*(1+(focus?rush*5:rush*2));
    return {tex,i,x,y,scale,depth:focus&&rush>.1?10:depth,alpha:focus?1:1-rush,angle:(1-rush)*Math.cos(a)*.08};
  });
}
function engine(g,p) {
  ctx.save();ctx.translate(g.x-g.gap,g.y);ctx.scale(g.scale,g.scale);
  const rect=(x,y,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(x,y,w,h);};
  rect(-180,-92,330,188,'#173b40');rect(-158,-80,286,152,'#67daf5');
  rect(36,-124,108,86,'#84f5ad');rect(56,-109,60,50,'#17343b');
  rect(-142,-132,32,54,'#f3cc70');rect(-152,-142,52,12,'#f1f8f5');
  rect(-182,28,30,42,'#f3cc70');rect(-190,76,348,16,'#37676a');
  for(let i=0;i<3;i++){
    const x=-116+i*112;
    rect(x-30,78,60,60,'#102527');rect(x-18,90,36,36,'#b6d7cf');
    ctx.save();ctx.translate(x,108);ctx.rotate(-p*40);rect(-22,-4,44,8,'#327783');ctx.restore();
  }
  pixelText(ctx,'BACKEND',-100,-30,4,'#10323b');
  for(let i=0;i<3;i++){
    const t=(p*3+i/3)%1;ctx.globalAlpha=(1-t)*.3;
    rect(-132+t*85,-155-t*110,18+t*22,18+t*22,'#bdd8d5');
  }
  ctx.restore();
}
const planetTextures = new Map();
function planetTexture(kind) {
  if(planetTextures.has(kind))return planetTextures.get(kind);
  const c=document.createElement('canvas');c.width=128;c.height=128;
  const g=c.getContext('2d');
  const palettes={jupiter:['#b9a086','#897969','#d8bca0','#695b55'],mars:['#aa6554','#7b433b','#c68666','#623c39'],sun:['#f4c679','#e8a859','#f8dba1','#ca8b48'],moon:['#b4c3cc','#80939e','#d2dbe0','#657783'],earth:['#507f96','#39736f','#79a098','#35515f']};
  const pal=palettes[kind]||palettes.moon;
  for(let y=0;y<128;y+=3)for(let x=0;x<128;x+=3){
    const dx=(x-64)/60,dy=(y-64)/60;
    if(dx*dx+dy*dy>1)continue;
    let tone=kind==='jupiter'?Math.floor((y+Math.sin(x*.07)*5)/11)%4:Math.floor((Math.sin(x*.09)*Math.cos(y*.08)+1)*1.7);
    g.fillStyle=pal[tone];g.fillRect(x,y,3,3);
    g.fillStyle=`rgba(3,9,15,${Math.max(0,dx*.6+.15)})`;g.fillRect(x,y,3,3);
  }
  if(kind==='moon')for(const [x,y,r]of[[38,37,10],[75,85,13],[86,39,6],[38,83,6]]){g.fillStyle='#657783';g.fillRect(x,y,r,r);g.fillStyle='#96a7b2';g.fillRect(x+3,y+3,r-4,r-4);}
  planetTextures.set(kind,c);return c;
}
function celestialLayer(position) {
  ctx.save();
  for(let i=0;i<17;i++){
    const x=(.06+((i*43)%89)/100)*state.w, y=(.09+((i*29)%68)/100)*state.h;
    const a=.24+.48*Math.pow(.5+.5*Math.sin(position*9+i*2.4),8);
    ctx.globalAlpha=a;ctx.fillStyle=i%3?'#c5dfed':'#f1ddb3';
    const size=i%4===0?3:2;
    ctx.fillRect(x-size,y-size,size*2,size*2);
    if(i%4===0){ctx.fillRect(x-7,y-1,14,2);ctx.fillRect(x-1,y-7,2,14);}
  }
  const itinerary=[['earth',.84,.27,180],['sun',.84,.20,155],['jupiter',.88,.25,235],['mars',.83,.30,160],['jupiter',.13,.49,155],['earth',.86,.20,175],['mars',.85,.25,155],['sun',.83,.22,145],['moon',.79,.27,190]];
  itinerary.forEach(([kind,x,y,size],i)=>{
    const opacity=.25*clamp(1-Math.abs(position-(i+.45))/.85);
    if(opacity<=0)return;
    const d=size*(state.w<700?.65:1);
    ctx.globalAlpha=opacity;
    ctx.drawImage(planetTexture(kind),state.w*x-d/2+(position-i-.5)*24,state.h*y-d/2,d,d);
  });
  ctx.restore();
}
function circuitPoint(t) {
  const nodes=[[.25,.79],[.44,.64],[.65,.79],[.86,.64]];
  const scaled=clamp(t)*3,i=Math.min(2,Math.floor(scaled)),f=scaled-i;
  return {x:mix(nodes[i][0],nodes[i+1][0],f)*state.w,y:mix(nodes[i][1],nodes[i+1][1],f)*state.h};
}
function circuit(s,p) {
  const mobile=state.w<700, radius=mobile?25:43;
  const nodes=[0,1/3,2/3,1].map(circuitPoint);
  ctx.save();
  nodes.forEach((node,i)=>{
    if(i){const a=nodes[i-1];line([[a.x,a.y],[node.x,a.y],[node.x,node.y]],'#305856',5);}
    const reveal=ease((p-i*.12)/.12);ctx.globalAlpha=reveal;
    for(let d=0;d<3;d++){ctx.fillStyle=d===2?colors[i%4]:'#173b3b';ctx.fillRect(node.x-radius+d*5,node.y-radius-d*5,radius*2,radius*2);}
    ctx.fillStyle='#102c32';ctx.fillRect(node.x-radius*.5,node.y-radius*.5,radius,radius);
    for(let pin=0;pin<4;pin++){ctx.fillStyle=colors[i%4];ctx.fillRect(node.x-radius-8,node.y-radius+pin*radius*.55,8,4);}
    const label=['RAG','MODEL','CHECK','RESULT'][i];const u=mobile?1.5:3;
    pixelText(ctx,label,node.x-(label.length*6-1)*u/2,node.y+radius+16,u,'#d5eee5');
  });
  ctx.globalAlpha=ease((p-.35)/.12)*.7;
  const a=nodes[2],b=nodes[1];
  const loop=[[a.x,a.y],[a.x,state.h*.90],[b.x,state.h*.90],[b.x,b.y]];
  line(loop,'#f58caf',3);
  const flow=clamp((p-.15)/.75);
  let packet;
  if(flow>.42&&flow<.70){const t=(flow-.42)/.28;packet={x:mix(a.x,b.x,t),y:state.h*.90-Math.sin(t*Math.PI)*16};}
  else packet=circuitPoint(flow<=.42?flow/.42*.66:.33+(flow-.7)/.3*.67);
  ctx.globalAlpha=1;ctx.fillStyle='#f3cc70';ctx.fillRect(packet.x-8,packet.y-8,16,16);
  ctx.strokeStyle='#f3cc70';ctx.lineWidth=2;ctx.strokeRect(packet.x-14,packet.y-14,28,28);
  ctx.restore();
}
function bridgePoint(t,p) {
  const turn=ease((p-.70)/.30);
  return {x:mix(state.w*(.12+t*.76),state.w*(.33+t*.36),turn),y:mix(state.h*.81,state.h*(.91-t*.30),turn),scale:mix(1,1.12-t*.45,turn)};
}
function crossing(s,p) {
  const count=20, built=clamp(p/.70)*count;
  for(let i=0;i<count;i++){
    const at=bridgePoint(i/(count-1),p), reveal=ease(built-i);
    if(!reveal)continue;
    const w=state.w*.76/(count-1)*at.scale+3,h=20*at.scale;
    const rise=(1-reveal)*state.h*.27;
    ctx.fillStyle=i%5===0?'#f3cc70':'#457b78';ctx.fillRect(at.x-w/2,at.y+rise,w,h);
    ctx.fillStyle='#b7dac8';ctx.fillRect(at.x-w/2,at.y+rise,w,4);
    ctx.fillStyle='#1d4043';ctx.fillRect(at.x-w/2,at.y+h+rise,w,h*.65);
    if(i%5===0||i===count-1){
      const label=['DEV','REVIEW','QA','UAT','PROD'][i===19?4:i/5],u=state.w<700?1.5:2.5;
      ctx.fillStyle='#f3cc70';ctx.fillRect(at.x-2,at.y+20,4,30);
      pixelText(ctx,label,at.x-(label.length*6-1)*u/2,at.y+59,u,'#e9e3c3');
    }
  }
  if(p>.1&&p<.8)for(let j=0;j<6;j++){
    const t=(p*4+j/6)%1,at=bridgePoint(clamp((built-1)/count),p);
    ctx.globalAlpha=1-t;ctx.fillStyle=colors[j%3];ctx.fillRect(at.x+(j-3)*18*(1-t),at.y+110*(1-t),8,8);
  }
  ctx.globalAlpha=1;
}
function bookGeometry(p){return {x:state.w*(state.w<700?.55:.64),y:state.h*.79,w:Math.min(state.w*.7,700),open:ease((p-.10)/.25)};}
function storybook(s,p) {
  const b=bookGeometry(p),half=b.w/2, height=state.h*.22;
  ctx.save();ctx.translate(b.x,b.y);
  for(const side of [-1,1]){
    ctx.save();ctx.scale(side*b.open,1);
    ctx.fillStyle='#915369';ctx.fillRect(0,-height*.22,half+8,height*.64+12);
    ctx.fillStyle='#e4d7b5';ctx.fillRect(0,-height*.22,half,height*.64);
    for(let i=0;i<6;i++){ctx.fillStyle='#bcae93';ctx.fillRect(18,height*.18+i*6,half-34,2);}
    ctx.restore();
  }
  ctx.fillStyle='#725669';ctx.fillRect(-3,-height*.22,6,height*.66);
  for(let i=0;i<7;i++){
    const rise=ease((p-.27-i*.04)/.18),x=(i-3)*b.w*.105,w=b.w*.075,h=height*(.5+(i%3)*.22)*rise;
    ctx.fillStyle=['#5c9f9b','#bd728e','#929ebe'][i%3];ctx.fillRect(x,-h,w,h);
    ctx.fillStyle='#d8dcbf';for(let n=0;n<3;n++)ctx.fillRect(x+8,-h+12+n*19,5,6);
    ctx.fillStyle='#334e5e';ctx.fillRect(x-4,-h-6,w+8,6);
  }
  const u=state.w<700?1.5:3;
  pixelText(ctx,'PLACEHOLDER TEDDY',-(16*6-1)*u/2,height*.58,u,'#f58caf');
  for(let i=0;i<8;i++){
    const rise=ease((p-.44-i*.025)/.22),x=(i-3.5)*b.w*.1,y=-height*(.8+Math.sin(i*2)*.35)*rise;
    ctx.globalAlpha=rise;pixelText(ctx,['A','B','C','D'][i%4],x,y,2,colors[i%4]);
  }
  ctx.globalAlpha=1;
  const flip=ease((p-.82)/.18);
  if(flip>0){
    ctx.fillStyle='#f1e4c3';ctx.beginPath();ctx.moveTo(0,-height*.22);ctx.lineTo(half*Math.cos(flip*Math.PI),-height*.22-height*Math.sin(flip*Math.PI));ctx.lineTo(half*Math.cos(flip*Math.PI),height*.4-height*Math.sin(flip*Math.PI));ctx.lineTo(0,height*.4);ctx.fill();
  }
  ctx.restore();
}
function rope(s,p,pose) {
  const x=pose.x-7,top=state.h*.48;
  const low=Math.floor(p*10)%2===1;
  const handY=pose.feet-(low?139:243)*pose.scale;
  ctx.save();ctx.strokeStyle='#bdb49b';ctx.lineWidth=3;
  const reelX=state.w*(state.w<1000?.52:.72);
  line([[x,handY+25],[x,top],[reelX,top],[reelX,top+35]],'#bdb49b',3);
  ctx.strokeStyle='#67daf5';ctx.lineWidth=4;ctx.strokeRect(x-10,top-10,20,20);
  for(let y=top+14-(p*260)%18;y<handY+25;y+=18){ctx.fillStyle='#756f64';ctx.fillRect(x-3,y,6,3);}
  ctx.restore();
}
function scenePose(index,p) {
  const baseScale=state.w<700?.67:.82;
  const idle={x:state.w*.14,feet:state.h-82,scale:baseScale,mode:'idle',direction:1,phase:p*5};
  if(index===0)return {...idle,scale:state.w<700?.56:.64};
  if(index===1){
    const g=trainGeometry(p),roof=g.y-100*g.scale;
    const landX=trainGeometry(0).x-g.gap+18;
    if(p<.15){const t=ease(p/.15);return {...idle,x:mix(idle.x,landX,t),feet:mix(idle.feet,roof-24*g.scale,t)-Math.sin(t*Math.PI)*50,mode:'jump'};}
    if(p>.85){const t=ease((p-.85)/.15);return {...idle,x:mix(state.w*.70,idle.x,t),feet:mix(roof,idle.feet,t)-Math.sin(t*Math.PI)*35,mode:t<.75?'walk':'jump',direction:-1};}
    const x=mix(landX,state.w*.70,(p-.15)/.70);
    const n=(x-g.x)/g.gap, gap=Math.abs(n-Math.round(n));
    const hop=Math.max(0,(gap-.35)/.15);
    const onEngine=n<-.5;
    return {...idle,x,feet:roof-(onEngine?24*g.scale:0)-Math.sin(hop*Math.PI/2)*25,mode:'walk',phase:p*12};
  }
  if(index===2)return {...idle,mode:'pull',phase:shotTime(p)*5};
  if(index===4){
    const target=spiralObjects(scenes[4],shotTime(p)).at(-1);
    const t=ease(p/.20),feet=target.y-26*target.scale;
    return {...idle,x:mix(idle.x,target.x,t),feet:mix(idle.feet,feet,t)-Math.sin(t*Math.PI)*80,scale:mix(baseScale,baseScale*Math.min(2.2,target.scale/.7),t),mode:p<.2?'jump':'idle'};
  }
  if(index===5){const at=circuitPoint(clamp((p-.1)/.85));return {...idle,x:mix(idle.x,at.x,ease(p/.15)),mode:p>.15&&p<.9?'walk':'read',phase:p*8};}
  if(index===6){const at=bridgePoint(clamp((shotTime(p)-.10)/.78),shotTime(p));return {...idle,x:at.x,feet:at.y,scale:baseScale*at.scale,mode:p<.08?'idle':'walk',phase:p*10};}
  if(index===7){const b=bookGeometry(shotTime(p)),t=ease((p-.36)/.36);return {...idle,x:mix(idle.x,b.x+b.w*.22,t),feet:mix(idle.feet,b.y+b.w*.01,t)-Math.sin(t*Math.PI)*55,mode:p<.34?'read':p<.7?'walk':'idle',phase:p*8};}
  return idle;
}
