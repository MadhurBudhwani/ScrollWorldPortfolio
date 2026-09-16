/* Keep the original instruments and controls; give every section its own deck. */
(() => {
  const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text)n.textContent=text;return n;};
  class LunarDeck {
    constructor(lab){
      this.lab=lab;this.root=lab.root;this.dialog=lab.dialog;this.pages={};this.buttons={};
      const nav=el('nav','lab-tabs');nav.setAttribute('aria-label','Experiment sections');this.root.prepend(nav);
      const select=el('select','lab-section-select');select.setAttribute('aria-label','Experiment section');nav.after(select);this.select=select;
      const content=el('div','lab-deck');this.root.append(content);
      for(const [id,title] of [['brief','Briefing'],['inputs','Inputs'],['experiment','Experiment'],['results','Results'],['build','How I build this']]){
        const b=el('button','',title);b.type='button';b.onclick=()=>this.show(id);nav.append(b);this.buttons[id]=b;
        const option=el('option','',title);option.value=id;select.append(option);
        const page=el('section','lab-page');page.dataset.page=id;page.setAttribute('aria-label',title);page.hidden=true;content.append(page);this.pages[id]=page;
      }
      select.onchange=()=>this.show(select.value);
      this.pages.inputs.append(lab.$('.lab-inputs'));this.pages.experiment.append(lab.$('.lab-display'));this.pages.results.append(lab.$('#labResult'));this.pages.build.append(lab.$('#labBuild'));
      lab.$('.lab-workbench').remove();
      this.brief=new PagedReader(this.pages.brief);
      const resultText=el('div','lab-result-reader');lab.$('#labResult').append(resultText);this.result=new PagedReader(resultText);
      const buildText=el('div','lab-build-reader');lab.$('#labBuild').append(buildText);this.build=new PagedReader(buildText);
      const groupNav=el('div','lab-group-nav');this.pages.inputs.prepend(groupNav);this.groupNav=groupNav;
      const footer=el('div','lab-deck-footer');const back=el('button','','← Back to moon');back.type='button';back.onclick=()=>lab.dialog.close();const next=el('button','','Choose inputs →');next.type='button';next.onclick=()=>this.show('inputs');footer.append(back,next);this.next=next;this.root.append(footer);
      this.placeholder=el('p','lab-result-placeholder','Choose your inputs and run an experiment. Your answer, evidence and trace will appear here.');this.pages.results.prepend(this.placeholder);
    }
    open(){
      const d=this.lab.definition;this.brief.set(d.purpose.split('\n\n').map(text=>({tag:'p',text})));
      this.build.set([{tag:'p',cls:'lab-skill-copy',text:d.skill},{tag:'p',text:d.build},{tag:'p',cls:'lab-principle-copy',text:d.principle}]);
      this.groupNav.replaceChildren();const groups=[...this.lab.$('#labChoices').children];
      const choose=i=>{groups.forEach((g,j)=>g.hidden=i!==j);[...this.groupNav.children].forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));};
      groups.forEach((group,i)=>{const b=el('button','',`${i+1}. ${d.groups[i].label}`);b.type='button';b.onclick=()=>choose(i);this.groupNav.append(b);});choose(0);this.groupNav.hidden=groups.length<2;
      this.clear();this.show('brief');
    }
    clear(){this.placeholder.hidden=false;this.buttons.results.classList.remove('has-result');}
    show(id){
      this.active=id;Object.entries(this.pages).forEach(([key,page])=>page.hidden=key!==id);Object.entries(this.buttons).forEach(([key,b])=>b.setAttribute('aria-current',key===id?'page':'false'));this.select.value=id;
      this.next.hidden=id!=='brief';if(id==='build')this.lab.$('#labBuild').open=true;
      this.root.dataset.page=id;this.brief.schedule();this.result.schedule();this.build.schedule();
    }
    finish(){
      const run=this.lab.run;this.placeholder.hidden=true;this.buttons.results.classList.add('has-result');
      const blocks=[{tag:'h3',text:run.title},{tag:'p',text:run.answer},{tag:'p',cls:'lab-metric-copy',text:run.metric}];
      for(const source of run.sources||[])blocks.push({tag:'h3',cls:'lab-evidence-title',text:source.id+' / '+source.title},{tag:'p',text:source.text});
      if(run.sql)blocks.push({tag:'h3',cls:'lab-evidence-title',text:'The sample database command (SQL)'},{tag:'pre',text:run.sql});
      this.result.set(blocks);if(this.active==='experiment')this.show('results');
    }
  }
  window.LunarDeck=LunarDeck;
})();
