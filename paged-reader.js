/* Text leaves measured against the available space, at the authored font size. */
(() => {
  const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls||'';if(text!==undefined)n.textContent=text;return n;};
  class PagedReader {
    constructor(host){
      this.host=host;host.classList.add('paged-reader');this.body=node('div','reader-leaf');this.body.tabIndex=0;
      this.nav=node('nav','reader-nav');this.nav.setAttribute('aria-label','Reading pages');
      this.prev=node('button','','← Previous');this.next=node('button','','Next →');this.count=node('span','reader-count');this.count.setAttribute('aria-live','polite');
      this.prev.type=this.next.type='button';this.prev.onclick=()=>this.show(this.index-1);this.next.onclick=()=>this.show(this.index+1);
      this.nav.append(this.prev,this.count,this.next);host.append(this.body,this.nav);this.blocks=[];this.pages=[];this.index=0;
      this.body.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();this.show(this.index+(e.key==='ArrowRight'?1:-1));}});
      let size='';this.observer=new ResizeObserver(()=>{const next=this.body.clientWidth+'/'+this.body.clientHeight;if(size===next)return;size=next;this.schedule();});this.observer.observe(this.body);
    }
    set(blocks){this.blocks=blocks.filter(b=>b.text);this.index=0;this.schedule();}
    schedule(){cancelAnimationFrame(this.frame);this.frame=requestAnimationFrame(()=>this.layout());}
    layout(){
      if(!this.body.clientHeight||!this.body.clientWidth)return;
      const anchor=this.pages[this.index]?.[0]?.offset||0;let offset=0,leaves=[],leaf=[];this.body.replaceChildren();
      const flush=()=>{if(leaf.length)leaves.push(leaf);leaf=[];this.body.replaceChildren();};
      for(const block of this.blocks){
        let item=node(block.tag||'p',block.cls),text='',start=offset;this.body.append(item);
        for(const word of block.text.split(/\s+/).filter(Boolean)){
          item.textContent=text?text+' '+word:word;
          if(this.body.scrollHeight>this.body.clientHeight+1&&(text||leaf.length)){
            if(text)leaf.push({...block,text,offset:start});flush();start=offset;text=word;item=node(block.tag||'p',block.cls,word);this.body.append(item);
          }else text=item.textContent;
          offset++;
        }
        if(text)leaf.push({...block,text,offset:start});
      }
      flush();this.pages=leaves;let page=leaves.findIndex((p,i)=>p[0].offset<=anchor&&(!leaves[i+1]||leaves[i+1][0].offset>anchor));this.show(Math.max(0,page));
    }
    show(index){this.index=Math.max(0,Math.min(index,this.pages.length-1));this.body.replaceChildren(...(this.pages[this.index]||[]).map(b=>node(b.tag||'p',b.cls,b.text)));this.prev.disabled=this.index===0;this.next.disabled=this.index>=this.pages.length-1;this.count.textContent=`${this.index+1} / ${Math.max(1,this.pages.length)}`;}
    destroy(){this.observer.disconnect();cancelAnimationFrame(this.frame);}
  }
  window.PagedReader=PagedReader;
})();
