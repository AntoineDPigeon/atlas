import * as THREE from './assets/three.module.js';
import {ratingMarkup,hydrateRatings,reviewLinks} from './ratings.js';
import {createSeaRouter} from './sea-routes.js';
import {photos,ports,companies,regions,cruises,durations,returnDate,filterCruises} from './data.js';
import {feed,progress,sourceProgress,loadCruises,loadDetails} from './feed.js';
const $=s=>document.querySelector(s);
function defaultDates(){return {start:'2028-09-01',end:'2028-09-30'}}
const state={...defaultDates(),budget:3000,company:'all',duration:'all',region:'all',ports:[],sort:'recommended',selected:null};
for(const key of ['start','end'])$('#'+key).value=state[key];
const portById=new Map(ports.map(p=>[p.id,p]));
const money=n=>new Intl.NumberFormat('fr-CA',{style:'currency',currency:'CAD',currencyDisplay:'code',maximumFractionDigits:0}).format(n);
const date=d=>new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
function portRating(p,options){return ratingMarkup('port',p?.ratingName||p?.name||'',p?.ratingId,options)}
function boatRating(c,options){return ratingMarkup('boat',c.ship,c.shipRatingId,options)}
let globe;
const mobileScreen=matchMedia('(max-width: 800px)');
const draftDates={start:state.start,end:state.end};
function datesChanged(){return draftDates.start!==state.start||draftDates.end!==state.end}
function validDraftDates(){return !!draftDates.start&&!!draftDates.end&&draftDates.start<=draftDates.end}
function searchWithDates(){if(feed.loading)return;if(!validDraftDates()){$('#filter-error').hidden=false;$('#filter-error').textContent='Choisissez les deux dates, avec le retour après le départ.';return}Object.assign(state,draftDates);closeMobileFilters(true);loadCruises({...state},false,render)}
$('#search-dates').addEventListener('click',searchWithDates);
function setMobileView(view){document.body.dataset.mobileView=view;document.querySelectorAll('.mobile-nav button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mobileView===view)));if(mobileScreen.matches)window.scrollTo({top:0,behavior:'instant'})}
function closeMobileFilters(results=false){document.body.classList.remove('filters-open');$('#filters-backdrop').hidden=true;$('#mobile-filters').setAttribute('aria-expanded','false');if(results)setMobileView('results')}
$('#mobile-filters').addEventListener('click',()=>{document.body.classList.add('filters-open');$('#filters-backdrop').hidden=false;$('#mobile-filters').setAttribute('aria-expanded','true');$('#close-filters').focus()});
$('#close-filters').addEventListener('click',()=>closeMobileFilters());$('#filters-backdrop').addEventListener('click',()=>closeMobileFilters());$('#apply-filters').addEventListener('click',()=>{if(datesChanged())searchWithDates();else closeMobileFilters(true)});
document.querySelectorAll('.mobile-nav button').forEach(b=>b.addEventListener('click',()=>setMobileView(b.dataset.mobileView)));
mobileScreen.addEventListener('change',()=>{if(!mobileScreen.matches)closeMobileFilters()});

function eligible(){return state.start&&state.end&&state.start>state.end?[]:filterCruises(state)}
function selectCruise(id){state.selected=state.selected===id?null:id;render();if(state.selected)globe?.focusCruise(cruises.find(c=>c.id===state.selected))}
function selectPort(id){const adding=!state.ports.includes(id);state.ports=adding?[...state.ports,id]:state.ports.filter(p=>p!==id);state.selected=null;render();if(adding)globe?.focusPort(portById.get(id));$('#port-list').hidden=true;$('#ports-toggle').setAttribute('aria-expanded','false')}
function portChips(){return state.ports.map(id=>`<div class="port-chip"><span>⌖ ${portById.get(id).name}<small>${portRating(portById.get(id))}</small></span><button data-remove-port="${id}" aria-label="Retirer ${portById.get(id).name} des escales sélectionnées">×</button></div>`).join('')}
function clearPorts(){state.ports=[];state.selected=null;render()}
function reset(){Object.assign(draftDates,defaultDates());Object.assign(state,{budget:3000,company:'all',duration:'all',region:'all',ports:[],selected:null,sort:'recommended'});for(const k of ['start','end'])$('#'+k).value=draftDates[k];for(const k of ['budget','company','duration','sort'])$('#'+k).value=state[k];render();globe?.recenter()}
function img(p,alt=''){return `<img src="${p.url}" alt="${alt||p.label}" loading="lazy" referrerpolicy="no-referrer">`}
function renderDateSearch(){
  const pending=datesChanged(),invalid=!validDraftDates();
  $('#date-search-bar').hidden=!pending;$('#date-draft-note').hidden=!pending;
  $('#date-search-message').textContent=invalid?'Choisissez les deux dates, avec le retour après le départ.':'Nouvelles dates : '+date(draftDates.start)+' '+draftDates.start.slice(0,4)+' — '+date(draftDates.end)+' '+draftDates.end.slice(0,4)+'. Les résultats actuels restent affichés.';
  $('#search-dates').disabled=invalid||feed.loading;
  $('#apply-filters').textContent=pending?'Rechercher avec ces dates':'Afficher les croisières';
  $('#apply-filters').disabled=pending&&(invalid||feed.loading);
  $('#filter-error').hidden=!invalid;$('#filter-error').textContent='Choisissez les deux dates, avec le retour après le départ.';
}
function render(){
  ports.forEach(p=>portById.set(p.id,p));
  const list=eligible();if(!list.some(c=>c.id===state.selected))state.selected=null;
  $('#mobile-count').textContent=list.length;
  const periodLabel=state.start&&state.end?date(state.start)+' — '+date(state.end)+' '+state.end.slice(0,4):'Choisir les dates';
  $('#mobile-period').textContent=periodLabel;
  $('#mobile-summary').textContent=money(state.budget)+' / personne'+(state.duration==='all'?'':' · '+$('#duration').selectedOptions[0].textContent);
  const filterCount=Number(state.company!=='all')+Number(state.duration!=='all')+Number(state.region!=='all')+state.ports.length;
  $('#filter-badge').hidden=!filterCount;$('#filter-badge').textContent=filterCount;
  renderDateSearch();
  $('#budget-value').textContent='Jusqu’à '+money(state.budget);
  $('#count').innerHTML=`<strong>${list.length}</strong> départ${list.length>1?'s':''} disponible${list.length>1?'s':''}`;
  $('#source-status').textContent=feed.loading?'Vérification des départs auprès des sept sources connectées…':feed.status+(feed.checkedAt?' · Vérifié à '+new Intl.DateTimeFormat('fr-CA',{hour:'2-digit',minute:'2-digit'}).format(new Date(feed.checkedAt)):'')+(feed.error?' · '+feed.error:'');
  $('#catalog-loading').hidden=!feed.loading;
  document.querySelector('main').setAttribute('aria-busy',String(feed.loading));
  const loadingProgress=progress();
  $('#catalog-progress').max=Math.max(loadingProgress.total,1);
  if(loadingProgress.known)$('#catalog-progress').value=loadingProgress.loaded;else $('#catalog-progress').removeAttribute('value');
  $('#loading-count').textContent=loadingProgress.known?loadingProgress.loaded+' / '+loadingProgress.total+' itinéraires examinés':loadingProgress.loaded?loadingProgress.loaded+' itinéraires examinés…':'Connexion aux compagnies…';
  $('#loading-sources').innerHTML=sourceProgress().map(s=>`<tr class="source-${s.status}"><th scope="row">${s.name}</th><td><span class="source-count">${s.loaded} / ${s.total||(s.status==='complete'?0:'—')}</span><span class="source-state">${s.status==='error'?'Indisponible':s.status==='pending'?'En attente':s.status==='complete'?'Terminé':s.total?'Chargement…':'Connexion…'}${s.failed?' · '+s.failed+' indisponible'+(s.failed>1?'s':''):''}</span></td></tr>`).join('');
  $('#retry-source').hidden=!feed.error;$('#refresh-source').disabled=feed.loading;
  $('#date-error').hidden=!(state.start&&state.end&&state.start>state.end);$('#date-error').textContent='La date de retour doit être après la date de départ.';
  $('#active-port').innerHTML=state.ports.length?`<p class="ports-match-note">Les croisières doivent inclure toutes ces escales.</p><div class="selected-port-chips">${portChips()}</div><button class="clear-ports" data-clear-ports>Effacer les escales</button>`:'';
  document.querySelectorAll('[data-region]').forEach(b=>b.classList.toggle('active',b.dataset.region===state.region));
  $('#cards').innerHTML=list.map(c=>{
    const selected=c.id===state.selected;const names=[...new Set(c.ports)].map(id=>portById.get(id).short||portById.get(id).name);
    return `<article class="cruise-card ${selected?'selected':''}" data-cruise="${c.id}"><button class="card-main" data-select="${c.id}" aria-pressed="${selected}" aria-label="${selected?'Masquer':'Afficher'} l’itinéraire : ${c.title}"><div class="card-image">${c.image?img({url:c.image,label:c.title}):''}<span class="region-tag">${regions[c.region]}</span></div><div class="card-content"><div class="card-company">${c.company}${c.sourceName?' · '+c.sourceName:''}<span>${selected?'● Itinéraire affiché':''}</span></div><h3 class="card-title">${c.title}</h3><div class="card-route">${names.slice(0,3).join(' · ')}${names.length>3?` · +${names.length-3} escales`:''}</div><div class="card-footer"><div class="date-line">${date(c.date)} — ${date(returnDate(c))} ${c.date.slice(0,4)}<br>${c.nights} nuits · ${c.ship}<span class="ship-rating-line">${boatRating(c)}</span></div><div class="price">${money(c.price)}<small>dès / personne · ${c.cabin}</small></div></div></div></button>${selected?`<div class="card-details"><div class="card-stops">${c.ports.map(id=>portById.get(id).short||portById.get(id).name).join(' → ')}</div><div class="card-actions"><button class="detail-button" data-detail="${c.id}">Découvrir les escales</button><button class="mobile-route-button" data-route="${c.id}">Voir sur le globe</button></div></div>`:''}</article>`
  }).join('')||`<div class="empty"><h3>${feed.loading?'Vos voyages se dessinent…':feed.error?'La source est indisponible':'Un autre horizon ?'}</h3><p>${feed.loading?'Nous vérifions les dates et les prix en CAD.':feed.error?'Réessayez avec le bouton ci-dessous.':'Aucun départ ne correspond à ces filtres. Ajustez vos critères.'}</p>${!feed.loading&&!feed.error?'<button id="empty-reset">Réinitialiser les filtres</button>':''}</div>`;
  document.querySelectorAll('[data-select]').forEach(b=>b.addEventListener('click',()=>selectCruise(b.dataset.select)));
  document.querySelectorAll('[data-detail]').forEach(b=>b.addEventListener('click',()=>showDetail(b.dataset.detail)));
  document.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>{setMobileView('globe');globe?.focusCruise(cruises.find(c=>c.id===b.dataset.route))}));
  $('#empty-reset')?.addEventListener('click',reset);
  const counts=new Map(ports.map(p=>[p.id,list.filter(c=>c.ports.includes(p.id)).length]));
  $('#port-list').innerHTML='<div class="list-head">AJOUTEZ OU RETIREZ UNE ESCALE</div>'+ports.filter(p=>counts.get(p.id)||state.ports.includes(p.id)).sort((a,b)=>a.name.localeCompare(b.name,'fr')).map(p=>`<button data-port="${p.id}" class="${state.ports.includes(p.id)?'active':''}" aria-pressed="${state.ports.includes(p.id)}">${state.ports.includes(p.id)?'✓ ':''}<span class="port-name">${p.name}<small>${portRating(p)}</small></span><span>${counts.get(p.id)} départ${counts.get(p.id)>1?'s':''}</span></button>`).join('');
  document.querySelectorAll('#port-list [data-port]').forEach(b=>b.addEventListener('click',()=>selectPort(b.dataset.port)));
  const c=cruises.find(c=>c.id===state.selected);
  $('#map-selection').hidden=!c&&!state.ports.length;
  $('#map-selection').classList.toggle('ports-selection',!c&&state.ports.length>0);
  $('.map-panel').classList.toggle('has-port-selection',!c&&state.ports.length>0);
  $('#map-selection').innerHTML=c?`<button class="close-selection" aria-label="Fermer l’itinéraire">×</button><div class="eyebrow">ITINÉRAIRE · ${c.company}</div><h3>${c.title}</h3><p>${c.company} · ${date(c.date)} · ${c.nights} nuits</p><div class="route-key"><span class="legend-route"></span>${new Set(c.ports).size} ports à découvrir</div><button class="mobile-map-detail" data-map-detail="${c.id}">Découvrir les escales</button>`:state.ports.length?`<div class="eyebrow">${state.ports.length} ESCALE${state.ports.length>1?'S':''} SÉLECTIONNÉE${state.ports.length>1?'S':''}</div><p>${list.length} départ${list.length>1?'s':''} avec toutes ces escales.</p><div class="selected-port-chips">${portChips()}</div><div class="port-selection-actions"><button class="clear-ports" data-clear-ports>Effacer les escales</button><button class="mobile-map-detail" data-port-results>Voir les ${list.length} croisière${list.length>1?'s':''}</button></div>`:'';
  $('[data-map-detail]')?.addEventListener('click',e=>showDetail(e.currentTarget.dataset.mapDetail));
  $('#map-selection .close-selection')?.addEventListener('click',()=>{if(state.selected)state.selected=null;else state.ports=[];render()});
  document.querySelectorAll('[data-remove-port]').forEach(b=>b.addEventListener('click',()=>selectPort(b.dataset.removePort)));
  document.querySelectorAll('[data-clear-ports]').forEach(b=>b.addEventListener('click',clearPorts));
  $('[data-port-results]')?.addEventListener('click',()=>setMobileView('results'));
  globe?.update(list,c,counts);hydrateRatings();
}
function showDialog(content){$('#dialog-content').innerHTML=content;$('#detail-dialog').showModal();$('#dialog-content .close-dialog').addEventListener('click',()=>$('#detail-dialog').close())}
async function showDetail(id){const c=cruises.find(c=>c.id===id);if(!c)return;showDialog('<div class="dialog-top"><h2>Vos escales</h2><button class="close-dialog" aria-label="Fermer">×</button></div><div class="dialog-body"><p>Vérification de l’itinéraire officiel…</p></div>');try{await loadDetails(c);ports.forEach(p=>portById.set(p.id,p));render();$('#dialog-content').innerHTML=`<div class="dialog-top"><div><div class="eyebrow">ITINÉRAIRE · ${c.company}</div><h2>${c.title}</h2></div><button class="close-dialog" aria-label="Fermer">×</button></div><div class="dialog-body"><div class="dialog-summary"><span><strong>${c.company}</strong> · ${c.ship}</span><span>${date(c.date)} — ${date(c.endDate)} ${c.date.slice(0,4)}</span><span>${c.nights} nuits</span><span>${boatRating(c,{link:true})}${reviewLinks('boat',c.ship,{company:c.company})}</span><strong>Dès ${money(c.price)} / personne · ${c.cabin}</strong></div><ol class="stop-list">${c.stops.map((p,i)=>`<li><span class="stop-number">${i+1}</span><div>${p.name}<span class="stop-rating">${portRating(portById.get(p.id),{link:true})}${reviewLinks('port',portById.get(p.id)?.name||p.name,{portId:p.id})}</span><small>Jour ${p.day} · ${i===0?'Embarquement':i===c.stops.length-1?'Débarquement':'Escale'}</small></div></li>`).join('')}</ol><div class="destination-gallery">${!c.stops.some(p=>p.image)&&c.image?`<figure>${img({url:c.image,label:c.title})}<figcaption>Photo de l’itinéraire : ${c.sourceName||c.company}</figcaption></figure>`:''}${[...new Map(c.stops.filter(p=>p.image).map(p=>[p.id,p])).values()].map(p=>`<figure>${img({url:p.image,label:p.name})}<figcaption><span>${p.name}</span><a href="${c.sourceUrl}" target="_blank" rel="noopener noreferrer">Photo : ${c.sourceName||c.company}</a></figcaption></figure>`).join('')}</div><p class="dialog-note">Prix en CAD relevé chez ${c.sourceName||c.company} pour ce départ. ${c.sourceName==='cruise.ca'?'Offre de '+c.company+' vendue par cruise.ca ; taxes incluses dans le montant affiché, conditions et disponibilités à confirmer auprès de l’agence.':c.provider==='celebrity'?(c.taxesIncluded?'Taxes et frais inclus selon Celebrity.':'Taxes et frais à confirmer chez Celebrity.'):'Catégorie de cabine : '+c.cabin+'.'} Prix par personne, selon les conditions de la compagnie, à confirmer avant réservation. Vérifié le ${new Date(c.observedAt).toLocaleString('fr-CA')}. Le tracé et les positions des ports sont indicatifs. Certaines escales non localisées peuvent ne pas apparaître sur le globe.</p><a class="company-link" href="${c.sourceUrl}" target="_blank" rel="noopener noreferrer">${c.sourceName==='cruise.ca'?'Voir l’offre '+c.company+' sur cruise.ca':'Voir ce départ chez '+c.company}</a></div>`;}catch(e){$('#dialog-content').innerHTML='<div class="dialog-top"><h2>Escales indisponibles</h2><button class="close-dialog" aria-label="Fermer">×</button></div><div class="dialog-body"><p>La compagnie ne répond pas pour cet itinéraire. Réessayez ou consultez le départ sur le site officiel.</p><a class="company-link" href="'+c.sourceUrl+'" target="_blank" rel="noopener noreferrer">Voir le départ officiel</a></div>';}$('#dialog-content .close-dialog')?.addEventListener('click',()=>$('#detail-dialog').close());hydrateRatings($('#dialog-content'))}
$('#detail-dialog').addEventListener('click',e=>{if(e.target===$('#detail-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()}});
$('#about').addEventListener('click',()=>showDialog('<div class="dialog-top"><div><div class="eyebrow">ATLAS · 7 COMPAGNIES</div><h2>Le voyage commence ici.</h2></div><button class="close-dialog" aria-label="Fermer">×</button></div><div class="dialog-body about-copy"><p>Les départs Norwegian et Celebrity proviennent de leurs moteurs publics canadiens. Les offres Costa, Princess, MSC, Royal Caribbean et Holland America proviennent de l’agence canadienne cruise.ca ; les prix sont ceux de l’agence pour chaque date de départ, sans conversion monétaire. Seuls les tarifs positifs en CAD sont affichés. Celebrity fournit le meilleur tarif affiché par départ pour deux adultes ; Norwegian indique la catégorie de cabine disponible.</p><p>Chaque recherche charge automatiquement tous les itinéraires, par lots de douze pour chaque compagnie. La progression s’affiche au centre de l’écran ; le séjour complet doit entrer dans vos dates. Les réponses sont conservées jusqu’à cinq minutes.</p><p>Les photos et escales viennent des compagnies ou de cruise.ca, selon la source indiquée. Les lignes et positions sont indicatives. Certaines escales sans coordonnées restent dans la liste sans être tracées. Les prix, taxes, occupation et disponibilités doivent être confirmés sur le lien officiel du départ.</p><p>Ces connexions utilisent les moteurs publics des compagnies et de cruise.ca, sans contrat d’API. Un changement de source peut interrompre une connexion ; les offres des autres compagnies restent accessibles. Atlas ne couvre pas encore les autres compagnies.</p></div>'));


for(const key of ['start','end'])$('#'+key).addEventListener('input',e=>{draftDates[key]=e.target.value;renderDateSearch()});
for(const key of ['budget','company','duration','sort'])$('#'+key).addEventListener(key==='budget'?'input':'change',e=>{state[key]=key==='budget'?Number(e.target.value):e.target.value;render()});
$('#retry-source').addEventListener('click',()=>loadCruises({...state},false,render));$('#refresh-source').addEventListener('click',()=>loadCruises({...state},false,render));
$('#reset').addEventListener('click',reset);
document.querySelectorAll('[data-region]').forEach(b=>b.addEventListener('click',()=>{state.region=b.dataset.region;state.selected=null;render();globe?.focusRegion(state.region)}));
$('#ports-toggle').addEventListener('click',()=>{const show=$('#port-list').hidden;$('#port-list').hidden=!show;$('#ports-toggle').setAttribute('aria-expanded',String(show))});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(document.body.classList.contains('filters-open'))closeMobileFilters();$('#port-list').hidden=true;$('#ports-toggle').setAttribute('aria-expanded','false')}});
render();
loadCruises({...state},false,render);

async function createGlobe(){
  const host=$('#globe');const scene=new THREE.Scene();const camera=new THREE.OrthographicCamera(-3,3,2.5,-2.5,.1,100);camera.position.set(0,0,8);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(Math.max(devicePixelRatio,1.5),2.5));renderer.setClearColor(0,0);host.prepend(renderer.domElement);
  const world=new THREE.Group();scene.add(world);const radius=2;
  const vector=(lat,lon,r=radius)=>{const a=lat*Math.PI/180,b=lon*Math.PI/180;return new THREE.Vector3(r*Math.cos(a)*Math.sin(b),r*Math.sin(a),r*Math.cos(a)*Math.cos(b))};
  let targetQ=new THREE.Quaternion();const setFocus=(lat,lon)=>{const direction=vector(lat,lon,1);const eye=new THREE.Vector3(0,0,1);const q=new THREE.Quaternion().setFromUnitVectors(direction,eye);const north=new THREE.Vector3(0,1,0).applyQuaternion(q);const angle=Math.atan2(north.x,north.y);targetQ=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),angle).multiply(q)};
  setFocus(46,12);world.quaternion.copy(targetQ);
  const oceanMaterial=new THREE.MeshBasicMaterial({color:0x244857});const sphere=new THREE.Mesh(new THREE.SphereGeometry(radius,192,128),oceanMaterial);sphere.rotation.y=-Math.PI/2;world.add(sphere);
  const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(2.035,64,48),new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,uniforms:{glowColor:{value:new THREE.Color('#82b4bb')}},vertexShader:'varying vec3 vNormal; varying vec3 vPosition; void main(){vNormal=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.0);vPosition=p.xyz;gl_Position=projectionMatrix*p;}',fragmentShader:'uniform vec3 glowColor;varying vec3 vNormal;varying vec3 vPosition;void main(){float f=pow(1.0-abs(dot(normalize(vNormal),normalize(-vPosition))),4.0);gl_FragColor=vec4(glowColor,f*0.38);}'}));world.add(atmosphere);
  function applyGeography(geo,width){
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=width/2;const ctx=canvas.getContext('2d');ctx.fillStyle='#244756';ctx.fillRect(0,0,width,width/2);
    ctx.fillStyle='#42636c';ctx.strokeStyle='#65848b';ctx.lineWidth=Math.max(.8,width/4096);
    for(const feature of geo.features){if(!feature.geometry)continue;const polygons=feature.geometry.type==='Polygon'?[feature.geometry.coordinates]:feature.geometry.coordinates;for(const polygon of polygons){ctx.beginPath();for(const ring of polygon){ring.forEach(([lon,lat],i)=>{const x=(lon+180)/360*width,y=(90-lat)/180*(width/2);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath()}ctx.fill('evenodd');ctx.stroke()}}
    ctx.strokeStyle='#90adb81a';ctx.lineWidth=Math.max(.6,width/4096);for(let lon=0;lon<=360;lon+=15){ctx.beginPath();ctx.moveTo(lon/360*width,0);ctx.lineTo(lon/360*width,width/2);ctx.stroke()}for(let lat=0;lat<=180;lat+=15){ctx.beginPath();ctx.moveTo(0,lat/180*(width/2));ctx.lineTo(width,lat/180*(width/2));ctx.stroke()}
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
    const previous=oceanMaterial.map;oceanMaterial.map=texture;oceanMaterial.color.set('#ffffff');oceanMaterial.needsUpdate=true;previous?.dispose();
  }
  const geo=await fetch('./assets/countries.geojson').then(r=>{if(!r.ok)throw Error('Contours indisponibles');return r.json()});
  const seaRoute=createSeaRouter(geo);
  applyGeography(geo,Math.min(2048,renderer.capabilities.maxTextureSize));
  const detailedWidth=Math.min(matchMedia('(max-width: 800px)').matches?4096:8192,renderer.capabilities.maxTextureSize);
  // Upgrade progressively; a failed HD load keeps the base map usable.
  fetch('./assets/countries-hd.geojson').then(r=>{if(!r.ok)throw Error('Contours HD indisponibles');return r.json()}).then(details=>{applyGeography(details,detailedWidth);host.dataset.definition=String(detailedWidth)}).catch(error=>console.warn('La carte de base reste disponible.',error));
  const countryLabels=[['ESPAGNE',39.8,-3.6],['FRANCE',47,1.2],['ITALIE',44.5,12.5],['GRÈCE',39.5,24],['NORVÈGE',66,10],['SUÈDE',64,19],['FINLANDE',66,28],['ALLEMAGNE',51.5,10],['ROYAUME-UNI',54.5,-4],['POLOGNE',53,20],['TURQUIE',40,34],['AFRIQUE DU NORD',28,13]];
  const countryElements=countryLabels.map(([name,lat,lon])=>{const el=document.createElement('span');el.className='country-label';el.textContent=name;Object.assign(el.style,{position:'absolute',fontSize:'9px',letterSpacing:'2px',color:'#adc2c07a',pointerEvents:'none',whiteSpace:'nowrap',transform:'translate(-50%,-50%)'});$('#port-labels').append(el);return{el,position:vector(lat,lon,2.012)}});
  const markerElements=ports.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)).map(p=>{const el=document.createElement('button');el.className='port-marker';el.setAttribute('aria-label',`Filtrer les croisières passant par ${p.name}`);el.innerHTML=`<span class="marker-dot"></span><span class="marker-text">${p.short||p.name} <span class="globe-rating">${portRating(p,{compact:true})}</span></span><span class="port-count"></span>`;el.addEventListener('click',()=>selectPort(p.id));$('#port-labels').append(el);return{el,p,position:vector(p.lat,p.lon,2.026)}});
  const routes=new THREE.Group();world.add(routes);let zoom=1.4;let w=0,h=0;
  function resize(){if(!host.clientWidth||!host.clientHeight)return;w=host.clientWidth;h=host.clientHeight;renderer.setSize(w,h);const view=5.5;camera.left=-view*w/h/2;camera.right=view*w/h/2;camera.top=view/2;camera.bottom=-view/2;camera.zoom=zoom;camera.updateProjectionMatrix()}
  new ResizeObserver(resize).observe(host);resize();
  function setZoom(value){zoom=THREE.MathUtils.clamp(value,.7,16);camera.zoom=zoom;camera.updateProjectionMatrix();$('#zoom-in').disabled=zoom>=16;$('#zoom-out').disabled=zoom<=.7;host.dataset.zoom=String(zoom)}
  $('#zoom-in').addEventListener('click',()=>setZoom(zoom*1.18));$('#zoom-out').addEventListener('click',()=>setZoom(zoom/1.18));$('#recenter').addEventListener('click',()=>{setFocus(46,12);setZoom(1.4)});
  renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();setZoom(zoom*Math.exp(-e.deltaY*.001))},{passive:false});
  const pointers=new Map();let drag=null,pinch=null,gestureStart=null,gestureMoved=false;
  host.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;if(!pointers.size){gestureMoved=false;gestureStart={x:e.clientX,y:e.clientY}}pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});drag={x:e.clientX,y:e.clientY};if(pointers.size===2){const [a,b]=[...pointers.values()];pinch={distance:Math.hypot(a.x-b.x,a.y-b.y),zoom};gestureMoved=true}});
  host.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;if(gestureStart&&Math.hypot(e.clientX-gestureStart.x,e.clientY-gestureStart.y)>6)gestureMoved=true;if(gestureMoved)host.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&pinch){const [a,b]=[...pointers.values()];setZoom(pinch.zoom*Math.hypot(a.x-b.x,a.y-b.y)/pinch.distance);return}if(!drag||!gestureMoved)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;const qx=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),dx*.004/zoom);const qy=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),dy*.004/zoom);world.quaternion.premultiply(qx).premultiply(qy);targetQ.copy(world.quaternion);drag={x:e.clientX,y:e.clientY}});
  const end=e=>{pointers.delete(e.pointerId);pinch=null;drag=pointers.size?{...[...pointers.values()][0]}:null};host.addEventListener('pointerup',end);host.addEventListener('pointercancel',end);
  host.addEventListener('click',e=>{if(gestureMoved&&e.detail){e.preventDefault();e.stopPropagation();gestureMoved=false}},true);
  function project(point){const v=point.clone().applyQuaternion(world.quaternion);const visible=v.z>0.15;v.project(camera);return{x:(v.x+1)*w/2,y:(1-v.y)*h/2,visible:visible&&Math.abs(v.x)<1.08&&Math.abs(v.y)<1.08}}
  const clusterLabels=new Map();
  function showNearbyPorts(members){
    $('#port-list').innerHTML='<div class="list-head">CHOISISSEZ UNE ESCALE PROCHE</div>'+members.map(m=>`<button data-nearby-port="${m.p.id}" aria-pressed="${state.ports.includes(m.p.id)}" class="${state.ports.includes(m.p.id)?'active':''}"><span class="port-name">${state.ports.includes(m.p.id)?'✓ ':''}${m.p.name}<small>${portRating(m.p)}</small></span><span>${m.el.querySelector('.port-count').textContent} départs</span></button>`).join('');
    $('#port-list').hidden=false;$('#ports-toggle').setAttribute('aria-expanded','true');
    $('#port-list').querySelectorAll('[data-nearby-port]').forEach(b=>b.addEventListener('click',()=>selectPort(b.dataset.nearbyPort)));
    hydrateRatings($('#port-list'));
  }
  function drawLabels(){
    countryElements.forEach(m=>{const p=project(m.position);m.el.hidden=!p.visible;m.el.style.left=p.x+'px';m.el.style.top=p.y+'px'});
    const ordered=markerElements.slice().sort((a,b)=>Number(b.el.classList.contains('chosen'))*2+Number(b.el.classList.contains('on-route'))-Number(a.el.classList.contains('chosen'))*2-Number(a.el.classList.contains('on-route')));
    const groups=[],labelWidth=Math.min(150,w-16);
    for(const m of ordered){
      const p=project(m.position);m.el.hidden=true;
      if(!p.visible||(m.el.classList.contains('dim')&&!m.el.classList.contains('chosen')))continue;
      if(state.selected&&!m.el.classList.contains('on-route')&&!m.el.classList.contains('chosen'))continue;
      const x=Math.max(8,Math.min(w-labelWidth-8,p.x));
      const y=Math.max(24,Math.min(h-24,p.y));
      const group=groups.find(g=>Math.hypot(g.px-p.x,g.py-p.y)<45);
      if(group)group.members.push(m);else groups.push({x,y,px:p.x,py:p.y,members:[m]});
    }
    const activeKeys=new Set(),boxes=[];let layer=groups.length;
    for(const g of groups){
      let el;
      if(g.members.length===1){el=g.members[0].el;el.querySelector('.marker-text').style.display=''}
      else{
        const key=g.members.map(m=>m.p.id).sort().join('|');activeKeys.add(key);
        el=clusterLabels.get(key);
        if(!el){el=document.createElement('button');el.className='port-marker cluster-marker';el.addEventListener('click',()=>showNearbyPorts(g.members));$('#port-labels').append(el);clusterLabels.set(key,el)}
        const name=g.members[0].p.short||g.members[0].p.name;
        const label=name+' · +'+(g.members.length-1)+' ports';if(el.textContent!==label)el.textContent=label;
        el.title=g.members.map(m=>m.p.name).join(' · ');
        el.setAttribute('aria-label','Choisir parmi les ports proches : '+g.members.map(m=>m.p.name).join(', '));
        el.classList.toggle('chosen',g.members.some(m=>state.ports.includes(m.p.id)));
      }
      const candidates=[];
      for(const offset of [0,-44,44,-88,88,-132,132,-176,176,-220,220,-264,264])for(const x of [g.x,Math.max(8,g.px-labelWidth),8,w-labelWidth-8]){
        const y=g.y+offset;if(y<24||y>h-24)continue;
        candidates.push({x,y,distance:Math.hypot(x-g.x,y-g.y)});
      }
      const pos=candidates.sort((a,b)=>a.distance-b.distance).find(a=>!boxes.some(b=>Math.abs(a.y-b.y)<42&&a.x<b.x+labelWidth+8&&a.x+labelWidth+8>b.x))||g;
      boxes.push(pos);
      el.hidden=false;el.style.left=pos.x+'px';el.style.top=pos.y+'px';el.style.zIndex=String(layer--);
      if(!el.portLeader){el.portLeader=document.createElement('span');el.portLeader.className='port-leader';$('#port-labels').append(el.portLeader)}
      const dx=pos.x-g.px,dy=pos.y-g.py;
      Object.assign(el.portLeader.style,{left:g.px+'px',top:g.py+'px',width:Math.hypot(dx,dy)+'px',transform:'rotate('+Math.atan2(dy,dx)+'rad)'});el.portLeader.hidden=Math.hypot(dx,dy)<12;
    }
    for(const m of markerElements){if(m.el.hidden&&m.el.portLeader)m.el.portLeader.hidden=true}
    for(const [key,el] of clusterLabels){if(!activeKeys.has(key)){el.portLeader?.remove();el.remove();clusterLabels.delete(key)}}
  }
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function frame(){if(!document.hidden&&host.clientWidth&&host.clientHeight){world.quaternion.slerp(targetQ,reduced?1:.09);renderer.render(scene,camera);drawLabels()}requestAnimationFrame(frame)}frame();$('#globe-loading').remove();
  return{
    recenter(){setFocus(46,12);setZoom(1.4)},
    focusPort(p){if(Number.isFinite(p.lat)&&Number.isFinite(p.lon))setFocus(p.lat,p.lon)},
    focusRegion(region){const centers={all:[46,12],west:[40,7],greek:[39,22],north:[59,13]};setFocus(...centers[region]);setZoom(region==='all'?1.4:2.1)},
    focusCruise(c){const ps=[...new Set(c.ports)].map(id=>portById.get(id)).filter(p=>Number.isFinite(p?.lat)&&Number.isFinite(p?.lon));if(!ps.length)return;setFocus(ps.reduce((a,p)=>a+p.lat,0)/ps.length,ps.reduce((a,p)=>a+p.lon,0)/ps.length);setZoom(2.2)},
    update(list,c,counts){for(const p of ports){if(markerElements.some(m=>m.p.id===p.id)||!Number.isFinite(p.lat)||!Number.isFinite(p.lon))continue;const el=document.createElement("button");el.className="port-marker";el.setAttribute("aria-label","Filtrer les croisières passant par "+p.name);el.innerHTML=`<span class="marker-dot"></span><span class="marker-text">${p.short||p.name} <span class="globe-rating">${portRating(p,{compact:true})}</span></span><span class="port-count"></span>`;el.addEventListener("click",()=>selectPort(p.id));$("#port-labels").append(el);markerElements.push({el,p,position:vector(p.lat,p.lon,2.026)});}for(const child of [...routes.children]){routes.remove(child);child.geometry.dispose();child.material.dispose()}
      let missingRoutes=0;
      if(c)for(let i=1;i<c.ports.length;i++){
        const from=portById.get(c.ports[i-1]),to=portById.get(c.ports[i]);
        if(!Number.isFinite(from?.lat)||!Number.isFinite(to?.lat)){missingRoutes++;continue}
        if(from.id===to.id)continue;
        const path=seaRoute(from,to);if(!path){missingRoutes++;continue}
        const points=path.map(p=>vector(p.lat,p.lon,2.04));
        routes.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points,false,'centripetal'),Math.min(800,Math.max(24,points.length*2)),.006,4,false),new THREE.MeshBasicMaterial({color:0xffb481})));
        const count=Math.min(3,Math.max(1,Math.floor(points.length/150)));
        for(let j=1;j<=count;j++){
          const at=Math.max(1,Math.min(points.length-2,Math.round(points.length*j/(count+1))));
          const direction=points[at+1].clone().sub(points[at-1]).normalize();
          if(!direction.lengthSq())continue;
          const arrow=new THREE.Mesh(new THREE.ConeGeometry(.008,.028,6),new THREE.MeshBasicMaterial({color:0xffb481}));
          arrow.position.copy(points[at]);arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction);routes.add(arrow);
        }
      }
      const routeNote=$('#map-selection .route-key');if(routeNote&&c)routeNote.textContent='→ Sens du voyage · tracé maritime indicatif'+(missingRoutes?' · certains segments indisponibles':'');

      for(const m of markerElements){m.el.classList.toggle('on-route',!!c?.ports.includes(m.p.id));m.el.classList.toggle('chosen',state.ports.includes(m.p.id));m.el.classList.toggle('dim',!counts.get(m.p.id));m.el.querySelector('.port-count').textContent=counts.get(m.p.id);m.el.title=`${m.p.name} · ${counts.get(m.p.id)} départ(s) disponible(s)`;m.el.setAttribute('aria-pressed',String(state.ports.includes(m.p.id)))}
    }
  }
}
try{globe=await createGlobe();render()}catch(error){console.error(error);$('#globe-loading')?.remove();$('#globe').insertAdjacentHTML('beforeend','<div class="map-fallback"><h3>Le globe est indisponible.</h3><p>Utilisez la liste des ports pour explorer les croisières.<br>Le globe nécessite un navigateur avec WebGL.</p></div>');$('#ports-toggle').click()}
const modelContext=document.modelContext;
if(modelContext?.registerTool){const lifecycle=new AbortController();try{Promise.resolve(modelContext.registerTool({name:'filter_cruises',description:'Configure les filtres visibles de croisières et retourne les offres réelles chargées correspondantes.',inputSchema:{type:'object',properties:{duration:{type:'string',enum:Object.keys(durations)},budget:{type:'number',minimum:400,maximum:5000},port:{type:['string','null'],enum:[null,...ports.map(p=>p.id)]},ports:{type:'array',uniqueItems:true,items:{type:'string',enum:ports.map(p=>p.id)}},region:{type:'string',enum:Object.keys(regions)}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input){if(!input||typeof input!=='object'||Object.keys(input).some(k=>!['budget','port','ports','region','duration'].includes(k)))throw Error('Filtres invalides');if('budget'in input&&(typeof input.budget!=='number'||!Number.isFinite(input.budget)||input.budget<400||input.budget>5000))throw Error('Budget invalide');if('port'in input&&input.port!==null&&!portById.has(input.port))throw Error('Port inconnu');if('ports'in input&&(!Array.isArray(input.ports)||input.ports.some(id=>!portById.has(id))))throw Error('Ports inconnus');if('port'in input&&'ports'in input)throw Error('Utilisez ports ou port');if('region'in input&&!Object.hasOwn(regions,input.region))throw Error('Région inconnue');if('duration'in input&&!Object.hasOwn(durations,input.duration))throw Error('Durée invalide');const {port,...filters}=input;Object.assign(state,filters);if('port'in input)state.ports=port?[port]:[];if('ports'in input)state.ports=[...new Set(input.ports)];$('#budget').value=state.budget;$('#duration').value=state.duration;render();return{synthetic:false,count:eligible().length,cruises:eligible().map(c=>({id:c.id,title:c.title,price:c.price,currency:c.currency}))}}},{signal:lifecycle.signal})).catch(console.error);window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true})}catch(e){console.warn(e)}}
