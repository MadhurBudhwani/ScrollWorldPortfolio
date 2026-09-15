// Use viewport shape, not device names: phones, tablets and narrow windows.
(() => {
  const dialog=document.createElement('dialog');
  dialog.className='landscape-prompt';
  dialog.setAttribute('aria-labelledby','landscapeTitle');
  dialog.setAttribute('aria-describedby','landscapeDescription');
  dialog.innerHTML=`<div class="rotate-device" aria-hidden="true"><span></span><i>↻</i></div>
    <p class="landscape-kicker">A little more room to explore</p>
    <h2 id="landscapeTitle">Switch to landscape.</h2>
    <p id="landscapeDescription">Rotate your device for the full scrollworld experience.<br>On a computer, make this window wider.</p>
    <p class="landscape-resume">Your place is saved. Continue when you're ready.</p>
    <button type="button">Continue in portrait</button>`;
  document.body.append(dialog);
  let dismissed=false;
  const controller=window.landscapePrompt={blocked:false};
  function setBlocked(blocked){
    controller.blocked=blocked;
    document.documentElement.classList.toggle('orientation-paused',blocked);
    if(blocked&&!dialog.open)dialog.showModal();
    else if(!blocked&&dialog.open)dialog.close();
  }
  function update(){
    const portrait=window.innerHeight>=window.innerWidth;
    if(!portrait)dismissed=false;
    setBlocked(portrait&&!dismissed);
  }
  function dismiss(){dismissed=true;setBlocked(false);}
  dialog.querySelector('button').addEventListener('click',dismiss);
  dialog.addEventListener('cancel',e=>{e.preventDefault();dismiss();});
  // Block background movement while keeping the dialog keyboard-accessible.
  for(const name of ['wheel','touchmove'])window.addEventListener(name,e=>{
    if(!controller.blocked||e.ctrlKey||e.touches?.length>1)return;
    // Let a short viewport scroll the dialog itself, and preserve pinch zoom.
    if(!dialog.contains(e.target))e.preventDefault();
    e.stopImmediatePropagation();
  },{capture:true,passive:false});
  window.addEventListener('keydown',e=>{
    if(controller.blocked&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown','Home','End'].includes(e.key)){
      e.preventDefault();e.stopImmediatePropagation();
    }
  },{capture:true});
  window.addEventListener('resize',update);
  window.screen?.orientation?.addEventListener('change',update);
  update();
})();
