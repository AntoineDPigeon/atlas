import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {handleGoogleReviews} from './server/google-reviews.js';
const root=path.resolve(fileURLToPath(new URL('./dist/',import.meta.url)));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.geojson':'application/json'};
createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://'+(req.headers.host||'localhost:4173'));
  if(url.pathname==='/api/google-reviews'){
    let body='';for await(const chunk of req){body+=chunk.toString();if(body.length>1024){res.writeHead(413);res.end('Request too large');return}}
    const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body}:{})});
    const response=await handleGoogleReviews(request,{GOOGLE_PLACES_API_KEY:process.env.GOOGLE_PLACES_API_KEY});
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());return;
  }
  const pathname=decodeURIComponent(url.pathname);const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(await readFile(file))
}catch{res.writeHead(404);res.end('Not found')}}).listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
