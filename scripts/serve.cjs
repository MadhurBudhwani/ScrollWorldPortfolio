const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {root,write}=require('./content-index.cjs');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg','.m4a':'audio/mp4','.mp4':'video/mp4','.webm':'video/webm','.ogv':'video/ogg'};
write();let clients=new Set(),timer;
fs.watch(path.join(root,'contents'),{recursive:true},(_,name)=>{
  if(!name||/^index\.(json|js)$/.test(name))return;
  clearTimeout(timer);timer=setTimeout(()=>{try{write();for(const r of clients)r.write('data: content\n\n');}catch(e){console.error(e.message);}},350);
});
const server=http.createServer((req,res)=>{
  let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{return res.writeHead(400).end();}
  if(pathname==='/__content_events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive'});res.write(': connected\n\n');clients.add(res);req.on('close',()=>clients.delete(res));return;}
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  const relative=path.relative(root,file);
  if(relative.startsWith('..')||path.isAbsolute(relative)||relative.split(path.sep).some(s=>s.startsWith('.'))||/^(scripts|work|tmp|node_modules)(\/|\\)/.test(relative))return res.writeHead(403).end();
  fs.stat(file,(err,stat)=>{
    if(err||!stat.isFile())return res.writeHead(404).end('Not found');
    let start=0,end=stat.size-1,status=200;
    if(req.headers.range){const m=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range);if(!m)return res.writeHead(416).end();start=+m[1];end=m[2]?Math.min(+m[2],end):end;if(start>end)return res.writeHead(416,{'Content-Range':`bytes */${stat.size}`}).end();status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${stat.size}`);}
    res.writeHead(status,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Content-Length':stat.size?end-start+1:0,'Accept-Ranges':'bytes','Cache-Control':'no-cache'});
    if(req.method==='HEAD'||!stat.size)return res.end();fs.createReadStream(file,{start,end}).on('error',()=>res.destroy()).pipe(res);
  });
});
server.listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('Scrollworld: http://127.0.0.1:'+server.address().port));
