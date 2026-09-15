// One mechanical companion, with shared chassis plates across every transformation.
const companionForms={
  'BACKEND':['server','BACKEND'],'.NET CORE':['reactor','.NET'], 'EF CORE':['graph','ORM'],
  'SQL SERVER':['database','SQL'],'RLS':['shield','RLS'],'DATABASE ENCRYPTION':['lock','DB AES'],
  'EF INTERCEPTORS':['gateway','EF HOOK'],'SESSION INTERCEPTORS':['identity','SESSION'],
  'REDIS':['cache','REDIS'],'BACKGROUND JOBS':['gears','JOBS'],'CI/CD':['pipeline','CI/CD'],'DESKTOP APPS':['desktop','DESKTOP'],
  'APP SERVICE':['server','HOST'],'FUNCTIONS':['bolt','FUNCTION'],'AZURE SQL':['database','AZ SQL'],
  'BLOB STORAGE':['bucket','BLOB'],'SIGNALR':['signal','LIVE'],'API MANAGEMENT':['gateway','API'],
  'ENTRA ID':['identity','ENTRA'],'MICROSOFT GRAPH':['graph','GRAPH'],'COGNITIVE SERVICES':['brain','AI'],
  'DATA ACCESS CONTROL':['shield','ACCESS'],'ROLE PERMISSIONS':['identity','ROLES'],'MULTI-TENANT':['server','TENANTS'],
  'AUDIT TRAIL':['audit','AUDIT'],'AES ENCRYPTION':['lock','AES'],
  'EXACT':['target','EXACT'],'FUZZY':['signal','FUZZY'],'SEMANTIC':['brain','SEMANTIC'],'VECTOR':['graph','VECTOR'],
  'AUTH':['identity','AUTH'],'INTENT':['brain','INTENT'],'ROUTER':['router','ROUTER'],'SCHEMA RAG':['database','RAG'],
  'LLM':['brain','LLM'],'VALIDATE':['shield','CHECK'],'CORRECT':['gears','CORRECT'],'RLS EXECUTE':['shield','EXECUTE'],
  'VISUALIZE':['desktop','VISUALIZE'],'RESPOND':['signal','ANSWER'],
  'DEV':['gears','DEV'],'REVIEW':['audit','REVIEW'],'QA':['shield','QA'],'UAT':['target','UAT'],'PRODUCTION':['server','PROD'],
  'WRITING':['book','WRITING'],'SINGING':['mic','SINGING'],'GAMING':['controller','GAMING'],
  'DRAWING':['sketch','DRAWING'],'GRAPHIC DESIGN':['tablet','DESIGN'],'VIDEO EDITING':['film','EDIT'],
  'Work Experience':['audit','WORK'],'GenAI Projects':['brain','GEN AI'],'Hobbies':['book','HOBBIES']
};
function companionFocus(pose){
  const s=scenes[state.scene],t=shotTime(state.directedLocal);let n=0;
  if(state.scene===0)return {label:null,morph:0};
  if(state.scene===8){const near=nearestPortal();return {label:near?.querySelector('strong').textContent||null,morph:near?1:0};}
  if(state.scene===1){const g=trainGeometry(state.directedLocal);n=(pose.x-g.x)/g.gap;if(n<-.5)return {label:'BACKEND',morph:1};}
  else if(state.scene===2)n=t*(s.skills.length-1);
  else if(state.scene===3)n=t*(s.skills.length-1);
  else if(state.scene===4){
    const objects=spiralObjects(s,t);
    const nearest=objects.reduce((best,o)=>Math.hypot(o.x-pose.x,o.y-26*o.scale-pose.feet)<Math.hypot(best.x-pose.x,best.y-26*best.scale-pose.feet)?o:best);
    return {label:s.skills[nearest.i],morph:ease(clamp(state.directedLocal/.20))};
  }
  else if(state.scene===5){
    const stages=t<.15?['AUTH','INTENT']:t<.25?['ROUTER']:t<.65?['SCHEMA RAG','LLM','VALIDATE','CORRECT','RLS EXECUTE']:t<.8?['VISUALIZE']:['RESPOND'];
    const local=t<.15?t/.15:t<.25?(t-.15)/.1:t<.65?(t-.25)/.4:t<.8?(t-.65)/.15:(t-.8)/.2;
    n=Math.min(stages.length-1,Math.floor(local*stages.length));return {label:stages[n],morph:ease(Math.min(1,(local*stages.length%1)*6))};
  }
  else if(state.scene===6)n=clamp(t/.9)*(s.skills.length-1);
  else if(state.scene===7){n=Math.min(5,Math.floor(t*6));return {label:s.skills[n],morph:ease(clamp((t*6-n)*6))};}
  const i=clamp(Math.round(n),0,s.skills.length-1);
  return {label:s.skills[i],morph:ease(clamp((.5-Math.abs(n-i))/.25))};
}
function mechRect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
function mechLine(c,points,color,width=3){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function drawHobbyObject(c,index,time){
  const ink='#11282f',metal='#a9c6c8',cream='#e8dcc3',pink='#f58caf',cyan='#67daf5';
  const r=(x,y,w,h,col)=>mechRect(c,x,y,w,h,col);
  if(index===0||index===3){
    r(-43,-24,86,53,pink);r(-39,-27,36,51,cream);r(3,-27,36,51,cream);r(-3,-25,6,57,'#82717a');
    for(let j=0;j<5;j++){r(-33,-17+j*7,23,2,'#aa9c92');r(10,-17+j*7,23,2,'#aa9c92');}
    if(index===3){c.save();c.translate(22,-8);c.rotate(-.6);r(-3,-30,7,52,'#f3cc70');r(-3,22,7,6,ink);c.restore();}
  }else if(index===1){
    r(-11,-31,22,27,metal);r(-7,-35,14,8,metal);for(let y=-28;y<-7;y+=5)r(-8,y,16,2,ink);
    r(-5,-4,10,29,pink);r(-20,27,40,4,metal);r(-2,19,4,10,metal);
    for(let j=0;j<3;j++){const y=-20-((time*9+j*13)%35);r(24+j*9,y,3,14,cyan);r(18+j*9,y+12,9,5,cyan);}
  }else if(index===2){
    r(-39,-17,78,36,metal);r(-45,-7,16,36,metal);r(29,-7,16,36,metal);r(-24,-9,6,22,ink);r(-32,-1,22,6,ink);
    r(17,-9,7,7,pink);r(28,1,7,7,'#f3cc70');r(-5,-2,10,6,ink);
  }else if(index===4){
    r(-43,-28,86,57,metal);r(-38,-23,76,47,ink);r(-25,-13,37,25,'#579784');r(-13,-5,36,24,cyan);
    for(let i=0;i<4;i++)r(-32+i*16,30,11,6,['#84f5ad',pink,'#f3cc70',cyan][i]);
    c.save();c.rotate(-.6);r(22,-32,4,49,'#e0e9dd');c.restore();
  }else{
    r(-42,-29,84,58,metal);r(-36,-24,72,24,ink);
    for(let i=0;i<3;i++){r(-32+i*23,-20,18,14,[cyan,pink,'#f3cc70'][i]);r(-33,-1+i*9,64-i*7,5,[pink,'#84f5ad',cyan][i]);}
    r(-30+(time*8)%58,-3,2,30,'#f8f4e3');
  }
}
function drawMechSymbol(c,type,label,time){
  const r=(x,y,w,h,col='#67daf5')=>mechRect(c,x,y,w,h,col),ink='#142c31',white='#d8e9df',gold='#f3cc70';
  if(['book','mic','controller','sketch','tablet','film'].includes(type)){drawHobbyObject(c,['book','mic','controller','sketch','tablet','film'].indexOf(type),time);return;}
  if(type==='database'||type==='cache'||type==='bucket'){
    for(let i=0;i<(type==='bucket'?1:3);i++){r(-27,-28+i*19,54,type==='bucket'?52:15);r(-21,-31+i*19,42,5,white);r(-20,-21+i*19,32,3,ink);}
    if(type==='cache')mechLine(c,[[9,-33],[-4,-11],[13,-11],[0,12]],gold,5);
  }else if(type==='shield'||type==='lock'||type==='identity'){
    if(type==='lock'){r(-18,-34,36,25,white);r(-11,-27,22,22,ink);r(-30,-10,60,43);r(-4,0,8,19,ink);}
    else if(type==='identity'){r(-30,-30,60,64,white);r(-12,-18,24,20,ink);r(-20,8,40,7,ink);r(-18,21,36,4,'#4f9491');}
    else{mechLine(c,[[-30,-28],[30,-28],[30,3],[18,20],[0,33],[-18,20],[-30,3],[-30,-28]],white,6);mechLine(c,[[-16,-2],[-4,11],[19,-15]],'#84f5ad',7);}
  }else if(type==='server'||type==='desktop'||type==='audit'){
    r(-35,-31,70,59,white);r(-29,-25,58,45,ink);
    if(type==='server')for(let i=0;i<3;i++){r(-24,-20+i*13,48,9,'#427776');r(13,-18+i*13,6,5,gold);}
    else if(type==='audit')for(let i=0;i<3;i++){r(-22,-17+i*12,7,7,'#84f5ad');r(-9,-15+i*12,29,3,white);}
    else{r(-21,-15,31,4);r(-21,-5,42,4,'#84f5ad');r(-21,5,22,4,gold);r(-4,28,8,9,white);r(-21,37,42,4,white);}
  }else if(type==='bolt'){mechLine(c,[[11,-35],[-18,0],[3,0],[-9,34],[23,-7],[3,-7],[11,-35]],gold,7);}
  else if(type==='signal'){
    for(let i=0;i<3;i++){const w=12+i*13;mechLine(c,[[-w,6-i*13],[-w,-3-i*13],[-w+8,-10-i*13],[w-8,-10-i*13],[w,-3-i*13],[w,6-i*13]],i===Math.floor(time)%3?gold:'#67daf5',4);}
    r(-5,17,10,10,white);
  }else if(type==='target'){
    for(let i=0;i<3;i++){c.strokeStyle=i%2?white:'#67daf5';c.lineWidth=3;c.strokeRect(-30+i*10,-30+i*10,60-i*20,60-i*20);}r(-4,-4,8,8,gold);
  }else if(type==='gears'||type==='reactor'){
    for(let i=0;i<8;i++){c.save();c.rotate(i*TAU/8+time*.2);r(20,-7,17,14,white);c.restore();}
    r(-23,-23,46,46,'#448681');r(-13,-13,26,26,ink);r(-7,-7,14,14,type==='reactor'?'#84f5ad':gold);
    if(type==='reactor'){c.save();c.font='bold 13px monospace';c.textAlign='center';c.fillStyle=white;c.fillText('.NET',0,49);c.restore();}
  }else{
    const nodes=type==='pipeline'?5:type==='gateway'?3:6;
    for(let i=0;i<nodes;i++){
      const a=i/nodes*TAU,x=type==='pipeline'?(i-2)*16:Math.cos(a)*29,y=type==='pipeline'?(i%2?8:-8):Math.sin(a)*29;
      mechLine(c,[[0,0],[x,y]],'#5f9c97',3);r(x-6,y-6,12,12,i===Math.floor(time)%nodes?gold:white);
    }
    r(-11,-11,22,22,type==='brain'?'#f58caf':'#84f5ad');r(-5,-5,10,10,ink);
  }
}
function drawCompanion(c,pose,transition,dt){
  const focus=companionFocus(pose),form=companionForms[focus.label]||['reactor',focus.label||''];
  state.companionSkill=focus.label||'MECHANICAL DOG';
  const morph=reducedMotion.matches?(focus.label?1:0):focus.morph;
  const mobile=state.w<700,scale=mobile?.58:.80;
  let x=clamp(pose.x+(pose.x>state.w*.70?-90:90),48,state.w-48),y=pose.feet-30*scale;
  if(state.scene===7){x=clamp(pose.x+90,48,state.w-48);y=state.h*.91-28;}
  if(state.scene===5)y=Math.min(y,state.h-47);
  if(transition.mode)y=state.h-82-30*scale;
  const alpha=transition.mode==='drop'?1-transition.progress:transition.mode==='emerge'?transition.progress:state.exit?.phase==='descend'?1-clamp(state.exit.elapsed/.45):1;
  c.save();c.globalAlpha=alpha;c.translate(x,y);c.scale(scale,scale);
  const time=reducedMotion.matches?0:state.hubLive?state.time/1000:state.directedLocal*20;
  const gait=pose.mode==='walk'?Math.sin(time*12)*8:0;
  const dog=[[-26,-15,45,23], [16,-31,25,26], [15,-44,8,17], [33,-40,7,13],[-22,8,9,22], [7,8,9,22],[-40,-15,18,6], [33,-19,17,12]];
  const chassis=[[-30,-30,60,60],[30,-22,9,43],[-30,-40,15,9],[15,-40,15,9],[-28,32,17,8],[11,32,17,8],[-41,-20,9,40],[30,22,12,9]];
  dog.forEach((d,i)=>{
    const target=chassis[i];c.save();
    const dx=mix(d[0]+(i===4?gait:i===5?-gait:0),target[0],morph),dy=mix(d[1],target[1],morph),w=mix(d[2],target[2],morph),h=mix(d[3],target[3],morph);
    mechRect(c,dx-2,dy-2,w+4,h+4,'#13282f');mechRect(c,dx,dy,w,h,i===2||i===3?'#f3cc70':'#8ba8ad');mechRect(c,dx+2,dy+2,Math.max(2,w-4),3,'#d3e1d8');c.restore();
  });
  c.globalAlpha=alpha*(1-morph);mechRect(c,31,-25,7,!reducedMotion.matches&&state.time%5100>4920?1:5,'#67daf5');mechRect(c,-10,-7,13,9,'#67daf5');
  c.globalAlpha=alpha*morph;
  drawMechSymbol(c,form[0],form[1],time);
  c.globalAlpha=alpha;mechRect(c,-3,-3,6,6,'#67daf5');
  if(focus.label&&morph>.6){diagramLabel(c,form[1],0,state.scene===5?-59:64,140,'#c5e6df',11);}
  c.restore();
}
