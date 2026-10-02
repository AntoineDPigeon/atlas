import {airports} from '../dist/assets/airports.js';
import {flightWindow,flightWindowMessage} from '../dist/flight-window.js';
const known=new Set(airports.map(a=>a.code)),requests=new Map();
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
function validDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s}
function flightSourceFailure(data,status){
  if(status<400&&!data.error)return null;
  const message=typeof data.error==='string'?data.error:'';
  if(status===401||status===403||/invalid api key|api key.*(?:invalid|missing)|unauthorized/i.test(message))return {status:503,body:{code:'source_auth',error:'La clé SerpApi est refusée. Vérifiez le secret SERPAPI_API_KEY du Worker atlas.'}};
  if(status===429||/run out of searches|quota|search limit|plan.*limit/i.test(message))return {status:429,body:{code:'source_quota',error:'Quota des recherches SerpApi atteint. Vérifiez votre forfait ou réessayez après son renouvellement.'}};
  if(/(?:date|flight).*too far|date.*(?:future|range)|outbound_date.*(?:invalid|maximum)|return_date.*(?:invalid|maximum)/i.test(message))return {status:200,body:{available:false,code:'dates_too_far',message:flightWindowMessage}};
  if(/(?:hasn.t returned|no|not found|could not find|couldn.t find|unable to find).*?(?:results|flights)|no results returned/i.test(message))return {status:200,body:{available:false,code:'no_flights',message:'Aucun vol trouvé pour ces dates et cet aéroport. Essayez un aéroport voisin ou d’autres dates.'}};
  return {status:502,body:{code:'source_unavailable',error:'SerpApi n’a pas pu obtenir les tarifs Google Flights. Réessayez plus tard ou comparez directement sur Google Flights.'}};
}
export function normalizeFlightPrices(data,tripType,observedAt=new Date().toISOString()){
  if(data.search_parameters?.currency!=='CAD')throw Error('Currency not confirmed');
  const expected=tripType==='oneway'?'One way':data.search_parameters?.type==='3'||data.search_parameters?.type===3?'Multi-city':'Round trip';
  const unique=new Map();
  for(const offer of [...(Array.isArray(data.best_flights)?data.best_flights:[]),...(Array.isArray(data.other_flights)?data.other_flights:[])]){
    if(offer.type!==expected||!Number.isFinite(offer.price)||offer.price<=0||!offer.flights?.length)continue;
    const key=JSON.stringify(offer.flights.map(f=>[f.flight_number,f.departure_airport?.id,f.departure_airport?.time,f.arrival_airport?.id,f.arrival_airport?.time]));
    if(!unique.has(key)||unique.get(key)>offer.price)unique.set(key,offer.price);
  }
  const prices=[...unique.values()];
  if(!prices.length)return {available:false,message:'Aucun tarif disponible pour ces dates. Essayez une autre date ou un aéroport voisin.'};
  return {available:true,currency:'CAD',tripType,count:prices.length,average:Math.round(prices.reduce((a,b)=>a+b,0)/prices.length),min:Math.min(...prices),max:Math.max(...prices),observedAt};
}
export async function handleFlightPrices(request,env,fetcher=fetch,now=new Date()){
  if(request.method!=='POST')return json({error:'Méthode non autorisée.'},405);
  const origin=request.headers.get('Origin');if((origin&&origin!==new URL(request.url).origin)||request.headers.get('Sec-Fetch-Site')==='cross-site')return json({error:'Accès non autorisé.'},403);
  let input;
  try{if(Number(request.headers.get('Content-Length'))>1024)return json({error:'Requête trop grande.'},413);const body=await request.text();if(body.length>1024)return json({error:'Requête trop grande.'},413);input=JSON.parse(body);if(!input||!['oneway','roundtrip'].includes(input.tripType)||!known.has(input.arrival)||!validDate(input.outbound)||input.tripType==='roundtrip'&&(!known.has(input.returnAirport)||!validDate(input.returnDate)||input.returnDate<input.outbound))return json({error:'Choisissez des dates et des aéroports valides.'},400)}catch{return json({error:'Recherche de vol invalide.'},400)}
  const {today,limit}=flightWindow(now);
  if(input.outbound<today)return json({error:'La date du vol est passée.'},400);
  if(input.outbound>limit||input.tripType==='roundtrip'&&input.returnDate>limit)return json({available:false,code:'dates_too_far',message:flightWindowMessage});
  if(!env.SERPAPI_API_KEY)return json({error:'Les tarifs aériens ne sont pas encore connectés. Vous pouvez comparer les vols sur Google Flights.'},503);
  const ip=request.headers.get('CF-Connecting-IP')||'local',time=now.getTime(),recent=(requests.get(ip)||[]).filter(t=>time-t<60000);
  if(recent.length>=5)return json({error:'Trop de recherches de vols. Réessayez dans une minute.'},429);
  if(requests.size>=1000)requests.clear();requests.set(ip,[...recent,time]);
  const params=new URLSearchParams({engine:'google_flights',currency:'CAD',gl:'ca',hl:'fr',adults:'1',travel_class:'1',stops:'2',deep_search:'true',api_key:env.SERPAPI_API_KEY});
  if(input.tripType==='roundtrip'&&input.returnAirport!==input.arrival){params.set('type','3');params.set('multi_city_json',JSON.stringify([{departure_id:'YUL',arrival_id:input.arrival,date:input.outbound},{departure_id:input.returnAirport,arrival_id:'YUL',date:input.returnDate}]))}else{params.set('type',input.tripType==='roundtrip'?'1':'2');params.set('departure_id','YUL');params.set('arrival_id',input.arrival);params.set('outbound_date',input.outbound);if(input.tripType==='roundtrip')params.set('return_date',input.returnDate)}
  try{
    const response=await fetcher('https://serpapi.com/search.json?'+params,{signal:AbortSignal.timeout(35000)});
    const data=await response.json();
    const failure=flightSourceFailure(data,response.status);if(failure)return json(failure.body,failure.status);
    return json(normalizeFlightPrices(data,input.tripType,now.toISOString()));
  }catch{return json({error:'Les tarifs aériens sont temporairement indisponibles.'},502)}
}
