const prefix='atlas.google-place-id.v1:';
const maxAge=365*24*60*60*1000;
function storage(){try{return window.localStorage}catch{return null}}
function key(port){return prefix+[port.id,port.lat,port.lon].join(':')}
export function savedPlaceId(port, store=storage(), now=Date.now()){
  try{
    const saved=JSON.parse(store?.getItem(key(port))||'null');
    if(!saved||!Number.isFinite(saved.savedAt)||saved.savedAt>now||now-saved.savedAt>=maxAge||!validPlaceId(saved.placeId)){store?.removeItem(key(port));return null}
    return saved.placeId;
  }catch{return null}
}
export function validPlaceId(id){return typeof id==='string'&&/^[a-zA-Z0-9_-]{1,200}$/.test(id)}
export function rememberPlaceId(port,id,store=storage(),now=Date.now()){
  if(!validPlaceId(id))return;
  try{store?.setItem(key(port),JSON.stringify({placeId:id,savedAt:now}))}catch{}
}
export function forgetPlaceId(port,store=storage()){try{store?.removeItem(key(port))}catch{}}
