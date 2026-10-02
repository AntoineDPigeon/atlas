// Approximate harbour positions for discovery, not maritime navigation.
export const northAfricanPorts = [
  {id:'AGA',name:'Agadir',country:'Maroc',lat:30.42,lon:-9.6},
  {id:'CAS',name:'Casablanca',country:'Maroc',lat:33.61,lon:-7.62},
  {id:'TNG',name:'Tanger',country:'Maroc',lat:35.79,lon:-5.81},
  {id:'LGN',name:'La Goulette · Tunis',short:'La Goulette',country:'Tunisie',lat:36.82,lon:10.31},
  {id:'ALG',name:'Alger',country:'Algérie',lat:36.78,lon:3.06},
  {id:'ORN',name:'Oran',country:'Algérie',lat:35.71,lon:-.65},
  {id:'ALY',name:'Alexandrie',aliases:['Alexandria'],country:'Égypte',lat:31.2,lon:29.88},
  {id:'PSD',name:'Port-Saïd',country:'Égypte',lat:31.26,lon:32.3},
];
const names = {AGA:/\bagadir\b/,CAS:/\bcasablanca\b/,TNG:/\btang(?:er|ier|iers)\b/,LGN:/\b(?:la goulette|tunis)\b/,ALG:/\b(?:alger|algiers)\b/,ORN:/\boran\b/,ALY:/\b(?:alexandria|alexandrie)\b/,PSD:/\bport[\s-]*said\b/};
export function findNorthAfricanPort(name) {
  const normalized=String(name??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return northAfricanPorts.find(port=>names[port.id].test(normalized));
}
