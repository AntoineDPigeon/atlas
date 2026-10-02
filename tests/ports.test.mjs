import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cruises,filterCruises} from '../dist/data.js';

test('les départs doivent contenir chaque port sélectionné, avec les autres filtres',()=>{
 const saved=cruises.slice();
 const base={date:'2027-09-05',nights:7,price:1200,currency:'CAD',company:'MSC Cruises',region:'west'};
 const state={start:'2027-09-01',end:'2027-09-30',budget:3000,company:'all',region:'all',duration:'all',sort:'price',ports:[]};
 try{
  cruises.splice(0,cruises.length,
   {...base,id:'both',ports:['barcelona','marseille','rome']},
   {...base,id:'barcelona',ports:['barcelona','rome']},
   {...base,id:'marseille',ports:['marseille','rome']},
   {...base,id:'usd',currency:'USD',ports:['barcelona','marseille']});
  const ids=s=>filterCruises(s).map(c=>c.id);
  assert.equal(ids(state).length,3);
  assert.deepEqual(ids({...state,ports:['barcelona','marseille']}),['both']);
  assert.deepEqual(ids({...state,ports:['marseille','barcelona']}),['both']);
  assert.equal(ids({...state,ports:['barcelona']}).length,2);
  assert.deepEqual(ids({...state,ports:['barcelona','bergen']}),[]);
  assert.deepEqual(ids({...state,ports:['barcelona','marseille'],budget:1000}),[]);
  assert.deepEqual(ids({...state,ports:['barcelona','marseille'],duration:'short'}),[]);
  assert.deepEqual(ids({...state,ports:['barcelona','marseille'],region:'north'}),[]);
  assert.deepEqual(ids({...state,ports:['barcelona','marseille'],company:'Celebrity Cruises'}),[]);
  assert.deepEqual(ids({...state,ports:['barcelona','marseille'],start:'2027-09-10'}),[]);
  assert.equal(ids({...state,ports:undefined,port:'barcelona'}).length,2);
 }finally{cruises.splice(0,cruises.length,...saved)}
});
