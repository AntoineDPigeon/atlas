import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCruises} from '../dist/celebrity.js';
import {loadCruises,feed} from '../dist/feed.js';
import {cruises} from '../dist/data.js';
const state={start:'2027-06-01',end:'2027-06-30'};
test('Celebrity conserve CAD, dates exactes, taxes et ports communs, sans jours en mer',()=>{
 const sailing={id:'AT10_2027-06-04',startDate:'2027-06-04',productViewLink:'itinerary/europe?country=CAN',lowestStateroomClassPrice:{price:{currency:{code:'CAD'},value:2860.5}},taxesAndFeesIncluded:true};
 const item={masterSailing:{itinerary:{name:'Europe',totalNights:10,ship:{name:'Ascent'},days:[{number:1,ports:[{activity:'EMBARK',port:{code:'ROM',name:'Rome'}}]},{number:2,ports:[{activity:'CRUISING',port:{code:'ASE',name:'Sea'}}]},{number:3,ports:[{activity:'DOCKED',port:{code:'ADB',name:'Kusadasi'}}]},{number:11,ports:[{activity:'DEBARK',port:{code:'ROM',name:'Rome'}}]}]}},sailings:[sailing,{...sailing,id:'usd',lowestStateroomClassPrice:{price:{currency:{code:'USD'},value:100}}},{...sailing,id:'late',startDate:'2027-06-25'},{...sailing,id:'zero',lowestStateroomClassPrice:{price:{currency:{code:'CAD'},value:0}}},{...sailing,id:'unsafe',productViewLink:'https://example.com/itinerary/'}]};
 const list=normalizeCruises([item],state,'2026-10-01T16:00:00Z');
 assert.equal(list.length,1);assert.equal(list[0].price,2861);assert.equal(list[0].endDate,'2027-06-14');assert.equal(list[0].taxesIncluded,true);assert.deepEqual(list[0].ports,['rome','KUS','rome']);assert.deepEqual(list[0].stops.map(p=>p.day),[1,3,11]);assert.match(list[0].sourceUrl,/celebritycruises.com\/ca\/itinerary/);
});
test('une panne Celebrity garde les offres Norwegian disponibles',async()=>{
 globalThis.fetch=async url=>{if(url.includes('celebritycruises'))throw Error('Hors ligne');return {ok:true,json:async()=>url.includes('/search?')?{total:1,itineraries:[{code:'TEST7',title:'Europe',destinations:[{code:'MEDITERRANEAN'}],ship:{title:'Epic'},embarkationPort:{code:'BCN',title:'Barcelona'},disembarkationPort:{code:'CIV',title:'Rome'}}]}:{pricingStateRooms:[{packageId:'456',sailStartDate:'2027-06-06T00:00:00',sailEndDate:'2027-06-13T00:00:00',sailingEventSequence:'BCN2CIV',currencyCode:'CAD',status:'AVAILABLE',combinedPrice:1200,title:'Inside'}]}}};
 await loadCruises(state,false,()=>{});assert.equal(cruises.length,1);assert.equal(cruises[0].company,'Norwegian Cruise Line');assert.match(feed.error,/Celebrity/);assert.equal(feed.loading,false);
});
