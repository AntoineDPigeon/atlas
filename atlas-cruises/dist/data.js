const base='https://www.ncl.com/content/dam/ncl/us/en/';
export const photos={
  greek:{url:base+'destinations-ports/europe/greece/agnostic/NCL-Greek-Isles-Cruise-Santorini.jpg',label:'Santorini, Grèce',source:'https://www.ncl.com/cruise-destinations/greek-isles-cruises'},
  mykonos:{url:base+'destinations-ports/europe/greece/agnostic/NCL-Greek_Cruise-Mikonos-new.jpg',label:'Mykonos, Grèce',source:'https://www.ncl.com/cruise-destinations/greek-isles-cruises'},
  west:{url:base+'destinations-ports/europe/italy/agnostic/NCL-Liguria-Italy-Cruise-Colorful-Houses-Blog.jpg',label:'La Ligurie, Italie',source:'https://www.ncl.com/cruise-destinations/mediterranean-cruises'},
  barcelona:{url:base+'lifestyle/homepage/NCL-Cruise-Europe-Barcelona-Sagrada-Familia.jpg',label:'Barcelone, Espagne',source:'https://www.ncl.com/cruise-destinations/mediterranean-cruises'},
  north:{url:base+'destinations-ports/europe/agnostic/NCL-Northern-Europe-Cruise-Norwegian-Fjords-SUB.jpg',label:'Les fjords, Norvège',source:'https://www.ncl.com/cruise-destinations/northern-europe-cruises'},
  baltic:{url:base+'lifestyle/homepage/NCL-Cruise-Tallinn-Estonia.jpg',label:'Tallinn, Estonie',source:'https://www.ncl.com/cruise-destinations/northern-europe-cruises'}
};
export const ports=[
  {id:'barcelona',name:'Barcelone',country:'Espagne',lat:41.35,lon:2.17},
  {id:'marseille',name:'Marseille',country:'France',lat:43.3,lon:5.35},
  {id:'genoa',name:'Gênes',country:'Italie',lat:44.4,lon:8.93},
  {id:'rome',name:'Civitavecchia · Rome',short:'Rome',country:'Italie',lat:42.09,lon:11.79},
  {id:'naples',name:'Naples',country:'Italie',lat:40.84,lon:14.27},
  {id:'palma',name:'Palma de Majorque',short:'Palma',country:'Espagne',lat:39.56,lon:2.63},
  {id:'valletta',name:'La Valette',country:'Malte',lat:35.9,lon:14.51},
  {id:'athens',name:'Le Pirée · Athènes',short:'Athènes',country:'Grèce',lat:37.94,lon:23.64},
  {id:'santorini',name:'Santorini',country:'Grèce',lat:36.4,lon:25.43},
  {id:'mykonos',name:'Mykonos',country:'Grèce',lat:37.45,lon:25.33},
  {id:'dubrovnik',name:'Dubrovnik',country:'Croatie',lat:42.66,lon:18.09},
  {id:'kotor',name:'Kotor',country:'Monténégro',lat:42.42,lon:18.77},
  {id:'venice',name:'Venise · Marghera',short:'Venise',country:'Italie',lat:45.46,lon:12.25},
  {id:'bergen',name:'Bergen',country:'Norvège',lat:60.39,lon:5.32},
  {id:'geiranger',name:'Geiranger',country:'Norvège',lat:62.1,lon:7.21},
  {id:'alesund',name:'Ålesund',country:'Norvège',lat:62.47,lon:6.15},
  {id:'copenhagen',name:'Copenhague',country:'Danemark',lat:55.7,lon:12.6},
  {id:'stockholm',name:'Stockholm',country:'Suède',lat:59.33,lon:18.08},
  {id:'helsinki',name:'Helsinki',country:'Finlande',lat:60.16,lon:24.96},
  {id:'tallinn',name:'Tallinn',country:'Estonie',lat:59.44,lon:24.75},
  {id:'southampton',name:'Southampton',country:'Royaume-Uni',lat:50.9,lon:-1.4},
  {id:'lisbon',name:'Lisbonne',country:'Portugal',lat:38.72,lon:-9.14},
  {id:'cadiz',name:'Cadix',country:'Espagne',lat:36.53,lon:-6.29}
];
export const companies={
  'MSC Cruises':'https://www.msccruises.com/',
  'Costa Croisières':'https://www.costacroisieres.fr/',
  'Norwegian Cruise Line':'https://www.ncl.com/',
  'Royal Caribbean':'https://www.royalcaribbean.com/',
  'Celebrity Cruises':'https://www.celebritycruises.com/',
  'Hurtigruten':'https://www.hurtigruten.com/'
};
export const regions={all:'Toute l’Europe',west:'Méditerranée',greek:'Îles grecques',north:'Europe du Nord'};
// Populated from the public Canadian Norwegian catalog; no synthetic fallback.
export const cruises=[];
export function returnDate(c){const d=new Date(c.date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+c.nights);return d.toISOString().slice(0,10)}
export const durations={all:[1,Infinity],short:[1,5],week:[6,8],long:[9,12],extended:[13,Infinity]};
export function filterCruises(state){const requiredPorts=state.ports??(state.port?[state.port]:[]);const bounds=durations[state.duration??'all'];if(!bounds)return [];return cruises.filter(c=>c.currency==='CAD'&&c.nights>=bounds[0]&&c.nights<=bounds[1]&&(!state.start||c.date>=state.start)&&(!state.end||returnDate(c)<=state.end)&&c.price<=state.budget&&(state.company==='all'||c.company===state.company)&&(state.region==='all'||c.region===state.region)&&requiredPorts.every(id=>c.ports.includes(id))).sort((a,b)=>state.sort==='price'?a.price-b.price:state.sort==='date'?a.date.localeCompare(b.date):0)}
