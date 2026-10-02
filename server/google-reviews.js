import {findReviewPort} from './ports.js';

const api = 'https://places.googleapis.com/v1/';
const detailsFields = 'id,displayName,formattedAddress,location,types,primaryType,googleMapsUri,rating,userRatingCount,attributions';
const requests = new Map();
const json = (body, status = 200) => Response.json(body, {status, headers: {'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff'}});
const text = (value, max = 8000) => typeof value === 'string' ? value.slice(0, max) : '';
const https = value => {
  try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; }
};

export function normalizeGooglePlace(place) {
  const score = Number.isFinite(place?.rating) && place.rating > 0 && place.rating <= 5 ? place.rating : null;
  const count = Number.isSafeInteger(place?.userRatingCount) && place.userRatingCount > 0 ? place.userRatingCount : 0;
  return {
    placeId: typeof place?.id==='string'&&/^[a-zA-Z0-9_-]{1,200}$/.test(place.id)?place.id:null,
    name: text(place?.displayName?.text, 250), address: text(place?.formattedAddress, 500),
    score: count ? score : null, count, source: 'Google Maps', sourceUrl: https(place?.googleMapsUri),
    attributions: (Array.isArray(place?.attributions) ? place.attributions : []).map(a => ({name: text(a.provider, 120), url: https(a.providerUri)})),
  };
}

export function matchesPort(place, port) {
  const location = place?.location;
  if (!Number.isFinite(location?.latitude) || !Number.isFinite(location?.longitude)) return false;
  const dy = (location.latitude - port.lat) * 111;
  const dx = (location.longitude - port.lon) * 111 * Math.cos(port.lat * Math.PI / 180);
  // Never attribute a distant place, city or restaurant's score to a cruise port.
  const excluded = new Set(['restaurant', 'cafe', 'bar', 'hotel', 'lodging', 'locality', 'administrative_area_level_1', 'administrative_area_level_2']);
  if ([place.primaryType, ...(Array.isArray(place.types) ? place.types : [])].some(type => excluded.has(type))) return false;
  return Math.hypot(dx, dy) <= 25 && /\b(?:ports?|porto|harbou?r|terminal|pier|cruise|quai|molo|liman|havn|hafen|marina)\b/i.test(place.displayName?.text || '');
}

async function google(path, key, fields, fetcher, body) {
  const response = await fetcher(api + path, {
    method: body ? 'POST' : 'GET',
    headers: {'X-Goog-Api-Key': key, 'X-Goog-FieldMask': fields, ...(body ? {'Content-Type': 'application/json'} : {})},
    ...(body ? {body: JSON.stringify(body)} : {}), signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    const error = new Error('Google unavailable'); error.status = response.status; throw error;
  }
  return response.json();
}

export async function handleGoogleReviews(request, env, fetcher = fetch) {
  if (request.method !== 'POST') return json({error: 'Méthode non autorisée.'}, 405);
  const origin = request.headers.get('Origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site') return json({error: 'Accès non autorisé.'}, 403);
  if (!env.GOOGLE_PLACES_API_KEY) return json({error: 'Les notes Google ne sont pas encore activées sur ce site.'}, 503);
  let input;
  try {
    if (Number(request.headers.get('Content-Length')) > 1024) return json({error: 'Requête trop grande.'}, 413);
    const body = await request.text(); if (body.length > 1024) return json({error: 'Requête trop grande.'}, 413);
    input = JSON.parse(body);
  } catch { return json({error: 'Escale invalide.'}, 400); }
  const port = findReviewPort(input);
  if (!port) return json({error: 'Cette escale n’a pas encore de correspondance Google vérifiée.'}, 404);
  if(input.placeId!==undefined&&(typeof input.placeId!=='string'||!/^[a-zA-Z0-9_-]{1,200}$/.test(input.placeId)))return json({error:'Identifiant Google invalide.'},400);
  // A bounded, per-isolate throttle. Google Cloud quotas remain the billing control.
  const key = request.headers.get('CF-Connecting-IP') || 'local';
  const now = Date.now(); const recent = (requests.get(key) || []).filter(t => now - t < 60000);
  if (recent.length >= 10) return json({error: 'Trop de demandes. Réessayez dans une minute.'}, 429);
  if (requests.size >= 1000) requests.clear();
  requests.set(key, [...recent, now]);
  try {
    let id = input.placeId;
    if (!id) {
      // IDs-only search avoids retrieving billable place content during discovery.
      const search = await google('places:searchText', env.GOOGLE_PLACES_API_KEY, 'places.id', fetcher, {
        textQuery: port.name + ' cruise port', languageCode: 'fr', pageSize: 1,
        locationBias: {circle: {center: {latitude: port.lat, longitude: port.lon}, radius: 15000}},
      });
      id = search.places?.[0]?.id;
    }
    if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,200}$/.test(id)) return json({error: 'Aucun terminal de croisière trouvé sur Google Maps.'}, 404);
    const place = await google('places/' + id + '?languageCode=fr', env.GOOGLE_PLACES_API_KEY, detailsFields, fetcher);
    if (!matchesPort(place, port)) return json({error: 'Aucune fiche de terminal correspondante n’a été trouvée.'}, 404);
    return json(normalizeGooglePlace(place));
  } catch (error) {
    if(error.status===404)return json({error:'Cette fiche Google n’est plus disponible. Fermez puis rouvrez pour rechercher le port.'},404);
    return json({error: error.status === 429 ? 'Le quota Google est atteint. Réessayez plus tard.' : 'Les notes Google sont temporairement indisponibles.'}, error.status === 429 ? 429 : 502);
  }
}
