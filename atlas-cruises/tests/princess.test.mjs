import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalize,loadCruises,feed} from '../dist/princess.js';
import {cruises} from '../dist/data.js';
test('Princess conserve les vrais départs CAD disponibles et sa compagnie',async()=>{
 const item={id:456,name:'Europe',companyName:'Princess Cruises',boatName:'Sky Princess',link:'/f-456-princess-cruises'};
 const detail={duration:8,companyId:34,currency:'$$CA',destinationIds:[65],full:false,steps:[{day:1,idPort:162,name:'Southampton'},{day:8,idPort:162,name:'Southampton'}],departures:[{idDepart:789,date:'2027-06-19',full:false,price:1690,priceFull:false,taxesExcludes:false},{idDepart:790,date:'2027-06-26',full:true,price:100,priceFull:false}]};
 const state={start:'2027-06-01',end:'2027-09-30'};
 const list=normalize(item,detail,state,'2026-10-01T17:00:00Z');
 assert.equal(list.length,1);assert.equal(list[0].company,'Princess Cruises');assert.equal(list[0].id,'princess-456-789');assert.equal(list[0].price,1690);assert.equal(list[0].currency,'CAD');assert.equal(list[0].nights,7);assert.equal(normalize(item,{...detail,companyId:2},state,'').length,0);assert.equal(normalize(item,{...detail,currency:'USD'},state,'').length,0);
 const requested=[];
 globalThis.fetch=async url=>{if(url.includes('search/results')){const p=new URL(url).searchParams;requested.push([p.get('cmp'),p.get('rs'),p.get('pgn')]);return {ok:true,json:async()=>({currency:'CAD',count:13,results:p.get('pgn')==='0'?[item]:[]})}};
 const product={idCruise:456,duration:8,company:{id:34},currency:'$$CA',destinations:[{id:65}],full:false,departures:[{idDepart:789,departureDate:'2027-06-19',full:false,bestPrice:{full:false,taxesExcludes:false,cruise:{price:1690}}}]};
 const itinerary={id:456,steps:detail.steps};const flight='a:'+JSON.stringify([product,itinerary])+'\n';return {ok:true,text:async()=>'<script>self.__next_f.push([1,'+JSON.stringify(flight)+'])</script>'};};
 await loadCruises(state,false);await loadCruises(state,true);
 assert.deepEqual(requested,[['34','12','0'],['34','12','1']]);assert.equal(feed.hasMore,false);assert.equal(feed.error,null);assert.equal(cruises.filter(c=>c.provider==='princess').length,1);
});
