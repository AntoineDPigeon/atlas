import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadCruises,loadDetails,feed} from '../dist/ncl.js';
import {cruises,filterCruises} from '../dist/data.js';
test('CAD disponible par départ, filtres, escales, pagination et erreur sans exemples',async()=>{
 const cabin={packageId:'123',sailStartDate:'2027-06-06T00:00:00',sailEndDate:'2027-06-13T00:00:00',sailingEventSequence:'BCN2MRS2CIV',currencyCode:'CAD',status:'AVAILABLE',combinedPrice:1800,title:'Balcony'};
 globalThis.fetch=async url=>({ok:true,json:async()=>url.includes('/search?')?{total:24,itineraries:[{code:'TEST7',title:'Europe',destinations:[{code:'MEDITERRANEAN'}],ship:{title:'Epic'},embarkationPort:{code:'BCN',title:'Barcelona'},portsOfCall:[{code:'MRS',title:'Marseille'}],disembarkationPort:{code:'CIV',title:'Rome'}}]}:url.includes('/events/')?{events:[{eventOrder:1,portCode:'BCN',title:'Barcelona',relativeCalendarDay:1},{eventOrder:2,portCode:'BCN',title:'Barcelona',relativeCalendarDay:1},{eventOrder:3,portCode:'CIV',title:'Rome',relativeCalendarDay:8}]}:{pricingStateRooms:[cabin,{...cabin,title:'Inside',combinedPrice:1200},{...cabin,currencyCode:'USD',combinedPrice:100},{...cabin,status:'SOLD_OUT',combinedPrice:90},{...cabin,status:'SOLO_GUEST_ONLY',combinedPrice:80},{...cabin,packageId:'124',sailStartDate:'2027-05-30T00:00:00',combinedPrice:50}]}});
 const state={start:'2027-06-01',end:'2027-06-30',budget:1500,company:'all',duration:'week',region:'all',port:null};
 await loadCruises(state,false,()=>{});
 assert.equal(feed.error,null);assert.equal(cruises.length,1);assert.equal(cruises[0].price,1200);assert.equal(cruises[0].currency,'CAD');assert.equal(cruises[0].nights,7);assert.equal(cruises[0].cabin,'Inside');assert.deepEqual(cruises[0].ports,['barcelona','marseille','rome']);assert.equal(feed.hasMore,true);
 assert.equal(filterCruises(state).length,1);assert.equal(filterCruises({...state,duration:'short'}).length,0);assert.equal(filterCruises({...state,budget:1000}).length,0);
 await loadDetails(cruises[0]);assert.deepEqual(cruises[0].ports,['barcelona','rome']);assert.equal(cruises[0].stops.length,2);
 await loadCruises(state,true,()=>{});assert.equal(cruises.length,1);assert.equal(feed.hasMore,false);
 globalThis.fetch=async()=>{throw Error('Source hors ligne')};
 await loadCruises({...state,start:'2027-07-01',end:'2027-07-31'},false,()=>{});
 assert.equal(cruises.length,0);assert.equal(feed.error,'Source hors ligne');assert.equal(feed.loading,false);
});
