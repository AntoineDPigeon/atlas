import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadCruises,feed,progress} from '../dist/feed.js';
import {cruises} from '../dist/data.js';

test('charge toutes les pages de 12 et termine le chargement après la dernière page',async()=>{
 const offsets=[],skips=[],updates=[];
 globalThis.fetch=async(url,options)=>{
  if(url.includes('cruise.ca'))return {ok:true,json:async()=>({currency:'CAD',count:0,results:[]})};
  if(url.includes('celebritycruises')){
   const skip=JSON.parse(options.body).variables.pagination.skip;skips.push(skip);
   return {ok:true,json:async()=>({data:{cruiseSearch:{results:{total:13,cruises:Array.from({length:Math.min(12,13-skip)},(_,i)=>({masterSailing:{itinerary:{name:'Europe',totalNights:7,ship:{name:'Celebrity'},days:[{number:1,ports:[{activity:'EMBARK',port:{code:'ROM',name:'Rome'}}]},{number:8,ports:[{activity:'DEBARK',port:{code:'ROM',name:'Rome'}}]}]}},sailings:[{id:'CEL'+(skip+i),startDate:'2028-06-06',productViewLink:'itinerary/europe',lowestStateroomClassPrice:{price:{currency:{code:'CAD'},value:1500}}}]}))}}}})};
  }
  if(url.includes('/search?')){const offset=Number(new URL(url).searchParams.get('offset'));offsets.push(offset);assert.equal(new URL(url).searchParams.get('limit'),'12');return {ok:true,json:async()=>({total:25,itineraries:Array.from({length:Math.min(12,25-offset)},(_,i)=>({code:'TEST'+(offset+i),title:'Europe',ship:{title:'Epic'},destinations:[{code:'MEDITERRANEAN'}],embarkationPort:{code:'BCN',title:'Barcelona'},disembarkationPort:{code:'CIV',title:'Rome'}}))})};}
  const id=url.match(/TEST(\d+)/)[1];return {ok:true,json:async()=>({pricingStateRooms:[{packageId:String(1000+Number(id)),sailStartDate:'2028-06-06',sailEndDate:'2028-06-13',sailingEventSequence:'BCN2CIV',currencyCode:'CAD',status:'AVAILABLE',combinedPrice:1200,title:'Inside'}]})};
 };
 await loadCruises({start:'2028-06-01',end:'2028-06-30'},false,()=>updates.push(feed.loading));
 assert.deepEqual(offsets,[0,12,24]);assert.deepEqual(skips,[0,12]);assert.equal(cruises.length,38);assert.equal(new Set(cruises.map(c=>c.id)).size,38);assert.equal(feed.loading,false);assert.equal(feed.hasMore,false);assert.deepEqual(progress(),{loaded:38,total:38,known:true});assert.ok(updates.slice(0,-1).every(Boolean));assert.equal(updates.at(-1),false);
});

test('arrête une source dont la pagination est vide sans boucle infinie',async()=>{
 let calls=0;
 globalThis.fetch=async url=>{calls++;if(url.includes('cruise.ca'))return {ok:true,json:async()=>({currency:'CAD',count:0,results:[]})};return {ok:true,json:async()=>url.includes('celebritycruises')?{data:{cruiseSearch:{results:{total:0,cruises:[]}}}}:{total:24,itineraries:[]}}};
 await loadCruises({start:'2028-07-01',end:'2028-07-31'},false,()=>{});
 assert.equal(calls,8);assert.equal(feed.loading,false);assert.equal(feed.hasMore,false);assert.match(feed.error,/pagination/);
});
