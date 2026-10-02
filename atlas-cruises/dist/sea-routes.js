// Coast avoidance is illustrative; this is not a navigation chart or a sailing plan.
export function routeOnSea(land,width,height,start,end,maxNodes=120000){
  const index=(x,y)=>y*width+x,valid=(x,y)=>x>=0&&y>=0&&x<width&&y<height&&!land[index(x,y)];
  function snap(p){let best=null,distance=Infinity;for(let r=0;r<=12&&!best;r++)for(let y=p.y-r;y<=p.y+r;y++)for(let x=p.x-r;x<=p.x+r;x++){if(!valid(x,y))continue;const d=Math.hypot(x-p.x,y-p.y);if(d<distance){best={x,y};distance=d}}return best}
  const a=snap(start),b=snap(end);if(!a||!b)return null;
  const goal=index(b.x,b.y),first=index(a.x,a.y),costs=new Map([[first,0]]),previous=new Map(),closed=new Set(),heap=[];
  function push(node){heap.push(node);let i=heap.length-1;while(i){const p=(i-1)>>1;if(heap[p].f<=node.f)break;heap[i]=heap[p];i=p}heap[i]=node}
  function pop(){const root=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let child=i*2+1;if(child+1<heap.length&&heap[child+1].f<heap[child].f)child++;if(heap[child].f>=last.f)break;heap[i]=heap[child];i=child}heap[i]=last}return root}
  push({id:first,x:a.x,y:a.y,f:Math.hypot(a.x-b.x,a.y-b.y)});
  while(heap.length&&closed.size<maxNodes){const n=pop();if(closed.has(n.id))continue;if(n.id===goal){const path=[];let id=goal;while(id!==undefined){path.push({x:id%width,y:Math.floor(id/width)});id=previous.get(id)}return path.reverse()}closed.add(n.id);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const x=n.x+dx,y=n.y+dy;if(!valid(x,y)||(dx&&dy&&(!valid(n.x+dx,n.y)||!valid(n.x,n.y+dy))))continue;const id=index(x,y),g=costs.get(n.id)+Math.hypot(dx,dy);if(g>=(costs.get(id)??Infinity))continue;costs.set(id,g);previous.set(id,n.id);push({id,x,y,f:g+Math.hypot(x-b.x,y-b.y)})}
  }return null;
}
export function createSeaRouter(geo){
  const width=1440,height=720,canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);ctx.fillStyle='#fff';
  for(const feature of geo.features){if(!feature.geometry)continue;const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;for(const polygon of polygons){ctx.beginPath();for(const ring of polygon){ring.forEach(([lon,lat],i)=>{const x=(lon+180)/360*width,y=(90-lat)/180*height;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath()}ctx.fill('evenodd')}}
  const pixels=ctx.getImageData(0,0,width,height).data,land=new Uint8Array(width*height);for(let i=0;i<land.length;i++)land[i]=pixels[i*4]>127?1:0;
  const cache=new Map(),cell=p=>({x:Math.max(0,Math.min(width-1,Math.floor((p.lon+180)/360*width))),y:Math.max(0,Math.min(height-1,Math.floor((90-p.lat)/180*height)))});
  return (from,to)=>{const key=from.id+'|'+to.id;if(cache.has(key))return cache.get(key);const path=routeOnSea(land,width,height,cell(from),cell(to));const result=path?[{lat:from.lat,lon:from.lon},...path.map(p=>({lat:90-(p.y+.5)/height*180,lon:(p.x+.5)/width*360-180})),{lat:to.lat,lon:to.lon}]:null;cache.set(key,result);return result};
}
