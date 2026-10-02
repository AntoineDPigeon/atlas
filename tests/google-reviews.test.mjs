import {test} from 'node:test';
import assert from 'node:assert/strict';
import {handleGoogleReviews, normalizeGooglePlace, matchesPort} from '../server/google-reviews.js';
import {findReviewPort} from '../server/ports.js';
import {googleReviewMarkup, renderGoogleReviews, hydrateGoogleReviews} from '../dist/google-reviews.js';
import worker from '../worker.js';
import {rememberPlaceId,savedPlaceId,forgetPlaceId} from '../dist/google-place-ids.js';

const request = (body = {id: 'barcelona'}, options = {}) => new Request('https://atlas.example/api/google-reviews', {
  method: 'POST', headers: {'Content-Type': 'application/json', 'CF-Connecting-IP': options.ip || 'test-default', ...options.headers},
  body: JSON.stringify(body),
});
const place = {
  id: 'test-terminal', displayName: {text: 'Barcelona Cruise Terminal'}, formattedAddress: 'Barcelona, Spain',
  location: {latitude: 41.35, longitude: 2.17}, rating: 4.4, userRatingCount: 123,
  googleMapsUri: 'https://maps.google.com/place', reviews: [{rating: 5, text: {text: '<img onerror=alert(1)> Super escale'},
    authorAttribution: {displayName: 'Alice <test>', uri: 'https://maps.google.com/author', photoUri: 'https://example.com/avatar.png'},
    googleMapsUri: 'https://maps.google.com/review', relativePublishTimeDescription: 'il y a un mois'}],
};

test('Only known harbours produce canonical queries, including provider-specific port IDs', () => {
  assert.equal(findReviewPort({id: 'barcelona', name: 'malicious arbitrary search'}).name, 'Barcelone');
  assert.equal(findReviewPort({id: 'costa-123', lat: 40.92, lon: 9.5}).name, 'olbia');
  assert.equal(findReviewPort({id: 'KUS'}).name, 'Kusadasi');
  assert.equal(findReviewPort({id: 'unknown', lat: 0, lon: 0}), null);
  assert.equal(matchesPort({...place, location: {latitude: 1, longitude: 1}}, findReviewPort({id: 'barcelona'})), false);
  assert.equal(matchesPort({...place, displayName: {text: 'Restaurant Barcelona'}}, findReviewPort({id: 'barcelona'})), false);
  assert.equal(matchesPort({...place, displayName: {text: 'Restaurant du Port'}, types: ['restaurant']}, findReviewPort({id: 'barcelona'})), false);
  assert.equal(matchesPort({...place, displayName: {text: 'Barcelona Airport'}}, findReviewPort({id: 'barcelona'})), false);
});

test('Missing configuration, cross-site requests and unknown ports make no paid request', async () => {
  const fetcher = () => { throw Error('Unexpected network call'); };
  assert.equal((await handleGoogleReviews(request(), {}, fetcher)).status, 503);
  assert.equal((await handleGoogleReviews(request({}, {headers: {Origin: 'https://other.example'}}), {GOOGLE_PLACES_API_KEY: 'fixture'}, fetcher)).status, 403);
  assert.equal((await handleGoogleReviews(request({id: 'unknown'}), {GOOGLE_PLACES_API_KEY: 'fixture'}, fetcher)).status, 404);
  assert.equal((await handleGoogleReviews(new Request('https://atlas.example/api/google-reviews'), {}, fetcher)).status, 405);
});

test('Server requests and returns only the port score, never written reviews', async () => {
  const calls = [];
  const fetcher = async (url, options) => { calls.push({url, options}); return Response.json(calls.length === 1 ? {places: [{id: place.id}]} : place); };
  const result = await handleGoogleReviews(request({id: 'barcelona'}, {ip: 'success'}), {GOOGLE_PLACES_API_KEY: 'fixture-secret'}, fetcher);
  assert.equal(result.status, 200); assert.equal(result.headers.get('Cache-Control'), 'no-store');
  const body = await result.text(); assert.doesNotMatch(body, /fixture-secret/);
  assert.equal(calls.length, 2);
  assert.equal(calls[0].options.headers['X-Goog-FieldMask'], 'places.id');
  assert.equal(JSON.parse(calls[0].options.body).textQuery, 'Barcelone cruise port');
  assert.equal(calls[1].options.headers['X-Goog-Api-Key'], 'fixture-secret');
  assert.match(calls[1].options.headers['X-Goog-FieldMask'], /rating/);
  assert.doesNotMatch(calls[1].options.headers['X-Goog-FieldMask'], /reviews/);
  assert.equal(JSON.parse(body).score, 4.4);
  assert.equal(Object.hasOwn(JSON.parse(body), 'reviews'), false);
  assert.doesNotMatch(body, /Alice|Super escale|avatar/);
  const content = renderGoogleReviews(JSON.parse(body));
  assert.match(content, /Google Maps/); assert.match(content, /4,4\/5/);
  assert.match(content, /https:\/\/maps.google.com\/place/);
  assert.doesNotMatch(renderGoogleReviews({...JSON.parse(body), reviews: place.reviews}), /Alice|Super escale|123|<article|<img/);
});

