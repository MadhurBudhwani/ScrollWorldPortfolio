// Code-native pixel machinery, using the same graphite/cyan/mint palette as the world.
window.LunarLabScene={
  draw(c,run,progress=0,time=0,reduced=false){
    const W=960,H=360,clamp=v=>Math.max(0,Math.min(1,v));
    const ink='#e5f3ed',soft='#93b0b5',cyan='#67daf5',mint='#84f5ad',gold='#f3cc70',red='#f08c98',edge='#3d636c';
    const p=clamp(progress),active=p>0,done=p===1,phase=n=>clamp(p*3-n),pulse=reduced?0:Math.floor(time*8)%3;
    function box(x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
    function text(s,x,y,size=12,color=soft,align='left'){c.font=`600 ${size}px monospace`;c.textAlign=align;c.fillStyle=color;c.fillText(s,x,y);}
    function frame(x,y,w,h,title,color=edge){
      box(x+5,y+5,w,h,'#02080d');box(x,y,w,h,color);box(x+2,y+2,w-4,h-4,'#0b1a24');box(x+2,y+2,w-4,25,'#18323d');
      for(const dx of [5,w-8])for(const dy of [5,h-8])box(x+dx,y+dy,3,3,'#89a4a8');text(title,x+14,y+18,11,ink);
      box(x+12,y+h-7,22,2,color);box(x+w-35,y+h-7,22,2,color);
    }
    function wire(points,amount=0,color=cyan){
      c.strokeStyle='#294853';c.lineWidth=4;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
      const lengths=points.slice(1).map((b,i)=>Math.hypot(b[0]-points[i][0],b[1]-points[i][1])),total=lengths.reduce((a,b)=>a+b,0);let left=clamp(amount)*total;
      c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.moveTo(...points[0]);let head=points[0];
      for(let i=0;i<lengths.length&&left>0;i++){const a=points[i],b=points[i+1],t=Math.min(1,left/lengths[i]);head=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];c.lineTo(...head);left-=lengths[i];}c.stroke();
      if(amount>0&&amount<1){box(head[0]-5,head[1]-5,10,10,color);box(head[0]-2,head[1]-2,4,4,ink);}
    }
    function lamp(x,y,on,color=mint){box(x-2,y-2,10,10,'#183c43');box(x,y,6,6,on?color:'#39535c');}
    function chip(x,y,label,on,color=cyan){
      for(let i=0;i<5;i++){box(x-8,y+6+i*10,8,3,edge);box(x+96,y+6+i*10,8,3,edge);}
      frame(x,y,96,62,label,on?color:edge);box(x+15,y+36,66,11,'#173a46');for(let i=0;i<6;i++)box(x+18+i*10,y+39,6,5,on?color:'#34525b');
    }
    function bars(x,y,width,values,amount){
      const max=Math.max(...values.map(v=>v.value)),step=width/values.length;
      for(let i=0;i<4;i++)box(x,y-i*34,width,1,'#233f48');
      values.forEach((b,i)=>{const h=Math.round(b.value/max*100*amount/3)*3,bx=x+i*step+14;box(bx,y-h,step-28,h,i%2?mint:cyan);if(h){box(bx,y-h,step-28,4,ink);text(String(b.value),bx+(step-28)/2,y-h-9,14,ink,'center');}text(b.label,bx+(step-28)/2,y+22,12,soft,'center');});
    }
    c.save();c.imageSmoothingEnabled=false;box(0,0,W,H,'#07131d');
    for(let x=0;x<W;x+=24)for(let y=0;y<H;y+=24)box(x,y,1,1,'#25404b');
    for(let i=0;i<12;i++)box(15+i*85,338,36,3,i<p*12?cyan:'#23404a');
    const labels=run.stages.map(s=>s.label);
    labels.forEach((label,i)=>{const x=24+i*310;box(x,15,296,28,phase(i)>0?'#173b42':'#10242e');lamp(x+9,24,phase(i)>0);text('0'+(i+1)+' / '+label,x+26,34,12,phase(i)>0?ink:soft);});
    if(run.kind==='search'){
      run.documents.forEach((d,i)=>{
        const y=62+i*83,selected=run.matches.includes(i)&&phase(1)>0;
        wire([[266,y+32],[305,y+32],[305,175],[359,175]],selected?phase(1)*2:0,selected?mint:cyan);
        frame(24,y,242,70,d.id+' / '+d.title,selected?mint:edge);
        for(let n=0;n<3;n++)box(40,y+34+n*8,150+(i+n)%3*22,3,selected&&n===1?mint:'#42606b');
        if(active&&!done){const scan=Math.floor((time*70+i*17)%38);box(34,y+28+scan,219,2,cyan);}
      });
      frame(359,95,235,170,'FIND RELEVANT TEXT',active?cyan:edge);
      for(let i=0;i<8;i++){box(386+i*23,130,13,4,edge);box(386+i*23,236,13,4,edge);}
      // Rack teeth and opposing scan heads move in discrete pixels, like the world's machines.
      for(let y=137;y<234;y+=8){box(369,y,5,3,edge);box(579,y,5,3,edge);}
      const beam=130+Math.floor(phase(0)*90/4)*4;box(378,beam,196,4,active?cyan:edge);
      box(365,beam-7,16,18,'#6e979e');box(574,beam-7,16,18,'#6e979e');box(369,beam-4,7,11,cyan);box(579,beam-4,7,11,cyan);
      text(phase(1)>0?run.matches.length+' MATCHES':'DOCUMENTS',476,181,20,ink,'center');
      text(phase(1)>0?(run.matches.length?'SOURCES FOUND':'NO ANSWER FOUND'):'READY TO SCAN',476,208,12,run.matches.length?mint:gold,'center');
      wire([[594,175],[640,175],[640,175],[681,175]],phase(2),run.matches.length?mint:gold);
      frame(681,95,253,170,'ANSWER WITH SOURCES',done?(run.matches.length?mint:gold):edge);
      for(let i=0;i<4;i++)box(700,135+i*18,Math.round(phase(2)*[210,175,194,131][i]),5,run.matches.length?soft:gold);
      text(done?(run.matches.length?'SOURCES '+run.sources.map(s=>s.id).join(' + '):'ASK FOR A SOURCE'):'DOCUMENTS → ANSWER',700,240,12,done?mint:soft);
    }else if(run.kind==='data'){
      wire([[253,186],[289,186]],phase(0));wire([[649,186],[691,186]],phase(1));
      frame(24,69,229,245,'SAMPLE ORDERS',phase(0)>0?cyan:edge);
      text('MONTH  REGION   COUNT',38,119,11,cyan);
      run.rows.forEach((r,i)=>{if(i%2===0)box(35,130+i*23,207,22,'#122b36');text(r.month.padEnd(7)+r.region.padEnd(9)+r.count,39,146+i*23,11,soft);});
      frame(289,69,360,245,'QUESTION → DATABASE COMMAND',phase(1)>0?cyan:edge);
      run.sql.split('\n').forEach((s,i)=>text(s.slice(0,Math.floor(s.length*phase(0))),304,127+i*27,11,i===0?cyan:ink));
      ['READ ONLY','VALID FIELDS','ALLOWED DATA'].forEach((v,i)=>{lamp(306+i*108,259,phase(1)>.25+i*.25);text(v,306+i*108,288,9,soft);});
      frame(691,69,243,245,'RESULT / ORDERS',done?mint:edge);bars(705,267,215,run.bars,phase(2));
    }else if(run.kind==='automate'){
      wire([[258,185],[333,185]],phase(0));wire([[595,185],[685,185]],phase(1));
      frame(24,82,234,207,'WHAT HAPPENED',active?cyan:edge);
      for(let i=0;i<3;i++){box(48,126+i*35,160,24,'#17313d');box(55,133+i*35,10,10,i===pulse&&active?cyan:edge);box(78,135+i*35,100-i*15,4,soft);}
      text(run.trigger.toUpperCase(),141,268,11,ink,'center');
      frame(333,82,262,207,'PREPARE THE FOLLOW-UP',phase(1)>0?cyan:edge);
      chip(413,132,'PREPARE',phase(1)>0);text(run.source.toUpperCase(),464,235,12,ink,'center');
      for(let i=0;i<5;i++)box(409+i*23,252,14,6,phase(1)>i/5?mint:edge);
      frame(685,82,249,207,'DRAFT FOR REVIEW',done?mint:edge);
      box(709,122,200,103,'#182f3a');for(let i=0;i<4;i++)box(723,139+i*18,Math.round((154-i*13)*phase(2)),4,soft);
      text(run.destination.toUpperCase(),809,249,11,ink,'center');text('DRAFT · NOT SENT',809,273,11,done?mint:soft,'center');
    }else if(run.kind==='agents'){
      frame(24,91,196,195,'YOUR TASK',active?cyan:edge);text('GOAL',47,142,12,cyan);
      text(run.mission.includes('release')?'RELEASE BRIEF':'MORNING PLAN',47,169,14,ink);
      for(let i=0;i<3;i++){lamp(48,195+i*23,phase(0)>i/3);box(65,197+i*23,125-i*20,4,soft);}
      wire([[220,178],[265,178],[265,107],[313,107]],phase(0));
      run.tools.forEach((name,i)=>{
        const x=313+i*211,y=i===1?206:79,on=phase(i)>0;
        if(i<2){const nextY=i===0?234:107;wire([[x+158,y+28],[x+185,y+28],[x+185,nextY],[x+211,nextY]],phase(i));}
        frame(x,y,158,92,'TOOL 0'+(i+1),on?cyan:edge);text(name,x+79,y+52,11,ink,'center');text(phase(i)===1?'FINISHED':on?'WORKING':'WAITING',x+79,y+76,10,phase(i)===1?mint:soft,'center');
      });
      text(done?'INFORMATION COMBINED · DRAFT READY':'PLAN → GATHER → PREPARE',612,319,13,done?mint:soft,'center');
    }else if(run.kind==='trust'){
      const names=['ACCESS CHECK','FACT CHECK','ANSWER'];
      run.gates.forEach((gate,i)=>{
        const x=49+i*309,on=phase(i)>0,isPass=gate==='PASS',col=isPass?mint:gate==='DENY'?red:gold;
        if(i<2)wire([[x+236,188],[x+309,188]],isPass?phase(i):0,mint);
        frame(x,81,236,211,names[i],on?col:edge);
        // Six overlapping shield plates lock or separate according to the gate.
        for(let n=0;n<6;n++){
          const inset=n*7,gap=isPass?Math.round(phase(i)*16):0,width=54-inset;
          box(x+64+inset-gap,125+n*19,width,16,on?col:edge);box(x+118+gap,125+n*19,width,16,on?col:edge);
          box(x+70+inset-gap,128+n*19,Math.max(2,width-7),9,'#17313a');box(x+120+gap,128+n*19,Math.max(2,width-7),9,'#17313a');
        }
        text(on?gate:'WAITING',x+118,267,15,on?col:soft,'center');
      });
    }else{
      wire([[237,174],[302,174]],phase(0));wire([[503,174],[550,174],[550,98],[715,98]],run.hit?phase(1):0,mint);
      wire([[503,174],[550,174],[550,242],[715,242]],!run.hit?phase(1):0,run.timeout?gold:cyan);
      frame(24,102,213,172,'REQUEST',active?cyan:edge);text('TEAM / SAMPLE',44,156,13,ink);text('ORDER TOTAL',44,185,13,ink);text('SAME PERMISSIONS',44,245,10,soft);
      frame(302,102,201,172,'SAVED ANSWERS',phase(0)>0?cyan:edge);
      for(let i=0;i<4;i++){box(326,144+i*22,151,14,'#203c46');box(333,149+i*22,7,4,(run.hit&&active)?mint:edge);box(352,149+i*22,108,3,edge);}
      text(active?(run.hit?'FOUND · REUSE':'GET A FRESH ANSWER'):'READY TO CHECK',402,259,10,run.hit?mint:soft,'center');
      frame(715,62,219,83,'REUSE AN ANSWER',run.hit&&phase(1)>0?mint:edge);text('NO NEW SEARCH NEEDED',731,117,11,run.hit?mint:soft);
      frame(715,186,219,124,'FIND A NEW ANSWER',!run.hit&&phase(1)>0?cyan:edge);
      text(run.timeout?'ATTEMPT 1: TOO SLOW':'SEARCH + ANSWER',731,236,11,run.timeout?gold:soft);
      if(run.timeout)text(phase(1)>.5?'ATTEMPT 2: OK':'ONE MORE TRY ALLOWED',731,266,11,phase(1)>.5?mint:soft);
      text(done?run.duration+' ms / SIMULATED':'READY TO SHOW THE STEPS',402,309,13,done?mint:soft,'center');
    }
    c.restore();
  }
};
