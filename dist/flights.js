import {airports} from './assets/airports.js';
import {flightWindow,flightWindowMessage} from './flight-window.js';
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD',currencyDisplay:'code',maximumFractionDigits:0}).format(n);
export function nearbyAirports(port){
  if(!Number.isFinite(port?.lat)||!Number.isFinite(port?.lon))return [];
  const rad=n=>n*Math.PI/180;
  return airports.map(a=>{const dy=rad(a.lat-port.lat),dx=rad(a.lon-port.lon);const d=Math.sin(dy/2)**2+Math.cos(rad(port.lat))*Math.cos(rad(a.lat))*Math.sin(dx/2)**2;return {...a,distance:6371*2*Math.atan2(Math.sqrt(d),Math.sqrt(1-d))}}).filter(a=>a.distance<=300).sort((a,b)=>a.distance-b.distance).slice(0,5);
}
const shiftDate=(value,days)=>{const d=new Date(value+'T12:00:00Z');if(!Number.isFinite(d.getTime()))return '';d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
const airportOptions=list=>list.map(a=>`<option value="${a.code}">${escape(a.city||a.name)} (${a.code}) · ~${Math.round(a.distance)} km</option>`).join('');
export function flightsMarkup(cruise,portById){
  const stops=cruise.stops||[],first=stops[0],last=stops.at(-1);
  if(!first)return '';
  const outbound=nearbyAirports(portById.get(first.id)),inbound=nearbyAirports(portById.get(last.id));
  if(!outbound.length)return '<section class="cruise-flights"><h3>Vols depuis Montréal</h3><p>Aéroport d’embarquement non identifié pour cette escale.</p></section>';
  return `<section class="cruise-flights"><div class="eyebrow">VOTRE VOYAGE DEPUIS MONTRÉAL · YUL</div><h3>Budget des vols</h3><p>Embarquement : ${first.name}${last?.id!==first.id?' · Débarquement : '+last.name:''}.</p><div class="flight-controls"><label>Trajet<select data-flight-type><option value="oneway">Aller simple</option>${inbound.length?'<option value="roundtrip">Aller-retour selon la croisière</option>':''}</select></label><label>Aéroport d’arrivée<select data-flight-arrival>${airportOptions(outbound)}</select></label><label>Départ de Montréal<input type="date" data-flight-outbound value="${shiftDate(cruise.date,-2)}"></label><label data-flight-return-control hidden>Aéroport du retour<select data-flight-return-airport>${airportOptions(inbound)}</select></label><label data-flight-return-control hidden>Date du retour<input type="date" data-flight-return-date value="${shiftDate(cruise.endDate,1)}"></label></div><p class="flight-note">Départ proposé deux jours avant l’embarquement, modifiable. Distances approximatives à vol d’oiseau ; transfert au port à prévoir.</p><button class="flight-search">Calculer le prix moyen en CAD</button><div class="flight-result" role="status" aria-live="polite">Consultez les tarifs pour vos dates, par adulte en classe économique.</div><a class="flight-google-link" href="https://www.google.com/travel/flights?hl=fr&gl=CA&curr=CAD" target="_blank" rel="noopener noreferrer">Comparer sur Google Flights</a></section>`;
}
export function flightResultMarkup(result){
  if(!result.available)return `<p>${escape(result.message||'Aucun tarif disponible pour ces dates.')}</p>`;
  return `<strong class="flight-average">${money(result.average)} <small>/ personne</small></strong><p>Moyenne de ${result.count} tarif${result.count>1?'s':''} retrouvé${result.count>1?'s':''} · de ${money(result.min)} à ${money(result.max)}.</p><p class="flight-note">${result.tripType==='oneway'?'Aller simple':'Aller-retour'} · classe économique · taxes selon la source. Les bagages et les transferts peuvent être en supplément. Ce montant couvre les offres retrouvées, pas tous les tarifs du marché.</p><p class="flight-note">Source : Google Flights via SerpApi · relevé le ${escape(new Date(result.observedAt).toLocaleString('fr-CA'))}.</p>`;
}
export function hydrateFlights(root){
  const section=root.querySelector('.cruise-flights'),button=section?.querySelector('.flight-search');if(!button)return;
  const type=section.querySelector('[data-flight-type]'),output=section.querySelector('.flight-result');let controller;
  const input=()=>({tripType:type.value,arrival:section.querySelector('[data-flight-arrival]').value,outbound:section.querySelector('[data-flight-outbound]').value,...(type.value==='roundtrip'?{returnAirport:section.querySelector('[data-flight-return-airport]').value,returnDate:section.querySelector('[data-flight-return-date]').value}:{})});
  const updateLink=()=>{const value=input();const query=`Vol ${value.tripType==='roundtrip'?'aller-retour':'aller simple'} Montréal YUL vers ${value.arrival} départ ${value.outbound}${value.returnDate?' retour '+value.returnAirport+' vers YUL le '+value.returnDate:''} prix CAD`;section.querySelector('.flight-google-link').href='https://www.google.com/travel/flights?hl=fr&gl=CA&curr=CAD&q='+encodeURIComponent(query)};
  section.querySelectorAll('input,select').forEach(control=>control.addEventListener('change',()=>{controller?.abort();button.disabled=false;section.querySelectorAll('[data-flight-return-control]').forEach(el=>el.hidden=type.value!=='roundtrip');output.textContent='Dates ou aéroport modifiés. Recalculez le prix moyen.';updateLink()}));
  button.addEventListener('click',async()=>{
    const value=input();if(!value.outbound||(value.tripType==='roundtrip'&&(!value.returnDate||value.returnDate<value.outbound))){output.textContent='Choisissez des dates de vol valides.';return}
    const {today,limit}=flightWindow();if(value.outbound<today){output.textContent='La date du vol est passée.';return}if(value.outbound>limit||value.returnDate>limit){output.textContent=flightWindowMessage;return}
    controller?.abort();const active=new AbortController();controller=active;button.disabled=true;output.textContent='Recherche des tarifs aériens…';
    try{const response=await fetch('/api/flight-prices',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(value),signal:AbortSignal.any([active.signal,AbortSignal.timeout(45000)])});const result=await response.json();if(!response.ok)throw Error(result.error||'Les tarifs aériens sont indisponibles.');if(!section.isConnected||active.signal.aborted)return;output.innerHTML=flightResultMarkup(result)}catch(error){if(section.isConnected&&!active.signal.aborted)output.textContent=error instanceof SyntaxError?'Les tarifs aériens ne sont pas encore connectés.':error.message==='Failed to fetch'?'Connexion indisponible. Réessayez.':error.message}finally{if(controller===active)button.disabled=false}
  });
  updateLink();
}
