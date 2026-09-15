// Phase 1 arrival shell. The destination worlds are designed in Phase 2.
const options={work:{title:'Work Experience',position:1.4},genai:{title:'GenAI Projects',position:5.4},hobbies:{title:'Hobbies',position:7.5}};
const params=new URLSearchParams(location.search);
const destination=Object.hasOwn(options,params.get('world'))?options[params.get('world')]:options.work;
document.querySelector('#worldTitle').textContent=destination.title;
document.title=destination.title+' | Placeholder Teddy';
if(params.get('avatar')==='original')document.querySelector('.return-link').href='./index.html?avatar=original#hub';
const canvas=document.querySelector('#universe'),ctx=canvas.getContext('2d');
const sceneViewport=new SceneViewport(document.querySelector('#sceneViewport'),document.querySelector('#stage'));
const state={w:innerWidth,h:innerHeight};
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const colors=['#84f5ad','#67daf5','#f3cc70','#f58caf'];
const avatar=window.AvatarAnimator?new AvatarAnimator(document.querySelector('#worldAvatar')):null;
function resize(){const layout=sceneViewport.resize();state.w=layout.width;state.h=layout.height;canvas.width=state.w;canvas.height=state.h;ctx.imageSmoothingEnabled=false;}
function background(){
  ctx.fillStyle='#070d11';ctx.fillRect(0,0,state.w,state.h);celestialLayer(destination.position);
  ctx.strokeStyle='#17282c';ctx.lineWidth=1;
  const horizon=state.h*.57;
  for(let i=0;i<16;i++){const x=(i/15-.5)*state.w*2;ctx.beginPath();ctx.moveTo(state.w/2+x*.15,horizon);ctx.lineTo(state.w/2+x,state.h);ctx.stroke();}
  for(let j=0;j<12;j++){const y=horizon+(state.h-horizon)*(j/12)**2;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(state.w,y);ctx.stroke();}
}
let last=0;
function frame(t){const dt=Math.min((t-last)/1000||1/60,.05);last=t;if(!window.landscapePrompt?.blocked){background();avatar?.update(dt);}requestAnimationFrame(frame);}
resize();addEventListener('resize',resize);window.lucide?.createIcons();requestAnimationFrame(frame);
