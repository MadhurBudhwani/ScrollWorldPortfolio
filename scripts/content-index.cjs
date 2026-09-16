const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const images = /\.(png|jpe?g|webp|gif|avif)$/i;
const audio = /\.(mp3|wav|ogg|m4a|aac|flac|webm)$/i;
const video = /\.(mp4|webm|ogv|mov|m4v)$/i;
const stem = f => path.basename(f, path.extname(f));
const url = f => './' + f.split(path.sep).map(encodeURIComponent).join('/');
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes:true}).filter(e => !e.name.startsWith('.')).flatMap(e => {
    const p = path.join(dir,e.name);
    return e.isSymbolicLink()?[]:e.isDirectory()?walk(p):[p];
  }).sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
}
function readJson(p, fallback={}) {
  if (!fs.existsSync(p)) return fallback;
  try { return JSON.parse(fs.readFileSync(p,'utf8')); }
  catch(e) { throw new Error(`Invalid content metadata: ${p}: ${e.message}`); }
}
function index(base=root) {
  const content=path.join(base,'contents');
  const relative=p=>url(path.relative(base,p));
  const safeAsset=(dir,p)=>{
    if(typeof p!=='string')return null;
    const full=path.resolve(dir,p),rel=path.relative(content,full);
    return !rel.startsWith('..')&&!path.isAbsolute(rel)&&fs.existsSync(full)&&fs.statSync(full).isFile()?relative(full):null;
  };
  const collection=(category,match)=>walk(path.join(content,category)).filter(f=>match.test(f)&&!path.relative(path.join(content,category),f).split(path.sep).some(s=>['process','before','raw','layers','album-arts','posters'].includes(s))&&!/\.(before|sketch)\./i.test(f)).map(f=>{
    const meta=readJson(f.slice(0,-path.extname(f).length)+'.json');
    const dir=path.dirname(f),name=stem(f);
    const item={title:typeof meta.title==='string'?meta.title:name,src:relative(f),note:typeof meta.note==='string'?meta.note:''};
    for(const key of ['before','poster']){const asset=safeAsset(dir,meta[key]);if(asset)item[key]=asset;}
    for(const key of ['process','layers'])if(Array.isArray(meta[key]))item[key]=meta[key].map(p=>safeAsset(dir,p)).filter(Boolean);
    if(category==='singing') {
      const art=walk(path.join(content,'singing','album-arts')).find(p=>images.test(p)&&stem(p).toLowerCase()===name.toLowerCase());
      if(art)item.poster=relative(art);
    }
    return item;
  });
  const book=readJson(path.join(content,'writing','book.json'),{title:'Placeholder Teddy',summary:'',links:[]});
  book.cover=safeAsset(path.join(content,'writing'),book.cover);
  book.links=(Array.isArray(book.links)?book.links:[]).filter(l=>l&&typeof l.label==='string'&&/^https?:\/\//i.test(l.href));
  return {version:1,writing:book,singing:collection('singing',audio),gaming:collection('gaming',images),drawing:collection('drawing',images),design:collection('graphic-design',images),video:collection('video-editing',video)};
}
function write(base=root){
  const data=index(base),json=JSON.stringify(data,null,2);
  fs.writeFileSync(path.join(base,'contents','index.json'),json+'\n');
  fs.writeFileSync(path.join(base,'contents','index.js'),'window.HobbyContent = '+json+';\n');
  return data;
}
function build(){
  write();const out=path.join(root,'dist');fs.mkdirSync(out,{recursive:true});
  for(const name of fs.readdirSync(root))if(/\.(html|js|css|svg)$/.test(name)&&!/(qa|review)\.html$/.test(name))fs.copyFileSync(path.join(root,name),path.join(out,name));
  for(const name of ['assets','contents'])fs.cpSync(path.join(root,name),path.join(out,name),{recursive:true});
  console.log('Built static site in dist/');
}
if(require.main===module){if(process.argv.includes('--build'))build();else{const d=write();console.log(Object.fromEntries(Object.entries(d).filter(([,v])=>Array.isArray(v)).map(([k,v])=>[k,v.length])));}}
module.exports={index,write,root};