test('Google errors never leak the key and empty or unrelated places do not receive fabricated ratings', async () => {
  let calls = 0;
  const unrelated = async () => Response.json(++calls === 1 ? {places: [{id: place.id}]} : {...place, displayName: {text: 'Barcelona Restaurant'}});
  assert.equal((await handleGoogleReviews(request({id: 'barcelona'}, {ip: 'unrelated'}), {GOOGLE_PLACES_API_KEY: 'fixture'}, unrelated)).status, 404);
  const quota = await handleGoogleReviews(request({id: 'barcelona'}, {ip: 'quota'}), {GOOGLE_PLACES_API_KEY: 'fixture-secret'}, async () => new Response('fixture-secret', {status: 429}));
  assert.equal(quota.status, 429); assert.doesNotMatch(await quota.text(), /fixture-secret/);
  assert.equal(normalizeGooglePlace({...place, userRatingCount: 0}).score, null);
  const invalid = normalizeGooglePlace({...place, reviews: [{rating: 10}], googleMapsUri: 'javascript:alert(1)'});
  assert.equal(Object.hasOwn(invalid, 'reviews'), false); assert.equal(invalid.sourceUrl, '');
});

test('Worker forwards static assets and keeps API requests on the server', async () => {
  let assets = 0;
  const env = {ASSETS: {fetch: async () => { assets++; return new Response('static'); }}};
  assert.equal(await (await worker.fetch(new Request('https://atlas.example/'), env)).text(), 'static');
  assert.equal((await worker.fetch(request(), env)).status, 503);
  assert.equal((await worker.fetch(new Request('https://atlas.example/api/unknown'), env)).status, 404);
  assert.equal(assets, 1);
  assert.match(googleReviewMarkup({id: 'barcelona', lat: 41.35, lon: 2.17}), /<details/);
  assert.match(googleReviewMarkup({id: 'barcelona', lat: 41.35, lon: 2.17}), /Note Google/);
  assert.equal(googleReviewMarkup({id: 'unlocated'}), '');
});

test('Review disclosure makes no automatic requests, deduplicates opens and permits retries', async () => {
  const original = globalThis.fetch;
  const content = {}; let toggle, calls = 0, resolve;
  const el = {dataset: {googlePort: 'barcelona', lat: '41.35', lon: '2.17'}, open: false, isConnected: true,
    querySelector: () => content, addEventListener: (_, listener) => { toggle = listener; }};
  hydrateGoogleReviews({querySelectorAll: () => [el]});
  try {
    globalThis.fetch = async (url, options) => {
      calls++; assert.equal(url, '/api/google-reviews');
      assert.deepEqual(JSON.parse(options.body), {id: 'barcelona', lat: 41.35, lon: 2.17});
      return new Promise(r => { resolve = r; });
    };
    await toggle(); assert.equal(calls, 0);
    el.open = true; const pending = toggle(); await toggle(); assert.equal(calls, 1);
    resolve(Response.json({error: 'Quota atteint'}, {status: 429})); await pending;
    assert.equal(content.textContent, 'Quota atteint'); assert.equal(el.dataset.googleLoading, 'false');
    globalThis.fetch = async () => { calls++; return Response.json(normalizeGooglePlace(place)); };
    await toggle(); assert.equal(calls, 2); assert.match(content.innerHTML, /Google Maps/);
    await toggle(); assert.equal(calls, 2);
  } finally { globalThis.fetch = original; }
});

test('Repeated paid lookups are throttled before contacting Google', async () => {
  let calls = 0;
  const fetcher = async () => { calls++; return Response.json({places: []}); };
  for (let i = 0; i < 10; i++) assert.equal((await handleGoogleReviews(request({id: 'barcelona'}, {ip: 'throttle'}), {GOOGLE_PLACES_API_KEY: 'fixture'}, fetcher)).status, 404);
  assert.equal((await handleGoogleReviews(request({id: 'barcelona'}, {ip: 'throttle'}), {GOOGLE_PLACES_API_KEY: 'fixture'}, fetcher)).status, 429);
  assert.equal(calls, 10);
});

test('Remembered Google IDs skip discovery but still verify the terminal and fetch a fresh score',async()=>{
  const calls=[];
  const fetcher=async(url)=>{calls.push(url);return Response.json(place)};
  const response=await handleGoogleReviews(request({id:'barcelona',placeId:place.id},{ip:'remembered'}),{GOOGLE_PLACES_API_KEY:'fixture'},fetcher);
  assert.equal(response.status,200);assert.equal(calls.length,1);assert.match(calls[0],/places\/test-terminal/);
  assert.equal((await response.json()).placeId,place.id);
  const unrelated=await handleGoogleReviews(request({id:'barcelona',placeId:place.id},{ip:'remembered-wrong'}),{GOOGLE_PLACES_API_KEY:'fixture'},async()=>Response.json({...place,location:{latitude:0,longitude:0}}));
  assert.equal(unrelated.status,404);
  assert.equal((await handleGoogleReviews(request({id:'barcelona',placeId:'../secret'}),{GOOGLE_PLACES_API_KEY:'fixture'},()=>{throw Error('Unexpected lookup')})).status,400);
});

test('Browser persistence stores only the place ID and expiry, never ratings or reviews',()=>{
  const values=new Map(),store={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
  const port={id:'barcelona',lat:41.35,lon:2.17};
  rememberPlaceId(port,place.id,store,1000);
  assert.deepEqual(JSON.parse([...values.values()][0]),{placeId:place.id,savedAt:1000});
  assert.equal(savedPlaceId(port,store,2000),place.id);
  assert.equal(savedPlaceId({...port,id:'other'},store,2000),null);
  assert.equal(savedPlaceId({...port,lat:0},store,2000),null);
  assert.equal(savedPlaceId(port,store,1000+366*86400000),null);
  rememberPlaceId(port,place.id,store);forgetPlaceId(port,store);assert.equal(values.size,0);
  const blocked={setItem:()=>{throw Error('Storage disabled')},getItem:()=>{throw Error('Storage disabled')}};
  assert.doesNotThrow(()=>rememberPlaceId(port,place.id,blocked));assert.equal(savedPlaceId(port,blocked),null);
});
