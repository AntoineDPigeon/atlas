import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseDetail,normalize,loadCruises,feed} from '../dist/costa.js';
test('lit les données Flight sans exécution, respecte UTF-8 et les prix par départ',()=>{
 const product={idCruise:123,duration:8,currency:'$$CA',company:{id:2},destinations:[{id:35}],full:false,departures:[{idDepart:1,departureDate:'2027-06-19',full:false,bestPrice:{full:false,taxesExcludes:false,taxes:0,cruise:{price:1435}}},{idDepart:2,departureDate:'2027-08-07',full:false,bestPrice:{full:false,taxesExcludes:true,taxes:100,cruise:{price:2062}}},{idDepart:3,departureDate:'2027-09-04',full:true,bestPrice:{full:false,cruise:{price:100}}},{idDepart:4,departureDate:'2027-09-29',full:false,bestPrice:{full:false,cruise:{price:100}}}]};
 const itinerary={id:123,steps:[{day:1,idPort:17,name:'Marseille',url:'/images/ports/marseille.webp'},{day:2,idPort:18,name:'Navigation',url:'/images/ports/navigation.webp'},{day:8,idPort:17,name:'Marseille',url:'/images/ports/marseille.webp'}]};
 const text='Été : texte arbitraire';const flight='a:T'+new TextEncoder().encode(text).length.toString(16)+','+text+'b:'+JSON.stringify([product,itinerary])+'\n';
 const html='<script>self.__next_f.push([1,'+JSON.stringify(flight)+'])</script>';
 const detail=parseDetail(html,123);assert.equal(detail.departures.length,4);assert.equal(detail.steps.length,3);
 const list=normalize({id:123,name:'Europe',boatName:'Costa',link:'/f-123-costa'},detail,{start:'2027-06-01',end:'2027-09-30'},'2026-10-01T17:00:00Z');
 assert.equal(list.length,2);assert.deepEqual(list.map(c=>c.price),[1435,2162]);assert.equal(list[0].nights,7);assert.equal(list[0].endDate,'2027-06-26');assert.deepEqual(list[0].ports,['marseille','marseille']);assert.equal(list[0].sourceName,'cruise.ca');assert.equal(list[0].currency,'CAD');
 assert.equal(normalize({id:123}, {...detail,currency:'USD'},{start:'2027-06-01',end:'2027-09-30'},'').length,0);
});
test('Costa commence à la page zéro puis avance par lots de douze',async()=>{
 const pages=[];globalThis.fetch=async url=>{const p=Number(new URL(url).searchParams.get('pgn'));pages.push(p);return {ok:true,json:async()=>({currency:'CAD',count:13,results:[]})}};
 const state={start:'2028-01-01',end:'2028-01-31'};
 await loadCruises(state,false,()=>{});assert.equal(feed.hasMore,true);
 await loadCruises(state,true,()=>{});assert.equal(feed.hasMore,false);assert.deepEqual(pages,[0,1]);
});
