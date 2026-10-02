import {test} from 'node:test';
import assert from 'node:assert/strict';
import {routeOnSea} from '../dist/sea-routes.js';
test('A route bends around land and keeps every interior cell in water',()=>{const w=30,h=20,land=new Uint8Array(w*h);for(let y=4;y<16;y++)for(let x=12;x<18;x++)land[y*w+x]=1;const path=routeOnSea(land,w,h,{x:5,y:10},{x:25,y:10});assert.ok(path);assert.ok(path.some(p=>p.y<4||p.y>=16));assert.ok(path.every(p=>!land[p.y*w+p.x]));assert.deepEqual(path[0],{x:5,y:10});assert.deepEqual(path.at(-1),{x:25,y:10})});
test('An unavailable route stays unavailable rather than crossing land',()=>{const w=40,h=40,land=new Uint8Array(w*h).fill(1);assert.equal(routeOnSea(land,w,h,{x:10,y:10},{x:30,y:30}),null)});
