(() => {
  class LunarLab {
    constructor(dialog){
      this.dialog=dialog;this.root=document.querySelector('#lunarLab');this.canvas=document.querySelector('#labScene');this.context=this.canvas.getContext('2d');
      this.reduced=matchMedia('(prefers-reduced-motion: reduce)');this.sessions={};this.raf=null;this.active=false;
      const $=s=>document.querySelector(s);this.$=$;
      $('#labRun').addEventListener('click',()=>this.start());
      $('#labReplay').addEventListener('click',()=>this.start(true));
      $('#labSkip').addEventListener('click',()=>this.finish());
      dialog.addEventListener('close',()=>this.close());
      this.deck=new LunarDeck(this);
    }
    open(id){
      this.close();this.id=id;this.definition=LunarLabData.definitions[id];this.session=this.sessions[id]??={cached:false};this.selection=this.definition.groups.map(()=>0);this.active=true;
      this.root.hidden=false;this.dialog.classList.add('lab-mode');this.$('#dialogDemo').hidden=true;
      this.$('#dialogTitle').textContent=this.definition.title;
      this.$('#dialogBody').textContent=this.definition.purpose;this.$('#dialogTag').textContent='LUNAR LAB / STATION '+this.definition.number;
      this.$('#labSkills').textContent=this.definition.skill;
      this.$('#labBuildText').textContent=this.definition.build;this.$('#labPrinciple').textContent=this.definition.principle;this.$('#labBuild').open=false;
      const choices=this.$('#labChoices');choices.replaceChildren();this.choiceButtons=[];
      this.definition.groups.forEach((group,g)=>{
        const field=document.createElement('fieldset'),legend=document.createElement('legend');legend.textContent=group.label;field.append(legend);
        group.options.forEach((option,i)=>{const b=document.createElement('button');b.type='button';b.textContent=option;b.setAttribute('aria-pressed',String(i===0));b.addEventListener('click',()=>this.choose(g,i));field.append(b);this.choiceButtons.push({button:b,group:g,index:i});});choices.append(field);
      });
      this.prepare();this.deck.open();this.deck.buttons.brief.focus();
    }
    stop(){if(this.raf!==null)cancelAnimationFrame(this.raf);this.raf=null;this.running=false;}
    close(){this.stop();this.active=false;this.root.hidden=true;this.dialog.classList.remove('lab-mode');}
    choose(group,index){
      if(!this.active)return;this.selection[group]=index;
      for(const choice of this.choiceButtons)choice.button.setAttribute('aria-pressed',String(this.selection[choice.group]===choice.index));
      this.prepare();
    }
    prepare(){
      this.stop();this.progress=0;this.elapsed=0;this.run=LunarLabData.evaluate(this.id,this.selection,this.session);
      this.$('#labRun').textContent=this.definition.action;this.$('#labReplay').disabled=true;this.$('#labSkip').disabled=true;
      this.$('#labResult').hidden=true;this.$('#labResult').setAttribute('aria-busy','false');this.$('#labStatus').textContent='Ready. Choose an input, then '+this.definition.action.toLowerCase()+'.';
      this.$('#labStageDetail').textContent='Choose an option, then click “'+this.definition.action+'” to watch what happens.';this.makeSteps();this.paint();
      this.deck.clear();
    }
    makeSteps(){
      this.steps=[];const list=this.$('#labStages');list.replaceChildren();
      for(const s of this.run.stages){const li=document.createElement('li');li.textContent=s.label;list.append(li);this.steps.push(li);}this.updateSteps();
    }
    updateSteps(){
      const current=Math.min(2,Math.floor(this.progress*3));
      this.steps.forEach((s,i)=>{s.classList.toggle('is-active',this.progress>0&&current===i&&this.progress<1);s.classList.toggle('is-complete',this.progress===1||i<current);s.setAttribute('aria-current',this.progress>0&&i===current?'step':'false');});
      if(this.running)this.$('#labStageDetail').textContent=this.run.stages[current].detail;
    }
    start(replay=false){
      if(!this.active)return;this.stop();if(!replay)this.run=LunarLabData.evaluate(this.id,this.selection,this.session);
      this.running=true;this.progress=0;this.elapsed=0;this.lastTime=null;this.makeSteps();
      this.deck.show('experiment');
      this.$('#labRun').textContent='Restart experiment';this.$('#labSkip').disabled=false;this.$('#labReplay').disabled=true;
      this.$('#labResult').hidden=true;this.$('#labResult').setAttribute('aria-busy','true');this.$('#labStatus').textContent='Experiment running. You can skip directly to the result.';
      if(this.reduced.matches){this.finish();return;}
      const tick=time=>{
        if(!this.active||!this.running)return;
        if(this.lastTime!==null&&!document.hidden&&!window.landscapePrompt?.blocked)this.elapsed+=Math.min(.05,(time-this.lastTime)/1000);
        this.lastTime=time;this.progress=Math.min(1,this.elapsed/4.8);this.updateSteps();this.paint();
        if(this.progress===1)this.finish();else this.raf=requestAnimationFrame(tick);
      };this.raf=requestAnimationFrame(tick);
    }
    finish(){
      if(!this.active||!this.run||!this.running)return;
      this.stop();this.progress=1;if(this.run.cacheOnComplete)this.session.cached=true;
      this.updateSteps();this.paint();this.$('#labSkip').disabled=true;this.$('#labReplay').disabled=false;this.$('#labRun').textContent=this.definition.action;
      const result=this.$('#labResult');result.hidden=false;result.dataset.tone=this.run.tone;result.setAttribute('aria-busy','false');
      this.$('#labResultTitle').textContent=this.run.title;this.$('#labAnswer').textContent=this.run.answer;this.$('#labMetric').textContent=this.run.metric;
      this.$('#labStageDetail').textContent=this.run.stages[2].detail;
      const evidence=this.$('#labEvidence');evidence.replaceChildren();
      for(const source of this.run.sources||[]){const detail=document.createElement('details'),summary=document.createElement('summary'),p=document.createElement('p');summary.textContent=source.id+' / '+source.title;p.textContent=source.text;detail.append(summary,p);evidence.append(detail);}
      if(this.run.sql){const detail=document.createElement('details'),summary=document.createElement('summary'),pre=document.createElement('pre');summary.textContent='See the sample database command (SQL)';pre.textContent=this.run.sql;detail.append(summary,pre);evidence.append(detail);}
      this.$('#labStatus').textContent=this.run.title+'. '+this.run.answer+' '+this.run.metric;
      this.deck.finish();
    }
    paint(){LunarLabScene.draw(this.context,this.run,this.progress,this.elapsed,this.reduced.matches);}
  }
  window.LunarLab=LunarLab;
})();
