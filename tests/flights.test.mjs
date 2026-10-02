import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeFlightPrices,handleFlightPrices} from '../server/flights.js';
import {nearbyAirports,flightsMarkup,flightResultMarkup} from '../dist/flights.js';
const now=new Date('2026-10-02T12:00:00Z');
const input={tripType:'oneway',arrival:'BCN',outbound:'2026-11-01'};
const request=(body=input,ip='flight-test',origin)=>new Request('https://atlas.example/api/flight-prices',{method:'POST',headers:{'Content-Type':'application/json','CF-Connecting-IP':ip,...(origin?{Origin:origin}:{})},body:JSON.stringify(body)});
const offer=(price,number='AC822',type='One way')=>({price,type,flights:[{flight_number:number,departure_airport:{id:'YUL',time:'2026-11-01 19:00'},arrival_airport:{id:'BCN',time:'2026-11-02 07:00'}}]});
const data={search_parameters:{currency:'CAD',type:'2'},best_flights:[offer(700),offer(900,'TS260')],other_flights:[offer(700),offer(0,'invalid'),offer(100,'wrong','Round trip')]};

test('Flight average uses actual CAD offers, deduplicates itineraries and excludes incompatible fares',()=>{
 const result=normalizeFlightPrices(data,'oneway',now.toISOString());
 assert.equal(result.count,2);assert.equal(result.average,800);assert.equal(result.min,700);assert.equal(result.max,900);
 assert.equal(result.currency,'CAD');assert.equal(result.observedAt,now.toISOString());
 assert.throws(()=>normalizeFlightPrices({...data,search_parameters:{currency:'USD'}},'oneway'));
 assert.equal(normalizeFlightPrices({...data,best_flights:[],other_flights:[]},'oneway').available,false);
 assert.match(flightResultMarkup(result),/800/);assert.match(flightResultMarkup(result),/2 tarifs/);
});

test('Future dates, unknown airports, malformed dates and cross-site requests consume no search credit',async()=>{
 const unexpected=()=>{throw Error('Unexpected paid request')};
 assert.equal((await handleFlightPrices(request({...input,outbound:'2028-09-01'}),{},unexpected,now)).status,200);
 const future=await handleFlightPrices(request({...input,outbound:'2028-09-01'}),{},unexpected,now);assert.equal((await future.json()).available,false);
 assert.equal((await handleFlightPrices(request({...input,arrival:'XXX'}),{},unexpected,now)).status,400);
 assert.equal((await handleFlightPrices(request({...input,outbound:'2026-02-30'}),{},unexpected,now)).status,400);
 assert.equal((await handleFlightPrices(request({...input,outbound:'2026-99-99'}),{},unexpected,now)).status,400);
 assert.equal((await handleFlightPrices(request(input,'cross-site','https://other.example'),{},unexpected,now)).status,403);
 assert.equal((await handleFlightPrices(request(),{},unexpected,now)).status,503);
});

test('Flight search always originates at YUL, uses CAD and keeps the key on the server',async()=>{
 let url;
 const response=await handleFlightPrices(request(input,'oneway-success'),{SERPAPI_API_KEY:'fixture-secret'},async value=>{url=new URL(value);return Response.json(data)},now);
 assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'no-store');
 assert.equal(url.searchParams.get('departure_id'),'YUL');assert.equal(url.searchParams.get('arrival_id'),'BCN');assert.equal(url.searchParams.get('currency'),'CAD');assert.equal(url.searchParams.get('adults'),'1');assert.equal(url.searchParams.get('type'),'2');
 assert.doesNotMatch(await response.text(),/fixture-secret|api_key|search_metadata/);
 const failed=await handleFlightPrices(request(input,'fail'),{SERPAPI_API_KEY:'fixture-secret'},async()=>Response.json({error:'fixture-secret upstream detail'}),now);
 assert.equal(failed.status,502);assert.doesNotMatch(await failed.text(),/fixture-secret/);
});

test('Round trips account for a different disembarkation airport instead of pricing the wrong return',async()=>{
 let url;
 const body={...input,tripType:'roundtrip',returnAirport:'ATH',returnDate:'2026-11-10'};
 const response=await handleFlightPrices(request(body,'openjaw'),{SERPAPI_API_KEY:'fixture'},async value=>{url=new URL(value);return Response.json({search_parameters:{currency:'CAD',type:'3'},best_flights:[offer(1200,'AC822','Multi-city')]})},now);
 assert.equal(response.status,200);assert.equal((await response.json()).average,1200);
 assert.equal(url.searchParams.get('type'),'3');assert.deepEqual(JSON.parse(url.searchParams.get('multi_city_json')),[{departure_id:'YUL',arrival_id:'BCN',date:'2026-11-01'},{departure_id:'ATH',arrival_id:'YUL',date:'2026-11-10'}]);
 assert.equal(url.searchParams.has('outbound_date'),false);
});

test('Port coordinates propose nearby scheduled airports and allow the passenger to change dates or airports',()=>{
 assert.equal(nearbyAirports({lat:41.35,lon:2.17})[0].code,'BCN');
 assert.deepEqual(nearbyAirports({name:'Unknown'}),[]);
 const markup=flightsMarkup({date:'2026-11-05',endDate:'2026-11-12',stops:[{id:'bcn',name:'Barcelona'},{id:'ath',name:'Athens'}]},new Map([['bcn',{lat:41.35,lon:2.17}],['ath',{lat:37.94,lon:23.64}]]));
 assert.match(markup,/2026-11-03/);assert.match(markup,/2026-11-13/);assert.match(markup,/value="BCN"/);assert.match(markup,/value="ATH"/);assert.match(markup,/data-flight-type/);
 assert.doesNotMatch(flightResultMarkup({available:false,message:'<script>bad</script>'}),/<script>/);
});
