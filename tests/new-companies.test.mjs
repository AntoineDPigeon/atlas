import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as msc from '../dist/msc.js';
import * as royal from '../dist/royal.js';
import * as holland from '../dist/holland.js';
import {cruises} from '../dist/data.js';
for(const [provider,id,name,catalogName] of [[msc,5,'MSC Cruises','MSC Cruises'],[royal,7,'Royal Caribbean','Royal Caribbean'],[holland,46,'Holland America Line','Holland America']])test(name+' : CAD, escales et deux pages de 12 sans mélanger les compagnies',async()=>{
 const state={start:'2029-06-01',end:'2029-06-30'},requests=[];
 const steps=[{day:1,idPort:1,name:'Amsterdam'},{day:1,idPort:1,name:'Amsterdam'},{day:2,idPort:1,name:'Amsterdam'},{day:3,idPort:2,name:'Navigation'},{day:8,idPort:3,name:'Oslo'}];
 const detail={duration:8,currency:'$$CA',companyId:id,destinationIds:[65],full:false,steps,departures:[{idDepart:1,date:'2029-06-05',full:false,priceFull:false,price:1500,taxesExcludes:true,taxes:100},{idDepart:2,date:'2029-06-05',full:true,priceFull:false,price:1},{idDepart:3,date:'2029-06-29',full:false,priceFull:false,price:1}]};
 const item={id:99,name:'Europe',boatName:'Navire',link:'/f-99-europe'};
 const normalized=provider.normalize(item,detail,state,'');assert.equal(normalized.length,1);assert.equal(normalized[0].company,name);assert.equal(normalized[0].price,1600);assert.deepEqual(normalized[0].stops.map(p=>p.day),[1,2,8]);assert.equal(provider.normalize(item,{...detail,currency:'USD'},state,'').length,0);assert.equal(provider.normalize(item,{...detail,companyId:999},state,'').length,0);
 if(id===46){const pairedSteps=[{day:0,idPort:1,name:'Amsterdam',arrival:'0',departure:'1600'},{day:1,idPort:1,name:'Amsterdam',arrival:'0',departure:'1600'},{day:2,idPort:3,name:'Oslo',arrival:'800',departure:'1700'},{day:3,idPort:3,name:'Oslo',arrival:'800',departure:'1700'},{day:7,idPort:1,name:'Amsterdam',arrival:'700',departure:'0'},{day:8,idPort:1,name:'Amsterdam',arrival:'700',departure:'0'}];assert.deepEqual(provider.normalize(item,{...detail,steps:pairedSteps},state,'')[0].stops.map(p=>p.day),[1,3,8]);}
 globalThis.fetch=async url=>{
  if(url.includes('search/results')){const q=new URL(url).searchParams;requests.push([q.get('cmp'),q.get('rs'),q.get('pgn')]);const offset=Number(q.get('pgn'))*12;return {ok:true,json:async()=>({currency:'CAD',count:13,results:Array.from({length:Math.min(12,13-offset)},(_,i)=>({id:100+offset+i,name:'Europe',boatName:'Navire',companyName:catalogName,link:'/f-'+(100+offset+i)+'-europe'}))})};}
  const cruiseId=Number(url.match(/\/f-(\d+)/)[1]);const product={idCruise:cruiseId,duration:8,currency:'$$CA',company:{id},destinations:[{id:65}],full:false,departures:[{idDepart:cruiseId,departureDate:'2029-06-05',full:false,bestPrice:{full:false,taxesExcludes:false,cruise:{price:1500}}}]};const flight='a:'+JSON.stringify([product,{id:cruiseId,steps}])+'\n';return {ok:true,text:async()=>'<script>self.__next_f.push([1,'+JSON.stringify(flight)+'])</script>'};
 };
 await provider.loadCruises(state,false);await provider.loadCruises(state,true);
 assert.deepEqual(requests,[[String(id),'12','0'],[String(id),'12','1']]);assert.equal(provider.feed.error,null);assert.equal(provider.feed.hasMore,false);assert.equal(provider.feed.loadedItineraries,13);assert.equal(cruises.filter(c=>c.company===name).length,13);
});
