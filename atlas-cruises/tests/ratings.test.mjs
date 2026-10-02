import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeRating,loadRating} from '../dist/ratings.js';

test('Only actual traveler summaries with reviews produce ratings',()=>{
  assert.equal(normalizeRating({note:5}),null);
  assert.equal(normalizeRating({noteFloat:4.5,totalReviews:0}),null);
  assert.equal(normalizeRating({noteFloat:6,totalReviews:20}),null);
  assert.equal(normalizeRating({noteFloat:4.5,totalReviews:2.5}),null);
  assert.equal(normalizeRating({noteFloat:4.47,totalReviews:375}).score,4.47);
});
test('Exact ship lookup, deduplication, empty port and errors',async()=>{
  const original=globalThis.fetch;let calls=[];
  globalThis.fetch=async url=>{calls.push(url);const u=new URL(url);return {ok:true,text:async()=>u.pathname.endsWith('autocomplete')?JSON.stringify([{id:1161,label:'Norwegian Epic',type:'boat'}]):u.searchParams.get('type')==='port'?'':JSON.stringify({noteFloat:4.47,totalReviews:375})}};
  try{
    const first=loadRating('boat','Norwegian Epic');
    assert.equal(loadRating('boat','Norwegian Epic'),first);
    const result=await first;assert.equal(result.count,375);assert.match(result.sourceUrl,/entityId=1161/);assert.equal(calls.length,2);
    assert.equal(await loadRating('boat','Norwegian'),null);
    assert.equal(await loadRating('port','Barcelone',455),null);
    globalThis.fetch=async()=>{throw Error('Network unavailable')};
    assert.equal(await loadRating('boat','Unavailable ship',8),null);
  }finally{globalThis.fetch=original}
});
