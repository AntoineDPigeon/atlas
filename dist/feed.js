import * as ncl from './ncl.js';
import * as celebrity from './celebrity.js';
import * as costa from './costa.js';
import * as princess from './princess.js';
import * as msc from './msc.js';
import * as royal from './royal.js';
import * as holland from './holland.js';
const sources=[ncl,celebrity,costa,princess,msc,royal,holland];
export function sourceProgress(){return sources.map((source,i)=>({name:['Norwegian Cruise Line','Celebrity Cruises','Costa Cruises','Princess Cruises','MSC Cruises','Royal Caribbean','Holland America Line'][i],loaded:source.feed.loadedItineraries,total:source.feed.totalItineraries,failed:source.feed.failedItineraries||0,status:source.feed.error?'error':source.feed.loading?'loading':source.feed.page===0?'pending':source.feed.hasMore?'loading':'complete'}))}
let loading=false,version=0;
export const feed={get loading(){return loading||sources.some(s=>s.feed.loading)},get error(){return sources.map(s=>s.feed.error||(s.feed.failedItineraries?s.feed.failedItineraries+' itinéraires indisponibles':null)).filter(Boolean).join(' · ')||null},get hasMore(){return sources.some(s=>s.feed.hasMore)},get status(){return [ ['Norwegian',ncl.feed],['Celebrity',celebrity.feed],['Costa · cruise.ca',costa.feed],['Princess · cruise.ca',princess.feed],['MSC · cruise.ca',msc.feed],['Royal Caribbean · cruise.ca',royal.feed],['Holland America · cruise.ca',holland.feed] ].map(([name,f])=>`${name} : ${f.error?'indisponible':`${f.loadedItineraries} / ${f.totalItineraries} itinéraires${f.failedItineraries?' ('+f.failedItineraries+' indisponibles)':''}`}`).join(' · ')},get checkedAt(){return sources.map(s=>s.feed.checkedAt).filter(Boolean).sort().at(-1)}};
export function progress(){const sources=[ncl.feed,celebrity.feed,costa.feed,princess.feed,msc.feed,royal.feed,holland.feed];return {loaded:sources.reduce((sum,f)=>sum+f.loadedItineraries,0),total:sources.reduce((sum,f)=>sum+f.totalItineraries,0),known:sources.every(f=>f.page>0||f.error)}};
export async function loadCruises(state,append=false,onUpdate=()=>{}){
 const run=++version;for(const source of sources.slice(1))source.cancel();loading=true;
 if(!append)for(const source of sources)Object.assign(source.feed,{page:0,loadedItineraries:0,totalItineraries:0,hasMore:false,error:null,checkedAt:null});
 onUpdate();
 try{
  // Norwegian owns the initial clearing of the shared catalog.
  for(const source of sources){
   if(!append||source.feed.hasMore)await source.loadCruises(state,append,onUpdate);
   if(run!==version)return;
  }
  // Each provider requests its next page of 12. Failed sources stop while the other continues.
  while(sources.some(s=>s.feed.hasMore)){
   for(const source of sources){
    if(run!==version)return;
    if(!source.feed.hasMore)continue;
    const before=source.feed.loadedItineraries;
    await source.loadCruises(state,true,onUpdate);
    if(run!==version)return;
    if(!source.feed.error&&source.feed.loadedItineraries<=before&&source.feed.totalItineraries>before){source.feed.hasMore=false;source.feed.error='La pagination de cette source n’a pas progressé. Réessayez.';onUpdate();}
   }
  }
 }finally{if(run===version){loading=false;onUpdate();}}
}
export async function loadDetails(c){return c.provider==='celebrity'||c.sourceName==='cruise.ca'?c:ncl.loadDetails(c)}
