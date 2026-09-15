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
// Source rectangles retain the generated transparent artwork without resampling it.
const companionAtlas=new Image();
companionAtlas.src='./assets/mechanical-companion-pixel-v2.png';
const companionSprites=[
  [12,116,268,320],[294,122,339,315],[598,165,322,271],[911,160,331,276],
  [26,592,271,211],[347,493,261,310],[677,487,207,326],[968,486,248,323],
  [24,844,294,344],[347,852,275,337],[641,862,272,327],[948,867,288,320]
];
// Long tails and muzzles overlap adjacent bounding rectangles in the atlas.
// Exclude only those neighbouring fragments while drawing each intact sprite.
const companionGutters={1:[[598,319,35,39]],2:[[598,165,35,62],[911,335,9,19]],3:[[911,236,10,19]]};
